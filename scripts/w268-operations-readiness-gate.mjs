#!/usr/bin/env node
/**
 * W268 — local-static operations-readiness gate.
 *
 * PASS validates the runbook and pending-evidence board. It does not prove
 * Preview/live deployment, PWA behavior, owner responsibility or recovery.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W268_LOCAL_STATIC_RUNBOOKS,
  W268_OPERATIONS_READINESS_SCHEMA,
  validateW268OperationsBoard
} from '../config/w268-operations-readiness-contract.mjs';
import { EON_INVITE_PROGRAM_ACTIVE } from '../config/eon-invite-architecture.mjs';
import { validateReleaseBoard } from './w260-release-board-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARD_PATH = 'release-evidence/W268_OPERATIONS_READINESS_2026-06-25/OPERATIONS_BOARD.json';
const RUNBOOK_PATH = 'docs/W268_OPERATIONS_READINESS_RUNBOOK_2026-06-25.md';
const W260_BOARD_PATH = 'release-evidence/W260_RELEASE_BOARD_2026-06-25/RELEASE_BOARD.json';

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function assertRule(errors, condition, message) {
  if (!condition) errors.push(message);
}

export function runW268OperationsReadinessGate(root = ROOT) {
  const errors = [];
  const board = JSON.parse(read(root, BOARD_PATH));
  const w260Board = JSON.parse(read(root, W260_BOARD_PATH));
  const runbook = read(root, RUNBOOK_PATH);
  const boardValidation = validateW268OperationsBoard(board);
  const w260Errors = validateReleaseBoard(w260Board);
  errors.push(...boardValidation.errors, ...w260Errors.map((entry) => `W260 dependency: ${entry}`));

  assertRule(errors, board.schema === W268_OPERATIONS_READINESS_SCHEMA, 'W268 board schema drifted.');
  assertRule(errors, board.localStaticRunbooks?.length === W268_LOCAL_STATIC_RUNBOOKS.length, 'W268 board lost a required runbook.');
  for (const heading of [
    '## 1. Incident triage and support routing',
    '## 2. Browser-local data export and restore',
    '## 3. PWA update and rollback',
    '## 4. Cloudflare Preview/live deployment rollback',
    '## 5. Provider change and BYOK incident',
    '## 6. Security disclosure and secret rotation boundary',
    '## Evidence rules and owners'
  ]) {
    assertRule(errors, runbook.includes(heading), `W268 runbook missing required section: ${heading}`);
  }
  assertRule(errors, /Do not clear browser-local data/i.test(runbook), 'W268 runbook must prohibit clearing local data as a rollback shortcut.');
  assertRule(errors, /read-only/i.test(runbook) && /wrangler pages deployment list/i.test(runbook), 'W268 runbook must include a read-only Cloudflare deployment review.');
  assertRule(errors, !/wrangler\s+(?:pages\s+deploy\b|deploy\b|d1\s+execute\s+[^\n]+(?:INSERT|UPDATE|DELETE|CREATE|DROP)\b)/i.test(runbook), 'W268 runbook must not contain destructive Cloudflare deploy or D1 mutation commands.');
  assertRule(errors, /No Lighthouse collection is required for this wave/i.test(runbook), 'W268 runbook must keep Lighthouse outside this operations wave.');
  assertRule(errors, EON_INVITE_PROGRAM_ACTIVE === false, 'Operations readiness must not activate referral behavior.');
  assertRule(errors, w260Board.verdict === 'NO_GO', 'W268 must retain W260 NO-GO status.');

  const report = {
    schema: 'eonapp.w268.operations-readiness-gate-report.v1',
    ok: errors.length === 0,
    generatedAt: new Date().toISOString(),
    interpretation: 'PASS validates runbook coverage and honest NOT_READY state. It is not evidence that any drill, deployment, PWA rollback, support response or data restore occurred.',
    localStaticRunbooks: W268_LOCAL_STATIC_RUNBOOKS,
    boardDecision: board.decision,
    w260Verdict: w260Board.verdict,
    externalDrillState: Object.fromEntries((board.requiredExternalDrills || []).map((entry) => [entry.id, entry.status])),
    errors
  };
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts', 'W268_OPERATIONS_READINESS_GATE_REPORT_2026-06-25.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

function main() {
  const report = runW268OperationsReadinessGate();
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    return 1;
  }
  console.log('W268 operations readiness: PASS (runbooks aligned; observed drills and owners remain pending).');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
