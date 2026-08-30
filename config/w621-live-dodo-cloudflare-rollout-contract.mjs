import { EON_PAID_SUBSCRIPTION_PLANS, EON_PURCHASABLE_PLANS, EON_SUBSCRIPTION_TRIAL_DAYS } from '../assets/js/commerce/eon-commercial-catalog.js';

export const W621_LIVE_DODO_ROLLOUT_SCHEMA = 'eonapp.rollout.live-dodo-cloudflare.w621.v1';

const W621_PRODUCT_IDS = Object.freeze({
  plus: 'pdt_0Nis1ygG50cHTUTsp7Gwa',
  studio: 'pdt_0Nis7CRUoZ9B0QfEzQ1w3',
  power: 'pdt_0Nis7RsQydyq2vm7Yn5i0',
  max: 'pdt_0Nis7lrISs3fLPlO5t39E',
  pro: 'pdt_0NlZKlIoQ2A6bSFNbBwMk',
  ultra: 'pdt_0NlZLXhMLMnLeFkxNZMSw',
  ultimate: 'pdt_0NlZMVaq84ItJEM2lPSrZ'
});

export const W621_DODO_PRODUCTS = Object.freeze(Object.fromEntries(EON_PURCHASABLE_PLANS.map((plan) => [
  plan.id,
  Object.freeze({
    env: `DODO_PRODUCT_${plan.id.toUpperCase()}`,
    productId: W621_PRODUCT_IDS[plan.id],
    priceUsd: plan.billingType === 'subscription' ? plan.monthlyUsd : plan.oneTimeUsd,
    billingType: plan.billingType,
    interval: plan.interval,
    trialDays: plan.trialDays
  })
])));

export const W621_CLOUDFLARE_RUNTIME = Object.freeze({
  project: 'eonapp-ch',
  productionDomain: 'https://eonapp.ch',
  d1DatabaseName: 'eonapp-billing',
  d1Binding: 'EON_BILLING_DB',
  rollout: 'production',
  secrets: Object.freeze(['DODO_PAYMENTS_API_KEY', 'DODO_WEBHOOK_SECRET', 'EON_ENTITLEMENT_SIGNING_KEY']),
  plainEnv: Object.freeze(['DODO_PRODUCT_PLUS', 'DODO_PRODUCT_STUDIO', 'DODO_PRODUCT_POWER', 'DODO_PRODUCT_MAX', 'DODO_PRODUCT_PRO', 'DODO_PRODUCT_ULTRA', 'DODO_PRODUCT_ULTIMATE', 'EON_BILLING_ROLLOUT', 'EON_PREMIUM_CHECKOUT_ROLLOUT'])
});

export const W621_DODO_WEBHOOK_EVENTS = Object.freeze([
  'payment.succeeded',
  'payment.failed',
  'payment.processing',
  'payment.cancelled',
  'refund.succeeded',
  'refund.failed',
  'subscription.active',
  'subscription.updated',
  'subscription.on_hold',
  'subscription.renewed',
  'subscription.plan_changed',
  'subscription.cancelled',
  'subscription.failed',
  'subscription.expired',
  'dispute.opened',
  'dispute.lost',
  'dispute.won',
  'dispute.expired',
  'dispute.accepted',
  'entitlement_grant.created',
  'entitlement_grant.delivered',
  'entitlement_grant.failed',
  'entitlement_grant.revoked'
]);

export function buildW621LiveRolloutChecklist() {
  return Object.freeze({
    schema: W621_LIVE_DODO_ROLLOUT_SCHEMA,
    cloudflare: W621_CLOUDFLARE_RUNTIME,
    dodoProducts: W621_DODO_PRODUCTS,
    webhookEvents: W621_DODO_WEBHOOK_EVENTS,
    codexMustProve: Object.freeze([
      'W620 source merged with W621 live billing patch',
      'Cloudflare production deployment succeeds',
      'D1 schema initialization succeeds for eon_billing_events and eon_entitlements',
      'Billing status route returns configured live status and no secret values',
      'Dodo checkout URL returned for all seven paid products',
      `Six recurring checkouts include the ${EON_SUBSCRIPTION_TRIAL_DAYS}-day trial and account/tier metadata`,
      'Ultimate checkout is one-time with no recurring trial and grants perpetual eligible software capability only after signed provider success',
      'Unsigned webhook is rejected',
      'Signed Dodo webhook test returns 2xx and writes idempotent billing event',
      'subscription.plan_changed updates entitlement tier',
      'refund/cancel/expired/dispute revokes or downgrades entitlement',
      'Referral/EON Key unlocks remain server-ledger only with no cash/subscription rewards',
      'W618F EON City browser/mobile proof passes on production or preview'
    ])
  });
}

export function validateW621LiveDodoRolloutContract() {
  const errors = [];
  const productIds = Object.values(W621_DODO_PRODUCTS).map((product) => product.productId);
  if (new Set(productIds).size !== 7) errors.push('Expected seven unique Dodo product ids.');
  if (W621_DODO_PRODUCTS.plus.priceUsd > 5) errors.push('Plus must stay near the $5 entry plan.');
  if (W621_DODO_PRODUCTS.max.priceUsd !== 49.99) errors.push('Max must match the final $49.99 monthly catalogue.');
  for (const plan of EON_PAID_SUBSCRIPTION_PLANS) {
    const product = W621_DODO_PRODUCTS[plan.id];
    if (product?.priceUsd !== plan.monthlyUsd) errors.push(`Dodo ${plan.id} price drifted from canonical catalogue.`);
    if (product?.billingType !== 'subscription' || product?.trialDays !== EON_SUBSCRIPTION_TRIAL_DAYS) errors.push(`Recurring Dodo tier ${plan.id} must keep the canonical seven-day trial.`);
  }
  const ultimate = W621_DODO_PRODUCTS.ultimate;
  if (ultimate?.priceUsd !== 1299 || ultimate?.billingType !== 'one-time' || ultimate?.trialDays !== 0) errors.push('Ultimate must remain a $1,299 one-time product with no recurring trial.');
  if (W621_CLOUDFLARE_RUNTIME.rollout !== 'production') errors.push('Cloudflare rollout should be production for this owner-approved live setup.');
  for (const secret of W621_CLOUDFLARE_RUNTIME.secrets) if (!/^DODO_|^EON_ENTITLEMENT_/.test(secret)) errors.push(`Unexpected secret name: ${secret}`);
  for (const event of ['subscription.active', 'subscription.plan_changed', 'refund.succeeded', 'dispute.lost', 'dispute.expired']) {
    if (!W621_DODO_WEBHOOK_EVENTS.includes(event)) errors.push(`Missing event: ${event}`);
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: W621_LIVE_DODO_ROLLOUT_SCHEMA });
}

export default Object.freeze({ W621_DODO_PRODUCTS, W621_CLOUDFLARE_RUNTIME, W621_DODO_WEBHOOK_EVENTS, buildW621LiveRolloutChecklist, validateW621LiveDodoRolloutContract });
