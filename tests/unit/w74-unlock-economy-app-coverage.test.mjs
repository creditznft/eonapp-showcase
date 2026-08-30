import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

import {
  buildFeatureUnlockMenu,
  buildTemporaryUnlockRecord,
  canAccessFeature,
  getActiveTemporaryUnlock
} from '../../assets/js/utils/feature-unlock-economy.js';
import {
  FEATURE_SURFACE_UNLOCKS,
  getFeatureGateCoverage,
  resolveFeatureUnlockForPath
} from '../../assets/js/utils/feature-gate.js';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

test('W74 app feature gate covers major monetizable surfaces', () => {
  const coverage = getFeatureGateCoverage();
  assert.equal(coverage.schema, 'eon.feature-gate.w74.v1');
  assert.ok(coverage.routes >= 14);
  const paths = FEATURE_SURFACE_UNLOCKS.map((entry) => entry.path);
  for (const required of ['/workbench.html', '/creator-studio.html', '/code-maker.html', '/video-editor.html', '/music-studio.html', '/tools.html', '/trade.html', '/reward-access.html', '/subscription.html', '/realmworld.html']) {
    assert.ok(paths.includes(required), `${required} should have a contextual feature unlock`);
  }
  assert.ok(coverage.featureIds.includes('private_workstation'));
  assert.ok(coverage.featureIds.includes('workbench_pro'));
  assert.ok(coverage.featureIds.includes('video_studio_pro'));
});

test('W74 route resolver maps app pages to distinct fair unlock features', () => {
  assert.equal(resolveFeatureUnlockForPath('/workbench.html')?.featureId, 'workbench_pro');
  assert.equal(resolveFeatureUnlockForPath('/trade')?.featureId, 'trade_research');
  assert.equal(resolveFeatureUnlockForPath('/reward-access.html')?.featureId, 'reward_boosts');
  assert.equal(resolveFeatureUnlockForPath('/realmworld.html?from=game')?.featureId, 'private_workstation');
});

test('W74 temporary pass can activate feature access without lifetime ownership', () => {
  const record = buildTemporaryUnlockRecord({ featureId: 'code_maker_pro', method: 'ad', now: 1_000_000 });
  const balance = { temporaryUnlocks: { code_maker_pro: record }, lifetimePasses: {} };
  const access = canAccessFeature({ featureId: 'code_maker_pro', balance, activePlanId: 'free', now: 1_000_100 });
  assert.equal(access.ok, true);
  assert.equal(access.access, 'temporary');
  assert.equal(getActiveTemporaryUnlock(balance, 'code_maker_pro', 1_000_100)?.featureId, 'code_maker_pro');
});

test('W74 expanded catalog keeps lifetime NFT passes expensive across new features', () => {
  for (const featureId of ['ai_cockpit_pro', 'workbench_pro', 'code_maker_pro', 'video_studio_pro', 'music_studio_pro', 'browser_automation', 'tool_exports', 'reward_boosts']) {
    const menu = buildFeatureUnlockMenu(featureId);
    const lifetime = menu.options.find((option) => option.mode === 'lifetime-utility-nft');
    const temp = menu.options.find((option) => option.mode === 'temporary-ad');
    assert.ok(lifetime.totalCreditsRequired >= temp.creditsRequired * 50, `${featureId} lifetime pass must require accumulated value`);
    assert.equal(menu.policy.providerValueOnlyForAdCredits, true);
    assert.equal(menu.policy.noRawIpOrCountryStorage, true);
  }
});

test('W74 site shell loads contextual feature gate after signed-share attribution', () => {
  const siteShell = read('assets/js/utils/site-shell.js');
  assert.match(siteShell, /feature-gate\.js/);
  assert.match(siteShell, /mountContextualFeatureGate/);
  assert.match(siteShell, /installFeatureGateClickHandlers/);
});
