/**
 * W103 Automation OS durable local store.
 *
 * Product rules:
 * - One stable versioned localStorage key survives normal EONAPP asset updates.
 * - Vault exports already include every localStorage key, so workflows, schedules,
 *   non-secret connector metadata, approvals and audit history are included in the
 *   encrypted Vault backup automatically.
 * - API keys, OAuth tokens, passwords and session cookies are never accepted here.
 *   Connections retain a Vault reference only.
 */

import {
  normalizeEonWorkflowAction,
  prepareEonWorkflowReviewAction,
  transitionEonWorkflowAction
} from '../contracts/workflow/eon-workflow-action-state-machine.js';

export const AUTOMATION_OS_SCHEMA = 3;
export const AUTOMATION_OS_STORAGE_KEY = 'eon:automation-os:v3';
export const AUTOMATION_OS_LEGACY_KEYS = Object.freeze([
  'eon:automation-os:v1',
  'eon:automation-os:v2',
  'eon:workflows:v1'
]);

const MAX_AUDIT_ENTRIES = 500;
const MAX_APPROVALS = 200;
const MAX_WORKFLOWS = 250;
const SECRET_FIELD_RE = /(api.?key|access.?token|refresh.?token|client.?secret|password|passphrase|private.?key|seed|cookie|authorization)/i;

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix = 'item') {
  try {
    if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  } catch {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function getStorage() {
  try { return globalThis.localStorage || null; } catch { return null; }
}

function parseJson(raw, fallback = null) {
  try { return JSON.parse(raw); } catch { return fallback; }
}

function normalizeOwnerRef(value = '') {
  const clean = String(value || '').trim().slice(0, 160);
  return clean || 'local-device';
}

export function detectAutomationOwnerRef() {
  const storage = getStorage();
  if (!storage) return 'local-device';
  const candidates = ['eon:profile'];
  for (const key of candidates) {
    const parsed = parseJson(storage.getItem(key) || 'null');
    const value = parsed?.uid || parsed?.id || parsed?.address || parsed?.alias;
    if (value) return normalizeOwnerRef(value);
  }
  return 'local-device';
}

function defaultState(ownerRef = detectAutomationOwnerRef()) {
  const createdAt = nowIso();
  return {
    schema: AUTOMATION_OS_SCHEMA,
    ownerRef: normalizeOwnerRef(ownerRef),
    createdAt,
    updatedAt: createdAt,
    workflows: [],
    connections: {},
    schedules: [],
    approvals: [],
    audit: [],
    preferences: {
      defaultRunMode: 'simulate',
      defaultApproval: 'draft',
      retainAuditDays: 90,
      localRunnerEnabled: false,
      cloudSchedulerEnabled: false,
      browserCompanionEnabled: false
    },
    migrationHistory: []
  };
}

function stripSecrets(value, path = '') {
  if (Array.isArray(value)) return value.map((item, index) => stripSecrets(item, `${path}[${index}]`));
  if (!value || typeof value !== 'object') return value;
  const output = {};
  for (const [key, entry] of Object.entries(value)) {
    if (SECRET_FIELD_RE.test(key)) continue;
    output[key] = stripSecrets(entry, path ? `${path}.${key}` : key);
  }
  return output;
}

function normalizeStep(step = {}, index = 0) {
  const safe = stripSecrets(step || {});
  const approval = ['read', 'draft', 'submit', 'sensitive'].includes(safe.approval) ? safe.approval : 'draft';
  return {
    id: String(safe.id || randomId(`step${index + 1}`)).slice(0, 120),
    type: String(safe.type || 'action').slice(0, 40),
    title: String(safe.title || `Step ${index + 1}`).slice(0, 180),
    description: String(safe.description || '').slice(0, 600),
    providerId: String(safe.providerId || 'rest-api').slice(0, 100),
    capability: String(safe.capability || '').slice(0, 120),
    approval,
    config: safe.config && typeof safe.config === 'object' ? safe.config : {},
    enabled: safe.enabled !== false
  };
}

function normalizeWorkflow(workflow = {}) {
  const safe = stripSecrets(workflow || {});
  const createdAt = String(safe.createdAt || nowIso());
  return {
    id: String(safe.id || randomId('flow')).slice(0, 140),
    name: String(safe.name || 'Untitled workflow').slice(0, 180),
    description: String(safe.description || '').slice(0, 1200),
    family: String(safe.family || 'custom').slice(0, 80),
    projectId: String(safe.projectId || '').slice(0, 140),
    status: ['draft', 'ready', 'paused', 'archived'].includes(safe.status) ? safe.status : 'draft',
    runMode: ['simulate', 'shadow', 'live'].includes(safe.runMode) ? safe.runMode : 'simulate',
    planner: String(safe.planner || 'local-fallback').slice(0, 80),
    tags: Array.isArray(safe.tags) ? safe.tags.map((tag) => String(tag).slice(0, 60)).slice(0, 20) : [],
    steps: Array.isArray(safe.steps) ? safe.steps.slice(0, 80).map(normalizeStep) : [],
    createdAt,
    updatedAt: String(safe.updatedAt || createdAt),
    lastRunAt: safe.lastRunAt ? String(safe.lastRunAt) : null,
    runCount: Math.max(0, Number(safe.runCount) || 0),
    version: Math.max(1, Number(safe.version) || 1)
  };
}

function normalizeConnection(connection = {}, providerId = '') {
  const safe = stripSecrets(connection || {});
  const id = String(providerId || safe.providerId || '').trim().toLowerCase().slice(0, 100);
  if (!id) return null;
  const status = ['not-configured', 'configured', 'verified', 'needs-attention', 'disabled'].includes(safe.status)
    ? safe.status
    : 'not-configured';
  return {
    providerId: id,
    displayName: String(safe.displayName || id).slice(0, 160),
    status,
    scopes: Array.isArray(safe.scopes) ? safe.scopes.map((scope) => String(scope).slice(0, 120)).slice(0, 50) : [],
    credentialRef: safe.credentialRef ? String(safe.credentialRef).slice(0, 220) : `vault://automation/${id}`,
    accountHint: String(safe.accountHint || '').slice(0, 160),
    configuredAt: safe.configuredAt ? String(safe.configuredAt) : null,
    verifiedAt: safe.verifiedAt ? String(safe.verifiedAt) : null,
    lastError: String(safe.lastError || '').slice(0, 400),
    notes: String(safe.notes || '').slice(0, 500)
  };
}

function normalizeSchedule(schedule = {}) {
  const safe = stripSecrets(schedule || {});
  return {
    id: String(safe.id || randomId('schedule')).slice(0, 140),
    workflowId: String(safe.workflowId || '').slice(0, 140),
    label: String(safe.label || 'Workflow schedule').slice(0, 180),
    cadence: String(safe.cadence || 'manual').slice(0, 120),
    timezone: String(safe.timezone || 'local').slice(0, 80),
    enabled: Boolean(safe.enabled),
    runner: ['browser', 'local-runner', 'cloud-scheduler'].includes(safe.runner) ? safe.runner : 'browser',
    nextRunAt: safe.nextRunAt ? String(safe.nextRunAt) : null,
    createdAt: String(safe.createdAt || nowIso()),
    updatedAt: String(safe.updatedAt || nowIso())
  };
}

function normalizeApproval(approval = {}) {
  const safe = stripSecrets(approval || {});
  const id = String(safe.id || randomId('approval')).slice(0, 140);
  const workflowId = String(safe.workflowId || '').slice(0, 140);
  const runId = String(safe.runId || '').slice(0, 140);
  const stepId = String(safe.stepId || '').slice(0, 140);
  const level = ['read', 'draft', 'submit', 'sensitive'].includes(safe.level) ? safe.level : 'submit';
  const prepared = safe.action
    ? { ok: true, action: normalizeEonWorkflowAction(safe.action) }
    : prepareEonWorkflowReviewAction({ actionId: `workflowaction_${id}`, workflowId, runId, stepId, actionType: 'automation-step-review', risk: level, source: 'automation-os' });
  const action = prepared.ok ? prepared.action : normalizeEonWorkflowAction({ actionId: `workflowaction_${id}`, workflowId, runId, stepId, actionType: 'automation-step-review', risk: level, state: 'reviewed', source: 'automation-os' });
  return {
    id, workflowId, runId, stepId, level,
    title: String(safe.title || 'Approval required').slice(0, 220),
    summary: String(safe.summary || '').slice(0, 900),
    status: ['pending', 'approved', 'rejected', 'expired'].includes(safe.status) ? safe.status : 'pending',
    createdAt: String(safe.createdAt || nowIso()),
    resolvedAt: safe.resolvedAt ? String(safe.resolvedAt) : null,
    resolutionNote: String(safe.resolutionNote || '').slice(0, 500),
    action,
    localApprovalOnly: action.localApprovalOnly !== false,
    externalExecutionAuthority: action.externalExecutionAuthority === true,
    externalEffectCreated: action.externalEffectCreated === true
  };
}

function normalizeAudit(entry = {}) {
  const safe = stripSecrets(entry || {});
  return {
    id: String(safe.id || randomId('audit')).slice(0, 140),
    at: String(safe.at || nowIso()),
    type: String(safe.type || 'event').slice(0, 100),
    workflowId: String(safe.workflowId || '').slice(0, 140),
    runId: String(safe.runId || '').slice(0, 140),
    providerId: String(safe.providerId || '').slice(0, 100),
    approval: String(safe.approval || '').slice(0, 40),
    status: String(safe.status || 'ok').slice(0, 60),
    message: String(safe.message || '').slice(0, 1000),
    metadata: safe.metadata && typeof safe.metadata === 'object' ? safe.metadata : {}
  };
}

function migrateState(rawState = {}, sourceKey = AUTOMATION_OS_STORAGE_KEY) {
  const base = defaultState(rawState?.ownerRef || detectAutomationOwnerRef());
  const sourceSchema = Number(rawState?.schema || 1);
  const connections = {};
  const rawConnections = rawState?.connections && typeof rawState.connections === 'object' ? rawState.connections : {};
  for (const [providerId, connection] of Object.entries(rawConnections)) {
    const normalized = normalizeConnection(connection, providerId);
    if (normalized) connections[normalized.providerId] = normalized;
  }
  const migrated = {
    ...base,
    ...stripSecrets(rawState || {}),
    schema: AUTOMATION_OS_SCHEMA,
    ownerRef: normalizeOwnerRef(rawState?.ownerRef || base.ownerRef),
    workflows: (Array.isArray(rawState?.workflows) ? rawState.workflows : []).slice(0, MAX_WORKFLOWS).map(normalizeWorkflow),
    connections,
    schedules: (Array.isArray(rawState?.schedules) ? rawState.schedules : []).map(normalizeSchedule),
    approvals: (Array.isArray(rawState?.approvals) ? rawState.approvals : []).slice(-MAX_APPROVALS).map(normalizeApproval),
    audit: (Array.isArray(rawState?.audit) ? rawState.audit : []).slice(-MAX_AUDIT_ENTRIES).map(normalizeAudit),
    preferences: {
      ...base.preferences,
      ...(rawState?.preferences && typeof rawState.preferences === 'object' ? stripSecrets(rawState.preferences) : {})
    },
    migrationHistory: Array.isArray(rawState?.migrationHistory) ? rawState.migrationHistory.slice(-20) : []
  };
  if (sourceSchema !== AUTOMATION_OS_SCHEMA || sourceKey !== AUTOMATION_OS_STORAGE_KEY) {
    migrated.migrationHistory = [...migrated.migrationHistory, {
      fromSchema: sourceSchema,
      toSchema: AUTOMATION_OS_SCHEMA,
      sourceKey,
      migratedAt: nowIso()
    }].slice(-20);
  }
  migrated.updatedAt = nowIso();
  return migrated;
}

function writeState(state) {
  const storage = getStorage();
  if (!storage) return false;
  storage.setItem(AUTOMATION_OS_STORAGE_KEY, JSON.stringify(state));
  return true;
}

export function loadAutomationState() {
  const storage = getStorage();
  if (!storage) return defaultState();
  let sourceKey = AUTOMATION_OS_STORAGE_KEY;
  let parsed = parseJson(storage.getItem(AUTOMATION_OS_STORAGE_KEY) || 'null');
  if (!parsed) {
    for (const legacyKey of AUTOMATION_OS_LEGACY_KEYS) {
      parsed = parseJson(storage.getItem(legacyKey) || 'null');
      if (parsed) { sourceKey = legacyKey; break; }
    }
  }
  const state = migrateState(parsed || defaultState(), sourceKey);
  writeState(state);
  if (sourceKey !== AUTOMATION_OS_STORAGE_KEY) {
    try { storage.removeItem(sourceKey); } catch {}
  }
  return state;
}

export function saveAutomationState(nextState = {}) {
  const migrated = migrateState({ ...nextState, updatedAt: nowIso() });
  writeState(migrated);
  try {
    globalThis.document?.dispatchEvent?.(new CustomEvent('eon:automation-state-changed', {
      detail: { schema: migrated.schema, updatedAt: migrated.updatedAt }
    }));
  } catch {}
  return migrated;
}

export function upsertWorkflow(workflow = {}) {
  const state = loadAutomationState();
  const normalized = normalizeWorkflow(workflow);
  const index = state.workflows.findIndex((item) => item.id === normalized.id);
  if (index >= 0) state.workflows[index] = { ...state.workflows[index], ...normalized, updatedAt: nowIso(), version: state.workflows[index].version + 1 };
  else state.workflows.unshift(normalized);
  state.workflows = state.workflows.slice(0, MAX_WORKFLOWS);
  return { state: saveAutomationState(state), workflow: normalized };
}

export function removeWorkflow(workflowId = '') {
  const state = loadAutomationState();
  const before = state.workflows.length;
  state.workflows = state.workflows.filter((item) => item.id !== workflowId);
  state.schedules = state.schedules.filter((item) => item.workflowId !== workflowId);
  state.approvals = state.approvals.filter((item) => item.workflowId !== workflowId);
  saveAutomationState(state);
  return before !== state.workflows.length;
}

export function upsertConnection(providerId = '', patch = {}) {
  const state = loadAutomationState();
  const current = state.connections[providerId] || {};
  const normalized = normalizeConnection({ ...current, ...patch, providerId }, providerId);
  if (!normalized) throw new Error('A valid provider is required.');
  state.connections[normalized.providerId] = normalized;
  return { state: saveAutomationState(state), connection: normalized };
}

export function upsertSchedule(schedule = {}) {
  const state = loadAutomationState();
  const normalized = normalizeSchedule(schedule);
  const index = state.schedules.findIndex((item) => item.id === normalized.id);
  if (index >= 0) state.schedules[index] = { ...state.schedules[index], ...normalized, updatedAt: nowIso() };
  else state.schedules.unshift(normalized);
  return { state: saveAutomationState(state), schedule: normalized };
}

export function appendAutomationAudit(entry = {}) {
  const state = loadAutomationState();
  const normalized = normalizeAudit(entry);
  state.audit.push(normalized);
  state.audit = state.audit.slice(-MAX_AUDIT_ENTRIES);
  saveAutomationState(state);
  return normalized;
}

export function createAutomationApproval(approval = {}) {
  const state = loadAutomationState();
  const normalized = normalizeApproval(approval);
  state.approvals.push(normalized);
  state.approvals = state.approvals.slice(-MAX_APPROVALS);
  saveAutomationState(state);
  return normalized;
}

export function resolveAutomationApproval(approvalId = '', status = 'rejected', resolutionNote = '', options = {}) {
  if (!['approved', 'rejected', 'expired'].includes(status)) throw new Error('Unsupported approval resolution.');
  const state = loadAutomationState();
  const approval = state.approvals.find((item) => item.id === approvalId);
  if (!approval) return null;
  const target = status === 'approved' ? 'approved' : 'cancelled';
  const transition = transitionEonWorkflowAction(approval.action, target, { explicitUserAction: options.explicitUserAction === true, reason: status, now: options.now || Date.now() });
  if (!transition.ok) return Object.freeze({ ...approval, resolutionBlocked: true, resolutionReason: transition.reason });
  approval.status = status;
  approval.resolvedAt = nowIso();
  approval.resolutionNote = String(resolutionNote || '').slice(0, 500);
  approval.action = transition.action;
  approval.localApprovalOnly = transition.action.localApprovalOnly !== false;
  approval.externalExecutionAuthority = transition.action.externalExecutionAuthority === true;
  approval.externalEffectCreated = transition.action.externalEffectCreated === true;
  saveAutomationState(state);
  return approval;
}

export function exportAutomationState() {
  const state = loadAutomationState();
  return {
    schema: 'eon.automation-os.portable.v1',
    exportedAt: nowIso(),
    containsSecrets: false,
    vaultBackupCompatible: true,
    state: migrateState(state)
  };
}

export function importAutomationState(bundle = {}, { merge = true } = {}) {
  const incoming = bundle?.state || bundle;
  if (!incoming || typeof incoming !== 'object') throw new Error('Invalid Automation OS backup.');
  const normalized = migrateState(incoming, 'portable-import');
  if (!merge) return saveAutomationState(normalized);
  const current = loadAutomationState();
  const workflowMap = new Map(current.workflows.map((item) => [item.id, item]));
  normalized.workflows.forEach((item) => workflowMap.set(item.id, item));
  const scheduleMap = new Map(current.schedules.map((item) => [item.id, item]));
  normalized.schedules.forEach((item) => scheduleMap.set(item.id, item));
  const merged = {
    ...current,
    workflows: [...workflowMap.values()].slice(0, MAX_WORKFLOWS),
    connections: { ...current.connections, ...normalized.connections },
    schedules: [...scheduleMap.values()],
    approvals: [...current.approvals, ...normalized.approvals].slice(-MAX_APPROVALS),
    audit: [...current.audit, ...normalized.audit].slice(-MAX_AUDIT_ENTRIES),
    preferences: { ...current.preferences, ...normalized.preferences },
    migrationHistory: [...current.migrationHistory, ...normalized.migrationHistory].slice(-20)
  };
  return saveAutomationState(merged);
}

export function getAutomationPersistenceReport() {
  const storage = getStorage();
  const state = loadAutomationState();
  const raw = storage?.getItem(AUTOMATION_OS_STORAGE_KEY) || '';
  return Object.freeze({
    schema: state.schema,
    storageKey: AUTOMATION_OS_STORAGE_KEY,
    bytes: new TextEncoder().encode(raw).byteLength,
    ownerRef: state.ownerRef,
    workflows: state.workflows.length,
    connections: Object.keys(state.connections).length,
    schedules: state.schedules.length,
    pendingApprovals: state.approvals.filter((item) => item.status === 'pending').length,
    auditEntries: state.audit.length,
    survivesAssetUpdate: true,
    survivesNormalLogoutLogin: true,
    includedInEncryptedVaultExport: true,
    plaintextSecretsAllowed: false,
    localRunnerEnabled: Boolean(state.preferences.localRunnerEnabled),
    cloudSchedulerEnabled: Boolean(state.preferences.cloudSchedulerEnabled)
  });
}

export function updateAutomationPreferences(patch = {}) {
  const state = loadAutomationState();
  state.preferences = { ...state.preferences, ...stripSecrets(patch || {}) };
  return saveAutomationState(state).preferences;
}

export function clearAutomationState() {
  const storage = getStorage();
  if (!storage) return false;
  storage.removeItem(AUTOMATION_OS_STORAGE_KEY);
  return true;
}

export const __automationStoreInternals = Object.freeze({
  stripSecrets,
  normalizeWorkflow,
  normalizeConnection,
  migrateState
});
