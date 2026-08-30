/** W719.13 — project reviewed district travel onto a reachable functional arrival. */
export const EON_CITY_W719_FUNCTIONAL_ARRIVAL_SCHEMA = 'eon.city.w719.functional-arrival.v1';
const freeze = (value) => Object.freeze(value);

export function resolveEonCityW719FunctionalArrival({
  destination = {},
  terminals = [],
  preferredDistance = 2.2
} = {}) {
  const x = Number(destination?.x);
  const z = Number(destination?.z);
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    return freeze({ ok: false, reason: 'invalid-destination', destination: freeze({ ...destination }) });
  }
  const candidates = (terminals || [])
    .filter((entry) => entry?.districtId === destination.id && Number.isFinite(Number(entry?.position?.x)) && Number.isFinite(Number(entry?.position?.z)))
    .map((entry) => freeze({
      terminal: entry,
      distance: Math.hypot(x - Number(entry.position.x), z - Number(entry.position.z))
    }))
    .sort((left, right) => left.distance - right.distance);
  const nearest = candidates[0];
  if (!nearest) {
    return freeze({
      ok: true,
      reason: 'no-terminal-projection',
      destination: freeze({ ...destination }),
      terminalId: '',
      terminalDistance: null,
      interactionReady: false
    });
  }
  const terminal = nearest.terminal;
  const radius = Math.max(1, Number(terminal.interactionRadius || 2.7));
  const approachDistance = Math.min(Math.max(0.8, Number(preferredDistance || 2.2)), Math.max(0.8, radius - 0.25));
  let dx = x - Number(terminal.position.x);
  let dz = z - Number(terminal.position.z);
  let length = Math.hypot(dx, dz);
  if (!(length > 0.001)) {
    dx = 0;
    dz = -1;
    length = 1;
  }
  const projected = freeze({
    ...destination,
    x: Number(terminal.position.x) + (dx / length) * approachDistance,
    z: Number(terminal.position.z) + (dz / length) * approachDistance,
    arrivalTerminalId: terminal.id,
    arrivalTerminalLabel: terminal.label,
    arrivalInteractionRadius: radius
  });
  return freeze({
    ok: true,
    reason: 'functional-terminal-approach',
    destination: projected,
    terminalId: terminal.id,
    terminalLabel: terminal.label,
    terminalDistance: approachDistance,
    interactionReady: approachDistance <= radius
  });
}

export default freeze({
  EON_CITY_W719_FUNCTIONAL_ARRIVAL_SCHEMA,
  resolveEonCityW719FunctionalArrival
});
