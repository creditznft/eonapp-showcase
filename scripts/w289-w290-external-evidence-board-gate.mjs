#!/usr/bin/env node
/** W289/W290 external evidence board source gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W289_W290_EXTERNAL_EVIDENCE_BOARD, validateW289W290ExternalEvidenceBoard } from '../config/w289-w290-external-evidence-board-contract.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const REQUIRED_DOCS = [
  'docs/W282_W259_W266_W276_EXTERNAL_EVIDENCE_PROTOCOL_2026-06-25.md',
  'docs/CLOUDFLARE_AI_W283_READ_ONLY_EVIDENCE_PROMPT_2026-06-25.md',
  'docs/W268_W278_W279_EXTERNAL_REVIEW_DOCKET_2026-06-25.md',
  'docs/W289_W290_FINAL_RECERTIFICATION_BOARD_2026-06-25.md'
];
export function runW289W290ExternalEvidenceBoardGate(root = ROOT) {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  errors.push(...validateW289W290ExternalEvidenceBoard().errors);
  REQUIRED_DOCS.forEach((file) => assert(fs.existsSync(path.join(root, file)), `Missing external evidence document: ${file}`));
  const protocol = read(REQUIRED_DOCS[0]);
  const cloudflare = read(REQUIRED_DOCS[1]);
  const docket = read(REQUIRED_DOCS[2]);
  const board = read(REQUIRED_DOCS[3]);
  const packageJson = JSON.parse(read('package.json'));
  assert(/npm run lighthouse:desktop/.test(protocol) && /npm run lighthouse:mobile/.test(protocol), 'W282 protocol must use the repository Lighthouse commands.');
  assert(/W259\s*\/\s*W266/.test(protocol) && /W276/.test(protocol), 'Protocol must cover visual/device and observed restore evidence.');
  assert(/STRICT READ-ONLY \/ NO-MUTATION mode/.test(cloudflare) && /sqlite_master/.test(cloudflare), 'Cloudflare prompt must be schema-only read-only evidence.');
  assert(/Do not create, edit, delete, deploy, rollback/.test(cloudflare), 'Cloudflare prompt must explicitly prohibit mutations.');
  assert(/UNASSIGNED/.test(docket) && /qualified counsel/i.test(docket) && /independent reviewer/i.test(docket), 'Review docket must not invent owners, legal approval, or independent security review.');
  assert(/EXTERNAL_EVIDENCE_REQUIRED_BETA_BLOCKED/.test(board) && /W290/.test(board), 'Board must keep beta/final certification blocked.');
  assert(packageJson.scripts?.['qa:w289-w290-external-evidence-board'], 'package.json is missing the W289/W290 board script.');
  const report = { schema: 'eonapp.w289-w290.external-evidence-board-gate-report.v1', wave: 'W289-W290-A0', ok: errors.length === 0, interpretation: 'PASS proves that the source package has a strict external-evidence protocol. It does not collect evidence, approve beta, approve referral activation, or approve final certification.', errors };
  const artifactDir = path.join(root, 'artifacts', 'w289-w290-external-evidence-board-gate');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW289W290ExternalEvidenceBoardGate();
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}
