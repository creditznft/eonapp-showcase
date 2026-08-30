import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowUrl = new URL('../../.github/workflows/rt92-production-release.yml', import.meta.url);
const workflow = await readFile(workflowUrl, 'utf8');


test('RT92 production release authorizes the profitability source branch and not the retired privacy-guard branch', () => {
  assert.match(workflow, /SOURCE_BRANCH:\s*codex\/rt92-vexrail-profitability-opt/);
  assert.doesNotMatch(workflow, /SOURCE_BRANCH:\s*codex\/rt92-vexrail-profit-privacy-guard/);
});

test('RT92 production release preflight is ExoClick-first and Adsterra-free', () => {
  assert.doesNotMatch(workflow, /EON_ADSTERRA|effectivecpmnetwork|highperformanceformat/i);
  for (const name of [
    'EON_EXOCLICK_ENABLED',
    'EON_EXOCLICK_NATIVE_ENABLED',
    'EON_EXOCLICK_MULTIFORMAT_ENABLED',
    'EON_EXOCLICK_OUTSTREAM_ENABLED',
    'EON_SPONSOR_VIDEO_ENABLED',
    'EON_REWARDED_ADS_ENABLED',
    'EON_REWARDED_PROVIDER'
  ]) {
    assert.match(workflow, new RegExp(`\\b${name}\\b`));
  }
});

test('RT92 production release preflight requires LIVE Dodo catalogue IDs and explicit premium rollout', () => {
  for (const name of [
    'DODO_PRODUCT_PRO',
    'DODO_PRODUCT_ULTRA',
    'DODO_PRODUCT_ULTIMATE',
    'EON_PREMIUM_CHECKOUT_ROLLOUT'
  ]) {
    assert.match(workflow, new RegExp(`\\b${name}\\b`));
  }
});

test('RT92 production release preflight requires dynamic Vexrail economics and trust readiness bindings without a fixed model', () => {
  for (const name of [
    'EON_VEXRAIL_ROLLOUT',
    'EON_VEXRAIL_GEO_MODE',
    'EON_VEXRAIL_COUNTRIES',
    'EON_VEXRAIL_REQUIRE_CF_METADATA',
    'VEXRAIL_SECRET_KEY',
    'VEXRAIL_PUBLISHABLE_KEY',
    'EON_VEXRAIL_MODEL_ECONOMICS_JSON',
    'EON_VEXRAIL_TURNSTILE_SITE_KEY',
    'EON_VEXRAIL_TURNSTILE_SECRET',
    'EON_VEXRAIL_TURNSTILE_HOSTNAMES',
    'EON_TRUST_RATE_LIMIT_SALT'
  ]) {
    assert.match(workflow, new RegExp(`\\b${name}\\b`));
  }
  assert.match(workflow, /functions\/api\/ai\/vexrail-readiness\.js/);
  assert.doesNotMatch(workflow, /\bVEXRAIL_MODEL\b/);
});

test('RT92 production release live proof expects ExoClick and keeps anonymous rewarded access closed while the server verifier is ready', () => {
  assert.match(workflow, /display\.provider[^\n]+exoclick/);
  assert.match(workflow, /display\.chatSurfaceAllowed/);
  assert.match(workflow, /display\.activeCityGameplayAllowed/);
  assert.match(workflow, /rewarded\.available/);
  assert.match(workflow, /rewarded\.serverVerifierReady/);
  assert.match(workflow, /sponsorVideo\.rewardsEnabled/);
  assert.match(workflow, /a\\\.magsrv\\\.com/);
  assert.match(workflow, /cdn\\\.fluidplayer\\\.com/);
});


test('RT92 production release proves guest one-shot economics while continued sponsored use still requires sign-in', () => {
  assert.match(workflow, /signedInRequiredForContinuedUse/);
  assert.match(workflow, /guestOneShotEnabled/);
  assert.match(workflow, /economicsLedgerRequired/);
  assert.match(workflow, /aiCoverageTarget/);
  assert.match(workflow, /1\.25/);
});

test('RT92 production release proves six recurring products plus Ultimate software-grant readiness', () => {
  assert.match(workflow, /api\/billing\/status/);
  for (const tier of ['plus','studio','power','max','pro','ultra']) assert.match(workflow, new RegExp(`configured\\.products\\.${tier}`));
  assert.match(workflow, /premium\.rollout/);
  assert.match(workflow, /premium\.checkoutActive/);
  assert.match(workflow, /premium\.schemaReady/);
  assert.match(workflow, /premium\.configured\.products\.ultimate/);
  assert.doesNotMatch(workflow, /premium\.configured\.products\.(?:pro|ultra)/);
  assert.match(workflow, /premium\.plans\[\]\.id/);
  assert.match(workflow, /ultimate/);
  assert.match(workflow, /production/);
});
