import { findEonActionGatewayType } from '../action-gateway/eon-action-gateway-contract.js';
import { evaluateEonPremiumWorkloadAdmission } from '../capabilities/eon-premium-workload-budget.js';

/**
 * RT92 future durable-work contract foundation.
 *
 * This is a DESIGN/VALIDATION boundary only. It does not persist a job, start a
 * worker, call a provider, schedule a task, approve an external effect or grant
 * paid capacity. A future server runtime may adopt this packet only after the
 * durable-runtime, Action Gateway, billing-capacity and audit prerequisites are
 * independently certified.
 */
export const EON_DURABLE_WORK_CONTRACT_SCHEMA = 'eonapp.durable-work-contract.rt92.v1';
export const EON_DURABLE_WORK_RUNTIME_STATUS = 'design-only-disabled';
export const EON_DURABLE_WORK_STATES = Object.freeze([
  'queued',
  'running',
  'waiting-for-approval',
  'succeeded',
  'failed',
  'cancelled'
]);

const freeze = (value) => Object.freeze(value);
const ID_RE = /^[a-zA-Z0-9._:-]{1,140}$/;
const DIGEST_RE = /^(?:sha256:)?[a-f0-9]{32,128}$/i;
const RAW_PAYLOAD_KEYS = Object.freeze([
  'prompt', 'rawPrompt', 'input', 'rawInput', 'content', 'body', 'message',
  'messages', 'credentials', 'credential', 'secret', 'token', 'apiKey',
  'authorization', 'output', 'result'
]);

function safeId(value = '') {
  const candidate = String(value || '').trim();
  return ID_RE.test(candidate) ? candidate : '';
}

function safeDigest(value = '') {
  const candidate = String(value || '').trim();
  return DIGEST_RE.test(candidate) ? candidate.toLowerCase() : '';
}

function stripControlCharacters(value = '', replacement = '') {
  return Array.from(String(value || ''), (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? replacement : character;
  }).join('');
}

function safeLabel(value = '', max = 120) {
  return stripControlCharacters(value, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function hasRawPayload(input = {}) {
  return RAW_PAYLOAD_KEYS.some((key) => Object.prototype.hasOwnProperty.call(input, key));
}

function positiveInteger(value, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.trunc(parsed)) : fallback;
}

/**
 * Prepares a redacted future-runtime packet. `capacity` is evaluated only to
 * describe admission state; because runtimeActive is false, success here is
 * never execution authority.
 */
export function prepareEonDurableWorkPacket(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return freeze({ ok: false, reason: 'object-input-required', runtimeActive: false, jobCreated: false });
  }
  if (hasRawPayload(input)) {
    return freeze({ ok: false, reason: 'raw-payload-not-allowed-in-durable-contract', runtimeActive: false, jobCreated: false });
  }

  const jobId = safeId(input.jobId);
  const accountRef = safeId(input.accountRef);
  const projectId = safeId(input.projectId);
  const capabilityId = safeId(input.capabilityId);
  const taskClass = safeId(input.taskClass);
  const inputDigest = safeDigest(input.inputDigest);
  const idempotencyKey = safeId(input.idempotencyKey);
  const nonce = safeId(input.nonce);
  const expiresAtMs = Number(input.expiresAtMs);
  const nowMs = Number.isFinite(Number(input.nowMs)) ? Number(input.nowMs) : Date.now();

  if (!jobId || !accountRef || !capabilityId || !taskClass) {
    return freeze({ ok: false, reason: 'opaque-job-account-capability-task-identifiers-required', runtimeActive: false, jobCreated: false });
  }
  if (!inputDigest) {
    return freeze({ ok: false, reason: 'redacted-input-digest-required', runtimeActive: false, jobCreated: false });
  }
  if (!idempotencyKey || !nonce) {
    return freeze({ ok: false, reason: 'idempotency-and-nonce-required', runtimeActive: false, jobCreated: false });
  }
  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= nowMs) {
    return freeze({ ok: false, reason: 'future-expiry-required', runtimeActive: false, jobCreated: false });
  }

  const externalActionType = safeId(input.externalActionType);
  const actionGatewayType = externalActionType ? findEonActionGatewayType(externalActionType) : null;
  if (externalActionType && !actionGatewayType) {
    return freeze({ ok: false, reason: 'external-action-must-use-known-action-gateway-type', runtimeActive: false, jobCreated: false });
  }

  const requestedUnits = positiveInteger(input.capacity?.requestedUnits, 1);
  const admission = evaluateEonPremiumWorkloadAdmission({
    softwareAccess: input.capacity?.softwareAccess === true,
    workloadClass: input.capacity?.workloadClass,
    capacityAuthority: input.capacity?.capacityAuthority,
    currentUsage: input.capacity?.currentUsage,
    requestedUnits,
    limit: input.capacity?.limit,
    serverVerifiedCapacity: input.capacity?.serverVerifiedCapacity === true
  });

  if (!admission.allowed) {
    return freeze({
      ok: false,
      reason: `workload-admission-denied:${admission.reason}`,
      admission,
      runtimeActive: false,
      jobCreated: false,
      externalEffectCreated: false
    });
  }

  const packet = freeze({
    schema: EON_DURABLE_WORK_CONTRACT_SCHEMA,
    jobId,
    accountRef,
    projectId,
    capabilityId,
    taskClass,
    safeLabel: safeLabel(input.safeLabel || taskClass),
    workloadClass: admission.workloadClass,
    requestedUnits,
    inputDigest,
    idempotencyKey,
    nonce,
    createdAtMs: Math.max(0, Math.trunc(nowMs)),
    expiresAtMs: Math.trunc(expiresAtMs),
    initialState: 'queued',
    externalAction: externalActionType ? freeze({
      actionTypeId: actionGatewayType.id,
      label: actionGatewayType.label,
      requiresOfficialConnector: actionGatewayType.requiresOfficialConnector === true,
      requiresSeparateExplicitApproval: true,
      approved: false
    }) : null,
    admission: freeze({
      allowed: true,
      reason: admission.reason,
      capacityAuthority: admission.capacityAuthority,
      serverVerifiedCapacity: admission.serverVerifiedCapacity,
      finiteLimit: admission.limit,
      remainingAfterAdmission: admission.remainingAfterAdmission
    }),
    rawPromptStored: false,
    rawOutputStored: false,
    credentialsStored: false,
    providerTokenStored: false,
    browserExecutionAuthority: false,
    externalEffectAuthorized: false
  });

  return freeze({
    ok: true,
    packet,
    runtimeActive: false,
    jobCreated: false,
    backgroundJobCreated: false,
    networkRequestCreated: false,
    providerStarted: false,
    externalEffectCreated: false,
    actionGatewayRequiredForExternalEffect: Boolean(externalActionType),
    platformBackendLegacyAllowed: false
  });
}

export function getEonDurableWorkContractTruth() {
  return freeze({
    schema: EON_DURABLE_WORK_CONTRACT_SCHEMA,
    runtimeStatus: EON_DURABLE_WORK_RUNTIME_STATUS,
    lifecycleVocabularyOnly: EON_DURABLE_WORK_STATES,
    runtimeActive: false,
    browserCanCreateDurableJob: false,
    browserCanGrantHostedCapacity: false,
    browserCanApproveExternalEffect: false,
    rawPromptAllowedInPacket: false,
    credentialsAllowedInPacket: false,
    redactedDigestRequired: true,
    nonceRequired: true,
    expiryRequired: true,
    idempotencyRequired: true,
    actionGatewayRequiredForExternalEffects: true,
    legacyPlatformBackendAllowed: false,
    requiredFutureProofs: freeze([
      'server-durable-runtime-proof',
      'server-capacity-authority-proof',
      'action-gateway-external-effect-proof',
      'idempotency-and-replay-proof',
      'cancellation-and-recovery-proof',
      'redacted-audit-receipt-proof',
      'cost-and-abuse-budget-proof'
    ])
  });
}

export default freeze({
  EON_DURABLE_WORK_CONTRACT_SCHEMA,
  EON_DURABLE_WORK_RUNTIME_STATUS,
  EON_DURABLE_WORK_STATES,
  prepareEonDurableWorkPacket,
  getEonDurableWorkContractTruth
});
