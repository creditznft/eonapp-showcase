/**
 * W702 canonical foreground work state.
 *
 * One small, private-by-default projection shared by Projects, Atlas, NEXUS and
 * EON City. The module is deliberately pure: it does not read storage, start a
 * provider, navigate, approve, publish, pay, or execute work.
 */
export const EONAPP_W702_CANONICAL_WORK_STATE_SCHEMA = 'eonapp.canonical-work-state.w702.v1';
export const EONAPP_W702_CANONICAL_WORK_EVENT_SCHEMA = 'eonapp.canonical-work-event.w702.v1';

const freeze = Object.freeze;
const CONTROL_CHARACTERS = /\p{Cc}/gu;
const SECRET_FIELD = /^(?:secret|token|api[_-]?key|credential|credentials|password|private[_-]?key|authorization)$/i;
const SURFACES = freeze(['pulse', 'nexus', 'atlas', 'city', 'projects']);
const EVENT_TYPES = freeze([
  'replace-context',
  'select-project',
  'clear-project',
  'select-task',
  'clear-task',
  'select-work-object',
  'clear-work-object',
  'set-approval',
  'clear-approval',
  'set-result',
  'clear-result',
  'set-provider-route',
  'clear-provider-route',
  'set-city-location',
  'set-route'
]);

function cleanText(value = '', max = 180) {
  return String(value ?? '')
    .replace(CONTROL_CHARACTERS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function cleanId(value = '', fallback = '') {
  return cleanText(value, 160).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 160) || fallback;
}

function finite(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function natural(value, fallback = 0) {
  return Math.max(0, Math.trunc(finite(value, fallback)));
}

function boolean(value) {
  return value === true;
}

function normalizeRoute(value = '') {
  const route = cleanText(value, 240);
  return route.startsWith('/') && !route.startsWith('//') ? route : '';
}

function containsSecretKey(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 5) return false;
  for (const [key, nested] of Object.entries(value)) {
    const normalizedKey = String(key).replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    if (SECRET_FIELD.test(normalizedKey)) return true;
    if (nested && typeof nested === 'object' && containsSecretKey(nested, depth + 1)) return true;
  }
  return false;
}

function immutableRecord(record) {
  return freeze(record);
}

function normalizeConversation(value = {}) {
  return immutableRecord({
    id: cleanId(value.id),
    label: cleanText(value.label || value.title || 'Private conversation', 100),
    messageCount: natural(value.messageCount),
    privateByDefault: true
  });
}

function normalizeProject(value = {}) {
  const id = cleanId(value.id || value.projectId);
  return immutableRecord({
    id,
    selected: Boolean(id && value.selected !== false),
    label: cleanText(value.label || value.title || (id ? 'Selected project' : ''), 120),
    taskCount: natural(value.taskCount),
    artefactCount: natural(value.artefactCount ?? value.artifactCount),
    openRoute: normalizeRoute(value.openRoute || '/projects') || '/projects'
  });
}

function normalizeTask(value = {}) {
  const id = cleanId(value.id || value.taskId);
  return immutableRecord({
    id,
    label: cleanText(value.label || value.title, 120),
    stage: cleanId(value.stage || value.state, 'idle'),
    complete: boolean(value.complete),
    openRoute: normalizeRoute(value.openRoute || '/projects') || '/projects'
  });
}

function normalizeApproval(value = {}) {
  const actionId = cleanId(value.actionId || value.id);
  return immutableRecord({
    actionId,
    pending: boolean(value.pending) && Boolean(actionId),
    label: cleanText(value.label || value.title || (actionId ? 'Approval waiting' : ''), 120),
    reviewRoute: normalizeRoute(value.reviewRoute || '/workspace') || '/workspace',
    count: natural(value.count, actionId ? 1 : 0)
  });
}

function normalizeResult(value = {}) {
  const id = cleanId(value.id || value.resultId);
  return immutableRecord({
    id,
    label: cleanText(value.label || value.title || (id ? 'Verified result' : ''), 120),
    count: natural(value.count, id ? 1 : 0),
    verified: boolean(value.verified),
    openRoute: normalizeRoute(value.openRoute || '/workspace') || '/workspace'
  });
}

function normalizeProviderRoute(value = {}) {
  return immutableRecord({
    providerId: cleanId(value.providerId || value.id),
    modelId: cleanId(value.modelId),
    mode: cleanId(value.mode, 'none'),
    configured: boolean(value.configured),
    verified: boolean(value.verified),
    startsProvider: false
  });
}

function normalizeCityLocation(value = {}) {
  return immutableRecord({
    destination: cleanId(value.destination, 'core'),
    districtId: cleanId(value.districtId, 'orientation-hall'),
    stationId: cleanId(value.stationId),
    cellId: cleanId(value.cellId),
    x: Number(finite(value.x, 0).toFixed(3)),
    z: Number(finite(value.z, 0).toFixed(3)),
    entered: boolean(value.entered),
    automaticTravel: false
  });
}

function normalizeWorkObject(value = {}) {
  const id = cleanId(value.id || value.workObjectId);
  return immutableRecord({
    id,
    kind: cleanId(value.kind, 'work-object'),
    label: cleanText(value.label || value.title, 120),
    status: cleanId(value.status, 'available'),
    sourceId: cleanId(value.sourceId),
    route: normalizeRoute(value.route),
    selected: Boolean(id && value.selected !== false)
  });
}

function normalizeTimestamp(value, fallback) {
  const number = finite(value, fallback);
  return Math.max(0, Math.trunc(number));
}

export function createEonAppW702CanonicalWorkState(input = {}, { now = Date.now() } = {}) {
  const safeInput = input && typeof input === 'object' && !containsSecretKey(input) ? input : {};
  const updatedAtMs = normalizeTimestamp(safeInput.updatedAtMs, now);
  return freeze({
    schema: EONAPP_W702_CANONICAL_WORK_STATE_SCHEMA,
    revision: natural(safeInput.revision),
    updatedAtMs,
    conversation: normalizeConversation(safeInput.conversation),
    project: normalizeProject(safeInput.project),
    task: normalizeTask(safeInput.task),
    approval: normalizeApproval(safeInput.approval),
    result: normalizeResult(safeInput.result),
    providerRoute: normalizeProviderRoute(safeInput.providerRoute),
    cityLocation: normalizeCityLocation(safeInput.cityLocation),
    selectedWorkObject: normalizeWorkObject(safeInput.selectedWorkObject),
    route: normalizeRoute(safeInput.route || '/'),
    explicitOnly: true,
    automaticNavigation: false,
    automaticExecution: false,
    automaticApproval: false,
    privatePayloadStored: false,
    secretMaterialAccepted: false
  });
}

function nextFromEvent(current, event) {
  const payload = event.payload && typeof event.payload === 'object' && !containsSecretKey(event.payload)
    ? event.payload
    : {};
  switch (event.type) {
    case 'replace-context':
      return { ...current, ...payload };
    case 'select-project':
      return { ...current, project: { ...payload, selected: true } };
    case 'clear-project':
      return { ...current, project: {}, task: {}, selectedWorkObject: {} };
    case 'select-task':
      return { ...current, task: payload };
    case 'clear-task':
      return { ...current, task: {} };
    case 'select-work-object':
      return { ...current, selectedWorkObject: { ...payload, selected: true } };
    case 'clear-work-object':
      return { ...current, selectedWorkObject: {} };
    case 'set-approval':
      return { ...current, approval: { ...payload, pending: payload.pending !== false } };
    case 'clear-approval':
      return { ...current, approval: {} };
    case 'set-result':
      return { ...current, result: payload };
    case 'clear-result':
      return { ...current, result: {} };
    case 'set-provider-route':
      return { ...current, providerRoute: payload };
    case 'clear-provider-route':
      return { ...current, providerRoute: {} };
    case 'set-city-location':
      return { ...current, cityLocation: payload };
    case 'set-route':
      return { ...current, route: payload.route || event.route || '' };
    default:
      return current;
  }
}

export function reduceEonAppW702CanonicalWorkState(state = {}, event = {}, { now = Date.now() } = {}) {
  const current = createEonAppW702CanonicalWorkState(state, { now });
  const type = cleanId(event.type);
  if (!EVENT_TYPES.includes(type)) {
    return freeze({ ok: false, reason: 'unsupported-event', state: current, eventType: type });
  }
  if (event.explicitUserAction !== true) {
    return freeze({ ok: false, reason: 'explicit-user-action-required', state: current, eventType: type });
  }
  if (containsSecretKey(event)) {
    return freeze({ ok: false, reason: 'secret-material-rejected', state: current, eventType: type });
  }
  const next = createEonAppW702CanonicalWorkState({
    ...nextFromEvent(current, { ...event, type }),
    revision: current.revision + 1,
    updatedAtMs: now
  }, { now });
  return freeze({
    ok: true,
    event: freeze({ schema: EONAPP_W702_CANONICAL_WORK_EVENT_SCHEMA, type, explicitUserAction: true }),
    state: next
  });
}

function commonProjection(state) {
  return {
    schema: `${EONAPP_W702_CANONICAL_WORK_STATE_SCHEMA}.projection.v1`,
    revision: state.revision,
    project: state.project,
    task: state.task,
    approval: state.approval,
    result: state.result,
    selectedWorkObject: state.selectedWorkObject,
    route: state.route,
    explicitOnly: true,
    automaticNavigation: false,
    automaticExecution: false,
    automaticApproval: false
  };
}

export function projectEonAppW702CanonicalWorkState(input = {}, surface = 'nexus') {
  const state = createEonAppW702CanonicalWorkState(input);
  const normalizedSurface = SURFACES.includes(surface) ? surface : 'nexus';
  const base = commonProjection(state);
  const surfaceFields = {
    pulse: { conversation: state.conversation, providerRoute: state.providerRoute },
    nexus: { conversation: state.conversation, providerRoute: state.providerRoute, cityLocation: state.cityLocation },
    atlas: { conversation: state.conversation, cityLocation: state.cityLocation },
    city: { cityLocation: state.cityLocation, providerRoute: state.providerRoute },
    projects: { conversation: state.conversation }
  }[normalizedSurface];
  return freeze({ ...base, ...surfaceFields, surface: normalizedSurface });
}

export function validateEonAppW702CanonicalWorkState(input = {}) {
  const state = createEonAppW702CanonicalWorkState(input);
  const errors = [];
  if (state.schema !== EONAPP_W702_CANONICAL_WORK_STATE_SCHEMA) errors.push('schema');
  if (containsSecretKey(input)) errors.push('secret-material');
  if (!state.explicitOnly || state.automaticNavigation || state.automaticExecution || state.automaticApproval) errors.push('truth-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), state });
}


export function createEonAppW702CanonicalWorkStateController({ initialState = {}, onChange = null, now = () => Date.now() } = {}) {
  let state = createEonAppW702CanonicalWorkState(initialState, { now: now() });
  const listeners = new Set();
  if (typeof onChange === 'function') listeners.add(onChange);
  const emit = (event) => {
    for (const listener of listeners) {
      try { listener(state, event); } catch {}
    }
  };
  return freeze({
    getState() { return state; },
    getProjection(surface = 'nexus') { return projectEonAppW702CanonicalWorkState(state, surface); },
    dispatch(event = {}) {
      const result = reduceEonAppW702CanonicalWorkState(state, event, { now: now() });
      if (result.ok) {
        state = result.state;
        emit(result.event);
      }
      return result;
    },
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getTruth() {
      return freeze({
        oneInMemoryAuthority: true,
        persistsState: false,
        startsSideEffects: false,
        revision: state.revision,
        subscriberCount: listeners.size
      });
    }
  });
}

export function getEonAppW702CanonicalWorkStateTruth() {
  return freeze({
    schema: `${EONAPP_W702_CANONICAL_WORK_STATE_SCHEMA}.truth.v1`,
    oneCanonicalForegroundState: true,
    surfaces: SURFACES,
    supportedEvents: EVENT_TYPES,
    readsStorage: false,
    writesStorage: false,
    startsProvider: false,
    navigatesAutomatically: false,
    approvesAutomatically: false,
    storesPrivatePayload: false,
    acceptsSecretMaterial: false
  });
}
