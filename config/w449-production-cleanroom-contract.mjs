/**
 * W449 — production cleanroom contract.
 *
 * Historical code and handover material may remain in the source archive for
 * audit and recovery. They must never become a production HTML entrypoint,
 * an active module dependency, or a second public product surface.
 */
export const W449_PRODUCTION_CLEANROOM_SCHEMA = 'eonapp.w449.production-cleanroom.v1';

export const W449_SYSTEM_HTML_DOCUMENTS = Object.freeze(['404.html', 'offline.html']);

export const W449_QUARANTINE_ROOTS = Object.freeze([
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
  'release-evidence/',
  'tests/',
  'e2e/',
  'games/',
  'tools/',
  'blog/',
  'Smart Contracts/'
]);

/**
 * A source archive directory and a public retired landing route happen to share
 * the word "archive". The source directory remains quarantined; this narrow
 * output exception permits only the route-contract materialisation of the
 * explicit `archive.html` safe landing, never a copied archive tree.
 */
export const W449_QUARANTINE_OUTPUT_EXCEPTIONS = Object.freeze({
  archive: Object.freeze({
    sourceFile: 'archive.html',
    allowedOutputFiles: Object.freeze(['index.html']),
    reason: 'Declared retired safe landing for legacy redirects.'
  })
});

export const W449_PUBLIC_ROUTE_TRUTH = Object.freeze({
  chat: '/',
  city: '/eoncity',
  research: '/insights',
  legacyPolicy: 'Redirect-only aliases are allowed only when declared by config/route-contract.mjs.',
  disabledStatusPolicy: 'Billing, rewards and Telegram may explain their current state but must not become checkout, rewards or campaign surfaces.'
});

export const W449_PRODUCTION_CLEANROOM_RULES = Object.freeze({
  explicitHtmlEntrypoints: true,
  systemDocuments: W449_SYSTEM_HTML_DOCUMENTS,
  quarantineRoots: W449_QUARANTINE_ROOTS,
  activeLegacyImportsAllowed: false,
  unplannedRootHtmlAllowed: false,
  generatedOutputLegacyHtmlAllowed: false,
  externalBuildInputDiscoveryAllowed: false
});

export function validateW449ProductionCleanroomContract() {
  const errors = [];
  if (W449_PRODUCTION_CLEANROOM_RULES.explicitHtmlEntrypoints !== true) errors.push('Production HTML entries must be explicit.');
  if (W449_PRODUCTION_CLEANROOM_RULES.activeLegacyImportsAllowed !== false) errors.push('Active application code must not depend on quarantined legacy source.');
  if (W449_PRODUCTION_CLEANROOM_RULES.unplannedRootHtmlAllowed !== false) errors.push('Root HTML outside the route contract must not enter the build.');
  if (W449_PRODUCTION_CLEANROOM_RULES.generatedOutputLegacyHtmlAllowed !== false) errors.push('Retired HTML must not enter dist/.');
  if (W449_PRODUCTION_CLEANROOM_RULES.externalBuildInputDiscoveryAllowed !== false) errors.push('Build input must not be inferred by walking arbitrary source folders.');
  if (!W449_SYSTEM_HTML_DOCUMENTS.includes('404.html') || !W449_SYSTEM_HTML_DOCUMENTS.includes('offline.html')) errors.push('System recovery documents are incomplete.');
  if (new Set(W449_QUARANTINE_ROOTS).size !== W449_QUARANTINE_ROOTS.length) errors.push('Quarantine roots must be unique.');
  for (const [directory, exception] of Object.entries(W449_QUARANTINE_OUTPUT_EXCEPTIONS)) {
    if (!W449_QUARANTINE_ROOTS.includes(`${directory}/`)) errors.push(`Output exception must correspond to a quarantined source root: ${directory}.`);
    if (!/^[a-z0-9-]+$/i.test(directory) || !/^[^/]+\.html$/i.test(exception.sourceFile)) errors.push(`Output exception is not normalized: ${directory}.`);
    if (!Array.isArray(exception.allowedOutputFiles) || !exception.allowedOutputFiles.length || exception.allowedOutputFiles.some((file) => file.includes('..') || file.includes('/'))) errors.push(`Output exception allows an unsafe file list: ${directory}.`);
  }
  if (W449_PUBLIC_ROUTE_TRUTH.city !== '/eoncity' || W449_PUBLIC_ROUTE_TRUTH.research !== '/insights' || W449_PUBLIC_ROUTE_TRUTH.chat !== '/') errors.push('Public route truth is inconsistent.');
  return Object.freeze(errors);
}
