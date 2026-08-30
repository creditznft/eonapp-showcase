/**
 * EONAPP W211 — durable local Projects and Library records.
 *
 * Product truth:
 * - This is same-browser local state, not an account or cloud-sync claim.
 * - Projects and Library contain ordinary work artefacts only.
 * - Secret-looking material is rejected before it is stored.
 * - Vault remains the separate surface for security-sensitive records.
 */

import {
  EON_LIBRARY_SCHEMA,
  EON_LIBRARY_STORAGE_KEY,
  EON_PROJECT_HANDOFF_SCHEMA,
  EON_PROJECTS_SCHEMA,
  EON_PROJECTS_STORAGE_KEY
} from '../contracts/projects/eon-project-store-contract.js';
import { EON_PROJECT_REGISTRY_STORAGE_KEY, registerProjectSource, removeProjectSource } from '../projects/eon-project-registry.js';
import { assertEonCapacity } from '../storage/eon-capacity-authority.js';
import { EON_LIBRARY_INDEX_STORAGE_KEY, registerLibrarySource, removeLibrarySource } from '../storage/eon-library-index.js';
import { captureEonStorageSnapshot, restoreEonStorageSnapshot } from '../storage/eon-storage-transaction.js';
import { normalizeEonProjectContext } from '../projects/eon-project-context.js';
import { normalizeEonProjectAiProfile } from '../local-ai/eon-project-ai-profile.js';
export { EON_LIBRARY_SCHEMA, EON_LIBRARY_STORAGE_KEY, EON_PROJECT_HANDOFF_SCHEMA, EON_PROJECTS_SCHEMA, EON_PROJECTS_STORAGE_KEY };

const MAX_TEXT = 12_000;
const MAX_TITLE = 180;
const SECRET_LIKE_RE = /(?:\b(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|password|passphrase|private[_ -]?key|seed(?:\s+phrase)?|mnemonic|authorization)\b\s*[:=]\s*\S+|\b(?:sk|rk|pk|ghp|gho|xox[baprs])[-_][A-Za-z0-9_-]{8,}|\bBearer\s+[A-Za-z0-9._~+/-]{12,})/i;

const PROJECT_STATES = new Set(['active', 'paused', 'complete']);
const TASK_STATES = new Set(['todo', 'in-progress', 'done']);
const ARTIFACT_TYPES = new Set(['note', 'output', 'link', 'brief']);
const LIBRARY_TYPES = new Set(['note', 'template', 'output', 'prompt']);

function nowIso() {
  return new Date().toISOString();
}

function id(prefix = 'item') {
  try {
    if (globalThis.crypto?.randomUUID) return `${prefix}_${globalThis.crypto.randomUUID()}`;
  } catch {}
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function storage(options = {}) {
  if (options.storage) return options.storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function parse(raw, fallback) {
  try {
    const value = JSON.parse(String(raw || ''));
    return value && typeof value === 'object' ? value : fallback;
  } catch {
    return fallback;
  }
}

function safeText(value, { field = 'Text', max = MAX_TEXT, required = false } = {}) {
  const text = String(value || '').replaceAll(String.fromCharCode(0), '').trim().slice(0, max);
  if (required && !text) throw new Error(`${field} is required.`);
  if (SECRET_LIKE_RE.test(text)) throw new Error(`${field} looks like a secret. Store credentials only in Vault, not Projects or Library.`);
  return text;
}

function safeTags(value = []) {
  const source = Array.isArray(value) ? value : String(value || '').split(',');
  const seen = new Set();
  const tags = [];
  source.forEach((item) => {
    const tag = safeText(item, { field: 'Tag', max: 48 });
    if (!tag || seen.has(tag.toLowerCase())) return;
    seen.add(tag.toLowerCase());
    tags.push(tag);
  });
  return tags;
}

function normalizedTask(value = {}) {
  const createdAt = String(value.createdAt || nowIso());
  return {
    id: safeText(value.id || id('task'), { field: 'Task ID', max: 140, required: true }),
    title: safeText(value.title || 'Untitled task', { field: 'Task title', max: MAX_TITLE, required: true }),
    status: TASK_STATES.has(value.status) ? value.status : 'todo',
    note: safeText(value.note || '', { field: 'Task note', max: 2_000 }),
    createdAt,
    updatedAt: String(value.updatedAt || createdAt)
  };
}

function normalizedArtifact(value = {}) {
  const createdAt = String(value.createdAt || nowIso());
  return {
    id: safeText(value.id || id('artifact'), { field: 'Artifact ID', max: 140, required: true }),
    type: ARTIFACT_TYPES.has(value.type) ? value.type : 'note',
    title: safeText(value.title || 'Untitled artifact', { field: 'Artifact title', max: MAX_TITLE, required: true }),
    content: safeText(value.content || '', { field: 'Artifact content', max: MAX_TEXT }),
    createdAt,
    updatedAt: String(value.updatedAt || createdAt)
  };
}

function normalizedProject(value = {}) {
  const createdAt = String(value.createdAt || nowIso());
  const automationIds = Array.isArray(value.automationIds) ? value.automationIds : [];
  const projectId = safeText(value.id || id('project'), { field: 'Project ID', max: 140, required: true });
  return {
    id: projectId,
    title: safeText(value.title || 'Untitled project', { field: 'Project title', max: MAX_TITLE, required: true }),
    summary: safeText(value.summary || '', { field: 'Project summary', max: 4_000 }),
    status: PROJECT_STATES.has(value.status) ? value.status : 'active',
    tasks: (Array.isArray(value.tasks) ? value.tasks : []).map(normalizedTask),
    artifacts: (Array.isArray(value.artifacts) ? value.artifacts : []).map(normalizedArtifact),
    automationIds: [...new Set(automationIds.map((item) => safeText(item, { field: 'Automation reference', max: 160 })).filter(Boolean))],
    workspaceContext: normalizeEonProjectContext(value.workspaceContext, { projectId }),
    aiProfile: normalizeEonProjectAiProfile(value.aiProfile),
    createdAt,
    updatedAt: String(value.updatedAt || createdAt)
  };
}

function normalizedLibraryItem(value = {}) {
  const createdAt = String(value.createdAt || nowIso());
  return {
    id: safeText(value.id || id('library'), { field: 'Library item ID', max: 140, required: true }),
    type: LIBRARY_TYPES.has(value.type) ? value.type : 'note',
    title: safeText(value.title || 'Untitled item', { field: 'Library title', max: MAX_TITLE, required: true }),
    content: safeText(value.content || '', { field: 'Library content', max: MAX_TEXT }),
    tags: safeTags(value.tags),
    useCount: Math.max(0, Number(value.useCount) || 0),
    lifecycleState: value.lifecycleState === 'archived' ? 'archived' : 'active',
    createdAt,
    updatedAt: String(value.updatedAt || createdAt)
  };
}

function defaultProjects() {
  const timestamp = nowIso();
  return { schema: EON_PROJECTS_SCHEMA, createdAt: timestamp, updatedAt: timestamp, projects: [] };
}

function defaultLibrary() {
  const timestamp = nowIso();
  return { schema: EON_LIBRARY_SCHEMA, createdAt: timestamp, updatedAt: timestamp, items: [] };
}

function save(storageRef, key, value, { emit = true } = {}) {
  if (!storageRef) return value;
  const serialized = JSON.stringify(value);
  storageRef.setItem(key, serialized);
  if (storageRef.getItem?.(key) !== serialized) throw new Error(`Storage write verification failed for ${key}.`);
  if (emit) {
    try {
      globalThis.document?.dispatchEvent?.(new CustomEvent('eon:workspace-state-changed', { detail: { key, updatedAt: value.updatedAt } }));
    } catch {}
  }
  return value;
}


function registerOrdinaryProject(project = {}, options = {}) {
  return registerProjectSource({
    namespace: 'ordinary',
    sourceId: project.id,
    projectId: project.id,
    preserveSourceId: true,
    storageKey: EON_PROJECTS_STORAGE_KEY,
    sourceSchema: EON_PROJECTS_SCHEMA,
    relation: 'owner',
    title: project.title,
    summary: project.summary,
    operationalStatus: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    continueDestination: 'projects'
  }, { ...options, emit: false });
}

function registerOrdinaryLibraryItem(item = {}, options = {}) {
  return registerLibrarySource({
    namespace: 'ordinary-library',
    sourceId: item.id,
    kind: 'library-item',
    title: item.title,
    lifecycleState: item.lifecycleState,
    storageKey: EON_LIBRARY_STORAGE_KEY,
    sourceSchema: EON_LIBRARY_SCHEMA,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  }, { ...options, emit: false });
}

function registerProjectArtifact(projectId = '', artifact = {}, options = {}) {
  return registerLibrarySource({
    namespace: 'project-artifact',
    sourceId: `${projectId}:${artifact.id}`,
    kind: 'project-artifact',
    title: artifact.title,
    projectId,
    storageKey: EON_PROJECTS_STORAGE_KEY,
    sourceSchema: EON_PROJECTS_SCHEMA,
    createdAt: artifact.createdAt,
    updatedAt: artifact.updatedAt
  }, { ...options, emit: false });
}

function projectCapacityCounts(projects = []) {
  const totalCount = projects.length;
  const archivedCount = projects.filter((project) => project.status === 'complete').length;
  return Object.freeze({ totalCount, archivedCount, activeCount: Math.max(0, totalCount - archivedCount) });
}

function libraryCapacityCounts(items = []) {
  const totalCount = items.length;
  const archivedCount = items.filter((item) => item.lifecycleState === 'archived').length;
  return Object.freeze({ totalCount, archivedCount, activeCount: Math.max(0, totalCount - archivedCount) });
}

export function getProjectCapacityCounts(options = {}) {
  return projectCapacityCounts(loadProjects(options).projects);
}

export function getLibraryCapacityCounts(options = {}) {
  return libraryCapacityCounts(loadLibrary(options).items);
}

function captureWorkspaceTransaction(keys = [], options = {}) {
  const snapshot = captureEonStorageSnapshot(keys, options);
  if (!snapshot.ok) throw new Error(`Could not start a reversible local write: ${snapshot.reason || 'snapshot-failed'}.`);
  return snapshot;
}

function rollbackWorkspaceTransaction(snapshot, options = {}) {
  const restored = restoreEonStorageSnapshot(snapshot, options);
  if (!restored.ok) throw new Error(`The local write failed and exact rollback also failed: ${restored.reason || 'rollback-failed'}.`);
}

export function containsSecretLikeValue(value = '') {
  return SECRET_LIKE_RE.test(String(value || ''));
}

export function loadProjects(options = {}) {
  const storageRef = storage(options);
  const raw = parse(storageRef?.getItem(EON_PROJECTS_STORAGE_KEY), defaultProjects());
  const base = defaultProjects();
  const value = {
    ...base,
    ...raw,
    schema: EON_PROJECTS_SCHEMA,
    projects: (Array.isArray(raw.projects) ? raw.projects : []).map(normalizedProject)
  };
  return value;
}

export function loadLibrary(options = {}) {
  const storageRef = storage(options);
  const raw = parse(storageRef?.getItem(EON_LIBRARY_STORAGE_KEY), defaultLibrary());
  const base = defaultLibrary();
  const value = {
    ...base,
    ...raw,
    schema: EON_LIBRARY_SCHEMA,
    items: (Array.isArray(raw.items) ? raw.items : []).map(normalizedLibraryItem)
  };
  return value;
}

function saveProjects(next, options = {}) {
  const storageRef = storage(options);
  const normalized = {
    ...defaultProjects(),
    ...next,
    schema: EON_PROJECTS_SCHEMA,
    updatedAt: nowIso(),
    projects: (Array.isArray(next.projects) ? next.projects : []).map(normalizedProject)
  };
  return save(storageRef, EON_PROJECTS_STORAGE_KEY, normalized);
}

function saveLibrary(next, options = {}) {
  const storageRef = storage(options);
  const normalized = {
    ...defaultLibrary(),
    ...next,
    schema: EON_LIBRARY_SCHEMA,
    updatedAt: nowIso(),
    items: (Array.isArray(next.items) ? next.items : []).map(normalizedLibraryItem)
  };
  return save(storageRef, EON_LIBRARY_STORAGE_KEY, normalized);
}

export function createProject(input = {}, options = {}) {
  const state = loadProjects(options);
  const requestedActive = input.status === 'complete' ? 0 : 1;
  assertEonCapacity({ resourceId: 'ordinary-projects', ...projectCapacityCounts(state.projects), requestedCount: requestedActive, requestedTotalCount: 1 }, options);
  const transaction = captureWorkspaceTransaction([EON_PROJECTS_STORAGE_KEY, EON_PROJECT_REGISTRY_STORAGE_KEY], options);
  const timestamp = nowIso();
  const project = normalizedProject({
    id: id('project'),
    title: input.title,
    summary: input.summary,
    status: input.status || 'active',
    tasks: input.tasks || [],
    artifacts: input.artifacts || [],
    automationIds: input.automationIds || [],
    workspaceContext: input.workspaceContext || {},
    aiProfile: input.aiProfile || {},
    createdAt: timestamp,
    updatedAt: timestamp
  });
  try {
    state.projects.unshift(project);
    saveProjects(state, options);
    const registered = registerOrdinaryProject(project, options);
    if (!registered.ok) throw new Error(`Project registry rejected the new project: ${registered.reason || 'unknown-error'}.`);
  } catch (error) {
    rollbackWorkspaceTransaction(transaction, options);
    throw error;
  }
  try {
    if (typeof globalThis.dispatchEvent === 'function' && typeof globalThis.CustomEvent === 'function') {
      globalThis.dispatchEvent(new CustomEvent('eon:project-saved', { detail: { projectId: project.id, createdAt: project.createdAt } }));
    }
  } catch {}
  return project;
}

export function updateProject(projectId = '', patch = {}, options = {}) {
  const state = loadProjects(options);
  const index = state.projects.findIndex((project) => project.id === projectId);
  if (index < 0) throw new Error('Project not found.');
  const existing = state.projects[index];
  const next = normalizedProject({ ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, updatedAt: nowIso() });
  const reactivating = existing.status === 'complete' && next.status !== 'complete';
  if (reactivating) assertEonCapacity({ resourceId: 'ordinary-projects', ...projectCapacityCounts(state.projects), requestedCount: 1, requestedTotalCount: 0 }, options);
  const transaction = captureWorkspaceTransaction([EON_PROJECTS_STORAGE_KEY, EON_PROJECT_REGISTRY_STORAGE_KEY], options);
  try {
    state.projects[index] = next;
    saveProjects(state, options);
    const registered = registerOrdinaryProject(next, options);
    if (!registered.ok) throw new Error(`Project registry rejected the update: ${registered.reason || 'unknown-error'}.`);
  } catch (error) {
    rollbackWorkspaceTransaction(transaction, options);
    throw error;
  }
  return next;
}

export function deleteProject(projectId = '', options = {}) {
  const state = loadProjects(options);
  const existing = state.projects.find((project) => project.id === projectId);
  if (!existing) return false;
  const transaction = captureWorkspaceTransaction([EON_PROJECTS_STORAGE_KEY, EON_PROJECT_REGISTRY_STORAGE_KEY, EON_LIBRARY_INDEX_STORAGE_KEY], options);
  try {
    state.projects = state.projects.filter((project) => project.id !== projectId);
    saveProjects(state, options);
    const removed = removeProjectSource('ordinary', projectId, { ...options, emit: false });
    if (!removed.ok && removed.reason !== 'source-not-found') throw new Error(`Project registry rejected the deletion: ${removed.reason || 'unknown-error'}.`);
    for (const artifact of existing.artifacts) {
      const result = removeLibrarySource('project-artifact', `${projectId}:${artifact.id}`, { ...options, emit: false });
      if (!result.ok && result.reason !== 'source-not-found') throw new Error(`Library index rejected the project deletion: ${result.reason || 'unknown-error'}.`);
    }
  } catch (error) {
    rollbackWorkspaceTransaction(transaction, options);
    throw error;
  }
  return true;
}

export function addProjectTask(projectId = '', input = {}, options = {}) {
  const state = loadProjects(options);
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) throw new Error('Project not found.');
  assertEonCapacity({ resourceId: 'project-tasks', currentCount: project.tasks.length }, options);
  const timestamp = nowIso();
  const task = normalizedTask({ id: id('task'), title: input.title, note: input.note, status: input.status || 'todo', createdAt: timestamp, updatedAt: timestamp });
  project.tasks = [...project.tasks, task];
  project.updatedAt = timestamp;
  saveProjects(state, options);
  return task;
}

export function updateProjectTask(projectId = '', taskId = '', patch = {}, options = {}) {
  const state = loadProjects(options);
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) throw new Error('Project not found.');
  const index = project.tasks.findIndex((task) => task.id === taskId);
  if (index < 0) throw new Error('Task not found.');
  const current = project.tasks[index];
  project.tasks[index] = normalizedTask({ ...current, ...patch, id: current.id, createdAt: current.createdAt, updatedAt: nowIso() });
  project.updatedAt = nowIso();
  saveProjects(state, options);
  return project.tasks[index];
}

export function deleteProjectTask(projectId = '', taskId = '', options = {}) {
  const state = loadProjects(options);
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) throw new Error('Project not found.');
  const before = project.tasks.length;
  project.tasks = project.tasks.filter((task) => task.id !== taskId);
  project.updatedAt = nowIso();
  saveProjects(state, options);
  return before !== project.tasks.length;
}

export function addProjectArtifact(projectId = '', input = {}, options = {}) {
  const state = loadProjects(options);
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) throw new Error('Project not found.');
  assertEonCapacity({ resourceId: 'project-artifacts', currentCount: project.artifacts.length, totalCount: project.artifacts.length }, options);
  const transaction = captureWorkspaceTransaction([EON_PROJECTS_STORAGE_KEY, EON_LIBRARY_INDEX_STORAGE_KEY], options);
  const timestamp = nowIso();
  const artifact = normalizedArtifact({ id: id('artifact'), type: input.type || 'note', title: input.title, content: input.content, createdAt: timestamp, updatedAt: timestamp });
  try {
    project.artifacts = [...project.artifacts, artifact];
    project.updatedAt = timestamp;
    saveProjects(state, options);
    const indexed = registerProjectArtifact(projectId, artifact, options);
    if (!indexed.ok) throw new Error(`Library index rejected the project artifact: ${indexed.reason || 'unknown-error'}.`);
  } catch (error) {
    rollbackWorkspaceTransaction(transaction, options);
    throw error;
  }
  return artifact;
}

export function deleteProjectArtifact(projectId = '', artifactId = '', options = {}) {
  const state = loadProjects(options);
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) throw new Error('Project not found.');
  const existing = project.artifacts.find((artifact) => artifact.id === artifactId);
  if (!existing) return false;
  const transaction = captureWorkspaceTransaction([EON_PROJECTS_STORAGE_KEY, EON_LIBRARY_INDEX_STORAGE_KEY], options);
  try {
    project.artifacts = project.artifacts.filter((artifact) => artifact.id !== artifactId);
    project.updatedAt = nowIso();
    saveProjects(state, options);
    const removed = removeLibrarySource('project-artifact', `${projectId}:${artifactId}`, { ...options, emit: false });
    if (!removed.ok && removed.reason !== 'source-not-found') throw new Error(`Library index rejected the artifact deletion: ${removed.reason || 'unknown-error'}.`);
  } catch (error) {
    rollbackWorkspaceTransaction(transaction, options);
    throw error;
  }
  return true;
}

export function linkProjectAutomation(projectId = '', automationId = '', options = {}) {
  const state = loadProjects(options);
  const project = state.projects.find((item) => item.id === projectId);
  if (!project) throw new Error('Project not found.');
  const safeId = safeText(automationId, { field: 'Automation reference', max: 160, required: true });
  assertEonCapacity({ resourceId: 'project-automation-links', currentCount: project.automationIds.length, existing: project.automationIds.includes(safeId) }, options);
  project.automationIds = [...new Set([...project.automationIds, safeId])];
  project.updatedAt = nowIso();
  saveProjects(state, options);
  return project;
}

export function createLibraryItem(input = {}, options = {}) {
  const state = loadLibrary(options);
  const lifecycleState = input.lifecycleState === 'archived' ? 'archived' : 'active';
  assertEonCapacity({ resourceId: 'ordinary-library', ...libraryCapacityCounts(state.items), requestedCount: lifecycleState === 'active' ? 1 : 0, requestedTotalCount: 1 }, options);
  const transaction = captureWorkspaceTransaction([EON_LIBRARY_STORAGE_KEY, EON_LIBRARY_INDEX_STORAGE_KEY], options);
  const timestamp = nowIso();
  const item = normalizedLibraryItem({ id: id('library'), type: input.type || 'note', title: input.title, content: input.content, tags: input.tags, lifecycleState, useCount: 0, createdAt: timestamp, updatedAt: timestamp });
  try {
    state.items.unshift(item);
    saveLibrary(state, options);
    const indexed = registerOrdinaryLibraryItem(item, options);
    if (!indexed.ok) throw new Error(`Library index rejected the new item: ${indexed.reason || 'unknown-error'}.`);
  } catch (error) {
    rollbackWorkspaceTransaction(transaction, options);
    throw error;
  }
  return item;
}

export function updateLibraryItem(itemId = '', patch = {}, options = {}) {
  const state = loadLibrary(options);
  const index = state.items.findIndex((item) => item.id === itemId);
  if (index < 0) throw new Error('Library item not found.');
  const existing = state.items[index];
  const next = normalizedLibraryItem({ ...existing, ...patch, id: existing.id, createdAt: existing.createdAt, updatedAt: nowIso() });
  const reactivating = existing.lifecycleState === 'archived' && next.lifecycleState === 'active';
  if (reactivating) assertEonCapacity({ resourceId: 'ordinary-library', ...libraryCapacityCounts(state.items), requestedCount: 1, requestedTotalCount: 0 }, options);
  const transaction = captureWorkspaceTransaction([EON_LIBRARY_STORAGE_KEY, EON_LIBRARY_INDEX_STORAGE_KEY], options);
  try {
    state.items[index] = next;
    saveLibrary(state, options);
    const indexed = registerOrdinaryLibraryItem(next, options);
    if (!indexed.ok) throw new Error(`Library index rejected the update: ${indexed.reason || 'unknown-error'}.`);
  } catch (error) {
    rollbackWorkspaceTransaction(transaction, options);
    throw error;
  }
  return next;
}

export function deleteLibraryItem(itemId = '', options = {}) {
  const state = loadLibrary(options);
  const existing = state.items.find((item) => item.id === itemId);
  if (!existing) return false;
  const transaction = captureWorkspaceTransaction([EON_LIBRARY_STORAGE_KEY, EON_LIBRARY_INDEX_STORAGE_KEY], options);
  try {
    state.items = state.items.filter((item) => item.id !== itemId);
    saveLibrary(state, options);
    const removed = removeLibrarySource('ordinary-library', itemId, { ...options, emit: false });
    if (!removed.ok && removed.reason !== 'source-not-found') throw new Error(`Library index rejected the deletion: ${removed.reason || 'unknown-error'}.`);
  } catch (error) {
    rollbackWorkspaceTransaction(transaction, options);
    throw error;
  }
  return true;
}

export function archiveLibraryItem(itemId = '', options = {}) {
  return updateLibraryItem(itemId, { lifecycleState: 'archived' }, options);
}

export function restoreLibraryItem(itemId = '', options = {}) {
  return updateLibraryItem(itemId, { lifecycleState: 'active' }, options);
}

export function buildLibraryItemExport(itemId = '', options = {}) {
  const item = loadLibrary(options).items.find((entry) => entry.id === itemId);
  if (!item) throw new Error('Library item not found.');
  return Object.freeze({
    schema: 'eonapp.library-item-export.a15.v1',
    exportedAt: nowIso(),
    localOnly: true,
    credentialIncluded: false,
    item: Object.freeze({ ...item })
  });
}

export function recordLibraryUse(itemId = '', options = {}) {
  const state = loadLibrary(options);
  const item = state.items.find((entry) => entry.id === itemId);
  if (!item) throw new Error('Library item not found.');
  item.useCount = Number(item.useCount || 0) + 1;
  item.updatedAt = nowIso();
  saveLibrary(state, options);
  return item;
}

export function getWorkspaceSnapshot(options = {}) {
  const projectState = loadProjects(options);
  const libraryState = loadLibrary(options);
  const automation = options.automationState && typeof options.automationState === 'object' ? options.automationState : {};
  const projects = projectState.projects;
  const tasks = projects.flatMap((project) => project.tasks || []);
  return Object.freeze({
    localOnly: true,
    projects: projects.length,
    activeProjects: projects.filter((project) => project.status === 'active').length,
    pausedProjects: projects.filter((project) => project.status === 'paused').length,
    completeProjects: projects.filter((project) => project.status === 'complete').length,
    tasks: tasks.length,
    openTasks: tasks.filter((task) => task.status !== 'done').length,
    completedTasks: tasks.filter((task) => task.status === 'done').length,
    artifacts: projects.reduce((sum, project) => sum + (project.artifacts?.length || 0), 0),
    libraryItems: libraryState.items.length,
    libraryTemplates: libraryState.items.filter((item) => item.type === 'template' || item.type === 'prompt').length,
    workflows: Array.isArray(automation.workflows) ? automation.workflows.length : 0,
    pausedWorkflows: Array.isArray(automation.workflows) ? automation.workflows.filter((item) => item.status === 'paused').length : 0,
    pendingApprovals: Array.isArray(automation.approvals) ? automation.approvals.filter((item) => item.status === 'pending').length : 0,
    updatedAt: [projectState.updatedAt, libraryState.updatedAt, automation.updatedAt].filter(Boolean).sort().at(-1) || null
  });
}

/**
 * Builds a portable *ordinary-work* handoff for one local project. It is not
 * an account export, an ownership certificate, a cloud sync record, or an
 * import format. Full encrypted browser-profile recovery remains in Vault.
 */
export function buildProjectHandoffExport(projectId = '', options = {}) {
  const state = loadProjects(options);
  const project = state.projects.find((entry) => entry.id === String(projectId || ''));
  if (!project) throw new Error('Project not found.');
  const createdAt = typeof options.now === 'number'
    ? new Date(options.now).toISOString()
    : nowIso();
  const portableProject = normalizedProject(project);
  return Object.freeze({
    schema: EON_PROJECT_HANDOFF_SCHEMA,
    scope: 'local-ordinary-work-export',
    generatedAt: createdAt,
    ownership: Object.freeze({
      status: 'local-creator-asserted-unverified',
      statement: 'This file records ordinary work saved in this browser profile. It does not prove legal ownership, authorship, publication, licensing, identity, payment, sale, minting, transfer, or public availability.'
    }),
    project: Object.freeze({
      id: portableProject.id,
      title: portableProject.title,
      summary: portableProject.summary,
      status: portableProject.status,
      tasks: Object.freeze(portableProject.tasks.map((task) => Object.freeze({ ...task }))),
      artifacts: Object.freeze(portableProject.artifacts.map((artifact) => Object.freeze({ ...artifact }))),
      createdAt: portableProject.createdAt,
      updatedAt: portableProject.updatedAt
    }),
    recovery: Object.freeze({
      directImportAvailable: false,
      fullProfileBackupRoute: '/capsule',
      guidance: 'This handoff is a readable local work record, not a restore file. Use Vault encrypted backup before a browser reset, device change, or destructive recovery action.'
    }),
    exclusions: Object.freeze([
      'Vault records, credentials, provider settings, secrets and recovery material',
      'Automation definitions, approvals and execution state',
      'Account identity, cloud sync, public analytics, referral, reward, payment, wallet and chain data',
      'Any publication, delivery, ownership, licensing or task-completion claim beyond the local record itself'
    ])
  });
}

export function formatProjectHandoffExport(projectId = '', options = {}) {
  return `${JSON.stringify(buildProjectHandoffExport(projectId, options), null, 2)}\n`;
}

export function getProjectHandoffFilename(projectId = '', options = {}) {
  const handoff = buildProjectHandoffExport(projectId, options);
  const stem = handoff.project.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'project';
  return `eonapp-local-project-handoff-${stem}.json`;
}

export const __workspaceStoreInternals = Object.freeze({
  normalizedProject,
  normalizedTask,
  normalizedArtifact,
  normalizedLibraryItem,
  safeText,
  safeTags
});
