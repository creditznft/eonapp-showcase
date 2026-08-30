export const W136_LIVE_PROOF_SCHEMA = 'eonapp.w136.live-browser-proof.v1';

export const W136_VIEWPORTS = Object.freeze([
  { id: 'desktop', width: 1440, height: 1000, deviceScaleFactor: 1, isMobile: false },
  { id: 'mobile-portrait', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
  { id: 'mobile-landscape', width: 844, height: 390, deviceScaleFactor: 2, isMobile: true }
]);

export const W136_PRODUCTION_ROUTES = Object.freeze([
  { id: 'home', path: '/', title: 'Home', requiredText: ['EONAPP', 'AI'] },
  { id: 'chat', path: '/chat.html', title: 'AI Chat', requiredText: ['EONBOT'] },
  { id: 'workstation', path: '/eon-browser.html', title: 'EON Workstation', requiredText: ['EON Workstation', 'Code Showcase'] },
  { id: 'workbench', path: '/workbench.html', title: 'Workbench legacy surface', requiredText: ['Workbench'] },
  { id: 'vault', path: '/vault', title: 'Vault', requiredText: ['Vault'] },
  { id: 'market', path: '/market', title: 'Market', requiredText: ['Market'] },
  { id: 'realm', path: '/realm', title: 'Realm / EON City', requiredText: ['EON City'] },
  { id: 'support', path: '/support.html', title: 'Support', requiredText: ['Support', 'EONBOT'] },
  { id: 'telegram-clean', path: '/telegram', title: 'Telegram clean route', requiredText: ['Telegram', 'Monetag'] },
  { id: 'telegram-html', path: '/telegram.html', title: 'Telegram html route', requiredText: ['Telegram', 'Monetag'] },
  { id: 'creator', path: '/creator-studio.html', title: 'Creator Studio', requiredText: ['Creator'] },
  { id: 'insights', path: '/insights', title: 'Research Lab', requiredText: ['Research Lab'] },
  { id: 'plans', path: '/subscription', title: 'Plans', requiredText: ['Plans'] },
  { id: 'tools', path: '/tools.html', title: 'Tools router', requiredText: ['Tools', 'Support'] },
  { id: 'hustle', path: '/hustle.html', title: 'Hustle', requiredText: ['Side Hustle'] },
  { id: 'trust', path: '/trust.html', title: 'Trust', requiredText: ['Trust'] }
]);

export const W136_BUTTON_AUDIT_GROUPS = Object.freeze([
  { id: 'top-nav', selector: 'header a, .site-header a, nav a', minCount: 5 },
  { id: 'footer', selector: 'footer a, .site-footer a', minCount: 6 },
  { id: 'primary-ctas', selector: 'a.btn, button.btn, [data-action], [data-support-topic], [data-support-generic]', minCount: 1 },
  { id: 'workstation-launchers', route: '/eon-browser.html', selector: '[data-app-url], [data-url], .ew-app-card, .eon-newtab-app-card', minCount: 6 },
  { id: 'market-filters', route: '/market', selector: '[data-market-filter], .market-filter, button', minCount: 6 },
  { id: 'telegram-actions', route: '/telegram', selector: '.tg-actions a, .tg-footer-actions a', minCount: 12 },
  { id: 'telegram-proof-steps', route: '/telegram', selector: '#telegramRewardProofStates [data-reward-proof-step]', minCount: 6 },
  { id: 'telegram-proof-panels', route: '/telegram', selector: '#telegramRewardProofStates, #telegramServerTruthProof', minCount: 2 },
  { id: 'realm3d-hud', route: '/realm#my-realm-3d', selector: 'button, [role="button"], [data-realm-action]', minCount: 4 }
]);

export const W136_RUNTIME_ERROR_DENYLIST = Object.freeze([
  'Cannot read properties of null',
  'addEventListener',
  'ERR_TOO_MANY_REDIRECTS',
  "THREE.Material: 'clearcoat'",
  "THREE.Material: 'clearcoatRoughness'",
  'ResizeObserver loop limit exceeded',
  'Uncaught TypeError',
  'Unhandled promise rejection'
]);

export const W136_ALLOWED_CONSOLE_NOISE = Object.freeze([
  'google-analytics',
  'g/collect',
  'blocked by client',
  'net::ERR_BLOCKED_BY_CLIENT',
  'Copilot in Edge'
]);

export const W136_EONCITY_SCENARIO = Object.freeze({
  route: '/realm#my-realm-3d',
  steps: [
    'open-realm',
    'capture-entry-state',
    'click-play-if-visible',
    'capture-after-play',
    'verify-hud-is-minimizable-or-compact',
    'verify-crosshair-or-interaction-copy',
    'capture-console-material-warnings'
  ],
  requiredProof: ['entry screenshot', 'after-play screenshot', 'console summary', 'HUD overlay count']
});

export const W136_MAKEOVER_PRIORITIES = Object.freeze([
  { id: 'browser-workstation-consolidation', wave: 'W137', severity: 'P1', owner: 'product-ui' },
  { id: 'market-nft-generation-truth', wave: 'W138', severity: 'P1', owner: 'market' },
  { id: 'vault-update-safe-persistence-proof', wave: 'W139', severity: 'P1', owner: 'vault' },
  { id: 'eoncity-command-center-redesign', wave: 'W140', severity: 'P1', owner: 'realm3d' },
  { id: 'npc-motion-low-end-performance', wave: 'W141', severity: 'P1', owner: 'realm3d' },
  { id: 'creator-safety-final-copy', wave: 'W142', severity: 'P1', owner: 'creator' },
  { id: 'legal-billing-trust-final-copy', wave: 'W143', severity: 'P1', owner: 'trust' },
  { id: 'enterprise-certification', wave: 'W144', severity: 'P0', owner: 'release' }
]);

export function normalizeAuditPath(path = '/') {
  const clean = String(path || '/').trim().split('#')[0].split('?')[0] || '/';
  if (clean === '/chat') return '/chat.html';
  if (clean === '/browser') return '/eon-browser.html';
  if (clean === '/build') return '/workbench.html';
  if (clean === '/create') return '/creator-studio.html';
  if (clean === '/telegram/') return '/telegram';
  return clean;
}
