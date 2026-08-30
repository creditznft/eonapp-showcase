#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildW530SecurityOauthStructuralReview } from './w530-security-oauth-structural-review.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function inspectW530SecurityOauth({ root = ROOT } = {}) {
  const review = buildW530SecurityOauthStructuralReview({ root });
  const issues = [...review.issues];
  const source = fs.readFileSync(path.join(root, 'scripts/w530-security-oauth-structural-review.mjs'), 'utf8');
  if (/fetch\s*\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/.test(source)) issues.push('structural-review-may-access-network');
  if (/dotenv|readFileSync\([^)]*\.env|process\.env\.[A-Z_]*(?:SECRET|TOKEN|KEY)/.test(source)) issues.push('structural-review-may-read-or-print-secret');
  if (review.targetFetched || review.headersCapturedFromNetwork || review.oauthStarted || review.sessionRead || review.consentRequested || review.secretsRead) issues.push('review-overclaims-external-action');
  return Object.freeze({ schema: 'eonapp.w530.security-oauth-gate.v1', wave: 'W530', sourceOnly: true, ok: issues.length === 0, review, issues: Object.freeze([...new Set(issues)].sort()) });
}

function main() {
  const report = inspectW530SecurityOauth();
  const output = path.join(ROOT, 'tmp', 'w530-security-oauth-gate.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) throw new Error(`W530 security/OAuth structural gate failed:\n${report.issues.map((item) => `- ${item}`).join('\n')}`);
  console.log('W530 security/OAuth structural source gate passed. Header delivery, OAuth completion, consent, and network proof remain pending.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
