/** W263-A0 — source-only EONBOT capability execution readiness contract. */
export const W263_EONBOT_CAPABILITY_EXECUTION_SCHEMA = 'eonapp.w263.eonbot-capability-execution-source-readiness.v1';

export const W263_REQUIRED_EXTERNAL_EVIDENCE = Object.freeze([
  Object.freeze({ id: 'approval-flow-device-review', status: 'pending-independent-review', owner: 'device reviewer', evidence: 'Keyboard, touch and permission-denial walkthroughs for guarded Chat actions on real devices.' }),
  Object.freeze({ id: 'capability-truth-review', status: 'pending-independent-review', owner: 'product/security reviewer', evidence: 'Independent review that capability copy, receipts and denial states do not overclaim completion or hidden tool access.' }),
  Object.freeze({ id: 'support-recovery-review', status: 'pending-owner-assignment', owner: 'support owner', evidence: 'Observed support/recovery handling for expired, cancelled and blocked local proposals.' })
]);

export function validateW263CapabilityExecutionBoard(board = {}) {
  const errors = [];
  if (board.schema !== W263_EONBOT_CAPABILITY_EXECUTION_SCHEMA) errors.push('W263 board schema must match.');
  if (board.decision !== 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING') errors.push('W263 must remain source-ready with external evidence pending.');
  if (board.scope !== 'source-only') errors.push('W263 board scope must remain source-only.');
  if (!Array.isArray(board.requiredExternalEvidence) || board.requiredExternalEvidence.length !== W263_REQUIRED_EXTERNAL_EVIDENCE.length) errors.push('W263 board must enumerate every required external evidence lane.');
  if (!Array.isArray(board.claimFence) || board.claimFence.length < 3) errors.push('W263 board must retain its proof-limit claim fence.');
  return { ok: errors.length === 0, errors };
}
