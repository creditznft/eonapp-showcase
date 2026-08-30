/** W769I — physical authored-site gate and companion reaction for district upgrades. */
import { deriveEonExpanseW768IVisualFoundation } from '../w768/eon-expanse-w768i-my-frontier-visual-model.js';

export const EON_EXPANSE_W769I_UPGRADE_SITE_SCHEMA = 'eon.expanse.my-frontier-upgrade-site.w769i.v1';
const freeze = Object.freeze;
const finite = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

export function deriveEonExpanseW769IUpgradeSite({ upgradeView = null, playerPosition = {}, maxDistance = 7.5 } = {}) {
  const baseAction = upgradeView?.action || null;
  const plot = baseAction ? deriveEonExpanseW768IVisualFoundation({ unlocked: true }).plots.find((entry) => entry.plotId === baseAction.plotId) : null;
  const target = plot?.interactionAnchor || null;
  const distance = target ? Math.hypot(finite(playerPosition.x) - target.x, finite(playerPosition.z) - target.z) : Number.POSITIVE_INFINITY;
  const threshold = Math.max(3.2, Math.min(12, finite(maxDistance) || 7.5));
  const nearSite = Boolean(upgradeView?.available && target && distance <= threshold);
  const siteToken = target ? `${baseAction.plotId}:upgrade:${Math.round(target.x * 10)}:${Math.round(target.z * 10)}:${Math.round(threshold * 10)}` : '';
  return freeze({
    schema: EON_EXPANSE_W769I_UPGRADE_SITE_SCHEMA,
    available: nearSite,
    nearSite,
    distance,
    threshold,
    status: !upgradeView?.available ? 'district-upgrade-unavailable' : nearSite ? 'physical-upgrade-site-ready' : 'travel-to-district-upgrade-site',
    detail: nearSite ? 'The player is physically present at the authored district. The operational upgrade may be confirmed explicitly.' : 'Travel to the authored district before confirming the operational upgrade.',
    action: nearSite ? freeze({ ...baseAction, siteToken, target, label: `Activate operational ${baseAction.buildingId}`, physicalPresenceRequired: true }) : null,
    companionReaction: nearSite ? freeze({ id: `my-frontier-upgrade:${baseAction.plotId}`, kind: 'my-frontier-upgrade', action: 'upgrade-terminal', interactionAction: 'upgrade-terminal', world: target, distance, buildingId: baseAction.buildingId, plotId: baseAction.plotId }) : null,
    remoteUpgradeAllowed: false,
    automaticMovement: false,
    grantsXp: false,
    mutatesMissionState: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW769IUpgradeSite(view = null, { explicitUserAction = false, expectedSiteToken = '', expectedPlotId = '', expectedBuildingId = '', expectedPermitId = '', expectedSourceReceiptId = '' } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const action = view?.action || null;
  if (view?.schema !== EON_EXPANSE_W769I_UPGRADE_SITE_SCHEMA || !view.available || !view.nearSite || !action || !view.companionReaction) return freeze({ ok: false, reason: 'physical-district-upgrade-site-required' });
  if (expectedSiteToken && action.siteToken !== String(expectedSiteToken)) return freeze({ ok: false, reason: 'district-upgrade-site-changed' });
  if (expectedPlotId && action.plotId !== String(expectedPlotId)) return freeze({ ok: false, reason: 'district-upgrade-site-plot-changed' });
  if (expectedBuildingId && action.buildingId !== String(expectedBuildingId)) return freeze({ ok: false, reason: 'district-upgrade-site-building-changed' });
  if (expectedPermitId && action.permitId !== String(expectedPermitId)) return freeze({ ok: false, reason: 'district-upgrade-site-permit-changed' });
  if (expectedSourceReceiptId && action.sourceReceiptId !== String(expectedSourceReceiptId)) return freeze({ ok: false, reason: 'district-upgrade-site-receipt-changed' });
  return freeze({ ok: true, action, companionReaction: view.companionReaction, remoteUpgradeAllowed: false, automaticMovement: false, grantsXp: false });
}

export default freeze({ EON_EXPANSE_W769I_UPGRADE_SITE_SCHEMA, deriveEonExpanseW769IUpgradeSite, validateEonExpanseW769IUpgradeSite });
