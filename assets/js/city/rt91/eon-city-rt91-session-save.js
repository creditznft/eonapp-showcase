/**
 * RT91 Wave 80 — local session persistence for RT91-only flagship campaign state.
 *
 * This container deliberately does not replace or write W766 Signal campaign,
 * W795 Storm foundation, W768 My Frontier construction, XP, entitlements or
 * building-coordinate authority. It stores only sanitized RT91 mission IDs,
 * objective IDs and opaque receipt IDs plus the existing RT91 living-frontier
 * metadata envelope.
 */
import { EON_CITY_RT91_SAVE_SCHEMA, sanitizeEonCityRt91SaveEnvelope, migrateEonCityRt91SaveEnvelope } from './eon-city-rt91-save-envelope.js';
import { createEonCityRt91SignalMasteryInitialState } from './signal/eon-city-rt91-signal-mastery-runtime.js';
import { createEonCityRt91StormCampaignInitialState } from './storm/eon-city-rt91-storm-campaign-runtime.js';
import { createEonCityRt91MyFrontierDistrictMissionInitialState } from './my-frontier/eon-city-rt91-my-frontier-district-mission-runtime.js';
import { sanitizeEonCityRt91ActiveContract } from './eon-city-rt91-repeatable-contract-runtime.js';

export const EON_CITY_RT91_SESSION_SAVE_SCHEMA = 'eon.city.living-frontier-session.rt91.v1';
export const EON_CITY_RT91_SESSION_STORAGE_KEY = 'eon:city:living-frontier-session:rt91:v1';
const freeze = Object.freeze;
const SAFE_ID = /^[a-z0-9][a-z0-9:._-]{0,159}$/i;
const cleanId = (value = '') => SAFE_ID.test(String(value || '').trim()) ? String(value || '').trim() : '';
const boundedIds = (values = [], limit = 240) => freeze([...new Set((Array.isArray(values) ? values : []).map(cleanId).filter(Boolean))].slice(-limit));

function compactCampaignState(state = {}, { receiptLimit = 240 } = {}) {
  const objectives = {};
  for (const [missionId, objectiveIds] of Object.entries(state?.completedObjectives || {})) {
    const cleanMissionId = cleanId(missionId);
    if (!cleanMissionId) continue;
    const cleanObjectives = boundedIds(objectiveIds, 24);
    if (cleanObjectives.length) objectives[cleanMissionId] = cleanObjectives;
  }
  return freeze({
    schema: String(state?.schema || ''),
    activeMissionId: cleanId(state?.activeMissionId),
    completedMissionIds: boundedIds(state?.completedMissionIds, 64),
    completedObjectives: freeze(objectives),
    processedReceiptIds: boundedIds(state?.processedReceiptIds, receiptLimit)
  });
}

function sanitizeSignal(value = {}) { return compactCampaignState(createEonCityRt91SignalMasteryInitialState(value)); }
function sanitizeStorm(value = {}) { return compactCampaignState(createEonCityRt91StormCampaignInitialState(value)); }
function sanitizeMyFrontier(value = {}) { return compactCampaignState(createEonCityRt91MyFrontierDistrictMissionInitialState(value)); }

export function sanitizeEonCityRt91SessionSave(input = {}) {
  const livingFrontierInput = input?.livingFrontier || (input?.schema === EON_CITY_RT91_SAVE_SCHEMA ? input : input?.saveEnvelope) || {};
  const campaigns = input?.campaigns || {};
  return freeze({
    schema: EON_CITY_RT91_SESSION_SAVE_SCHEMA,
    version: 1,
    livingFrontier: sanitizeEonCityRt91SaveEnvelope(livingFrontierInput),
    campaigns: freeze({
      signalMastery: sanitizeSignal(campaigns.signalMastery || input?.signalMasteryState),
      stormCampaign: sanitizeStorm(campaigns.stormCampaign || input?.stormCampaignState),
      myFrontierDistricts: sanitizeMyFrontier(campaigns.myFrontierDistricts || input?.myFrontierDistrictMissionState)
    }),
    repeatableContract: sanitizeEonCityRt91ActiveContract(input?.repeatableContract || input?.activeRepeatableContract),
    updatedAt: Math.max(0, Number(input?.updatedAt || livingFrontierInput?.updatedAt || 0)),
    privateContentStored: false,
    rawPromptStored: false,
    rawFileContentStored: false,
    credentialsStored: false,
    receiptPayloadStored: false,
    writesLegacySignalCampaign: false,
    writesStormFoundation: false,
    writesMyFrontierConstruction: false,
    ownsXpAuthority: false,
    ownsUnlockAuthority: false,
    networkRequestCreated: false
  });
}

export function migrateEonCityRt91SessionSave(input = {}) {
  if (input?.schema === EON_CITY_RT91_SESSION_SAVE_SCHEMA && Number(input?.version) === 1) return sanitizeEonCityRt91SessionSave(input);
  if (input?.schema === EON_CITY_RT91_SAVE_SCHEMA || input?.worldSeed || input?.currentWorldId || input?.worldId) {
    return sanitizeEonCityRt91SessionSave({ livingFrontier: migrateEonCityRt91SaveEnvelope(input), updatedAt: input?.updatedAt });
  }
  return sanitizeEonCityRt91SessionSave(input);
}

export function hydrateEonCityRt91CampaignInitialStates(session = {}) {
  const safe = migrateEonCityRt91SessionSave(session);
  return freeze({
    signalMastery: createEonCityRt91SignalMasteryInitialState(safe.campaigns.signalMastery),
    stormCampaign: createEonCityRt91StormCampaignInitialState(safe.campaigns.stormCampaign),
    myFrontierDistricts: createEonCityRt91MyFrontierDistrictMissionInitialState(safe.campaigns.myFrontierDistricts)
  });
}

export function validateEonCityRt91SessionSave(session = sanitizeEonCityRt91SessionSave()) {
  const errors = [];
  if (session?.schema !== EON_CITY_RT91_SESSION_SAVE_SCHEMA || session?.version !== 1) errors.push('schema');
  if (session?.livingFrontier?.schema !== EON_CITY_RT91_SAVE_SCHEMA) errors.push('living-frontier-envelope');
  for (const key of ['signalMastery', 'stormCampaign', 'myFrontierDistricts']) {
    const state = session?.campaigns?.[key];
    if (!state || (state.completedMissionIds?.length || 0) > 64 || (state.processedReceiptIds?.length || 0) > 240) errors.push(`campaign:${key}`);
  }
  if (session?.repeatableContract && !sanitizeEonCityRt91ActiveContract(session.repeatableContract)) errors.push('repeatable-contract');
  if (session?.privateContentStored || session?.rawPromptStored || session?.rawFileContentStored || session?.credentialsStored || session?.receiptPayloadStored) errors.push('privacy');
  if (session?.writesLegacySignalCampaign || session?.writesStormFoundation || session?.writesMyFrontierConstruction || session?.ownsXpAuthority || session?.ownsUnlockAuthority || session?.networkRequestCreated) errors.push('authority');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

function resolveStorage(storage = null) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

export function createEonCityRt91SessionPersistence({ storage = null, key = EON_CITY_RT91_SESSION_STORAGE_KEY, now = () => Date.now() } = {}) {
  const target = resolveStorage(storage);
  return freeze({
    schema: `${EON_CITY_RT91_SESSION_SAVE_SCHEMA}.persistence.v1`,
    storageKey: String(key || EON_CITY_RT91_SESSION_STORAGE_KEY),
    load() {
      try {
        const raw = target?.getItem?.(String(key || EON_CITY_RT91_SESSION_STORAGE_KEY));
        if (!raw) return freeze({ ok: true, found: false, session: sanitizeEonCityRt91SessionSave(), reason: 'empty' });
        return freeze({ ok: true, found: true, session: migrateEonCityRt91SessionSave(JSON.parse(raw)), reason: 'restored' });
      } catch {
        return freeze({ ok: false, found: false, session: sanitizeEonCityRt91SessionSave(), reason: 'invalid-local-session' });
      }
    },
    save(snapshot = {}) {
      const session = sanitizeEonCityRt91SessionSave({ ...snapshot, updatedAt: Math.max(0, Number(snapshot?.updatedAt || now())) });
      try {
        if (!target?.setItem) return freeze({ ok: false, reason: 'storage-unavailable', session, networkRequestCreated: false });
        target.setItem(String(key || EON_CITY_RT91_SESSION_STORAGE_KEY), JSON.stringify(session));
        return freeze({ ok: true, reason: 'stored-locally', session, networkRequestCreated: false });
      } catch {
        return freeze({ ok: false, reason: 'storage-write-failed', session, networkRequestCreated: false });
      }
    },
    clear({ explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      try { target?.removeItem?.(String(key || EON_CITY_RT91_SESSION_STORAGE_KEY)); return freeze({ ok: true, reason: 'cleared-locally', networkRequestCreated: false }); }
      catch { return freeze({ ok: false, reason: 'storage-clear-failed', networkRequestCreated: false }); }
    },
    networkRequestCreated: false,
    writesLegacyAuthorities: false
  });
}

export default freeze({
  EON_CITY_RT91_SESSION_SAVE_SCHEMA,
  EON_CITY_RT91_SESSION_STORAGE_KEY,
  sanitizeEonCityRt91SessionSave,
  migrateEonCityRt91SessionSave,
  hydrateEonCityRt91CampaignInitialStates,
  validateEonCityRt91SessionSave,
  createEonCityRt91SessionPersistence
});
