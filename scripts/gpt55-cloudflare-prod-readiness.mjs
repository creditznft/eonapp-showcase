#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const envPath = process.argv.includes('--env') ? process.argv[process.argv.indexOf('--env') + 1] : '.env.local';

function readEnvFile(file) {
  const out = {};
  if (!file || !fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const i = trimmed.indexOf('=');
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim().replace(/^['"]|['"]$/g, '');
    out[key] = value;
  }
  return out;
}

const local = { ...readEnvFile(envPath), ...process.env };
function present(key) { return Boolean(String(local[key] || '').trim()); }
function redacted(key) {
  const v = String(local[key] || '').trim();
  if (!v) return { present: false, length: 0 };
  return { present: true, length: v.length, preview: `${v.slice(0, 3)}…${v.slice(-3)}` };
}

const cloudflareSecrets = [
  { key: 'TELEGRAM_BOT_TOKEN', required: true, note: 'Required for /api/telegram/session initData verification and channel membership.' },
  { key: 'TELEGRAM_CHANNEL_USERNAME', required: true, note: 'Can be plaintext; expected EonApps.' },
  { key: 'MONETAG_REWARDED_SCRIPT_URL', required: true, note: 'Can be plaintext; expected https://libtl.com/sdk.js.' },
  { key: 'MONETAG_REWARDED_SDK_FUNCTION', required: true, note: 'Can be plaintext; expected show_11111741.' },
  { key: 'MONETAG_REWARDED_ZONE_ID', required: true, note: 'Can be plaintext; expected 11111741.' },
  { key: 'AD_REWARD_POSTBACK_SECRET', required: true, note: 'Must be secret/encrypted and match Monetag postback URL secret.' },
  { key: 'NOWPAYMENTS_IPN_SECRET', required: true, note: 'Must be secret/encrypted; used to verify x-nowpayments-sig IPN callbacks.' },
  { key: 'NOWPAYMENTS_API_KEY', required: true, note: 'Required for live create-subscription/payment intent calls. IPN secret alone is not enough.' }
];

const bindings = [
  { key: 'AD_REWARDS_KV', required: true, note: 'Required for verified Monetag reward receipt/status storage.' },
  { key: 'NOWPAYMENTS_SUBS_KV', required: true, note: 'Required for subscription/order status storage.' },
];

const sourceChecks = [
  { file: 'functions/api/ad-rewards/postback.js', needles: ['AD_REWARDS_KV', 'AD_REWARD_POSTBACK_SECRET'] },
  { file: 'functions/api/nowpayments/create-subscription.js', needles: ['NOWPAYMENTS_API_KEY', 'NOWPAYMENTS_SUBS_KV'] },
  { file: 'functions/api/nowpayments/ipn.js', needles: ['NOWPAYMENTS_IPN_SECRET', 'NOWPAYMENTS_SUBS_KV'] },
  { file: 'assets/js/utils/signed-share-link.js', needles: ['self-contained-signed-no-registry', 'eon2', 'fragment'] }
].map((check) => {
  const text = fs.existsSync(check.file) ? fs.readFileSync(check.file, 'utf8') : '';
  return { file: check.file, ok: Boolean(text) && check.needles.every((needle) => text.includes(needle)), needles: check.needles };
});

const secretRows = cloudflareSecrets.map((row) => ({ ...row, local: redacted(row.key), localPresent: present(row.key) }));
const missingLocalRequired = secretRows.filter((row) => row.required && !row.localPresent).map((row) => row.key);
const bindingChecklist = bindings.map((row) => ({ ...row, dashboardOnly: true }));
const sourceOk = sourceChecks.every((row) => row.ok);
const ok = sourceOk && missingLocalRequired.length === 0;

const result = {
  schema: 'eonapp.gpt55.cloudflare-prod-readiness.v1',
  checkedAt: new Date().toISOString(),
  envPath: path.resolve(envPath),
  ok,
  sourceOk,
  localRequiredSecretsPresent: missingLocalRequired.length === 0,
  missingLocalRequired,
  cloudflareSecretsToConfirmInDashboard: secretRows,
  cloudflareBindingsToConfirmInDashboard: bindingChecklist,
  notes: [
    'This script cannot read Cloudflare dashboard values. It checks local .env.local presence and source wiring only.',
    'Cloudflare Pages Functions receive environment variables and bindings via the env parameter; KV namespace bindings must be configured in the Cloudflare dashboard or Wrangler.',
    'NOWPAYMENTS_API_KEY must be added to Cloudflare before live subscription creation can pass. NOWPAYMENTS_IPN_SECRET only verifies callbacks.',
    'W212 uses self-contained signed links in the URL fragment. Do not create an EON_SHARE_LINKS_KV binding or central short-link registry. D1 remains limited to later qualified referral-tree confirmations.'
  ],
  sourceChecks
};

const outDir = 'reports/gpt55-launch/cloudflare-prod-readiness';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'cloudflare-prod-readiness.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
if (process.argv.includes('--strict-exit') && !ok) process.exit(1);
