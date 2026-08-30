#!/usr/bin/env node
/** W377 source gate: institutional packs and explicit local workroom handoff only. */
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_APP_DECK_VERSION,
  getEonAppDeckBlueprint,
  listEonAppDeckCards,
  validateEonAppDeckCatalog
} from '../assets/js/apps/eon-app-deck-catalog.js';
import {
  OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS,
  OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS_W376,
  WORKFLOW_TEMPLATE_FAMILIES,
  getWorkflowTemplate
} from '../assets/js/utils/automation-workflow-engine.js';
import { inspectBlueprintWorkroomInput } from '../assets/js/apps/eon-blueprint-workroom-handoff.js';
import {
  W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_CONTRACT,
  validateW377InstitutionalBlueprintWorkroomsContract
} from '../config/w377-institutional-blueprint-workrooms-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');
const ensure = (condition, message) => assert.equal(Boolean(condition), true, message);

export function inspectW377InstitutionalBlueprintWorkrooms() {
  const checks = [];
  const check = (id, condition, detail) => {
    checks.push({ id, pass: Boolean(condition), detail });
    ensure(condition, `${id}: ${detail}`);
  };
  const blueprints = listEonAppDeckCards('blueprints');
  const localTemplates = WORKFLOW_TEMPLATE_FAMILIES.filter((template) => template.localOnly === true);
  const automationSource = read('assets/js/eon-automations-page.js');
  const workroomSource = read('assets/js/apps/eon-blueprint-workroom-handoff.js');
  const docs = read('docs/R4_W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_2026-06-26.md');

  check('contract-valid', validateW377InstitutionalBlueprintWorkroomsContract().length === 0, 'W377 contract has no internal drift');
  check('catalog-valid', validateEonAppDeckCatalog().length === 0, 'App Deck catalog remains complete and local-first');
  check('catalog-version-three', EON_APP_DECK_VERSION === 3, 'App Deck catalog is version 3 after institutional expansion');
  check('thirty-two-blueprints', blueprints.length === W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_CONTRACT.blueprintCount, 'thirty-two official Blueprint packs are present');
  check('w376-baseline-retained', blueprints.filter((card) => card.packVersion === '1.0.0').length === W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_CONTRACT.historicalW376BlueprintCount && OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS_W376.length === W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_CONTRACT.historicalW376WorkflowCount, 'the prior W376 catalog and template baseline remains available');
  check('institutional-pack-metadata', blueprints.every((card) => card.kind === 'official-blueprint' && W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_CONTRACT.blueprintPackVersions.includes(card.packVersion) && card.packSpec?.schema === 'eonapp.official-blueprint-pack.v1' && card.packSpec?.workroomEligible === true && Array.isArray(card.packSpec?.requiredInputs) && card.packSpec.requiredInputs.length >= 2 && Array.isArray(card.packSpec?.deliverables) && card.packSpec.deliverables.length >= 2 && Array.isArray(card.packSpec?.reviewCheckpoints) && card.packSpec.reviewCheckpoints.length >= 2), 'every Blueprint includes a versioned institutional pack specification');
  check('expanded-local-workflows', OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS.length === W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_CONTRACT.officialLocalWorkflowCount && localTemplates.length === W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_CONTRACT.officialLocalWorkflowCount, 'sixteen official local workflow templates are registered');
  check('template-safety', OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS.every((id) => {
    const template = getWorkflowTemplate(id);
    return template?.source === 'official-blueprint-pack' && template?.localOnly === true && template.steps.every((step) => step.providerId === 'local-runner') && template.steps.some((step) => step.type === 'approval');
  }), 'every official workroom workflow is local-runner-only and includes approval');
  check('workroom-input-validation', inspectBlueprintWorkroomInput(getEonAppDeckBlueprint('hospitality-service-playbook')).ok === true && inspectBlueprintWorkroomInput({ id: 'bad' }).ok === false, 'only official supported Blueprints may create a workroom');
  check('explicit-foreground-action', /data-create-blueprint-workroom/.test(automationSource) && /addEventListener\('click'/.test(automationSource) && /createBlueprintWorkroom/.test(automationSource), 'a selected Blueprint requires an explicit foreground click to create local records');
  check('local-record-handoff', /createProject/.test(workroomSource) && /createLibraryItem/.test(workroomSource) && /createWorkflowFromTemplate/.test(workroomSource) && /linkProjectAutomation/.test(workroomSource), 'the handoff creates linked local Project, Library and workflow records');
  check('no-network-or-external-runtime', !/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|navigator\.sendBeacon|window\.open)\b/.test(workroomSource), 'workroom handoff introduces no network or external runtime API');
  check('no-commerce-or-entitlement-activation', /checkoutActive: false/.test(workroomSource) && /entitlementActive: false/.test(workroomSource) && !/createCheckout|openCheckout|startSubscription|grantEntitlement|paymentSuccess|merchantWebhook/i.test(workroomSource), 'workroom handoff cannot activate checkout, membership or entitlements');
  check('documentation-present', existsSync(path.join(ROOT, 'docs/R4_W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_2026-06-26.md')) && /32 official Blueprints/.test(docs) && /No provider request/i.test(docs), 'scope and product boundaries are documented');
  return Object.freeze({
    wave: W377_INSTITUTIONAL_BLUEPRINT_WORKROOMS_CONTRACT.wave,
    status: 'pass',
    checkCount: checks.length,
    checks,
    blueprintCount: blueprints.length,
    localWorkflowTemplateCount: OFFICIAL_LOCAL_WORKFLOW_TEMPLATE_IDS.length,
    limitations: Object.freeze([
      'Source and unit verification only.',
      'No provider connection, account connection, publishing, checkout, subscription, entitlement, background job, merchant onboarding, browser/device proof or Cloudflare deployment was performed.'
    ])
  });
}

export function runW377InstitutionalBlueprintWorkroomsGate({ writeArtifact = true } = {}) {
  const report = inspectW377InstitutionalBlueprintWorkrooms();
  if (writeArtifact) {
    const directory = path.join(ROOT, 'artifacts', 'w377-institutional-blueprint-workrooms-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runW377InstitutionalBlueprintWorkroomsGate();
  process.stdout.write(`W377 Institutional Blueprints gate passed (${report.checkCount}/${report.checkCount}).\n`);
}
