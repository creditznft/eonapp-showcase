#!/usr/bin/env node
/** W395 source gate: identity/D1 deployment readiness without a live claim. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W395_GOOGLE_IDENTITY_D1_READINESS_CONTRACT, validateW395GoogleIdentityD1ReadinessContract } from '../config/w395-google-identity-d1-readiness-contract.mjs';
import { runW373IdentityAccountOperationsGate } from './w373-identity-account-operations-gate.mjs';
import { runW374GoogleOauthPagesFunctionsGate } from './w374-google-oauth-pages-functions-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readAt = (rootDir, relative) => readFileSync(path.join(rootDir, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

function containsCommittedCredential(value = '') {
  const text = String(value || '');
  const explicitSecret = /(GOOGLE_OAUTH_CLIENT_SECRET|EON_AUTH_SUBJECT_PEPPER|EON_SESSION_SIGNING_KEY|EON_OAUTH_FLOW_SIGNING_KEY)\s*=\s*["']?(?!<|REPLACE_|set manually|\$\{|your_|example)[A-Za-z0-9_\-/]{24,}/i;
  const likelyGoogleSecret = /GOCSPX-[A-Za-z0-9_-]{20,}/;
  return explicitSecret.test(text) || likelyGoogleSecret.test(text);
}

export function inspectW395GoogleIdentityD1Readiness({ rootDir = root } = {}) {
  const contract = W395_GOOGLE_IDENTITY_D1_READINESS_CONTRACT;
  const checks = [];
  const check = (id, value, detail) => {
    checks.push({ id, pass: Boolean(value), detail });
    ensure(value, `${id}: ${detail}`);
  };

  check('contract-valid', validateW395GoogleIdentityD1ReadinessContract(contract).length === 0, 'W395 readiness contract has no internal violations');
  for (const relative of contract.requiredFiles) check(`required:${relative}`, existsSync(path.join(rootDir, relative)), `required W395 file exists: ${relative}`);

  const auth = readAt(rootDir, 'functions/_shared/eon-auth.js');
  const migration = readAt(rootDir, 'identity/migrations/0001_eon_identity.sql');
  const template = readAt(rootDir, 'identity/wrangler.identity.example.toml');
  const runbook = readAt(rootDir, 'docs/W395_GOOGLE_IDENTITY_D1_DEPLOYMENT_READINESS_2026-06-28.md');
  const environment = readAt(rootDir, 'docs/GOOGLE_IDENTITY_ENVIRONMENT_TEMPLATE_2026-06-26.txt');
  const profile = readAt(rootDir, 'assets/js/profile-page.js');

  for (const name of contract.requiredEnvironmentNames) {
    check(`environment:${name}`, `${auth}\n${template}\n${runbook}\n${environment}`.includes(name), `identity environment or binding name is documented: ${name}`);
  }
  const normalizeWhitespace = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();
  const normalizedRunbook = normalizeWhitespace(runbook);
  for (const route of contract.requiredRoutes) check(`route:${route}`, normalizedRunbook.includes(normalizeWhitespace(route)), `runbook names required identity route: ${route}`);
  const migrationSchema = migration.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n');
  check('minimal-d1-schema', /eon_identity_accounts/.test(migrationSchema) && /eon_identity_sessions/.test(migrationSchema) && !/\b(chat|prompt|vault|provider key|access token|refresh token)\b/i.test(migrationSchema), 'identity migration remains minimal metadata/session storage');
  check('fail-closed-config', /status: configured \? 'ready' : 'not_configured'/.test(auth) && /validRedirectUri/.test(auth), 'identity configuration remains fail-closed with exact callback validation');
  check('identity-only-scopes', /scope', 'openid email profile'/.test(readAt(rootDir, 'functions/api/auth/google/start.js')), 'Google OAuth requests only identity scopes');
  check('simple-signin-boundary', !/eon-profile-google-data-ack|dataCustodyAck/.test(profile) && /current work stays on this device/i.test(profile), 'Identity readiness keeps the local-work boundary visible without a backup acknowledgement gate');
  check('template-placeholders-only', template.includes('REPLACE_WITH_PRODUCTION_D1_DATABASE_ID') && !containsCommittedCredential(template), 'Wrangler example contains placeholders and no committed credential');
  check('docs-no-credentials', !containsCommittedCredential(`${runbook}\n${environment}`), 'W395 operator documents contain no credential value');
  check('preview-disabled', /EON_AUTH_ROLLOUT=disabled/.test(runbook) && /Preview Google Login stays\s*disabled/i.test(template), 'Preview OAuth remains disabled by default');
  check('no-live-claim', /does \*\*not\*\* prove/i.test(runbook) && /liveProofRequired: true/.test(readAt(rootDir, 'config/w395-google-identity-d1-readiness-contract.mjs')), 'W395 source documents do not claim live OAuth/D1 proof');
  check('future-reward-blocked', contract.boundaries.accountBackedCollection === false && contract.boundaries.referralRewards === false && contract.boundaries.socialTokenStorage === false, 'Collection, referrals and social tokens remain blocked');

  const w373 = runW373IdentityAccountOperationsGate(rootDir);
  const w374 = runW374GoogleOauthPagesFunctionsGate(rootDir);
  check('w373-base-gate', w373.ok === true && w373.sourceOnly === true, 'W373 minimal account operation source gate passes');
  check('w374-base-gate', w374.ok === true && w374.sourceOnly === true && w374.liveOAuthConfigured === false, 'W374 OAuth source gate passes without a live claim');

  return Object.freeze({
    schema: 'eonapp.w395.google-identity-d1-readiness-gate.v1',
    wave: 'W395',
    status: 'pass',
    sourceOnly: true,
    liveIdentityCertified: false,
    accountRestoreCertified: false,
    collectionOrReferralEligible: false,
    checkCount: checks.length,
    checks: Object.freeze(checks),
    manualProofLanes: contract.requiredManualProofLanes,
    limitations: Object.freeze([
      'No Cloudflare Pages binding, D1 migration, secret, browser OAuth session or live route was contacted by this source gate.',
      'Google Login remains unavailable until an operator configures exact Google and Cloudflare settings and completes controlled Testing-mode proof.',
      'Identity does not back up or restore browser-local work, and does not authorize Collection, Relay referrals, social tokens or direct publishing.'
    ])
  });
}

export function runW395GoogleIdentityD1ReadinessGate({ writeArtifact = true, rootDir = root } = {}) {
  const result = inspectW395GoogleIdentityD1Readiness({ rootDir });
  if (writeArtifact) {
    const directory = path.join(rootDir, 'artifacts', 'w395-google-identity-d1-readiness-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW395GoogleIdentityD1ReadinessGate();
  process.stdout.write(`W395 Google Identity + D1 readiness gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
