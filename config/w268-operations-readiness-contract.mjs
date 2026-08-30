/**
 * W268 — operations-readiness evidence contract.
 *
 * This is an execution/runbook boundary, not a deployment controller. It
 * requires named humans and observed drills before any later board may claim
 * operational readiness.
 */
export const W268_OPERATIONS_READINESS_SCHEMA = 'eonapp.w268.operations-readiness.v1';
export const W268_OPERATIONS_DECISION = 'NOT_READY_PENDING_OBSERVED_DRILLS';

export const W268_LOCAL_STATIC_RUNBOOKS = Object.freeze([
  'incident-triage-and-support-routing',
  'browser-local-data-export-and-restore',
  'pwa-update-and-rollback',
  'cloudflare-preview-live-deployment-rollback',
  'provider-change-and-byok-incident',
  'security-disclosure-and-secret-rotation-boundary'
]);

export const W268_REQUIRED_EXTERNAL_DRILLS = Object.freeze([
  'named-owner-and-escalation-confirmation',
  'preview-deployment-and-rollback-drill',
  'pwa-update-and-rollback-on-real-device',
  'browser-local-data-export-restore-study',
  'support-incident-tabletop',
  'cloudflare-binding-and-deployment-identity-review'
]);

const PENDING_STATUSES = new Set(['not-collected', 'not-available-in-freeze', 'blocked']);

export function validateW268OperationsBoard(board = {}) {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  assert(board && typeof board === 'object', 'W268 board must be an object.');
  if (!board || typeof board !== 'object') return Object.freeze({ ok: false, errors: Object.freeze(errors) });
  assert(board.schema === W268_OPERATIONS_READINESS_SCHEMA, `W268 board schema must be ${W268_OPERATIONS_READINESS_SCHEMA}.`);
  assert(board.decision === W268_OPERATIONS_DECISION, `W268 decision must remain ${W268_OPERATIONS_DECISION}.`);
  assert(board.authority?.implementationAuthorMayClose === false, 'W268 must prohibit implementation-author self-closure.');
  for (const role of ['releaseOwner', 'supportOwner', 'rollbackOwner']) {
    assert(board.authority?.[role]?.status === 'unassigned', `W268 ${role} must remain unassigned until the owner accepts the operational role.`);
  }
  const drills = Array.isArray(board.requiredExternalDrills) ? board.requiredExternalDrills : [];
  assert(drills.length === W268_REQUIRED_EXTERNAL_DRILLS.length, 'W268 must enumerate each required observed drill exactly once.');
  const byId = new Map(drills.map((entry) => [entry?.id, entry]));
  for (const id of W268_REQUIRED_EXTERNAL_DRILLS) {
    const entry = byId.get(id);
    assert(entry, `W268 drill missing: ${id}.`);
    if (!entry) continue;
    assert(entry.required === true, `W268 drill must remain required: ${id}.`);
    assert(PENDING_STATUSES.has(entry.status), `W268 drill cannot be marked passed in a source freeze: ${id}.`);
    assert(Array.isArray(entry.evidenceRefs) && entry.evidenceRefs.length === 0, `W268 drill cannot invent evidence references: ${id}.`);
  }
  assert(Array.isArray(board.localStaticRunbooks) && board.localStaticRunbooks.length === W268_LOCAL_STATIC_RUNBOOKS.length, 'W268 board must list every local static runbook.');
  assert(Array.isArray(board.prohibitedClaims) && board.prohibitedClaims.includes('operationally ready'), 'W268 must prohibit unsupported operational-readiness claims.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export default {
  W268_OPERATIONS_READINESS_SCHEMA,
  W268_OPERATIONS_DECISION,
  W268_LOCAL_STATIC_RUNBOOKS,
  W268_REQUIRED_EXTERNAL_DRILLS,
  validateW268OperationsBoard
};
