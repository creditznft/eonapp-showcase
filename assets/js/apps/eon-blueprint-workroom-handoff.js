/**
 * W377 — explicit Blueprint → local Project, Library and Automation workroom handoff.
 *
 * A workroom is created only after a foreground user tap. It writes ordinary,
 * user-owned local records in the existing Workspace and Automation stores.
 * It does not connect an account, call a provider, publish, collect money,
 * grant an entitlement or start background work.
 */

import {
  addProjectArtifact,
  addProjectTask,
  createLibraryItem,
  createProject,
  linkProjectAutomation
} from '../utils/eon-workspace-store.js';
import {
  OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS,
  createWorkflowFromTemplate
} from '../utils/automation-workflow-engine.js';
import { appendAutomationAudit, upsertWorkflow } from '../utils/automation-os-store.js';

export const EON_BLUEPRINT_WORKROOM_SCHEMA = 'eonapp.blueprint-workroom.v1';

function plainText(value = '', max = 1200) {
  return String(value || '').replaceAll('\u0000', '').trim().slice(0, max);
}

function validBlueprint(blueprint = {}) {
  return Boolean(
    blueprint &&
    blueprint.kind === 'official-blueprint' &&
    blueprint.packSpec?.workroomEligible === true &&
    OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS.includes(String(blueprint.workflowTemplateId || ''))
  );
}

function packTemplateText(blueprint) {
  const spec = blueprint.packSpec || {};
  const list = (items = []) => Array.isArray(items) ? items.map((item) => `- ${plainText(item, 300)}`).join('\n') : '';
  return [
    `# ${plainText(blueprint.label, 180)}`,
    '',
    `Pack version: ${plainText(blueprint.packVersion, 40)}`,
    '',
    '## Required inputs',
    list(spec.requiredInputs),
    '',
    '## Deliverables',
    list(spec.deliverables),
    '',
    '## Review checkpoints',
    list(spec.reviewCheckpoints),
    '',
    '## Privacy boundary',
    plainText(spec.privacyBoundary, 500),
    '',
    '## Change notes',
    plainText(spec.changeNotes, 500)
  ].join('\n').trim();
}

export function inspectBlueprintWorkroomInput(blueprint = {}) {
  if (!validBlueprint(blueprint)) {
    return Object.freeze({ ok: false, reason: 'unsupported-blueprint', message: 'Choose an official Blueprint with an approved local workflow template.' });
  }
  return Object.freeze({ ok: true, reason: '', message: '' });
}

export function createBlueprintWorkroom({ blueprint, storage } = {}) {
  const check = inspectBlueprintWorkroomInput(blueprint);
  if (!check.ok) throw new Error(check.message);

  const title = `Blueprint — ${plainText(blueprint.label, 140)}`;
  const summary = `${plainText(blueprint.summary, 900)} This is an explicit local workroom created from the official ${plainText(blueprint.packVersion, 40)} pack.`;
  const project = createProject({ title, summary, status: 'active' }, { storage });
  const checkpoints = Array.isArray(blueprint.packSpec?.reviewCheckpoints) ? blueprint.packSpec.reviewCheckpoints : [];
  const deliverables = Array.isArray(blueprint.packSpec?.deliverables) ? blueprint.packSpec.deliverables : [];

  addProjectTask(project.id, { title: 'Confirm required inputs and scope', note: plainText((blueprint.packSpec?.requiredInputs || []).join(' · '), 1800) }, { storage });
  checkpoints.slice(0, 3).forEach((item) => addProjectTask(project.id, { title: plainText(item, 180), note: 'Review manually before choosing any external action.' }, { storage }));
  addProjectArtifact(project.id, {
    type: 'brief',
    title: `${plainText(blueprint.label, 130)} — local brief`,
    content: `${plainText(blueprint.automationGoal, 3000)}\n\nExpected deliverables:\n${deliverables.map((item) => `- ${plainText(item, 280)}`).join('\n')}`
  }, { storage });

  const libraryItem = createLibraryItem({
    type: 'template',
    title: `${plainText(blueprint.label, 130)} — official local template`,
    content: packTemplateText(blueprint),
    tags: ['official-blueprint', plainText(blueprint.packFamily, 48), `v${plainText(blueprint.packVersion, 20)}`, 'local-only']
  }, { storage });

  const draft = createWorkflowFromTemplate(blueprint.workflowTemplateId, {
    name: `${plainText(blueprint.label, 150)} — local workflow`,
    description: plainText(blueprint.automationGoal || blueprint.summary, 1100),
    planner: 'official-blueprint-workroom'
  });
  const saved = upsertWorkflow({ ...draft, projectId: project.id, planner: 'official-blueprint-workroom' });
  linkProjectAutomation(project.id, saved.workflow.id, { storage });
  appendAutomationAudit({
    type: 'blueprint-workroom-created',
    workflowId: saved.workflow.id,
    status: 'draft',
    message: `Local Project, Library template and approval-first workflow created from ${plainText(blueprint.label, 180)}. No provider action followed.`,
    metadata: { blueprintId: blueprint.id, packVersion: blueprint.packVersion, projectId: project.id, libraryItemId: libraryItem.id }
  });

  return Object.freeze({
    schema: EON_BLUEPRINT_WORKROOM_SCHEMA,
    created: true,
    blueprintId: blueprint.id,
    packVersion: blueprint.packVersion,
    projectId: project.id,
    libraryItemId: libraryItem.id,
    workflowId: saved.workflow.id,
    localOnly: true,
    providerCallActive: false,
    externalExecutionActive: false,
    checkoutActive: false,
    entitlementActive: false
  });
}

export const __blueprintWorkroomInternals = Object.freeze({ validBlueprint, packTemplateText });
