/** W264-A0 — source-only local Creator/Build handoff and recovery contract. */
export const W264_CREATOR_BUILD_HANDOFF_SCHEMA = 'eonapp.w264.creator-build-handoff-source-readiness.v1';

export const W264_REQUIRED_EXTERNAL_EVIDENCE = Object.freeze([
  Object.freeze({ id: 'export-download-device-review', status: 'pending-independent-review', owner: 'device reviewer', evidence: 'Desktop and mobile download/open/save walkthrough for a local project handoff.' }),
  Object.freeze({ id: 'ownership-claim-review', status: 'pending-content-owner', owner: 'legal/content owner', evidence: 'Human review that handoff/ownership language does not overclaim authorship, rights, delivery or publication.' }),
  Object.freeze({ id: 'backup-recovery-drill', status: 'pending-observed-drill', owner: 'rollback owner', evidence: 'Controlled encrypted Portable Workspace Capsule export/restore drill proving normal project records survive an update or recovery path.' })
]);

export function validateW264CreatorBuildHandoffBoard(board = {}) {
  const errors = [];
  if (board.schema !== W264_CREATOR_BUILD_HANDOFF_SCHEMA) errors.push('W264 board schema must match.');
  if (board.decision !== 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING') errors.push('W264 must remain source-ready with external evidence pending.');
  if (board.scope !== 'source-only') errors.push('W264 board scope must remain source-only.');
  if (!Array.isArray(board.requiredExternalEvidence) || board.requiredExternalEvidence.length !== W264_REQUIRED_EXTERNAL_EVIDENCE.length) errors.push('W264 board must enumerate every required external evidence lane.');
  if (!Array.isArray(board.claimFence) || board.claimFence.length < 3) errors.push('W264 board must retain its proof-limit claim fence.');
  return { ok: errors.length === 0, errors };
}
