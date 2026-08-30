/**
 * W714 identity, billing, referral and operational truth authority.
 *
 * Pure projection only: no OAuth, checkout, customer action, webhook, account
 * deletion, referral grant, entitlement mutation or network request is started.
 */
import { evaluateAccountVaultSeparation, validateW632AccountVaultContract } from '../../account/eon-account-vault-custody.js';
import { buildBillingPublicState, getW628BillingTruth } from '../../billing/eon-billing-lifecycle.js';
import { getDodoCustomerActionTruth } from '../../billing/eon-dodo-customer-actions.js';
import { rejectBrowserEntitlementClaim } from '../../billing/eon-browser-entitlement-boundary.js';
import { buildReferralUxModel, validateW629ProgramContract } from '../../referrals/eon-referral-program-w629.js';
import { validateEonKeysCatalog } from '../../referrals/eon-keys-catalog.js';

export const EONAPP_W714_IDENTITY_COMMERCIAL_TRUTH_SCHEMA = 'eonapp.identity-commercial-truth.w714.v1';

const freeze = Object.freeze;
const IDENTITY_STATES = freeze(['guest', 'authenticated', 'expired']);
const ACTIVE_LEGACY_PATTERNS = freeze([
  freeze({ id: 'wallet-required', pattern: /\b(?:connect|link)\s+(?:a\s+)?(?:crypto\s+)?wallet\s+(?:to|required|before)\b/i }),
  freeze({ id: 'token-staking', pattern: /\btoken\s+staking\b/i }),
  freeze({ id: 'gas-fee', pattern: /\bgas\s+fee\b/i }),
  freeze({ id: 'nft-commerce', pattern: /\b(?:buy|sell|trade|mint)\b[^.\n]{0,48}\bNFTs?\b/i }),
  freeze({ id: 'cash-out', pattern: /\bcash\s*out\b/i }),
  freeze({ id: 'earn-money', pattern: /\b(?:earn|guaranteed)\b[^.\n]{0,36}\b(?:money|income|commission|profit|earnings)\b/i }),
  freeze({ id: 'browser-entitlement', pattern: /\b(?:localStorage|query\s*parameter|browser\s+callback)\b[^.\n]{0,48}\b(?:grant|activate|unlock)\b/i })
]);

function cleanText(value = '', max = 240) {
  return String(value ?? '').replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeIdentity(value = {}) {
  const state = IDENTITY_STATES.includes(value.state) ? value.state : value.signedIn === true ? 'authenticated' : 'guest';
  return freeze({
    state,
    signedIn: state === 'authenticated',
    provider: state === 'authenticated' ? 'google' : '',
    identityScopesOnly: true,
    identityIsBackup: false,
    automaticCloudSync: false,
    logoutRequiresExplicitAction: true,
    accountDeletionRequiresConfirmation: true,
    localWorkDeletedOnLogout: false,
    localWorkDeletedOnAccountDeletion: false,
    googleServiceAccessGranted: false
  });
}

export function auditEonAppW714ActiveCommercialCopy(sources = {}) {
  const findings = [];
  for (const [surface, source] of Object.entries(sources || {})) {
    const text = cleanText(source, 100000);
    for (const rule of ACTIVE_LEGACY_PATTERNS) {
      if (rule.pattern.test(text)) findings.push(freeze({ surface: cleanText(surface, 80), id: rule.id }));
    }
  }
  return freeze({
    schema: `${EONAPP_W714_IDENTITY_COMMERCIAL_TRUTH_SCHEMA}.copy-audit.v1`,
    ok: findings.length === 0,
    findings: freeze(findings),
    activeLegacyClaimCount: findings.length
  });
}

export function buildEonAppW714IdentityCommercialTruth({ identity = {}, entitlement = null, lifecycle = null, referralStatus = {}, activeCopy = {} } = {}) {
  const accountSeparation = evaluateAccountVaultSeparation();
  const identityState = normalizeIdentity(identity);
  const billingState = buildBillingPublicState(entitlement, lifecycle);
  const billingTruth = getW628BillingTruth();
  const customerActions = getDodoCustomerActionTruth();
  const rejectedBrowserClaim = rejectBrowserEntitlementClaim({ claimedTier: 'max', source: 'browser' });
  const referral = buildReferralUxModel(referralStatus);
  const copyAudit = auditEonAppW714ActiveCommercialCopy(activeCopy);
  return freeze({
    schema: EONAPP_W714_IDENTITY_COMMERCIAL_TRUTH_SCHEMA,
    identity: identityState,
    accountSeparation,
    billing: freeze({
      ...billingState,
      provider: 'dodo',
      hostedCheckoutOnly: billingTruth.hostedCheckoutOnly,
      webhookAndServerLedgerAuthority: billingTruth.webhookAndServerLedgerAuthority,
      portalRequiresSignedInOwner: billingTruth.portalAndActionsRequireSignedInOwner,
      upgradesImmediate: customerActions.upgradesImmediate,
      downgradesAtNextBillingDate: customerActions.downgradesAtNextBillingDate,
      browserEntitlementClaimRejected: rejectedBrowserClaim.rejected === true,
      directEntitlementMutation: false
    }),
    referral: freeze({
      ...referral,
      serverLedgerRequired: true,
      cashValue: false,
      transferable: false,
      subscriptionReplacement: false,
      clickAloneQualifies: false
    }),
    legal: freeze({
      routes: freeze(['/support', '/privacy', '/terms', '/legal']),
      copyAudit,
      safePublicEvidenceOnly: true,
      manualReviewForExceptions: true
    }),
    sourceContracts: freeze({
      accountVault: validateW632AccountVaultContract(),
      referral: validateW629ProgramContract(),
      eonKeys: validateEonKeysCatalog()
    }),
    startsOAuth: false,
    startsCheckout: false,
    sendsCustomerAction: false,
    acceptsWebhook: false,
    mutatesEntitlement: false,
    createsReferralGrant: false,
    deletesAccount: false
  });
}

export function validateEonAppW714IdentityCommercialTruth(plan = {}) {
  const errors = [];
  if (plan.schema !== EONAPP_W714_IDENTITY_COMMERCIAL_TRUTH_SCHEMA) errors.push('schema');
  if (plan.identity?.identityIsBackup || plan.identity?.automaticCloudSync || plan.identity?.localWorkDeletedOnLogout || plan.identity?.localWorkDeletedOnAccountDeletion) errors.push('identity-boundary');
  if (!plan.billing?.serverAuthoritative || !plan.billing?.hostedCheckoutOnly || !plan.billing?.webhookAndServerLedgerAuthority || !plan.billing?.browserEntitlementClaimRejected || plan.billing?.directEntitlementMutation) errors.push('billing-boundary');
  if (plan.referral?.moneyLanguageAllowed || plan.referral?.cashValue || plan.referral?.transferable || plan.referral?.subscriptionReplacement || plan.referral?.clickAloneQualifies) errors.push('referral-boundary');
  if (!plan.legal?.copyAudit?.ok) errors.push('active-copy');
  if (!plan.sourceContracts?.accountVault?.ok || !plan.sourceContracts?.referral?.ok || !plan.sourceContracts?.eonKeys?.ok) errors.push('source-contract');
  if (plan.startsOAuth || plan.startsCheckout || plan.sendsCustomerAction || plan.acceptsWebhook || plan.mutatesEntitlement || plan.createsReferralGrant || plan.deletesAccount) errors.push('side-effect-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export function getEonAppW714IdentityCommercialTruth() {
  return freeze({
    schema: `${EONAPP_W714_IDENTITY_COMMERCIAL_TRUTH_SCHEMA}.truth.v1`,
    googleIdentityOnly: true,
    signInIsBackup: false,
    logoutPreservesLocalWork: true,
    accountDeletionPreservesLocalWork: true,
    dodoHostedCheckoutOnly: true,
    serverEntitlementAuthority: true,
    signedWebhookReconciliationRequired: true,
    browserEntitlementOverridesRejected: true,
    eonKeysCashValue: false,
    eonKeysReplaceSubscription: false,
    legacyWalletTokenNftEarningsClaimsActive: false,
    supportPrivacyTermsRoutesRequired: true,
    performsNetworkRequest: false,
    performsMutation: false
  });
}
