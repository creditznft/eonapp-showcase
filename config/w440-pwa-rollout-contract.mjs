/** W440 contract: browser profile update reviews are redacted and cannot apply an update. */
export const W440_PWA_ROLLOUT_CONTRACT = Object.freeze({
  wave: 'W440', schema: 'eon.pwa.rollout-guard.w440.v1', localUpdateReview: true,
  redactedProtectedInventory: true, explicitUserActionRequired: true,
  automaticUpdateApplication: false, rollbackApplied: false, deviceProof: false, productionProof: false
});
export function validateW440PwaRolloutContract() {
  const issues = []; const contract = W440_PWA_ROLLOUT_CONTRACT;
  if (contract.wave !== 'W440') issues.push('wave-mismatch');
  for (const id of ['localUpdateReview', 'redactedProtectedInventory', 'explicitUserActionRequired']) if (contract[id] !== true) issues.push(`${id}-required`);
  for (const id of ['automaticUpdateApplication', 'rollbackApplied', 'deviceProof', 'productionProof']) if (contract[id] !== false) issues.push(`${id}-must-remain-false`);
  return Object.freeze(issues);
}
