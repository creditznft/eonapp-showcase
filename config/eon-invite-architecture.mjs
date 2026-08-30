/**
 * W234 — EON Invite architecture contract.
 *
 * This is a read-only, source-controlled design contract. It declares the
 * minimum future Worker/D1 records required for a verified invite program,
 * but intentionally contains no database client, endpoint, binding, secret,
 * or activation switch. Signed links remain local-only in the current build.
 */

export const EON_INVITE_ARCHITECTURE_SCHEMA = 'eon.invite.architecture.v1';
export const EON_INVITE_PROGRAM_MODE = 'read-only-design';
export const EON_INVITE_PROGRAM_ACTIVE = false;

export const EON_INVITE_EVENT_TYPES = Object.freeze([
  'invite_enrolled',
  'activation_observed',
  'qualification_pending',
  'qualification_eligible',
  'milestone_granted',
  'milestone_reversed',
  'milestone_expired',
  'abuse_blocked',
  'support_case_opened',
  'support_case_resolved'
]);

export const EON_INVITE_SETTLEMENT_STATES = Object.freeze([
  'pending',
  'eligible',
  'granted',
  'reversed',
  'expired',
  'blocked'
]);

export const EON_INVITE_NON_QUALIFYING_SIGNALS = Object.freeze([
  'raw_click',
  'impression',
  'copied_link',
  'generic_share',
  'ad_view',
  'ad_click',
  'self_report',
  'idle_time',
  'unverified_social_post'
]);

export const EON_INVITE_PRIVACY_RULES = Object.freeze([
  'Store only pseudonymous account/identity hashes in a future ledger.',
  'Never store raw signed-link tokens, chat content, Vault content, device fingerprints, wallet data, or model prompts in the invite ledger.',
  'Do not use a referral tree, downline, ranking, commission, cash balance, token balance, or payout amount.',
  'Use one verified account-to-inviter association at most; later links cannot overwrite a settled association without support review.',
  'A program disclosure, support path, expiry and reversal reason are required before a milestone can be granted.'
]);

export const EON_INVITE_MINIMAL_LEDGER = Object.freeze({
  database: 'Cloudflare D1 only after explicit activation approval',
  writes: 'No periodic polling. A write is allowed only for explicit enrollment, verified activation, qualification transition, grant, reversal, expiry, or support case transition.',
  prohibitedFieldNames: Object.freeze(['amount', 'exchange_rate', 'wallet', 'payout', 'coin', 'token', 'pool_points', 'commission', 'resale']),
  tables: Object.freeze([
    Object.freeze({
      name: 'eon_invite_accounts',
      purpose: 'One-way hashed identity association, enrollment state, timestamps and program version.'
    }),
    Object.freeze({
      name: 'eon_invite_events',
      purpose: 'Append-only, idempotent invite/qualification/abuse/support state transitions.'
    }),
    Object.freeze({
      name: 'eon_access_milestone_ledger',
      purpose: 'Non-financial, time-bounded capability state only; no points, amount, exchange rate, wallet, transfer or payout fields.'
    })
  ])
});

export function getEonInviteArchitectureStatus() {
  return Object.freeze({
    schema: EON_INVITE_ARCHITECTURE_SCHEMA,
    mode: EON_INVITE_PROGRAM_MODE,
    active: EON_INVITE_PROGRAM_ACTIVE,
    signedLinks: 'local-only',
    serverWrites: false,
    reason: 'W234 is a read-only architecture audit. No invite enrollment, attribution, qualification, milestone or D1 request is active.'
  });
}

export function validateEonInviteArchitectureContract() {
  const errors = [];
  if (EON_INVITE_PROGRAM_ACTIVE !== false) errors.push('Invite program must be inactive in W234.');
  if (EON_INVITE_PROGRAM_MODE !== 'read-only-design') errors.push('Invite mode must remain read-only-design.');
  const tableNames = EON_INVITE_MINIMAL_LEDGER.tables.map((row) => row.name.toLowerCase());
  if (tableNames.some((name) => /(wallet|token|coin|payout|commission|pool)/.test(name))) errors.push('Invite ledger table names must remain non-financial.');
  if (!Array.isArray(EON_INVITE_MINIMAL_LEDGER.prohibitedFieldNames) || !EON_INVITE_MINIMAL_LEDGER.prohibitedFieldNames.includes('payout')) {
    errors.push('Invite ledger must explicitly block financial field names.');
  }
  if (!EON_INVITE_EVENT_TYPES.includes('milestone_reversed') || !EON_INVITE_EVENT_TYPES.includes('milestone_expired')) {
    errors.push('Invite contract must include reversal and expiry transitions.');
  }
  if (EON_INVITE_NON_QUALIFYING_SIGNALS.includes('verified_account_activation')) {
    errors.push('Qualification signals must not be declared as raw invite signals.');
  }
  return Object.freeze({ ok: errors.length === 0, errors });
}

export default {
  EON_INVITE_ARCHITECTURE_SCHEMA,
  EON_INVITE_PROGRAM_MODE,
  EON_INVITE_PROGRAM_ACTIVE,
  EON_INVITE_EVENT_TYPES,
  EON_INVITE_SETTLEMENT_STATES,
  EON_INVITE_NON_QUALIFYING_SIGNALS,
  EON_INVITE_PRIVACY_RULES,
  EON_INVITE_MINIMAL_LEDGER,
  getEonInviteArchitectureStatus,
  validateEonInviteArchitectureContract
};
