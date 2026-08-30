#!/usr/bin/env node
/**
 * W453.1 production City edge proof. Network use is explicit and no response
 * body is written to disk. Only public-route metadata, hashes, byte lengths,
 * redirect paths and marker booleans are included in an optional report.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  W453A_CANONICAL_CITY_PATH,
  W453A_CITY_ALIAS_PATHS,
  W453A_CITY_EDGE_PROOF_SCHEMA,
  W453A_CITY_EDGE_PROOF_WAVE,
  W453A_CITY_QUERY_PROBES,
  W453A_EDGE_PROOF_LIMITATIONS,
  W453A_PRIMARY_DOCUMENT_PROBES,
  W453A_ROUTE_CONTRACT_VERSION,
  W453A_SERVICE_WORKER_PROBE,
  validateW453ACityEdgeProofContract
} from '../config/w453a-production-city-edge-proof-contract.mjs';

const freeze = (value) => Object.freeze(value);
const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);
const DEFAULT_BASE_URL = 'https://eonapp.ch';
const ENTRY_FILE = fileURLToPath(import.meta.url);

function safeOrigin(value = DEFAULT_BASE_URL) {
  const parsed = new URL(String(value || DEFAULT_BASE_URL));
  if (parsed.protocol !== 'https:') throw new Error('W453.1 requires an explicit HTTPS deployment origin.');
  if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname && parsed.pathname !== '/')) throw new Error('W453.1 base URL must be an origin without credentials, query, fragment or path.');
  return parsed.origin;
}

function encodePath(pathname) {
  const parsed = new URL(String(pathname || '/'), 'https://route.invalid');
  return `${parsed.pathname}${parsed.search}`;
}

function normalizeComparablePath(pathname = '/') {
  const value = String(pathname || '/');
  if (value === '/') return '/';
  return value.replace(/\/+$/, '') || '/';
}

function makeDocumentCases() {
  const cityMarker = W453A_PRIMARY_DOCUMENT_PROBES.find((probe) => probe.id === 'city-canonical')?.marker || 'Entering EON City';
  const primary = W453A_PRIMARY_DOCUMENT_PROBES.map((probe) => freeze({ ...probe, type: 'document', requiredMarkers: freeze([probe.marker]) }));
  const aliases = W453A_CITY_ALIAS_PATHS.map((path) => freeze({
    id: `city-alias-${path.replace(/^\//, '').replaceAll(/[^a-z0-9]+/gi, '-') || 'root'}`,
    path,
    type: 'city-alias',
    requiredMarkers: freeze([cityMarker]),
    expectedFinalPath: W453A_CANONICAL_CITY_PATH,
    expectedQuery: '',
    requireRedirect: true
  }));
  const queryAliases = W453A_CITY_QUERY_PROBES.map((probe) => freeze({
    ...probe,
    type: 'city-query-alias',
    requiredMarkers: freeze([cityMarker]),
    requireRedirect: true
  }));
  return freeze([...primary, ...aliases, ...queryAliases, freeze({ ...W453A_SERVICE_WORKER_PROBE, type: 'service-worker' })]);
}

export const W453A_EDGE_PROOF_CASES = makeDocumentCases();

function safeRedirectRecord(url, response) {
  const location = response.headers?.get?.('location') || null;
  const resolved = location ? new URL(location, url) : null;
  return freeze({
    path: new URL(url).pathname,
    query: new URL(url).search,
    status: Number(response.status),
    locationPath: resolved?.pathname || null,
    locationQuery: resolved?.search || null
  });
}

async function readPublicResponse(response) {
  const body = await response.text();
  return freeze({
    body,
    bodyHash: createHash('sha256').update(body).digest('hex'),
    byteLength: Buffer.byteLength(body),
    contentType: response.headers?.get?.('content-type') || null
  });
}

export async function followW453AEdgeCase(caseDefinition, { baseUrl = DEFAULT_BASE_URL, fetchImpl = globalThis.fetch } = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('A fetch implementation is required for the network-confirmed W453.1 probe.');
  const base = safeOrigin(baseUrl);
  const chain = [];
  const seen = new Set();
  let url = new URL(encodePath(caseDefinition.path), `${base}/`).toString();

  for (let hop = 0; hop < 8; hop += 1) {
    if (seen.has(url)) return freeze({ ok: false, failure: 'redirect-loop', chain: freeze(chain) });
    seen.add(url);
    const response = await fetchImpl(url, {
      redirect: 'manual',
      headers: { 'user-agent': 'EONAPP-W453.1-city-edge-proof/1.0', 'cache-control': 'no-cache' }
    });
    const record = safeRedirectRecord(url, response);
    chain.push(record);
    if (REDIRECT_STATUS.has(Number(response.status))) {
      const location = response.headers?.get?.('location');
      if (!location) return freeze({ ok: false, failure: 'redirect-without-location', chain: freeze(chain) });
      url = new URL(location, url).toString();
      continue;
    }

    const content = await readPublicResponse(response);
    const final = new URL(url);
    const markers = Object.fromEntries((caseDefinition.requiredMarkers || []).map((marker) => [marker, content.body.includes(marker)]));
    const expectedQuery = typeof caseDefinition.expectedQuery === 'string' ? caseDefinition.expectedQuery : new URL(encodePath(caseDefinition.path), `${base}/`).search;
    const markerPass = Object.values(markers).every(Boolean);
    const finalPathPass = normalizeComparablePath(final.pathname) === normalizeComparablePath(caseDefinition.expectedFinalPath);
    const queryPass = final.search === expectedQuery;
    const redirectPass = !caseDefinition.requireRedirect || chain.length > 1;
    const statusPass = Number(response.status) === 200;
    const ok = statusPass && markerPass && finalPathPass && queryPass && redirectPass;
    return freeze({
      ok,
      failure: ok ? null : [
        statusPass ? null : `status-${response.status}`,
        markerPass ? null : 'expected-marker-missing',
        finalPathPass ? null : 'unexpected-final-path',
        queryPass ? null : 'unexpected-final-query',
        redirectPass ? null : 'expected-redirect-missing'
      ].filter(Boolean).join(','),
      chain: freeze(chain),
      final: freeze({
        path: final.pathname,
        query: final.search,
        status: Number(response.status),
        contentType: content.contentType,
        byteLength: content.byteLength,
        contentHash: content.bodyHash,
        requiredMarkersPresent: freeze(markers)
      })
    });
  }
  return freeze({ ok: false, failure: 'too-many-redirects', chain: freeze(chain) });
}

export function createW453AEdgeDryRun({ baseUrl = DEFAULT_BASE_URL } = {}) {
  const base = safeOrigin(baseUrl);
  return freeze({
    schema: W453A_CITY_EDGE_PROOF_SCHEMA,
    wave: W453A_CITY_EDGE_PROOF_WAVE,
    routeContractVersion: W453A_ROUTE_CONTRACT_VERSION,
    status: 'dry-run-no-network',
    sourceOnly: true,
    baseUrl: base,
    canonicalCityPath: W453A_CANONICAL_CITY_PATH,
    caseCount: W453A_EDGE_PROOF_CASES.length,
    cases: freeze(W453A_EDGE_PROOF_CASES.map((entry) => freeze({ id: entry.id, path: entry.path, type: entry.type, expectedFinalPath: entry.expectedFinalPath }))),
    limitations: W453A_EDGE_PROOF_LIMITATIONS,
    note: 'Pass --confirm-network with an explicit HTTPS --base-url after Cloudflare Pages deploys the intended commit. No response body is persisted.'
  });
}

export async function inspectW453AProductionCityEdge({ baseUrl = DEFAULT_BASE_URL, confirmNetwork = false, fetchImpl = globalThis.fetch, now = () => new Date().toISOString() } = {}) {
  const errors = [...validateW453ACityEdgeProofContract()];
  if (!confirmNetwork) return createW453AEdgeDryRun({ baseUrl });
  const base = safeOrigin(baseUrl);
  const results = [];
  for (const caseDefinition of W453A_EDGE_PROOF_CASES) {
    try {
      results.push(freeze({ id: caseDefinition.id, path: caseDefinition.path, type: caseDefinition.type, ...(await followW453AEdgeCase(caseDefinition, { baseUrl: base, fetchImpl })) }));
    } catch (error) {
      results.push(freeze({ id: caseDefinition.id, path: caseDefinition.path, type: caseDefinition.type, ok: false, failure: 'network-error', errorName: error?.name || 'Error', errorMessage: String(error?.message || 'Unknown error').slice(0, 180) }));
    }
  }
  const status = errors.length === 0 && results.every((entry) => entry.ok) ? 'pass' : 'fail';
  return freeze({
    schema: W453A_CITY_EDGE_PROOF_SCHEMA,
    wave: W453A_CITY_EDGE_PROOF_WAVE,
    routeContractVersion: W453A_ROUTE_CONTRACT_VERSION,
    status,
    sourceOnly: false,
    generatedAt: now(),
    baseUrl: base,
    canonicalCityPath: W453A_CANONICAL_CITY_PATH,
    caseCount: results.length,
    results: freeze(results),
    contractErrors: freeze(errors),
    limitations: W453A_EDGE_PROOF_LIMITATIONS,
    storage: 'No response body, credentials, cookies, browser storage, prompts, telemetry payload, payment data or user-specific query string is persisted.'
  });
}

function argumentValue(args, flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function writeSafeReport(outputPath, report) {
  if (!outputPath) return;
  const resolved = path.resolve(outputPath);
  if (/\.env(?:\.|$)/i.test(resolved)) throw new Error('Refusing to write an edge-proof report to an environment file path.');
  mkdirSync(path.dirname(resolved), { recursive: true });
  writeFileSync(resolved, `${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === ENTRY_FILE) {
  const args = process.argv.slice(2);
  const result = await inspectW453AProductionCityEdge({
    baseUrl: argumentValue(args, '--base-url') || DEFAULT_BASE_URL,
    confirmNetwork: args.includes('--confirm-network')
  });
  writeSafeReport(argumentValue(args, '--out'), result);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.status === 'fail' ? 1 : 0;
}
