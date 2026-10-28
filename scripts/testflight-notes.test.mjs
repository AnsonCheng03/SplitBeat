import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import { parseTestFlightNotes, readTestFlightNotes } from './testflight-notes.mjs';
import { uploadTestFlightNotes } from './upload-testflight-notes.mjs';

test('parses English and Traditional Chinese TestFlight notes', () => {
  const notes = parseTestFlightNotes(`# Release notes\n\n## en-US\nEnglish notes.\n\n## zh-Hant\n繁體中文說明。\n`);

  assert.deepEqual([...notes], [
    ['en-US', 'English notes.'],
    ['zh-Hant', '繁體中文說明。'],
  ]);
});

test('the checked-in release notes provide both supported locales', async () => {
  const notes = await readTestFlightNotes(new URL('../store/app-store/testflight-notes.md', import.meta.url));

  assert.deepEqual([...notes.keys()], ['en-US', 'zh-Hant']);
});

test('requires a non-empty note for each supported locale', () => {
  assert.throws(
    () => parseTestFlightNotes('## en-US\nEnglish only.'),
    /Missing required TestFlight notes locale: zh-Hant/,
  );
  assert.throws(
    () => parseTestFlightNotes('## en-US\n   \n## zh-Hant\n繁體中文說明。'),
    /TestFlight notes for en-US cannot be empty/,
  );
});

test('rejects duplicate and overlong locale entries', () => {
  assert.throws(
    () => parseTestFlightNotes('## en-US\nFirst.\n## en-US\nSecond.\n## zh-Hant\n繁體中文說明。'),
    /Duplicate TestFlight notes locale: en-US/,
  );
  assert.throws(
    () => parseTestFlightNotes(`## en-US\n${'x'.repeat(4001)}\n## zh-Hant\n繁體中文說明。`),
    /exceed 4000 characters/,
  );
});

test('adds or updates localized notes on the processed build', async () => {
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const requestUrl = new URL(url);
    calls.push({ method: options.method ?? 'GET', pathname: requestUrl.pathname, body: options.body });

    if (requestUrl.pathname === '/v1/apps') {
      return jsonResponse({ data: [{ id: 'app-id', attributes: { bundleId: 'com.splitbeat.twohandrhythm' } }] });
    }
    if (requestUrl.pathname === '/v1/builds') {
      return jsonResponse({
        data: [{
          id: 'build-id',
          attributes: { version: '20261028031027', processingState: 'VALID' },
          relationships: { preReleaseVersion: { data: { id: 'pre-release-id', type: 'preReleaseVersions' } } },
        }],
        included: [{ id: 'pre-release-id', type: 'preReleaseVersions', attributes: { version: '1.0.0' } }],
      });
    }
    if (requestUrl.pathname === '/v1/builds/build-id/betaBuildLocalizations') {
      return jsonResponse({
        data: [{ id: 'english-note-id', attributes: { locale: 'en-US', whatsNew: 'Older notes.' } }],
      });
    }
    if (requestUrl.pathname === '/v1/betaBuildLocalizations/english-note-id' && options.method === 'PATCH') {
      return jsonResponse({ data: { id: 'english-note-id' } });
    }
    if (requestUrl.pathname === '/v1/betaBuildLocalizations' && options.method === 'POST') {
      return jsonResponse({ data: { id: 'traditional-note-id' } }, 201);
    }

    throw new Error(`Unexpected fake App Store Connect request: ${requestUrl.pathname}`);
  };

  await uploadTestFlightNotes({
    appVersion: '1.0.0',
    buildNumber: '20261028031027',
    keyId: 'test-key-id',
    issuerId: 'test-issuer-id',
    privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
    notesPath: new URL('../store/app-store/testflight-notes.md', import.meta.url),
    timeoutMinutes: 1,
    fetchImpl,
  });

  const patchCall = calls.find((call) => call.method === 'PATCH');
  const postCall = calls.find((call) => call.method === 'POST');
  const notes = await readTestFlightNotes(new URL('../store/app-store/testflight-notes.md', import.meta.url));
  assert.equal(patchCall.pathname, '/v1/betaBuildLocalizations/english-note-id');
  assert.equal(JSON.parse(patchCall.body).data.attributes.whatsNew, notes.get('en-US'));
  assert.equal(postCall.pathname, '/v1/betaBuildLocalizations');
  assert.equal(JSON.parse(postCall.body).data.attributes.locale, 'zh-Hant');
  assert.equal(JSON.parse(postCall.body).data.attributes.whatsNew, notes.get('zh-Hant'));
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), { status });
}
