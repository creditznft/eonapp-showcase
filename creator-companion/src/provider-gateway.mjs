/** W626C–W626G + Institutional AI v2 — companion-owned provider execution gateway. */
import fs from 'node:fs';
import path from 'node:path';
import { EON_DIRECT_PROVIDERS, buildReviewedModelRegistry, getDirectProvider, resolveReviewedModel } from '../../assets/js/direct-byok/provider-registry.js';
import { buildFalCancelRequest, buildFalResultRequest, buildFalStatusRequest, buildFalSubmitRequest, parseFalResult, parseFalStatus, parseFalSubmit } from '../../assets/js/direct-byok/provider-adapters/fal.js';
import { buildReplicateCancelRequest, buildReplicateStatusRequest, buildReplicateSubmitRequest, parseReplicatePrediction, parseReplicateResult } from '../../assets/js/direct-byok/provider-adapters/replicate.js';
import { buildElevenLabsMusicComposeRequest } from '../../assets/js/direct-byok/provider-adapters/elevenlabs-music.js';
import { classifyDirectProviderFailure } from '../../assets/js/direct-byok/budget-safety.js';
import { assertDirectProviderMediaEndpoint } from '../../assets/js/direct-byok/direct-job-contract.js';

const MAX_PROVIDER_JSON_BYTES = 2 * 1024 * 1024;
const MAX_BINARY_OUTPUT_BYTES = 160 * 1024 * 1024;
const MAX_TOTAL_BINARY_OUTPUT_BYTES = 320 * 1024 * 1024;
const MAX_BINARY_OUTPUTS = 3;
const BINARY_OUTPUT_TTL_MS = 15 * 60 * 1000;
const JOB_TTL_MS = 2 * 60 * 60 * 1000;
const MAX_JOBS = 64;
const MAX_ACTIVE_JOBS_PER_OWNER = 3;
const SUBMISSION_WINDOW_MS = 60 * 1000;
const MAX_SUBMISSIONS_PER_OWNER_WINDOW = 6;
const PROVIDER_CREDENTIAL_RE = /^[^\r\n]{8,512}$/;
const OWNER_ID_RE = /^session:[0-9a-f-]{36}$/i;

function requireOwnerId(ownerId = '') {
  const value = String(ownerId || '');
  if (!OWNER_ID_RE.test(value)) throw new Error('companion session ownership required');
  return value;
}
function requireOwnedRow(row, ownerId) {
  const owner = requireOwnerId(ownerId);
  if (!row || row.ownerId !== owner) throw new Error('companion job not found');
  return row;
}
function redactedExecutionJob(job = {}) {
  return Object.freeze({
    jobId: String(job.jobId || ''),
    providerId: String(job.providerId || ''),
    mediaKind: String(job.mediaKind || ''),
    modelId: String(job.modelId || ''),
    sourceSurface: String(job.sourceSurface || '').slice(0, 48),
    retryPolicy: 'manual-only'
  });
}

function readRegistry(rootDirectory) {
  const file = path.join(rootDirectory, 'config', 'w626-reviewed-provider-models.json');
  const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
  return buildReviewedModelRegistry(parsed.models || []);
}
async function readResponseBytesAtMost(response, maxBytes, label = 'provider response') {
  const declared = Number(response.headers?.get?.('content-length') || 0);
  if (Number.isFinite(declared) && declared > maxBytes) throw new Error(`${label} exceeds companion limit`);
  const reader = response.body?.getReader?.();
  if (!reader) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) throw new Error(`${label} exceeds companion limit`);
    return buffer;
  }
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      total += chunk.length;
      if (total > maxBytes) { try { await reader.cancel('eonapp-size-limit'); } catch {} throw new Error(`${label} exceeds companion limit`); }
      chunks.push(chunk);
    }
  } finally { try { reader.releaseLock?.(); } catch {} }
  return Buffer.concat(chunks, total);
}

async function fetchJson(request, fetchImpl) {
  const response = await fetchImpl(request.url, { method: request.method, headers: request.headers, body: request.body, redirect: 'manual', cache: 'no-store' });
  if (response.status >= 300 && response.status < 400) throw new Error('provider redirect rejected');
  const bytes = await readResponseBytesAtMost(response, MAX_PROVIDER_JSON_BYTES, 'provider JSON response');
  let body = {};
  try { body = bytes.length ? JSON.parse(bytes.toString('utf8')) : {}; } catch { body = {}; }
  if (!response.ok) { const error = new Error(body?.detail || body?.error || `provider request failed (${response.status})`); error.status = response.status; error.providerBody = body; throw error; }
  return body;
}
function mediaPrefix(mediaKind = 'music') {
  if (mediaKind === 'image') return 'image/';
  if (mediaKind === 'video') return 'video/';
  if (mediaKind === 'music') return 'audio/';
  throw new Error('provider media kind rejected');
}

export function buildProviderMediaFetchRequest(providerId = '', url = '', credential = '', mediaKind = '') {
  const provider = getDirectProvider(providerId);
  if (!provider) throw new Error('provider-not-allowlisted');
  const verdict = assertDirectProviderMediaEndpoint(url, provider);
  if (!verdict.ok) throw new Error(`provider media endpoint rejected: ${verdict.reason}`);
  const parsed = new URL(String(url));
  const isMediaHost = provider.mediaHostnameSuffixes.some((suffix) => parsed.hostname === suffix || parsed.hostname.endsWith(`.${suffix}`));
  if (!isMediaHost) throw new Error('provider output must use reviewed media host');
  if (providerId === 'fal' && parsed.hostname === 'storage.googleapis.com' && !parsed.pathname.startsWith('/falserverless/')) throw new Error('fal storage output path rejected');
  const headers = { Accept: `${mediaPrefix(mediaKind)}*` };
  // This Companion uses Replicate's raw HTTP prediction API rather than the
  // client-library FileOutput abstraction. Replicate's HTTP contract requires
  // bearer authentication when downloading file URLs from prediction output.
  // The credential is therefore sent only to the already-reviewed
  // replicate.delivery media hostname, never to arbitrary output URLs.
  if (providerId === 'replicate') {
    const key = String(credential || '').trim();
    if (!key || /[\r\n]/.test(key)) throw new Error('Replicate credential unavailable for reviewed media download');
    headers.Authorization = `Bearer ${key}`;
  }
  return Object.freeze({ method: 'GET', url: parsed.toString(), headers: Object.freeze(headers), redirect: 'manual' });
}

async function fetchBinary(request, fetchImpl, { expectedMediaKind = 'music' } = {}) {
  const response = await fetchImpl(request.url, { method: request.method, headers: request.headers, body: request.body, redirect: 'manual', cache: 'no-store' });
  if (response.status >= 300 && response.status < 400) throw new Error('provider redirect rejected');
  if (!response.ok) {
    const detail = String(await response.text().catch(() => '')).slice(0, 600);
    const error = new Error(detail || `provider request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  const contentType = String(response.headers?.get?.('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!contentType.startsWith(mediaPrefix(expectedMediaKind))) throw new Error('provider returned unexpected binary content type');
  const buffer = await readResponseBytesAtMost(response, MAX_BINARY_OUTPUT_BYTES, 'provider binary output');
  if (!buffer.length) throw new Error('provider output size rejected');
  return { buffer, contentType, byteLength: buffer.length };
}

export class DirectProviderGateway {
  constructor({ rootDirectory, credentialStore, fetchImpl = globalThis.fetch, now = () => Date.now() } = {}) {
    this.rootDirectory = rootDirectory;
    this.store = credentialStore;
    this.fetch = fetchImpl;
    this.now = now;
    this.registry = readRegistry(rootDirectory);
    this.jobs = new Map();
    this.outputs = new Map();
    this.submissionWindows = new Map();
  }
  sweepJobs() {
    const now = Number(this.now());
    for (const [jobId, row] of this.jobs) {
      if (Number(row.expiresAt || 0) <= now) {
        this.jobs.delete(jobId);
        this.outputs.delete(jobId);
      }
    }
    while (this.jobs.size > MAX_JOBS) {
      const oldest = [...this.jobs.entries()].sort((a, b) => Number(a[1].createdAt || 0) - Number(b[1].createdAt || 0))[0];
      if (!oldest) break;
      this.jobs.delete(oldest[0]);
      this.outputs.delete(oldest[0]);
    }
  }
  assertOwnerSubmissionBudget(ownerId) {
    const owner = requireOwnerId(ownerId);
    const now = Number(this.now());
    const active = [...this.jobs.values()].filter((row) => row.ownerId === owner && !row.completedResult && Number(row.expiresAt || 0) > now).length;
    if (active >= MAX_ACTIVE_JOBS_PER_OWNER) throw new Error('companion active job limit reached');
    const recent = (this.submissionWindows.get(owner) || []).filter((at) => Number(at) > now - SUBMISSION_WINDOW_MS);
    if (recent.length >= MAX_SUBMISSIONS_PER_OWNER_WINDOW) { this.submissionWindows.set(owner, recent); throw new Error('companion submission rate limited'); }
    recent.push(now);
    this.submissionWindows.set(owner, recent);
    return Object.freeze({ activeBeforeSubmit: active, recentSubmissions: recent.length });
  }
  sweepOutputs() {
    this.sweepJobs();
    const now = Number(this.now());
    for (const [jobId, row] of this.outputs) if (row.expiresAt <= now) this.outputs.delete(jobId);
    while (this.outputs.size > MAX_BINARY_OUTPUTS || [...this.outputs.values()].reduce((sum, row) => sum + row.byteLength, 0) > MAX_TOTAL_BINARY_OUTPUT_BYTES) {
      const oldest = [...this.outputs.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
      if (!oldest) break;
      this.outputs.delete(oldest[0]);
    }
  }
  publicProviders() {
    this.sweepOutputs();
    return {
      schema: 'eon.creator-companion.providers.w626d.v2',
      providers: EON_DIRECT_PROVIDERS.map((row) => ({ id: row.id, label: row.label, capabilities: row.capabilities, supportsCancel: row.supportsCancel, credentialConfigured: this.hasCredential(row.id) })),
      models: this.registry.models.map((row) => ({ id: row.id, providerId: row.providerId, mediaKind: row.mediaKind, inputModes: row.inputModes, enabled: row.enabled, costEstimate: row.costEstimate }))
    };
  }
  hasCredential(providerId) {
    if (!getDirectProvider(providerId)) return false;
    try { return Boolean(this.store.get(`provider_${providerId}`)); } catch { return false; }
  }
  setCredential(providerId, credential) {
    const provider = getDirectProvider(providerId);
    const value = String(credential || '').trim();
    if (!provider) throw new Error('provider-not-allowlisted');
    if (!PROVIDER_CREDENTIAL_RE.test(value)) throw new Error('provider-credential-rejected');
    this.store.set(`provider_${provider.id}`, value);
    return { ok: true, providerId: provider.id, configured: true, credentialEchoed: false };
  }
  deleteCredential(providerId) {
    const provider = getDirectProvider(providerId);
    if (!provider) throw new Error('provider-not-allowlisted');
    this.store.delete(`provider_${provider.id}`);
    return { ok: true, providerId: provider.id, configured: false, credentialEchoed: false };
  }
  credential(providerId) {
    const value = this.store.get(`provider_${providerId}`);
    if (!value) throw new Error(`${providerId} credential is not configured in OS secure storage`);
    return value;
  }
  storeBinaryOutput(jobId, output) {
    const createdAt = Number(this.now());
    this.outputs.set(jobId, { ...output, createdAt, expiresAt: createdAt + BINARY_OUTPUT_TTL_MS });
    this.sweepOutputs();
    if (!this.outputs.has(jobId)) throw new Error('provider output evicted by companion memory policy');
    return { outputAvailable: true, contentType: output.contentType, byteLength: output.byteLength, expiresAt: new Date(createdAt + BINARY_OUTPUT_TTL_MS).toISOString() };
  }
  async submit(job, { ownerId = '' } = {}) {
    const owner = requireOwnerId(ownerId);
    this.sweepJobs();
    if (this.jobs.has(job.jobId) || this.outputs.has(job.jobId)) throw new Error('companion job id already exists');
    const model = resolveReviewedModel(this.registry, job.providerId, job.modelId, job.mediaKind);
    if (!model) throw new Error('reviewed enabled provider model required');
    const credential = this.credential(job.providerId);
    this.assertOwnerSubmissionBudget(owner);
    const executionJob = redactedExecutionJob(job);
    const createdAt = Number(this.now());
    const baseRow = { ownerId: owner, job: executionJob, model, providerRequestId: '', getUrl: '', statusUrl: '', responseUrl: '', cancelUrl: '', inFlight: true, completedResult: null, createdAt, expiresAt: createdAt + JOB_TTL_MS };
    this.jobs.set(job.jobId, baseRow);
    try {
      if (job.providerId === 'fal') {
        const payload = await fetchJson(buildFalSubmitRequest(job, model, credential), this.fetch);
        const parsed = parseFalSubmit(payload);
        this.jobs.set(job.jobId, { ...baseRow, providerRequestId: parsed.requestId, statusUrl: parsed.statusUrl, responseUrl: parsed.responseUrl, cancelUrl: parsed.cancelUrl, inFlight: false });
        return parsed;
      }
      if (job.providerId === 'replicate') {
        const payload = await fetchJson(buildReplicateSubmitRequest(job, model, credential), this.fetch);
        const parsed = parseReplicatePrediction(payload);
        this.jobs.set(job.jobId, { ...baseRow, providerRequestId: parsed.requestId, getUrl: parsed.getUrl, cancelUrl: parsed.cancelUrl, inFlight: false });
        return parsed;
      }
      if (job.providerId === 'elevenlabs') {
        const output = await fetchBinary(buildElevenLabsMusicComposeRequest(job, model, credential), this.fetch, { expectedMediaKind: 'music' });
        const result = this.storeBinaryOutput(job.jobId, { ...output, ownerId: owner });
        const completed = { state: 'completed', progress: 100, authoritativeProgress: true, code: 'provider-completed', message: 'Hosted music completed in the paired Creator Companion.', result };
        this.jobs.set(job.jobId, { ...baseRow, inFlight: false, completedResult: completed });
        return completed;
      }
      throw new Error('provider-not-implemented');
    } catch (error) {
      const failed = { state: 'failed', ...classifyDirectProviderFailure(error) };
      const row = this.jobs.get(job.jobId);
      if (row) this.jobs.set(job.jobId, { ...row, inFlight: false, completedResult: failed });
      return failed;
    }
  }
  async read(jobId, { ownerId = '' } = {}) {
    this.sweepOutputs();
    const row = requireOwnedRow(this.jobs.get(jobId), ownerId);
    if (row.completedResult) return row.completedResult;
    if (row.inFlight && row.job.providerId === 'elevenlabs') return { state: 'running', progress: null, authoritativeProgress: false, code: 'provider-one-shot-running', message: 'Hosted music request is still running. The provider exposes no reviewed cancel operation for this one-shot rail.' };
    const credential = this.credential(row.job.providerId);
    try {
      if (row.job.providerId === 'fal') {
        const statusPayload = await fetchJson(buildFalStatusRequest(row.job, row.model, credential, row.providerRequestId, row.statusUrl), this.fetch);
        const status = parseFalStatus(statusPayload);
        if (status.state !== 'completed') return status;
        const resultPayload = await fetchJson(buildFalResultRequest(row.job, row.model, credential, row.providerRequestId, row.responseUrl), this.fetch);
        const parsed = parseFalResult(resultPayload, row.job.mediaKind);
        const media = parsed.outputs[0];
        const output = await fetchBinary(buildProviderMediaFetchRequest('fal', media.url, credential, row.job.mediaKind), this.fetch, { expectedMediaKind: row.job.mediaKind });
        const stored = this.storeBinaryOutput(jobId, { ...output, ownerId: row.ownerId });
        const completed = { ...status, code: 'provider-completed', message: `Hosted ${row.job.mediaKind} completed in the paired Creator Companion.`, result: { ...stored, providerMetadata: parsed.providerMetadata } };
        this.jobs.set(jobId, { ...row, completedResult: completed, inFlight: false });
        return completed;
      }
      const payload = await fetchJson(buildReplicateStatusRequest(row.job, row.model, credential, row.providerRequestId, row.getUrl), this.fetch);
      const status = parseReplicatePrediction(payload);
      if (status.state !== 'completed') return status;
      const parsed = parseReplicateResult(payload, row.job.mediaKind);
      const media = parsed.outputs[0];
      const output = await fetchBinary(buildProviderMediaFetchRequest('replicate', media.url, credential, row.job.mediaKind), this.fetch, { expectedMediaKind: row.job.mediaKind });
      const stored = this.storeBinaryOutput(jobId, { ...output, ownerId: row.ownerId });
      const completed = { ...status, code: 'provider-completed', message: `Hosted ${row.job.mediaKind} completed in the paired Creator Companion.`, result: { ...stored, providerMetadata: parsed.providerMetadata } };
      this.jobs.set(jobId, { ...row, completedResult: completed, inFlight: false });
      return completed;
    } catch (error) { return { state: 'failed', ...classifyDirectProviderFailure(error) }; }
  }
  async cancel(jobId, { ownerId = '' } = {}) {
    this.sweepJobs();
    const row = requireOwnedRow(this.jobs.get(jobId), ownerId);
    const provider = getDirectProvider(row.job.providerId);
    if (!provider?.supportsCancel) {
      return { state: row.completedResult?.state === 'completed' ? 'completed' : 'running', code: 'provider-cancel-not-supported', message: 'This reviewed provider rail does not expose cancellation. No automatic retry will occur.' };
    }
    const credential = this.credential(row.job.providerId);
    try {
      if (row.job.providerId === 'fal') await fetchJson(buildFalCancelRequest(row.job, row.model, credential, row.providerRequestId, row.cancelUrl), this.fetch);
      else await fetchJson(buildReplicateCancelRequest(row.job, row.model, credential, row.providerRequestId, row.cancelUrl), this.fetch);
      const cancelled = { state: 'cancelled', progress: null, authoritativeProgress: false, code: 'cancellation-requested', message: 'The provider acknowledged cancellation. No automatic retry will occur.' };
      this.jobs.set(jobId, { ...row, inFlight: false, completedResult: cancelled });
      return cancelled;
    } catch (error) { return { state: 'failed', ...classifyDirectProviderFailure(error) }; }
  }
  output(jobId, { ownerId = '' } = {}) {
    this.sweepOutputs();
    const row = this.outputs.get(String(jobId || ''));
    if (!row || row.ownerId !== requireOwnerId(ownerId)) throw new Error('companion output unavailable or expired');
    return { buffer: row.buffer, contentType: row.contentType, byteLength: row.byteLength, expiresAt: row.expiresAt };
  }
  truth() {
    return Object.freeze({
      binaryOutputMemoryOnly: true,
      binaryOutputTtlMs: BINARY_OUTPUT_TTL_MS,
      maxProviderJsonBytes: MAX_PROVIDER_JSON_BYTES,
      providerResponsesStreamBounded: true,
      maxBinaryOutputBytes: MAX_BINARY_OUTPUT_BYTES,
      maxBinaryOutputs: MAX_BINARY_OUTPUTS,
      jobTtlMs: JOB_TTL_MS,
      maxJobs: MAX_JOBS,
      maxActiveJobsPerSession: MAX_ACTIVE_JOBS_PER_OWNER,
      submissionWindowMs: SUBMISSION_WINDOW_MS,
      maxSubmissionsPerSessionWindow: MAX_SUBMISSIONS_PER_OWNER_WINDOW,
      providerCancelBecomesTerminalState: true,
      rawPromptStoredInJobMap: false,
      providerCredentialEchoed: false,
      jobAndOutputOwnershipSessionBound: true,
      hostedMusicRealProviderProofComplete: false,
      hostedImageVideoOutputInCompanionMemory: true,
      externalProviderOutputUrlReturnedToBrowser: false,
      hostedImageVideoRealProviderProofComplete: false
    });
  }
}
