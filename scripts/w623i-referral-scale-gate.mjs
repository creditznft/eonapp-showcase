#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W623I_REFERRAL_SCALE_CONTRACT, validateW623iReferralScaleContract } from '../config/w623i-referral-scale-contract.mjs';
import { buildReferralPublicStatus } from '../assets/js/referrals/eon-referral-server-runtime.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const checks = [];
const check = (id, ok, detail = '') => { checks.push({ id, ok: Boolean(ok), detail }); if (!ok) failures.push(`${id}${detail ? `: ${detail}` : ''}`); };
const contract = validateW623iReferralScaleContract();
const status = buildReferralPublicStatus({ EON_REFERRAL_ROLLOUT: 'testing', EON_REFERRALS_DB: { prepare() {} }, EON_BILLING_DB: { prepare() {} }, EON_REFERRAL_RATE_LIMITER: { limit() {} } });
const runtime = read('assets/js/referrals/eon-referral-server-runtime.js');
const billing = read('assets/js/billing/eon-dodo-live-runtime.js');
const api = read('functions/api/referrals.js');
const migration = read('migrations/referrals/0001_referral_authority.sql');
const views = read('migrations/referrals/0002_referral_operational_views.sql');
const prompt = read('program/EONAPP_W623I_EXACT_CLOUDFLARE_AI_PROMPT_2026-07-11.md');

check('contract-valid', contract.ok, contract.errors.join(', '));
check('dedicated-binding-selected', status.databaseBinding === 'EON_REFERRALS_DB' && status.databaseMode === 'dedicated' && status.active, 'dedicated referral D1 preferred');
check('legacy-fallback-visible', /legacy-billing-fallback/.test(runtime), 'temporary migration compatibility only');
check('billing-remains-separate', /applyDodoWebhookToD1\(env\.EON_BILLING_DB/.test(billing) && /referralDatabase/.test(billing), 'billing events and referral value use separate bindings');
check('duplicate-replay-repairs-delivery', /if \(existing\?\.processing_status[\s\S]*applyReferralBillingSignal/.test(billing), 'Dodo retry can repair referral delivery after billing insert');
check('dedicated-paid-state', /eon_referral_billing_state/.test(runtime) && !/FROM eon_entitlements/.test(runtime), 'referral D1 mirrors only minimal paid state');
check('optional-rate-limiter', /EON_REFERRAL_RATE_LIMITER/.test(api) && /rate_limited/.test(api), 'no D1 write counter required');
check('eight-table-migration', ['eon_referral_bind_challenges','eon_referral_identities','eon_invite_accounts','eon_invite_events','eon_key_grants','eon_key_unlocks','eon_digital_rewards','eon_referral_billing_state'].every((name) => migration.includes(name)), 'complete authority schema');
check('indexes-present', (migration.match(/CREATE (?:UNIQUE )?INDEX/g) || []).length >= 11, 'indexed account/status/idempotency lookups');
check('privacy-safe-view', /eon_referral_operational_counts/.test(views) && !/FROM\s+eon_(?:click|impression|social_post)/i.test(views), 'qualified counts only');
check('no-reset', !/DROP TABLE|DELETE FROM eon_/i.test(migration) && W623I_REFERRAL_SCALE_CONTRACT.databaseResetAllowed === false, 'never reset production D1');
check('no-extra-infrastructure', W623I_REFERRAL_SCALE_CONTRACT.noCron && W623I_REFERRAL_SCALE_CONTRACT.noQueue && W623I_REFERRAL_SCALE_CONTRACT.noR2Required, 'event-driven only');
check('separate-commercial-rails', status.monetization === 'separate-commercial-rails' && status.ordinaryAdsOutsideReferral === true && status.rewardedSponsorKeysOutsideReferral === true && status.referralAdViewRewards === false, 'referral ledger stays independent from ordinary ads and Sponsor Keys');
check('cloudflare-prompt-safe', /DO NOT delete, reset, rename, recreate, empty/i.test(prompt) && /EONAPP_REFERRALS_DB/.test(prompt) && /EON_REFERRALS_DB/.test(prompt), 'owner prompt is non-destructive and exact');
check('codex-final-live-plan', /W640/.test(prompt) && /Codex/.test(prompt), 'post-W640 live verification retained');
check('scale-thresholds', W623I_REFERRAL_SCALE_CONTRACT.operationalThresholds.reviewAtDatabaseGb === 7 && W623I_REFERRAL_SCALE_CONTRACT.operationalThresholds.shardBeforeDatabaseGb === 8, '10 GB hard limit guarded early');

const report = { schema: 'eonapp.w623i-referral-scale-gate.v1', generatedAt: new Date().toISOString(), status: failures.length ? 'failed' : 'passed', checks, architecture: W623I_REFERRAL_SCALE_CONTRACT, sourceReady: failures.length === 0, liveDeploymentProven: false };
const dir = path.join(root, 'reports', 'w623i-referral-scale');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'launch-board.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) { console.error(`W623I gate failed (${failures.length}/${checks.length}):`); failures.forEach((failure) => console.error(`- ${failure}`)); process.exit(1); }
console.log(`W623I gate passed ${checks.length}/${checks.length}.`);
console.log('Dedicated EON_REFERRALS_DB preferred; eonapp-billing remains billing-only.');
console.log('No database reset, click tracking, cron, queue, media storage, or new database required.');
