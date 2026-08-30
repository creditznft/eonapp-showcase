#!/usr/bin/env node
/**
 * W590 canonical source verifier.
 *
 * Runs every W555A–W590 source gate once, the full bounded current-product
 * suite once, then the normal build and static release checks. This is only
 * source validation; it never creates preview, production, identity, device,
 * commercial, or owner-approval evidence.
 */
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCli = process.env.npm_execpath && path.isAbsolute(process.env.npm_execpath)
  ? [process.execPath, process.env.npm_execpath]
  : [process.platform === 'win32' ? 'npm.cmd' : 'npm'];

const npmCommand = (...args) => [...npmCli, ...args];
const nodeCommand = (relative) => [process.execPath, relative];
const canonicalCommand = (...args) => ['npm', ...args];
const DEFAULT_TEST_CONCURRENCY = '8';
const unitConcurrency = String(process.env.EONAPP_TEST_CONCURRENCY || DEFAULT_TEST_CONCURRENCY).trim();

const SOURCE_GATES = Object.freeze([
  ['w555a-universal-workload-governor', 'scripts/w555a-universal-workload-governor-gate.mjs'],
  ['w555b-third-person-controller', 'scripts/w555b-third-person-controller-gate.mjs'],
  ['w556-landmark-focus', 'scripts/w556-landmark-focus-gate.mjs'],
  ['w557-workroom-membership-retention', 'scripts/w557-workroom-membership-retention-gate.mjs'],
  ['w558-project-mission-cards', 'scripts/w558-project-mission-cards-gate.mjs'],
  ['w559-city-resume-travel', 'scripts/w559-city-resume-travel-gate.mjs'],
  ['w560-city-ai-job-receipt', 'scripts/w560-city-ai-job-receipt-gate.mjs'],
  ['w561-eonbot-companion', 'scripts/w561-eonbot-companion-gate.mjs'],
  ['w562-city-voice-consent', 'scripts/w562-city-voice-consent-gate.mjs'],
  ['w563-useful-city-work-paths', 'scripts/w563-useful-city-work-paths-gate.mjs'],
  ['w564-city-vault-reveals', 'scripts/w564-city-vault-reveals-gate.mjs'],
  ['w565-city-fairness-safety', 'scripts/w565-city-fairness-safety-gate.mjs'],
  ['w566-city-art-source-register', 'scripts/w566-city-art-source-register-gate.mjs'],
  ['w567-city-binary-pipeline', 'scripts/w567-city-binary-pipeline-gate.mjs'],
  ['w568-command-horizon-street-kit', 'scripts/w568-command-horizon-street-kit-gate.mjs'],
  ['w569-city-cell-streamer', 'scripts/w569-city-cell-streamer-gate.mjs'],
  ['w570-city-npc-archetypes', 'scripts/w570-city-npc-archetypes-gate.mjs'],
  ['w571-eonbot-rig-and-staging', 'scripts/w571-eonbot-rig-and-staging-gate.mjs'],
  ['w572-local-soundscape-audio-policy', 'scripts/w572-local-soundscape-audio-policy-gate.mjs'],
  ['w573-seeded-city-ambience', 'scripts/w573-seeded-city-ambience-gate.mjs'],
  ['w574-open-sky-visual-profiles', 'scripts/w574-open-sky-visual-profiles-gate.mjs'],
  ['w575-command-horizon-live-gameplay', 'scripts/w575-command-horizon-live-gameplay-gate.mjs'],
  ['w576-w590-universe-completion', 'scripts/w576-w590-universe-completion-gate.mjs']
]);

const checks = Object.freeze([
  Object.freeze({ id: 'lint', command: canonicalCommand('run', 'lint', '--', '--max-warnings=0'), spawnCommand: npmCommand('run', 'lint', '--', '--max-warnings=0') }),
  ...SOURCE_GATES.map(([id, script]) => Object.freeze({ id, command: [process.execPath, script], spawnCommand: nodeCommand(script) })),
  Object.freeze({
    id: 'unit-current-product-suite',
    command: ['EONAPP_TEST_CONCURRENCY=' + unitConcurrency, ...canonicalCommand('run', 'test:unit')],
    spawnCommand: npmCommand('run', 'test:unit'),
    env: Object.freeze({ ...process.env, EONAPP_TEST_CONCURRENCY: unitConcurrency })
  }),
  Object.freeze({ id: 'build', command: canonicalCommand('run', 'build'), spawnCommand: npmCommand('run', 'build') }),
  Object.freeze({ id: 'smoke-build', command: canonicalCommand('run', 'smoke:build'), spawnCommand: npmCommand('run', 'smoke:build') }),
  Object.freeze({ id: 'site-audit', command: canonicalCommand('run', 'audit:site'), spawnCommand: npmCommand('run', 'audit:site') }),
  Object.freeze({ id: 'launch-readiness', command: canonicalCommand('run', 'launch:readiness'), spawnCommand: npmCommand('run', 'launch:readiness') }),
  Object.freeze({ id: 'production-dependency-audit', command: canonicalCommand('audit', '--omit=dev'), spawnCommand: npmCommand('audit', '--omit=dev') })
]);

const results = [];
let failed = false;
for (const check of checks) {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  const result = spawnSync(check.spawnCommand[0], check.spawnCommand.slice(1), {
    cwd: ROOT,
    stdio: 'inherit',
    env: check.env || process.env
  });
  const exitCode = typeof result.status === 'number' ? result.status : 1;
  results.push(Object.freeze({
    id: check.id,
    command: check.command.join(' '),
    startedAt,
    durationMs: Date.now() - started,
    exitCode
  }));
  if (exitCode !== 0) {
    failed = true;
    break;
  }
}

const receipt = Object.freeze({
  schema: 'eon.city.w590.canonical-source-verifier.v1',
  ok: !failed,
  sourceOnly: true,
  checkedAt: new Date().toISOString(),
  node: process.version,
  unitConcurrency,
  checkCount: checks.length,
  completedChecks: results.length,
  scope: 'Source validation only. This is not a preview deployment, production deployment, browser gameplay run, physical-device test, Google/OAuth completion, payment activation, security sign-off, or owner launch approval.',
  results: Object.freeze(results)
});
console.log(JSON.stringify(receipt, null, 2));
if (failed) process.exitCode = 1;
