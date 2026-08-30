#!/usr/bin/env node
/**
 * W529 Android emulator evidence preparation.
 * The default lane never invokes adb. An explicit --probe-adb option may list
 * connected emulator descriptors only; it cannot install, launch, push, type
 * into, or inspect an app/device.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W529_ANDROID_EMULATOR_CONTRACT,
  W529_ANDROID_EMULATOR_SCHEMA,
  validateW529AndroidEmulatorContract
} from '../config/w529-android-emulator-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseAdbDeviceList(stdout = '') {
  return String(stdout || '').split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/)[0])
    .filter((id) => /^emulator-\d+$/i.test(id))
    .sort();
}

export function buildW529AndroidEmulatorReceipt({ probeAdb = false, execute = null } = {}) {
  const issues = [...validateW529AndroidEmulatorContract()];
  let emulatorIds = [];
  let probeStatus = 'not-requested';
  if (probeAdb === true) {
    const runner = typeof execute === 'function'
      ? execute
      : () => spawnSync('adb', ['devices', '-l'], { encoding: 'utf8', timeout: 5000 });
    const result = runner();
    if (result?.error || result?.status !== 0) {
      probeStatus = 'adb-unavailable-or-nonzero';
    } else {
      emulatorIds = parseAdbDeviceList(result.stdout);
      probeStatus = emulatorIds.length ? 'emulator-descriptor-observed' : 'no-emulator-descriptor-observed';
    }
  }
  return Object.freeze({
    schema: W529_ANDROID_EMULATOR_SCHEMA,
    wave: 'W529',
    sourceOnly: !probeAdb,
    status: W529_ANDROID_EMULATOR_CONTRACT.defaultStatus,
    adbProbeRequested: probeAdb === true,
    adbProbeStatus: probeStatus,
    emulatorDescriptorCount: emulatorIds.length,
    emulatorIdentifiersStored: false,
    manualScenarios: W529_ANDROID_EMULATOR_CONTRACT.manualScenarios,
    appInstalled: false,
    appLaunched: false,
    pwaInstalled: false,
    screenshotCaptured: false,
    fixtureDataUploaded: false,
    physicalDeviceObserved: false,
    issues: Object.freeze(issues)
  });
}

function main() {
  const probeAdb = process.argv.includes('--probe-adb');
  const receipt = buildW529AndroidEmulatorReceipt({ probeAdb });
  const output = path.join(ROOT, 'tmp', 'w529-android-emulator-evidence-receipt.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(JSON.stringify(receipt, null, 2));
  if (receipt.issues.length) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
