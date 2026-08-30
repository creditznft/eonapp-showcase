import test from 'node:test';
import assert from 'node:assert/strict';
import { buildNftWorldClassAudit } from '../../assets/js/utils/nft-market-quality-audit.js';
import { buildLootboxOpeningResult, scoreLootboxOpeningUi } from '../../assets/js/utils/lootbox-opening-ui.js';
import { buildLootboxNftEnvelope } from '../../assets/js/utils/lootbox-marketplace.js';
import { buildUnifiedAiUpgradeMarketUx, scoreUnifiedAiUpgradeMarketUx } from '../../assets/js/utils/ai-upgrade-market-ux.js';
import { buildNftAssetBackupManifest, scoreNftAssetBackupManifest } from '../../assets/js/utils/nft-asset-backup.js';
import { buildEonCityLootboxRewardRuntime, scoreEonCityLootboxRewardRuntime } from '../../assets/js/realm3d/engine/EonCityLootboxRewardRuntime.js';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';

test('W87 NFT and lootbox visuals remain market-ready and generated', () => {
  const audit = buildNftWorldClassAudit({ includeLootboxes: true });
  assert.ok(audit.averageVisualScore >= 86);
  assert.ok(audit.minLootboxScore >= 90);
  assert.ok(audit.categoryFamilies.includes('lootbox'));
});

test('W88 lootbox opening UI consumes box and gives claim summary with reduced motion', () => {
  const lootbox = buildLootboxNftEnvelope({ tier: 'genesis', seed: 'w88-test' });
  const opened = buildLootboxOpeningResult(lootbox, { openSeed: 'w88-open', userInventory: { ownedFeatureIds: ['ai_robot_core'] }, reducedMotion: true });
  assert.equal(opened.result.ok, true);
  assert.equal(opened.result.lootbox.status, 'consumed');
  assert.equal(opened.result.lootbox.removedFromMarketInventory, true);
  assert.ok(opened.claimSummary.rewards.length >= 1);
  assert.match(opened.claimSummary.userCopy, /backup/i);
  assert.ok(scoreLootboxOpeningUi().total >= 95);
});

test('W89 AI Upgrade Market is the single public market with lootboxes and utility NFTs', () => {
  const ux = buildUnifiedAiUpgradeMarketUx();
  assert.equal(ux.title, 'AI Upgrade Market');
  assert.match(ux.antiConfusionCopy, /unified/i);
  assert.ok(ux.rows.some((row) => row.kind === 'lootbox-nft'));
  assert.ok(ux.rows.some((row) => row.kind === 'utility-nft'));
  assert.ok(scoreUnifiedAiUpgradeMarketUx(ux).total >= 95);
});

test('W90 backups include generated NFT and lootbox images before minting/Arweave', () => {
  const lootbox = buildLootboxNftEnvelope({ tier: 'neon', seed: 'backup-test' });
  const manifest = buildNftAssetBackupManifest({
    accountId: 'unit',
    ownedNfts: [{ id: 'nft-a', title: 'Vault Guardian Pro', collectionType: 'operator', featureId: 'vault_pro', rarity: 'epic' }],
    ownedLootboxes: [lootbox]
  });
  assert.equal(manifest.counts.total, 2);
  assert.ok(manifest.assets.utilityNfts[0].imageDataUri || manifest.assets.utilityNfts[0].svg);
  assert.ok(manifest.assets.lootboxes[0].imageDataUri);
  assert.equal(manifest.assets.lootboxes[0].canMintLootboxToMainnet, false);
  assert.ok(scoreNftAssetBackupManifest().total >= 95);
});

test('W90 EON City and user realms expose lootbox reward stations', () => {
  const runtime = buildEonCityLootboxRewardRuntime({ worldKind: 'eon-city' });
  assert.ok(runtime.stations.some((station) => station.action === 'open-with-animation'));
  assert.ok(scoreEonCityLootboxRewardRuntime(runtime).total >= 95);
  const city = buildEonCityVoxelWorld();
  const realm = buildMyRealmVoxelWorld({ username: 'tester', seed: 'realm-lootbox' });
  assert.ok(city.lootboxRewardRuntime.stations.length >= 4);
  assert.ok(realm.lootboxRewardRuntime.stations.length >= 4);
  assert.ok(city.blocks.some((block) => block?.lootbox === true));
});

test('W90 language packs cover market, lootbox, EONBot and backup copy for all 11 languages', async () => {
  globalThis.window = globalThis.window || { addEventListener() {}, dispatchEvent() {}, location: { pathname: '/' } };
  globalThis.document = globalThis.document || { documentElement: {}, dispatchEvent() {}, addEventListener() {} };
  if (!globalThis.navigator || !globalThis.navigator.language) Object.defineProperty(globalThis, 'navigator', { value: { language: 'en-US' }, configurable: true });
  globalThis.localStorage = globalThis.localStorage || { _data: new Map(), getItem(k) { return this._data.get(k) || null; }, setItem(k, v) { this._data.set(k, String(v)); }, removeItem(k) { this._data.delete(k); } };
  const { verifyLanguagePackCompleteness, verifyLanguageSwitchRoundTrip, scoreLanguageStabilityGate } = await import('../../assets/js/utils/language-stability-gate.js');
  const completeness = verifyLanguagePackCompleteness();
  assert.equal(completeness.complete, true);
  assert.equal(completeness.languages.length, 11);
  assert.equal(completeness.missingTotal, 0);
  assert.equal(verifyLanguageSwitchRoundTrip({ language: 'hi' }).stable, true);
  assert.ok(scoreLanguageStabilityGate().total >= 95);
});
