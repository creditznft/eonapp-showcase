#!/usr/bin/env node
/** W206 — MyLead primary offerwall source readiness gate. No live-provider claim. */
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
  'tests/unit/w206-mylead-primary-offerwall.test.mjs',
  'MYLEAD_DASHBOARD_SETUP_2026-06-23.md',
  'EONAPP_W206_MYLEAD_PRIMARY_OFFERWALL_HANDOVER_2026-06-23.md'
];
const checks = [];
const add = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });
const read = (path) => readFileSync(resolve(root, path), 'utf8');

for (const file of files) add(`file:${file}`, existsSync(resolve(root, file)), existsSync(resolve(root, file)) ? 'present' : 'missing');
const providers = existsSync(resolve(root, files[0])) ? read(files[0]) : '';
const ledger = existsSync(resolve(root, files[1])) ? read(files[1]) : '';
const launch = existsSync(resolve(root, files[3])) ? read(files[3]) : '';
const postback = existsSync(resolve(root, files[4])) ? read(files[4]) : '';
const policy = existsSync(resolve(root, files[5])) ? read(files[5]) : '';
const ui = existsSync(resolve(root, files[6])) ? read(files[6]) : '';

add('provider:mylead-primary-registered', /mylead/.test(providers) && /EON_REWARD_MYLEAD/.test(providers) && /requiresPostbackIpAllowlist:\s*true/.test(providers), 'MyLead uses Cloudflare-only environment values and requires postback source allowlisting.');
add('provider:mylead-player-id-bound', /mylead_offerwall_template_must_bind_player_id/.test(providers), 'MyLead launch template must bind only the opaque token as player_id.');
add('provider:mylead-credit-from-virtual-amount', /virtual_amount/.test(ledger) && /provider === 'mylead'/.test(ledger), 'MyLead credit is based on the virtual amount shown to the user, not raw payout.');
add('provider:opaque-token-required', /accountTokenRequired:\s*true/.test(providers) && /accountToken/.test(launch), 'Provider URL contains an opaque account token rather than a local profile identifier.');
add('postback:mylead-status-lifecycle', /\$\{parsed\.provider\}_postback_status_invalid/.test(postback) && /mylead_virtual_amount_required_for_approved_credit/.test(postback) && /\['approved'\]/.test(ledger) && /\['rejected', 'reversed', 'chargeback', 'cancelled', 'canceled', 'void'\]/.test(ledger), 'Only known MyLead lifecycle statuses are accepted; approved credit requires virtual_amount.');
add('postback:mylead-source-allowlist', /mylead_postback_source_not_allowlisted/.test(postback) && /isProviderPostbackSourceAllowed/.test(postback), 'Postback requires trusted source IP plus the provider secret.');
add('ui:partner-disclosure-before-launch', /eon-reward-partner-consent/.test(ui) && /browser cannot add credits/i.test(ui), 'User must see external-partner disclosure before opening an offerwall.');
add('policy:one-primary-provider', /EON_REWARD_PRIMARY_PROVIDER = 'mylead'/.test(policy), 'MyLead is the only designated primary provider.');

const failed = checks.filter((entry) => !entry.ok);
console.log(JSON.stringify({
  schema: 'eon.mylead-primary-offerwall-gate.w206.v1',
  generatedAt: new Date().toISOString(),
  passed: failed.length === 0,
  checks,
  failed,
  note: 'This verifies source safeguards only. It does not prove MyLead approved EONAPP, that the exact dashboard postback and IP allowlist are correct, or that a live provider callback has occurred.'
}, null, 2));
if (failed.length) process.exitCode = 1;
