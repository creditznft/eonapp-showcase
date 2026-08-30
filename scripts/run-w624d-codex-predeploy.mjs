#!/usr/bin/env node
/**
 * W624D-stable / W646-current deterministic Codex predeploy orchestrator.
 *
 * A repository-local lock prevents overlapping certification runs from racing
 * while maintained tamper-detection tests temporarily alter and restore files.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = path.join(root, '.eonapp-codex-predeploy.lock');
const reportDirectory = path.join(root, 'reports', 'w624d-codex-predeploy');
const reportPath = path.join(reportDirectory, 'receipt.json');
const checkpointPath = path.join(reportDirectory, 'checkpoint.json');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

export const W624D_CODEX_PREDEPLOY_STEPS = Object.freeze([
  Object.freeze({ script: 'test:unit', args: [] }),
  Object.freeze({ script: 'qa:w228-ceo-red-team', args: [] }),
  Object.freeze({ script: 'qa:w621-live-dodo-cloudflare-rollout', args: [] }),
  Object.freeze({ script: 'qa:w623c-commercial-truth', args: [] }),
  Object.freeze({ script: 'qa:w623d-production-reachability', args: [] }),
  Object.freeze({ script: 'qa:w623e-information-architecture', args: [] }),
  Object.freeze({ script: 'qa:w623h-minimal-referral-ledger', args: [] }),
  Object.freeze({ script: 'qa:w623i-referral-scale', args: [] }),
  Object.freeze({ script: 'qa:w624a-city-art-bible', args: [] }),
  Object.freeze({ script: 'qa:w624b-city-runtime', args: [] }),
  Object.freeze({ script: 'qa:w624c-command-district', args: [] }),
  Object.freeze({ script: 'qa:w624d-wayfinder-camera', args: [] }),
  Object.freeze({ script: 'qa:w624e-eonbot-orbit', args: [] }),
  Object.freeze({ script: 'qa:w624f-command-district-npcs', args: [] }),
  Object.freeze({ script: 'qa:w624g-productive-rpg-loop', args: [] }),
  Object.freeze({ script: 'qa:w624h-truthful-command-center', args: [] }),
  Object.freeze({ script: 'qa:w624i-genuine-agent-theatre', args: [] }),
  Object.freeze({ script: 'qa:w624j-sharing-center', args: [] }),
  Object.freeze({ script: 'qa:w624k-accessibility-device', args: [] }),
  Object.freeze({ script: 'qa:w624l-flagship-certification', args: [] }),
  Object.freeze({ script: 'qa:w625a-real-local-image-tooling', args: [] }),
  Object.freeze({ script: 'qa:w625b-local-image-workflow-registry', args: [] }),
  Object.freeze({ script: 'qa:w625c-image-creation-foundation', args: [] }),
  Object.freeze({ script: 'qa:w625d-local-video-capability', args: [] }),
  Object.freeze({ script: 'qa:w625e-real-local-video-contract', args: [] }),
  Object.freeze({ script: 'qa:w625f-local-video-product-workflow', args: [] }),
  Object.freeze({ script: 'qa:w625g-local-video-efficiency-governor', args: [] }),
  Object.freeze({ script: 'qa:w625h-local-creator-certification', args: [] }),
  Object.freeze({ script: 'qa:w626a-direct-job-threat-model', args: [] }),
  Object.freeze({ script: 'qa:w626b-creator-companion', args: [] }),
  Object.freeze({ script: 'qa:w626c-external-image-adapters', args: [] }),
  Object.freeze({ script: 'qa:w626d-external-video-adapters', args: [] }),
  Object.freeze({ script: 'qa:w626e-unified-direct-job-fabric', args: [] }),
  Object.freeze({ script: 'qa:w626f-mobile-secure-path', args: [] }),
  Object.freeze({ script: 'qa:w626g-spending-outage-moderation', args: [] }),
  Object.freeze({ script: 'qa:w626h-byok-privacy-certification', args: [] }),
  Object.freeze({ script: 'qa:w627a-one-create-experience', args: [] }),
  Object.freeze({ script: 'qa:w627b-beginner-advanced-mode', args: [] }),
  Object.freeze({ script: 'qa:w627c-unified-creator-lifecycle', args: [] }),
  Object.freeze({ script: 'qa:w627d-creator-library', args: [] }),
  Object.freeze({ script: 'qa:w627e-project-continuation', args: [] }),
  Object.freeze({ script: 'qa:w627f-creator-data-survival', args: [] }),
  Object.freeze({ script: 'qa:w627g-unified-creator-certification', args: [] }),
  Object.freeze({ script: 'qa:w628a-real-dodo-checkout', args: [] }),
  Object.freeze({ script: 'qa:w628b-provider-webhook-ledger', args: [] }),
  Object.freeze({ script: 'qa:w628c-entitlement-activation', args: [] }),
  Object.freeze({ script: 'qa:w628d-portal-cancellation', args: [] }),
  Object.freeze({ script: 'qa:w628e-failure-reversal', args: [] }),
  Object.freeze({ script: 'qa:w628f-billing-certification', args: [] }),
  Object.freeze({ script: 'qa:w629a-signed-referral-attribution', args: [] }),
  Object.freeze({ script: 'qa:w629b-qualification-events', args: [] }),
  Object.freeze({ script: 'qa:w629c-eonkey-grant-ledger', args: [] }),
  Object.freeze({ script: 'qa:w629d-referral-reversal', args: [] }),
  Object.freeze({ script: 'qa:w629e-feature-unlock-redemption', args: [] }),
  Object.freeze({ script: 'qa:w629f-referral-key-ux', args: [] }),
  Object.freeze({ script: 'qa:w629g-vault-reveal-integration', args: [] }),
  Object.freeze({ script: 'qa:w629h-referral-red-team-certification', args: [] }),
  Object.freeze({ script: 'qa:w630-whole-app-ux', args: [] }),
  Object.freeze({ script: 'qa:w631-project-workspace-forge-automation', args: [] }),
  Object.freeze({ script: 'qa:w632-account-vault-custody', args: [] }),
  Object.freeze({ script: 'qa:w633-every-route-audit', args: [] }),
  Object.freeze({ script: 'qa:w634-responsive-accessibility-input', args: [] }),
  Object.freeze({ script: 'qa:w635-performance-cache-update-safety', args: [] }),
  Object.freeze({ script: 'qa:w636-security-privacy-abuse', args: [] }),
  Object.freeze({ script: 'qa:w637-persistence-migration-recovery', args: [] }),
  Object.freeze({ script: 'qa:w638-evidence-convergence', args: [] }),
  Object.freeze({ script: 'qa:w639-production-rehearsal-freeze', args: [] }),
  Object.freeze({ script: 'qa:w641-release-governance', args: [] }),
  Object.freeze({ script: 'qa:w642-product-truth-retention', args: [] }),
  Object.freeze({ script: 'qa:w643-creator-device-closure', args: [] }),
  Object.freeze({ script: 'qa:w644-city-owner-certification', args: [] }),
  Object.freeze({ script: 'qa:w645-production-evidence', args: [] }),
  Object.freeze({ script: 'qa:w646-final-freeze-deployment', args: [] }),
  Object.freeze({ script: 'qa:w624d-current-contract-alignment', args: [] }),
  Object.freeze({ script: 'qa:w624d-test-archive', args: [] }),
  Object.freeze({ script: 'qa:w660-release-source', args: [] }),
  Object.freeze({ script: 'lint', args: ['--', '--max-warnings=0'] }),
  Object.freeze({ script: 'security:secret-scan', args: ['--', '--allow-no-history'] }),
  Object.freeze({ script: 'build', args: [] }),
  Object.freeze({ script: 'qa:w759-production-asset-graph', args: [] }),
  Object.freeze({ script: 'qa:w660-city-emitted-candidate', args: [] }),
  Object.freeze({ script: 'qa:w655-pages-routing', args: [] }),
  Object.freeze({ script: 'smoke:build', args: [] }),
  Object.freeze({ script: 'qa:w635-build-performance', args: [] }),
  Object.freeze({ script: 'qa:w639-build-rehearsal', args: [] }),
  Object.freeze({ script: 'qa:w623f-certification-v2', args: [] })
]);


const FINGERPRINT_EXCLUDED_DIRECTORIES = new Set([
  '.git', 'node_modules', 'dist', 'reports', 'artifacts', 'tmp'
]);
const FINGERPRINT_EXTENSIONS = new Set([
  '.cjs', '.css', '.html', '.js', '.json', '.jsx', '.md', '.mjs', '.sql', '.svg', '.ts', '.tsx', '.txt', '.yaml', '.yml'
]);
const FINGERPRINT_ROOT_FILES = new Set([
  '_headers', '_redirects', 'package.json', 'package-lock.json', 'sw.js', 'vite.config.js', 'vite.config.mjs'
]);

function collectFingerprintFiles(directory = root, relativePrefix = '') {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name === '.eonapp-codex-predeploy.lock') continue;
    if (relativePrefix === '' && (
      /^CHANGED_FILES_W62[456789][A-Z]/.test(entry.name)
      || /^EONAPP_W62[456789][A-Z]_(VALIDATION_RECEIPT|CODEX_PREDEPLOY_RECEIPT|CURRENT_UNIT_RECEIPT|PACKAGING_RECEIPT)/.test(entry.name)
      || /^CHANGED_FILES_W633(?:_|\.)/.test(entry.name)
      || /^EONAPP_W633_(SOURCE_COMPLETION|VALIDATION_RECEIPT|CODEX_PREDEPLOY_RECEIPT|CURRENT_UNIT_RECEIPT|PACKAGING_RECEIPT)/.test(entry.name)
      || /^CHANGED_FILES_W634(?:_|\.)/.test(entry.name)
      || /^EONAPP_W634_(SOURCE_COMPLETION|VALIDATION_RECEIPT|CODEX_PREDEPLOY_RECEIPT|CURRENT_UNIT_RECEIPT|PACKAGING_RECEIPT)/.test(entry.name)
      || /^CHANGED_FILES_W635(?:_|\.)/.test(entry.name)
      || /^EONAPP_W635_(SOURCE_COMPLETION|VALIDATION_RECEIPT|CODEX_PREDEPLOY_RECEIPT|CURRENT_UNIT_RECEIPT|PACKAGING_RECEIPT)/.test(entry.name)
      || /^CHANGED_FILES_W636(?:_W637)?(?:_|\.)/.test(entry.name)
      || /^CHANGED_FILES_W638(?:_W639)?(?:_|\.)/.test(entry.name)
      || /^EONAPP_W63[89]_(SOURCE_COMPLETION|VALIDATION_RECEIPT|CODEX_PREDEPLOY_RECEIPT|CURRENT_UNIT_RECEIPT|PACKAGING_RECEIPT)/.test(entry.name)
      || /^EONAPP_W63[67]_(SOURCE_COMPLETION|VALIDATION_RECEIPT|CODEX_PREDEPLOY_RECEIPT|CURRENT_UNIT_RECEIPT|PACKAGING_RECEIPT)/.test(entry.name)
      || /^00_START_HERE_NEXT_CHAT_W63[68]_/.test(entry.name)
      || /^00_START_HERE_NEXT_CHAT_W640_/.test(entry.name)
      || /^01_COPY_PASTE_NEXT_CHAT_PROMPT_W63[68]_/.test(entry.name)
      || /^01_COPY_PASTE_NEXT_CHAT_PROMPT_W640_/.test(entry.name)
    )) continue;
    const relative = relativePrefix ? `${relativePrefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (FINGERPRINT_EXCLUDED_DIRECTORIES.has(entry.name)) continue;
      files.push(...collectFingerprintFiles(absolute, relative));
      continue;
    }
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (relativePrefix === '' && FINGERPRINT_ROOT_FILES.has(entry.name)) files.push(relative);
    else if (FINGERPRINT_EXTENSIONS.has(extension)) files.push(relative);
  }
  return files;
}

function computeSourceFingerprint() {
  const hash = crypto.createHash('sha256');
  const files = collectFingerprintFiles();
  for (const relative of files) {
    hash.update(relative);
    hash.update('\0');
    hash.update(fs.readFileSync(path.join(root, relative)));
    hash.update('\0');
  }
  return Object.freeze({ algorithm: 'sha256', digest: hash.digest('hex'), fileCount: files.length });
}

function readCheckpoint(fingerprint) {
  if (!fs.existsSync(checkpointPath)) return null;
  try {
    const checkpoint = JSON.parse(fs.readFileSync(checkpointPath, 'utf8'));
    const completed = Array.isArray(checkpoint?.steps) ? checkpoint.steps : [];
    const validPrefix = completed.every((row, index) => {
      const expected = W624D_CODEX_PREDEPLOY_STEPS[index];
      return expected && row?.status === 0 && row.script === expected.script && JSON.stringify(row.args || []) === JSON.stringify(expected.args || []);
    });
    if (checkpoint?.sourceFingerprint?.digest === fingerprint.digest && validPrefix) return checkpoint;
  } catch {}
  fs.rmSync(checkpointPath, { force: true });
  return null;
}

function writeCheckpoint(payload) {
  fs.mkdirSync(reportDirectory, { recursive: true });
  fs.writeFileSync(checkpointPath, `${JSON.stringify(payload, null, 2)}\n`);
}

function processExists(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
}

function acquireLock() {
  if (fs.existsSync(lockPath)) {
    let lock = null;
    try { lock = JSON.parse(fs.readFileSync(lockPath, 'utf8')); } catch {}
    if (processExists(Number(lock?.pid))) {
      throw new Error(`Another Codex predeploy run is active (PID ${lock.pid}). Do not start overlapping certification.`);
    }
    fs.rmSync(lockPath, { force: true });
  }
  const descriptor = fs.openSync(lockPath, 'wx');
  fs.writeFileSync(descriptor, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), schema: 'eonapp.codex-predeploy-lock.w624h.v1' }, null, 2));
  fs.closeSync(descriptor);
}

function writeReceipt(payload) {
  fs.mkdirSync(reportDirectory, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`);
}

function runStep(step, fingerprint) {
  return new Promise((resolve) => {
    const child = spawn(npmCommand, ['run', step.script, ...step.args], {
      cwd: root,
      env: { ...process.env, EONAPP_TEST_CONCURRENCY: '1', EONAPP_CERTIFICATION_FINGERPRINT: fingerprint.digest },
      stdio: 'inherit',
      shell: process.platform === 'win32',
      windowsHide: true
    });
    child.once('error', () => resolve(1));
    child.once('exit', (code) => resolve(Number(code ?? 1)));
  });
}

export async function runW624dCodexPredeploy() {
  acquireLock();
  const fingerprint = computeSourceFingerprint();
  const checkpoint = readCheckpoint(fingerprint);
  const startedAt = new Date(checkpoint?.startedAt || Date.now());
  const results = Array.isArray(checkpoint?.steps) ? [...checkpoint.steps] : [];
  const resumedStepCount = results.length;
  try {
    if (resumedStepCount > 0) {
      console.log(`[CODEX-PREDEPLOY] RESUME ${resumedStepCount}/${W624D_CODEX_PREDEPLOY_STEPS.length} completed stages; source fingerprint ${fingerprint.digest.slice(0, 12)}… unchanged.`);
    } else {
      writeCheckpoint({ schema: 'eonapp.codex-predeploy-checkpoint.w646.2026-07-11.v1', wave: 'W646', startedAt: startedAt.toISOString(), sourceFingerprint: fingerprint, steps: results });
    }
    for (let index = resumedStepCount; index < W624D_CODEX_PREDEPLOY_STEPS.length; index += 1) {
      const step = W624D_CODEX_PREDEPLOY_STEPS[index];
      const stepStarted = Date.now();
      console.log(`\n[CODEX-PREDEPLOY] STEP ${index + 1}/${W624D_CODEX_PREDEPLOY_STEPS.length}: npm run ${step.script}${step.args.length ? ` ${step.args.join(' ')}` : ''}`);
      const status = await runStep(step, fingerprint);
      const row = Object.freeze({ script: step.script, args: step.args, status, durationMs: Date.now() - stepStarted });
      if (row.status !== 0) {
        writeReceipt({ schema: 'eonapp.codex-predeploy-receipt.w646.2026-07-11.v1', wave: 'W646', ok: false, startedAt: startedAt.toISOString(), finishedAt: new Date().toISOString(), sourceFingerprint: fingerprint, resumedStepCount, failedStep: step.script, steps: [...results, row] });
        console.error(`[CODEX-PREDEPLOY] FAIL at ${step.script}. No later step was treated as certified.`);
        return row.status;
      }
      results.push(row);
      writeCheckpoint({ schema: 'eonapp.codex-predeploy-checkpoint.w646.2026-07-11.v1', wave: 'W646', startedAt: startedAt.toISOString(), sourceFingerprint: fingerprint, steps: results });
    }
    writeReceipt({ schema: 'eonapp.codex-predeploy-receipt.w646.2026-07-11.v1', wave: 'W646', ok: true, startedAt: startedAt.toISOString(), finishedAt: new Date().toISOString(), sourceFingerprint: fingerprint, resumedStepCount, stepCount: results.length, steps: results });
    fs.rmSync(checkpointPath, { force: true });
    console.log(`\n[CODEX-PREDEPLOY] PASS ${results.length}/${W624D_CODEX_PREDEPLOY_STEPS.length}. Receipt: reports/w624d-codex-predeploy/receipt.json (stable path; current wave W646)`);
    return 0;
  } finally {
    fs.rmSync(lockPath, { force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exitCode = await runW624dCodexPredeploy(); }
  catch (error) { console.error(`[CODEX-PREDEPLOY] BLOCKED: ${error?.message || error}`); process.exitCode = 2; }
}