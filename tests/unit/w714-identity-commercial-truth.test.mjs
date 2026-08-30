import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  auditEonAppW714ActiveCommercialCopy,
  buildEonAppW714IdentityCommercialTruth,
  getEonAppW714IdentityCommercialTruth,
  validateEonAppW714IdentityCommercialTruth
} from '../../assets/js/runtime/w714/eonapp-w714-identity-commercial-truth.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const activeCopy = () => ({
  billing: read('billing.html'),
  profile: read('assets/js/profile-page.js'),
  eonKeys: read('assets/js/referrals/eon-keys-page.js'),
  privacy: read('privacy.html'),
  terms: read('terms.html')
});

test('W714 keeps Google identity optional and separate from local work and backup', () => {
  const plan = buildEonAppW714IdentityCommercialTruth({ identity: { state: 'authenticated' }, activeCopy: activeCopy() });
  assert.equal(plan.identity.signedIn, true);
  assert.equal(plan.identity.provider, 'google');
  assert.equal(plan.identity.identityScopesOnly, true);
  assert.equal(plan.identity.identityIsBackup, false);
  assert.equal(plan.identity.automaticCloudSync, false);
  assert.equal(plan.identity.localWorkDeletedOnLogout, false);
  assert.equal(plan.identity.localWorkDeletedOnAccountDeletion, false);
});

test('W714 source surfaces expose explicit sign-in, logout and confirmed minimal account deletion', () => {
  const profile = read('assets/js/profile-page.js');
  const deletion = read('functions/api/account/delete-request.js');
  assert.match(profile, /\/api\/auth\/google\/start/);
  assert.match(profile, /\/api\/auth\/logout/);
  assert.match(profile, /window\.confirm/);
  assert.match(profile, /\/api\/account\/delete-request/);
  assert.match(profile, /browser-local EONAPP work remains/);
  assert.match(deletion, /minimal_cloud_account_metadata_and_active_sessions/);
});

test('W714 keeps Dodo hosted checkout and signed server events as entitlement authority', () => {
  const plan = buildEonAppW714IdentityCommercialTruth({
    entitlement: { tier_id: 'studio', status: 'active' },
    lifecycle: { tier_id: 'studio', access_status: 'active' },
    activeCopy: activeCopy()
  });
  assert.equal(plan.billing.serverAuthoritative, true);
  assert.equal(plan.billing.hostedCheckoutOnly, true);
  assert.equal(plan.billing.webhookAndServerLedgerAuthority, true);
  assert.equal(plan.billing.browserEntitlementClaimRejected, true);
  assert.equal(plan.billing.directEntitlementMutation, false);
  assert.equal(plan.billing.upgradesImmediate, true);
  assert.equal(plan.billing.downgradesAtNextBillingDate, true);
});

test('W714 keeps EONKEYS non-cash, non-transferable and below subscription authority', () => {
  const plan = buildEonAppW714IdentityCommercialTruth({ referralStatus: { active: true, signedIn: true, account: { balances: {}, grants: [] } }, activeCopy: activeCopy() });
  assert.equal(plan.referral.moneyLanguageAllowed, false);
  assert.equal(plan.referral.cashValue, false);
  assert.equal(plan.referral.transferable, false);
  assert.equal(plan.referral.subscriptionReplacement, false);
  assert.equal(plan.referral.clickAloneQualifies, false);
  assert.equal(plan.referral.serverLedgerRequired, true);
});

test('W714 active-copy audit rejects revived wallet, NFT, token and earnings claims', () => {
  assert.equal(auditEonAppW714ActiveCommercialCopy(activeCopy()).ok, true);
  const bad = auditEonAppW714ActiveCommercialCopy({ home: 'Connect wallet to continue and earn money. Pay a gas fee to mint NFT.' });
  assert.equal(bad.ok, false);
  assert.deepEqual(new Set(bad.findings.map((finding) => finding.id)), new Set(['wallet-required', 'gas-fee', 'nft-commerce', 'earn-money']));
});

test('W714 public billing, privacy, terms and referral copy matches the operational boundary', () => {
  assert.match(read('billing.html'), /data-checkout-authority="server-only"/);
  assert.match(read('billing.html'), /signed server webhook updates the entitlement ledger/);
  assert.match(read('privacy.html'), /Google Login is not a backup/);
  assert.match(read('terms.html'), /Profile deletion action removes only minimal cloud account\/session metadata/);
  assert.match(read('assets/js/referrals/eon-keys-page.js'), /No subscription replacement/);
  assert.match(read('assets/js/referrals/eon-keys-page.js'), /browser never grants itself keys/);
});

test('W714 complete plan validates without executing identity, payment or referral work', () => {
  const plan = buildEonAppW714IdentityCommercialTruth({ activeCopy: activeCopy() });
  assert.equal(validateEonAppW714IdentityCommercialTruth(plan).ok, true);
  assert.equal(plan.startsOAuth, false);
  assert.equal(plan.startsCheckout, false);
  assert.equal(plan.sendsCustomerAction, false);
  assert.equal(plan.acceptsWebhook, false);
  assert.equal(plan.mutatesEntitlement, false);
  assert.equal(plan.createsReferralGrant, false);
  assert.equal(plan.deletesAccount, false);
  const truth = getEonAppW714IdentityCommercialTruth();
  assert.equal(truth.performsNetworkRequest, false);
  assert.equal(truth.performsMutation, false);
});
