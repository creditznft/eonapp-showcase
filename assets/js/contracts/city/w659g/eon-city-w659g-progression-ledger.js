/**
 * A15 I03 — Core-owned City contract extracted from assets/js/city/w659g/eon-city-w659g-progression-ledger.js.
 * Rendering/runtime implementation remains under assets/js/city; this module
 * is safe for Core routes and contains no City implementation imports.
 */
/**
 * W659G — local Productive City progression and deterministic Vault Reveals.
 *
 * This ledger accepts bounded, verified action receipts only. It never grants
 * EONKEYS, subscriptions, money, tokens, discounts or transferable value.
 * EONKEY authority remains the server referral ledger.
 */
export const EON_CITY_W659G_PROGRESSION_SCHEMA = 'eon.city.w659g.progression.v1';
export const EON_CITY_W659G_PROGRESSION_STORAGE_KEY = 'eon:city:progression:w659g:v1';
export const EON_CITY_W659G_REVEAL_THRESHOLD = 100;

const freeze = (value) => Object.freeze(value);
const clean = (value = '') => String(value || '').trim();
const safeId = (value = '') => clean(value).toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const dayId = (timestamp = Date.now()) => new Date(finite(timestamp, Date.now())).toISOString().slice(0, 10);

export const EON_CITY_W659G_VERIFIED_ACTION_EVENT = 'eon:city:verified-action';

export const EON_CITY_W659G_MISSION_RULES = freeze([
  freeze({ type: 'city.orientation.completed', title: 'Arrival orientation', station: 'District Arrival Gate', xp: 100, reveal: 25, repeat: 'once' }),
  freeze({ type: 'eonbot.real-reply', title: 'Complete real work with EONBOT', station: 'EONBOT Dock', xp: 60, reveal: 20, repeat: 'daily', dailyCap: 3 }),
  freeze({ type: 'city.district-arrival', title: 'Travel to an active district', station: 'Transit Hub Beacon', xp: 40, reveal: 10, repeat: 'daily', dailyCap: 4 }),
  freeze({ type: 'city.real-work-receipt', title: 'Return with a verified work receipt', station: 'Functional stations', xp: 120, reveal: 35, repeat: 'receipt' }),
  freeze({ type: 'city.agent-receipt.reviewed', title: 'Review a truthful Agent Theatre receipt', station: 'Agent Theatre Relay', xp: 70, reveal: 20, repeat: 'daily', dailyCap: 2 }),
  freeze({ type: 'city.capture.saved-local', title: 'Create a local gameplay clip', station: 'Creator Work Pod', xp: 80, reveal: 25, repeat: 'daily', dailyCap: 2 }),
  freeze({ type: 'city.share-pack.prepared', title: 'Prepare a Share & Earn pack', station: 'Creator Work Pod', xp: 70, reveal: 20, repeat: 'daily', dailyCap: 2 })
]);

const RULE_BY_TYPE = new Map(EON_CITY_W659G_MISSION_RULES.map((entry) => [entry.type, entry]));

export const EON_CITY_W659G_COSMETIC_REWARDS = freeze([
  freeze({ id: 'signal-mist', label: 'Signal Mist', family: 'eonbot-skin', usableNow: true, description: 'A cool signal-field EONBOT presentation.' }),
  freeze({ id: 'forge-prism', label: 'Forge Prism', family: 'eonbot-skin', usableNow: true, description: 'A warm creator-focused EONBOT presentation.' }),
  freeze({ id: 'creator-frame', label: 'Creator Frame', family: 'capture-overlay', usableNow: true, description: 'A branded frame for locally recorded City clips.' }),
  freeze({ id: 'transit-pulse', label: 'Transit Pulse', family: 'city-theme', usableNow: true, description: 'A local HUD accent for district travel.' }),
  freeze({ id: 'portal-echo', label: 'Portal Echo', family: 'arrival-effect', usableNow: true, description: 'A local arrival-gate celebration effect.' }),
  freeze({ id: 'command-orbit-master', label: 'Command Orbit Mastery', family: 'profile-collectible', usableNow: true, description: 'A non-transferable City mastery collectible.' })
]);

function defaultState(now = Date.now()) {
  return {
    schema: EON_CITY_W659G_PROGRESSION_SCHEMA,
    updatedAt: finite(now),
    xp: 0,
    revealProgress: 0,
    pendingReveals: 0,
    openedReveals: 0,
    receipts: {},
    dailyCounts: {},
    ownedCosmetics: [],
    selectedCosmetics: {
      eonbotSkin: 'command-orbit',
      captureOverlay: '',
      cityTheme: '',
      arrivalEffect: ''
    },
    revealHistory: []
  };
}

function normalizeState(value = {}, now = Date.now()) {
  const base = defaultState(now);
  const receipts = value?.receipts && typeof value.receipts === 'object' ? value.receipts : {};
  const dailyCounts = value?.dailyCounts && typeof value.dailyCounts === 'object' ? value.dailyCounts : {};
  const owned = [...new Set((Array.isArray(value?.ownedCosmetics) ? value.ownedCosmetics : []).map(safeId).filter((id) => EON_CITY_W659G_COSMETIC_REWARDS.some((entry) => entry.id === id)))];
  return {
    ...base,
    updatedAt: finite(value?.updatedAt, now),
    xp: Math.max(0, finite(value?.xp)),
    revealProgress: Math.max(0, finite(value?.revealProgress)) % EON_CITY_W659G_REVEAL_THRESHOLD,
    pendingReveals: Math.max(0, Math.floor(finite(value?.pendingReveals))),
    openedReveals: Math.max(0, Math.floor(finite(value?.openedReveals))),
    receipts,
    dailyCounts,
    ownedCosmetics: owned,
    selectedCosmetics: { ...base.selectedCosmetics, ...(value?.selectedCosmetics || {}) },
    revealHistory: (Array.isArray(value?.revealHistory) ? value.revealHistory : []).slice(-32)
  };
}

export function readEonCityW659gProgression({ storage = globalThis.localStorage, now = Date.now() } = {}) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(EON_CITY_W659G_PROGRESSION_STORAGE_KEY) || 'null');
    if (parsed?.schema !== EON_CITY_W659G_PROGRESSION_SCHEMA) return freeze(normalizeState({}, now));
    return freeze(normalizeState(parsed, now));
  } catch {
    return freeze(normalizeState({}, now));
  }
}

function writeState(state, storage = globalThis.localStorage) {
  try {
    storage?.setItem?.(EON_CITY_W659G_PROGRESSION_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch { return false; }
}

function receiptKey(type = '', receiptId = '') { return `${safeId(type)}:${safeId(receiptId)}`; }

export function recordEonCityW659gVerifiedAction(input = {}, { storage = globalThis.localStorage, now = Date.now() } = {}) {
  const type = clean(input.type);
  const rule = RULE_BY_TYPE.get(type);
  const verified = input.verified === true;
  const receiptId = safeId(input.receiptId);
  if (!rule) return freeze({ ok: false, reason: 'unsupported-action', state: readEonCityW659gProgression({ storage, now }) });
  if (!verified || !receiptId) return freeze({ ok: false, reason: 'verified-receipt-required', state: readEonCityW659gProgression({ storage, now }) });

  const state = normalizeState(readEonCityW659gProgression({ storage, now }), now);
  const key = receiptKey(type, receiptId);
  if (state.receipts[key]) return freeze({ ok: true, reason: 'already-recorded', awarded: freeze({ xp: 0, reveal: 0 }), state: freeze(state) });

  const today = dayId(now);
  const countKey = `${type}:${today}`;
  const dailyCount = Math.max(0, finite(state.dailyCounts[countKey]));
  if (rule.repeat === 'daily' && dailyCount >= finite(rule.dailyCap, 1)) {
    state.receipts[key] = { type, receiptId, verifiedAt: finite(input.verifiedAt, now), accepted: false, reason: 'daily-cap-reached' };
    state.updatedAt = finite(now);
    writeState(state, storage);
    return freeze({ ok: false, reason: 'daily-cap-reached', awarded: freeze({ xp: 0, reveal: 0 }), state: freeze(state) });
  }
  if (rule.repeat === 'once' && Object.values(state.receipts).some((entry) => entry?.type === type && entry?.accepted === true)) {
    state.receipts[key] = { type, receiptId, verifiedAt: finite(input.verifiedAt, now), accepted: false, reason: 'once-only-complete' };
    state.updatedAt = finite(now);
    writeState(state, storage);
    return freeze({ ok: false, reason: 'once-only-complete', awarded: freeze({ xp: 0, reveal: 0 }), state: freeze(state) });
  }

  state.receipts[key] = {
    type,
    receiptId,
    verifiedAt: finite(input.verifiedAt, now),
    accepted: true,
    source: safeId(input.source || 'city-runtime')
  };
  if (rule.repeat === 'daily') state.dailyCounts[countKey] = dailyCount + 1;
  state.xp += rule.xp;
  const totalReveal = state.revealProgress + rule.reveal;
  state.pendingReveals += Math.floor(totalReveal / EON_CITY_W659G_REVEAL_THRESHOLD);
  state.revealProgress = totalReveal % EON_CITY_W659G_REVEAL_THRESHOLD;
  state.updatedAt = finite(now);
  const saved = writeState(state, storage);
  return freeze({ ok: saved, reason: saved ? 'recorded' : 'storage-unavailable', rule, awarded: freeze({ xp: rule.xp, reveal: rule.reveal }), state: freeze(state) });
}

function selectNextReward(state) {
  const unowned = EON_CITY_W659G_COSMETIC_REWARDS.filter((entry) => !state.ownedCosmetics.includes(entry.id));
  return unowned[0] || null;
}

export function openEonCityW659gVaultReveal({ explicitUserAction = false } = {}, { storage = globalThis.localStorage, now = Date.now() } = {}) {
  const state = normalizeState(readEonCityW659gProgression({ storage, now }), now);
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state: freeze(state) });
  if (state.pendingReveals < 1) return freeze({ ok: false, reason: 'no-reveal-ready', state: freeze(state) });
  const reward = selectNextReward(state);
  state.pendingReveals -= 1;
  state.openedReveals += 1;
  let outcome;
  if (reward) {
    state.ownedCosmetics.push(reward.id);
    outcome = { kind: 'cosmetic', rewardId: reward.id, label: reward.label, family: reward.family, duplicateProtected: true };
  } else {
    state.xp += 100;
    outcome = { kind: 'mastery-xp', rewardId: 'city-mastery-xp', label: '100 City XP', family: 'mastery', duplicateProtected: true };
  }
  state.revealHistory.push({ ...outcome, openedAt: finite(now), revealNumber: state.openedReveals });
  state.updatedAt = finite(now);
  const saved = writeState(state, storage);
  return freeze({ ok: saved, reason: saved ? 'revealed' : 'storage-unavailable', outcome: freeze(outcome), state: freeze(state) });
}

export function selectEonCityW659gCosmetic(rewardId = '', { explicitUserAction = false } = {}, { storage = globalThis.localStorage, now = Date.now() } = {}) {
  const id = safeId(rewardId);
  const state = normalizeState(readEonCityW659gProgression({ storage, now }), now);
  const reward = EON_CITY_W659G_COSMETIC_REWARDS.find((entry) => entry.id === id);
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', state: freeze(state) });
  if (!reward || !state.ownedCosmetics.includes(id)) return freeze({ ok: false, reason: 'cosmetic-not-owned', state: freeze(state) });
  if (reward.family === 'eonbot-skin') state.selectedCosmetics.eonbotSkin = id;
  if (reward.family === 'capture-overlay') state.selectedCosmetics.captureOverlay = id;
  if (reward.family === 'city-theme') state.selectedCosmetics.cityTheme = id;
  if (reward.family === 'arrival-effect') state.selectedCosmetics.arrivalEffect = id;
  state.updatedAt = finite(now);
  const saved = writeState(state, storage);
  return freeze({ ok: saved, reason: saved ? 'selected' : 'storage-unavailable', reward, state: freeze(state) });
}

export function dispatchEonCityW659gVerifiedAction(detail = {}, environment = globalThis) {
  try {
    environment?.dispatchEvent?.(new environment.CustomEvent(EON_CITY_W659G_VERIFIED_ACTION_EVENT, { detail: { ...detail, verified: detail.verified === true } }));
    return true;
  } catch { return false; }
}

export function validateEonCityW659gProgressionState(state = readEonCityW659gProgression({ storage: null })) {
  const errors = [];
  if (state?.schema !== EON_CITY_W659G_PROGRESSION_SCHEMA) errors.push('schema-invalid');
  if (state?.xp < 0 || state?.revealProgress < 0 || state?.revealProgress >= EON_CITY_W659G_REVEAL_THRESHOLD) errors.push('progress-invalid');
  if (!Number.isInteger(state?.pendingReveals) || state.pendingReveals < 0) errors.push('pending-reveals-invalid');
  if (JSON.stringify(state).match(/eonkey.*grant|subscription.*grant|money|token|cash|resale/i)) errors.push('commercial-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}
