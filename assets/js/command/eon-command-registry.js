const freeze = (value) => Object.freeze(value);
const item = (value) => freeze(value);

function normalizeInternalHref(value = '/', fallback = '/') {
  const href = String(value || '').trim();
  // eslint-disable-next-line no-control-regex -- reject C0/DEL in internal navigation paths.
  if (!href.startsWith('/') || href.startsWith('//') || /[\u0000-\u001f\u007f]/.test(href)) return fallback;
  return href;
}

export const EON_COMMAND_REGISTRY_SCHEMA = 'eonapp.quick-command.registry.w725.v2';

const PAGE_MODELS = freeze({
  chat: freeze({
    label: 'EONBOT',
    purpose: 'Continue the conversation or start a focused task.',
    status: 'Your chat stays in this browser unless you explicitly share or export it.',
    continue: item({ label: 'Continue', description: 'Return to the active conversation.', action: 'close', icon: '↗' }),
    create: item({ label: 'New', description: 'Start a clean conversation.', action: 'event', event: 'eon:chat-new-thread', icon: '＋' }),
    jumps: freeze([
      item({ label: 'Create something', href: '/create' }),
      item({ label: 'Open projects', href: '/projects' }),
      item({ label: 'Browse library', href: '/library' })
    ])
  }),
  create: freeze({
    label: 'Create',
    purpose: 'Start, continue, or improve a creation with the right tool.',
    status: 'EONAPP will show provider and execution readiness before a task runs.',
    continue: item({ label: 'Continue', description: 'Return to your current draft or tool.', action: 'close', icon: '↗' }),
    create: item({ label: 'New', description: 'Choose a fresh creation path.', action: 'href', href: '/create?new=1', icon: '＋' }),
    jumps: freeze([
      item({ label: 'AI workspace', href: '/workspace' }),
      item({ label: 'EON Forge', href: '/forge' }),
      item({ label: 'Automations', href: '/automations' })
    ])
  }),
  workspace: freeze({
    label: 'Advanced workspace',
    purpose: 'Continue structured work without losing the simple EONAPP shell.',
    status: 'Advanced tools remain review-first and do not act outside EONAPP automatically.',
    continue: item({ label: 'Continue', description: 'Return to the active workspace.', action: 'close', icon: '↗' }),
    create: item({ label: 'New', description: 'Start from the simple Create route.', action: 'href', href: '/create?new=1', icon: '＋' }),
    jumps: freeze([
      item({ label: 'Projects', href: '/projects' }),
      item({ label: 'EON Forge', href: '/forge' }),
      item({ label: 'Library', href: '/library' })
    ])
  }),
  forge: freeze({
    label: 'EON Forge',
    purpose: 'Build and refine a project with explicit review steps.',
    status: 'Forge changes remain local until you deliberately export, share, or publish them.',
    continue: item({ label: 'Continue', description: 'Return to the current build.', action: 'close', icon: '↗' }),
    create: item({ label: 'New', description: 'Start a new Forge build.', action: 'href', href: '/forge?new=1', icon: '＋' }),
    jumps: freeze([
      item({ label: 'Create', href: '/create' }),
      item({ label: 'Projects', href: '/projects' }),
      item({ label: 'Advanced workspace', href: '/workspace' })
    ])
  }),
  projects: freeze({
    label: 'Projects',
    purpose: 'Resume active work, review status, or create a project.',
    status: 'Project actions require an explicit user decision before work is changed.',
    continue: item({ label: 'Continue', description: 'Return to the active project list.', action: 'close', icon: '↗' }),
    create: item({ label: 'New', description: 'Create a new project.', action: 'href', href: '/projects?new=1', icon: '＋' }),
    jumps: freeze([
      item({ label: 'Create', href: '/create' }),
      item({ label: 'Library', href: '/library' }),
      item({ label: 'EON City', href: '/eoncity' })
    ])
  }),
  library: freeze({
    label: 'Library',
    purpose: 'Find saved work, imports, exports, and reviewed outputs.',
    status: 'Private Library and Vault material is never included in sharing by default.',
    continue: item({ label: 'Continue', description: 'Return to recent Library items.', action: 'close', icon: '↗' }),
    create: item({ label: 'New', description: 'Start a creation that can be saved here.', action: 'href', href: '/create?new=1', icon: '＋' }),
    jumps: freeze([
      item({ label: 'Search chats', action: 'event', event: 'eon:shell:open-search' }),
      item({ label: 'Backup Capsule', href: '/capsule' }),
      item({ label: 'Data & recovery', href: '/settings#data-recovery' })
    ])
  }),
  eoncity: freeze({
    label: 'EON City',
    purpose: 'Use the compact Command Hub or jump directly to a productive station.',
    status: 'City stations open the same real 2D tools used by the normal app.',
    continue: item({ label: 'Continue', description: 'Return to the current City view.', action: 'close', icon: '↗' }),
    create: item({ label: 'City menu', description: 'Open the Command Hub station menu.', action: 'event', event: 'eon:city:open-menu', icon: '⌘' }),
    jumps: freeze([
      item({ label: 'EONBOT Nexus', href: '/?from=city' }),
      item({ label: 'Create Forge', href: '/create?from=city' }),
      item({ label: 'Project Atlas', href: '/projects?from=city' }),
      item({ label: 'Library Vault', href: '/library?from=city' })
    ])
  }),
  automations: freeze({
    label: 'Automations',
    purpose: 'Review real queued, running, approval-required, and completed work.',
    status: 'No automation is represented as active unless a real task state exists.',
    continue: item({ label: 'Continue', description: 'Return to automation status.', action: 'close', icon: '↗' }),
    create: item({ label: 'New', description: 'Prepare a new reviewed automation.', action: 'href', href: '/automations?new=1', icon: '＋' }),
    jumps: freeze([
      item({ label: 'Projects', href: '/projects' }),
      item({ label: 'EONBOT', href: '/?context=automations' }),
      item({ label: 'Local AI', href: '/local-ai' })
    ])
  }),
  'local-ai': freeze({
    label: 'Local AI',
    purpose: 'Check this device, local runtimes, and provider readiness.',
    status: 'Local AI remains opt-in. Use the Local AI setup to detect or prepare an approved on-device path; this command panel never installs software or starts model downloads by itself.',
    continue: item({ label: 'Continue', description: 'Return to device and provider status.', action: 'close', icon: '↗' }),
    create: item({ label: 'Set up', description: 'Open the guided Local AI setup.', action: 'href', href: '/local-ai#setup', icon: '＋' }),
    jumps: freeze([
      item({ label: 'AI & Providers', href: '/vault#provider-check' }),
      item({ label: 'EONBOT', href: '/?context=local-ai' }),
      item({ label: 'Help', href: '/help' })
    ])
  }),
  insights: freeze({
    label: 'Research',
    purpose: 'Start a research question or continue a reviewed analysis.',
    status: 'Research output should be checked before it is relied on or shared.',
    continue: item({ label: 'Continue', description: 'Return to the current research view.', action: 'close', icon: '↗' }),
    create: item({ label: 'New', description: 'Start a new research question.', action: 'href', href: '/insights?new=1', icon: '＋' }),
    jumps: freeze([
      item({ label: 'Ask EONBOT', href: '/?context=research' }),
      item({ label: 'Projects', href: '/projects' }),
      item({ label: 'Library', href: '/library' })
    ])
  }),
  settings: freeze({
    label: 'Settings',
    purpose: 'Find appearance, account, privacy, providers, data, and billing controls.',
    status: 'Settings change only after you choose and confirm an available control.',
    continue: item({ label: 'Continue', description: 'Return to the current settings section.', action: 'close', icon: '↗' }),
    create: item({ label: 'Appearance', description: 'Choose Graphite, Obsidian, or Ember.', action: 'event', event: 'eon:shell:open-appearance', icon: '◐' }),
    jumps: freeze([
      item({ label: 'AI & Providers', href: '/vault#provider-check' }),
      item({ label: 'Data & recovery', href: '/capsule' }),
      item({ label: 'Billing & plan', href: '/billing' }),
      item({ label: 'My Realm', href: '/realm-studio' })
    ])
  }),
  help: freeze({
    label: 'Help',
    purpose: 'Find a clear answer or ask EONBOT for contextual guidance.',
    status: 'Help content describes current product behavior, not internal implementation waves.',
    continue: item({ label: 'Continue', description: 'Return to Help.', action: 'close', icon: '↗' }),
    create: item({ label: 'Ask EONBOT', description: 'Open chat with Help context.', action: 'href', href: '/?context=help', icon: '✦' }),
    jumps: freeze([
      item({ label: 'Getting started', href: '/help#getting-started' }),
      item({ label: 'EON City', href: '/help#eon-city' }),
      item({ label: 'Account & billing', href: '/help#account-billing' })
    ])
  })
});

function normalizePage(page = '') {
  const value = String(page || '').trim().toLowerCase();
  if (PAGE_MODELS[value]) return value;
  if (['market', 'preview-studio', 'apps'].includes(value)) return 'create';
  if (['vault', 'capsule'].includes(value)) return 'library';
  if (['profile', 'billing', 'eon-keys', 'realm-studio'].includes(value)) return 'settings';
  return 'chat';
}

export function getEonCommandPageModel(page = 'chat') {
  const id = normalizePage(page);
  return freeze({ id, ...PAGE_MODELS[id] });
}

const WORK_SURFACE_BY_PAGE = freeze({
  chat: 'chat', create: 'create', workspace: 'command-status', forge: 'create', projects: 'projects',
  library: 'library', eoncity: 'command-status', automations: 'automations', 'local-ai': 'local-ai',
  insights: 'chat', settings: 'my-realm', help: 'help'
});

export function getEonQuickCommands(page = 'chat') {
  const model = getEonCommandPageModel(page);
  const continueCommand = model.id === 'eoncity'
    ? item({ id: 'continue', ...model.continue })
    : item({ id: 'continue', label: model.continue.label, description: model.continue.description, action: 'surface', surface: WORK_SURFACE_BY_PAGE[model.id] || 'chat', icon: model.continue.icon });
  return freeze([
    continueCommand,
    item({ id: 'new', ...model.create }),
    item({ id: 'ask-eonbot', label: 'Ask EONBOT', description: `Get help with ${model.label}.`, action: 'surface', surface: 'chat', icon: '✦' }),
    item({ id: 'share', label: 'Share', description: 'Open the reviewed Share Command Center.', action: 'surface', surface: 'share', icon: '↗' })
  ]);
}

export function getEonCommandSurfaceModel(page = 'chat', { recentItems = [] } = {}) {
  const context = getEonCommandPageModel(page);
  const recent = Array.isArray(recentItems)
    ? recentItems.slice(0, 4).map((entry) => item({
      label: String(entry?.label || entry?.title || 'Recent item').trim().slice(0, 80) || 'Recent item',
      href: normalizeInternalHref(entry?.href, '/')
    }))
    : [];
  return freeze({
    schema: EON_COMMAND_REGISTRY_SCHEMA,
    page: context.id,
    label: context.label,
    purpose: context.purpose,
    status: context.status,
    primary: getEonQuickCommands(context.id),
    recent: freeze(recent),
    jumps: context.jumps
  });
}
