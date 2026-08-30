#!/usr/bin/env node
/**
 * W461.1 — optional public-edge probe for Telegram onboarding and Research Lab.
 *
 * This tool is dry by default. With explicit --allow-network it performs only
 * unauthenticated public GETs, stores no response body, and never contacts the
 * Telegram Bot API, opens a Mini App, sends a message, validates a session,
 * creates a reward, or carries out research/trading activity.
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W461_TELEGRAM_RESEARCH_PRODUCTION_PROOF_CONTRACT } from '../config/w461-telegram-research-production-proof-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY_FILE = fileURLToPath(import.meta.url);
const freeze = (value) => Object.freeze(value);
const stripTrailingSlash = (value) => String(value || '').replace(/\/+$/, '');
const REDIRECT_STATUS = new Set([301, 302, 303, 307, 308]);

function safeOrigin(origin = '') {
  let url;
  try { url = new URL(String(origin || '')); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') return null;
  return url.origin;
}

function sha256(value = '') {
  return `sha256:${createHash('sha256').update(String(value || ''), 'utf8').digest('hex')}`;
}

function safeLocation(value = '', origin = '') {
  try {
    const target = new URL(String(value || ''), origin);
    const base = new URL(origin);
    if (target.origin !== base.origin || target.search || target.hash) return '';
    return `${target.pathname || '/'}`;
  } catch { return ''; }
}

function safeStatus(value) {
  const status = Number(value);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : 0;
}

function documentResult(probe, response, body = '') {
  const text = String(body || '');
  const markerMatches = Object.fromEntries(probe.markers.map((marker) => [marker, text.includes(marker)]));
  const livePriceOrFeedClaim = /live\s+(?:price|feed)/i.test(text) && !/no\s+live\s+(?:price|feed)/i.test(text);
  const brokerOrOrderPositive = /broker(?:age)?\s*(?:connect|connection)|exchange\s+order|place\s+order/i.test(text);
  const brokerOrOrderNegativeBoundary = /without\s+a\s+broker\s+connection|no\s+[^.]*order\s+path|does\s+not\s+create\s+an\s+external\s+order|no\s+orders\b|without\s+[^.]*exchange\s+order/i.test(text);
  const forbidden = {
    telegramSdkLoaded: /telegram\.org\/js\/telegram-web-app\.js|Telegram\.WebApp/i.test(text),
    rewardRouteOffered: /reward-access(?:\.html)?|startapp=rewards|channel-membership-required/i.test(text),
    monetagReference: /monetag|propellerads|ad-reward|offerwall/i.test(text),
    brokerOrOrderPath: (brokerOrOrderPositive && !brokerOrOrderNegativeBoundary) || livePriceOrFeedClaim
  };
  const markerPass = Object.values(markerMatches).every(Boolean);
  const policyPass = !Object.values(forbidden).some(Boolean);
  return freeze({
    id: probe.id,
    path: probe.path,
    type: probe.type,
    status: safeStatus(response?.status),
    expectedStatus: probe.expectedStatus,
    statusPass: safeStatus(response?.status) === probe.expectedStatus,
    markerMatches: freeze(markerMatches),
    policy: freeze(forbidden),
    bodySha256: sha256(text),
    bodyBytes: Buffer.byteLength(text, 'utf8'),
    responseBodyStored: false,
    pass: safeStatus(response?.status) === probe.expectedStatus && markerPass && policyPass
  });
}

function redirectResult(probe, response, origin = '') {
  const raw = response?.headers?.get?.('location') || '';
  const location = safeLocation(raw, origin);
  return freeze({
    id: probe.id,
    path: probe.path,
    type: probe.type,
    status: safeStatus(response?.status),
    expectedStatus: probe.expectedStatus,
    statusPass: safeStatus(response?.status) === probe.expectedStatus,
    location,
    expectedLocation: probe.expectedLocation,
    locationPass: location === probe.expectedLocation,
    responseBodyStored: false,
    pass: safeStatus(response?.status) === probe.expectedStatus && location === probe.expectedLocation
  });
}

async function fetchDocumentFollowingSameOriginRedirects(probe, origin, fetchImpl) {
  let currentUrl = `${origin}${probe.path}`;
  const visited = new Set();
  for (let hop = 0; hop < 6; hop += 1) {
    if (visited.has(currentUrl)) {
      return freeze({ response: null, body: '', requestError: 'redirect-loop' });
    }
    visited.add(currentUrl);
    let response;
    try {
      response = await fetchImpl(currentUrl, { method: 'GET', redirect: 'manual', credentials: 'omit', headers: {} });
    } catch (error) {
      return freeze({ response: null, body: '', requestError: String(error?.message || 'public-request-failed').slice(0, 180) });
    }
    if (!REDIRECT_STATUS.has(safeStatus(response?.status))) {
      const body = await response?.text?.() || '';
      return freeze({ response, body, requestError: '' });
    }
    const location = response?.headers?.get?.('location') || '';
    const next = safeLocation(location, origin);
    if (!next) return freeze({ response: null, body: '', requestError: 'redirect-outside-origin' });
    currentUrl = `${origin}${next}`;
  }
  return freeze({ response: null, body: '', requestError: 'too-many-redirects' });
}

export function createW461TelegramResearchProductionProofPlan({ origin = '' } = {}) {
  const verifiedOrigin = safeOrigin(origin);
  if (!verifiedOrigin) return freeze({ ok: false, error: 'https-origin-required', networkRequestCreated: false, liveProductionProof: false });
  return freeze({
    ok: true,
    schema: W461_TELEGRAM_RESEARCH_PRODUCTION_PROOF_CONTRACT.schema,
    wave: W461_TELEGRAM_RESEARCH_PRODUCTION_PROOF_CONTRACT.wave,
    origin: verifiedOrigin,
    method: 'GET',
    redirect: 'manual',
    requestCookieIncluded: false,
    requestHeaders: freeze({}),
    probes: W461_TELEGRAM_RESEARCH_PRODUCTION_PROOF_CONTRACT.probes.map((probe) => freeze({ ...probe, url: `${verifiedOrigin}${probe.path}` })),
    networkRequestCreated: false,
    botActionCreated: false,
    telegramSessionValidated: false,
    telegramMessageSent: false,
    rewardMechanicEnabled: false,
    brokerOrOrderPathEnabled: false,
    responseBodyStored: false,
    humanVisualReviewRequired: true,
    liveProductionProof: false
  });
}

export async function runW461TelegramResearchProductionProof({ origin = '', allowNetwork = false, fetchImpl = globalThis.fetch } = {}) {
  const plan = createW461TelegramResearchProductionProofPlan({ origin });
  if (!plan.ok) return plan;
  if (allowNetwork !== true) {
    return freeze({
      ...plan,
      ok: true,
      status: 'dry-run',
      networkRequestCreated: false,
      results: freeze([]),
      liveProductionProof: false,
      limitations: freeze(['Network access requires an explicit operator opt-in.', 'No Telegram Bot API, Mini App session, message, rewards, browser rendering, device proof, or human visual review occurred.'])
    });
  }
  if (typeof fetchImpl !== 'function') return freeze({ ...plan, ok: false, error: 'fetch-unavailable', networkRequestCreated: false, liveProductionProof: false });
  const results = [];
  for (const probe of plan.probes) {
    let response = null;
    let body = '';
    let requestError = '';
    if (probe.type === 'document') {
      const settled = await fetchDocumentFollowingSameOriginRedirects(probe, plan.origin, fetchImpl);
      response = settled.response;
      body = settled.body;
      requestError = settled.requestError;
    } else {
      try {
        response = await fetchImpl(probe.url, { method: 'GET', redirect: 'manual', credentials: 'omit', headers: {} });
      } catch (error) {
        requestError = String(error?.message || 'public-request-failed').slice(0, 180);
      }
    }
    if (requestError) {
      results.push(freeze({ id: probe.id, path: probe.path, type: probe.type, pass: false, requestError, responseBodyStored: false }));
      continue;
    }
    results.push(probe.type === 'document' ? documentResult(probe, response, body) : redirectResult(probe, response, plan.origin));
  }
  const passed = results.length === plan.probes.length && results.every((result) => result.pass === true);
  return freeze({
    ...plan,
    ok: passed,
    status: passed ? 'captured-public-edge-metadata' : 'failed',
    networkRequestCreated: true,
    results: freeze(results),
    responseBodyStored: false,
    botActionCreated: false,
    telegramSessionValidated: false,
    telegramMessageSent: false,
    rewardMechanicEnabled: false,
    brokerOrOrderPathEnabled: false,
    humanVisualReviewRequired: true,
    liveProductionProof: false,
    limitations: freeze([
      'A captured public HTTP response is not Telegram Mini App, bot, browser, device, accessibility, visual, identity, or release proof.',
      'The report stores only statuses, redirect paths, marker booleans, byte counts and SHA-256 body hashes; it never stores public response bodies, cookies, prompts, credentials or personal data.'
    ])
  });
}

function parseCli(argv = []) {
  const result = {};
  for (const value of argv) {
    if (value === '--allow-network') result.allowNetwork = true;
    else if (value.startsWith('--origin=')) result.origin = value.slice('--origin='.length);
    else if (value.startsWith('--out=')) result.out = value.slice('--out='.length);
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === ENTRY_FILE) {
  const args = parseCli(process.argv.slice(2));
  const report = await runW461TelegramResearchProductionProof({ origin: args.origin || 'https://eonapp.ch', allowNetwork: args.allowNetwork === true });
  const output = args.out ? path.resolve(root, args.out) : path.join(root, 'artifacts', 'w461-telegram-research-production-proof', 'report.json');
  mkdirSync(path.dirname(output), { recursive: true });
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}
