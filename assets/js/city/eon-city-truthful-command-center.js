/**
 * W624H — read-only truthful Command Center status projection.
 *
 * It reads bounded counts/timestamps from local stores and one server-authoritative
 * billing status endpoint. It never exposes project/job text, credentials, prompts,
 * files, account identifiers or payment records, and it never mutates product state.
 */
import { EON_PROJECTS_STORAGE_KEY } from '../contracts/projects/eon-project-store-contract.js';
import { EONBOT_JOB_FABRIC_STORAGE_KEY } from '../contracts/workflow/eonbot-job-fabric-projection.js';
import { EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY } from './eon-city-productive-rpg-loop.js';

export const EON_CITY_TRUTHFUL_COMMAND_CENTER_SCHEMA = 'eon.city.truthful-command-center.w624h.v1';
export const EON_CITY_TRUTHFUL_COMMAND_CENTER_STATES = Object.freeze(['loading', 'current', 'empty', 'stale', 'offline', 'unavailable', 'error']);
export const EON_CITY_TRUTHFUL_COMMAND_CENTER_FAMILIES = Object.freeze([
  Object.freeze({ id: 'projects', label: 'Projects', route: '/projects', source: EON_PROJECTS_STORAGE_KEY, authority: 'local-browser', review: 'Review bounded project count and last update. Project names and content remain in Projects.' }),
  Object.freeze({ id: 'ai-runtime', label: 'AI runtime', route: '/local-ai', alternateRoute: '/vault#vault-ai-keys', source: EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY, authority: 'bounded-local-receipt', review: 'Review passed Local AI self-test or verified Direct BYOK readiness. No endpoint, key, prompt or response is displayed.' }),
  Object.freeze({ id: 'jobs', label: 'Genuine jobs', route: '/automations', source: EONBOT_JOB_FABRIC_STORAGE_KEY, authority: 'bounded-local-job-receipts', review: 'Review counts and lifecycle states only. No prompt, output, provider credential or simulated worker appears.' }),
  Object.freeze({ id: 'billing', label: 'Billing entitlement', route: '/billing', source: '/api/billing/status', authority: 'server-authoritative', review: 'Review the server entitlement summary. Browser storage cannot award or alter a paid tier.' }),
  Object.freeze({ id: 'backup', label: 'Backup / recovery', route: '/capsule', source: EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY, authority: 'bounded-local-receipt', review: 'Review the latest encrypted backup or restore receipt. No file, passphrase, key or restored value is displayed.' }),
  Object.freeze({ id: 'outcomes', label: 'Recent outcomes', route: '/projects', source: EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY, authority: 'bounded-local-receipts', review: 'Review only verified outcome kinds, count and freshness. Native surfaces retain the actual work.' })
]);

const freeze = (value) => Object.freeze(value);
const DAY = 86_400_000;
const FAMILY_BY_ID = new Map(EON_CITY_TRUTHFUL_COMMAND_CENTER_FAMILIES.map((entry) => [entry.id, entry]));

function storageFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function readJson(storage, key) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(key) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch { return null; }
}

function time(value = 0) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function freshness(timestamp, now) {
  const observed = time(timestamp);
  if (!observed) return freeze({ state: 'empty', label: 'No verified timestamp', ageMs: null });
  const ageMs = Math.max(0, now - observed);
  if (ageMs > 7 * DAY) return freeze({ state: 'stale', label: 'Older than 7 days', ageMs });
  if (ageMs > DAY) return freeze({ state: 'current', label: 'Within 7 days', ageMs });
  return freeze({ state: 'current', label: 'Within 24 hours', ageMs });
}

function card(id, { state = 'empty', summary = '', count = 0, dataTimestamp = 0, observedAt = Date.now(), evidence = '' } = {}) {
  const definition = FAMILY_BY_ID.get(id);
  const known = EON_CITY_TRUTHFUL_COMMAND_CENTER_STATES.includes(state) ? state : 'error';
  return freeze({
    ...definition,
    state: known,
    summary: String(summary || ''),
    count: Math.max(0, Number(count) || 0),
    dataTimestamp: time(dataTimestamp),
    observedAt: time(observedAt) || Date.now(),
    freshness: freshness(dataTimestamp, time(observedAt) || Date.now()),
    evidence: String(evidence || ''),
    readsPrivateWork: false,
    mutationAllowed: false,
    autoNavigation: false
  });
}

function missionStore(storage) {
  const raw = readJson(storage, EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY);
  return raw && raw.missions && typeof raw.missions === 'object' ? raw.missions : {};
}

function localCards(storage, now) {
  const projectsRaw = readJson(storage, EON_PROJECTS_STORAGE_KEY);
  const projects = Array.isArray(projectsRaw?.projects) ? projectsRaw.projects : [];
  const projectAt = Math.max(time(projectsRaw?.updatedAt), ...projects.map((entry) => time(entry?.updatedAt)), 0);
  const projectFreshness = freshness(projectAt, now);

  const jobsRaw = readJson(storage, EONBOT_JOB_FABRIC_STORAGE_KEY);
  const jobs = Array.isArray(jobsRaw?.jobs) ? jobsRaw.jobs : [];
  const jobAt = Math.max(time(jobsRaw?.updatedAt), ...jobs.map((entry) => time(entry?.updatedAt)), 0);
  const stateCounts = jobs.reduce((counts, entry) => {
    const state = String(entry?.state || '');
    if (['answer', 'draft', 'ready-for-review', 'awaiting-approval', 'completed', 'failed', 'cancelled'].includes(state)) counts[state] = (counts[state] || 0) + 1;
    return counts;
  }, {});
  const activeJobs = ['answer', 'draft', 'ready-for-review', 'awaiting-approval'].reduce((sum, key) => sum + (stateCounts[key] || 0), 0);

  const missions = missionStore(storage);
  const aiOutcome = missions['local-ai-byok']?.outcome?.verified ? missions['local-ai-byok'].outcome : null;
  const backupOutcome = missions['vault-recovery']?.outcome?.verified ? missions['vault-recovery'].outcome : null;
  const outcomes = Object.values(missions).map((entry) => entry?.outcome).filter((entry) => entry?.verified === true);
  const outcomeAt = Math.max(...outcomes.map((entry) => time(entry?.verifiedAt)), 0);

  return [
    card('projects', { state: projects.length ? projectFreshness.state : 'empty', summary: projects.length ? `${projects.length} saved local project${projects.length === 1 ? '' : 's'}.` : 'No saved local project is present in this browser.', count: projects.length, dataTimestamp: projectAt, observedAt: now, evidence: projects.length ? 'bounded-project-count' : 'empty-local-store' }),
    card('ai-runtime', { state: aiOutcome ? freshness(aiOutcome.verifiedAt, now).state : 'empty', summary: aiOutcome ? (aiOutcome.kind === 'local-ai-self-test' ? 'A passed Local AI self-test receipt is present.' : 'A verified Direct BYOK readiness receipt is present.') : 'No passed Local AI or Direct BYOK readiness receipt is present.', count: aiOutcome ? 1 : 0, dataTimestamp: aiOutcome?.verifiedAt, observedAt: now, evidence: aiOutcome?.kind || 'no-verified-ai-receipt' }),
    card('jobs', { state: jobs.length ? freshness(jobAt, now).state : 'empty', summary: jobs.length ? `${jobs.length} bounded job receipt${jobs.length === 1 ? '' : 's'}; ${activeJobs} awaiting review or approval.` : 'No genuine local job receipt is present. Agent activity remains empty.', count: jobs.length, dataTimestamp: jobAt, observedAt: now, evidence: jobs.length ? `states:${Object.entries(stateCounts).map(([key, value]) => `${key}=${value}`).join(',')}` : 'empty-job-fabric' }),
    card('billing', { state: 'loading', summary: 'Server entitlement has not been checked in this Command Room session.', observedAt: now, evidence: 'explicit-refresh-required' }),
    card('backup', { state: backupOutcome ? freshness(backupOutcome.verifiedAt, now).state : 'empty', summary: backupOutcome ? (backupOutcome.kind === 'recovery-restore-receipt' ? 'A successful explicit restore receipt is present.' : 'An encrypted backup readiness receipt is present.') : 'No verified encrypted backup or restore receipt is present.', count: backupOutcome ? 1 : 0, dataTimestamp: backupOutcome?.verifiedAt, observedAt: now, evidence: backupOutcome?.kind || 'no-verified-backup-receipt' }),
    card('outcomes', { state: outcomes.length ? freshness(outcomeAt, now).state : 'empty', summary: outcomes.length ? `${outcomes.length} verified bounded outcome${outcomes.length === 1 ? '' : 's'} across the productive mission loop.` : 'No verified productive outcome receipt is present.', count: outcomes.length, dataTimestamp: outcomeAt, observedAt: now, evidence: outcomes.length ? [...new Set(outcomes.map((entry) => entry.kind))].join(',') : 'no-verified-outcomes' })
  ];
}

function billingCardFromPayload(payload, response, now) {
  if (!response?.ok || payload?.ok !== true) return card('billing', { state: 'error', summary: 'The server did not return a valid billing status. No entitlement is inferred.', observedAt: now, evidence: `http-${response?.status || 0}` });
  const account = payload.account || {};
  const entitlement = account.entitlement || null;
  const updatedAt = time(entitlement?.updated_at) || now;
  const tier = String(entitlement?.tier_id || 'free').replace(/[^a-z0-9-]/gi, '').slice(0, 24) || 'free';
  const status = String(entitlement?.status || (account.signedIn ? 'no-paid-entitlement' : 'signed-out')).replace(/[^a-z0-9-]/gi, '').slice(0, 40);
  return card('billing', {
    state: entitlement ? freshness(updatedAt, now).state : 'empty',
    summary: entitlement ? `Server entitlement: ${tier} · ${status}.` : (account.signedIn ? 'Signed in; the server reports no paid entitlement.' : 'Signed out; no paid entitlement is shown.'),
    count: entitlement ? 1 : 0,
    dataTimestamp: updatedAt,
    observedAt: now,
    evidence: entitlement ? 'server-entitlement-ledger' : 'server-no-entitlement'
  });
}

export function getEonCityTruthfulCommandCenterSnapshot({ storage = null, now = Date.now() } = {}) {
  const target = storageFor(storage);
  return freeze({ schema: EON_CITY_TRUTHFUL_COMMAND_CENTER_SCHEMA, states: EON_CITY_TRUTHFUL_COMMAND_CENTER_STATES, cards: freeze(localCards(target, time(now) || Date.now())), readsPrivateWork: false, mutationAllowed: false, autoNavigation: false, serverBillingRequired: true });
}

export async function loadEonCityTruthfulCommandCenterSnapshot({ storage = null, fetchImpl = globalThis.fetch, now = () => Date.now(), signal = null } = {}) {
  const observedAt = time(now()) || Date.now();
  const local = getEonCityTruthfulCommandCenterSnapshot({ storage, now: observedAt });
  let billing;
  if (typeof fetchImpl !== 'function') billing = card('billing', { state: 'unavailable', summary: 'Billing status cannot be checked in this environment. No entitlement is inferred.', observedAt, evidence: 'fetch-unavailable' });
  else {
    try {
      const response = await fetchImpl('/api/billing/status', { credentials: 'same-origin', headers: { accept: 'application/json' }, cache: 'no-store', signal });
      const payload = await response.json().catch(() => ({}));
      billing = billingCardFromPayload(payload, response, observedAt);
    } catch (error) {
      const offline = String(error?.name || '').toLowerCase() === 'aborterror' ? 'unavailable' : 'offline';
      billing = card('billing', { state: offline, summary: offline === 'offline' ? 'Billing status is offline. The last local view cannot grant entitlement.' : 'Billing refresh was cancelled.', observedAt, evidence: offline });
    }
  }
  const cards = local.cards.map((entry) => entry.id === 'billing' ? billing : entry);
  return freeze({ ...local, cards: freeze(cards), refreshedAt: observedAt });
}

export function createEonCityTruthfulCommandCenterController({ storage = null, fetchImpl = globalThis.fetch, now = () => Date.now() } = {}) {
  let snapshot = getEonCityTruthfulCommandCenterSnapshot({ storage, now: now() });
  let disposed = false;
  let selectedId = '';
  let abortController = null;
  const listeners = new Set();
  const emit = () => listeners.forEach((listener) => { try { listener(api.getSnapshot()); } catch {} });
  const api = freeze({
    getSnapshot() { return freeze({ ...snapshot, selectedId, disposed }); },
    subscribe(listener) { if (typeof listener !== 'function') return () => {}; listeners.add(listener); listener(api.getSnapshot()); return () => listeners.delete(listener); },
    review(id, { explicitUserAction = false } = {}) { if (!explicitUserAction || !FAMILY_BY_ID.has(id)) return freeze({ ok: false, reason: 'explicit-valid-review-required', snapshot: api.getSnapshot() }); selectedId = id; emit(); return freeze({ ok: true, card: snapshot.cards.find((entry) => entry.id === id), snapshot: api.getSnapshot() }); },
    refreshLocal() { if (disposed) return api.getSnapshot(); const billing = snapshot.cards.find((entry) => entry.id === 'billing'); const local = getEonCityTruthfulCommandCenterSnapshot({ storage, now: now() }); snapshot = freeze({ ...local, cards: freeze(local.cards.map((entry) => entry.id === 'billing' ? billing : entry)) }); emit(); return api.getSnapshot(); },
    async refresh({ explicitUserAction = false } = {}) { if (!explicitUserAction || disposed) return freeze({ ok: false, reason: disposed ? 'controller-disposed' : 'explicit-refresh-required', snapshot: api.getSnapshot() }); abortController?.abort?.(); abortController = new AbortController(); snapshot = freeze({ ...snapshot, cards: freeze(snapshot.cards.map((entry) => entry.id === 'billing' ? card('billing', { state: 'loading', summary: 'Checking the server entitlement ledger…', observedAt: now(), evidence: 'explicit-refresh' }) : entry)) }); emit(); snapshot = await loadEonCityTruthfulCommandCenterSnapshot({ storage, fetchImpl, now, signal: abortController.signal }); emit(); return freeze({ ok: true, snapshot: api.getSnapshot() }); },
    dispose() { disposed = true; abortController?.abort?.(); listeners.clear(); selectedId = ''; return api.getSnapshot(); }
  });
  return api;
}

export function validateEonCityTruthfulCommandCenterSnapshot(snapshot = getEonCityTruthfulCommandCenterSnapshot()) {
  const errors = [];
  if (snapshot?.schema !== EON_CITY_TRUTHFUL_COMMAND_CENTER_SCHEMA) errors.push('schema-invalid');
  if ((snapshot?.cards || []).length !== 6 || new Set((snapshot?.cards || []).map((entry) => entry.id)).size !== 6) errors.push('six-status-families-required');
  if ((snapshot?.states || []).length !== 7 || new Set(snapshot.states || []).size !== 7) errors.push('seven-states-required');
  for (const entry of snapshot?.cards || []) {
    if (!FAMILY_BY_ID.has(entry.id) || !EON_CITY_TRUTHFUL_COMMAND_CENTER_STATES.includes(entry.state)) errors.push(`card-invalid:${entry.id}`);
    if (!entry.source || !entry.authority || !entry.route || !entry.review) errors.push(`traceability-missing:${entry.id}`);
    if (entry.readsPrivateWork || entry.mutationAllowed || entry.autoNavigation) errors.push(`boundary-invalid:${entry.id}`);
  }
  if (snapshot?.readsPrivateWork || snapshot?.mutationAllowed || snapshot?.autoNavigation || snapshot?.serverBillingRequired !== true) errors.push('global-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), cardCount: snapshot?.cards?.length || 0, stateCount: snapshot?.states?.length || 0 });
}
