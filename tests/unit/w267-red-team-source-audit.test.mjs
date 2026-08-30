import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runW267RedTeamSourceAudit } from '../../scripts/w267-red-team-source-audit-gate.mjs';
import {
  W267_RED_TEAM_AUDIT_SCHEMA,
  W267_RED_TEAM_DECISION,
  W267_REQUIRED_EXTERNAL_LANES,
  validateW267RedTeamBoard
} from '../../config/w267-red-team-audit-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const boardPath = path.join(root, 'release-evidence/W267_RED_TEAM_AUDIT_2026-06-25/RED_TEAM_BOARD.json');

test('W267 source red-team gate keeps the present trust/privacy/action/chain boundaries aligned', () => {
  const report = runW267RedTeamSourceAudit(root);
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.boardDecision, W267_RED_TEAM_DECISION);
  assert.equal(report.w260Verdict, 'NO_GO');
});

test('W267 board refuses invented independent evidence or implementation-author self-closure', () => {
  const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));
  assert.equal(board.schema, W267_RED_TEAM_AUDIT_SCHEMA);
  const baseline = validateW267RedTeamBoard(board);
  assert.equal(baseline.ok, true, baseline.errors.join('\n'));
  const altered = structuredClone(board);
  altered.authority.implementationAuthorMayClose = true;
  altered.requiredExternalEvidence[0].status = 'passed';
  altered.requiredExternalEvidence[0].evidenceRefs = ['invented'];
  const result = validateW267RedTeamBoard(altered);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((entry) => /self-closure/i.test(entry)));
  assert.ok(result.errors.some((entry) => /cannot be marked passed/i.test(entry)));
});

test('W267 requires the complete independent evidence lane inventory', () => {
  const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));
  assert.deepEqual(board.requiredExternalEvidence.map((entry) => entry.id), W267_REQUIRED_EXTERNAL_LANES);
});
