import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runW268OperationsReadinessGate } from '../../scripts/w268-operations-readiness-gate.mjs';
import {
  W268_OPERATIONS_DECISION,
  W268_OPERATIONS_READINESS_SCHEMA,
  W268_REQUIRED_EXTERNAL_DRILLS,
  validateW268OperationsBoard
} from '../../config/w268-operations-readiness-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const boardPath = path.join(root, 'release-evidence/W268_OPERATIONS_READINESS_2026-06-25/OPERATIONS_BOARD.json');

test('W268 operations gate keeps honest not-ready state and W260 NO-GO dependency', () => {
  const report = runW268OperationsReadinessGate(root);
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.boardDecision, W268_OPERATIONS_DECISION);
  assert.equal(report.w260Verdict, 'NO_GO');
});

test('W268 board rejects fabricated owner/drill closure', () => {
  const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));
  assert.equal(board.schema, W268_OPERATIONS_READINESS_SCHEMA);
  const baseline = validateW268OperationsBoard(board);
  assert.equal(baseline.ok, true, baseline.errors.join('\n'));
  const altered = structuredClone(board);
  altered.authority.releaseOwner.status = 'assigned';
  altered.requiredExternalDrills[0].status = 'passed';
  altered.requiredExternalDrills[0].evidenceRefs = ['invented'];
  const result = validateW268OperationsBoard(altered);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((entry) => /releaseOwner/i.test(entry)));
  assert.ok(result.errors.some((entry) => /cannot be marked passed/i.test(entry)));
});

test('W268 requires the complete observed-drill inventory', () => {
  const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));
  assert.deepEqual(board.requiredExternalDrills.map((entry) => entry.id), W268_REQUIRED_EXTERNAL_DRILLS);
});
