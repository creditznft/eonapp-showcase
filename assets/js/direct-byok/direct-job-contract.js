/**
 * W626A — provider-neutral Direct BYOK job and threat contract.
 *
 * This module can carry private request input to the owner-controlled loopback
 * companion, but every public receipt is redacted. It never persists a provider
 * credential, authorizes an EONAPP server proxy, or accepts arbitrary endpoints.
 */

export const EON_DIRECT_JOB_SCHEMA = 'eon.direct-byok.job.w626a.v1';
export const EON_DIRECT_EVENT_SCHEMA = 'eon.direct-byok.event.w626a.v1';
export const EON_DIRECT_RECEIPT_SCHEMA = 'eon.direct-byok.receipt.w626a.v1';

export const EON_DIRECT_JOB_STATES = Object.freeze([
  'draft', 'waiting-for-user', 'queued', 'running', 'completed', 'failed', 'cancelled', 'expired'
]);
export const EON_DIRECT_MEDIA_KINDS = Object.freeze(['image', 'video', 'music']);
export const EON_DIRECT_PROVIDER_IDS = Object.freeze(['fal', 'replicate', 'elevenlabs']);
export const EON_DIRECT_ALLOWED_APP_ORIGINS = Object.freeze([
  'https://eonapp.ch',
  'http://127.0.0.1:4173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://localhost:5173'
]);

const STATE_SET = new Set(EON_DIRECT_JOB_STATES);
const MEDIA_SET = new Set(EON_DIRECT_MEDIA_KINDS);
const PROVIDER_SET = new Set(EON_DIRECT_PROVIDER_IDS);
const ORIGIN_SET = new Set(EON_DIRECT_ALLOWED_APP_ORIGINS);
const SAFE_ID_RE = /^[a-z0-9][a-z0-9._:-]{2,127}$/i;
const FORBIDDEN_FIELD_RE = /(api.?key|credential|secret|authorization|password|bearer|private.?key|access.?token|refresh.?token)/i;
const MAX_PROMPT_CHARS = 12000;
const MAX_REFERENCE_BYTES = 24 * 1024 * 1024;
const MAX_INPUT_JSON_BYTES = 256 * 1024;
const MAX_PUBLIC_LABEL_CHARS = 120;

function freeze(value) { return Object.freeze(value); }
function text(value = '', limit = MAX_PUBLIC_LABEL_CHARS) { return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit); }
function utf8Bytes(value = '') { return new TextEncoder().encode(String(value)).byteLength; }
function hasForbiddenField(value, seen = new Set()) {
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return true;
  seen.add(value);
  if (Array.isArray(value)) return value.some((entry) => hasForbiddenField(entry, seen));
  return Object.entries(value).some(([key, entry]) => FORBIDDEN_FIELD_RE.test(key) || hasForbiddenField(entry, seen));
}
function iso(value = Date.now()) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return new Date(numeric).toISOString();
  const parsed = Date.parse(String(value || ''));
  return new Date(Number.isFinite(parsed) && parsed > 0 ? parsed : Date.now()).toISOString();
}
function randomId(prefix = 'eondirectjob') {
  const bytes = new Uint8Array(12);
  globalThis.crypto?.getRandomValues?.(bytes);
  const suffix = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('') || `${Date.now()}${Math.random().toString(16).slice(2)}`;
  return `${prefix}_${suffix}`.slice(0, 96);
}

export function isAllowedEonAppOrigin(origin = '') {
  try { return ORIGIN_SET.has(new URL(String(origin)).origin); } catch { return false; }
}

function parseDirectHttpsEndpoint(url = '') {
  let parsed;
  try { parsed = new URL(String(url)); } catch { return freeze({ ok: false, reason: 'invalid-endpoint' }); }
  if (parsed.protocol !== 'https:') return freeze({ ok: false, reason: 'https-required' });
  return freeze({ ok: true, parsed });
}

export function assertDirectProviderApiEndpoint(url = '', providerPolicy = {}) {
  const checked = parseDirectHttpsEndpoint(url);
  if (!checked.ok) return checked;
  const { parsed } = checked;
  const exact = new Set(Array.isArray(providerPolicy.apiOrigins) ? providerPolicy.apiOrigins : []);
  const allowed = exact.has(parsed.origin);
  return freeze({ ok: allowed, reason: allowed ? 'api-origin-allowlisted' : 'api-origin-not-allowlisted', origin: parsed.origin, hostname: parsed.hostname });
}

export function assertDirectProviderMediaEndpoint(url = '', providerPolicy = {}) {
  const checked = parseDirectHttpsEndpoint(url);
  if (!checked.ok) return checked;
  const { parsed } = checked;
  const suffixes = Array.isArray(providerPolicy.mediaHostnameSuffixes) ? providerPolicy.mediaHostnameSuffixes : [];
  const allowed = suffixes.some((suffix) => parsed.hostname === suffix || parsed.hostname.endsWith(`.${suffix}`));
  return freeze({ ok: allowed, reason: allowed ? 'media-host-allowlisted' : 'media-host-not-allowlisted', origin: parsed.origin, hostname: parsed.hostname });
}

export function assertDirectJobEndpoint(url = '', providerPolicy = {}) {
  const api = assertDirectProviderApiEndpoint(url, providerPolicy);
  if (api.ok) return freeze({ ...api, reason: 'allowlisted' });
  const media = assertDirectProviderMediaEndpoint(url, providerPolicy);
  if (media.ok) return freeze({ ...media, reason: 'allowlisted' });
  const reason = ['invalid-endpoint', 'https-required'].includes(api.reason) ? api.reason : 'endpoint-not-allowlisted';
  return freeze({ ok: false, reason, origin: api.origin || media.origin || '', hostname: api.hostname || media.hostname || '' });
}

export function validateDirectReference(reference = null) {
  if (!reference) return freeze({ ok: true, reference: null });
  const sizeBytes = Number(reference.sizeBytes || 0);
  const contentType = String(reference.contentType || '').toLowerCase();
  const name = text(reference.name || 'reference', 160);
  if (!Number.isFinite(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_REFERENCE_BYTES) return freeze({ ok: false, reason: 'reference-size-rejected' });
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(contentType)) return freeze({ ok: false, reason: 'reference-content-type-rejected' });
  return freeze({ ok: true, reference: freeze({ name, sizeBytes, contentType, digest: SAFE_ID_RE.test(String(reference.digest || '')) ? String(reference.digest) : '' }) });
}

export function buildDirectJobRequest(candidate = {}, options = {}) {
  if (options.explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required', networkRequestCreated: false });
  if (options.explicitUserApproval !== true) return freeze({ ok: false, reason: 'explicit-user-approval-required', networkRequestCreated: false });
  if (options.budgetConfirmed !== true) return freeze({ ok: false, reason: 'per-job-budget-confirmation-required', networkRequestCreated: false });
  const providerId = String(candidate.providerId || '').trim().toLowerCase();
  const mediaKind = String(candidate.mediaKind || '').trim().toLowerCase();
  const modelId = String(candidate.modelId || '').trim();
  const prompt = String(candidate.prompt || '').trim();
  if (!PROVIDER_SET.has(providerId)) return freeze({ ok: false, reason: 'provider-not-allowlisted', networkRequestCreated: false });
  if (!MEDIA_SET.has(mediaKind)) return freeze({ ok: false, reason: 'media-kind-rejected', networkRequestCreated: false });
  if (!SAFE_ID_RE.test(modelId)) return freeze({ ok: false, reason: 'reviewed-model-id-required', networkRequestCreated: false });
  if (!prompt || prompt.length > MAX_PROMPT_CHARS) return freeze({ ok: false, reason: 'prompt-length-rejected', networkRequestCreated: false });
  if (hasForbiddenField(candidate.input || {})) return freeze({ ok: false, reason: 'credential-fields-rejected', networkRequestCreated: false });
  const reference = validateDirectReference(candidate.reference);
  if (!reference.ok) return freeze({ ok: false, reason: reference.reason, networkRequestCreated: false });
  if (mediaKind === 'music' && reference.reference) return freeze({ ok: false, reason: 'music-reference-input-not-enabled', networkRequestCreated: false });
  const input = freeze({ ...(candidate.input || {}), prompt });
  if (utf8Bytes(JSON.stringify(input)) > MAX_INPUT_JSON_BYTES) return freeze({ ok: false, reason: 'input-payload-too-large', networkRequestCreated: false });
  const now = Number(options.now?.() ?? Date.now());
  const job = freeze({
    schema: EON_DIRECT_JOB_SCHEMA,
    jobId: SAFE_ID_RE.test(String(candidate.jobId || '')) ? String(candidate.jobId) : randomId(),
    providerId,
    mediaKind,
    modelId,
    sourceSurface: text(candidate.sourceSurface || 'create', 48),
    safeLabel: text(candidate.safeLabel || `Direct ${mediaKind} job`),
    state: 'waiting-for-user',
    input,
    reference: reference.reference,
    userBudget: freeze({ currency: text(candidate.userBudget?.currency || 'USD', 8).toUpperCase(), warningAmount: Math.max(0, Number(candidate.userBudget?.warningAmount || 0) || 0), hardStopAmount: Math.max(0, Number(candidate.userBudget?.hardStopAmount || 0) || 0) }),
    retryPolicy: 'manual-only',
    redirectPolicy: 'manual-and-revalidate',
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString()
  });
  return freeze({ ok: true, job, networkRequestCreated: false });
}

export function normalizeDirectJobEvent(candidate = {}, fallback = {}) {
  const jobId = String(candidate.jobId || fallback.jobId || '').trim();
  const state = String(candidate.state || '').trim();
  if (!SAFE_ID_RE.test(jobId) || !STATE_SET.has(state)) return null;
  const progress = Number.isFinite(Number(candidate.progress)) ? Math.min(100, Math.max(0, Math.round(Number(candidate.progress)))) : null;
  return freeze({
    schema: EON_DIRECT_EVENT_SCHEMA,
    jobId,
    state,
    providerId: PROVIDER_SET.has(String(candidate.providerId || fallback.providerId || '')) ? String(candidate.providerId || fallback.providerId) : '',
    progress,
    code: SAFE_ID_RE.test(String(candidate.code || '')) ? String(candidate.code) : state,
    message: text(candidate.message || state, 180),
    at: iso(candidate.at || Date.now()),
    authoritativeProgress: candidate.authoritativeProgress === true && progress !== null,
    result: candidate.result && typeof candidate.result === 'object' ? freeze({ ...candidate.result }) : null
  });
}

export function toDirectJobPublicReceipt(job = {}, event = {}) {
  const normalized = normalizeDirectJobEvent({ ...event, jobId: job.jobId, providerId: job.providerId }, job);
  if (!normalized) return null;
  return freeze({
    schema: EON_DIRECT_RECEIPT_SCHEMA,
    jobId: job.jobId,
    providerId: job.providerId,
    mediaKind: job.mediaKind,
    modelId: job.modelId,
    sourceSurface: job.sourceSurface,
    safeLabel: job.safeLabel,
    state: normalized.state,
    progress: normalized.progress,
    authoritativeProgress: normalized.authoritativeProgress,
    code: normalized.code,
    message: normalized.message,
    at: normalized.at,
    directFromUserDevice: true,
    eonappServerProxyUsed: false,
    eonappServerMediaStored: false,
    credentialStoredInBrowser: false,
    rawPromptIncluded: false,
    rawReferenceIncluded: false,
    rawProviderPayloadIncluded: false,
    automaticPaidRetry: false
  });
}

export function getDirectJobThreatModel() {
  return freeze({
    schema: 'eon.direct-byok.threat-model.w626a.v1',
    providerAllowlistRequired: true,
    endpointAllowlistRequired: true,
    reviewedModelRequired: true,
    httpsProviderEndpointsOnly: true,
    redirectsFollowedAutomatically: false,
    browserPermanentCredentialsAllowed: false,
    eonappCloudflareProxyAllowed: false,
    rawPromptLoggingAllowed: false,
    rawMediaLoggingAllowed: false,
    maxPromptChars: MAX_PROMPT_CHARS,
    maxReferenceBytes: MAX_REFERENCE_BYTES,
    maxInputJsonBytes: MAX_INPUT_JSON_BYTES,
    allowedAppOrigins: EON_DIRECT_ALLOWED_APP_ORIGINS
  });
}
