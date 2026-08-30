#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stageCompletePagesDeployRoot } from './lib/w660l-pages-deploy-bundle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  const key = process.argv[index];
  if (!key.startsWith('--')) continue;
  const value = process.argv[index + 1] && !process.argv[index + 1].startsWith('--') ? process.argv[++index] : 'true';
  args.set(key.slice(2), value);
}
const candidateRoot = path.resolve(root, args.get('candidate') || 'artifacts/w641-release-candidate');
const outputRoot = path.resolve(root, args.get('output') || 'artifacts/w660l-pages-deploy-root');
const result = stageCompletePagesDeployRoot({ sourceRoot: root, candidateRoot, outputRoot });
console.log(JSON.stringify({ ok: true, outputRoot, candidateDigest: result.provenance.candidateDigest, commitSha: result.provenance.commitSha, supportFiles: result.supportFiles }, null, 2));
