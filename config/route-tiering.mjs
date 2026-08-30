/**
 * R3-F2 route tiers.
 *
 * Tier 0 is the primary task loop. Tier 1 is an explicit work module. Tier 2
 * is support, legal, compatibility, or status. Tier 3 is redirect-only and
 * must exist only in the hash-verified retired-route archive.
 */
import { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES, COMPATIBILITY_ROUTES, RETIRED_REDIRECTS } from './route-contract.mjs';

const freeze = (value) => Object.freeze(value.map((item) => Object.freeze({ ...item })));

export const ROUTE_TIERING_SCHEMA = 'eonapp.r3-f2.route-tiering.v1';
export const TIER_0_PRIMARY_IDS = Object.freeze(['chat', 'projects', 'workspace', 'eoncity']);
export const TIER_3_RETIRED_ROOT_DOCUMENTS = Object.freeze([
  'automation-studio.html',
  'device-check.html',
  'eon-browser.html',
  'music-studio.html',
  'signal.html',
  'tools.html',
  'trade-sandbox.html',
  'video-editor.html'
]);
export const ROOT_DOCUMENT_EXCEPTIONS = Object.freeze([
  'index.html',
  '404.html',
  'offline.html',
  // These source documents are retained only as compatibility/fallback documents;
  // the edge contract redirects their public .html URLs to current canonical routes.
  'apps.html',
  'vault-backup.html',
  // These City entry documents remain in source for compatibility and
  // validation tooling even though the public edge contract now converges
  // their clean routes back to the canonical /eoncity surface.
  'eoncity-lite.html',
  'eoncity-3d.html',
  'eoncity-play.html'
]);

const allCanonical = [...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES, ...COMPATIBILITY_ROUTES];
export const TIER_0_ROUTES = freeze(allCanonical.filter((route) => TIER_0_PRIMARY_IDS.includes(route.id)));
export const TIER_1_ROUTES = freeze(PRIMARY_APP_ROUTES.filter((route) => !TIER_0_PRIMARY_IDS.includes(route.id)));
export const TIER_2_ROUTES = freeze([...INFORMATIONAL_ROUTES, ...COMPATIBILITY_ROUTES]);
export const TIER_3_REDIRECTS = freeze(RETIRED_REDIRECTS.filter((route) => {
  const file = route.from.replace(/^\//, '');
  return TIER_3_RETIRED_ROOT_DOCUMENTS.includes(file);
}));

export function getRouteTiering() {
  return Object.freeze({
    schema: ROUTE_TIERING_SCHEMA,
    tier0: TIER_0_ROUTES.map((route) => Object.freeze({ ...route })),
    tier1: TIER_1_ROUTES.map((route) => Object.freeze({ ...route })),
    tier2: TIER_2_ROUTES.map((route) => Object.freeze({ ...route })),
    tier3: TIER_3_RETIRED_ROOT_DOCUMENTS.map((file) => Object.freeze({ file, route: `/${file}`, lifecycle: 'retired-redirect-only' }))
  });
}

export default Object.freeze({
  ROUTE_TIERING_SCHEMA,
  TIER_0_PRIMARY_IDS,
  TIER_0_ROUTES,
  TIER_1_ROUTES,
  TIER_2_ROUTES,
  TIER_3_RETIRED_ROOT_DOCUMENTS,
  TIER_3_REDIRECTS,
  ROOT_DOCUMENT_EXCEPTIONS,
  getRouteTiering
});
