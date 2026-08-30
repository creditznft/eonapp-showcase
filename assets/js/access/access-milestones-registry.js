/**
 * W235 — disabled EON Access Milestones registry.
 *
 * This module is intentionally a capability vocabulary and a kill switch, not
 * a reward engine. It does not enroll an invite, call a Worker, grant a
 * feature, modify a subscription, store a balance, or read/write a ledger.
 */

export const EON_ACCESS_MILESTONES_SCHEMA = 'eon.access-milestones.v1';
export const EON_ACCESS_MILESTONES_MODE = 'disabled';
export const EON_ACCESS_MILESTONES_ACTIVE = false;
export const EON_ACCESS_MILESTONES_PREFERENCES_KEY = 'eon:access-milestones:preferences:v1';

export const EON_ACCESS_MILESTONE_CANDIDATES = Object.freeze([
  Object.freeze({
    id: 'city_cosmetic',
    label: 'City cosmetic',
    category: 'cosmetic',
    maximumDurationDays: 31,
    transferable: false,
    monetary: false,
    description: 'A time-bounded local visual style such as a banner, badge or landmark skin.'
  }),
  Object.freeze({
    id: 'realm_cosmetic',
    label: 'Realm cosmetic',
    category: 'cosmetic',
    maximumDurationDays: 31,
    transferable: false,
    monetary: false,
    description: 'A time-bounded private Realm visual style with no public marketplace or resale claim.'
  }),
  Object.freeze({
    id: 'workspace_template_trial',
    label: 'Workspace template trial',
    category: 'trial',
    maximumDurationDays: 14,
    transferable: false,
    monetary: false,
    description: 'A temporary local Workspace template or layout trial, not a paid-plan entitlement.'
  }),
  Object.freeze({
    id: 'project_capacity_trial',
    label: 'Project capacity trial',
    category: 'trial',
    maximumDurationDays: 14,
    transferable: false,
    monetary: false,
    description: 'A temporary local project-capacity trial, not unlimited usage or a cloud quota.'
  }),
  Object.freeze({
    id: 'beta_access_trial',
    label: 'Beta access trial',
    category: 'beta',
    maximumDurationDays: 14,
    transferable: false,
    monetary: false,
    description: 'A clearly expiring opt-in beta feature trial with a rollback path.'
  })
]);

export const EON_ACCESS_MILESTONE_PROHIBITED = Object.freeze([
  'cash',
  'cash_equivalent',
  'wallet_balance',
  'payout',
  'coin',
  'crypto',
  'eon_lite',
  'pool_points',
  'transferable_nft',
  'resale_right',
  'investment_return',
  'cloud_ai_credit',
  'subscription_entitlement',
  'permanent_unlimited_access'
]);

function safeJson(value, fallback) {
  try {
    const parsed = JSON.parse(String(value || ''));
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch { return fallback; }
}

function getStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

export function getAccessMilestoneKillSwitch() {
  return Object.freeze({
    schema: EON_ACCESS_MILESTONES_SCHEMA,
    engaged: true,
    mode: EON_ACCESS_MILESTONES_MODE,
    active: EON_ACCESS_MILESTONES_ACTIVE,
    reason: 'Access Milestones are disabled at the source, UI and server boundaries until W236 approval and a separately reviewed activation release.'
  });
}

export function validateAccessMilestoneCandidate(candidate = {}) {
  const errors = [];
  const id = String(candidate.id || '').trim();
  if (!EON_ACCESS_MILESTONE_CANDIDATES.some((row) => row.id === id)) errors.push('unknown-capability');
  if (candidate.transferable === true) errors.push('transferability-forbidden');
  if (candidate.monetary === true) errors.push('monetary-value-forbidden');
  if (EON_ACCESS_MILESTONE_PROHIBITED.includes(String(candidate.kind || '').trim())) errors.push('prohibited-benefit-kind');
  const duration = Number(candidate.durationDays || 0);
  const canonical = EON_ACCESS_MILESTONE_CANDIDATES.find((row) => row.id === id);
  if (duration && (!canonical || duration < 1 || duration > canonical.maximumDurationDays)) errors.push('duration-out-of-bounds');
  return Object.freeze({ ok: errors.length === 0, errors, candidateId: id || null });
}

export function getAccessMilestonePublicStatus() {
  const killSwitch = getAccessMilestoneKillSwitch();
  return Object.freeze({
    schema: EON_ACCESS_MILESTONES_SCHEMA,
    mode: EON_ACCESS_MILESTONES_MODE,
    active: false,
    candidates: EON_ACCESS_MILESTONE_CANDIDATES,
    prohibited: EON_ACCESS_MILESTONE_PROHIBITED,
    killSwitch,
    reason: 'No invite reward, subscription unlock, cloud quota, balance, wallet value, cash, token, Pool Point conversion or transferable item is active.'
  });
}

export function readAccessMilestonePreferences(options = {}) {
  const storage = getStorage(options.storage);
  const fallback = {
    schema: `${EON_ACCESS_MILESTONES_SCHEMA}.preferences`,
    mode: EON_ACCESS_MILESTONES_MODE,
    acknowledged: false,
    updatedAt: null
  };
  if (!storage) return Object.freeze(fallback);
  const parsed = safeJson(storage.getItem(EON_ACCESS_MILESTONES_PREFERENCES_KEY), fallback);
  return Object.freeze({
    ...fallback,
    acknowledged: Boolean(parsed.acknowledged),
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt.slice(0, 40) : null
  });
}

export function saveAccessMilestonePreferences(input = {}, options = {}) {
  const storage = getStorage(options.storage);
  const preferences = Object.freeze({
    schema: `${EON_ACCESS_MILESTONES_SCHEMA}.preferences`,
    mode: EON_ACCESS_MILESTONES_MODE,
    acknowledged: Boolean(input.acknowledged),
    updatedAt: new Date(Number(options.now || Date.now())).toISOString()
  });
  if (!storage) return Object.freeze({ ok: false, reason: 'storage-unavailable', preferences });
  try {
    storage.setItem(EON_ACCESS_MILESTONES_PREFERENCES_KEY, JSON.stringify(preferences));
    return Object.freeze({ ok: true, preferences });
  } catch {
    return Object.freeze({ ok: false, reason: 'storage-write-failed', preferences });
  }
}

/** Always fails closed: W235 creates no capability or entitlement. */
export function requestAccessMilestoneGrant(_request = {}, options = {}) {
  const storage = getStorage(options.storage);
  const before = storage?.getItem?.(EON_ACCESS_MILESTONES_PREFERENCES_KEY) ?? null;
  return Object.freeze({
    ok: false,
    granted: false,
    mode: EON_ACCESS_MILESTONES_MODE,
    reason: 'access-milestones-disabled',
    storageUnchanged: before === (storage?.getItem?.(EON_ACCESS_MILESTONES_PREFERENCES_KEY) ?? null),
    killSwitch: getAccessMilestoneKillSwitch()
  });
}

export default {
  EON_ACCESS_MILESTONES_SCHEMA,
  EON_ACCESS_MILESTONES_MODE,
  EON_ACCESS_MILESTONES_ACTIVE,
  EON_ACCESS_MILESTONES_PREFERENCES_KEY,
  EON_ACCESS_MILESTONE_CANDIDATES,
  EON_ACCESS_MILESTONE_PROHIBITED,
  getAccessMilestoneKillSwitch,
  validateAccessMilestoneCandidate,
  getAccessMilestonePublicStatus,
  readAccessMilestonePreferences,
  saveAccessMilestonePreferences,
  requestAccessMilestoneGrant
};
