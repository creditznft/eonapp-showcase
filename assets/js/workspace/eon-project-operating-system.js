/**
 * W631 — local Projects, Workspace, Forge and Automations operating contract.
 *
 * This layer records ordinary project continuity and review state. It does not
 * pretend that a schedule, GitHub connection, deployment, or remote automation
 * ran unless a permissioned executor returns a verifiable receipt.
 */

import { loadProjects } from '../utils/eon-workspace-store.js';
import { EON_PROJECT_REGISTRY_STORAGE_KEY, registerProjectSource } from '../projects/eon-project-registry.js';
import { evaluateEonCapacity } from '../storage/eon-capacity-authority.js';
import { captureEonStorageSnapshot, restoreEonStorageSnapshot } from '../storage/eon-storage-transaction.js';
import { saveActiveProjectContext } from '../shell/eon-whole-app-ux.js';

export const EON_W631_SCHEMA = 'eon.project-operating-system.w631.v1';
export const EON_W631_STORAGE_KEY = 'eon:project-operating-system:w631:v1';

export const EON_W631_FORGE_STATES = Object.freeze(['draft', 'previewed', 'reviewed', 'exported', 'deploy-prepared', 'deployed']);
export const EON_W631_AUTOMATION_STATES = Object.freeze(['draft', 'review', 'scheduled', 'paused', 'running', 'succeeded', 'failed', 'cancelled']);

const MAX_HISTORY = 200;
const SECRET_PATTERN = /(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|password|passphrase|private[_ -]?key|seed phrase|mnemonic|authorization)\s*[:=]/i;

function escapeMarkup(value = '') {
  return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function storageRef(options = {}) {
  if (options.storage) return options.storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function nowIso(options = {}) {
  return String(options.now || new Date().toISOString());
}

function clean(value = '', limit = 300) {
  const text = Array.from(String(value || '')).filter((character) => {
    const code = character.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('').replace(/\s+/g, ' ').trim().slice(0, limit);
  if (SECRET_PATTERN.test(text)) throw new Error('Project records cannot contain credentials or recovery material.');
  return text;
}

function identifier(prefix = 'record') {
  try { if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`; } catch {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function emptyState(options = {}) {
  const timestamp = nowIso(options);
  return { schema: EON_W631_SCHEMA, createdAt: timestamp, updatedAt: timestamp, projects: {}, automations: {} };
}

function normalizeVersion(input = {}) {
  return Object.freeze({
    id: clean(input.id || identifier('version'), 140),
    label: clean(input.label || 'Saved version', 120),
    summary: clean(input.summary, 600),
    source: ['projects', 'workspace', 'forge', 'create', 'city', 'library'].includes(input.source) ? input.source : 'projects',
    createdAt: String(input.createdAt || new Date().toISOString()),
    remoteEffectClaimed: false
  });
}

function normalizeOutcome(input = {}) {
  return Object.freeze({
    id: clean(input.id || identifier('outcome'), 140),
    title: clean(input.title || 'Project outcome', 160),
    detail: clean(input.detail, 800),
    status: ['planned', 'in-progress', 'complete', 'blocked'].includes(input.status) ? input.status : 'planned',
    evidenceKind: ['local-record', 'export-receipt', 'provider-receipt', 'deployment-receipt'].includes(input.evidenceKind) ? input.evidenceKind : 'local-record',
    evidenceId: clean(input.evidenceId, 160),
    createdAt: String(input.createdAt || new Date().toISOString())
  });
}

function normalizeProjectRecord(input = {}) {
  return {
    projectId: clean(input.projectId, 140),
    title: clean(input.title || 'Active project', 180),
    outcome: clean(input.outcome, 400),
    continueRoute: ['/projects', '/workspace', '/forge', '/create', '/eoncity', '/library'].includes(input.continueRoute) ? input.continueRoute : '/projects',
    lifecycleState: input.lifecycleState === 'archived' || ['complete', 'completed', 'archived'].includes(String(input.status || input.operationalStatus || '').toLowerCase()) ? 'archived' : 'active',
    versions: (Array.isArray(input.versions) ? input.versions : []).map(normalizeVersion),
    outcomes: (Array.isArray(input.outcomes) ? input.outcomes : []).map(normalizeOutcome),
    updatedAt: String(input.updatedAt || new Date().toISOString())
  };
}

function normalizeAutomation(input = {}) {
  return {
    automationId: clean(input.automationId, 140),
    projectId: clean(input.projectId, 140),
    title: clean(input.title || 'Automation draft', 180),
    state: EON_W631_AUTOMATION_STATES.includes(input.state) ? input.state : 'draft',
    schedule: input.schedule && typeof input.schedule === 'object' ? {
      kind: ['one-time', 'recurring', 'manual'].includes(input.schedule.kind) ? input.schedule.kind : 'manual',
      expression: clean(input.schedule.expression, 220),
      timezone: clean(input.schedule.timezone || 'local', 80),
      preparedOnly: true
    } : null,
    history: (Array.isArray(input.history) ? input.history : []).map((entry) => ({
      id: clean(entry.id || identifier('run'), 140),
      state: EON_W631_AUTOMATION_STATES.includes(entry.state) ? entry.state : 'draft',
      at: String(entry.at || new Date().toISOString()),
      receiptId: clean(entry.receiptId, 180),
      message: clean(entry.message, 300),
      credentialIncluded: false,
      rawPayloadIncluded: false
    })),
    updatedAt: String(input.updatedAt || new Date().toISOString())
  };
}

export function loadW631State(options = {}) {
  const storage = storageRef(options);
  let parsed = null;
  try { parsed = JSON.parse(String(storage?.getItem?.(EON_W631_STORAGE_KEY) || 'null')); } catch {}
  const base = emptyState(options);
  const source = parsed && typeof parsed === 'object' ? parsed : base;
  const projects = {};
  Object.values(source.projects || {}).forEach((entry) => {
    const record = normalizeProjectRecord(entry);
    if (record.projectId) projects[record.projectId] = record;
  });
  const automations = {};
  Object.values(source.automations || {}).forEach((entry) => {
    const record = normalizeAutomation(entry);
    if (record.automationId) automations[record.automationId] = record;
  });
  return { ...base, ...source, schema: EON_W631_SCHEMA, projects, automations };
}

function persistW631State(state, options = {}) {
  const target = storageRef(options);
  if (!target?.setItem || !target?.getItem) return Object.freeze({ ok: false, reason: 'storage-unavailable' });
  const next = { ...state, schema: EON_W631_SCHEMA, updatedAt: nowIso(options) };
  const serialized = JSON.stringify(next);
  try {
    target.setItem(EON_W631_STORAGE_KEY, serialized);
    if (target.getItem(EON_W631_STORAGE_KEY) !== serialized) return Object.freeze({ ok: false, reason: 'write-verification-failed' });
  } catch (error) {
    return Object.freeze({ ok: false, reason: 'storage-write-failed', message: String(error?.message || error).slice(0, 220) });
  }
  try { globalThis.document?.dispatchEvent?.(new CustomEvent('eon:w631-state-changed', { detail: { updatedAt: next.updatedAt } })); } catch {}
  return Object.freeze({ ok: true, state: next });
}

function w631ProjectCapacityCounts(projects = {}) {
  const records = Object.values(projects || {});
  const archivedCount = records.filter((record) => record.lifecycleState === 'archived').length;
  return Object.freeze({ activeCount: records.length - archivedCount, archivedCount, totalCount: records.length });
}

function w631StorageTransaction(options = {}) {
  return captureEonStorageSnapshot([EON_W631_STORAGE_KEY, EON_PROJECT_REGISTRY_STORAGE_KEY], options);
}

export function syncProjectOperatingRecord(project = {}, options = {}) {
  const projectId = clean(project.id || project.projectId, 140);
  if (!projectId) return Object.freeze({ ok: false, reason: 'project-id-required' });
  const state = loadW631State(options);
  const previousRecord = state.projects[projectId] || null;
  const nextLifecycle = project.lifecycleState === 'archived' || ['complete', 'completed', 'archived'].includes(String(project.status || '').toLowerCase()) ? 'archived' : 'active';
  const reactivating = previousRecord?.lifecycleState === 'archived' && nextLifecycle === 'active';
  const counts = w631ProjectCapacityCounts(state.projects);
  const capacity = evaluateEonCapacity({
    resourceId: 'w631-projects',
    ...counts,
    existing: Boolean(previousRecord) && !reactivating,
    requestedCount: nextLifecycle === 'active' && (!previousRecord || reactivating) ? 1 : 0,
    requestedTotalCount: previousRecord ? 0 : 1
  }, options);
  if (!capacity.allowed) return Object.freeze({ ok: false, reason: 'capacity-reached', capacity });
  const current = normalizeProjectRecord(previousRecord || { projectId });
  const record = normalizeProjectRecord({
    ...current,
    projectId,
    title: project.title || current.title,
    outcome: project.summary || project.outcome || current.outcome,
    continueRoute: options.continueRoute || current.continueRoute,
    lifecycleState: nextLifecycle,
    updatedAt: nowIso(options)
  });
  const transaction = w631StorageTransaction(options);
  if (!transaction.ok) return Object.freeze({ ok: false, reason: transaction.reason });
  state.projects[projectId] = record;
  const persisted = persistW631State(state, options);
  if (!persisted.ok) {
    restoreEonStorageSnapshot(transaction, options);
    return Object.freeze({ ok: false, reason: persisted.reason });
  }
  const registered = registerProjectSource({
    namespace: 'w631',
    sourceId: projectId,
    projectId,
    preserveSourceId: true,
    storageKey: EON_W631_STORAGE_KEY,
    sourceSchema: EON_W631_SCHEMA,
    relation: 'continuity',
    title: record.title,
    summary: record.outcome,
    lifecycleState: record.lifecycleState,
    operationalStatus: record.lifecycleState,
    updatedAt: record.updatedAt,
    continueDestination: record.continueRoute === '/forge' ? 'forge' : record.continueRoute === '/create' ? 'create' : 'projects'
  }, { ...options, emit: false });
  if (!registered.ok) {
    restoreEonStorageSnapshot(transaction, options);
    return Object.freeze({ ok: false, reason: 'project-registry-write-failed', registryReason: registered.reason });
  }
  saveActiveProjectContext({ projectId, projectTitle: record.title, outcome: record.outcome, route: record.continueRoute }, options);
  return Object.freeze({ ok: true, record: Object.freeze(record), capacity });
}

export function setW631ProjectLifecycle(projectId = '', lifecycleState = 'active', options = {}) {
  const state = loadW631State(options);
  const current = state.projects[clean(projectId, 140)];
  if (!current) return Object.freeze({ ok: false, reason: 'project-not-found' });
  return syncProjectOperatingRecord({ ...current, id: current.projectId, lifecycleState }, { ...options, continueRoute: current.continueRoute });
}

export function createProjectVersion(projectId = '', input = {}, options = {}) {
  const state = loadW631State(options);
  const current = state.projects[clean(projectId, 140)];
  if (!current) return Object.freeze({ ok: false, reason: 'project-not-found' });
  const capacity = evaluateEonCapacity({ resourceId: 'w631-versions', currentCount: current.versions.length }, options);
  if (!capacity.allowed) return Object.freeze({ ok: false, reason: 'capacity-reached', capacity });
  const version = normalizeVersion({ ...input, createdAt: nowIso(options) });
  const record = normalizeProjectRecord({ ...current, versions: [version, ...current.versions], updatedAt: nowIso(options) });
  state.projects[current.projectId] = record;
  const persisted = persistW631State(state, options);
  if (!persisted.ok) return Object.freeze({ ok: false, reason: persisted.reason });
  return Object.freeze({ ok: true, version, record: Object.freeze(record) });
}

export function recordProjectOutcome(projectId = '', input = {}, options = {}) {
  const state = loadW631State(options);
  const current = state.projects[clean(projectId, 140)];
  if (!current) return Object.freeze({ ok: false, reason: 'project-not-found' });
  const capacity = evaluateEonCapacity({ resourceId: 'w631-outcomes', currentCount: current.outcomes.length }, options);
  if (!capacity.allowed) return Object.freeze({ ok: false, reason: 'capacity-reached', capacity });
  const outcome = normalizeOutcome({ ...input, createdAt: nowIso(options) });
  if (outcome.evidenceKind !== 'local-record' && !outcome.evidenceId) return Object.freeze({ ok: false, reason: 'evidence-id-required' });
  const record = normalizeProjectRecord({ ...current, outcomes: [outcome, ...current.outcomes], updatedAt: nowIso(options) });
  state.projects[current.projectId] = record;
  const persisted = persistW631State(state, options);
  if (!persisted.ok) return Object.freeze({ ok: false, reason: persisted.reason });
  return Object.freeze({ ok: true, outcome, record: Object.freeze(record) });
}

export function buildProjectContinueAction(projectId = '', options = {}) {
  const record = loadW631State(options).projects[clean(projectId, 140)];
  if (!record) return Object.freeze({ ok: false, reason: 'project-not-found' });
  return Object.freeze({
    ok: true,
    schema: EON_W631_SCHEMA,
    projectId: record.projectId,
    label: `Continue ${record.title}`,
    href: record.continueRoute,
    outcome: record.outcome,
    latestVersion: record.versions[0] || null,
    latestOutcome: record.outcomes[0] || null,
    executesRemoteAction: false
  });
}

const FORGE_TRANSITIONS = Object.freeze({
  draft: ['previewed'],
  previewed: ['draft', 'reviewed'],
  reviewed: ['draft', 'exported', 'deploy-prepared'],
  exported: ['draft', 'deploy-prepared'],
  'deploy-prepared': ['draft', 'deployed'],
  deployed: ['draft']
});

export function transitionForgeLifecycle(currentState = 'draft', nextState = 'draft', options = {}) {
  const current = EON_W631_FORGE_STATES.includes(currentState) ? currentState : 'draft';
  const next = EON_W631_FORGE_STATES.includes(nextState) ? nextState : 'draft';
  if (!(FORGE_TRANSITIONS[current] || []).includes(next)) return Object.freeze({ ok: false, reason: 'invalid-transition', current, next });
  if (next === 'deployed') {
    const proof = clean(options.deploymentReceiptId, 180);
    if (options.explicitUserAction !== true || options.permissionedConnector !== true || options.providerConfirmed !== true || !proof) {
      return Object.freeze({ ok: false, reason: 'permissioned-deployment-proof-required', current, next });
    }
    return Object.freeze({ ok: true, state: next, deploymentReceiptId: proof, remoteEffectClaimed: true });
  }
  return Object.freeze({ ok: true, state: next, preparedOnly: next === 'deploy-prepared', remoteEffectClaimed: false });
}

const AUTOMATION_TRANSITIONS = Object.freeze({
  draft: ['review', 'cancelled'],
  review: ['draft', 'scheduled', 'cancelled'],
  scheduled: ['paused', 'running', 'cancelled'],
  paused: ['scheduled', 'cancelled'],
  running: ['succeeded', 'failed', 'cancelled'],
  succeeded: [],
  failed: ['review', 'cancelled'],
  cancelled: []
});

export function transitionAutomationLifecycle(automation = {}, nextState = '', options = {}) {
  const current = normalizeAutomation(automation);
  const next = EON_W631_AUTOMATION_STATES.includes(nextState) ? nextState : '';
  if (!next || !(AUTOMATION_TRANSITIONS[current.state] || []).includes(next)) return Object.freeze({ ok: false, reason: 'invalid-transition', current: current.state, next });
  if (['scheduled', 'running'].includes(next) && options.explicitUserAction !== true) return Object.freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (next === 'running' && (options.permissionedExecutor !== true || !clean(options.executorReceiptId, 180))) {
    return Object.freeze({ ok: false, reason: 'executor-proof-required' });
  }
  if (['succeeded', 'failed'].includes(next) && !clean(options.runReceiptId, 180)) return Object.freeze({ ok: false, reason: 'run-receipt-required' });
  const historyCapacity = evaluateEonCapacity({ resourceId: 'w631-history', currentCount: current.history.length }, options);
  if (!historyCapacity.allowed) return Object.freeze({ ok: false, reason: 'capacity-reached', capacity: historyCapacity });
  const receiptId = clean(options.runReceiptId || options.executorReceiptId, 180);
  const entry = {
    id: identifier('run'),
    state: next,
    at: nowIso(options),
    receiptId,
    message: clean(options.message || '', 300),
    credentialIncluded: false,
    rawPayloadIncluded: false
  };
  const updated = normalizeAutomation({ ...current, state: next, history: [entry, ...current.history], updatedAt: nowIso(options) });
  return Object.freeze({ ok: true, automation: Object.freeze(updated), preparedOnly: next === 'scheduled', remoteEffectClaimed: ['running', 'succeeded', 'failed'].includes(next) });
}

export function saveAutomationLifecycle(automation = {}, options = {}) {
  const record = normalizeAutomation(automation);
  if (!record.automationId) return Object.freeze({ ok: false, reason: 'automation-id-required' });
  const state = loadW631State(options);
  const capacity = evaluateEonCapacity({ resourceId: 'w631-automations', currentCount: Object.keys(state.automations).length, existing: Boolean(state.automations[record.automationId]) }, options);
  if (!capacity.allowed) return Object.freeze({ ok: false, reason: 'capacity-reached', capacity });
  if (record.history.length > MAX_HISTORY) return Object.freeze({ ok: false, reason: 'capacity-reached', capacity: evaluateEonCapacity({ resourceId: 'w631-history', currentCount: record.history.length - 1 }, options) });
  state.automations[record.automationId] = record;
  const persisted = persistW631State(state, options);
  if (!persisted.ok) return Object.freeze({ ok: false, reason: persisted.reason });
  return Object.freeze({ ok: true, automation: Object.freeze(record) });
}

export function getW631WorkspaceSnapshot(options = {}) {
  const projects = loadProjects(options).projects || [];
  const operating = loadW631State(options);
  const active = projects[0] || null;
  if (active && !operating.projects[active.id]) syncProjectOperatingRecord(active, options);
  const next = loadW631State(options);
  return Object.freeze({
    schema: EON_W631_SCHEMA,
    projectCount: projects.length,
    operatingRecordCount: Object.keys(next.projects).length,
    operatingCapacity: w631ProjectCapacityCounts(next.projects),
    automationCount: Object.keys(next.automations).length,
    activeProject: active ? buildProjectContinueAction(active.id, options) : null,
    remoteExecutionClaimedWithoutReceipt: false,
    githubIntegrationActive: false,
    deploymentIntegrationActive: false
  });
}

export function installW631ContinuityPanel(options = {}) {
  const doc = options.document || globalThis.document;
  const main = doc?.querySelector?.('main');
  if (!main || doc.querySelector('[data-eon-w631-panel]')) return Object.freeze({ installed: false });
  const snapshot = getW631WorkspaceSnapshot(options);
  const panel = doc.createElement('section');
  panel.className = 'eon-w631-continuity-panel';
  panel.dataset.eonW631Panel = '1';
  const active = snapshot.activeProject;
  panel.innerHTML = active?.ok
    ? `<div><span>Continue your project</span><strong>${escapeMarkup(active.label.replace(/^Continue\s+/, ''))}</strong><small>${escapeMarkup(active.outcome || 'Resume the latest local work state.')}</small></div><a href="${escapeMarkup(active.href)}">${escapeMarkup(active.label)}</a>`
    : '<div><span>Project continuity</span><strong>No active local project</strong><small>Create a Project to keep versions, outcomes and continuation together.</small></div><a href="/projects">Open Projects</a>';
  main.prepend(panel);
  return Object.freeze({ installed: true, snapshot });
}

export function validateW631ProjectOperatingContract() {
  const validForge = transitionForgeLifecycle('reviewed', 'deploy-prepared', { explicitUserAction: true });
  const blockedDeploy = transitionForgeLifecycle('deploy-prepared', 'deployed', { explicitUserAction: true });
  const automation = normalizeAutomation({ automationId: 'a1', state: 'scheduled' });
  const blockedRun = transitionAutomationLifecycle(automation, 'running', { explicitUserAction: true });
  const checks = [
    EON_W631_FORGE_STATES.length === 6,
    EON_W631_AUTOMATION_STATES.length === 8,
    validForge.ok && validForge.preparedOnly,
    !blockedDeploy.ok && blockedDeploy.reason === 'permissioned-deployment-proof-required',
    !blockedRun.ok && blockedRun.reason === 'executor-proof-required',
    transitionAutomationLifecycle(automation, 'paused', {}).ok,
    normalizeVersion({ label: 'v1' }).remoteEffectClaimed === false,
    normalizeOutcome({ title: 'done' }).evidenceKind === 'local-record'
  ];
  return Object.freeze({ schema: EON_W631_SCHEMA, ok: checks.every(Boolean), passed: checks.filter(Boolean).length, total: checks.length });
}
