#!/usr/bin/env node
/** W205 — CPA Grip offerwall readiness gate. Source-level only; no live provider claim. */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const files = [
  'functions/api/rewards/_providers.js',
  'functions/api/rewards/_ledger.js',
  'functions/api/rewards/config.js',
  'functions/api/rewards/launch.js',
  'functions/api/rewards/postback.js',
  'assets/js/rewards/eon-reward-policy.js',
  'assets/js/rewards/eon-rewards-page.js',
  'tests/unit/w205-cpagrip-offerwall-adapter.test.mjs'
];
const checks = [];
const add = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });
const read = (path) => readFileSync(resolve(root, path), 'utf8');

for (const file of files) add(`file:${file}`, existsSync(resolve(root, file)), existsSync(resolve(root, file)) ? 'present' : 'missing');
const providers = existsSync(resolve(root, files[0])) ? read(files[0]) : '';
const ledger = existsSync(resolve(root, files[1])) ? read(files[1]) : '';
const launch = existsSync(resolve(root, files[3])) ? read(files[3]) : '';
const postback = existsSync(resolve(root, files[4])) ? read(files[4]) : '';
const ui = existsSync(resolve(root, files[6])) ? read(files[6]) : '';

add('provider:cpagrip-registered', /cpagrip/.test(providers) && /EON_REWARD_CPAGRIP/.test(providers), 'CPA Grip runtime config uses Cloudflare environment names only.');
add('provider:opaque-token-required', /accountTokenRequired:\s*true/.test(providers) && /accountToken/.test(launch), 'Provider URL must contain only a short-lived opaque account token.');
add('provider:https-template-only', /offerwall_template_must_use_https/.test(providers), 'Hosted offerwall templates reject non-HTTPS URLs.');
add('ledger:lifecycle-reversal', /applyLedgerTransition/.test(ledger) && /reversalDebtCredits/.test(ledger), 'Confirmed callback can be updated by a verified reversal.');
add('postback:secret-required', /invalid_postback_secret/.test(postback) && /providerSecret/.test(postback), 'Postback rejects callbacks without the configured provider secret.');
add('postback:cpagrip-token-lookup', (/cpagrip_account_token_unknown_or_expired/.test(postback) || (/providerTokenError/.test(postback) && /account_token_unknown_or_expired/.test(postback))), 'CPA Grip callback must resolve a stored opaque launch token.');
add('ui:no-direct-credit', /browser cannot add credits/i.test(ui) && !/Direct Link.*earn/i.test(ui), 'Rewards UI cannot advertise clicks or browser-only credits.');

const failed = checks.filter((entry) => !entry.ok);
console.log(JSON.stringify({
  schema: 'eon.cpagrip-offerwall-gate.w205.v1',
  generatedAt: new Date().toISOString(),
  passed: failed.length === 0,
  checks,
  failed,
  note: 'This verifies source safeguards only. It does not prove CPA Grip has approved the EONAPP reward model, that its dashboard macros are correct, or that a live provider callback has occurred.'
}, null, 2));
if (failed.length) process.exitCode = 1;
