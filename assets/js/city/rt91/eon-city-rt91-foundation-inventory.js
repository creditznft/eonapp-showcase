/** RT91 — audited source inventory used to prevent rebuilding foundations that already exist. */
import { EON_CITY_W667_REGION_ARCHETYPES, getEonCityW667WorldGrammarSummary } from '../w667/eon-city-w667-expanse-world-grammar.js';
import { buildEonCityW681ExpanseMacroRegionPlan } from '../w681/eon-city-w681-expanse-macro-regions.js';
import { EON_EXPANSE_W766_ZONES, EON_EXPANSE_W766_HERO_ASSET_PLACEMENTS } from '../w766/eon-expanse-w766-region-contract.js';
import { EON_EXPANSE_W766E_CAMPAIGN } from '../w766/eon-expanse-w766e-mission-runtime.js';
import { EON_EXPANSE_W766F_SIDE_MISSIONS, EON_EXPANSE_W766F_EVENT_FAMILIES } from '../w766/eon-expanse-w766f-living-content.js';
import { EON_EXPANSE_W795A_STORM_MISSIONS } from '../w795/eon-expanse-w795a-storm-sector-mission-runtime.js';
import { EON_EXPANSE_W768A_MY_FRONTIER_PLOTS, EON_EXPANSE_W768A_BUILDING_CATALOG, EON_EXPANSE_W768A_RESIDENT_SLOTS } from '../w768/eon-expanse-w768a-my-frontier-layout-contract.js';
import { EON_EXPANSE_W768L_AUTHORED_ASSET_ENTRIES } from '../w768/eon-expanse-w768l-my-frontier-authored-asset-catalog.js';

export const EON_CITY_RT91_FOUNDATION_INVENTORY_SCHEMA = 'eon.city.flagship-foundation-inventory.rt91.v1';
const freeze = Object.freeze;

export function getEonCityRt91FoundationInventory() {
  const grammar = getEonCityW667WorldGrammarSummary();
  const macro = buildEonCityW681ExpanseMacroRegionPlan({ position: { x: 0, z: 0 }, seed: 'rt91-foundation-audit', quality: 'balanced' });
  const pendingAssets = EON_EXPANSE_W768L_AUTHORED_ASSET_ENTRIES.filter((entry) => entry.status === 'dedicated-authored-building-pending');
  return freeze({
    schema: EON_CITY_RT91_FOUNDATION_INVENTORY_SCHEMA,
    shared: freeze({
      deterministicWorldGrammar: true,
      regionArchetypeCount: EON_CITY_W667_REGION_ARCHETYPES.length,
      worldGrammarCombinationSpace: grammar.approximateCombinationSpace,
      practicalWorldBound: grammar.practicalWorldBound,
      detailedWindowCells: macro.detailedWindowCells,
      macroNeighbourhoodRegionCount: macro.macroRegionCount,
      macroArterialCount: macro.arterials.length,
      visibleHardBorder: macro.visibleHardBorder,
      oneDetailedFiveByFiveWindowPreserved: macro.detailedFiveByFiveStreamingPreserved
    }),
    signalFrontier: freeze({
      zoneCount: EON_EXPANSE_W766_ZONES.length,
      campaignMissionCount: EON_EXPANSE_W766E_CAMPAIGN.length,
      sideMissionCount: EON_EXPANSE_W766F_SIDE_MISSIONS.length,
      dynamicEventFamilyCount: EON_EXPANSE_W766F_EVENT_FAMILIES.length,
      authoredHeroPlacementCount: EON_EXPANSE_W766_HERO_ASSET_PLACEMENTS.length
    }),
    stormSector: freeze({
      missionFamilyCount: EON_EXPANSE_W795A_STORM_MISSIONS.length,
      objectiveCount: EON_EXPANSE_W795A_STORM_MISSIONS.flatMap((mission) => mission.objectives).length,
      existingFamilies: freeze(EON_EXPANSE_W795A_STORM_MISSIONS.map((mission) => mission.id))
    }),
    myFrontier: freeze({
      districtPlotCount: EON_EXPANSE_W768A_MY_FRONTIER_PLOTS.length,
      approvedBuildingCount: Object.keys(EON_EXPANSE_W768A_BUILDING_CATALOG).length,
      residentSlotCount: EON_EXPANSE_W768A_RESIDENT_SLOTS.length,
      dedicatedAuthoredAssetPendingCount: pendingAssets.length,
      dedicatedAuthoredAssetPendingIds: freeze(pendingAssets.map((entry) => entry.buildingId))
    }),
    conclusion: 'extend-existing-foundations-do-not-rebuild'
  });
}

export function validateEonCityRt91FoundationInventory(inventory = getEonCityRt91FoundationInventory()) {
  const errors = [];
  if (inventory?.schema !== EON_CITY_RT91_FOUNDATION_INVENTORY_SCHEMA) errors.push('schema');
  if (inventory?.shared?.deterministicWorldGrammar !== true || Number(inventory?.shared?.worldGrammarCombinationSpace || 0) < 1_000_000_000) errors.push('world-grammar-foundation');
  if (inventory?.shared?.detailedWindowCells !== 25 || inventory?.shared?.macroNeighbourhoodRegionCount !== 9 || inventory?.shared?.macroArterialCount !== 12 || inventory?.shared?.visibleHardBorder !== false) errors.push('macro-continuity-foundation');
  if (inventory?.signalFrontier?.zoneCount !== 5 || inventory?.signalFrontier?.campaignMissionCount < 7 || inventory?.signalFrontier?.sideMissionCount < 5) errors.push('signal-foundation');
  if (inventory?.stormSector?.missionFamilyCount < 3 || inventory?.stormSector?.objectiveCount < 9) errors.push('storm-foundation');
  if (inventory?.myFrontier?.districtPlotCount !== 7 || inventory?.myFrontier?.approvedBuildingCount < 19 || inventory?.myFrontier?.residentSlotCount < 6) errors.push('my-frontier-foundation');
  const expectedPending = ['design-pavilion', 'research-observatory', 'expedition-hangar', 'reflection-garden', 'vault-reveal-gallery'];
  const actualPending = new Set(inventory?.myFrontier?.dedicatedAuthoredAssetPendingIds || []);
  for (const id of expectedPending) if (!actualPending.has(id)) errors.push(`pending-art-truth:${id}`);
  if (inventory?.conclusion !== 'extend-existing-foundations-do-not-rebuild') errors.push('extension-strategy');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), inventory });
}

export default freeze({ EON_CITY_RT91_FOUNDATION_INVENTORY_SCHEMA, getEonCityRt91FoundationInventory, validateEonCityRt91FoundationInventory });
