/** W769D — receipt-backed fixed district upgrade authority for verified My Frontier construction. */
import { EON_EXPANSE_W768C_CONSTRUCTION_POLICIES } from '../w768/eon-expanse-w768c-my-frontier-construction-permit.js';
import { validateEonExpanseW767WProductiveReceipt } from '../w766/eon-expanse-w767w-productive-receipt-bridge.js';

export const EON_EXPANSE_W769D_DISTRICT_UPGRADE_SCHEMA = 'eon.expanse.my-frontier-district-upgrade.w769d.v1';
const freeze = Object.freeze;
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,319}$/i;

const safeConstruction = (value = null) => {
  const plotId = String(value?.plotId || '');
  const buildingId = String(value?.buildingId || '');
  const sourceReceiptId = String(value?.sourceReceiptId || '');
  const constructedAt = Number(value?.constructedAt || 0);
  if (!SAFE_ID.test(plotId) || !SAFE_ID.test(buildingId) || !SAFE_ID.test(sourceReceiptId) || !Number.isFinite(constructedAt) || constructedAt <= 0) return null;
  return freeze({ plotId, buildingId, sourceReceiptId, constructedAt });
};

export function deriveEonExpanseW769DDistrictUpgrade({ constructionRecord = null, currentLevel = 1, workspaceReceipt = null, nativePlan = null } = {}) {
  const construction = safeConstruction(constructionRecord);
  if (!construction) return freeze({ schema: EON_EXPANSE_W769D_DISTRICT_UPGRADE_SCHEMA, available: false, status: 'verified-construction-required', currentLevel: 0, targetLevel: 1, action: null });
  const level = Math.max(1, Math.min(2, Number(currentLevel || 1)));
  if (level >= 2) return freeze({ schema: EON_EXPANSE_W769D_DISTRICT_UPGRADE_SCHEMA, available: false, status: 'operational-upgrade-complete', currentLevel: 2, targetLevel: 3, detail: 'The operational district upgrade is verified. Landmark-level art and receipt authority remain pending.', action: null, levelThreeAuthorityPending: true, automaticUpgrade: false, grantsXp: false });
  const policy = EON_EXPANSE_W768C_CONSTRUCTION_POLICIES[construction.buildingId] || null;
  if (policy?.authority !== 'productive' || !policy.missionId) return freeze({ schema: EON_EXPANSE_W769D_DISTRICT_UPGRADE_SCHEMA, available: false, status: policy?.authority === 'pending' ? policy.unavailableReason : 'native-district-upgrade-receipt-pending', currentLevel: 1, targetLevel: 2, plotId: construction.plotId, buildingId: construction.buildingId, action: null, reviewFirst: true, automaticUpgrade: false, grantsXp: false });
  const verified = validateEonExpanseW767WProductiveReceipt({ missionId: policy.missionId, workspaceReceipt, nativePlan });
  if (!verified.ok) return freeze({ schema: EON_EXPANSE_W769D_DISTRICT_UPGRADE_SCHEMA, available: false, status: verified.reason || 'fresh-native-receipt-required', currentLevel: 1, targetLevel: 2, plotId: construction.plotId, buildingId: construction.buildingId, sourceMissionId: policy.missionId, workspaceId: verified.workspaceId || '', action: null, reviewFirst: true, automaticUpgrade: false, grantsXp: false });
  const receipt = verified.receipt;
  if (receipt.id === construction.sourceReceiptId) return freeze({ schema: EON_EXPANSE_W769D_DISTRICT_UPGRADE_SCHEMA, available: false, status: 'fresh-native-receipt-required', currentLevel: 1, targetLevel: 2, plotId: construction.plotId, buildingId: construction.buildingId, sourceMissionId: policy.missionId, workspaceId: receipt.workspaceId, action: null, reusedConstructionReceiptRejected: true, automaticUpgrade: false, grantsXp: false });
  if (Number(receipt.verifiedAt || 0) <= construction.constructedAt) return freeze({ schema: EON_EXPANSE_W769D_DISTRICT_UPGRADE_SCHEMA, available: false, status: 'post-construction-native-receipt-required', currentLevel: 1, targetLevel: 2, plotId: construction.plotId, buildingId: construction.buildingId, sourceMissionId: policy.missionId, workspaceId: receipt.workspaceId, action: null, automaticUpgrade: false, grantsXp: false });
  const permitId = `my-frontier-upgrade:${construction.plotId}:${construction.buildingId}:2:${receipt.id}`;
  const action = freeze({
    type: 'confirm-my-frontier-district-upgrade',
    label: `Upgrade ${construction.buildingId} to operational level`,
    plotId: construction.plotId,
    buildingId: construction.buildingId,
    currentLevel: 1,
    targetLevel: 2,
    permitId,
    sourceMissionId: policy.missionId,
    sourceReceiptId: receipt.id,
    sourceVerifiedAt: receipt.verifiedAt,
    constructionReceiptId: construction.sourceReceiptId,
    constructionTimestamp: construction.constructedAt,
    explicitUserActionRequired: true,
    reviewFirst: true
  });
  return freeze({ schema: EON_EXPANSE_W769D_DISTRICT_UPGRADE_SCHEMA, available: true, status: 'operational-upgrade-ready', currentLevel: 1, targetLevel: 2, plotId: construction.plotId, buildingId: construction.buildingId, sourceMissionId: policy.missionId, workspaceId: receipt.workspaceId, action, automaticUpgrade: false, grantsXp: false, privateContentStored: false });
}

export function validateEonExpanseW769DDistrictUpgradeAction(view = null, { explicitUserAction = false, expectedPlotId = '', expectedBuildingId = '', expectedPermitId = '', expectedSourceReceiptId = '' } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const action = view?.action || null;
  if (view?.schema !== EON_EXPANSE_W769D_DISTRICT_UPGRADE_SCHEMA || view.available !== true || !action) return freeze({ ok: false, reason: view?.status || 'district-upgrade-unavailable' });
  if (expectedPlotId && action.plotId !== String(expectedPlotId)) return freeze({ ok: false, reason: 'district-upgrade-plot-changed' });
  if (expectedBuildingId && action.buildingId !== String(expectedBuildingId)) return freeze({ ok: false, reason: 'district-upgrade-building-changed' });
  if (expectedPermitId && action.permitId !== String(expectedPermitId)) return freeze({ ok: false, reason: 'district-upgrade-permit-changed' });
  if (expectedSourceReceiptId && action.sourceReceiptId !== String(expectedSourceReceiptId)) return freeze({ ok: false, reason: 'district-upgrade-receipt-changed' });
  return freeze({ ok: true, action, automaticUpgrade: false, grantsXp: false, mutatesNativeAuthority: false, privateContentStored: false });
}

export default freeze({ EON_EXPANSE_W769D_DISTRICT_UPGRADE_SCHEMA, deriveEonExpanseW769DDistrictUpgrade, validateEonExpanseW769DDistrictUpgradeAction });
