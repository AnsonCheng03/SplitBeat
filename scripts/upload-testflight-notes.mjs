import { Buffer } from 'node:buffer';
import { createSign } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { readTestFlightNotes } from './testflight-notes.mjs';

const apiBaseUrl = 'https://api.appstoreconnect.apple.com';
const appBundleId = 'com.splitbeat.twohandrhythm';
const defaultNotesPath = new URL('../store/app-store/testflight-notes.md', import.meta.url);
const defaultProcessingTimeoutMinutes = 45;
const pollIntervalMilliseconds = 30_000;

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

export function createAppStoreConnectToken({ keyId, issuerId, privateKey }) {
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

function createApiClient({ keyId, issuerId, privateKey, fetchImpl = fetch }) {
  async function request(path, { method = 'GET', body } = {}) {
    const response = await fetchImpl(new URL(path, apiBaseUrl), {
      method,
      headers: {
        Authorization: `Bearer ${createAppStoreConnectToken({ keyId, issuerId, privateKey })}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const responseBody = response.status === 204 ? undefined : await response.json().catch(() => undefined);
    if (!response.ok) {
      const apiMessage = responseBody?.errors?.map((error) => error.detail).filter(Boolean).join('; ');
      throw new Error(`App Store Connect returned HTTP ${response.status}${apiMessage ? `: ${apiMessage}` : ''}.`);
    }
    return responseBody;
  }

  return { request };
}

async function findAppId(request) {
  const query = new URLSearchParams({
    'filter[bundleId]': appBundleId,
    limit: '200',
  });
  const response = await request(`/v1/apps?${query}`);
  const app = (response.data ?? []).find((candidate) => candidate.attributes?.bundleId === appBundleId);
  if (!app) throw new Error(`App Store Connect app not found for bundle ID ${appBundleId}.`);
  return app.id;
}

async function findBuild(request, appId, appVersion, buildNumber) {
  const query = new URLSearchParams({
    'filter[app]': appId,
    'filter[version]': buildNumber,
    include: 'preReleaseVersion',
    'fields[builds]': 'version,processingState,preReleaseVersion',
    'fields[preReleaseVersions]': 'version',
    limit: '200',
  });
  const response = await request(`/v1/builds?${query}`);
  const preReleaseVersions = new Map(
    (response.included ?? [])
      .filter((resource) => resource.type === 'preReleaseVersions')
      .map((resource) => [resource.id, resource.attributes?.version]),
  );

  for (const build of response.data ?? []) {
    if (build.attributes?.version !== buildNumber) continue;
    const preReleaseVersionId = build.relationships?.preReleaseVersion?.data?.id;
    if (preReleaseVersions.get(preReleaseVersionId) === appVersion) return build;
  }

  return undefined;
}

async function waitForProcessedBuild({ request, appId, appVersion, buildNumber, timeoutMinutes }) {
  const deadline = Date.now() + timeoutMinutes * 60_000;

  while (Date.now() < deadline) {
    const build = await findBuild(request, appId, appVersion, buildNumber);
    if (build?.attributes?.processingState === 'VALID') return build;
    if (build && ['FAILED', 'INVALID'].includes(build.attributes?.processingState)) {
      throw new Error(
        `Apple marked build ${buildNumber} ${build.attributes.processingState.toLowerCase()}; notes were not attached.`,
      );
    }

    const state = build?.attributes?.processingState ?? 'not visible yet';
    console.log(`Waiting for Apple to finish processing build ${buildNumber} (${state}).`);
    await delay(pollIntervalMilliseconds);
  }

  throw new Error(
    `Build ${buildNumber} was not ready after ${timeoutMinutes} minutes. `
      + `The upload may still be processing; rerun this script for version ${appVersion}, build ${buildNumber} after it becomes available.`,
  );
}

async function upsertBuildLocalization(request, buildId, locale, whatsNew) {
  const query = new URLSearchParams({
    'fields[betaBuildLocalizations]': 'locale,whatsNew',
    limit: '200',
  });
  const response = await request(`/v1/builds/${encodeURIComponent(buildId)}/betaBuildLocalizations?${query}`);
  const existing = (response.data ?? []).find((localization) => localization.attributes?.locale === locale);

  if (existing) {
    await request(`/v1/betaBuildLocalizations/${encodeURIComponent(existing.id)}`, {
      method: 'PATCH',
      body: {
        data: {
          type: 'betaBuildLocalizations',
          id: existing.id,
          attributes: { whatsNew },
        },
      },
    });
    return 'updated';
  }

  await request('/v1/betaBuildLocalizations', {
    method: 'POST',
    body: {
      data: {
        type: 'betaBuildLocalizations',
        attributes: { locale, whatsNew },
        relationships: {
          build: { data: { type: 'builds', id: buildId } },
        },
      },
    },
  });
  return 'added';
}

export async function uploadTestFlightNotes({
  appVersion,
  buildNumber,
  keyId,
  issuerId,
  privateKey,
  notesPath = defaultNotesPath,
  timeoutMinutes = defaultProcessingTimeoutMinutes,
  fetchImpl,
}) {
  const { request } = createApiClient({ keyId, issuerId, privateKey, fetchImpl });
  const appId = await findAppId(request);
  const notes = await readTestFlightNotes(notesPath);
  const build = await waitForProcessedBuild({
    request,
    appId,
    appVersion,
    buildNumber,
    timeoutMinutes,
  });

  for (const [locale, whatsNew] of notes) {
    const action = await upsertBuildLocalization(request, build.id, locale, whatsNew);
    console.log(`${action === 'added' ? 'Added' : 'Updated'} ${locale} TestFlight notes for build ${buildNumber}.`);
  }
}

async function main() {
  const [appVersion, buildNumber] = process.argv.slice(2);
  if (!appVersion || !buildNumber) {
    throw new Error('Usage: node scripts/upload-testflight-notes.mjs <app-version> <build-number>');
  }

  const keyPath = process.env.ASC_API_KEY_PATH;
  const keyId = process.env.ASC_API_KEY_ID;
  const issuerId = process.env.ASC_API_ISSUER_ID;
  if (!keyPath || !keyId || !issuerId) {
    throw new Error('Set ASC_API_KEY_PATH, ASC_API_KEY_ID, and ASC_API_ISSUER_ID to attach TestFlight notes.');
  }

  const timeoutMinutes = Number(process.env.ASC_BUILD_PROCESSING_TIMEOUT_MINUTES ?? defaultProcessingTimeoutMinutes);
  if (!Number.isInteger(timeoutMinutes) || timeoutMinutes < 1) {
    throw new Error('ASC_BUILD_PROCESSING_TIMEOUT_MINUTES must be a positive integer.');
  }

  const privateKey = await readFile(keyPath, 'utf8');
  await uploadTestFlightNotes({
    appVersion,
    buildNumber,
    keyId,
    issuerId,
    privateKey,
    timeoutMinutes,
  });
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath && pathToFileURL(invokedPath).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
