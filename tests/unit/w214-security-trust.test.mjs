import test from 'node:test';
import assert from 'node:assert/strict';
import { redactTelemetryText, redactTelemetryPath, compactTelemetryPayload } from '../../assets/js/utils/privacy-telemetry.js';
import { recordRuntimeError, listRuntimeErrors, EON_RUNTIME_ERROR_KEY } from '../../assets/js/utils/runtime-error-telemetry.js';
import { onRequestPost as handleCspReport } from '../../functions/csp-report.js';

test('W214 telemetry redacts secrets, URLs, query strings and fragments before local storage', () => {
  const text = redactTelemetryText('request failed token=abc123 https://eonapp.ch/r/#eon2.public-proof?secret=nope');
  assert.doesNotMatch(text, /abc123|secret=nope|eon2\./i);
  assert.match(text, /token \[redacted\]/i);
  assert.match(text, /\[url\]/);
  assert.equal(redactTelemetryPath('https://eonapp.ch/r/?token=abc#eon2.secret'), '/r/');
  const compact = compactTelemetryPayload({ token: 'hide', wallet: 'hide', attempts: 3, active: true, href: 'https://eonapp.ch/vault?api_key=nope' });
  assert.deepEqual(compact, { attempts: 3, active: true, href: '[url]' });
});

test('W214 runtime error records keep only local redacted evidence', () => {
  const state = new Map();
  const storage = { getItem: (key) => state.get(key) || null, setItem: (key, value) => state.set(key, String(value)), removeItem: (key) => state.delete(key) };
  const event = recordRuntimeError({ message: 'Failed Authorization: Bearer top-secret https://eonapp.ch/chat?token=abc', page: 'https://eonapp.ch/chat?token=abc#fragment' }, { storage, now: 1700000000000 });
  assert.equal(event.page, '/chat');
  assert.doesNotMatch(event.message, /top-secret|token=abc/i);
  assert.equal(listRuntimeErrors({ storage }).length, 1);
  assert.doesNotMatch(state.get(EON_RUNTIME_ERROR_KEY), /top-secret|token=abc|fragment/i);
});

test('W214 CSP endpoint bounds report size and strips URL query/fragment data', async () => {
  const request = new Request('https://eonapp.ch/csp-report', {
    method: 'POST', headers: { 'content-type': 'application/csp-report' },
    body: JSON.stringify({ 'csp-report': { 'effective-directive': 'script-src', 'blocked-uri': 'https://evil.example/path?secret=1', 'document-uri': 'https://eonapp.ch/r/?token=abc#eon2.proof' } })
  });
  const originalLog = console.log;
  let logged = '';
  console.log = (value) => { logged = String(value); };
  try {
    const response = await handleCspReport({ request, env: {} });
    assert.equal(response.status, 204);
  } finally { console.log = originalLog; }
  assert.match(logged, /script-src/);
  assert.match(logged, /https:\/\/eonapp\.ch\/r\//);
  assert.doesNotMatch(logged, /token=abc|eon2\.proof|secret=1/i);

  const tooLarge = new Request('https://eonapp.ch/csp-report', { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': String(13 * 1024) }, body: '{}' });
  const rejected = await handleCspReport({ request: tooLarge, env: {} });
  assert.equal(rejected.status, 413);
});
