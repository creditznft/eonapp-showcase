/** R04 — pointer/touch semantic resolution across authored Babylon mesh trees. */
const freeze = (value) => Object.freeze(value);

export const EON_CITY_R04_INTERACTION_SCHEMA = 'eon.city.interaction-resolver.r04.v1';

const text = (value = '') => String(value || '').trim();

export function resolveEonCityR04MeshInteraction(mesh = null, { maxDepth = 12 } = {}) {
  let node = mesh || null;
  let depth = 0;
  let decorativeSeen = false;
  while (node && depth <= Math.max(1, Number(maxDepth || 12))) {
    const metadata = node.metadata && typeof node.metadata === 'object' ? node.metadata : {};
    if (metadata.decorativeOnly === true || metadata.interactive === false) decorativeSeen = true;
    const stationId = text(metadata.stationId);
    const discoveryId = text(metadata.discoveryId);
    const commandWallId = text(metadata.commandWallId);
    const nexusRingId = text(metadata.nexusRingId);
    const interactionId = text(metadata.interactionId);
    const transitCapsule = metadata.transitCapsule === true;
    if (interactionId || stationId || discoveryId || commandWallId || nexusRingId || transitCapsule) {
      return freeze({
        schema: EON_CITY_R04_INTERACTION_SCHEMA,
        ok: true,
        interactive: true,
        pickedMesh: mesh || null,
        ownerMesh: node,
        ownerDepth: depth,
        metadata: freeze({ ...metadata }),
        interactionId,
        stationId,
        discoveryId,
        commandWallId,
        nexusRingId,
        transitCapsule,
        interactionPart: text(metadata.interactionRole || metadata.interactionPart || metadata.part || 'structure'),
        decorativeChildResolvedToOwner: decorativeSeen && depth > 0
      });
    }
    node = node.parent || null;
    depth += 1;
  }
  return freeze({
    schema: EON_CITY_R04_INTERACTION_SCHEMA,
    ok: false,
    interactive: false,
    reason: decorativeSeen ? 'decorative-no-semantic-owner' : 'semantic-owner-not-found',
    pickedMesh: mesh || null,
    ownerMesh: null,
    ownerDepth: -1,
    metadata: freeze({})
  });
}

export function resolveEonCityR04LabelBudget(productRoot = null, fallback = 3) {
  const raw = Number(productRoot?.dataset?.eonCityLabelBudget || fallback);
  if (!Number.isFinite(raw)) return Math.max(1, Math.min(3, Number(fallback || 3)));
  return Math.max(1, Math.min(3, Math.round(raw)));
}

export default freeze({ EON_CITY_R04_INTERACTION_SCHEMA, resolveEonCityR04MeshInteraction, resolveEonCityR04LabelBudget });
