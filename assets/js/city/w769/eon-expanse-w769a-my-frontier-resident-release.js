/** W769A — reviewed release actions for verified My Frontier residents. */
import { createEonExpanseW768AMyFrontierLayoutContract } from '../w768/eon-expanse-w768a-my-frontier-layout-contract.js';

export const EON_EXPANSE_W769A_RESIDENT_RELEASE_SCHEMA = 'eon.expanse.my-frontier-resident-release.w769a.v1';
const freeze = Object.freeze;
const layout = createEonExpanseW768AMyFrontierLayoutContract();
const labels = freeze({
  pathfinder: 'Pathfinder',
  navigator: 'Navigator',
  'maintenance-specialist': 'Maintenance Specialist',
  'creator-trade-master': 'Creator Trade Master',
  'vault-steward': 'Vault Steward',
  'eon-architect': 'EON Architect'
});

export function deriveEonExpanseW769AResidentReleaseView({ myFrontierState = null } = {}) {
  const visible = myFrontierState?.unlocked === true;
  const actions = visible ? layout.residentSlots.flatMap((slot) => {
    const residentId = String(myFrontierState?.residents?.[slot.id] || '');
    const receipt = myFrontierState?.residentReceipts?.[slot.id] || null;
    if (residentId !== slot.residentId || !receipt?.id || receipt.residentId !== residentId) return [];
    return [freeze({
      type: 'release-my-frontier-resident',
      label: `Release ${labels[residentId] || slot.label}`,
      slotId: slot.id,
      residentId,
      residentLabel: labels[residentId] || slot.label,
      receiptId: String(receipt.id),
      completedAt: Number(receipt.completedAt || 0),
      releaseToken: `${slot.id}:${residentId}:${receipt.id}`,
      explicitUserActionRequired: true,
      automaticRelease: false,
      awardsXp: false
    })];
  }) : [];
  return freeze({
    schema: EON_EXPANSE_W769A_RESIDENT_RELEASE_SCHEMA,
    visible,
    actions: freeze(actions),
    releaseCount: actions.length,
    automaticRelease: false,
    awardsXp: false,
    mutatesMissionState: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW769AResidentReleaseAction(view = null, {
  explicitUserAction = false,
  expectedSlotId = '',
  expectedResidentId = '',
  expectedReceiptId = '',
  expectedReleaseToken = ''
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (view?.schema !== EON_EXPANSE_W769A_RESIDENT_RELEASE_SCHEMA || view.visible !== true) return freeze({ ok: false, reason: 'resident-release-view-unavailable' });
  const action = (view.actions || []).find((entry) => entry.slotId === String(expectedSlotId || '')) || null;
  if (!action) return freeze({ ok: false, reason: 'resident-release-action-unavailable' });
  if (action.residentId !== String(expectedResidentId || action.residentId)
    || action.receiptId !== String(expectedReceiptId || action.receiptId)
    || action.releaseToken !== String(expectedReleaseToken || action.releaseToken)) return freeze({ ok: false, reason: 'resident-release-action-stale' });
  return freeze({ ok: true, action, automaticRelease: false, awardsXp: false, mutatesMissionState: false, privateContentStored: false });
}

export default freeze({
  EON_EXPANSE_W769A_RESIDENT_RELEASE_SCHEMA,
  deriveEonExpanseW769AResidentReleaseView,
  validateEonExpanseW769AResidentReleaseAction
});
