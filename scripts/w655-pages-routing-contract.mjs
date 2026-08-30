#!/usr/bin/env node
/** W655 Pages routing contract: keep Functions invocation explicit and static-first. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const routeFile = path.join(root, '_routes.json');
const distRouteFile = path.join(root, 'dist', '_routes.json');
const workflowFile = path.join(root, '.github/workflows/preview.yml');
const failures = [];
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

if (!fs.existsSync(routeFile)) failures.push('source-_routes-json-missing');
if (fs.existsSync(routeFile)) {
  const routes = readJson(routeFile);
  if (routes.version !== 1) failures.push('routes-version-must-be-1');
  if (!Array.isArray(routes.include) || !routes.include.includes('/api/*')) failures.push('routes-api-missing');
  if (!Array.isArray(routes.include) || !routes.include.includes('/csp-report')) failures.push('routes-csp-report-missing');
  if (!Array.isArray(routes.include) || !routes.include.includes('/city-private/*')) failures.push('routes-city-private-missing');
  if (routes.include?.includes('/*')) failures.push('routes-catch-all-forbidden');
  for (const forbidden of ['/assets/*', '/assets/city/*', '/*.glb', '/*.js', '/*.css', '/*.png', '/*.jpg']) {
    if (routes.include?.includes(forbidden)) failures.push(`static-route-included:${forbidden}`);
  }
  if (!Array.isArray(routes.exclude) || routes.exclude.length !== 0) failures.push('routes-exclude-must-be-empty');
}
if (!fs.existsSync(distRouteFile)) failures.push('dist-_routes-json-missing-after-build');
if (fs.existsSync(distRouteFile) && fs.existsSync(routeFile)) {
  if (JSON.stringify(readJson(distRouteFile)) !== JSON.stringify(readJson(routeFile))) failures.push('dist-routes-differ-from-source');
}

const activeApiFiles = fs.existsSync(path.join(root, 'functions/api'))
  ? fs.readdirSync(path.join(root, 'functions/api'), { recursive: true })
    .filter((file) => file.endsWith('.js') && !file.endsWith('.d.ts'))
  : [];
if (activeApiFiles.length === 0) failures.push('active-api-functions-missing');
const workflow = fs.readFileSync(workflowFile, 'utf8');
for (const marker of [
  'node scripts/w660l-stage-pages-deploy-root.mjs',
  '--candidate "${{ steps.candidate.outputs.root }}"',
  '--output "$DEPLOY_ROOT"',
  'test -f "$DEPLOY_ROOT/functions/api/auth/session.js"',
  'test -f "$DEPLOY_ROOT/functions/api/city/access.js"',
  'cd "$DEPLOY_ROOT"',
  'wrangler@4 pages deploy .',
  'w641-verify-release-candidate'
]) {
  if (!workflow.includes(marker)) failures.push(`preview-workflow-marker-missing:${marker}`);
}
if (/working-directory:\s*source\s*\n\s*env:[\s\S]*?npx --yes wrangler@4 pages deploy \"\$DEPLOY_ROOT\"/.test(workflow)) failures.push('wrangler-must-run-from-staged-root');

const result = { ok: failures.length === 0, schema: 'eonapp.w655-pages-routing-contract.v1', activeApiFiles, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
