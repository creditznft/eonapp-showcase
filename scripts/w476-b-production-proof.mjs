#!/usr/bin/env node
/**
 * W476-B opt-in production/browser proof runner.
 *
 * It is deliberately observation-only: no cookies, storage, bodies, console
 * messages, account actions, OAuth starts, legacy transport writes, or local
 * runtime calls are persisted. The runner may only be used against a reviewed
 * preview or production origin after an explicit --allow-network flag.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W476_API_SURFACE_CONTRACT } from '../config/w476-api-surface-contract.mjs';
import {
  W476_B_DOCUMENT_ROUTES,
  W476_B_MANUAL_EVIDENCE,
  W476_B_PRODUCTION_PROOF_CONTRACT,
  validateW476BProductionProofContract
} from '../config/w476-b-production-proof-contract.mjs';
import { buildW476A6ExternalOriginInventory } from './w476-a6-release-evidence-gate.mjs';

const ENTRY_FILE = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(ENTRY_FILE), '..');
const REQUEST_TIMEOUT_MS = 12000;
const SAFE_READ_IDS = new Set([
  'actions-status',
  'auth-session',
  'connectors-status',
  'deployments-status'
]);
const SAFE_NEGATIVE_GET_IDS = new Set([
  'account-delete-request',
  'actions-execute',
  'actions-prepare',
  'auth-logout',
  'csp-report'
]);
const MANUAL_ONLY_IDS = new Set(['google-oauth-callback', 'google-oauth-start']);
const FORBIDDEN_RESPONSE_KEYS = new Set([
  'access_token', 'refresh_token', 'client_secret', 'accountid', 'account_id',
  'email', 'subject', 'sessionid', 'session_id', 'vault', 'providerkey', 'provider_key'
]);

const freeze = (value) => Object.freeze(value);
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const noQueryOrFragment = (value) => {
  const url = new URL(String(value));
  return `${url.origin}${url.pathname}`;
};
const classifyFailure = (error) => String(error?.name || 'Error').replace(/[^a-z0-9_-]/gi, '').slice(0, 48) || 'Error';

export function normalizeW476BBaseUrl(input = 'https://eonapp.ch', { allowInsecureLocal = false } = {}) {
  const url = new URL(String(input || ''));
  const local = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(allowInsecureLocal && local && url.protocol === 'http:')) {
    throw new Error('W476-B requires an HTTPS origin unless --allow-insecure-local is explicitly used for localhost proof.');
  }
  if (url.username || url.password || url.search || url.hash) throw new Error('W476-B base URL cannot include credentials, query strings or fragments.');
  return url.origin;
}

export function summarizeW476BCspPolicy(value = '') {
  const policy = String(value || '');
  return freeze({
    headerPresent: Boolean(policy.trim()),
    reportToDirective: /(?:^|;)\s*report-to\s+csp-endpoint(?:\s*;|$)/i.test(policy),
    reportUriDirective: /(?:^|;)\s*report-uri\s+\/csp-report(?:\s*;|$)/i.test(policy),
    hasUpgradeInsecureRequests: /(?:^|;)\s*upgrade-insecure-requests(?:\s*;|$)/i.test(policy)
  });
}

function summarizeHeaders(headers) {
  const csp = summarizeW476BCspPolicy(headers.get('content-security-policy') || '');
  const reportingEndpoints = String(headers.get('reporting-endpoints') || '');
  return freeze({
    contentType: String(headers.get('content-type') || '').split(';')[0].slice(0, 80),
    cacheControlNoStore: /(?:^|,)\s*no-store(?:,|$)/i.test(String(headers.get('cache-control') || '')),
    csp,
    reportingEndpointsPresent: /(?:^|,)\s*csp-endpoint\s*=/i.test(reportingEndpoints),
    reportToHeaderPresent: Boolean(String(headers.get('report-to') || '').trim())
  });
}

function responseShape(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return freeze({ validJsonObject: false, keys: freeze([]) });
  return freeze({ validJsonObject: true, keys: freeze(Object.keys(payload).sort().slice(0, 24)) });
}

function expectedDocumentHeaders(summary, entry) {
  return summary.csp.headerPresent
    && summary.csp.reportToDirective
    && summary.csp.reportUriDirective
    && summary.reportingEndpointsPresent
    && summary.reportToHeaderPresent
    && (!entry.localLoopbackException || summary.csp.hasUpgradeInsecureRequests === false);
}

async function safeFetch(fetcher, url, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetcher(url, {
      ...init,
      redirect: 'manual',
      headers: { 'user-agent': 'EONAPP-W476-B-proof/1.0', ...(init.headers || {}) },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function safeFetchFollowSameOrigin(fetcher, baseUrl, routePath) {
  let url = `${baseUrl}${routePath}`;
  const redirectChain = [];
  for (let hop = 0; hop < 6; hop += 1) {
    const response = await safeFetch(fetcher, url);
    if (response.status < 300 || response.status >= 400) return freeze({ response, finalPath: new URL(url).pathname, redirectChain: freeze(redirectChain) });
    const location = String(response.headers.get('location') || '');
    if (!location) return freeze({ response, finalPath: new URL(url).pathname, redirectChain: freeze(redirectChain), redirectFailure: 'redirect-without-location' });
    const next = new URL(location, url);
    if (next.origin !== baseUrl) return freeze({ response, finalPath: new URL(url).pathname, redirectChain: freeze(redirectChain), redirectFailure: 'cross-origin-redirect' });
    redirectChain.push(freeze({ fromPath: new URL(url).pathname, toPath: next.pathname, status: response.status }));
    url = next.toString();
  }
  return freeze({ response: null, finalPath: new URL(url).pathname, redirectChain: freeze(redirectChain), redirectFailure: 'too-many-redirects' });
}

async function probeDocument(fetcher, baseUrl, entry) {
  try {
    const followed = await safeFetchFollowSameOrigin(fetcher, baseUrl, entry.path);
    if (!followed.response) {
      return freeze({ route: entry.path, finalPath: followed.finalPath, redirects: followed.redirectChain, status: null, bodyByteLength: 0, bodySha256: null, markerPresent: false, headers: null, ok: false, issues: freeze([followed.redirectFailure || 'redirect-failed']) });
    }
    const response = followed.response;
    const body = await response.text();
    const headers = summarizeHeaders(response.headers);
    const markerPresent = body.includes(entry.marker);
    const headersPass = expectedDocumentHeaders(headers, entry);
    return freeze({
      route: entry.path,
      finalPath: followed.finalPath,
      redirects: followed.redirectChain,
      status: response.status,
      bodyByteLength: Buffer.byteLength(body),
      bodySha256: sha256(body),
      markerPresent,
      headers,
      ok: response.status === 200 && markerPresent && headersPass,
      issues: freeze([
        ...(response.status === 200 ? [] : [`status-${response.status}`]),
        ...(markerPresent ? [] : ['marker-missing']),
        ...(headersPass ? [] : ['csp-reporting-header-contract-missing'])
      ])
    });
  } catch (error) {
    return freeze({ route: entry.path, finalPath: null, redirects: freeze([]), status: null, bodyByteLength: 0, bodySha256: null, markerPresent: false, headers: null, ok: false, issues: freeze([`network-${classifyFailure(error)}`]) });
  }
}

async function probeCspCollector(fetcher, baseUrl) {
  const endpoint = `${baseUrl}/csp-report`;
  const report = [{
    type: 'csp-violation',
    body: {
      effectiveDirective: 'img-src',
      blockedURL: 'https://invalid.example/blocked?must-not-be-retained#fragment',
      documentURL: `${baseUrl}/chat?must-not-be-retained#fragment`
    }
  }];
  const foreignReport = [{
    type: 'csp-violation',
    body: {
      effectiveDirective: 'img-src',
      blockedURL: 'https://invalid.example/blocked',
      documentURL: 'https://foreign.invalid/private?must-not-be-retained#fragment'
    }
  }];
  const post = async (body) => safeFetch(fetcher, endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/reports+json' },
    body: JSON.stringify(body)
  });
  try {
    const [accepted, rejected, options] = await Promise.all([
      post(report),
      post(foreignReport),
      safeFetch(fetcher, endpoint, { method: 'OPTIONS', headers: { origin: baseUrl } })
    ]);
    const optionsOrigin = String(options.headers.get('access-control-allow-origin') || '');
    const ok = accepted.status === 204 && rejected.status === 400 && options.status === 204 && optionsOrigin === baseUrl;
    return freeze({
      endpoint: '/csp-report',
      acceptedStatus: accepted.status,
      foreignDocumentStatus: rejected.status,
      optionsStatus: options.status,
      sameOriginPreflight: optionsOrigin === baseUrl,
      cacheControlNoStore: /(?:^|,)\s*no-store(?:,|$)/i.test(String(accepted.headers.get('cache-control') || '')),
      ok,
      issues: freeze([
        ...(accepted.status === 204 ? [] : ['accepted-report-not-204']),
        ...(rejected.status === 400 ? [] : ['foreign-document-not-rejected']),
        ...(options.status === 204 ? [] : ['options-not-204']),
        ...(optionsOrigin === baseUrl ? [] : ['options-origin-not-same-origin'])
      ]),
      note: 'This proves endpoint transport and rejection behavior only. An authorised browser/log review is still required to prove automatic CSP delivery and redaction at the deployed logging destination.'
    });
  } catch (error) {
    return freeze({ endpoint: '/csp-report', acceptedStatus: null, foreignDocumentStatus: null, optionsStatus: null, sameOriginPreflight: false, cacheControlNoStore: false, ok: false, issues: freeze([`network-${classifyFailure(error)}`]) });
  }
}

function publicSafeJson(payload, allowedKeys = []) {
  const result = {};
  for (const key of allowedKeys) {
    if (typeof payload?.[key] === 'boolean') result[key] = payload[key];
  }
  return freeze(result);
}

function safeReadExpectation(surface, payload) {
  if (surface.id === 'auth-session') return typeof payload?.available === 'boolean' && typeof payload?.signedIn === 'boolean' && payload?.guestUseAvailable === true;
  if (surface.id === 'actions-status') return payload?.ok === true && payload?.enabled === false && payload?.externalEffect === false;
  if (surface.id === 'connectors-status') return payload?.ok === true && payload?.enabled === false && payload?.tokenStored === false && payload?.directPostCreated === false;
  if (surface.id === 'deployments-status') return payload?.ok === true && payload?.enabled === false && payload?.githubConnected === false && payload?.cloudflareConnected === false && payload?.deploymentCreated === false;
  return false;
}

async function probeSafeReadFunction(fetcher, baseUrl, surface) {
  try {
    const response = await safeFetch(fetcher, `${baseUrl}${surface.route}`);
    let payload = null;
    try { payload = await response.json(); } catch { /* shape failure below */ }
    const shape = responseShape(payload);
    const safeFlags = publicSafeJson(payload, ['ok', 'enabled', 'available', 'signedIn', 'guestUseAvailable', 'configured', 'tokenStored', 'directPostCreated', 'githubConnected', 'cloudflareConnected', 'deploymentCreated']);
    const forbiddenKeyObserved = shape.keys.some((key) => FORBIDDEN_RESPONSE_KEYS.has(String(key).toLowerCase()));
    const ok = response.status === 200 && shape.validJsonObject && !forbiddenKeyObserved && safeReadExpectation(surface, payload);
    return freeze({ id: surface.id, route: surface.route, status: response.status, shape, safeFlags, ok, issues: freeze(ok ? [] : ['safe-read-contract-failed']) });
  } catch (error) {
    return freeze({ id: surface.id, route: surface.route, status: null, shape: freeze({ validJsonObject: false, keys: freeze([]) }), safeFlags: freeze({}), ok: false, issues: freeze([`network-${classifyFailure(error)}`]) });
  }
}

async function probeDeniedGet(fetcher, baseUrl, surface) {
  try {
    const response = await safeFetch(fetcher, `${baseUrl}${surface.route}`);
    const status = response.status;
    const ok = [404, 405].includes(status);
    return freeze({ id: surface.id, route: surface.route, status, ok, issues: freeze(ok ? [] : ['wrong-method-not-rejected']) });
  } catch (error) {
    return freeze({ id: surface.id, route: surface.route, status: null, ok: false, issues: freeze([`network-${classifyFailure(error)}`]) });
  }
}

async function probeFunctionMatrix(fetcher, baseUrl) {
  const safeRead = W476_API_SURFACE_CONTRACT.surfaces.filter((surface) => SAFE_READ_IDS.has(surface.id));
  const deniedGet = W476_API_SURFACE_CONTRACT.surfaces.filter((surface) => SAFE_NEGATIVE_GET_IDS.has(surface.id));
  const safeReadResults = await Promise.all(safeRead.map((surface) => probeSafeReadFunction(fetcher, baseUrl, surface)));
  const deniedGetResults = await Promise.all(deniedGet.map((surface) => probeDeniedGet(fetcher, baseUrl, surface)));
  const manualOnly = W476_API_SURFACE_CONTRACT.surfaces
    .filter((surface) => MANUAL_ONLY_IDS.has(surface.id))
    .map((surface) => freeze({ id: surface.id, route: surface.route, reason: 'Not automatically requested because an OAuth start/callback may create a flow cookie or provider redirect.' }));
  const allAutomated = [...safeReadResults, ...deniedGetResults];
  return freeze({
    automatedCoverage: allAutomated.length,
    totalFunctionRoutes: W476_API_SURFACE_CONTRACT.surfaces.length,
    safeRead: freeze(safeReadResults),
    deniedGet: freeze(deniedGetResults),
    legacyTransportRead: null,
    manualOnly: freeze(manualOnly),
    ok: allAutomated.every((entry) => entry.ok),
    note: 'The two OAuth endpoints and all allowed conditional mutation cases stay manual/preview-only so the runner cannot create accounts, start OAuth, activate a legacy transport path or call any provider.'
  });
}

async function observeBrowserRoute(page, baseUrl, entry) {
  const routeConsoleTypes = new Map();
  let pageErrorCount = 0;
  const onConsole = (message) => routeConsoleTypes.set(message.type(), (routeConsoleTypes.get(message.type()) || 0) + 1);
  const onPageError = () => { pageErrorCount += 1; };
  page.on('console', onConsole);
  page.on('pageerror', onPageError);
  try {
    const response = await page.goto(`${baseUrl}${entry.path}`, { waitUntil: 'domcontentloaded', timeout: REQUEST_TIMEOUT_MS });
    await page.waitForTimeout(600);
    const bodyState = await page.evaluate((marker) => ({
      markerPresent: Boolean(document.body?.innerText?.includes(marker)),
      titlePresent: Boolean(document.title?.trim()),
      secureContext: window.isSecureContext === true,
      serviceWorkerApiPresent: 'serviceWorker' in navigator
    }), entry.marker);
    const headers = response ? summarizeHeaders({ get: (name) => response.headers()[String(name).toLowerCase()] || '' }) : null;
    const status = response?.status?.() ?? null;
    const headerPass = headers ? expectedDocumentHeaders(headers, entry) : false;
    const consoleTypes = Object.fromEntries([...routeConsoleTypes.entries()].sort(([a], [b]) => a.localeCompare(b)));
    const cleanConsole = !consoleTypes.error && pageErrorCount === 0;
    return freeze({
      route: entry.path,
      status,
      markerPresent: bodyState.markerPresent,
      titlePresent: bodyState.titlePresent,
      secureContext: bodyState.secureContext,
      serviceWorkerApiPresent: bodyState.serviceWorkerApiPresent,
      headers,
      consoleTypes: freeze(consoleTypes),
      pageErrorCount,
      cleanConsole,
      ok: status === 200 && bodyState.markerPresent && bodyState.titlePresent && bodyState.secureContext && headerPass && cleanConsole,
      issues: freeze([
        ...(status === 200 ? [] : [`status-${status ?? 'unknown'}`]),
        ...(bodyState.markerPresent ? [] : ['marker-missing']),
        ...(bodyState.titlePresent ? [] : ['title-missing']),
        ...(bodyState.secureContext ? [] : ['secure-context-missing']),
        ...(headerPass ? [] : ['csp-reporting-header-contract-missing']),
        ...(cleanConsole ? [] : ['console-or-page-error-observed'])
      ])
    });
  } catch (error) {
    return freeze({ route: entry.path, status: null, markerPresent: false, titlePresent: false, secureContext: false, serviceWorkerApiPresent: false, headers: null, consoleTypes: freeze({}), pageErrorCount: 0, cleanConsole: false, ok: false, issues: freeze([`browser-${classifyFailure(error)}`]) });
  } finally {
    page.off('console', onConsole);
    page.off('pageerror', onPageError);
  }
}

export async function observeW476BBrowser({ baseUrl, chromiumPath = null } = {}) {
  const observedOrigins = new Map();
  let browser;
  try {
    const playwright = await import('@playwright/test');
    browser = await playwright.chromium.launch({ headless: true, ...(chromiumPath ? { executablePath: chromiumPath } : {}) });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'allow' });
    const page = await context.newPage();
    page.on('request', (request) => {
      try {
        const url = new URL(request.url());
        if (url.origin === baseUrl) return;
        const previous = observedOrigins.get(url.origin) || new Set();
        previous.add(request.resourceType());
        observedOrigins.set(url.origin, previous);
      } catch { /* invalid URLs cannot be persisted */ }
    });
    const routes = [];
    for (const entry of W476_B_DOCUMENT_ROUTES) routes.push(await observeBrowserRoute(page, baseUrl, entry));
    await context.close();
    const inventory = buildW476A6ExternalOriginInventory();
    const knownOrigins = new Set(inventory.origins.map((entry) => entry.origin));
    const externalOrigins = [...observedOrigins.entries()]
      .map(([origin, types]) => freeze({ origin, resourceTypes: freeze([...types].sort()), knownToStaticInventory: knownOrigins.has(origin) }))
      .sort((left, right) => left.origin.localeCompare(right.origin));
    const unknownOrigins = externalOrigins.filter((entry) => !entry.knownToStaticInventory).map((entry) => entry.origin);
    return freeze({
      status: routes.every((entry) => entry.ok) && unknownOrigins.length === 0 ? 'pass-pending-human-review' : 'not-pass',
      routes: freeze(routes),
      externalOrigins: freeze(externalOrigins),
      unknownOrigins: freeze(unknownOrigins),
      browserStoragePersisted: false,
      screenshotsPersisted: false,
      consoleMessagesPersisted: false,
      ok: routes.every((entry) => entry.ok) && unknownOrigins.length === 0
    });
  } catch (error) {
    return freeze({ status: 'not-run-or-failed', routes: freeze([]), externalOrigins: freeze([]), unknownOrigins: freeze([]), browserStoragePersisted: false, screenshotsPersisted: false, consoleMessagesPersisted: false, ok: false, errorClass: classifyFailure(error) });
  } finally {
    if (browser) await browser.close();
  }
}

export function buildW476BDryRunPlan(baseUrl = 'https://eonapp.ch') {
  return freeze({
    schema: 'eonapp.w476.b.production-browser-proof-plan.v1',
    wave: 'W476-B',
    status: 'dry-run-no-network',
    baseUrl: normalizeW476BBaseUrl(baseUrl, { allowInsecureLocal: true }),
    sourceOnly: true,
    productionReleaseApproved: false,
    paymentActivationApproved: false,
    dodoActivationApproved: false,
    localImageVideoAdapterClaimed: false,
    documentRoutes: W476_B_DOCUMENT_ROUTES.map((entry) => freeze({ route: entry.path, marker: entry.marker })),
    functionRouteCount: W476_API_SURFACE_CONTRACT.surfaces.length,
    automaticFunctionCoverage: SAFE_READ_IDS.size + SAFE_NEGATIVE_GET_IDS.size,
    manualEvidence: W476_B_MANUAL_EVIDENCE,
    note: 'Pass --allow-network for public HTTP/CSP/function probes. Add --browser only after a reviewed deploy to run an ephemeral Chromium observation. Neither mode certifies a production release.'
  });
}

export async function runW476BProductionProof({ baseUrl = 'https://eonapp.ch', allowNetwork = false, includeBrowser = false, chromiumPath = null, allowInsecureLocal = false, fetcher = fetch } = {}) {
  const contractIssues = validateW476BProductionProofContract();
  if (contractIssues.length) return freeze({ status: 'source-contract-invalid', ok: false, issues: contractIssues, productionReleaseApproved: false });
  const normalizedBaseUrl = normalizeW476BBaseUrl(baseUrl, { allowInsecureLocal });
  if (!allowNetwork) return buildW476BDryRunPlan(normalizedBaseUrl);
  const [documents, cspCollector, functionMatrix] = await Promise.all([
    Promise.all(W476_B_DOCUMENT_ROUTES.map((entry) => probeDocument(fetcher, normalizedBaseUrl, entry))),
    probeCspCollector(fetcher, normalizedBaseUrl),
    probeFunctionMatrix(fetcher, normalizedBaseUrl)
  ]);
  const browser = includeBrowser
    ? await observeW476BBrowser({ baseUrl: normalizedBaseUrl, chromiumPath })
    : freeze({ status: 'not-run', ok: false, reason: 'browser-not-requested' });
  const issues = [
    ...documents.flatMap((entry) => entry.issues.map((issue) => `document:${entry.route}:${issue}`)),
    ...cspCollector.issues.map((issue) => `csp:${issue}`),
    ...(functionMatrix.ok ? [] : ['function-matrix:not-pass']),
    ...(includeBrowser && !browser.ok ? ['browser-observation:not-pass'] : []),
    ...(!includeBrowser ? ['browser-observation:not-run'] : [])
  ];
  const automatedHttpOk = documents.every((entry) => entry.ok) && cspCollector.ok && functionMatrix.ok;
  return freeze({
    schema: 'eonapp.w476.b.production-browser-proof-result.v1',
    wave: 'W476-B',
    status: automatedHttpOk && includeBrowser && browser.ok ? 'captured-pending-human-review' : 'not-pass-or-incomplete',
    ok: automatedHttpOk && includeBrowser && browser.ok,
    sourceOnly: false,
    networkOptIn: true,
    baseUrl: normalizedBaseUrl,
    generatedAt: new Date().toISOString(),
    documents: freeze(documents),
    cspCollector,
    functionMatrix,
    browser,
    manualEvidenceStillRequired: W476_B_MANUAL_EVIDENCE,
    productionReleaseApproved: false,
    paymentActivationApproved: false,
    dodoActivationApproved: false,
    localImageVideoAdapterClaimed: false,
    issues: freeze(issues),
    note: 'A green automated observation only captures redacted technical evidence. It never proves a local runtime, browser CSP delivery/log redaction, device behavior, OAuth lifecycle, rollback survival or owner GO/NO-GO.'
  });
}

function parseCli(argv = []) {
  const result = { baseUrl: 'https://eonapp.ch', allowNetwork: false, includeBrowser: false, chromiumPath: null, out: null, allowInsecureLocal: false };
  for (const arg of argv) {
    if (arg === '--allow-network') result.allowNetwork = true;
    else if (arg === '--browser') result.includeBrowser = true;
    else if (arg === '--allow-insecure-local') result.allowInsecureLocal = true;
    else if (arg.startsWith('--base-url=')) result.baseUrl = arg.slice('--base-url='.length);
    else if (arg.startsWith('--chromium-path=')) result.chromiumPath = arg.slice('--chromium-path='.length);
    else if (arg.startsWith('--out=')) result.out = arg.slice('--out='.length);
  }
  return result;
}

if (path.resolve(process.argv[1] || '') === ENTRY_FILE) {
  const args = parseCli(process.argv.slice(2));
  const result = await runW476BProductionProof(args);
  if (args.out) {
    const output = path.resolve(root, args.out);
    if (/\.env(?:\.|$)/i.test(output)) throw new Error('Refusing to write W476-B evidence to an environment-file path.');
    mkdirSync(path.dirname(output), { recursive: true });
    writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (args.allowNetwork && result.ok !== true) process.exitCode = 1;
}
