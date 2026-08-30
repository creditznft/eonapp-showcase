/** W345 — local-only real-device proof kit contract. */
export const W345_LOCAL_DEVICE_PROOF_KIT_CONTRACT = Object.freeze({
  schema: 'eonapp.w345-local-device-proof-kit.v1',
  requiredFiles: Object.freeze([
    'assets/js/local-first/eon-device-evidence-matrix.js',
    'assets/js/local-first/eon-device-evidence-records.js',
    'assets/js/eon-workspace-pages.js',
    'config/w345-local-device-proof-kit-contract.mjs',
    'scripts/w345-local-device-proof-kit-gate.mjs',
    'tests/unit/w345-local-device-proof-kit.test.mjs',
    'tests/e2e/w345-device-proof-kit.spec.ts'
  ]),
  requiredCaseIds: Object.freeze([
    'desktop-standard',
    'android-4gb',
    'offline',
    'private-browsing',
    'storage-denied',
    'backup-restore',
    'direct-byok-failure'
  ]),
  forbiddenPrimitives: Object.freeze([
    'fetch(',
    'XMLHttpRequest',
    'navigator.sendBeacon',
    'autoMarkPassed',
    'auto-mark-passed',
    'uploadScreenshot(',
    'betaOrLaunchApproval: true'
  ]),
  expectedTruth: Object.freeze({
    localOnly: true,
    deviceProbeCreated: false,
    remoteTelemetryCreated: false,
    screenshotUploadCreated: false,
    providerPayloadStored: false,
    autoPassCreated: false,
    automaticBetaApproval: false
  })
});
