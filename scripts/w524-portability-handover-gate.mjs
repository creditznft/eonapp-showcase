#!/usr/bin/env node
/**
 * W524 portability and entrypoint gate.
 *
 * W524 originally used its own start file as the active entrypoint. W534 keeps
 * that receipt as historical provenance and promotes CURRENT_PRODUCT_START_HERE
 * as the sole current source authority. This gate preserves W524's LF redirect
 * and handover-boundary protections while refusing ambiguous root instructions.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderCloudflareRedirects } from '../config/route-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const W524_ENTRYPOINT = '00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md';
export const W524_CURRENT_ENTRYPOINT = 'CURRENT_PRODUCT_START_HERE.md';
export const W524_ROOT_README = 'README.md';
export const W524_BASE_COMMIT = 'e07ca365ae08ed66fb41c428b83252ad1b87fb9c';
export const W524_HISTORY_MARKER = 'historical-only';
export const W524_ENTRYPOINT_PATTERNS = Object.freeze([
  /^README.*\.md$/i,
  /^.*START_HERE.*\.md$/i,
  /^.*HANDOVER.*\.md$/i,
  /^CODEX.*\.md$/i,
  /^NEXT_CHAT.*\.md$/i
]);
export const W524_NON_ENTRYPOINT_ALLOWLIST = Object.freeze([
  'EXCLUDED_FROM_HANDOVER.md',
  W524_ROOT_README,
  W524_CURRENT_ENTRYPOINT
]);

function isW524EntrypointCandidate(relative) {
  return W524_ENTRYPOINT_PATTERNS.some((pattern) => pattern.test(relative));
}

export function listW524EntrypointCandidates({ root = ROOT } = {}) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.md'))
    .map((entry) => entry.name)
    .filter((relative) => relative === W524_ENTRYPOINT || (isW524EntrypointCandidate(relative) && !W524_NON_ENTRYPOINT_ALLOWLIST.includes(relative)))
    .sort();
}

function readIfExists(root, relative) {
  const absolute = path.join(root, relative);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, 'utf8') : '';
}

export function inspectW524PortabilityHandover({ root = ROOT } = {}) {
  const issues = [];
  const expectedRedirects = renderCloudflareRedirects();
  const gitattributesPath = path.join(root, '.gitattributes');
  const gitattributes = fs.existsSync(gitattributesPath) ? fs.readFileSync(gitattributesPath, 'utf8') : '';
  const detectedEntrypoints = listW524EntrypointCandidates({ root });

  for (const requiredLine of ['_redirects text eol=lf', 'public/_redirects text eol=lf']) {
    if (!gitattributes.includes(requiredLine)) issues.push(`missing-gitattributes-rule:${requiredLine}`);
  }

  if (expectedRedirects.includes('\r')) issues.push('route-contract-rendered-crlf');

  for (const relative of ['_redirects', 'public/_redirects']) {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) {
      issues.push(`missing-redirect-mirror:${relative}`);
      continue;
    }
    const actual = fs.readFileSync(absolute, 'utf8');
    if (actual.includes('\r')) issues.push(`redirect-mirror-crlf:${relative}`);
    if (actual !== expectedRedirects) issues.push(`redirect-mirror-out-of-sync:${relative}`);
  }

  const currentEntrypoint = readIfExists(root, W524_CURRENT_ENTRYPOINT);
  if (!currentEntrypoint) {
    issues.push(`missing-current-entrypoint:${W524_CURRENT_ENTRYPOINT}`);
  } else {
    if (!currentEntrypoint.includes('single top-level coding and verification entrypoint')) {
      issues.push('current-entrypoint-missing-authority-marker');
    }
    if (!currentEntrypoint.includes(W524_BASE_COMMIT)) {
      issues.push('current-entrypoint-missing-w524-provenance');
    }
  }

  const historicalW524Entrypoint = readIfExists(root, W524_ENTRYPOINT);
  if (!historicalW524Entrypoint) {
    issues.push(`missing-historical-w524-entrypoint:${W524_ENTRYPOINT}`);
  } else {
    if (!historicalW524Entrypoint.includes('Historical only')) issues.push('historical-w524-entrypoint-missing-marker');
    if (!historicalW524Entrypoint.includes(W524_CURRENT_ENTRYPOINT)) issues.push('historical-w524-entrypoint-missing-current-redirect');
    if (!historicalW524Entrypoint.includes(W524_BASE_COMMIT)) issues.push('historical-w524-entrypoint-missing-base-commit');
  }

  const rootReadme = readIfExists(root, W524_ROOT_README);
  if (!rootReadme) {
    issues.push(`missing-root-readme:${W524_ROOT_README}`);
  } else if (!rootReadme.includes(W524_CURRENT_ENTRYPOINT)) {
    issues.push('root-readme-missing-current-redirect');
  }

  for (const relative of detectedEntrypoints) {
    if (relative === W524_ENTRYPOINT) continue;
    const content = readIfExists(root, relative);
    if (!content.includes(W524_ENTRYPOINT) && !content.includes(W524_CURRENT_ENTRYPOINT)) issues.push(`retired-entrypoint-missing-redirect:${relative}`);
    if (!content.includes(W524_HISTORY_MARKER)) {
      issues.push(`retired-entrypoint-missing-retirement-marker:${relative}`);
    }
  }

  return Object.freeze({
    schema: 'eonapp.w524.portability-handover-gate.v2',
    wave: 'W524.4',
    ok: issues.length === 0,
    currentEntrypoint: W524_CURRENT_ENTRYPOINT,
    historicalEntrypoint: W524_ENTRYPOINT,
    checkedRedirectMirrors: Object.freeze(['_redirects', 'public/_redirects']),
    detectedEntrypoints: Object.freeze(detectedEntrypoints),
    nonEntrypointAllowlist: W524_NON_ENTRYPOINT_ALLOWLIST,
    issues: Object.freeze([...new Set(issues)].sort())
  });
}

function main() {
  const report = inspectW524PortabilityHandover();
  const target = path.join(ROOT, 'tmp', 'w524-portability-handover-gate.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) throw new Error(`W524 portability/handover gate failed:\n${report.issues.map((entry) => `- ${entry}`).join('\n')}`);
  process.stdout.write(`W524 portability/handover gate passed (${report.checkedRedirectMirrors.length} redirect mirrors; current entrypoint ${report.currentEntrypoint}; W524 provenance retained).\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error?.stack || error);
    process.exitCode = 1;
  }
}
