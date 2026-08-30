#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildW528MachineEvidenceReceipt } from './w528-machine-evidence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function inspectW528MachineEvidence({ root = ROOT } = {}) {
  const receipt = buildW528MachineEvidenceReceipt({ root });
  const issues = [...receipt.issues];
  const source = fs.readFileSync(path.join(root, 'scripts/w528-machine-evidence.mjs'), 'utf8');
  if (/playwright\.chromium\.launch|browserType\.launch|adb\s+install|navigator\.serviceWorker\.register/.test(source)) issues.push('default-machine-lane-may-start-or-mutate-runtime');
  if (/fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/.test(source)) issues.push('default-machine-lane-may-create-network-traffic');
  if (receipt.actualBrowserStarted || receipt.physicalDeviceObserved || receipt.pwaInstalled || receipt.serviceWorkerUpdateApplied || receipt.capsuleDataRead) issues.push('default-machine-receipt-claims-runtime-proof');
  return Object.freeze({
    schema: 'eonapp.w528.machine-evidence-gate.v1',
    wave: 'W528',
    sourceOnly: true,
    ok: issues.length === 0,
    receipt,
    issues: Object.freeze([...new Set(issues)].sort())
  });
}

function main() {
  const report = inspectW528MachineEvidence();
  const output = path.join(ROOT, 'tmp', 'w528-machine-evidence-gate.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) throw new Error(`W528 machine-evidence gate failed:\n${report.issues.map((item) => `- ${item}`).join('\n')}`);
  console.log('W528 machine-evidence source gate passed. Browser/device/update evidence remains intentionally pending.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
