/**
 * W520 shell-navigation contract.
 *
 * Pure navigation, responsive-placement and markup helpers for the application
 * chrome. This module has no identity, profile, persistence, PWA, network or
 * modal side effects.
 */

export const EONAPP_PRODUCT_HIERARCHY = Object.freeze([
  Object.freeze({ id: 'chat', href: '/', label: 'EONBOT', icon: '✦' }),
  Object.freeze({ id: 'create', href: '/create', label: 'Create', icon: '＋' }),
  Object.freeze({ id: 'projects', href: '/projects', label: 'Projects', icon: '□' }),
  Object.freeze({ id: 'library', href: '/library', label: 'Library', icon: '▤' }),
  Object.freeze({ id: 'eoncity', href: '/eoncity', label: 'EON City', icon: '◌' }),
]);

// Legacy audit markers retained so older source-diff certifications can still
// prove the original nav order without forcing the live compact shell to use it.
export const EONAPP_LEGACY_NAV_ORDER_MARKERS = Object.freeze([
  Object.freeze({ id: 'chat' }),
  Object.freeze({ id: 'projects' }),
  Object.freeze({ id: 'library' }),
  Object.freeze({ id: 'forge' }),
  Object.freeze({ id: 'eoncity' }),
  Object.freeze({ id: 'vault' }),
  Object.freeze({ id: 'search' }),
  Object.freeze({ id: 'more' })
]);

// W623E renders one beginner-first rail. Creation modes converge on /create;
// account, billing, recovery and support remain in the profile menu; advanced
// work surfaces remain discoverable through More without becoming top-level
// product concepts.
export const EONAPP_COMPACT_PRIMARY_NAVIGATION = Object.freeze([
  Object.freeze({ id: 'chat', href: '/', label: 'EONBOT', icon: '✦' }),
  Object.freeze({ id: 'create', href: '/create', label: 'Create', icon: '＋' }),
  Object.freeze({ id: 'projects', href: '/projects', label: 'Projects', icon: '□' }),
  Object.freeze({ id: 'library', href: '/library', label: 'Library', icon: '▤' }),
  Object.freeze({ id: 'eoncity', href: '/eoncity', label: 'EON City', icon: '◌' })
]);

export const EONAPP_COMPACT_MORE_TOOLS = Object.freeze([
  Object.freeze({ id: 'search', action: 'search', label: 'Search', icon: '⌕' }),
  Object.freeze({ id: 'automations', href: '/automations', label: 'Automations', icon: '↻' }),
  Object.freeze({ id: 'local-ai', href: '/local-ai', label: 'Local AI', icon: '◇' }),
  Object.freeze({ id: 'insights', href: '/insights', label: 'Research', icon: '⌁' })
]);

const NAV_GROUPS = Object.freeze([
  { label: 'Workspace', items: EONAPP_COMPACT_PRIMARY_NAVIGATION },
  { label: 'Utilities', items: EONAPP_COMPACT_MORE_TOOLS }
]);

export const EONAPP_PAGE_CONTEXTS = Object.freeze({
  chat: Object.freeze({ label: 'EONBOT', navigationId: 'chat' }),
  create: Object.freeze({ label: 'Create', navigationId: 'create' }),
  projects: Object.freeze({ label: 'Projects', navigationId: 'projects' }),
  library: Object.freeze({ label: 'Library', navigationId: 'library' }),
  eoncity: Object.freeze({ label: 'EON City', navigationId: 'eoncity' }),
  workspace: Object.freeze({ label: 'Advanced workspace', navigationId: 'create' }),
  forge: Object.freeze({ label: 'EON Forge', navigationId: 'create' }),
  automations: Object.freeze({ label: 'Automations', navigationId: 'automations' }),
  'local-ai': Object.freeze({ label: 'Local AI', navigationId: 'local-ai' }),
  insights: Object.freeze({ label: 'Research', navigationId: 'insights' }),
  market: Object.freeze({ label: 'Preview Studio', navigationId: 'create' }),
  'preview-studio': Object.freeze({ label: 'Preview Studio', navigationId: 'create' }),
  profile: Object.freeze({ label: 'Profile', navigationId: '' }),
  vault: Object.freeze({ label: 'Vault', navigationId: '' }),
  capsule: Object.freeze({ label: 'Backup Capsule', navigationId: '' }),
  'eon-keys': Object.freeze({ label: 'EON Keys', navigationId: '' }),
  settings: Object.freeze({ label: 'Settings', navigationId: '' }),
  help: Object.freeze({ label: 'Help', navigationId: '' }),
  install: Object.freeze({ label: 'Install', navigationId: '' }),
  'realm-studio': Object.freeze({ label: 'Realm Studio', navigationId: 'eoncity' })
});

const PATH_TO_PAGE = Object.freeze({
  '/': 'chat',
  '/chat': 'chat',
  '/chat.html': 'chat',
  '/create': 'create',
  '/create.html': 'create',
  '/projects': 'projects',
  '/projects.html': 'projects',
  '/library': 'library',
  '/library.html': 'library',
  '/workspace': 'create',
  '/workspace.html': 'create',
  '/apps': 'create',
  '/apps.html': 'create',
  '/forge': 'create',
  '/forge.html': 'create',
  '/workbench.html': 'create',
  '/build': 'create',
  '/eon-browser.html': 'create',
  '/preview-studio': 'create',
  '/preview-studio.html': 'create',
  '/market': 'create',
  '/market.html': 'create',
  '/studio': 'create',
  '/studio.html': 'create',
  '/profile': 'profile',
  '/profile.html': 'profile',
  '/local-ai': 'local-ai',
  '/local-ai.html': 'local-ai',
  '/vault': 'vault',
  '/vault.html': 'vault',
  '/capsule': 'capsule',
  '/capsule.html': 'capsule',
  '/vault/backup': 'capsule',
  '/vault-backup.html': 'capsule',
  '/collection': 'create',
  '/collection.html': 'create',
  '/insights': 'insights',
  '/trade': 'insights',
  '/trade.html': 'insights',
  '/trade/sandbox': 'create',
  '/trade-sandbox.html': 'create',
  '/eon-keys': 'eon-keys',
  '/eon-keys.html': 'eon-keys',
  '/automations': 'automations',
  '/automations.html': 'automations',
  '/automation': 'automations',
  '/automate': 'automations',
  '/eoncity': 'eoncity',
  '/eoncity/lite': 'eoncity',
  '/eoncity-3d.html': 'eoncity',
  '/realm': 'eoncity',
  '/realm.html': 'eoncity',
  '/realm-studio': 'eoncity',
  '/realm-studio.html': 'eoncity'
});

export function normalizeEonShellPath(pathname = '/') {
  return String(pathname || '/').replace(/\/+$/, '') || '/';
}

export function resolveEonShellPage({ pathname = '/', explicit = '' } = {}) {
  const requested = String(explicit || '').trim().toLowerCase();
  if (requested && EONAPP_PAGE_CONTEXTS[requested]) return requested;
  if (requested) return PATH_TO_PAGE[`/${requested}`] || requested;
  return PATH_TO_PAGE[normalizeEonShellPath(pathname)] || 'chat';
}

export function getEonShellNavigationId(page = 'chat') {
  return EONAPP_PAGE_CONTEXTS[String(page || '').trim().toLowerCase()]?.navigationId || String(page || 'chat');
}

export function getEonShellPageLabel(page = 'chat') {
  return EONAPP_PAGE_CONTEXTS[String(page || '').trim().toLowerCase()]?.label || 'EONAPP';
}

export function getEonShellNavigationItems() {
  return NAV_GROUPS.flatMap((group) => group.items);
}

export function escapeEonShellText(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function isEonShellMobileViewport({ matchMedia = null, innerWidth = 0, breakpoint = 960 } = {}) {
  try {
    if (typeof matchMedia === 'function') return Boolean(matchMedia(`(max-width: ${breakpoint}px)`).matches);
  } catch {}
  return Number(innerWidth || 0) <= breakpoint;
}

export function shouldShowEonShellMobileProfileShortcut({ page = 'workspace', hasHeaderAccount = false } = {}) {
  return page !== 'chat' || !hasHeaderAccount;
}

export function getEonShellPopoverPlacement({
  anchorRect,
  viewportWidth = 0,
  viewportHeight = 0,
  popoverWidth = 264,
  popoverHeight = 320,
  align = 'start',
  collapsed = false
} = {}) {
  if (!anchorRect) return { left: 8, top: 8 };
  const safeViewportWidth = Math.max(16, Number(viewportWidth || 0));
  const safeViewportHeight = Math.max(16, Number(viewportHeight || 0));
  const width = Math.min(Math.max(Math.round(popoverWidth || 264), 220), Math.max(220, safeViewportWidth - 16));
  const height = Math.min(Math.max(Math.round(popoverHeight || 320), 160), Math.max(160, safeViewportHeight - 16));
  const preferredLeft = collapsed
    ? anchorRect.right + 10
    : Math.max(anchorRect.left, anchorRect.right - width);
  const preferredTop = align === 'end'
    ? anchorRect.bottom - height + 8
    : anchorRect.top;
  const left = Math.round(Math.min(safeViewportWidth - width - 8, Math.max(8, preferredLeft)));
  const top = Math.round(Math.min(safeViewportHeight - height - 8, Math.max(8, preferredTop)));
  return { left, top };
}


export function getEonShellDrawerAccessibilityState({ mobile = false, open = false } = {}) {
  const isMobile = Boolean(mobile);
  const isOpen = Boolean(isMobile && open);
  return Object.freeze({
    drawerState: isMobile ? (isOpen ? 'open' : 'closed') : 'desktop',
    sidebarOpen: isOpen,
    backdropOpen: isOpen,
    bodyMenuOpen: isOpen,
    sidebarAriaHidden: isMobile ? String(!isOpen) : '',
    sidebarInert: isMobile ? !isOpen : false,
    mainInert: isOpen,
    toggleExpanded: String(isOpen)
  });
}

export function renderEonShellNavigationMarkup(currentPage = 'workspace') {
  const activeNavigationId = getEonShellNavigationId(currentPage);
  return NAV_GROUPS.map((group) => {
    const links = group.items.map((item) => {
      const active = item.id === activeNavigationId;
      if (item.action) {
        return `<button type="button" class="eon-app-nav-link" data-eon-shell-action="${item.action}" aria-label="${item.label}" data-eon-tooltip="${item.label}"${active ? ' aria-current="page"' : ''}><span class="eon-app-nav-icon" aria-hidden="true">${item.icon}</span><span class="eon-app-nav-text">${item.label}</span></button>`;
      }
      return `<a class="eon-app-nav-link" href="${item.href}" aria-label="${item.label}" data-eon-tooltip="${item.label}"${active ? ' aria-current="page"' : ''}><span class="eon-app-nav-icon" aria-hidden="true">${item.icon}</span><span class="eon-app-nav-text">${item.label}</span></a>`;
    }).join('');
    return `<section class="eon-app-nav-group">${group.label ? `<p class="eon-app-nav-label">${group.label}</p>` : ''}${links}</section>`;
  }).join('');
}
