#!/usr/bin/env node
/**
 * W267 — local-static red-team source audit.
 *
 * This gate deliberately does not execute remote requests, browser actions,
 * Cloudflare operations or independent security review. PASS means source
 * safety boundaries and the honest pending-evidence board are aligned.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W267_LOCAL_STATIC_LANES,
  W267_RED_TEAM_AUDIT_SCHEMA,
  validateW267RedTeamBoard
} from '../config/w267-red-team-audit-contract.mjs';
import { EON_INVITE_PROGRAM_ACTIVE, EON_INVITE_PROGRAM_MODE } from '../config/eon-invite-architecture.mjs';
import { ACCESS_MILESTONE_PILOT_MODE, evaluateAccessMilestonePilotGate } from '../config/access-milestone-pilot-gate.mjs';
import { validateReleaseBoard } from './w260-release-board-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARD_PATH = 'release-evidence/W267_RED_TEAM_AUDIT_2026-06-25/RED_TEAM_BOARD.json';
const W260_BOARD_PATH = 'release-evidence/W260_RELEASE_BOARD_2026-06-25/RELEASE_BOARD.json';

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function assertRule(errors, condition, message) {
  if (!condition) errors.push(message);
}

function noRemoteEffectPattern(source = '') {
  return !/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/.test(source);
}

export function runW267RedTeamSourceAudit(root = ROOT) {
  const errors = [];
  const board = JSON.parse(read(root, BOARD_PATH));
  const w260Board = JSON.parse(read(root, W260_BOARD_PATH));
  const boardValidation = validateW267RedTeamBoard(board);
  const w260Errors = validateReleaseBoard(w260Board);
  errors.push(...boardValidation.errors, ...w260Errors.map((entry) => `W260 dependency: ${entry}`));

  const truth = read(root, 'assets/js/chat/eonbot-truth-contract.js');
  const proposals = read(root, 'assets/js/chat/eonbot-action-proposals.js');
  const receipts = read(root, 'assets/js/chat/eonbot-action-receipts.js');
  const telemetry = read(root, 'assets/js/utils/privacy-telemetry.js');
  const referral = read(root, 'assets/js/utils/referral-par.js');
  const headers = read(root, '_headers');
  const firewall = read(root, 'scripts/w247-economic-commercial-firewall-gate.mjs');

  assertRule(errors, board.schema === W267_RED_TEAM_AUDIT_SCHEMA, 'W267 board schema drifted.');
  assertRule(errors, board.localStaticLanes?.length === W267_LOCAL_STATIC_LANES.length, 'W267 board lost a source audit lane.');

  // Trust and secret protection.
  assertRule(errors, /containsSensitiveCredentialRequest/.test(truth), 'EONBOT truth contract lacks secret-request detection.');
  assertRule(errors, /never asks for, echoes, stores or exposes secrets/i.test(truth), 'EONBOT must preserve its explicit secret-protection truth statement.');
  assertRule(errors, /containsDisallowedFinancialExecutionRequest/.test(truth), 'EONBOT truth contract lacks live-financial-execution blocking.');
  assertRule(errors, /does not place (?:live )?(?:trades|orders), transfer funds, withdraw money/i.test(truth), 'EONBOT must preserve explicit live-financial-action denial copy.');

  // Approval-first action path. Approving a proposal may navigate only; it must not perform a remote effect.
  assertRule(errors, /invalid-or-unguarded-command/.test(proposals), 'Action proposals must reject unguarded commands.');
  assertRule(errors, /externalEffect:\s*false/.test(proposals), 'Action proposals must remain explicitly non-external.');
  assertRule(errors, /navigation:\s*Object\.freeze/.test(proposals), 'Action proposal approval must return a navigation handoff.');
  assertRule(errors, noRemoteEffectPattern(proposals), 'Action proposal module contains a remote-effect primitive.');
  assertRule(errors, /externalEffect:\s*false/.test(receipts), 'Action receipts must retain explicit non-external state.');
  assertRule(errors, noRemoteEffectPattern(receipts), 'Action receipt module contains a remote-effect primitive.');

  // Local-first diagnostic hygiene. This module must redact and must not ship a sender.
  assertRule(errors, /redactTelemetryText/.test(telemetry) && /SENSITIVE_KEY_PATTERN/.test(telemetry), 'Privacy telemetry must retain sensitive-value redaction.');
  assertRule(errors, noRemoteEffectPattern(telemetry), 'Privacy telemetry module contains a remote diagnostics sender.');
  assertRule(errors, /Content-Security-Policy:/i.test(headers) && /form-action 'self'/.test(headers), 'Headers must retain a restrictive form-action policy.');

  // Chain, commerce and incentive protection.
  assertRule(errors, /browserChainRuntime.*disabled/.test(JSON.stringify(w260Board)), 'W260 must retain disabled browser chain runtime.');
  assertRule(errors, /no value-producing public control/i.test(firewall), 'W247 firewall must retain value-producing public-control protection.');
  assertRule(errors, EON_INVITE_PROGRAM_ACTIVE === false && EON_INVITE_PROGRAM_MODE === 'read-only-design', 'Invite program must remain read-only and inactive.');
  const pilot = evaluateAccessMilestonePilotGate();
  assertRule(errors, ACCESS_MILESTONE_PILOT_MODE === 'no-go' && pilot.go === false && pilot.active === false, 'Access-milestone pilot must remain fail-closed.');
  assertRule(errors, !/\/api\/referrals|captureReferralCloud/.test(referral), 'Active referral client must not call a remote referral endpoint.');

  const report = {
    schema: 'eonapp.w267.red-team-source-audit-report.v1',
    ok: errors.length === 0,
    generatedAt: new Date().toISOString(),
    interpretation: 'PASS proves current source boundaries and an honest pending-evidence board. It is not an independent red-team, browser, Cloudflare, legal or release approval.',
    localStaticLanes: W267_LOCAL_STATIC_LANES,
    boardDecision: board.decision,
    w260Verdict: w260Board.verdict,
    externalEvidenceState: Object.fromEntries((board.requiredExternalEvidence || []).map((entry) => [entry.id, entry.status])),
    errors
  };
  fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'artifacts', 'W267_RED_TEAM_SOURCE_AUDIT_REPORT_2026-06-25.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

function main() {
  const report = runW267RedTeamSourceAudit();
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    return 1;
  }
  console.log('W267 red-team source audit: PASS (source safety boundaries aligned; independent review remains pending).');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
