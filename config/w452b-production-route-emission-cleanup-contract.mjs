/**
 * W452.2 — production route-emission cleanup contract.
 *
 * Public compatibility redirects may accept historical paths. Active documents
 * and reachable runtime modules must never emit those paths as foreground
 * destinations. This is a source inspection guard, not a deployed edge test.
 */
export const W452B_PRODUCTION_ROUTE_EMISSION_CLEANUP_SCHEMA = 'eonapp.w452b.production-route-emission-cleanup.v1';

export const W452B_CANONICAL_ROUTE_FAMILIES = Object.freeze({
  chat: '/',
  research: '/insights',
  city: '/eoncity',
  workspace: '/workspace',
  preview: '/create'
});

export const W452B_RETIRED_EMISSION_ALIASES = Object.freeze([
  '/chat', '/chat.html',
  '/trade', '/trade.html',
  '/realm', '/realm.html', '/realmworld', '/realmworld.html', '/game', '/games',
  '/marketplace', '/marketplace.html',
  '/workbench', '/workbench.html', '/eon-browser', '/eon-browser.html'
]);

export const W452B_RULES = Object.freeze({
  currentHtmlMayNotLinkToRetiredAlias: true,
  activeRuntimeMayNotEmitRetiredAlias: true,
  compatibilityRoutesMayRemainInboundOnly: true,
  routeContractOwnsRedirects: true,
  sourceOnly: true
});

export function validateW452bProductionRouteEmissionCleanupContract() {
  const errors = [];
  if (W452B_CANONICAL_ROUTE_FAMILIES.chat !== '/' || W452B_CANONICAL_ROUTE_FAMILIES.research !== '/insights' || W452B_CANONICAL_ROUTE_FAMILIES.city !== '/eoncity') errors.push('W452.2 canonical route families drifted.');
  if (new Set(W452B_RETIRED_EMISSION_ALIASES).size !== W452B_RETIRED_EMISSION_ALIASES.length) errors.push('W452.2 retired alias inventory contains duplicates.');
  if (Object.values(W452B_RULES).some((value) => value !== true)) errors.push('W452.2 cleanup rules must remain enabled.');
  return Object.freeze(errors);
}
