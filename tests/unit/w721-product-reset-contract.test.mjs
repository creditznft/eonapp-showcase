import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EONAPP_W721_PRODUCT_RESET_CONTRACT,
  validateW721ProductResetContract
} from '../../config/w721-product-reset-contract.mjs';
import { inspectW721ProductReset } from '../../scripts/w721-product-reset-gate.mjs';

const json = (relative) => JSON.parse(fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8'));

test('W721 fixes the approved Hybrid Command Hub product model', () => {
  const contract = EONAPP_W721_PRODUCT_RESET_CONTRACT;
  assert.equal(validateW721ProductResetContract().ok, true);
  assert.equal(contract.strategy, 'hybrid-command-hub');
  assert.equal(contract.frontend.commandSurface, 'full-screen-2d');
  assert.deepEqual([...contract.frontend.primaryActions], ['continue', 'new', 'ask-eonbot', 'share']);
  assert.equal(contract.city.threeDimensionalNexusAssetsPreserved, true);
  assert.equal(contract.city.stationsOpenSharedTwoDimensionalPanels, true);
  assert.equal(contract.city.openWorldLaunchClaim, false);
  assert.equal(contract.realm.mainNavigationVisible, false);
  assert.deepEqual([...contract.themes], ['graphite', 'obsidian', 'ember']);
});

test('W721 preserves rejected launch assertions as non-certifying diagnostics', () => {
  const archive = json('config/archive/w721-superseded-launch-tests.json');
  const manifest = json('config/w624d-current-unit-test-manifest.json');
  assert.equal(archive.certifying, false);
  assert.equal(archive.testFiles.length, manifest.supersededLaunchTestCount);
  assert.equal(archive.testFiles.some((file) => /expanse|district-belt|living-nexus/.test(file)), true);
  assert.equal(archive.testFiles.every((file) => !manifest.testFiles.includes(file)), true);
});

test('W721 source gate protects the reset without network or deployment work', () => {
  const result = inspectW721ProductReset();
  assert.equal(result.ok, true, result.checks.filter((row) => !row.pass).map((row) => `${row.id}: ${row.detail}`).join('\n'));
  assert.equal(result.performsNetworkRequest, false);
  assert.equal(result.mutatesProduction, false);
});
