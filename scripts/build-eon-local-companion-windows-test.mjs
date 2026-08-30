#!/usr/bin/env node
/**
 * Builds an unsigned Windows SEA test executable from the RT90 Companion
 * bundle. This is deliberately a non-release artifact: it is not an
 * installer, carries no signing claim, and must never be exposed as a public
 * download. A separately verified Authenticode-signed installer remains the
 * release gate described by the Companion distribution contract.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleDir = path.join(root, 'build-local-companion');
const artifactRoot = path.join(root, 'dist-local-companion');
const configPath = path.join(bundleDir, 'sea-config.json');
const bundlePath = path.join(bundleDir, 'eon-local-companion.cjs');
const blobPath = path.join(bundleDir, 'eon-local-companion.sea.blob');
const sourceCommit = gitValue(['rev-parse', 'HEAD']);
const sourceCommitSegment = /^[a-f0-9]{40}$/i.test(sourceCommit) ? sourceCommit.slice(0, 12) : 'unknown-source';
const testDir = path.join(artifactRoot, 'windows-test', sourceCommitSegment);
const executablePath = path.join(testDir, 'EON-Local-Companion-UNSIGNED-TEST.exe');
const manifestPath = path.join(testDir, 'unsigned-test-artifact.json');
const sentinelFuse = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

function fail(message) {
  throw new Error(message);
}

function run(command, args, options = {}) {
  const isWindowsCommandScript = process.platform === 'win32' && /\.cmd$/i.test(command);
  const result = spawnSync(isWindowsCommandScript ? (process.env.ComSpec || 'cmd.exe') : command, isWindowsCommandScript ? ['/d', '/s', '/c', command, ...args] : args, {
    cwd: options.cwd || root,
    stdio: 'inherit'
  });
  if (result.status !== 0) fail(`${path.basename(command)} failed with status ${result.status ?? 'unknown'}.`);
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function gitValue(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return result.status === 0 ? String(result.stdout || '').trim() : '';
}

if (process.platform !== 'win32') fail('This non-release Companion test artifact can only be built on Windows.');
if (!fs.existsSync(bundlePath) || !fs.existsSync(configPath)) {
  fail('Run npm run build:local-companion:bundle before the Windows test artifact build.');
}
if (fs.existsSync(executablePath) || fs.existsSync(manifestPath)) {
  fail('Existing Windows test artifact found; preserve it or remove it explicitly before rebuilding.');
}

fs.mkdirSync(testDir, { recursive: true });
run(process.execPath, ['--experimental-sea-config', configPath], { cwd: bundleDir });
if (!fs.existsSync(blobPath)) fail('Node SEA preparation blob was not created.');

fs.copyFileSync(process.execPath, executablePath, fs.constants.COPYFILE_EXCL);
const postject = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'postject.cmd' : 'postject');
if (!fs.existsSync(postject)) fail('Pinned postject injector is unavailable; run npm ci before building the Windows test artifact.');
run(postject, [executablePath, 'NODE_SEA_BLOB', blobPath, '--sentinel-fuse', sentinelFuse]);

const manifest = {
  schema: 'eon.local-companion.windows-test-artifact.rt90.v1',
  generatedAt: new Date().toISOString(),
  sourceCommit,
  sourceTree: gitValue(['rev-parse', 'HEAD^{tree}']),
  artifact: {
    file: path.basename(executablePath),
    sha256: sha256(executablePath),
    bytes: fs.statSync(executablePath).size,
    signed: false,
    installer: false,
    releaseReady: false
  },
  policy: {
    publicDownloadAllowed: false,
    consumerInstallerClaimAllowed: false,
    authenticodeProofRequiredBeforeRelease: true
  }
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, testDir, manifest }, null, 2));
