/**
 * EONAPP W217 Phase 1 route contract.
 *
 * This is the single source of truth for the public app routes, disabled
 * compatibility surfaces, and retired legacy aliases. Cloudflare redirects,
 * the Vite development rewrite layer, static-link auditing, and route tests
 * derive from this module.
 */
import { EON_GUIDE_ROUTES } from './eon-guide-catalog.mjs';

export const ROUTE_CONTRACT_VERSION = 'eonapp.w633.rt97-guides-and-trust.v22';
const REDIRECT_FILE_EOL = '\n';

const frozenRows = (rows) => Object.freeze(rows.map((row) => Object.freeze({ ...row })));

export const PRIMARY_APP_ROUTES = frozenRows([
  { id: 'preview-studio', from: '/preview-studio', to: '/market.html', status: 200, file: 'market.html', lifecycle: 'local-preview', expected: ['Preview Studio'] },
  { id: 'chat', from: '/', to: '/index.html', status: 200, file: 'index.html', lifecycle: 'live', expected: ['What would you like to make?'] },
  { id: 'create', from: '/create', to: '/create.html', status: 200, file: 'create.html', lifecycle: 'live', expected: ['Create something'] },
  { id: 'projects', from: '/projects', to: '/projects.html', status: 200, file: 'projects.html', lifecycle: 'live', expected: ['Projects'] },
  { id: 'library', from: '/library', to: '/library.html', status: 200, file: 'library.html', lifecycle: 'live', expected: ['Library'] },
  { id: 'workspace', from: '/workspace', to: '/workspace.html', status: 200, file: 'workspace.html', lifecycle: 'live', expected: ['Workspace'] },
  { id: 'forge', from: '/forge', to: '/forge.html', status: 200, file: 'forge.html', lifecycle: 'local-first-builder', expected: ['EON Forge'] },
  // W554: one canonical City route. It mounts a lightweight identity access
  // station first; the Babylon world imports only after the existing EONAPP
  // Google identity session is confirmed. Legacy map, tour, Three.js and play
  // aliases redirect below. Same-route renderer recovery remains in the City.
  { id: 'eoncity', from: '/eoncity', to: '/eoncity.html', status: 200, file: 'eoncity.html', lifecycle: 'direct-babylon-city', expected: ['Checking City access'] },
  { id: 'insights', from: '/insights', to: '/trade.html', status: 200, file: 'trade.html', lifecycle: 'local-research', expected: ['Research Lab'] },
  { id: 'automations', from: '/automations', to: '/automations.html', status: 200, file: 'automations.html', lifecycle: 'live', expected: ['Automation'] },
  { id: 'profile', from: '/profile', to: '/profile.html', status: 200, file: 'profile.html', lifecycle: 'live', expected: ['Profile'] },
  { id: 'vault', from: '/vault', to: '/vault.html', status: 200, file: 'vault.html', lifecycle: 'live', expected: ['Vault'] },
  { id: 'capsule', from: '/capsule', to: '/capsule.html', status: 200, file: 'capsule.html', lifecycle: 'local-only', expected: ['Portable Workspace Capsule'] },
  { id: 'local-ai', from: '/local-ai', to: '/local-ai.html', status: 200, file: 'local-ai.html', lifecycle: 'local-only', expected: ['Local AI'] },
  { id: 'realm-studio', from: '/realm-studio', to: '/realm-studio.html', status: 200, file: 'realm-studio.html', lifecycle: 'local-only', expected: ['Realm Studio'] }
]);

// These routes are deliberately outside the primary navigation. They exist to
// preserve safe links and explain disabled/future capability without implying
// active rewards, commerce, public profiles, or payouts.
export const INFORMATIONAL_ROUTES = frozenRows([
  ...EON_GUIDE_ROUTES,
  { id: 'about', from: '/about', to: '/about.html', status: 200, file: 'about.html', lifecycle: 'live' },
  { id: 'privacy', from: '/privacy', to: '/privacy.html', status: 200, file: 'privacy.html', lifecycle: 'live' },
  { id: 'terms', from: '/terms', to: '/terms.html', status: 200, file: 'terms.html', lifecycle: 'live' },
  { id: 'legal', from: '/legal', to: '/legal.html', status: 200, file: 'legal.html', lifecycle: 'live' },
  { id: 'settings', from: '/settings', to: '/settings.html', status: 200, file: 'settings.html', lifecycle: 'live' },
  { id: 'help', from: '/help', to: '/help.html', status: 200, file: 'help.html', lifecycle: 'live' },
  { id: 'editorial-policy', from: '/editorial-policy', to: '/editorial-policy.html', status: 200, file: 'editorial-policy.html', lifecycle: 'editorial-trust' },
  { id: 'advertising-disclosure', from: '/advertising-disclosure', to: '/advertising-disclosure.html', status: 200, file: 'advertising-disclosure.html', lifecycle: 'editorial-trust' },
  { id: 'status', from: '/status', to: '/status.html', status: 200, file: 'status.html', lifecycle: 'live-operational' },
  { id: 'install', from: '/install', to: '/install.html', status: 200, file: 'install.html', lifecycle: 'live' },
  { id: 'billing', from: '/billing', to: '/billing.html', status: 200, file: 'billing.html', lifecycle: 'live-sensitive', expected: ['Plans & billing'] },
  { id: 'eon-keys', from: '/eon-keys', to: '/eon-keys.html', status: 200, file: 'eon-keys.html', lifecycle: 'proof-gated-referral', expected: ['EON Keys'] },
  { id: 'rewards-status', from: '/rewards', to: '/rewards.html', status: 200, file: 'rewards.html', lifecycle: 'live-sensitive', expected: ['Rewards & sponsored experiences'] }
]);

export const COMPATIBILITY_ROUTES = frozenRows([
  { id: 'support-compatibility', from: '/support', to: '/help', status: 301, file: 'support.html', lifecycle: 'compatibility' },
  // W380: root is the canonical EONBOT chat. Keep old shared paths alive without duplicate UI surfaces.
  { id: 'chat-legacy', from: '/chat', to: '/', status: 301, file: 'chat.html', lifecycle: 'compatibility', expected: ['EONBOT'] },
  { id: 'chat-html-legacy', from: '/chat.html', to: '/', status: 301, file: 'chat.html', lifecycle: 'compatibility', expected: ['EONBOT'] },
  { id: 'telegram', from: '/telegram', to: '/telegram.html', status: 200, file: 'telegram.html', lifecycle: 'disabled', expected: ['Telegram'] },
  { id: 'referral', from: '/referral', to: '/referral.html', status: 200, file: 'referral.html', lifecycle: 'local-only', expected: ['Signed'] },
  { id: 'archive', from: '/archive', to: '/archive.html', status: 200, file: 'archive.html', lifecycle: 'retired', expected: ['retired'] },
  { id: 'market-compatibility', from: '/market', to: '/market.html', status: 200, file: 'market.html', lifecycle: 'compatibility-hidden', expected: ['Compatibility preview'] },
  { id: 'realm-public-future', from: '/u/*', to: '/realm-profile.html?user=:splat', status: 200, file: 'realm-profile.html', lifecycle: 'future', expected: ['Realm'] },
  { id: 'share-r', from: '/r', to: '/referral.html', status: 200, file: 'referral.html', lifecycle: 'local-only' },
  { id: 'share-r-slash', from: '/r/', to: '/referral.html', status: 200, file: 'referral.html', lifecycle: 'local-only' },
  { id: 'share-r-wildcard', from: '/r/*', to: '/referral.html', status: 200, file: 'referral.html', lifecycle: 'local-only' },
  { id: 'share-m', from: '/m', to: '/referral.html', status: 200, file: 'referral.html', lifecycle: 'local-only' },
  { id: 'share-m-slash', from: '/m/', to: '/referral.html', status: 200, file: 'referral.html', lifecycle: 'local-only' },
  { id: 'share-m-wildcard', from: '/m/*', to: '/referral.html', status: 200, file: 'referral.html', lifecycle: 'local-only' }
]);

// Compatibility export name kept for existing evidence consumers. Root is now a real chat document, not a redirect.
export const HOME_REDIRECT = Object.freeze({ id: 'home', from: '/', to: '/index.html', status: 200, lifecycle: 'live' });

export const RETIRED_REDIRECTS = frozenRows([
  // Root document compatibility. `index.html` remains the physical source file,
  // and the canonical public entry point is root (/).
  { from: '/index.html', to: '/', status: 301 },
  { from: '/support.html', to: '/help', status: 301 },

  // W623E: one canonical beginner-facing creation route. Earlier Apps,
  // Studio and Collection names remain redirects only.
  { from: '/apps', to: '/create', status: 301 },
  { from: '/apps.html', to: '/create', status: 301 },
  { from: '/studio', to: '/create', status: 301 },
  { from: '/studio.html', to: '/create', status: 301 },
  { from: '/collection', to: '/create', status: 301 },
  { from: '/collection.html', to: '/create', status: 301 },

  // W518: Capsule is the single user-facing backup and restore workflow.
  // Earlier Vault backup URLs remain redirect-only compatibility aliases.
  { from: '/vault/backup', to: '/capsule', status: 301 },
  { from: '/vault-backup', to: '/capsule', status: 301 },
  { from: '/vault-backup.html', to: '/capsule', status: 301 },

  // W423: one public Babylon City. These are retained as safe redirects only;
  // no legacy City map, optional Three.js workspace, or second entry route is a
  // public page or a normal City fallback.
  { from: '/eoncity.html', to: '/eoncity', status: 301 },
  { from: '/eoncity/', to: '/eoncity', status: 301 },
  { from: '/realm', to: '/eoncity', status: 301 },
  { from: '/realm/', to: '/eoncity', status: 301 },
  { from: '/realm.html', to: '/eoncity', status: 301 },
  { from: '/realmworld', to: '/eoncity', status: 301 },
  { from: '/realmworld.html', to: '/eoncity', status: 301 },
  { from: '/team-realm', to: '/eoncity', status: 301 },
  { from: '/team-realm.html', to: '/eoncity', status: 301 },
  { from: '/world', to: '/eoncity', status: 301 },
  { from: '/game', to: '/eoncity', status: 301 },
  { from: '/games.html', to: '/eoncity', status: 301 },
  { from: '/eoncity/lite', to: '/eoncity', status: 301 },
  { from: '/eoncity/lite/', to: '/eoncity', status: 301 },
  { from: '/eoncity/lite.html', to: '/eoncity', status: 301 },
  { from: '/eoncity/tour', to: '/eoncity', status: 301 },
  { from: '/eoncity/tour/', to: '/eoncity', status: 301 },
  { from: '/eoncity/3d', to: '/eoncity', status: 301 },
  { from: '/eoncity/3d/', to: '/eoncity', status: 301 },
  { from: '/eoncity/play', to: '/eoncity', status: 301 },
  { from: '/eoncity/play/', to: '/eoncity', status: 301 },
  { from: '/eoncity-3d', to: '/eoncity', status: 301 },
  { from: '/eoncity-3d.html', to: '/eoncity', status: 301 },
  { from: '/eoncity-play', to: '/eoncity', status: 301 },
  { from: '/eoncity-play.html', to: '/eoncity', status: 301 },
  { from: '/eoncity-lite.html', to: '/eoncity', status: 301 },

  // Legacy nested marketing and Mini App documents contain retired Pool Point,
  // token and rewarded-ad copy. They are redirected and excluded from build
  // inputs rather than silently shipped as orphaned public pages.
  { from: '/blog', to: '/archive', status: 301 },
  { from: '/blog/*', to: '/archive', status: 301 },
  { from: '/telegram/index.html', to: '/telegram', status: 301 },
  { from: '/telegram/*', to: '/telegram', status: 301 },
  { from: '/nowpayments', to: '/billing', status: 301 },
  { from: '/nowpayments/*', to: '/billing', status: 301 },

  // Non-canonical operator, dashboard and risk pages are retained only in the
  // source archive; public direct access must converge to truthful surfaces.
  { from: '/admin', to: '/archive', status: 301 },
  { from: '/admin.html', to: '/archive', status: 301 },
  { from: '/campaign-admin', to: '/archive', status: 301 },
  { from: '/campaign-admin.html', to: '/archive', status: 301 },
  { from: '/trade', to: '/insights', status: 301 },
  { from: '/trade.html', to: '/insights', status: 301 },
  { from: '/live-trading-dashboard', to: '/insights', status: 301 },
  { from: '/live-trading-dashboard.html', to: '/insights', status: 301 },
  { from: '/tools', to: '/create', status: 301 },
  { from: '/tools/*', to: '/create', status: 301 },
  { from: '/tools.html', to: '/create', status: 301 },
  { from: '/trust', to: '/legal', status: 301 },
  { from: '/trust.html', to: '/legal', status: 301 },
  { from: '/wallet-risk', to: '/legal', status: 301 },
  { from: '/wallet-risk.html', to: '/legal', status: 301 },
  // Legacy Cockpit / builder identity.
  { from: '/eon-browser', to: '/workspace', status: 301 },
  { from: '/eon-browser.html', to: '/workspace', status: 301 },
  { from: '/browser', to: '/workspace', status: 301 },
  { from: '/workbench', to: '/workspace', status: 301 },
  { from: '/workbench.html', to: '/workspace', status: 301 },
  { from: '/build', to: '/workspace', status: 301 },
  { from: '/builder', to: '/workspace', status: 301 },
  { from: '/creator-studio', to: '/create', status: 301 },
  { from: '/creator-studio.html', to: '/create', status: 301 },
  { from: '/code-maker', to: '/workspace', status: 301 },
  { from: '/code-maker.html', to: '/workspace', status: 301 },
  { from: '/music-studio', to: '/workspace', status: 301 },
  { from: '/music-studio.html', to: '/workspace', status: 301 },
  { from: '/video-editor', to: '/workspace', status: 301 },
  { from: '/video-editor.html', to: '/workspace', status: 301 },
  { from: '/realm-code-preview', to: '/workspace', status: 301 },
  { from: '/realm-code-preview.html', to: '/workspace', status: 301 },

  // Automation aliases have one canonical destination.
  { from: '/automation', to: '/automations', status: 301 },
  { from: '/automate', to: '/automations', status: 301 },
  { from: '/automation-studio', to: '/automations', status: 301 },
  { from: '/automation-studio.html', to: '/automations', status: 301 },

  // Market, Realm and City product retirement.
  { from: '/marketplace', to: '/create', status: 301 },
  { from: '/marketplace.html', to: '/create', status: 301 },
  { from: '/games', to: '/eoncity', status: 301 },
  { from: '/games/*', to: '/archive', status: 301 },
  { from: '/realm-profile', to: '/realm-studio', status: 301 },
  { from: '/realm-profile.html', to: '/realm-studio', status: 301 },

  // Trade is research only; sandbox is retired rather than a parallel product.
  { from: '/signal', to: '/insights', status: 301 },
  { from: '/signal.html', to: '/insights', status: 301 },
  { from: '/trade/sandbox', to: '/insights', status: 301 },
  { from: '/trade-sandbox', to: '/insights', status: 301 },
  { from: '/trade-sandbox.html', to: '/insights', status: 301 },

  // Local AI setup replaces legacy free-AI/device/onboarding funnels.
  { from: '/get-free-ai-power', to: '/local-ai', status: 301 },
  { from: '/get-free-ai-power.html', to: '/local-ai', status: 301 },
  { from: '/setup', to: '/local-ai', status: 301 },
  { from: '/device-check', to: '/local-ai', status: 301 },
  { from: '/device-check.html', to: '/local-ai', status: 301 },
  { from: '/onboarding', to: '/', status: 301 },
  { from: '/onboarding.html', to: '/', status: 301 },
  { from: '/start', to: '/', status: 301 },

  // Commercial, token, mission and reward surfaces remain inactive and archived.
  { from: '/subscription', to: '/archive', status: 301 },
  { from: '/subscription.html', to: '/archive', status: 301 },
  { from: '/reward-access', to: '/rewards', status: 301 },
  { from: '/reward-access.html', to: '/rewards', status: 301 },
  { from: '/vault-rewards', to: '/archive', status: 301 },
  { from: '/vault-rewards.html', to: '/archive', status: 301 },
  { from: '/vault-payments', to: '/archive', status: 301 },
  { from: '/vault-payments.html', to: '/archive', status: 301 },
  { from: '/kpi-token-dashboard', to: '/archive', status: 301 },
  { from: '/kpi-token-dashboard.html', to: '/archive', status: 301 },
  { from: '/kpi-dashboard', to: '/archive', status: 301 },
  { from: '/kpi-dashboard.html', to: '/archive', status: 301 },
  { from: '/leaderboard', to: '/archive', status: 301 },
  { from: '/leaderboard.html', to: '/archive', status: 301 },
  { from: '/hustle', to: '/archive', status: 301 },
  { from: '/hustle.html', to: '/archive', status: 301 },
  { from: '/social-mission', to: '/archive', status: 301 },
  { from: '/social-missions', to: '/archive', status: 301 },
  { from: '/missions', to: '/archive', status: 301 },

  // Narrow vault / legal compatibility routes.
  { from: '/vault-api', to: '/vault', status: 301 },
  { from: '/vault-api.html', to: '/vault', status: 301 },
  { from: '/vault-api-keys', to: '/vault', status: 301 },
  { from: '/vault-api-keys.html', to: '/vault', status: 301 },
  { from: '/vault-identity', to: '/profile', status: 301 },
  { from: '/vault-identity.html', to: '/profile', status: 301 },
  { from: '/vault-inventory', to: '/vault', status: 301 },
  { from: '/vault-inventory.html', to: '/vault', status: 301 },
  { from: '/refund-policy', to: '/billing', status: 301 },
  { from: '/refund-policy.html', to: '/billing', status: 301 },
  { from: '/crypto', to: '/archive', status: 301 },
  // Every legacy game path is covered by /games/* above; no game HTML is a production build entry.
]);

export const FALLBACK_ROUTE = Object.freeze({ id: 'fallback', from: '/*', to: '/404.html', status: 404, lifecycle: 'live' });

export const ALL_ROUTE_ROWS = Object.freeze([
  ...PRIMARY_APP_ROUTES,
  ...INFORMATIONAL_ROUTES,
  ...COMPATIBILITY_ROUTES,
  ...RETIRED_REDIRECTS,
  FALLBACK_ROUTE
]);

const directPageFiles = new Map([
  ['/', 'index.html'], ['/chat', 'chat.html'], ['/create', 'create.html'], ['/projects', 'projects.html'], ['/library', 'library.html'], ['/workspace', 'workspace.html'],
  ['/eoncity', 'eoncity.html'], ['/market', 'market.html'], ['/insights', 'trade.html'],
  ['/automations', 'automations.html'], ['/profile', 'profile.html'], ['/vault', 'vault.html'], ['/capsule', 'capsule.html'],
  ['/local-ai', 'local-ai.html'], ['/realm-studio', 'realm-studio.html'], ['/telegram', 'telegram.html'], ['/rewards', 'rewards.html'],
  ['/referral', 'referral.html'], ['/archive', 'archive.html'], ['/billing', 'billing.html'],
  ['/about', 'about.html'], ['/privacy', 'privacy.html'], ['/terms', 'terms.html'], ['/legal', 'legal.html'],
  ['/settings', 'settings.html'], ['/help', 'help.html'], ['/status', 'status.html'], ['/install', 'install.html']
]);

function targetPath(target = '') {
  return String(target).split('?')[0].split('#')[0];
}

export function getRouteRow(from) {
  return ALL_ROUTE_ROWS.find((row) => row.from === from) || null;
}

export function targetToFile(target) {
  const pathname = targetPath(target);
  if (pathname.endsWith('.html')) return pathname.replace(/^\//, '');
  return directPageFiles.get(pathname) || null;
}

export function createDevRouteRewrites() {
  const rewrites = new Map([['/', '/index.html']]);
  for (const row of ALL_ROUTE_ROWS) {
    if (row.from.includes('*') || row.from === '/') continue;
    const file = targetToFile(row.to);
    if (file) rewrites.set(row.from, `/${file}`);
  }
  return rewrites;
}

export function createStaticRouteFileMap() {
  const routes = new Map([['/', 'index.html']]);
  for (const row of ALL_ROUTE_ROWS) {
    if (row.from.includes('*') || row.from === '/') continue;
    const file = targetToFile(row.to);
    if (file) routes.set(row.from, file);
  }
  return routes;
}

export function renderCloudflareRedirects() {
  const header = [
    '# Generated from config/route-contract.mjs. Do not hand-edit.',
    '# W380: root EONBOT home plus one public route contract; concrete clean URLs are emitted as real route files at build time.',
    '# Only redirects and wildcard rewrites belong here so Cloudflare Pages does not loop clean URLs back to themselves.',
    '# Signed links use no short-link registry, KV,',
    '# D1 resolver, or Worker is required.',
    ''
  ];
  const wildcardCompatibilityRoutes = COMPATIBILITY_ROUTES.filter((row) => row.from.includes('*'));
  const directCompatibilityRedirects = COMPATIBILITY_ROUTES.filter((row) => !row.from.includes('*') && Number(row.status) >= 300);
  const sections = [
    ['# Root is the canonical EONBOT home document.', []],
    ['# Concrete canonical routes are served by dist/<route>/index.html files generated at build time.', []],
    ['# Legacy chat paths converge to the root EONBOT home.', directCompatibilityRedirects],
    ['# Wildcard compatibility routes still need explicit Cloudflare rewrites.', wildcardCompatibilityRoutes],
    ['# Retired aliases. Each origin is declared once.', RETIRED_REDIRECTS],
    ['# 404 fallback must remain last.', [FALLBACK_ROUTE]]
  ];
  const lines = [...header];
  for (const [comment, rows] of sections) {
    lines.push(comment);
    for (const row of rows) lines.push(`${row.from} ${row.to} ${row.status}`);
    lines.push('');
  }
  return `${lines.join(REDIRECT_FILE_EOL).replace(/\n{3,}/g, '\n\n').trim()}${REDIRECT_FILE_EOL}`;
}

export function validateRouteContract() {
  const errors = [];
  const seen = new Set();
  for (const row of ALL_ROUTE_ROWS) {
    if (!String(row.from || '').startsWith('/')) errors.push(`Route must start with '/': ${row.from}`);
    if (seen.has(row.from)) errors.push(`Duplicate route origin: ${row.from}`);
    seen.add(row.from);
    if (![200, 301, 302, 404].includes(Number(row.status))) errors.push(`Unsupported status for ${row.from}: ${row.status}`);
  }
  if (FALLBACK_ROUTE.from !== '/*' || FALLBACK_ROUTE.status !== 404) errors.push('Fallback route must be /* -> 404.');
  return errors;
}
