/** RT92 Grand Master Art Programme — Wave 1 source authority. */
export const RT92_GRAND_MASTER_ART_CONTRACT = Object.freeze({
  schema: 'eonapp.city.rt92-grand-master-art-contract.v1',
  release: 'RT92',
  wave: 'grand-art-1',
  title: 'Universal art bible, sharpness law, lightweight streaming and world identities',
  worlds: Object.freeze(['command-hub', 'signal-frontier', 'storm-sector', 'my-frontier']),
  visualLayerCount: 15,
  materialFamilyCount: 12,
  sharpness: Object.freeze({ neutralStructureShareMin: 0.7, emissiveShareMax: 0.1, heroCompositionRequired: true, mobileHeroSilhouetteRequired: true }),
  binaryBudget: Object.freeze({ targetNewGlbBytes: 8_000_000, absoluteWaveProgrammeCeilingBytes: 12_000_000, targetNewVectorBytes: 300_000, firstFrameNewBinaryBytes: 0 }),
  streaming: Object.freeze({ threeRing: true, hiddenWorldSuspension: true, sameOriginOnly: true, contentAddressedPreferred: true }),
  boundaries: Object.freeze({ oneEngine: true, oneScene: true, oneRenderLoop: true, noProgressionAuthority: true, noAutomaticNetworkFetch: true }),
  requiredFiles: Object.freeze([
    'assets/js/city/rt92/eon-city-rt92-grand-art-bible.js',
    'assets/js/city/rt92/eon-city-rt92-shared-art-runtime.js',
    'config/rt92-grand-master-art-contract.mjs',
    'scripts/rt92-grand-art-foundation-gate.mjs',
    'tests/unit/rt92-grand-art-foundation.test.mjs',
    'docs/rt92/RT92_GRAND_MASTER_ART_BLUEPRINT.md'
  ])
});

export function validateRt92GrandMasterArtContract(contract = RT92_GRAND_MASTER_ART_CONTRACT) {
  const errors = [];
  if (contract?.release !== 'RT92' || contract?.wave !== 'grand-art-1') errors.push('identity');
  if (contract?.worlds?.length !== 4 || contract?.visualLayerCount !== 15 || contract?.materialFamilyCount !== 12) errors.push('coverage');
  if (Number(contract?.sharpness?.neutralStructureShareMin || 0) < 0.7 || Number(contract?.sharpness?.emissiveShareMax || 1) > 0.1) errors.push('sharpness');
  if (contract?.binaryBudget?.firstFrameNewBinaryBytes !== 0 || Number(contract?.binaryBudget?.targetNewGlbBytes || 0) > 8_000_000) errors.push('binary-budget');
  if (contract?.streaming?.threeRing !== true || contract?.streaming?.hiddenWorldSuspension !== true || contract?.streaming?.sameOriginOnly !== true) errors.push('streaming');
  if (Object.values(contract?.boundaries || {}).some((value) => value !== true)) errors.push('authority-boundary');
  if (contract?.requiredFiles?.length !== 6) errors.push('required-files');
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), contract });
}
