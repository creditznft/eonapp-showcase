import { CITY_LANDMARKS, getCityLandmarkAction } from './city-landmark-registry.js';
import { getCapabilityTruth } from '../capabilities/capability-truth-registry.js';
import { getEonCityCommandDistrictDestination } from './eon-city-command-district-vertical-slice.js';

/**
 * W250/W255 — prepared City action contract.
 *
 * This module is route-only. Preparing an action never navigates. Confirmation
 * returns an internal href for a separate, visible user confirmation click.
 */
export const CITY_PREPARED_ACTION_SCHEMA = 'eon.city.prepared-action.v1';
export const CITY_PREPARED_ACTION_STORAGE_KEY = 'eon:city:prepared-actions:v1';
export const CITY_PREPARED_ACTION_TTL_MS = 10 * 60 * 1000;

export const CITY_PLAY_ACTION_DESTINATIONS = Object.freeze(Object.fromEntries(
  CITY_LANDMARKS.filter((landmark) => landmark.action).map((landmark) => [
    landmark.id,
    Object.freeze({
      id: landmark.action.id, landmarkId: landmark.id, landmarkLabel: landmark.name,
      destinationLabel: landmark.action.destinationLabel, route: landmark.action.route, purpose: landmark.action.purpose
    })
  ])
));

const CITY_ACTION_SOURCES = new Set(['city-lite', 'visual-tour', 'city-play']);
const CITY_MIRROR_TRUTH = getCapabilityTruth('eon-city-mirror');

const MAX_RECORDS = 8;
const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T/;

function storageFor(storage) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}
function nowIso(now) { return new Date(Number.isFinite(Number(now)) ? Number(now) : Date.now()).toISOString(); }
function makeId(now) {
  let random = '';
  try { const bytes = new Uint32Array(1); globalThis.crypto?.getRandomValues?.(bytes); random = bytes[0].toString(36); } catch {}
  if (!random) random = Math.floor(Math.random() * 0x7fffffff).toString(36);
  return `city-action-${Number(now).toString(36)}-${random}`.slice(0, 72);
}
function copyDestination(landmarkId) {
  const source = getCityLandmarkAction(landmarkId) || getEonCityCommandDistrictDestination(landmarkId);
  return source ? { ...source } : null;
}
function normalizeAction(candidate) {
  const source = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : {};
  const destination = copyDestination(source.landmarkId);
  if (!destination || !/^city-action-[a-z0-9-]{4,72}$/i.test(String(source.id || ''))) return null;
  const state = source.state === 'confirmed' ? 'confirmed' : 'prepared';
  const actionSource = CITY_ACTION_SOURCES.has(String(source.source || '')) ? String(source.source) : 'city-play';
  const preparedAt = String(source.preparedAt || '');
  const expiresAt = String(source.expiresAt || '');
  if (!ISO_PATTERN.test(preparedAt) || !ISO_PATTERN.test(expiresAt)) return null;
  return {
    schema: CITY_PREPARED_ACTION_SCHEMA,
    id: String(source.id), source: actionSource,
    landmarkId: destination.landmarkId, landmarkLabel: destination.landmarkLabel,
    destinationId: destination.id, destinationLabel: destination.destinationLabel,
    route: destination.route, purpose: destination.purpose,
    preparedAt, expiresAt, state,
    confirmedAt: state === 'confirmed' && ISO_PATTERN.test(String(source.confirmedAt || '')) ? String(source.confirmedAt) : null,
    requiresUserConfirmation: true,
    dataScope: 'route-only-no-private-data'
  };
}
function readRecords(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem(CITY_PREPARED_ACTION_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map(normalizeAction).filter(Boolean).slice(0, MAX_RECORDS) : [];
  } catch { return []; }
}
function writeRecords(records, storage) {
  try { storage?.setItem(CITY_PREPARED_ACTION_STORAGE_KEY, JSON.stringify(records.slice(0, MAX_RECORDS))); return true; } catch { return false; }
}
export function getCityPlayDestination(landmarkId) { return copyDestination(landmarkId); }
export function readPreparedCityActions({ storage } = {}) { return readRecords(storageFor(storage)); }
export function prepareCityAction(landmarkId, { storage, now = Date.now(), source = 'city-play' } = {}) {
  if (!CITY_MIRROR_TRUTH || CITY_MIRROR_TRUTH.lifecycle !== 'active-local' || CITY_MIRROR_TRUTH.externalEffect) {
    return { ok: false, reason: 'city-mirror-disabled', action: null };
  }
  const destination = copyDestination(landmarkId);
  if (!destination) return { ok: false, reason: 'unknown-landmark', action: null };
  const action = normalizeAction({ id: makeId(now), source, landmarkId: destination.landmarkId, preparedAt: nowIso(now), expiresAt: nowIso(Number(now) + CITY_PREPARED_ACTION_TTL_MS), state: 'prepared' });
  const resolvedStorage = storageFor(storage);
  const persisted = writeRecords([action, ...readRecords(resolvedStorage).filter((entry) => entry.id !== action.id)], resolvedStorage);
  return { ok: persisted, action, persisted, reason: persisted ? null : 'storage-unavailable' };
}
/** Backward-compatible Play helper. New modes use prepareCityAction with an explicit source. */
export function prepareCityPlayAction(landmarkId, options = {}) {
  return prepareCityAction(landmarkId, { ...options, source: 'city-play' });
}

export function confirmPreparedCityAction(actionId, { storage, now = Date.now() } = {}) {
  const resolvedStorage = storageFor(storage);
  const records = readRecords(resolvedStorage);
  const index = records.findIndex((entry) => entry.id === String(actionId || ''));
  if (index < 0) return { ok: false, reason: 'missing-prepared-action', action: null, href: null };
  const action = records[index];
  if (Date.parse(action.expiresAt) <= Number(now)) return { ok: false, reason: 'prepared-action-expired', action, href: null };
  const confirmed = normalizeAction({ ...action, state: 'confirmed', confirmedAt: nowIso(now) });
  records[index] = confirmed;
  if (!writeRecords(records, resolvedStorage)) return { ok: false, reason: 'storage-unavailable', action: confirmed, href: null };
  return { ok: true, reason: null, action: confirmed, href: confirmed.route };
}
