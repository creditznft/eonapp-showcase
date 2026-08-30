#!/usr/bin/env node
/**
 * W528 machine-evidence planning lane.
 * Default execution is deliberately source/static only: no browser starts, no
 * device is probed, no Capsule data is read, and no PWA update is applied.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W528_MACHINE_EVIDENCE_CONTRACT,
  W528_MACHINE_EVIDENCE_SCHEMA,
  validateW528MachineEvidenceContract
} from '../config/w528-machine-evidence-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED_STATIC_FILES = Object.freeze([
  'manifest.webmanifest',
  'sw.js',
  'capsule.html',
  'assets/js/eon-pwa-manager.js',
  'assets/js/eon-pwa-recovery-rehearsal.js',
  'assets/js/local-first/eon-device-evidence-matrix.js',
  'tests/e2e/playwright.config.ts'
]);

function exists(root, relative) {
  return fs.existsSync(path.join(root, relative));
}

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

export function buildW528MachineEvidenceReceipt({ root = ROOT, executionMode = 'source-static-shape-only' } = {}) {
  const issues = [...validateW528MachineEvidenceContract()];
  if (executionMode !== 'source-static-shape-only') issues.push('unsupported-execution-mode');
  for (const relative of REQUIRED_STATIC_FILES) if (!exists(root, relative)) issues.push(`required-static-file-missing:${relative}`);
  const manifest = exists(root, 'manifest.webmanifest') ? JSON.parse(read(root, 'manifest.webmanifest')) : {};
  const serviceWorker = exists(root, 'sw.js') ? read(root, 'sw.js') : '';
  const recovery = exists(root, 'assets/js/eon-pwa-recovery-rehearsal.js') ? read(root, 'assets/js/eon-pwa-recovery-rehearsal.js') : '';
  const capsule = exists(root, 'capsule.html') ? read(root, 'capsule.html') : '';
  if (manifest.start_url !== '/?source=pwa') issues.push('manifest-start-url-invalid');
  if (!Array.isArray(manifest.icons) || manifest.icons.length < 2) issues.push('manifest-icons-incomplete');
  if (!/const RELEASE_ID = 'w\d{3}-\d{4}-\d{2}-\d{2}-[a-z0-9-]+'/.test(serviceWorker)) issues.push('service-worker-version-marker-missing');
  if (!/actualUpdateApplied:\s*false/.test(recovery) || !/rollbackApplied:\s*false/.test(recovery)) issues.push('recovery-rehearsal-truth-drift');
  if (!/encrypted/i.test(capsule) || !/one user-held encrypted file/i.test(capsule) || !/never starts sync, automatic backup, or automatic restore/i.test(capsule)) issues.push('capsule-transfer-truth-drift');
  return Object.freeze({
    schema: W528_MACHINE_EVIDENCE_SCHEMA,
    wave: 'W528',
    sourceOnly: true,
    executionMode,
    ok: issues.length === 0,
    evidenceLabels: Object.freeze({
      source: 'source-pass',
      emulatedBrowser: 'emulated-browser-pending',
      localBrowser: 'local-browser-pending',
      humanReview: 'pending-human-review'
    }),
    plannedCoverage: Object.freeze({
      browserFamilies: W528_MACHINE_EVIDENCE_CONTRACT.requiredBrowserFamilies,
      viewportFamilies: W528_MACHINE_EVIDENCE_CONTRACT.requiredViewportFamilies,
      scenarios: W528_MACHINE_EVIDENCE_CONTRACT.requiredScenarios
    }),
    actualBrowserStarted: false,
    physicalDeviceObserved: false,
    pwaInstalled: false,
    serviceWorkerUpdateApplied: false,
    capsuleDataRead: false,
    issues: Object.freeze([...new Set(issues)].sort())
  });
}

function main() {
  const receipt = buildW528MachineEvidenceReceipt();
  const output = path.join(ROOT, 'tmp', 'w528-machine-evidence-receipt.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify(receipt, null, 2));
  if (!receipt.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
