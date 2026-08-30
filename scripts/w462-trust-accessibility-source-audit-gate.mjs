#!/usr/bin/env node
/** W462.1 static gate: compose source controls without manufacturing external proof. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectW462TrustAccessibilitySourceAudit } from './w462-trust-accessibility-source-audit.mjs';
import { W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT, validateW462TrustAccessibilitySourceAuditContract } from '../config/w462-trust-accessibility-source-audit-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW462TrustAccessibilitySourceAuditGate() {
  const checks = [];
  const check = (id, condition, detail) => { checks.push({ id, pass: Boolean(condition), detail }); ensure(condition, `${id}: ${detail}`); };
  const audit = read('scripts/w462-trust-accessibility-source-audit.mjs');
  const contract = W462_TRUST_ACCESSIBILITY_SOURCE_AUDIT_CONTRACT;
  const report = inspectW462TrustAccessibilitySourceAudit();
  check('required-files', contract.requiredFiles.every((relative) => existsSync(path.join(root, relative))), 'audit, static gate, contract, tests and all member gate sources exist');
  check('contract-valid', validateW462TrustAccessibilitySourceAuditContract().length === 0 && contract.wave === 'W462.1', 'contract locks source-only audit and proof fences');
  check('member-gates-composed', /runW271AccessibilityI18nSourceGate/.test(audit) && /runW272SecuritySupplyChainSourceGate/.test(audit) && /runW287EonbotLanguageVoiceGate/.test(audit) && /inspectW394CLanguageMatrix/.test(audit), 'audit composes accessibility, security, voice and language source gates');
  check('no-network-or-device-primitives', !/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.mediaDevices|SpeechRecognition|Notification\.requestPermission|PushManager|playwright|puppeteer/.test(audit), 'audit does not run network, device, microphone, browser automation or push operations');
  check('matrix-and-route-summary', /EON_FULL_PRODUCT_LANGUAGE_CODES/.test(audit) && /PRIMARY_APP_ROUTES/.test(audit), 'audit reports source-derived language and route coverage');
  check('claim-fence', /accessibilityCertified: false/.test(audit) && /localeContentCertified: false/.test(audit) && /microphonePermissionVerified: false/.test(audit) && /cspEdgeHeaderVerified: false/.test(audit) && /supplyChainApproved: false/.test(audit) && /liveReleaseApproved: false/.test(audit), 'audit keeps all external certification categories false');
  check('audit-passes', report.status === 'pass' && report.memberGates.every((entry) => entry.pass), 'current source inputs meet the consolidated source-only audit');
  return Object.freeze({
    schema: 'eonapp.w462.trust-accessibility-source-audit-gate.v1', wave: 'W462.1', status: 'pass', sourceOnly: true,
    checkCount: checks.length, checks: Object.freeze(checks),
    limitations: Object.freeze([
      'This gate does not drive a browser, read a screen, request a microphone, inspect a device, fetch a deployed site, verify edge headers, or approve public/legal content.',
      'It cannot certify WCAG conformance, human translation quality, RTL rendering, voice recognition, privacy review, supply-chain approval, production security or launch readiness.'
    ])
  });
}

export function runW462TrustAccessibilitySourceAuditGate({ writeArtifact = true } = {}) {
  const result = inspectW462TrustAccessibilitySourceAuditGate();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w462-trust-accessibility-source-audit-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW462TrustAccessibilitySourceAuditGate();
  process.stdout.write(`W462.1 trust/accessibility source-audit gate passed (${result.checkCount}/${result.checkCount}). No external certification was created.\n`);
}
