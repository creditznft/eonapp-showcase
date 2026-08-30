/** W418 — final source audit. This is intentionally not a live or art certification. */
export const W418_FINAL_FLAGSHIP_AUDIT_CONTRACT = Object.freeze({
  id: 'W418',
  title: 'Final flagship source audit and Codex operator handover',
  completedSourceWaves: Object.freeze(['UX-1', 'UX-2', 'UX-3', 'Share-2', 'W406B', 'W407', 'W408', 'W409', 'W410', 'W411', 'W412', 'W413', 'W414', 'W415', 'W416', 'W417']),
  finalSourceClaims: Object.freeze([
    'canonical Babylon City source is complete through the procedural flagship and finite Signal Expeditions',
    'PBR fallback materials and cinematic-only local shadows are source implemented',
    'asset binary release requires provenance, integrity, LOD, texture and human-review preflight',
    'Google identity and Sync remain separately proof-gated'
  ]),
  externalEvidenceRequired: Object.freeze([
    'production Google OAuth flow with a disposable approved test account',
    'desktop plus Android/iOS City controls, safe areas, pause/reset and reduced-motion captures',
    'two-device EON Sync Basic opt-in, merge, conflict, tombstone and restore drill against dedicated D1',
    'licensed or original City binary-art intake with hashes, provenance evidence, visual review and device performance evidence'
  ]),
  prohibitedStatusClaims: Object.freeze([
    'institutional-grade final visual art certification',
    'final licensed asset delivery',
    'real-device City certification',
    'public Sync release',
    'Secure Vault Sync',
    'production OAuth proof',
    'social posting, rewards, payments or referral activation'
  ])
});

export function validateW418FinalFlagshipAuditContract(contract = W418_FINAL_FLAGSHIP_AUDIT_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W418') errors.push('W418 identifier is invalid.');
  if (!Array.isArray(contract?.completedSourceWaves) || !['W412', 'W413', 'W414', 'W415', 'W416', 'W417'].every((wave) => contract.completedSourceWaves.includes(wave))) errors.push('W418 must include every completed late-stage source wave.');
  if (!Array.isArray(contract?.finalSourceClaims) || contract.finalSourceClaims.length !== 4) errors.push('W418 must state only four source-complete claims.');
  if (!Array.isArray(contract?.externalEvidenceRequired) || contract.externalEvidenceRequired.length !== 4) errors.push('W418 must retain the four external proof tracks.');
  if (!Array.isArray(contract?.prohibitedStatusClaims) || contract.prohibitedStatusClaims.length < 7) errors.push('W418 must preserve no-claim boundaries.');
  return Object.freeze(errors);
}
