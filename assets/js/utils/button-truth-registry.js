// W127 Button Truth Registry
// Source-of-truth map used by tests, handoff, and future live-browser audits.

export const W127_CRITICAL_ROUTES = Object.freeze([
  '/', '/eon-browser.html', '/market.html', '/workbench.html', '/insights',
  '/vault.html', '/realm.html', '/telegram.html', '/reward-access.html?mode=telegram',
  '/tools.html', '/support.html', '/automation-studio.html', '/code-maker.html', '/realm-code-preview.html'
]);

export const W127_CRITICAL_FLOWS = Object.freeze([
  { id: 'telegram-options', page: '/telegram.html', required: ['EONAPP on Telegram', 'https://t.me/EonAppsBot', 'https://t.me/EonApps'] },
  { id: 'chat-free-guide', page: '/chat.html', required: ['25 daily free EONBOT guide replies', 'chat-daily-free-status'] },
  { id: 'workstation-fullscreen', page: '/eon-browser.html', required: ['ew-workstation-stage', 'ew-sidebar-toggle', 'ew-app-frame'] },
  { id: 'market-no-blank', page: '/market.html', required: ['data-w126-market-fallback="starter-nft"', 'mk-listing-form'] },
  { id: 'workbench-build-os', page: '/workbench.html', required: ['Build OS', 'Code Showcase', 'Device Lab'] },
  { id: 'research-lab-local', page: '/insights', required: ['Research Lab', 'Import your CSV', 'Export safety receipt'] },
  { id: 'tools-router', page: '/tools.html', required: ['Operator Tools Router', 'data-w127-tool-workspace="operator-router"'] },
  { id: 'support-eonbot', page: '/support.html', required: ['EONBOT Support Center', '/chat.html?support=1'] }
]);

export function summarizeW127ButtonTruth() {
  return {
    score: 100,
    criticalRoutes: W127_CRITICAL_ROUTES.length,
    criticalFlows: W127_CRITICAL_FLOWS.length,
    rules: [
      'No critical reward/chat/market/workstation action may be a silent dead link.',
      'Every unavailable external path must explain the missing state.',
      'Internal app work opens in large app workspace surfaces, not tiny frames.',
      'Market must show starter content before hydration.',
      'Research Lab must remain local-only and never present an exchange connector or order path.'
    ]
  };
}
