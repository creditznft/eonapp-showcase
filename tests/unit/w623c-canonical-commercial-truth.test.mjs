import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CREATOR_EXECUTION_BOUNDARY,
  EON_KEYS_REFERRAL_POLICY,
  EON_PAID_SUBSCRIPTION_PLANS,
  EON_PURCHASABLE_PLANS,
  EON_SUBSCRIPTION_TRIAL_DAYS,
  validateEonCommercialCatalog
} from '../../assets/js/commerce/eon-commercial-catalog.js';
import { buildBillingStatusPayload } from '../../assets/js/billing/eon-dodo-live-runtime.js';
import { createSession } from '../../functions/_shared/eon-auth.js';
import { onRequestGet as getBillingStatus } from '../../functions/api/billing/status.js';
import { EON_KEY_UNLOCK_MENU, EON_REFERRAL_REWARD_MATRIX, validateEonKeysCatalog } from '../../assets/js/referrals/eon-keys-catalog.js';
import { resolveLockedFeature, validateLockedFeatureResolver } from '../../assets/js/referrals/eon-feature-unlock-resolver.js';
import { inspectW623cCanonicalCommercialTruth } from '../../scripts/w623c-canonical-commercial-truth-gate.mjs';

const configuredEnv = Object.freeze({
  EON_BILLING_ROLLOUT: 'production',
  EON_BILLING_DB: { prepare() {} },
  DODO_PAYMENTS_API_KEY: 'unit-test-key',
  DODO_WEBHOOK_SECRET: 'unit-test-secret',
  EON_ENTITLEMENT_SIGNING_KEY: 'unit-test-signing-key',
  DODO_PRODUCT_PLUS: 'plus-product',
  DODO_PRODUCT_STUDIO: 'studio-product',
  DODO_PRODUCT_POWER: 'power-product',
  DODO_PRODUCT_MAX: 'max-product',
  DODO_PRODUCT_PRO: 'pro-product',
  DODO_PRODUCT_ULTRA: 'ultra-product',
  DODO_PRODUCT_ULTIMATE: 'ultimate-product',
  EON_PREMIUM_CHECKOUT_ROLLOUT: 'production'
});


function memoryIdentityDb() {
  const sessions = new Map();
  return {
    prepare(sql = '') {
      const statement = String(sql);
      return {
        bind(...args) {
          return {
            async run() {
              if (statement.includes('INSERT INTO eon_identity_sessions')) sessions.set(String(args[0]), { session_id_hmac: String(args[0]), account_id: String(args[1]), expires_at: Number(args[3]) });
              if (statement.includes('DELETE FROM eon_identity_sessions WHERE session_id_hmac')) sessions.delete(String(args[0]));
              return { success: true };
            },
            async first() {
              if (statement.includes('FROM eon_schema_authority')) return { domain: 'identity', schema_version: 6, migration_name: '0006_notification_policy_authority.sql', applied_at: 1 };
              if (statement.includes('SELECT session_id_hmac')) return sessions.get(String(args[0])) || null;
              return null;
            }
          };
        }
      };
    }
  };
}

function billingStatusIdentityEnv(database) {
  return {
    ...configuredEnv,
    APP_ORIGIN: 'https://eonapp.ch',
    EON_AUTH_ROLLOUT: 'testing',
    GOOGLE_REDIRECT_URI: 'https://eonapp.ch/api/auth/google/callback',
    GOOGLE_OAUTH_CLIENT_ID: 'test-client.apps.googleusercontent.com',
    GOOGLE_OAUTH_CLIENT_SECRET: 'test-client-secret',
    EON_AUTH_SUBJECT_PEPPER: 'test-subject-pepper',
    EON_SESSION_SIGNING_KEY: 'test-session-key',
    EON_OAUTH_FLOW_SIGNING_KEY: 'test-flow-key',
    EON_IDENTITY_DB: database,
    EON_BILLING_DB: { prepare() { throw new Error('billing-schema-unavailable'); } }
  };
}

test('W623C freezes six recurring prices plus Ultimate one-time and one recurring trial rule', () => {
  assert.equal(validateEonCommercialCatalog().ok, true);
  assert.equal(EON_SUBSCRIPTION_TRIAL_DAYS, 7);
  assert.deepEqual(Object.fromEntries(EON_PAID_SUBSCRIPTION_PLANS.map((plan) => [plan.id, plan.monthlyUsd])), {
    plus: 4.99,
    studio: 14.99,
    power: 29.99,
    max: 49.99,
    pro: 99,
    ultra: 199
  });
  assert.equal(EON_PAID_SUBSCRIPTION_PLANS.every((plan) => plan.trialDays === 7 && plan.billingType === 'subscription'), true);
  const ultimate = EON_PURCHASABLE_PLANS.find((plan) => plan.id === 'ultimate');
  assert.equal(ultimate.oneTimeUsd, 1299);
  assert.equal(ultimate.billingType, 'one-time');
  assert.equal(ultimate.trialDays, 0);
});

test('W623C makes EONKEYS individual feature unlocks, never subscription rewards', () => {
  assert.equal(validateEonKeysCatalog().ok, true);
  assert.equal(EON_KEYS_REFERRAL_POLICY.subscriptionDiscounts, false);
  assert.equal(EON_KEYS_REFERRAL_POLICY.subscriptionRenewalCredits, false);
  assert.equal(EON_KEYS_REFERRAL_POLICY.freeSubscriptionTiers, false);
  assert.equal(EON_KEYS_REFERRAL_POLICY.wholeTierEntitlements, false);
  assert.equal(EON_KEY_UNLOCK_MENU.some((unlock) => unlock.category === 'feature-pass'), false);
  const rewards = EON_REFERRAL_REWARD_MATRIX.flatMap((row) => row.inviterReward || []).join(' ');
  assert.doesNotMatch(rewards, /subscription discount|renewal credit|free month|free subscription|whole tier/i);
});

test('W623C keeps image/video execution local or user-owned BYOK with no EONAPP generation backend', () => {
  assert.equal(EON_CREATOR_EXECUTION_BOUNDARY.cloudflareGenerationBackend, false);
  assert.equal(EON_CREATOR_EXECUTION_BOUNDARY.platformHostedImageOrVideoGeneration, false);
  assert.equal(EON_CREATOR_EXECUTION_BOUNDARY.promptProxyThroughEonapp, false);
  assert.equal(EON_CREATOR_EXECUTION_BOUNDARY.providerKeyStorageOnEonappServers, false);
  assert.equal(EON_CREATOR_EXECUTION_BOUNDARY.localRuntimeAllowed, true);
  assert.equal(EON_CREATOR_EXECUTION_BOUNDARY.userOwnedProviderKeyAllowed, true);
});

test('W623C billing status publishes the canonical public plan catalogue without secrets', () => {
  const status = buildBillingStatusPayload(configuredEnv, 'account-1', { tier_id: 'studio', status: 'active' });
  assert.equal(status.checkoutActive, true);
  assert.equal(status.trialDays, 7);
  assert.deepEqual(status.plans.map(({ id, monthlyUsd, trialDays }) => ({ id, monthlyUsd, trialDays })), [
    { id: 'plus', monthlyUsd: 4.99, trialDays: 7 },
    { id: 'studio', monthlyUsd: 14.99, trialDays: 7 },
    { id: 'power', monthlyUsd: 29.99, trialDays: 7 },
    { id: 'max', monthlyUsd: 49.99, trialDays: 7 },
    { id: 'pro', monthlyUsd: 99, trialDays: 7 },
    { id: 'ultra', monthlyUsd: 199, trialDays: 7 }
  ]);
  assert.equal(status.referralPolicy.subscriptionDiscounts, false);
  assert.equal(JSON.stringify(status).includes(configuredEnv.DODO_PAYMENTS_API_KEY), false);
  assert.equal(JSON.stringify(status).includes(configuredEnv.DODO_WEBHOOK_SECRET), false);
});

test('W623C locked features offer live billing choices while key redemption remains independently proof-gated', () => {
  assert.equal(validateLockedFeatureResolver().ok, true);
  const resolution = resolveLockedFeature('advanced-local-ai-bundles', {
    checkoutActive: true,
    referralGrantsActive: false,
    keyRedemptionActive: false,
    keyInventory: { builder: 1, power: 1 }
  });
  assert.equal(resolution.actions.subscribe.every((action) => action.enabled && action.href.startsWith('/billing?plan=')), true);
  assert.equal(resolution.actions.trial[0].enabled, true);
  assert.equal(resolution.actions.trial[0].label.includes('7-day'), true);
  assert.equal(resolution.actions.useKey.some((action) => action.inventory > 0), true);
  assert.equal(resolution.actions.useKey.every((action) => action.enabled === false), true);
  const pro = resolveLockedFeature('pro-project-orchestration', { checkoutActive: true, keyRedemptionActive: true, keyInventory: { signal: 9, builder: 9, power: 9, sponsor: 9 } });
  assert.equal(pro.actions.subscribe.some((action) => action.tierId === 'pro' && action.enabled), true);
  assert.equal(pro.actions.trial[0].label.includes('7-day'), true);
  assert.equal(pro.actions.useKey.length, 0);
  assert.equal(pro.actions.refer, null);
});

test('W623C customer-facing commercial truth gate passes', () => {
  const report = inspectW623cCanonicalCommercialTruth();
  assert.equal(report.ok, true, report.errors.join('\n'));
});


test('W623C signed-in billing status fails closed without leaking account authority when billing D1 is unavailable', async () => {
  const identityDatabase = memoryIdentityDb();
  const env = billingStatusIdentityEnv(identityDatabase);
  const session = await createSession({ database: identityDatabase, sessionKey: env.EON_SESSION_SIGNING_KEY }, 'account_private_billing_test');
  const response = await getBillingStatus({
    request: new Request('https://eonapp.ch/api/billing/status', { headers: { cookie: `__Host-eon_session=${session.sessionId}` } }),
    env
  });
  const payload = await response.json();
  const serialized = JSON.stringify(payload);

  assert.equal(response.status, 503);
  assert.match(response.headers.get('cache-control') || '', /no-store/);
  assert.match(response.headers.get('vary') || '', /cookie/i);
  assert.equal(payload.schema, 'eonapp.billing.dodo-lifecycle.w628.v1');
  assert.equal(payload.ok, false);
  assert.equal(payload.statusState, 'unavailable');
  assert.equal(payload.referenceCode, 'billing-ledger-read-failed');
  assert.equal(payload.account.signedIn, true);
  assert.equal(payload.checkoutActive, false);
  assert.equal(payload.trialActive, false);
  assert.equal(payload.customerPortalActive, false);
  assert.equal(payload.subscriptionActionsActive, false);
  assert.equal(payload.entitlementLedgerWriteEnabled, false);
  assert.equal(payload.lifecycleLedgerWriteEnabled, false);
  assert.doesNotMatch(serialized, /account_private_billing_test|test-client-secret|test-session-key|unit-test-key|unit-test-secret/);
});
