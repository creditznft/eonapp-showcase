#!/usr/bin/env node
/** W417 Node companion: validates a reviewed asset manifest against local files and SHA-256 values. */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCityAssetReleaseManifest } from '../assets/js/city/eon-city-asset-release-preflight.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const valueAfter = (flag) => args.includes(flag) ? args[args.indexOf(flag) + 1] : null;
const manifestArg = valueAfter('--manifest');
const sourceRoot = path.resolve(valueAfter('--root') || root);

function fail(message) {
  process.stderr.write(`[city-asset-release-preflight] FAIL: ${message}\n`);
  process.exitCode = 1;
}

function localPath(publicPath) {
  const relative = String(publicPath || '').replace(/^\/+/, '');
  const target = path.resolve(sourceRoot, relative);
  if (!target.startsWith(`${sourceRoot}${path.sep}`)) throw new Error('Path escapes source root.');
  return target;
}

if (!manifestArg) {
  fail('Usage: node scripts/city-asset-release-preflight.mjs --manifest docs/city-art/release-manifest.json [--root <source-root>]');
} else {
  const manifestPath = path.resolve(sourceRoot, manifestArg);
  if (!manifestPath.startsWith(`${sourceRoot}${path.sep}`) || !existsSync(manifestPath)) {
    fail('Manifest file does not exist inside the source root.');
  } else {
    let manifest;
    try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); } catch { fail('Manifest is not valid JSON.'); }
    if (manifest) {
      const report = validateCityAssetReleaseManifest(manifest);
      const errors = [...report.errors];
      for (const entry of manifest.entries || []) {
        for (const publicPath of [entry.sourcePath, entry?.lod?.lod0, entry?.lod?.lod1, entry?.lod?.lod2]) {
          try {
            const target = localPath(publicPath);
            if (!existsSync(target)) { errors.push(`${entry.assetId}: missing ${publicPath}`); continue; }
            if (publicPath === entry.sourcePath) {
              const actual = createHash('sha256').update(readFileSync(target)).digest('hex');
              if (actual.toLowerCase() !== String(entry.sha256 || '').toLowerCase()) errors.push(`${entry.assetId}: source hash mismatch.`);
            }
          } catch (error) { errors.push(`${entry.assetId}: ${error.message}`); }
        }
        const evidencePath = path.resolve(sourceRoot, String(entry.evidencePath || ''));
        if (!evidencePath.startsWith(`${sourceRoot}${path.sep}`) || !existsSync(evidencePath)) errors.push(`${entry.assetId}: missing local provenance evidence.`);
      }
      if (errors.length) {
        for (const error of errors) process.stderr.write(`- ${error}\n`);
        fail('No City asset may receive final visual-release approval until every preflight check passes.');
      } else {
        process.stdout.write(`[city-asset-release-preflight] PASS: ${report.entryCount} reviewed asset(s) passed local integrity preflight.\n`);
      }
    }
  }
}
