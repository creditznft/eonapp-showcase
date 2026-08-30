import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { TIER_0_PRIMARY_IDS, TIER_3_RETIRED_ROOT_DOCUMENTS } from '../../config/route-tiering.mjs';
import { auditR3F2RouteTiering } from '../../scripts/r3-f2-route-tiering-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('R3-F2 keeps the four-route work loop canonical and archives Tier-3 root documents', () => {
  assert.deepEqual(TIER_0_PRIMARY_IDS, ['chat', 'projects', 'workspace', 'eoncity']);
  const report = auditR3F2RouteTiering();
  assert.equal(report.ok, true, report.errors.join('; '));
  assert.equal(report.tier3Archive.entries, TIER_3_RETIRED_ROOT_DOCUMENTS.length);
  for (const file of TIER_3_RETIRED_ROOT_DOCUMENTS) {
    assert.equal(fs.existsSync(path.join(root, file)), false, `${file} must not return to the active source root`);
  }
});
