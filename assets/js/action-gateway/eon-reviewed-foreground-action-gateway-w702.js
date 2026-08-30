/**
 * W702 reviewed foreground action gateway.
 *
 * Converts an explicit user intent into a bounded proposal and, after a second
 * explicit confirmation, into a route or canonical-state event. This module
 * never calls fetch, location, storage, a provider, camera, microphone,
 * payment, publishing or external execution.
 */
export const EONAPP_W702_REVIEWED_FOREGROUND_ACTION_SCHEMA = 'eonapp.reviewed-foreground-action.w702.v1';

const freeze = Object.freeze;
const CONTROL_CHARACTERS = /\p{Cc}/gu;
const BLOCKED_KIND = /(payment|purchase|subscription|provider-execution|external-action|publish|delete-account|credential|secret|microphone|camera|network)/i;
const ALLOWED = freeze({
  navigate: freeze({ routeRequired: true, eventType: 'set-route' }),
  'select-work-object': freeze({ routeRequired: false, eventType: 'select-work-object' }),
  'open-atlas': freeze({ routeRequired: false, eventType: 'set-route', fixedRoute: '/projects?view=atlas' }),
  'enter-city': freeze({ routeRequired: false, eventType: 'set-route', fixedRoute: '/eoncity' }),
  'review-approval': freeze({ routeRequired: false, eventType: 'set-route', fixedRoute: '/workspace' }),
  'return-to-project': freeze({ routeRequired: false, eventType: 'set-route', fixedRoute: '/projects' })
});

function cleanText(value = '', max = 180) {
  return String(value ?? '').replace(CONTROL_CHARACTERS, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}
function cleanId(value = '') { return cleanText(value, 140).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 140); }
function route(value = '') {
  const candidate = cleanText(value, 240);
  return candidate.startsWith('/') && !candidate.startsWith('//') ? candidate : '';
}
function proposalId(kind, now, revision) { return `w702:${cleanId(kind)}:${Math.trunc(now)}:${Math.max(0, Math.trunc(Number(revision) || 0))}`; }

export function prepareEonAppW702ForegroundAction(intent = {}, { now = Date.now(), stateRevision = 0 } = {}) {
  const kind = cleanId(intent.kind);
  if (intent.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', kind });
  if (!kind || BLOCKED_KIND.test(kind) || !ALLOWED[kind]) return freeze({ ok: false, reason: 'action-not-allowed', kind });
  const authority = ALLOWED[kind];
  const workObjectId = cleanId(intent.workObject?.id || intent.workObjectId);
  if (kind === 'select-work-object' && !workObjectId) return freeze({ ok: false, reason: 'work-object-id-required', kind });
  const resolvedRoute = authority.fixedRoute || route(intent.route);
  if (authority.routeRequired && !resolvedRoute) return freeze({ ok: false, reason: 'safe-internal-route-required', kind });
  const revision = Math.max(0, Math.trunc(Number(stateRevision) || 0));
  return freeze({
    ok: true,
    proposal: freeze({
      schema: EONAPP_W702_REVIEWED_FOREGROUND_ACTION_SCHEMA,
      proposalId: proposalId(kind, now, revision),
      kind,
      label: cleanText(intent.label || kind, 120),
      route: resolvedRoute,
      stateRevision: revision,
      preparedAtMs: Math.max(0, Math.trunc(Number(now) || 0)),
      workObject: freeze({
        id: workObjectId,
        kind: cleanId(intent.workObject?.kind || 'work-object'),
        label: cleanText(intent.workObject?.label || intent.workObjectLabel, 120),
        selected: true
      }),
      requiresFinalConfirmation: true,
      automaticNavigation: false,
      automaticExecution: false,
      automaticApproval: false,
      externalSideEffect: false
    })
  });
}

export function confirmEonAppW702ForegroundAction(proposal = {}, confirmation = {}, { currentStateRevision = 0 } = {}) {
  if (confirmation.explicitUserAction !== true || confirmation.approved !== true) {
    return freeze({ ok: false, reason: 'explicit-final-approval-required' });
  }
  if (proposal.schema !== EONAPP_W702_REVIEWED_FOREGROUND_ACTION_SCHEMA || !ALLOWED[proposal.kind]) {
    return freeze({ ok: false, reason: 'invalid-proposal' });
  }
  if (proposal.requiresFinalConfirmation !== true || proposal.externalSideEffect !== false) {
    return freeze({ ok: false, reason: 'unsafe-proposal' });
  }
  const revision = Math.max(0, Math.trunc(Number(currentStateRevision) || 0));
  if (revision !== Math.max(0, Math.trunc(Number(proposal.stateRevision) || 0))) {
    return freeze({ ok: false, reason: 'stale-state-revision' });
  }
  const authority = ALLOWED[proposal.kind];
  const payload = authority.eventType === 'select-work-object'
    ? proposal.workObject
    : freeze({ route: proposal.route || authority.fixedRoute || '/' });
  return freeze({
    ok: true,
    proposalId: proposal.proposalId,
    route: proposal.route || authority.fixedRoute || '',
    canonicalStateEvent: freeze({
      type: authority.eventType,
      payload,
      explicitUserAction: true
    }),
    executeExternally: false,
    providerStarted: false,
    paymentStarted: false,
    navigationPerformed: false,
    approvalPerformed: false
  });
}

export function rejectEonAppW702ForegroundAction(proposal = {}, { explicitUserAction = false } = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  return freeze({ ok: true, proposalId: cleanText(proposal.proposalId, 220), rejected: true, sideEffect: false });
}

export function getEonAppW702ForegroundActionTruth() {
  return freeze({
    schema: `${EONAPP_W702_REVIEWED_FOREGROUND_ACTION_SCHEMA}.truth.v1`,
    allowedKinds: freeze(Object.keys(ALLOWED)),
    twoStepReview: true,
    internalRoutesOnly: true,
    performsNavigation: false,
    performsExternalExecution: false,
    startsProvider: false,
    startsPayment: false,
    requestsMicrophone: false,
    requestsCamera: false,
    readsOrWritesStorage: false
  });
}
