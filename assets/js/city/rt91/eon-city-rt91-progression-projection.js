/**
 * RT91 — unified read-only progression projection.
 * Existing world authorities remain the only writers/awarders.
 */
import { buildEonExpanseW766EMissionBoard, EON_EXPANSE_W766E_CAMPAIGN } from '../w766/eon-expanse-w766e-mission-runtime.js';
import { deriveEonExpanseW795AStormMissionView } from '../w795/eon-expanse-w795a-storm-sector-mission-runtime.js';
import { EON_EXPANSE_W768A_MY_FRONTIER_PLOTS, EON_EXPANSE_W768A_RESIDENT_SLOTS } from '../w768/eon-expanse-w768a-my-frontier-layout-contract.js';
import { deriveEonCityRt91SignalMasteryView } from './signal/eon-city-rt91-signal-mastery-runtime.js';
import { deriveEonCityRt91StormCampaignView } from './storm/eon-city-rt91-storm-campaign-runtime.js';
import { deriveEonCityRt91MyFrontierDistrictMissionView } from './my-frontier/eon-city-rt91-my-frontier-district-mission-runtime.js';

export const EON_CITY_RT91_PROGRESSION_PROJECTION_SCHEMA = 'eon.city.progression-projection.rt91.v1';
const freeze = Object.freeze;
const ratio = (value, total) => total > 0 ? Math.max(0, Math.min(1, Number(value || 0) / total)) : 0;

export function projectEonCityRt91Progression({ signalState = null, signalMasteryState = null, stormState = null, stormCampaignState = null, myFrontierState = null, myFrontierDistrictMissionState = null, generatedContractStats = {} } = {}) {
  const signal = buildEonExpanseW766EMissionBoard(signalState || undefined);
  const signalMastery = deriveEonCityRt91SignalMasteryView({ state: signalMasteryState || undefined, signalState });
  const storm = deriveEonExpanseW795AStormMissionView(stormState);
  const stormCampaign = deriveEonCityRt91StormCampaignView({ state: stormCampaignState || undefined, foundationState: stormState });
  const myDistrict = deriveEonCityRt91MyFrontierDistrictMissionView({ state: myFrontierDistrictMissionState || undefined, myFrontierState });
  const choices = myFrontierState?.buildingChoices && typeof myFrontierState.buildingChoices === 'object' ? myFrontierState.buildingChoices : {};
  const residents = myFrontierState?.residents && typeof myFrontierState.residents === 'object' ? myFrontierState.residents : {};
  const constructedPlotCount = Object.keys(choices).filter((plotId) => EON_EXPANSE_W768A_MY_FRONTIER_PLOTS.some((plot) => plot.id === plotId)).length;
  const residentCount = Object.keys(residents).filter((slotId) => EON_EXPANSE_W768A_RESIDENT_SLOTS.some((slot) => slot.id === slotId)).length;
  const contractCompleted = Math.max(0, Number(generatedContractStats?.completed || 0));
  const contractOffered = Math.max(contractCompleted, Number(generatedContractStats?.offered || 0));
  return freeze({
    schema: EON_CITY_RT91_PROGRESSION_PROJECTION_SCHEMA,
    worlds: freeze({
      'signal-frontier': freeze({
        campaignCompleted: signal.completion.completed,
        campaignTotal: EON_EXPANSE_W766E_CAMPAIGN.length,
        campaignRatio: ratio(signal.completion.completed, EON_EXPANSE_W766E_CAMPAIGN.length),
        campaignComplete: signal.completion.campaignComplete,
        currentLevel: signal.currentLevel,
        existingXpDisplay: signal.totalXp,
        zoneMasteryCompleted: signalMastery.completedMissionCount,
        zoneMasteryTotal: signalMastery.totalMissionCount,
        zoneMasteryRatio: ratio(signalMastery.completedMissionCount, signalMastery.totalMissionCount)
      }),
      'storm-sector': freeze({
        campaignCompleted: storm.completedMissionCount,
        campaignTotal: storm.totalMissionCount,
        campaignRatio: ratio(storm.completedMissionCount, storm.totalMissionCount),
        objectiveCompleted: storm.completedObjectiveCount,
        objectiveTotal: storm.totalObjectiveCount,
        campaignComplete: storm.regionCompleted,
        livingCampaignCompleted: stormCampaign.completedMissionCount,
        livingCampaignTotal: stormCampaign.totalMissionCount,
        livingCampaignRatio: ratio(stormCampaign.completedMissionCount, stormCampaign.totalMissionCount),
        livingCampaignComplete: stormCampaign.campaignComplete,
        livingCampaignAvailable: storm.regionCompleted
      }),
      'my-frontier': freeze({
        unlocked: myFrontierState?.unlocked === true,
        constructedPlotCount,
        plotTotal: EON_EXPANSE_W768A_MY_FRONTIER_PLOTS.length,
        constructionRatio: ratio(constructedPlotCount, EON_EXPANSE_W768A_MY_FRONTIER_PLOTS.length),
        residentCount,
        residentSlotTotal: EON_EXPANSE_W768A_RESIDENT_SLOTS.length,
        residentRatio: ratio(residentCount, EON_EXPANSE_W768A_RESIDENT_SLOTS.length),
        districtCampaignCompleted: myDistrict.completedMissionCount,
        districtCampaignTotal: myDistrict.totalMissionCount,
        districtCampaignRatio: ratio(myDistrict.completedMissionCount, myDistrict.totalMissionCount),
        districtCampaignComplete: myDistrict.campaignComplete
      })
    }),
    repeatableContracts: freeze({ completed: contractCompleted, offered: contractOffered, completionRatio: ratio(contractCompleted, contractOffered) }),
    projectionOnly: true,
    awardsXp: false,
    writesProgression: false,
    createsUnlock: false,
    privateContentStored: false
  });
}

export function validateEonCityRt91ProgressionProjection(projection = {}) {
  const errors = [];
  if (projection?.schema !== EON_CITY_RT91_PROGRESSION_PROJECTION_SCHEMA) errors.push('schema');
  for (const worldId of ['signal-frontier', 'storm-sector', 'my-frontier']) if (!projection?.worlds?.[worldId]) errors.push(`world:${worldId}`);
  if (projection?.projectionOnly !== true || projection?.awardsXp !== false || projection?.writesProgression !== false || projection?.createsUnlock !== false) errors.push('authority-boundary');
  if (projection?.privateContentStored !== false) errors.push('privacy');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_CITY_RT91_PROGRESSION_PROJECTION_SCHEMA, projectEonCityRt91Progression, validateEonCityRt91ProgressionProjection });
