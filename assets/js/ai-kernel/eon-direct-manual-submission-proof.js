/**
 * W339 — direct/manual submission feasibility contract.
 *
 * EONAPP may prepare a file, clipboard payload, or official composer URL for
 * a user. It never opens a destination, authenticates, uploads, sends, posts,
 * schedules, or claims an external completion.
 */

export const EON_DIRECT_MANUAL_SUBMISSION_SCHEMA = 'eonapp.direct-manual-submission.v1';

const DESTINATIONS = new Set(['download', 'clipboard', 'official-compose-url']);

function clean(value = '', max = 160) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeId(value = '') {
  return String(value || '').trim().replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 128);
}

export function prepareEonManualSubmission({ artifactId = '', destination = '', userInitiated = false } = {}) {
  const destinationId = clean(destination, 64);
  const id = safeId(artifactId);
  const validDestination = DESTINATIONS.has(destinationId);
  const allowed = userInitiated === true && Boolean(id) && validDestination;
  return Object.freeze({
    schema: EON_DIRECT_MANUAL_SUBMISSION_SCHEMA,
    status: allowed ? 'prepared-for-user-submission' : 'not-prepared',
    artifactId: id,
    destination: validDestination ? destinationId : '',
    userInitiated: userInitiated === true,
    readyForUserAction: allowed,
    destinationOpened: false,
    authenticationStarted: false,
    providerCallCreated: false,
    uploadCreated: false,
    publishCreated: false,
    scheduleCreated: false,
    receiptIsExternalProof: false,
    nextStep: allowed
      ? 'The user must perform the next action in their own selected destination.'
      : 'Select a valid local export/manual destination with an explicit user action.'
  });
}

/** A local acknowledgement is never evidence that an external platform accepted anything. */
export function acknowledgeEonManualSubmission(prepared = {}, { confirmedByUser = false, now = Date.now() } = {}) {
  const candidate = prepared && typeof prepared === 'object' ? prepared : {};
  const eligible = candidate.status === 'prepared-for-user-submission' && candidate.readyForUserAction === true;
  if (!eligible || confirmedByUser !== true) {
    return Object.freeze({
      schema: EON_DIRECT_MANUAL_SUBMISSION_SCHEMA,
      status: 'not-acknowledged',
      externalCompletionVerified: false,
      providerReceiptFetched: false,
      networkRequestCreated: false
    });
  }
  return Object.freeze({
    schema: EON_DIRECT_MANUAL_SUBMISSION_SCHEMA,
    status: 'user-reported-manual-submission',
    artifactId: safeId(candidate.artifactId),
    destination: clean(candidate.destination, 64),
    acknowledgedAt: new Date(Number(now)).toISOString(),
    externalCompletionVerified: false,
    providerReceiptFetched: false,
    networkRequestCreated: false,
    note: 'User-reported only. EONAPP did not authenticate, upload, publish, schedule, or verify the destination.'
  });
}

export function getEonDirectManualSubmissionTruth() {
  return Object.freeze({
    schema: EON_DIRECT_MANUAL_SUBMISSION_SCHEMA,
    manualUserActionRequired: true,
    opensExternalDestination: false,
    oauth: false,
    providerCall: false,
    publish: false,
    schedule: false,
    externalReceiptVerification: false,
    localAcknowledgementIsNotProof: true
  });
}
