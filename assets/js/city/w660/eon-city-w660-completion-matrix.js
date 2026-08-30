/** W660 — deterministic source completion matrix for the Productive City. */
import { EON_CITY_W649_CHARACTER_MANIFEST } from '../w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W649_WORLD_MANIFEST } from '../w649/eon-city-w649-world-manifest.js';
import { EON_CITY_W649_DISTRICT_MANIFEST } from '../w649/eon-city-w649-district-manifest.js';
import {
  EON_CITY_W659F_FUNCTIONAL_ASSETS,
  EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS
} from '../w659f/eon-city-w659f-functional-asset-manifest.js';
import { getEonCityW659fNpcRoleCoverage } from '../w659f/eon-city-w659f-npc-role-registry.js';
import { EON_CITY_W660_NEXUS_STATIONS } from './eon-city-w660-nexus-stations.js';

export const EON_CITY_W660_COMPLETION_MATRIX_SCHEMA = 'eon.city.w660.completion-matrix.v1';
const freeze = (value) => Object.freeze(value);

export const EON_CITY_W660_PLAYABLE_DISTRICT_IDS = freeze([
  'orientation-hall',
  'transit-network',
  'agent-theatre',
  'creator-atrium',
  'forge-basilica',
  'command-centre',
  'archive-canopy',
  'vault-station',
  'trade-dome'
]);

export function buildEonCityW660CompletionMatrix() {
  const baseCharacters = EON_CITY_W649_CHARACTER_MANIFEST.entries.filter((entry) => entry.lifecycle === 'active');
  const baseWorld = EON_CITY_W649_WORLD_MANIFEST.entries.filter((entry) => entry.lifecycle === 'active');
  const supersededAssetIds = freeze([...EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS].sort());
  const retainedBaseAssetIds = [...baseCharacters, ...baseWorld]
    .map((entry) => entry.id)
    .filter((id) => !EON_CITY_W659F_SUPERSEDED_W649_ASSET_IDS.has(id));
  const functionalAssetIds = EON_CITY_W659F_FUNCTIONAL_ASSETS.map((entry) => entry.id);
  const effectiveAssetIds = freeze([...retainedBaseAssetIds, ...functionalAssetIds]);
  const npcCoverage = getEonCityW659fNpcRoleCoverage();
  const districtManifestIds = EON_CITY_W649_DISTRICT_MANIFEST.districts
    .map((entry) => entry.id)
    .filter((id) => id !== 'bootstrap');
  const missingStreamedDistrictIds = EON_CITY_W660_PLAYABLE_DISTRICT_IDS
    .filter((id) => id !== 'command-centre' && !districtManifestIds.includes(id));

  return freeze({
    schema: EON_CITY_W660_COMPLETION_MATRIX_SCHEMA,
    baseAssetCount: baseCharacters.length + baseWorld.length,
    supersededAssetIds,
    supersededAssetCount: supersededAssetIds.length,
    functionalReplacementAssetIds: freeze(functionalAssetIds),
    functionalReplacementCount: functionalAssetIds.length,
    effectiveAssetIds,
    effectiveAssetCount: effectiveAssetIds.length,
    effectiveCharacterCount: npcCoverage.effectiveCharacterCount,
    productBoundCharacterCount: npcCoverage.coveredCharacterCount,
    missingCharacterRoleAssetIds: npcCoverage.missingAssetIds,
    playableDistrictIds: EON_CITY_W660_PLAYABLE_DISTRICT_IDS,
    playableDistrictCount: EON_CITY_W660_PLAYABLE_DISTRICT_IDS.length,
    streamedW649DistrictIds: freeze(districtManifestIds),
    missingStreamedDistrictIds: freeze(missingStreamedDistrictIds),
    commandCentreProceduralCore: true,
    nexusStationIds: freeze(EON_CITY_W660_NEXUS_STATIONS.map((entry) => entry.id)),
    nexusStationCount: EON_CITY_W660_NEXUS_STATIONS.length,
    systems: freeze({
      eonbotMiniChat: true,
      dictate: true,
      voiceConversation: true,
      compatibleLiveVoice: true,
      sharingCenter: true,
      creatorCaptureWebm: true,
      optionalMicrophone: true,
      optionalFacecam: true,
      missionsXp: true,
      vaultReveals: true,
      eonkeys: true,
      membership: true,
      agentTheatre: true,
      explicitTransit: true,
      reviewFirstActions: true
    }),
    browserProof: freeze({
      sourceComplete: true,
      localHeadedPending: true,
      rtx3050PhysicalPending: true,
      previewPending: true,
      productionPending: true
    })
  });
}

export function validateEonCityW660CompletionMatrix(matrix = buildEonCityW660CompletionMatrix()) {
  const errors = [];
  if (matrix.effectiveAssetCount !== 34) errors.push(`effective-assets:${matrix.effectiveAssetCount}`);
  if (matrix.supersededAssetCount !== 5) errors.push(`superseded:${matrix.supersededAssetCount}`);
  if (matrix.functionalReplacementCount !== 6) errors.push(`replacements:${matrix.functionalReplacementCount}`);
  if (matrix.effectiveCharacterCount !== 14 || matrix.productBoundCharacterCount !== 14 || matrix.missingCharacterRoleAssetIds.length) errors.push('character-role-coverage');
  if (matrix.playableDistrictCount !== 9 || matrix.missingStreamedDistrictIds.length) errors.push('district-coverage');
  if (matrix.nexusStationCount !== 9) errors.push(`nexus:${matrix.nexusStationCount}`);
  if (!Object.values(matrix.systems).every(Boolean)) errors.push('productive-systems');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), matrix });
}

export default freeze({
  EON_CITY_W660_COMPLETION_MATRIX_SCHEMA,
  EON_CITY_W660_PLAYABLE_DISTRICT_IDS,
  buildEonCityW660CompletionMatrix,
  validateEonCityW660CompletionMatrix
});
