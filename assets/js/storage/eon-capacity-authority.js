/**
 * A15 I06 — one fail-closed capacity authority for durable local work.
 *
 * Capacity never evicts an older record. A blocked write returns explicit,
 * non-automatic archive/export/delete/upgrade actions and leaves every existing
 * record intact. Plan-aware limits can be injected later by I09 without
 * creating another store-level capacity authority.
 */

import { getCurrentCapabilitySnapshot } from '../capabilities/eon-capability-service.js';

export const EON_CAPACITY_AUTHORITY_SCHEMA = 'eonapp.capacity-authority.a15.v1';
export const EON_CAPACITY_PREFLIGHT_SCHEMA = 'eonapp.capacity-preflight.a15.v1';

export const EON_CAPACITY_POLICIES = Object.freeze({
  'universal-projects': Object.freeze({ limit: 160, noun: 'active Project', countMode: 'active', surface: 'projects', choices: ['archive', 'export', 'delete', 'upgrade'] }),
  'ordinary-projects': Object.freeze({ limit: 160, noun: 'active project', countMode: 'active', surface: 'projects', choices: ['archive', 'export', 'delete', 'upgrade'] }),
  'ordinary-library': Object.freeze({ limit: 500, noun: 'active Library item', countMode: 'active', surface: 'library', choices: ['archive', 'export', 'delete', 'upgrade'] }),
  'project-tasks': Object.freeze({ limit: 160, noun: 'project task', countMode: 'total', surface: 'projects', choices: ['export', 'delete', 'upgrade'] }),
  'project-artifacts': Object.freeze({ limit: 120, noun: 'project artifact', countMode: 'total', surface: 'projects', choices: ['export', 'delete', 'upgrade'] }),
  'project-automation-links': Object.freeze({ limit: 80, noun: 'automation link', countMode: 'total', surface: 'projects', choices: ['export', 'delete', 'upgrade'] }),
  'forge-projects': Object.freeze({ limit: 24, noun: 'active Forge project', countMode: 'active', surface: 'forge', choices: ['archive', 'export', 'delete', 'upgrade'] }),
  'forge-snapshots': Object.freeze({ limit: 12, noun: 'Forge revision', countMode: 'total', surface: 'forge', choices: ['export', 'delete', 'upgrade'] }),
  'forge-receipts': Object.freeze({ limit: 12, noun: 'Forge receipt', countMode: 'total', surface: 'forge', choices: ['export', 'delete', 'upgrade'] }),
  'creator-jobs': Object.freeze({ limit: 80, noun: 'active Creator job', countMode: 'active', surface: 'create', choices: ['archive', 'export', 'delete', 'upgrade'] }),
  'creator-assets': Object.freeze({ limit: 300, noun: 'Creator asset', countMode: 'total', surface: 'create', choices: ['export', 'delete', 'upgrade'] }),
  'w631-projects': Object.freeze({ limit: 160, noun: 'active Project continuity record', countMode: 'active', surface: 'projects', choices: ['archive', 'export', 'delete', 'upgrade'] }),
  'w631-automations': Object.freeze({ limit: 160, noun: 'automation record', countMode: 'total', surface: 'automations', choices: ['archive', 'export', 'delete', 'upgrade'] }),
  'w631-versions': Object.freeze({ limit: 80, noun: 'project version', countMode: 'total', surface: 'projects', choices: ['export', 'delete', 'upgrade'] }),
  'w631-outcomes': Object.freeze({ limit: 160, noun: 'project outcome', countMode: 'total', surface: 'projects', choices: ['export', 'delete', 'upgrade'] }),
  'w631-history': Object.freeze({ limit: 200, noun: 'automation history record', countMode: 'total', surface: 'automations', choices: ['export', 'delete', 'upgrade'] })
});

const CHOICE_LABELS = Object.freeze({
  archive: 'Archive completed work',
  export: 'Export a portable copy',
  delete: 'Delete selected work',
  upgrade: 'Review plan capacity'
});

const SURFACE_PATHS = Object.freeze({
  projects: '/projects',
  library: '/library',
  forge: '/forge',
  create: '/create',
  automations: '/automations'
});

function clean(value = '', limit = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function nowIso(options = {}) {
  const raw = typeof options.now === 'function' ? options.now() : options.now;
  if (raw == null) return new Date().toISOString();
  const numeric = typeof raw === 'number' ? raw : Date.parse(String(raw));
  return new Date(Number.isFinite(numeric) ? numeric : Date.now()).toISOString();
}

function nonNegativeInteger(value = 0) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function limitCandidate(resourceId = '', options = {}) {
  const direct = Number(options.limitOverrides?.[resourceId]);
  if (Number.isInteger(direct) && direct >= 0) return Object.freeze({ limit: direct, source: 'explicit-override' });
  let snapshot = options.capabilitySnapshot || null;
  if (!snapshot) {
    try { snapshot = getCurrentCapabilitySnapshot(); } catch { snapshot = null; }
  }
  const capability = Number(snapshot?.limits?.[resourceId]);
  if (Number.isInteger(capability) && capability >= 0) {
    const source = snapshot?.serverAuthoritative === true ? 'server-capability-snapshot' : 'free-capability-fallback';
    return Object.freeze({ limit: capability, source });
  }
  const entitlement = Number(options.entitlementLimits?.[resourceId]);
  if (Number.isInteger(entitlement) && entitlement >= 0) return Object.freeze({ limit: entitlement, source: 'legacy-entitlement-snapshot' });
  return null;
}

function buildChoice(policy = {}, resourceId = '', id = '') {
  const basePath = SURFACE_PATHS[policy.surface] || '/workspace';
  const query = new URLSearchParams({ capacity: resourceId, action: id }).toString();
  const href = id === 'upgrade'
    ? `/plans?${new URLSearchParams({ source: 'capacity', resource: resourceId }).toString()}`
    : `${basePath}?${query}`;
  return Object.freeze({
    id,
    label: CHOICE_LABELS[id] || id,
    action: id,
    surface: policy.surface || 'workspace',
    href,
    automatic: false,
    destructive: id === 'delete',
    requiresExplicitUserAction: true
  });
}

export class EonCapacityError extends Error {
  constructor(decision) {
    super(decision?.message || 'Local capacity reached. No existing work was removed.');
    this.name = 'EonCapacityError';
    this.code = 'eon-capacity-blocked';
    this.decision = decision;
  }
}

export function getEonCapacityPolicy(resourceId = '', options = {}) {
  const id = clean(resourceId, 100);
  const base = EON_CAPACITY_POLICIES[id];
  if (!base) return null;
  const override = limitCandidate(id, options);
  const limit = override?.limit ?? base.limit;
  return Object.freeze({ resourceId: id, ...base, limit, limitSource: override?.source || 'institutional-baseline' });
}

export function evaluateEonCapacity(input = {}, options = {}) {
  const policy = getEonCapacityPolicy(input.resourceId, options);
  if (!policy) return Object.freeze({ ok: false, allowed: false, reason: 'unknown-capacity-resource', resourceId: clean(input.resourceId, 100) });

  const fallbackCount = nonNegativeInteger(input.currentCount);
  const totalCount = nonNegativeInteger(input.totalCount ?? fallbackCount);
  const activeCount = nonNegativeInteger(input.activeCount ?? fallbackCount);
  const archivedCount = nonNegativeInteger(input.archivedCount ?? Math.max(0, totalCount - activeCount));
  const countedBefore = policy.countMode === 'active' ? activeCount : totalCount;
  const requestedCount = nonNegativeInteger(input.requestedCount ?? 1);
  const requestedTotalCount = nonNegativeInteger(input.requestedTotalCount ?? 1);
  const existing = input.existing === true;
  const countedAfter = existing ? countedBefore : countedBefore + requestedCount;
  const projectedTotal = existing ? totalCount : totalCount + requestedTotalCount;
  const allowed = existing || countedAfter <= policy.limit;
  const timestamp = nowIso(options);
  const decision = {
    schema: EON_CAPACITY_AUTHORITY_SCHEMA,
    decisionId: `capacity_${policy.resourceId}_${timestamp.replace(/[^0-9]/g, '').slice(0, 17)}_${countedBefore}_${requestedCount}`,
    resourceId: policy.resourceId,
    noun: policy.noun,
    countMode: policy.countMode,
    surface: policy.surface,
    currentCount: countedBefore,
    activeCount,
    archivedCount,
    totalCount,
    requestedCount,
    requestedTotalCount,
    projectedCount: countedAfter,
    projectedTotal,
    limit: policy.limit,
    limitSource: policy.limitSource,
    allowed,
    ok: allowed,
    reason: allowed ? 'within-capacity' : 'capacity-reached',
    choices: allowed ? [] : policy.choices.map((id) => buildChoice(policy, policy.resourceId, id)),
    message: allowed
      ? `${policy.noun} capacity is available.`
      : `${policy.noun} capacity is full (${countedBefore}/${policy.limit}; ${archivedCount} archived, ${totalCount} total). No existing work was removed. Choose an explicit archive, export, delete, or plan-capacity action before trying again.`,
    existingRecordUpdate: existing,
    silentEviction: false,
    automaticDeletion: false,
    explicitUserActionRequired: !allowed,
    evaluatedAt: timestamp
  };
  return Object.freeze(decision);
}

export function assertEonCapacity(input = {}, options = {}) {
  const decision = evaluateEonCapacity(input, options);
  if (!decision.allowed) throw new EonCapacityError(decision);
  return decision;
}

export async function inspectOriginStorageCapacity(options = {}) {
  const storageManager = options.storageManager || globalThis.navigator?.storage;
  if (!storageManager?.estimate) {return Object.freeze({
    schema: EON_CAPACITY_AUTHORITY_SCHEMA,
    available: false,
    reason: 'storage-estimate-unavailable',
    writeAuthorized: false
  });}
  try {
    const estimate = await storageManager.estimate();
    const usage = Math.max(0, Number(estimate?.usage) || 0);
    const quota = Math.max(0, Number(estimate?.quota) || 0);
    const reserveBytes = Math.max(5 * 1024 * 1024, Math.floor(quota * 0.1));
    const remainingBytes = Math.max(0, quota - usage);
    return Object.freeze({
      schema: EON_CAPACITY_AUTHORITY_SCHEMA,
      available: quota > 0,
      usageBytes: usage,
      quotaBytes: quota,
      remainingBytes,
      reserveBytes,
      belowSafetyReserve: quota > 0 && remainingBytes < reserveBytes,
      writeAuthorized: quota > 0 && remainingBytes >= reserveBytes,
      evaluatedAt: nowIso(options)
    });
  } catch (error) {
    return Object.freeze({ schema: EON_CAPACITY_AUTHORITY_SCHEMA, available: false, reason: 'storage-estimate-failed', message: clean(error?.message, 220), writeAuthorized: false });
  }
}

export async function preflightEonCapacity(input = {}, options = {}) {
  const decision = evaluateEonCapacity(input, options);
  const origin = await inspectOriginStorageCapacity(options);
  const storageRequired = options.requireStorageEstimate === true;
  const storageAllowed = origin.available ? origin.writeAuthorized : !storageRequired;
  const allowed = decision.allowed === true && storageAllowed;
  return Object.freeze({
    schema: EON_CAPACITY_PREFLIGHT_SCHEMA,
    allowed,
    reason: !decision.allowed ? decision.reason : !storageAllowed ? (origin.available ? 'origin-storage-reserve-low' : 'origin-storage-estimate-required') : 'capacity-preflight-passed',
    decision,
    origin,
    silentEviction: false,
    automaticDeletion: false,
    evaluatedAt: nowIso(options)
  });
}

export function getEonCapacityAuthorityTruth(options = {}) {
  return Object.freeze({
    schema: EON_CAPACITY_AUTHORITY_SCHEMA,
    resources: Object.keys(EON_CAPACITY_POLICIES),
    policyCount: Object.keys(EON_CAPACITY_POLICIES).length,
    policies: Object.freeze(Object.fromEntries(Object.keys(EON_CAPACITY_POLICIES).map((id) => [id, getEonCapacityPolicy(id, options)]))),
    silentEvictionAllowed: false,
    automaticDeletionAllowed: false,
    blockedWriteChoices: ['archive', 'export', 'delete', 'upgrade'],
    storageSafetyReserveRequired: true,
    capabilityLimitInjectionSupported: true
  });
}
