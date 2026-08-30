#!/usr/bin/env node
/** W345 — gate for the user-owned Device Proof Kit. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W345_LOCAL_DEVICE_PROOF_KIT_CONTRACT } from '../config/w345-local-device-proof-kit-contract.mjs';
import { EON_REQUIRED_DEVICE_EVIDENCE_CASES } from '../assets/js/local-first/eon-device-evidence-matrix.js';
import { getEonDeviceEvidenceRecordsTruth } from '../assets/js/local-first/eon-device-evidence-records.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function runW345LocalDeviceProofKitGate(root = ROOT) {
  const contract = W345_LOCAL_DEVICE_PROOF_KIT_CONTRACT;
  const errors = [];
  for (const relative of contract.requiredFiles) {
    if (!fs.existsSync(path.join(root, relative))) errors.push(`Required W345 file missing: ${relative}`);
  }
  if (errors.length) return Object.freeze({ schema: contract.schema, ok: false, errors: Object.freeze(errors) });

  const actualIds = EON_REQUIRED_DEVICE_EVIDENCE_CASES.map((item) => item.id);
  for (const id of contract.requiredCaseIds) {
    if (!actualIds.includes(id)) errors.push(`Required W345 device case missing: ${id}`);
  }

  for (const relative of ['assets/js/local-first/eon-device-evidence-records.js', 'assets/js/eon-workspace-pages.js']) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    for (const primitive of contract.forbiddenPrimitives) {
      if (source.includes(primitive)) errors.push(`Forbidden W345 primitive in ${relative}: ${primitive}`);
    }
  }

  const workspace = fs.readFileSync(path.join(root, 'assets/js/eon-workspace-pages.js'), 'utf8');
  for (const marker of ['Device Proof Kit', 'data-device-proof-kit-form', 'data-device-proof-export', 'data-device-proof-clear']) {
    if (!workspace.includes(marker)) errors.push(`Workspace Device Proof Kit marker missing: ${marker}`);
  }

  const truth = getEonDeviceEvidenceRecordsTruth();
  for (const [key, expected] of Object.entries(contract.expectedTruth)) {
    if (truth[key] !== expected) errors.push(`W345 truth drifted: ${key} must equal ${String(expected)}.`);
  }

  return Object.freeze({ schema: contract.schema, ok: errors.length === 0, errors: Object.freeze(errors), truth });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runW345LocalDeviceProofKitGate();
  if (!report.ok) console.error(JSON.stringify(report, null, 2));
  else console.log('W345 local Device Proof Kit gate passed: user-owned checklist only; no telemetry, probes, uploads, or automatic approval.');
  process.exitCode = report.ok ? 0 : 1;
}
