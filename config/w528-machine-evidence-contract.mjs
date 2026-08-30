/** W528 — source and emulated-browser evidence contract. This is never physical-device proof. */
export const W528_MACHINE_EVIDENCE_SCHEMA = 'eonapp.w528.machine-evidence.v1';
export const W528_MACHINE_EVIDENCE_CONTRACT = Object.freeze({
  wave: 'W528',
  schema: W528_MACHINE_EVIDENCE_SCHEMA,
  defaultMode: 'source-static-shape-only',
  approvedEvidenceLabels: Object.freeze(['source-pass', 'emulated-browser-pending', 'local-browser-pending', 'pending-human-review']),
  requiredBrowserFamilies: Object.freeze(['chromium', 'firefox', 'webkit']),
  requiredViewportFamilies: Object.freeze(['android-phone', 'iphone', 'ipad']),
  requiredScenarios: Object.freeze([
    'touch-keyboard-reduced-motion',
    'portrait-landscape-city-return',
    'offline-reconnect-stale-cache',
    'fixture-capsule-export-import',
    'two-build-service-worker-update-rehearsal',
    'rollback-rehearsal'
  ]),
  prohibitedClaims: Object.freeze([
    'physical-device-proven',
    'pwa-install-proven',
    'production-browser-proven',
    'automatic-capsule-restore'
  ])
});

export function validateW528MachineEvidenceContract(contract = W528_MACHINE_EVIDENCE_CONTRACT) {
  const issues = [];
  if (contract?.schema !== W528_MACHINE_EVIDENCE_SCHEMA) issues.push('schema-invalid');
  if (contract?.defaultMode !== 'source-static-shape-only') issues.push('default-mode-invalid');
  if (!Array.isArray(contract?.requiredBrowserFamilies) || contract.requiredBrowserFamilies.length !== 3) issues.push('browser-families-incomplete');
  if (!Array.isArray(contract?.requiredViewportFamilies) || contract.requiredViewportFamilies.length !== 3) issues.push('viewport-families-incomplete');
  if (!Array.isArray(contract?.requiredScenarios) || contract.requiredScenarios.length < 6) issues.push('scenarios-incomplete');
  if (!Array.isArray(contract?.prohibitedClaims) || !contract.prohibitedClaims.includes('physical-device-proven')) issues.push('prohibited-claims-incomplete');
  return Object.freeze(issues);
}
