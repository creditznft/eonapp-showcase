import assert from 'node:assert/strict';
import test from 'node:test';
import { validateW451LegacyInventoryContract } from '../../config/w451-legacy-source-inventory-contract.mjs';
import { buildW451LegacySourceInventory } from '../../scripts/w451-legacy-source-inventory.mjs';

test('W451 classifies every source file without placing historical material in the active graph', () => {
  assert.deepEqual(validateW451LegacyInventoryContract(), []);
  const report = buildW451LegacySourceInventory();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.equal(report.activeModuleCount > 0, true);
  assert.equal(report.totalTrackedFiles > report.activeModuleCount, true);
  assert.equal(report.classifications.historical > 0, true);
  assert.equal(report.records.some((record) => record.classification === 'active-runtime' && record.file.startsWith('archive/')), false);
});
