export const A15_SYSTEM_DISPOSITION_SCHEMA = 'eonapp.a15.system-disposition-registry.v1';

export const A15_DISPOSITIONS = Object.freeze([
  'keep-active-runtime',
  'keep-current-route',
  'keep-emitted-compatibility',
  'keep-system-document',
  'keep-current-backend',
  'keep-current-migration',
  'keep-current-release-tooling',
  'keep-current-test',
  'keep-shipping-static',
  'keep-current-evidence',
  'archive-historical-evidence',
  'quarantine-missing-import',
  'quarantine-retired-document',
  'review-before-quarantine'
]);

export const A15_DISPOSITION_OWNERS = Object.freeze({
  core: 'EONAPP Core authority',
  city: 'EONCITY integration authority',
  backend: 'Cloudflare backend authority',
  release: 'Release engineering authority',
  test: 'Certification authority',
  evidence: 'Institutional evidence authority',
  archive: 'Historical archive authority',
  static: 'Product presentation authority'
});

export const A15_HISTORICAL_PREFIXES = Object.freeze([
  'archive/',
  'CURRENT_HANDOFF_2026-06-26/',
  'CURRENT_HANDOFF_W375_2026-06-26/',
  'CodexAuditPack/',
  'EVIDENCE/',
  'FINAL_HANDOVER/',
  'FINAL_HANDOVER_W418/',
  'HANDOVER/',
  'HANDOVER_DOCS/',
  'NEXT_CHAT/',
  'program/',
  'release-evidence/'
]);

export const A15_NON_RUNTIME_PREFIXES = Object.freeze([
  'tests/',
  'e2e/',
  '.github/',
  '.vscode/'
]);

export function validateA15SystemDispositionContract() {
  const errors = [];
  if (new Set(A15_DISPOSITIONS).size !== A15_DISPOSITIONS.length) errors.push('Disposition values must be unique.');
  if (A15_HISTORICAL_PREFIXES.some((prefix) => !prefix.endsWith('/'))) errors.push('Historical prefixes must be normalized directories.');
  if (!A15_DISPOSITIONS.includes('quarantine-missing-import')) errors.push('Missing local imports must have an explicit quarantine outcome.');
  if (!A15_DISPOSITIONS.includes('review-before-quarantine')) errors.push('Unproven source reduction must remain review-gated.');
  return Object.freeze(errors);
}
