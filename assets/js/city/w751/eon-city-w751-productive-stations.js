/**
 * W751 — ten distinctive productive stations and real work loops.
 *
 * This layer is a bounded City projection over maintained work surfaces and
 * W624G verified outcome receipts. It owns no project, prompt, file, provider,
 * billing, automation, sharing or Realm business state. City may remember that
 * a station loop was reviewed, opened or returned from, but it may never mark a
 * native outcome verified without an existing bounded receipt authority.
 */
import {
  EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY,
  getEonCityProductiveRpgPlan
} from '../eon-city-productive-rpg-loop.js';
import {
  EON_CITY_W737_MISSION_STORAGE_KEY,
  buildEonCityW737MissionView
} from '../w737/eon-city-w737-missions.js';
import { EON_CITY_W731_STATIONS } from '../w731/eon-city-w731-command-hub-contract.js';
import {
  resolveEonCityWorkDestination,
  writeEonCityWorkHandoff
} from '../../contracts/city/eon-city-work-handoff.js';
import {
  EON_SHARE_W753_RECEIPT_EVENT,
  EON_SHARE_W753_RECEIPT_STORAGE_KEY,
  readEonShareW753ReviewedHandoffReceipt
} from '../../contracts/share/eon-share-w753-reviewed-handoff-receipt.js';
import {
  EON_CITY_PROGRESS_EVENT,
  EON_CITY_PROGRESS_STORAGE_KEY,
  getLatestEonCityProgressReceipt,
  listVerifiedEonCityProgressReceipts,
  syncEonCoreOutcomesToCity
} from '../../contracts/city/eon-city-progress-bridge.js';


export const EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA = 'eon.city.productive-stations.w751.v1';
export const EON_CITY_W751_ACTIVITY_STORAGE_KEY = 'eon:city:productive-stations:w751:v1';
export const EON_CITY_W751_VIEW_EVENT = 'eon:city-w751-productive-stations-view-changed';
export const EON_CITY_W751_STATES = Object.freeze(['ready', 'reviewed', 'opened', 'returned', 'active', 'cancelled', 'failed', 'verified']);

const freeze = (value) => Object.freeze(value);
const clean = (value = '') => String(value || '').trim();
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const safeId = (value = '') => clean(value).toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120);
const frozenSteps = (steps) => freeze(steps.map((step, index) => freeze({ order: index + 1, ...step })));
const resolveStorage = (storage) => {
  if (storage && typeof storage === 'object') return storage;
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
};

const STATION_LOOPS = [
  {
    stationId: 'eonbot-nexus', workType: 'orientation', title: 'Frame the next useful move', outcome: 'A reviewed next action or a real EONBOT handoff.', productiveMissionId: 'orientation', proofHref: '/eoncity', proofLabel: 'Review City orientation',
    completionAuthority: 'verified W624G orientation receipt', accent: 'nexus',
    steps: [
      { id: 'read', label: 'Read the live Nexus state', detail: 'Review the privacy-projected project, task, approval, system, mission and result signals.' },
      { id: 'choose', label: 'Choose one maintained action', detail: 'Ask EONBOT, continue a project or open a reviewed work surface.' },
      { id: 'return', label: 'Return with a real outcome', detail: 'City reacts to an existing native receipt; opening the Dock alone is not completion.' }
    ]
  },
  {
    stationId: 'create-forge', workType: 'creation', title: 'Create one real artifact', outcome: 'A verified Image/Video result, save-and-reopen verified Music artifact, private EON Radio station, reviewed guide or applied Forge source.', productiveMissionId: 'creator', proofHref: '/create', proofLabel: 'Open full Create',
    completionAuthority: 'verified Core creator receipt projected into W624G/W752', accent: 'forge',
    steps: [
      { id: 'define', label: 'Define the result', detail: 'Choose Image, Video, Music/Radio, Forge or a review-only guide before selecting execution.' },
      { id: 'path', label: 'Choose a verified execution rail', detail: 'Browser-local, Local AI and Direct BYOK remain explicit; no provider call, upload, model download or credit spend starts automatically.' },
      { id: 'review', label: 'Review the real artifact', detail: 'Only an existing redacted native receipt may verify the loop; City never reads the prompt or media.' }
    ]
  },
  {
    stationId: 'project-atlas', workType: 'projects', title: 'Continue one real project', outcome: 'A created project shell or an explicitly resumed local project.', productiveMissionId: 'project', proofHref: '/projects', proofLabel: 'Open full Projects',
    completionAuthority: 'verified W624G project shell or resume receipt', accent: 'atlas',
    steps: [
      { id: 'select', label: 'Select one active outcome', detail: 'Choose a local project without exposing its title or contents in the 3D world.' },
      { id: 'next', label: 'Review the next useful action', detail: 'Confirm the task or handoff before opening the maintained project surface.' },
      { id: 'continue', label: 'Continue and save natively', detail: 'City accepts only the existing opaque project receipt as proof.' }
    ]
  },
  {
    stationId: 'library-vault', workType: 'recovery', title: 'Recover and reuse saved work', outcome: 'A useful Library item reused, or a verified encrypted Capsule action.', productiveMissionId: 'vault-recovery', proofHref: '/capsule', proofLabel: 'Open encrypted Capsule',
    completionAuthority: 'verified W624G Capsule readiness or restore receipt', accent: 'vault',
    steps: [
      { id: 'find', label: 'Find the right saved item', detail: 'Search ordinary local Library records; secrets remain in Vault.' },
      { id: 'boundary', label: 'Review the data boundary', detail: 'Choose reuse, Vault or encrypted Capsule without exposing private contents to City.' },
      { id: 'reuse', label: 'Reuse or recover explicitly', detail: 'Only a genuine Capsule receipt verifies recovery readiness.' }
    ]
  },
  {
    stationId: 'share-capture', workType: 'sharing', title: 'Prepare a reviewed share', outcome: 'A reviewed signed handoff or an explicitly saved local WebM.', productiveMissionId: '', proofHref: '/', proofLabel: 'Open Share Command Center',
    completionAuthority: 'verified W753 reviewed-handoff or local WebM save receipt', accent: 'signal',
    steps: [
      { id: 'choose', label: 'Choose link, QR or Creator Capture', detail: 'Select the smallest useful handoff before recording or sharing.' },
      { id: 'preview', label: 'Preview framing and caption', detail: 'Review the signed invite, microphone, facecam and local recording choices.' },
      { id: 'share', label: 'Copy or share explicitly', detail: 'Nothing uploads, posts or rewards uncontrolled public sharing automatically.' }
    ]
  },
  {
    stationId: 'command-console', workType: 'operations', title: 'Resolve one command item', outcome: 'One real project, approval, result, system or transit item reviewed.', productiveMissionId: '', proofHref: '/projects', proofLabel: 'Open Projects',
    completionAuthority: 'explicit truthful Command Centre wall review receipt; review remains read-only', accent: 'command',
    steps: [
      { id: 'inspect', label: 'Inspect one live wall', detail: 'Choose Projects & Tasks, Approvals & Results, Systems, Atlas & Transit or Agent Theatre.' },
      { id: 'open', label: 'Open the maintained authority', detail: 'The wall never mutates project, provider, billing or job state.' },
      { id: 'return', label: 'Return after the real review', detail: 'City records the return only; it does not claim the underlying work completed.' }
    ]
  },
  {
    stationId: 'automation-theatre', workType: 'automation', title: 'Prepare or review a genuine automation', outcome: 'A real local automation proposal or a reviewed native job receipt.', productiveMissionId: 'automation', proofHref: '/automations', proofLabel: 'Open full Automations',
    completionAuthority: 'verified W624G automation proposal receipt', accent: 'theatre',
    steps: [
      { id: 'receipt', label: 'Review a genuine receipt or draft', detail: 'No receipt means a still stage and no simulated worker.' },
      { id: 'decision', label: 'Edit, approve or cancel explicitly', detail: 'A draft is not a running queue, schedule or autonomous agent.' },
      { id: 'check', label: 'Check the native state', detail: 'Only stored task state or a verified proposal receipt advances the loop.' }
    ]
  },
  {
    stationId: 'local-ai-lab', workType: 'systems', title: 'Verify one execution path', outcome: 'A real local self-test or explicitly verified user-owned provider key.', productiveMissionId: 'local-ai-byok', proofHref: '/local-ai', proofLabel: 'Open full Local AI',
    completionAuthority: 'verified W624G local self-test or Direct BYOK receipt', accent: 'lab',
    steps: [
      { id: 'inspect', label: 'Inspect device and provider readiness', detail: 'Unavailable runtimes remain unavailable; City never pretends installation or reachability.' },
      { id: 'choose', label: 'Choose Local, Direct BYOK or Guide', detail: 'Keep provider credentials outside the City projection.' },
      { id: 'verify', label: 'Run a real verification', detail: 'Only a successful bounded native receipt verifies this loop.' }
    ]
  },
  {
    stationId: 'my-realm-portal', workType: 'reflection', title: 'Reflect and shape My Realm', outcome: 'A reviewed private layout, shortcut set or read-only Realm Card.', productiveMissionId: '', proofHref: '/realm-studio', proofLabel: 'Open Realm Studio',
    completionAuthority: 'explicit native local Realm save receipt projected through Core', accent: 'realm',
    steps: [
      { id: 'review', label: 'Review the current private layout', detail: 'My Realm remains a fixed personal space, not an uncontrolled public world.' },
      { id: 'shape', label: 'Change one useful element', detail: 'Choose a layout or reviewed shortcut in the maintained Realm Studio.' },
      { id: 'card', label: 'Review the read-only Realm Card', detail: 'Private City state, Vault data, credentials and multiplayer access stay excluded.' }
    ]
  },
  {
    stationId: 'plans-access', workType: 'access', title: 'Compare access safely', outcome: 'An explicitly recorded server-verified access review. Checkout and payment never count as mission proof.', productiveMissionId: '', proofHref: '/billing', proofLabel: 'Open full Billing',
    completionAuthority: 'explicit server-verified access-review receipt; billing changes remain signed-webhook-only', accent: 'access',
    steps: [
      { id: 'verify', label: 'Verify current server access', detail: 'Local storage, City objects and browser return state cannot grant a tier.' },
      { id: 'compare', label: 'Compare capability and price', detail: 'Review trial, monthly price and execution boundaries before any checkout.' },
      { id: 'decide', label: 'Record the review or open checkout separately', detail: 'Mission proof is the explicit server-state review; only the signed provider webhook may confirm an access change.' }
    ]
  }
];

export const EON_CITY_W751_STATION_LOOPS = freeze(STATION_LOOPS.map((definition) => freeze({
  ...definition,
  steps: frozenSteps(definition.steps),
  routeChangeOnOpen: false,
  explicitUserActionRequired: true,
  automaticExecution: false,
  automaticNavigation: false,
  privateDataRead: false,
  reward: null
})));

const definitionByStation = new Map(EON_CITY_W751_STATION_LOOPS.map((entry) => [entry.stationId, entry]));

function emptyStore() {
  return { schema: EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA, updatedAt: 0, stations: {} };
}

function normalizeActivity(value = {}, stationId = '') {
  const lastAction = ['reviewed', 'opened', 'returned'].includes(String(value?.lastAction)) ? String(value.lastAction) : '';
  return freeze({
    stationId,
    reviewedAt: finite(value?.reviewedAt),
    openedAt: finite(value?.openedAt),
    returnedAt: finite(value?.returnedAt),
    updatedAt: finite(value?.updatedAt),
    lastAction,
    completionClaimed: false
  });
}

export function readEonCityW751StationActivity(storage = null) {
  const boundedStorage = resolveStorage(storage);
  try {
    const parsed = JSON.parse(boundedStorage?.getItem?.(EON_CITY_W751_ACTIVITY_STORAGE_KEY) || 'null');
    if (parsed?.schema !== EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA || typeof parsed?.stations !== 'object') return freeze(emptyStore());
    const stations = {};
    for (const definition of EON_CITY_W751_STATION_LOOPS) stations[definition.stationId] = normalizeActivity(parsed.stations[definition.stationId], definition.stationId);
    return freeze({ schema: EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA, updatedAt: finite(parsed.updatedAt), stations: freeze(stations) });
  } catch {
    return freeze(emptyStore());
  }
}

function writeActivity(stationId = '', patch = {}, { storage = null, now = Date.now() } = {}) {
  const definition = definitionByStation.get(clean(stationId));
  if (!definition) return freeze({ ok: false, reason: 'station-loop-not-found' });
  const timestamp = finite(now, Date.now());
  const boundedStorage = resolveStorage(storage);
  try {
    const current = readEonCityW751StationActivity(boundedStorage);
    const previous = normalizeActivity(current.stations[definition.stationId], definition.stationId);
    const next = normalizeActivity({ ...previous, ...patch, stationId: definition.stationId, updatedAt: timestamp }, definition.stationId);
    const store = { schema: EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA, updatedAt: timestamp, stations: { ...current.stations, [definition.stationId]: next } };
    boundedStorage?.setItem?.(EON_CITY_W751_ACTIVITY_STORAGE_KEY, JSON.stringify(store));
    return freeze({ ok: true, stationId: definition.stationId, activity: next, completionClaimed: false });
  } catch {
    return freeze({ ok: false, reason: 'station-loop-storage-unavailable' });
  }
}

function productiveMission(plan = {}, missionId = '') {
  if (!missionId) return null;
  return (Array.isArray(plan?.missions) ? plan.missions : []).find((entry) => entry?.id === missionId) || null;
}

function explorationMission(missions = [], stationId = '') {
  return (Array.isArray(missions) ? missions : []).find((entry) => entry?.stationId === stationId) || null;
}

function stateFor(definition, activity, productive, exploration, projectedReceipt = null) {
  if (projectedReceipt?.verified === true) return 'verified';
  // Only the orientation/Nexus lane may still use the bounded legacy W624G
  // receipt directly. Core-backed station completion must project through the
  // current Core outcome -> City progress bridge.
  if (definition?.stationId === 'eonbot-nexus' && productive?.state === 'completed' && productive?.outcome?.verified === true) return 'verified';
  if (productive?.state === 'active' || productive?.state === 'resumed') return 'active';
  if (productive?.state === 'cancelled') return 'cancelled';
  if (productive?.state === 'failed') return 'failed';
  if (activity.returnedAt || exploration?.localState === 'returned') return 'returned';
  if (activity.openedAt || exploration?.localState === 'opened') return 'opened';
  if (activity.reviewedAt || exploration?.localState === 'reviewed' || productive?.reviewedAt) return 'reviewed';
  return 'ready';
}

function stepState(state = 'ready', index = 0) {
  const reached = state === 'verified' ? 3
    : ['opened', 'returned', 'active', 'cancelled', 'failed'].includes(state) ? 2
      : state === 'reviewed' ? 1 : 0;
  if (state === 'verified' && index === 2) return 'verified';
  if (index < reached) return 'complete';
  if (index === reached || (reached >= 3 && index === 2)) return 'current';
  return 'upcoming';
}

function statusCopy(state = 'ready', definition = {}) {
  if (state === 'verified') return 'Verified by an existing native receipt';
  if (state === 'active') return 'Native work is active; verify only through its own authority';
  if (state === 'cancelled') return 'Native work was cancelled; nothing is represented as complete';
  if (state === 'failed') return 'Native proof failed or is unavailable';
  if (state === 'returned') return 'Returned to City; native completion remains proof-gated';
  if (state === 'opened') return 'Maintained workspace opened';
  if (state === 'reviewed') return 'Work loop reviewed';
  return definition.productiveMissionId ? 'Ready for review and a real native outcome' : 'Ready for review; no completion receipt is projected yet';
}

export function projectEonCityW751ProductiveStations({
  productivePlan = getEonCityProductiveRpgPlan(),
  missionView = buildEonCityW737MissionView(),
  activity = readEonCityW751StationActivity(),
  shareReceipt = readEonShareW753ReviewedHandoffReceipt(),
  progressReceipts = listVerifiedEonCityProgressReceipts()
} = {}) {
  const stations = EON_CITY_W751_STATION_LOOPS.map((definition) => {
    const nativeMission = productiveMission(productivePlan, definition.productiveMissionId);
    const cityMission = explorationMission(missionView, definition.stationId);
    const localActivity = normalizeActivity(activity?.stations?.[definition.stationId], definition.stationId);
    const progressReceipt = getLatestEonCityProgressReceipt(progressReceipts, definition.stationId);
    const projectedReceipt = progressReceipt || (definition.stationId === 'share-capture' && shareReceipt?.verified === true ? shareReceipt : null);
    const state = stateFor(definition, localActivity, nativeMission, cityMission, projectedReceipt);
    const legacyOrientationOutcome = definition.stationId === 'eonbot-nexus' ? nativeMission?.outcome : null;
    const verifiedOutcome = state === 'verified' ? freeze({
      kind: safeId(projectedReceipt?.kind || legacyOrientationOutcome?.kind),
      receiptId: safeId(projectedReceipt?.receiptId || legacyOrientationOutcome?.receiptId),
      verifiedAt: finite(projectedReceipt?.verifiedAt || legacyOrientationOutcome?.verifiedAt),
      coreOutcomeId: safeId(projectedReceipt?.coreOutcomeId),
      evidenceReceiptId: safeId(projectedReceipt?.evidenceReceiptId),
      privateContentStored: false,
      xpGranted: false,
      rewardGranted: false,
      explicitClaimRequired: true
    }) : null;
    const destination = resolveEonCityWorkDestination({ stationId: definition.stationId, surface: EON_CITY_W731_STATIONS.find((station) => station.id === definition.stationId)?.surface || '' });
    return freeze({
      schema: EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA,
      stationId: definition.stationId,
      title: definition.title,
      workType: definition.workType,
      accent: definition.accent,
      outcome: definition.outcome,
      surface: EON_CITY_W731_STATIONS.find((station) => station.id === definition.stationId)?.surface || '',
      proofHref: definition.proofHref,
      proofLabel: definition.proofLabel,
      receiverId: destination.ok ? destination.receiverId : '',
      handoffRequired: true,
      handoffSchema: 'eon.city-work-handoff.a15.v1',
      completionAuthority: definition.completionAuthority,
      productiveMissionId: definition.productiveMissionId,
      state,
      status: statusCopy(state, definition),
      steps: freeze(definition.steps.map((step, index) => freeze({ ...step, state: stepState(state, index) }))),
      activity: localActivity,
      verifiedOutcome,
      completionClaimed: state === 'verified' && verifiedOutcome?.receiptId !== '',
      explicitUserActionRequired: true,
      routeChangeOnOpen: false,
      automaticExecution: false,
      automaticNavigation: false,
      privateDataRead: false,
      providerCallCreated: false,
      paymentStarted: false,
      contentPublished: false,
      reward: null
    });
  });
  return freeze({
    schema: EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA,
    stationCount: stations.length,
    reviewedCount: stations.filter((entry) => entry.state !== 'ready').length,
    verifiedCount: stations.filter((entry) => entry.state === 'verified').length,
    stations: freeze(stations),
    ownsProductState: false,
    ownsReceiptAuthority: false,
    automaticExecution: false,
    automaticNavigation: false,
    privateDataRead: false,
    rewardIssued: false
  });
}

export function getEonCityW751StationLoop(view = {}, stationId = '') {
  return (Array.isArray(view?.stations) ? view.stations : []).find((entry) => entry.stationId === clean(stationId)) || null;
}

function emitView(environment, view, reason = 'refresh') {
  if (typeof environment?.dispatchEvent !== 'function' || typeof environment.CustomEvent !== 'function') return false;
  environment.dispatchEvent(new environment.CustomEvent(EON_CITY_W751_VIEW_EVENT, { detail: freeze({ schema: EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA, reason: clean(reason).slice(0, 80), view }) }));
  return true;
}

export function createEonCityW751ProductiveStations({
  storage = null,
  environment = globalThis,
  now = () => Date.now(),
  getProductivePlan = null,
  getMissionView = null
} = {}) {
  const boundedStorage = resolveStorage(storage);
  const readProductivePlan = typeof getProductivePlan === 'function' ? getProductivePlan : () => getEonCityProductiveRpgPlan({ storage: boundedStorage });
  const readMissionView = typeof getMissionView === 'function' ? getMissionView : () => buildEonCityW737MissionView(boundedStorage);
  let disposed = false;
  let view;
  try {
    syncEonCoreOutcomesToCity({ storage: boundedStorage, environment, now: finite(now(), Date.now()) });
    view = projectEonCityW751ProductiveStations({ productivePlan: readProductivePlan(), missionView: readMissionView(), activity: readEonCityW751StationActivity(boundedStorage), shareReceipt: readEonShareW753ReviewedHandoffReceipt({ storage: boundedStorage }), progressReceipts: listVerifiedEonCityProgressReceipts({ storage: boundedStorage }) });
  } catch {
    view = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: readEonCityW751StationActivity(boundedStorage), shareReceipt: readEonShareW753ReviewedHandoffReceipt({ storage: boundedStorage }), progressReceipts: listVerifiedEonCityProgressReceipts({ storage: boundedStorage }) });
  }
  const refresh = (reason = 'refresh') => {
    if (disposed) return view;
    try {
      syncEonCoreOutcomesToCity({ storage: boundedStorage, environment, now: finite(now(), Date.now()) });
    view = projectEonCityW751ProductiveStations({ productivePlan: readProductivePlan(), missionView: readMissionView(), activity: readEonCityW751StationActivity(boundedStorage), shareReceipt: readEonShareW753ReviewedHandoffReceipt({ storage: boundedStorage }), progressReceipts: listVerifiedEonCityProgressReceipts({ storage: boundedStorage }) });
    } catch {
      view = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: readEonCityW751StationActivity(boundedStorage), shareReceipt: readEonShareW753ReviewedHandoffReceipt({ storage: boundedStorage }), progressReceipts: listVerifiedEonCityProgressReceipts({ storage: boundedStorage }) });
    }
    emitView(environment, view, reason);
    return view;
  };
  const update = (stationId, action, explicitUserAction) => {
    if (disposed) return freeze({ ok: false, reason: 'productive-stations-disposed', view });
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', view });
    const timestamp = finite(now(), Date.now());
    const current = readEonCityW751StationActivity(boundedStorage).stations?.[stationId] || {};
    const patch = action === 'reviewed'
      ? { reviewedAt: current.reviewedAt || timestamp, lastAction: 'reviewed' }
      : action === 'opened'
        ? { reviewedAt: current.reviewedAt || timestamp, openedAt: timestamp, lastAction: 'opened' }
        : { reviewedAt: current.reviewedAt || timestamp, openedAt: current.openedAt || timestamp, returnedAt: timestamp, lastAction: 'returned' };
    const result = writeActivity(stationId, patch, { storage: boundedStorage, now: timestamp });
    refresh(`station-${action}`);
    return freeze({ ...result, view, station: getEonCityW751StationLoop(view, stationId) });
  };
  const onStorage = (event) => {
    if ([EON_CITY_W751_ACTIVITY_STORAGE_KEY, EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY, EON_CITY_W737_MISSION_STORAGE_KEY, EON_SHARE_W753_RECEIPT_STORAGE_KEY, EON_CITY_PROGRESS_STORAGE_KEY].includes(String(event?.key || ''))) refresh('storage-change');
  };
  const onShareReceipt = () => refresh('share-receipt-changed');
  const onProgressReceipt = () => refresh('core-progress-receipt-changed');
  environment.addEventListener?.('storage', onStorage);
  environment.addEventListener?.(EON_SHARE_W753_RECEIPT_EVENT, onShareReceipt);
  environment.addEventListener?.(EON_CITY_PROGRESS_EVENT, onProgressReceipt);
  return freeze({
    ok: true,
    schema: EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA,
    getView: () => view,
    getStation: (stationId) => getEonCityW751StationLoop(view, stationId),
    reviewStation: (stationId, { explicitUserAction = false } = {}) => update(clean(stationId), 'reviewed', explicitUserAction),
    markOpened: (stationId, { explicitUserAction = false } = {}) => update(clean(stationId), 'opened', explicitUserAction),
    markReturned: (stationId, { explicitUserAction = false } = {}) => update(clean(stationId), 'returned', explicitUserAction),
    async prepareHandoff(stationId, context = {}, { explicitUserAction = false, sessionStorage = globalThis.sessionStorage, cryptoApi = globalThis.crypto, now: createdAt = Date.now() } = {}) {
      const station = getEonCityW751StationLoop(view, clean(stationId));
      if (!station) return freeze({ ok: false, reason: 'productive-station-not-found' });
      const result = await writeEonCityWorkHandoff({
        stationId: station.stationId,
        surface: station.surface,
        actionId: clean(context.actionId || 'open-maintained-surface'),
        sourceMode: clean(context.sourceMode || 'command-hub'),
        citySessionId: clean(context.citySessionId),
        missionId: clean(context.missionId || station.productiveMissionId),
        objectiveId: clean(context.objectiveId),
        regionId: clean(context.regionId),
        plotId: clean(context.plotId),
        buildingId: clean(context.buildingId),
        returnContextId: clean(context.returnContextId || `station:${station.stationId}`),
        safeLabel: station.proofLabel,
        referenceId: clean(context.referenceId || `station:${station.stationId}`)
      }, { explicitUserAction, sessionStorage, cryptoApi, now: createdAt });
      if (result.ok) update(station.stationId, 'opened', true);
      return result;
    },
    refresh,
    dispose() {
      if (disposed) return;
      disposed = true;
      environment.removeEventListener?.('storage', onStorage);
      environment.removeEventListener?.(EON_SHARE_W753_RECEIPT_EVENT, onShareReceipt);
      environment.removeEventListener?.(EON_CITY_PROGRESS_EVENT, onProgressReceipt);
    }
  });
}

export function validateEonCityW751ProductiveStations(view = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: emptyStore() })) {
  const errors = [];
  const launchIds = new Set(EON_CITY_W731_STATIONS.map((station) => station.id));
  const ids = new Set();
  if (view?.schema !== EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA) errors.push('schema-invalid');
  if ((view?.stations || []).length !== 10) errors.push('ten-stations-required');
  for (const station of view?.stations || []) {
    if (!launchIds.has(station.stationId) || ids.has(station.stationId)) errors.push(`station-id:${station.stationId || 'missing'}`);
    if (!station.title || !station.outcome || !station.completionAuthority) errors.push(`station-copy:${station.stationId}`);
    if (!station.handoffRequired || !station.receiverId || station.handoffSchema !== 'eon.city-work-handoff.a15.v1') errors.push(`handoff-destination:${station.stationId}`);
    if ((station.steps || []).length !== 3 || new Set((station.steps || []).map((step) => step.id)).size !== 3) errors.push(`three-step-loop:${station.stationId}`);
    if (!EON_CITY_W751_STATES.includes(station.state)) errors.push(`state:${station.stationId}`);
    if (station.completionClaimed && (!station.verifiedOutcome?.receiptId || station.state !== 'verified')) errors.push(`fake-completion:${station.stationId}`);
    if (station.automaticExecution || station.automaticNavigation || station.privateDataRead || station.providerCallCreated || station.paymentStarted || station.contentPublished || station.reward !== null) errors.push(`truth-boundary:${station.stationId}`);
    ids.add(station.stationId);
  }
  if (view?.ownsProductState || view?.ownsReceiptAuthority || view?.automaticExecution || view?.automaticNavigation || view?.privateDataRead || view?.rewardIssued) errors.push('global-truth-boundary');
  const serialised = JSON.stringify(view);
  if (/rawPrompt|providerKey|cardNumber|payment complete|reward earned|autonomous worker/i.test(serialised)) errors.push('private-or-fake-claim');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: view?.schema || '', stationCount: view?.stations?.length || 0, verifiedCount: view?.verifiedCount || 0 });
}
