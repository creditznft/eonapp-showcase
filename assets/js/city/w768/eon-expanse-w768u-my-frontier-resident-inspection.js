/** W768U — truthful inspection for authored My Frontier resident stations. */
import { deriveEonExpanseW768TResidentStations } from './eon-expanse-w768t-my-frontier-resident-stations.js';

export const EON_EXPANSE_W768U_RESIDENT_INSPECTION_SCHEMA = 'eon.expanse.my-frontier-resident-inspection.w768u.v1';
const freeze = Object.freeze;

export function deriveEonExpanseW768UResidentInspection({ slotId = '', myFrontierState = {} } = {}) {
  const stationView = deriveEonExpanseW768TResidentStations({ myFrontierState });
  const slot = stationView.slots.find((entry) => entry.slotId === String(slotId || '')) || null;
  if (!stationView.unlocked) return freeze({ schema: EON_EXPANSE_W768U_RESIDENT_INSPECTION_SCHEMA, available: false, reason: 'my-frontier-locked', grantsXp: false, privateContentStored: false });
  if (!slot) return freeze({ schema: EON_EXPANSE_W768U_RESIDENT_INSPECTION_SCHEMA, available: false, reason: 'resident-slot-not-found', grantsXp: false, privateContentStored: false });
  const expectedToken = `${slot.slotId}:${slot.residentId}:${slot.status}`;
  return freeze({
    schema: EON_EXPANSE_W768U_RESIDENT_INSPECTION_SCHEMA,
    available: true,
    slotId: slot.slotId,
    residentId: slot.residentId,
    label: slot.label,
    status: slot.status,
    expectedToken,
    detail: slot.invited
      ? `${slot.label} has a verified invitation signal. The authored resident character is not presented until its asset and animation truth pass.`
      : `${slot.label} is reserved for ${slot.residentId}. A verified character-arc receipt is required before invitation.`,
    residentBodyVisible: false,
    automaticInvitation: false,
    grantsXp: false,
    mutatesMissionState: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW768UResidentInspection(view = null, { explicitUserAction = false, expectedSlotId = '', expectedToken = '' } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (!view?.available) return freeze({ ok: false, reason: view?.reason || 'resident-inspection-unavailable' });
  if (expectedSlotId && view.slotId !== String(expectedSlotId)) return freeze({ ok: false, reason: 'resident-slot-changed' });
  if (expectedToken && view.expectedToken !== String(expectedToken)) return freeze({ ok: false, reason: 'resident-station-changed' });
  return freeze({ ok: true, inspection: view, grantsXp: false, mutatesMissionState: false, privateContentStored: false });
}

export default freeze({ EON_EXPANSE_W768U_RESIDENT_INSPECTION_SCHEMA, deriveEonExpanseW768UResidentInspection, validateEonExpanseW768UResidentInspection });
