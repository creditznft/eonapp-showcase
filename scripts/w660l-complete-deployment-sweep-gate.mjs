#!/usr/bin/env node
/** W660L — complete Pages bundle, Functions parity and final City input sweep. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectPagesFunctionSupportFiles } from './lib/w660l-pages-deploy-bundle.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
const support = collectPagesFunctionSupportFiles(root);
const requiredFunctions = ['functions/api/auth/session.js', 'functions/api/city/access.js', 'functions/api/billing/status.js', 'functions/api/referrals.js'];
for (const relative of requiredFunctions) add(`required-${relative}`, fs.existsSync(path.join(root, relative)));
for (const relative of [
  'config/w554-eon-city-access-project-portals-contract.mjs',
  'config/w536-google-drive-snapshot-contract.mjs',
  'assets/js/billing/eon-dodo-live-runtime.js',
  'assets/js/billing/eon-dodo-customer-actions.js',
  'assets/js/billing/eon-billing-lifecycle.js',
  'assets/js/commerce/eon-commercial-catalog.js',
  'assets/js/referrals/eon-referral-server-runtime.js',
  'assets/js/referrals/eon-keys-catalog.js',
  'assets/js/utils/signed-share-link.js',
  'assets/js/utils/share-link-identity.js',
  'assets/js/utils/share-link-codec.js'
]) add(`support-${relative}`, support.includes(relative));
const preview = read('.github/workflows/preview.yml');
const production = read('.github/workflows/deploy.yml');
add('preview-explicit-complete-staging', /w660l-stage-pages-deploy-root\.mjs/.test(preview) && /pages deploy \. --project-name=eonapp-ch/.test(preview));
add(
  'production-explicit-complete-staging',
  /w660l-stage-pages-deploy-root\.mjs/.test(production)
    && /pages deploy \.\s*\\?\s*--project-name=eonapp-ch\s*\\?\s*--branch=main/.test(production),
);
const babylon = read('assets/js/city/eon-city-play-babylon.js');
add('legacy-babylon-semantic-forward', /direction === 'forward' \? 'up'/.test(babylon));
add('legacy-babylon-semantic-backward', /direction === 'backward' \? 'down'/.test(babylon));
for (const relative of ['scripts/w660l-stage-pages-deploy-root.mjs', 'scripts/w660l-build-complete-pages-bundle.mjs', 'scripts/w660l-verify-complete-pages-bundle.mjs']) add(`script-${relative}`, fs.existsSync(path.join(root, relative)));
const pkg = JSON.parse(read('package.json'));
add('package-script', String(pkg.scripts?.['qa:w660l-complete-deployment-sweep'] || '').includes('w660l-complete-deployment-sweep-gate'));
add('release-chain', String(pkg.scripts?.['qa:w660-release-source'] || '').includes('qa:w660l-complete-deployment-sweep'));
add('source-receipt', fs.existsSync(path.join(root, 'docs/W660L_COMPLETE_DEPLOYMENT_AND_FINAL_SWEEP_SOURCE_RECEIPT_2026-07-20.md')));
const failed = checks.filter((entry) => !entry.pass);
console.log(JSON.stringify({ schema: 'eonapp.w660l.complete-deployment-sweep-gate.v1', wave: 'W660L', ok: failed.length === 0, passed: checks.length - failed.length, total: checks.length, supportFileCount: support.length, checks }, null, 2));
if (failed.length) process.exit(1);
