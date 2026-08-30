/**
 * W366 — Neon Command District vertical-slice contract.
 *
 * This module contains only original, local presentation and journey metadata
 * for EON City's first authored district. It is deliberately not an activity
 * tracker: it stores a compact local journey state with allowlisted stage and
 * landmark IDs only. It never stores prompts, chat text, provider details,
 * account data, Vault material, files, asset binaries, purchase state or
 * remote identifiers.
 */

export const EON_COMMAND_DISTRICT_SCHEMA = 'eon.city.command-district.w366.v1';
export const EON_COMMAND_DISTRICT_STORAGE_KEY = 'eon:city:command-district:v1';
export const EON_COMMAND_DISTRICT_MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000;

const freeze = (value) => Object.freeze(value);
const ALLOWED_STAGE_IDS = new Set(['arrival', 'meet-eonbot', 'choose-work-route', 'review-route', 'native-handoff', 'return-to-city']);
const ALLOWED_EVENT_IDS = new Set(['entered', 'met-eonbot', 'selected-work-route', 'route-prepared', 'route-confirmed', 'returned']);
const ALLOWED_LANDMARK_IDS = new Set(['command-centre', 'workshop', 'archive', 'relay', 'observatory']);
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T/;

export const EON_COMMAND_DISTRICT_NPC_ROLES = freeze([
  freeze({
    id: 'eonbot',
    label: 'EONBOT',
    role: 'local work guide',
    landmarkId: 'command-centre',
    accent: '#7cf9ff',
    silhouette: 'orbital-companion',
    truthRule: 'Appears as the City guide. It never claims background work or exposes Chat content.'
  }),
  freeze({
    id: 'builder-guide',
    label: 'Builder Guide',
    role: 'project routing guide',
    landmarkId: 'workshop',
    accent: '#39e7d3',
    silhouette: 'workshop-builder',
    truthRule: 'Shows a local route cue only. It cannot create a project without a separate user choice.'
  }),
  freeze({
    id: 'archivist-guide',
    label: 'Archivist',
    role: 'workspace routing guide',
    landmarkId: 'archive',
    accent: '#a584ff',
    silhouette: 'archive-scout',
    truthRule: 'Shows a local route cue only. It never reads files or workspace data in City.'
  }),
  freeze({
    id: 'realm-keeper',
    label: 'Realm Keeper',
    role: 'local realm identity guide',
    landmarkId: 'relay',
    accent: '#ffba54',
    silhouette: 'realm-steward',
    truthRule: 'Explains local Realm Studio entry. It does not publish, share or claim a global username.'
  }),
  freeze({
    id: 'local-ai-observer',
    label: 'Local AI Observer',
    role: 'local runtime orientation guide',
    landmarkId: 'observatory',
    accent: '#69efb5',
    silhouette: 'local-engineer',
    truthRule: 'Shows a local setup route. It does not probe or call a model until the user acts in Local AI.'
  }),
  freeze({
    id: 'review-steward',
    label: 'Review Steward',
    role: 'approval boundary guide',
    landmarkId: 'command-centre',
    accent: '#ffba54',
    silhouette: 'review-steward',
    truthRule: 'Reminds users that City can prepare a route but cannot open or confirm it without a visible review.'
  })
]);

export const EON_COMMAND_DISTRICT_BLUEPRINT = freeze({
  schema: EON_COMMAND_DISTRICT_SCHEMA,
  id: 'neon-command-district',
  title: 'Neon Command District',
  artDirection: 'Original neo-noir operational sanctuary with wet steel, restrained light, readable work landmarks and calm premium movement.',
  rendererPolicy: freeze({ remoteAssets: false, remoteTelemetry: false, userDataInRenderer: false, shippedBinaryAssetsRequired: false }),
  structures: freeze([
    freeze({ id: 'arrival-plaza', label: 'Arrival Plaza', purpose: 'A clear cinematic entry with one visible Command Centre route.', assetFallback: 'procedural-command-plaza' }),
    freeze({ id: 'command-centre-exterior', label: 'Command Centre', purpose: 'Primary landmark, EONBOT meet point and safe native-route review entry.', assetFallback: 'procedural-command-centre' }),
    freeze({ id: 'command-room-interior', label: 'Command Room', purpose: 'Spatial preview of reviewed work routing; no raw AI content or provider state.', assetFallback: 'procedural-command-room' }),
    freeze({ id: 'builder-lane', label: 'Build Workshop Lane', purpose: 'Visible route to Projects.', assetFallback: 'procedural-workshop' }),
    freeze({ id: 'archive-lane', label: 'Knowledge Archive Lane', purpose: 'Visible route to Workspace.', assetFallback: 'procedural-archive' }),
    freeze({ id: 'realm-relay-lane', label: 'Realm Relay Lane', purpose: 'Visible route to local Realm Studio.', assetFallback: 'procedural-realm-relay' }),
    freeze({ id: 'observatory-lane', label: 'Local AI Observatory Lane', purpose: 'Visible route to Local AI setup.', assetFallback: 'procedural-observatory' })
  ]),
  interactionRules: freeze({
    proximityOnly: true,
    nativeRoutesRequireVisibleReview: true,
    autoNavigation: false,
    autoExecution: false,
    allowsWalletOrCommerce: false,
    allowsBackgroundAgentClaims: false
  })
});

export const EON_COMMAND_DISTRICT_MISSION_STAGES = freeze([
  freeze({ id: 'arrival', index: 0, title: 'Arrive at the Command District', detail: 'Enter the City and look for the Command Centre. Nothing starts automatically.', next: 'Meet EONBOT at the Command Centre.' }),
  freeze({ id: 'meet-eonbot', index: 1, title: 'Meet EONBOT', detail: 'Approach the Command Centre to reveal the work-routing guide.', next: 'Choose a work landmark that matches your goal.' }),
  freeze({ id: 'choose-work-route', index: 2, title: 'Choose a work route', detail: 'Visit Build Workshop, Knowledge Archive, Realm Relay or Local AI Observatory.', next: 'Request an interaction review when you are ready.' }),
  freeze({ id: 'review-route', index: 3, title: 'Review the handoff', detail: 'City prepares only a route and, where applicable, a local opaque mission receipt.', next: 'Choose separately whether to open the native work surface.' }),
  freeze({ id: 'native-handoff', index: 4, title: 'Continue in the native work surface', detail: 'Chat, Projects, Workspace, Realm Studio or Local AI owns the actual work. City receives no private result.', next: 'Return to City when a local receipt is available.' }),
  freeze({ id: 'return-to-city', index: 5, title: 'Return to the Command District', detail: 'The return is a local presentation milestone, not a reward, score, purchase or account record.', next: 'Explore another route or continue your work.' })
]);

const STAGE_BY_ID = new Map(EON_COMMAND_DISTRICT_MISSION_STAGES.map((stage) => [stage.id, stage]));
const ROLE_BY_ID = new Map(EON_COMMAND_DISTRICT_NPC_ROLES.map((role) => [role.id, role]));

function storageFor(storage) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function iso(now = Date.now()) {
  return new Date(Number.isFinite(Number(now)) ? Number(now) : Date.now()).toISOString();
}

function cleanLandmark(value) {
  return ALLOWED_LANDMARK_IDS.has(String(value || '')) ? String(value) : null;
}

function stageForEvent(event, currentStage = 'arrival') {
  const stage = ALLOWED_STAGE_IDS.has(currentStage) ? currentStage : 'arrival';
  if (event === 'entered') return stage;
  if (event === 'met-eonbot') return 'meet-eonbot';
  if (event === 'selected-work-route') return stage === 'arrival' ? 'choose-work-route' : (stage === 'meet-eonbot' ? 'choose-work-route' : stage);
  if (event === 'route-prepared') return ['arrival', 'meet-eonbot', 'choose-work-route'].includes(stage) ? 'review-route' : stage;
  if (event === 'route-confirmed') return ['arrival', 'meet-eonbot', 'choose-work-route', 'review-route'].includes(stage) ? 'native-handoff' : stage;
  if (event === 'returned') return 'return-to-city';
  return stage;
}

export function createCommandDistrictState({ now = Date.now() } = {}) {
  return {
    schema: EON_COMMAND_DISTRICT_SCHEMA,
    stageId: 'arrival',
    lastLandmarkId: null,
    enteredAt: null,
    updatedAt: iso(now),
    eventCounts: { entered: 0, metEonbot: 0, selectedWorkRoute: 0, routePrepared: 0, routeConfirmed: 0, returned: 0 },
    localOnly: true,
    remoteTelemetry: false,
    containsUserContent: false
  };
}

export function normalizeCommandDistrictState(candidate, { now = Date.now(), fallback } = {}) {
  const base = createCommandDistrictState({ now });
  const source = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : (fallback || {});
  const rawCounts = source.eventCounts && typeof source.eventCounts === 'object' ? source.eventCounts : {};
  const count = (key) => Math.max(0, Math.min(9999, Math.floor(Number(rawCounts[key] || 0))));
  const updatedAt = ISO_PATTERN.test(String(source.updatedAt || '')) ? String(source.updatedAt) : base.updatedAt;
  const enteredAt = ISO_PATTERN.test(String(source.enteredAt || '')) ? String(source.enteredAt) : null;
  const stageId = ALLOWED_STAGE_IDS.has(String(source.stageId || '')) ? String(source.stageId) : base.stageId;
  return {
    schema: EON_COMMAND_DISTRICT_SCHEMA,
    stageId,
    lastLandmarkId: cleanLandmark(source.lastLandmarkId),
    enteredAt,
    updatedAt,
    eventCounts: {
      entered: count('entered'),
      metEonbot: count('metEonbot'),
      selectedWorkRoute: count('selectedWorkRoute'),
      routePrepared: count('routePrepared'),
      routeConfirmed: count('routeConfirmed'),
      returned: count('returned')
    },
    localOnly: true,
    remoteTelemetry: false,
    containsUserContent: false
  };
}

function isExpired(state, now) {
  const updated = Date.parse(state?.updatedAt || '');
  return Number.isFinite(updated) && Number(now) - updated > EON_COMMAND_DISTRICT_MAX_AGE_MS;
}

export function readCommandDistrictState({ storage, now = Date.now() } = {}) {
  const resolved = storageFor(storage);
  try {
    const raw = resolved?.getItem(EON_COMMAND_DISTRICT_STORAGE_KEY) || '';
    const parsed = raw ? JSON.parse(raw) : null;
    const state = normalizeCommandDistrictState(parsed, { now });
    return { ok: true, state: isExpired(state, now) ? createCommandDistrictState({ now }) : state, source: parsed ? 'storage' : 'default' };
  } catch {
    return { ok: false, state: createCommandDistrictState({ now }), source: 'fallback' };
  }
}

export function saveCommandDistrictState(state, { storage, now = Date.now() } = {}) {
  const resolved = storageFor(storage);
  const normalized = normalizeCommandDistrictState({ ...state, updatedAt: iso(now) }, { now, fallback: state });
  try {
    resolved?.setItem(EON_COMMAND_DISTRICT_STORAGE_KEY, JSON.stringify(normalized));
    return { ok: true, state: normalized };
  } catch {
    return { ok: false, state: normalized };
  }
}

export function recordCommandDistrictEvent(eventId, { landmarkId = null, storage, now = Date.now() } = {}) {
  const event = String(eventId || '');
  if (!ALLOWED_EVENT_IDS.has(event)) return { ok: false, reason: 'unsupported-event', state: readCommandDistrictState({ storage, now }).state };
  const loaded = readCommandDistrictState({ storage, now });
  const current = loaded.state;
  const nextLandmark = cleanLandmark(landmarkId) || current.lastLandmarkId;
  const counts = { ...current.eventCounts };
  const map = {
    entered: 'entered',
    'met-eonbot': 'metEonbot',
    'selected-work-route': 'selectedWorkRoute',
    'route-prepared': 'routePrepared',
    'route-confirmed': 'routeConfirmed',
    returned: 'returned'
  };
  counts[map[event]] = Math.min(9999, Number(counts[map[event]] || 0) + 1);
  const next = {
    ...current,
    stageId: stageForEvent(event, current.stageId),
    lastLandmarkId: nextLandmark,
    enteredAt: event === 'entered' && !current.enteredAt ? iso(now) : current.enteredAt,
    eventCounts: counts,
    updatedAt: iso(now)
  };
  const saved = saveCommandDistrictState(next, { storage, now });
  return { ...saved, event, stage: getCommandDistrictMissionCard(saved.state) };
}

export function getCommandDistrictMissionCard(state = createCommandDistrictState()) {
  const normalized = normalizeCommandDistrictState(state, { fallback: state });
  const stage = STAGE_BY_ID.get(normalized.stageId) || STAGE_BY_ID.get('arrival');
  return freeze({
    schema: EON_COMMAND_DISTRICT_SCHEMA,
    stageId: stage.id,
    index: stage.index,
    totalStages: EON_COMMAND_DISTRICT_MISSION_STAGES.length,
    title: stage.title,
    detail: stage.detail,
    next: stage.next,
    progressLabel: `${stage.index + 1}/${EON_COMMAND_DISTRICT_MISSION_STAGES.length}`,
    lastLandmarkId: normalized.lastLandmarkId,
    localOnly: true,
    remoteTelemetry: false,
    containsUserContent: false
  });
}

export function getCommandDistrictRole(roleId) {
  return ROLE_BY_ID.get(String(roleId || '')) || null;
}

export function getCommandDistrictSceneBlueprint() {
  return EON_COMMAND_DISTRICT_BLUEPRINT;
}

export function validateCommandDistrictBlueprint(blueprint = EON_COMMAND_DISTRICT_BLUEPRINT) {
  const errors = [];
  if (blueprint?.schema !== EON_COMMAND_DISTRICT_SCHEMA) errors.push('Unexpected command-district schema.');
  if (!Array.isArray(blueprint?.structures) || blueprint.structures.length < 6) errors.push('Command District needs its complete first-district structure set.');
  if (blueprint?.rendererPolicy?.remoteAssets !== false || blueprint?.rendererPolicy?.remoteTelemetry !== false || blueprint?.rendererPolicy?.userDataInRenderer !== false) errors.push('Command District must remain local and renderer-safe.');
  if (blueprint?.interactionRules?.autoNavigation !== false || blueprint?.interactionRules?.autoExecution !== false || blueprint?.interactionRules?.nativeRoutesRequireVisibleReview !== true) errors.push('Command District route review boundary is incomplete.');
  if (EON_COMMAND_DISTRICT_NPC_ROLES.some((role) => !ALLOWED_LANDMARK_IDS.has(role.landmarkId) || String(role.truthRule || '').trim().length < 24)) errors.push('Every City guide requires a local landmark and a meaningful truth rule.');
  const serialized = JSON.stringify(blueprint);
  if (/https?:\/\//i.test(serialized) || blueprint?.interactionRules?.allowsWalletOrCommerce !== false) errors.push('Command District blueprint contains a forbidden remote or economic surface.');
  return freeze({ schema: EON_COMMAND_DISTRICT_SCHEMA, ok: errors.length === 0, errors: freeze(errors), localOnly: true, remoteTelemetry: false });
}
