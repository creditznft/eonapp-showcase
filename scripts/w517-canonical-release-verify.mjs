#!/usr/bin/env node
/** W517 one-command source release verification. Source gates only; never deployment/device proof. */
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeW517EphemeralJson } from './w517-evidence-output.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCli = process.env.npm_execpath && path.isAbsolute(process.env.npm_execpath)
  ? [process.execPath, process.env.npm_execpath]
  : [process.platform === 'win32' ? 'npm.cmd' : 'npm'];
const npmCommand = (...args) => [...npmCli, ...args];
const canonicalCommand = (...args) => ['npm', ...args];
const advisoryChecks = Object.freeze([
  Object.freeze({
    id: 'pwa-install',
    command: 'npm run qa:pwa-install',
    reason: 'Advisory only: static install-shape and manifest QA, not physical install, update, or rollback proof.'
  })
]);
const gates = Object.freeze([
  Object.freeze({ id: 'clean-checkout-before', command: canonicalCommand('run', 'verify:clean-checkout'), spawnCommand: npmCommand('run', 'verify:clean-checkout') }),
  Object.freeze({ id: 'w524-portability-handover', command: canonicalCommand('run', 'qa:w524-portability-handover'), spawnCommand: npmCommand('run', 'qa:w524-portability-handover') }),
  Object.freeze({ id: 'unit', command: canonicalCommand('run', 'test:unit'), spawnCommand: npmCommand('run', 'test:unit') }),
  Object.freeze({ id: 'w520-core-modularisation', command: canonicalCommand('run', 'qa:w520-core-modularisation'), spawnCommand: npmCommand('run', 'qa:w520-core-modularisation') }),
  Object.freeze({ id: 'w521-city-source-engineering', command: canonicalCommand('run', 'qa:w521-eon-city-source-engineering'), spawnCommand: npmCommand('run', 'qa:w521-eon-city-source-engineering') }),
  Object.freeze({ id: 'w522-gate-risk-convergence', command: canonicalCommand('run', 'qa:w522-gate-risk-convergence'), spawnCommand: npmCommand('run', 'qa:w522-gate-risk-convergence') }),
  Object.freeze({ id: 'w524-device-pwa-evidence-rehearsal', command: canonicalCommand('run', 'qa:w524-device-pwa-evidence-rehearsal'), spawnCommand: npmCommand('run', 'qa:w524-device-pwa-evidence-rehearsal') }),
  Object.freeze({ id: 'w518-workspace-capsule', command: canonicalCommand('run', 'qa:w518-workspace-capsule'), spawnCommand: npmCommand('run', 'qa:w518-workspace-capsule') }),
  Object.freeze({ id: 'w525a-google-drive-vault-profile', command: canonicalCommand('run', 'qa:w525a-google-drive-vault-profile'), spawnCommand: npmCommand('run', 'qa:w525a-google-drive-vault-profile') }),
  Object.freeze({ id: 'w525b-account-vault-ux', command: canonicalCommand('run', 'qa:w525b-account-vault-ux'), spawnCommand: npmCommand('run', 'qa:w525b-account-vault-ux') }),
  Object.freeze({ id: 'w537-consumer-ux-compression', command: canonicalCommand('run', 'qa:w537-consumer-ux-compression'), spawnCommand: npmCommand('run', 'qa:w537-consumer-ux-compression') }),
  Object.freeze({ id: 'w527-env-local-ai', command: canonicalCommand('run', 'qa:w527-env-local-ai'), spawnCommand: npmCommand('run', 'qa:w527-env-local-ai') }),
  Object.freeze({ id: 'w528-machine-evidence', command: canonicalCommand('run', 'qa:w528-machine-evidence'), spawnCommand: npmCommand('run', 'qa:w528-machine-evidence') }),
  Object.freeze({ id: 'w529-android-emulator', command: canonicalCommand('run', 'qa:w529-android-emulator'), spawnCommand: npmCommand('run', 'qa:w529-android-emulator') }),
  Object.freeze({ id: 'w530-security-oauth-structural', command: canonicalCommand('run', 'qa:w530-security-oauth-structural'), spawnCommand: npmCommand('run', 'qa:w530-security-oauth-structural') }),
  Object.freeze({ id: 'w533-domain-continuity', command: canonicalCommand('run', 'qa:w533-domain-continuity'), spawnCommand: npmCommand('run', 'qa:w533-domain-continuity') }),
  Object.freeze({ id: 'w534-historical-documentation', command: canonicalCommand('run', 'qa:w534-historical-documentation'), spawnCommand: npmCommand('run', 'qa:w534-historical-documentation') }),
  Object.freeze({ id: 'w535-release-truth-reaudit', command: canonicalCommand('run', 'qa:w535-release-truth-reaudit'), spawnCommand: npmCommand('run', 'qa:w535-release-truth-reaudit') }),
  Object.freeze({ id: 'w536-google-drive-snapshot', command: canonicalCommand('run', 'qa:w536-google-drive-snapshot'), spawnCommand: npmCommand('run', 'qa:w536-google-drive-snapshot') }),
  Object.freeze({ id: 'lint', command: canonicalCommand('run', 'lint', '--', '--max-warnings=0'), spawnCommand: npmCommand('run', 'lint', '--', '--max-warnings=0') }),
  Object.freeze({ id: 'source-syntax', command: canonicalCommand('run', 'qa:w517-source-syntax'), spawnCommand: npmCommand('run', 'qa:w517-source-syntax') }),
  Object.freeze({ id: 'build', command: canonicalCommand('run', 'build'), spawnCommand: npmCommand('run', 'build') }),
  Object.freeze({ id: 'w519-built-output-quarantine', command: canonicalCommand('run', 'qa:w519-legacy-transport-quarantine:dist'), spawnCommand: npmCommand('run', 'qa:w519-legacy-transport-quarantine:dist') }),
  Object.freeze({ id: 'w521-built-output-fence', command: canonicalCommand('run', 'qa:w521-eon-city-source-engineering:dist'), spawnCommand: npmCommand('run', 'qa:w521-eon-city-source-engineering:dist') }),
  Object.freeze({ id: 'w522-built-output-convergence', command: canonicalCommand('run', 'qa:w522-gate-risk-convergence:dist'), spawnCommand: npmCommand('run', 'qa:w522-gate-risk-convergence:dist') }),
  Object.freeze({ id: 'smoke-build', command: canonicalCommand('run', 'smoke:build'), spawnCommand: npmCommand('run', 'smoke:build') }),
  Object.freeze({ id: 'site-audit', command: canonicalCommand('run', 'audit:site'), spawnCommand: npmCommand('run', 'audit:site') }),
  Object.freeze({ id: 'public-output-quarantine', command: canonicalCommand('run', 'qa:w239-public-output-quarantine'), spawnCommand: npmCommand('run', 'qa:w239-public-output-quarantine') }),
  Object.freeze({ id: 'launch-readiness', command: canonicalCommand('run', 'launch:readiness'), spawnCommand: npmCommand('run', 'launch:readiness') }),
  Object.freeze({ id: 'production-dependency-audit', command: canonicalCommand('audit', '--omit=dev'), spawnCommand: npmCommand('audit', '--omit=dev') }),
  Object.freeze({ id: 'clean-checkout-after', command: canonicalCommand('run', 'verify:clean-checkout'), spawnCommand: npmCommand('run', 'verify:clean-checkout') })
]);

const results = [];
let failed = false;
for (const gate of gates) {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const run = spawnSync(gate.spawnCommand[0], gate.spawnCommand.slice(1), { cwd: ROOT, stdio: 'inherit' });
  const exitCode = typeof run.status === 'number' ? run.status : 1;
  results.push({ id: gate.id, command: gate.command.join(' '), startedAt, durationMs: Date.now() - started, exitCode });
  if (exitCode !== 0) {
    failed = true;
    break;
  }
}

const receipt = {
  schema: 'eonapp.w517.canonical-release-verification.v1',
  ok: !failed,
  recordedAt: new Date().toISOString(),
  node: process.version,
  npmUserAgent: process.env.npm_config_user_agent || null,
  scope: 'Current source verification only. This receipt is not production, browser, physical-device, commercial or launch certification.',
  advisoryChecks,
  results
};
const evidencePath = writeW517EphemeralJson('canonical-release-verification-receipt.json', receipt, { root: ROOT });
console.log(JSON.stringify({ ...receipt, evidencePath }, null, 2));
if (failed) process.exitCode = 1;
