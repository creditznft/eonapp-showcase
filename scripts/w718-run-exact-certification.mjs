#!/usr/bin/env node
/** Run once in a healthy exact-lockfile Node 22 environment. Never changes dependency versions. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'reports/institutional/w718-exact-certification-receipt.json');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const commands = [
  ['npm', ['run', 'verify:institutional-source']],
  ['npm', ['run', 'verify:institutional-security']],
  ['npm', ['run', 'test:unit']],
  ['npm', ['run', 'build']],
  ['npm', ['run', 'smoke:build']]
];
function packageVersion(name) {
  const file = path.join(root, 'node_modules', ...name.split('/'), 'package.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8')).version || null;
}
const exact = {
  core: packageVersion('@babylonjs/core'),
  loaders: packageVersion('@babylonjs/loaders')
};
const expected = {
  core: packageJson.dependencies?.['@babylonjs/core'],
  loaders: packageJson.dependencies?.['@babylonjs/loaders']
};
const receipt = {
  schema: 'eonapp.w718.exact-certification-receipt.v1', wave: 'W718',
  startedAt: new Date().toISOString(), nodeVersion: process.version,
  exactDependencies: exact, expectedDependencies: expected,
  cleanInstallAssumed: true, commands: [], ok: false,
  independentCertificationAwarded: false,
  ownerApprovalStillRequired: true
};
if (exact.core !== expected.core || exact.loaders !== expected.loaders) {
  receipt.failure = 'Exact Babylon dependencies are unavailable. Run npm ci from the unchanged lockfile in a healthy registry environment.';
  receipt.finishedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
  console.error(`[W718-exact] FAIL ${receipt.failure}`);
  process.exit(1);
}
for (const [command, args] of commands) {
  const started = Date.now();
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  receipt.commands.push({ command: [command, ...args].join(' '), status: Number(result.status ?? 1), durationMs: Date.now() - started });
  if (result.status !== 0) {
    receipt.failure = `${command} ${args.join(' ')} failed`;
    receipt.finishedAt = new Date().toISOString();
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
    process.exit(Number(result.status || 1));
  }
}
receipt.ok = true;
receipt.finishedAt = new Date().toISOString();
receipt.failure = null;
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(receipt, null, 2)}\n`);
console.log('[W718-exact] PASS source, security, complete maintained unit suite, production build and smoke. Owner/browser/device scorecard remains required.');
