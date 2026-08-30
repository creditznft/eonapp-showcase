#!/usr/bin/env node
/** W263-A0 — source-only capability/approval/receipt safety gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_ROUTE_MANIFEST } from '../assets/js/chat/eonbot-context-registry.js';
import { listEonbotExecutionCapabilities } from '../assets/js/chat/eonbot-command-hub.js';
import {
  W263_EONBOT_CAPABILITY_EXECUTION_SCHEMA,
  validateW263CapabilityExecutionBoard
} from '../config/w263-eonbot-capability-execution-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARD_PATH = 'release-evidence/W263_EONBOT_CAPABILITY_EXECUTION_SOURCE_READINESS_2026-06-25/W263_BOARD.json';

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function routePath(value = '') {
  try { return new URL(String(value || ''), 'https://eonapp.invalid').pathname; } catch { return ''; }
}

function noRemoteEffectPattern(source = '') {
  return !/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/.test(source);
}

export function runW263EonbotCapabilityExecutionGate(root = ROOT) {
  const errors = [];
  const board = JSON.parse(read(root, BOARD_PATH));
  const boardValidation = validateW263CapabilityExecutionBoard(board);
  errors.push(...boardValidation.errors);

  const hub = read(root, 'assets/js/chat/eonbot-command-hub.js');
  const proposals = read(root, 'assets/js/chat/eonbot-action-proposals.js');
  const receipts = read(root, 'assets/js/chat/eonbot-action-receipts.js');
  const plan = read(root, 'docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md');
  const packageJson = JSON.parse(read(root, 'package.json'));
  const capabilities = listEonbotExecutionCapabilities();
  const routes = new Set(EON_ROUTE_MANIFEST.map((entry) => entry.route));
  const seen = new Set();

  if (board.schema !== W263_EONBOT_CAPABILITY_EXECUTION_SCHEMA) errors.push('W263 board schema drifted.');
  if (!capabilities.length) errors.push('W263 capability registry is empty.');
  for (const capability of capabilities) {
    if (seen.has(capability.id)) errors.push(`Duplicate W263 capability id: ${capability.id}`);
    seen.add(capability.id);
    if (!routes.has(routePath(capability.route))) errors.push(`Capability ${capability.id} does not target a canonical route.`);
    if (capability.requiresUserTap !== true) errors.push(`Capability ${capability.id} must require an explicit user tap.`);
    if (capability.externalEffect !== false) errors.push(`Capability ${capability.id} must retain externalEffect=false.`);
    if (!['prepared-user-tap', 'prepared-review-required'].includes(capability.execution)) errors.push(`Capability ${capability.id} has an invalid execution state.`);
    const expectedGuard = Boolean(capability.sensitive || capability.requiresPermission || capability.requiresDeviceReview);
    if (capability.requiresProposalReview !== expectedGuard) errors.push(`Capability ${capability.id} has a review-policy mismatch.`);
  }

  if (!/listEonbotExecutionCapabilities/.test(hub) || !/matchesEonbotCommandHubAction/.test(hub)) errors.push('Command hub must expose canonical execution capability validation.');
  if (!/matchesEonbotCommandHubAction/.test(proposals) || !/isEonbotCommandHubActionGuarded/.test(proposals)) errors.push('Proposals must use the canonical execution capability validator.');
  if (!/proposal-required/.test(receipts) || !/proposal-not-approved/.test(receipts) || !/hasApprovedMatchingProposal/.test(receipts)) errors.push('Receipts must fail closed for guarded capabilities.');
  if (![hub, proposals, receipts].every(noRemoteEffectPattern)) errors.push('W263 capability path contains a remote-effect primitive.');
  if (!/W263 \| EONBOT capability execution \| \*\*W263-A0 source baseline complete/.test(plan)) errors.push('Canonical plan must retain the W263-A0 source baseline and pending-evidence boundary.');
  if (!packageJson.scripts?.['qa:w263-eonbot-capability-execution']) errors.push('package.json is missing the W263 QA script.');

  const report = {
    schema: 'eonapp.w263.eonbot-capability-execution-source-gate-report.v1',
    wave: 'W263-A0',
    ok: errors.length === 0,
    capabilityCount: capabilities.length,
    capabilityIds: capabilities.map((entry) => entry.id),
    interpretation: 'PASS proves a finite local capability registry, explicit approval boundaries and receipt denial paths. It is not provider, browser, device, autonomous-tool, beta or launch evidence.',
    errors
  };
  const artifactDir = path.join(root, 'artifacts', 'w263-eonbot-capability-execution-gate');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

function main() {
  const report = runW263EonbotCapabilityExecutionGate();
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    return 1;
  }
  console.log(`W263 EONBOT capability execution source gate passed: ${report.capabilityCount} finite local capabilities, no remote effects.`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
