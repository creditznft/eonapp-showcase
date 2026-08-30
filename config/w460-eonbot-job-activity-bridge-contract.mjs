/** W460.1 contract: only current local job receipts may create in-app Activity Center items. */
export const W460_EONBOT_JOB_ACTIVITY_BRIDGE_CONTRACT = Object.freeze({
  wave: 'W460.1',
  schema: 'eonapp.eonbot-job-activity-bridge.w460.1',
  sourceReceiptSchema: 'eonapp.eonbot-job-event.w435.v1',
  activityCenterSchema: 'eonapp.notification-center.w434.v1',
  currentReceiptOnly: true,
  persistedHistoryScanned: false,
  historicalReplay: false,
  explicitSourceEventRequired: true,
  localActivityCenterOnly: true,
  networkRequestCreated: false,
  browserPermissionRequested: false,
  pushSubscriptionCreated: false,
  externalActionStarted: false,
  backgroundWorkStarted: false,
  fabricatedCompletion: false,
  liveDeliveryProof: false,
  requiredFiles: Object.freeze([
    'assets/js/chat/eonbot-job-fabric.js',
    'assets/js/notifications/eonbot-job-activity-bridge.js',
    'assets/js/notifications/eon-notification-center.js',
    'assets/js/eon-app-shell.js',
    'config/w460-eonbot-job-activity-bridge-contract.mjs',
    'tests/unit/w460-eonbot-job-activity-bridge.test.mjs'
  ])
});

export function validateW460EonbotJobActivityBridgeContract(contract = W460_EONBOT_JOB_ACTIVITY_BRIDGE_CONTRACT) {
  const errors = [];
  if (contract.wave !== 'W460.1') errors.push('wave-mismatch');
  if (contract.schema !== 'eonapp.eonbot-job-activity-bridge.w460.1') errors.push('schema-mismatch');
  if (contract.sourceReceiptSchema !== 'eonapp.eonbot-job-event.w435.v1') errors.push('source-receipt-schema-mismatch');
  if (contract.activityCenterSchema !== 'eonapp.notification-center.w434.v1') errors.push('activity-center-schema-mismatch');
  const expected = {
    currentReceiptOnly: true,
    persistedHistoryScanned: false,
    historicalReplay: false,
    explicitSourceEventRequired: true,
    localActivityCenterOnly: true,
    networkRequestCreated: false,
    browserPermissionRequested: false,
    pushSubscriptionCreated: false,
    externalActionStarted: false,
    backgroundWorkStarted: false,
    fabricatedCompletion: false,
    liveDeliveryProof: false
  };
  for (const [key, value] of Object.entries(expected)) if (contract[key] !== value) errors.push(`boundary-${key}-mismatch`);
  if (!Array.isArray(contract.requiredFiles) || contract.requiredFiles.length < 6) errors.push('required-files-missing');
  return Object.freeze(errors);
}
