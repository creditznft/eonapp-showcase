#!/usr/bin/env node
import fs from 'node:fs';
import {
  auditEonAppW714ActiveCommercialCopy,
  buildEonAppW714IdentityCommercialTruth,
  getEonAppW714IdentityCommercialTruth,
  validateEonAppW714IdentityCommercialTruth
} from '../assets/js/runtime/w714/eonapp-w714-identity-commercial-truth.js';

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const activeCopy = {
  billing: read('billing.html'),
  profile: read('assets/js/profile-page.js'),
  eonKeys: read('assets/js/referrals/eon-keys-page.js'),
  privacy: read('privacy.html'),
  terms: read('terms.html')
};
const plan = buildEonAppW714IdentityCommercialTruth({
  identity: { state: 'authenticated' },
  entitlement: { tier_id: 'plus', status: 'active' },
  lifecycle: { access_status: 'active', tier_id: 'plus' },
  referralStatus: { active: true, signedIn: true, account: { balances: {}, grants: [] } },
  activeCopy
});
const truth = getEonAppW714IdentityCommercialTruth();
const profile = activeCopy.profile;
const billing = activeCopy.billing;
const keys = activeCopy.eonKeys;
const privacy = activeCopy.privacy;
const terms = activeCopy.terms;
const checks = [
  ['identity-only-and-local-preserved', plan.identity.signedIn && plan.identity.identityScopesOnly && !plan.identity.identityIsBackup && !plan.identity.localWorkDeletedOnLogout && !plan.identity.localWorkDeletedOnAccountDeletion],
  ['explicit-session-surfaces', /\/api\/auth\/google\/start/.test(profile) && /\/api\/auth\/logout/.test(profile) && /\/api\/account\/delete-request/.test(profile) && /window\.confirm/.test(profile) && /browser-local EONAPP work remains/.test(profile)],
  ['server-authoritative-dodo', plan.billing.provider === 'dodo' && plan.billing.hostedCheckoutOnly && plan.billing.webhookAndServerLedgerAuthority && plan.billing.browserEntitlementClaimRejected && !plan.billing.directEntitlementMutation && /data-checkout-authority="server-only"/.test(billing)],
  ['customer-action-timing', plan.billing.upgradesImmediate && plan.billing.downgradesAtNextBillingDate],
  ['eonkey-feature-only', !plan.referral.moneyLanguageAllowed && !plan.referral.cashValue && !plan.referral.transferable && !plan.referral.subscriptionReplacement && /No subscription reward/.test(keys) && /browser never grants itself keys/.test(keys)],
  ['legal-and-custody-copy', /Google Login is not a backup/.test(privacy) && /Profile deletion action removes only minimal cloud account\/session metadata/.test(terms) && plan.legal.safePublicEvidenceOnly],
  ['no-active-legacy-claims', auditEonAppW714ActiveCommercialCopy(activeCopy).ok],
  ['complete-truth', validateEonAppW714IdentityCommercialTruth(plan).ok && truth.serverEntitlementAuthority && truth.browserEntitlementOverridesRejected && !truth.eonKeysCashValue && !truth.eonKeysReplaceSubscription && !truth.performsNetworkRequest && !truth.performsMutation]
];
for (const [id, pass] of checks) console.log(`[W714] ${pass ? 'PASS' : 'FAIL'} ${id}`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W714] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
