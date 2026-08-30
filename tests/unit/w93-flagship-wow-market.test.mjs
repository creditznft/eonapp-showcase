import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';
import { buildUnifiedAiUpgradeMarketUx, scoreUnifiedAiUpgradeMarketUx } from '../../assets/js/utils/ai-upgrade-market-ux.js';
import { buildFlagshipNftQaReport } from '../../assets/js/utils/nft-flagship-market-preview.js';

test('W93 EON City and generated realms reach flagship wow score with interactive stations', () => {
  const city = buildEonCityVoxelWorld();
  const workstation = buildPrivateWorkstationVoxelWorld({ owner: 'qa-owner' });
  const realm = buildMyRealmVoxelWorld({ username: 'qa-user', seed: 'w93' });

  assert.equal(city.flagshipWowScore.grade, 'flagship-wow-ready');
  assert.equal(workstation.flagshipWowScore.grade, 'flagship-wow-ready');
  assert.equal(realm.flagshipWowScore.grade, 'flagship-wow-ready');
  assert.ok(city.flagshipWowScore.total >= 96, `city score ${city.flagshipWowScore.total}`);
  assert.ok(workstation.flagshipWowScore.total >= 96, `workstation score ${workstation.flagshipWowScore.total}`);
  assert.ok(realm.flagshipWowScore.total >= 96, `realm score ${realm.flagshipWowScore.total}`);
  assert.ok(city.flagshipWowScore.metrics.lootbox >= 34, 'EON City includes visible lootbox show detail');
  assert.ok(realm.flagshipWowScore.metrics.lootbox >= 16, 'Generated realm includes visible lootbox rewards');
  assert.ok(city.flagshipDeviceShine.deviceTargets.length >= 4, 'device shine matrix exists');
});

test('W93 new-user AI Upgrade Market autopopulates generated NFTs and sealed lootboxes', () => {
  const ux = buildUnifiedAiUpgradeMarketUx();
  const score = scoreUnifiedAiUpgradeMarketUx(ux);
  const preview = ux.newUserPreview;
  assert.equal(score.grade, 'unified-market-ux-ready');
  assert.equal(preview.score.grade, 'new-user-market-flagship-ready');
  assert.ok(preview.rows.filter((row) => row.productKind === 'utility-nft').length >= 5);
  assert.ok(preview.rows.filter((row) => row.productKind === 'lootbox-nft').length >= 3);
  assert.ok(preview.score.minScore >= 88, `min preview score ${preview.score.minScore}`);
  assert.ok(preview.score.averageScore >= 92, `avg preview score ${preview.score.averageScore}`);
  assert.equal(preview.rows.every((row) => row.generatedForNewUser && row.backedUpByNftAssetBackup), true);
  assert.equal(new Set(preview.rows.map((row) => row.visualFingerprint)).size, preview.rows.length);
});

test('W93 NFT visual QA uses export-digest uniqueness and browser review remains required', () => {
  const qa = buildFlagshipNftQaReport({ count: 64 });
  assert.equal(qa.launchGate.pass, true);
  assert.equal(qa.brokenExportRate, 0);
  assert.equal(qa.lowQualityRate, 0);
  assert.equal(qa.adjustedDiversityRisk, 0);
  assert.match(qa.launchGate.note, /browser screenshots/i);
});
