#!/usr/bin/env node
/**
 * W272-A0 — source-only CSP, network and supply-chain readiness gate.
 *
 * This gate verifies present source controls and documents the deliberate
 * pending review for broad BYOK-compatible network schemes. It does not prove
 * Cloudflare edge headers, browser CSP compatibility, provider CORS, audit
 * status, SBOM review, production sourcemap exposure or security approval.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W272_SECURITY_SUPPLYCHAIN_SCHEMA,
  W272_REQUIRED_EXTERNAL_EVIDENCE,
  validateW272SecuritySupplyChainBoard
} from '../config/w272-security-supplychain-contract.mjs';
import { validateReleaseBoard } from './w260-release-board-gate.mjs';
import { writeW517EphemeralJson } from './w517-evidence-output.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const W272_BOARD_PATH = 'release-evidence/W272_SECURITY_SUPPLYCHAIN_SOURCE_READINESS_2026-06-25/W272_BOARD.json';
const W260_BOARD_PATH = 'release-evidence/W260_RELEASE_BOARD_2026-06-25/RELEASE_BOARD.json';

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

export function getDefaultCsp(headers = '') {
  const block = String(headers || '').split(/\n\s*\n/)[0] || '';
  const match = block.match(/^\s*Content-Security-Policy:\s*(.+)$/mi);
  return match ? match[1].trim() : '';
}

export function validateW272Csp(csp = '') {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  assert(csp.startsWith("default-src 'self'"), 'Default CSP must start from self.');
  for (const directive of [
    'script-src',
    "script-src-attr 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests',
    'report-uri /csp-report'
  ]) {
    assert(csp.includes(directive), `Default CSP missing ${directive}.`);
  }
  assert(!/script-src[^;]*['"]unsafe-inline['"]/i.test(csp), 'Default script-src must not allow unsafe-inline.');
  assert(!/script-src[^;]*['"]unsafe-eval['"]/i.test(csp), 'Default script-src must not allow unsafe-eval.');
  assert(!/script-src[^;]*\*/i.test(csp), 'Default script-src must not use wildcard hosts.');
  assert(!/connect-src[^;]*\*/i.test(csp), 'Default connect-src must not use wildcard hosts.');
  return { ok: errors.length === 0, errors };
}

export function validateW272Lockfile(lock = {}) {
  const errors = [];
  if (Number(lock.lockfileVersion) !== 3) errors.push('package-lock.json must stay on lockfileVersion 3.');
  for (const [entry, meta] of Object.entries(lock.packages || {})) {
    const resolved = String(meta?.resolved || '');
    if (/^(?:file:|git\+|github:|https?:\/\/github\.com)/i.test(resolved)) {
      errors.push(`Lockfile may not include mutable local/git dependency: ${entry}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

export function runW272SecuritySupplyChainSourceGate(root = ROOT) {
  const errors = [];
  const headers = read(root, '_headers');
  const publicHeaders = read(root, 'public/_headers');
  const cspReport = read(root, 'functions/csp-report.js');
  const vite = read(root, 'vite.config.mjs');
  const packageLock = JSON.parse(read(root, 'package-lock.json'));
  const packageJson = JSON.parse(read(root, 'package.json'));
  const board = JSON.parse(read(root, W272_BOARD_PATH));
  const w260Board = JSON.parse(read(root, W260_BOARD_PATH));
  const csp = getDefaultCsp(headers);

  const boardValidation = validateW272SecuritySupplyChainBoard(board);
  const w260Errors = validateReleaseBoard(w260Board);
  const cspValidation = validateW272Csp(csp);
  const lockValidation = validateW272Lockfile(packageLock);
  errors.push(
    ...boardValidation.errors,
    ...w260Errors.map((entry) => `W260 dependency: ${entry}`),
    ...cspValidation.errors,
    ...lockValidation.errors
  );

  if (headers !== publicHeaders) errors.push('_headers and public/_headers must remain identical.');
  for (const needle of [
    'Cross-Origin-Resource-Policy: same-origin',
    'Origin-Agent-Cluster: ?1',
    'X-DNS-Prefetch-Control: off',
    'Permissions-Policy:',
    'Strict-Transport-Security:'
  ]) {
    if (!headers.includes(needle)) errors.push(`Missing required source header: ${needle}`);
  }
  if (!/frame-ancestors 'self' https:\/\/web\.telegram\.org/i.test(headers)) {
    errors.push('Telegram override must retain explicit Telegram frame ancestor allowance.');
  }
  const frameAncestorLines = headers.split(/\n/).filter((line) => /^\s*Content-Security-Policy:.*frame-ancestors/i.test(line));
  for (const line of frameAncestorLines) {
    const allowedTelegramWildcardOnly = line.replace('https://*.telegram.org', '');
    if (allowedTelegramWildcardOnly.includes('*')) errors.push('Frame ancestor policies may use only the Telegram subdomain wildcard.');
  }
  for (const needle of ['MAX_REPORT_BYTES = 12 * 1024', 'redactUrl', 'redactOrigin']) {
    if (!cspReport.includes(needle)) errors.push(`CSP reporter missing ${needle}.`);
  }
  if (/request\.headers\.get\(['"]cookie/i.test(cspReport) || /request\.headers\.get\(['"]authorization/i.test(cspReport)) {
    errors.push('CSP reporter must not read cookie or authorization headers.');
  }
  if (!vite.includes("sourcemap: process.env.EON_BUILD_SOURCEMAPS === '1'")) {
    errors.push('Vite must keep sourcemaps opt-in rather than default-on.');
  }
  if (!packageJson.scripts?.['security:secret-scan']) errors.push('Existing secret-scan gate must remain runnable.');
  if (!fs.existsSync(path.join(root, 'scripts', 'w134-dependency-security-gate.mjs'))) errors.push('Existing W134 dependency-security gate source must remain present.');
  if (w260Board.verdict !== 'NO_GO') errors.push('W272 source work must not change W260 NO-GO state.');

  const report = {
    schema: 'eonapp.w272.security-supplychain-source-gate-report.v1',
    ok: errors.length === 0,
    generatedAt: new Date().toISOString(),
    interpretation: 'PASS proves current source controls only. It is not edge-header, browser-CSP, provider-CORS, package-audit, SBOM, sourcemap-exposure, independent-security or release evidence.',
    boardDecision: board.decision,
    w260Verdict: w260Board.verdict,
    defaultCsp: csp,
    broadSchemeReviewRequired: {
      connectSrc: /connect-src[^;]*(?:https:|wss:)/i.test(csp),
      frameSrc: /frame-src[^;]*https:/i.test(csp),
      imgSrc: /img-src[^;]*https:/i.test(csp)
    },
    lockfile: { version: packageLock.lockfileVersion, packageEntries: Object.keys(packageLock.packages || {}).length },
    externalEvidenceState: Object.fromEntries((board.requiredExternalEvidence || []).map((entry) => [entry.id, entry.status])),
    errors
  };
  return report;
}

function main() {
  const report = runW272SecuritySupplyChainSourceGate();
  const evidencePath = writeW517EphemeralJson('legacy-gates/w272-security-supplychain-source-gate-report.json', report, { root: ROOT });
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    return 1;
  }
  console.log(`W272-A0 CSP/network/supply-chain source gate: PASS (edge, browser and independent audit evidence remains pending). Local receipt: ${evidencePath}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
