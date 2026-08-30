import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { W289_W290_EXTERNAL_EVIDENCE_BOARD, validateW289W290ExternalEvidenceBoard } from '../../config/w289-w290-external-evidence-board-contract.mjs';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W289/W290 remains external-evidence blocked with no source-only beta/final certification shortcut', () => {
  assert.equal(validateW289W290ExternalEvidenceBoard().ok, true);
  assert.equal(W289_W290_EXTERNAL_EVIDENCE_BOARD.beta.enabled, false);
  assert.equal(W289_W290_EXTERNAL_EVIDENCE_BOARD.finalCertification.enabled, false);
  assert.equal(W289_W290_EXTERNAL_EVIDENCE_BOARD.cloudflare.mutate, false);
  assert.equal(W289_W290_EXTERNAL_EVIDENCE_BOARD.cloudflare.inspectRows, false);
});

test('W289/W290 evidence packet contains a valid normal-browser/device/restore path and a read-only Cloudflare prompt', () => {
  const protocol = read('docs/W282_W259_W266_W276_EXTERNAL_EVIDENCE_PROTOCOL_2026-06-25.md');
  const cloudflare = read('docs/CLOUDFLARE_AI_W283_READ_ONLY_EVIDENCE_PROMPT_2026-06-25.md');
  const docket = read('docs/W268_W278_W279_EXTERNAL_REVIEW_DOCKET_2026-06-25.md');
  assert.match(protocol, /lighthouse:desktop/);
  assert.match(protocol, /qa:w266-visual-proof-lab:capture/);
  assert.match(protocol, /same browser origin/);
  assert.match(cloudflare, /STRICT READ-ONLY \/ NO-MUTATION mode/);
  assert.match(cloudflare, /sqlite_master/);
  assert.match(cloudflare, /Do not create, edit, delete, deploy, rollback/);
  assert.match(docket, /UNASSIGNED/);
  assert.match(docket, /qualified counsel/i);
  assert.match(docket, /independent reviewer/i);
});
