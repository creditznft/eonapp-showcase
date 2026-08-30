/** W534 — source archaeology contract. Historical material remains preserved but cannot be a runnable-product entrypoint. */
export const W534_HISTORICAL_DOCUMENTATION_SCHEMA = 'eonapp.w534.historical-documentation.v1';
export const W534_CURRENT_ENTRYPOINTS = Object.freeze([
  'README.md',
  'CURRENT_PRODUCT_START_HERE.md',
  'package.json',
  'HANDOVER/W525A_GOOGLE_DRIVE_VAULT_PROFILE_START_HERE_2026-07-03.md'
]);
export const W534_HISTORICAL_COLLECTIONS = Object.freeze([
  'archive',
  'CANONICAL_HANDOVER',
  'CITY_EVIDENCE_COMPACT',
  'CURRENT_HANDOFF_2026-06-26',
  'CURRENT_HANDOFF_W375_2026-06-26',
  'EVIDENCE',
  'NEXT_CHAT',
  'release-evidence'
]);
export const W534_HISTORICAL_DOCUMENTATION_CONTRACT = Object.freeze({
  wave: 'W534',
  schema: W534_HISTORICAL_DOCUMENTATION_SCHEMA,
  currentEntrypoints: W534_CURRENT_ENTRYPOINTS,
  historicalCollections: W534_HISTORICAL_COLLECTIONS,
  generatedIndex: 'docs/W534_HISTORICAL_DOCUMENT_INDEX.md',
  retiredRunnableDiagnostic: 'e2e/flows.spec.js',
  quarantineRoot: 'archive/w519-legacy-transport-control',
  prohibited: Object.freeze([
    'historical-doc-as-release-entrypoint',
    'runnable-p2p-diagnostic-outside-quarantine',
    'package-script-historical-handoff-dependency'
  ])
});

export function validateW534HistoricalDocumentationContract(contract = W534_HISTORICAL_DOCUMENTATION_CONTRACT) {
  const issues = [];
  if (contract?.schema !== W534_HISTORICAL_DOCUMENTATION_SCHEMA) issues.push('schema-invalid');
  if (!Array.isArray(contract?.currentEntrypoints) || !contract.currentEntrypoints.includes('CURRENT_PRODUCT_START_HERE.md')) issues.push('current-entrypoint-missing');
  if (!Array.isArray(contract?.historicalCollections) || contract.historicalCollections.length < 5) issues.push('historical-collections-incomplete');
  if (contract?.retiredRunnableDiagnostic !== 'e2e/flows.spec.js') issues.push('retired-diagnostic-path-invalid');
  return Object.freeze(issues);
}
