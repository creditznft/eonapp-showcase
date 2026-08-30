#!/usr/bin/env node
/** W400C + W423 source gate: explicit guest sign-in card with one-tap Google OAuth. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateW400CGoogleIdentityEntryContract } from '../config/w400c-google-identity-entry-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW400CGoogleIdentityEntry() {
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };
  const shell = read('assets/js/eon-app-shell.js');
  const css = read('assets/css/eon-app-shell.css');
  const profile = read('profile.html');
  const runtime = read('assets/js/profile-page.js');
  const start = read('functions/api/auth/google/start.js');
  const callback = read('functions/api/auth/google/callback.js');
  const authShared = read('functions/_shared/eon-auth.js');
  check('contract-valid', validateW400CGoogleIdentityEntryContract().length === 0, 'Identity entry contract has no internal mismatch');
  check('visible-guest-entry', /data-eon-header-account/.test(shell) && /data-eon-shell-profile-mode>Guest · Sign in/.test(shell), 'Chat header and lower account chip expose a clear guest sign-in action');
  check('explicit-guest-entry', /data-eon-header-account/.test(shell) && /openSimpleSignInDialog\(account\)/.test(shell) && !/scheduleAutomaticGuestSignIn/.test(shell), 'A signed-out visitor sees a clear Sign in control and the dialog opens only after an explicit user action');
  check('simple-one-action-modal', /data-eon-signin-dialog/.test(shell) && /Continue with Google/.test(shell) && /data-eon-signin-google/.test(shell) && !/data-eon-signin-guest/.test(shell) && !/Continue as guest/.test(shell), 'Guest sign-in uses one visible Google action because the visitor is already a usable guest');
  check('privacy-line-not-backup-detour', /Your chats, files, projects, Vault and City progress stay on this device unless you later choose a separate Sync action\./.test(shell) && !/data-eon-header-account-ack|dataCustodyAck/.test(shell), 'Sign-in uses an honest local-work privacy line without a backup checkbox or Profile detour');
  check('oauth-is-user-tap-only', /data-eon-signin-google href="\$\{startHref\}"/.test(shell) && /\/api\/auth\/google\/start/.test(shell) && !/window\.location\.assign\(startHref\)/.test(shell), 'Google OAuth starts only from the user-tapped primary card action');
  check('select-account-requested', /authorization\.searchParams\.set\('prompt',\s*'select_account'\)|prompt:\s*'select_account'/.test(start), 'The hosted OAuth start route requests the official Google account chooser');
  check('retry-stays-on-safe-page', /authStatusReturnRedirect\(config\.appOrigin, flow\?\.returnTo \|\| '\/'/.test(callback) && /safeReturnTo\(extraHeaders\.returnTo \|\| '\/'/.test(authShared), 'OAuth cancellation/error falls back to the verified original page or Home, not a generic Profile error');
  check('profile-is-not-a-required-ack-gate', !/eon-profile-google-data-ack/.test(profile) && !/dataCustodyAck/.test(runtime) && !/backup_notice_required/.test(start), 'Profile and OAuth start no longer require a backup acknowledgement before identity-only sign-in');
  check('small-screen-safe', /eon-signin-dialog-layer/.test(css) && /max-width: 640px/.test(css), 'The sign-in dialog has an explicit mobile safe-area layout');
  check('no-secret-or-token-client-code', !/GOOGLE_OAUTH_CLIENT_SECRET|EON_SESSION_SIGNING_KEY|localStorage.*(?:token|session)/.test(shell), 'Shell keeps OAuth secrets and sessions out of client UI');
  return Object.freeze({ schema: 'eonapp.w423.google-identity-entry-gate.v3', status: 'pass', sourceOnly: true, checkCount: checks.length, checks: Object.freeze(checks), limitations: Object.freeze(['This source gate does not perform a real Google test-user login, logout, account chooser, account deletion or persistence proof.']) });
}

export function runW400CGoogleIdentityEntryGate({ writeArtifact = true } = {}) {
  const result = inspectW400CGoogleIdentityEntry();
  if (writeArtifact) { const dir = path.join(root, 'artifacts', 'w400c-google-identity-entry-gate'); mkdirSync(dir, { recursive: true }); writeFileSync(path.join(dir, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`); }
  return result;
}
if (import.meta.url === `file://${process.argv[1]}`) { const result = runW400CGoogleIdentityEntryGate(); process.stdout.write(`W423 Google identity entry gate passed (${result.checkCount}/${result.checkCount}).\n`); }
