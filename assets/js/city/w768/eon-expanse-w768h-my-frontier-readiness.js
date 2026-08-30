/** W768H — truthful My Frontier construction-readiness projection. */
import { createEonExpanseW768AMyFrontierLayoutContract } from './eon-expanse-w768a-my-frontier-layout-contract.js';
import { EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA } from './eon-expanse-w768b-my-frontier-state.js';
import { EON_EXPANSE_W767W_PRODUCTIVE_RECEIPT_POLICIES } from '../w766/eon-expanse-w767w-productive-receipt-bridge.js';

export const EON_EXPANSE_W768H_READINESS_SCHEMA = 'eon.expanse.my-frontier-readiness.w768h.v1';
const freeze = Object.freeze;
const contract = createEonExpanseW768AMyFrontierLayoutContract();
const workspacePolicy = new Map(EON_EXPANSE_W767W_PRODUCTIVE_RECEIPT_POLICIES.map((entry) => [entry.missionId, entry]));

function byPlot(entries = []) {
  return new Map((Array.isArray(entries) ? entries : []).map((entry) => [String(entry?.plotId || ''), entry]));
}

function safeReason(value = '') {
  return String(value || '').replace(/[^a-z0-9:_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 140);
}

export function deriveEonExpanseW768HMyFrontierReadiness({
  myFrontierState = null,
  constructionProjection = null,
  availability = [],
  permitAssessments = []
} = {}) {
  const unlocked = myFrontierState?.schema === EON_EXPANSE_W768B_MY_FRONTIER_STATE_SCHEMA && myFrontierState.unlocked === true;
  const constructed = byPlot(constructionProjection?.plots);
  const availabilityMap = byPlot(availability);
  const assessmentMap = byPlot(permitAssessments);

  const rows = freeze(contract.plots.map((plot) => {
    const buildingId = String(myFrontierState?.buildingChoices?.[plot.id] || '');
    const building = contract.buildingCatalog[buildingId] || null;
    const construction = constructed.get(plot.id) || null;
    const available = availabilityMap.get(plot.id) || null;
    const assessment = assessmentMap.get(plot.id) || null;
    const constructedBuildingId = construction?.status === 'constructed' ? String(construction.constructedBuildingId || '') : '';
    const permit = assessment?.permit || null;
    const verification = assessment?.verification || null;
    const missionId = String(available?.sourceMissionId || permit?.sourceMissionId || '');
    const productive = workspacePolicy.get(missionId) || null;

    let status = 'choice-required';
    let detail = 'Choose one approved building for this authored plot.';
    let action = null;
    if (!unlocked) {
      status = 'locked';
      detail = 'Enter My Frontier to activate starter planning. Signal Frontier completion is not required for world entry.';
    } else if (constructedBuildingId) {
      status = 'constructed';
      detail = 'Verified construction record exists. Visual presentation remains bound to the canonical My Frontier renderer.';
    } else if (!buildingId) {
      status = 'choice-required';
    } else if (available?.authority === 'pending') {
      status = 'receipt-bridge-pending';
      detail = 'This building is planned, but its maintained native receipt bridge is not available yet.';
    } else if (permit?.ok && verification?.ok) {
      status = 'permit-ready';
      detail = 'The exact current receipt is verified. Physical construction confirmation stays unavailable until the canonical renderer can present the building truthfully.';
    } else if (verification?.reason === 'productive-result-claim-required') {
      status = 'verified-result-claim-required';
      detail = 'A genuine native result exists. Claim it through Living frontier activities before construction can be authorized.';
    } else if (available?.authority === 'productive' && productive?.workspaceId) {
      status = 'work-required';
      detail = 'Complete and review the maintained EONAPP work, then return with its exact native receipt.';
      action = freeze({
        type: 'open-maintained-workspace',
        plotId: plot.id,
        buildingId,
        missionId,
        workspaceId: productive.workspaceId,
        expectedReason: safeReason(permit?.reason || verification?.reason || 'verified-native-outcome-required'),
        label: `Review work for ${building?.label || buildingId}`,
        explicitUserActionRequired: true,
        automaticCompletion: false
      });
    } else if (available?.authority === 'campaign') {
      status = 'campaign-receipt-blocked';
      detail = 'The current Signal Frontier finale receipt could not be revalidated.';
    } else {
      status = 'authority-unavailable';
      detail = 'Construction authority is unavailable and no progress will be fabricated.';
    }

    return freeze({
      plotId: plot.id,
      district: plot.district,
      plotLabel: plot.label,
      buildingId,
      buildingLabel: building?.label || '',
      constructedBuildingId,
      status,
      detail,
      authority: String(available?.authority || ''),
      sourceMissionId: missionId,
      unavailableReason: safeReason(available?.unavailableReason || permit?.reason || verification?.reason || ''),
      action,
      automaticConstruction: false,
      privateContentStored: false
    });
  }));

  const actionableRows = rows.filter((entry) => entry.action?.type === 'open-maintained-workspace');
  const readyCount = rows.filter((entry) => entry.status === 'permit-ready').length;
  const constructedCount = rows.filter((entry) => entry.status === 'constructed').length;
  const pendingCount = rows.filter((entry) => ['receipt-bridge-pending', 'verified-result-claim-required', 'work-required', 'campaign-receipt-blocked', 'authority-unavailable'].includes(entry.status)).length;
  return freeze({
    schema: EON_EXPANSE_W768H_READINESS_SCHEMA,
    visible: unlocked,
    unlocked,
    rows,
    readyCount,
    constructedCount,
    pendingCount,
    action: actionableRows[0]?.action || null,
    rendererReady: false,
    physicalConstructionAvailable: false,
    automaticConstruction: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW768HReadinessAction(view = null, {
  explicitUserAction = false,
  expectedPlotId = '',
  expectedBuildingId = '',
  expectedWorkspaceId = '',
  expectedReason = ''
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const action = view?.action || null;
  if (!view?.unlocked || action?.type !== 'open-maintained-workspace') return freeze({ ok: false, reason: 'my-frontier-work-action-unavailable' });
  if (expectedPlotId && action.plotId !== String(expectedPlotId)) return freeze({ ok: false, reason: 'construction-plot-selection-changed' });
  if (expectedBuildingId && action.buildingId !== String(expectedBuildingId)) return freeze({ ok: false, reason: 'construction-building-selection-changed' });
  if (expectedWorkspaceId && action.workspaceId !== String(expectedWorkspaceId)) return freeze({ ok: false, reason: 'construction-workspace-selection-changed' });
  if (expectedReason && action.expectedReason !== safeReason(expectedReason)) return freeze({ ok: false, reason: 'construction-readiness-changed' });
  return freeze({ ok: true, action, automaticCompletion: false, automaticConstruction: false, mutatesProgression: false });
}

export default freeze({
  EON_EXPANSE_W768H_READINESS_SCHEMA,
  deriveEonExpanseW768HMyFrontierReadiness,
  validateEonExpanseW768HReadinessAction
});
