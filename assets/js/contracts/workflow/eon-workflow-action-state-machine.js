/** A15 I16 — canonical workflow/action/review state machine. */
export const EON_WORKFLOW_ACTION_SCHEMA = 'eon.workflow-action.a15.v1';
export const EON_WORKFLOW_ACTION_STATES = Object.freeze([
  'draft', 'simulated', 'reviewed', 'approved', 'queued', 'executing', 'verified', 'failed', 'cancelled'
]);

const freeze = (value) => Object.freeze(value);
const TRANSITIONS = Object.freeze({
  draft: Object.freeze(['simulated', 'cancelled', 'failed']),
  simulated: Object.freeze(['reviewed', 'cancelled', 'failed']),
  reviewed: Object.freeze(['approved', 'cancelled', 'failed']),
  approved: Object.freeze(['queued', 'cancelled', 'failed']),
  queued: Object.freeze(['executing', 'cancelled', 'failed']),
  executing: Object.freeze(['verified', 'cancelled', 'failed']),
  verified: Object.freeze([]),
  failed: Object.freeze([]),
  cancelled: Object.freeze([])
});
const PRIVATE_FIELD_RE = /(?:prompt|content|body|message|credential|secret|token|password|cookie|authorization|api.?key|private.?key|media|transcript|email|phone)/i;

function clean(value = '', limit = 180) {
  return String(value || '').replaceAll(String.fromCharCode(0), '').trim().slice(0, limit);
}

function secureId(prefix = 'action', cryptoApi = globalThis.crypto) {
  if (typeof cryptoApi?.randomUUID === 'function') return `${prefix}_${cryptoApi.randomUUID()}`;
  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return `${prefix}_${[...bytes].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
  }
  throw new Error('secure-action-id-unavailable');
}

function sanitizeEvidence(value = {}) {
  const output = {};
  for (const [key, entry] of Object.entries(value && typeof value === 'object' ? value : {})) {
    if (PRIVATE_FIELD_RE.test(key)) continue;
    if (entry === null || ['string', 'number', 'boolean'].includes(typeof entry)) output[clean(key, 80)] = typeof entry === 'string' ? clean(entry, 240) : entry;
  }
  return freeze(output);
}

export function normalizeEonWorkflowAction(value = {}, options = {}) {
  const state = EON_WORKFLOW_ACTION_STATES.includes(value.state) ? value.state : 'draft';
  const createdAt = clean(value.createdAt || new Date(Number(options.now || Date.now())).toISOString(), 64);
  return freeze({
    schema: EON_WORKFLOW_ACTION_SCHEMA,
    actionId: clean(value.actionId || secureId('workflowaction', options.cryptoApi), 140),
    workflowId: clean(value.workflowId, 140),
    runId: clean(value.runId, 140),
    stepId: clean(value.stepId, 140),
    actionType: clean(value.actionType || 'local-review', 100),
    risk: ['read', 'draft', 'submit', 'sensitive'].includes(value.risk) ? value.risk : 'draft',
    state,
    source: clean(value.source || 'workflow-authority', 100),
    createdAt,
    updatedAt: clean(value.updatedAt || createdAt, 64),
    reviewedAt: clean(value.reviewedAt, 64),
    approvedAt: clean(value.approvedAt, 64),
    queuedAt: clean(value.queuedAt, 64),
    executingAt: clean(value.executingAt, 64),
    verifiedAt: clean(value.verifiedAt, 64),
    terminalReason: clean(value.terminalReason, 180),
    evidence: sanitizeEvidence(value.evidence),
    localApprovalOnly: value.localApprovalOnly !== false,
    externalExecutionAuthority: value.externalExecutionAuthority === true,
    externalEffectCreated: value.externalEffectCreated === true
  });
}

export function createEonWorkflowAction(input = {}, options = {}) {
  return normalizeEonWorkflowAction({ ...input, state: 'draft', localApprovalOnly: true, externalExecutionAuthority: false, externalEffectCreated: false }, options);
}

function certifiedExecutorEvidence(evidence = {}) {
  return evidence.certifiedExecutor === true
    && evidence.serverIssued === true
    && evidence.externalExecutionAuthority === true
    && /^[a-z0-9:_-]{8,180}$/i.test(String(evidence.receiptId || ''))
    && /^[a-z0-9:_-]{8,180}$/i.test(String(evidence.idempotencyKey || ''));
}

export function transitionEonWorkflowAction(actionValue = {}, targetState = '', options = {}) {
  const now = Number(options.now || Date.now());
  const current = normalizeEonWorkflowAction(actionValue, { now, cryptoApi: options.cryptoApi });
  const target = EON_WORKFLOW_ACTION_STATES.includes(targetState) ? targetState : '';
  if (!target) return freeze({ ok: false, reason: 'unknown-target-state', action: current });
  if (current.state === target) return freeze({ ok: true, duplicate: true, reason: '', action: current });
  if (!TRANSITIONS[current.state]?.includes(target)) return freeze({ ok: false, reason: `invalid-transition:${current.state}->${target}`, action: current });
  if (target === 'approved' && options.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-approval-required', action: current });
  if (['queued', 'executing'].includes(target) && !certifiedExecutorEvidence(options.evidence)) {
    return freeze({ ok: false, reason: 'certified-executor-receipt-required', action: current });
  }
  if (target === 'verified' && !(options.evidence?.verifiedOutcome === true && /^[a-z0-9:_-]{8,180}$/i.test(String(options.evidence?.receiptId || '')))) {
    return freeze({ ok: false, reason: 'verified-outcome-receipt-required', action: current });
  }
  const at = new Date(now).toISOString();
  const patch = {
    state: target,
    updatedAt: at,
    terminalReason: ['failed', 'cancelled'].includes(target) ? clean(options.reason || target, 180) : current.terminalReason,
    evidence: sanitizeEvidence(options.evidence),
    reviewedAt: target === 'reviewed' ? at : current.reviewedAt,
    approvedAt: target === 'approved' ? at : current.approvedAt,
    queuedAt: target === 'queued' ? at : current.queuedAt,
    executingAt: target === 'executing' ? at : current.executingAt,
    verifiedAt: target === 'verified' ? at : current.verifiedAt,
    localApprovalOnly: !['queued', 'executing', 'verified'].includes(target),
    externalExecutionAuthority: ['queued', 'executing', 'verified'].includes(target),
    externalEffectCreated: target === 'verified'
  };
  return freeze({ ok: true, duplicate: false, reason: '', action: normalizeEonWorkflowAction({ ...current, ...patch }, { now, cryptoApi: options.cryptoApi }) });
}

export function prepareEonWorkflowReviewAction(input = {}, options = {}) {
  const draft = createEonWorkflowAction(input, options);
  const simulated = transitionEonWorkflowAction(draft, 'simulated', options);
  if (!simulated.ok) return simulated;
  return transitionEonWorkflowAction(simulated.action, 'reviewed', options);
}

export function createNeutralCoreOutcome(actionValue = {}, options = {}) {
  const action = normalizeEonWorkflowAction(actionValue, options);
  if (action.state !== 'verified' || action.externalEffectCreated !== true) return freeze({ ok: false, reason: 'verified-action-required', outcome: null });
  return freeze({
    ok: true,
    reason: '',
    outcome: freeze({
      schema: 'eon.core-outcome.a15.v1',
      outcomeId: clean(options.outcomeId || `outcome:${action.actionId}`, 180),
      type: clean(options.type || action.actionType, 100),
      workflowId: action.workflowId,
      evidenceReceiptId: clean(action.evidence.receiptId, 180),
      verifiedAt: action.verifiedAt,
      privacyClass: 'redacted-metadata',
      containsPrivateContent: false,
      cityMaySubscribe: options.cityMaySubscribe === true
    })
  });
}

export function getEonWorkflowLaunchTruth() {
  return freeze({
    schema: EON_WORKFLOW_ACTION_SCHEMA,
    launchMode: 'plan-simulate-review',
    localApprovalCreatesExternalAuthority: false,
    backgroundExecutionEnabled: false,
    certifiedExecutorEnabled: false,
    queuedStateRequiresServerReceipt: true,
    verifiedStateRequiresOutcomeReceipt: true,
    cityConsumesNeutralOutcomesOnly: true
  });
}
