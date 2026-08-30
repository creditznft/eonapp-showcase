import assert from 'node:assert/strict';
import test from 'node:test';
import {
  W378_CLOUDFLARE_CODEX_READINESS_CONTRACT,
  W378_CLOUDFLARE_CODEX_READINESS_SCHEMA
} from '../../config/w378-cloudflare-codex-readiness-contract.mjs';
import { inspectW378CloudflareCodexReadiness } from '../../scripts/w378-cloudflare-codex-readiness-gate.mjs';

test('W378 defines a source-only Cloudflare/Codex handover with no live identity or payment claim', () => {
  assert.equal(W378_CLOUDFLARE_CODEX_READINESS_CONTRACT.schema, W378_CLOUDFLARE_CODEX_READINESS_SCHEMA);
  assert.equal(W378_CLOUDFLARE_CODEX_READINESS_CONTRACT.sourceOnly, true);
  assert.equal(W378_CLOUDFLARE_CODEX_READINESS_CONTRACT.cloudflareConfigurationApplied, false);
  assert.equal(W378_CLOUDFLARE_CODEX_READINESS_CONTRACT.googleOAuthLiveProven, false);
  assert.equal(W378_CLOUDFLARE_CODEX_READINESS_CONTRACT.paymentsActivated, false);
  assert.equal(W378_CLOUDFLARE_CODEX_READINESS_CONTRACT.requiredRuntimeNames.includes('GOOGLE_OAUTH_CLIENT_SECRET'), true);
  assert.equal(W378_CLOUDFLARE_CODEX_READINESS_CONTRACT.requiredRuntimeNames.includes('EON_IDENTITY_DB'), true);
});

test('W378 source gate ensures the newest program checks cannot be skipped by CI or deploy workflows', () => {
  const report = inspectW378CloudflareCodexReadiness();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.sourceOnly, true);
  assert.equal(report.cloudflareConfigurationApplied, false);
  assert.equal(report.googleOAuthLiveProven, false);
  assert.equal(report.paymentsActivated, false);
});
