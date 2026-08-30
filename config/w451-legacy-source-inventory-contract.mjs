/**
 * W451 — legacy source inventory and retirement workflow.
 *
 * This contract does not delete historical material. It prevents accidental
 * deletion by making every source file visible as active, compatibility,
 * release tooling, test, historical or review-required before Codex performs
 * any physical reduction on the canonical branch.
 */
export const W451_LEGACY_INVENTORY_SCHEMA = 'eonapp.w451.legacy-source-inventory.v1';

export const W451_HISTORICAL_ROOTS = Object.freeze([
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
  'docs/',
  'program/',
  'release-evidence/'
]);

export const W451_IGNORED_ROOTS = Object.freeze([
  '.git/',
  'node_modules/',
  'dist/',
  'tmp/',
  'artifacts/',
  'playwright-report/',
  'test-results/',
  '.lighthouseci/'
]);

export const W451_NON_RUNTIME_PREFIXES = Object.freeze([
  'tests/',
  'e2e/',
  '.github/',
  '.vscode/'
]);

export const W451_RETIREMENT_OUTCOMES = Object.freeze([
  'keep-active',
  'keep-compatibility',
  'keep-release-tooling',
  'keep-test-only',
  'keep-historical',
  'review-before-quarantine',
  'quarantine-after-codex-proof',
  'delete-after-codex-proof'
]);

export function validateW451LegacyInventoryContract() {
  const errors = [];
  if (new Set(W451_HISTORICAL_ROOTS).size !== W451_HISTORICAL_ROOTS.length) errors.push('Historical roots must be unique.');
  if (W451_HISTORICAL_ROOTS.some((root) => !root.endsWith('/'))) errors.push('Historical roots must use normalized directory prefixes.');
  if (W451_IGNORED_ROOTS.some((root) => !root.endsWith('/'))) errors.push('Ignored roots must use normalized directory prefixes.');
  if (!W451_RETIREMENT_OUTCOMES.includes('review-before-quarantine') || !W451_RETIREMENT_OUTCOMES.includes('delete-after-codex-proof')) errors.push('Retirement workflow must be proof-gated.');
  return Object.freeze(errors);
}
