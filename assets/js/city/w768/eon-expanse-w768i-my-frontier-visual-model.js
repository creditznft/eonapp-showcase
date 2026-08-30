/** W768I — canonical My Frontier visual-foundation model. */
import { createEonExpanseW768AMyFrontierLayoutContract } from './eon-expanse-w768a-my-frontier-layout-contract.js';

export const EON_EXPANSE_W768I_VISUAL_MODEL_SCHEMA = 'eon.expanse.my-frontier-visual-model.w768i.v1';
export const EON_EXPANSE_W768I_WORLD_OFFSET = Object.freeze({ x: 170, y: 0, z: -60 });

const freeze = Object.freeze;
const contract = createEonExpanseW768AMyFrontierLayoutContract();
const finite = (value) => Number.isFinite(Number(value));
const point = (value = {}) => freeze({
  x: Number(value.x || 0) + EON_EXPANSE_W768I_WORLD_OFFSET.x,
  y: Number(value.y || 0) + EON_EXPANSE_W768I_WORLD_OFFSET.y,
  z: Number(value.z || 0) + EON_EXPANSE_W768I_WORLD_OFFSET.z
});

function route(from = {}, to = {}, id = '') {
  const dx = Number(to.x || 0) - Number(from.x || 0);
  const dz = Number(to.z || 0) - Number(from.z || 0);
  const length = Math.hypot(dx, dz);
  return freeze({
    id,
    from: point(from),
    to: point(to),
    center: point({ x: (Number(from.x || 0) + Number(to.x || 0)) / 2, y: 0.08, z: (Number(from.z || 0) + Number(to.z || 0)) / 2 }),
    length,
    heading: Math.atan2(dx, dz),
    width: 3.4,
    collisionSafe: true
  });
}

export function deriveEonExpanseW768IVisualFoundation({ unlocked = false } = {}) {
  const central = contract.plots.find((entry) => entry.id === 'plot-central-command');
  const plots = freeze(contract.plots.map((entry) => freeze({
    plotId: entry.id,
    district: entry.district,
    label: entry.label,
    worldPosition: point(entry.position),
    entranceAnchor: point(entry.entranceAnchor),
    interactionAnchor: point(entry.interactionAnchor),
    roadAnchor: point(entry.roadAnchor),
    heading: entry.heading,
    maxFootprint: entry.maxFootprint,
    collisionEnvelope: freeze({
      minX: entry.collisionEnvelope.minX + EON_EXPANSE_W768I_WORLD_OFFSET.x,
      maxX: entry.collisionEnvelope.maxX + EON_EXPANSE_W768I_WORLD_OFFSET.x,
      minZ: entry.collisionEnvelope.minZ + EON_EXPANSE_W768I_WORLD_OFFSET.z,
      maxZ: entry.collisionEnvelope.maxZ + EON_EXPANSE_W768I_WORLD_OFFSET.z
    }),
    authoredPlacement: true,
    acceptsRawCoordinates: false
  })));
  const roads = freeze(contract.plots
    .filter((entry) => entry.id !== central.id)
    .map((entry) => route(central.roadAnchor, entry.roadAnchor, `road-${entry.district}`)));
  return freeze({
    schema: EON_EXPANSE_W768I_VISUAL_MODEL_SCHEMA,
    unlocked: unlocked === true,
    visible: unlocked === true,
    worldOffset: EON_EXPANSE_W768I_WORLD_OFFSET,
    platform: freeze({ center: point({ x: 0, y: -0.45, z: 0 }), diameter: 82, height: 1.1, collisionSafe: true }),
    centralCircuit: freeze({ center: point({ x: 0, y: 0.15, z: 0 }), diameter: 17, thickness: 0.16 }),
    plots,
    roads,
    plotCount: plots.length,
    roadCount: roads.length,
    canonicalSceneOnly: true,
    createsEngine: false,
    createsScene: false,
    createsRenderLoop: false,
    finishedHeroPrimitives: 0,
    rawCoordinatePlacementAllowed: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW768IVisualFoundation(model = {}) {
  const errors = [];
  if (model.schema !== EON_EXPANSE_W768I_VISUAL_MODEL_SCHEMA) errors.push('schema-invalid');
  if (model.plotCount !== 7 || model.plots?.length !== 7) errors.push('seven-plots-required');
  if (model.roadCount !== 6 || model.roads?.length !== 6) errors.push('six-road-links-required');
  if (!finite(model.worldOffset?.x) || !finite(model.worldOffset?.y) || !finite(model.worldOffset?.z)) errors.push('world-offset-invalid');
  if (Math.hypot(Number(model.worldOffset?.x || 0), Number(model.worldOffset?.z || 0)) < 120) errors.push('world-offset-not-isolated');
  for (const entry of model.plots || []) {
    if (!entry.plotId || !finite(entry.worldPosition?.x) || !finite(entry.worldPosition?.z) || !finite(entry.interactionAnchor?.x) || !finite(entry.interactionAnchor?.z)) errors.push(`plot-invalid:${entry.plotId || 'unknown'}`);
    if (!entry.authoredPlacement || entry.acceptsRawCoordinates) errors.push(`plot-authority-invalid:${entry.plotId || 'unknown'}`);
  }
  for (const entry of model.roads || []) {
    if (!entry.id || !finite(entry.center?.x) || !finite(entry.center?.z) || !finite(entry.length) || entry.length <= 0 || !entry.collisionSafe) errors.push(`road-invalid:${entry.id || 'unknown'}`);
  }
  if (!model.canonicalSceneOnly || model.createsEngine || model.createsScene || model.createsRenderLoop || model.finishedHeroPrimitives !== 0 || model.rawCoordinatePlacementAllowed || model.privateContentStored) errors.push('runtime-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), plotCount: Number(model.plotCount || 0), roadCount: Number(model.roadCount || 0) });
}

export default freeze({
  EON_EXPANSE_W768I_VISUAL_MODEL_SCHEMA,
  EON_EXPANSE_W768I_WORLD_OFFSET,
  deriveEonExpanseW768IVisualFoundation,
  validateEonExpanseW768IVisualFoundation
});
