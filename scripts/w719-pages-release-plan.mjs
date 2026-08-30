#!/usr/bin/env node
/** Generate guarded Preview or production plan. Dry-run unless --execute is explicit. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateW719OwnerGo } from '../config/w719-frozen-release-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const value = (name, fallback = '') => { const row = args.find((arg) => arg.startsWith(`${name}=`)); return row ? row.slice(name.length + 1) : fallback; };
const has = (name) => args.includes(name);
const mode = value('--mode', 'preview');
const execute = has('--execute');
const pagesRoot = path.resolve(root, value('--pages-root', 'artifacts/w719-pages-root'));
const ownerGoPath = path.resolve(root, value('--owner-go-file', 'config/w719-owner-go.json'));
function fail(message) { console.error(`[W719-plan] FAIL ${message}`); process.exit(1); }
function walk(dir, out = []) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const absolute = path.join(dir, entry.name); if (entry.isDirectory()) walk(absolute, out); else if (entry.isFile()) out.push(absolute); } return out; }
function digestTree(dir) { const hash = crypto.createHash('sha256'); const files = walk(dir).sort((a,b)=>path.relative(dir,a).localeCompare(path.relative(dir,b))); for (const file of files) { const rel=path.relative(dir,file).replaceAll(path.sep,'/'); hash.update(rel); hash.update('\0'); hash.update(fs.readFileSync(file)); hash.update('\0'); } return { digest:hash.digest('hex'), fileCount:files.length }; }
if (!['preview', 'production'].includes(mode)) fail('mode must be preview or production');
if (!fs.existsSync(pagesRoot)) fail(`frozen Pages root missing: ${pagesRoot}`);
const pages = digestTree(pagesRoot);
let ownerGo = null;
if (mode === 'production') {
  ownerGo = JSON.parse(fs.readFileSync(ownerGoPath, 'utf8'));
  const validation = validateW719OwnerGo(ownerGo);
  if (!validation.ok) fail(`owner GO is incomplete: ${Object.entries(validation.checks).filter(([,pass])=>!pass).map(([id])=>id).join(', ')}`);
  if (ownerGo.pagesRootDigest !== pages.digest) fail('owner GO Pages-root digest differs from the frozen root.');
}
const w655Args = [`--mode=${mode}`, `--dist=${path.relative(root, pagesRoot).replaceAll(path.sep, '/')}`];
if (mode === 'preview') w655Args.push('--branch=w719-owner-acceptance');
else { w655Args.push('--branch=main'); w655Args.push(`--owner-go-file=${path.relative(root, ownerGoPath).replaceAll(path.sep, '/')}`); }
if (execute) w655Args.push('--execute');
const plan = {
  schema: 'eonapp.w719.pages-release-plan.v1', wave: 'W719', generatedAt: new Date().toISOString(),
  mode, execute, pagesRoot, pagesRootDigest: pages.digest, fileCount: pages.fileCount,
  identicalFrozenRootRequired: true, rebuildPerformed: false,
  ownerGoValidated: mode === 'production', githubActionsUsed: false,
  delegatedGuard: 'scripts/w655-codex-pages-deploy.mjs', arguments: w655Args
};
const reportDir = path.join(root, 'reports/institutional'); fs.mkdirSync(reportDir,{recursive:true});
fs.writeFileSync(path.join(reportDir, `w719-${mode}-release-plan.json`), `${JSON.stringify(plan,null,2)}\n`);
console.log(JSON.stringify(plan,null,2));
if (!execute) process.exit(0);
const result = spawnSync(process.execPath, [path.join(root,'scripts/w655-codex-pages-deploy.mjs'), ...w655Args], { cwd:root, stdio:'inherit' });
if (result.status !== 0) process.exit(Number(result.status||1));
