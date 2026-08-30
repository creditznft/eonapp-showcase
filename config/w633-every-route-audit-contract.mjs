/**
 * W633 — every-route audit, alias retirement and navigation cleanup.
 *
 * This contract treats historical URLs as inbound-only compatibility. Current
 * pages, navigation and generated output must emit canonical clean routes.
 */
import {
  COMPATIBILITY_ROUTES,
  INFORMATIONAL_ROUTES,
  PRIMARY_APP_ROUTES,
  RETIRED_REDIRECTS,
  ROUTE_CONTRACT_VERSION
} from './route-contract.mjs';

export const W633_ROUTE_AUDIT_SCHEMA = 'eonapp.w633.every-route-audit.2026-07-11.v1';

export const W633_SOURCE_ONLY_ALIAS_DOCUMENTS = Object.freeze([
  'apps.html',
  'eoncity-3d.html',
  'eoncity-lite.html',
  'eoncity-play.html',
  'vault-backup.html'
]);

export const W633_ADVANCED_NAVIGATION_DESTINATIONS = Object.freeze([
  Object.freeze({ id: 'workspace', href: '/workspace', label: 'Advanced workspace', surface: 'command' }),
  Object.freeze({ id: 'forge', href: '/forge', label: 'EON Forge', surface: 'command' }),
  Object.freeze({ id: 'automations', href: '/automations', label: 'Automations', surface: 'utilities' }),
  Object.freeze({ id: 'local-ai', href: '/local-ai', label: 'Local AI setup', surface: 'utilities' }),
  Object.freeze({ id: 'insights', href: '/insights', label: 'Research', surface: 'utilities' }),
  Object.freeze({ id: 'realm-studio', href: '/realm-studio', label: 'My Realm', surface: 'command' })
]);

export const W633_CANONICAL_OVERRIDE_BY_FILE = Object.freeze({
  'realm-profile.html': '/realm-studio'
});

const PUBLIC_200_ROUTES = Object.freeze([
  ...PRIMARY_APP_ROUTES,
  ...INFORMATIONAL_ROUTES,
  ...COMPATIBILITY_ROUTES.filter((row) => Number(row.status) === 200)
]);
const REDIRECT_ROUTES = Object.freeze([
  ...COMPATIBILITY_ROUTES.filter((row) => Number(row.status) >= 300 && Number(row.status) < 400),
  ...RETIRED_REDIRECTS
]);

function rawPath(value = '/') {
  const raw = String(value || '/').trim();
  let pathname = raw;
  try { pathname = new URL(raw, 'https://eonapp.ch').pathname; } catch {}
  pathname = pathname.replace(/\/{2,}/g, '/');
  return pathname || '/';
}

function normalizePath(value = '/') {
  const pathname = rawPath(value);
  if (pathname !== '/') return pathname.replace(/\/+$/, '') || '/';
  return '/';
}

function wildcardMatches(pattern, pathname) {
  if (!pattern.includes('*')) return false;
  const prefix = pattern.slice(0, pattern.indexOf('*'));
  return pathname.startsWith(prefix);
}

export function getW633PublicRoute(pathname = '/') {
  const normalized = normalizePath(pathname);
  return PUBLIC_200_ROUTES.find((row) => row.from === normalized)
    || PUBLIC_200_ROUTES.find((row) => wildcardMatches(row.from, normalized))
    || null;
}

export function getW633Redirect(pathname = '/') {
  const raw = rawPath(pathname);
  const normalized = normalizePath(pathname);
  return REDIRECT_ROUTES.find((row) => row.from === raw)
    || REDIRECT_ROUTES.find((row) => row.from === normalized)
    || REDIRECT_ROUTES.find((row) => wildcardMatches(row.from, raw))
    || null;
}

export function resolveW633CanonicalRoute(pathname = '/', { maxHops = 8 } = {}) {
  let current = rawPath(pathname);
  const hops = [];
  const seen = new Set();
  for (let index = 0; index < maxHops; index += 1) {
    const exactRedirect = REDIRECT_ROUTES.find((row) => row.from === current);
    const live = exactRedirect ? null : getW633PublicRoute(current);
    if (live) return Object.freeze({ ok: true, requested: normalizePath(pathname), canonical: live.from, route: live, hops: Object.freeze(hops) });
    const redirect = exactRedirect || getW633Redirect(current);
    if (!redirect) return Object.freeze({ ok: false, requested: normalizePath(pathname), canonical: '', route: null, hops: Object.freeze(hops), reason: 'unknown-route' });
    if (seen.has(current)) return Object.freeze({ ok: false, requested: normalizePath(pathname), canonical: '', route: null, hops: Object.freeze(hops), reason: 'redirect-loop' });
    seen.add(current);
    hops.push(Object.freeze({ from: redirect.from, to: redirect.to, status: redirect.status }));
    current = rawPath(redirect.to);
  }
  return Object.freeze({ ok: false, requested: normalizePath(pathname), canonical: '', route: null, hops: Object.freeze(hops), reason: 'redirect-hop-limit' });
}

export function validateW633RouteGraph() {
  const errors = [];
  const publicOrigins = new Set(PUBLIC_200_ROUTES.map((row) => row.from));
  const redirectOrigins = new Set(REDIRECT_ROUTES.map((row) => row.from));
  const routeContractWave = Number(ROUTE_CONTRACT_VERSION.match(/\.w(\d+)\./)?.[1] || 0);
  if (routeContractWave < 633) errors.push('W633 requires route-contract version W633 or newer.');
  if (publicOrigins.size !== PUBLIC_200_ROUTES.length) errors.push('W633 public route origins must be unique.');
  if (redirectOrigins.size !== REDIRECT_ROUTES.length) errors.push('W633 redirect origins must be unique.');
  if ([...redirectOrigins].some((origin) => publicOrigins.has(origin))) errors.push('W633 route origins cannot be both public and redirected.');

  for (const redirect of REDIRECT_ROUTES) {
    const result = resolveW633CanonicalRoute(redirect.from);
    if (!result.ok) errors.push(`W633 redirect does not resolve: ${redirect.from} (${result.reason}).`);
    if (result.hops.length !== 1) errors.push(`W633 redirect must terminate in one hop: ${redirect.from}.`);
  }

  for (const destination of W633_ADVANCED_NAVIGATION_DESTINATIONS) {
    const route = getW633PublicRoute(destination.href);
    if (!route || Number(route.status) !== 200) errors.push(`W633 advanced navigation destination is not public: ${destination.href}.`);
  }

  const emittedFiles = new Set([...PUBLIC_200_ROUTES, ...COMPATIBILITY_ROUTES].map((row) => row.file).filter(Boolean));
  for (const file of W633_SOURCE_ONLY_ALIAS_DOCUMENTS) {
    if (emittedFiles.has(file)) errors.push(`W633 source-only alias document is still emitted: ${file}.`);
    const alias = `/${file}`;
    if (!REDIRECT_ROUTES.some((row) => row.from === alias)) errors.push(`W633 source-only alias document lacks an inbound redirect: ${file}.`);
  }

  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    publicRouteCount: PUBLIC_200_ROUTES.length,
    redirectCount: REDIRECT_ROUTES.length,
    sourceOnlyAliasDocumentCount: W633_SOURCE_ONLY_ALIAS_DOCUMENTS.length,
    advancedDestinationCount: W633_ADVANCED_NAVIGATION_DESTINATIONS.length
  });
}

export default Object.freeze({
  W633_ROUTE_AUDIT_SCHEMA,
  W633_SOURCE_ONLY_ALIAS_DOCUMENTS,
  W633_ADVANCED_NAVIGATION_DESTINATIONS,
  W633_CANONICAL_OVERRIDE_BY_FILE,
  getW633PublicRoute,
  getW633Redirect,
  resolveW633CanonicalRoute,
  validateW633RouteGraph
});
