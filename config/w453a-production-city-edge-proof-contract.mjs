/**
 * W453.1 — production City edge-proof runner contract.
 *
 * This contract is intentionally independent from browser/device certification.
 * It defines an opt-in HTTP inspection that Codex can run after a named
 * deployment. It proves redirect and document delivery only; a real browser
 * must still prove service-worker adoption, WebGL, interaction and visuals.
 */
import { PRIMARY_APP_ROUTES, RETIRED_REDIRECTS, ROUTE_CONTRACT_VERSION } from './route-contract.mjs';

const freeze = (value) => Object.freeze(value);
const directCityAliases = RETIRED_REDIRECTS
  .filter((row) => row.to === '/eoncity' && !String(row.from).includes('*'))
  .map((row) => row.from);

export const W453A_CITY_EDGE_PROOF_SCHEMA = 'eonapp.w453.1.production-city-edge-proof.v1';
export const W453A_CITY_EDGE_PROOF_WAVE = 'W453.1';
export const W453A_ROUTE_CONTRACT_VERSION = ROUTE_CONTRACT_VERSION;
export const W453A_CANONICAL_CITY_PATH = '/eoncity';
export const W453A_SAFE_QUERY_PROBE = freeze({ key: 'mission', value: 'arrival' });

export const W453A_PRIMARY_DOCUMENT_PROBES = freeze([
  freeze({ id: 'chat-root', path: '/', marker: PRIMARY_APP_ROUTES.find((row) => row.id === 'chat')?.expected?.[0] || 'What would you like to make?', expectedFinalPath: '/' }),
  freeze({ id: 'city-canonical', path: W453A_CANONICAL_CITY_PATH, marker: PRIMARY_APP_ROUTES.find((row) => row.id === 'eoncity')?.expected?.[0] || 'Entering EON City', expectedFinalPath: W453A_CANONICAL_CITY_PATH }),
  freeze({ id: 'research-canonical', path: '/insights', marker: PRIMARY_APP_ROUTES.find((row) => row.id === 'insights')?.expected?.[0] || 'Research Lab', expectedFinalPath: '/insights' })
]);

export const W453A_CITY_ALIAS_PATHS = freeze(directCityAliases);

export const W453A_CITY_QUERY_PROBES = freeze([
  freeze({ id: 'realm-query-preserved', path: `/realm?${W453A_SAFE_QUERY_PROBE.key}=${W453A_SAFE_QUERY_PROBE.value}`, expectedFinalPath: W453A_CANONICAL_CITY_PATH, expectedQuery: `?${W453A_SAFE_QUERY_PROBE.key}=${W453A_SAFE_QUERY_PROBE.value}` }),
  freeze({ id: 'physical-city-query-preserved', path: `/eoncity.html?${W453A_SAFE_QUERY_PROBE.key}=${W453A_SAFE_QUERY_PROBE.value}`, expectedFinalPath: W453A_CANONICAL_CITY_PATH, expectedQuery: `?${W453A_SAFE_QUERY_PROBE.key}=${W453A_SAFE_QUERY_PROBE.value}` })
]);

export const W453A_SERVICE_WORKER_PROBE = freeze({
  id: 'service-worker-city-repair-script',
  path: '/sw.js',
  expectedFinalPath: '/sw.js',
  requiredMarkers: freeze(['LEGACY_CITY_NAVIGATION_PATHS', '/eoncity'])
});

export const W453A_EDGE_PROOF_LIMITATIONS = freeze([
  'This checks explicit HTTP delivery and redirect convergence only after an opt-in network command.',
  'It does not prove a browser has adopted a new Service Worker, cleared an old cache, rendered Babylon, avoided WebGL warnings, met a frame budget, respected mobile safe areas, or passed visual review.',
  'It never sends credentials, cookies, prompts, provider data, payment data, browser storage, or user-specific query strings.'
]);

export function validateW453ACityEdgeProofContract() {
  const errors = [];
  if (W453A_CANONICAL_CITY_PATH !== '/eoncity') errors.push('City edge proof must target the canonical /eoncity route.');
  if (!W453A_CITY_ALIAS_PATHS.length) errors.push('City edge proof requires at least one declared retired alias.');
  if (new Set(W453A_CITY_ALIAS_PATHS).size !== W453A_CITY_ALIAS_PATHS.length) errors.push('City aliases must be unique.');
  if (W453A_CITY_ALIAS_PATHS.some((path) => !path.startsWith('/') || path.includes('*'))) errors.push('City alias probes must be explicit direct routes.');
  if (!W453A_CITY_ALIAS_PATHS.includes('/realm') || !W453A_CITY_ALIAS_PATHS.includes('/eoncity.html')) errors.push('City edge proof must cover Realm and physical-document aliases.');
  if (W453A_CITY_QUERY_PROBES.some((probe) => !probe.path.includes('?') || probe.expectedFinalPath !== W453A_CANONICAL_CITY_PATH)) errors.push('City query probes must preserve an explicit supported query to /eoncity.');
  if (!W453A_PRIMARY_DOCUMENT_PROBES.every((probe) => probe.path.startsWith('/') && probe.marker && probe.expectedFinalPath)) errors.push('Primary document probes are incomplete.');
  if (!W453A_SERVICE_WORKER_PROBE.requiredMarkers.includes('LEGACY_CITY_NAVIGATION_PATHS')) errors.push('Service Worker probe must confirm City legacy interception source is delivered.');
  if (!W453A_EDGE_PROOF_LIMITATIONS.some((line) => /does not prove a browser/i.test(line))) errors.push('City edge proof must state browser limitations.');
  return freeze(errors);
}
