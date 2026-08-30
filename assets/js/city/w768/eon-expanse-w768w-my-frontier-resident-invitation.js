/**
 * W768W — reviewed resident invitation presentation and action validation.
 *
 * The view exposes only authored slots and exact W768V receipt identities. It
 * cannot invite automatically, award XP or mutate campaign authority.
 */

import { createEonExpanseW768AMyFrontierLayoutContract } from './eon-expanse-w768a-my-frontier-layout-contract.js';
import { listEonExpanseW768VResidentAvailability } from './eon-expanse-w768v-my-frontier-resident-authority.js';

export const EON_EXPANSE_W768W_RESIDENT_INVITATION_SCHEMA = 'eon.expanse.my-frontier-resident-invitation.w768w.v1';
const freeze = (value) => Object.freeze(value);
const layout = createEonExpanseW768AMyFrontierLayoutContract();
const labels = freeze({
  pathfinder: 'Pathfinder',
  navigator: 'Navigator',
  'maintenance-specialist': 'Maintenance Specialist',
  'creator-trade-master': 'Creator Trade Master',
  'vault-steward': 'Vault Steward',
  'eon-architect': 'EON Architect'
});

export function deriveEonExpanseW768WResidentInvitationView({ myFrontierState = null, missionLedger = null } = {}) {
  const unlocked = myFrontierState?.unlocked === true;
  const availability = listEonExpanseW768VResidentAvailability({ missionLedger });
  const rows = freeze(layout.residentSlots.map((slot) => {
    const authority = availability.find((entry) => entry.slotId === slot.id) || null;
    const invited = myFrontierState?.residents?.[slot.id] === slot.residentId;
    const status = invited ? 'invited-signal-active' : unlocked ? authority?.status || 'authority-unavailable' : 'my-frontier-locked';
    return freeze({
      slotId: slot.id,
      residentId: slot.residentId,
      label: labels[slot.residentId] || slot.label,
      stationLabel: slot.label,
      invited,
      status,
      receiptId: authority?.receipt?.id || '',
      completedAt: Number(authority?.receipt?.completedAt || 0),
      authoredCharacterPresented: false,
      privateContentStored: false
    });
  }));
  const ready = rows.find((row) => !row.invited && row.status === 'receipt-ready' && row.receiptId) || null;
  const action = ready ? freeze({
    type: 'invite-my-frontier-resident',
    label: `Invite ${ready.label}`,
    slotId: ready.slotId,
    residentId: ready.residentId,
    receiptId: ready.receiptId,
    completedAt: ready.completedAt,
    explicitUserActionRequired: true,
    automaticInvitation: false,
    awardsXp: false
  }) : null;
  return freeze({
    schema: EON_EXPANSE_W768W_RESIDENT_INVITATION_SCHEMA,
    visible: unlocked,
    rows,
    readyCount: rows.filter((row) => row.status === 'receipt-ready').length,
    invitedCount: rows.filter((row) => row.invited).length,
    action,
    privateContentStored: false,
    automaticInvitation: false,
    awardsXp: false
  });
}

export function validateEonExpanseW768WResidentInvitationAction(view = null, {
  explicitUserAction = false,
  expectedSlotId = '',
  expectedResidentId = '',
  expectedReceiptId = '',
  expectedCompletedAt = 0
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (view?.schema !== EON_EXPANSE_W768W_RESIDENT_INVITATION_SCHEMA || view.visible !== true) return freeze({ ok: false, reason: 'resident-invitation-view-unavailable' });
  const action = view.action;
  if (!action) return freeze({ ok: false, reason: 'no-resident-invitation-ready' });
  if (action.slotId !== String(expectedSlotId || action.slotId)
    || action.residentId !== String(expectedResidentId || action.residentId)
    || action.receiptId !== String(expectedReceiptId || action.receiptId)
    || action.completedAt !== Number(expectedCompletedAt || action.completedAt)) {
    return freeze({ ok: false, reason: 'resident-invitation-action-stale' });
  }
  return freeze({ ok: true, action, automaticInvitation: false, awardsXp: false });
}

export default freeze({
  EON_EXPANSE_W768W_RESIDENT_INVITATION_SCHEMA,
  deriveEonExpanseW768WResidentInvitationView,
  validateEonExpanseW768WResidentInvitationAction
});
