import assert from 'node:assert/strict';
import test from 'node:test';
import { getEonAppDeckBlueprint, listEonAppDeckCards } from '../../assets/js/apps/eon-app-deck-catalog.js';
import { createBlueprintWorkroom } from '../../assets/js/apps/eon-blueprint-workroom-handoff.js';
import { loadLibrary, loadProjects } from '../../assets/js/utils/eon-workspace-store.js';
import { loadAutomationState } from '../../assets/js/utils/automation-os-store.js';
import { OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS } from '../../assets/js/utils/automation-workflow-engine.js';
import { inspectW377InstitutionalBlueprintWorkrooms } from '../../scripts/w377-institutional-blueprint-workrooms-gate.mjs';
import {
  W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_CONTRACT,
  validateW377InstitutionalBlueprintWorkroomsContract
} from '../../config/w377-institutional-blueprint-workrooms-contract.mjs';

function memoryStorage() {
  const values = new Map();
  return Object.freeze({
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  });
}

test('W377 ships institutional metadata on 32 local official Blueprint packs', () => {
  const cards = listEonAppDeckCards('blueprints');
  assert.equal(cards.length, W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_CONTRACT.blueprintCount);
  assert.equal(cards.filter((card) => card.packVersion === '1.1.0').length, 12);
  for (const card of cards) {
    assert.equal(card.packSpec.workroomEligible, true);
    assert.ok(card.packSpec.requiredInputs.length >= 2);
    assert.ok(card.packSpec.deliverables.length >= 2);
    assert.ok(card.packSpec.reviewCheckpoints.length >= 2);
    assert.equal(card.checkoutActive, false);
    assert.equal(card.entitlementActive, false);
  }
  assert.deepEqual(validateW377InstitutionalBlueprintWorkroomsContract(), []);
});

test('W377 creates a Project, Library template and local approval-first workflow only after explicit helper use', () => {
  const storage = memoryStorage();
  const previousStorage = globalThis.localStorage;
  globalThis.localStorage = storage;
  try {
    const blueprint = getEonAppDeckBlueprint('hospitality-service-playbook');
    const receipt = createBlueprintWorkroom({ blueprint, storage });
    const projects = loadProjects({ storage }).projects;
    const library = loadLibrary({ storage }).items;
    const automation = loadAutomationState();
    assert.equal(receipt.created, true);
    assert.equal(receipt.localOnly, true);
    assert.equal(receipt.providerCallActive, false);
    assert.equal(receipt.externalExecutionActive, false);
    assert.equal(receipt.checkoutActive, false);
    assert.equal(receipt.entitlementActive, false);
    const project = projects.find((item) => item.id === receipt.projectId);
    const template = library.find((item) => item.id === receipt.libraryItemId);
    const workflow = automation.workflows.find((item) => item.id === receipt.workflowId);
    assert.ok(project);
    assert.ok(template);
    assert.ok(workflow);
    assert.equal(project.automationIds.includes(workflow.id), true);
    assert.equal(OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS.includes(workflow.family), true);
    assert.equal(workflow.steps.every((step) => step.providerId === 'local-runner'), true);
    assert.equal(workflow.steps.some((step) => step.type === 'approval'), true);
  } finally {
    globalThis.localStorage = previousStorage;
  }
});

test('W377 source gate preserves local, non-commercial and non-executing boundaries', () => {
  const report = inspectW377InstitutionalBlueprintWorkrooms();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 12);
  assert.match(report.limitations.join(' '), /No provider connection/i);
});
