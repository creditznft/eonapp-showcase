/** A15 I19 — guest-first activation and setup-resume authority. */
import { getEonDestination } from '../contracts/navigation/eon-destination-registry.js';
import { listProjectRegistryRecords } from '../projects/eon-project-registry.js';
import { listLibraryIndexRecords } from '../storage/eon-library-index.js';
import { listChatThreads } from '../utils/chat-threads.js';

export const EON_ACTIVATION_SCHEMA = 'eonapp.activation.a15.v1';
export const EON_ACTIVATION_STORAGE_KEY = 'eon:activation:a15:v1';
export const EON_ACTIVATION_SETUP_IDS = Object.freeze(['onboarding', 'local-ai', 'creator-media', 'data-survival', 'provider']);
export const EON_ACTIVATION_SETUP_STATES = Object.freeze(['not-started', 'in-progress', 'completed', 'dismissed']);

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 120) => Array.from(String(value || ''), (character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127 ? character : ' '; }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
const nowIso = (value = Date.now()) => new Date(Number.isFinite(Number(value)) ? Number(value) : Date.now()).toISOString();
const parse = (raw, fallback) => { try { return JSON.parse(String(raw || '')); } catch { return fallback; } };
const storageRef = (options = {}) => options.storage || options.localStorage || globalThis.localStorage;

function emptyState(options = {}) {
  const createdAt = nowIso(options.now);
  return {
    schema: EON_ACTIVATION_SCHEMA,
    revision: 0,
    createdAt,
    updatedAt: createdAt,
    firstUsefulResultAt: '',
    firstUsefulResultType: '',
    setups: {},
    boundaries: {
      guestFirst: true,
      signInRequiredForFirstResult: false,
      identityCreatesMarketingConsent: false,
      automaticNavigation: false,
      automaticOutboundDelivery: false,
      contentBodiesStored: false,
      remoteUpload: false
    }
  };
}

function normalizeSetup(value = {}, options = {}) {
  const setupId = clean(value.setupId, 40).toLowerCase();
  const destinationId = clean(value.destinationId, 60).toLowerCase();
  const state = EON_ACTIVATION_SETUP_STATES.includes(value.state) ? value.state : 'not-started';
  if (!EON_ACTIVATION_SETUP_IDS.includes(setupId) || !getEonDestination(destinationId)) return null;
  return freeze({
    setupId,
    state,
    destinationId,
    stepId: clean(value.stepId, 60),
    updatedAt: String(value.updatedAt || nowIso(options.now)),
    containsUserContent: false,
    accountRequired: false,
    marketingConsent: false
  });
}

export function readEonActivationState(options = {}) {
  const storage = storageRef(options);
  const base = emptyState(options);
  let raw = base;
  try { raw = parse(storage?.getItem?.(EON_ACTIVATION_STORAGE_KEY), base) || base; } catch {}
  const setups = {};
  for (const entry of Object.values(raw.setups || {})) {
    const setup = normalizeSetup(entry, options);
    if (setup) setups[setup.setupId] = setup;
  }
  return freeze({
    ...base,
    revision: Math.max(0, Number(raw.revision) || 0),
    createdAt: String(raw.createdAt || base.createdAt),
    updatedAt: String(raw.updatedAt || base.updatedAt),
    firstUsefulResultAt: String(raw.firstUsefulResultAt || ''),
    firstUsefulResultType: clean(raw.firstUsefulResultType, 40),
    setups: freeze(setups),
    boundaries: freeze(base.boundaries)
  });
}

function saveState(state = {}, options = {}) {
  const storage = storageRef(options);
  if (!storage?.setItem) return freeze({ ok: false, reason: 'storage-unavailable' });
  const current = readEonActivationState({ ...options, storage });
  const payload = {
    schema: EON_ACTIVATION_SCHEMA,
    revision: current.revision + 1,
    createdAt: current.createdAt,
    updatedAt: nowIso(options.now),
    firstUsefulResultAt: String(state.firstUsefulResultAt || current.firstUsefulResultAt || ''),
    firstUsefulResultType: clean(state.firstUsefulResultType || current.firstUsefulResultType, 40),
    setups: { ...(state.setups || current.setups) },
    boundaries: emptyState(options).boundaries
  };
  const serialized = JSON.stringify(payload);
  try {
    storage.setItem(EON_ACTIVATION_STORAGE_KEY, serialized);
    if (storage.getItem(EON_ACTIVATION_STORAGE_KEY) !== serialized) return freeze({ ok: false, reason: 'write-verification-failed' });
  } catch { return freeze({ ok: false, reason: 'storage-write-failed' }); }
  try { globalThis.document?.dispatchEvent?.(new CustomEvent('eon:activation-changed', { detail: { revision: payload.revision, updatedAt: payload.updatedAt } })); } catch {}
  return freeze({ ok: true, state: readEonActivationState({ ...options, storage }) });
}

export function recordEonSetupProgress(input = {}, options = {}) {
  const setup = normalizeSetup({ ...input, updatedAt: nowIso(options.now) }, options);
  if (!setup) return freeze({ ok: false, reason: 'setup-invalid' });
  const current = readEonActivationState(options);
  const saved = saveState({ ...current, setups: { ...current.setups, [setup.setupId]: setup } }, options);
  return saved.ok ? freeze({ ok: true, setup, state: saved.state }) : saved;
}

function detectUsefulResult(options = {}) {
  const localStorage = storageRef(options);
  const sessionStorage = options.sessionStorage || globalThis.sessionStorage;
  const projects = listProjectRegistryRecords({ storage: localStorage }).filter((row) => row.lifecycleState === 'active');
  if (projects.length) return freeze({ type: 'project', updatedAt: projects[0].updatedAt || projects[0].createdAt });
  const library = listLibraryIndexRecords({ storage: localStorage }).filter((row) => row.lifecycleState === 'active');
  if (library.length) return freeze({ type: 'library', updatedAt: library[0].updatedAt || library[0].createdAt });
  const chats = listChatThreads({ storage: sessionStorage });
  const chat = chats.find((thread) => Array.isArray(thread.messages) && thread.messages.some((message) => message.role === 'user') && thread.messages.some((message) => message.role === 'bot'));
  if (chat) return freeze({ type: 'chat', updatedAt: chat.updatedAt || chat.createdAt });
  return null;
}

export function refreshEonActivationState(options = {}) {
  const current = readEonActivationState(options);
  if (current.firstUsefulResultAt) return freeze({ ok: true, changed: false, state: current });
  const useful = detectUsefulResult(options);
  if (!useful) return freeze({ ok: true, changed: false, state: current });
  const saved = saveState({ ...current, firstUsefulResultAt: useful.updatedAt || nowIso(options.now), firstUsefulResultType: useful.type }, options);
  return saved.ok ? freeze({ ok: true, changed: true, state: saved.state }) : saved;
}

export function listEonSetupResumeCandidates(options = {}) {
  const state = readEonActivationState(options);
  return freeze(Object.values(state.setups)
    .filter((setup) => setup.state === 'in-progress')
    .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt))));
}

export function getEonActivationTruth(options = {}) {
  const state = readEonActivationState(options);
  return freeze({
    schema: EON_ACTIVATION_SCHEMA,
    guestFirst: true,
    signInRequiredForFirstResult: false,
    firstUsefulResultRecorded: Boolean(state.firstUsefulResultAt),
    firstUsefulResultType: state.firstUsefulResultType,
    setupResumeCount: listEonSetupResumeCandidates(options).length,
    identityCreatesMarketingConsent: false,
    automaticNavigation: false,
    automaticOutboundDelivery: false,
    contentBodiesStored: false,
    remoteUpload: false
  });
}

let installed = false;
export function installEonActivationService(options = {}) {
  if (installed) return freeze({ installed: true, duplicate: true });
  installed = true;
  const refresh = () => refreshEonActivationState(options);
  refresh();
  const doc = options.document || globalThis.document;
  const events = ['eon:project-registry-ready', 'eon:project-registry-changed', 'eon:library-index-ready', 'eon:library-index-changed', 'eon:chat-threads-changed'];
  events.forEach((event) => doc?.addEventListener?.(event, refresh));
  return freeze({ installed: true, duplicate: false, dispose() { events.forEach((event) => doc?.removeEventListener?.(event, refresh)); installed = false; } });
}

export default freeze({
  EON_ACTIVATION_SCHEMA,
  EON_ACTIVATION_STORAGE_KEY,
  readEonActivationState,
  recordEonSetupProgress,
  refreshEonActivationState,
  listEonSetupResumeCandidates,
  getEonActivationTruth,
  installEonActivationService
});
