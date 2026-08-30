/**
 * A15 I03 — Core-owned City contract extracted from assets/js/city/city-work-mission.js.
 * Rendering/runtime implementation remains under assets/js/city; this module
 * is safe for Core routes and contains no City implementation imports.
 */
/**
 * W251/W257 — local City beginner-work mission receipts.
 *
 * A mission receipt is deliberately smaller than a work record. It carries only
 * an opaque ID, allowlisted mission/action metadata, timestamps, state and a
 * tiny truthful outcome enum. It never stores user-entered project text, Chat
 * content, credentials, runtime endpoint/model data, provider state, wallet or
 * chain state, remote identifiers, rewards or economic value.
 */
export const CITY_WORK_MISSION_SCHEMA = 'eon.city.work-mission.v1';
export const CITY_WORK_MISSION_STORAGE_KEY = 'eon:city:work-missions:v1';
export const CITY_WORK_MISSION_TTL_MS = 15 * 60 * 1000;

const freezeMission = (mission) => Object.freeze({
  ...mission,
  outcomes: Object.freeze([...(mission.outcomes || [])])
});

export const CITY_PROJECTS_MISSION = freezeMission({
  id: 'first-project',
  label: 'Create your first local project',
  shortLabel: 'First Project',
  sourceLandmarkId: 'workshop',
  sourceLandmarkLabel: 'Build Workshop',
  actionId: 'projects',
  destination: '/projects',
  returnRoute: '/eoncity',
  purpose: 'Choose one real outcome and save an ordinary local Project only when you decide to create it.',
  outcomes: ['project-created']
});

export const CITY_WORKSPACE_MISSION = freezeMission({
  id: 'project-brief',
  label: 'Create your first project brief',
  shortLabel: 'First project brief',
  sourceLandmarkId: 'archive',
  sourceLandmarkLabel: 'Knowledge Archive',
  actionId: 'workspace',
  destination: '/workspace',
  returnRoute: '/eoncity',
  purpose: 'Choose one outcome and save a local project brief only when you decide to create it.',
  outcomes: ['workspace-brief-created']
});

export const CITY_LOCAL_AI_MISSION = freezeMission({
  id: 'local-ai-self-test',
  label: 'Run a truthful Local AI self-test',
  shortLabel: 'Local AI self-test',
  sourceLandmarkId: 'observatory',
  sourceLandmarkLabel: 'Local AI Observatory',
  actionId: 'local-ai',
  destination: '/local-ai',
  returnRoute: '/eoncity',
  purpose: 'Choose an installed local runtime and run its self-test yourself. The receipt records only whether it passed or did not pass.',
  outcomes: ['local-ai-self-test-passed', 'local-ai-self-test-not-passed']
});

export const CITY_BEGINNER_MISSIONS = Object.freeze([
  CITY_PROJECTS_MISSION,
  CITY_WORKSPACE_MISSION,
  CITY_LOCAL_AI_MISSION
]);

const MISSION_BY_ID = new Map(CITY_BEGINNER_MISSIONS.map((mission) => [mission.id, mission]));
const MAX_RECORDS = 18;
const ID_PATTERN = /^city-mission-[a-z0-9-]{6,96}$/i;
const ACTION_ID_PATTERN = /^city-action-[a-z0-9-]{4,72}$/i;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T/;
const STATES = new Set(['offered', 'opened', 'completed', 'dismissed']);

function storageFor(storage) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function toIso(now) {
  const number = Number(now);
  return new Date(Number.isFinite(number) ? number : Date.now()).toISOString();
}

function makeId(now) {
  let random = '';
  try {
    const bytes = new Uint32Array(1);
    globalThis.crypto?.getRandomValues?.(bytes);
    random = bytes[0].toString(36);
  } catch {}
  if (!random) random = Math.floor(Math.random() * 0x7fffffff).toString(36);
  return `city-mission-${Number(now).toString(36)}-${random}`.slice(0, 96);
}

function missionForAction(action = {}) {
  const source = action && typeof action === 'object' ? action : {};
  return CITY_BEGINNER_MISSIONS.find((mission) => (
    String(source.destinationId || '') === mission.actionId
    && String(source.route || '') === mission.destination
    && String(source.landmarkId || '') === mission.sourceLandmarkId
    && ACTION_ID_PATTERN.test(String(source.id || ''))
  )) || null;
}

function outcomeFor(mission, value = '') {
  const outcome = String(value || '').trim();
  return mission?.outcomes?.includes(outcome) ? outcome : '';
}

function normalize(candidate) {
  const source = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : {};
  const mission = MISSION_BY_ID.get(String(source.missionId || '')) || null;
  const state = STATES.has(String(source.state || '')) ? String(source.state) : 'offered';
  const id = String(source.id || '');
  const sourceActionId = String(source.sourceActionId || '');
  const createdAt = String(source.createdAt || '');
  const expiresAt = String(source.expiresAt || '');
  if (!mission || !ID_PATTERN.test(id) || !ACTION_ID_PATTERN.test(sourceActionId) || !ISO_PATTERN.test(createdAt) || !ISO_PATTERN.test(expiresAt)) return null;
  if (String(source.destination || '') !== mission.destination || String(source.sourceLandmarkId || '') !== mission.sourceLandmarkId) return null;
  const at = (name) => ISO_PATTERN.test(String(source[name] || '')) ? String(source[name]) : null;
  const outcome = outcomeFor(mission, source.outcome);
  const outcomeRecordedAt = outcome ? at('outcomeRecordedAt') : null;
  if (state === 'completed' && !outcome) return null;
  return {
    schema: CITY_WORK_MISSION_SCHEMA,
    id,
    source: 'city-play',
    sourceActionId,
    missionId: mission.id,
    missionLabel: mission.label,
    sourceLandmarkId: mission.sourceLandmarkId,
    sourceLandmarkLabel: mission.sourceLandmarkLabel,
    destination: mission.destination,
    returnRoute: mission.returnRoute,
    purpose: mission.purpose,
    createdAt,
    expiresAt,
    state,
    openedAt: at('openedAt'),
    completedAt: at('completedAt'),
    dismissedAt: at('dismissedAt'),
    returnedAt: at('returnedAt'),
    outcome: outcome || 'pending',
    outcomeRecordedAt,
    requiresUserChoice: true,
    dataScope: 'opaque-receipt-only-no-user-content'
  };
}

function readAll(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem(CITY_WORK_MISSION_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(normalize).filter(Boolean).slice(0, MAX_RECORDS) : [];
  } catch { return []; }
}

function writeAll(records, storage) {
  try {
    storage?.setItem(CITY_WORK_MISSION_STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS)));
    return true;
  } catch { return false; }
}

function isExpired(receipt, now) {
  return Date.parse(receipt?.expiresAt || '') <= Number(now);
}

function updateReceipt(id, patch, { storage, now = Date.now(), allowedStates = [] } = {}) {
  const resolvedStorage = storageFor(storage);
  const records = readAll(resolvedStorage);
  const index = records.findIndex((item) => item.id === String(id || ''));
  if (index < 0) return { ok: false, reason: 'missing-receipt', receipt: null };
  const current = records[index];
  if (isExpired(current, now) && patch?.state !== 'dismissed') return { ok: false, reason: 'expired-receipt', receipt: current };
  if (allowedStates.length && !allowedStates.includes(current.state)) return { ok: false, reason: 'invalid-state-transition', receipt: current };
  const next = normalize({ ...current, ...patch });
  if (!next) return { ok: false, reason: 'invalid-mission-outcome', receipt: current };
  records[index] = next;
  if (!writeAll(records, resolvedStorage)) return { ok: false, reason: 'storage-unavailable', receipt: next };
  return { ok: true, reason: null, receipt: next };
}

function hrefFor(receipt) {
  return `${receipt.destination}?cityMission=${encodeURIComponent(receipt.id)}`;
}

/** Returns the fixed, local beginner mission definitions. */
export function getCityBeginnerMission(missionId = '') {
  return MISSION_BY_ID.get(String(missionId || '')) || null;
}

/** Returns sanitized local mission receipts. */
export function readCityWorkMissionReceipts({ storage } = {}) {
  return readAll(storageFor(storage));
}

export function getCityWorkMissionReceipt(id, { storage, now = Date.now() } = {}) {
  const receipt = readAll(storageFor(storage)).find((item) => item.id === String(id || '')) || null;
  if (!receipt) return { ok: false, reason: 'missing-receipt', receipt: null };
  if (isExpired(receipt, now)) return { ok: false, reason: 'expired-receipt', receipt };
  return { ok: true, reason: null, receipt };
}

/** Offers a mission only from a reviewed City prepared action. It never navigates. */
export function offerCityBeginnerMission(preparedAction, { storage, now = Date.now() } = {}) {
  const action = preparedAction && typeof preparedAction === 'object' ? preparedAction : {};
  const mission = missionForAction(action);
  if (!mission) return { ok: false, reason: 'ineligible-prepared-action', receipt: null, href: null };
  const receipt = normalize({
    id: makeId(now),
    sourceActionId: action.id,
    missionId: mission.id,
    sourceLandmarkId: mission.sourceLandmarkId,
    destination: mission.destination,
    createdAt: toIso(now),
    expiresAt: toIso(Number(now) + CITY_WORK_MISSION_TTL_MS),
    state: 'offered',
    outcome: 'pending'
  });
  const resolvedStorage = storageFor(storage);
  const records = readAll(resolvedStorage).filter((item) => item.id !== receipt.id);
  const persisted = writeAll([receipt, ...records], resolvedStorage);
  return {
    ok: persisted,
    reason: persisted ? null : 'storage-unavailable',
    receipt,
    href: persisted ? hrefFor(receipt) : null
  };
}

/** W251 compatibility wrapper. */
export function offerCityWorkspaceMission(preparedAction, options = {}) {
  if (missionForAction(preparedAction)?.id !== CITY_WORKSPACE_MISSION.id) {
    return { ok: false, reason: 'ineligible-prepared-action', receipt: null, href: null };
  }
  return offerCityBeginnerMission(preparedAction, options);
}

export function openCityBeginnerMission(id, options = {}) {
  const now = Number(options.now ?? Date.now());
  return updateReceipt(id, { state: 'opened', openedAt: toIso(now) }, { ...options, now, allowedStates: ['offered'] });
}

/** W251 compatibility wrapper. */
export function openCityWorkspaceMission(id, options = {}) {
  return openCityBeginnerMission(id, options);
}

/** Records a finite truthful local outcome; it never creates the underlying work itself. */
export function completeCityBeginnerMission(id, outcome = '', options = {}) {
  const current = getCityWorkMissionReceipt(id, options);
  if (!current.ok || !current.receipt) return current;
  const mission = getCityBeginnerMission(current.receipt.missionId);
  const safeOutcome = outcomeFor(mission, outcome);
  if (!safeOutcome) return { ok: false, reason: 'invalid-mission-outcome', receipt: current.receipt };
  const now = Number(options.now ?? Date.now());
  return updateReceipt(id, {
    state: 'completed',
    outcome: safeOutcome,
    outcomeRecordedAt: toIso(now),
    completedAt: toIso(now)
  }, { ...options, now, allowedStates: ['opened'] });
}

/** W251 compatibility wrapper. */
export function completeCityWorkspaceMission(id, options = {}) {
  return completeCityBeginnerMission(id, 'workspace-brief-created', options);
}

export function completeCityProjectMission(id, options = {}) {
  return completeCityBeginnerMission(id, 'project-created', options);
}

export function recordCityLocalAiSelfTestOutcome(id, passed, options = {}) {
  return completeCityBeginnerMission(id, passed ? 'local-ai-self-test-passed' : 'local-ai-self-test-not-passed', options);
}

export function dismissCityBeginnerMission(id, options = {}) {
  const now = Number(options.now ?? Date.now());
  return updateReceipt(id, { state: 'dismissed', dismissedAt: toIso(now) }, { ...options, now, allowedStates: ['offered', 'opened'] });
}

/** W251 compatibility wrapper. */
export function dismissCityWorkspaceMission(id, options = {}) {
  return dismissCityBeginnerMission(id, options);
}

export function returnCityBeginnerMission(id, { storage, now = Date.now() } = {}) {
  const resolvedStorage = storageFor(storage);
  const records = readAll(resolvedStorage);
  const index = records.findIndex((item) => item.id === String(id || ''));
  if (index < 0) return { ok: false, reason: 'missing-receipt', receipt: null, href: null };
  const current = records[index];
  if (isExpired(current, now)) return { ok: false, reason: 'expired-receipt', receipt: current, href: null };
  if (!['opened', 'completed'].includes(current.state)) return { ok: false, reason: 'invalid-state-transition', receipt: current, href: null };
  const receipt = normalize({ ...current, returnedAt: toIso(now) });
  records[index] = receipt;
  if (!writeAll(records, resolvedStorage)) return { ok: false, reason: 'storage-unavailable', receipt, href: null };
  return { ok: true, reason: null, receipt, href: `${receipt.returnRoute}?cityMission=${encodeURIComponent(receipt.id)}` };
}

/** W251 compatibility wrapper. */
export function returnCityWorkspaceMission(id, options = {}) {
  return returnCityBeginnerMission(id, options);
}

export function readCityBeginnerMissionFromSearch(search = '', options = {}) {
  const params = new URLSearchParams(String(search || ''));
  return getCityWorkMissionReceipt(params.get('cityMission') || '', options);
}

/** W251 compatibility wrapper. */
export function readCityWorkspaceMissionFromSearch(search = '', options = {}) {
  return readCityBeginnerMissionFromSearch(search, options);
}
