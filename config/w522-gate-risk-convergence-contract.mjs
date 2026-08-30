/**
 * W522 — executable gate/risk convergence contract.
 *
 * This contract makes current source controls explicit. It does not turn
 * source checks into production, commercial, browser, or physical-device
 * certification.
 */
export const W522_GATE_RISK_CONVERGENCE_SCHEMA = 'eonapp.w522.gate-risk-convergence.v1';

const freezeRows = (rows) => Object.freeze(rows.map((row) => Object.freeze({ ...row })));

export const W522_GATE_LIFECYCLES = Object.freeze(['active', 'superseded', 'archival', 'evidence-only']);
export const W522_CANONICAL_PHASES = Object.freeze(['prebuild', 'postbuild', 'postrelease']);

export const W522_TRUTH = Object.freeze({
  sourceOnly: true,
  productionApproved: false,
  physicalDeviceCertified: false,
  browserEvidenceAccepted: false,
  commercialActivationApproved: false,
  launchApproval: false,
  historicalEvidenceCanApproveRelease: false,
  sourceGateCanApproveProduction: false
});

/**
 * Leaf control inventory. `canonicalGateId` records where the control is
 * executed in the single canonical verifier. Nested controls deliberately
 * name their owning direct command so that an old command cannot silently
 * disappear behind a green aggregate.
 */
export const W522_GATE_RISK_REGISTRY = freezeRows([
  { id: 'w517-clean-checkout', lifecycle: 'active', command: 'verify:clean-checkout', canonicalGateId: 'clean-checkout-before', canonicalPhase: 'prebuild', owner: 'release reproducibility', risk: 'source drift, generated-output drift, portable handoff drift' },
  { id: 'w517-current-unit-suite', lifecycle: 'active', command: 'test:unit', canonicalGateId: 'unit', canonicalPhase: 'prebuild', owner: 'current product regression', risk: 'current source behaviour regression' },
  { id: 'w519-source', lifecycle: 'active', command: 'qa:w519-legacy-transport-quarantine', nestedWithin: 'qa:w520-core-modularisation', canonicalGateId: 'w520-core-modularisation', canonicalPhase: 'prebuild', owner: 'legacy transport/control containment', risk: 'quarantined transport or control code returning to active reachability' },
  { id: 'w520-source', lifecycle: 'active', command: 'qa:w520-core-modularisation', canonicalGateId: 'w520-core-modularisation', canonicalPhase: 'prebuild', owner: 'core modularisation', risk: 'orchestrator concentration or boundary-cycle regression' },
  { id: 'w521-source', lifecycle: 'active', command: 'qa:w521-eon-city-source-engineering', canonicalGateId: 'w521-city-source-engineering', canonicalPhase: 'prebuild', owner: 'City lifecycle engineering', risk: 'stale City boot, disposal, context-loss, or retired renderer reachability' },
  { id: 'w518-source', lifecycle: 'active', command: 'qa:w518-workspace-capsule', canonicalGateId: 'w518-workspace-capsule', canonicalPhase: 'prebuild', owner: 'local recovery', risk: 'legacy sync/recovery surface or non-local capsule path' },
  { id: 'w522-source', lifecycle: 'active', command: 'qa:w522-gate-risk-convergence', canonicalGateId: 'w522-gate-risk-convergence', canonicalPhase: 'prebuild', owner: 'gate/risk convergence', risk: 'stale route, recovery, capability, lifecycle, or canonical-release contract' },
  { id: 'w524-source', lifecycle: 'active', command: 'qa:w524-device-pwa-evidence-rehearsal', canonicalGateId: 'w524-device-pwa-evidence-rehearsal', canonicalPhase: 'prebuild', owner: 'device/PWA evidence rehearsal', risk: 'incomplete human-run device coverage or a local checklist masquerading as independent proof' },
  { id: 'w517-lint', lifecycle: 'active', command: 'lint', canonicalGateId: 'lint', canonicalPhase: 'prebuild', owner: 'source hygiene', risk: 'lint errors or warnings in active source' },
  { id: 'w517-syntax', lifecycle: 'active', command: 'qa:w517-source-syntax', canonicalGateId: 'source-syntax', canonicalPhase: 'prebuild', owner: 'source syntax', risk: 'parse error in portable source' },
  { id: 'w517-build', lifecycle: 'active', command: 'build', canonicalGateId: 'build', canonicalPhase: 'postbuild', owner: 'build integrity', risk: 'production output or route emission regression' },
  { id: 'w519-output', lifecycle: 'active', command: 'qa:w519-legacy-transport-quarantine:dist', canonicalGateId: 'w519-built-output-quarantine', canonicalPhase: 'postbuild', owner: 'transport/control output containment', risk: 'quarantined marker in built output' },
  { id: 'w521-output', lifecycle: 'active', command: 'qa:w521-eon-city-source-engineering:dist', canonicalGateId: 'w521-built-output-fence', canonicalPhase: 'postbuild', owner: 'City output containment', risk: 'retired renderer marker in built output' },
  { id: 'w522-output', lifecycle: 'active', command: 'qa:w522-gate-risk-convergence:dist', canonicalGateId: 'w522-built-output-convergence', canonicalPhase: 'postbuild', owner: 'route/recovery output convergence', risk: 'canonical recovery or City route missing from built output' },
  { id: 'w517-smoke', lifecycle: 'active', command: 'smoke:build', canonicalGateId: 'smoke-build', canonicalPhase: 'postbuild', owner: 'build smoke', risk: 'missing emitted source assets' },
  { id: 'w517-site-audit', lifecycle: 'active', command: 'audit:site', canonicalGateId: 'site-audit', canonicalPhase: 'postbuild', owner: 'static site audit', risk: 'static HTML/CSP/route regression' },
  { id: 'w517-public-output', lifecycle: 'active', command: 'qa:w239-public-output-quarantine', canonicalGateId: 'public-output-quarantine', canonicalPhase: 'postrelease', owner: 'public output boundary', risk: 'retired or unsafe output being emitted' },
  { id: 'w517-launch-contract', lifecycle: 'active', command: 'launch:readiness', canonicalGateId: 'launch-readiness', canonicalPhase: 'postrelease', owner: 'source launch contract', risk: 'inactive commercial or primary-route boundary regression' },
  { id: 'w517-production-dependencies', lifecycle: 'active', command: 'npm audit --omit=dev', canonicalGateId: 'production-dependency-audit', canonicalPhase: 'postrelease', owner: 'production dependencies', risk: 'known production dependency vulnerability' },
  { id: 'w476-release-verify', lifecycle: 'superseded', command: 'release:verify', canonicalGateId: '', canonicalPhase: 'prebuild', owner: 'historical W476 source lane', risk: 'historical aggregate is narrower than the current registry' },
  { id: 'w216-release-candidate', lifecycle: 'archival', command: 'qa:w216-release-candidate', canonicalGateId: '', canonicalPhase: 'prebuild', owner: 'historical W216 aggregate', risk: 'historical result cannot approve current release' },
  { id: 'w397-release-candidate', lifecycle: 'archival', command: 'verify:w397-release-candidate', canonicalGateId: '', canonicalPhase: 'prebuild', owner: 'historical W397 aggregate', risk: 'historical result cannot approve current release' },
  { id: 'production-browser-proof', lifecycle: 'evidence-only', command: 'qa:w476-b-production-proof', canonicalGateId: '', canonicalPhase: 'postrelease', owner: 'Codex or owner in a networked browser', risk: 'live route/CSP/browser proof outside local source verification' },
  { id: 'city-device-certificate', lifecycle: 'evidence-only', command: 'qa:w453a-production-city-edge-proof', canonicalGateId: '', canonicalPhase: 'postrelease', owner: 'Codex or owner on named physical devices', risk: 'City runtime, PWA, and physical-device proof outside local source verification' }
]);

export const W522_REQUIRED_SOURCE_FILES = Object.freeze([
  'config/route-contract.mjs',
  'assets/js/capabilities/capability-truth-registry.js',
  'scripts/w518-workspace-capsule-gate.mjs',
  'config/w486-evidence-freshness-contract.mjs',
  'config/w517-source-convergence-contract.mjs',
  'scripts/w517-canonical-release-verify.mjs',
  'config/w522-gate-risk-convergence-contract.mjs',
  'scripts/w522-gate-risk-convergence-gate.mjs',
  'tests/unit/w522-gate-risk-convergence.test.mjs'
]);

export const W522_REQUIRED_W517_ACTIVE_IDS = Object.freeze([
  'w517-clean-checkout',
  'w517-canonical-release',
  'w517-current-unit-suite',
  'w517-source-lint',
  'w517-source-syntax',
  'w517-build-smoke-and-site',
  'w517-public-output-quarantine',
  'w518-workspace-capsule',
  'w519-legacy-transport-quarantine-source',
  'w519-legacy-transport-quarantine-output',
  'w520-core-modularisation',
  'w521-eon-city-source-engineering-source',
  'w521-eon-city-source-engineering-output',
  'w522-gate-risk-convergence-source',
  'w522-gate-risk-convergence-output',
  'w524-device-pwa-evidence-rehearsal',
  'w517-launch-readiness',
  'w517-production-dependency-audit'
]);

export const W522_REQUIRED_W517_NONACTIVE_IDS = Object.freeze([
  'w476-release-verify',
  'w216-release-candidate',
  'w397-release-candidate',
  'production-browser-proof',
  'city-device-certificate'
]);

export const W522_REQUIRED_CAPABILITY_LIFECYCLES = Object.freeze([
  Object.freeze({ id: 'cloud-workspace-control-plane', lifecycle: 'blocked' }),
  Object.freeze({ id: 'legacy-social-publisher', lifecycle: 'retired' }),
  Object.freeze({ id: 'legacy-agent-executor', lifecycle: 'retired' }),
  Object.freeze({ id: 'platform-backend-legacy', lifecycle: 'blocked' }),
  Object.freeze({ id: 'reward-wallet-referral', lifecycle: 'blocked' }),
  Object.freeze({ id: 'google-identity-sign-in', lifecycle: 'planned' })
]);

export const W522_REQUIRED_ROUTE_ASSERTIONS = Object.freeze([
  Object.freeze({ from: '/capsule', to: '/capsule.html', lifecycle: 'local-only', status: 200 }),
  Object.freeze({ from: '/vault/backup', to: '/capsule', lifecycle: undefined, status: 301 }),
  Object.freeze({ from: '/vault-backup.html', to: '/capsule', lifecycle: undefined, status: 301 }),
  Object.freeze({ from: '/eoncity', to: '/eoncity.html', lifecycle: 'direct-babylon-city', status: 200 }),
  Object.freeze({ from: '/eoncity-3d', to: '/eoncity', lifecycle: undefined, status: 301 }),
  Object.freeze({ from: '/eoncity-play', to: '/eoncity', lifecycle: undefined, status: 301 })
]);

export function validateW522GateRiskConvergenceContract(contract = {
  schema: W522_GATE_RISK_CONVERGENCE_SCHEMA,
  registry: W522_GATE_RISK_REGISTRY,
  truth: W522_TRUTH,
  sourceFiles: W522_REQUIRED_SOURCE_FILES
}) {
  const errors = [];
  const registry = Array.isArray(contract?.registry) ? contract.registry : [];
  if (contract?.schema !== W522_GATE_RISK_CONVERGENCE_SCHEMA) errors.push('schema-invalid');
  if (!Array.isArray(contract?.sourceFiles) || contract.sourceFiles.length < 9) errors.push('required-source-files-incomplete');
  if (new Set(registry.map((entry) => entry?.id)).size !== registry.length) errors.push('duplicate-gate-id');
  for (const entry of registry) {
    if (!W522_GATE_LIFECYCLES.includes(entry?.lifecycle)) errors.push(`invalid-lifecycle:${entry?.id || 'unknown'}`);
    if (!entry?.id || !entry?.command || !entry?.owner || !entry?.risk) errors.push(`incomplete-gate-row:${entry?.id || 'unknown'}`);
    if (!W522_CANONICAL_PHASES.includes(entry?.canonicalPhase)) errors.push(`invalid-canonical-phase:${entry?.id || 'unknown'}`);
    if (entry?.lifecycle === 'active' && (!entry?.canonicalGateId || !entry?.command)) errors.push(`active-gate-not-canonical:${entry?.id || 'unknown'}`);
    if (entry?.lifecycle !== 'active' && entry?.canonicalGateId) errors.push(`nonactive-gate-has-canonical-authority:${entry?.id || 'unknown'}`);
  }
  const activeIds = new Set(registry.filter((entry) => entry.lifecycle === 'active').map((entry) => entry.id));
  for (const id of ['w518-source', 'w519-source', 'w520-source', 'w521-source', 'w522-source', 'w524-source', 'w522-output']) {
    if (!activeIds.has(id)) errors.push(`required-active-gate-missing:${id}`);
  }
  const truth = contract?.truth || {};
  for (const [key, expected] of Object.entries(W522_TRUTH)) {
    if (truth[key] !== expected) errors.push(`truth-boundary-invalid:${key}`);
  }
  return Object.freeze(errors);
}

export function validateW522RouteRecoveryCapabilityState({ routeRows = [], capabilityRecords = [] } = {}) {
  const errors = [];
  const routes = Array.isArray(routeRows) ? routeRows : [];
  const capabilities = Array.isArray(capabilityRecords) ? capabilityRecords : [];
  const findRoute = (from) => routes.find((entry) => entry?.from === from) || null;
  for (const assertion of W522_REQUIRED_ROUTE_ASSERTIONS) {
    const row = findRoute(assertion.from);
    if (!row) { errors.push(`required-route-missing:${assertion.from}`); continue; }
    if (row.to !== assertion.to || Number(row.status) !== assertion.status) errors.push(`required-route-invalid:${assertion.from}`);
    if (assertion.lifecycle !== undefined && row.lifecycle !== assertion.lifecycle) errors.push(`required-route-lifecycle-invalid:${assertion.from}`);
  }
  for (const row of routes) {
    if (row?.from === '/vault/backup' && Number(row?.status) === 200) errors.push('legacy-backup-reactivated');
    if (row?.from === '/eoncity-3d' && Number(row?.status) === 200) errors.push('retired-city-route-reactivated');
  }
  const activeRouteLifecycles = new Set(['live', 'local-first-builder', 'local-only', 'direct-babylon-city']);
  for (const requirement of W522_REQUIRED_CAPABILITY_LIFECYCLES) {
    const record = capabilities.find((entry) => entry?.id === requirement.id);
    if (!record || record.lifecycle !== requirement.lifecycle) errors.push(`capability-lifecycle-invalid:${requirement.id}`);
  }
  for (const record of capabilities) {
    if (!['blocked', 'retired'].includes(record?.lifecycle)) continue;
    const noActiveSurface = /^(?:No active surface|Archive only)$/i.test(String(record?.canonicalSurface || '').trim());
    if (!noActiveSurface) continue;
    for (const capabilityRoute of Array.isArray(record?.routes) ? record.routes : []) {
      const route = findRoute(capabilityRoute);
      if (route && Number(route.status) === 200 && activeRouteLifecycles.has(route.lifecycle)) errors.push(`blocked-or-retired-capability-has-active-route:${record.id}:${capabilityRoute}`);
    }
  }
  return Object.freeze(errors);
}
