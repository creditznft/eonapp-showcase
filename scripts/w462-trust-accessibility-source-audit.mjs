#!/usr/bin/env node
/**
 * W462.1 — source-only trust/accessibility consolidation.
 *
 * This script composes existing local gates. It deliberately makes no browser,
 * device, microphone, network, deployment, security-approval or legal-copy
 * claim and must not be used as a release certification.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_CHAT_GUIDE_LANGUAGE_CODES, EON_FULL_PRODUCT_LANGUAGE_CODES } from '../assets/js/utils/language-matrix.js';
import { PRIMARY_APP_ROUTES } from '../config/route-contract.mjs';
import { W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT, validateW462TrustAccessibilitySourceAuditContract } from '../config/w462-trust-accessibility-source-audit-contract.mjs';
import { runW271AccessibilityI18nSourceGate } from './w271-accessibility-i18n-source-gate.mjs';
import { runW272SecuritySupplyChainSourceGate } from './w272-security-supplychain-source-gate.mjs';
import { runW287EonbotLanguageVoiceGate } from './w287-eonbot-language-voice-gate.mjs';
import { inspectW394CLanguageMatrix } from './w394c-language-matrix-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const freeze = (value) => Object.freeze(value);

function summary(id, report = {}) {
  const status = report.status || (report.ok ? 'pass' : 'fail');
  return freeze({ id, pass: report.ok === true || status === 'pass', status, sourceOnly: true, errorCount: Array.isArray(report.errors) ? report.errors.length : 0 });
}

export function inspectW462TrustAccessibilitySourceAudit() {
  const errors = [...validateW462TrustAccessibilitySourceAuditContract()];
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); if (!value) errors.push(`${id}: ${detail}`); };
  const a11y = runW271AccessibilityI18nSourceGate(root);
  const security = runW272SecuritySupplyChainSourceGate(root);
  const voice = runW287EonbotLanguageVoiceGate(root);
  const language = inspectW394CLanguageMatrix();
  const memberGates = freeze([
    summary('W271-A0', a11y),
    summary('W272-A0', security),
    summary('W287-A0', voice),
    summary('W394C', language)
  ]);

  check('member-gates-pass', memberGates.every((entry) => entry.pass), 'all member source gates must pass before W462 can be source-ready');
  check('primary-route-coverage', PRIMARY_APP_ROUTES.length >= 3 && a11y.checkedPageFiles.length >= PRIMARY_APP_ROUTES.length, 'accessibility source wiring covers canonical app documents');
  check('release-language-matrix', EON_FULL_PRODUCT_LANGUAGE_CODES.length === 1 && EON_FULL_PRODUCT_LANGUAGE_CODES[0] === 'en' && EON_CHAT_GUIDE_LANGUAGE_CODES.length === 11 && EON_CHAT_GUIDE_LANGUAGE_CODES.includes('ar') && EON_CHAT_GUIDE_LANGUAGE_CODES.includes('hi'), 'English is the published interface while eleven Chat/Guide language capabilities remain available, including RTL Arabic and Hindi');
  check('typed-voice-fallback', voice.ok === true && language.status === 'pass', 'voice stays explicit/default-off with an unsupported-browser typed fallback');
  check('security-remains-source-only', security.ok === true && /current source controls only/i.test(security.interpretation || ''), 'security/supply-chain checks remain source controls, not an external approval');
  check('claim-fence', W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT.accessibilityCertified === false && W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT.localeContentCertified === false && W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT.microphonePermissionVerified === false && W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT.cspEdgeHeaderVerified === false && W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT.supplyChainApproved === false && W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT.liveReleaseApproved === false, 'contract prohibits source-only accessibility, voice, security or release certification');

  return freeze({
    schema: W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT.schema,
    wave: W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT.wave,
    status: errors.length ? 'fail' : 'pass',
    sourceOnly: true,
    checkCount: checks.length,
    checks: freeze(checks),
    memberGates,
    fullProductLanguageCodes: freeze(EON_FULL_PRODUCT_LANGUAGE_CODES.slice()),
    chatGuideLanguageCodes: freeze(EON_CHAT_GUIDE_LANGUAGE_CODES.slice()),
    primaryRouteCount: PRIMARY_APP_ROUTES.length,
    networkRequestCreated: false,
    browserAutomationRun: false,
    deviceEvidenceCaptured: false,
    accessibilityCertified: false,
    localeContentCertified: false,
    microphonePermissionVerified: false,
    cspEdgeHeaderVerified: false,
    supplyChainApproved: false,
    privacyCopyApproved: false,
    liveReleaseApproved: false,
    externalEvidenceRequired: W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT.externalEvidence,
    errors: freeze(errors)
  });
}

export function runW462TrustAccessibilitySourceAudit({ writeArtifact = true } = {}) {
  const result = inspectW462TrustAccessibilitySourceAudit();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w462-trust-accessibility-source-audit');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'report.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW462TrustAccessibilitySourceAudit();
  process.stdout.write(`W462.1 trust/accessibility source audit ${report.status} (${report.checkCount}/${report.checkCount} checks). External review remains required.\n`);
  if (report.status !== 'pass') process.exitCode = 1;
}
