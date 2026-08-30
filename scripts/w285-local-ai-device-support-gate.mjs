#!/usr/bin/env node
/** W285-A0 — source-only Local AI/device support gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W285_LOCAL_AI_DEVICE_SUPPORT_SCHEMA,
  validateW285LocalAiDeviceSupportBoard
} from '../config/w285-local-ai-device-support-contract.mjs';
import {
  LOCAL_AI_DEVICE_SAFETY_SCHEMA,
  buildLocalAiDeviceSafetyGuidance,
  detectLocalAiCapabilityProfile
} from '../assets/js/utils/local-ai-capability-matrix.js';
import { assessEonDevice, buildEonDeviceEvidenceMatrix } from '../assets/js/device/eon-device-check.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARD_PATH = 'release-evidence/W285_LOCAL_AI_DEVICE_SUPPORT_SOURCE_READINESS_2026-06-25/W285_BOARD.json';

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function hasRequiredMatrixRows(matrix = []) {
  const ids = new Set(matrix.map((row) => row?.id));
  return ['android-4gb', 'iphone-safari', 'desktop-chrome', 'slow-network-offline', 'no-webgl'].every((id) => ids.has(id));
}

export function runW285LocalAiDeviceSupportGate(root = ROOT) {
  const errors = [];
  const board = JSON.parse(read(root, BOARD_PATH));
  errors.push(...validateW285LocalAiDeviceSupportBoard(board).errors);

  const guidanceSource = read(root, 'assets/js/utils/local-ai-capability-matrix.js');
  const localAiPage = read(root, 'assets/js/local-ai/local-ai-page.js');
  const runtimeSource = read(root, 'assets/js/local-ai/local-runtime-status.js');
  const deviceSource = read(root, 'assets/js/device/eon-device-check.js');
  const plan = read(root, 'docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md');
  const packageJson = JSON.parse(read(root, 'package.json'));
  const mobileProfile = detectLocalAiCapabilityProfile({ userAgent: 'Mozilla/5.0 (Linux; Android 13)', memoryGB: 4, cpuCores: 4 });
  const guidance = buildLocalAiDeviceSafetyGuidance(mobileProfile);
  const mobileReport = assessEonDevice({
    navigator: { userAgent: 'Mozilla/5.0 (Linux; Android 13)', deviceMemory: 4, hardwareConcurrency: 4, maxTouchPoints: 1, onLine: true, connection: { saveData: false } },
    matchMedia: () => ({ matches: false }),
    webgl: { webgl: true, webgl2: false },
    now: Date.UTC(2026, 5, 25)
  });

  if (board.schema !== W285_LOCAL_AI_DEVICE_SUPPORT_SCHEMA) errors.push('W285 board schema drifted.');
  if (guidance.schema !== LOCAL_AI_DEVICE_SAFETY_SCHEMA) errors.push('W285 local device safety guidance schema drifted.');
  if (guidance.localModelBrowserInstaller !== false) errors.push('W285 must not claim browser-side local model installation.');
  if (guidance.temperatureTelemetryAvailable || guidance.batteryHealthTelemetryAvailable || guidance.storageHeadroomTelemetryAvailable) errors.push('W285 must not invent device thermal, battery or storage telemetry.');
  if (guidance.route !== 'browser-local-lite-first') errors.push('W285 low-memory/mobile guidance must remain conservative and prefer the reviewed browser-local Lite path.');
  if (!guidance.guidance.some((entry) => /does not measure device temperature/i.test(entry)) || !guidance.guidance.some((entry) => /enough local storage/i.test(entry))) errors.push('W285 guidance must retain heat and storage support limits.');
  if (mobileReport.localModelBrowserInstaller !== false || !mobileReport.cityDefault || !/EON Local Lite/i.test(mobileReport.localAiRecommendation)) errors.push('W285 mobile device report must retain 2D-first Local Lite guidance without a desktop installer claim.');
  if (!hasRequiredMatrixRows(buildEonDeviceEvidenceMatrix())) errors.push('W285 device matrix lost a required mobile, desktop, offline or no-WebGL evidence row.');
  if (!/data-local-device-safety/.test(localAiPage) || !/buildLocalAiDeviceSafetyGuidance/.test(localAiPage) || !/does not measure device temperature/i.test(guidanceSource) || !/download a model/i.test(localAiPage) || !/Local Lite/i.test(localAiPage)) errors.push('Local AI page must surface explicit device safety, reviewed Local Lite guidance and no-silent-download boundaries.');
  if (!/isDeviceLocalRuntimeEndpoint/.test(runtimeSource) || !/data-local-self-test/.test(localAiPage)) errors.push('W285 must retain explicit loopback-only user-tapped Local AI verification.');
  if (!/localModelBrowserInstaller:\s*false/.test(deviceSource) || !/truth:\s*'This is a local readiness record/.test(deviceSource)) errors.push('Device readiness source lost its local-only claim boundary.');
  if (!/W285 \| Local AI\/device support matrix \| \*\*W285-A0 source baseline complete/.test(plan)) errors.push('Canonical plan must retain the W285-A0 source baseline and pending-evidence boundary.');
  if (!packageJson.scripts?.['qa:w285-local-ai-device-support']) errors.push('package.json is missing the W285 QA script.');

  const report = {
    schema: 'eonapp.w285.local-ai-device-support-source-gate-report.v1',
    wave: 'W285-A0',
    ok: errors.length === 0,
    interpretation: 'PASS proves only source-level conservative device guidance, reviewed browser-local Lite routing and explicit local runtime boundaries. It is not a device benchmark, physical-device test, thermal/battery/storage certification, Local Lite inference proof, Local AI availability proof, or launch approval.',
    errors
  };
  const artifactDir = path.join(root, 'artifacts', 'w285-local-ai-device-support-gate');
  fs.mkdirSync(artifactDir, { recursive: true });
  fs.writeFileSync(path.join(artifactDir, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  return report;
}

function main() {
  const report = runW285LocalAiDeviceSupportGate();
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    return 1;
  }
  console.log('W285 Local AI/device support source gate passed: conservative local guidance and physical-evidence limits preserved.');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
