import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { BOARD_RELATIVE_PATH, REQUIRED_EXTERNAL_EVIDENCE_IDS, validateReleaseBoard } from '../../scripts/w260-release-board-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const board = JSON.parse(fs.readFileSync(path.join(root, BOARD_RELATIVE_PATH), 'utf8'));

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('W260 records an evidence-only NO-GO board without self-approval', () => {
  assert.deepEqual(validateReleaseBoard(board), []);
  assert.equal(board.verdict, 'NO_GO');
  assert.equal(board.authority.noSelfApproval, true);
  assert.equal(board.authority.implementationAuthorMayApprove, false);
  assert.deepEqual(board.requiredEvidence.map((entry) => entry.id), REQUIRED_EXTERNAL_EVIDENCE_IDS);
});

test('W260 rejects an invented GO verdict or unsupported external evidence', () => {
  const go = clone(board);
  go.verdict = 'GO';
  assert.match(validateReleaseBoard(go).join('\n'), /must remain NO_GO/i);

  const claimed = clone(board);
  claimed.requiredEvidence[0].status = 'passed';
  claimed.requiredEvidence[0].evidenceRefs = ['invented-proof.md'];
  assert.match(validateReleaseBoard(claimed).join('\n'), /cannot be marked passed|must not invent evidence/i);
});
