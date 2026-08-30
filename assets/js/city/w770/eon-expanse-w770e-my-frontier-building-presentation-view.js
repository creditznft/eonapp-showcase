/** W770E — privacy-safe Mission Board projection of My Frontier art truth. */
export const EON_EXPANSE_W770E_BUILDING_PRESENTATION_VIEW_SCHEMA = 'eon.expanse.my-frontier-building-presentation-view.w770e.v1';
const freeze = Object.freeze;

export function deriveEonExpanseW770EBuildingPresentationView({ planningView = {}, rendererSummary = {} } = {}) {
  const compositionSummary = rendererSummary?.buildingCompositions || {};
  const compositionByPlot = new Map((Array.isArray(compositionSummary?.plots) ? compositionSummary.plots : []).map((entry) => [String(entry?.plotId || ''), entry]));
  const rows = (Array.isArray(planningView?.rows) ? planningView.rows : []).map((entry) => {
    const composition = compositionByPlot.get(String(entry.plotId || '')) || null;
    const constructed = Boolean(entry.constructedBuildingId);
    let status = String(entry.status || 'empty');
    let detail = 'Choose and verify a building before authored art can be requested.';
    if (constructed && composition?.compositionReady) {
      status = 'authored-composition-presented';
      detail = `${composition.presentedPartCount}/${composition.requestedPartCount} authored components are visibly validated. Foundation remains truthful; scaffolding is hidden.`;
    } else if (constructed && composition?.status === 'rejected-authored-composition') {
      status = 'authored-composition-rejected';
      detail = `${composition.rejectedRequiredCount} required authored component${composition.rejectedRequiredCount === 1 ? '' : 's'} failed validation. Foundation and scaffolding remain visible.`;
    } else if (constructed && composition?.status === 'loading-authored-composition') {
      status = 'authored-composition-loading';
      detail = `${composition.presentedRequiredCount}/${composition.requiredPartCount} required authored components are visibly validated. Scaffolding remains until all required parts pass.`;
    } else if (constructed) {
      status = 'verified-foundation-scaffolding';
      detail = 'Verified construction is visible while the authored composition request is prepared.';
    } else if (entry.plannedBuildingId) {
      status = 'planned-hologram';
      detail = 'Planning hologram only. No building assets are requested before verified construction.';
    }
    return freeze({
      plotId: String(entry.plotId || ''),
      label: String(entry.label || ''),
      buildingId: String(entry.constructedBuildingId || entry.plannedBuildingId || ''),
      status,
      detail,
      compositionReady: composition?.compositionReady === true,
      requestedPartCount: Number(composition?.requestedPartCount || 0),
      presentedPartCount: Number(composition?.presentedPartCount || 0),
      rejectedRequiredCount: Number(composition?.rejectedRequiredCount || 0),
      scaffoldingSuppressed: composition?.suppressScaffolding === true,
      foundationPreserved: constructed,
      bespokeArtStatus: constructed ? 'bespoke-building-skin-pending' : 'not-applicable',
      privateContentStored: false
    });
  });
  return freeze({
    schema: EON_EXPANSE_W770E_BUILDING_PRESENTATION_VIEW_SCHEMA,
    visible: planningView?.visible === true,
    rows: freeze(rows),
    presentedCompositionCount: rows.filter((entry) => entry.compositionReady).length,
    loadingCompositionCount: rows.filter((entry) => entry.status === 'authored-composition-loading').length,
    rejectedCompositionCount: rows.filter((entry) => entry.status === 'authored-composition-rejected').length,
    truthfulFallbackCount: rows.filter((entry) => ['verified-foundation-scaffolding', 'authored-composition-loading', 'authored-composition-rejected'].includes(entry.status)).length,
    finishedBespokeBuildingCount: 0,
    privateContentStored: false,
    assetPathsExposed: false,
    automaticRetry: false
  });
}

export default freeze({ EON_EXPANSE_W770E_BUILDING_PRESENTATION_VIEW_SCHEMA, deriveEonExpanseW770EBuildingPresentationView });
