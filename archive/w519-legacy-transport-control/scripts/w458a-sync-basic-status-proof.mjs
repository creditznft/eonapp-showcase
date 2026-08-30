#!/usr/bin/env node
/**
 * W458.1 — opt-in post-deploy Sync Basic status proof.
 *
 * This runner checks only the public, read-only status boundary. It never
 * sends a cookie, record, tombstone, credential, project, chat, Vault value,
 * or request body. It is dry by default and stores no response body.
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ENTRY_FILE = fileURLToPath(import.meta.url);

export const W458A_SYNC_BASIC_STATUS_PROOF_SCHEMA = 'eonapp.sync-basic-status-proof.w458.1.v1';

const freeze = (value) => Object.freeze(value);
const ALLOWED_STATUS = new Set(['not-configured', 'sign-in-required']);
const ALLOWED_KEYS = Object.freeze([
  'schema', 'available', 'rollout', 'signedIn', 'status', 'identityOnly',
  'automaticUpload', 'backgroundSync', 'automaticMerge', 'automaticDeletion',
  'secureVaultSync', 'rawMediaSync', 'localModelSync', 'apiKeySync',
  'liveReleaseApproved', 'manualProofRequired', 'supportedTypes', 'exclusions'
]);

function safeHttpsOrigin(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return null;
  let url;
  try { url = new URL(raw); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
  url.pathname = '/';
  return url;
}

function publicStatusShape(payload = {}) {
  const value = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
  return freeze({
    schema: String(value.schema || '').slice(0, 96),
    available: value.available === true,
    rollout: String(value.rollout || '').slice(0, 48),
    signedIn: value.signedIn === true,
    status: String(value.status || '').slice(0, 64),
    identityOnly: value.identityOnly === true,
    automaticUpload: value.automaticUpload === true,
    backgroundSync: value.backgroundSync === true,
    automaticMerge: value.automaticMerge === true,
    automaticDeletion: value.automaticDeletion === true,
    secureVaultSync: value.secureVaultSync === true,
    rawMediaSync: value.rawMediaSync === true,
    localModelSync: value.localModelSync === true,
    apiKeySync: value.apiKeySync === true,
    liveReleaseApproved: value.liveReleaseApproved === true,
    manualProofRequired: value.manualProofRequired === true,
    supportedTypes: Array.isArray(value.supportedTypes) ? value.supportedTypes.map((entry) => String(entry).slice(0, 64)).slice(0, 12) : [],
    exclusions: Array.isArray(value.exclusions) ? value.exclusions.map((entry) => String(entry).slice(0, 180)).slice(0, 8) : []
  });
}

export function createW458ASyncBasicStatusProofPlan({ origin = '' } = {}) {
  const base = safeHttpsOrigin(origin);
  return freeze({
    schema: W458A_SYNC_BASIC_STATUS_PROOF_SCHEMA,
    origin: base?.origin || null,
    endpoint: base ? new URL('/api/sync/status', base).toString() : null,
    method: 'GET',
    defaultMode: 'dry-run',
    requestBodyCreated: false,
    requestCookieIncluded: false,
    recordUploadCreated: false,
    tombstoneCreated: false,
    responseBodyStored: false,
    localStorageWritten: false,
    manualDeviceProofRequired: true,
    liveReleaseApproved: false
  });
}

export function validateW458ASyncBasicPublicStatus(status = {}) {
  const errors = [];
  if (status.schema !== 'eonapp.sync-basic-transport.w412.v1') errors.push('unexpected-sync-schema');
  if (!ALLOWED_STATUS.has(status.status)) errors.push('unauthenticated-status-must-remain-disabled-or-sign-in-required');
  if (status.signedIn !== false) errors.push('status-probe-must-not-carry-an-authenticated-session');
  if (status.manualProofRequired !== true) errors.push('manual-proof-flag-required');
  for (const key of ['automaticUpload', 'backgroundSync', 'automaticMerge', 'automaticDeletion', 'secureVaultSync', 'rawMediaSync', 'localModelSync', 'apiKeySync', 'liveReleaseApproved']) {
    if (status[key] !== false) errors.push(`${key}-must-remain-false`);
  }
  if (!Array.isArray(status.supportedTypes) || !status.supportedTypes.length) errors.push('supported-types-required');
  if (!Array.isArray(status.exclusions) || !status.exclusions.length) errors.push('exclusions-required');
  return freeze({ schema: W458A_SYNC_BASIC_STATUS_PROOF_SCHEMA, ok: errors.length === 0, errors: freeze(errors) });
}

function timeoutSignal(timeoutMs = 8000) {
  if (typeof AbortSignal?.timeout === 'function') return AbortSignal.timeout(Math.max(1000, Math.min(30000, Number(timeoutMs) || 8000)));
  return undefined;
}

/**
 * Runs only after a caller explicitly asks for a network probe. It intentionally
 * omits cookies/credentials and accepts only the unauthenticated public status.
 */
export async function runW458ASyncBasicStatusProof({ origin = '', allowNetwork = false, fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
  const plan = createW458ASyncBasicStatusProofPlan({ origin });
  if (!plan.origin) return freeze({ ok: false, status: 'invalid-origin', plan, networkRequestCreated: false, publicStatus: null });
  if (allowNetwork !== true) return freeze({ ok: true, status: 'dry-run', plan, networkRequestCreated: false, publicStatus: null });
  if (typeof fetchImpl !== 'function') return freeze({ ok: false, status: 'fetch-unavailable', plan, networkRequestCreated: false, publicStatus: null });
  try {
    const response = await fetchImpl(plan.endpoint, {
      method: 'GET',
      redirect: 'error',
      credentials: 'omit',
      headers: { accept: 'application/json' },
      signal: timeoutSignal(timeoutMs)
    });
    let parsed = null;
    try { parsed = await response.json(); } catch { parsed = null; }
    const publicStatus = publicStatusShape(parsed);
    const validation = response.status === 200 && validateW458ASyncBasicPublicStatus(publicStatus);
    return freeze({
      ok: response.status === 200 && validation.ok,
      status: validation.ok ? 'public-status-verified' : 'public-status-invalid',
      plan,
      networkRequestCreated: true,
      responseStatus: Number(response.status || 0),
      publicStatus,
      validation,
      responseBodyStored: false,
      recordUploadCreated: false,
      tombstoneCreated: false,
      manualDeviceProofRequired: true,
      liveReleaseApproved: false
    });
  } catch {
    return freeze({ ok: false, status: 'public-status-unreachable', plan, networkRequestCreated: true, publicStatus: null, responseBodyStored: false, manualDeviceProofRequired: true, liveReleaseApproved: false });
  }
}

export function parseW458AStatusProofArgs(argv = []) {
  const values = Array.isArray(argv) ? argv : [];
  const originArg = values.find((entry) => String(entry).startsWith('--origin='));
  const timeoutArg = values.find((entry) => String(entry).startsWith('--timeout-ms='));
  return freeze({
    origin: originArg ? String(originArg).slice('--origin='.length) : '',
    allowNetwork: values.includes('--allow-network'),
    timeoutMs: timeoutArg ? Number(String(timeoutArg).slice('--timeout-ms='.length)) : 8000
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === ENTRY_FILE) {
  const args = parseW458AStatusProofArgs(process.argv.slice(2));
  const result = await runW458ASyncBasicStatusProof(args);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok || result.status === 'dry-run') process.exitCode = result.status === 'dry-run' ? 0 : 1;
}

export const W458A_SYNC_BASIC_STATUS_PROOF_PUBLIC_KEYS = ALLOWED_KEYS;
