#!/usr/bin/env node
/** W288-A0 — source-only Creator project-handoff review/integrity boundary gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W288_CREATOR_HANDOFF_INTEGRITY_SCHEMA,
  validateW288CreatorHandoffIntegrityBoard
} from '../config/w288-creator-handoff-integrity-contract.mjs';
import { buildProjectHandoffExport, createProject } from '../assets/js/utils/eon-workspace-store.js';
import { parseProjectHandoffText } from '../assets/js/utils/project-handoff-preflight.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARD_PATH = 'release-evidence/W288_CREATOR_HANDOFF_INTEGRITY_SOURCE_READINESS_2026-06-25/W288_BOARD.json';

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

export function runW288CreatorHandoffIntegrityGate(root = ROOT) {
  const errors = [];
  const board = JSON.parse(read(root, BOARD_PATH));
  errors.push(...validateW288CreatorHandoffIntegrityBoard(board).errors);
  const preflightSource = read(root, 'assets/js/utils/project-handoff-preflight.js');
  const pageSource = read(root, 'assets/js/eon-workspace-pages.js');
  const plan = read(root, 'docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md');
  const packageJson = JSON.parse(read(root, 'package.json'));
  const storage = memoryStorage();
  const project = createProject({ title: 'W288 review proof', summary: 'Ordinary local work.' }, { storage });
  const handoff = buildProjectHandoffExport(project.id, { storage, now: Date.UTC(2026, 5, 25) });
  const inspection = parseProjectHandoffText(JSON.stringify(handoff));

  if (board.schema !== W288_CREATOR_HANDOFF_INTEGRITY_SCHEMA) errors.push('W288 board schema drifted.');
  if (!inspection.ok || inspection.directImportAvailable !== false || inspection.reviewOnly !== true) errors.push('W288 must accept a canonical handoff only as a review-only item.');
  const forged = structuredClone(handoff);
  forged.recovery.directImportAvailable = true;
  if (parseProjectHandoffText(JSON.stringify(forged)).ok) errors.push('W288 must reject direct-import handoff claims.');
  if (!noRemoteEffectPattern(preflightSource) || /\blocalStorage\b|\bcreateProject\s*\(|\bupdateProject\s*\(|\bdeleteProject\s*\(/.test(preflightSource)) errors.push('W288 preflight must remain pure, local, non-mutating and free of remote effects.');
  if (!/data-project-handoff-review/.test(pageSource) || !/reviewProjectHandoffFile/.test(pageSource) || !/Nothing was imported/.test(pageSource)) errors.push('Projects page must expose the review-only W288 handoff path.');
  if (!/W288 \| Creator production integrity\/export recovery \| \*\*W288-A0 source baseline complete/.test(plan)) errors.push('Canonical plan must retain W288-A0 source baseline and pending-evidence boundary.');
  if (!packageJson.scripts?.['qa:w288-creator-handoff-integrity']) errors.push('package.json is missing the W288 QA script.');

  const report = {
    schema: 'eonapp.w288.creator-handoff-integrity-source-gate-report.v1',
    wave: 'W288-A0',
    ok: errors.length === 0,
    interpretation: 'PASS proves only a local, pure, review-only handoff inspector. It is not import, restore, overwrite, delivery, publication, ownership, collaboration, device or launch evidence.',
    errors
  };
  const artifactDir = path.join(root, 'artifacts', 'w288-creator-handoff-integrity-gate');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

function main() {
  const report = runW288CreatorHandoffIntegrityGate();
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    return 1;
  }
  console.log('W288 Creator handoff integrity source gate passed: review-only, non-mutating import boundary preserved.');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
