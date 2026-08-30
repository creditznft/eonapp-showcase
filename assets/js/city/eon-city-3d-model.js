/**
 * W224 — pure CityWorldState-to-3D scene projection and local preferences.
 *
 * Kept free of WebGL/Three so it can be verified in Node and reused by every
 * renderer without introducing a separate city data model.
 */
import { CITY_DISTRICTS } from './eon-city-2d-engine.js';
import { getCityWorldPublicSummary, normalizeCityWorldState } from './city-world-state.js';

export const CITY_3D_RENDERER_SCHEMA = 'eon.city.webgl-renderer.v2';
export const CITY_3D_PREFERENCES_KEY = 'eon:city:3d:preferences:v1';
export const CITY_3D_QUALITY_PRESETS = Object.freeze({
  low: Object.freeze({ label: 'Low', pixelRatio: 1, minPixelRatio: .78, shadows: false, antialias: false, detail: 0, maxFps: 30, frameBudgetMs: 34 }),
  balanced: Object.freeze({ label: 'Balanced', pixelRatio: 1.35, minPixelRatio: 1, shadows: false, antialias: true, detail: 1, maxFps: 45, frameBudgetMs: 25 }),
  high: Object.freeze({ label: 'High', pixelRatio: 1.75, minPixelRatio: 1.2, shadows: true, antialias: true, detail: 2, maxFps: 60, frameBudgetMs: 18 })
});

const QUALITY_IDS = Object.freeze(Object.keys(CITY_3D_QUALITY_PRESETS));
export const CITY_3D_WORLD_WIDTH = 30;
export const CITY_3D_WORLD_DEPTH = 20;

function storageOrNull(storage = null) {
  if (storage && typeof storage.getItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function safeJson(value) {
  try { return JSON.parse(String(value || '')); } catch { return null; }
}

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function safeString(value = '', fallback = '', max = 80) {
  const output = Array.from(String(value || ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code < 32 || code === 127 ? '' : character;
  }).join('').trim().slice(0, max);
  return output || fallback;
}

function hashString(value = '') {
  let hash = 2166136261;
  for (const char of String(value || '')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function hashUnit(value = '') {
  return (hashString(value) % 10000) / 10000;
}

function paletteFor(value = '') {
  const palette = String(value || 'classic-eon');
  const palettes = {
    graphite: { sky: '#0b1120', ground: '#111827', accent: '#cbd5e1', fog: '#0b1020' },
    aurora: { sky: '#0b1730', ground: '#0f1f2b', accent: '#5eead4', fog: '#0a1530' },
    'dark-purple': { sky: '#170d2b', ground: '#160f2a', accent: '#c4b5fd', fog: '#120a22' },
    'neon-city': { sky: '#07162a', ground: '#071321', accent: '#22d3ee', fog: '#06111f' },
    'forest-circuit': { sky: '#0c201b', ground: '#0a1a16', accent: '#86efac', fog: '#0a1815' },
    minimal: { sky: '#16202c', ground: '#111827', accent: '#93c5fd', fog: '#111827' },
    'classic-eon': { sky: '#0d1931', ground: '#0b1426', accent: '#5eead4', fog: '#0b1426' }
  };
  return palettes[palette] || palettes['classic-eon'];
}

export function cityToWorld(point = {}) {
  return {
    x: (clamp(point.x, 0, 1) - 0.5) * CITY_3D_WORLD_WIDTH,
    z: (clamp(point.y, 0, 1) - 0.5) * CITY_3D_WORLD_DEPTH
  };
}

function districtCenter(district) {
  return cityToWorld({ x: district.x + district.width / 2, y: district.y + district.height / 2 });
}

function districtSize(district) {
  return {
    width: Math.max(2.8, district.width * CITY_3D_WORLD_WIDTH),
    depth: Math.max(2.5, district.height * CITY_3D_WORLD_DEPTH)
  };
}

function makeBuildingHeight(district, state) {
  const visits = Number(state?.progress?.visitCounts?.[district.id] || 0);
  const seed = hashUnit(`${state.citySeed}:${district.id}`);
  return Number((2.7 + seed * 2.8 + Math.min(0.8, visits * 0.08)).toFixed(2));
}

export function normalizeCity3dQuality(value = '', fallback = 'balanced') {
  const candidate = String(value || '').trim().toLowerCase();
  return QUALITY_IDS.includes(candidate) ? candidate : (QUALITY_IDS.includes(fallback) ? fallback : 'balanced');
}

/** Pure performance classification for the optional local renderer. */
export function assessCity3dPerformance(summary = {}, preset = CITY_3D_QUALITY_PRESETS.balanced) {
  const average = Number(summary.averageFrameMs || 0);
  const p95 = Number(summary.p95FrameMs || 0);
  const elapsed = Number(summary.elapsedMs || 0);
  if (!Number.isFinite(average) || average <= 0 || elapsed < 8000) return Object.freeze({ state: 'insufficient-samples', action: 'continue-or-use-2d' });
  if (summary.fallbackIssued === true) return Object.freeze({ state: 'fallback', action: 'use-2d' });
  const budget = Number(preset?.frameBudgetMs || 25);
  if (average <= budget * 1.1 && (!p95 || p95 <= budget * 1.7)) return Object.freeze({ state: 'stable', action: 'keep-quality' });
  if (average <= budget * 1.45) return Object.freeze({ state: 'cautious', action: 'lower-quality' });
  return Object.freeze({ state: 'unsafe', action: 'use-2d-or-lower-quality' });
}

export function getCity3dPreferences(options = {}) {
  const parsed = safeJson(storageOrNull(options.storage)?.getItem(CITY_3D_PREFERENCES_KEY));
  const preferredQuality = normalizeCity3dQuality(parsed?.preferredQuality, options.fallbackQuality || 'balanced');
  return Object.freeze({
    schema: CITY_3D_RENDERER_SCHEMA,
    preferredQuality,
    automaticFallbackTo2d: parsed?.automaticFallbackTo2d !== false,
    updatedAt: typeof parsed?.updatedAt === 'string' ? parsed.updatedAt : ''
  });
}

export function saveCity3dPreferences(input = {}, options = {}) {
  const next = {
    schema: CITY_3D_RENDERER_SCHEMA,
    preferredQuality: normalizeCity3dQuality(input.preferredQuality, 'balanced'),
    automaticFallbackTo2d: input.automaticFallbackTo2d !== false,
    updatedAt: new Date(Number(options.now || Date.now())).toISOString()
  };
  try { storageOrNull(options.storage)?.setItem(CITY_3D_PREFERENCES_KEY, JSON.stringify(next)); } catch {}
  return Object.freeze(next);
}

/**
 * Produces a renderer-safe projection. The source state is normalized and only
 * the safe public City summary crosses the renderer boundary.
 */
export function buildCity3dSceneModel(state, options = {}) {
  const normalized = normalizeCityWorldState(state, { fallback: state, now: options.now || Date.now() });
  const summary = getCityWorldPublicSummary(normalized);
  const palette = paletteFor(summary.realmAppearance.palette);
  const lastDistrictId = summary.progress.lastDistrictId || '';
  return Object.freeze({
    schema: CITY_3D_RENDERER_SCHEMA,
    worldId: summary.worldId,
    citySeed: summary.citySeed,
    palette: summary.realmAppearance.palette,
    paletteColors: palette,
    avatar: { ...summary.avatar },
    realm: { id: summary.realmId, landmark: summary.realmAppearance.landmark },
    objective: safeString(summary.progress.activeObjective, 'explore-at-your-pace', 64),
    districts: CITY_DISTRICTS.map((district) => Object.freeze({
      id: district.id,
      name: district.name,
      shortName: district.shortName,
      description: district.description,
      landmark: district.landmark || district.id,
      route: district.route,
      color: district.color,
      icon: district.icon,
      discovered: summary.unlockedDistricts.includes(district.id),
      visits: Math.min(9999, Number(summary.progress.visitCounts[district.id] || 0)),
      active: lastDistrictId === district.id,
      x: districtCenter(district).x,
      z: districtCenter(district).z,
      ...districtSize(district),
      height: makeBuildingHeight(district, summary)
    }))
  });
}

