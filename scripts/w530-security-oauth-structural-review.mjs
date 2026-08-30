#!/usr/bin/env node
/**
 * W530 reads source policy only. It does not fetch a target, start OAuth,
 * access a session, request consent, read .env files, or print secrets.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W530_SECURITY_OAUTH_CONTRACT,
  W530_SECURITY_OAUTH_SCHEMA,
  validateW530SecurityOauthContract
} from '../config/w530-security-oauth-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (root, relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function buildW530SecurityOauthStructuralReview({ root = ROOT } = {}) {
  const issues = [...validateW530SecurityOauthContract()];
  const required = [
    '_headers',
    'public/_headers',
    'functions/_shared/eon-auth.js',
    'functions/api/auth/google/start.js',
    'functions/api/auth/google/callback.js',
    'functions/api/auth/session.js',
    'functions/api/auth/logout.js',
    'assets/js/profile-page.js',
    'assets/js/local-first/eon-google-drive-backup-foundation.js'
  ];
  for (const relative of required) if (!fs.existsSync(path.join(root, relative))) issues.push(`required-source-missing:${relative}`);
  const headers = required.every((relative) => fs.existsSync(path.join(root, relative))) ? read(root, '_headers') : '';
  const publicHeaders = fs.existsSync(path.join(root, 'public/_headers')) ? read(root, 'public/_headers') : '';
  const start = fs.existsSync(path.join(root, 'functions/api/auth/google/start.js')) ? read(root, 'functions/api/auth/google/start.js') : '';
  const callback = fs.existsSync(path.join(root, 'functions/api/auth/google/callback.js')) ? read(root, 'functions/api/auth/google/callback.js') : '';
  const session = fs.existsSync(path.join(root, 'functions/api/auth/session.js')) ? read(root, 'functions/api/auth/session.js') : '';
  const logout = fs.existsSync(path.join(root, 'functions/api/auth/logout.js')) ? read(root, 'functions/api/auth/logout.js') : '';
  const profile = fs.existsSync(path.join(root, 'assets/js/profile-page.js')) ? read(root, 'assets/js/profile-page.js') : '';
  const drive = fs.existsSync(path.join(root, 'assets/js/local-first/eon-google-drive-backup-foundation.js')) ? read(root, 'assets/js/local-first/eon-google-drive-backup-foundation.js') : '';
  if (headers !== publicHeaders) issues.push('header-mirror-drift');
  for (const marker of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", 'Strict-Transport-Security:']) if (!headers.includes(marker)) issues.push(`header-marker-missing:${marker}`);
  if (!start.includes("scope', 'openid email profile")) issues.push('identity-scope-not-identity-only');
  if (/drive|gmail|calendar|contacts|youtube/i.test(start)) issues.push('identity-start-requests-product-scope');
  if (!/exchangeGoogleCode/.test(callback) || !/verifyGoogleIdToken/.test(callback) || !/sameState/.test(callback)) issues.push('callback-server-verification-incomplete');
  if (!/publicAuthStatus/.test(session) || /access_token|refresh_token|id_token/.test(session)) issues.push('session-surface-not-display-safe');
  if (!/enforceSameOriginMutation/.test(logout) || !/clearSessionCookie/.test(logout)) issues.push('logout-same-origin-boundary-missing');
  if (!/Google Login does not copy local Chat, Vault, projects, Realm setup, City progress, files, provider keys, or settings to EONAPP or Google/.test(profile) || !/Google Drive backup uses a separate explicit permission only from the Capsule page and never reuses Google Login consent/.test(profile) || !/Google Drive uses the same encrypted Capsule format; it does not create sync/.test(profile)) issues.push('profile-drive-consent-boundary-missing');
  if (!/drive\.file/.test(drive) || !/googleIdentityConsentReusable:\s*false/.test(drive)) issues.push('drive-foundation-separation-missing');
  return Object.freeze({
    schema: W530_SECURITY_OAUTH_SCHEMA,
    wave: 'W530',
    sourceOnly: true,
    ok: issues.length === 0,
    targetFetched: false,
    headersCapturedFromNetwork: false,
    oauthStarted: false,
    sessionRead: false,
    consentRequested: false,
    secretsRead: false,
    requiredIdentityScope: W530_SECURITY_OAUTH_CONTRACT.requiredIdentityScope,
    pendingExternalEvidence: W530_SECURITY_OAUTH_CONTRACT.pendingExternalEvidence,
    issues: Object.freeze([...new Set(issues)].sort())
  });
}

function main() {
  const review = buildW530SecurityOauthStructuralReview();
  const output = path.join(ROOT, 'tmp', 'w530-security-oauth-structural-review.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(review, null, 2)}\n`);
  console.log(JSON.stringify(review, null, 2));
  if (!review.ok) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error?.stack || error); process.exitCode = 1; }
}
