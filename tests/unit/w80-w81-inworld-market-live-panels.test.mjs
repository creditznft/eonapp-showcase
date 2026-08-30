import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildInWorldUpgradeMarketRuntime,
  buildUpgradeStationPanelModel,
  scoreInWorldUpgradeMarket
} from '../../assets/js/realm3d/engine/EonCityUpgradeMarketRuntime.js';
import {
  buildLiveAppPanelCatalog,
  buildLiveAppPanelPolicy,
  scoreLiveAppPanelReadiness
} from '../../assets/js/realm3d/engine/EonCityLiveAppPanelRuntime.js';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import { buildWorkstationInteractionPlan, scoreWorkstationRuntime } from '../../assets/js/realm3d/engine/EonCityWorkstationRuntime.js';

test('W80 in-world market separates temporary ad/share passes from lifetime NFT passes', () => {
  const runtime = buildInWorldUpgradeMarketRuntime({ balance: { adCredits: 1, socialCredits: 1 } });
  assert.equal(runtime.privacy.noRawIpStorage, true);
  assert.equal(runtime.privacy.providerPostbackValueOnly, true);
  assert.ok(runtime.stations.length >= 6);
  for (const station of runtime.stations) {
    assert.match(station.copy.temporary, /temporary/i);
    assert.match(station.copy.lifetime, /accumulated verified value|purchase/i);
    assert.match(station.copy.noInvestment, /no .*investment|Utility access/i);
    assert.equal(station.privacy.rawIpStored, false);
    assert.equal(station.privacy.countryStored, false);
    assert.equal(station.privacy.providerValueOnly, true);
    assert.ok(station.paths.some((path) => path.method === 'ad' && path.access === 'temporary'));
    assert.ok(station.paths.some((path) => path.method === 'social' && path.access === 'temporary'));
    assert.ok(station.paths.some((path) => path.method === 'nft' && path.access === 'lifetime-nft'));
  }
  assert.ok(scoreInWorldUpgradeMarket(runtime).total >= 96);
});

test('W80 station model blocks one-share/one-ad lifetime wording', () => {
  const model = buildUpgradeStationPanelModel('realm_builder', { adCredits: 1, socialCredits: 1, verifiedAdEvents: 1, verifiedSocialActions: 1 });
  assert.equal(model.featureId, 'realm_builder');
  assert.equal(model.eligibility.lifetime.ok, false);
  assert.match(model.paths.find((path) => path.method === 'social').hardRule, /one share cannot mint/i);
  assert.match(model.paths.find((path) => path.method === 'nft').hardRule, /accumulated verified value|purchase/i);
});

test('W81 live app panels allow only safe routes and keep Vault/Admin/Profile/Billing as proxy/blocked', () => {
  const chat = buildLiveAppPanelPolicy({ id: 'screen-chat', label: 'Chat', route: '/chat.html' });
  const vault = buildLiveAppPanelPolicy({ id: 'screen-vault', label: 'Vault', route: '/vault.html' });
  const unsafe = buildLiveAppPanelPolicy({ id: 'evil', label: 'Unsafe', route: 'javascript:alert(1)' });
  assert.equal(chat.allowed, true);
  assert.match(chat.mode, /sandboxed-route-panel-ready/);
  assert.equal(vault.safeRoute, '/');
  assert.equal(vault.mode, 'safe-panel-proxy-only');
  assert.equal(unsafe.safeRoute, '/');
  assert.equal(unsafe.mode, 'blocked');
  assert.equal(chat.permissionPolicy.geolocation, 'disabled');
  assert.equal(chat.secretPolicy.neverRenderApiKeys, true);
});

test('W81 live app panel catalog has sandbox, keyboard exit, and secret protections', () => {
  const catalog = buildLiveAppPanelCatalog([
    { id: 'screen-chat', route: '/chat.html' },
    { id: 'screen-market', route: '/marketplace.html?tab=upgrades' },
    { id: 'screen-rewards', route: '/reward-access.html' },
    { id: 'screen-realm', route: '/realm.html' },
    { id: 'screen-creator', route: '/creator-studio.html' },
    { id: 'screen-tools', route: '/tools.html' }
  ]);
  const score = scoreLiveAppPanelReadiness(catalog);
  assert.equal(catalog.length, 6);
  assert.equal(score.checks.hasSandbox, true);
  assert.equal(score.checks.hasKeyboardExit, true);
  assert.equal(score.checks.protectsSecrets, true);
  assert.ok(score.total >= 98);
});

test('W80-W81 worlds include market runtime and live panel readiness scores', () => {
  for (const world of [buildEonCityVoxelWorld(), buildPrivateWorkstationVoxelWorld(), buildMyRealmVoxelWorld({ username: 'tester' })]) {
    assert.ok(world.upgradeMarketRuntime?.stations?.length >= 6, `${world.kind} missing upgrade stations`);
    assert.ok(world.upgradeMarketScore?.total >= 96, `${world.kind} upgrade market score too low`);
    assert.ok(world.livePanelCatalog?.length >= 6, `${world.kind} missing live panel catalog`);
    assert.ok(world.livePanelScore?.total >= 82, `${world.kind} live panel score too low`);
  }
});

test('W80-W81 workstation plan carries market and live panel scores', () => {
  const plan = buildWorkstationInteractionPlan({ quality: 'pro-city' });
  const score = scoreWorkstationRuntime(plan);
  assert.ok(plan.upgradeMarketRuntime.stations.length >= 6);
  assert.ok(plan.upgradeMarketScore.total >= 96);
  assert.ok(plan.livePanelCatalog.length >= 6);
  assert.ok(plan.livePanelScore.total >= 82);
  assert.equal(score.checks.hasUpgradeMarketRuntime, true);
  assert.equal(score.checks.hasLivePanelPolicy, true);
});
