#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const dist = path.join(root, 'dist');
// W423: production has one direct Babylon City document. The historic Lite, Three.js
// and Play documents remain in source for archival tests only; public aliases redirect to
// /eoncity and must not be emitted as parallel production entry points.
const required = [
  'projects.html', 'library.html', 'workspace.html',
  'eoncity.html', 'market.html', 'trade.html',
  'automations.html', 'profile.html', 'vault.html', 'capsule.html',
  'local-ai.html', 'realm-studio.html', 'referral.html', 'rewards.html',
  'settings.html', 'help.html', 'install.html',
  'telegram.html', 'billing.html', '404.html', 'offline.html', '_headers', '_redirects'
];
const retiredCityOutputs = ['eoncity-lite.html', 'eoncity-3d.html', 'eoncity-play.html'];
const requiredCityRedirects = [
  '/eoncity/lite /eoncity 301',
  '/eoncity/tour /eoncity 301',
  '/eoncity/3d /eoncity 301',
  '/eoncity/play /eoncity 301',
  '/eoncity-lite.html /eoncity 301',
  '/eoncity-3d.html /eoncity 301',
  '/eoncity-play.html /eoncity 301'
];
const failures = [];

if (!fs.existsSync(dist) || !fs.statSync(dist).isDirectory()) {
  failures.push('dist/ is missing; run npm run build first');
} else {
  for (const rel of required) {
    const file = path.join(dist, rel);
    if (!fs.existsSync(file)) failures.push(`missing dist/${rel}`);
    else if (fs.statSync(file).size === 0) failures.push(`empty dist/${rel}`);
  }

  for (const rel of retiredCityOutputs) {
    const file = path.join(dist, rel);
    if (fs.existsSync(file)) failures.push(`retired City document must not be emitted: dist/${rel}`);
  }
  const redirectsPath = path.join(dist, '_redirects');
  if (fs.existsSync(redirectsPath)) {
    const redirects = fs.readFileSync(redirectsPath, 'utf8');
    for (const row of requiredCityRedirects) {
      if (!redirects.includes(row)) failures.push(`missing canonical City redirect: ${row}`);
    }
  }

  const assets = path.join(dist, 'assets');
  const assetFiles = fs.existsSync(assets)
    ? fs.readdirSync(assets).filter((name) => /\.(?:js|css)$/.test(name))
    : [];
  if (!assetFiles.some((name) => name.endsWith('.js'))) failures.push('no built JavaScript assets found');
  if (!assetFiles.some((name) => name.endsWith('.css'))) failures.push('no built CSS assets found');


  // W649I: prove the deployable artifact contains every immutable GLB exactly
  // as recorded at intake. Source-only validation is insufficient because a
  // missing public/ sync would otherwise produce a green build with broken
  // runtime URLs.
  const intakePath = path.join(root, 'config', 'w649-eoncity-asset-intake.json');
  if (!fs.existsSync(intakePath)) {
    failures.push('missing W649 asset intake receipt');
  } else {
    const intake = JSON.parse(fs.readFileSync(intakePath, 'utf8'));
    const entries = Array.isArray(intake.entries) ? intake.entries : [];
    if (entries.length !== 76) failures.push(`W649 intake expected 76 binaries; found ${entries.length}`);
    const seen = new Set();
    for (const entry of entries) {
      const relative = String(entry.path || '').replace(/^\/+/, '');
      if (!relative.startsWith('assets/city/w649/')) {
        failures.push(`invalid W649 deploy path: ${entry.path || '(empty)'}`);
        continue;
      }
      if (seen.has(relative)) failures.push(`duplicate W649 deploy path: ${relative}`);
      seen.add(relative);
      const emitted = path.join(dist, relative);
      if (!fs.existsSync(emitted)) {
        failures.push(`missing dist/${relative}`);
        continue;
      }
      const bytes = fs.statSync(emitted).size;
      if (bytes !== Number(entry.bytes)) failures.push(`byte mismatch dist/${relative}: ${bytes} != ${entry.bytes}`);
      if (bytes > 25 * 1024 * 1024) failures.push(`Cloudflare Pages 25 MiB limit exceeded: dist/${relative}`);
      const digest = crypto.createHash('sha256').update(fs.readFileSync(emitted)).digest('hex');
      if (digest !== entry.sha256) failures.push(`SHA-256 mismatch dist/${relative}`);
    }
    const emittedW649Root = path.join(dist, 'assets', 'city', 'w649');
    const countFiles = (directory) => fs.existsSync(directory)
      ? fs.readdirSync(directory, { withFileTypes: true }).reduce((sum, item) => sum + (item.isDirectory() ? countFiles(path.join(directory, item.name)) : item.isFile() ? 1 : 0), 0)
      : 0;
    const emittedCount = countFiles(emittedW649Root);
    if (emittedCount !== entries.length) failures.push(`dist W649 binary count mismatch: ${emittedCount} != ${entries.length}`);
  }

  const decoderRelative = path.join('assets', 'vendor', 'babylon', 'meshopt_decoder.js');
  // sync-public-assets normalizes static text before the build copies public/ to dist/.
  // Compare the actual build input so this byte-integrity check remains valid on
  // Windows working trees whose source checkout uses CRLF.
  const decoderBuildInput = path.join(root, 'public', decoderRelative);
  const decoderDist = path.join(dist, decoderRelative);
  if (!fs.existsSync(decoderDist)) failures.push(`missing dist/${decoderRelative}`);
  else if (!fs.existsSync(decoderBuildInput)) failures.push(`missing public build input ${decoderRelative}`);
  else {
    const sourceDigest = crypto.createHash('sha256').update(fs.readFileSync(decoderBuildInput)).digest('hex');
    const distDigest = crypto.createHash('sha256').update(fs.readFileSync(decoderDist)).digest('hex');
    if (sourceDigest !== distDigest) failures.push(`Meshopt decoder SHA-256 mismatch in dist/${decoderRelative}`);
  }

  for (const rel of required.filter((name) => name.endsWith('.html'))) {
    const file = path.join(dist, rel);
    if (!fs.existsSync(file)) continue;
    const html = fs.readFileSync(file, 'utf8');
    if (!/<html[\s>]/i.test(html)) failures.push(`dist/${rel} is not a complete HTML document`);
    if (/src=["'](?:\.\.\/)*assets\/js\//i.test(html)) failures.push(`dist/${rel} contains an unbundled source-module reference`);
  }

  const referral = path.join(dist, 'referral.html');
  if (fs.existsSync(referral)) {
    const html = fs.readFileSync(referral, 'utf8');
    if (!/EONAPP|signed|referral/i.test(html)) failures.push('referral landing page marker missing');
  }
}

if (failures.length) {
  console.error('Build smoke check failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`Build smoke check passed (${required.length} required files; dist assets present).`);
