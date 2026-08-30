#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W479M0_LOCAL_CREATOR_MEDIA_SETUP_CONTRACT, validateW479M0LocalCreatorMediaSetupContract } from '../config/w479m0-local-creator-media-setup-contract.mjs';
import { buildLocalCreatorMediaSetupOverview, buildLocalCreatorMediaSetupPlan } from '../assets/js/local-ai/local-creator-media-setup.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exists = (file) => existsSync(path.join(root, file));
const read = (file) => readFileSync(path.join(root, file), 'utf8');

export function inspectW479M0LocalCreatorMediaSetup({ writeArtifact = false } = {}) {
  const checks = [];
  const check = (id, value, detail) => {
    checks.push({ id, pass: Boolean(value), detail });
    assert.equal(Boolean(value), true, `${id}: ${detail}`);
  };
  const pkg = JSON.parse(read('package.json'));
  const source = read('assets/js/local-ai/local-creator-media-setup.js');
  const mobile = { label: 'Mobile browser', computeClass: 'mobile', acceleration: 'cpu-only', memoryGB: 4, cpuCores: 8, summary: 'Mobile guide mode.' };
  const rtx = { label: 'RTX creator device', computeClass: 'rtx-creator', acceleration: 'rtx', memoryGB: 16, cpuCores: 12, summary: 'Creator-capable GPU.' };
  const workstation = { label: 'Workstation', computeClass: 'workstation', acceleration: 'multi-gpu', memoryGB: 64, cpuCores: 24, summary: 'Advanced creator device.' };
  const mobileVideo = buildLocalCreatorMediaSetupPlan('video', { profile: mobile });
  const rtxImage = buildLocalCreatorMediaSetupPlan('image', { profile: rtx });
  const rtxVideo = buildLocalCreatorMediaSetupPlan('video', { profile: rtx });
  const workstationVideo = buildLocalCreatorMediaSetupPlan('video', { profile: workstation });
  const overview = buildLocalCreatorMediaSetupOverview({ profile: rtx });

  check('required-files', [
    'config/w479m0-local-creator-media-setup-contract.mjs',
    'assets/js/local-ai/local-creator-media-setup.js',
    'scripts/w479m0-local-creator-media-setup-gate.mjs',
    'tests/unit/w479m0-local-creator-media-setup.test.mjs'
  ].every(exists), 'M0 contract, runtime module, gate and tests exist');
  check('contract-valid', validateW479M0LocalCreatorMediaSetupContract().length === 0, 'M0 contract validates');
  check('script-wired', pkg.scripts['qa:w479m0-local-creator-media-setup'] === 'node scripts/w479m0-local-creator-media-setup-gate.mjs && node --test tests/unit/w479m0-local-creator-media-setup.test.mjs', 'package.json exposes M0 gate');
  check('mobile-video-guide-only', mobileVideo.state === 'guide-only' && mobileVideo.truth.generationAvailable === false, 'mobile video remains guide-only with no generation claim');
  check('rtx-image-candidate', ['candidate-local-runtime', 'advanced-local-runtime'].includes(rtxImage.state) && /ComfyUI/.test(rtxImage.runtimeRecommendation), 'RTX image gets a conservative ComfyUI local candidate');
  check('rtx-video-not-universal', rtxVideo.truth.generationAvailable === false && /self-test/i.test(rtxVideo.setupSteps.join(' ')), 'RTX video still requires proof and self-test');
  check('workstation-video-advanced-but-inactive', workstationVideo.state === 'advanced-local-runtime' && workstationVideo.truth.adapterConnected === false, 'workstation video can be advanced but remains inactive until adapter proof');
  check('proof-matrix-present', rtxImage.proofRequiredBeforeGeneration.includes('CSP-CORS-PNA-proof') && rtxImage.proofRequiredBeforeGeneration.includes('real-device-evidence'), 'CSP/CORS/PNA and real-device proof are required before generation');
  check('overview-truth', overview.releaseTruth.m0IsSetupGuidanceOnly === true && overview.releaseTruth.localImageAdapterActive === false && overview.releaseTruth.localVideoAdapterActive === false, 'overview remains setup guidance only');
  check('no-browser-install-or-download-code', !/fetch\(|XMLHttpRequest|navigator\.usb|navigator\.serial|local network scan|auto.?install/i.test(source), 'M0 module has no browser installer, downloader, or local network scan path');
  check('banned-claims', W479M0_LOCAL_CREATOR_MEDIA_SETUP_CONTRACT.bannedClaims.includes('local image/video ready') && W479M0_LOCAL_CREATOR_MEDIA_SETUP_CONTRACT.truthBoundary.rawMediaUploadActive === false, 'banned claims and raw-media upload boundary remain explicit');

  const result = Object.freeze({
    schema: 'eon.creator.local-media-setup-gate.w479m0.v1',
    wave: 'W479-M0',
    status: 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    samplePlans: Object.freeze({ mobileVideo, rtxImage, workstationVideo }),
    limitations: Object.freeze(['M0 is guided setup only. It does not connect ComfyUI, run a local image/video model, scan a LAN, download a model, save media output, or publish to a platform.'])
  });
  if (writeArtifact) {
    const dir = path.join(root, 'artifacts', 'w479m0-local-creator-media-setup');
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = inspectW479M0LocalCreatorMediaSetup({ writeArtifact: true });
  process.stdout.write(`W479-M0 local creator media setup gate passed (${result.checkCount}/${result.checkCount}). Setup guidance only; adapters remain inactive.\n`);
}
