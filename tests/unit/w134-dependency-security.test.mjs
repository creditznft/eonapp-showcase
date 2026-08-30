import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const lockEntries = Object.keys(lock.packages || {});

const banned = [
  '@irys/web-upload',
  '@irys/web-upload-ethereum',
  '@irys/web-upload-ethereum-ethers-v6',
  'ethers',
  '@lhci/cli',
  'crypto-browserify',
  'vite-plugin-node-polyfills',
  'node-stdlib-browser'
];

test('W134 removes vulnerable direct dependency families from package manifests', () => {
  const directMaps = [packageJson.dependencies || {}, packageJson.devDependencies || {}, packageJson.optionalDependencies || {}];
  for (const name of banned) {
    assert.equal(directMaps.some((map) => Object.hasOwn(map, name)), false, `${name} must not be a direct dependency`);
    assert.equal(lockEntries.some((entry) => entry === `node_modules/${name}` || entry.endsWith(`/node_modules/${name}`)), false, `${name} must not remain in lockfile`);
  }
});

test('W134 keeps a visible Arweave/Irys security hold instead of silent failure', () => {
  const source = fs.readFileSync('assets/js/utils/arweave-upload.js', 'utf8');
  assert.match(source, /W134 security posture/);
  assert.match(source, /getArweaveUploadSecurityHoldReason/);
  assert.match(source, /isArweaveUploadAvailable\(\) \{\r?\n  return false;/);
  assert.doesNotMatch(source, /import\(['"](?:@irys|ethers)/);
});

test('W134 direct wallet checkout encodes native and ERC-20 payments without ethers', () => {
  const source = fs.readFileSync('assets/js/subscription-page.js', 'utf8');
  assert.doesNotMatch(source, /from ['"]ethers['"]/);
  assert.doesNotMatch(source, /new Interface\(/);
  assert.doesNotMatch(source, /toBeHex\(/);
  assert.match(source, /function uint256ToHex/);
  assert.match(source, /function encodeErc20Transfer/);
  assert.match(source, /0xa9059cbb/);
});

test('W134 preserves final aggregate QA script', () => {
  assert.match(packageJson.scripts['qa:w134-dependency-security'], /w134-dependency-security-gate/);
  assert.match(packageJson.scripts['qa:w121-w134-visual-overhaul'], /qa:w121-w133-visual-overhaul/);
});
