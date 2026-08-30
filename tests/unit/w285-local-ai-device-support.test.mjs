import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  buildLocalAiDeviceSafetyGuidance,
  detectLocalAiCapabilityProfile
} from '../../assets/js/utils/local-ai-capability-matrix.js';
import { assessEonDevice } from '../../assets/js/device/eon-device-check.js';
import { runW285LocalAiDeviceSupportGate } from '../../scripts/w285-local-ai-device-support-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const gate = path.join(root, 'scripts', 'w285-local-ai-device-support-gate.mjs');
const guidancePath = path.join(root, 'assets', 'js', 'utils', 'local-ai-capability-matrix.js');

test('W285 gives mobile and low-memory devices conservative non-telemetry Local AI guidance', () => {
  const profile = detectLocalAiCapabilityProfile({ userAgent: 'Mozilla/5.0 (Linux; Android 13)', memoryGB: 4, cpuCores: 4 });
  const guidance = buildLocalAiDeviceSafetyGuidance(profile);
  assert.equal(guidance.localModelBrowserInstaller, false);
  assert.equal(guidance.temperatureTelemetryAvailable, false);
  assert.equal(guidance.batteryHealthTelemetryAvailable, false);
  assert.equal(guidance.storageHeadroomTelemetryAvailable, false);
  assert.equal(guidance.route, 'browser-local-lite-first');
  assert.match(guidance.guidance.join('\n'), /EON Local Lite/i);
  assert.match(guidance.guidance.join('\n'), /does not measure device temperature/i);
  assert.match(guidance.guidance.join('\n'), /enough local storage/i);
});

test('W285 keeps browser device reporting advisory, local and 2D-first on a mobile profile', () => {
  const report = assessEonDevice({
    navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 13)', deviceMemory: 4, hardwareConcurrency: 4, maxTouchPoints: 1, onLine: true, connection: { saveData: false } },
    matchMedia: () => ({ matches: false }),
    webgl: { webgl: true, webgl2: false },
    now: 1_000
  });
  assert.equal(report.localModelBrowserInstaller, false);
  assert.equal(report.cityDefault, true);
  assert.match(report.localAiRecommendation, /EON Local Lite/i);
  assert.match(report.localAiRecommendation, /desktop runtimes and Companion installers are not offered/i);
});

test('W285 source gate passes and fails closed if explicit device-health guidance is removed', () => {
  const report = runW285LocalAiDeviceSupportGate(root);
  assert.equal(report.ok, true, report.errors.join('\n'));
  const original = fs.readFileSync(guidancePath, 'utf8');
  try {
    fs.writeFileSync(guidancePath, original.replace('does not measure device temperature', 'measures temperature'));
    const result = spawnSync(process.execPath, [gate], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /device safety, reviewed Local Lite guidance and no-silent-download boundaries/);
  } finally {
    fs.writeFileSync(guidancePath, original);
  }
});
