import { createSign } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { appendFileSync } from 'node:fs';

const appBundleId = 'com.splitbeat.twohandrhythm';
const courseProductId = 'com.splitbeat.learncourse.unlock';
const leaderboardId = 'com.splitbeat.twohandrhythm.longest_correct_streak';
const apiBaseUrl = 'https://api.appstoreconnect.apple.com';
const summaryLines = ['## App Store Connect setup audit', ''];

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function createAppStoreConnectToken({ keyId, issuerId, privateKey }) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: issuerId,
    iat: issuedAt,
    exp: issuedAt + 10 * 60,
    aud: 'appstoreconnect-v1',
  }));
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign('SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign({
    key: privateKey.replace(/\\n/g, '\n'),
    dsaEncoding: 'ieee-p1363',
  });
  return `${unsignedToken}.${signature.toString('base64url')}`;
}

async function fetchAppStoreConnectResource(path, token) {
  const response = await fetch(new URL(path, apiBaseUrl), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Apple API returned HTTP ${response.status} for ${path.split('?')[0]}`);
  }
  return response.json();
}

function appendAuditResult(label, status, detail = '') {
  const line = `- **${label}: ${status}**${detail ? ` — ${detail}` : ''}`;
  summaryLines.push(line);
  console.log(line.replaceAll('**', ''));
}

function includedOfType(resource, type) {
  return (resource.included ?? []).filter((item) => item.type === type);
}

async function listLeaderboards(gameCenterDetailId, token, versioned) {
  const collection = versioned ? 'gameCenterLeaderboardsV2' : 'gameCenterLeaderboards';
  try {
    const response = await fetchAppStoreConnectResource(
      `/v1/gameCenterDetails/${encodeURIComponent(gameCenterDetailId)}/${collection}?limit=200`,
      token,
    );
    return response.data ?? [];
  } catch (error) {
    if (String(error).includes('HTTP 404')) return [];
    throw error;
  }
}

function writeSummary() {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) appendFileSync(summaryPath, `${summaryLines.join('\n')}\n`);
}

async function auditAppStoreConnect() {
  const keyId = process.env.ASC_API_KEY_ID;
  const issuerId = process.env.ASC_API_ISSUER_ID;
  const privateKey = process.env.ASC_API_KEY_P8;
  if (!keyId || !issuerId || !privateKey) {
    appendAuditResult('Apple API credentials', 'NOT CONFIGURED');
    return;
  }

  const token = createAppStoreConnectToken({ keyId, issuerId, privateKey });
  const appsResponse = await fetchAppStoreConnectResource(
    `/v1/apps?filter[bundleId]=${encodeURIComponent(appBundleId)}&limit=200`,
    token,
  );
  const app = (appsResponse.data ?? []).find((candidate) => candidate.attributes?.bundleId === appBundleId);
  if (!app) {
    appendAuditResult('App record', 'NOT FOUND', appBundleId);
    return;
  }
  appendAuditResult('App record', 'FOUND', `${app.attributes.name} · ${appBundleId}`);

  const purchasesResponse = await fetchAppStoreConnectResource(
    `/v1/apps/${encodeURIComponent(app.id)}/inAppPurchasesV2?limit=200`,
    token,
  );
  const coursePurchase = (purchasesResponse.data ?? []).find(
    (purchase) => purchase.attributes?.productId === courseProductId,
  );
  if (!coursePurchase) {
    appendAuditResult('Full-course purchase', 'NOT FOUND', courseProductId);
  } else {
    let purchaseDetail = coursePurchase;
    let purchaseIncluded = [];
    let purchaseDetailsLoaded = false;
    try {
      const purchaseResponse = await fetchAppStoreConnectResource(
        `/v2/inAppPurchases/${encodeURIComponent(coursePurchase.id)}?include=inAppPurchaseLocalizations,appStoreReviewScreenshot,iapPriceSchedule,inAppPurchaseAvailability`,
        token,
      );
      purchaseDetail = purchaseResponse.data;
      purchaseIncluded = purchaseResponse.included ?? [];
      purchaseDetailsLoaded = true;
    } catch {
      // The list record is still useful when Apple omits an optional relationship.
    }
    const state = purchaseDetail.attributes?.state ?? coursePurchase.attributes?.state ?? 'unknown state';
    const type = purchaseDetail.attributes?.inAppPurchaseType ?? coursePurchase.attributes?.inAppPurchaseType ?? 'unknown type';
    const locales = includedOfType({ included: purchaseIncluded }, 'inAppPurchaseLocalizations')
      .map((localization) => localization.attributes?.locale)
      .filter(Boolean);
    const hasReviewScreenshot = Boolean(
      purchaseDetail.relationships?.appStoreReviewScreenshot?.data
      ?? includedOfType({ included: purchaseIncluded }, 'inAppPurchaseAppStoreReviewScreenshots').length,
    );
    const hasPriceSchedule = Boolean(purchaseDetail.relationships?.iapPriceSchedule?.data);
    appendAuditResult(
      'Full-course purchase',
      type === 'NON_CONSUMABLE' ? 'FOUND' : 'CHECK TYPE',
      `${courseProductId} · ${type} · ${state}`,
    );
    appendAuditResult(
      'Purchase localization',
      purchaseDetailsLoaded ? (locales.length ? 'FOUND' : 'MISSING') : 'NOT VERIFIED',
      locales.length ? locales.join(', ') : '',
    );
    appendAuditResult(
      'Purchase price schedule',
      purchaseDetailsLoaded ? (hasPriceSchedule ? 'FOUND' : 'MISSING') : 'NOT VERIFIED',
    );
    appendAuditResult(
      'Purchase review screenshot',
      purchaseDetailsLoaded ? (hasReviewScreenshot ? 'FOUND' : 'MISSING') : 'NOT VERIFIED',
    );
  }

  let gameCenterDetail;
  try {
    gameCenterDetail = await fetchAppStoreConnectResource(
      `/v1/apps/${encodeURIComponent(app.id)}/gameCenterDetail?include=gameCenterAppVersions`,
      token,
    );
  } catch (error) {
    appendAuditResult('Game Center app setup', 'NOT READY', String(error));
    return;
  }
  const detailId = gameCenterDetail.data?.id;
  if (!detailId) {
    appendAuditResult('Game Center app setup', 'NOT ENABLED');
    return;
  }
  const enabledVersions = includedOfType(gameCenterDetail, 'gameCenterAppVersions')
    .filter((version) => version.attributes?.enabled === true).length;
  appendAuditResult('Game Center app setup', 'FOUND', enabledVersions ? `${enabledVersions} enabled app version(s)` : 'No enabled app version returned');

  const [legacyLeaderboards, versionedLeaderboards] = await Promise.all([
    listLeaderboards(detailId, token, false),
    listLeaderboards(detailId, token, true),
  ]);
  const configuredLeaderboard = [...legacyLeaderboards, ...versionedLeaderboards]
    .find((leaderboard) => leaderboard.attributes?.vendorIdentifier === leaderboardId);
  appendAuditResult(
    'Challenge leaderboard',
    configuredLeaderboard ? 'FOUND' : 'NOT FOUND',
    configuredLeaderboard
      ? `${leaderboardId} · ${configuredLeaderboard.attributes.referenceName ?? 'configured'}`
      : leaderboardId,
  );
}

try {
  await auditAppStoreConnect();
} catch (error) {
  appendAuditResult('Apple API audit', 'INCOMPLETE', error instanceof Error ? error.message : 'Unexpected API error');
} finally {
  writeSummary();
}
