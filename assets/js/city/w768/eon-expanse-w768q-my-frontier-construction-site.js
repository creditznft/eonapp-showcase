/** W768Q — physical-site gate for reviewed My Frontier construction. */
import { deriveEonExpanseW768IVisualFoundation } from './eon-expanse-w768i-my-frontier-visual-model.js';

export const EON_EXPANSE_W768Q_CONSTRUCTION_SITE_SCHEMA = 'eon.expanse.my-frontier-construction-site.w768q.v1';
const freeze = Object.freeze;
const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function deriveEonExpanseW768QConstructionSite({ constructionAction = null, playerPosition = {}, maxDistance = 7.5 } = {}) {
  const baseAction = constructionAction?.action || null;
  const plot = baseAction ? deriveEonExpanseW768IVisualFoundation({ unlocked: true }).plots.find((entry) => entry.plotId === baseAction.plotId) : null;
  const target = plot?.interactionAnchor || null;
  const distance = target ? Math.hypot(finite(playerPosition.x) - target.x, finite(playerPosition.z) - target.z) : Number.POSITIVE_INFINITY;
  const threshold = Math.max(3.2, Math.min(12, finite(maxDistance) || 7.5));
  const nearSite = Boolean(constructionAction?.available && target && distance <= threshold);
  const siteToken = target ? `${baseAction.plotId}:${Math.round(target.x * 10)}:${Math.round(target.z * 10)}:${Math.round(threshold * 10)}` : '';
  return freeze({
    schema: EON_EXPANSE_W768Q_CONSTRUCTION_SITE_SCHEMA,
    available: nearSite,
    nearSite,
    distance,
    threshold,
    status: !constructionAction?.available ? 'construction-action-unavailable' : nearSite ? 'physical-site-ready' : 'travel-to-construction-site',
    detail: nearSite ? 'The player is physically present at the authored plot. Construction may be confirmed explicitly.' : 'Travel to the authored plot before construction can be confirmed.',
    action: nearSite ? freeze({ ...baseAction, siteToken, target, label: `Construct ${baseAction.buildingLabel || baseAction.buildingId} foundation`, physicalPresenceRequired: true }) : null,
    companionReaction: nearSite ? freeze({
      id: `my-frontier-construction:${baseAction.plotId}`,
      kind: 'my-frontier-construction',
      action: 'construction-terminal',
      interactionAction: 'construction-terminal',
      world: target,
      distance,
      buildingId: baseAction.buildingId,
      plotId: baseAction.plotId
    }) : null,
    remoteConstructionAllowed: false,
    automaticMovement: false,
    grantsXp: false,
    mutatesMissionState: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW768QConstructionSite(view = null, { explicitUserAction = false, expectedSiteToken = '', expectedPlotId = '', expectedBuildingId = '', expectedPermitId = '', expectedSourceReceiptId = '', expectedRendererSchema = '' } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const action = view?.action || null;
  if (!view?.available || !view?.nearSite || !action || !view?.companionReaction) return freeze({ ok: false, reason: 'physical-construction-site-required' });
  if (expectedSiteToken && action.siteToken !== String(expectedSiteToken)) return freeze({ ok: false, reason: 'construction-site-changed' });
  if (expectedPlotId && action.plotId !== String(expectedPlotId)) return freeze({ ok: false, reason: 'construction-site-plot-changed' });
  if (expectedBuildingId && action.buildingId !== String(expectedBuildingId)) return freeze({ ok: false, reason: 'construction-site-building-changed' });
  if (expectedPermitId && action.permitId !== String(expectedPermitId)) return freeze({ ok: false, reason: 'construction-site-permit-changed' });
  if (expectedSourceReceiptId && action.sourceReceiptId !== String(expectedSourceReceiptId)) return freeze({ ok: false, reason: 'construction-site-receipt-changed' });
  if (expectedRendererSchema && action.rendererSchema !== String(expectedRendererSchema)) return freeze({ ok: false, reason: 'construction-site-renderer-changed' });
  return freeze({ ok: true, action, companionReaction: view.companionReaction, remoteConstructionAllowed: false, automaticMovement: false, grantsXp: false });
}

export default freeze({ EON_EXPANSE_W768Q_CONSTRUCTION_SITE_SCHEMA, deriveEonExpanseW768QConstructionSite, validateEonExpanseW768QConstructionSite });
