const freeze = (value) => Object.freeze(value);
const entry = (value) => freeze(value);

export const EON_WORK_SURFACE_SCHEMA = 'eonapp.work-surface.registry.w748.v2';
export const EON_WORK_SURFACE_OPEN_EVENT = 'eon:work-surface-open';
export const EON_WORK_SURFACE_CLOSE_EVENT = 'eon:work-surface-close';
export const EON_WORK_SURFACE_PRESENTATION_EVENT = 'eon:work-surface-presentation';
export const EON_WORK_SURFACE_MINIMIZE_EVENT = 'eon:work-surface-minimize';
export const EON_WORK_SURFACE_RESTORE_EVENT = 'eon:work-surface-restore';
export const EON_WORK_SURFACE_PRESENTATION_MODES = freeze(['focus', 'dock', 'sheet']);

const PRODUCTIVITY_ADAPTER = '/assets/js/work-surface/adapters/eon-productivity-panel.js';
const CHAT_ADAPTER = '/assets/js/work-surface/adapters/eon-chat-panel.js';
const NEXUS_ADAPTER = '/assets/js/work-surface/adapters/eon-nexus-panel.js';
const COMMAND_CENTRE_ADAPTER = '/assets/js/work-surface/adapters/eon-command-centre-panel.js';
const SURFACES = freeze({
  nexus: entry({ id: 'nexus', label: 'Living Nexus', eyebrow: 'EONCITY Command Core', description: 'Inspect the same privacy-projected EONBOT, project, task, approval, result, provider and mission state that drives the central 3D Nexus.', fallbackHref: '/', adapter: NEXUS_ADAPTER }),
  chat: entry({ id: 'chat', label: 'EONBOT', eyebrow: 'Conversation workspace', description: 'Ask, continue and shape the next useful step without leaving the familiar EONAPP shell.', fallbackHref: '/', adapter: CHAT_ADAPTER }),
  create: entry({ id: 'create', label: 'Create', eyebrow: 'Creation workspace', description: 'Choose the result you want and open the simplest honest execution path.', fallbackHref: '/create', adapter: PRODUCTIVITY_ADAPTER }),
  projects: entry({ id: 'projects', label: 'Projects', eyebrow: 'Project Atlas', description: 'Resume active work, review next actions and keep outcomes organised.', fallbackHref: '/projects', adapter: PRODUCTIVITY_ADAPTER }),
  library: entry({ id: 'library', label: 'Library', eyebrow: 'Library Vault', description: 'Find saved local work and move it into the next task without exposing private data.', fallbackHref: '/library', adapter: PRODUCTIVITY_ADAPTER }),
  share: entry({ id: 'share', label: 'Share Command Center', eyebrow: 'Review before sending', description: 'Create a signed public link, QR or reviewed social handoff without automatic posting.', fallbackHref: '/', adapter: '/assets/js/work-surface/adapters/eon-share-panel.js' }),
  'creator-capture': entry({ id: 'creator-capture', label: 'Creator Capture', eyebrow: 'Local recording and review', description: 'Record a chosen tab or window locally, save it to Creator Library and share only after review.', fallbackHref: '/create', adapter: '/assets/js/work-surface/adapters/eon-creator-capture-panel.js' }),
  plans: entry({ id: 'plans', label: 'Plans & access', eyebrow: 'Membership console', description: 'Review current server-confirmed access and compare EONAPP subscription tiers.', fallbackHref: '/billing', adapter: '/assets/js/work-surface/adapters/eon-plans-panel.js' }),
  'command-centre': entry({ id: 'command-centre', label: 'Living Command Centre', eyebrow: 'Five live walls · real receipts only', description: 'Review projects, tasks, approvals, results, providers, Atlas, transit and genuine Agent Theatre receipts in one City Dock.', fallbackHref: '/projects', adapter: COMMAND_CENTRE_ADAPTER }),
  'agent-theatre': entry({ id: 'agent-theatre', label: 'Genuine Agent Theatre', eyebrow: 'Receipt-backed lifecycle', description: 'Inspect real queued, preparing, waiting, running, paused, failed, cancelled and completed receipts without simulated workers.', fallbackHref: '/automations', adapter: COMMAND_CENTRE_ADAPTER }),
  'command-status': entry({ id: 'command-status', label: 'Command Status', eyebrow: 'Real work only', description: 'Review projects, local Library items and genuine automation states in one calm summary.', fallbackHref: '/projects', adapter: COMMAND_CENTRE_ADAPTER }),
  automations: entry({ id: 'automations', label: 'Automations', eyebrow: 'Approval-first automation', description: 'Review real queued, running, approval-required and completed tasks.', fallbackHref: '/automations', adapter: PRODUCTIVITY_ADAPTER }),
  'local-ai': entry({ id: 'local-ai', label: 'Local AI', eyebrow: 'Device and provider readiness', description: 'Review this device, local runtimes and provider setup without automatic installation.', fallbackHref: '/local-ai', adapter: PRODUCTIVITY_ADAPTER }),
  help: entry({ id: 'help', label: 'Help', eyebrow: 'Current product guidance', description: 'Find the right area quickly or ask EONBOT with useful context.', fallbackHref: '/help', adapter: PRODUCTIVITY_ADAPTER }),
  'my-realm': entry({ id: 'my-realm', label: 'My Realm', eyebrow: 'Personal City space', description: 'Choose a fixed personal layout, useful shortcuts and a safe read-only Realm Card.', fallbackHref: '/realm-studio', adapter: PRODUCTIVITY_ADAPTER })
});

const ALIASES = freeze({
  eonbot: 'chat', forge: 'create', workspace: 'command-centre', command: 'command-centre', theatre: 'agent-theatre', vault: 'library', capsule: 'library',
  membership: 'plans', billing: 'plans', realm: 'my-realm', 'realm-studio': 'my-realm', capture: 'creator-capture'
});

export function normalizeEonWorkSurfacePresentationMode(value = 'focus') {
  const mode = String(value || '').trim().toLowerCase();
  return EON_WORK_SURFACE_PRESENTATION_MODES.includes(mode) ? mode : 'focus';
}

export function normalizeEonWorkSurfaceId(value = 'chat') {
  const raw = String(value || '').trim().toLowerCase();
  const id = ALIASES[raw] || raw;
  return SURFACES[id] ? id : 'chat';
}

export function getEonWorkSurfaceDefinition(value = 'chat') {
  return SURFACES[normalizeEonWorkSurfaceId(value)];
}

export function listEonWorkSurfaceDefinitions() {
  return freeze(Object.values(SURFACES));
}

export function normalizeEonWorkSurfaceInvocation(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const id = normalizeEonWorkSurfaceId(source.id || source.surface || source.panel || source.page);
  const definition = getEonWorkSurfaceDefinition(id);
  const context = source.context && typeof source.context === 'object' && !Array.isArray(source.context) ? { ...source.context } : {};
  const presentationMode = normalizeEonWorkSurfacePresentationMode(source.presentationMode || context.presentationMode || 'focus');
  const sessionId = String(source.sessionId || context.citySessionId || '').slice(0, 160);
  return freeze({
    schema: EON_WORK_SURFACE_SCHEMA,
    id,
    source: String(source.source || 'unknown').slice(0, 64),
    explicitUserAction: source.explicitUserAction === true,
    presentationMode,
    sessionId,
    trigger: source.trigger || null,
    definition,
    context: freeze({ ...context, presentationMode })
  });
}

export function dispatchEonWorkSurfaceOpen(detail = {}, environment = globalThis) {
  if (typeof environment?.dispatchEvent !== 'function') return false;
  const invocation = normalizeEonWorkSurfaceInvocation(detail);
  let event = null;
  if (typeof environment.CustomEvent === 'function') event = new environment.CustomEvent(EON_WORK_SURFACE_OPEN_EVENT, { detail: invocation });
  else if (typeof environment.Event === 'function') {
    event = new environment.Event(EON_WORK_SURFACE_OPEN_EVENT);
    try { Object.defineProperty(event, 'detail', { configurable: true, enumerable: true, value: invocation }); } catch {}
  }
  if (!event) return false;
  environment.dispatchEvent(event);
  return true;
}
