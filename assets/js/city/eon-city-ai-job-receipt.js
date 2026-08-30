/**
 * W560 — current local AI job receipt bridge for EON City.
 *
 * City may show one ephemeral, status-only receipt while the City station is
 * open. It never scans stored job history, stores a new City log, starts a
 * provider/model, exposes a job/project identifier, prompt, draft, output,
 * provider identity, credential, route, or implies background completion.
 */
import { EONBOT_JOB_EVENT_SCHEMA, subscribeEonbotJobFabricReceipts } from '../chat/eonbot-job-fabric.js';

export const EON_CITY_AI_JOB_RECEIPT_SCHEMA = 'eon.city.ai-job-receipt.w560.v1';
export const EON_CITY_AI_JOB_RECEIPT_MAX_VISIBLE = 1;

const EVENT_ID_RE = /^eonjobevt_[a-z0-9_-]{8,112}$/i;
const freeze = (value) => Object.freeze(value);

const RECEIPT_STATUS_MAP = Object.freeze({
  'answer-recorded:answer': freeze({ state: 'recorded', title: 'Local EONBOT work recorded', detail: 'A local work step was recorded for your next deliberate review. Nothing was sent, published, or run in the background.', accent: '#94a3b8' }),
  'draft-created:draft': freeze({ state: 'planning', title: 'Local draft step recorded', detail: 'A local draft step is recorded. It remains review-first; no external action started.', accent: '#5eead4' }),
  'review-ready:ready-for-review': freeze({ state: 'review-ready', title: 'Local review is ready', detail: 'A local draft is ready for your review. City carries status only and does not show the draft.', accent: '#a5b4fc' }),
  'approval-requested:awaiting-approval': freeze({ state: 'approval-needed', title: 'Your review is needed', detail: 'A local workflow awaits your explicit review. It cannot continue in the background.', accent: '#fbbf24' }),
  'local-review-completed:completed': freeze({ state: 'review-complete', title: 'Local review receipt recorded', detail: 'A local result receipt exists. It does not confirm publishing, deployment, payment, account changes, or remote work.', accent: '#5eead4' }),
  'failed:failed': freeze({ state: 'needs-attention', title: 'Local work needs attention', detail: 'A local work step stopped. No external retry or background work started.', accent: '#fb7185' }),
  'cancelled:cancelled': freeze({ state: 'paused', title: 'Local work was paused', detail: 'The local work record was paused. A new explicit review is required to continue.', accent: '#94a3b8' }),
  'retry-created:draft': freeze({ state: 'planning', title: 'Local retry step recorded', detail: 'A new local draft attempt is ready for review. No background execution or external action started.', accent: '#5eead4' })
});

function receiptKey(receipt = {}) {
  return `${String(receipt?.type || '')}:${String(receipt?.state || '')}`;
}

function safeOccurredAt(value = '') {
  const text = String(value || '').trim();
  return Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : '';
}

/** Convert one verified current W435 receipt into a City-safe status card. */
export function projectEonCityAiJobReceipt(receipt = {}) {
  if (!receipt || receipt.schema !== EONBOT_JOB_EVENT_SCHEMA) return null;
  if (!EVENT_ID_RE.test(String(receipt.eventId || ''))) return null;
  if (receipt.localOnly !== true || receipt.externalEffect !== false || receipt.rawContentStored !== false) return null;
  const mapped = RECEIPT_STATUS_MAP[receiptKey(receipt)];
  if (!mapped) return null;
  return freeze({
    schema: EON_CITY_AI_JOB_RECEIPT_SCHEMA,
    state: mapped.state,
    title: mapped.title,
    detail: mapped.detail,
    accent: mapped.accent,
    occurredAt: safeOccurredAt(receipt.at),
    currentReceiptOnly: true,
    localOnly: true,
    foregroundOnly: true,
    externalEffect: false,
    historyScanned: false,
    browserStorageWritten: false,
    routeAvailable: false,
    jobReferenceVisible: false,
    projectReferenceVisible: false,
    rawPromptVisible: false,
    rawDraftVisible: false,
    rawOutputVisible: false,
    providerVisible: false,
    credentialVisible: false,
    backgroundWorkStarted: false,
    fabricatedCompletion: false
  });
}

/**
 * Holds only current receipts received during this City session. The source
 * receipt identifier stays in a closure solely for same-event dedupe; it is
 * deliberately absent from all returned City snapshots.
 */
export function createEonCityAiJobReceiptBridge({ subscribeReceipts = subscribeEonbotJobFabricReceipts } = {}) {
  let unsubscribe = null;
  let currentReceipt = null;
  let forwardedCurrentReceiptCount = 0;
  const seenReceiptIds = new Set();
  const listeners = new Set();
  const snapshot = () => freeze({
    schema: EON_CITY_AI_JOB_RECEIPT_SCHEMA,
    started: typeof unsubscribe === 'function',
    currentReceipt,
    forwardedCurrentReceiptCount,
    visibleCount: currentReceipt ? EON_CITY_AI_JOB_RECEIPT_MAX_VISIBLE : 0,
    currentReceiptOnly: true,
    persistedHistoryScanned: false,
    historicalReplay: false,
    browserStorageWritten: false,
    networkRequestCreated: false,
    browserPermissionRequested: false,
    providerRequestCreated: false,
    externalActionStarted: false,
    backgroundWorkStarted: false
  });
  const emit = () => {
    const next = snapshot();
    for (const listener of [...listeners]) {
      try { listener(next); } catch {}
    }
  };
  const recordCurrentReceipt = (receipt = {}, { explicitCurrentReceipt = false } = {}) => {
    if (explicitCurrentReceipt !== true) return freeze({ ok: false, error: 'current-local-receipt-required', browserStorageWritten: false, networkRequestCreated: false, snapshot: snapshot() });
    const projection = projectEonCityAiJobReceipt(receipt);
    if (!projection) return freeze({ ok: false, error: 'verified-local-job-receipt-required', browserStorageWritten: false, networkRequestCreated: false, snapshot: snapshot() });
    const receiptId = String(receipt.eventId || '');
    if (seenReceiptIds.has(receiptId)) return freeze({ ok: true, deduped: true, receipt: currentReceipt, browserStorageWritten: false, networkRequestCreated: false, snapshot: snapshot() });
    seenReceiptIds.add(receiptId);
    if (seenReceiptIds.size > 32) seenReceiptIds.delete(seenReceiptIds.values().next().value);
    currentReceipt = projection;
    forwardedCurrentReceiptCount += 1;
    emit();
    return freeze({ ok: true, deduped: false, receipt: projection, browserStorageWritten: false, networkRequestCreated: false, snapshot: snapshot() });
  };
  const start = () => {
    if (typeof unsubscribe === 'function') return freeze({ ok: true, alreadyStarted: true, snapshot: snapshot() });
    if (typeof subscribeReceipts !== 'function') return freeze({ ok: false, error: 'local-job-receipt-subscription-unavailable', snapshot: snapshot() });
    try {
      unsubscribe = subscribeReceipts((receipt) => { recordCurrentReceipt(receipt, { explicitCurrentReceipt: true }); });
    } catch {
      unsubscribe = null;
      return freeze({ ok: false, error: 'local-job-receipt-subscription-unavailable', snapshot: snapshot() });
    }
    if (typeof unsubscribe !== 'function') unsubscribe = () => {};
    emit();
    return freeze({ ok: true, alreadyStarted: false, snapshot: snapshot() });
  };
  const stop = () => {
    try { unsubscribe?.(); } catch {}
    unsubscribe = null;
    currentReceipt = null;
    seenReceiptIds.clear();
    emit();
    return freeze({ ok: true, snapshot: snapshot() });
  };
  const subscribe = (listener, { emitCurrent = true } = {}) => {
    if (typeof listener !== 'function') return () => {};
    listeners.add(listener);
    if (emitCurrent) {
      try { listener(snapshot()); } catch {}
    }
    return () => listeners.delete(listener);
  };
  return freeze({ getSnapshot: snapshot, recordCurrentReceipt, start, stop, subscribe });
}

export function getEonCityAiJobReceiptTruth() {
  return freeze({
    schema: EON_CITY_AI_JOB_RECEIPT_SCHEMA,
    currentReceiptOnly: true,
    persistedHistoryScanned: false,
    historicalReplay: false,
    browserStorageWritten: false,
    networkRequestCreated: false,
    browserPermissionRequested: false,
    providerRequestCreated: false,
    externalActionStarted: false,
    backgroundWorkStarted: false,
    jobReferenceVisible: false,
    projectReferenceVisible: false,
    promptVisible: false,
    draftVisible: false,
    outputVisible: false,
    providerIdentityVisible: false,
    credentialVisible: false,
    fabricatedCompletion: false,
    liveProviderProof: false
  });
}
