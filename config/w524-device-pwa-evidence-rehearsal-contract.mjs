/** W524 — source tooling for operator-run device/PWA evidence rehearsal. */
export const W524_DEVICE_PWA_EVIDENCE_REHEARSAL_SCHEMA = 'eonapp.w524.device-pwa-evidence-rehearsal.v1';

export const W524_REQUIRED_CASE_IDS = Object.freeze([
  'desktop-standard',
  'desktop-city-duration',
  'android-4gb',
  'android-city-pwa',
  'ios-safari-pwa',
  'tablet-responsive',
  'offline',
  'pwa-install-update-offline',
  'private-browsing',
  'storage-denied',
  'backup-restore',
  'capsule-recovery-rehearsal',
  'direct-byok-failure',
  'console-network-metrics',
  'screenshot-provenance'
]);

export const W524_REQUIRED_OPERATOR_ARTIFACT_KINDS = Object.freeze([
  'named-device-class',
  'browser-or-os-family',
  'route-and-action-notes',
  'console-network-summary',
  'operator-held-screenshot-provenance',
  'deployment-or-preview-revision'
]);

export const W524_REQUIRED_SOURCE_FILES = Object.freeze([
  'assets/js/local-first/eon-device-evidence-matrix.js',
  'assets/js/local-first/eon-device-evidence-records.js',
  'assets/js/local-first/eon-device-pwa-evidence-rehearsal.js',
  'assets/js/eon-workspace-pages.js',
  'config/w459-pwa-recovery-rehearsal-contract.mjs',
  'config/w524-device-pwa-evidence-rehearsal-contract.mjs',
  'scripts/w524-device-pwa-evidence-rehearsal-gate.mjs',
  'tests/unit/w524-device-pwa-evidence-rehearsal.test.mjs'
]);

export const W524_TRUTH = Object.freeze({
  sourceOnly: true,
  localChecklistOnly: true,
  remoteTelemetryCreated: false,
  screenshotUploadCreated: false,
  deviceIdentifiersStored: false,
  consoleLogsStored: false,
  independentEvidenceAccepted: false,
  productionApproved: false,
  launchApproval: false
});

export function validateW524DevicePwaEvidenceRehearsalContract(contract = {
  schema: W524_DEVICE_PWA_EVIDENCE_REHEARSAL_SCHEMA,
  caseIds: W524_REQUIRED_CASE_IDS,
  artifactKinds: W524_REQUIRED_OPERATOR_ARTIFACT_KINDS,
  sourceFiles: W524_REQUIRED_SOURCE_FILES,
  truth: W524_TRUTH
}) {
  const errors = [];
  if (contract?.schema !== W524_DEVICE_PWA_EVIDENCE_REHEARSAL_SCHEMA) errors.push('schema-invalid');
  if (!Array.isArray(contract?.caseIds) || contract.caseIds.length !== W524_REQUIRED_CASE_IDS.length || new Set(contract.caseIds).size !== W524_REQUIRED_CASE_IDS.length) errors.push('required-case-ids-invalid');
  if (!Array.isArray(contract?.artifactKinds) || contract.artifactKinds.length !== W524_REQUIRED_OPERATOR_ARTIFACT_KINDS.length || new Set(contract.artifactKinds).size !== W524_REQUIRED_OPERATOR_ARTIFACT_KINDS.length) errors.push('operator-artifact-kinds-invalid');
  if (!Array.isArray(contract?.sourceFiles) || contract.sourceFiles.length < 8) errors.push('required-source-files-invalid');
  for (const [key, expected] of Object.entries(W524_TRUTH)) {
    if (contract?.truth?.[key] !== expected) errors.push(`truth-boundary-invalid:${key}`);
  }
  return Object.freeze(errors);
}
