/** W436 contract: Collection eligibility is visual, deterministic and non-financial. */
export const W436_COLLECTION_ELIGIBILITY_CONTRACT = Object.freeze({
  wave: 'W436',
  schema: 'eonapp.collection.eligibility.w436.v1',
  requiredBoundaries: Object.freeze([
    'vault-collection-separation',
    'explicit-local-evidence-review',
    'deterministic-mission-artifact-mapping',
    'no-grant-or-entitlement',
    'no-financial-or-trading-claim',
    'update-safe-local-record'
  ]),
  collectionRolloutEnabled: false,
  grantCreated: false,
  tokenOrNft: false,
  marketplace: false,
  sourceOnly: true
});

export function validateW436CollectionEligibilityContract() {
  const issues = [];
  if (W436_COLLECTION_ELIGIBILITY_CONTRACT.wave !== 'W436') issues.push('wave-mismatch');
  if (W436_COLLECTION_ELIGIBILITY_CONTRACT.collectionRolloutEnabled !== false) issues.push('rollout-must-remain-disabled');
  if (W436_COLLECTION_ELIGIBILITY_CONTRACT.grantCreated !== false) issues.push('grant-must-remain-disabled');
  if (W436_COLLECTION_ELIGIBILITY_CONTRACT.tokenOrNft !== false || W436_COLLECTION_ELIGIBILITY_CONTRACT.marketplace !== false) issues.push('financial-boundary-violated');
  return Object.freeze(issues);
}
