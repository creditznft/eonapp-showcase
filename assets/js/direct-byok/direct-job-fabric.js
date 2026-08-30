/** W626E — unified local/direct job fabric projection. */
import { normalizeDirectJobEvent, toDirectJobPublicReceipt } from './direct-job-contract.js';

const freeze = Object.freeze;
const MAX_JOBS = 24;

export class EonDirectJobFabric {
  constructor({ companion, recordReceipt = null, now = () => Date.now() } = {}) {
    this.companion = companion;
    this.recordReceipt = typeof recordReceipt === 'function' ? recordReceipt : null;
    this.now = now;
    this.jobs = new Map();
  }
  list() { return freeze([...this.jobs.values()].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, MAX_JOBS)); }
  upsert(job, event) {
    const normalized = normalizeDirectJobEvent(event, job);
    if (!normalized) throw new Error('Direct job event rejected');
    const row = freeze({ ...job, state: normalized.state, progress: normalized.progress, authoritativeProgress: normalized.authoritativeProgress, code: normalized.code, message: normalized.message, result: normalized.result, updatedAt: normalized.at });
    this.jobs.set(job.jobId, row);
    while (this.jobs.size > MAX_JOBS) this.jobs.delete(this.jobs.keys().next().value);
    const receipt = toDirectJobPublicReceipt(row, normalized);
    if (receipt && this.recordReceipt) this.recordReceipt(receipt);
    return row;
  }
  async submit(job) {
    if (!this.companion?.submit) throw new Error('Creator Companion submit transport unavailable');
    this.upsert(job, { state: 'queued', code: 'submit-requested', at: this.now() });
    const provider = await this.companion.submit(job);
    return this.upsert(job, { ...provider, jobId: job.jobId, state: provider.state || 'queued', at: this.now() });
  }
  async refresh(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error('Direct job not found');
    const provider = await this.companion.read(jobId);
    return this.upsert(job, { ...provider, jobId, at: this.now() });
  }
  async cancel(jobId, { explicitUserAction = false } = {}) {
    if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
    const job = this.jobs.get(jobId);
    if (!job) return freeze({ ok: false, reason: 'job-not-found' });
    const provider = await this.companion.cancel(jobId);
    return freeze({ ok: true, job: this.upsert(job, { ...provider, jobId, state: provider.state || 'cancelled', at: this.now() }) });
  }
  importLocalReceipt(receipt = {}) {
    const jobId = String(receipt.jobId || receipt.promptId || '').trim();
    if (!jobId) return null;
    const row = freeze({ rail: 'local', jobId, providerId: 'local', mediaKind: receipt.mediaKind || 'image', safeLabel: receipt.safeLabel || 'Local creator job', state: receipt.state || (receipt.realImageProofPass || receipt.realVideoProofPass ? 'completed' : 'running'), progress: receipt.progress ?? null, updatedAt: receipt.updatedAt || new Date(this.now()).toISOString(), result: null });
    this.jobs.set(jobId, row);
    return row;
  }
}

export function getUnifiedDirectJobFabricTruth() {
  return freeze({ localAndDirectShareStates: true, providerSpecificControlsConditional: true, agentTheatreReceiptsRedacted: true, directExecutionOwner: 'creator-companion', eonappServerProxy: false, browserRefreshRecovery: true, realProviderProofComplete: false });
}
