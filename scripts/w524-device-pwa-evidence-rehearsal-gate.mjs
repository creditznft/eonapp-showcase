#!/usr/bin/env node
/** W524 gate: prepares evidence handoff tooling without fabricating external proof. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_REQUIRED_DEVICE_EVIDENCE_CASES
} from '../assets/js/local-first/eon-device-evidence-matrix.js';
import {
  getEonDeviceEvidenceRecordsTruth
} from '../assets/js/local-first/eon-device-evidence-records.js';
import {
  createEonDevicePwaEvidenceRehearsal,
  getEonDevicePwaEvidenceRehearsalTruth
} from '../assets/js/local-first/eon-device-pwa-evidence-rehearsal.js';
import {
  W524_DEVICE_PWA_EVIDENCE_REHEARSAL_SCHEMA,
  W524_REQUIRED_CASE_IDS,
  W524_REQUIRED_OPERATOR_ARTIFACT_KINDS,
  W524_REQUIRED_SOURCE_FILES,
  W524_TRUTH,
  validateW524DevicePwaEvidenceRehearsalContract
} from '../config/w524-device-pwa-evidence-rehearsal-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW524DevicePwaEvidenceRehearsal({
  root = ROOT,
  cases = EON_REQUIRED_DEVICE_EVIDENCE_CASES,
  contract = null
} = {}) {
  const issues = [...validateW524DevicePwaEvidenceRehearsalContract(contract || undefined)];
  for (const relative of W524_REQUIRED_SOURCE_FILES) {
    if (!fs.existsSync(path.join(root, relative))) issues.push(`required-source-missing:${relative}`);
  }
  const ids = new Set((Array.isArray(cases) ? cases : []).map((entry) => entry?.id));
  for (const id of W524_REQUIRED_CASE_IDS) if (!ids.has(id)) issues.push(`required-device-case-missing:${id}`);
  const matrix = read(root, 'assets/js/local-first/eon-device-evidence-matrix.js');
  const records = read(root, 'assets/js/local-first/eon-device-evidence-records.js');
  const rehearsal = read(root, 'assets/js/local-first/eon-device-pwa-evidence-rehearsal.js');
  const workspace = read(root, 'assets/js/eon-workspace-pages.js');
  const emptyRehearsal = createEonDevicePwaEvidenceRehearsal([]);
  for (const kind of W524_REQUIRED_OPERATOR_ARTIFACT_KINDS) if (!emptyRehearsal.requiredOperatorArtifacts.includes(kind)) issues.push(`operator-artifact-kind-missing:${kind}`);
  if (!/ready-for-independent-review/.test(rehearsal) || /productionApproved:\s*true|launchApproval:\s*true|independentlyVerified:\s*true/.test(rehearsal)) issues.push('rehearsal-review-boundary-invalid');
  if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon|uploadScreenshot|console\.log|localStorage|sessionStorage/.test(rehearsal)) issues.push('rehearsal-uses-forbidden-collection-primitive');
  if (!/createEonDevicePwaEvidenceRehearsal/.test(records) || !/evidenceRehearsal/.test(records)) issues.push('records-export-does-not-include-w524-rehearsal');
  if (!/eonapp-device-pwa-evidence-handoff\.json/.test(workspace) || !/Export evidence handoff/.test(workspace)) issues.push('workspace-handoff-export-not-wired');
  if (!/capsule-recovery-rehearsal/.test(matrix) || !/pwa-install-update-offline/.test(matrix)) issues.push('matrix-missing-pwa-capsule-coverage');
  const recordTruth = getEonDeviceEvidenceRecordsTruth();
  const rehearsalTruth = getEonDevicePwaEvidenceRehearsalTruth();
  for (const [key, expected] of Object.entries(W524_TRUTH)) {
    if (rehearsalTruth[key] !== expected) issues.push(`truth-drift:${key}`);
  }
  if (recordTruth.remoteTelemetryCreated !== false || recordTruth.screenshotUploadCreated !== false || recordTruth.automaticBetaApproval !== false) issues.push('device-record-truth-drift');
  return Object.freeze({
    schema: `${W524_DEVICE_PWA_EVIDENCE_REHEARSAL_SCHEMA}.gate`,
    wave: 'W524',
    sourceOnly: true,
    ok: issues.length === 0,
    requiredCaseCount: W524_REQUIRED_CASE_IDS.length,
    availableCaseCount: ids.size,
    truth: W524_TRUTH,
    issues: Object.freeze([...new Set(issues)].sort())
  });
}

function main() {
  const report = inspectW524DevicePwaEvidenceRehearsal();
  const target = path.join(ROOT, 'tmp', 'w524-device-pwa-evidence-rehearsal-gate.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) throw new Error(`W524 device/PWA evidence rehearsal failed:\n${report.issues.map((entry) => `- ${entry}`).join('\n')}`);
  process.stdout.write(`W524 device/PWA evidence rehearsal passed (${report.requiredCaseCount} human-run cases; no device, network, screenshot, or launch proof claimed).\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
