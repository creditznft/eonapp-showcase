#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const folderArg = process.argv.find((arg) => arg.startsWith('--folder='));
const folder = path.resolve(root, folderArg ? folderArg.slice('--folder='.length) : 'CODEX_W655_EVIDENCE');
const required = [
  'CODEX_W655_EXECUTION_RECEIPT.json', 'CODEX_W655_SCORECARD.md', 'CODEX_W655_ROUTE_MATRIX.csv',
  'CODEX_W655_DISTRICT_VISUAL_AUDIT.csv', 'CODEX_W655_CONTROL_MATRIX.csv',
  'CODEX_W655_CACHE_UPDATE_RECEIPT.json', 'CODEX_W655_PERFORMANCE_RECEIPT.json',
  'CODEX_W655_CONSOLE_SUMMARY.json', 'CODEX_W655_NETWORK_SUMMARY.json',
  'screenshots', 'videos', 'har', 'console', 'performance'
];
const failures = [];
for (const name of required) if (!fs.existsSync(path.join(folder, name))) failures.push(`missing:${name}`);
let receipt = null;
if (!failures.includes('missing:CODEX_W655_EXECUTION_RECEIPT.json')) {
  receipt = JSON.parse(fs.readFileSync(path.join(folder, 'CODEX_W655_EXECUTION_RECEIPT.json'), 'utf8'));
  if (receipt.schema !== 'eonapp.codex.w655.execution-receipt.v1') failures.push('receipt-schema');
  if (receipt.previewCertified !== true) failures.push('preview-not-certified');
  if (Number(receipt.overallScore || 0) < 9.5) failures.push('overall-score-below-9.5');
  if (Number(receipt.criticalDefects ?? 1) !== 0) failures.push('critical-defects');
  if (!/^[a-f0-9]{64}$/.test(String(receipt.distDigest || ''))) failures.push('dist-digest');
  if (!receipt.previewUrl || !receipt.deploymentId) failures.push('preview-identity');
  if (receipt.realGoogleAuth !== true) failures.push('real-google-auth');
  if (receipt.signedOutZeroHeavyRequests !== true) failures.push('signed-out-heavy-boundary');
  if (receipt.keyboardTouchGamepadParity !== true) failures.push('control-parity');
  if (receipt.allDistrictsReviewed !== true) failures.push('district-review');
  if (receipt.allActiveAssetsReviewed !== true) failures.push('asset-review');
  if (receipt.consoleErrors !== 0 || receipt.unhandledRejections !== 0) failures.push('console-errors');
  if (receipt.productionDeployed === true && receipt.ownerProductionGo !== true) failures.push('production-without-owner-go');
}
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
const mediaCounts = {
  screenshots: walk(path.join(folder, 'screenshots')).length,
  videos: walk(path.join(folder, 'videos')).length,
  har: walk(path.join(folder, 'har')).length,
  console: walk(path.join(folder, 'console')).length,
  performance: walk(path.join(folder, 'performance')).length
};
if (mediaCounts.screenshots < 20) failures.push(`screenshots-below-20:${mediaCounts.screenshots}`);
if (mediaCounts.videos < 4) failures.push(`videos-below-4:${mediaCounts.videos}`);
if (mediaCounts.har < 3) failures.push(`har-below-3:${mediaCounts.har}`);
if (mediaCounts.console < 3) failures.push(`console-exports-below-3:${mediaCounts.console}`);
if (mediaCounts.performance < 3) failures.push(`performance-traces-below-3:${mediaCounts.performance}`);
const evidenceFiles = walk(folder).sort();
const manifest = evidenceFiles.map((file) => ({ path: path.relative(folder, file).replaceAll(path.sep, '/'), bytes: fs.statSync(file).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') }));
const report = { schema: 'eonapp.w655.codex-evidence-validation.v1', generatedAt: new Date().toISOString(), ok: failures.length === 0, folder, mediaCounts, fileCount: manifest.length, failures, manifest };
fs.mkdirSync(path.join(root, 'reports', 'w655'), { recursive: true });
fs.writeFileSync(path.join(root, 'reports', 'w655', 'W655_CODEX_EVIDENCE_VALIDATION.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ok: report.ok, mediaCounts, fileCount: manifest.length, failures }, null, 2));
if (!report.ok) process.exit(1);
