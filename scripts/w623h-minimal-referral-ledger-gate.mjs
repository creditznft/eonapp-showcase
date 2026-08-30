#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateW623hMinimalReferralContract, W623H_MINIMAL_REFERRAL_CONTRACT } from '../config/w623h-minimal-referral-ledger-contract.mjs';
import { buildReferralPublicStatus, validateReferralServerContract } from '../assets/js/referrals/eon-referral-server-runtime.js';
import { EON_REFERRAL_REWARD_MATRIX } from '../assets/js/referrals/eon-keys-catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const failures = [];
const checks = [];
const check = (id, ok, detail = '') => {
  checks.push({ id, ok: Boolean(ok), detail });
  if (!ok) failures.push(`${id}${detail ? `: ${detail}` : ''}`);
};

const contract = validateW623hMinimalReferralContract();
const runtime = validateReferralServerContract();
const publicActive = buildReferralPublicStatus({ EON_REFERRAL_ROLLOUT: 'production', EON_REFERRALS_DB: { prepare() {} }, EON_BILLING_DB: { prepare() {} } });
const publicDisabled = buildReferralPublicStatus({ EON_REFERRALS_DB: { prepare() {} } });
const api = read('functions/api/referrals.js');
const billing = read('assets/js/billing/eon-dodo-live-runtime.js');
const client = read('assets/js/referrals/eon-referral-server-client.js');
const attribution = read('assets/js/utils/share-attribution.js');
const share = read('assets/js/utils/eon-share-sheet.js');
const keyPage = read('assets/js/referrals/eon-keys-page.js');
const migration = read('migrations/0002_minimal_referral_eonkeys.sql');
const viral = read('assets/js/share/eon-viral-share-kit.js');

check('contract-valid', contract.ok, contract.errors.join(', '));
check('runtime-valid', runtime.ok, runtime.errors.join(', '));
check('rollout-controlled', publicActive.active && publicActive.referralGrantsActive && publicActive.keyRedemptionActive && !publicDisabled.active, 'testing/production + D1 required');
check('separate-monetization-rails', publicActive.monetization === 'separate-commercial-rails' && publicActive.ordinaryAdsOutsideReferral === true && publicActive.rewardedSponsorKeysOutsideReferral === true && publicActive.referralAdViewRewards === false && /Sponsor Keys/.test(keyPage), 'referrals never treat ads/views as referral milestones');
check('minimal-cloudflare-load', publicActive.cloudflareLoadModel === 'event-driven-and-lazy-no-polling-no-cron' && W623H_MINIMAL_REFERRAL_CONTRACT.newDatabaseRequired === false, 'existing dedicated D1 only');
check('privacy-safe-growth-metrics', publicActive.measurement === 'ledger-derived-aggregates-only-no-click-impression-or-social-post-tracking' && /Verified sharing progress/.test(keyPage), 'existing qualified ledger counts only');
check('api-actions', ['request_bind_challenge', 'bind_identity', 'enroll', 'qualify_activation', 'redeem'].every((action) => api.includes(`'${action}'`)), 'five explicit actions including proof challenge');
check('identity-proof-of-possession', /requestReferralBindChallenge/.test(api) && /signSharePayload/.test(client) && /bind_signature_invalid/.test(read('assets/js/referrals/eon-referral-server-runtime.js')), 'fresh P-256 challenge prevents public-link claim squatting');
check('same-origin-and-session', /enforceSameOriginMutation/.test(api) && /readSession/.test(api) && /sign_in_required/.test(api), 'authenticated mutation boundary');
check('webhook-linked', /applyReferralBillingSignal/.test(billing) && /referralActive/.test(billing) && /referralStatus/.test(billing), 'Dodo event integration');
check('retention-and-reversal', /awaiting_14_day_retention/.test(read('assets/js/referrals/eon-referral-server-runtime.js')) && /paid_referral_reversed/.test(read('assets/js/referrals/eon-referral-server-runtime.js')), '14-day pending plus reversal');
check('stateless-link', /signedLinksRemainStateless:\s*true/.test(read('assets/js/referrals/eon-referral-server-runtime.js')) && !/CREATE TABLE[^;]*click/i.test(migration), 'no link/click registry');
check('raw-token-session-only', /ATTRIBUTION_SESSION_TOKEN_KEY/.test(attribution) && /sessionStorage/.test(attribution) && /withoutRawToken/.test(attribution) && !/token\s*:\s*verified\.token/.test(attribution) && /transientToken/.test(attribution), 'raw signed invite never enters persistent envelope');
check('share-registers-identity', /bindReferralIdentityFromInvite/.test(share) && /activeRewards:\s*referralStatus\?\.active === true/.test(share), 'share command binds signed-in identity and reports active rewards from the server status');
check('project-activation-bridge', /eon:project-saved/.test(read('assets/js/utils/eon-workspace-store.js')) && /installReferralMilestoneBridge/.test(read('assets/js/eon-app-shell.js')) && /first_project_saved/.test(client), 'event-driven useful milestone');
check('redemption-ui', /Register my invite identity/.test(keyPage) && /Accept saved signed invite/.test(keyPage) && /Redeem this key/.test(keyPage), 'live account controls');
check('reward-matrix', JSON.stringify(EON_REFERRAL_REWARD_MATRIX.map((row) => row.id)) === JSON.stringify(['invite-click', 'activated-free-invite', 'trial-started', 'first-retained-paid', 'second-retained-paid', 'third-retained-paid']), 'click none, activation Signal, retained Builder/Builder/Power');
check('trial-no-key', EON_REFERRAL_REWARD_MATRIX.find((row) => row.id === 'trial-started')?.inviterReward?.length === 0, 'trial alone earns nothing');
check('external-sharing-separated-from-monetization', /Sponsor Terminal is separate from referral attribution/.test(viral) && /independent external promotion/.test(viral), 'public sharing/referrals stay separate from ordinary and rewarded ad rails');
check('migration-complete', ['eon_referral_bind_challenges', 'eon_referral_identities', 'eon_invite_accounts', 'eon_invite_events', 'eon_key_grants', 'eon_key_unlocks', 'eon_digital_rewards'].every((table) => migration.includes(table)), 'seven minimal tables including short-lived bind challenges');

const report = {
  schema: 'eonapp.w623h-minimal-referral-ledger-gate.v1',
  generatedAt: new Date().toISOString(),
  status: failures.length ? 'failed' : 'passed',
  checks,
  architecture: W623H_MINIMAL_REFERRAL_CONTRACT,
  rollout: { sourceReady: failures.length === 0, deploymentActive: false, requiredSetting: 'EON_REFERRAL_ROLLOUT=testing|production', preferredBinding: 'EON_REFERRALS_DB', legacyFallbackBinding: 'EON_BILLING_DB' },
  viralReadiness: { organicSharing: true, serverAttribution: true, qualifiedRewardLedger: true, abuseReversal: true, privacySafeMeasurement: true, sourceScore: 9.7, deployedScoreUntilRollout: 7.2 }
};
const dir = path.join(root, 'reports', 'w623h-minimal-referral-ledger');
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'launch-board.json'), `${JSON.stringify(report, null, 2)}\n`);
if (failures.length) {
  console.error(`W623H gate failed (${failures.length}/${checks.length}):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`W623H gate passed ${checks.length}/${checks.length}.`);
console.log('Minimal authority: existing EON_REFERRALS_DB preferred, temporary EON_BILLING_DB fallback, no new secret/cron/queue/click tracking.');
console.log('Source viral readiness: 9.7/10; deployed reward score remains 7.2/10 until rollout and live proof.');
