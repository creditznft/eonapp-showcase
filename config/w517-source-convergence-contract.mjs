/**
 * W517 — source convergence and release reproducibility contract.
 *
 * This contract intentionally governs source identity and verification only.
 * It does not activate any product capability or certify a deployment/device.
 */
export const W517_SOURCE_CONVERGENCE_SCHEMA = 'eonapp.w517.source-convergence.v1';
export const W517_ARTIFACT_ROOT = 'artifacts/w517-source-convergence';
export const W517_SOURCE_MANIFEST_PATH = `${W517_ARTIFACT_ROOT}/source-manifest.json`;
export const W517_SOURCE_INVENTORY_PATH = `${W517_ARTIFACT_ROOT}/source-inventory.json`;
export const W517_GATE_REGISTRY_PATH = `${W517_ARTIFACT_ROOT}/gate-registry.json`;
export const W517_EPHEMERAL_EVIDENCE_ROOT = 'tmp/evidence/w517-source-convergence';

export const W517_GENERATOR_COMMANDS = Object.freeze([
  Object.freeze({ id: 'ai-api-contract-board', script: 'scripts/write-r3a1-ai-api-contract-board.mjs' }),
  Object.freeze({ id: 'local-ai-csp', script: 'scripts/sync-local-ai-csp.mjs' }),
  Object.freeze({ id: 'route-contract', script: 'scripts/sync-route-contract.mjs' }),
  Object.freeze({ id: 'route-seo', script: 'scripts/sync-w477-route-seo.mjs' }),
  Object.freeze({ id: 'public-assets-and-pwa-mirrors', script: 'scripts/sync-public-assets.mjs' })
]);

export const W517_GENERATED_OUTPUTS = Object.freeze([
  '_headers',
  'public/_headers',
  '_redirects',
  'public/_redirects',
  'sitemap.xml',
  'public/sitemap.xml',
  'robots.txt',
  'public/robots.txt',
  'public/favicon.svg',
  'public/favicon.ico',
  'public/manifest.webmanifest',
  'public/sw.js',
  'public/assets/js/eon-theme-bootstrap.js',
  'public/assets/img/icons/icon-192.png',
  'public/assets/img/icons/icon-512.png',
  'public/assets/img/og/default.svg',
  'public/assets/city/art',
  'release-evidence/R3A1_AI_API_CHANGE_CONTROL_2026-06-25/AI_API_CONTRACT_BOARD.json'
]);

export const W517_REQUIRED_PUBLIC_MIRRORS = Object.freeze([
  Object.freeze({ source: 'favicon.svg', mirror: 'public/favicon.svg' }),
  Object.freeze({ source: 'favicon.ico', mirror: 'public/favicon.ico' }),
  Object.freeze({ source: 'manifest.webmanifest', mirror: 'public/manifest.webmanifest' }),
  Object.freeze({ source: 'robots.txt', mirror: 'public/robots.txt' }),
  Object.freeze({ source: 'sitemap.xml', mirror: 'public/sitemap.xml' }),
  Object.freeze({ source: 'sw.js', mirror: 'public/sw.js' }),
  Object.freeze({ source: '_headers', mirror: 'public/_headers' }),
  Object.freeze({ source: '_redirects', mirror: 'public/_redirects' }),
  Object.freeze({ source: 'assets/js/eon-theme-bootstrap.js', mirror: 'public/assets/js/eon-theme-bootstrap.js' }),
  Object.freeze({ source: 'assets/img/icons/icon-192.png', mirror: 'public/assets/img/icons/icon-192.png' }),
  Object.freeze({ source: 'assets/img/icons/icon-512.png', mirror: 'public/assets/img/icons/icon-512.png' }),
  Object.freeze({ source: 'assets/img/og/default.svg', mirror: 'public/assets/img/og/default.svg' })
]);

export const W517_MANIFEST_EXCLUDED_PREFIXES = Object.freeze([
  '.git/',
  'node_modules/',
  'dist/',
  'tmp/',
  '.wrangler/',
  'playwright-report/',
  'test-results/',
  '.lighthouseci/',
  `${W517_ARTIFACT_ROOT}/`,
  // These are deterministic copies made by sync-public-assets from the canonical
  // assets/img/icons sources. They are deliberately not source-identity inputs
  // in a Git-free handover, where the copies may be absent until generators run.
  'public/assets/img/icons/'
]);

export const W517_GATE_LIFECYCLE_VALUES = Object.freeze(['active', 'superseded', 'archival', 'evidence-only']);

export const W517_RELEASE_AUTHORITY_REGISTRY = Object.freeze([
  Object.freeze({
    id: 'w517-clean-checkout',
    command: 'npm run verify:clean-checkout',
    lifecycle: 'active',
    owner: 'release reproducibility',
    risk: 'source drift, stale generated outputs, stale manifest'
  }),
  Object.freeze({
    id: 'w517-canonical-release',
    command: 'npm run release:verify:canonical',
    lifecycle: 'active',
    owner: 'release verification',
    risk: 'current source release checks'
  }),
  Object.freeze({
    id: 'w517-current-unit-suite',
    command: 'npm run test:unit',
    lifecycle: 'active',
    owner: 'current product regression',
    risk: 'active source behaviour'
  }),
  Object.freeze({
    id: 'w517-source-lint',
    command: 'npm run lint -- --max-warnings=0',
    lifecycle: 'active',
    owner: 'source hygiene',
    risk: 'active JavaScript lint failures'
  }),
  Object.freeze({
    id: 'w517-source-syntax',
    command: 'npm run qa:w517-source-syntax',
    lifecycle: 'active',
    owner: 'source syntax',
    risk: 'parse failure in tracked JavaScript'
  }),
  Object.freeze({
    id: 'w517-build-smoke-and-site',
    command: 'npm run build && npm run smoke:build && npm run audit:site',
    lifecycle: 'active',
    owner: 'build integrity',
    risk: 'production output, required files and static site regressions'
  }),
  Object.freeze({
    id: 'w517-public-output-quarantine',
    command: 'npm run qa:w239-public-output-quarantine',
    lifecycle: 'active',
    owner: 'public-output boundary',
    risk: 'retired or unsafe public output'
  }),
  Object.freeze({
    id: 'w518-workspace-capsule',
    command: 'npm run qa:w518-workspace-capsule',
    lifecycle: 'active',
    owner: 'local recovery boundary',
    risk: 'legacy backup or non-local Capsule recovery path'
  }),
  Object.freeze({
    id: 'w519-legacy-transport-quarantine-source',
    command: 'npm run qa:w519-legacy-transport-quarantine',
    lifecycle: 'active',
    owner: 'legacy transport/control containment',
    risk: 'inactive transport/control source re-entering active route, shell, Function or current-test reachability'
  }),
  Object.freeze({
    id: 'w519-legacy-transport-quarantine-output',
    command: 'npm run qa:w519-legacy-transport-quarantine:dist',
    lifecycle: 'active',
    owner: 'legacy transport/control built-output containment',
    risk: 'quarantined transport/control marker reappearing in production output'
  }),
  Object.freeze({
    id: 'w520-core-modularisation',
    command: 'npm run qa:w520-core-modularisation',
    lifecycle: 'active',
    owner: 'core modularisation',
    risk: 'orchestrator concentration, boundary or cycle regression'
  }),
  Object.freeze({
    id: 'w521-eon-city-source-engineering-source',
    command: 'npm run qa:w521-eon-city-source-engineering',
    lifecycle: 'active',
    owner: 'City lifecycle engineering',
    risk: 'stale boot, incomplete disposal or retired renderer reachability'
  }),
  Object.freeze({
    id: 'w521-eon-city-source-engineering-output',
    command: 'npm run qa:w521-eon-city-source-engineering:dist',
    lifecycle: 'active',
    owner: 'City built-output containment',
    risk: 'retired City renderer marker in built output'
  }),
  Object.freeze({
    id: 'w522-gate-risk-convergence-source',
    command: 'npm run qa:w522-gate-risk-convergence',
    lifecycle: 'active',
    owner: 'gate and risk convergence',
    risk: 'stale route, recovery, capability or gate lifecycle contract'
  }),
  Object.freeze({
    id: 'w522-gate-risk-convergence-output',
    command: 'npm run qa:w522-gate-risk-convergence:dist',
    lifecycle: 'active',
    owner: 'route/recovery built-output convergence',
    risk: 'canonical local recovery or City route missing from output'
  }),
  Object.freeze({
    id: 'w524-device-pwa-evidence-rehearsal',
    command: 'npm run qa:w524-device-pwa-evidence-rehearsal',
    lifecycle: 'active',
    owner: 'device and PWA evidence rehearsal',
    risk: 'missing human-run evidence case or a local checklist masquerading as independent proof'
  }),
  Object.freeze({
    id: 'w524-portability-handover',
    command: 'npm run qa:w524-portability-handover',
    lifecycle: 'active',
    owner: 'portable redirect mirrors and truthful top-level handover entrypoint',
    risk: 'CRLF redirect drift or stale root start files driving the wrong verification workflow'
  }),
  Object.freeze({
    id: 'w517-launch-readiness',
    command: 'npm run launch:readiness',
    lifecycle: 'active',
    owner: 'source launch contract',
    risk: 'primary route and inactive-commercial boundary'
  }),
  Object.freeze({
    id: 'w517-production-dependency-audit',
    command: 'npm audit --omit=dev',
    lifecycle: 'active',
    owner: 'production dependencies',
    risk: 'known production dependency vulnerabilities'
  }),
  Object.freeze({
    id: 'w476-release-verify',
    command: 'npm run release:verify',
    lifecycle: 'superseded',
    owner: 'historical W476 source lane',
    risk: 'narrow W476 source contracts only'
  }),
  Object.freeze({
    id: 'w216-release-candidate',
    command: 'npm run qa:w216-release-candidate',
    lifecycle: 'archival',
    owner: 'historical W216 aggregate',
    risk: 'historical aggregate cannot be release-authoritative'
  }),
  Object.freeze({
    id: 'w397-release-candidate',
    command: 'npm run verify:w397-release-candidate',
    lifecycle: 'archival',
    owner: 'historical W397 aggregate',
    risk: 'historical aggregate cannot be release-authoritative'
  }),
  Object.freeze({
    id: 'production-browser-proof',
    command: 'npm run qa:w476-b-production-proof',
    lifecycle: 'evidence-only',
    owner: 'Codex or owner in a networked real browser',
    risk: 'production route/CSP/browser proof outside local static verification'
  }),
  Object.freeze({
    id: 'city-device-certificate',
    command: 'npm run qa:w453a-production-city-edge-proof',
    lifecycle: 'evidence-only',
    owner: 'Codex or owner on named physical devices',
    risk: 'City runtime and device evidence outside source verification'
  }),
  Object.freeze({
    id: 'w524-pwa-install-advisory',
    command: 'npm run qa:pwa-install',
    lifecycle: 'evidence-only',
    owner: 'static PWA manifest/install-shape review',
    risk: 'advisory only; does not prove physical install, update, rollback, or device behavior'
  })
]);

export function isW517ManifestExcluded(relativePath) {
  const normalized = String(relativePath || '').replaceAll('\\', '/').replace(/^\.\//, '');
  return W517_MANIFEST_EXCLUDED_PREFIXES.some((prefix) => normalized === prefix.slice(0, -1) || normalized.startsWith(prefix));
}

export function validateW517SourceConvergenceContract() {
  const errors = [];
  if (new Set(W517_GENERATOR_COMMANDS.map((entry) => entry.id)).size !== W517_GENERATOR_COMMANDS.length) errors.push('W517 generator ids must be unique.');
  if (new Set(W517_GENERATED_OUTPUTS).size !== W517_GENERATED_OUTPUTS.length) errors.push('W517 generated outputs must be unique.');
  if (new Set(W517_GATE_LIFECYCLE_VALUES).size !== W517_GATE_LIFECYCLE_VALUES.length) errors.push('W517 gate lifecycle values must be unique.');
  for (const entry of W517_RELEASE_AUTHORITY_REGISTRY) {
    if (!W517_GATE_LIFECYCLE_VALUES.includes(entry.lifecycle)) errors.push(`Unknown W517 gate lifecycle: ${entry.id}.`);
    if (!entry.id || !entry.command || !entry.owner || !entry.risk) errors.push(`Incomplete W517 gate registry row: ${entry.id || 'unknown'}.`);
  }
  if (!W517_MANIFEST_EXCLUDED_PREFIXES.includes(`${W517_ARTIFACT_ROOT}/`)) errors.push('W517 manifest must exclude self-generated convergence artifacts.');
  return Object.freeze(errors);
}
