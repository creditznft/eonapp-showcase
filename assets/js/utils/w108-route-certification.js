/**
 * W108E route certification manifest.
 *
 * This is intentionally data-only so both browser pages and Node QA gates can
 * agree on the same product contract: public routes must paint quickly, explain
 * beta/commercial states honestly, and defer heavyweight experiences until a
 * user asks for them.
 */

export const W108_CORE_ROUTES = Object.freeze([
  {
    route: '/',
    file: 'index.html',
    label: 'Home / EON City flagship',
    priority: 'critical',
    firstImpression: 'EON City, EONBOT, and AI Cockpit are the three primary attractions.',
    requiredSignals: ['EON City', 'EONBOT', 'AI Cockpit', 'Generated NFTs'],
    performancePolicy: 'No Telegram/social mission widgets on first paint; support widgets must load after idle.'
  },
  {
    route: '/chat.html',
    file: 'chat.html',
    label: 'EONBOT AI Chat',
    priority: 'critical',
    firstImpression: 'A plain-language operator that routes into the app without forcing dashboard setup first.',
    requiredSignals: ['AI Chat', 'EONBOT'],
    performancePolicy: 'Chat shell first; provider/runtime discovery only after user action.'
  },
  {
    route: '/eon-browser.html',
    file: 'eon-browser.html',
    label: 'AI Cockpit',
    priority: 'critical',
    firstImpression: 'One command surface for browser tasks, build missions, creator work, and approvals.',
    requiredSignals: ['AI Cockpit'],
    performancePolicy: 'Do not block first paint on external browser/runtime checks.'
  },
  {
    route: '/market',
    file: 'market.html',
    label: 'Market / personal starter drop',
    priority: 'critical',
    firstImpression: 'Every new visitor sees a personal local-first EON City NFT starter drop plus searchable catalog.',
    requiredSignals: ['starter drop', 'EON City', 'Catalog'],
    performancePolicy: 'Render skeleton immediately; seed local NFTs after hydration; never expose broken empty copy on first load.'
  },
  {
    route: '/marketplace',
    file: 'marketplace.html',
    label: 'NFT Exchange',
    priority: 'critical',
    firstImpression: 'Commercial truth, settlement clarity, official-vs-user labels, and no profit-promise language.',
    requiredSignals: ['Commercial truth', 'Settlement clarity', 'Official EON Team'],
    performancePolicy: 'Lazy-load contract widgets and wallet/provider checks until requested.'
  },
  {
    route: '/vault',
    file: 'vault.html',
    label: 'Vault',
    priority: 'critical',
    firstImpression: 'Local-first profile, keys, backups, and utility NFT recovery with clear approval boundaries.',
    requiredSignals: ['Vault'],
    performancePolicy: 'Paint the shell and safe fallbacks before telemetry/provider status resolves.'
  },
  {
    route: '/realm',
    file: 'realm.html',
    label: 'Realm / EON City',
    priority: 'critical',
    firstImpression: 'EON City-first world with private workstation and Device Lab; 3D loads only on explicit entry.',
    requiredSignals: ['EON City', 'Device Lab', 'Private Workstation'],
    performancePolicy: 'Intent-first 3D: Three.js/engine boot only after Enter City or QA autoboot.'
  },
  {
    route: '/create',
    file: 'creator-studio.html',
    label: 'Creator Studio',
    priority: 'high',
    firstImpression: 'Five simple creation choices first; advanced IDE/runtime/analytics hidden until requested.',
    requiredSignals: ['Start with idea', 'Make video package', 'Advanced'],
    performancePolicy: 'Advanced creator add-ons defer behind collapsed panels.'
  },
  {
    route: '/build',
    file: 'workbench.html',
    label: 'Workbench',
    priority: 'high',
    firstImpression: 'Ask, Build, Launch, Research Lab, Creator, Vault first; IoT lives in advanced Device Lab.',
    requiredSignals: ['Ask', 'Build', 'Device Lab'],
    performancePolicy: 'Only the launchpad is mandatory for first paint; advanced mode code loads after user choice.'
  },
  {
    route: '/trust',
    file: 'trust.html',
    label: 'Trust Center',
    priority: 'high',
    firstImpression: 'Plain-language safety promises for AI keys, wallet/payment actions, NFTs, and devices.',
    requiredSignals: ['What stays local', 'What requires approval', 'W108 certification'],
    performancePolicy: 'Static trust content must be useful without JavaScript.'
  }
]);

export const W108_PERFORMANCE_BUDGETS = Object.freeze({
  simplePageDesktopScore: 0.9,
  simplePageMobileScore: 0.9,
  heavyPageMobileMinimum: 0.82,
  cumulativeLayoutShiftMaximum: 0.1,
  consoleErrorBudget: 0,
  firstPaintPolicy: 'Static HTML must explain the page before any optional module hydrates.'
});

export const W108_USER_JOURNEYS = Object.freeze([
  ['New visitor', '/', '/realm', 'Enter EON City and understand the app world.'],
  ['New visitor', '/', '/chat.html', 'Ask EONBOT before connecting providers.'],
  ['Builder', '/', '/eon-browser.html', 'Open AI Cockpit for work missions.'],
  ['Collector', '/market', '/vault', 'Claim a local starter NFT and back up Vault state.'],
  ['Buyer', '/marketplace', '/trust', 'Review settlement and commercial truth before purchase.'],
  ['Creator', '/create', '/market', 'Build an asset and understand listing limits.'],
  ['Operator', '/build', '/automation-studio.html', 'Expose Device Lab safely without silent hardware control.'],
  ['Research Lab', '/insights', '/vault', 'Keep local research and scenario review separate from financial execution.']
]);

export function getW108CertificationRoute(routeOrFile) {
  const target = String(routeOrFile || '').trim();
  return W108_CORE_ROUTES.find((entry) => entry.route === target || entry.file === target) || null;
}

export function summarizeW108Certification() {
  return {
    schema: 'eon.w108.route-certification.v1',
    routeCount: W108_CORE_ROUTES.length,
    criticalRoutes: W108_CORE_ROUTES.filter((entry) => entry.priority === 'critical').length,
    budgets: W108_PERFORMANCE_BUDGETS,
    journeys: W108_USER_JOURNEYS.length
  };
}
