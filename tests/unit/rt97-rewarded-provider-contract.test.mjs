import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canRewardedProviderMint, getRewardedProviderAdapter, validateRewardedProviderContract } from '../../config/rt97-rewarded-provider-contract.mjs';

test('RT97 rewarded adapters default to no client mint and no permanent value on weak proof', () => {
  assert.equal(validateRewardedProviderContract().ok, true);
  const exo = getRewardedProviderAdapter('exoclick');
  assert.equal(exo.clientCompletionCanMint, false);
  assert.equal(exo.providerSignedCompletion, false);
  assert.equal(exo.permanentValueAllowed, false);
  assert.equal(exo.rewardClass, 'bounded-sponsor-unlock');
  assert.equal(canRewardedProviderMint('exoclick', 'bounded-sponsor-unlock').ok, true);
  assert.equal(canRewardedProviderMint('exoclick', 'permanent-key').ok, false);
  assert.equal(canRewardedProviderMint('venatus', 'bounded-sponsor-unlock').ok, false);
});

test('RT97 rewarded server rechecks adapter mint authority immediately before Sponsor Key issue', () => {
  const source = readFileSync(new URL('../../functions/_shared/eon-rewarded-sponsor-runtime.js', import.meta.url), 'utf8');
  const authority = source.indexOf('canRewardedProviderMint(config.provider, config.rewardClass)');
  const grant = source.indexOf('issueSponsorEonKey({ database, accountId');
  assert.ok(authority > 0 && grant > authority);
  assert.match(source, /reward_provider_mint_not_authorized/);
});


test('RT97 rewarded telemetry distinguishes player-observed fill from verified completion and provider-reconciled revenue', () => {
  const trackingRoute = readFileSync(new URL('../../functions/api/monetization/rewarded/event.js', import.meta.url), 'utf8');
  const growthAuthority = readFileSync(new URL('../../functions/_shared/eon-growth-attribution.js', import.meta.url), 'utf8');
  const reconciliation = readFileSync(new URL('../../functions/_shared/eon-profitability-reconciliation.js', import.meta.url), 'utf8');
  assert.match(trackingRoute, /event === 'start'.*rewarded_fill_observed/s);
  assert.match(trackingRoute, /event === 'complete'.*sponsor_key_granted.*rewarded_completion_verified.*rewarded_reward_granted/s);
  assert.match(growthAuthority, /'rewarded_fill_observed'/);
  assert.match(reconciliation, /provider === 'exoclick'/);
  assert.match(reconciliation, /revenueReconciled = \['exoclick', 'adsense', 'vexrail', 'vast', 'subscription'\]/);
  assert.doesNotMatch(trackingRoute, /RevenueMicros|revenue_micros/);
});
