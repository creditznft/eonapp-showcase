/** W529 — Android emulator evidence preparation. No shipping wrapper and no real-device claim. */
export const W529_ANDROID_EMULATOR_SCHEMA = 'eonapp.w529.android-emulator-evidence.v1';
export const W529_ANDROID_EMULATOR_CONTRACT = Object.freeze({
  wave: 'W529',
  schema: W529_ANDROID_EMULATOR_SCHEMA,
  defaultStatus: 'android-emulator-pending',
  adbProbeDefault: false,
  manualScenarios: Object.freeze([
    'cold-and-warm-launch',
    'portrait-and-landscape',
    'city-entry-and-return',
    'chat-keyboard-and-scroll',
    'offline-and-reconnect',
    'fixture-capsule-export-import'
  ]),
  prohibitedOperations: Object.freeze(['adb-install', 'adb-uninstall', 'adb-push', 'adb-shell-input', 'shipping-android-wrapper']),
  prohibitedClaims: Object.freeze(['physical-android-proven', 'pwa-install-proven', 'device-data-uploaded'])
});

export function validateW529AndroidEmulatorContract(contract = W529_ANDROID_EMULATOR_CONTRACT) {
  const issues = [];
  if (contract?.schema !== W529_ANDROID_EMULATOR_SCHEMA) issues.push('schema-invalid');
  if (contract?.defaultStatus !== 'android-emulator-pending') issues.push('default-status-invalid');
  if (contract?.adbProbeDefault !== false) issues.push('adb-probe-must-default-off');
  if (!Array.isArray(contract?.manualScenarios) || contract.manualScenarios.length < 6) issues.push('scenario-list-incomplete');
  if (!Array.isArray(contract?.prohibitedOperations) || !contract.prohibitedOperations.includes('adb-install')) issues.push('prohibited-operation-list-incomplete');
  return Object.freeze(issues);
}
