import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { evaluateW277PrivacyMeasurement, verifyW277PrivacyMeasurement } from '../../scripts/w277-privacy-measurement-source-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const source = () => ({
  analytics: read('assets/js/utils/eon-analytics.js'),
  trust: read('assets/js/utils/trust-telemetry.js'),
  telemetry: read('assets/js/utils/privacy-telemetry.js'),
  referral: read('assets/js/utils/referral-par.js'),
  profileHtml: read('profile.html'),
  profileJs: read('assets/js/profile-page.js'),
  privacyHtml: read('privacy.html'),
  plan: read('docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md')
});

test('W277-A0 keeps local measurement opt-in, bounded, and transport-free', () => {
  const report = verifyW277PrivacyMeasurement(root);
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.sourceOnly, true);
});

test('W277-A0 rejects remote transport or a default-on measurement choice', () => {
  const current = source();
  const broken = {
    ...current,
    analytics: current.analytics.replace('EON_MEASUREMENT_DEFAULT_ENABLED = false', 'EON_MEASUREMENT_DEFAULT_ENABLED = true').replace("import { redactTelemetryPath, redactTelemetryText } from './privacy-telemetry.js';", "import { redactTelemetryPath, redactTelemetryText } from './privacy-telemetry.js';\nfetch('https://example.invalid');")
  };
  const report = evaluateW277PrivacyMeasurement(broken);
  assert.equal(report.ok, false);
  assert.ok(report.errors.some((message) => /off by default|remote transport/.test(message)));
});
