/**
 * A15 I03 — Core-owned City contract extracted from assets/js/city/city-world-state.js.
 * Rendering/runtime implementation remains under assets/js/city; this module
 * is safe for Core routes and contains no City implementation imports.
 */
import { CITY_ACTIONABLE_LANDMARK_IDS, CITY_STATE_DISTRICT_IDS } from './city-landmark-registry.js';

/**
 * W221 — versioned, local-only CityWorldState.
 *
 * This store intentionally contains only presentation/progress references. It never
 * copies Vault secrets, API credentials, chat content, wallet recovery material, or
 * payment/affiliate state into the City renderer.
 */

export const CITY_WORLD_STATE_VERSION = 2;
export const CITY_WORLD_STATE_KEY = 'eon:city:world-state:v1';
export const CITY_WORLD_LEGACY_KEYS = Object.freeze([
  'eon:operator-map:state:v1',
  'eon:city:state:v0'
]);

export const CITY_DISTRICT_IDS = CITY_STATE_DISTRICT_IDS;

/** W361: finite, local-only City/native surface identifiers. */
export const CITY_NAVIGATION_MODE_IDS = Object.freeze([
  'portal', 'overview', 'command-space', 'immersive-work', 'chat', 'workspace',
  'automations', 'apps', 'local-ai', 'realm-studio', 'projects', 'library'
]);

/**
 * W231 — a short, local-only onboarding circuit. These are City progress markers,
 * never points, credits, tokens, rewards, subscriptions, or transferable assets.
 */
export const CITY_FIRST_CIRCUIT_OBJECTIVES = Object.freeze([
  'visit-command-centre',
  'visit-workspace',
  'visit-realm-studio',
  'return-to-command-centre',
  'first-circuit-complete'
]);

const SAFE_REF_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,79}$/i;
const REALM_ID_PATTERN = /^eonrealm_[A-Za-z0-9_-]{22}$/;
const REALM_PALETTES = new Set(['classic-eon', 'graphite', 'aurora', 'dark-purple', 'neon-city', 'forest-circuit', 'minimal']);
const REALM_LANDMARK_STYLES = new Set(['observatory', 'garden', 'gallery', 'workshop', 'sanctum']);
const MAX_SAFE_REFS = 24;
const MAX_COMPLETED_OBJECTIVES = 24;
const MAX_VISIT_COUNTS = 16;
const CITY_PLAY_QUALITY_OPTIONS = new Set(['lite', 'balanced', 'cinematic']);
const CITY_PLAY_LANDMARK_IDS = new Set(CITY_ACTIONABLE_LANDMARK_IDS);
const CITY_NAVIGATION_MODE_SET = new Set(CITY_NAVIGATION_MODE_IDS);
const MAX_CITY_TRANSITIONS = 12;

function getStorage(storage) {
  if (storage && typeof storage.getItem === 'function') return storage;
  try {
    if (globalThis.localStorage && typeof globalThis.localStorage.getItem === 'function') return globalThis.localStorage;
  } catch {}
  return null;
}

function safeGet(storage, key) {
  try { return storage?.getItem(key) || null; } catch { return null; }
}

function safeSet(storage, key, value) {
  try {
    storage?.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(storage, key) {
  try { storage?.removeItem(key); } catch {}
}

function asPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function cleanText(value, fallback, max = 80) {
  const text = String(value || '').trim();
  if (!text) return fallback;
  let output = '';
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code < 32 || code === 127) continue;
    output += char;
    if (output.length >= max) break;
  }
  return output || fallback;
}

function stableSeed(value = '') {
  let hash = 2166136261;
  for (const char of String(value || 'eon-city')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, '0').slice(0, 12);
}

function makeId(prefix, now = Date.now()) {
  let random = '';
  try {
    const bytes = new Uint32Array(1);
    globalThis.crypto?.getRandomValues?.(bytes);
    random = bytes[0].toString(36);
  } catch {}
  if (!random) random = Math.floor(Math.random() * 0x7fffffff).toString(36);
  return `${prefix}-${Number(now).toString(36)}-${random}`.slice(0, 64);
}

function iso(now = Date.now()) {
  const value = Number(now);
  return new Date(Number.isFinite(value) ? value : Date.now()).toISOString();
}

function normalizeSafeRefs(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const refs = [];
  for (const entry of value) {
    const clean = String(entry || '').trim();
    if (!SAFE_REF_PATTERN.test(clean) || seen.has(clean)) continue;
    seen.add(clean);
    refs.push(clean);
    if (refs.length >= MAX_SAFE_REFS) break;
  }
  return refs;
}

function normalizeDistrictIds(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  const seen = new Set();
  const ids = [];
  for (const entry of source) {
    const id = String(entry || '').trim();
    if (!CITY_DISTRICT_IDS.includes(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function normalizeVisitCounts(value) {
  const source = asPlainObject(value);
  const counts = {};
  for (const id of CITY_DISTRICT_IDS) {
    const count = Math.floor(clamp(source[id], 0, 9999));
    if (count > 0) counts[id] = count;
    if (Object.keys(counts).length >= MAX_VISIT_COUNTS) break;
  }
  return counts;
}

function normalizeCompleted(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const items = [];
  for (const entry of value) {
    const id = String(entry || '').trim();
    if (!/^[a-z0-9][a-z0-9:-]{0,63}$/i.test(id) || seen.has(id)) continue;
    seen.add(id);
    items.push(id);
    if (items.length >= MAX_COMPLETED_OBJECTIVES) break;
  }
  return items;
}

function normalizeCityTransition(value) {
  const source = asPlainObject(value);
  const fromMode = CITY_NAVIGATION_MODE_SET.has(String(source.fromMode || '')) ? String(source.fromMode) : 'portal';
  const toMode = CITY_NAVIGATION_MODE_SET.has(String(source.toMode || '')) ? String(source.toMode) : 'portal';
  const entry = /^[a-z0-9][a-z0-9:-]{0,63}$/i.test(String(source.entry || '')) ? String(source.entry) : 'native-surface';
  const landmarkId = CITY_PLAY_LANDMARK_IDS.has(String(source.landmarkId || '')) ? String(source.landmarkId) : null;
  const id = SAFE_REF_PATTERN.test(String(source.id || '')) ? String(source.id) : null;
  const at = /^\d{4}-\d{2}-\d{2}T/.test(String(source.at || '')) ? String(source.at) : null;
  return { id, fromMode, toMode, entry, landmarkId, at };
}

function normalizeCityNavigation(value, fallback = {}) {
  const source = asPlainObject(value);
  const fallbackSource = asPlainObject(fallback);
  const currentMode = CITY_NAVIGATION_MODE_SET.has(String(source.currentMode || ''))
    ? String(source.currentMode)
    : (CITY_NAVIGATION_MODE_SET.has(String(fallbackSource.currentMode || '')) ? String(fallbackSource.currentMode) : 'portal');
  const history = [];
  const seen = new Set();
  for (const candidate of Array.isArray(source.transitionHistory) ? source.transitionHistory : []) {
    const transition = normalizeCityTransition(candidate);
    if (!transition.id || seen.has(transition.id)) continue;
    seen.add(transition.id);
    history.push(transition);
    if (history.length >= MAX_CITY_TRANSITIONS) break;
  }
  const pendingCandidate = normalizeCityTransition(source.pendingTransition);
  const lastCandidate = normalizeCityTransition(source.lastTransition);
  return {
    currentMode,
    pendingTransition: pendingCandidate.id ? pendingCandidate : null,
    lastTransition: lastCandidate.id ? lastCandidate : (history.at(-1) || null),
    transitionHistory: history.slice(-MAX_CITY_TRANSITIONS)
  };
}

function normalizeCityPlay(value, fallback = {}) {
  const source = asPlainObject(value);
  const fallbackSource = asPlainObject(fallback);
  const preferredQuality = CITY_PLAY_QUALITY_OPTIONS.has(String(source.preferredQuality || ''))
    ? String(source.preferredQuality)
    : (CITY_PLAY_QUALITY_OPTIONS.has(String(fallbackSource.preferredQuality || '')) ? String(fallbackSource.preferredQuality) : 'balanced');
  const lastLandmarkId = CITY_PLAY_LANDMARK_IDS.has(String(source.lastLandmarkId || ''))
    ? String(source.lastLandmarkId)
    : null;
  return {
    preferredQuality,
    reducedEffects: Boolean(source.reducedEffects),
    lastLandmarkId
  };
}

export function createCityWorldState({ now = Date.now(), citySeed = '', worldId = '' } = {}) {
  const resolvedWorldId = cleanText(worldId, makeId('city', now), 64);
  const resolvedSeed = cleanText(citySeed, stableSeed(`${resolvedWorldId}:${now}`), 48);
  return {
    version: CITY_WORLD_STATE_VERSION,
    worldId: resolvedWorldId,
    ownerRef: null,
    realmId: null,
    citySeed: resolvedSeed,
    districtGraph: [...CITY_DISTRICT_IDS],
    unlockedDistricts: ['command'],
    avatar: {
      name: 'Operator',
      x: 0.5,
      y: 0.82,
      direction: 'up',
      appearance: 'classic'
    },
    realmAppearance: {
      palette: 'classic-eon',
      landmark: 'command-beacon',
      landmarkStyle: 'observatory'
    },
    progress: {
      activeObjective: 'visit-command-centre',
      completedObjectives: [],
      visitCounts: {},
      lastDistrictId: null
    },
    safeInventoryRefs: [],
    play: {
      preferredQuality: 'balanced',
      reducedEffects: false,
      lastLandmarkId: null
    },
    navigation: {
      currentMode: 'portal',
      pendingTransition: null,
      lastTransition: null,
      transitionHistory: []
    },
    featureFlags: {
      city2d: true,
      optional3d: true,
      localOnly: true
    },
    updatedAt: iso(now)
  };
}

export function normalizeCityWorldState(candidate, { now = Date.now(), fallback } = {}) {
  const base = fallback ? createCityWorldState({
    now,
    citySeed: fallback.citySeed,
    worldId: fallback.worldId
  }) : createCityWorldState({ now });
  const source = asPlainObject(candidate);
  const avatar = asPlainObject(source.avatar);
  const progress = asPlainObject(source.progress);
  const realmAppearance = asPlainObject(source.realmAppearance);
  const cityPlay = asPlainObject(source.play);
  const navigation = asPlainObject(source.navigation);
  const hasCommand = normalizeDistrictIds(source.unlockedDistricts, ['command']).includes('command');
  const unlockedDistricts = normalizeDistrictIds(source.unlockedDistricts, ['command']);
  if (!hasCommand) unlockedDistricts.unshift('command');
  const lastDistrictId = CITY_DISTRICT_IDS.includes(String(progress.lastDistrictId || ''))
    ? String(progress.lastDistrictId)
    : null;
  const activeObjective = cleanText(progress.activeObjective, base.progress.activeObjective, 64);
  const direction = ['up', 'down', 'left', 'right'].includes(String(avatar.direction || ''))
    ? String(avatar.direction)
    : base.avatar.direction;
  const appearance = ['classic', 'graphite', 'aurora'].includes(String(avatar.appearance || ''))
    ? String(avatar.appearance)
    : base.avatar.appearance;

  return {
    version: CITY_WORLD_STATE_VERSION,
    worldId: cleanText(source.worldId, base.worldId, 64),
    ownerRef: null,
    realmId: REALM_ID_PATTERN.test(String(source.realmId || '')) ? String(source.realmId) : null,
    citySeed: cleanText(source.citySeed, base.citySeed, 48),
    districtGraph: [...CITY_DISTRICT_IDS],
    unlockedDistricts,
    avatar: {
      name: cleanText(avatar.name, base.avatar.name, 32),
      x: clamp(avatar.x, 0.035, 0.965),
      y: clamp(avatar.y, 0.06, 0.94),
      direction,
      appearance
    },
    realmAppearance: {
      palette: REALM_PALETTES.has(String(realmAppearance.palette || ''))
        ? String(realmAppearance.palette)
        : base.realmAppearance.palette,
      landmark: CITY_DISTRICT_IDS.includes(String(realmAppearance.landmark || ''))
        ? String(realmAppearance.landmark)
        : base.realmAppearance.landmark,
      landmarkStyle: REALM_LANDMARK_STYLES.has(String(realmAppearance.landmarkStyle || ''))
        ? String(realmAppearance.landmarkStyle)
        : base.realmAppearance.landmarkStyle
    },
    progress: {
      activeObjective,
      completedObjectives: normalizeCompleted(progress.completedObjectives),
      visitCounts: normalizeVisitCounts(progress.visitCounts),
      lastDistrictId
    },
    safeInventoryRefs: normalizeSafeRefs(source.safeInventoryRefs),
    // W250 V2 migration retains V1 data and only accepts renderer preferences.
    play: normalizeCityPlay(cityPlay, base.play),
    navigation: normalizeCityNavigation(navigation, base.navigation),
    featureFlags: {
      city2d: true,
      optional3d: true,
      localOnly: true
    },
    updatedAt: iso(now)
  };
}

function parseState(raw) {
  if (!raw || raw.length > 24000) return null;
  try {
    const parsed = JSON.parse(raw);
    return asPlainObject(parsed);
  } catch {
    return null;
  }
}

export function readCityWorldState({ storage, now = Date.now() } = {}) {
  const resolvedStorage = getStorage(storage);
  const current = parseState(safeGet(resolvedStorage, CITY_WORLD_STATE_KEY));
  if (current) {
    return {
      state: normalizeCityWorldState(current, { now, fallback: current }),
      source: 'current',
      migrated: false,
      created: false,
      preservedLegacySource: false
    };
  }
  for (const key of CITY_WORLD_LEGACY_KEYS) {
    const legacy = parseState(safeGet(resolvedStorage, key));
    if (!legacy) continue;
    const state = normalizeCityWorldState(legacy, { now, fallback: legacy });
    return {
      state,
      source: key,
      migrated: true,
      created: false,
      preservedLegacySource: true
    };
  }
  return {
    state: createCityWorldState({ now }),
    source: 'default',
    migrated: false,
    created: true,
    preservedLegacySource: false
  };
}

export function persistCityWorldState(state, { storage, now = Date.now() } = {}) {
  const resolvedStorage = getStorage(storage);
  const normalized = normalizeCityWorldState(state, { now, fallback: state });
  const ok = safeSet(resolvedStorage, CITY_WORLD_STATE_KEY, JSON.stringify(normalized));
  return { ok, state: normalized, key: CITY_WORLD_STATE_KEY };
}

export function ensureCityWorldState({ storage, now = Date.now() } = {}) {
  const resolvedStorage = getStorage(storage);
  const loaded = readCityWorldState({ storage: resolvedStorage, now });
  const currentRaw = safeGet(resolvedStorage, CITY_WORLD_STATE_KEY);
  let backupKey = null;
  if (currentRaw && !parseState(currentRaw)) {
    backupKey = `${CITY_WORLD_STATE_KEY}:corrupt:${Number(now).toString(36)}`;
    safeSet(resolvedStorage, backupKey, currentRaw.slice(0, 24000));
  }
  const result = persistCityWorldState(loaded.state, { storage: resolvedStorage, now });
  return {
    ...loaded,
    ...result,
    backupKey
  };
}

export function updateCityWorldState(updater, { storage, now = Date.now() } = {}) {
  const loaded = ensureCityWorldState({ storage, now });
  const nextCandidate = typeof updater === 'function' ? updater(loaded.state) : loaded.state;
  const saved = persistCityWorldState(nextCandidate, { storage, now });
  return { ...loaded, ...saved };
}

export function moveCityAvatar(position = {}, options = {}) {
  return updateCityWorldState((state) => ({
    ...state,
    avatar: {
      ...state.avatar,
      x: clamp(position.x, 0.035, 0.965),
      y: clamp(position.y, 0.06, 0.94),
      direction: ['up', 'down', 'left', 'right'].includes(String(position.direction || ''))
        ? String(position.direction)
        : state.avatar.direction
    }
  }), options);
}

export function recordCityDistrictVisit(districtId, options = {}) {
  const id = CITY_DISTRICT_IDS.includes(String(districtId || '')) ? String(districtId) : null;
  if (!id) return ensureCityWorldState(options);
  return updateCityWorldState((state) => {
    const completed = new Set(state.progress.completedObjectives);
    const has = (objective) => completed.has(objective);

    // The First Circuit is a small, honest RPG-style return loop. It is not an
    // earning loop: each marker is local presentation progress only.
    if (id === 'command' && !has('visit-command-centre')) {
      completed.add('visit-command-centre');
    } else if (id === 'workspace' && has('visit-command-centre') && !has('visit-workspace')) {
      completed.add('visit-workspace');
    } else if (id === 'realm' && has('visit-workspace') && !has('visit-realm-studio')) {
      completed.add('visit-realm-studio');
    } else if (id === 'command' && has('visit-realm-studio') && !has('return-to-command-centre')) {
      completed.add('return-to-command-centre');
      completed.add('first-circuit-complete');
    }

    const visits = { ...state.progress.visitCounts, [id]: Math.min(9999, (state.progress.visitCounts[id] || 0) + 1) };
    const unlocked = state.unlockedDistricts.includes(id) ? state.unlockedDistricts : [...state.unlockedDistricts, id];
    const nextActiveObjective = completed.has('first-circuit-complete')
      ? 'explore-at-your-pace'
      : 'first-circuit';
    return {
      ...state,
      unlockedDistricts: normalizeDistrictIds(unlocked, ['command']),
      progress: {
        ...state.progress,
        activeObjective: nextActiveObjective,
        completedObjectives: [...completed],
        visitCounts: visits,
        lastDistrictId: id
      }
    };
  }, options);
}

/** Stores only explicit City Play presentation preferences after a user choice. */
export function updateCityPlayPreferences(preferences = {}, options = {}) {
  const source = asPlainObject(preferences);
  return updateCityWorldState((state) => ({
    ...state,
    play: normalizeCityPlay({ ...state.play, ...source }, state.play)
  }), options);
}

/** Records a local landmark interaction without an achievement, reward, or analytics event. */
export function recordCityPlayLandmark(landmarkId, options = {}) {
  const id = CITY_PLAY_LANDMARK_IDS.has(String(landmarkId || '')) ? String(landmarkId) : null;
  if (!id) return ensureCityWorldState(options);
  return updateCityWorldState((state) => ({
    ...state,
    play: normalizeCityPlay({ ...state.play, lastLandmarkId: id }, state.play)
  }), options);
}

export function addCitySafeInventoryReference(reference, options = {}) {
  const clean = String(reference || '').trim();
  if (!SAFE_REF_PATTERN.test(clean)) return ensureCityWorldState(options);
  return updateCityWorldState((state) => ({
    ...state,
    safeInventoryRefs: normalizeSafeRefs([...state.safeInventoryRefs, clean])
  }), options);
}


/** Binds a local Realm identity to CityWorldState without copying profile or Vault data. */
export function bindCityRealm(realm = {}, options = {}) {
  const realmId = REALM_ID_PATTERN.test(String(realm.id || realm.publicRealmId || ''))
    ? String(realm.id || realm.publicRealmId)
    : null;
  const palette = REALM_PALETTES.has(String(realm.theme || '')) ? String(realm.theme) : 'classic-eon';
  const landmark = CITY_DISTRICT_IDS.includes(String(realm.entryDistrict || '')) ? String(realm.entryDistrict) : 'realm';
  const landmarkStyle = REALM_LANDMARK_STYLES.has(String(realm.landmarkStyle || realm.landmark || ''))
    ? String(realm.landmarkStyle || realm.landmark)
    : 'observatory';
  return updateCityWorldState((state) => ({
    ...state,
    realmId,
    realmAppearance: { palette, landmark, landmarkStyle }
  }), options);
}

export function clearCityWorldStateForTest({ storage } = {}) {
  const resolvedStorage = getStorage(storage);
  safeRemove(resolvedStorage, CITY_WORLD_STATE_KEY);
}

export function getCityWorldPublicSummary(state) {
  const normalized = normalizeCityWorldState(state, { fallback: state });
  return {
    version: normalized.version,
    worldId: normalized.worldId,
    citySeed: normalized.citySeed,
    realmId: normalized.realmId,
    realmAppearance: { ...normalized.realmAppearance },
    districtGraph: [...normalized.districtGraph],
    unlockedDistricts: [...normalized.unlockedDistricts],
    avatar: { ...normalized.avatar },
    progress: {
      activeObjective: normalized.progress.activeObjective,
      completedObjectives: [...normalized.progress.completedObjectives],
      visitCounts: { ...normalized.progress.visitCounts },
      lastDistrictId: normalized.progress.lastDistrictId
    },
    safeInventoryRefs: [...normalized.safeInventoryRefs],
    play: { ...normalized.play },
    navigation: {
      currentMode: normalized.navigation.currentMode,
      lastTransition: normalized.navigation.lastTransition ? { ...normalized.navigation.lastTransition } : null,
      transitionHistory: normalized.navigation.transitionHistory.map((entry) => ({ ...entry }))
    },
    updatedAt: normalized.updatedAt
  };
}
