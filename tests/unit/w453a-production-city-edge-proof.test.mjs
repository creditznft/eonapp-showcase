import assert from 'node:assert/strict';
import test from 'node:test';
import {
  W453A_CANONICAL_CITY_PATH,
  W453A_CITY_ALIAS_PATHS,
  W453A_CITY_QUERY_PROBES,
  W453A_PRIMARY_DOCUMENT_PROBES,
  validateW453ACityEdgeProofContract
} from '../../config/w453a-production-city-edge-proof-contract.mjs';
import {
  W453A_EDGE_PROOF_CASES,
  createW453AEdgeDryRun,
  inspectW453AProductionCityEdge
} from '../../scripts/w453a-production-city-edge-proof.mjs';
import { inspectW453AProductionCityEdgeSource } from '../../scripts/w453a-production-city-edge-proof-gate.mjs';

const CITY_MARKER = W453A_PRIMARY_DOCUMENT_PROBES.find((probe) => probe.id === 'city-canonical')?.marker || 'Checking City access';

const response = (status, body = '', headers = {}) => ({
  status,
  headers: new Headers(headers),
  text: async () => body
});

function makeCurrentCityFetch() {
  return async (url) => {
    const parsed = new URL(url);
    const query = parsed.search;
    if (parsed.pathname === '/sw.js') return response(200, "const VERSION = 'v54'; const LEGACY_CITY_NAVIGATION_PATHS = new Set(['/realm']); Response.redirect(new URL('/eoncity', self.location.origin).toString(), 302);", { 'content-type': 'application/javascript' });
    if (parsed.pathname === '/') return response(200, '<h1>What would you like to make?</h1>', { 'content-type': 'text/html' });
    if (parsed.pathname === '/insights') return response(308, '', { location: '/insights/' });
    if (parsed.pathname === '/insights/') return response(200, '<h1>Research Lab</h1>', { 'content-type': 'text/html' });
    if (parsed.pathname === '/eoncity') return response(200, `<h1>${CITY_MARKER}</h1>`, { 'content-type': 'text/html' });
    if (W453A_CITY_ALIAS_PATHS.includes(parsed.pathname)) return response(301, '', { location: `/eoncity${query}` });
    return response(404, '<h1>not found</h1>', { 'content-type': 'text/html' });
  };
}

test('W453.1 City edge proof stays route-contract driven and performs no request in dry-run mode', () => {
  assert.deepEqual(validateW453ACityEdgeProofContract(), []);
  const result = createW453AEdgeDryRun({ baseUrl: 'https://preview.eonapp.ch' });
  assert.equal(result.status, 'dry-run-no-network');
  assert.equal(result.sourceOnly, true);
  assert.equal(result.canonicalCityPath, W453A_CANONICAL_CITY_PATH);
  assert.equal(result.caseCount, W453A_EDGE_PROOF_CASES.length);
  assert.ok(W453A_CITY_ALIAS_PATHS.includes('/realm'));
  assert.ok(W453A_CITY_ALIAS_PATHS.includes('/eoncity.html'));
});

test('W453.1 verifies canonical City documents, every declared direct City alias, safe query preservation and delivered Service Worker markers without saving bodies', async () => {
  const result = await inspectW453AProductionCityEdge({
    baseUrl: 'https://eonapp.ch',
    confirmNetwork: true,
    fetchImpl: makeCurrentCityFetch(),
    now: () => '2026-06-30T00:00:00.000Z'
  });
  assert.equal(result.status, 'pass', JSON.stringify(result, null, 2));
  assert.equal(result.sourceOnly, false);
  assert.equal(result.results.length, W453A_EDGE_PROOF_CASES.length);
  assert.ok(result.results.every((entry) => entry.ok));
  for (const probe of W453A_CITY_QUERY_PROBES) {
    const resultEntry = result.results.find((entry) => entry.id === probe.id);
    assert.equal(resultEntry.final.path, '/eoncity');
    assert.equal(resultEntry.final.query, probe.expectedQuery);
  }
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /<h1>|<\/h1>/);
  assert.match(serialized, /requiredMarkersPresent/);
  assert.match(serialized, /contentHash/);
});

test('W453.1 fails closed on an alias that drops the allowed City query instead of calling it canonical', async () => {
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    if (parsed.pathname === '/realm') return response(301, '', { location: '/eoncity' });
    if (parsed.pathname === '/eoncity') return response(200, `<h1>${CITY_MARKER}</h1>`, { 'content-type': 'text/html' });
    return makeCurrentCityFetch()(url);
  };
  const result = await inspectW453AProductionCityEdge({
    baseUrl: 'https://eonapp.ch',
    confirmNetwork: true,
    fetchImpl
  });
  assert.equal(result.status, 'fail');
  const realmQuery = result.results.find((entry) => entry.id === 'realm-query-preserved');
  assert.equal(realmQuery.ok, false);
  assert.match(realmQuery.failure, /unexpected-final-query/);
});

test('W453.1 source gate retains opt-in, privacy-safe production proof boundaries', () => {
  const report = inspectW453AProductionCityEdgeSource();
  assert.equal(report.status, 'pass', report.errors.join('\n'));
  assert.ok(report.cityAliasCount >= 20);
  assert.match(report.limitations.join(' '), /not a deployed-route/i);
});
