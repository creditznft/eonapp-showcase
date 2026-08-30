/**
 * W660A2 — renderer-neutral observable state for EON NEXUS.
 *
 * This contract does not own Chat, tasks, projects, providers, approvals or
 * EONCITY. It normalizes privacy-projected facts from those existing systems
 * into one immutable snapshot that any accessible or visual renderer can read.
 */

import { EON_TASK_STATES } from '../ai-kernel/eon-task-contract.js';

export const EON_NEXUS_STATE_SCHEMA = 'eon.nexus.observable-state.v1';
export const EON_NEXUS_EVENT = 'eon:nexus-state-changed';

export const EON_NEXUS_EONBOT_STATES = Object.freeze([
  'ready',
  'listening',
  'processing',
  'speaking',
  'waiting-approval',
  'complete',
  'error',
  'offline'
]);

export const EON_NEXUS_ROUTE_MODES = Object.freeze([
  'guide',
  'local',
  'direct-provider',
  'hosted'
]);

export const EON_NEXUS_NODE_STATUSES = Object.freeze([
  'available',
  'selected',
  'active',
  'waiting',
  'complete',
  'failed',
  'blocked'
]);

export const EON_NEXUS_CONNECTION_STATES = Object.freeze([
  'available',
  'checking',
  'disconnected',
  'unavailable',
  'error'
]);

export const EON_NEXUS_QUALITY_MODES = Object.freeze([
  'full',
  'balanced',
  'low-power',
  'static'
]);

const EVENT_TYPES = Object.freeze([
  'snapshot.replace',
  'conversation.changed',
  'project.changed',
  'eonbot.changed',
  'task.changed',
  'route.changed',
  'approval.changed',
  'nodes.changed',
  'results.changed',
  'connection.changed',
  'quality.changed',
  'atlas.changed'
]);

function cleanText(value = '', max = 180) {
  return Array.from(String(value || ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code < 32 || code === 127 ? ' ' : character;
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanId(value = '', max = 160) {
  return cleanText(value, max).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, max);
}

function cleanRoute(value = '', fallback = '/') {
  try {
    const url = new URL(String(value || fallback), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid' || !url.pathname.startsWith('/')) return fallback;
    if (/(?:\r|\n|javascript:|data:)/i.test(String(value || ''))) return fallback;
    return `${url.pathname}${url.search}${url.hash}`.slice(0, 500);
  } catch {
    return fallback;
  }
}

function cleanIso(value = '', fallback = Date.now()) {
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date(Number(fallback) || Date.now()).toISOString();
}

function boundedNumber(value, { min = 0, max = 9999, fallback = 0 } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const nested of Object.values(value)) deepFreeze(nested);
  return value;
}

function normalizeConversation(source = {}, now = Date.now()) {
  return {
    id: cleanId(source.id, 160),
    label: cleanText(source.label || 'Private conversation', 120) || 'Private conversation',
    messageCount: boundedNumber(source.messageCount, { max: 500 }),
    updatedAt: cleanIso(source.updatedAt, now),
    openRoute: cleanRoute(source.openRoute || '/', '/'),
    privateByDefault: source.privateByDefault !== false
  };
}

function normalizeProject(source = {}, now = Date.now()) {
  const selected = source.selected === true && Boolean(cleanId(source.id, 160));
  const status = ['none', 'active', 'paused', 'complete'].includes(String(source.status || ''))
    ? String(source.status)
    : selected ? 'active' : 'none';
  return {
    id: cleanId(source.id, 160),
    label: cleanText(source.label || (selected ? 'Active project' : 'No project selected'), 180),
    selected,
    status,
    taskCount: boundedNumber(source.taskCount, { max: 1000 }),
    artefactCount: boundedNumber(source.artefactCount ?? source.artifactCount, { max: 1000 }),
    openRoute: cleanRoute(source.openRoute || '/projects', '/projects'),
    updatedAt: cleanIso(source.updatedAt, now),
    privateByDefault: source.privateByDefault !== false
  };
}

function normalizeEonbot(source = {}) {
  const state = EON_NEXUS_EONBOT_STATES.includes(String(source.state || '')) ? String(source.state) : 'ready';
  return {
    state,
    detailCode: cleanId(source.detailCode || state, 80) || state,
    statusLabel: cleanText(source.statusLabel || state.replace(/-/g, ' '), 120),
    canListen: source.canListen === true,
    isListening: state === 'listening' || source.isListening === true,
    isSpeaking: state === 'speaking' || source.isSpeaking === true
  };
}

function normalizeTask(source = {}, now = Date.now()) {
  const taskState = EON_TASK_STATES.includes(String(source.state || '')) ? String(source.state) : 'ready';
  return {
    id: cleanId(source.id || source.taskId, 160),
    label: cleanText(source.label || (source.id || source.taskId ? 'Current task' : 'No active task'), 180),
    state: taskState,
    stage: cleanId(source.stage || taskState, 80) || taskState,
    stageLabel: cleanText(source.stageLabel || taskState.replace(/-/g, ' '), 140),
    cancellable: source.cancellable === true && ['running', 'paused', 'review-needed'].includes(taskState),
    foregroundOnly: source.foregroundOnly !== false,
    updatedAt: cleanIso(source.updatedAt, now)
  };
}

function normalizeRoute(source = {}) {
  const mode = EON_NEXUS_ROUTE_MODES.includes(String(source.mode || '')) ? String(source.mode) : 'guide';
  const privateOnDevice = mode === 'local' && source.privateOnDevice !== false;
  return {
    mode,
    providerId: cleanId(source.providerId || (mode === 'guide' ? 'guide' : ''), 64),
    providerLabel: cleanText(source.providerLabel || (mode === 'guide' ? 'Guide mode' : 'AI route'), 120),
    privateOnDevice,
    verified: source.verified === true,
    disclosure: cleanText(source.disclosure || '', 260)
  };
}

function normalizeApproval(source = {}) {
  const count = boundedNumber(source.count, { max: 200 });
  const pending = source.pending === true || count > 0;
  return {
    pending,
    count,
    label: cleanText(source.label || (pending ? `${count || 1} approval${count === 1 ? '' : 's'} waiting` : 'No approval waiting'), 160),
    reviewRoute: cleanRoute(source.reviewRoute || '/workspace', '/workspace'),
    actionId: cleanId(source.actionId, 160)
  };
}

function normalizeNode(source = {}, index = 0) {
  const status = EON_NEXUS_NODE_STATUSES.includes(String(source.status || '')) ? String(source.status) : 'available';
  const id = cleanId(source.id || source.nodeId || `node-${index + 1}`, 120) || `node-${index + 1}`;
  return {
    id,
    kind: cleanId(source.kind || source.role || 'tool', 64) || 'tool',
    label: cleanText(source.label || source.role || 'Tool', 100) || 'Tool',
    status,
    count: boundedNumber(source.count, { max: 999 }),
    providerKind: ['guide', 'local', 'cloud'].includes(String(source.providerKind || '')) ? String(source.providerKind) : 'guide',
    updatedAt: cleanIso(source.updatedAt)
  };
}

function normalizeNodes(value = []) {
  const rows = Array.isArray(value) ? value : [];
  const seen = new Set();
  return rows.slice(0, 16).map(normalizeNode).filter((node) => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });
}

function normalizeResults(source = {}) {
  const count = boundedNumber(source.count, { max: 1000 });
  const unread = boundedNumber(source.unread, { max: count, fallback: 0 });
  return {
    count,
    unread,
    label: cleanText(source.label || (count ? `${count} result${count === 1 ? '' : 's'} available` : 'No new results'), 140),
    openRoute: cleanRoute(source.openRoute || '/workspace', '/workspace')
  };
}

function normalizeConnection(source = {}) {
  const state = EON_NEXUS_CONNECTION_STATES.includes(String(source.state || '')) ? String(source.state) : 'available';
  return {
    state,
    retryable: source.retryable === true,
    label: cleanText(source.label || (state === 'available' ? 'Ready' : state.replace(/-/g, ' ')), 140)
  };
}


function normalizeAtlasRows(value = [], kind = 'record', max = 12) {
  return (Array.isArray(value) ? value : []).slice(0, max).map((row = {}, index) => ({
    id: cleanId(row.id || `${kind}-${index + 1}`, 160) || `${kind}-${index + 1}`,
    label: cleanText(row.label || `${kind.replace(/-/g, ' ')} ${index + 1}`, 180),
    status: cleanId(row.status || row.state || row.kind || 'linked', 64) || 'linked',
    state: cleanId(row.state || row.status || '', 64),
    kind: cleanId(row.kind || kind, 64) || kind,
    messageCount: boundedNumber(row.messageCount, { max: 500 }),
    resultCount: boundedNumber(row.resultCount, { max: 32 }),
    route: row.route ? cleanRoute(row.route, '/projects') : '',
    updatedAt: cleanIso(row.updatedAt)
  }));
}

function normalizeAtlas(source = {}) {
  const selected = source.selected === true && Boolean(cleanId(source.projectId, 160));
  const nextAction = source.nextAction && typeof source.nextAction === 'object' ? source.nextAction : {};
  return {
    schema: 'eon.nexus.project-atlas.w660d.v1',
    selected,
    projectId: selected ? cleanId(source.projectId, 160) : '',
    projectLabel: cleanText(source.projectLabel || (selected ? 'Active project' : 'No project selected'), 180),
    projectStatus: selected && ['active', 'paused', 'complete'].includes(String(source.projectStatus || '')) ? String(source.projectStatus) : selected ? 'active' : 'none',
    projectRoute: cleanRoute(source.projectRoute || '/projects', '/projects'),
    detailsOpened: selected && source.detailsOpened === true,
    conversations: normalizeAtlasRows(source.conversations, 'conversation', 4),
    tasks: normalizeAtlasRows(source.tasks, 'task', 12),
    artifacts: normalizeAtlasRows(source.artifacts, 'project-item', 10),
    activity: normalizeAtlasRows(source.activity, 'agent-activity', 8),
    incompleteCount: boundedNumber(source.incompleteCount, { max: 1000 }),
    completedTaskCount: boundedNumber(source.completedTaskCount, { max: 1000 }),
    nextAction: {
      kind: cleanId(nextAction.kind || (selected ? 'open-project' : 'select-project'), 64),
      label: cleanText(nextAction.label || (selected ? 'Open project' : 'Select a project'), 160),
      route: cleanRoute(nextAction.route || source.projectRoute || '/projects', '/projects')
    },
    limitations: (Array.isArray(source.limitations) ? source.limitations : []).slice(0, 5).map((row) => cleanText(row, 220)).filter(Boolean)
  };
}

function normalizeQuality(source = {}) {
  const mode = EON_NEXUS_QUALITY_MODES.includes(String(source.mode || '')) ? String(source.mode) : 'balanced';
  return {
    mode,
    reducedMotion: source.reducedMotion === true || mode === 'static',
    renderActive: source.renderActive === true
  };
}

export function createDefaultEonNexusState({ now = Date.now() } = {}) {
  const updatedAt = cleanIso('', now);
  return deepFreeze({
    schema: EON_NEXUS_STATE_SCHEMA,
    revision: 1,
    conversation: normalizeConversation({}, now),
    project: normalizeProject({}, now),
    eonbot: normalizeEonbot({}),
    task: normalizeTask({}, now),
    route: normalizeRoute({}),
    approval: normalizeApproval({}),
    nodes: normalizeNodes([]),
    results: normalizeResults({}),
    connection: normalizeConnection({}),
    quality: normalizeQuality({}),
    atlas: normalizeAtlas({}),
    updatedAt
  });
}

export function normalizeEonNexusState(input = {}, { now = Date.now() } = {}) {
  const base = createDefaultEonNexusState({ now });
  const source = input && typeof input === 'object' ? input : {};
  return deepFreeze({
    schema: EON_NEXUS_STATE_SCHEMA,
    revision: 1,
    conversation: normalizeConversation({ ...base.conversation, ...(source.conversation || {}) }, now),
    project: normalizeProject({ ...base.project, ...(source.project || {}) }, now),
    eonbot: normalizeEonbot({ ...base.eonbot, ...(source.eonbot || {}) }),
    task: normalizeTask({ ...base.task, ...(source.task || {}) }, now),
    route: normalizeRoute({ ...base.route, ...(source.route || {}) }),
    approval: normalizeApproval({ ...base.approval, ...(source.approval || {}) }),
    nodes: normalizeNodes(source.nodes ?? base.nodes),
    results: normalizeResults({ ...base.results, ...(source.results || {}) }),
    connection: normalizeConnection({ ...base.connection, ...(source.connection || {}) }),
    quality: normalizeQuality({ ...base.quality, ...(source.quality || {}) }),
    atlas: normalizeAtlas({ ...base.atlas, ...(source.atlas || {}) }),
    updatedAt: cleanIso(source.updatedAt, now)
  });
}

export function normalizeEonNexusEvent(event = {}, { now = Date.now() } = {}) {
  const source = event && typeof event === 'object' ? event : {};
  const type = EVENT_TYPES.includes(String(source.type || '')) ? String(source.type) : '';
  if (!type) return null;
  return deepFreeze({
    schema: 'eon.nexus.event.v1',
    type,
    detail: source.detail && typeof source.detail === 'object' ? source.detail : {},
    at: cleanIso(source.at, now)
  });
}

const DOMAIN_BY_EVENT = Object.freeze({
  'conversation.changed': 'conversation',
  'project.changed': 'project',
  'eonbot.changed': 'eonbot',
  'task.changed': 'task',
  'route.changed': 'route',
  'approval.changed': 'approval',
  'nodes.changed': 'nodes',
  'results.changed': 'results',
  'connection.changed': 'connection',
  'quality.changed': 'quality',
  'atlas.changed': 'atlas'
});

export function applyEonNexusEvent(currentState = {}, rawEvent = {}, { now = Date.now() } = {}) {
  const event = normalizeEonNexusEvent(rawEvent, { now });
  const current = normalizeEonNexusState(currentState, { now });
  if (!event) return current;
  if (event.type === 'snapshot.replace') return normalizeEonNexusState({ ...event.detail, updatedAt: event.at }, { now });
  const domain = DOMAIN_BY_EVENT[event.type];
  if (!domain) return current;
  const next = {
    ...current,
    [domain]: domain === 'nodes'
      ? event.detail.nodes || event.detail
      : { ...(current[domain] || {}), ...event.detail },
    updatedAt: event.at
  };
  return normalizeEonNexusState(next, { now });
}

export function createEonNexusStore({ initialState = {}, now = Date.now, eventTarget = null } = {}) {
  let state = normalizeEonNexusState(initialState, { now: now() });
  const subscribers = new Set();

  const emit = (event) => {
    for (const subscriber of [...subscribers]) {
      try { subscriber(state, event); } catch {}
    }
    try {
      eventTarget?.dispatchEvent?.(new CustomEvent(EON_NEXUS_EVENT, { detail: { state, event } }));
    } catch {}
  };

  return Object.freeze({
    getSnapshot() {
      return state;
    },
    dispatch(rawEvent = {}) {
      const event = normalizeEonNexusEvent(rawEvent, { now: now() });
      if (!event) return Object.freeze({ ok: false, reason: 'invalid-event', state });
      const next = applyEonNexusEvent(state, event, { now: now() });
      if (next === state) return Object.freeze({ ok: true, changed: false, state });
      state = next;
      emit(event);
      return Object.freeze({ ok: true, changed: true, state });
    },
    replace(snapshot = {}) {
      return this.dispatch({ type: 'snapshot.replace', detail: snapshot, at: now() });
    },
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
    dispose() {
      subscribers.clear();
    }
  });
}

export function getEonNexusStateContractTruth() {
  return Object.freeze({
    schema: EON_NEXUS_STATE_SCHEMA,
    ownsConversation: false,
    ownsTaskRuntime: false,
    ownsProjectStore: false,
    ownsProviderRoute: false,
    ownsApprovalExecution: false,
    rendererNeutral: true,
    immutableSnapshots: true,
    rawPromptAccepted: false,
    rawReplyRequired: false,
    providerCredentialAccepted: false,
    atlasSelectedProjectOnly: true,
    externalEffect: false
  });
}

export default Object.freeze({
  EON_NEXUS_STATE_SCHEMA,
  EON_NEXUS_EVENT,
  EON_NEXUS_EONBOT_STATES,
  EON_NEXUS_ROUTE_MODES,
  EON_NEXUS_NODE_STATUSES,
  EON_NEXUS_CONNECTION_STATES,
  EON_NEXUS_QUALITY_MODES,
  createDefaultEonNexusState,
  normalizeEonNexusState,
  normalizeEonNexusEvent,
  applyEonNexusEvent,
  createEonNexusStore,
  getEonNexusStateContractTruth
});
