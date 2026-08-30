import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost, __test } from '../../functions/api/nowpayments/create-subscription.js';

test('buildNowPaymentsAuthHeaders uses x-api-key for legacy API keys', () => {
  assert.deepEqual(__test.buildNowPaymentsAuthHeaders('np_live_legacy_key'), { 'x-api-key': 'np_live_legacy_key' });
});

test('buildNowPaymentsAuthHeaders uses Bearer for JWT-like tokens', () => {
  const headers = __test.buildNowPaymentsAuthHeaders('aaa.bbb.ccc');
  assert.equal(headers.Authorization, 'Bearer aaa.bbb.ccc');
  assert.equal(Object.prototype.hasOwnProperty.call(headers, 'x-api-key'), false);
});

test('extractJwtFromPayload accepts common token field names', () => {
  assert.equal(__test.extractJwtFromPayload({ token: 'jwt-1' }), 'jwt-1');
  assert.equal(__test.extractJwtFromPayload({ access_token: 'jwt-2' }), 'jwt-2');
  assert.equal(__test.extractJwtFromPayload({ jwt: 'jwt-3' }), 'jwt-3');
});

test('create-subscription returns structured 424 when dashboard JWT credentials are missing', async () => {
  const request = new Request('https://eonapp.ch/api/nowpayments/create-subscription', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ plan_id: 'supporter', email: 'proof@example.com' })
  });
  const response = await onRequestPost({
    request,
    env: { NOWPAYMENTS_API_KEY: 'merchant-api-key' }
  });
  const body = await response.json();
  assert.equal(response.status, 424);
  assert.equal(body.ok, false);
  assert.equal(body.error, 'missing_nowpayments_dashboard_credentials');
});

test('create-subscription returns structured 424 when upstream fetch throws', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response(JSON.stringify({ token: 'jwt-token' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    throw new Error('upstream unavailable');
  };

  try {
    const request = new Request('https://eonapp.ch/api/nowpayments/create-subscription', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan_id: 'supporter', email: 'proof@example.com' })
    });
    const response = await onRequestPost({
      request,
      env: {
        NOWPAYMENTS_API_KEY: 'merchant-api-key',
        NOWPAYMENTS_DASHBOARD_EMAIL: 'owner@example.com',
        NOWPAYMENTS_DASHBOARD_PASSWORD: 'secret-password'
      }
    });
    const body = await response.json();
    assert.equal(response.status, 424);
    assert.equal(body.ok, false);
    assert.equal(body.error, 'nowpayments_fetch_failed');
    assert.match(body.message, /upstream unavailable/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
