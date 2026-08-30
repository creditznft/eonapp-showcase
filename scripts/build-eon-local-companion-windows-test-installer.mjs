#!/usr/bin/env node
/**
 * Builds an internal, unsigned MSI around the RT90 SEA test executable.
 * This is deliberately not a public or production installer: it cannot
 * modify the browser release contract and requires later Authenticode proof.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceCommit = gitValue(['rev-parse', 'HEAD']);
const sourceCommitSegment = /^[a-f0-9]{40}$/i.test(sourceCommit) ? sourceCommit.slice(0, 12) : 'unknown-source';
const testDir = path.join(root, 'dist-local-companion', 'windows-test', sourceCommitSegment);
const executablePath = path.join(testDir, 'EON-Local-Companion-UNSIGNED-TEST.exe');
const executableManifestPath = path.join(testDir, 'unsigned-test-artifact.json');
const wixSourcePath = path.join(root, 'installer', 'windows', 'EON-Local-Companion-UNSIGNED-TEST.wxs');
const installerDir = path.join(testDir, 'installer');
const installerPath = path.join(installerDir, 'EON-Local-Companion-UNSIGNED-TEST.msi');
const manifestPath = path.join(installerDir, 'unsigned-test-installer.json');
const wixPath = process.env.EON_WIX_PATH || 'C:\\Program Files\\WiX Toolset v7.0\\bin\\wix.exe';

function fail(message) { throw new Error(message); }
function sha256(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }
function gitValue(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  return result.status === 0 ? String(result.stdout || '').trim() : '';
}
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) fail(`${path.basename(command)} failed with status ${result.status ?? 'unknown'}.`);
}

if (process.platform !== 'win32') fail('The internal Windows Companion installer can only be built on Windows.');
if (!fs.existsSync(executablePath) || !fs.existsSync(executableManifestPath)) fail('Build the unsigned Windows SEA test executable first.');
if (!fs.existsSync(wixSourcePath)) fail('The internal WiX source is missing.');
if (!fs.existsSync(wixPath)) fail('WiX CLI is unavailable. Install WiX Toolset Command-Line Tools or set EON_WIX_PATH.');
if (fs.existsSync(installerPath) || fs.existsSync(manifestPath)) fail('Existing internal MSI found; preserve it or remove it explicitly before rebuilding.');
if (process.env.EON_WIX_ACCEPT_OSMF !== '1') {
  fail('WiX v7 requires its OSMF EULA to be accepted explicitly. Review it, then rerun with EON_WIX_ACCEPT_OSMF=1.');
}

const executableManifest = JSON.parse(fs.readFileSync(executableManifestPath, 'utf8'));
if (executableManifest?.artifact?.signed !== false || executableManifest?.artifact?.releaseReady !== false || executableManifest?.policy?.publicDownloadAllowed !== false) {
  fail('Only the explicitly non-release SEA test artifact may be wrapped in this internal MSI.');
}

fs.mkdirSync(installerDir, { recursive: true });
// WiX v7 records the owner's accepted OSMF EULA through `wix eula accept wix7`.
// It does not accept a per-build EULA flag; retain the explicit environment
// check above so internal MSI builds cannot silently rely on that machine state.
run(wixPath, ['build', wixSourcePath, '-d', `CompanionExe=${executablePath}`, '-arch', 'x64', '-o', installerPath]);
if (!fs.existsSync(installerPath)) fail('WiX did not create the expected internal MSI.');

const manifest = {
  schema: 'eon.local-companion.windows-test-installer.rt90.v1',
  generatedAt: new Date().toISOString(),
  sourceCommit,
  sourceTree: gitValue(['rev-parse', 'HEAD^{tree}']),
  installer: {
    file: path.basename(installerPath),
    sha256: sha256(installerPath),
    bytes: fs.statSync(installerPath).size,
    signed: false,
    releaseReady: false,
    publicDownloadAllowed: false
  },
  packagedExecutable: { file: path.basename(executablePath), sha256: sha256(executablePath) },
  lifecycle: {
    installScope: 'per-user',
    shortcut: 'Start Menu only',
    autostart: 'not installed',
    uninstallTrustCleanup: 'trusted browser record only',
    credentialsOrUserContentRemoved: false
  },
  policy: { authenticodeProofRequiredBeforeRelease: true, installerLifecycleDeviceCertificationRequired: true }
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, installerPath, manifest }, null, 2));
