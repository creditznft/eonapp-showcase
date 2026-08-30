#!/usr/bin/env node
/**
 * W277-A0 — privacy-preserving measurement source gate.
 * This validates source-level minimization and explicit local choice only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W277_PRIVACY_MEASUREMENT_POLICY } from '../config/w277-privacy-measurement-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const FORBIDDEN_TRANSPORT = /\b(?:fetch|sendBeacon|XMLHttpRequest|WebSocket|EventSource)\s*\(/;

function read(root, rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function artifact(root, report) {
  const out = path.join(root, 'artifacts', 'W277_PRIVACY_MEASUREMENT_SOURCE_GATE_REPORT_2026-06-25.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`);
}

export function evaluateW277PrivacyMeasurement({ analytics = '', trust = '', telemetry = '', referral = '', profileHtml = '', profileJs = '', privacyHtml = '', plan = '' } = {}) {
  const errors = [];
  const require = (condition, message) => { if (!condition) errors.push(message); };
  const policy = W277_PRIVACY_MEASUREMENT_POLICY.collection;

  require(/EON_MEASUREMENT_DEFAULT_ENABLED\s*=\s*false/.test(analytics), 'Local measurement is not off by default.');
  require(/transport:\s*'browser-local-only'/.test(analytics), 'Analytics source does not declare browser-local-only transport.');
  require(new RegExp(`pageviewLimit:\\s*${policy.pageviewLimit}`).test(analytics), 'Pageview retention limit is not minimized.');
  require(new RegExp(`eventLimit:\\s*${policy.eventLimit}`).test(analytics), 'Event retention limit is not minimized.');
  require(new RegExp(`sessionLimit:\\s*${policy.sessionLimit}`).test(analytics), 'Session retention limit is not minimized.');
  require((analytics.match(/if \(!isLocalMeasurementEnabled\(\)\) return null;/g) || []).length >= 3, 'Analytics collection methods are not consistently consent-gated.');
  require(/clearLocalMeasurementData/.test(analytics) && /setLocalMeasurementPreference/.test(analytics), 'Analytics lacks clear/choice controls.');
  require(/if \(!isLocalMeasurementEnabled\(\)\) return null;/.test(trust), 'Trust events are not consent-gated.');
  require(new RegExp(`const MAX_EVENTS = ${policy.trustEventLimit};`).test(trust), 'Trust event retention is not minimized.');
  require(/clearTrustTelemetry/.test(trust), 'Trust events lack a clear function.');
  for (const [label, source] of [['analytics', analytics], ['trust telemetry', trust], ['privacy telemetry', telemetry]]) {
    require(!FORBIDDEN_TRANSPORT.test(source), `${label} includes a remote transport primitive.`);
  }
  require(/externalTransport:\s*false/.test(telemetry), 'Telemetry privacy contract does not disable external transport.');
  require(!/trust-telemetry|recordReferralAttribution/.test(referral), 'Signed invite handling still emits attribution telemetry.');
  require(/eon-profile-measurement-toggle/.test(profileHtml) && /eon-profile-clear-measurement/.test(profileHtml), 'Profile lacks local measurement controls.');
  require(/setLocalMeasurementPreference/.test(profileJs) && /clearLocalMeasurementData/.test(profileJs) && /clearTrustTelemetry/.test(profileJs) && /clearRuntimeErrors/.test(profileJs), 'Profile controls are not wired to disable/clear all local diagnostics.');
  require(/Google Analytics for aggregate traffic and approved product-route measurement only after you enable it/.test(privacyHtml), 'Privacy page lacks aggregate measurement disclosure.');
  require(/Redacted local diagnostics are separate, off by default/.test(privacyHtml), 'Privacy page lacks default-off local diagnostics disclosure.');
  require(/W260\s*\|\s*NO-GO|W260.*NO-GO/i.test(plan), 'W260 NO-GO dependency is missing from roadmap.');

  return {
    schema: W277_PRIVACY_MEASUREMENT_POLICY.schema,
    ok: errors.length === 0,
    decision: W277_PRIVACY_MEASUREMENT_POLICY.decision,
    sourceOnly: true,
    errors,
    externalEvidenceRequired: W277_PRIVACY_MEASUREMENT_POLICY.externalEvidenceRequired,
    claimFence: 'Source inspection cannot replace independent privacy, legal, browser-storage or live-tag evidence.'
  };
}

export function verifyW277PrivacyMeasurement(root = ROOT) {
  const report = evaluateW277PrivacyMeasurement({
    analytics: read(root, 'assets/js/utils/eon-analytics.js'),
    trust: read(root, 'assets/js/utils/trust-telemetry.js'),
    telemetry: read(root, 'assets/js/utils/privacy-telemetry.js'),
    referral: read(root, 'assets/js/utils/referral-par.js'),
    profileHtml: read(root, 'profile.html'),
    profileJs: read(root, 'assets/js/profile-page.js'),
    privacyHtml: read(root, 'privacy.html'),
    plan: read(root, 'docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md')
  });
  artifact(root, report);
  return report;
}

export function main() {
  const report = verifyW277PrivacyMeasurement();
  if (!report.ok) {
    console.error('[W277-A0] FAIL');
    report.errors.forEach((error) => console.error(`- ${error}`));
    return 1;
  }
  console.log('W277-A0 privacy-measurement source gate: PASS (local diagnostics default off; external privacy evidence remains pending).');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) process.exitCode = main();
