#!/usr/bin/env node
/**
 * W655 guarded Cloudflare Pages deployment helper for Codex.
 *
 * Defaults to a dry-run Preview plan. Production requires an owner GO receipt
 * that matches the exact dist digest and records a passing Codex certification.
 * This script never reads, prints, copies or packages .env.local.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const args = process.argv.slice(2);
const value = (name, fallback = '') => {
  const item = args.find((arg) => arg.startsWith(`${name}=`));
  return item ? item.slice(name.length + 1) : fallback;
};
const has = (name) => args.includes(name);
const mode = value('--mode', 'preview');
const projectName = value('--project-name', 'eonapp-ch');
const branch = value('--branch', mode === 'production' ? 'main' : `w655-eoncity-certification-${new Date().toISOString().slice(0, 10)}`);
const distDir = path.resolve(root, value('--dist', 'dist'));
const execute = has('--execute');
const ownerGoFile = value('--owner-go-file');

function walk(dir) {
  const rows = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) rows.push(...walk(full));
    else if (entry.isFile()) rows.push(full);
  }
  return rows;
}
function directoryDigest(dir) {
  const hash = crypto.createHash('sha256');
  const files = walk(dir).sort((a, b) => path.relative(dir, a).localeCompare(path.relative(dir, b)));
  for (const file of files) {
    const rel = path.relative(dir, file).replaceAll(path.sep, '/');
    hash.update(rel); hash.update('\0'); hash.update(fs.readFileSync(file)); hash.update('\0');
  }
  return { digest: hash.digest('hex'), files };
}
function fail(message) { console.error(message); process.exit(1); }
if (!['preview', 'production'].includes(mode)) fail('mode must be preview or production');
if (!fs.existsSync(distDir) || !fs.statSync(distDir).isDirectory()) fail(`dist directory missing: ${distDir}`);
const { digest, files } = directoryDigest(distDir);
const relativeFiles = files.map((file) => path.relative(distDir, file).replaceAll(path.sep, '/'));
const forbidden = relativeFiles.filter((file) => /(^|\/)(\.env(?:\..*)?|wrangler\.toml\.bak|.*secret.*)$/i.test(file));
if (forbidden.length) fail(`forbidden files in dist: ${forbidden.join(', ')}`);
const largest = files.reduce((best, file) => {
  const bytes = fs.statSync(file).size;
  return bytes > best.bytes ? { file: path.relative(distDir, file).replaceAll(path.sep, '/'), bytes } : best;
}, { file: '', bytes: 0 });
if (files.length > 20_000) fail(`Pages file count exceeds 20,000: ${files.length}`);
if (largest.bytes > 25 * 1024 * 1024) fail(`Pages file exceeds 25 MiB: ${largest.file} ${largest.bytes}`);

let ownerGo = null;
if (mode === 'production') {
  if (!ownerGoFile) fail('production requires --owner-go-file=<json>');
  ownerGo = JSON.parse(fs.readFileSync(path.resolve(root, ownerGoFile), 'utf8'));
  const criticals = Number(ownerGo.criticalDefects ?? 1);
  const overall = Number(ownerGo.overallScore ?? 0);
  if (ownerGo.productionGo !== true || ownerGo.previewCertified !== true || overall < 9.5 || criticals !== 0) fail('owner GO receipt does not satisfy W655 production rules');
  if (String(ownerGo.distDigest || '') !== digest) fail(`owner GO digest mismatch: expected ${digest}`);
  if (!ownerGo.previewUrl || !ownerGo.deploymentId) fail('owner GO receipt must include previewUrl and deploymentId');
}

const command = ['npx', 'wrangler', 'pages', 'deploy', distDir, '--project-name', projectName, '--branch', branch];
const receipt = {
  schema: 'eonapp.w655.codex-pages-deploy-plan.v1', generatedAt: new Date().toISOString(),
  mode, projectName, branch, distDir, distDigest: digest, fileCount: files.length, largest,
  envLocalRead: false, envLocalPackaged: false, exactDistRequired: true,
  productionGuardSatisfied: mode === 'preview' ? null : true,
  command, execute
};
const receiptDir = path.join(root, 'reports', 'w655', 'codex-deploy');
fs.mkdirSync(receiptDir, { recursive: true });
fs.writeFileSync(path.join(receiptDir, `W655_${mode.toUpperCase()}_DEPLOY_PLAN.json`), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
if (!execute) process.exit(0);
const result = spawnSync(command[0], command.slice(1), { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
if (result.status !== 0) process.exit(result.status || 1);
