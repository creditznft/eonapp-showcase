import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const source = fs.readFileSync(path.join(root, 'scripts', 'build-eon-local-companion-windows-test.mjs'), 'utf8');
const installerSource = fs.readFileSync(path.join(root, 'scripts', 'build-eon-local-companion-windows-test-installer.mjs'), 'utf8');
const wixSource = fs.readFileSync(path.join(root, 'installer', 'windows', 'EON-Local-Companion-UNSIGNED-TEST.wxs'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('RT90 Windows SEA test-artifact builder is reproducible and explicitly non-release', () => {
  assert.equal(pkg.scripts['build:local-companion:windows-test'], 'node scripts/build-eon-local-companion-windows-test.mjs');
  assert.equal(pkg.devDependencies.postject, '^1.0.0-alpha.6');
  assert.match(source, /--experimental-sea-config/);
  assert.match(source, /NODE_SEA_BLOB/);
  assert.match(source, /NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2/);
  assert.match(source, /windows-test', sourceCommitSegment/);
  assert.match(source, /build-local-companion/);
  assert.match(source, /artifactRoot/);
  assert.match(source, /COPYFILE_EXCL/);
  assert.match(source, /isWindowsCommandScript/);
  assert.doesNotMatch(source, /shell:\s*process\.platform/);
  assert.match(source, /signed:\s*false/);
  assert.match(source, /installer:\s*false/);
  assert.match(source, /releaseReady:\s*false/);
  assert.match(source, /publicDownloadAllowed:\s*false/);
  assert.match(source, /authenticodeProofRequiredBeforeRelease:\s*true/);
});

test('RT90 Windows MSI test-installer builder remains per-user, unsigned and trust-cleaning only', () => {
  assert.equal(pkg.scripts['build:local-companion:windows-test-installer'], 'node scripts/build-eon-local-companion-windows-test-installer.mjs');
  assert.match(installerSource, /WiX Toolset v7\.0/);
  assert.match(installerSource, /windows-test', sourceCommitSegment/);
  assert.match(installerSource, /EON_WIX_ACCEPT_OSMF !== '1'/);
  assert.match(installerSource, /wix eula accept wix7/);
  assert.doesNotMatch(installerSource, /--accept-osmf-eula/);
  assert.match(installerSource, /artifact\?\.signed !== false/);
  assert.match(installerSource, /publicDownloadAllowed !== false/);
  assert.match(installerSource, /authenticodeProofRequiredBeforeRelease:\s*true/);
  assert.match(wixSource, /Scope="perUser"/);
  assert.match(wixSource, /StandardDirectory Id="LocalAppDataFolder"/);
  assert.match(wixSource, /Directory Id="EonAppTrustDirectory" Name="EONAPP"/);
  assert.doesNotMatch(wixSource, /UserProfileFolder/);
  assert.match(wixSource, /UNSIGNED TEST/);
  assert.match(wixSource, /local-companion-trusted-browsers\.json/);
  assert.match(wixSource, /On="uninstall"/);
  assert.doesNotMatch(wixSource, /RunKey|StartupFolder|autostart/i);
});
