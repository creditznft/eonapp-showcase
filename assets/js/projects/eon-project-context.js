/**
 * RT92 project-context foundation.
 *
 * This is metadata ON the existing Projects records, not a new project engine,
 * client database, account system or cloud workspace. Project-scoped AI memory
 * already uses project:<projectId>, so client projects stay isolated by the
 * existing project boundary unless a future reviewed client-shared scope is
 * deliberately introduced.
 */

export const EON_PROJECT_CONTEXT_SCHEMA = 'eonapp.project-context.rt92.v1';
export const EON_PROJECT_CONTEXT_MODES = Object.freeze(['personal', 'business', 'client']);
const MODE_SET = new Set(EON_PROJECT_CONTEXT_MODES);
const freeze = (value) => Object.freeze(value);
const SAFE_REF = /^[a-z0-9][a-z0-9._:-]{0,79}$/i;
const SECRET_LIKE = /(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|client[_ -]?secret|password|private[_ -]?key|seed\s*phrase|mnemonic|Bearer\s+)/i;

function label(value = '', max = 120) {
  const text = String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  return SECRET_LIKE.test(text) ? '' : text;
}

function ref(value = '') {
  const text = String(value || '').trim().slice(0, 80);
  return SAFE_REF.test(text) ? text : '';
}

export function normalizeEonProjectContext(input = {}, { projectId = '' } = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const mode = MODE_SET.has(String(source.mode || '').toLowerCase()) ? String(source.mode).toLowerCase() : 'personal';
  const projectRef = ref(projectId);
  const clientRef = mode === 'client' ? ref(source.clientRef) : '';
  const clientLabel = mode === 'client' ? label(source.clientLabel || source.label, 120) : '';
  const businessLabel = mode === 'business' ? label(source.businessLabel || source.label, 120) : '';
  return freeze({
    schema: EON_PROJECT_CONTEXT_SCHEMA,
    mode,
    clientRef,
    clientLabel,
    businessLabel,
    memoryScope: projectRef ? `project:${projectRef}` : '',
    memoryIsolation: 'project-id',
    clientSharedMemoryActive: false,
    accountWorkspaceClaimed: false,
    cloudSyncClaimed: false
  });
}

export function getEonProjectContextLabel(context = {}) {
  const normalized = normalizeEonProjectContext(context);
  if (normalized.mode === 'client') return normalized.clientLabel || normalized.clientRef || 'Client project';
  if (normalized.mode === 'business') return normalized.businessLabel || 'Business project';
  return 'Personal project';
}

/** Read-only grouping over existing project records. No client records are created. */
export function projectEonClientPortfolio(projects = []) {
  const groups = new Map();
  for (const project of Array.isArray(projects) ? projects : []) {
    const context = normalizeEonProjectContext(project?.workspaceContext, { projectId: project?.id });
    if (context.mode !== 'client' || !context.clientRef) continue;
    const current = groups.get(context.clientRef) || {
      clientRef: context.clientRef,
      clientLabel: context.clientLabel || context.clientRef,
      projects: [],
      activeProjects: 0,
      completeProjects: 0
    };
    current.projects.push(freeze({
      projectId: String(project?.id || ''),
      title: label(project?.title, 180) || 'Untitled project',
      status: String(project?.status || 'active'),
      memoryScope: context.memoryScope
    }));
    if (project?.status === 'complete') current.completeProjects += 1;
    else current.activeProjects += 1;
    groups.set(context.clientRef, current);
  }
  return freeze([...groups.values()].map((group) => freeze({
    ...group,
    projects: freeze(group.projects)
  })));
}

export function validateEonProjectContextFoundation() {
  const errors = [];
  const personal = normalizeEonProjectContext({}, { projectId: 'project_alpha' });
  if (personal.mode !== 'personal' || personal.memoryScope !== 'project:project_alpha') errors.push('Existing projects must normalize to personal project-scoped context.');
  const client = normalizeEonProjectContext({ mode: 'client', clientRef: 'client-acme', clientLabel: 'Acme' }, { projectId: 'project_beta' });
  if (client.mode !== 'client' || client.clientRef !== 'client-acme' || client.memoryScope !== 'project:project_beta') errors.push('Client metadata must preserve project memory isolation.');
  if (client.clientSharedMemoryActive || client.accountWorkspaceClaimed || client.cloudSyncClaimed) errors.push('Foundation must not claim client-shared memory, account workspace or cloud sync.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_PROJECT_CONTEXT_SCHEMA });
}

export default freeze({
  EON_PROJECT_CONTEXT_SCHEMA,
  EON_PROJECT_CONTEXT_MODES,
  normalizeEonProjectContext,
  getEonProjectContextLabel,
  projectEonClientPortfolio,
  validateEonProjectContextFoundation
});
