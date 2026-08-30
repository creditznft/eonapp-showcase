import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { probeVexrailModelAvailability, VEXRAIL_MODELS_UPSTREAM } from '../../functions/api/ai/vexrail-readiness.js';
import { resetVexrailModelDiscoveryCacheForTests } from '../../functions/_shared/eon-vexrail-model-router.js';

const configured = Object.freeze({
  configured: true,
  publishableKey: 'pk_live_test_only',
  secretKey: 'sk_live_test_only'
});

function economics(models) {
  return JSON.stringify({ version: 1, verified: true, models });
}

const fullCoverageEconomics = () => economics({
  'simple-model': { input_micros_per_1m_tokens: 10, output_micros_per_1m_tokens: 20, quality_score: 75, classes: ['simple_chat'], streaming: true },
  'work-model': { input_micros_per_1m_tokens: 20, output_micros_per_1m_tokens: 30, quality_score: 80, classes: ['ordinary_productivity'], streaming: true },
  'code-model': { input_micros_per_1m_tokens: 30, output_micros_per_1m_tokens: 40, quality_score: 85, classes: ['coding_building'], streaming: true },
  'reason-model': { input_micros_per_1m_tokens: 40, output_micros_per_1m_tokens: 50, quality_score: 92, classes: ['complex_reasoning'], streaming: true }
});

const fullCoverageList = () => new Response(JSON.stringify({ object: 'list', data: [
  { id: 'simple-model', object: 'model' },
  { id: 'work-model', object: 'model' },
  { id: 'code-model', object: 'model' },
  { id: 'reason-model', object: 'model' }
] }), { status: 200, headers: { 'content-type': 'application/json' } });

test('RT92 Vexrail readiness verifies live dynamic coverage without exposing keys or requiring a fixed model', async () => {
  resetVexrailModelDiscoveryCacheForTests();
  let request = null;
  const result = await probeVexrailModelAvailability(configured, async (url, init) => {
    request = { url, init };
    return fullCoverageList();
  }, { economicsRaw: fullCoverageEconomics() });
  assert.equal(request.url, VEXRAIL_MODELS_UPSTREAM);
  assert.equal(request.init.headers['x-publishable-key'], configured.publishableKey);
  assert.equal(request.init.headers['x-secret-key'], configured.secretKey);
  assert.equal(result.ok, true);
  assert.equal(result.dynamicEconomicsVerified, true);
  assert.equal(result.dynamicCoverageReady, true);
  assert.equal(result.dynamicRoutingAvailable, true);
  assert.equal(result.dynamicCandidateCount, 4);
  assert.deepEqual(result.dynamicCoverage, { simple_chat: 1, ordinary_productivity: 1, coding_building: 1, complex_reasoning: 1 });
  assert.equal(result.modelCount, 4);
  assert.equal(result.reason, 'ready_dynamic');
  assert.equal(result.secretsExposed, false);
  assert.equal('selectedModel' in result, false);
  assert.equal('modelAvailable' in result, false);
  assert.equal(JSON.stringify(result).includes('sk_live_test_only'), false);
  assert.equal(JSON.stringify(result).includes('pk_live_test_only'), false);
});

test('RT92 Vexrail readiness fails closed when live catalogue cannot cover every request class', async () => {
  resetVexrailModelDiscoveryCacheForTests();
  const economicsRaw = economics({
    'simple-model': { input_micros_per_1m_tokens: 10, output_micros_per_1m_tokens: 20, quality_score: 75, classes: ['simple_chat'], streaming: true },
    'code-model': { input_micros_per_1m_tokens: 30, output_micros_per_1m_tokens: 40, quality_score: 85, classes: ['coding_building'], streaming: true }
  });
  const result = await probeVexrailModelAvailability(configured, async () => new Response(JSON.stringify({ data: [{ id: 'simple-model' }, { id: 'code-model' }] }), { status: 200 }), { economicsRaw });
  assert.equal(result.ok, false);
  assert.equal(result.dynamicEconomicsVerified, true);
  assert.equal(result.dynamicCoverageReady, false);
  assert.equal(result.dynamicRoutingAvailable, false);
  assert.equal(result.reason, 'vexrail_dynamic_coverage_incomplete');
});

test('RT92 Vexrail readiness fails closed before upstream when credentials are unavailable', async () => {
  resetVexrailModelDiscoveryCacheForTests();
  let called = false;
  const result = await probeVexrailModelAvailability({ configured: false }, async () => { called = true; }, { economicsRaw: fullCoverageEconomics() });
  assert.equal(called, false);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'vexrail_not_configured');
});

test('RT92 Vexrail readiness fails closed before discovery when verified economics are unavailable', async () => {
  resetVexrailModelDiscoveryCacheForTests();
  let called = false;
  const result = await probeVexrailModelAvailability(configured, async () => { called = true; });
  assert.equal(called, false);
  assert.equal(result.ok, false);
  assert.equal(result.dynamicEconomicsVerified, false);
  assert.equal(result.reason, 'vexrail_economics_unavailable');
});

test('RT97 Production keeps Vexrail selected-country learning cohort to US, CA, GB, DE, and IN with no fixed model', () => {
  const wrangler = fs.readFileSync(new URL('../../wrangler.jsonc', import.meta.url), 'utf8');
  assert.match(wrangler, /"EON_VEXRAIL_GEO_MODE":\s*"selected_countries"/);
  assert.match(wrangler, /"EON_VEXRAIL_COUNTRIES":\s*"US,CA,GB,DE,IN"/);
  assert.match(wrangler, /"EON_VEXRAIL_COUNTRIES":\s*"[^"\n]*\bIN\b/);
  assert.doesNotMatch(wrangler, /"EON_VEXRAIL_GEO_MODE":\s*"all"/);
  assert.doesNotMatch(wrangler, /\bVEXRAIL_MODEL\b/);
});

test('RT92 readiness endpoint is signed-in and rate-limited, and never returns secret fields', () => {
  const source = fs.readFileSync(new URL('../../functions/api/ai/vexrail-readiness.js', import.meta.url), 'utf8');
  assert.match(source, /readSession\(/);
  assert.match(source, /sign_in_required/);
  assert.match(source, /consumeTrustRateLimit\(/);
  assert.match(source, /vexrail_model_readiness/);
  assert.match(source, /dynamicCoverageReady/);
  assert.match(source, /secretsExposed:\s*false/);
  assert.doesNotMatch(source, /secretKey:\s*result/);
  assert.doesNotMatch(source, /publishableKey:\s*result/);
});

test('RT92 Vexrail readiness survives retirement of an economics-listed model when live coverage remains complete', async () => {
  resetVexrailModelDiscoveryCacheForTests();
  const economicsRaw = economics({
    'retired-cheap-model': { input_micros_per_1m_tokens: 1, output_micros_per_1m_tokens: 1, quality_score: 95, classes: ['*'], streaming: true },
    'simple-model': { input_micros_per_1m_tokens: 10, output_micros_per_1m_tokens: 20, quality_score: 75, classes: ['simple_chat'], streaming: true },
    'work-model': { input_micros_per_1m_tokens: 20, output_micros_per_1m_tokens: 30, quality_score: 80, classes: ['ordinary_productivity'], streaming: true },
    'code-model': { input_micros_per_1m_tokens: 30, output_micros_per_1m_tokens: 40, quality_score: 85, classes: ['coding_building'], streaming: true },
    'reason-model': { input_micros_per_1m_tokens: 40, output_micros_per_1m_tokens: 50, quality_score: 92, classes: ['complex_reasoning'], streaming: true }
  });
  const result = await probeVexrailModelAvailability(configured, async () => fullCoverageList(), { economicsRaw });
  assert.equal(result.ok, true);
  assert.equal(result.dynamicCoverageReady, true);
  assert.equal(result.dynamicRoutingAvailable, true);
  assert.equal(result.dynamicCandidateCount, 4);
  assert.equal(result.reason, 'ready_dynamic');
});
