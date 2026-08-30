/** W285-A0 — source-only Local AI/device support contract. */
export const W285_LOCAL_AI_DEVICE_SUPPORT_SCHEMA = 'eonapp.w285.local-ai-device-support-source-readiness.v1';

export const W285_REQUIRED_EXTERNAL_EVIDENCE = Object.freeze([
  Object.freeze({ id: 'mobile-low-memory-walkthrough', status: 'pending-independent-review', owner: 'device reviewer', evidence: 'Observed 4 GB-class Android walkthrough: profile, Local AI guidance, Chat, 2D City and safe exit.' }),
  Object.freeze({ id: 'desktop-local-runtime-walkthrough', status: 'pending-independent-review', owner: 'device reviewer', evidence: 'Observed desktop scan/self-test/select/clear walkthrough against a user-installed loopback runtime.' }),
  Object.freeze({ id: 'storage-thermal-support-review', status: 'pending-support-review', owner: 'support owner', evidence: 'Human review of stop conditions, storage/thermal/battery guidance, and escalation copy without device-performance promises.' })
]);

export function validateW285LocalAiDeviceSupportBoard(board = {}) {
  const errors = [];
  if (board.schema !== W285_LOCAL_AI_DEVICE_SUPPORT_SCHEMA) errors.push('W285 board schema must match.');
  if (board.decision !== 'SOURCE_READY_EXTERNAL_EVIDENCE_PENDING') errors.push('W285 must remain source-ready with external evidence pending.');
  if (board.scope !== 'source-only') errors.push('W285 board scope must remain source-only.');
  if (!Array.isArray(board.requiredExternalEvidence) || board.requiredExternalEvidence.length !== W285_REQUIRED_EXTERNAL_EVIDENCE.length) errors.push('W285 board must retain every required external evidence lane.');
  if (!Array.isArray(board.claimFence) || board.claimFence.length < 3) errors.push('W285 board must retain its proof-limit claim fence.');
  return { ok: errors.length === 0, errors };
}
