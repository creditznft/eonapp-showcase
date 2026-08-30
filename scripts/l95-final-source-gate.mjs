import { existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const LIVE_AUTHORITY = '7a833c91203c5c1dc82e8529c83a619473d67261';
const root = process.cwd();

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
    ...options,
  });
  if (result.status !== 0) {
    if (options.capture) {
      process.stderr.write(result.stdout || '');
      process.stderr.write(result.stderr || '');
    }
    process.exit(result.status || 1);
  }
  return result;
}

function lines(result) {
  return String(result?.stdout || '')
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

run('git', ['merge-base', '--is-ancestor', LIVE_AUTHORITY, 'HEAD']);
run('git', ['diff', '--check', `${LIVE_AUTHORITY}..HEAD`]);
run('git', ['diff', '--check']);
run('git', ['diff', '--cached', '--check']);

const changed = new Set([
  ...lines(run('git', ['diff', '--name-only', '--diff-filter=ACMRTUXB', `${LIVE_AUTHORITY}..HEAD`], { capture: true })),
  ...lines(run('git', ['diff', '--name-only', '--diff-filter=ACMRTUXB'], { capture: true })),
  ...lines(run('git', ['diff', '--cached', '--name-only', '--diff-filter=ACMRTUXB'], { capture: true })),
  ...lines(run('git', ['ls-files', '--others', '--exclude-standard'], { capture: true })),
]);
const changedFiles = [...changed].sort();
const jsModules = changedFiles.filter((file) => /\.(?:js|mjs)$/.test(file) && existsSync(path.resolve(root, file)));
for (const file of jsModules) run(process.execPath, ['--check', path.resolve(root, file)]);

const launch95Tests = readdirSync(path.join(root, 'tests/unit'))
  .filter((name) => /^l95-.*\.test\.mjs$/.test(name))
  .sort()
  .map((name) => path.join('tests/unit', name));

if (!launch95Tests.length) {
  console.error('Launch95 gate failed: no l95 unit tests found.');
  process.exit(1);
}

run(process.execPath, ['--test', ...launch95Tests]);
run(process.execPath, ['scripts/run-current-unit-suite.mjs']);

const crossSystemAuthorities = [
  'scripts/institutional-ai-v2-gate.mjs',
  'scripts/r3a1-ai-api-contract-gate.mjs',
  'scripts/w281-ai-provider-lifecycle-gate.mjs',
  'scripts/w306-local-first-boundary-gate.mjs',
  'scripts/rt86-retention-notification-scale-gate.mjs',
  'scripts/rt87-push-device-entitlement-gate.mjs',
  'scripts/a15-c03-open-world-destination-gate.mjs',
  'scripts/a15-c05-outcome-progression-bridge-gate.mjs',
  'scripts/a15-c08-command-hub-convergence-gate.mjs',
  'scripts/a15-c09-signal-frontier-summit-gate.mjs',
  'scripts/a15-c10-frontier-region-governance-gate.mjs',
];
const readOnlyGateEnv = { ...process.env, EONAPP_GATE_WRITE_EVIDENCE: '0' };
const authorityStatusBefore = run('git', ['status', '--porcelain=v1', '--untracked-files=all'], { capture: true }).stdout || '';
for (const authority of crossSystemAuthorities) run(process.execPath, [authority], { env: readOnlyGateEnv });
const authorityStatusAfter = run('git', ['status', '--porcelain=v1', '--untracked-files=all'], { capture: true }).stdout || '';
if (authorityStatusAfter !== authorityStatusBefore) {
  console.error('Launch95 gate failed: a read-only cross-system authority changed the working tree.');
  process.stderr.write('--- status before authorities ---\n');
  process.stderr.write(authorityStatusBefore || '(clean)\n');
  process.stderr.write('--- status after authorities ---\n');
  process.stderr.write(authorityStatusAfter || '(clean)\n');
  process.exit(1);
}
run('git', ['diff', '--check']);
run('git', ['diff', '--cached', '--check']);

console.log(`[L95_FINAL_SOURCE_GATE] PASS tests=${launch95Tests.length} changed=${changedFiles.length} jsModules=${jsModules.length} maintainedSuite=pass crossSystemAuthorities=${crossSystemAuthorities.length} readOnlyAuthorities=clean base=${LIVE_AUTHORITY.slice(0, 8)}`);
