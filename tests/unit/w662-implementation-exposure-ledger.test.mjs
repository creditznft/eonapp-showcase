import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  loadW662ImplementationExposureLedger,
  validateW662ImplementationExposureLedger
} from '../../scripts/w662-implementation-exposure-ledger-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ledgerPath = path.join(root, 'config', 'w662-implementation-exposure-ledger.json');
const ledger = loadW662ImplementationExposureLedger(ledgerPath);
const byId = new Map(ledger.components.map((component) => [component.id, component]));

test('W662 implementation/exposure ledger validates against the governed production tree', () => {
  const result = validateW662ImplementationExposureLedger(ledger, { rootDirectory: root });
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.summary.componentCount, 31);
  assert.deepEqual(result.summary.priorityCounts, { P1: 24, P0: 7 });
  assert.deepEqual(result.summary.statusCounts, {
    'human-proof-required': 29,
    complete: 2
  });
});

test('ledger does not confuse source presence with completion', () => {
  for (const component of ledger.components) {
    if (component.status !== 'complete') continue;
    for (const [field, value] of Object.entries(component.evidence)) {
      assert.equal(value, true, `${component.id} complete without ${field}`);
    }
    assert.deepEqual(component.references.knownContradictions, [], `${component.id} complete with contradiction`);
  }
  assert.deepEqual(ledger.summary.acceptedComplete, [
    'short-tap-release-lifecycle',
    'release-provenance'
  ]);
});

test('implemented controls remain human-proof-required instead of being overclaimed complete', () => {
  const controls = byId.get('camera-relative-controls');
  assert.equal(controls?.status, 'human-proof-required');
  assert.equal(controls?.evidence.activeRuntimeImported, true);
  assert.equal(controls?.evidence.functionalInteractionProven, true);
  assert.equal(controls?.evidence.automatedTestProven, true);
  assert.equal(controls?.evidence.authenticatedHumanProof, false);
  assert.ok(controls?.references.sourcePaths.includes('assets/js/city/eon-city-camera-relative-movement.js'));
  assert.ok(controls?.references.testPaths.includes('tests/unit/w662-camera-relative-movement.test.mjs'));

  for (const id of [
    'project-atlas-current-renderer',
    'project-atlas-spatial-renderer',
    'living-nexus-physical-core-gateway',
    'living-nexus-destinations'
  ]) {
    const component = byId.get(id);
    assert.equal(component?.status, 'human-proof-required', `${id} must await authenticated human proof`);
    assert.equal(component?.evidence.sourcePresent, true);
    assert.equal(component?.evidence.activeRuntimeImported, true);
    assert.equal(component?.evidence.frontendTriggerVisible, true);
    assert.equal(component?.evidence.functionalInteractionProven, true);
    assert.equal(component?.evidence.automatedTestProven, true);
    assert.equal(component?.evidence.authenticatedHumanProof, false);
  }
});

test('W661E short-tap lifecycle and production release authority remain protected', () => {
  const lifecycle = byId.get('short-tap-release-lifecycle');
  assert.equal(lifecycle?.status, 'complete');
  assert.ok(lifecycle.references.testPaths.includes('tests/unit/w661e-frame-safe-pulse.test.mjs'));

  assert.equal(ledger.authority.productionSourceCommit, '063552ccc72b21cb1b8c73512039d29d4dff58cf');
  assert.equal(ledger.authority.productionDeployment, '57758b16-f1a9-476c-855b-5d3de8f1444c');
  assert.equal(ledger.authority.workingBranch, 'agent/w662-nexus-city-reconciliation');
  assert.equal(ledger.authority.draftPullRequest, 42);
  assert.equal(ledger.authority.historicalDraftPullRequest, 39);
  assert.equal(ledger.authority.noMergeWithoutOwnerApproval, true);
  assert.equal(ledger.authority.noProductionChangeBeforeGovernedPreview, true);
  assert.equal(ledger.authority.localWorkingBranch, 'local/w662-9.5-reconciliation');
  assert.equal(ledger.authority.localOnlyUntilOwnerApproval, true);
  assert.equal(ledger.summary.broadVisualCodingAuthorized, false);
  assert.match(ledger.summary.nextAuthorizedWave, /Restore exact dependencies, build the immutable W662I candidate/i);
  assert.match(ledger.summary.nextAuthorizedWave, /authenticated Preview only after explicit owner approval/i);
});

test('ledger source and automated references point to present repository files', () => {
  const missing = [];
  for (const component of ledger.components) {
    for (const field of ['sourcePaths', 'testPaths']) {
      for (const reference of component.references[field]) {
        if (!reference || reference.includes(' ') || reference.includes('://') || reference.startsWith('/')) continue;
        if (!/^[A-Za-z0-9._/-]+$/.test(reference)) continue;
        if (!fs.existsSync(path.join(root, reference))) missing.push(`${component.id}:${field}:${reference}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});
