import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EONAPP_W721_PRODUCT_RESET_CONTRACT, validateW721ProductResetContract } from '../../config/w721-product-reset-contract.mjs';

const authority = JSON.parse(fs.readFileSync(new URL('../../config/w720-source-authority.json', import.meta.url), 'utf8'));

test('W720 records the exact W719.21 source authority', () => {
  assert.equal(authority.sourceArchive.sha256, '5aa0554ca6edd0b9ac8a64d51f25bf47a20b1458ecaa08e420dca2ee3f9655b0');
  assert.equal(authority.sourceArchive.reportedLiveCommit, 'cc3e698a8468ec447bf8eab7dc85875318fa34cd');
  assert.equal(authority.sourceArchive.reportedGitTree, '1331baf4149f3f42a2b70d5bef1618897fbcde7b');
  assert.equal(authority.sourceArchive.trackedEntryCount, 5163);
  assert.equal(authority.deploymentBoundary.deploymentAllowedBeforeW736, false);
});

test('W721 approves a full-screen 2D command surface and preserves City 3D Nexus assets', () => {
  assert.equal(validateW721ProductResetContract().ok, true);
  assert.equal(EONAPP_W721_PRODUCT_RESET_CONTRACT.frontend.commandSurface, 'full-screen-2d');
  assert.equal(EONAPP_W721_PRODUCT_RESET_CONTRACT.city.threeDimensionalNexusAssetsPreserved, true);
  assert.equal(EONAPP_W721_PRODUCT_RESET_CONTRACT.city.openWorldLaunchClaim, false);
});
