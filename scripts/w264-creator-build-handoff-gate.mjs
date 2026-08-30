#!/usr/bin/env node
/** W264-A0 — source-only local project handoff/recovery boundary gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W264_CREATOR_BUILD_HANDOFF_SCHEMA,
  validateW264CreatorBuildHandoffBoard
} from '../config/w264-creator-build-handoff-contract.mjs';
import { buildProjectHandoffExport, createProject } from '../assets/js/utils/eon-workspace-store.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARD_PATH = 'release-evidence/W264_CREATOR_BUILD_HANDOFF_SOURCE_READINESS_2026-06-25/W264_BOARD.json';

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function memoryStorage() {
  const rows = new Map();
  return {
    getItem(key) { return rows.get(String(key)) ?? null; },
    setItem(key, value) { rows.set(String(key), String(value)); },
    removeItem(key) { rows.delete(String(key)); }
  };
}

function noRemoteEffectPattern(source = '') {
  return !/\b(?:fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource)\s*\(/.test(source);
}

export function runW264CreatorBuildHandoffGate(root = ROOT) {
  const errors = [];
  const board = JSON.parse(read(root, BOARD_PATH));
  const boardValidation = validateW264CreatorBuildHandoffBoard(board);
  errors.push(...boardValidation.errors);

  const storeSource = read(root, 'assets/js/utils/eon-workspace-store.js');
  const pageSource = read(root, 'assets/js/eon-workspace-pages.js');
  const plan = read(root, 'docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md');
  const packageJson = JSON.parse(read(root, 'package.json'));
  const storage = memoryStorage();
  const project = createProject({ title: 'Local handoff proof', summary: 'Ordinary work only.' }, { storage });
  const handoff = buildProjectHandoffExport(project.id, { storage, now: Date.UTC(2026, 5, 25) });

  if (board.schema !== W264_CREATOR_BUILD_HANDOFF_SCHEMA) errors.push('W264 board schema drifted.');
  if (handoff.schema !== 'eon.project-handoff.v1') errors.push('W264 handoff schema drifted.');
  if (handoff.scope !== 'local-ordinary-work-export') errors.push('W264 handoff scope must remain local ordinary work only.');
  if (handoff.ownership?.status !== 'local-creator-asserted-unverified') errors.push('W264 ownership statement must remain unverified local context.');
  if (handoff.recovery?.directImportAvailable !== false || handoff.recovery?.fullProfileBackupRoute !== '/capsule') errors.push('W264 must preserve the non-import and Capsule recovery boundary.');
  if (Object.hasOwn(handoff.project || {}, 'automationIds')) errors.push('W264 handoff must exclude automation state.');
  if (!Array.isArray(handoff.exclusions) || handoff.exclusions.length < 4) errors.push('W264 handoff exclusions are incomplete.');
  if (!/data-project-export/.test(pageSource) || !/downloadProjectHandoff/.test(pageSource) || !/URL\.createObjectURL/.test(pageSource)) errors.push('Projects page must provide an explicit local handoff download action.');
  if (!/local-creator-asserted-unverified/.test(storeSource) || !/directImportAvailable:\s*false/.test(storeSource)) errors.push('Workspace handoff source lost its ownership/recovery claim fence.');
  if (![storeSource, pageSource].every(noRemoteEffectPattern)) errors.push('W264 handoff path contains a remote-effect primitive.');
  if (!/W264 \| Creator\/Build mission expansion \| \*\*W264-A0 source baseline complete/.test(plan)) errors.push('Canonical plan must retain the W264-A0 source baseline and pending-evidence boundary.');
  if (!packageJson.scripts?.['qa:w264-creator-build-handoff']) errors.push('package.json is missing the W264 QA script.');

  const report = {
    schema: 'eonapp.w264.creator-build-handoff-source-gate-report.v1',
    wave: 'W264-A0',
    ok: errors.length === 0,
    interpretation: 'PASS proves a local user-initiated ordinary-work handoff with explicit ownership/recovery limits. It is not export delivery, restore, cloud sync, rights, publication, commercial or launch evidence.',
    errors
  };
  const artifactDir = path.join(root, 'tmp', 'evidence', 'w264-creator-build-handoff-gate');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

function main() {
  const report = runW264CreatorBuildHandoffGate();
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    return 1;
  }
  console.log('W264 Creator/Build handoff source gate passed: local ordinary-work export and recovery boundaries preserved.');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
