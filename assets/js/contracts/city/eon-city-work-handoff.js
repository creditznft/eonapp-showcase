/**
 * A15 C04 — canonical City → Core work handoff and Core → City return receipt.
 *
 * This contract carries opaque references and bounded context only. It never
 * carries project bodies, prompts, provider output, credentials, raw media,
 * billing data or an execution instruction. Opening a Core surface is not a
 * verified outcome and never grants XP.
 */
import {
  EON_HANDOFF_QUERY_KEY,
  consumeEonHandoff,
  prepareEonHandoff,
  readEonHandoff,
  writeEonHandoff
} from '../navigation/eon-handoff-authority.js';
import { buildEonDestinationHref, getEonDestination } from '../navigation/eon-destination-registry.js';

export const EON_CITY_WORK_HANDOFF_SCHEMA = 'eon.city-work-handoff.a15.v1';
export const EON_CITY_WORK_RETURN_SCHEMA = 'eon.city-work-return.a15.v1';
export const EON_CITY_WORK_RETURN_STORE_SCHEMA = 'eon.city-work-return-store.a15.v1';
export const EON_CITY_WORK_RETURN_STORAGE_KEY = 'eon:city:work-returns:a15:v1';
export const EON_CITY_WORK_RETURN_QUERY_KEY = 'returnReceipt';
export const EON_CITY_WORK_RETURN_MAX = 64;

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 180) => Array.from(String(value || ''), (character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127 ? character : ' '; }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
const SAFE_ID = /^[a-z0-9:_-]{1,180}$/i;
const FORBIDDEN_SERIALIZED = /(?:prompt|output|content|body|message|secret|password|passphrase|token|credential|api.?key|private.?key|blob|binary|media.?body|payment|wallet|email|phone)/i;

const STATION_DESTINATIONS = freeze({
  'eonbot-nexus': freeze({ receiverId: 'home', surface: 'chat', label: 'EONBOT' }),
  'create-forge': freeze({ receiverId: 'create', surface: 'create', label: 'Create' }),
  'project-atlas': freeze({ receiverId: 'projects', surface: 'projects', label: 'Projects' }),
  'library-vault': freeze({ receiverId: 'capsule', surface: 'library', label: 'Data Survival' }),
  'share-capture': freeze({ receiverId: 'home', surface: 'share', label: 'Share Command Center' }),
  'command-console': freeze({ receiverId: 'projects', surface: 'command-status', label: 'Command Status' }),
  'automation-theatre': freeze({ receiverId: 'automations', surface: 'automations', label: 'Automations' }),
  'local-ai-lab': freeze({ receiverId: 'local-ai', surface: 'local-ai', label: 'Local AI' }),
  'my-realm-portal': freeze({ receiverId: 'realm-studio', surface: 'my-realm', label: 'Realm Studio' }),
  'plans-access': freeze({ receiverId: 'billing', surface: 'plans', label: 'Plans & Access' })
});

const SURFACE_DESTINATIONS = freeze({
  chat: 'home', nexus: 'home', create: 'create', forge: 'forge', projects: 'projects',
  library: 'library', capsule: 'capsule', workspace: 'workspace', automations: 'automations',
  'local-ai': 'local-ai', share: 'home', 'creator-capture': 'create', plans: 'billing',
  'my-realm': 'realm-studio', 'command-status': 'projects', 'command-centre': 'projects',
  'agent-theatre': 'automations', status: 'status'
});

function emptyReturnStore() {
  return { schema: EON_CITY_WORK_RETURN_STORE_SCHEMA, receipts: [] };
}

function readReturnStore(storage) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(EON_CITY_WORK_RETURN_STORAGE_KEY) || 'null');
    if (parsed?.schema !== EON_CITY_WORK_RETURN_STORE_SCHEMA || !Array.isArray(parsed.receipts)) return emptyReturnStore();
    return parsed;
  } catch {
    return emptyReturnStore();
  }
}

function writeReturnStore(storage, value) {
  try {
    storage?.setItem?.(EON_CITY_WORK_RETURN_STORAGE_KEY, JSON.stringify(value));
    return storage?.getItem?.(EON_CITY_WORK_RETURN_STORAGE_KEY) === JSON.stringify(value);
  } catch {
    return false;
  }
}

function safeContext(input = {}) {
  const context = {
    sourceMode: clean(input.sourceMode || 'command-hub', 60),
    stationId: clean(input.stationId, 100),
    actionId: clean(input.actionId || 'open-maintained-surface', 100),
    citySessionId: clean(input.citySessionId, 160),
    missionId: clean(input.missionId, 140),
    objectiveId: clean(input.objectiveId, 140),
    regionId: clean(input.regionId, 100),
    plotId: clean(input.plotId, 100),
    buildingId: clean(input.buildingId, 100),
    surface: clean(input.surface, 80),
    returnContextId: clean(input.returnContextId, 160)
  };
  const output = Object.fromEntries(Object.entries(context).filter(([, value]) => value));
  if (FORBIDDEN_SERIALIZED.test(JSON.stringify(output))) throw new Error('city-work-context-sensitive-field');
  return freeze(output);
}

export function listEonCityWorkDestinations() {
  return freeze(Object.entries(STATION_DESTINATIONS).map(([stationId, value]) => freeze({ stationId, ...value })));
}

export function resolveEonCityWorkDestination(input = {}) {
  const stationId = clean(input.stationId, 100);
  const surface = clean(input.surface, 80).toLowerCase();
  const station = STATION_DESTINATIONS[stationId] || null;
  const receiverId = clean(input.receiverId || station?.receiverId || SURFACE_DESTINATIONS[surface], 80).toLowerCase();
  const destination = getEonDestination(receiverId);
  if (!destination || destination.id === 'eoncity') return freeze({ ok: false, reason: 'maintained-core-destination-required', destination: null });
  return freeze({
    ok: true,
    reason: '',
    destination,
    receiverId: destination.id,
    surface: surface || station?.surface || destination.id,
    safeLabel: clean(input.safeLabel || station?.label || destination.label, 160)
  });
}

function cityWorkInput(input = {}) {
  if (Object.keys(input && typeof input === 'object' ? input : {}).some((key) => FORBIDDEN_SERIALIZED.test(key))) {
    return freeze({ ok: false, reason: 'city-work-context-sensitive-field', destination: null });
  }
  const resolved = resolveEonCityWorkDestination(input);
  if (!resolved.ok) return resolved;
  let context;
  try { context = safeContext({ ...input, surface: resolved.surface }); }
  catch (error) { return freeze({ ok: false, reason: String(error?.message || error), destination: null }); }
  return freeze({
    ok: true,
    reason: '',
    resolved,
    handoffInput: freeze({
      kind: 'city-work',
      senderId: 'eoncity',
      receiverId: resolved.receiverId,
      referenceId: clean(input.referenceId || context.returnContextId || `${context.stationId || context.sourceMode}:${context.actionId}`, 180),
      safeLabel: resolved.safeLabel,
      sourceSchema: EON_CITY_WORK_HANDOFF_SCHEMA,
      ttlMs: input.ttlMs,
      handoffId: clean(input.handoffId, 180),
      payload: freeze({ schema: EON_CITY_WORK_HANDOFF_SCHEMA, ...context, containsPrivateContent: false, grantsXp: false, automaticExecution: false })
    })
  });
}

export async function prepareEonCityWorkHandoff(input = {}, options = {}) {
  const normalized = cityWorkInput(input);
  if (!normalized.ok) return normalized;
  const prepared = await prepareEonHandoff(normalized.handoffInput, { ...options, explicitUserAction: options.explicitUserAction === true });
  if (!prepared.ok) return prepared;
  return freeze({ ...prepared, cityWorkSchema: EON_CITY_WORK_HANDOFF_SCHEMA, destination: normalized.resolved.destination, grantsXp: false, verifiedOutcome: false });
}

export async function writeEonCityWorkHandoff(input = {}, options = {}) {
  const normalized = cityWorkInput(input);
  if (!normalized.ok) return normalized;
  const written = await writeEonHandoff(normalized.handoffInput, { ...options, explicitUserAction: options.explicitUserAction === true });
  if (!written.ok) return written;
  return freeze({ ...written, cityWorkSchema: EON_CITY_WORK_HANDOFF_SCHEMA, destination: normalized.resolved.destination, grantsXp: false, verifiedOutcome: false });
}

export async function consumeEonCityWorkHandoff(handoffId = '', options = {}) {
  const consumed = await consumeEonHandoff(handoffId, options);
  if (!consumed.ok) return consumed;
  if (consumed.handoff.kind !== 'city-work' || consumed.handoff.payload?.schema !== EON_CITY_WORK_HANDOFF_SCHEMA) {
    return freeze({ ok: false, reason: 'city-work-handoff-required' });
  }
  return freeze({ ...consumed, grantsXp: false, verifiedOutcome: false });
}

function returnId(handoffId = '') {
  const suffix = clean(handoffId, 180).replace(/[^a-z0-9]/gi, '').slice(-32);
  return `city_return_${suffix}`;
}

export function writeEonCityWorkReturnReceipt(input = {}, options = {}) {
  if (options.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  const storage = options.sessionStorage || globalThis.sessionStorage;
  const handoffResult = readEonHandoff(input.handoffId, { sessionStorage: storage });
  if (!handoffResult.ok) return freeze({ ok: false, reason: handoffResult.reason });
  const handoff = handoffResult.handoff;
  if (handoff.kind !== 'city-work' || handoff.payload?.schema !== EON_CITY_WORK_HANDOFF_SCHEMA) return freeze({ ok: false, reason: 'city-work-handoff-required' });
  if (!handoff.consumedAt || !handoff.resultReceiptId) return freeze({ ok: false, reason: 'core-receiver-consumption-required' });
  const receiverId = clean(input.receiverId || handoff.receiver?.id, 80);
  if (receiverId !== handoff.receiver?.id) return freeze({ ok: false, reason: 'return-receiver-mismatch' });
  const result = ['completed', 'cancelled', 'error'].includes(input.result) ? input.result : 'completed';
  const state = readReturnStore(storage);
  if (state.receipts.some((row) => row.handoffId === handoff.handoffId)) return freeze({ ok: false, reason: 'return-receipt-already-exists', receipt: state.receipts.find((row) => row.handoffId === handoff.handoffId) });
  if (state.receipts.length >= EON_CITY_WORK_RETURN_MAX) return freeze({ ok: false, reason: 'return-receipt-capacity-reached' });
  const now = Number(options.now ?? Date.now());
  const receipt = freeze({
    schema: EON_CITY_WORK_RETURN_SCHEMA,
    receiptId: clean(input.receiptId, 180) || returnId(handoff.handoffId),
    handoffId: handoff.handoffId,
    senderId: 'eoncity',
    receiverId,
    payloadDigest: handoff.payloadDigest,
    stationId: clean(handoff.payload?.stationId, 100),
    sourceMode: clean(handoff.payload?.sourceMode, 60),
    missionId: clean(handoff.payload?.missionId, 140),
    objectiveId: clean(handoff.payload?.objectiveId, 140),
    returnContextId: clean(handoff.payload?.returnContextId, 160),
    result,
    resultCode: clean(input.resultCode || (result === 'completed' ? 'core-work-reviewed' : `core-work-${result}`), 100),
    errorCode: result === 'error' ? clean(input.errorCode || 'core-work-error', 100) : null,
    evidenceReceiptId: clean(input.evidenceReceiptId, 180) || null,
    createdAt: new Date(now).toISOString(),
    cityConsumedAt: null,
    containsPrivateContent: false,
    grantsXp: false,
    verifiedOutcome: false,
    externalExecutionAuthority: false
  });
  if (!SAFE_ID.test(receipt.receiptId)) return freeze({ ok: false, reason: 'invalid-return-receipt-id' });
  const next = { ...state, receipts: [...state.receipts, receipt] };
  if (!writeReturnStore(storage, next)) return freeze({ ok: false, reason: 'return-receipt-storage-unavailable' });
  const href = buildEonDestinationHref('eoncity', { [EON_HANDOFF_QUERY_KEY]: handoff.handoffId, [EON_CITY_WORK_RETURN_QUERY_KEY]: receipt.receiptId });
  return freeze({ ok: true, reason: '', receipt, href });
}

export function readEonCityWorkReturnReceipt(receiptId = '', options = {}) {
  const id = clean(receiptId, 180);
  const receipt = readReturnStore(options.sessionStorage || globalThis.sessionStorage).receipts.find((row) => row.receiptId === id) || null;
  return freeze({ ok: Boolean(receipt), reason: receipt ? '' : 'return-receipt-not-found', receipt });
}

export function cityWorkReturnIdFromLocation(locationLike = globalThis.location) {
  try { return clean(new URLSearchParams(locationLike?.search || '').get(EON_CITY_WORK_RETURN_QUERY_KEY), 180); }
  catch { return ''; }
}

export function consumeEonCityWorkReturnReceipt(receiptId = '', options = {}) {
  const storage = options.sessionStorage || globalThis.sessionStorage;
  const state = readReturnStore(storage);
  const id = clean(receiptId, 180);
  const index = state.receipts.findIndex((row) => row.receiptId === id);
  if (index < 0) return freeze({ ok: false, reason: 'return-receipt-not-found' });
  const receipt = state.receipts[index];
  if (receipt.cityConsumedAt) return freeze({ ok: false, reason: 'return-receipt-already-consumed', receipt });
  const handoffResult = readEonHandoff(receipt.handoffId, { sessionStorage: storage });
  if (!handoffResult.ok || handoffResult.handoff?.payloadDigest !== receipt.payloadDigest) return freeze({ ok: false, reason: 'return-receipt-handoff-mismatch' });
  const consumed = freeze({ ...receipt, cityConsumedAt: new Date(Number(options.now ?? Date.now())).toISOString() });
  const receipts = [...state.receipts];
  receipts[index] = consumed;
  if (!writeReturnStore(storage, { ...state, receipts })) return freeze({ ok: false, reason: 'return-receipt-storage-unavailable' });
  return freeze({ ok: true, reason: '', receipt: consumed, grantsXp: false, verifiedOutcome: false });
}

export function consumeEonCityWorkReturnFromLocation(options = {}) {
  const receiptId = cityWorkReturnIdFromLocation(options.location || globalThis.location);
  if (!receiptId) return freeze({ ok: false, reason: 'return-receipt-query-missing' });
  return consumeEonCityWorkReturnReceipt(receiptId, options);
}

export function inspectEonCityWorkReturnStore(options = {}) {
  const receipts = readReturnStore(options.sessionStorage || globalThis.sessionStorage).receipts;
  return freeze({
    schema: EON_CITY_WORK_RETURN_STORE_SCHEMA,
    receiptCount: receipts.length,
    pendingCityCount: receipts.filter((row) => !row.cityConsumedAt).length,
    consumedCityCount: receipts.filter((row) => row.cityConsumedAt).length,
    verifiedOutcomeCount: receipts.filter((row) => row.verifiedOutcome === true).length
  });
}

export function getEonCityWorkHandoffTruth() {
  return freeze({
    schema: EON_CITY_WORK_HANDOFF_SCHEMA,
    maintainedCoreDestinationRequired: true,
    explicitUserActionRequired: true,
    singleConsumeHandoff: true,
    singleConsumeReturnReceipt: true,
    privateContentAllowed: false,
    openingRouteGrantsXp: false,
    returningToCityGrantsXp: false,
    verifiedOutcomeAuthority: false,
    automaticNavigation: false,
    automaticExecution: false
  });
}
