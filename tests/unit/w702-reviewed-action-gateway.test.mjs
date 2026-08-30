import test from 'node:test';
import assert from 'node:assert/strict';
import {
  confirmEonAppW702ForegroundAction,
  getEonAppW702ForegroundActionTruth,
  prepareEonAppW702ForegroundAction,
  rejectEonAppW702ForegroundAction
} from '../../assets/js/action-gateway/eon-reviewed-foreground-action-gateway-w702.js';

test('W702 foreground gateway requires two explicit user decisions', () => {
  const missingIntent = prepareEonAppW702ForegroundAction({ kind: 'enter-city' }, { now: 1, stateRevision: 2 });
  assert.equal(missingIntent.ok, false);
  assert.equal(missingIntent.reason, 'explicit-user-action-required');

  const prepared = prepareEonAppW702ForegroundAction({ kind: 'enter-city', label: 'Enter City', explicitUserAction: true }, { now: 2, stateRevision: 2 });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.proposal.route, '/eoncity');
  assert.equal(prepared.proposal.requiresFinalConfirmation, true);

  const missingConfirmation = confirmEonAppW702ForegroundAction(prepared.proposal, { approved: true }, { currentStateRevision: 2 });
  assert.equal(missingConfirmation.ok, false);
  assert.equal(missingConfirmation.reason, 'explicit-final-approval-required');

  const confirmed = confirmEonAppW702ForegroundAction(prepared.proposal, { approved: true, explicitUserAction: true }, { currentStateRevision: 2 });
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.canonicalStateEvent.type, 'set-route');
  assert.equal(confirmed.navigationPerformed, false);
  assert.equal(confirmed.executeExternally, false);
});

test('W702 blocks external, payment and unsafe route intents', () => {
  for (const kind of ['payment', 'provider-execution', 'publish', 'camera', 'network']) {
    const result = prepareEonAppW702ForegroundAction({ kind, explicitUserAction: true });
    assert.equal(result.ok, false, kind);
    assert.equal(result.reason, 'action-not-allowed', kind);
  }
  const externalRoute = prepareEonAppW702ForegroundAction({ kind: 'navigate', route: 'https://example.com', explicitUserAction: true });
  assert.equal(externalRoute.ok, false);
  assert.equal(externalRoute.reason, 'safe-internal-route-required');
});

test('W702 rejects stale review proposals', () => {
  const prepared = prepareEonAppW702ForegroundAction({ kind: 'open-atlas', explicitUserAction: true }, { now: 10, stateRevision: 4 });
  const result = confirmEonAppW702ForegroundAction(prepared.proposal, { approved: true, explicitUserAction: true }, { currentStateRevision: 5 });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'stale-state-revision');
});

test('W702 rejection is bounded and side-effect free', () => {
  const prepared = prepareEonAppW702ForegroundAction({ kind: 'return-to-project', explicitUserAction: true }, { now: 20 });
  const result = rejectEonAppW702ForegroundAction(prepared.proposal, { explicitUserAction: true });
  assert.deepEqual(result, { ok: true, proposalId: prepared.proposal.proposalId, rejected: true, sideEffect: false });
  const truth = getEonAppW702ForegroundActionTruth();
  assert.equal(truth.twoStepReview, true);
  assert.equal(truth.performsNavigation, false);
  assert.equal(truth.startsProvider, false);
  assert.equal(truth.startsPayment, false);
});


test('W702 work-object selection requires a concrete bounded identifier', () => {
  const missing = prepareEonAppW702ForegroundAction({ kind: 'select-work-object', explicitUserAction: true });
  assert.equal(missing.ok, false);
  assert.equal(missing.reason, 'work-object-id-required');
  const prepared = prepareEonAppW702ForegroundAction({
    kind: 'select-work-object',
    workObject: { id: 'task:1', kind: 'task', label: 'Review release' },
    explicitUserAction: true
  }, { stateRevision: 2 });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.proposal.workObject.id, 'task:1');
});
