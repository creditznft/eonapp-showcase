import assert from 'node:assert/strict';
import test from 'node:test';
import { W529_ANDROID_EMULATOR_CONTRACT, validateW529AndroidEmulatorContract } from '../../config/w529-android-emulator-contract.mjs';
import { buildW529AndroidEmulatorReceipt } from '../../scripts/w529-android-emulator-evidence.mjs';
import { inspectW529AndroidEmulator } from '../../scripts/w529-android-emulator-gate.mjs';

test('W529 defaults to a non-invasive pending Android emulator lane', () => {
  assert.deepEqual(validateW529AndroidEmulatorContract(), []);
  const receipt = buildW529AndroidEmulatorReceipt();
  assert.equal(receipt.status, 'android-emulator-pending');
  assert.equal(receipt.adbProbeRequested, false);
  assert.equal(receipt.adbProbeStatus, 'not-requested');
  assert.equal(receipt.appInstalled, false);
  assert.equal(receipt.appLaunched, false);
  assert.equal(receipt.pwaInstalled, false);
  assert.equal(receipt.physicalDeviceObserved, false);
});

test('W529 optional adb inspection only recognizes emulator descriptors and does not certify a test', () => {
  const receipt = buildW529AndroidEmulatorReceipt({
    probeAdb: true,
    execute: () => ({ status: 0, stdout: 'List of devices attached\nemulator-5554 device product:sdk\nserial123 device product:phone\n' })
  });
  assert.equal(receipt.adbProbeRequested, true);
  assert.equal(receipt.adbProbeStatus, 'emulator-descriptor-observed');
  assert.equal(receipt.emulatorDescriptorCount, 1);
  assert.equal(receipt.status, W529_ANDROID_EMULATOR_CONTRACT.defaultStatus);
  assert.equal(receipt.pwaInstalled, false);
});

test('W529 source gate blocks install/control behavior and remains source-only', () => {
  const report = inspectW529AndroidEmulator();
  assert.equal(report.ok, true, report.issues.join('\n'));
  assert.equal(report.sourceOnly, true);
  assert.equal(report.receipt.fixtureDataUploaded, false);
});
