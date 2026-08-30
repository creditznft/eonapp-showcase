/** W768J — truthful planned/constructed visual-state projection for My Frontier. */
import { createEonExpanseW768AMyFrontierLayoutContract } from './eon-expanse-w768a-my-frontier-layout-contract.js';

export const EON_EXPANSE_W768J_PRESENTATION_SCHEMA = 'eon.expanse.my-frontier-presentation.w768j.v1';
const freeze = Object.freeze;
const contract = createEonExpanseW768AMyFrontierLayoutContract();

export function deriveEonExpanseW768JMyFrontierPresentation({ myFrontierState = {}, constructionProjection = {} } = {}) {
  const constructionByPlot = new Map((Array.isArray(constructionProjection?.plots) ? constructionProjection.plots : []).map((entry) => [String(entry?.plotId || ''), entry]));
  const plots = freeze(contract.plots.map((plot) => {
    const projected = constructionByPlot.get(plot.id) || null;
    const plannedBuildingId = String(myFrontierState?.buildingChoices?.[plot.id] || projected?.plannedBuildingId || '');
    const constructedBuildingId = String(projected?.constructedBuildingId || '');
    const selectedBuildingId = constructedBuildingId || plannedBuildingId;
    const building = contract.buildingCatalog[selectedBuildingId] || null;
    const status = constructedBuildingId ? 'constructed-foundation' : plannedBuildingId ? 'planned-hologram' : 'empty';
    return freeze({
      plotId: plot.id,
      district: plot.district,
      selectedBuildingId,
      plannedBuildingId,
      constructedBuildingId,
      buildingLabel: building?.label || '',
      footprint: building?.footprint || freeze({ width: 0, depth: 0, height: 0 }),
      status,
      hologramVisible: status === 'planned-hologram',
      foundationVisible: status === 'constructed-foundation',
      scaffoldingVisible: status === 'constructed-foundation',
      finishedHeroVisible: false,
      truthfulConstructionStage: status === 'constructed-foundation' ? 'verified-foundation-and-scaffolding' : status === 'planned-hologram' ? 'non-physical-plan-preview' : 'empty-authored-plot',
      privateContentStored: false
    });
  }));
  return freeze({
    schema: EON_EXPANSE_W768J_PRESENTATION_SCHEMA,
    unlocked: myFrontierState?.unlocked === true,
    plots,
    plannedCount: plots.filter((entry) => entry.status === 'planned-hologram').length,
    constructedFoundationCount: plots.filter((entry) => entry.status === 'constructed-foundation').length,
    finishedHeroCount: 0,
    automaticConstruction: false,
    rawCoordinatePlacementAllowed: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW768JMyFrontierPresentation(view = {}) {
  const errors = [];
  const plots = Array.isArray(view.plots) ? view.plots : [];
  if (view.schema !== EON_EXPANSE_W768J_PRESENTATION_SCHEMA) errors.push('schema-invalid');
  if (plots.length !== 7 || new Set(plots.map((entry) => entry.plotId)).size !== 7) errors.push('seven-unique-plots-required');
  for (const entry of plots) {
    if (!['empty', 'planned-hologram', 'constructed-foundation'].includes(entry.status)) errors.push(`plot-status-invalid:${entry.plotId || 'unknown'}`);
    if (entry.hologramVisible && entry.status !== 'planned-hologram') errors.push(`hologram-truth-invalid:${entry.plotId || 'unknown'}`);
    if ((entry.foundationVisible || entry.scaffoldingVisible) && entry.status !== 'constructed-foundation') errors.push(`construction-truth-invalid:${entry.plotId || 'unknown'}`);
    if (entry.finishedHeroVisible) errors.push(`finished-hero-premature:${entry.plotId || 'unknown'}`);
  }
  if (view.finishedHeroCount || view.automaticConstruction || view.rawCoordinatePlacementAllowed || view.privateContentStored) errors.push('product-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), plannedCount: Number(view.plannedCount || 0), constructedFoundationCount: Number(view.constructedFoundationCount || 0) });
}

export default freeze({ EON_EXPANSE_W768J_PRESENTATION_SCHEMA, deriveEonExpanseW768JMyFrontierPresentation, validateEonExpanseW768JMyFrontierPresentation });
