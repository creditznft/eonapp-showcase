import { eonStorageGateway, EON_STORAGE_CLASSES } from './storage-gateway.js';

// Browser global type cast for custom window properties
const appWin = /** @type {any} */ (typeof window !== 'undefined' ? window : globalThis);

/** @param {string} key */
function safeGetItem(/** @type {any} */ key) {
  const result = eonStorageGateway.getRaw(String(key));
  return result.ok ? result.value : null;
}

/** @param {string} key @param {string} value @param {'durable'|'ephemeral'} [storageClass] */
function safeSetItem(/** @type {any} */ key, /** @type {any} */ value, storageClass = EON_STORAGE_CLASSES.DURABLE) {
  const result = eonStorageGateway.setRaw(String(key), String(value), { storageClass });
  return result.ok;
}

/** @param {string} key @param {unknown} fallback */
function safeParseJson(/** @type {any} */ key, /** @type {any} */ fallback) {
  const result = eonStorageGateway.getJson(String(key), fallback);
  return result.ok ? result.value : fallback;
}

/**
 * EONAPP.ch — storage.js
 * Theme preferences remain local to this browser profile. Graphite is the
 * product default; the product supports dark themes only: Graphite, Obsidian
 * and Ember. Older Classic EON/System values migrate to Graphite. Retired Neon Night
 * values also migrate to Graphite without creating a remote profile or account setting.
 */
export const EON_THEME_STORAGE_KEY = 'eon:theme';
export const EON_THEME_EXPLICIT_KEY = 'eon:theme:explicit:v2';
export const EON_THEME_OPTIONS = Object.freeze(['graphite', 'obsidian', 'ember']);
export const EON_THEME_DEFAULT = 'graphite';

export function normalizeEonTheme(value = '') {
  const candidate = String(value || '').trim().toLowerCase();
  const migration = { 'classic-eon': 'graphite', system: 'graphite', 'neon-night': 'graphite' };
  const normalized = migration[candidate] || candidate;
  return EON_THEME_OPTIONS.includes(normalized) ? normalized : EON_THEME_DEFAULT;
}

function applyThemeAttribute(theme) {
  try { document.documentElement.setAttribute('data-theme', theme); } catch {}
  return theme;
}

export function getEonTheme() {
  const raw = safeGetItem(EON_THEME_STORAGE_KEY);
  // Earlier releases stored Classic EON or System. Both now migrate to Graphite.
  // Theme choice remains local to this browser profile.
  return normalizeEonTheme(raw);
}

export function setEonTheme(value = '') {
  const theme = normalizeEonTheme(value);
  applyThemeAttribute(theme);
  safeSetItem(EON_THEME_STORAGE_KEY, theme);
  safeSetItem(EON_THEME_EXPLICIT_KEY, 'true');
  try { window.dispatchEvent(new CustomEvent('eon:theme-changed', { detail: { theme } })); } catch {}
  return theme;
}

export function initTheme() {
  const theme = getEonTheme();
  applyThemeAttribute(theme);
  // Persist the Graphite default or a safe migration without marking it as an account preference.
  if (safeGetItem(EON_THEME_STORAGE_KEY) !== theme) safeSetItem(EON_THEME_STORAGE_KEY, theme);
  return theme;
}

export { initTheme as applyTheme, initTheme as initThemeToggle };

export function getStreak(/** @type {any} */ key) {
  const data = safeParseJson(`eon:streak:${key}`, { count: 0, lastDate: '' });
  const today = new Date().toDateString();
  if (data.lastDate === today) return data;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const count = data.lastDate === yesterday ? (Number(data.count) || 0) + 1 : 1;
  const /** @type {any} */
updated = { count, lastDate: today };
  safeSetItem(`eon:streak:${key}`, JSON.stringify(updated));
  return updated;
}

export function getBadges() {
  const badges = safeParseJson('eon:badges', []);
  return Array.isArray(badges) ? badges.filter((/** @type {any} */ badge) => typeof badge === 'string').slice(0, 128) : [];
}

export function awardBadge(/** @type {any} */ badge) {
  const badges = getBadges();
  if (!badges.includes(badge)) {
    badges.push(badge);
    safeSetItem('eon:badges', JSON.stringify(badges));
    return true; // new badge
  }
  return false;
}

export function getToolRuns(/** @type {any} */ toolId) {
  return Number.parseInt(safeGetItem(`eon:runs:${toolId}`) || '0', 10) || 0;
}

export function saveScore(/** @type {any} */ game, /** @type {any} */ score) {
  // Validate score is a reasonable number
  const validatedScore = validateScore(score);
  if (validatedScore === null) {
    if (appWin.DEBUG) console.warn('[Storage] Invalid score rejected:', score);
    return false;
  }

  const key = `eon:score:${game}`;
  const best = Number.parseInt(safeGetItem(key) || '0', 10) || 0;
  if (validatedScore > best) {
    safeSetItem(key, String(validatedScore));
    return true; // new high score
  }
  return false;
}

/**
 * Validate score to prevent obvious manipulation
 * @param {any} score - Score to validate
 * @returns {number|null} - Validated score or null if invalid
 */
export function validateScore(/** @type {any} */ score) {
  // Must be a number
  if (typeof score !== 'number' || !Number.isFinite(score)) {
    return null;
  }

  // Must be non-negative
  if (score < 0) {
    return null;
  }

  // Must be integer (most games use integer scores)
  if (!Number.isInteger(score)) {
    return null;
  }

  // Must be within reasonable bounds (max 1 billion)
  if (score > 1_000_000_000) {
    return null;
  }

  return score;
}

/**
 * Save score with proof verification
 * @param {string} game - Game ID
 * @param {number} score - Score to save
 * @param {object} proof - Optional proof from SecureScore
 * @returns {boolean} - Whether score was saved
 */
export function saveScoreWithProof(/** @type {any} */ game, /** @type {any} */ score, /** @type {any} */ proof = null) {
  // If proof provided, verify it
  if (proof) {
    if (!verifyScoreProof(game, score, proof)) {
      if (appWin.DEBUG) console.warn('[Storage] Score proof verification failed');
      return false;
    }
  }

  return saveScore(game, score);
}

/**
 * Basic proof verification (server does full verification)
 * @param {string} game - Game ID
 * @param {number} score - Score to verify
 * @param {object} proof - Proof object
 * @returns {boolean} - Whether proof is valid
 */
function verifyScoreProof(/** @type {any} */ game, /** @type {any} */ score, /** @type {any} */ proof) {
  // Check proof structure
  if (!proof || typeof proof !== 'object') {
    return false;
  }

  // Check game ID matches
  if ((/** @type {any} */ (proof)).gameId !== game) {
    return false;
  }

  // Check score matches
  if ((/** @type {any} */ (proof)).finalScore !== score) {
    return false;
  }

  // Check has required fields
  if (!(/** @type {any} */ (proof)).sessionId || !(/** @type {any} */ (proof)).stateHash || typeof (/** @type {any} */ (proof)).actionCount !== 'number') {
    return false;
  }

  // Check action count is reasonable
  if ((/** @type {any} */ (proof)).actionCount < 0 || (/** @type {any} */ (proof)).actionCount > 1000) {
    return false;
  }

  // Check duration is reasonable
  if (typeof (/** @type {any} */ (proof)).duration === 'number' && ((/** @type {any} */ (proof)).duration < 0 || (/** @type {any} */ (proof)).duration > 86400)) {
    return false;
  }

  // Check duration is reasonable (at least 1 second per 100 points)
  const minDuration = Math.floor(score / 100) * 1000;
  if (typeof (/** @type {any} */ (proof)).duration === 'number' && (/** @type {any} */ (proof)).duration < minDuration) {
    return false;
  }

  return true;
}
