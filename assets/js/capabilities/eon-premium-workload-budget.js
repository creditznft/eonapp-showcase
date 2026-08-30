/**
 * RT92 premium workload-budget foundation.
 *
 * Software access and expensive capacity are separate. This module does not
 * execute work; it only fails closed unless a workload has an explicit cost
 * authority. A future Ultimate perpetual licence can unlock software while a
 * platform-hosted workload still requires verified subscription/metered budget.
 */
export const EON_PREMIUM_WORKLOAD_BUDGET_SCHEMA = 'eonapp.premium-workload-budget.rt92.v1';
export const EON_PREMIUM_CAPACITY_AUTHORITIES = Object.freeze(['subscription', 'local-device', 'byok', 'metered']);
const AUTHORITY_SET = new Set(EON_PREMIUM_CAPACITY_AUTHORITIES);
const freeze = (value) => Object.freeze(value);

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

export function evaluateEonPremiumWorkloadAdmission(input = {}) {
  const softwareAccess = input.softwareAccess === true;
  const workloadClass = String(input.workloadClass || 'platform-hosted').trim().toLowerCase();
  const capacityAuthority = String(input.capacityAuthority || '').trim().toLowerCase();
  const currentUsage = number(input.currentUsage);
  const requestedUnits = Math.max(1, number(input.requestedUnits, 1));
  const limit = Number(input.limit);
  const finiteLimit = Number.isFinite(limit) && limit >= 0;
  const serverVerifiedCapacity = input.serverVerifiedCapacity === true;

  let allowed = false;
  let reason = 'software-capability-required';

  if (!softwareAccess) {
    allowed = false;
  } else if (!AUTHORITY_SET.has(capacityAuthority)) {
    reason = 'capacity-authority-required';
  } else if (workloadClass === 'platform-hosted') {
    if (!['subscription', 'metered'].includes(capacityAuthority)) reason = 'platform-hosted-capacity-must-be-server-funded-authority';
    else if (!serverVerifiedCapacity) reason = 'server-verified-capacity-required';
    else if (!finiteLimit) reason = 'finite-platform-hosted-budget-required';
    else if (currentUsage + requestedUnits > limit) reason = 'capacity-limit-reached';
    else { allowed = true; reason = 'verified-platform-hosted-budget'; }
  } else if (workloadClass === 'byok') {
    if (capacityAuthority !== 'byok') reason = 'byok-authority-required';
    else { allowed = true; reason = 'user-provider-capacity'; }
  } else if (workloadClass === 'local') {
    if (capacityAuthority !== 'local-device') reason = 'local-device-authority-required';
    else { allowed = true; reason = 'user-device-capacity'; }
  } else {
    reason = 'unknown-workload-class';
  }

  return freeze({
    schema: EON_PREMIUM_WORKLOAD_BUDGET_SCHEMA,
    allowed,
    reason,
    softwareAccess,
    workloadClass,
    capacityAuthority,
    currentUsage,
    requestedUnits,
    limit: finiteLimit ? limit : null,
    remainingAfterAdmission: allowed && finiteLimit ? Math.max(0, limit - currentUsage - requestedUnits) : null,
    serverVerifiedCapacity,
    ultimateAloneProvidesHostedCapacity: false,
    networkRequestCreated: false,
    executionStarted: false,
    browserPaidGrantCreated: false
  });
}

export function evaluateEonConcurrencyAdmission(input = {}) {
  return evaluateEonPremiumWorkloadAdmission({
    ...input,
    workloadClass: input.workloadClass || 'platform-hosted',
    currentUsage: input.activeJobs,
    requestedUnits: input.requestedJobs || 1,
    limit: input.concurrencyLimit
  });
}

export function validateEonPremiumWorkloadBudget() {
  const errors = [];
  const ultimateHosted = evaluateEonPremiumWorkloadAdmission({ softwareAccess: true, workloadClass: 'platform-hosted', capacityAuthority: '', currentUsage: 0, requestedUnits: 1 });
  if (ultimateHosted.allowed || ultimateHosted.reason !== 'capacity-authority-required') errors.push('Software capability alone must not authorize hosted work.');
  const hosted = evaluateEonPremiumWorkloadAdmission({ softwareAccess: true, workloadClass: 'platform-hosted', capacityAuthority: 'subscription', serverVerifiedCapacity: true, currentUsage: 2, requestedUnits: 1, limit: 3 });
  if (!hosted.allowed || hosted.remainingAfterAdmission !== 0) errors.push('Verified finite subscription capacity should admit work within budget.');
  const exceeded = evaluateEonConcurrencyAdmission({ softwareAccess: true, capacityAuthority: 'subscription', serverVerifiedCapacity: true, activeJobs: 3, requestedJobs: 1, concurrencyLimit: 3 });
  if (exceeded.allowed || exceeded.reason !== 'capacity-limit-reached') errors.push('Concurrency must fail closed at the verified limit.');
  const local = evaluateEonPremiumWorkloadAdmission({ softwareAccess: true, workloadClass: 'local', capacityAuthority: 'local-device' });
  if (!local.allowed) errors.push('Eligible software may use user-device capacity without platform-hosted budget.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_PREMIUM_WORKLOAD_BUDGET_SCHEMA });
}

export default freeze({
  EON_PREMIUM_WORKLOAD_BUDGET_SCHEMA,
  EON_PREMIUM_CAPACITY_AUTHORITIES,
  evaluateEonPremiumWorkloadAdmission,
  evaluateEonConcurrencyAdmission,
  validateEonPremiumWorkloadBudget
});
