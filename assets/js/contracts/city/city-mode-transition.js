/**
 * A15 I03 — Core-owned City contract extracted from assets/js/city/city-mode-transition.js.
 * Rendering/runtime implementation remains under assets/js/city; this module
 * is safe for Core routes and contains no City implementation imports.
 */
/**
 * W361 — shared City mode-transition contract.
 *
 * This module carries only a small, local navigation receipt between City modes
 * and native EONAPP surfaces. It never stores prompts, model output, credentials,
 * private files, payment data, analytics identifiers, or a hidden execution plan.
 * Navigation remains a normal user link; this module only records the user-selected
 * destination so a native surface can provide a truthful return path.
 */
import {
  CITY_NAVIGATION_MODE_IDS,
  ensureCityWorldState,
  getCityWorldPublicSummary,
  updateCityWorldState
} from './city-world-state.js';
import { CITY_ACTIONABLE_LANDMARK_IDS } from './city-landmark-registry.js';

export const CITY_MODE_TRANSITION_SCHEMA = 'eon.city.mode-transition.v1';
export const CITY_MODE_IDS = CITY_NAVIGATION_MODE_IDS;

export const RETIRED_CITY_MODE_PATHS = Object.freeze(new Set([
  '/realm', '/realm.html', '/realmworld', '/realmworld.html', '/team-realm', '/team-realm.html', '/world', '/game', '/games.html',
  '/eoncity.html', '/eoncity/lite', '/eoncity/lite.html', '/eoncity/tour', '/eoncity/3d', '/eoncity/play',
  '/eoncity-lite.html', '/eoncity-3d', '/eoncity-3d.html', '/eoncity-play', '/eoncity-play.html'
]));

// The legacy identifiers are retained only so old local receipts can normalize safely.
// They no longer identify a public renderer, map or navigation destination.
export const CITY_MODE_ROUTES = Object.freeze({
  portal: '/eoncity',
  overview: '/eoncity',
  'command-space': '/eoncity',
  'immersive-work': '/eoncity',
  chat: '/',
  workspace: '/workspace',
  automations: '/automations',
  apps: '/apps',
  'local-ai': '/local-ai',
  'realm-studio': '/realm-studio',
  projects: '/projects',
  library: '/library'
});

const MAX_HISTORY = 12;
const CITY_ACTIONABLE_LANDMARK_SET = new Set(CITY_ACTIONABLE_LANDMARK_IDS);
const SAFE_ENTRY_IDS = new Set(['portal', 'overview', 'command-space', 'immersive-work', 'direct-city-entry', 'chat', 'workspace', 'automations', 'apps', 'local-ai', 'realm-studio', 'projects', 'library', 'city-landmark', 'native-surface']);

function nowIso(now = Date.now()) {
  const value = Number(now);
  return new Date(Number.isFinite(value) ? value : Date.now()).toISOString();
}

function safeMode(value, fallback = 'portal') {
  const mode = String(value || '').trim();
  return CITY_MODE_IDS.includes(mode) ? mode : fallback;
}

function safeEntry(value, fallback = 'native-surface') {
  const entry = String(value || '').trim();
  return SAFE_ENTRY_IDS.has(entry) ? entry : fallback;
}

function safeLandmarkId(value) {
  const landmark = String(value || '').trim();
  return CITY_ACTIONABLE_LANDMARK_SET.has(landmark) ? landmark : null;
}

function makeTransitionId(now = Date.now()) {
  let random = '';
  try {
    const bytes = new Uint32Array(1);
    globalThis.crypto?.getRandomValues?.(bytes);
    random = bytes[0].toString(36);
  } catch {}
  if (!random) random = Math.floor(Math.random() * 0x7fffffff).toString(36);
  return `citynav-${Number(now).toString(36)}-${random}`.slice(0, 64);
}

function sameOriginUrl(rawHref, base = globalThis.location?.href || 'https://eonapp.invalid/') {
  try {
    const url = new URL(rawHref, base);
    const current = new URL(base);
    return url.origin === current.origin ? url : null;
  } catch {
    return null;
  }
}

export function getCityModeForPath(pathname = '') {
  const path = String(pathname || '').replace(/\/+$/, '') || '/';
  if (RETIRED_CITY_MODE_PATHS.has(path)) return null;
  return Object.entries(CITY_MODE_ROUTES).find(([, route]) => route === path)?.[0] || null;
}

export function getCityModeRoute(mode, fallback = '/eoncity') {
  return CITY_MODE_ROUTES[safeMode(mode)] || fallback;
}

export function createCityModeTransition({ fromMode = 'portal', toMode = 'overview', entry = 'native-surface', landmarkId = null, now = Date.now() } = {}) {
  const from = safeMode(fromMode);
  const to = safeMode(toMode);
  return Object.freeze({
    schema: CITY_MODE_TRANSITION_SCHEMA,
    id: makeTransitionId(now),
    fromMode: from,
    toMode: to,
    entry: safeEntry(entry),
    landmarkId: safeLandmarkId(landmarkId),
    at: nowIso(now)
  });
}

export function prepareCityModeTransition(options = {}) {
  const transition = createCityModeTransition(options);
  if (transition.fromMode === transition.toMode) {
    return Object.freeze({ ok: true, changed: false, transition, state: ensureCityWorldState(options).state });
  }
  const saved = updateCityWorldState((state) => ({
    ...state,
    navigation: {
      ...state.navigation,
      pendingTransition: transition,
      lastTransition: transition,
      transitionHistory: [...(state.navigation?.transitionHistory || []), transition].slice(-MAX_HISTORY)
    }
  }), options);
  return Object.freeze({ ok: Boolean(saved.ok), changed: true, transition, state: saved.state });
}

/**
 * Confirms a City/native page entry. A direct browser navigation is valid too;
 * it is recorded as a direct local entry rather than pretending it was a City handoff.
 */
export function enterCityMode(mode, { storage, now = Date.now(), entry = 'native-surface' } = {}) {
  const nextMode = safeMode(mode);
  const loaded = ensureCityWorldState({ storage, now });
  const pending = loaded.state.navigation?.pendingTransition;
  const confirmed = pending && pending.toMode === nextMode ? pending : null;
  const direct = confirmed || createCityModeTransition({
    fromMode: safeMode(loaded.state.navigation?.currentMode, 'portal'),
    toMode: nextMode,
    entry: confirmed?.entry || entry,
    landmarkId: confirmed?.landmarkId || null,
    now
  });
  const saved = updateCityWorldState((state) => ({
    ...state,
    navigation: {
      ...state.navigation,
      currentMode: nextMode,
      pendingTransition: null,
      lastTransition: direct,
      transitionHistory: [...(state.navigation?.transitionHistory || []), direct].slice(-MAX_HISTORY)
    }
  }), { storage, now });
  return Object.freeze({ ok: Boolean(saved.ok), state: saved.state, transition: direct, handoff: Boolean(confirmed) });
}

export function getCityModeReturnTarget({ storage, fallback = '/eoncity' } = {}) {
  const state = ensureCityWorldState({ storage }).state;
  const navigation = state.navigation || {};
  const preferred = navigation.lastTransition?.fromMode || navigation.currentMode || 'portal';
  const mode = safeMode(preferred, 'portal');
  return Object.freeze({
    mode,
    href: getCityModeRoute(mode, fallback),
    summary: getCityWorldPublicSummary(state)
  });
}

/**
 * Tracks ordinary same-origin City/native anchor activation. It deliberately does
 * not intercept navigation, alter links, submit a form, or handle modified clicks.
 */
export function bindCityModeLinkTracking(root = document, fromMode = 'portal', options = {}) {
  if (!root?.addEventListener) return () => {};
  const sourceMode = safeMode(fromMode);
  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    const url = sameOriginUrl(anchor.getAttribute('href') || '', options.baseUrl);
    if (!url) return;
    const destinationMode = getCityModeForPath(url.pathname);
    if (!destinationMode || destinationMode === sourceMode) return;
    prepareCityModeTransition({
      ...options,
      fromMode: sourceMode,
      toMode: destinationMode,
      entry: options.entry || sourceMode,
      landmarkId: anchor.dataset?.cityLandmark || null
    });
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

export function getCityModeTransitionTruth() {
  return Object.freeze({
    schema: CITY_MODE_TRANSITION_SCHEMA,
    modes: [...CITY_MODE_IDS],
    routes: { ...CITY_MODE_ROUTES },
    localOnly: true,
    stores: ['mode identifiers', 'safe landmark identifier', 'timestamp', 'local transition receipt'],
    neverStores: ['prompts', 'AI output', 'credentials', 'private files', 'payment data', 'wallet data', 'background execution state'],
    execution: 'none'
  });
}
