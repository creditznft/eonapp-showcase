/** W435 contract: local-only EONBOT job fabric. */
export const W435_EONBOT_JOB_FABRIC_CONTRACT = Object.freeze({
  wave: 'W435',
  schema: 'eonapp.eonbot-job-fabric.w435.v1',
  requiredStates: Object.freeze(['answer', 'draft', 'ready-for-review', 'awaiting-approval', 'completed', 'failed', 'cancelled']),
  requiredSurfaces: Object.freeze(['chat', 'forge', 'studio', 'insight', 'flow', 'city', 'unavailable']),
  requiredBoundaries: Object.freeze([
    'explicit-user-action',
    'explicit-user-approval',
    'local-receipt-event-stream',
    'no-provider-request',
    'no-external-execution',
    'no-raw-prompt-or-output'
  ]),
  completionRequiresReceiptHash: true,
  sourceOnly: true,
  liveAgentExecution: false,
  cityNpcLiveClaim: false
});

export function validateW435EonbotJobFabricContract() {
  const issues = [];
  if (W435_EONBOT_JOB_FABRIC_CONTRACT.wave !== 'W435') issues.push('wave-mismatch');
  if (W435_EONBOT_JOB_FABRIC_CONTRACT.requiredStates.length !== 7) issues.push('state-contract-incomplete');
  if (!W435_EONBOT_JOB_FABRIC_CONTRACT.requiredStates.includes('awaiting-approval')) issues.push('approval-state-missing');
  if (!W435_EONBOT_JOB_FABRIC_CONTRACT.requiredSurfaces.includes('city')) issues.push('city-surface-missing');
  if (W435_EONBOT_JOB_FABRIC_CONTRACT.liveAgentExecution !== false || W435_EONBOT_JOB_FABRIC_CONTRACT.cityNpcLiveClaim !== false) issues.push('truth-boundary-violated');
  return Object.freeze(issues);
}
