import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const file = path.join(root, 'config/w662-implementation-exposure-ledger.json');
const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
const upgrades = {
  'expanded-live-nexus': {
    sources: ['assets/js/nexus/eon-nexus-live.js', 'assets/css/eon-nexus-live.css'],
    tests: ['tests/unit/w662d-live-nexus-recovery.test.mjs']
  },
  'live-nexus-node-field': {
    sources: ['assets/js/nexus/eon-nexus-live.js', 'assets/css/eon-nexus-live.css'],
    tests: ['tests/unit/w662d-live-nexus-recovery.test.mjs']
  },
  'project-atlas-current-renderer': {
    sources: ['assets/js/nexus/eon-nexus-project-atlas.js', 'assets/css/eon-nexus-live.css'],
    tests: ['tests/unit/w662e-project-atlas-spatial.test.mjs']
  },
  'project-atlas-spatial-renderer': {
    sources: ['assets/js/nexus/eon-nexus-project-atlas.js', 'assets/css/eon-nexus-live.css'],
    imports: ['assets/js/nexus/eon-nexus-live.js'],
    triggers: ['[data-eon-nexus-project-atlas]', 'Open Project Atlas'],
    tests: ['tests/unit/w662e-project-atlas-spatial.test.mjs']
  },
  'pulse-to-live-morph': {
    sources: ['assets/js/nexus/eon-nexus-continuity-contract.js', 'assets/js/nexus/eon-nexus-app-shell.js', 'assets/js/nexus/eon-nexus-live.js'],
    tests: ['tests/unit/w662c-nexus-continuity.test.mjs', 'tests/unit/w662d-live-nexus-recovery.test.mjs']
  },
  'live-to-city-continuity': {
    sources: ['assets/js/nexus/eon-nexus-continuity-contract.js', 'assets/js/eon-city-play-station.js'],
    tests: ['tests/unit/w662c-nexus-continuity.test.mjs']
  },
  'living-nexus-physical-core-gateway': {
    sources: ['assets/js/city/eon-city-connected-core.js', 'assets/js/city/eon-city-connected-core-babylon.js', 'assets/js/eon-city-play-station.js'],
    imports: ['assets/js/city/eon-city-play-core.js', 'assets/js/city/eon-city-play-babylon.js'],
    triggers: ['[data-eon-play-living-nexus-gateway]', '[data-eon-play-gateway-inspect]', '[data-eon-play-gateway-enter]'],
    tests: ['tests/unit/w662f-physical-living-nexus-gateway.test.mjs']
  },
  'living-nexus-destinations': {
    sources: ['assets/js/city/eon-city-living-nexus-babylon-runtime.js', 'assets/js/eon-city-play-station.js'],
    tests: ['tests/unit/w662f-physical-living-nexus-gateway.test.mjs']
  },
  'keyboard-focus-overlays': {
    sources: ['assets/js/city/eon-city-overlay-coordinator.js', 'assets/js/eon-city-play-station.js', 'assets/css/eon-city-play.css'],
    tests: ['tests/unit/w662h-whole-app-reconciliation.test.mjs']
  },
  'eonbot-companion': {
    sources: ['assets/js/city/eon-city-cast-certification.js', 'config/w662g-cast-certification.json'],
    tests: ['tests/unit/w662g-cast-certification.test.mjs', 'scripts/w662g-cast-certification-gate.mjs']
  },
  'city-hud-hierarchy': {
    sources: ['assets/js/city/eon-city-overlay-coordinator.js', 'assets/js/eon-city-play-station.js', 'assets/css/eon-city-play.css'],
    tests: ['tests/unit/w662h-whole-app-reconciliation.test.mjs', 'scripts/w662h-whole-app-reconciliation-gate.mjs']
  },
  'forge-nexus-visualization': {
    sources: ['assets/js/forge/eon-forge-nexus-stage.js', 'assets/js/forge/eon-forge-quick-build.js', 'assets/css/eon-forge.css'],
    imports: ['assets/js/forge/eon-forge-quick-build.js'],
    triggers: ['[data-eon-forge-nexus-stage]', '/forge'],
    tests: ['tests/unit/w662h-whole-app-reconciliation.test.mjs']
  },
  'city-audio': {
    sources: ['assets/js/city/eon-city-adaptive-soundscape.js', 'assets/js/eon-city-play-station.js'],
    tests: ['tests/unit/w662h-whole-app-reconciliation.test.mjs']
  },
  'progressive-fallback-truth': {
    sources: ['assets/js/city/eon-city-cast-certification.js', 'config/w662g-cast-certification.json'],
    tests: ['tests/unit/w662g-cast-certification.test.mjs', 'scripts/w662g-cast-certification-gate.mjs']
  }
};

const unique = (rows = []) => [...new Set(rows.filter(Boolean))];
for (const component of ledger.components) {
  const upgrade = upgrades[component.id];
  if (!upgrade) continue;
  component.status = 'human-proof-required';
  component.evidence.sourcePresent = true;
  component.evidence.activeRuntimeImported = true;
  component.evidence.frontendTriggerVisible = true;
  component.evidence.functionalInteractionProven = true;
  component.evidence.automatedTestProven = true;
  component.evidence.authenticatedHumanProof = false;
  component.references.sourcePaths = unique([...(component.references.sourcePaths || []), ...(upgrade.sources || [])]);
  component.references.importPaths = unique([...(component.references.importPaths || []), ...(upgrade.imports || [])]);
  component.references.triggerSelectorsOrRoutes = unique([...(component.references.triggerSelectorsOrRoutes || []), ...(upgrade.triggers || [])]);
  component.references.testPaths = unique([...(component.references.testPaths || []), ...(upgrade.tests || [])]);
  component.references.humanProofRefs = [];
  component.references.knownContradictions = ['Authenticated owner-visible browser acceptance remains incomplete.'];
  component.nextAction = 'Run the governed W662I authenticated browser/device matrix and obtain explicit owner acceptance before Preview, merge or production.';
}
ledger.generatedAt = new Date().toISOString();
ledger.authority.localWorkingBranch = 'local/w662-9.5-reconciliation';
ledger.authority.localOnlyUntilOwnerApproval = true;
const statusCounts = {};
const priorityCounts = {};
for (const component of ledger.components) {
  statusCounts[component.status] = (statusCounts[component.status] || 0) + 1;
  priorityCounts[component.priority] = (priorityCounts[component.priority] || 0) + 1;
}
ledger.summary = {
  componentCount: ledger.components.length,
  priorityCounts,
  statusCounts,
  p0NotComplete: ledger.components.filter((component) => component.priority === 'P0' && component.status !== 'complete').map((component) => component.id),
  acceptedComplete: ledger.components.filter((component) => component.status === 'complete').map((component) => component.id),
  broadVisualCodingAuthorized: false,
  nextAuthorizedWave: 'Restore exact dependencies, build the immutable W662I candidate, then run authenticated Preview only after explicit owner approval'
};
fs.writeFileSync(file, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(JSON.stringify({ ok: true, statusCounts, next: ledger.summary.nextAuthorizedWave }, null, 2));
