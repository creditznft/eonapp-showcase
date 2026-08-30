#!/usr/bin/env node
/**
 * W271-A0 — source-only accessibility/i18n readiness gate.
 *
 * PASS proves that every canonical public page has the source wiring for a
 * language profile, a skip path, a main landmark and the shared non-blocking
 * accessibility bootstrap. It is not a screen-reader, visual, locale-quality,
 * device or legal accessibility certification.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES, COMPATIBILITY_ROUTES } from '../config/route-contract.mjs';
import { W271_ACCESSIBILITY_I18N_SCHEMA, W271_REQUIRED_EXTERNAL_EVIDENCE, validateW271AccessibilityI18nBoard } from '../config/w271-accessibility-i18n-contract.mjs';
import { validateReleaseBoard } from './w260-release-board-gate.mjs';
import { writeW517EphemeralJson } from './w517-evidence-output.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const W271_BOARD_PATH = 'release-evidence/W271_ACCESSIBILITY_I18N_SOURCE_READINESS_2026-06-25/W271_BOARD.json';
const W260_BOARD_PATH = 'release-evidence/W260_RELEASE_BOARD_2026-06-25/RELEASE_BOARD.json';
const AUTOLOAD_ENTRY = '/assets/js/utils/accessibility-autoload.js';

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

export function canonicalPageFiles() {
  const redirectOnlyFiles = new Set(COMPATIBILITY_ROUTES
    .filter((row) => Number(row.status) >= 300 && Number(row.status) < 400)
    .map((row) => row.file));
  return [...new Set([...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES, ...COMPATIBILITY_ROUTES]
    .filter((row) => row.file && !redirectOnlyFiles.has(row.file))
    .map((row) => row.file))].sort();
}

export function auditW271PageMarkup(relative, source, { shellBootstrapsA11y = false, deferredHomeBootstrapsA11y = false } = {}) {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  assert(/<html\b[^>]*\blang=["'][^"']+["']/i.test(source), `${relative}: missing a document language.`);
  assert(/<meta\b[^>]*name=["']viewport["']/i.test(source), `${relative}: missing viewport metadata.`);
  assert(/<title>\s*[^<]+/i.test(source), `${relative}: missing a non-empty title.`);
  assert(/<main\b[^>]*\bid=["'][^"']+["']|<main\b|\brole=["']main["']/i.test(source), `${relative}: missing a main landmark.`);
  const skipLinks = [...source.matchAll(/<a\b(?=[^>]*\bclass=["'][^"']*(?:skip-to-content|skip-link|eon-skip-link|skip)[^"']*["'])(?=[^>]*\bhref=["']#([^"']+)["'])[^>]*>/gi)];
  const skipTargets = skipLinks.map((match) => match[1]);
  assert(skipTargets.length > 0, `${relative}: missing a keyboard skip link to main content.`);
  for (const target of skipTargets) {
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert(new RegExp(`\\bid=["']${escaped}["']`, 'i').test(source), `${relative}: skip link target #${target} is missing.`);
  }
  const usesShell = source.includes('/assets/js/eon-app-shell.js');
  const usesDirectBootstrap = source.includes(AUTOLOAD_ENTRY);
  const usesDeferredHomeBootstrap = source.includes('/assets/js/eonbot-home-bootstrap.js');
  assert(
    usesDirectBootstrap || (usesShell && shellBootstrapsA11y) || (usesDeferredHomeBootstrap && deferredHomeBootstrapsA11y),
    `${relative}: missing the shared accessibility/language bootstrap.`
  );
  return { file: relative, usesShell, usesDirectBootstrap, usesDeferredHomeBootstrap, errors };
}

export function runW271AccessibilityI18nSourceGate(root = ROOT) {
  const errors = [];
  const board = JSON.parse(read(root, W271_BOARD_PATH));
  const w260Board = JSON.parse(read(root, W260_BOARD_PATH));
  const appShell = read(root, 'assets/js/eon-app-shell.js');
  const homeBootstrap = read(root, 'assets/js/eonbot-home-bootstrap.js');
  const autoload = read(root, 'assets/js/utils/accessibility-autoload.js');
  const appLanguage = read(root, 'assets/js/utils/app-language.js');
  const checks = [];

  const boardValidation = validateW271AccessibilityI18nBoard(board);
  const w260Errors = validateReleaseBoard(w260Board);
  errors.push(...boardValidation.errors, ...w260Errors.map((entry) => `W260 dependency: ${entry}`));

  const shellBootstrapsA11y = appShell.includes("import('./utils/accessibility-autoload.js')")
    && appShell.includes('scheduleAccessibilityLanguageBootstrap();');
  const deferredHomeBootstrapsA11y = homeBootstrap.includes("import('./eon-app-shell.js')")
    && homeBootstrap.includes("document.addEventListener('DOMContentLoaded', scheduleShellHydration")
    && homeBootstrap.includes('else scheduleShellHydration();');
  if (!shellBootstrapsA11y) errors.push('App shell must defer-load the shared accessibility/language bootstrap.');
  if (!autoload.includes('initAppLanguage()') || !autoload.includes('autoLocalizePage(document)')) errors.push('Shared bootstrap must initialize language and request page localization.');
  if (!appLanguage.includes('applyLanguageDocumentProfile(document, selectableResolved)')) errors.push('Language runtime must update document language/direction profile.');
  if (!appLanguage.includes('void autoLocalizePage(document)')) errors.push('Language runtime must retain non-English page localization flow.');

  for (const relative of canonicalPageFiles()) {
    const check = auditW271PageMarkup(relative, read(root, relative), { shellBootstrapsA11y, deferredHomeBootstrapsA11y });
    checks.push(check);
    errors.push(...check.errors);
  }

  if (board.schema !== W271_ACCESSIBILITY_I18N_SCHEMA) errors.push('W271 board schema drifted.');
  if (board.requiredExternalEvidence?.length !== W271_REQUIRED_EXTERNAL_EVIDENCE.length) errors.push('W271 board external evidence lane count drifted.');
  if (w260Board.verdict !== 'NO_GO') errors.push('W271 source work must not change W260 NO-GO state.');

  const report = {
    schema: 'eonapp.w271.accessibility-i18n-source-gate-report.v1',
    ok: errors.length === 0,
    generatedAt: new Date().toISOString(),
    interpretation: 'PASS proves source wiring only. It is not keyboard, screen-reader, human locale, RTL, contrast, mobile assistive-technology or launch evidence.',
    boardDecision: board.decision,
    w260Verdict: w260Board.verdict,
    checkedPageFiles: checks,
    externalEvidenceState: Object.fromEntries((board.requiredExternalEvidence || []).map((entry) => [entry.id, entry.status])),
    errors
  };
  return report;
}

function main() {
  const report = runW271AccessibilityI18nSourceGate();
  const evidencePath = writeW517EphemeralJson('legacy-gates/w271-accessibility-i18n-source-gate-report.json', report, { root: ROOT });
  if (!report.ok) {
    console.error(JSON.stringify(report, null, 2));
    return 1;
  }
  console.log(`W271-A0 accessibility/i18n source gate: PASS (external accessibility and content evidence remains pending). Local receipt: ${evidencePath}`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
