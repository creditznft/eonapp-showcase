/**
 * W768O — explicit My Frontier construction confirmation projection.
 *
 * A construction action is offered only when the exact current permit is valid
 * and the canonical renderer can truthfully show a verified foundation.
 */
export const EON_EXPANSE_W768O_CONSTRUCTION_ACTION_SCHEMA = 'eon.expanse.my-frontier-construction-action.w768o.v1';
const freeze = Object.freeze;

function rendererCanPresent(summary = {}) {
  return summary?.canonicalScene === true
    && summary?.oneEngine === true
    && summary?.oneScene === true
    && summary?.oneRenderLoop === true
    && Number(summary?.finishedHeroPrimitives || 0) === 0;
}

export function deriveEonExpanseW768OConstructionAction({ readiness = null, permit = null, rendererSummary = null } = {}) {
  const readyRow = readiness?.rows?.find?.((entry) => entry.status === 'permit-ready' && entry.plotId === permit?.plotId && entry.buildingId === permit?.buildingId) || null;
  const rendererReady = rendererCanPresent(rendererSummary);
  const available = Boolean(readiness?.unlocked && readyRow && permit?.ok === true && rendererReady);
  return freeze({
    schema: EON_EXPANSE_W768O_CONSTRUCTION_ACTION_SCHEMA,
    available,
    status: available ? 'construction-confirmation-ready' : !readyRow ? 'no-ready-permit' : !permit?.ok ? 'permit-invalid' : 'renderer-not-ready',
    detail: available
      ? 'The exact permit is verified. A separate explicit confirmation may create the persistent construction record and its truthful foundation presentation.'
      : !rendererReady
        ? 'Construction remains unavailable until the canonical renderer can present a verified foundation.'
        : 'No current verified construction permit is ready.',
    action: available ? freeze({
      type: 'confirm-my-frontier-construction',
      plotId: readyRow.plotId,
      buildingId: readyRow.buildingId,
      buildingLabel: readyRow.buildingLabel,
      permitId: String(permit.permitId || ''),
      sourceReceiptId: String(permit.sourceReceiptId || ''),
      rendererSchema: String(rendererSummary?.schema || ''),
      label: `Construct ${readyRow.buildingLabel || readyRow.buildingId} foundation`,
      explicitUserActionRequired: true,
      automaticConstruction: false
    }) : null,
    rendererReady,
    createsFinishedPrimitiveHero: false,
    grantsXp: false,
    mutatesMissionState: false,
    opensWorkspaceAutomatically: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW768OConstructionAction(view = null, {
  explicitUserAction = false,
  expectedPlotId = '',
  expectedBuildingId = '',
  expectedPermitId = '',
  expectedSourceReceiptId = '',
  expectedRendererSchema = ''
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const action = view?.action || null;
  if (!view?.available || action?.type !== 'confirm-my-frontier-construction') return freeze({ ok: false, reason: 'my-frontier-construction-action-unavailable' });
  if (expectedPlotId && action.plotId !== String(expectedPlotId)) return freeze({ ok: false, reason: 'construction-plot-changed' });
  if (expectedBuildingId && action.buildingId !== String(expectedBuildingId)) return freeze({ ok: false, reason: 'construction-building-changed' });
  if (expectedPermitId && action.permitId !== String(expectedPermitId)) return freeze({ ok: false, reason: 'construction-permit-changed' });
  if (expectedSourceReceiptId && action.sourceReceiptId !== String(expectedSourceReceiptId)) return freeze({ ok: false, reason: 'construction-receipt-changed' });
  if (expectedRendererSchema && action.rendererSchema !== String(expectedRendererSchema)) return freeze({ ok: false, reason: 'construction-renderer-changed' });
  return freeze({ ok: true, action, automaticConstruction: false, grantsXp: false, mutatesMissionState: false });
}

export default freeze({ EON_EXPANSE_W768O_CONSTRUCTION_ACTION_SCHEMA, deriveEonExpanseW768OConstructionAction, validateEonExpanseW768OConstructionAction });
