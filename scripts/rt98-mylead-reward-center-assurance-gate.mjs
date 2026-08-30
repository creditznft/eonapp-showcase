#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const checks = [];
const add = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });

const contract = read('config/rt98-reward-center-contract.mjs');
const policy = read('assets/js/rewards/eon-reward-policy.js');
const providers = read('functions/api/rewards/_providers.js');
const ledger = read('functions/api/rewards/_ledger.js');
const postback = read('functions/api/rewards/postback.js');
const launch = read('functions/api/rewards/launch.js');
const index = read('functions/api/rewards/index.js');
const config = read('functions/api/rewards/config.js');
const page = read('assets/js/rewards/eon-rewards-page.js');
const html = read('rewards.html');
const migration = read('migrations/referrals/0006_mylead_reward_center.sql');
const schemaAuthority = read('assets/js/infrastructure/eon-d1-schema-authority.js');

add('01 primary provider is MyLead', /EON_REWARD_PRIMARY_PROVIDER\s*=\s*['"]mylead['"]/.test(contract));
add('02 EONKEYS are noncash, nontransferable and server-authoritative', /creditCashValue:\s*false/.test(contract) && /creditTransferable:\s*false/.test(contract) && /browserCanMint:\s*false/.test(contract) && /providerPostbackRequired:\s*true/.test(contract));
add('03 browser/iframe/redirect/VAST completion cannot mint', /iframeCloseCanMint:\s*false/.test(contract) && /redirectCanMint:\s*false/.test(contract) && /vastPlaybackCanMint:\s*false/.test(contract));
add('04 exact bounded unlock catalogue is present', ['eonkeys: 5, durationMinutes: 15','eonkeys: 10, durationMinutes: 30','eonkeys: 20, durationMinutes: 60','eonkeys: 30, durationMinutes: 90','eonkeys: 50, durationMinutes: 180'].every((needle) => contract.includes(needle)));
add('05 MyLead config fails closed behind explicit enable/url/secret', /EON_REWARD_MYLEAD_ENABLED/.test(providers) && /EON_REWARD_MYLEAD_OFFERWALL_URL/.test(providers) && /EON_REWARD_MYLEAD_POSTBACK_SECRET/.test(providers) && /postbackSecret\.length\s*>=\s*24/.test(providers));
add('06 postback source IP is allowlisted with current MyLead default', providers.includes("MYLEAD_DEFAULT_POSTBACK_IP = '159.65.61.13'") && /mylead_postback_source_not_allowlisted/.test(providers));
add('07 postback secret uses timing-safe comparison and is never public', /timingSafeEqual/.test(providers) && /validateMyLeadPostbackSecret/.test(postback) && !/postbackSecret\s*:/.test(config));
add('08 provider transaction identity is unique and idempotent', /PRIMARY KEY \(provider, transaction_id\)/.test(migration) && /INSERT OR IGNORE INTO eon_reward_ledger/.test(ledger) && /mylead:\$\{parsed\.transactionId\}:credit/.test(ledger));
add('09 stable opaque player and random launch correlation are server-generated', /eon_reward_players/.test(migration) && /randomPlayerId/.test(ledger) && /randomToken\(24\)/.test(ledger) && /ml_sub1/.test(providers) && /player_id/.test(providers));
add('10 source surface is carried only through bounded ml_sub2 contract', /ml_sub2/.test(providers) && /normalizeRewardSurface/.test(providers) && /source_surface/.test(migration));
add('11 approved virtual_amount is exact positive integer credit authority', /Number\.isSafeInteger\(number\)/.test(providers) && /mylead_virtual_amount_required_for_approved_credit/.test(providers) && /'credit', \?, 'mylead_approved'/.test(ledger));
add('12 reversal appends a single negative ledger entry and permits debt', /'reversal', -ABS\(virtual_amount\)/.test(ledger) && /debt:\s*Math\.max\(0, -balance\)/.test(ledger));
add('13 transaction rebinding, player/correlation mismatch, and expired launch correlation fail closed', /mylead_transaction_attribution_conflict/.test(ledger) && /mylead_player_id_tracking_token_mismatch/.test(ledger) && /mylead_launch_expired/.test(ledger) && /launchExpiresAt < time/.test(ledger));
add('14 redemption uses derived balance and writes compatible temporary eon_key_unlocks', /COALESCE\(SUM\(amount\), 0\)/.test(ledger) && /INSERT OR IGNORE INTO eon_key_unlocks/.test(ledger) && /expiresAt = time \+ unlock\.durationMinutes/.test(ledger));
add('15 provider response excludes account, balance, payout and private state', /Provider-facing response intentionally excludes/.test(postback) && /transactionId:/.test(postback) && !/balance:\s*result/.test(postback) && !/accountId:\s*result/.test(postback) && !/payoutDecimal:\s*result/.test(postback));
add('16 authenticated same-origin launch/redemption endpoints ignore browser account ids', /requireRewardSession\(context, \{ mutation: true \}\)/.test(launch) && /accountId:\s*auth\.session\.accountId/.test(launch) && /requireRewardSession\(context, \{ mutation: true \}\)/.test(index) && /accountId:\s*auth\.session\.accountId/.test(index));
add('17 migration 0006 and Reward Center UI are active while legacy rewarded runtime is not loaded by rewards page', exists('migrations/referrals/0006_mylead_reward_center.sql') && /referrals:\s*Object\.freeze\(\{ binding: 'EON_REFERRALS_DB', version: 6/.test(schemaAuthority) && /EON Reward Center/.test(html) && /MyLead Sponsored Missions/.test(html) && !/eon-rewarded-sponsor-runtime|ExoClick|VAST/.test(page + html) && /EON_REWARD_PRIMARY_PROVIDER/.test(policy));

for (const [index, check] of checks.entries()) {
  const marker = check.pass ? 'PASS' : 'FAIL';
  console.log(`${marker} ${String(index + 1).padStart(2, '0')}/17 — ${check.name}${check.detail ? ` — ${check.detail}` : ''}`);
}
const passed = checks.filter((check) => check.pass).length;
console.log(`\nRT98 assurance: ${passed}/${checks.length} PASS`);
if (passed !== checks.length) process.exit(1);
