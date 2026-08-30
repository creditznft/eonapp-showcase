/** W371 — EON City Performance Laboratory contract. */
export const W371_PERFORMANCE_LAB_CONTRACT = Object.freeze({
  wave: 'W371',
  schema: 'eonapp.w371.performance-lab-contract.v1',
  requiredCases: Object.freeze(['desktop-integrated', 'desktop-discrete', 'android-4gb', 'iphone-safari', 'warm-reopen-cache', 'weak-webgl-fallback']),
  truthRules: Object.freeze({
    localOnly: true,
    deviceProbeCreated: false,
    remoteTelemetryCreated: false,
    screenshotUploadCreated: false,
    autoPassCreated: false,
    certificationCreated: false,
    explicitUserSaveRequired: true
  }),
  evidence: Object.freeze({
    sourceGateIsNotDeviceProof: true,
    requiresLaterManualDeviceMatrix: true,
    requiresLaterBrowserAndGpuEvidence: true,
    requiresLaterProductionRouteEvidence: true
  })
});

export function validateW371PerformanceLabContract() {
  const errors = [];
  const rules = W371_PERFORMANCE_LAB_CONTRACT.truthRules;
  if (!rules.localOnly || rules.deviceProbeCreated || rules.remoteTelemetryCreated || rules.screenshotUploadCreated || rules.autoPassCreated || rules.certificationCreated || !rules.explicitUserSaveRequired) errors.push('W371 must remain a manual, local, fail-closed evidence checklist.');
  if (W371_PERFORMANCE_LAB_CONTRACT.requiredCases.length !== 6) errors.push('W371 requires six distinct City device/reopen cases.');
  return errors;
}
