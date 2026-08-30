import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CITY_W649_CHARACTER_MANIFEST } from '../assets/js/city/w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W649_WORLD_MANIFEST } from '../assets/js/city/w649/eon-city-w649-world-manifest.js';
import { EON_CITY_W659F_FUNCTIONAL_ASSETS } from '../assets/js/city/w659f/eon-city-w659f-functional-asset-manifest.js';
import { buildEonCityW660CompletionMatrix } from '../assets/js/city/w660/eon-city-w660-completion-matrix.js';

export const EON_CITY_W660_EMITTED_CANDIDATE_SCHEMA = 'eon.city.w660.emitted-candidate-gate.v1';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha256 = (data) => crypto.createHash('sha256').update(data).digest('hex');

export function inspectEonCityW660EmittedCandidate({ rootDir = root } = {}) {
  const matrix = buildEonCityW660CompletionMatrix();
  const entries = [
    ...EON_CITY_W649_CHARACTER_MANIFEST.entries,
    ...EON_CITY_W649_WORLD_MANIFEST.entries,
    ...EON_CITY_W659F_FUNCTIONAL_ASSETS
  ];
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const checks = [];
  let totalBytes = 0;

  for (const assetId of matrix.effectiveAssetIds) {
    const entry = byId.get(assetId);
    checks.push({ id: `manifest:${assetId}`, pass: Boolean(entry), detail: entry ? '' : 'missing authority entry' });
    if (!entry) continue;
    for (const variantName of ['primary', 'fallback']) {
      const variant = entry.variants?.[variantName];
      checks.push({ id: `variant:${assetId}:${variantName}`, pass: Boolean(variant?.path && variant?.sha256), detail: variant?.path || 'missing variant' });
      if (!variant?.path) continue;
      const relative = String(variant.path).replace(/^\/+/, '');
      for (const prefix of ['', 'public', 'dist']) {
        const filePath = path.join(rootDir, prefix, relative);
        const exists = fs.existsSync(filePath);
        let pass = exists;
        let detail = exists ? filePath : 'missing';
        if (exists) {
          const data = fs.readFileSync(filePath);
          const digest = sha256(data);
          pass = data.length === variant.bytes && digest === variant.sha256;
          detail = `${data.length}/${variant.bytes} ${digest}`;
          if (prefix === 'dist') totalBytes += data.length;
        }
        checks.push({ id: `${prefix || 'source'}:${assetId}:${variantName}`, pass, detail });
      }
    }
  }

  const runtimeTokens = [
    // W759 policy: W749 Living Nexus supersedes the retired W660 hologram.
    'eon.city.living-nexus.w749.v1',
    'eon.nexus.product-adapters.w660e.v1',
    'Creator Capture',
    // The maintained Command Core renamed this review-first surface.
    'Share Command Center',
    'Voice Conversation',
    'Vault Reveals'
  ];
  const emittedJs = fs.existsSync(path.join(rootDir, 'dist/assets'))
    ? fs.readdirSync(path.join(rootDir, 'dist/assets')).filter((name) => name.endsWith('.js')).map((name) => fs.readFileSync(path.join(rootDir, 'dist/assets', name), 'utf8')).join('\n')
    : '';
  for (const token of runtimeTokens) checks.push({ id: `runtime-token:${token}`, pass: emittedJs.includes(token), detail: '' });

  const failures = checks.filter((entry) => !entry.pass);
  return Object.freeze({
    schema: EON_CITY_W660_EMITTED_CANDIDATE_SCHEMA,
    ok: failures.length === 0,
    effectiveAssetCount: matrix.effectiveAssetCount,
    verifiedVariantCount: matrix.effectiveAssetCount * 2,
    distAssetBytes: totalBytes,
    checks: Object.freeze(checks),
    failures: Object.freeze(failures)
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = inspectEonCityW660EmittedCandidate();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}
