/** W410 — manual City validation lab contract. */
export const W410_CITY_VALIDATION_LAB_CONTRACT = Object.freeze({
  id: 'W410',
  title: 'EON City Validation Lab',
  requiredFiles: Object.freeze([
    'assets/js/city/eon-city-validation-lab.js',
    'assets/js/eon-city-play-station.js',
    'assets/css/eon-city-play.css',
    'config/w410-city-validation-lab-contract.mjs',
    'scripts/w410-city-validation-lab-gate.mjs',
    'tests/unit/w410-city-validation-lab.test.mjs',
    'docs/W410_CITY_VALIDATION_LAB_2026-06-28.md'
  ]),
  requiredCaseIds: Object.freeze([
    'first-frame-and-wayfinding', 'desktop-controls-reset', 'midrange-quality-governor', 'android-touch-safe-areas', 'ios-safari-touch', 'reduced-motion-and-sensory', 'district-review-and-return', 'collision-and-label-readability', 'legacy-route-and-cache', 'performance-record'
  ]),
  expectedTruth: Object.freeze({ localOnly: true, deviceProbeCreated: false, screenshotUploadCreated: false, videoUploadCreated: false, remoteTelemetryCreated: false, autoPassCreated: false, automaticCertification: false, launchApproval: false }),
  forbiddenPrimitives: Object.freeze(['fetch(', 'XMLHttpRequest', 'navigator.sendBeacon', 'uploadScreenshot(', 'uploadVideo(', 'autoMarkPassed', 'automaticCertification: true', 'launchApproval: true'])
});

export function validateW410CityValidationLabContract(contract = W410_CITY_VALIDATION_LAB_CONTRACT) {
  const errors = [];
  if (contract?.id !== 'W410') errors.push('W410 identifier is invalid.');
  if (!Array.isArray(contract?.requiredCaseIds) || contract.requiredCaseIds.length !== 10) errors.push('W410 requires ten manual evidence cases.');
  for (const [key, expected] of Object.entries(W410_CITY_VALIDATION_LAB_CONTRACT.expectedTruth)) {
    if (contract?.expectedTruth?.[key] !== expected) errors.push(`W410 truth ${key} is invalid.`);
  }
  return Object.freeze(errors);
}
