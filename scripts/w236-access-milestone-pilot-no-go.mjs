#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateAccessMilestonePilotGate, requestAccessMilestonePilotActivation } from '../config/access-milestone-pilot-gate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const assert = (value, message) => { if (!value) errors.push(message); };
const gate = evaluateAccessMilestonePilotGate();
const attempt = requestAccessMilestonePilotActivation();
assert(gate.go === false && gate.active === false, 'Pilot gate must remain a no-go.');
assert(gate.missing.length >= 10, 'Pilot gate must list all unresolved approval requirements.');
assert(attempt.ok === false && attempt.reason === 'pilot-no-go', 'Activation request must fail closed.');
const report = { schema: 'eonapp.w236.access-milestone-pilot-no-go.v1', ok: errors.length === 0, checkedAt: new Date().toISOString(), gate, attempt, errors };
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W236_ACCESS_MILESTONE_PILOT_NO_GO_2026-06-25.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`[W236] ${report.ok ? 'PASS' : 'FAIL'}: pilot remains ${gate.mode}; ${gate.missing.length} independent approvals unresolved.`);
if (!report.ok) errors.forEach((error) => console.error(`[W236] ${error}`));
process.exitCode = report.ok ? 0 : 1;
