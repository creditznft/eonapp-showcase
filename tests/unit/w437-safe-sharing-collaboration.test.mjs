import assert from 'node:assert/strict';
import test from 'node:test';
import { createEonCollaborationInviteRegistry, getEonCollaborationInviteTruth, prepareEonResultShareReview } from '../../assets/js/share/eon-collaboration-invites.js';
import { inspectW437SafeSharingCollaboration } from '../../scripts/w437-safe-sharing-collaboration-gate.mjs';

function memoryStorage() {
  const data = new Map();
  return {
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
    get length() { return data.size; },
    key(index) { return [...data.keys()][index] || null; }
  };
}

const NOW = Date.parse('2026-06-29T12:00:00.000Z');
const HASH = 'sha256:resource_receipt_abcdefghijklmnopqrstuvwxyz0123456789';

function registry() {
  return createEonCollaborationInviteRegistry({ storage: memoryStorage(), now: () => NOW });
}

test('W437 prepares a public-safe manual result-share review without delivery or tracking', () => {
  const review = prepareEonResultShareReview({
    explicitUserAction: true,
    origin: 'forge-project',
    title: 'Landing page concept',
    audience: 'Potential guests',
    usefulOutcome: 'A clear landing-page concept for a local business.',
    firstRemixStep: 'Replace the headline with your own audience promise.',
    remixKind: 'forge-starter'
  }, { now: NOW });
  assert.equal(review.ok, true);
  assert.equal(review.shareReview.manualCopyOnly, true);
  assert.equal(review.shareReview.publicLinkCreated, false);
  assert.equal(review.shareReview.recipientDeliveryStarted, false);
  assert.equal(review.shareReview.trackingCreated, false);
});

test('W437 requires explicit resource review and keeps invite drafts unsent', () => {
  const instance = registry();
  const input = {
    resourceReference: 'resource_project-alpha',
    resourceReceiptHash: HASH,
    resourceLabel: 'Campaign outline',
    recipientLabel: 'Creative partner',
    role: 'commenter',
    expiresAt: NOW + 24 * 60 * 60 * 1000
  };
  assert.equal(instance.prepareInvite(input).error, 'explicit-user-action-required');
  assert.equal(instance.prepareInvite(input, { explicitUserAction: true }).error, 'explicit-resource-share-approval-required');
  const prepared = instance.prepareInvite(input, { explicitUserAction: true, explicitResourceShareApproval: true });
  assert.equal(prepared.ok, true);
  assert.equal(prepared.invite.deliveryStatus, 'not-sent');
  assert.equal(prepared.invite.acceptanceStatus, 'not-requested');
  assert.equal(prepared.invite.resourceReferenceVisible, false);
  assert.equal(prepared.snapshot.preparedLocalCount, 1);
});

test('W437 requires confirmation to revoke and cannot fabricate acceptance', () => {
  const instance = registry();
  const prepared = instance.prepareInvite({
    resourceReference: 'resource_project-beta',
    resourceReceiptHash: HASH,
    resourceLabel: 'Research brief',
    recipientLabel: 'Review partner',
    role: 'viewer',
    expiresAt: NOW + 2 * 60 * 60 * 1000
  }, { explicitUserAction: true, explicitResourceShareApproval: true });
  assert.equal(instance.revokeInvite(prepared.invite.inviteId, { explicitUserAction: true }).error, 'revocation-confirmation-required');
  const revoked = instance.revokeInvite(prepared.invite.inviteId, { explicitUserAction: true, confirmed: true });
  assert.equal(revoked.ok, true);
  assert.equal(revoked.invite.state, 'revoked');
  assert.equal(instance.recordAcceptance().error, 'external-delivery-and-verified-acceptance-not-released');
});

test('W437 gate and truth remain local and fail closed', () => {
  const gate = inspectW437SafeSharingCollaboration();
  const truth = getEonCollaborationInviteTruth();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 10);
  assert.equal(truth.deliveryEnabled, false);
  assert.equal(truth.acceptanceEnabled, false);
  assert.equal(truth.tracking, false);
  assert.equal(truth.autoPosting, false);
});
