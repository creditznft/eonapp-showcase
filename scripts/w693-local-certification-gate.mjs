#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEonCityW693LongSessionSimulation, buildEonCityW693CertificationBoard, validateEonCityW693CertificationBoard } from '../assets/js/city/w693/eon-city-w693-local-certification.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (relative) => fs.existsSync(path.join(root, relative));

export function inspectW693LocalCertification() {
  const checks = [];
  const add = (id, pass, detail) => checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
  const required = ['assets/js/city/w693/eon-city-w693-local-certification.js','config/w693-owner-recording-matrix.json','docs/final-candidate/W693_OWNER_RECORDING_RUNBOOK_2026-07-25.md','tests/unit/w693-local-certification.test.mjs'];
  add('required-files', required.every(exists), 'W693 certification authority, matrix, runbook and tests exist');
  const simulation = buildEonCityW693LongSessionSimulation({ cycles: 1200 });
  add('long-session-simulation', simulation.ok && simulation.cycles === 1200 && simulation.coreCardinalityStable && simulation.realmCardinalityStable, '1,200-cycle deterministic source simulation is bounded');
  add('no-browser-overclaim', !simulation.heapMeasurementClaimed && !simulation.browserFrameRateClaimed && !simulation.ownerDeviceClaimed, 'source simulation does not claim browser, heap or owner-device proof');
  const board = buildEonCityW693CertificationBoard();
  const validation = validateEonCityW693CertificationBoard(board);
  add('certification-board', validation.ok && board.localCandidateAllowed && !board.productionReleaseAllowed, 'local candidate is allowed while production remains blocked');
  add('owner-matrix-pending', board.recordingCount === 15 && board.recordingPassedCount === 0 && board.ownerBrowserCertification === 'pending', 'all 15 owner recordings remain honestly pending');
  return Object.freeze({ schema: 'eon.city.w693.gate.2026-07-25.v1', ok: checks.every((entry) => entry.pass), passed: checks.filter((entry) => entry.pass).length, total: checks.length, checks: Object.freeze(checks), simulation, board });
}

const report = inspectW693LocalCertification();
for (const check of report.checks) console.log(`[W693] ${check.pass ? 'PASS' : 'FAIL'} ${check.id}: ${check.detail}`);
console.log(`[W693] ${report.ok ? 'PASS' : 'FAIL'} ${report.passed}/${report.total}`);
if (!report.ok) process.exitCode = 1;
