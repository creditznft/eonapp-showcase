#!/usr/bin/env node
/** W260 — release-board integrity gate. It validates the current NO-GO record; it never grants release approval. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BOARD_RELATIVE_PATH = 'release-evidence/W260_RELEASE_BOARD_2026-06-25/RELEASE_BOARD.json';
export const REQUIRED_EXTERNAL_EVIDENCE_IDS = Object.freeze([
  'w259-device-matrix',
  'preview-live-browser-proof',
  'pwa-update-rollback-drill',
  'git-history-deployment-identity-review',
  'data-preservation-restore-proof',
  'accessibility-and-fallback-review',
  'security-environment-and-legal-review',
  'release-support-rollback-signoff'
]);
const PENDING_STATUSES = new Set(['not-collected', 'not-available-in-freeze', 'blocked']);

export function validateReleaseBoard(board) {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  assert(board && typeof board === 'object', 'W260 board must be an object.');
  if (!board || typeof board !== 'object') return errors;
  assert(board.schema === 'eonapp.w260.release-board.v1', 'W260 board schema must be eonapp.w260.release-board.v1.');
  assert(board.releaseScope === 'public-release-certification', 'W260 scope must remain public-release-certification.');
  assert(board.verdict === 'NO_GO', 'W260 must remain NO_GO until independent evidence and sign-offs exist.');
  assert(board.authority?.noSelfApproval === true, 'W260 must explicitly prevent self-approval.');
  assert(board.authority?.implementationAuthorMayApprove === false, 'Implementation author approval must remain disabled.');
  for (const role of ['releaseOwner', 'supportOwner', 'rollbackOwner', 'independentReviewer']) {
    assert(['unassigned', 'pending-review'].includes(board.authority?.[role]?.status), `W260 ${role} must remain unassigned or pending-review while NO_GO.`);
  }
  const evidence = Array.isArray(board.requiredEvidence) ? board.requiredEvidence : [];
  assert(evidence.length === REQUIRED_EXTERNAL_EVIDENCE_IDS.length, 'W260 must enumerate every required external evidence lane exactly once.');
  const byId = new Map(evidence.map((entry) => [entry?.id, entry]));
  for (const id of REQUIRED_EXTERNAL_EVIDENCE_IDS) {
    const entry = byId.get(id);
    assert(entry, `W260 required evidence is missing: ${id}.`);
    if (!entry) continue;
    assert(entry.required === true, `W260 required evidence must stay required: ${id}.`);
    assert(PENDING_STATUSES.has(entry.status), `W260 ${id} cannot be marked passed without a separate, reviewed board update.`);
    assert(Array.isArray(entry.evidenceRefs) && entry.evidenceRefs.length === 0, `W260 ${id} must not invent evidence references while pending.`);
  }
  assert(board.sourceFreeze?.localStaticReplay?.status === 'passed', 'W260 must retain the verified local-static baseline as context, not as release evidence.');
  assert(/not browser, device, PWA update\/rollback/i.test(board.sourceFreeze?.localStaticReplay?.limitation || ''), 'W260 must state that local-static evidence is not external release proof.');
  assert(board.chainSafety?.c0iStatus === 'exit-blocked', 'W260 must retain C0-I exit-blocked status.');
  assert(board.chainSafety?.browserChainRuntime === 'disabled', 'W260 must keep browser chain runtime disabled.');
  assert(Array.isArray(board.prohibitedClaims) && board.prohibitedClaims.includes('launch ready'), 'W260 must prohibit unsupported launch-ready claims.');
  return errors;
}

function readBoard() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, BOARD_RELATIVE_PATH), 'utf8'));
}

export function runReleaseBoardGate() {
  const board = readBoard();
  const errors = validateReleaseBoard(board);
  const report = {
    schema: 'eonapp.w260.release-board-gate.v1',
    ok: errors.length === 0,
    generatedAt: new Date().toISOString(),
    verdict: board?.verdict || null,
    interpretation: 'PASS means the W260 board accurately holds a NO-GO state. It does not certify a Preview or public release.',
    requiredEvidenceStatuses: Object.fromEntries((board?.requiredEvidence || []).map((entry) => [entry.id, entry.status])),
    errors
  };
  fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'artifacts', 'W260_RELEASE_BOARD_GATE_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

const invokedAsScript = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  const report = runReleaseBoardGate();
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  } else {
    console.log('W260 release-board gate: PASS (NO-GO accurately preserved; no launch approval granted).');
  }
}
