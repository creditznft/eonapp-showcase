/** W768G — explicit, approved-only My Frontier building planning action. */
import { createEonExpanseW768AMyFrontierLayoutContract } from './eon-expanse-w768a-my-frontier-layout-contract.js';
import { EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA } from './eon-expanse-w768b-my-frontier-state.js';

export const EON_EXPANSE_W768G_BUILDING_CHOICE_SCHEMA = 'eon.expanse.my-frontier-building-choice.w768g.v1';
const freeze = Object.freeze;
const contract = createEonExpanseW768AMyFrontierLayoutContract();

function constructionByPlot(projection = null) {
  return new Map((Array.isArray(projection?.plots) ? projection.plots : []).map((entry) => [String(entry?.plotId || ''), entry]));
}

export function deriveEonExpanseW768GBuildingChoiceModel({
  myFrontierState = null,
  constructionProjection = null,
  selectedPlotId = '',
  selectedBuildingId = ''
} = {}) {
  const unlocked = myFrontierState?.schema === EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA && myFrontierState.unlocked === true;
  const constructed = constructionByPlot(constructionProjection);
  const plotOptions = freeze(contract.plots
    .filter((plot) => !plot.requiredBuildingId)
    .map((plot) => {
      const construction = constructed.get(plot.id) || null;
      const constructedBuildingId = construction?.status === 'constructed' ? String(construction.constructedBuildingId || '') : '';
      const currentBuildingId = String(myFrontierState?.buildingChoices?.[plot.id] || '');
      return freeze({
        plotId: plot.id,
        district: plot.district,
        label: plot.label,
        currentBuildingId,
        constructedBuildingId,
        selectable: unlocked && !constructedBuildingId,
        buildings: freeze(plot.allowedBuildingIds.map((buildingId) => {
          const building = contract.buildingCatalog[buildingId];
          return freeze({
            buildingId,
            label: building?.label || buildingId,
            purpose: building?.purpose || '',
            nativeRoute: building?.nativeRoute || '',
            currentlyPlanned: currentBuildingId === buildingId,
            automaticExecution: false,
            privateContentStored: false
          });
        }))
      });
    }));

  const selectedPlot = plotOptions.find((entry) => entry.plotId === String(selectedPlotId || '')) || null;
  const selectedBuilding = selectedPlot?.buildings.find((entry) => entry.buildingId === String(selectedBuildingId || '')) || null;
  let unavailableReason = '';
  if (!unlocked) unavailableReason = 'my-frontier-locked';
  else if (!selectedPlot) unavailableReason = selectedPlotId ? 'plot-not-selectable' : 'plot-selection-required';
  else if (!selectedPlot.selectable) unavailableReason = 'plot-already-constructed';
  else if (!selectedBuilding) unavailableReason = selectedBuildingId ? 'building-not-allowed-for-plot' : 'building-selection-required';
  else if (selectedPlot.currentBuildingId === selectedBuilding.buildingId) unavailableReason = 'building-already-planned';

  const action = unavailableReason ? null : freeze({
    type: 'plan-my-frontier-building',
    plotId: selectedPlot.plotId,
    buildingId: selectedBuilding.buildingId,
    expectedCurrentBuildingId: selectedPlot.currentBuildingId,
    explicitUserActionRequired: true
  });

  return freeze({
    schema: EON_EXPANSE_W768G_BUILDING_CHOICE_SCHEMA,
    visible: unlocked,
    unlocked,
    plotOptions,
    selectedPlotId: selectedPlot?.plotId || '',
    selectedBuildingId: selectedBuilding?.buildingId || '',
    unavailableReason,
    action,
    rawCoordinatesAccepted: false,
    automaticSelection: false,
    automaticConstruction: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW768GBuildingChoiceAction(model = null, {
  explicitUserAction = false,
  expectedPlotId = '',
  expectedBuildingId = '',
  expectedCurrentBuildingId = ''
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (!model?.unlocked) return freeze({ ok: false, reason: 'my-frontier-locked' });
  if (!model.action) return freeze({ ok: false, reason: model?.unavailableReason || 'building-choice-unavailable' });
  if (expectedPlotId && model.action.plotId !== String(expectedPlotId)) return freeze({ ok: false, reason: 'plot-selection-changed' });
  if (expectedBuildingId && model.action.buildingId !== String(expectedBuildingId)) return freeze({ ok: false, reason: 'building-selection-changed' });
  if (model.action.expectedCurrentBuildingId !== String(expectedCurrentBuildingId || '')) return freeze({ ok: false, reason: 'existing-plan-changed' });
  return freeze({
    ok: true,
    action: model.action,
    automaticSelection: false,
    automaticConstruction: false,
    rawCoordinatesAccepted: false
  });
}

export default freeze({
  EON_EXPANSE_W768G_BUILDING_CHOICE_SCHEMA,
  deriveEonExpanseW768GBuildingChoiceModel,
  validateEonExpanseW768GBuildingChoiceAction
});
