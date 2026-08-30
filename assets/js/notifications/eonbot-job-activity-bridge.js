import { EONBOT_JOB_EVENT_SCHEMA, subscribeEonbotJobFabricReceipts } from '../chat/eonbot-job-fabric.js';
import { recordEonNotificationActivity } from './eon-notification-center.js';

/**
 * W460.1 — current local EONBOT receipt → Activity Center bridge.
 *
 * The bridge accepts only a receipt delivered by the current W435 mutation
 * event. It never enumerates persisted job history, schedules work, creates a
 * provider request, asks browser permission, or implies external completion.
 */
export const EONBOT_JOB_ACTIVITY_BRIDGE_SCHEMA = 'eonapp.eonbot-job-activity-bridge.w460.1';

const EVENT_ID_RE = /^eonjobevt_[a-z0-9_-]{8,112}$/i;
const SAFE_LABEL_RE = /^[\p{L}\p{N}][\p{L}\p{N} .,'’&()/_:-]{0,100}$/u;
const SENSITIVE_TEXT = /(sk-[a-z0-9_-]{18,}|AIza[\w-]{20,}|gsk_[a-z0-9_-]{16,}|sk-ant-[a-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:seed|recovery|mnemonic)\s+phrase\b|\b(?:password|api\s*key|access\s*token|session\s*cookie|prompt|raw output|attachment)\b)/i;
const freeze = (value) => Object.freeze(value);

const RECEIPT_ACTIVITY_MAP = Object.freeze({
  'answer-recorded:answer': Object.freeze({ category: 'eonbot-reply', title: 'EONBOT local work recorded', detail: 'A local-only work record is ready for your next deliberate step. Nothing was sent, published, or run in the background.' }),
  'draft-created:draft': Object.freeze({ category: 'eonbot-reply', title: 'EONBOT local draft started', detail: 'A local draft step is recorded. Review stays with you; no external action started.' }),
  'review-ready:ready-for-review': Object.freeze({ category: 'approval-needed', title: 'EONBOT review is ready', detail: 'A local draft is ready for your review. It has not been sent, published, or applied.' }),
  'approval-requested:awaiting-approval': Object.freeze({ category: 'approval-needed', title: 'EONBOT local review awaits you', detail: 'This local workflow still needs your review. Nothing continues after this browser closes.' }),
  'local-review-completed:completed': Object.freeze({ category: 'project-completion', title: 'Reviewed local EONBOT result recorded', detail: 'A local result receipt exists. It does not confirm publishing, deployment, payment, account changes, or remote work.' }),
  'failed:failed': Object.freeze({ category: 'eonbot-reply', title: 'Local EONBOT work needs attention', detail: 'A local work step stopped. No external action, retry, or background work was started.' }),
  'cancelled:cancelled': Object.freeze({ category: 'eonbot-reply', title: 'Local EONBOT work was cancelled', detail: 'The local work record was cancelled. Nothing was sent or changed outside this browser.' }),
  'retry-created:draft': Object.freeze({ category: 'eonbot-reply', title: 'Local EONBOT retry recorded', detail: 'A new local draft attempt is ready for your review. No background execution or external action started.' })
});

function cleanLabel(value = '') {
  const label = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 101);
  return SAFE_LABEL_RE.test(label) && !SENSITIVE_TEXT.test(label) ? label : 'Local EONBOT work';
}

function receiptKey(receipt = {}) {
  return `${String(receipt.type || '')}:${String(receipt.state || '')}`;
}

function routeForReceipt(receipt = {}) {
  const route = String(receipt.route || '');
  return /^\/(?!\/)[a-z0-9._~!$&'()*+,;=:@/%?-]*$/i.test(route) ? route : '/';
}

export function getEonbotJobActivityMapping(receipt = {}) {
  if (!receipt || receipt.schema !== EONBOT_JOB_EVENT_SCHEMA) return null;
  if (!EVENT_ID_RE.test(String(receipt.eventId || ''))) return null;
  if (receipt.localOnly !== true || receipt.externalEffect !== false || receipt.rawContentStored !== false) return null;
  const mapping = RECEIPT_ACTIVITY_MAP[receiptKey(receipt)];
  if (!mapping) return null;
  return freeze({
    eventId: `eonbot-job:${receipt.eventId}`,
    category: mapping.category,
    title: mapping.title,
    body: `${cleanLabel(receipt.safeLabel)} — ${mapping.detail}`,
    route: routeForReceipt(receipt),
    receiptId: receipt.eventId,
    sourceSchema: EONBOT_JOB_EVENT_SCHEMA,
    localOnly: true,
    externalEffect: false,
    rawContentIncluded: false
  });
}

/** Record only a receipt supplied by the current job-fabric mutation event. */
export function recordEonbotJobReceiptActivity(receipt = {}, { explicitCurrentReceipt = false, recordActivity = recordEonNotificationActivity } = {}) {
  if (explicitCurrentReceipt !== true) return freeze({ ok: false, error: 'current-local-receipt-required', browserStorageChanged: false, networkRequestCreated: false, browserPermissionRequested: false });
  const mapped = getEonbotJobActivityMapping(receipt);
  if (!mapped) return freeze({ ok: false, error: 'verified-local-job-receipt-required', browserStorageChanged: false, networkRequestCreated: false, browserPermissionRequested: false });
  let result = null;
  try {
    result = recordActivity({
      eventId: mapped.eventId,
      category: mapped.category,
      title: mapped.title,
      body: mapped.body,
      route: mapped.route
    }, { explicitSourceEvent: true });
  } catch {
    return freeze({ ok: false, error: 'activity-center-record-failed', browserStorageChanged: false, networkRequestCreated: false, browserPermissionRequested: false });
  }
  return freeze({
    ok: result?.ok === true,
    deduped: result?.deduped === true,
    activityItem: result?.item || null,
    receiptId: mapped.receiptId,
    category: mapped.category,
    localOnly: true,
    sourceReceiptVerified: true,
    historicalReplay: false,
    networkRequestCreated: false,
    browserPermissionRequested: false,
    externalActionStarted: false,
    backgroundWorkStarted: false
  });
}

export function createEonbotJobActivityBridge({ subscribeReceipts = subscribeEonbotJobFabricReceipts, recordActivity = recordEonNotificationActivity } = {}) {
  let unsubscribe = null;
  let forwardedCurrentReceiptCount = 0;
  const snapshot = () => freeze({
    schema: EONBOT_JOB_ACTIVITY_BRIDGE_SCHEMA,
    started: typeof unsubscribe === 'function',
    forwardedCurrentReceiptCount,
    localOnly: true,
    historyScanned: false,
    historicalReplay: false,
    networkRequestCreated: false,
    browserPermissionRequested: false,
    externalActionStarted: false,
    backgroundWorkStarted: false
  });
  const recordCurrentReceipt = (receipt = {}) => {
    const result = recordEonbotJobReceiptActivity(receipt, { explicitCurrentReceipt: true, recordActivity });
    if (result.ok && !result.deduped) forwardedCurrentReceiptCount += 1;
    return freeze({ ...result, snapshot: snapshot() });
  };
  const start = () => {
    if (typeof unsubscribe === 'function') return freeze({ ok: true, alreadyStarted: true, snapshot: snapshot() });
    if (typeof subscribeReceipts !== 'function') return freeze({ ok: false, error: 'local-job-receipt-subscription-unavailable', snapshot: snapshot() });
    try {
      unsubscribe = subscribeReceipts((receipt) => { recordCurrentReceipt(receipt); });
    } catch {
      unsubscribe = null;
      return freeze({ ok: false, error: 'local-job-receipt-subscription-unavailable', snapshot: snapshot() });
    }
    if (typeof unsubscribe !== 'function') unsubscribe = () => {};
    return freeze({ ok: true, alreadyStarted: false, snapshot: snapshot() });
  };
  const stop = () => {
    try { unsubscribe?.(); } catch {}
    unsubscribe = null;
    return freeze({ ok: true, snapshot: snapshot() });
  };
  return freeze({ getSnapshot: snapshot, recordCurrentReceipt, start, stop });
}

let browserBridge = null;

/** Wire the bridge once per page load. It never replays stored job history. */
export function startEonbotJobActivityBridge() {
  if (!browserBridge) browserBridge = createEonbotJobActivityBridge();
  return browserBridge.start();
}

export function getEonbotJobActivityBridgeTruth() {
  return freeze({
    schema: EONBOT_JOB_ACTIVITY_BRIDGE_SCHEMA,
    currentReceiptOnly: true,
    persistedHistoryScanned: false,
    historicalReplay: false,
    localActivityCenterOnly: true,
    browserPermissionRequested: false,
    pushSubscriptionCreated: false,
    networkRequestCreated: false,
    externalActionStarted: false,
    backgroundWorkStarted: false,
    providerRequestCreated: false,
    fabricatedCompletion: false,
    liveDeliveryProof: false
  });
}
