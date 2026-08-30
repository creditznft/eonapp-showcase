/**
 * W267 — release red-team evidence contract.
 *
 * Source checks can prove only that the shipped surface retains its safety
 * boundaries. They cannot replace independent browser, account, history,
 * incident or legal review. The contract therefore fails closed: its local
 * baseline may pass while the independent audit state remains open.
 */
export const W267_RED_TEAM_AUDIT_SCHEMA = 'eonapp.w267.red-team-audit.v1';
export const W267_RED_TEAM_DECISION = 'NO_GO_PENDING_INDEPENDENT_REVIEW';

export const W267_LOCAL_STATIC_LANES = Object.freeze([
  'truthful-capability-copy',
  'secret-protection',
  'approval-first-actions',
  'local-first-diagnostics',
  'commercial-and-chain-firewall',
  'invite-and-milestone-fail-closed'
]);

export const W267_REQUIRED_EXTERNAL_LANES = Object.freeze([
  'independent-threat-model-review',
  'prompt-injection-and-abuse-exercise',
  'preview-live-network-and-csp-review',
  'git-history-and-environment-secret-review',
  'privacy-retention-and-user-rights-review',
  'rollback-and-kill-switch-tabletop'
]);

const PENDING_STATUSES = new Set(['not-collected', 'not-available-in-freeze', 'blocked']);

export function validateW267RedTeamBoard(board = {}) {
  const errors = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  assert(board && typeof board === 'object', 'W267 board must be an object.');
  if (!board || typeof board !== 'object') return Object.freeze({ ok: false, errors: Object.freeze(errors) });
  assert(board.schema === W267_RED_TEAM_AUDIT_SCHEMA, `W267 board schema must be ${W267_RED_TEAM_AUDIT_SCHEMA}.`);
  assert(board.decision === W267_RED_TEAM_DECISION, `W267 decision must remain ${W267_RED_TEAM_DECISION}.`);
  assert(board.authority?.implementationAuthorMayClose === false, 'W267 must prohibit implementation-author self-closure.');
  assert(board.authority?.independentReviewer?.status === 'unassigned', 'W267 independent reviewer must remain unassigned until external review is collected.');
  const lanes = Array.isArray(board.requiredExternalEvidence) ? board.requiredExternalEvidence : [];
  assert(lanes.length === W267_REQUIRED_EXTERNAL_LANES.length, 'W267 must enumerate each required independent evidence lane exactly once.');
  const byId = new Map(lanes.map((entry) => [entry?.id, entry]));
  for (const id of W267_REQUIRED_EXTERNAL_LANES) {
    const entry = byId.get(id);
    assert(entry, `W267 external evidence lane missing: ${id}.`);
    if (!entry) continue;
    assert(entry.required === true, `W267 external evidence lane must remain required: ${id}.`);
    assert(PENDING_STATUSES.has(entry.status), `W267 external evidence lane cannot be marked passed in a source freeze: ${id}.`);
    assert(Array.isArray(entry.evidenceRefs) && entry.evidenceRefs.length === 0, `W267 external evidence cannot invent references: ${id}.`);
  }
  assert(Array.isArray(board.localStaticLanes) && board.localStaticLanes.length === W267_LOCAL_STATIC_LANES.length, 'W267 board must state every local-static lane.');
  assert(Array.isArray(board.prohibitedClaims) && board.prohibitedClaims.includes('independently red-teamed'), 'W267 must prohibit unsupported independent-audit claims.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors) });
}

export default {
  W267_RED_TEAM_AUDIT_SCHEMA,
  W267_RED_TEAM_DECISION,
  W267_LOCAL_STATIC_LANES,
  W267_REQUIRED_EXTERNAL_LANES,
  validateW267RedTeamBoard
};
