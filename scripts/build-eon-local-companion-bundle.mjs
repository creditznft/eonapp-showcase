#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import companionConfig from '../tools/eon-local-companion/vite.config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Vite clears this directory on every build. Internal test artifacts belong
// elsewhere so a running prior Companion cannot block the next build.
const outDir = path.join(root, 'build-local-companion');
const bundlePath = path.join(outDir, 'eon-local-companion.cjs');
const seaConfigPath = path.join(outDir, 'sea-config.json');
const manifestPath = path.join(outDir, 'release-source-manifest.json');

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function gitValue(args) {
  try { return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return ''; }
}

await build(companionConfig);
if (!fs.existsSync(bundlePath)) throw new Error('eon-local-companion-bundle-missing');

const seaConfig = {
  main: './eon-local-companion.cjs',
  output: './eon-local-companion.sea.blob',
  disableExperimentalSEAWarning: true,
  useSnapshot: false,
  useCodeCache: false
};
fs.writeFileSync(seaConfigPath, `${JSON.stringify(seaConfig, null, 2)}\n`);

const manifest = {
  schema: 'eon.local-companion.build-source.rt90.v1',
  generatedAt: new Date().toISOString(),
  sourceCommit: gitValue(['rev-parse', 'HEAD']),
  sourceTree: gitValue(['rev-parse', 'HEAD^{tree}']),
  nodeVersion: process.version,
  bundle: {
    file: path.basename(bundlePath),
    sha256: sha256(bundlePath),
    bytes: fs.statSync(bundlePath).size,
    format: 'commonjs-single-entry',
    target: 'node22'
  },
  seaConfig: {
    file: path.basename(seaConfigPath),
    sha256: sha256(seaConfigPath)
  },
  certification: {
    signedInstaller: false,
    autostart: false,
    updater: false,
    cleanUninstall: false,
    deviceProof: false
  }
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, outDir, manifest }, null, 2));
