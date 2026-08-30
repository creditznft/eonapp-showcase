import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import {
  W393A_LEAN_HANDOVER_SCHEMA,
  W393A_REQUIRED_ABSENT_ACTIVE_PATHS,
  W393A_REQUIRED_ROOT_ASSETS,
  getW393ALeanHandoverStatus
} from '../../config/w393a-lean-handover-integrity-contract.mjs';
import { auditW393ALeanHandoverIntegrity } from '../../scripts/w393a-lean-handover-integrity-gate.mjs';

const root = process.cwd();

test('W393A proves the lean handover has deploy assets and no active retired value surface', () => {
  const report = auditW393ALeanHandoverIntegrity({ root });
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.schema, W393A_LEAN_HANDOVER_SCHEMA);
  assert.deepEqual(report.rootAssets.missing, []);
  assert.deepEqual(report.rootAssets.mirrorMismatches, []);
  assert.deepEqual(report.currentSourceBoundary.restoredActivePaths, []);
  for (const asset of W393A_REQUIRED_ROOT_ASSETS) assert.equal(fs.existsSync(path.join(root, asset)), true, asset);
  for (const retired of W393A_REQUIRED_ABSENT_ACTIVE_PATHS) assert.equal(fs.existsSync(path.join(root, retired)), false, retired);
});

test('W393A reports omitted historic evidence truthfully instead of claiming it was hash verified', () => {
  const status = getW393ALeanHandoverStatus();
  assert.equal(status.historicArchiveEvidence, 'not-packaged-in-lean-continuation');
  assert.equal(status.historicArchiveVerification, 'not-certified-by-this-handover');
  const report = auditW393ALeanHandoverIntegrity({ root });
  assert.equal(report.historicEvidence.verified, false);
  assert.match(report.historicEvidence.note, /does not certify/i);
});
