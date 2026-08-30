/** W434 historical Activity Center contract, superseded by Institutional AI V2 device delivery. */
export const W434_NOTIFICATION_CENTER_CONTRACT = Object.freeze({
  schema: 'eonapp.w434.notification-center-contract.v2',
  wave: 'W434',
  status: 'superseded-by-institutional-ai-v2-device-delivery',
  categories: Object.freeze(['eonbot-reply', 'approval-needed', 'project-completion', 'sync-data', 'city-activity', 'collaboration']),
  retainedLocalCapabilities: Object.freeze(['redacted local activity records', 'read state', 'category visibility preferences', 'quiet-hours preference', 'same-browser dedupe']),
  currentDeviceDeliveryRequirements: Object.freeze([
    'Permission only after an explicit user action',
    'Signed-in per-device Web Push subscription',
    'Encrypted subscription custody in identity D1',
    'VAPID plus encrypted Web Push payload delivery',
    'Unsubscribe and permanent-endpoint failure cleanup',
    'No marketing consent implied by service notifications',
    'Live browser/device proof before production claim'
  ]),
  prohibited: Object.freeze(['permission prompt on load', 'silent subscription enrollment', 'marketing or reward events', 'fabricated agent status', 'silent background push', 'notification bodies stored in D1']),
  historicalTruth: Object.freeze({ inAppCenter: true, deviceDelivery: false, browserPermissionPrompt: false, pushSubscription: false, serverDelivery: false, liveDeliveryProof: false }),
  currentTruth: Object.freeze({ inAppCenter: true, explicitDeviceDeliverySourceReady: true, browserPermissionPromptOnLoad: false, optionalPushSubscription: true, serverSourceReady: true, liveDeliveryProof: false })
});

export function validateW434NotificationCenterContract(contract = W434_NOTIFICATION_CENTER_CONTRACT) {
  const errors = [];
  if (contract?.wave !== 'W434') errors.push('wave-must-be-w434');
  if (contract?.status !== 'superseded-by-institutional-ai-v2-device-delivery') errors.push('historical-w434-must-be-explicitly-superseded');
  if (!Array.isArray(contract?.categories) || contract.categories.length !== 6) errors.push('six-safe-notification-categories-required');
  if (!Array.isArray(contract?.currentDeviceDeliveryRequirements) || contract.currentDeviceDeliveryRequirements.length < 7) errors.push('device-delivery-proof-matrix-required');
  if (contract?.historicalTruth?.deviceDelivery || contract?.historicalTruth?.pushSubscription || contract?.historicalTruth?.serverDelivery) errors.push('w434-historical-truth-must-remain-false');
  if (contract?.currentTruth?.browserPermissionPromptOnLoad || contract?.currentTruth?.liveDeliveryProof) errors.push('current-delivery-must-remain-explicit-and-live-proof-pending');
  return Object.freeze(errors);
}
