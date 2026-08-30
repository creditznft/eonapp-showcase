import { getEonNexusW706LayoutMetrics, projectEonNexusW706FieldPosition } from '../w706/eon-nexus-w706-spatial-scene-plan.js';

export const EON_NEXUS_W707_SPATIAL_MANIPULATION_SCHEMA = 'eon.nexus.spatial-manipulation.w707.v1';
const freeze = (value) => Object.freeze(value);
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const cleanId = (value = '') => String(value || '').replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 140);

function normalizePointer(pointer = {}) {
  return freeze({
    x: finite(pointer.clientX ?? pointer.x),
    y: finite(pointer.clientY ?? pointer.y),
    pointerId: Number.isFinite(Number(pointer.pointerId)) ? Number(pointer.pointerId) : null
  });
}

function normalizeViewport(viewport = {}) {
  return freeze({
    width: Math.max(1, finite(viewport.width, 1)),
    height: Math.max(1, finite(viewport.height, 1))
  });
}

export function beginEonNexusW707SpatialDrag({ object = {}, pointer = {}, viewport = {}, layoutMode = 'split' } = {}) {
  const objectId = cleanId(object.id);
  if (!objectId || object.draggable === false) return freeze({ ok: false, reason: 'object-not-draggable' });
  const source = object.sourceObject || object;
  const fieldStart = freeze({
    x: clamp(source.x ?? 50, 7, 93),
    y: clamp(source.y ?? 50, 7, 93),
    z: clamp(source.z ?? 0, -4, 6),
    elevation: finite(source.elevation)
  });
  return freeze({
    ok: true,
    schema: EON_NEXUS_W707_SPATIAL_MANIPULATION_SCHEMA,
    objectId,
    layoutMode: getEonNexusW706LayoutMetrics(layoutMode).mode,
    pointerStart: normalizePointer(pointer),
    viewport: normalizeViewport(viewport),
    fieldStart,
    automaticNavigation: false,
    mutatesProjectState: false,
    mutatesTaskState: false
  });
}

export function projectEonNexusW707SpatialDrag(drag = {}, pointer = {}, { depthMode = false } = {}) {
  if (drag?.ok !== true || !cleanId(drag.objectId)) return freeze({ ok: false, reason: 'drag-not-active' });
  const current = normalizePointer(pointer);
  const viewport = normalizeViewport(drag.viewport);
  const deltaX = (current.x - finite(drag.pointerStart?.x)) / viewport.width;
  const deltaY = (current.y - finite(drag.pointerStart?.y)) / viewport.height;
  const field = depthMode
    ? freeze({
        x: clamp(drag.fieldStart.x + deltaX * 86, 7, 93),
        y: clamp(drag.fieldStart.y, 7, 93),
        z: clamp(drag.fieldStart.z + deltaY * 10, -4, 6),
        elevation: drag.fieldStart.elevation
      })
    : freeze({
        x: clamp(drag.fieldStart.x + deltaX * 86, 7, 93),
        y: clamp(drag.fieldStart.y + deltaY * 86, 7, 93),
        z: clamp(drag.fieldStart.z, -4, 6),
        elevation: drag.fieldStart.elevation
      });
  return freeze({
    ok: true,
    schema: EON_NEXUS_W707_SPATIAL_MANIPULATION_SCHEMA,
    objectId: cleanId(drag.objectId),
    fieldPosition: field,
    worldPosition: projectEonNexusW706FieldPosition(field, drag.layoutMode),
    depthMode: Boolean(depthMode),
    previewOnly: true,
    commitRequired: true,
    automaticNavigation: false,
    mutatesProjectState: false,
    mutatesTaskState: false
  });
}

export function getEonNexusW707SpatialManipulationTruth() {
  return freeze({
    schema: EON_NEXUS_W707_SPATIAL_MANIPULATION_SCHEMA,
    pointerDragSupported: true,
    normalDragMovesFieldXY: true,
    modifiedDragMovesDepth: true,
    boundedFieldCoordinates: true,
    usesExistingW684Controller: true,
    previewDoesNotPersist: true,
    pointerUpCommitsOneUndoableMove: true,
    keyboardEquivalentRetained: true,
    mutatesProjectState: false,
    mutatesTaskState: false,
    automaticNavigation: false,
    startsAiWork: false
  });
}
