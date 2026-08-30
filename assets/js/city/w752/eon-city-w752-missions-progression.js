/**
 * W752 — receipt-backed missions, local XP, deterministic cosmetic Vault
 * Reveals and one bounded My Realm reflection.
 *
 * This layer projects the W751 station view and delegates all XP/reveal writes
 * to the maintained W659G progression ledger. It owns no project, task,
 * provider, billing, sharing, automation, Realm or native receipt state.
 */
import {
  EON_CITY_W659G_COSMETIC_REWARDS,
  EON_CITY_W659G_MISSION_RULES,
  EON_CITY_W659G_PROGRESSION_STORAGE_KEY,
  EON_CITY_W659G_REVEAL_THRESHOLD,
  EON_CITY_W659G_VERIFIED_ACTION_EVENT,
  openEonCityW659gVaultReveal,
  readEonCityW659gProgression,
  recordEonCityW659gVerifiedAction,
  selectEonCityW659gCosmetic
} from '../w659g/eon-city-w659g-progression-ledger.js';
import { getEonCityW737MissionForStation } from '../w737/eon-city-w737-missions.js';
import { getEonCityProductiveRpgPlan } from '../eon-city-productive-rpg-loop.js';
import { getVerifiedEonCityProgressReceipt } from '../../contracts/city/eon-city-progress-bridge.js';
import {
  EON_CITY_W751_STATION_LOOPS,
  EON_CITY_W751_VIEW_EVENT,
  projectEonCityW751ProductiveStations
} from '../w751/eon-city-w751-productive-stations.js';

export const EON_CITY_W752_SCHEMA = 'eon.city.missions-progression.w752.v1';
export const EON_CITY_W752_VIEW_EVENT = 'eon:city-w752-missions-progression-view-changed';
export const EON_CITY_W752_REWARD_TYPE = 'city.real-work-receipt';

const freeze = (value) => Object.freeze(value);
const clean = (value = '') => String(value || '').trim();
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const safeId = (value = '') => clean(value).toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 160);
const resolveStorage = (storage) => {
  if (storage && typeof storage === 'object') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
};

const COPY = freeze({
  'eonbot-nexus': freeze({ title: 'Establish your next command', summary: 'Use the Living Nexus, complete one genuine EONBOT or orientation outcome, then return with its bounded receipt.', realmFacet: 'Personal Command' }),
  'create-forge': freeze({
    title: 'Forge one useful artifact',
    summary: 'Prepare a real creator outcome through the maintained Create surface and verify it only through its native receipt.',
    realmFacet: 'Creator Signal',
    actionChoices: freeze([
      freeze({ id: 'image', label: 'Make Image', creatorMode: 'image' }),
      freeze({ id: 'video', label: 'Make Video', creatorMode: 'video' }),
      freeze({ id: 'music-radio', label: 'Make Music / Radio', creatorMode: 'music' })
    ])
  }),
  'project-atlas': freeze({ title: 'Advance one real project', summary: 'Resume or create one project outcome without exposing its title or contents inside the City projection.', realmFacet: 'Knowledge Continuity' }),
  'library-vault': freeze({ title: 'Recover one useful item', summary: 'Reuse or recover saved work through Library, Vault or encrypted Capsule boundaries.', realmFacet: 'Knowledge Continuity' }),
  'share-capture': freeze({ title: 'Prepare one reviewed handoff', summary: 'Create a signed link, QR or local capture only through explicit review and native sharing controls.', realmFacet: 'Creator Signal' }),
  'command-console': freeze({ title: 'Resolve one command signal', summary: 'Review one real project, approval, result, system or transit item through its maintained authority.', realmFacet: 'Operations Pulse' }),
  'automation-theatre': freeze({ title: 'Review one genuine automation', summary: 'Inspect a real proposal or stored task receipt; no receipt means the stage remains still.', realmFacet: 'Operations Pulse' }),
  'local-ai-lab': freeze({ title: 'Verify one execution path', summary: 'Complete a real local self-test or Direct BYOK verification without exposing credentials to City.', realmFacet: 'Systems Readiness' }),
  'my-realm-portal': freeze({ title: 'Shape one private reflection', summary: 'Review one useful My Realm choice while keeping private City and Vault state outside the projection.', realmFacet: 'Personal Command' }),
  'plans-access': freeze({ title: 'Review access truthfully', summary: 'Compare server-confirmed access and decide explicitly; City never grants or fabricates entitlement.', realmFacet: 'Systems Readiness' })
});

export const EON_CITY_W752_MISSION_DEFINITIONS = freeze(EON_CITY_W751_STATION_LOOPS.map((station, index) => freeze({
  id: `productive:${station.stationId}`,
  stationId: station.stationId,
  order: index + 1,
  title: COPY[station.stationId]?.title || station.title,
  summary: COPY[station.stationId]?.summary || station.outcome,
  realmFacet: COPY[station.stationId]?.realmFacet || 'Personal Command',
  actionChoices: COPY[station.stationId]?.actionChoices || freeze([]),
  completionAuthority: station.completionAuthority,
  explicitClaimRequired: true,
  verifiedNativeReceiptRequired: true,
  automaticCompletion: false,
  automaticReward: false
})));

const FACETS = freeze([
  freeze({ id: 'creator-signal', label: 'Creator Signal', stationIds: freeze(['create-forge', 'share-capture']) }),
  freeze({ id: 'operations-pulse', label: 'Operations Pulse', stationIds: freeze(['command-console', 'automation-theatre']) }),
  freeze({ id: 'knowledge-continuity', label: 'Knowledge Continuity', stationIds: freeze(['project-atlas', 'library-vault']) }),
  freeze({ id: 'systems-readiness', label: 'Systems Readiness', stationIds: freeze(['local-ai-lab', 'plans-access']) }),
  freeze({ id: 'personal-command', label: 'Personal Command', stationIds: freeze(['eonbot-nexus', 'my-realm-portal']) })
]);

function rewardRule() {
  return EON_CITY_W659G_MISSION_RULES.find((entry) => entry.type === EON_CITY_W752_REWARD_TYPE) || freeze({ xp: 0, reveal: 0 });
}

function receiptKey(receiptId = '') {
  return `${safeId(EON_CITY_W752_REWARD_TYPE)}:${safeId(receiptId)}`;
}

function stationById(stationView = {}, stationId = '') {
  return (Array.isArray(stationView?.stations) ? stationView.stations : []).find((entry) => entry.stationId === stationId) || null;
}

function claimedReceipt(progression = {}, receiptId = '') {
  if (!receiptId) return null;
  const entry = progression?.receipts?.[receiptKey(receiptId)];
  return entry?.accepted === true ? entry : null;
}

function nextCosmetic(progression = {}) {
  const owned = new Set(Array.isArray(progression?.ownedCosmetics) ? progression.ownedCosmetics : []);
  return EON_CITY_W659G_COSMETIC_REWARDS.find((entry) => !owned.has(entry.id)) || null;
}

function missionState(station = {}, progression = {}) {
  const receiptId = safeId(station?.verifiedOutcome?.receiptId);
  if (receiptId && claimedReceipt(progression, receiptId)) return 'claimed';
  if (station?.state === 'verified' && receiptId) return 'verified-ready';
  if (['active', 'opened', 'returned', 'reviewed'].includes(station?.state)) return 'in-progress';
  if (station?.state === 'failed' || station?.state === 'cancelled') return 'blocked';
  return 'available';
}

function reflectionTitle(claimedCount = 0) {
  if (claimedCount >= 10) return 'Living Nexus Mastery';
  if (claimedCount >= 7) return 'Command Identity';
  if (claimedCount >= 4) return 'Living Pattern';
  if (claimedCount >= 1) return 'Signals Forming';
  return 'Quiet Foundation';
}

function buildMyRealmReflection(missions = [], progression = {}) {
  const facets = FACETS.map((facet) => {
    const rows = missions.filter((mission) => facet.stationIds.includes(mission.stationId));
    return freeze({
      id: facet.id,
      label: facet.label,
      claimedCount: rows.filter((mission) => mission.state === 'claimed').length,
      readyCount: rows.filter((mission) => mission.state === 'verified-ready').length,
      total: rows.length,
      complete: rows.length > 0 && rows.every((mission) => mission.state === 'claimed')
    });
  });
  const claimedCount = missions.filter((mission) => mission.state === 'claimed').length;
  const readyCount = missions.filter((mission) => mission.state === 'verified-ready').length;
  return freeze({
    schema: EON_CITY_W752_SCHEMA,
    title: reflectionTitle(claimedCount),
    line: claimedCount === 0
      ? 'My Realm is quiet. Genuine completed work will form its private reflection.'
      : `${claimedCount} verified mission${claimedCount === 1 ? '' : 's'} now shape a private, non-transferable City reflection.`,
    claimedCount,
    readyCount,
    facetCount: facets.length,
    facets: freeze(facets),
    xp: Math.max(0, finite(progression?.xp)),
    ownedCosmeticCount: Array.isArray(progression?.ownedCosmetics) ? progression.ownedCosmetics.length : 0,
    privateReflection: true,
    publicProfileChanged: false,
    publicWorldCreated: false,
    multiplayerEnabled: false,
    privateContentStored: false,
    automaticNavigation: false,
    automaticPublishing: false
  });
}

export function projectEonCityW752MissionsProgression({
  stationView = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { stations: {} } }),
  progression = readEonCityW659gProgression({ storage: null })
} = {}) {
  const rule = rewardRule();
  const missions = EON_CITY_W752_MISSION_DEFINITIONS.map((definition) => {
    const station = stationById(stationView, definition.stationId) || {};
    const receiptId = safeId(station?.verifiedOutcome?.receiptId);
    const state = missionState(station, progression);
    const explorationMission = getEonCityW737MissionForStation(definition.stationId);
    return freeze({
      ...definition,
      category: definition.realmFacet,
      discoveryId: explorationMission?.discoveryId || '',
      actionLabel: explorationMission?.actionLabel || `Go to ${definition.title}`,
      surface: station?.surface || explorationMission?.surface || '',
      state,
      stationState: clean(station?.state || 'ready'),
      nativeReceiptId: receiptId,
      nativeReceiptAvailable: Boolean(receiptId && station?.state === 'verified'),
      claimed: state === 'claimed',
      claimable: state === 'verified-ready',
      xpReward: Math.max(0, finite(rule.xp)),
      revealProgressReward: Math.max(0, finite(rule.reveal)),
      progressIsLocalOnly: true,
      receiptPayloadStored: false,
      privateContentStored: false,
      paidReward: false,
      randomizedReward: false,
      transferableReward: false,
      streakRequired: false,
      publicPostingRequired: false
    });
  });
  const next = nextCosmetic(progression);
  const pendingReveals = Math.max(0, Math.floor(finite(progression?.pendingReveals)));
  const revealProgress = Math.max(0, finite(progression?.revealProgress)) % EON_CITY_W659G_REVEAL_THRESHOLD;
  return freeze({
    schema: EON_CITY_W752_SCHEMA,
    missionCount: missions.length,
    claimedCount: missions.filter((mission) => mission.claimed).length,
    claimableCount: missions.filter((mission) => mission.claimable).length,
    missions: freeze(missions),
    xp: Math.max(0, finite(progression?.xp)),
    revealProgress,
    revealThreshold: EON_CITY_W659G_REVEAL_THRESHOLD,
    pendingReveals: next ? pendingReveals : 0,
    deferredRevealCredits: next ? 0 : pendingReveals,
    openedReveals: Math.max(0, Math.floor(finite(progression?.openedReveals))),
    ownedCosmetics: freeze((Array.isArray(progression?.ownedCosmetics) ? progression.ownedCosmetics : []).slice()),
    selectedCosmetics: freeze({ ...(progression?.selectedCosmetics || {}) }),
    nextReveal: next ? freeze({ id: next.id, label: next.label, family: next.family, description: next.description, deterministicPosition: (progression?.ownedCosmetics?.length || 0) + 1 }) : null,
    revealCatalogComplete: !next,
    myRealm: buildMyRealmReflection(missions, progression),
    ownsXpLedger: false,
    ownsNativeReceipts: false,
    ownsProductState: false,
    explicitClaimRequired: true,
    explicitRevealRequired: true,
    deterministicCosmeticsOnly: true,
    lootBox: false,
    chanceBased: false,
    paidRandomReward: false,
    streakPunishment: false,
    fakeUrgency: false,
    clickFarming: false,
    uncontrolledPublicPostingReward: false,
    automaticExecution: false,
    automaticPublishing: false
  });
}

export function getEonCityW752Mission(view = {}, stationId = '') {
  return (Array.isArray(view?.missions) ? view.missions : []).find((entry) => entry.stationId === clean(stationId)) || null;
}

function emitView(environment, view, reason = 'refresh') {
  if (typeof environment?.dispatchEvent !== 'function' || typeof environment.CustomEvent !== 'function') return false;
  environment.dispatchEvent(new environment.CustomEvent(EON_CITY_W752_VIEW_EVENT, { detail: freeze({ schema: EON_CITY_W752_SCHEMA, reason: clean(reason).slice(0, 80), view }) }));
  return true;
}

function resolveClaimAuthority(mission = {}, storage = null) {
  if (!mission?.nativeReceiptId) return freeze({ ok: false, reason: 'verified-native-receipt-required' });
  if (mission.stationId === 'eonbot-nexus') {
    const orientation = getEonCityProductiveRpgPlan({ storage }).missions.find((entry) => entry.id === 'orientation');
    const receiptId = safeId(orientation?.outcome?.receiptId);
    return orientation?.state === 'completed' && orientation?.outcome?.verified === true && receiptId === mission.nativeReceiptId
      ? freeze({ ok: true, authority: 'bounded-orientation-receipt', receiptId })
      : freeze({ ok: false, reason: 'verified-native-receipt-not-authoritative' });
  }
  const receipt = getVerifiedEonCityProgressReceipt({ storage, receiptId: mission.nativeReceiptId, stationId: mission.stationId });
  return receipt
    ? freeze({ ok: true, authority: 'core-outcome-city-progress', receiptId: receipt.receiptId, coreOutcomeId: receipt.coreOutcomeId })
    : freeze({ ok: false, reason: 'verified-native-receipt-not-authoritative' });
}

export function createEonCityW752MissionsProgression({
  stationController = null,
  storage = null,
  environment = globalThis,
  now = () => Date.now(),
  readProgression = null
} = {}) {
  const boundedStorage = resolveStorage(storage);
  const readLedger = typeof readProgression === 'function' ? readProgression : () => readEonCityW659gProgression({ storage: boundedStorage, now: finite(now(), Date.now()) });
  const readStations = () => stationController?.getView?.() || projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { stations: {} } });
  let disposed = false;
  let view;
  const refresh = (reason = 'refresh', { emit = true } = {}) => {
    if (disposed) return view;
    let stationView;
    let progression;
    try { stationView = readStations(); }
    catch { stationView = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { stations: {} } }); }
    try { progression = readLedger(); }
    catch { progression = readEonCityW659gProgression({ storage: null }); }
    view = projectEonCityW752MissionsProgression({ stationView, progression });
    if (emit) emitView(environment, view, reason);
    return view;
  };
  refresh('initial', { emit: false });

  const claimMission = (stationId = '', { explicitUserAction = false } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'w752-disposed', view });
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', view });
    const mission = getEonCityW752Mission(view, stationId);
    if (!mission) return freeze({ ok: false, reason: 'mission-not-found', view });
    if (mission.claimed) return freeze({ ok: true, reason: 'already-claimed', awarded: freeze({ xp: 0, reveal: 0 }), mission, view });
    if (!mission.claimable || !mission.nativeReceiptId) return freeze({ ok: false, reason: 'verified-native-receipt-required', mission, view });
    const authority = resolveClaimAuthority(mission, boundedStorage);
    if (!authority.ok) return freeze({ ok: false, reason: authority.reason, mission, view, awarded: freeze({ xp: 0, reveal: 0 }) });
    const result = recordEonCityW659gVerifiedAction({
      type: EON_CITY_W752_REWARD_TYPE,
      receiptId: mission.nativeReceiptId,
      verified: true,
      verifiedAt: finite(now(), Date.now()),
      source: `w752:${mission.stationId}`
    }, { storage: boundedStorage, now: finite(now(), Date.now()) });
    refresh(result.ok ? 'mission-claimed' : 'mission-claim-failed');
    return freeze({ ...result, authority, mission: getEonCityW752Mission(view, stationId), view, automaticExecution: false, automaticPublishing: false });
  };

  const openReveal = ({ explicitUserAction = false } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'w752-disposed', view });
    if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', view });
    if (view.revealCatalogComplete) return freeze({ ok: false, reason: 'cosmetic-catalog-complete', view });
    const result = openEonCityW659gVaultReveal({ explicitUserAction: true }, { storage: boundedStorage, now: finite(now(), Date.now()) });
    refresh(result.ok ? 'vault-reveal-opened' : 'vault-reveal-failed');
    return freeze({ ...result, view, deterministic: true, paid: false, chanceBased: false });
  };

  const selectCosmetic = (rewardId = '', { explicitUserAction = false } = {}) => {
    if (disposed) return freeze({ ok: false, reason: 'w752-disposed', view });
    const result = selectEonCityW659gCosmetic(rewardId, { explicitUserAction }, { storage: boundedStorage, now: finite(now(), Date.now()) });
    refresh(result.ok ? 'cosmetic-selected' : 'cosmetic-selection-failed');
    return freeze({ ...result, view, localCosmeticOnly: true });
  };

  const onStationView = () => refresh('station-view-changed');
  const onVerifiedAction = () => refresh('verified-action-changed');
  const onStorage = (event) => {
    if ([EON_CITY_W659G_PROGRESSION_STORAGE_KEY].includes(String(event?.key || ''))) refresh('storage-change');
  };
  environment.addEventListener?.(EON_CITY_W751_VIEW_EVENT, onStationView);
  environment.addEventListener?.(EON_CITY_W659G_VERIFIED_ACTION_EVENT, onVerifiedAction);
  environment.addEventListener?.('storage', onStorage);

  return freeze({
    ok: true,
    schema: EON_CITY_W752_SCHEMA,
    getView: () => view,
    getMission: (stationId) => getEonCityW752Mission(view, stationId),
    refresh,
    claimMission,
    openVaultReveal: openReveal,
    selectCosmetic,
    dispose() {
      if (disposed) return;
      disposed = true;
      environment.removeEventListener?.(EON_CITY_W751_VIEW_EVENT, onStationView);
      environment.removeEventListener?.(EON_CITY_W659G_VERIFIED_ACTION_EVENT, onVerifiedAction);
      environment.removeEventListener?.('storage', onStorage);
    }
  });
}

export function validateEonCityW752MissionsProgression(view = projectEonCityW752MissionsProgression()) {
  const errors = [];
  if (view?.schema !== EON_CITY_W752_SCHEMA) errors.push('schema-invalid');
  if (!Array.isArray(view?.missions) || view.missions.length !== 10) errors.push('ten-missions-required');
  const stationIds = new Set(EON_CITY_W751_STATION_LOOPS.map((entry) => entry.stationId));
  const ids = new Set();
  for (const mission of view?.missions || []) {
    if (!stationIds.has(mission.stationId) || ids.has(mission.stationId)) errors.push(`mission-station:${mission.stationId || 'missing'}`);
    if (!mission.title || !mission.summary || !mission.completionAuthority) errors.push(`mission-copy:${mission.stationId}`);
    if (mission.claimed && (!mission.nativeReceiptId || mission.state !== 'claimed')) errors.push(`mission-fake-claim:${mission.stationId}`);
    if (mission.claimable && (!mission.nativeReceiptId || mission.state !== 'verified-ready')) errors.push(`mission-fake-ready:${mission.stationId}`);
    if (mission.paidReward || mission.randomizedReward || mission.transferableReward || mission.streakRequired || mission.publicPostingRequired || mission.privateContentStored || mission.receiptPayloadStored) errors.push(`mission-boundary:${mission.stationId}`);
    ids.add(mission.stationId);
  }
  if (view?.myRealm?.facetCount !== 5 || !Array.isArray(view?.myRealm?.facets) || view.myRealm.facets.length !== 5) errors.push('my-realm-five-facets-required');
  if (!view?.myRealm?.privateReflection || view?.myRealm?.publicProfileChanged || view?.myRealm?.publicWorldCreated || view?.myRealm?.multiplayerEnabled || view?.myRealm?.privateContentStored) errors.push('my-realm-boundary-invalid');
  if (view?.ownsXpLedger || view?.ownsNativeReceipts || view?.ownsProductState || !view?.explicitClaimRequired || !view?.explicitRevealRequired || !view?.deterministicCosmeticsOnly) errors.push('authority-boundary-invalid');
  if (view?.lootBox || view?.chanceBased || view?.paidRandomReward || view?.streakPunishment || view?.fakeUrgency || view?.clickFarming || view?.uncontrolledPublicPostingReward || view?.automaticExecution || view?.automaticPublishing) errors.push('fairness-boundary-invalid');
  if (view?.nextReveal && !EON_CITY_W659G_COSMETIC_REWARDS.some((entry) => entry.id === view.nextReveal.id)) errors.push('reveal-catalog-invalid');
  const serialised = JSON.stringify(view);
  if (/rawPrompt|providerKey|cardNumber|wallet|cash reward|loot box|random chance|streak expires/i.test(serialised)) errors.push('private-or-manipulative-copy');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: view?.schema || '', missionCount: view?.missions?.length || 0, claimedCount: view?.claimedCount || 0 });
}

export default freeze({
  EON_CITY_W752_SCHEMA,
  EON_CITY_W752_VIEW_EVENT,
  EON_CITY_W752_MISSION_DEFINITIONS,
  projectEonCityW752MissionsProgression,
  getEonCityW752Mission,
  createEonCityW752MissionsProgression,
  validateEonCityW752MissionsProgression
});
