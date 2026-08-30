export const EON_PROJECTS_W704_COMMAND_WORKSPACE_SCHEMA = 'eon.projects.command-workspace.w704.v1';

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 400) => String(value || '').replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

function normalizeProject(project = {}) {
  return freeze({
    id: clean(project.id, 160),
    title: clean(project.title || 'Untitled project', 180),
    summary: clean(project.summary || '', 400),
    status: ['active', 'paused', 'complete'].includes(project.status) ? project.status : 'active',
    taskCount: Array.isArray(project.tasks) ? project.tasks.length : 0,
    artefactCount: Array.isArray(project.artifacts) ? project.artifacts.length : 0,
    updatedAt: clean(project.updatedAt, 80)
  });
}

export function resolveEonProjectsW704CommandWorkspace({ projects = [], selectedProjectId = '' } = {}) {
  const rows = (Array.isArray(projects) ? projects : []).map(normalizeProject).filter((project) => project.id);
  const requested = clean(selectedProjectId, 160);
  const active = rows.find((project) => project.id === requested)
    || rows.find((project) => project.status === 'active')
    || rows[0]
    || null;
  return freeze({
    schema: EON_PROJECTS_W704_COMMAND_WORKSPACE_SCHEMA,
    hasProjects: rows.length > 0,
    projectCount: rows.length,
    activeProjectId: active?.id || '',
    activeProject: active,
    projects: freeze(rows),
    ownsSingleResumeSurface: true,
    automaticNavigation: false,
    automaticExecution: false,
    automaticProviderStart: false
  });
}

export function buildEonProjectsW704CommandStrip(model = {}) {
  const active = model?.activeProject || null;
  if (!active) {
    return freeze({
      schema: EON_PROJECTS_W704_COMMAND_WORKSPACE_SCHEMA,
      state: 'empty',
      eyebrow: 'Project command centre',
      title: 'Start one clear outcome',
      detail: 'Create a local project, then keep its tasks, outputs and reviewed next actions in one workspace.',
      primaryAction: freeze({ id: 'create-project', label: 'New project' }),
      secondaryActions: freeze([]),
      automaticAction: false
    });
  }
  return freeze({
    schema: EON_PROJECTS_W704_COMMAND_WORKSPACE_SCHEMA,
    state: 'ready',
    eyebrow: 'Active project workspace',
    title: active.title,
    detail: active.summary || `${active.taskCount} tasks · ${active.artefactCount} project items`,
    primaryAction: freeze({ id: 'resume-project', label: 'Open workspace', projectId: active.id }),
    secondaryActions: freeze([
      freeze({ id: 'open-atlas', label: 'Open Project Atlas', href: '/projects?view=atlas' }),
      freeze({ id: 'open-automations', label: 'Automations', href: '/automations' }),
      freeze({ id: 'open-vault', label: 'Backup', href: '/vault' })
    ]),
    automaticAction: false
  });
}

export function getEonProjectsW704CommandWorkspaceTruth() {
  return freeze({
    schema: EON_PROJECTS_W704_COMMAND_WORKSPACE_SCHEMA,
    oneResumeSurfaceOnProjects: true,
    selectsExistingProjectOnly: true,
    createsProjectAutomatically: false,
    opensAtlasAutomatically: false,
    startsAiAutomatically: false,
    writesStorage: false,
    performsNavigation: false
  });
}
