/** W624A — final City art-direction authority before runtime consolidation. */
export const W624A_CITY_ART_BIBLE_SCHEMA = 'eonapp.city.w624a-art-bible-contract.v1';

export const W624A_CITY_ART_BIBLE_CONTRACT = Object.freeze({
  schema: W624A_CITY_ART_BIBLE_SCHEMA,
  wave: 'W624A',
  title: 'EON City art bible and flagship quality target',
  requiredFiles: Object.freeze([
    'assets/js/city/eon-city-art-bible.js',
    'assets/js/city/eon-city-play-babylon.js',
    'assets/city/art/w624a-targets/eon-city-desktop-arrival-target.svg',
    'assets/city/art/w624a-targets/eon-city-mobile-arrival-target.svg',
    'assets/city/art/w624a-targets/eon-city-cast-lineup-target.svg',
    'program/EONAPP_W624A_CITY_ART_BIBLE_2026-07-11.md',
    'program/EONAPP_W624A_OWNER_VISUAL_APPROVAL_SCORECARD_2026-07-11.md',
    'config/w624a-city-art-bible-contract.mjs',
    'scripts/w624a-city-art-bible-gate.mjs',
    'tests/unit/w624a-city-art-bible.test.mjs'
  ]),
  canonicalVision: 'premium-stylized-neo-noir-science-fantasy-productive-rpg-workspace',
  requiredPillars: Object.freeze(['productive-wonder', 'authored-silhouettes', 'readable-nocturne', 'human-warmth', 'truthful-motion', 'calm-mastery']),
  requiredTargetFrameIds: Object.freeze(['desktop-arrival', 'mobile-arrival', 'cast-lineup']),
  requiredCast: Object.freeze({ player: 'wayfinder', eonbot: 'eonbot-orbit', minimumNpcArchetypes: 5 }),
  productiveRpg: Object.freeze({ persistedOutcomeRequired: true, fakeSuccessAllowed: false, fakeEconomyAllowed: false, combatRequired: false }),
  thresholds: Object.freeze({ commandDistrictBeforeExpansion: 9.0, flagshipOwnerApproval: 9.5, minimumFlagshipCategory: 9.0 }),
  ownerApproval: Object.freeze({ targetFramesPrepared: true, approvalStatus: 'pending-target-frame-review', finalAssetProductionBlockedUntilApproval: true }),
  boundaries: Object.freeze({ sourceComplete: true, finalBinaryArt: false, finalRigProof: false, runtimeScreenshotProof: false, devicePerformanceProof: false, externalCertification: false })
});

export function validateW624aCityArtBibleContract(contract = W624A_CITY_ART_BIBLE_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W624A') errors.push('Wave identifier drifted.');
  if (!Array.isArray(contract?.requiredFiles) || contract.requiredFiles.length < 10) errors.push('W624A must enumerate the runtime authority, target frames, programme documents, gate, and tests.');
  if (contract?.requiredPillars?.length !== 6) errors.push('W624A requires six canonical design pillars.');
  if (contract?.requiredTargetFrameIds?.join(',') !== 'desktop-arrival,mobile-arrival,cast-lineup') errors.push('W624A target-frame set is incomplete.');
  if (contract?.requiredCast?.player !== 'wayfinder' || contract?.requiredCast?.eonbot !== 'eonbot-orbit' || contract?.requiredCast?.minimumNpcArchetypes < 5) errors.push('W624A cast contract drifted.');
  if (!contract?.productiveRpg?.persistedOutcomeRequired || contract?.productiveRpg?.fakeSuccessAllowed || contract?.productiveRpg?.fakeEconomyAllowed) errors.push('Productive-RPG truth contract drifted.');
  if (contract?.thresholds?.commandDistrictBeforeExpansion !== 9 || contract?.thresholds?.flagshipOwnerApproval !== 9.5 || contract?.thresholds?.minimumFlagshipCategory !== 9) errors.push('Quality thresholds drifted.');
  if (contract?.ownerApproval?.approvalStatus !== 'pending-target-frame-review' || !contract?.ownerApproval?.finalAssetProductionBlockedUntilApproval) errors.push('Owner visual-approval gate must remain explicit.');
  const b = contract?.boundaries || {};
  if (b.sourceComplete !== true || b.finalBinaryArt !== false || b.finalRigProof !== false || b.runtimeScreenshotProof !== false || b.devicePerformanceProof !== false || b.externalCertification !== false) errors.push('W624A evidence boundary is invalid.');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), checks: 9, schema: W624A_CITY_ART_BIBLE_SCHEMA });
}
