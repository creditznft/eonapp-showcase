export const W406B_CITY_ART_INTAKE_CONTRACT = Object.freeze({
  id: 'W406B',
  title: 'EON City Art Intake and Offline Pipeline',
  scope: Object.freeze([
    'canonical Babylon /eoncity art-intake ledger',
    'authored district and first-frame mapping',
    'original/licensed provenance release requirements',
    'GLB, KTX2/Basis, LOD and quality-budget policy',
    'local procedural and mobile fallback policy'
  ]),
  nonGoals: Object.freeze([
    'shipping a binary GLB, texture, animation, audio or third-party asset',
    'runtime asset generation, CDN loading or remote texture access',
    'claiming final art quality, AAA fidelity or device certification',
    'activating user data, posting, payment, reward, token or social connection flows'
  ]),
  releaseRules: Object.freeze({
    canonicalPublicEngine: 'babylon-eoncity',
    canonicalPublicRoute: '/eoncity',
    noSecondPublicCity: true,
    sourceOnly: true,
    requireHumanArtReview: true,
    requireProvenanceEvidence: true,
    requireSameOriginBinary: true,
    requireKtx2OrBasisPackaging: true,
    requireLodTiers: true,
    requireMobileFallback: true,
    prohibitRemoteNetwork: true,
    prohibitUserData: true
  }),
  nextWave: 'W407 — authored Arrival District only after asset provenance and art production evidence exist.'
});

export function validateW406BCityArtIntakeContract(contract = W406B_CITY_ART_INTAKE_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W406B') errors.push('W406B identifier is invalid.');
  if (contract?.releaseRules?.canonicalPublicEngine !== 'babylon-eoncity') errors.push('W406B must keep Babylon as the canonical public engine.');
  if (contract?.releaseRules?.canonicalPublicRoute !== '/eoncity') errors.push('W406B must keep /eoncity as the canonical public route.');
  for (const key of ['noSecondPublicCity', 'sourceOnly', 'requireHumanArtReview', 'requireProvenanceEvidence', 'requireSameOriginBinary', 'requireKtx2OrBasisPackaging', 'requireLodTiers', 'requireMobileFallback', 'prohibitRemoteNetwork', 'prohibitUserData']) {
    if (contract?.releaseRules?.[key] !== true) errors.push(`W406B release rule ${key} must be true.`);
  }
  return Object.freeze(errors);
}
