/** W288-A0 — source-only Creator project handoff integrity/recovery contract. */
export const W288_CREATOR_HANDOFF_INTEGRITY_SCHEMA = 'eonapp.w288.creator-handoff-integrity-source-readiness.v1';

export const W288_REQUIRED_EXTERNAL_EVIDENCE = Object.freeze([
  Object.freeze({ id: 'handoff-review-device-walkthrough', status: 'pending-independent-review', owner: 'device reviewer', evidence: 'Desktop and mobile file-picker/readability/error-state walkthrough for the review-only project handoff inspector.' }),
  Object.freeze({ id: 'destructive-recovery-clarity-review', status: 'pending-content-owner', owner: 'content/legal owner', evidence: 'Human review that review-only, no-import, ownership and recovery wording is clear and does not overclaim rights or restore safety.' }),
  Object.freeze({ id: 'encrypted-backup-restore-drill', status: 'pending-observed-drill', owner: 'rollback owner', evidence: 'Controlled Vault encrypted backup/restore drill demonstrating the separate full-recovery path for normal project records.' })
]);

export function validateW288CreatorHandoffIntegrityBoard(board = {}) {
  const errors = [];
  if (board.schema !== W288_CREATOR_HANDOFF_INTEGRITY_SCHEMA) errors.push('W288 board schema must match.');
  if (board.decision !== 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING') errors.push('W288 must remain source-ready with external evidence pending.');
  if (board.scope !== 'source-only') errors.push('W288 board scope must remain source-only.');
  if (!Array.isArray(board.requiredExternalEvidence) || board.requiredExternalEvidence.length !== W288_REQUIRED_EXTERNAL_EVIDENCE.length) errors.push('W288 board must enumerate every required external evidence lane.');
  if (!Array.isArray(board.claimFence) || board.claimFence.length < 3) errors.push('W288 board must retain its proof-limit claim fence.');
  return { ok: errors.length === 0, errors };
}
