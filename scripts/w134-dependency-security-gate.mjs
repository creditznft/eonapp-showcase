#!/usr/bin/env node
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const packageLock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

const bannedProjectDependencies = [
  '@irys/web-upload',
  '@irys/web-upload-ethereum',
  '@irys/web-upload-ethereum-ethers-v6',
  'ethers',
  '@lhci/cli',
  'crypto-browserify',
  'stream-browserify',
  'vite-plugin-node-polyfills',
  'node-stdlib-browser'
];

const directDependencyMaps = [
  packageJson.dependencies || {},
  packageJson.devDependencies || {},
  packageJson.optionalDependencies || {}
];

const failures = [];
for (const name of bannedProjectDependencies) {
  if (directDependencyMaps.some((map) => Object.hasOwn(map, name))) {
    failures.push(`Banned direct dependency is still present in package.json: ${name}`);
  }
}

const lockPackages = Object.keys(packageLock.packages || {});
for (const name of bannedProjectDependencies) {
  const nodeModulePath = `node_modules/${name}`;
  if (lockPackages.some((entry) => entry === nodeModulePath || entry.endsWith(`/${nodeModulePath}`))) {
    failures.push(`Banned dependency is still present in package-lock.json: ${name}`);
  }
}

const requiredScripts = [
  'qa:w134-dependency-security',
  'qa:w121-w134-visual-overhaul'
];
for (const name of requiredScripts) {
  if (!packageJson.scripts?.[name]) {
    failures.push(`Missing required W134 script: ${name}`);
  }
}

const arweaveUploadSource = fs.readFileSync('assets/js/utils/arweave-upload.js', 'utf8');
if (!arweaveUploadSource.includes('W134 security posture')) {
  failures.push('Arweave upload helper is missing the W134 security posture note.');
}
if (!arweaveUploadSource.includes('export function getArweaveUploadSecurityHoldReason')) {
  failures.push('Arweave upload helper must expose the security-hold reason for UI messaging.');
}
if (/import\(['"](?:@irys|ethers)/.test(arweaveUploadSource) || /from ['"]ethers['"]/.test(arweaveUploadSource)) {
  failures.push('Arweave upload helper must not dynamically import Irys or ethers in W134.');
}

const subscriptionSource = fs.readFileSync('assets/js/subscription-page.js', 'utf8');
if (subscriptionSource.includes("from 'ethers'") || subscriptionSource.includes('new Interface(') || subscriptionSource.includes('toBeHex(')) {
  failures.push('Subscription page must not bundle ethers for direct-wallet payment calldata.');
}
if (!subscriptionSource.includes('function encodeErc20Transfer') || !subscriptionSource.includes('0xa9059cbb')) {
  failures.push('Subscription page must keep local ERC-20 transfer calldata encoding.');
}

const viteSource = fs.readFileSync('vite.config.mjs', 'utf8');
if (viteSource.includes('vite-plugin-node-polyfills') || viteSource.includes('crypto-browserify')) {
  failures.push('Vite config must not ship the old Node polyfill/browserify stack.');
}

const docs = [
  'HANDOFF/W134_DEPENDENCY_SECURITY/EONAPP_W134_DEPENDENCY_SECURITY_HANDOFF_2026-06-12.md',
  'HANDOFF/W134_DEPENDENCY_SECURITY/CODEX_W134_FINAL_MERGE_DEPLOY_PROMPT_2026-06-12.md'
];
for (const file of docs) {
  if (!fs.existsSync(file)) failures.push(`Missing final W134 handoff doc: ${file}`);
}

if (failures.length) {
  console.error('W134 dependency security gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('W134 dependency security gate passed. Banned vulnerable dependency paths are removed from source manifest and lockfile.');
