#!/usr/bin/env node
/** R4 governance gate: one canonical, honest ledger for the post-W375 program. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  R4_PROGRAM_LEDGER_ALLOWED_STATUSES,
  R4_PROGRAM_LEDGER_COMMERCE_HOLD_IDS,
  R4_PROGRAM_LEDGER_NO_GO_IDS,
  R4_PROGRAM_LEDGER_PATH,
  R4_PROGRAM_LEDGER_REQUIRED_IDS,
  R4_PROGRAM_LEDGER_SCHEMA
} from '../config/r4-program-ledger-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const allowed = new Set(R4_PROGRAM_LEDGER_ALLOWED_STATUSES);
const required = new Set(R4_PROGRAM_LEDGER_REQUIRED_IDS);
const completedAllowed = new Set(['R4-00', 'R4-01', 'R4-02', 'A-00', 'A-01', 'A-02', 'A-03', 'I-01', 'M-00A']);

function readLedger(root = ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, R4_PROGRAM_LEDGER_PATH), 'utf8'));
}

function isSafeRelativePath(value = '') {
  const text = String(value || '');
  return text && !path.isAbsolute(text) && !text.includes('..') && !text.includes('\\');
}

export function inspectR4ProgramLedger(root = ROOT) {
  const errors = [];
  let ledger = null;
  try { ledger = readLedger(root); } catch (error) { return { ok: false, errors: [`Ledger is missing or invalid JSON: ${String(error?.message || error)}`], ledger: null }; }
  if (ledger.schema !== R4_PROGRAM_LEDGER_SCHEMA) errors.push('R4 ledger schema is invalid.');
  if (ledger.version !== 1) errors.push('R4 ledger version must be 1.');
  if (!Array.isArray(ledger.lanes)) errors.push('R4 ledger lanes must be an array.');
  const ids = new Set();
  for (const lane of Array.isArray(ledger.lanes) ? ledger.lanes : []) {
    const id = String(lane?.id || '');
    if (!id) { errors.push('R4 ledger has a lane without an id.'); continue; }
    if (ids.has(id)) errors.push(`R4 ledger has duplicate id: ${id}.`);
    ids.add(id);
    if (!allowed.has(lane.status)) errors.push(`${id} has an invalid status.`);
    if (typeof lane.sourceProofOnly !== 'boolean' || typeof lane.externalProofRequired !== 'boolean') errors.push(`${id} must declare sourceProofOnly and externalProofRequired booleans.`);
    if (!Array.isArray(lane.dependsOn) || !Array.isArray(lane.evidenceRefs)) errors.push(`${id} must include dependencies and evidence references.`);
    for (const ref of lane.evidenceRefs || []) {
      if (!isSafeRelativePath(ref)) errors.push(`${id} has an unsafe evidence reference.`);
      else if (!fs.existsSync(path.join(root, ref))) errors.push(`${id} evidence reference is missing: ${ref}`);
    }
    if (lane.status === 'complete-source') {
      if (!completedAllowed.has(id)) errors.push(`${id} cannot self-declare complete-source in the R4 baseline.`);
      if (!lane.sourceProofOnly) errors.push(`${id} completion must remain source-only until separately reviewed external proof is recorded.`);
      if (!lane.evidenceRefs.length) errors.push(`${id} complete-source requires source evidence references.`);
    }
    if (R4_PROGRAM_LEDGER_NO_GO_IDS.includes(id) && lane.status !== 'blocked-external') errors.push(`${id} must remain blocked-external until real proof is recorded.`);
    if (R4_PROGRAM_LEDGER_COMMERCE_HOLD_IDS.includes(id) && lane.status !== 'hold-governance') errors.push(`${id} must remain hold-governance before merchant activation.`);
  }
  for (const id of required) if (!ids.has(id)) errors.push(`R4 ledger is missing required lane ${id}.`);
  for (const lane of Array.isArray(ledger.lanes) ? ledger.lanes : []) {
    for (const dependency of lane.dependsOn || []) if (!ids.has(dependency)) errors.push(`${lane.id} depends on unknown lane ${dependency}.`);
  }
  const architecture = ledger.productArchitecture || {};
  if (architecture.appsFlagshipCollection !== 'Insights & Forecasts') errors.push('Apps collection must use the resolved Insights & Forecasts name.');
  if (architecture.insightsRoute !== '/trade') errors.push('Insights compatibility route must remain /trade.');
  if (!String(architecture.navigationDecision || '').includes('not a new top-level flagship nav item')) errors.push('Navigation decision must prevent Insights becoming another primary flagship nav item.');
  const globalBlocks = Array.isArray(ledger.globalReleaseBlocks) ? ledger.globalReleaseBlocks.join(' ') : '';
  if (!/No external W276 update\/rollback\/restore evidence/i.test(globalBlocks)) errors.push('R4 ledger must retain the W276 external-evidence block.');
  if (!/No payment processor merchant account/i.test(globalBlocks)) errors.push('R4 ledger must retain the merchant activation block.');
  return Object.freeze({ ok: errors.length === 0, errors, ledger });
}

export function runR4ProgramLedgerGate({ writeArtifact = true, root = ROOT } = {}) {
  const report = inspectR4ProgramLedger(root);
  if (writeArtifact) {
    const dir = path.join(root, 'artifacts', 'r4-program-ledger-gate');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'report.json'), `${JSON.stringify({ schema: R4_PROGRAM_LEDGER_SCHEMA, ...report, generatedAt: new Date().toISOString() }, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runR4ProgramLedgerGate();
  if (!report.ok) {
    report.errors.forEach((error) => console.error(`[R4 ledger] ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`R4 program ledger gate: PASS (${report.ledger.lanes.length} lanes; external/commercial blocks remain explicit).`);
  }
}
