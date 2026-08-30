/**
 * W672 — EON NEXUS Morphic Command Field projection.
 *
 * This module converts the existing privacy-projected NEXUS snapshot into a
 * bounded field of real work objects. It does not read raw stores, create a
 * second assistant, start AI work, navigate, approve, publish, pay, or persist
 * layout changes. The renderer remains an explicit-control surface.
 */

import { projectEonNexusW668FlagshipState } from '../w668/eon-nexus-w668-flagship-state.js';

export const EON_NEXUS_W672_COMMAND_FIELD_SCHEMA = 'eon.nexus.morphic-command-field.w672.v1';
export const EON_NEXUS_W672_MAX_WORK_OBJECTS = 10;

const freeze = (value) => Object.freeze(value);
const ACTIONS = freeze(['chat', 'project', 'review', 'result', 'node', 'inspect']);
const STATUS_PRIORITY = freeze({ waiting: 9, failed: 8, active: 7, selected: 6, complete: 5, blocked: 4, available: 3, idle: 2 });
const KIND_PRIORITY = freeze({ approval: 10, result: 9, task: 8, project: 7, conversation: 6, route: 5, tool: 4 });
const KIND_ACCENTS = freeze({
  approval: '#fb923c', result: '#f8c761', task: '#a78bfa', project: '#22d3ee',
  conversation: '#67e8f9', route: '#75f7cf', tool: '#94a3b8'
});
const SLOTS = freeze([
  freeze({ x: 50, y: 10, lane: 'intent' }), freeze({ x: 78, y: 22, lane: 'intent' }),
  freeze({ x: 90, y: 50, lane: 'work' }), freeze({ x: 76, y: 78, lane: 'work' }),
  freeze({ x: 50, y: 90, lane: 'context' }), freeze({ x: 24, y: 78, lane: 'context' }),
  freeze({ x: 10, y: 50, lane: 'system' }), freeze({ x: 22, y: 22, lane: 'system' }),
  freeze({ x: 67, y: 50, lane: 'inner' }), freeze({ x: 33, y: 50, lane: 'inner' })
]);

const MORPH_PROFILES = freeze({
  ready: freeze({ composition: 'calm-orbit', instruction: 'Choose a real work object or ask EONBOT.', density: 'open' }),
  listening: freeze({ composition: 'receptive-aperture', instruction: 'Listening to the explicit microphone session.', density: 'open' }),
  processing: freeze({ composition: 'reasoning-lattice', instruction: 'The foreground task is working. You remain in control.', density: 'focused' }),
  speaking: freeze({ composition: 'voice-ripple', instruction: 'EONBOT is speaking the current response.', density: 'focused' }),
  'waiting-approval': freeze({ composition: 'decision-gate', instruction: 'A reviewed decision is waiting. Nothing changes automatically.', density: 'focused' }),
  complete: freeze({ composition: 'resolved-radiance', instruction: 'Verified results are ready to inspect.', density: 'open' }),
  error: freeze({ composition: 'fractured-attention', instruction: 'The current route needs attention before continuing.', density: 'focused' }),
  offline: freeze({ composition: 'dormant-core', instruction: 'The selected AI route is unavailable; local work remains unchanged.', density: 'minimal' })
});

function cleanText(value = '', max = 160) {
  return Array.from(String(value || ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code < 32 || code === 127 ? ' ' : character;
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanId(value = '', fallback = '') {
  return cleanText(value, 140).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 140) || fallback;
}

function safeRoute(value = '', fallback = '') {
  if (!value && !fallback) return '';
  try {
    const url = new URL(String(value || fallback), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid' || !url.pathname.startsWith('/')) return fallback;
    if (/(?:\r|\n|javascript:|data:)/i.test(String(value || ''))) return fallback;
    return `${url.pathname}${url.search}${url.hash}`.slice(0, 500);
  } catch { return fallback; }
}

function statusFromTask(task = {}) {
  const state = String(task.state || '').toLowerCase();
  if (state === 'failed') return 'failed';
  if (state === 'review-needed') return 'waiting';
  if (state === 'completed') return 'complete';
  if (['running', 'paused', 'resumed'].includes(state)) return 'active';
  return 'available';
}

function makeObject({ id, kind, label, meta = '', status = 'available', route = '', action = 'inspect', count = 0, sourceId = '' } = {}) {
  const safeKind = Object.hasOwn(KIND_PRIORITY, String(kind || '')) ? String(kind) : 'tool';
  const safeStatus = Object.hasOwn(STATUS_PRIORITY, String(status || '')) ? String(status) : 'available';
  const safeAction = ACTIONS.includes(String(action || '')) ? String(action) : 'inspect';
  return freeze({
    id: cleanId(id, `${safeKind}:unknown`),
    sourceId: cleanId(sourceId || id),
    kind: safeKind,
    label: cleanText(label || safeKind, 120) || safeKind,
    meta: cleanText(meta, 180),
    status: safeStatus,
    route: safeRoute(route),
    action: safeAction,
    count: Math.max(0, Math.min(999, Number(count) || 0)),
    accent: KIND_ACCENTS[safeKind],
    explicitUserAction: true,
    startsWork: false,
    automaticNavigation: false,
    automaticApproval: false
  });
}

function collectObjects(source = {}) {
  const rows = [];
  const project = source.project || {};
  const task = source.task || {};
  const approval = source.approval || {};
  const results = source.results || {};
  const conversation = source.conversation || {};
  const route = source.route || {};

  if (approval.pending === true) {
    rows.push(makeObject({
      id: `approval:${approval.actionId || 'waiting'}`, kind: 'approval', label: approval.label || 'Approval waiting',
      meta: 'Review is required before anything changes.', status: 'waiting', route: approval.reviewRoute || '/workspace', action: 'review', count: approval.count
    }));
  }
  if (Number(results.count) > 0) {
    rows.push(makeObject({
      id: 'result:current', kind: 'result', label: results.label || `${results.count} results available`,
      meta: 'Verified foreground output', status: 'complete', route: results.openRoute || '/workspace', action: 'result', count: results.count
    }));
  }
  if (task.id) {
    rows.push(makeObject({
      id: `task:${task.id}`, kind: 'task', label: task.label || 'Current task', meta: task.stageLabel || task.stage || task.state,
      status: statusFromTask(task), route: project.openRoute || '/projects', action: 'project', sourceId: task.id
    }));
  }
  if (project.selected === true) {
    rows.push(makeObject({
      id: `project:${project.id || 'selected'}`, kind: 'project', label: project.label || 'Active project',
      meta: `${Math.max(0, Number(project.taskCount) || 0)} tasks · ${Math.max(0, Number(project.artefactCount) || 0)} project items`,
      status: 'selected', route: project.openRoute || '/projects', action: 'project', sourceId: project.id
    }));
  }
  rows.push(makeObject({
    id: `conversation:${conversation.id || 'shared'}`, kind: 'conversation', label: conversation.label || 'Private conversation',
    meta: `${Math.max(0, Number(conversation.messageCount) || 0)} messages · private by default`, status: task.id ? 'available' : 'active',
    route: conversation.openRoute || '/', action: 'chat', sourceId: conversation.id
  }));
  rows.push(makeObject({
    id: `route:${route.mode || 'guide'}`, kind: 'route', label: route.providerLabel || 'Guide mode',
    meta: route.privateOnDevice === true ? 'Verified private route on this device' : (route.verified === true ? 'Verified AI route' : 'Route status'),
    status: route.verified === true || String(route.mode || '') === 'guide' ? 'available' : 'blocked', action: 'inspect', sourceId: route.providerId || route.mode
  }));

  for (const node of Array.isArray(source.nodes) ? source.nodes : []) {
    rows.push(makeObject({
      id: `tool:${node.id || node.kind || rows.length}`, sourceId: node.id, kind: 'tool', label: node.label || node.kind || 'Tool',
      meta: `${node.providerKind || 'guide'} · ${Math.max(1, Number(node.count) || 1)} observed`, status: node.status || 'available',
      action: 'node', count: node.count
    }));
  }
  return rows;
}

function orderObjects(rows = [], stableOrder = []) {
  const stable = new Map((Array.isArray(stableOrder) ? stableOrder : []).map((id, index) => [String(id), index]));
  return [...rows].sort((left, right) => {
    const leftStable = stable.has(left.id) ? stable.get(left.id) : Number.MAX_SAFE_INTEGER;
    const rightStable = stable.has(right.id) ? stable.get(right.id) : Number.MAX_SAFE_INTEGER;
    if (leftStable !== rightStable) return leftStable - rightStable;
    const urgent = (status) => ['waiting', 'failed'].includes(status) ? 1 : 0;
    const urgentDelta = urgent(right.status) - urgent(left.status);
    if (urgentDelta) return urgentDelta;
    const kindDelta = (KIND_PRIORITY[right.kind] || 0) - (KIND_PRIORITY[left.kind] || 0);
    if (kindDelta) return kindDelta;
    const statusDelta = (STATUS_PRIORITY[right.status] || 0) - (STATUS_PRIORITY[left.status] || 0);
    return statusDelta || left.label.localeCompare(right.label);
  });
}

function objectPrimaryVerb(object = null) {
  if (!object) return freeze({ label: 'Continue conversation', action: 'chat', route: '/' });
  const verbs = {
    approval: 'Review decision', result: 'Open result', task: 'Open task context', project: 'Continue project',
    conversation: 'Continue conversation', route: 'Inspect route', tool: 'Inspect node'
  };
  return freeze({ label: verbs[object.kind] || 'Inspect', action: object.action, route: object.route });
}

export function projectEonNexusW672CommandField(snapshot = {}, {
  selectedObjectId = '', stableObjectOrder = []
} = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const flagship = projectEonNexusW668FlagshipState(source, { surface: 'expanded', stableNodeOrder: [] });
  const allObjects = orderObjects(collectObjects(source), stableObjectOrder);
  const visible = allObjects.slice(0, EON_NEXUS_W672_MAX_WORK_OBJECTS).map((object, index) => freeze({
    ...object,
    slot: index,
    x: SLOTS[index].x,
    y: SLOTS[index].y,
    lane: SLOTS[index].lane
  }));
  const requestedId = cleanId(selectedObjectId);
  const selected = visible.find((object) => object.id === requestedId)
    || visible.find((object) => ['waiting', 'failed', 'active', 'selected'].includes(object.status))
    || visible[0]
    || null;
  const profile = MORPH_PROFILES[flagship.state] || MORPH_PROFILES.ready;
  const presentKinds = [...new Set(visible.map((object) => object.kind))];

  return freeze({
    schema: EON_NEXUS_W672_COMMAND_FIELD_SCHEMA,
    state: flagship.state,
    morphSignature: flagship.morphSignature,
    composition: profile.composition,
    instruction: profile.instruction,
    density: profile.density,
    continuityId: flagship.continuityId,
    visibleObjects: freeze(visible),
    allObjectCount: allObjects.length,
    hiddenObjectCount: Math.max(0, allObjects.length - visible.length),
    stableObjectOrder: freeze(allObjects.map((object) => object.id)),
    selectedObject: selected,
    selectedPrimaryVerb: objectPrimaryVerb(selected),
    presentKinds: freeze(presentKinds),
    projectSelected: source.project?.selected === true,
    atlasAvailable: source.atlas?.selected === true,
    sameProjectedState: true,
    startsAiWork: false,
    startsVoiceCapture: false,
    automaticNavigation: false,
    automaticApproval: false,
    privateContentRead: false,
    layoutPersistence: false
  });
}

export function getEonNexusW672CommandFieldTruth() {
  return freeze({
    schema: EON_NEXUS_W672_COMMAND_FIELD_SCHEMA,
    oneEonbot: true,
    oneProjectState: true,
    privacyProjectedInputOnly: true,
    realWorkObjectsOnly: true,
    maximumVisibleWorkObjects: EON_NEXUS_W672_MAX_WORK_OBJECTS,
    mouseTouchKeyboardVoiceRemainPrimary: true,
    optionalGestureLayerDeferred: true,
    startsAiWork: false,
    startsVoiceCapture: false,
    automaticNavigation: false,
    automaticApproval: false,
    privateContentRead: false,
    layoutPersistence: false
  });
}

export default freeze({
  EON_NEXUS_W672_COMMAND_FIELD_SCHEMA,
  EON_NEXUS_W672_MAX_WORK_OBJECTS,
  projectEonNexusW672CommandField,
  getEonNexusW672CommandFieldTruth
});
