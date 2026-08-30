/** W770B — quality-aware authored composition request plan. */
import { EON_EXPANSE_W768A_MY_FRONTIER_PLOTS } from '../w768/eon-expanse-w768a-my-frontier-layout-contract.js';
import { getEonExpanseW770ABuildingComposition } from './eon-expanse-w770a-my-frontier-building-composition-catalog.js';

export const EON_EXPANSE_W770B_COMPOSITION_PLAN_SCHEMA = 'eon.expanse.my-frontier-building-composition-plan.w770b.v1';
const freeze = Object.freeze;
const QUALITY = freeze({ lite: 0, balanced: 1, cinematic: 2 });
const normalizeQuality = (value) => String(value || '').toLowerCase() in QUALITY ? String(value).toLowerCase() : 'balanced';

function rowsByPlot(presentation = {}) {
  return new Map((Array.isArray(presentation?.plots) ? presentation.plots : []).map((entry) => [String(entry?.plotId || ''), entry]));
}

export function deriveEonExpanseW770BCompositionPlan({ presentation = {}, quality = 'balanced' } = {}) {
  const resolvedQuality = normalizeQuality(quality);
  const qualityRank = QUALITY[resolvedQuality];
  const presentationRows = rowsByPlot(presentation);
  const plots = EON_EXPANSE_W768A_MY_FRONTIER_PLOTS.map((plot) => {
    const current = presentationRows.get(plot.id) || {};
    const buildingId = String(current.constructedBuildingId || current.selectedBuildingId || '');
    const verifiedConstruction = current.status === 'constructed-foundation'
      && current.foundationVisible === true
      && current.scaffoldingVisible === true
      && Boolean(current.constructedBuildingId);
    const composition = buildingId ? getEonExpanseW770ABuildingComposition(buildingId) : null;
    let status = 'not-requested';
    let reason = 'No verified construction requests an authored composition.';
    let parts = freeze([]);
    if (verifiedConstruction && composition?.status === 'authored-composition-ready') {
      parts = freeze(composition.parts
        .filter((component) => QUALITY[component.minimumQuality] <= qualityRank)
        .map((component) => freeze({
          ...component,
          plotId: plot.id,
          buildingId,
          compositionRole: composition.compositionRole,
          requiredForQuality: component.required === true,
          requestKey: `${plot.id}:${buildingId}:${component.id}:${component.variants?.primary?.path || ''}`
        })));
      status = 'request-authored-composition';
      reason = `Request ${parts.length} validated authored component${parts.length === 1 ? '' : 's'} for ${resolvedQuality} quality.`;
    } else if (verifiedConstruction) {
      status = 'composition-unavailable';
      reason = 'No approved authored composition is available; preserve foundation and scaffolding.';
    }
    return freeze({
      plotId: plot.id,
      district: plot.district,
      buildingId,
      status,
      reason,
      requestComposition: status === 'request-authored-composition',
      parts,
      requestedPartCount: parts.length,
      requiredPartCount: parts.filter((component) => component.requiredForQuality).length,
      preserveFoundation: true,
      preserveScaffoldingUntilValidated: true,
      suppressScaffoldingBeforeValidation: false,
      finishedBespokeBuilding: false,
      quality: resolvedQuality,
      rawCoordinatesAccepted: false
    });
  });
  return freeze({
    schema: EON_EXPANSE_W770B_COMPOSITION_PLAN_SCHEMA,
    quality: resolvedQuality,
    plots: freeze(plots),
    requestedPlotCount: plots.filter((entry) => entry.requestComposition).length,
    requestedPartCount: plots.reduce((sum, entry) => sum + entry.requestedPartCount, 0),
    plannedHologramsRequestAssets: false,
    preserveFoundation: true,
    suppressScaffoldingBeforeValidation: false,
    automaticRetry: false,
    remoteAssets: false,
    privateContentStored: false
  });
}

export default freeze({ EON_EXPANSE_W770B_COMPOSITION_PLAN_SCHEMA, deriveEonExpanseW770BCompositionPlan });
