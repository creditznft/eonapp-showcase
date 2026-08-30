import assert from 'node:assert/strict';
import test from 'node:test';
import { __test, onRequestOptions, onRequestPost } from '../../functions/csp-report.js';

const request = (body, { contentType = 'application/csp-report', url = 'https://eonapp.ch/csp-report', headers = {} } = {}) => new Request(url, {
  method: 'POST',
  headers: { 'content-type': contentType, ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body)
});

test('W476-A6 accepts legacy CSP reports and redacts path, query, fragment and blocked resource detail', async () => {
  const logs = [];
  const originalLog = console.log;
  console.log = (value) => logs.push(String(value));
  try {
    const response = await onRequestPost({
      request: request({ 'csp-report': {
        'effective-directive': 'script-src',
        'blocked-uri': 'https://blocked.invalid/script.js?token=do-not-log#fragment',
        'document-uri': 'https://eonapp.ch/chat?share=do-not-log#fragment'
      } }),
      env: {}
    });
    assert.equal(response.status, 204);
  } finally {
    console.log = originalLog;
  }
  assert.equal(logs.length, 1);
  assert.match(logs[0], /"directive":"script-src"/);
  assert.match(logs[0], /"blockedOrigin":"https:\/\/blocked\.invalid"/);
  assert.match(logs[0], /"documentPath":"https:\/\/eonapp\.ch\/chat"/);
  assert.doesNotMatch(logs[0], /do-not-log|token=|share=|fragment/i);
});

test('W476-A6 accepts Reporting API csp-violation arrays and forwards only bounded redacted critical evidence', async () => {
  const logs = [];
  const calls = [];
  const originalLog = console.log;
  const originalFetch = globalThis.fetch;
  console.log = (value) => logs.push(String(value));
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), body: String(init?.body || '') });
    return new Response('', { status: 204 });
  };
  try {
    const response = await onRequestPost({
      request: request([{
        type: 'csp-violation',
        body: {
          effectiveDirective: 'script-src-elem',
          blockedURL: 'https://blocked.invalid/a.js?api_key=never-forward',
          documentURL: 'https://eonapp.ch/local-ai?model=never-forward'
        }
      }], { contentType: 'application/reports+json' }),
      env: { ALERT_WEBHOOK_URL: 'https://alerts.example.test/csp' }
    });
    assert.equal(response.status, 204);
  } finally {
    console.log = originalLog;
    globalThis.fetch = originalFetch;
  }
  assert.equal(logs.length, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://alerts.example.test/csp');
  assert.match(calls[0].body, /script-src-elem/);
  assert.match(calls[0].body, /https:\/\/eonapp\.ch\/local-ai/);
  assert.match(calls[0].body, /https:\/\/blocked\.invalid/);
  assert.doesNotMatch(calls[0].body, /api_key|model=|never-forward/i);
});

test('W476-A6 rejects malformed, oversized, foreign-document and unsupported CSP report inputs', async () => {
  const unsupported = await onRequestPost({ request: request({}, { contentType: 'text/plain' }), env: {} });
  assert.equal(unsupported.status, 415);
  assert.equal((await unsupported.json()).error, 'unsupported_media_type');

  const invalid = await onRequestPost({ request: request('{', { contentType: 'application/reports+json' }), env: {} });
  assert.equal(invalid.status, 400);
  assert.equal((await invalid.json()).error, 'invalid_json');

  const foreign = await onRequestPost({ request: request({ 'csp-report': { 'document-uri': 'https://attacker.invalid/steal', 'blocked-uri': 'https://blocked.invalid/x' } }), env: {} });
  assert.equal(foreign.status, 400);
  assert.equal((await foreign.json()).error, 'invalid_csp_document_origin');

  const oversize = await onRequestPost({ request: request({}, { contentType: 'application/json', headers: { 'content-length': String(__test.MAX_REPORT_BYTES + 1) } }), env: {} });
  assert.equal(oversize.status, 413);
  assert.equal((await oversize.json()).error, 'report_too_large');
});

test('W476-A6 reporting endpoint headers and preflight remain narrowly scoped', async () => {
  const response = await onRequestOptions();
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://eonapp.ch');
  assert.equal(response.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(__test.contentTypeAllowed('application/reports+json; charset=utf-8'), true);
  assert.equal(__test.contentTypeAllowed('application/json'), true);
  assert.equal(__test.contentTypeAllowed('text/html'), false);
});

test('W476-B OPTIONS policy is anchored to the collector endpoint origin, never a caller supplied Origin', async () => {
  const response = await onRequestOptions({
    request: new Request('https://preview.example.pages.dev/csp-report', {
      method: 'OPTIONS',
      headers: { origin: 'https://attacker.invalid' }
    })
  });
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://preview.example.pages.dev');
  assert.equal(response.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
});
