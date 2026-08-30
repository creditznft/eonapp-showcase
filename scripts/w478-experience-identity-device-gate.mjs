#!/usr/bin/env node
/** W478 source gate: aggregate source controls without converting them into a release claim. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W478_EXPERIENCE_IDENTITY_DEVICE_SCHEMA,
  W478_SOURCE_LANES,
  W478_REQUIRED_EXTERNAL_EVIDENCE,
  W478_RELEASE_DECISION,
  validateW478ExperienceIdentityDeviceBoard,
  getW478Truth
} from '../config/w478-experience-identity-device-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOARD_PATH = 'release-evidence/W478_EXPERIENCE_IDENTITY_DEVICE_SOURCE_READINESS_2026-07-02/W478_BOARD.json';

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function checkIncludes(errors, text, marker, message) {
  if (!text.includes(marker)) errors.push(message);
}

export function inspectW478ExperienceIdentityDevice({ root = ROOT, writeArtifact = true } = {}) {
  const errors = [];
  const checks = [];
  const requiredFiles = [
    'config/w478-experience-identity-device-contract.mjs',
    'scripts/w478-experience-identity-device-gate.mjs',
    'release-evidence/W478_EXPERIENCE_IDENTITY_DEVICE_SOURCE_READINESS_2026-07-02/W478_BOARD.json',
    'config/w271-accessibility-i18n-contract.mjs',
    'scripts/w271-accessibility-i18n-source-gate.mjs',
    'config/w287-eonbot-language-voice-contract.mjs',
    'scripts/w287-eonbot-language-voice-gate.mjs',
    'scripts/w345-local-device-proof-kit-gate.mjs',
    'scripts/w145-update-safe-user-data-survival-gate.mjs',
    'functions/api/auth/google/start.js',
    'functions/api/auth/google/callback.js',
    'functions/api/auth/session.js',
    'functions/api/auth/logout.js',
    'functions/api/account/delete-request.js',
    'assets/js/local-first/eon-local-encrypted-export.js',
    'assets/js/local-first/eon-device-evidence-matrix.js'
  ];
  for (const relative of requiredFiles) {
    const exists = fs.existsSync(path.join(root, relative));
    checks.push({ id: `file:${relative}`, ok: exists });
    if (!exists) errors.push(`W478 required file is missing: ${relative}`);
  }

  const board = JSON.parse(read(root, BOARD_PATH));
  const boardCheck = validateW478ExperienceIdentityDeviceBoard(board);
  checks.push({ id: 'w478-board', ok: boardCheck.ok });
  errors.push(...boardCheck.errors);

  const packageJson = JSON.parse(read(root, 'package.json'));
  for (const lane of W478_SOURCE_LANES) {
    const present = typeof packageJson.scripts?.[lane.command] === 'string';
    checks.push({ id: `script:${lane.command}`, ok: present });
    if (!present) errors.push(`W478 required source lane script is missing: ${lane.command}`);
  }

  const voice = read(root, 'assets/js/chat/eonbot-interaction-preferences.js');
  checkIncludes(errors, voice, 'voiceOutputEnabled: false', 'W478 voice output preference must default to off.');
  checkIncludes(errors, voice, 'continuousVoiceEnabled: false', 'W478 continuous voice preference must default to off.');
  checkIncludes(errors, voice, 'Microphone capture still requires a separate user tap', 'W478 microphone access must retain an explicit user-action boundary.');
  checks.push({ id: 'voice-default-off', ok: !errors.some((error) => /voice output preference|continuous voice preference|microphone access/.test(error)) });

  const oauthStart = read(root, 'functions/api/auth/google/start.js');
  const oauthCallback = read(root, 'functions/api/auth/google/callback.js');
  const accountDelete = read(root, 'functions/api/account/delete-request.js');
  const identitySource = `${oauthStart}\n${oauthCallback}\n${accountDelete}`;
  checkIncludes(errors, identitySource, 'code_challenge_method', 'W478 optional OAuth source must retain PKCE.');
  checkIncludes(errors, identitySource, 'sameState', 'W478 optional OAuth source must verify state.');
  checkIncludes(errors, identitySource, 'DELETE_EON_ACCOUNT', 'W478 account deletion requires explicit confirmation.');
  checks.push({ id: 'identity-boundary', ok: !errors.some((error) => /OAuth source|account deletion/.test(error)) });

  const localExport = read(root, 'assets/js/local-first/eon-local-encrypted-export.js');
  checkIncludes(errors, localExport, 'automaticCrossDeviceSync: false', 'W478 local export source must not claim automatic cross-device sync.');
  checkIncludes(errors, localExport, 'AES-GCM-256', 'W478 portable local export source must retain encrypted local export metadata.');
  checks.push({ id: 'backup-boundary', ok: !errors.some((error) => /local export source/.test(error)) });

  const deviceMatrix = read(root, 'assets/js/local-first/eon-device-evidence-matrix.js');
  checkIncludes(errors, deviceMatrix, 'android-4gb', 'W478 device proof kit must retain Android coverage.');
  checkIncludes(errors, deviceMatrix, 'backup-restore', 'W478 device proof kit must retain backup/restore coverage.');
  checks.push({ id: 'device-kit-coverage', ok: !errors.some((error) => /device proof kit/.test(error)) });

  const truth = getW478Truth();
  if (truth.releaseDecision !== W478_RELEASE_DECISION) errors.push('W478 truth must remain NO_GO pending external evidence.');
  if (truth.accessibilityCertified || truth.googleOAuthLiveVerified || truth.androidIosPwaVerified || truth.updateRollbackVerified || truth.legacyTransportQuarantineIndependentlyReviewed) {
    errors.push('W478 truth must not claim a live external certification from source alone.');
  }

  const report = Object.freeze({
    schema: `${W478_EXPERIENCE_IDENTITY_DEVICE_SCHEMA}.gate-report`,
    sourceStatus: errors.length ? 'fail' : 'pass',
    releaseStatus: 'blocked-pending-reviewed-external-evidence',
    generatedAt: new Date().toISOString(),
    sourceLaneCount: W478_SOURCE_LANES.length,
    externalEvidenceCount: W478_REQUIRED_EXTERNAL_EVIDENCE.length,
    checks: Object.freeze(checks),
    truth,
    blockers: Object.freeze(W478_REQUIRED_EXTERNAL_EVIDENCE.map((entry) => `${entry.id}: ${entry.evidence}`)),
    errors: Object.freeze(errors)
  });

  if (writeArtifact) {
    const outDir = path.join(root, 'artifacts', 'w478-experience-identity-device-gate');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW478ExperienceIdentityDevice({ writeArtifact: true });
  if (report.sourceStatus !== 'pass') {
    process.stderr.write(`${report.errors.join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`W478 experience/identity/device source gate passed (${report.sourceLaneCount} source lanes; ${report.externalEvidenceCount} external evidence lanes remain open).\n`);
  }
}
