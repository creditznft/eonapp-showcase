#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const W662_LEDGER_SCHEMA = 'eonapp.w662.implementation-exposure-ledger.2026-07-23.v1';
export const W662_ALLOWED_STATUSES = Object.freeze([
  'complete',
  'present-hidden',
  'present-shallow',
  'wired-broken',
  'planned-only',
  'superseded',
  'human-proof-required'
]);
export const W662_EVIDENCE_FIELDS = Object.freeze([
  'sourcePresent',
  'activeRuntimeImported',
  'frontendTriggerVisible',
  'functionalInteractionProven',
  'automatedTestProven',
  'authenticatedHumanProof'
]);

const modulePath = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(modulePath), '..');
const defaultLedgerPath = path.join(root, 'config', 'w662-implementation-exposure-ledger.json');
const defaultReceiptPath = path.join(root, 'reports', 'w662-implementation-exposure-ledger', 'receipt.json');

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isRepositoryPath(value = '') {
  const text = String(value || '').trim();
  return Boolean(text)
    && !text.includes(' ')
    && !text.includes('://')
    && !text.startsWith('/')
    && !text.startsWith('#')
    && /^[A-Za-z0-9._/-]+$/.test(text);
}

function pushReferenceErrors(errors, component, rootDirectory) {
  const refs = component.references;
  const checks = [
    ['sourcePaths', component.evidence.sourcePresent],
    ['importPaths', component.evidence.activeRuntimeImported],
    ['triggerSelectorsOrRoutes', component.evidence.frontendTriggerVisible],
    ['testPaths', component.evidence.automatedTestProven],
    ['humanProofRefs', component.evidence.authenticatedHumanProof],
    ['knownContradictions', false]
  ];

  for (const [field, required] of checks) {
    if (!Array.isArray(refs?.[field])) {
      errors.push(`${component.id}:references.${field}:not-array`);
      continue;
    }
    if (required && refs[field].length === 0) errors.push(`${component.id}:references.${field}:required`);
  }

  for (const field of ['sourcePaths', 'testPaths']) {
    for (const reference of Array.isArray(refs?.[field]) ? refs[field] : []) {
      if (!isRepositoryPath(reference)) continue;
      if (!fs.existsSync(path.join(rootDirectory, reference))) {
        errors.push(`${component.id}:missing-${field}:${reference}`);
      }
    }
  }
}

export function validateW662ImplementationExposureLedger(ledger, {
  rootDirectory = root
} = {}) {
  const errors = [];
  const warnings = [];

  if (!isObject(ledger)) {
    return Object.freeze({ ok: false, errors: Object.freeze(['ledger:not-object']), warnings: Object.freeze([]), summary: null });
  }
  if (ledger.schema !== W662_LEDGER_SCHEMA) errors.push(`schema:${ledger.schema || 'missing'}`);
  if (!isObject(ledger.authority)) errors.push('authority:not-object');
  if (ledger.authority?.productionSourceCommit !== '063552ccc72b21cb1b8c73512039d29d4dff58cf') errors.push('authority:production-source-mismatch');
  if (ledger.authority?.productionDeployment !== '57758b16-f1a9-476c-855b-5d3de8f1444c') errors.push('authority:production-deployment-mismatch');
  if (ledger.authority?.workingBranch !== 'agent/w662-nexus-city-reconciliation') errors.push('authority:working-branch-mismatch');
  if (ledger.authority?.draftPullRequest !== 42) errors.push('authority:draft-pr-mismatch');
  if (ledger.authority?.historicalDraftPullRequest !== 39) errors.push('authority:historical-pr-mismatch');
  if (ledger.authority?.noMergeWithoutOwnerApproval !== true) errors.push('authority:no-merge-boundary-missing');
  if (ledger.authority?.noProductionChangeBeforeGovernedPreview !== true) errors.push('authority:preview-boundary-missing');

  const components = Array.isArray(ledger.components) ? ledger.components : [];
  const requiredIds = Array.isArray(ledger.requiredComponentIds) ? ledger.requiredComponentIds : [];
  if (!components.length) errors.push('components:empty');
  if (!requiredIds.length) errors.push('required-component-ids:empty');

  const seen = new Set();
  const statusCounts = {};
  const priorityCounts = {};

  for (const component of components) {
    if (!isObject(component)) {
      errors.push('component:not-object');
      continue;
    }
    const id = String(component.id || '').trim();
    if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(id)) errors.push(`component:invalid-id:${id || 'missing'}`);
    if (seen.has(id)) errors.push(`component:duplicate-id:${id}`);
    seen.add(id);

    if (!['P0', 'P1', 'P2'].includes(component.priority)) errors.push(`${id}:priority:${component.priority || 'missing'}`);
    if (!W662_ALLOWED_STATUSES.includes(component.status)) errors.push(`${id}:status:${component.status || 'missing'}`);
    if (!isObject(component.evidence)) {
      errors.push(`${id}:evidence:not-object`);
      continue;
    }
    for (const field of W662_EVIDENCE_FIELDS) {
      if (typeof component.evidence[field] !== 'boolean') errors.push(`${id}:evidence.${field}:not-boolean`);
    }
    if (!isObject(component.references)) errors.push(`${id}:references:not-object`);
    else pushReferenceErrors(errors, component, rootDirectory);

    const contradictions = Array.isArray(component.references?.knownContradictions)
      ? component.references.knownContradictions
      : [];
    if (component.status === 'complete') {
      for (const field of W662_EVIDENCE_FIELDS) {
        if (component.evidence[field] !== true) errors.push(`${id}:complete-without-${field}`);
      }
      if (contradictions.length) errors.push(`${id}:complete-with-contradiction`);
    }
    if (component.status === 'planned-only' && (
      component.evidence.sourcePresent
      || component.evidence.activeRuntimeImported
      || component.evidence.frontendTriggerVisible
      || component.evidence.functionalInteractionProven
    )) {
      errors.push(`${id}:planned-only-has-active-evidence`);
    }
    if (component.status === 'wired-broken' && !component.evidence.activeRuntimeImported) {
      errors.push(`${id}:wired-broken-without-runtime`);
    }
    if (component.status === 'present-hidden' && component.evidence.frontendTriggerVisible) {
      warnings.push(`${id}:present-hidden-but-trigger-visible`);
    }
    if (!String(component.nextAction || '').trim()) errors.push(`${id}:next-action-missing`);

    statusCounts[component.status] = (statusCounts[component.status] || 0) + 1;
    priorityCounts[component.priority] = (priorityCounts[component.priority] || 0) + 1;
  }

  for (const id of requiredIds) {
    if (!seen.has(id)) errors.push(`required-component-missing:${id}`);
  }
  if (requiredIds.length !== new Set(requiredIds).size) errors.push('required-component-ids:duplicates');
  if (requiredIds.length !== components.length) errors.push(`required-component-count:${requiredIds.length}:${components.length}`);

  const computedSummary = {
    componentCount: components.length,
    priorityCounts,
    statusCounts,
    p0NotComplete: components.filter((component) => component.priority === 'P0' && component.status !== 'complete').map((component) => component.id),
    acceptedComplete: components.filter((component) => component.status === 'complete').map((component) => component.id)
  };
  if (JSON.stringify(ledger.summary?.priorityCounts || {}) !== JSON.stringify(priorityCounts)) errors.push('summary:priority-counts-mismatch');
  if (JSON.stringify(ledger.summary?.statusCounts || {}) !== JSON.stringify(statusCounts)) errors.push('summary:status-counts-mismatch');
  if (Number(ledger.summary?.componentCount) !== components.length) errors.push('summary:component-count-mismatch');
  if (ledger.summary?.broadVisualCodingAuthorized !== false) errors.push('summary:broad-visual-coding-must-remain-false');
  if (!computedSummary.p0NotComplete.includes('camera-relative-controls')) errors.push('summary:camera-relative-controls-not-blocking');
  if (!computedSummary.acceptedComplete.includes('short-tap-release-lifecycle')) errors.push('summary:short-tap-lifecycle-not-preserved');

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    warnings: Object.freeze(warnings),
    summary: Object.freeze(computedSummary)
  });
}

export function loadW662ImplementationExposureLedger(filePath = defaultLedgerPath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function runW662ImplementationExposureLedgerGate({
  rootDirectory = root,
  ledgerPath = defaultLedgerPath,
  receiptPath = defaultReceiptPath
} = {}) {
  const ledger = loadW662ImplementationExposureLedger(ledgerPath);
  const result = validateW662ImplementationExposureLedger(ledger, { rootDirectory });
  const receipt = {
    schema: 'eonapp.w662.implementation-exposure-ledger.receipt.2026-07-23.v1',
    generatedAt: new Date().toISOString(),
    sourceLedger: path.relative(rootDirectory, ledgerPath).replaceAll(path.sep, '/'),
    productionSourceCommit: ledger.authority?.productionSourceCommit || '',
    workingBranch: ledger.authority?.workingBranch || '',
    draftPullRequest: ledger.authority?.draftPullRequest || null,
    ok: result.ok,
    errors: result.errors,
    warnings: result.warnings,
    summary: result.summary
  };
  fs.mkdirSync(path.dirname(receiptPath), { recursive: true });
  fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  return Object.freeze({ ...result, receiptPath });
}

if (path.resolve(process.argv[1] || '') === modulePath) {
  const result = runW662ImplementationExposureLedgerGate();
  if (!result.ok) {
    console.error('[w662-ledger] FAIL');
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`[w662-ledger] PASS: ${result.summary.componentCount} components validated.`);
    for (const [status, count] of Object.entries(result.summary.statusCounts)) {
      console.log(`- ${status}: ${count}`);
    }
    if (result.warnings.length) {
      console.warn('[w662-ledger] warnings:');
      for (const warning of result.warnings) console.warn(`- ${warning}`);
    }
  }
}
