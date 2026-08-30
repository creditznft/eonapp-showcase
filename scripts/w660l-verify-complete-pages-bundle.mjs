#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyCompletePagesBundle } from './lib/w660l-pages-deploy-bundle.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundleRoot = path.resolve(root, process.argv[2] || 'artifacts/w660l-complete-pages-bundle');
const result = verifyCompletePagesBundle(bundleRoot);
console.log(JSON.stringify({ ok: result.ok, bundleRoot, deployRoot: result.deployRoot || null, bundleDigest: result.manifest?.bundleDigest || null, candidateDigest: result.manifest?.candidateDigest || null, issues: result.issues }, null, 2));
if (!result.ok) process.exit(1);
