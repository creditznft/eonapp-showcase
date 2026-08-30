/**
 * W683 — full visual EON NEXUS Morphic Command Field projection.
 *
 * The renderer enriches the W672 privacy-projected work objects with bounded
 * three-dimensional stage geometry, meaningful relationships and state-driven
 * morph profiles. It does not read private content, own stores or execute work.
 */
import { projectEonNexusW672CommandField } from '../w672/eon-nexus-w672-morphic-command-field.js';

export const EON_NEXUS_W683_MORPHIC_RENDERER_SCHEMA = 'eon.nexus.morphic-renderer.w683.v1';
export const EON_NEXUS_W683_MAX_RENDER_OBJECTS = 10;
export const EON_NEXUS_W683_MAX_CONNECTIONS = 22;

const freeze = (value) => Object.freeze(value);
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
const round = (value, precision = 2) => Number(Number(value || 0).toFixed(precision));

const LANE_GEOMETRY = freeze({
  intent: freeze({ depth: 1.9, tilt: -8, elevation: 1.4, label: 'Intent' }),
  work: freeze({ depth: 2.7, tilt: 8, elevation: 0.4, label: 'Work' }),
  context: freeze({ depth: 1.3, tilt: 5, elevation: -1.2, label: 'Context' }),
  system: freeze({ depth: 0.4, tilt: -5, elevation: -0.2, label: 'System' }),
  inner: freeze({ depth: 3.5, tilt: 0, elevation: 0.2, label: 'Focus' })
});

const KIND_GEOMETRY = freeze({
  approval: freeze({ shape: 'decision-gate', width: 1.3, height: 1.05, scale: 1.12 }),
  result: freeze({ shape: 'result-prism', width: 1.22, height: 0.86, scale: 1.06 }),
  task: freeze({ shape: 'task-slab', width: 1.2, height: 0.8, scale: 1 }),
  project: freeze({ shape: 'project-core', width: 1.38, height: 1, scale: 1.1 }),
  conversation: freeze({ shape: 'conversation-lens', width: 1.1, height: 0.78, scale: 0.96 }),
  route: freeze({ shape: 'route-vector', width: 1.05, height: 0.7, scale: 0.92 }),
  tool: freeze({ shape: 'tool-node', width: 0.96, height: 0.7, scale: 0.9 })
});

const STATE_MORPHS = freeze({
  ready: freeze({ stage: 'open-constellation', perspective: 980, depthScale: 1, focusScale: 1.05, coreShape: 'pulse-sphere', scanDensity: 0.28 }),
  listening: freeze({ stage: 'receptive-aperture', perspective: 920, depthScale: 1.08, focusScale: 1.08, coreShape: 'listening-lens', scanDensity: 0.42 }),
  processing: freeze({ stage: 'reasoning-lattice', perspective: 860, depthScale: 1.22, focusScale: 1.11, coreShape: 'reasoning-polyhedron', scanDensity: 0.64 }),
  speaking: freeze({ stage: 'voice-ripple', perspective: 900, depthScale: 1.12, focusScale: 1.08, coreShape: 'voice-resonator', scanDensity: 0.48 }),
  'waiting-approval': freeze({ stage: 'decision-gate', perspective: 840, depthScale: 1.18, focusScale: 1.14, coreShape: 'approval-gate', scanDensity: 0.56 }),
  complete: freeze({ stage: 'resolved-radiance', perspective: 960, depthScale: 1.04, focusScale: 1.1, coreShape: 'resolved-crystal', scanDensity: 0.34 }),
  error: freeze({ stage: 'fractured-attention', perspective: 820, depthScale: 1.2, focusScale: 1.12, coreShape: 'fractured-core', scanDensity: 0.58 }),
  offline: freeze({ stage: 'dormant-archive', perspective: 1040, depthScale: 0.82, focusScale: 1.02, coreShape: 'dormant-core', scanDensity: 0.14 })
});

function cleanId(value = '', fallback = '') {
  return String(value || '').replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 140) || fallback;
}

function normalizeOverride(value = {}) {
  if (!value || typeof value !== 'object') return freeze({});
  return freeze({
    x: Number.isFinite(Number(value.x)) ? clamp(value.x, 7, 93) : null,
    y: Number.isFinite(Number(value.y)) ? clamp(value.y, 7, 93) : null,
    z: Number.isFinite(Number(value.z)) ? clamp(value.z, -4, 6) : null,
    parked: value.parked === true,
    groupId: cleanId(value.groupId),
    compared: value.compared === true
  });
}

function relationId(fromId, toId, kind) {
  return cleanId(`${kind}:${fromId}->${toId}`, `${kind}:link`);
}

function connection(from, to, kind = 'context', strength = 0.5) {
  if (!from || !to || from.id === to.id) return null;
  return freeze({
    id: relationId(from.id, to.id, kind),
    fromId: from.id,
    toId: to.id,
    kind,
    strength: round(clamp(strength, 0.1, 1), 2),
    attention: ['waiting', 'failed'].includes(from.status) || ['waiting', 'failed'].includes(to.status),
    explicitUserAction: false,
    startsWork: false
  });
}

function buildConnections(objects = []) {
  const byKind = new Map();
  for (const object of objects) {
    if (!byKind.has(object.kind)) byKind.set(object.kind, []);
    byKind.get(object.kind).push(object);
  }
  const rows = [];
  const project = byKind.get('project')?.[0] || null;
  const task = byKind.get('task')?.[0] || null;
  const conversation = byKind.get('conversation')?.[0] || null;
  const approval = byKind.get('approval')?.[0] || null;
  const result = byKind.get('result')?.[0] || null;
  const route = byKind.get('route')?.[0] || null;
  const tools = byKind.get('tool') || [];

  const add = (value) => { if (value && rows.length < EON_NEXUS_W683_MAX_CONNECTIONS) rows.push(value); };
  add(connection(project, task, 'project-task', 0.95));
  add(connection(task, approval, 'task-decision', 1));
  add(connection(task, result, 'task-result', 0.92));
  add(connection(conversation, project || task, 'conversation-context', 0.72));
  add(connection(project, result, 'project-output', 0.76));
  add(connection(route, task || project || conversation, 'route-context', 0.68));
  for (const tool of tools) add(connection(route || project || task, tool, 'capability', 0.48));

  for (let index = 1; index < objects.length && rows.length < EON_NEXUS_W683_MAX_CONNECTIONS; index += 1) {
    const previous = objects[index - 1];
    const current = objects[index];
    if (!rows.some((entry) => entry.fromId === previous.id && entry.toId === current.id)) {
      add(connection(previous, current, 'ambient-continuity', 0.24));
    }
  }
  return freeze(rows);
}

function renderObject(object, index, selectedId, overrides, morph) {
  const lane = LANE_GEOMETRY[object.lane] || LANE_GEOMETRY.context;
  const kind = KIND_GEOMETRY[object.kind] || KIND_GEOMETRY.tool;
  const override = normalizeOverride(overrides?.[object.id]);
  const selected = object.id === selectedId;
  const urgent = ['waiting', 'failed'].includes(object.status);
  const x = override.x ?? object.x;
  const y = override.y ?? object.y;
  const z = override.z ?? lane.depth * morph.depthScale + (urgent ? 0.8 : 0) + (selected ? 1.2 : 0);
  const scale = kind.scale * (selected ? morph.focusScale : urgent ? 1.04 : 1) * (override.parked ? 0.72 : 1);
  const azimuth = Math.atan2(y - 50, x - 50) * 180 / Math.PI;
  const radial = Math.hypot(x - 50, y - 50);
  return freeze({
    ...object,
    rendererSchema: EON_NEXUS_W683_MORPHIC_RENDERER_SCHEMA,
    rendererIndex: index,
    x: round(x),
    y: round(y),
    z: round(z),
    azimuth: round(azimuth),
    radial: round(radial),
    tilt: round(lane.tilt + (selected ? 0 : (index % 2 ? 2.5 : -2.5))),
    elevation: round(lane.elevation),
    scale: round(scale, 3),
    width: kind.width,
    height: kind.height,
    shape: kind.shape,
    laneLabel: lane.label,
    selected,
    urgent,
    parked: override.parked,
    compared: override.compared,
    groupId: override.groupId,
    interactive: true,
    draggable: true,
    buttonEquivalent: true,
    keyboardEquivalent: true,
    voiceEquivalent: true,
    gestureEquivalent: true
  });
}

export function projectEonNexusW683MorphicRenderer(snapshot = {}, {
  selectedObjectId = '',
  stableObjectOrder = [],
  interactionState = null
} = {}) {
  const baseField = projectEonNexusW672CommandField(snapshot, { selectedObjectId, stableObjectOrder });
  const selectedId = cleanId(interactionState?.selectedObjectId || baseField.selectedObject?.id || selectedObjectId);
  const morph = STATE_MORPHS[baseField.state] || STATE_MORPHS.ready;
  const overrides = interactionState?.layoutOverrides || {};
  const objects = baseField.visibleObjects
    .slice(0, EON_NEXUS_W683_MAX_RENDER_OBJECTS)
    .map((object, index) => renderObject(object, index, selectedId, overrides, morph));
  const selectedObject = objects.find((object) => object.id === selectedId)
    || objects.find((object) => object.selected)
    || objects[0]
    || null;
  const lanes = Object.entries(LANE_GEOMETRY).map(([id, value]) => freeze({
    id,
    label: value.label,
    objectCount: objects.filter((object) => object.lane === id && !object.parked).length,
    attentionCount: objects.filter((object) => object.lane === id && object.urgent).length
  }));
  const groupIds = [...new Set(objects.map((object) => object.groupId).filter(Boolean))];
  const comparedObjects = objects.filter((object) => object.compared).slice(0, 2);
  const connections = buildConnections(objects);

  return freeze({
    ...baseField,
    schema: EON_NEXUS_W683_MORPHIC_RENDERER_SCHEMA,
    baseFieldSchema: baseField.schema,
    visibleObjects: freeze(objects),
    selectedObject,
    selectedPrimaryVerb: baseField.selectedPrimaryVerb,
    stableObjectOrder: baseField.stableObjectOrder,
    renderer: freeze({
      engine: 'hybrid-dom-babylon',
      stage: morph.stage,
      coreShape: morph.coreShape,
      perspective: morph.perspective,
      scanDensity: morph.scanDensity,
      depthScale: morph.depthScale,
      focusScale: morph.focusScale,
      camera: freeze({ yaw: 0, pitch: -8, zoom: 1, bounded: true }),
      oneVisualStage: true,
      secondAssistant: false,
      secondProjectStore: false
    }),
    lanes: freeze(lanes),
    connections,
    groupIds: freeze(groupIds),
    comparedObjects: freeze(comparedObjects),
    parkedObjectCount: objects.filter((object) => object.parked).length,
    movableObjectCount: objects.filter((object) => object.draggable).length,
    realObjectManipulationReady: true,
    localLayoutOnly: true,
    layoutPersistence: false,
    startsAiWork: false,
    startsVoiceCapture: false,
    automaticNavigation: false,
    automaticApproval: false,
    privateContentRead: false
  });
}

export function getEonNexusW683MorphicRendererTruth() {
  return freeze({
    schema: EON_NEXUS_W683_MORPHIC_RENDERER_SCHEMA,
    fullVisualCommandField: true,
    realPrivacyProjectedObjectsOnly: true,
    meaningfulRelationshipGraph: true,
    stateDrivenMorphProfiles: true,
    hybridDomBabylonStage: true,
    oneVisualStage: true,
    maximumRenderObjects: EON_NEXUS_W683_MAX_RENDER_OBJECTS,
    maximumConnections: EON_NEXUS_W683_MAX_CONNECTIONS,
    localLayoutOnly: true,
    persistentLayout: false,
    secondAssistant: false,
    secondProjectStore: false,
    startsAiWork: false,
    startsVoiceCapture: false,
    automaticNavigation: false,
    automaticApproval: false,
    privateContentRead: false
  });
}

export default freeze({
  EON_NEXUS_W683_MORPHIC_RENDERER_SCHEMA,
  EON_NEXUS_W683_MAX_RENDER_OBJECTS,
  EON_NEXUS_W683_MAX_CONNECTIONS,
  projectEonNexusW683MorphicRenderer,
  getEonNexusW683MorphicRendererTruth
});
