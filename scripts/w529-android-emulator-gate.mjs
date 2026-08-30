#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildW529AndroidEmulatorReceipt } from './w529-android-emulator-evidence.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function inspectW529AndroidEmulator({ root = ROOT } = {}) {
  const receipt = buildW529AndroidEmulatorReceipt();
  const issues = [...receipt.issues];
  const source = fs.readFileSync(path.join(root, 'scripts/w529-android-emulator-evidence.mjs'), 'utf8');
  if (/adb['"]?\s*,\s*\[['"](?:install|uninstall|push|shell)/.test(source) || /adb\s+(?:install|uninstall|push|shell)/.test(source)) issues.push('forbidden-adb-operation-present');
  if (receipt.adbProbeRequested || receipt.appInstalled || receipt.appLaunched || receipt.pwaInstalled || receipt.screenshotCaptured || receipt.fixtureDataUploaded || receipt.physicalDeviceObserved) issues.push('default-emulator-receipt-overclaims-activity');
  return Object.freeze({ schema: 'eonapp.w529.android-emulator-gate.v1', wave: 'W529', sourceOnly: true, ok: issues.length === 0, receipt, issues: Object.freeze([...new Set(issues)].sort()) });
}

function main() {
  const report = inspectW529AndroidEmulator();
  const output = path.join(ROOT, 'tmp', 'w529-android-emulator-gate.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) throw new Error(`W529 Android emulator gate failed:\n${report.issues.map((item) => `- ${item}`).join('\n')}`);
  console.log('W529 Android emulator source gate passed. No adb probe, emulator activity, device proof, or shipping wrapper was created.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
