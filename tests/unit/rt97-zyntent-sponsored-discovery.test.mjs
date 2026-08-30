import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildZyntentSponsoredDiscoveryPayload,
  fetchZyntentSponsoredDiscovery,
  normalizeZyntentSponsoredResults
} from '../../functions/_shared/eon-zyntent-sponsored-discovery.js';

const request = {
  cf: { country: 'IN' },
  headers: new Headers({ 'accept-language': 'en-IN,en;q=0.9' })
};

test('Zyntent payload contains reviewed intent and coarse request context only', () => {
  const payload = buildZyntentSponsoredDiscoveryPayload({ query: 'best laptop for local AI', maxResults: 4 }, request);
  assert.deepEqual(payload, {
    query: { text: 'best laptop for local AI' },
    countries: ['IN'],
    language: 'en',
    ads_limit: 4,
    entity_types: [],
    merchants: []
  });
  const serialized = JSON.stringify(payload);
  for (const forbidden of ['messages', 'history', 'memory', 'apiKey', 'providerKey', 'localAnswer', 'byokAnswer', 'attachments', 'files']) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test('Zyntent result normalizer keeps only safe HTTPS sponsored destinations', () => {
  const results = normalizeZyntentSponsoredResults({ results: [
    { title: 'Good product', tracking_url: 'https://merchant.example/click?id=1', description: 'Useful option', price: '$99' },
    { title: 'Unsafe product', tracking_url: 'javascript:alert(1)' },
    { title: 'Credential URL', tracking_url: 'https://user:pass@merchant.example/click' }
  ]});
  assert.equal(results.length, 1);
  assert.equal(results[0].title, 'Good product');
  assert.equal(results[0].url, 'https://merchant.example/click?id=1');
  assert.equal(results[0].sponsored, true);
});

test('Zyntent fetch fails closed when credentials are not configured', async () => {
  let called = false;
  const result = await fetchZyntentSponsoredDiscovery({
    env: {}, request, intent: { query: 'best laptop for local AI' },
    fetchImpl: async () => { called = true; throw new Error('must not call'); }
  });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'zyntent_not_configured');
  assert.equal(called, false);
});

test('Zyntent server adapter sends API key only in Authorization and never returns it', async () => {
  let captured = null;
  const env = {
    EON_ZYNTENT_ENABLED: 'true',
    EON_ZYNTENT_API_KEY: 'a'.repeat(64),
    EON_ZYNTENT_SOURCE_ID: '12345678-1234-4234-8234-123456789abc'
  };
  const result = await fetchZyntentSponsoredDiscovery({
    env, request, intent: { query: 'noise cancelling headphones', maxResults: 3 },
    fetchImpl: async (url, init) => {
      captured = { url, init };
      return new Response(JSON.stringify({ results: [{ title: 'Headphones', click_url: 'https://merchant.example/deal' }] }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
  });
  assert.equal(result.ok, true);
  assert.equal(captured.url, 'https://api.zyntent.ai/public_api/v1/ads/search/');
  assert.equal(captured.init.headers.Authorization, 'a'.repeat(64));
  assert.equal(captured.init.body.includes('a'.repeat(64)), false);
  assert.equal(JSON.stringify(result).includes('a'.repeat(64)), false);
  assert.equal(result.results.length, 1);
});
