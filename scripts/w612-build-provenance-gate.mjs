#!/usr/bin/env node
/** W612 source gate — build provenance must be public, cache-bypassed and compared by W600A. */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_BUILD_PROVENANCE_SCHEMA, validateBuildProvenance } from './build-provenance.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  ['scripts/build-production.mjs', 'writeBuildProvenance'],
  ['scripts/w599-run-authenticated-eoncity.mjs', 'DEPLOYED_ASSET_HASH_MISMATCH'],
  ['scripts/w599-run-authenticated-eoncity.mjs', 'LOCAL_BUILD_PROVENANCE_MISSING'],
  ['scripts/w599-run-authenticated-eoncity.mjs', 'build-provenance.json'],
  ['_headers', '/build-provenance.json'],
  ['_headers', 'Cache-Control: no-cache, no-store, must-revalidate']
];
const issues = [];
for (const [relative, token] of required) {
  const text = await readFile(path.join(ROOT, relative), 'utf8');
  if (!text.includes(token)) issues.push(`missing:${relative}:${token}`);
}
const sample = {
  schema: EON_BUILD_PROVENANCE_SCHEMA,
  generatedAt: '2026-07-04T00:00:00.000Z',
  sourceRevision: 'a'.repeat(40),
  distribution: { sha256: 'b'.repeat(64), fileCount: 4, bytes: 99 },
  city: { eoncityDocumentSha256: 'c'.repeat(64), eoncityRouteDocumentSha256: 'd'.repeat(64), serviceWorkerSha256: 'e'.repeat(64) },
  privacy: { containsUserData: false, containsSecrets: false, purpose: 'deploy-candidate-parity-only' }
};
issues.push(...validateBuildProvenance(sample).map((entry) => `sample:${entry}`));
const result = Object.freeze({
  schema: 'eon.build.w612.provenance-gate.v1',
  ok: issues.length === 0,
  issues: Object.freeze(issues),
  limitations: Object.freeze(['This gate does not contact production.', 'A normal signed-in browser must compare the deployed manifest after deployment.'])
});
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
