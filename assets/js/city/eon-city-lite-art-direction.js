/**
 * W363 — EON City Lite art direction and local visual-quality preferences.
 *
 * This module contains deterministic presentation metadata only. It does not
 * request assets, contact a provider, create a City action, or expose private
 * local work. The map renderer uses it to keep the 2.5D overview rich on
 * capable devices and deliberately quiet on constrained or reduced-motion
 * devices.
 */

export const EON_CITY_LITE_ART_DIRECTION_SCHEMA = 'eon.city.lite-art-direction.v1';
export const EON_CITY_LITE_VISUAL_PREFERENCES_KEY = 'eon:city:lite:visual-preferences:v1';
export const EON_CITY_LITE_VISUAL_QUALITY_IDS = Object.freeze(['auto', 'high', 'conserve']);

const DEFAULT_PREFERENCES = Object.freeze({
  schema: EON_CITY_LITE_ART_DIRECTION_SCHEMA,
  version: 1,
  quality: 'auto'
});

const DISTRICT_ART = Object.freeze({
  command: Object.freeze({
    silhouette: 'command-spire',
    roof: 'signal-crown',
    accent: '#5eead4',
    material: 'obsidian-glass',
    transitStop: 'Command Loop',
    landmarkLine: 'EONBOT command beacon'
  }),
  workspace: Object.freeze({
    silhouette: 'twin-workshop',
    roof: 'crane-rig',
    accent: '#a5b4fc',
    material: 'indigo-alloy',
    transitStop: 'Builder Link',
    landmarkLine: 'Project fabrication bays'
  }),
  market: Object.freeze({
    silhouette: 'gallery-arcade',
    roof: 'light-ribbon',
    accent: '#fbbf24',
    material: 'warm-metal',
    transitStop: 'Preview Arcade',
    landmarkLine: 'Local preview gallery'
  }),
  realm: Object.freeze({
    silhouette: 'realm-gate',
    roof: 'portal-arch',
    accent: '#c4b5fd',
    material: 'violet-stone',
    transitStop: 'Realm Relay',
    landmarkLine: 'Portable Realm signal'
  }),
  library: Object.freeze({
    silhouette: 'archive-stacks',
    roof: 'stacked-terrace',
    accent: '#93c5fd',
    material: 'archive-glass',
    transitStop: 'Archive Walk',
    landmarkLine: 'Knowledge stacks'
  }),
  trade: Object.freeze({
    silhouette: 'research-observatory',
    roof: 'sensor-dome',
    accent: '#fb7185',
    material: 'rose-ceramic',
    transitStop: 'Local AI Line',
    landmarkLine: 'Local model observatory'
  }),
  vault: Object.freeze({
    silhouette: 'vault-bastion',
    roof: 'quiet-rampart',
    accent: '#34d399',
    material: 'secure-stone',
    transitStop: 'Safehouse Spur',
    landmarkLine: 'Separated security boundary'
  }),
  orientation: Object.freeze({
    silhouette: 'orientation-atrium',
    roof: 'open-canopy',
    accent: '#67e8f9',
    material: 'clear-alloy',
    transitStop: 'Arrival Square',
    landmarkLine: 'City orientation atrium'
  })
});

function sanitizeQuality(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  return EON_CITY_LITE_VISUAL_QUALITY_IDS.includes(normalized) ? normalized : DEFAULT_PREFERENCES.quality;
}

function safeStorage(storage) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage; } catch { return null; }
}

function safeBoolean(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function safeDeviceMemory(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function getCityLiteDistrictArt(districtId = '') {
  return DISTRICT_ART[String(districtId || '').trim()] || Object.freeze({
    silhouette: 'civic-marker',
    roof: 'quiet-roofline',
    accent: '#cbd5e1',
    material: 'neutral-alloy',
    transitStop: 'City Loop',
    landmarkLine: 'EON City landmark'
  });
}

export function listCityLiteDistrictArt() {
  return Object.freeze(Object.entries(DISTRICT_ART).map(([districtId, art]) => Object.freeze({ districtId, ...art })));
}

export function readCityLiteVisualPreferences({ storage } = {}) {
  const target = safeStorage(storage);
  if (!target) return { ...DEFAULT_PREFERENCES };
  try {
    const parsed = JSON.parse(target.getItem(EON_CITY_LITE_VISUAL_PREFERENCES_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PREFERENCES };
    return Object.freeze({
      schema: EON_CITY_LITE_ART_DIRECTION_SCHEMA,
      version: 1,
      quality: sanitizeQuality(parsed.quality)
    });
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveCityLiteVisualPreferences(input = {}, { storage } = {}) {
  const next = Object.freeze({
    schema: EON_CITY_LITE_ART_DIRECTION_SCHEMA,
    version: 1,
    quality: sanitizeQuality(input?.quality)
  });
  const target = safeStorage(storage);
  if (!target) return next;
  try { target.setItem(EON_CITY_LITE_VISUAL_PREFERENCES_KEY, JSON.stringify(next)); } catch {}
  return next;
}

/**
 * Resolves a display-only profile. Reduced-motion and data-saver requests win
 * over a manual high-detail preference; this avoids a cosmetic setting that
 * ignores accessibility or battery intent.
 */
export function resolveCityLiteVisualProfile(input = {}) {
  const requestedQuality = sanitizeQuality(input.quality);
  const reducedMotion = safeBoolean(input.reducedMotion);
  const saveData = safeBoolean(input.saveData);
  const deviceMemory = safeDeviceMemory(input.deviceMemory);
  const constrained = reducedMotion || saveData || (deviceMemory !== null && deviceMemory <= 2);
  let quality = requestedQuality;
  if (constrained) quality = 'conserve';
  else if (quality === 'auto') quality = deviceMemory !== null && deviceMemory >= 6 ? 'high' : 'balanced';

  const table = {
    high: { skylineLayers: 3, transitLights: 10, rain: true, drones: 6, particles: 52, labelDensity: 'full' },
    balanced: { skylineLayers: 2, transitLights: 5, rain: true, drones: 2, particles: 22, labelDensity: 'standard' },
    conserve: { skylineLayers: 1, transitLights: 0, rain: false, drones: 0, particles: 0, labelDensity: 'essential' }
  };
  const selected = table[quality] || table.balanced;
  return Object.freeze({
    schema: EON_CITY_LITE_ART_DIRECTION_SCHEMA,
    requestedQuality,
    quality,
    constrained,
    reducedMotion,
    saveData,
    deviceMemory,
    ...selected,
    localOnly: true,
    execution: 'none',
    neverShows: Object.freeze(['private prompts', 'AI outputs', 'provider keys', 'Vault data', 'payment data', 'hidden agent activity'])
  });
}

export function validateCityLiteArtDirection() {
  const errors = [];
  if (!EON_CITY_LITE_VISUAL_QUALITY_IDS.includes(DEFAULT_PREFERENCES.quality)) errors.push('default-quality-invalid');
  const expected = ['command', 'workspace', 'market', 'realm', 'library', 'trade', 'vault', 'orientation'];
  for (const districtId of expected) {
    const art = DISTRICT_ART[districtId];
    if (!art?.silhouette || !art?.accent || !art?.transitStop) errors.push(`district-art-invalid:${districtId}`);
  }
  const profile = resolveCityLiteVisualProfile({ quality: 'high', reducedMotion: true });
  if (profile.quality !== 'conserve') errors.push('accessibility-profile-not-enforced');
  return Object.freeze(errors);
}
