/** W415 — final source-readiness contract for Codex handover; not a production proof claim. */
export const W415_FINAL_SOURCE_READINESS_CONTRACT = Object.freeze({
  id: 'W415',
  title: 'Final source readiness and manual-proof handover',
  codeCompleteWaves: Object.freeze(['UX-1', 'UX-2', 'UX-3', 'W411', 'Share-2', 'W406B', 'W407', 'W408', 'W409', 'W410', 'W412', 'W413', 'W414']),
  manualProofRequired: Object.freeze([
    'production Google OAuth with a disposable approved test account',
    'desktop plus Android/iOS City controls, safe areas and reduced-motion evidence',
    'two-device Sync Basic opt-in, import/merge, offline conflict, tombstone and restore drill',
    'licensed/original GLB, KTX2/Basis, LOD and provenance intake before final-art claims'
  ]),
  forbiddenClaims: Object.freeze([
    'live production OAuth proof',
    'public Sync Basic release',
    'Secure Vault Sync',
    'real-device City certification',
    'licensed final City art',
    'social posting or OAuth connectors',
    'rewards, payments or referral activation'
  ])
});

export function validateW415FinalSourceReadinessContract(contract = W415_FINAL_SOURCE_READINESS_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W415') errors.push('W415 identifier is invalid.');
  if (!Array.isArray(contract?.codeCompleteWaves) || !['W412', 'W413', 'W414'].every((wave) => contract.codeCompleteWaves.includes(wave))) errors.push('W415 must include W412, W413 and W414 as code-complete source waves.');
  if (!Array.isArray(contract?.manualProofRequired) || contract.manualProofRequired.length !== 4) errors.push('W415 must retain exactly four external manual-proof tracks.');
  if (!Array.isArray(contract?.forbiddenClaims) || contract.forbiddenClaims.length < 6) errors.push('W415 must preserve its honest no-claim boundary.');
  return Object.freeze(errors);
}
