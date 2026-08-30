/**
 * W630 — calm whole-app UX contract.
 *
 * This module coordinates shell language and local route continuity only. It
 * never sends files, activates a provider, purchases a plan, grants access,
 * restores a backup, or executes a reviewed action.
 */

export const EON_W630_UX_SCHEMA = 'eon.whole-app-ux.w630.v1';
export const EON_W630_ACTIVE_CONTEXT_KEY = 'eon:active-project-context:w630:v1';
export const EON_W630_COMMAND_SHORTCUT = 'mod+k';

export const EON_W630_ROUTE_CONTEXT_ALLOWLIST = Object.freeze([
  '/', '/chat', '/create', '/projects', '/workspace', '/forge', '/automations',
  '/library', '/eoncity', '/vault', '/profile', '/settings', '/help'
]);

export const EON_W630_STATUS_VOCABULARY = Object.freeze({
  idle: 'Ready',
  loading: 'Loading…',
  checking: 'Checking…',
  review: 'Ready for review',
  waiting: 'Waiting for confirmation',
  saving: 'Saving locally…',
  saved: 'Saved locally',
  unavailable: 'Unavailable on this device',
  retry: 'Try again',
  cancelled: 'Cancelled',
  failed: 'Could not complete this action'
});

export const EON_W630_COMMANDS = Object.freeze([
  Object.freeze({ id: 'new-chat', label: 'New chat', href: '/?new=1', keywords: ['chat', 'eonbot', 'ask'], effect: 'navigation' }),
  Object.freeze({ id: 'create', label: 'Create image or video', href: '/create', keywords: ['creator', 'image', 'video'], effect: 'navigation' }),
  Object.freeze({ id: 'projects', label: 'Open Projects', href: '/projects', keywords: ['project', 'continue', 'outcome'], effect: 'navigation' }),
  Object.freeze({ id: 'workspace', label: 'Open advanced workspace', href: '/workspace', keywords: ['tools', 'workspace', 'automation'], effect: 'navigation' }),
  Object.freeze({ id: 'forge', label: 'Open EON Forge', href: '/forge', keywords: ['code', 'website', 'build'], effect: 'navigation' }),
  Object.freeze({ id: 'library', label: 'Open Library', href: '/library', keywords: ['saved', 'asset', 'output'], effect: 'navigation' }),
  Object.freeze({ id: 'city', label: 'Enter EON City', href: '/eoncity', keywords: ['city', 'realm', 'game'], effect: 'navigation' }),
  Object.freeze({ id: 'vault', label: 'Open Vault', href: '/vault', keywords: ['backup', 'keys', 'security'], effect: 'navigation' }),
  Object.freeze({ id: 'help', label: 'Open contextual help', href: '/help', keywords: ['support', 'guide', 'learn'], effect: 'navigation' })
]);

const SECRET_PATTERN = /(?:api[_ -]?key|access[_ -]?token|refresh[_ -]?token|password|passphrase|private[_ -]?key|seed phrase|mnemonic|authorization)\s*[:=]/i;

function cleanText(value = '', limit = 180) {
  const text = Array.from(String(value || '')).filter((character) => {
    const code = character.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('').replace(/\s+/g, ' ').trim().slice(0, limit);
  if (SECRET_PATTERN.test(text)) throw new Error('Project context cannot contain credentials or recovery material.');
  return text;
}

function escapeMarkup(value = '') {
  return String(value || '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function getStorage(options = {}) {
  if (options.storage) return options.storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

export function normalizeW630Path(value = '/') {
  const path = String(value || '/').split('?')[0].split('#')[0].replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  return path === '/index' ? '/' : path;
}

export function isW630ContextRoute(value = '/') {
  return EON_W630_ROUTE_CONTEXT_ALLOWLIST.includes(normalizeW630Path(value));
}

export function normalizeActiveProjectContext(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const route = isW630ContextRoute(source.route) ? normalizeW630Path(source.route) : '/projects';
  const context = {
    schema: EON_W630_UX_SCHEMA,
    projectId: cleanText(source.projectId, 140),
    projectTitle: cleanText(source.projectTitle || 'Active project', 180),
    outcome: cleanText(source.outcome, 360),
    route,
    updatedAt: String(source.updatedAt || new Date().toISOString()),
    localOnly: true,
    secretMaterialIncluded: false
  };
  if (!context.projectId) return null;
  return Object.freeze(context);
}

export function saveActiveProjectContext(input = {}, options = {}) {
  const context = normalizeActiveProjectContext(input);
  if (!context) return Object.freeze({ ok: false, reason: 'project-id-required' });
  const storage = getStorage(options);
  storage?.setItem?.(EON_W630_ACTIVE_CONTEXT_KEY, JSON.stringify(context));
  try { globalThis.dispatchEvent?.(new CustomEvent('eon:active-project-context-changed', { detail: context })); } catch {}
  return Object.freeze({ ok: true, context });
}

export function readActiveProjectContext(options = {}) {
  const storage = getStorage(options);
  try {
    const parsed = JSON.parse(String(storage?.getItem?.(EON_W630_ACTIVE_CONTEXT_KEY) || 'null'));
    return normalizeActiveProjectContext(parsed);
  } catch {
    return null;
  }
}

export function clearActiveProjectContext(options = {}) {
  getStorage(options)?.removeItem?.(EON_W630_ACTIVE_CONTEXT_KEY);
  try { globalThis.dispatchEvent?.(new CustomEvent('eon:active-project-context-changed', { detail: null })); } catch {}
  return Object.freeze({ ok: true });
}

export function searchW630Commands(query = '', options = {}) {
  const text = cleanText(query, 120).toLowerCase();
  const currentPath = normalizeW630Path(options.currentPath || '/');
  const active = readActiveProjectContext(options);
  const commands = active
    ? [Object.freeze({ id: 'continue-project', label: `Continue ${active.projectTitle}`, href: active.route || '/projects', keywords: ['continue', 'project', active.projectTitle.toLowerCase()], effect: 'navigation', projectId: active.projectId }), ...EON_W630_COMMANDS]
    : EON_W630_COMMANDS;
  return commands
    .filter((entry) => normalizeW630Path(entry.href) !== currentPath || entry.id === 'new-chat')
    .filter((entry) => !text || `${entry.label} ${(entry.keywords || []).join(' ')}`.toLowerCase().includes(text))
    .slice(0, 10);
}

export function buildComposerTruth(input = {}) {
  const attachmentCount = Math.max(0, Math.min(20, Number(input.attachmentCount || 0)));
  const runtime = ['not-configured', 'checking', 'local', 'direct-byok', 'guide', 'unavailable'].includes(input.runtime) ? input.runtime : 'not-configured';
  return Object.freeze({
    schema: EON_W630_UX_SCHEMA,
    attachmentCount,
    attachmentsStayLocalUntilSend: true,
    attachmentBodiesIncludedOnlyAfterExplicitSend: true,
    voiceState: input.voiceActive === true ? 'explicitly-active' : 'off',
    microphoneStartsAutomatically: false,
    captionsPreferred: true,
    runtime,
    hiddenCloudFallback: false,
    reviewedActionsExecuteAutomatically: false,
    sendEnabled: input.busy !== true
  });
}

export function resolveW630ContextHelp(pathname = '/') {
  const path = normalizeW630Path(pathname);
  const rows = {
    '/': ['Ask EONBOT', 'Files stay local until you explicitly send them.'],
    '/chat': ['Chat with EONBOT', 'Voice input always needs a tap and browser permission.'],
    '/create': ['Create', 'Choose Local, Direct BYOK or Guide. EONAPP never silently switches a Local job to a hosted provider.'],
    '/projects': ['Projects', 'Keep ordinary work here. Credentials and recovery material belong in Vault.'],
    '/workspace': ['Advanced workspace', 'Review every external or scheduled action before it can run.'],
    '/forge': ['EON Forge', 'Preview and export locally. Deployment remains separate and permissioned.'],
    '/automations': ['Automations', 'Drafts and schedules are not remote execution proof.'],
    '/library': ['Library', 'Saved assets and reusable work stay separate from Vault secrets.'],
    '/eoncity': ['EON City', 'One protected renderer. Productive actions remain review-first.'],
    '/vault': ['Vault', 'Account data, local work, provider credentials and backups have separate custody rules.']
  };
  const [title, message] = rows[path] || ['EONAPP help', 'This surface keeps actions explicit and user-controlled.'];
  return Object.freeze({ schema: EON_W630_UX_SCHEMA, path, title, message, href: `/help?from=${encodeURIComponent(path)}` });
}

export function buildLockedFeaturePrompt(input = {}) {
  const state = ['available', 'trialing', 'locked', 'pending', 'unavailable'].includes(input.state) ? input.state : 'locked';
  const actionHref = state === 'available' ? cleanText(input.href || '/', 240) : '/billing';
  return Object.freeze({
    schema: EON_W630_UX_SCHEMA,
    state,
    title: cleanText(input.title || (state === 'locked' ? 'Available on another plan' : 'Feature status'), 120),
    message: cleanText(input.message || 'Review the feature and plan details before making a choice.', 300),
    actionLabel: state === 'available' ? 'Open feature' : 'Review plans',
    actionHref,
    dismissible: true,
    countdown: false,
    urgencyClaim: false,
    automaticCheckout: false,
    automaticUpgrade: false
  });
}

function renderCommandRows(commands = []) {
  return commands.length
    ? commands.map((entry) => `<a href="${entry.href}" data-eon-command-id="${entry.id}"><span>${entry.label}</span><small>${entry.effect === 'navigation' ? 'Open' : 'Review'}</small></a>`).join('')
    : '<p>No matching EONAPP command.</p>';
}

export function installW630WholeAppUx(options = {}) {
  const doc = options.document || globalThis.document;
  if (!doc?.body || doc.querySelector('[data-eon-w630-command-dialog]')) return Object.freeze({ installed: false, reason: 'not-available-or-already-installed' });
  const shell = doc.querySelector('.eon-app-sidebar');
  if (!shell) return Object.freeze({ installed: false, reason: 'shell-required' });
  const dialog = doc.createElement('dialog');
  dialog.className = 'eon-w630-command-dialog';
  dialog.dataset.eonW630CommandDialog = '1';
  dialog.innerHTML = '<form method="dialog"><div class="eon-w630-command-head"><div><strong>Search EONAPP</strong><span>Navigation only · no action executes from this menu</span></div><button value="close" aria-label="Close command search">×</button></div><label><span class="sr-only">Search commands</span><input type="search" data-eon-w630-command-input placeholder="Search Chat, Create, Projects, Forge, Vault…" autocomplete="off" /></label><div class="eon-w630-command-results" data-eon-w630-command-results></div></form>';
  doc.body.appendChild(dialog);
  const input = dialog.querySelector('[data-eon-w630-command-input]');
  const results = dialog.querySelector('[data-eon-w630-command-results]');
  const render = () => { if (results) results.innerHTML = renderCommandRows(searchW630Commands(input?.value || '', { currentPath: globalThis.location?.pathname || '/' })); };
  const open = () => { render(); dialog.showModal?.(); globalThis.requestAnimationFrame?.(() => input?.focus()); };
  input?.addEventListener('input', render);
  doc.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === 'k') { event.preventDefault(); open(); }
  });
  shell.querySelector('[data-eon-shell-action="search"]')?.setAttribute('aria-keyshortcuts', 'Control+K Meta+K');

  const context = readActiveProjectContext();
  const pageType = String(doc.body.dataset.eonAppPage || doc.body.dataset.pageType || '').toLowerCase();
  if (context && pageType !== 'projects') {
    doc.body.dataset.eonProjectContext = 'active';
    const strip = doc.createElement('section');
    strip.className = 'eon-w630-project-strip';
    strip.dataset.eonW630ProjectStrip = '1';
    strip.innerHTML = `<div><span>Active project</span><strong>${escapeMarkup(context.projectTitle)}</strong></div><a href="${escapeMarkup(context.route)}">Continue</a><button type="button" aria-label="Clear active project context">×</button>`;
    strip.querySelector('button')?.addEventListener('click', () => {
      clearActiveProjectContext();
      strip.remove();
      delete doc.body.dataset.eonProjectContext;
    });
    const main = doc.querySelector('main');
    main?.prepend(strip);
  } else {
    delete doc.body.dataset.eonProjectContext;
  }

  // L95: Help remains available from Profile/More and Quick Command Advanced.
  // Do not mount another persistent floating '?' over the composer or City HUD.
  return Object.freeze({ installed: true, schema: EON_W630_UX_SCHEMA, commandCount: EON_W630_COMMANDS.length, persistentHelpBubble: false });
}

export function validateW630WholeAppUxContract() {
  const checks = [
    EON_W630_COMMANDS.length >= 8,
    EON_W630_ROUTE_CONTEXT_ALLOWLIST.includes('/eoncity'),
    EON_W630_ROUTE_CONTEXT_ALLOWLIST.includes('/vault'),
    buildComposerTruth({ runtime: 'local' }).hiddenCloudFallback === false,
    buildComposerTruth({ voiceActive: false }).microphoneStartsAutomatically === false,
    buildLockedFeaturePrompt({ state: 'locked' }).automaticCheckout === false,
    buildLockedFeaturePrompt({ state: 'locked' }).dismissible === true,
    resolveW630ContextHelp('/forge').message.includes('Deployment')
  ];
  return Object.freeze({ schema: EON_W630_UX_SCHEMA, ok: checks.every(Boolean), passed: checks.filter(Boolean).length, total: checks.length });
}
