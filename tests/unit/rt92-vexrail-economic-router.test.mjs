import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VEXRAIL_MODELS_UPSTREAM,
  classifyVexrailRequest,
  classifyVexrailModelId,
  discoverVexrailModelIds,
  estimateVexrailRouteCostMicros,
  parseVerifiedVexrailEconomics,
  selectVexrailModelRoute,
  resetVexrailModelDiscoveryCacheForTests
} from '../../functions/_shared/eon-vexrail-model-router.js';

const config = { secretKey: 'secret', publishableKey: 'publishable', configured: true };
const CURRENT_VEXRAIL_MODEL_IDS = Object.freeze([
  'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna', 'gpt-5.5', 'gpt-5.4', 'gpt-oss-120b', 'gpt-oss-20b', 'gpt-oss-safeguard-120b', 'gpt-oss-safeguard-20b',
  'claude-opus-5', 'claude-sonnet-5', 'claude-opus-4-8', 'claude-sonnet-4-6', 'claude-opus-4-7', 'claude-opus-4-6', 'claude-opus-4-5', 'claude-sonnet-4-5', 'claude-fable-5', 'claude-haiku-4-5',
  'llama-4-maverick', 'llama-4-scout', 'deepseek-v3.2', 'deepseek-r1', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-pro-preview', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-flash',
  'gemma-3-27b', 'gemma-3-12b', 'gemma-3-4b', 'gemma-4-31b', 'gemma-4-26b-a4b', 'gemma-4-e2b'
]);
// 2026-08-22 empirical Vexrail Credit Wallet calibration. Values are
// conservative effective wallet debit ceilings in microdollars per 1M tokens,
// not upstream-vendor retail pricing. Runtime reads this data from Pages config.
const EMPIRICAL_ECONOMICS = Object.freeze({ version: 1, verified: true, verification_date: '2026-08-22', authority: 'empirical_vexrail_credit_wallet_calibration', models: {
  'gpt-oss-20b': { input_micros_per_1m_tokens: 76000, output_micros_per_1m_tokens: 301000, quality_score: 78, classes: ['simple_chat', 'ordinary_productivity'], streaming: false },
  'gemini-3.5-flash': { input_micros_per_1m_tokens: 1501000, output_micros_per_1m_tokens: 9001000, quality_score: 90, classes: ['simple_chat', 'ordinary_productivity', 'coding_building'], streaming: false },
  'gpt-5.6-luna': { input_micros_per_1m_tokens: 276000, output_micros_per_1m_tokens: 1320000, quality_score: 88, classes: ['simple_chat', 'ordinary_productivity', 'coding_building'], streaming: false },
  'gemini-2.5-flash': { input_micros_per_1m_tokens: 302000, output_micros_per_1m_tokens: 2502000, quality_score: 86, classes: ['simple_chat', 'ordinary_productivity', 'coding_building'], streaming: false },
  'gemini-3.5-flash-lite': { input_micros_per_1m_tokens: 301000, output_micros_per_1m_tokens: 2502000, quality_score: 82, classes: ['simple_chat', 'ordinary_productivity'], streaming: false },
  'deepseek-v3.2': { input_micros_per_1m_tokens: 622000, output_micros_per_1m_tokens: 1853000, quality_score: 92, classes: ['coding_building', 'complex_reasoning'], streaming: false },
  'llama-4-scout': { input_micros_per_1m_tokens: 171000, output_micros_per_1m_tokens: 661000, quality_score: 80, classes: ['simple_chat'], streaming: false, spend_qualified: false },
  'gemma-3-4b': { input_micros_per_1m_tokens: 41000, output_micros_per_1m_tokens: 82000, quality_score: 75, classes: ['simple_chat'], streaming: false, spend_qualified: false },
  'gemma-3-12b': { input_micros_per_1m_tokens: 91000, output_micros_per_1m_tokens: 293000, quality_score: 80, classes: ['simple_chat'], streaming: false, spend_qualified: false },
  'gemma-4-e2b': { input_micros_per_1m_tokens: 41000, output_micros_per_1m_tokens: 82000, quality_score: 80, classes: ['simple_chat'], streaming: false, spend_qualified: false }
} });
function modelFetch(ids = []) {
  return async (url, init) => {
    assert.equal(url, VEXRAIL_MODELS_UPSTREAM);
    assert.equal(init.headers['x-secret-key'], 'secret');
    assert.equal(init.headers['x-publishable-key'], 'publishable');
    return new Response(JSON.stringify({ object: 'list', data: ids.map((id) => ({ id, object: 'model' })) }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
}

test('RT92 Vexrail request classifier separates simple, productivity, coding and complex work', () => {
  assert.equal(classifyVexrailRequest([{ role: 'user', content: 'Hello, give me three title ideas.' }]), 'simple_chat');
  assert.equal(classifyVexrailRequest([{ role: 'user', content: 'Draft a detailed project update for the team with milestones and risks '.repeat(20) }]), 'ordinary_productivity');
  assert.equal(classifyVexrailRequest([{ role: 'user', content: 'Debug this TypeScript function and deploy it to Cloudflare.' }]), 'coding_building');
  assert.equal(classifyVexrailRequest([{ role: 'user', content: 'Analyze the architecture trade-offs and derive a multi-step strategy.' }]), 'complex_reasoning');
});

test('RT92 Vexrail economics parser refuses unverified or malformed price data', () => {
  assert.equal(parseVerifiedVexrailEconomics('{bad').verified, false);
  assert.equal(parseVerifiedVexrailEconomics(JSON.stringify({ version: 1, verified: false, models: {} })).verified, false);
  const parsed = parseVerifiedVexrailEconomics(JSON.stringify({ version: 1, verified: true, models: {
    cheap: { input_micros_per_1m_tokens: 10, output_micros_per_1m_tokens: 20, quality_score: 90, classes: ['*'] }
  } }));
  assert.equal(parsed.verified, true);
  assert.equal(parsed.models.cheap.qualityScore, 90);
});

test('RT92 Vexrail accepts the owner-authorized empirical wallet ceilings without treating them as vendor retail pricing', () => {
  const parsed = parseVerifiedVexrailEconomics(JSON.stringify(EMPIRICAL_ECONOMICS));
  assert.equal(parsed.verified, true);
  assert.equal(Object.keys(parsed.models).length, 10);
  assert.deepEqual(
    { input: parsed.models['gpt-oss-20b'].inputMicrosPer1M, output: parsed.models['gpt-oss-20b'].outputMicrosPer1M },
    { input: 76000, output: 301000 }
  );
  assert.equal(parsed.models['gemma-3-4b'].spendQualified, false);
  assert.equal(parsed.models['deepseek-v3.2'].streaming, false);
});

test('RT92 Vexrail routes from actual input plus output cost and respects the empirical class policy', async () => {
  const env = { EON_VEXRAIL_MODEL_ECONOMICS_JSON: JSON.stringify(EMPIRICAL_ECONOMICS) };
  resetVexrailModelDiscoveryCacheForTests();
  const simpleInputHeavy = await selectVexrailModelRoute({ config, payload: { messages: [{ role: 'user', content: 'x'.repeat(4000) }], max_tokens: 1 }, env, fetchImpl: modelFetch(Object.keys(EMPIRICAL_ECONOMICS.models)), now: 9000 });
  assert.equal(simpleInputHeavy.model, 'gpt-oss-20b');
  resetVexrailModelDiscoveryCacheForTests();
  const simpleOutputHeavy = await selectVexrailModelRoute({ config, payload: { messages: [{ role: 'user', content: 'Hello.' }], max_tokens: 1_000_000 }, env, fetchImpl: modelFetch(Object.keys(EMPIRICAL_ECONOMICS.models)), now: 10000 });
  assert.equal(simpleOutputHeavy.model, 'gpt-oss-20b');
  assert.ok(estimateVexrailRouteCostMicros(parseVerifiedVexrailEconomics(JSON.stringify(EMPIRICAL_ECONOMICS)).models['gpt-oss-20b'], { messages: [{ content: 'Hello.' }], max_tokens: 1_000_000 }) < estimateVexrailRouteCostMicros(parseVerifiedVexrailEconomics(JSON.stringify(EMPIRICAL_ECONOMICS)).models['gemini-3.5-flash'], { messages: [{ content: 'Hello.' }], max_tokens: 1_000_000 }));
  resetVexrailModelDiscoveryCacheForTests();
  const coding = await selectVexrailModelRoute({ config, payload: { messages: [{ role: 'user', content: 'Debug this TypeScript function.' }], max_tokens: 1000 }, env, fetchImpl: modelFetch(Object.keys(EMPIRICAL_ECONOMICS.models)), now: 11000 });
  assert.equal(coding.model, 'gpt-5.6-luna');
  resetVexrailModelDiscoveryCacheForTests();
  const complex = await selectVexrailModelRoute({ config, payload: { messages: [{ role: 'user', content: 'Analyze the architecture trade-offs and derive a multi-step strategy.' }], max_tokens: 1000 }, env, fetchImpl: modelFetch(Object.keys(EMPIRICAL_ECONOMICS.models)), now: 12000 });
  assert.equal(complex.model, 'deepseek-v3.2');
});

test('RT92 Vexrail discovery supports every currently observed id while keeping unknown economics unqualified', async () => {
  resetVexrailModelDiscoveryCacheForTests();
  const discovery = await discoverVexrailModelIds(config, modelFetch(CURRENT_VEXRAIL_MODEL_IDS), 6000);
  assert.equal(discovery.ok, true);
  assert.deepEqual(discovery.ids, [...CURRENT_VEXRAIL_MODEL_IDS].sort());
  assert.equal(discovery.modelMetadata.length, 36);
  assert.equal(classifyVexrailModelId('gpt-oss-safeguard-20b').safeguardOnly, true);
  assert.equal(classifyVexrailModelId('gemini-3-flash-preview').experimental, true);
  const route = await selectVexrailModelRoute({
    config, payload: { messages: [{ role: 'user', content: 'Hello.' }] }, env: {}, fetchImpl: modelFetch(CURRENT_VEXRAIL_MODEL_IDS), now: 7000
  });
  assert.equal(route.ok, false);
  assert.equal(route.reason, 'vexrail_economics_unavailable');
});

test('RT92 Vexrail never spends on safeguard models or unapproved previews', async () => {
  const env = { EON_VEXRAIL_MODEL_ECONOMICS_JSON: JSON.stringify({ version: 1, verified: true, models: {
    'gpt-oss-safeguard-20b': { input_micros_per_1m_tokens: 1, output_micros_per_1m_tokens: 1, quality_score: 100, classes: ['*'] },
    'gemini-3-flash-preview': { input_micros_per_1m_tokens: 2, output_micros_per_1m_tokens: 2, quality_score: 100, classes: ['*'] },
    'gpt-5.6-luna': { input_micros_per_1m_tokens: 3, output_micros_per_1m_tokens: 3, quality_score: 80, classes: ['simple_chat'] }
  } }) };
  resetVexrailModelDiscoveryCacheForTests();
  const route = await selectVexrailModelRoute({ config, payload: { messages: [{ role: 'user', content: 'Hello.' }] }, env, fetchImpl: modelFetch(['gpt-oss-safeguard-20b', 'gemini-3-flash-preview', 'gpt-5.6-luna']), now: 8000 });
  assert.equal(route.ok, true);
  assert.equal(route.model, 'gpt-5.6-luna');
});

test('RT92 Vexrail router chooses cheapest available model only from verified qualified economics', async () => {
  resetVexrailModelDiscoveryCacheForTests();
  const env = { EON_VEXRAIL_MODEL_ECONOMICS_JSON: JSON.stringify({ version: 1, verified: true, models: {
    expensive: { input_micros_per_1m_tokens: 1000000, output_micros_per_1m_tokens: 3000000, quality_score: 95, classes: ['simple_chat'], streaming: true },
    cheap: { input_micros_per_1m_tokens: 100000, output_micros_per_1m_tokens: 400000, quality_score: 80, classes: ['simple_chat'], streaming: true },
    tooWeak: { input_micros_per_1m_tokens: 1, output_micros_per_1m_tokens: 1, quality_score: 20, classes: ['simple_chat'], streaming: true }
  } }) };
  const route = await selectVexrailModelRoute({
    config,
    payload: { messages: [{ role: 'user', content: 'Hello there.' }], max_tokens: 100, stream: true },
    env,
    fetchImpl: modelFetch(['expensive', 'cheap', 'tooWeak']),
    now: 1000
  });
  assert.equal(route.ok, true);
  assert.equal(route.model, 'cheap');
  assert.equal(route.routingMode, 'verified_cheapest_qualified');
  assert.equal(route.economicsVerified, true);
  assert.ok(Number.isInteger(route.estimatedCostMicros));
});

test('RT92 Vexrail router fails closed before discovery when verified economics are unavailable', async () => {
  resetVexrailModelDiscoveryCacheForTests();
  let called = false;
  const route = await selectVexrailModelRoute({
    config,
    payload: { messages: [{ role: 'user', content: 'Hello.' }], max_tokens: 100, stream: false },
    env: {}, fetchImpl: async () => { called = true; throw new Error('must not discover without verified economics'); }, now: 2000
  });
  assert.equal(called, false);
  assert.equal(route.ok, false);
  assert.equal(route.model, '');
  assert.equal(route.routingMode, 'unavailable');
  assert.equal(route.economicsVerified, false);
  assert.equal(route.reason, 'vexrail_economics_unavailable');
});

test('RT92 Vexrail router fails closed when live discovery has no verified qualified candidate', async () => {
  resetVexrailModelDiscoveryCacheForTests();
  const route = await selectVexrailModelRoute({
    config,
    payload: { messages: [{ role: 'user', content: 'Hello.' }], max_tokens: 100, stream: false },
    env: { EON_VEXRAIL_MODEL_ECONOMICS_JSON: JSON.stringify({ version: 1, verified: true, models: {
      retired: { input_micros_per_1m_tokens: 100000, output_micros_per_1m_tokens: 200000, quality_score: 90, classes: ['simple_chat'] }
    } }) }, fetchImpl: modelFetch(['other-live-model']), now: 3000
  });
  assert.equal(route.ok, false);
  assert.equal(route.reason, 'vexrail_no_qualified_model');
  assert.equal(route.modelAvailabilityVerified, true);
});

test('RT92 Vexrail router survives model retirement by choosing the next cheapest live verified model', async () => {
  const env = { EON_VEXRAIL_MODEL_ECONOMICS_JSON: JSON.stringify({ version: 1, verified: true, models: {
    cheapest: { input_micros_per_1m_tokens: 100000, output_micros_per_1m_tokens: 400000, quality_score: 80, classes: ['simple_chat'], streaming: true },
    next: { input_micros_per_1m_tokens: 1000000, output_micros_per_1m_tokens: 3000000, quality_score: 85, classes: ['simple_chat'], streaming: true }
  } }) };
  resetVexrailModelDiscoveryCacheForTests();
  const before = await selectVexrailModelRoute({ config, payload: { messages: [{ role: 'user', content: 'Hello.' }], max_tokens: 100 }, env, fetchImpl: modelFetch(['cheapest', 'next']), now: 4000 });
  assert.equal(before.ok, true);
  assert.equal(before.model, 'cheapest');

  resetVexrailModelDiscoveryCacheForTests();
  const after = await selectVexrailModelRoute({ config, payload: { messages: [{ role: 'user', content: 'Hello.' }], max_tokens: 100 }, env, fetchImpl: modelFetch(['next']), now: 5000 });
  assert.equal(after.ok, true);
  assert.equal(after.model, 'next');
  assert.equal(after.routingMode, 'verified_cheapest_qualified');
});
