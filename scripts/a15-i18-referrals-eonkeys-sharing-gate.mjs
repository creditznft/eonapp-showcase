import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_REFERRAL_PAID_YEARLY_CAP,
  EON_REFERRAL_RETENTION_DAYS,
  buildReferralPublicStatus,
  validateReferralServerContract
} from '../assets/js/referrals/eon-referral-server-runtime.js';
import { validateEonKeysCatalog } from '../assets/js/referrals/eon-keys-catalog.js';
import { getEonOutputShareHandoffTruth } from '../assets/js/share/eon-output-share-handoff.js';
import { getEonSharePackTruth } from '../assets/js/share/eon-share-pack.js';
import { getEonShareIntentTruth } from '../assets/js/share/eon-share-intent.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'docs/institutional/a15/evidence/A15_I18_REFERRALS_EONKEYS_SHARING_GATE_RECEIPT.json');
const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');
const errors = [];
const referralContract = validateReferralServerContract();
const keyCatalog = validateEonKeysCatalog();
const publicStatus = buildReferralPublicStatus({ EON_REFERRAL_ROLLOUT: 'production', EON_REFERRALS_DB: { prepare() {} } });
const shareTruths = [getEonOutputShareHandoffTruth(), getEonSharePackTruth(), getEonShareIntentTruth()];

if (!referralContract.ok) errors.push(...referralContract.errors.map((error) => `Referral contract: ${error}`));
if (!keyCatalog.ok) errors.push(...keyCatalog.errors.map((error) => `EONKEY catalogue: ${error}`));
if (EON_REFERRAL_RETENTION_DAYS !== 14 || EON_REFERRAL_PAID_YEARLY_CAP !== 3) errors.push('Paid referral retention or yearly cap drifted.');
if (!publicStatus.referralGrantsActive || !publicStatus.keyRedemptionActive || publicStatus.referralAdViewRewards !== false || publicStatus.ordinaryAdsOutsideReferral !== true || publicStatus.rewardedSponsorKeysOutsideReferral !== true) errors.push('Referral rollout truth is incomplete or incorrectly mixed with ad/reward authority.');
if (shareTruths.some((truth) => truth.directPublishing !== false || truth.referralReward !== false || truth.tracking !== false)) errors.push('A sharing surface can publish, track or create a referral reward.');

const sources = {
  referral: read('assets/js/referrals/eon-referral-server-runtime.js'),
  billing: read('assets/js/billing/eon-dodo-live-runtime.js'),
  catalog: read('assets/js/referrals/eon-keys-catalog.js'),
  capability: read('functions/api/capabilities/status.js'),
  shareSheet: read('assets/js/utils/eon-share-sheet.js'),
  sharePack: read('assets/js/share/eon-share-pack.js'),
  capture: read('assets/js/contracts/creator/eon-creator-capture.js')
};
if (!/retained_paid_referral/.test(sources.referral) || !/EON_REFERRAL_RETENTION_DAYS/.test(sources.referral) || !/selectPaidReferralKeyType/.test(sources.referral)) errors.push('Retained-paid Builder/Power milestone authority is missing.');
if (!/referral_out_of_order_ignored/.test(sources.billing) || !/transition\.applied && transition\.stale !== true/.test(sources.billing)) errors.push('Out-of-order billing events can still affect referral state.');
if (!/status = 'revoked'/.test(sources.referral) || !/source_grant_id = \? AND status = 'active'/.test(sources.referral)) errors.push('Grant or active unlock reversal is not enforced.');
if (!/readAccountActiveEonKeyUnlocks/.test(sources.capability)) errors.push('Capability service does not consume server-authoritative active EONKEY unlocks.');
if (!/directPublishing:\s*false/.test(sources.sharePack) || !/Nothing uploads or posts automatically/.test(sources.shareSheet)) errors.push('Creator distribution truth does not remain manual and reviewed.');
if (/auto.?post|publishTo|oauthToken/i.test(sources.capture)) errors.push('Core Creator Capture contains an automatic publishing path.');

const core = {
  schema: 'eonapp.a15.i18.referrals-eonkeys-sharing-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I18',
  status: errors.length ? 'fail' : 'pass',
  authority: {
    oneLevelReferral: true,
    freeActivationRequiresVerifiedUsefulMilestone: true,
    retainedPaidDays: EON_REFERRAL_RETENTION_DAYS,
    paidGrantSequence: ['builder', 'builder', 'power'],
    paidYearlyCap: EON_REFERRAL_PAID_YEARLY_CAP,
    browserCanGrantOrConsume: false,
    reversalsRevokeGrantAndUnlock: true,
    eonKeysCreateCashOrSubscription: false,
    directPublishing: false,
    automaticPosting: false,
    clickOrShareQualifies: false,
    reconciliationMode: 'signed-in-status-read-no-background-runner'
  },
  sourceFiles: [
    'assets/js/referrals/eon-referral-server-runtime.js',
    'assets/js/referrals/eon-keys-catalog.js',
    'assets/js/billing/eon-dodo-live-runtime.js',
    'functions/api/referrals.js',
    'functions/api/capabilities/status.js',
    'assets/js/share/eon-output-share-handoff.js',
    'assets/js/share/eon-share-pack.js',
    'assets/js/contracts/creator/eon-creator-capture.js'
  ],
  claims: {
    realReferralAccountsExercised: false,
    realDodoRetentionPeriodElapsed: false,
    socialPostCreated: false,
    providerAccountConnected: false,
    previewDeployed: false,
    productionDeployed: false
  },
  errors
};
const receipt = { ...core, digest: createHash('sha256').update(JSON.stringify(core)).digest('hex') };
mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I18] ${receipt.status.toUpperCase()}: retained referrals, EONKEY reversals and reviewed distribution are bounded.`);
if (errors.length) {
  errors.forEach((error) => console.error(`[A15 I18] ${error}`));
  process.exitCode = 1;
}
