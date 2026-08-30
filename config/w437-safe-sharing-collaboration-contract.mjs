/** W437 contract: result sharing stays manual; collaboration invites stay local drafts. */
export const W437_SAFE_SHARING_COLLABORATION_CONTRACT = Object.freeze({
  wave: 'W437',
  inviteSchema: 'eonapp.collaboration-invite.w437.v1',
  shareReviewSchema: 'eonapp.result-share-review.w437.v1',
  requiredBoundaries: Object.freeze([
    'explicit-result-share-action',
    'manual-copy-only',
    'named-resource-role-expiry',
    'local-invite-draft-only',
    'no-delivery-or-acceptance-claim',
    'confirmed-revocation',
    'no-tracking-or-auto-posting'
  ]),
  externalDeliveryEnabled: false,
  acceptanceEnabled: false,
  trackingEnabled: false,
  productionCollaborationProof: false
});

export function validateW437SafeSharingCollaborationContract() {
  const issues = [];
  if (W437_SAFE_SHARING_COLLABORATION_CONTRACT.wave !== 'W437') issues.push('wave-mismatch');
  if (W437_SAFE_SHARING_COLLABORATION_CONTRACT.externalDeliveryEnabled !== false) issues.push('delivery-must-remain-disabled');
  if (W437_SAFE_SHARING_COLLABORATION_CONTRACT.acceptanceEnabled !== false) issues.push('acceptance-must-remain-disabled');
  if (W437_SAFE_SHARING_COLLABORATION_CONTRACT.trackingEnabled !== false) issues.push('tracking-must-remain-disabled');
  return Object.freeze(issues);
}
