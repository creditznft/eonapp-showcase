import {
  EON_CORE_OUTCOME_EVENT,
  EON_CORE_OUTCOME_SCHEMA,
  listEonCoreOutcomes
} from '../contracts/outcomes/eon-core-outcome-authority.js';
import { recordEonNotificationActivity } from './eon-notification-center.js';

/**
 * Institutional AI V2 — verified Creator outcome → local Activity Center bridge.
 *
 * Only the outcome emitted by the current Core mutation may be forwarded, and
 * it must also exist in the local Core outcome store. The bridge never scans
 * historical outcomes, reads media/prompt bodies, requests notification
 * permission, schedules a return reminder, or starts a network request.
 */
export const EON_CREATOR_OUTCOME_ACTIVITY_BRIDGE_SCHEMA = 'eonapp.creator-outcome-activity-bridge.ai-v2.v1';

const freeze = (value) => Object.freeze(value);
const SAFE_DIGEST_RE = /^[a-z0-9:_-]{6,96}$/i;
const SAFE_OUTCOME_ID_RE = /^[a-z0-9:_-]{6,220}$/i;

const OUTCOME_ACTIVITY = freeze({
  'creator-guide-artifact': freeze({ title: 'Creator guide ready for your next step', body: 'A verified local Creator guide was recorded. Reopen Create when you want to review, share or build on it.', route: '/create' }),
  'creator-image-verified': freeze({ title: 'Image result ready for your next step', body: 'A verified image result was recorded. Reopen Local AI when you want to review, share or remix it.', route: '/local-ai' }),
  'creator-video-verified': freeze({ title: 'Video result ready for your next step', body: 'A verified video result was recorded. Reopen Local AI when you want to review, share or remix it.', route: '/local-ai' }),
  'creator-music-exported': freeze({ title: 'Music export ready for your next step', body: 'A verified local WAV export was recorded. Reopen EON Music when you want to listen, share, remix or add it to EON Radio.', route: '/create' }),
  'creator-radio-station': freeze({ title: 'EON Radio station ready', body: 'A private station profile was recorded. Reopen EON Music when you want to add authorized tracks, listen or share the station idea.', route: '/create' }),
  'forge-source-applied': freeze({ title: 'Forge result ready for your next step', body: 'A verified local Forge apply was recorded. Reopen Forge when you want to review or continue the project.', route: '/forge' })
});

function sameStoredOutcome(candidate = {}, stored = {}) {
  return candidate?.schema === EON_CORE_OUTCOME_SCHEMA
    && candidate?.verified === true
    && SAFE_OUTCOME_ID_RE.test(String(candidate?.outcomeId || ''))
    && SAFE_DIGEST_RE.test(String(candidate?.metadataDigest || ''))
    && candidate.outcomeId === stored?.outcomeId
    && candidate.kind === stored?.kind
    && candidate.metadataDigest === stored?.metadataDigest
    && stored?.verified === true;
}

export function mapEonCreatorOutcomeActivity(outcome = {}, { storedOutcomes = [] } = {}) {
  const mapping = OUTCOME_ACTIVITY[String(outcome?.kind || '')];
  if (!mapping) return null;
  const stored = Array.isArray(storedOutcomes) ? storedOutcomes.find((entry) => entry?.outcomeId === outcome?.outcomeId) : null;
  if (!stored || !sameStoredOutcome(outcome, stored)) return null;
  return freeze({
    eventId: `creator:${String(outcome.kind)}:${String(outcome.metadataDigest)}`.slice(0, 180),
    category: 'project-completion',
    title: mapping.title,
    body: mapping.body,
    route: mapping.route,
    outcomeId: String(outcome.outcomeId),
    kind: String(outcome.kind),
    localOnly: true,
    publicSafeFixedCopyOnly: true,
    privateContentIncluded: false
  });
}

export function recordEonCreatorOutcomeActivity(outcome = {}, {
  explicitCurrentOutcome = false,
  storage = globalThis.localStorage,
  listOutcomes = listEonCoreOutcomes,
  recordActivity = recordEonNotificationActivity
} = {}) {
  if (explicitCurrentOutcome !== true) return freeze({ ok: false, error: 'current-core-outcome-required', networkRequestCreated: false, browserPermissionRequested: false });
  let storedOutcomes = [];
  try { storedOutcomes = listOutcomes({ storage }); } catch { storedOutcomes = []; }
  const mapped = mapEonCreatorOutcomeActivity(outcome, { storedOutcomes });
  if (!mapped) return freeze({ ok: false, error: 'verified-stored-creator-outcome-required', networkRequestCreated: false, browserPermissionRequested: false });
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
    return freeze({ ok: false, error: 'activity-center-record-failed', networkRequestCreated: false, browserPermissionRequested: false });
  }
  return freeze({
    ok: result?.ok === true,
    deduped: result?.deduped === true,
    activityItem: result?.item || null,
    outcomeId: mapped.outcomeId,
    kind: mapped.kind,
    currentOutcomeOnly: true,
    historyScanned: false,
    localOnly: true,
    networkRequestCreated: false,
    browserPermissionRequested: false,
    returnReminderScheduled: false,
    deviceNotificationSent: false,
    externalActionStarted: false
  });
}

export function createEonCreatorOutcomeActivityBridge({
  environment = globalThis,
  storage = globalThis.localStorage,
  listOutcomes = listEonCoreOutcomes,
  recordActivity = recordEonNotificationActivity
} = {}) {
  let started = false;
  let forwardedCurrentOutcomeCount = 0;
  const onOutcome = (event) => {
    const result = recordEonCreatorOutcomeActivity(event?.detail?.outcome || {}, {
      explicitCurrentOutcome: true,
      storage,
      listOutcomes,
      recordActivity
    });
    if (result.ok && !result.deduped) forwardedCurrentOutcomeCount += 1;
  };
  const snapshot = () => freeze({
    schema: EON_CREATOR_OUTCOME_ACTIVITY_BRIDGE_SCHEMA,
    started,
    forwardedCurrentOutcomeCount,
    currentOutcomeOnly: true,
    historyScanned: false,
    localActivityCenterOnly: true,
    browserPermissionRequested: false,
    returnReminderScheduled: false,
    networkRequestCreated: false,
    liveDeliveryProof: false
  });
  const start = () => {
    if (started) return freeze({ ok: true, alreadyStarted: true, snapshot: snapshot() });
    if (typeof environment?.addEventListener !== 'function') return freeze({ ok: false, error: 'event-listener-unavailable', snapshot: snapshot() });
    environment.addEventListener(EON_CORE_OUTCOME_EVENT, onOutcome);
    started = true;
    return freeze({ ok: true, alreadyStarted: false, snapshot: snapshot() });
  };
  const stop = () => {
    try { environment?.removeEventListener?.(EON_CORE_OUTCOME_EVENT, onOutcome); } catch {}
    started = false;
    return freeze({ ok: true, snapshot: snapshot() });
  };
  return freeze({ getSnapshot: snapshot, start, stop });
}

let browserBridge = null;
export function startEonCreatorOutcomeActivityBridge() {
  if (!browserBridge) browserBridge = createEonCreatorOutcomeActivityBridge();
  return browserBridge.start();
}

export function getEonCreatorOutcomeActivityBridgeTruth() {
  return freeze({
    schema: EON_CREATOR_OUTCOME_ACTIVITY_BRIDGE_SCHEMA,
    supportedKinds: freeze(Object.keys(OUTCOME_ACTIVITY)),
    persistedOutcomeVerificationRequired: true,
    currentOutcomeOnly: true,
    persistedHistoryScanned: false,
    fixedPublicSafeCopyOnly: true,
    promptRead: false,
    mediaRead: false,
    credentialRead: false,
    localActivityCenterOnly: true,
    browserPermissionRequested: false,
    pushSubscriptionCreated: false,
    returnReminderScheduled: false,
    networkRequestCreated: false,
    externalActionStarted: false,
    liveDeliveryProof: false
  });
}

export default freeze({
  EON_CREATOR_OUTCOME_ACTIVITY_BRIDGE_SCHEMA,
  mapEonCreatorOutcomeActivity,
  recordEonCreatorOutcomeActivity,
  createEonCreatorOutcomeActivityBridge,
  startEonCreatorOutcomeActivityBridge,
  getEonCreatorOutcomeActivityBridgeTruth
});
