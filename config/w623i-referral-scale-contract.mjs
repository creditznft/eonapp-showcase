/** W623I — dedicated scalable referral authority without click or media tracking. */
export const W623I_REFERRAL_SCALE_SCHEMA = 'eonapp.referrals.w623i-dedicated-scale.v1';

export const W623I_REFERRAL_SCALE_CONTRACT = Object.freeze({
  schema: W623I_REFERRAL_SCALE_SCHEMA,
  preferredBinding: 'EON_REFERRALS_DB',
  existingDatabaseName: 'EONAPP_REFERRALS_DB',
  existingDatabaseId: 'b90e38ad-8eaa-47e1-ba40-2d71b0c06d75',
  billingBinding: 'EON_BILLING_DB',
  billingDatabaseName: 'eonapp-billing',
  identityDatabasesUntouched: true,
  databaseResetAllowed: false,
  newDatabaseRequired: false,
  billingFallback: 'temporary-migration-only',
  separateBillingAndReferralTruth: true,
  crossDatabaseDelivery: 'idempotent-webhook-replay',
  dedicatedBillingMirror: 'minimal-current-paid-state-only',
  migrationFiles: Object.freeze([
    'migrations/referrals/0001_referral_authority.sql',
    'migrations/referrals/0002_referral_operational_views.sql'
  ]),
  tableCount: 8,
  viewCount: 1,
  noClickRegistry: true,
  noImpressionRegistry: true,
  noSocialPostRegistry: true,
  noPromptOrMediaStorage: true,
  noCron: true,
  noQueue: true,
  noR2Required: true,
  optionalRateLimiterBinding: 'EON_REFERRAL_RATE_LIMITER',
  publicMutationRateLimit: Object.freeze({ limit: 30, periodSeconds: 60, key: 'signed-in-account-plus-action' }),
  paidRetentionDays: 14,
  operationalThresholds: Object.freeze({
    reviewAtDatabaseGb: 7,
    shardBeforeDatabaseGb: 8,
    hardPlatformLimitGb: 10,
    shardKey: 'stable-account-hash-prefix',
    archiveLargePayloadsToD1: false
  }),
  finalCodexLiveChecks: Object.freeze([
    'binding-parity-production-and-preview',
    'time-travel-bookmark-before-migration',
    'migration-table-index-view-proof',
    'two-account-referral-proof',
    'duplicate-webhook-repair-proof',
    'refund-dispute-reversal-proof',
    'rollout-kill-switch-proof',
    'rate-limit-proof',
    'd1-query-plan-index-proof',
    'database-size-and-row-metrics-baseline'
  ])
});

export function validateW623iReferralScaleContract(contract = W623I_REFERRAL_SCALE_CONTRACT) {
  const errors = [];
  if (contract.preferredBinding !== 'EON_REFERRALS_DB' || contract.existingDatabaseName !== 'EONAPP_REFERRALS_DB') errors.push('Dedicated existing referral D1 binding drifted.');
  if (contract.newDatabaseRequired || contract.databaseResetAllowed || !contract.identityDatabasesUntouched) errors.push('W623I must not create/reset databases or touch identity databases.');
  if (!contract.separateBillingAndReferralTruth || contract.billingBinding !== 'EON_BILLING_DB') errors.push('Billing and referral authority must remain separated.');
  if (contract.crossDatabaseDelivery !== 'idempotent-webhook-replay') errors.push('Split D1 delivery must repair safely on duplicate webhook replay.');
  if (!contract.noClickRegistry || !contract.noImpressionRegistry || !contract.noSocialPostRegistry || !contract.noPromptOrMediaStorage) errors.push('Privacy boundary drifted.');
  if (contract.noCron !== true || contract.noQueue !== true || contract.noR2Required !== true) errors.push('Minimal event-driven architecture drifted.');
  if (contract.publicMutationRateLimit.limit < 20 || contract.publicMutationRateLimit.periodSeconds !== 60) errors.push('Mutation rate-limit baseline is too weak or unsupported.');
  if (contract.operationalThresholds.shardBeforeDatabaseGb >= contract.operationalThresholds.hardPlatformLimitGb) errors.push('Shard threshold must remain below platform hard limit.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), checks: 18, schema: W623I_REFERRAL_SCALE_SCHEMA });
}
