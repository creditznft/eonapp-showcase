/** W768T — authored resident stations and safe route envelopes for My Frontier. */
import { EON_EXPANSE_W768A_RESIDENT_SLOTS } from './eon-expanse-w768a-my-frontier-layout-contract.js';
import { EON_EXPANSE_W768I_WORLD_OFFSET } from './eon-expanse-w768i-my-frontier-visual-model.js';

export const EON_EXPANSE_W768T_RESIDENT_STATIONS_SCHEMA = 'eon.expanse.my-frontier-resident-stations.w768t.v1';
const freeze = Object.freeze;
const worldPoint = (value = {}) => freeze({ x: Number(value.x || 0) + EON_EXPANSE_W768I_WORLD_OFFSET.x, y: Number(value.y || 0) + EON_EXPANSE_W768I_WORLD_OFFSET.y, z: Number(value.z || 0) + EON_EXPANSE_W768I_WORLD_OFFSET.z });

export function deriveEonExpanseW768TResidentStations({ myFrontierState = {} } = {}) {
  const unlocked = myFrontierState?.unlocked === true;
  const residents = myFrontierState?.residents && typeof myFrontierState.residents === 'object' ? myFrontierState.residents : {};
  const slots = freeze(EON_EXPANSE_W768A_RESIDENT_SLOTS.map((slot) => {
    const invited = unlocked && String(residents[slot.id] || '') === slot.residentId;
    return freeze({
      slotId: slot.id,
      residentId: slot.residentId,
      label: slot.label,
      invited,
      status: invited ? 'invited-anchor-awaiting-authored-resident' : 'reserved-resident-station',
      worldPosition: worldPoint(slot.position),
      interactionAnchor: worldPoint(slot.interactionAnchor),
      heading: slot.heading,
      routeRadius: slot.routeRadius,
      stationVisible: unlocked,
      routeEnvelopeVisible: unlocked,
      invitedSignalVisible: invited,
      residentBodyVisible: false,
      authoredPlacement: true,
      acceptsRawCoordinates: false
    });
  }));
  return freeze({
    schema: EON_EXPANSE_W768T_RESIDENT_STATIONS_SCHEMA,
    unlocked,
    slots,
    slotCount: slots.length,
    invitedCount: slots.filter((entry) => entry.invited).length,
    residentBodyCount: 0,
    automaticInvitation: false,
    rawCoordinatePlacementAllowed: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW768TResidentStations(view = {}) {
  const errors = [];
  const slots = Array.isArray(view.slots) ? view.slots : [];
  if (view.schema !== EON_EXPANSE_W768T_RESIDENT_STATIONS_SCHEMA) errors.push('schema-invalid');
  if (slots.length !== 6 || new Set(slots.map((entry) => entry.slotId)).size !== 6) errors.push('six-unique-resident-stations-required');
  for (const entry of slots) {
    if (!entry.slotId || !entry.residentId || !Number.isFinite(entry.worldPosition?.x) || !Number.isFinite(entry.worldPosition?.z) || !Number.isFinite(entry.routeRadius) || entry.routeRadius <= 0) errors.push(`resident-station-invalid:${entry.slotId || 'unknown'}`);
    if (entry.residentBodyVisible) errors.push(`resident-body-premature:${entry.slotId || 'unknown'}`);
    if (!entry.authoredPlacement || entry.acceptsRawCoordinates) errors.push(`resident-placement-invalid:${entry.slotId || 'unknown'}`);
  }
  if (view.slotCount !== 6 || view.residentBodyCount || view.automaticInvitation || view.rawCoordinatePlacementAllowed || view.privateContentStored) errors.push('product-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), slotCount: slots.length, invitedCount: Number(view.invitedCount || 0) });
}

export default freeze({ EON_EXPANSE_W768T_RESIDENT_STATIONS_SCHEMA, deriveEonExpanseW768TResidentStations, validateEonExpanseW768TResidentStations });
