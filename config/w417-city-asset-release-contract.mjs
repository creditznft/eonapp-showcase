/** W417 — evidence and integrity requirements before a City art binary can ship. */
export const W417_CITY_ASSET_RELEASE_CONTRACT = Object.freeze({
  id: 'W417',
  title: 'City asset release preflight and provenance integrity',
  requiredFiles: Object.freeze([
    'assets/js/city/eon-city-asset-catalog.js',
    'assets/js/city/eon-city-asset-release-preflight.js',
    'scripts/city-asset-release-preflight.mjs',
    'config/w417-city-asset-release-contract.mjs',
    'scripts/w417-city-asset-release-preflight-gate.mjs',
    'tests/unit/w417-city-asset-release-preflight.test.mjs',
    'docs/W417_CITY_ASSET_RELEASE_PREFLIGHT_2026-06-28.md'
  ]),
  requiredManifestFields: Object.freeze(['schema', 'releaseId', 'quality', 'entries']),
  requiredEntryFields: Object.freeze(['assetId', 'sourcePath', 'sha256', 'evidencePath', 'lod', 'texture', 'metrics', 'provenance']),
  requiredLodKeys: Object.freeze(['lod0', 'lod1', 'lod2']),
  requiredProofs: Object.freeze(['humanArtReview', 'licenceReview', 'visualQaPlan', 'devicePerformancePlan']),
  allowedTextureFormat: 'KTX2/Basis Universal',
  currentReleaseState: 'no approved binary art is present in this source package'
});

export function validateW417CityAssetReleaseContract(contract = W417_CITY_ASSET_RELEASE_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W417') errors.push('W417 identifier is invalid.');
  if (!Array.isArray(contract?.requiredFiles) || contract.requiredFiles.length < 7) errors.push('W417 must enumerate its source, gate, test and docs files.');
  if (!Array.isArray(contract?.requiredManifestFields) || contract.requiredManifestFields.join(',') !== 'schema,releaseId,quality,entries') errors.push('W417 manifest fields are incomplete.');
  if (!Array.isArray(contract?.requiredEntryFields) || contract.requiredEntryFields.length !== 8) errors.push('W417 asset-entry fields are incomplete.');
  if (!Array.isArray(contract?.requiredLodKeys) || contract.requiredLodKeys.join(',') !== 'lod0,lod1,lod2') errors.push('W417 requires all three LOD tiers.');
  if (!Array.isArray(contract?.requiredProofs) || contract.requiredProofs.length !== 4) errors.push('W417 requires art, licence, visual and device proof plans.');
  if (contract?.allowedTextureFormat !== 'KTX2/Basis Universal') errors.push('W417 requires KTX2/Basis Universal texture delivery.');
  if (!/no approved binary art/i.test(String(contract?.currentReleaseState || ''))) errors.push('W417 must state that no binary art is currently approved.');
  return Object.freeze(errors);
}
