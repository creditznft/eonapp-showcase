import { projectEonNexusW683MorphicRenderer } from '../w683/eon-nexus-w683-morphic-field-renderer.js';

export const EON_NEXUS_W706_SPATIAL_SCENE_SCHEMA = 'eon.nexus.spatial-scene.w706.v1';
export const EON_NEXUS_W706_LAYOUT_MODES = Object.freeze(['compact', 'split', 'full', 'in-world']);

const freeze = (value) => Object.freeze(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));
const round = (value, precision = 3) => Number(Number(value || 0).toFixed(precision));

const LAYOUTS = freeze({
  compact: freeze({ maxObjects: 6, xScale: 0.052, yScale: 0.042, zScale: 0.24, camera: freeze({ alpha: -Math.PI / 2, beta: 1.14, radius: 9.3, minRadius: 7.2, maxRadius: 11.2 }) }),
  split: freeze({ maxObjects: 8, xScale: 0.062, yScale: 0.047, zScale: 0.28, camera: freeze({ alpha: -Math.PI / 2, beta: 1.08, radius: 8.1, minRadius: 5.8, maxRadius: 10.5 }) }),
  full: freeze({ maxObjects: 10, xScale: 0.078, yScale: 0.058, zScale: 0.34, camera: freeze({ alpha: -Math.PI / 2, beta: 1.02, radius: 7.1, minRadius: 4.8, maxRadius: 10.8 }) }),
  'in-world': freeze({ maxObjects: 10, xScale: 0.085, yScale: 0.062, zScale: 0.38, camera: freeze({ alpha: -Math.PI / 2, beta: 1.12, radius: 9.4, minRadius: 6.4, maxRadius: 13.5 }) })
});

export function normalizeEonNexusW706LayoutMode(value = 'split') {
  const mode = String(value || 'split').toLowerCase();
  return EON_NEXUS_W706_LAYOUT_MODES.includes(mode) ? mode : 'split';
}


export function getEonNexusW706LayoutMetrics(layoutMode = 'split') {
  const mode = normalizeEonNexusW706LayoutMode(layoutMode);
  const layout = LAYOUTS[mode];
  return freeze({
    mode,
    maximumObjects: layout.maxObjects,
    xScale: layout.xScale,
    yScale: layout.yScale,
    zScale: layout.zScale,
    fieldBounds: freeze({ minimum: 7, maximum: 93, minimumDepth: -4, maximumDepth: 6 })
  });
}

export function projectEonNexusW706FieldPosition(position = {}, layoutMode = 'split') {
  const metrics = getEonNexusW706LayoutMetrics(layoutMode);
  return freeze({
    x: round((clamp(position.x ?? 50, 7, 93) - 50) * metrics.xScale),
    y: round((50 - clamp(position.y ?? 50, 7, 93)) * metrics.yScale + Number(position.elevation || 0) * 0.12),
    z: round(clamp(position.z ?? 0, -4, 6) * metrics.zScale)
  });
}

function geometryFor(kind = 'tool') {
  return freeze({
    project: 'sphere-core', approval: 'decision-gate', result: 'result-prism', conversation: 'conversation-ring', route: 'route-vector', task: 'task-slab', tool: 'tool-node'
  }[kind] || 'tool-node');
}

export function buildEonNexusW706SpatialScenePlan(snapshot = {}, {
  layoutMode = 'split',
  selectedObjectId = '',
  stableObjectOrder = [],
  interactionState = null
} = {}) {
  const mode = normalizeEonNexusW706LayoutMode(layoutMode);
  const layout = LAYOUTS[mode];
  const field = projectEonNexusW683MorphicRenderer(snapshot, { selectedObjectId, stableObjectOrder, interactionState });
  const sourceObjects = field.visibleObjects.filter((object) => !object.parked).slice(0, layout.maxObjects);
  const objects = sourceObjects.map((object, index) => {
    const position = projectEonNexusW706FieldPosition(object, mode);
    return freeze({
      id: object.id,
      sourceId: object.sourceId || '',
      kind: object.kind,
      label: object.label,
      status: object.status,
      geometry: geometryFor(object.kind),
      position,
      rotation: freeze({ x: 0, y: round((index % 2 ? 1 : -1) * 0.08), z: round(Number(object.tilt || 0) * Math.PI / 180) }),
      scale: round(clamp(object.scale || 1, 0.68, 1.5)),
      selected: object.selected === true,
      urgent: object.urgent === true,
      compared: object.compared === true,
      pickable: true,
      draggable: true,
      keyboardEquivalent: true,
      sourceObject: object
    });
  });
  const byId = new Map(objects.map((object) => [object.id, object]));
  const relations = field.connections.filter((relation) => byId.has(relation.fromId) && byId.has(relation.toId)).map((relation) => freeze({
    ...relation,
    from: byId.get(relation.fromId).position,
    to: byId.get(relation.toId).position,
    pickable: false
  }));
  const selected = objects.find((object) => object.selected) || null;
  const target = selected ? selected.position : freeze({ x: 0, y: 0, z: 0 });
  const interactionView = interactionState?.view || {};
  const rotationDeg = clamp(interactionView.rotation, -180, 180);
  const zoom = clamp(interactionView.zoom || 1, 0.78, 1.18);
  const alpha = layout.camera.alpha + rotationDeg * Math.PI / 180;
  const radius = clamp(layout.camera.radius / zoom, layout.camera.minRadius, layout.camera.maxRadius);
  const camera = freeze({
    ...layout.camera,
    alpha: round(alpha, 6),
    radius: round(radius, 4),
    target,
    lowerBetaLimit: 0.72,
    upperBetaLimit: 1.42,
    bounded: true,
    userOrbitEnabled: true,
    userZoomEnabled: true,
    automaticOrbit: false,
    authorityKey: `${mode}:${selected?.id || 'centre'}:${round(rotationDeg, 2)}:${round(zoom, 3)}`
  });
  return freeze({
    schema: EON_NEXUS_W706_SPATIAL_SCENE_SCHEMA,
    mode,
    layout: freeze({ mode, maximumObjects: layout.maxObjects, responsive: true }),
    camera,
    objects: freeze(objects),
    relations: freeze(relations),
    selectedObjectId: selected?.id || '',
    state: field.state,
    accent: field.accent,
    secondaryAccent: field.secondaryAccent,
    primaryRenderer: 'babylon-spatial-command-field',
    domRole: 'accessible-controls-and-static-fallback',
    oneSceneAuthority: true,
    sourceFieldSchema: field.schema,
    startsAiWork: false,
    startsVoiceCapture: false,
    automaticNavigation: false,
    automaticApproval: false,
    automaticOrbit: false,
    privateContentRead: false
  });
}

export function getEonNexusW706SpatialSceneTruth() {
  return freeze({
    schema: EON_NEXUS_W706_SPATIAL_SCENE_SCHEMA,
    babylonPrimaryVisual: true,
    compactSplitFullAndInWorld: true,
    realDepthAndCameraOrbit: true,
    pickableWorkObjects: true,
    relationshipGeometry: true,
    domIsAccessibilityAndFallback: true,
    oneSceneAuthority: true,
    secondAssistant: false,
    secondProjectStore: false,
    automaticOrbit: false,
    automaticNavigation: false,
    startsAiWork: false,
    privateContentRead: false
  });
}
