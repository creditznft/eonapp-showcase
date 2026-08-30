/**
 * W451.1 — proof-gated legacy cleanup handoff.
 *
 * The working snapshot cannot safely delete or move code without the canonical
 * repository history. This contract turns the W451 inventory into a precise
 * Codex sequence: prove the clean branch first, then quarantine only files
 * outside the active graph. It never authorises an automatic delete.
 */
export const W451_CLEANUP_EXECUTION_SCHEMA = 'eonapp.w451.1.cleanup-execution.v1';

export const W451_CLEANUP_PRECONDITIONS = Object.freeze([
  'canonical-branch-confirmed',
  'npm-ci-complete',
  'active-import-fence-green',
  'w449-production-cleanroom-green',
  'current-unit-suite-green',
  'production-build-green',
  'dist-cleanroom-green'
]);

export const W451_CLEANUP_ACTIONS = Object.freeze([
  Object.freeze({ id: 'preserve-active-and-compatibility', outcome: 'keep', reason: 'Active runtime, route documents, compatibility redirects, release tooling and tests are not deletion candidates.' }),
  Object.freeze({ id: 'quarantine-historical-roots', outcome: 'quarantine-after-codex-proof', reason: 'Historical handovers and archived evidence may move only after the active graph and final output are confirmed.' }),
  Object.freeze({ id: 'review-root-history', outcome: 'review-before-quarantine', reason: 'Root-level changelogs, old handoff notes and generated reports may be useful release history even when not active source.' }),
  Object.freeze({ id: 'delete-only-after-second-proof', outcome: 'delete-after-codex-proof', reason: 'Deletion requires a fresh clean-branch build, test, source manifest and human review after the quarantine step.' })
]);

export const W451_CLEANUP_GUARANTEES = Object.freeze({
  automaticDelete: false,
  automaticMove: false,
  changesProductionRoutes: false,
  changesActiveImports: false,
  includesSecrets: false,
  deploymentClaim: false
});

export function validateW451CleanupExecutionContract() {
  const errors = [];
  if (!W451_CLEANUP_PRECONDITIONS.includes('canonical-branch-confirmed') || !W451_CLEANUP_PRECONDITIONS.includes('dist-cleanroom-green')) errors.push('Cleanup must be canonical-branch and build-output proof gated.');
  if (W451_CLEANUP_GUARANTEES.automaticDelete !== false || W451_CLEANUP_GUARANTEES.automaticMove !== false) errors.push('Cleanup handoff must not automate file destruction or relocation.');
  if (!W451_CLEANUP_ACTIONS.some((entry) => entry.outcome === 'quarantine-after-codex-proof') || !W451_CLEANUP_ACTIONS.some((entry) => entry.outcome === 'delete-after-codex-proof')) errors.push('Cleanup handoff must preserve a two-step quarantine then delete workflow.');
  return Object.freeze(errors);
}
