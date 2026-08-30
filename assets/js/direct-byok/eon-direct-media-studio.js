/** Institutional AI v2 — reviewed hosted Image/Video Direct BYOK studio for canonical Create. */
import {
  cancelDirectJob,
  deleteDirectProviderCredential,
  listDirectProviders,
  readDirectJob,
  readDirectJobOutput,
  setDirectProviderCredential,
  submitDirectJob
} from './companion-client.js';
import { buildDirectJobRequest, toDirectJobPublicReceipt } from './direct-job-contract.js';
import { recordDirectHistoryReceipt } from './direct-history.js';
import { shareEonLocalMedia } from '../share/eon-viral-share-kit.js';
import { writeEonOutputShareHandoff } from '../share/eon-output-share-handoff.js';
import { recordEonCoreOutcome } from '../contracts/outcomes/eon-core-outcome-authority.js';
import { buildCreatorVariationPrompt } from '../creator/eon-creator-iteration-planner.js';
import { canRecordHostedMediaOutcome, sha256MediaBlob, verifyHostedMediaReopen } from './eon-direct-media-proof.js';

const freeze = Object.freeze;
const MAX_POLL_MS = 12 * 60 * 1000;
const POLL_MS = 2500;
const ALLOWED_KINDS = new Set(['image', 'video']);
const stateByKind = new Map();

const pick = (value, allowed, fallback) => allowed.includes(String(value)) ? String(value) : fallback;
export function buildHostedMediaInput({ providerId = '', modelId = '', mediaKind = '', aspect = '', format = '', duration = '', resolution = '', bitrateMode = '', generateAudio = true } = {}) {
  if (mediaKind === 'image' && providerId === 'fal' && modelId === 'fal-image-proof') { return freeze({
    image_size: pick(aspect, ['square_hd', 'landscape_16_9', 'portrait_16_9', 'landscape_4_3', 'portrait_4_3'], 'square_hd'),
    output_format: pick(format, ['jpeg', 'png'], 'jpeg'),
    num_images: 1,
    num_inference_steps: 4,
    enable_safety_checker: true,
    acceleration: 'none'
  }); }
  if (mediaKind === 'image' && providerId === 'replicate' && modelId === 'replicate-image-proof') { return freeze({
    aspect_ratio: pick(aspect, ['1:1', '16:9', '9:16', '4:3', '3:4'], '1:1'),
    output_format: pick(format, ['webp', 'png'], 'webp'),
    num_outputs: 1,
    num_inference_steps: 4,
    disable_safety_checker: false,
    go_fast: true,
    megapixels: '1'
  }); }
  if (mediaKind === 'video' && providerId === 'fal' && modelId === 'fal-video-proof') { return freeze({
    resolution: pick(resolution, ['480p', '720p', '1080p', '4k'], '720p'),
    duration: pick(duration, ['auto', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15'], '5'),
    aspect_ratio: pick(aspect, ['auto', '16:9', '9:16', '1:1', '21:9', '4:3', '3:4'], '16:9'),
    generate_audio: generateAudio !== false,
    bitrate_mode: pick(bitrateMode, ['standard', 'high'], 'standard')
  }); }
  if (mediaKind === 'video' && providerId === 'replicate' && modelId === 'replicate-video-proof') { return freeze({
    resolution: pick(resolution, ['480p', '720p', '1080p', '4k'], '720p'),
    duration: Number(pick(duration, ['-1', '5', '7', '10', '15'], '5')),
    aspect_ratio: pick(aspect, ['adaptive', '16:9', '9:16', '1:1'], '16:9'),
    generate_audio: generateAudio !== false
  }); }
  return freeze({});
}

function stateFor(mediaKind) {
  if (!stateByKind.has(mediaKind)) { stateByKind.set(mediaKind, {
    models: [], providers: [], selectedModelId: '', busy: false, jobId: '', cancelled: false,
    jobState: 'idle', progress: null, authoritativeProgress: false,
    artifact: null, prompt: '', lastSubmittedPrompt: '', variationIndex: 0,
    message: 'Pair the Creator Companion, then load reviewed models. No provider request starts automatically.'
  }); }
  return stateByKind.get(mediaKind);
}
function esc(value = '') { return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function revokeArtifact(row) {
  for (const key of ['url', 'reopenedUrl']) { try { if (row?.[key]) URL.revokeObjectURL(row[key]); } catch {} }
}
async function setArtifact(mediaKind, blob, mimeType, jobId, { providerId = '', modelId = '' } = {}) {
  const state = stateFor(mediaKind);
  revokeArtifact(state.artifact);
  const ext = mediaKind === 'image' ? (mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg') : (mimeType.includes('webm') ? 'webm' : 'mp4');
  const sha256 = await sha256MediaBlob(blob);
  state.artifact = {
    blob, mimeType, jobId, providerId, modelId, sha256, byteLength: Number(blob?.size || 0), createdAt: Date.now(),
    fileName: `eon-hosted-${mediaKind}-${Date.now()}.${ext}`, url: URL.createObjectURL(blob), reopenedUrl: '',
    saved: false, reopened: false, digestMatched: false, playbackCompleted: false, outcomeRecorded: false
  };
}
function fileFromArtifact(artifact) {
  if (!artifact?.blob) return null;
  try { return new File([artifact.blob], artifact.fileName, { type: artifact.mimeType }); }
  catch { const blob = artifact.blob; blob.name = artifact.fileName; return blob; }
}
function downloadArtifact(artifact) {
  if (!artifact?.blob || typeof document === 'undefined') return false;
  const url = URL.createObjectURL(artifact.blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = artifact.fileName; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0); return true;
}

export function normalizeDirectMediaProgress(response = {}, fallbackState = 'unknown') {
  const state = String(response?.state || fallbackState || 'unknown').slice(0, 32);
  const raw = response?.progress;
  const numeric = raw === null || raw === undefined || raw === '' ? NaN : Number(raw);
  const progress = Number.isFinite(numeric) ? Math.min(100, Math.max(0, Math.round(numeric))) : null;
  return freeze({ state, progress, authoritativeProgress: response?.authoritativeProgress === true && progress !== null });
}
export function isDirectMediaCancellationAccepted(result = {}) {
  return result?.code === 'cancellation-requested' || result?.state === 'cancelled';
}
function applyJobProgress(state, response = {}) {
  const normalized = normalizeDirectMediaProgress(response, state.jobState || 'unknown');
  state.jobState = normalized.state;
  state.progress = normalized.progress;
  state.authoritativeProgress = normalized.authoritativeProgress;
}
function progressLabel(state) {
  return state.progress === null ? `${state.jobState || 'working'} · provider progress not reported` : `${state.jobState || 'working'} · ${state.progress}%${state.authoritativeProgress ? '' : ' (reported state)'}`;
}
function renderJobProgress(state) {
  const hidden = !state.busy && state.jobState === 'idle';
  return `<div class="eon-direct-media-progress" data-direct-media-progress ${hidden ? 'hidden' : ''} aria-live="polite"><progress max="100"${state.progress === null ? '' : ` value="${state.progress}"`}></progress><span>${esc(progressLabel(state))}</span></div>`;
}
function syncJobProgress(host, state) {
  const row = host?.querySelector?.('[data-direct-media-progress]');
  if (!row) return;
  row.hidden = !state.busy && state.jobState === 'idle';
  const progress = row.querySelector?.('progress');
  if (progress) { if (state.progress === null) { progress.removeAttribute('value'); } else { progress.value = state.progress; } }
  const label = row.querySelector?.('span'); if (label) label.textContent = progressLabel(state);
}
function maybeRecordHostedOutcome(state, mediaKind) {
  const artifact = state.artifact;
  if (!canRecordHostedMediaOutcome({ mediaKind, artifact }) || artifact.outcomeRecorded === true) return false;
  const providerId = String(artifact.providerId || '').trim();
  if (!['fal', 'replicate'].includes(providerId)) return false;
  const result = recordEonCoreOutcome({
    kind: mediaKind === 'image' ? 'creator-image-verified' : 'creator-video-verified',
    source: `eon-direct-byok-${providerId}`, receiptId: `${mediaKind}:${artifact.jobId}:${artifact.sha256}`, route: currentCreatorSurface(mediaKind).route, verified: true
  });
  artifact.outcomeRecorded = result.ok === true;
  return artifact.outcomeRecorded;
}
function hostedProofSummary(mediaKind, artifact) {
  if (!artifact) return '';
  const rows = [
    ['Received in browser', Boolean(artifact.blob)],
    ['Save started', artifact.saved === true],
    ['Saved file reopened', artifact.reopened === true],
    ['Reopened bytes match', artifact.digestMatched === true]
  ];
  if (mediaKind === 'video') rows.push(['Reopened video played to end', artifact.playbackCompleted === true]);
  const reopenedPreview = artifact.reopenedUrl
    ? (mediaKind === 'video'
      ? `<video src="${esc(artifact.reopenedUrl)}" controls playsinline preload="metadata" data-direct-media-reopened-preview style="max-width:100%;border-radius:16px"></video>`
      : `<img src="${esc(artifact.reopenedUrl)}" alt="Reopened hosted image proof" style="max-width:100%;border-radius:16px" />`)
    : '';
  return `<div class="eon-direct-media-proof"><ol class="local-ai-proof-checklist">${rows.map(([label, pass]) => `<li class="${pass ? 'is-pass' : ''}"><span aria-hidden="true">${pass ? '✓' : '○'}</span><strong>${esc(label)}</strong></li>`).join('')}</ol>${reopenedPreview}</div>`;
}

function currentCreatorSurface(mediaKind = '') {
  const path = String(globalThis.location?.pathname || '').trim();
  const route = ['/create', '/eoncity'].includes(path) ? path : '/create';
  return freeze({ route, sourceSurface: route === '/eoncity' ? `eoncity-${mediaKind}` : `create-${mediaKind}` });
}

function setDirectMediaBusyControls(host, busy, { supportsCancel = true, artifactAvailable = false } = {}) {
  const selectors = [
    '[data-direct-media-load]', '[data-direct-media-model]', '[data-direct-media-key-save]', '[data-direct-media-key-clear]',
    '[data-direct-media-generate]', '[data-direct-media-save]', '[data-direct-media-reopen]', '[data-direct-media-share]',
    '[data-direct-media-variation]', '[data-direct-media-remix]'
  ];
  for (const selector of selectors) {
    const node = host?.querySelector?.(selector); if (!node) continue;
    if (busy) node.disabled = true;
    else if (['[data-direct-media-save]', '[data-direct-media-share]', '[data-direct-media-variation]', '[data-direct-media-remix]'].includes(selector)) node.disabled = !artifactAvailable;
  }
  const cancel = host?.querySelector?.('[data-direct-media-cancel]');
  if (cancel) cancel.disabled = !busy || supportsCancel !== true;
}

function configuredProvider(state, providerId) { return state.providers.find((row) => row.id === providerId) || null; }
function selectedModel(state) { return state.models.find((row) => row.id === state.selectedModelId) || state.models[0] || null; }

function renderQualityControls(mediaKind, model = null) {
  if (!model) return '';
  if (mediaKind === 'image' && model.providerId === 'fal') return `<div class="eon-create-grid-2"><label>Frame<select data-direct-media-aspect><option value="square_hd">Square HD</option><option value="landscape_16_9">Landscape 16:9</option><option value="portrait_16_9">Portrait 9:16</option><option value="landscape_4_3">Landscape 4:3</option><option value="portrait_4_3">Portrait 3:4</option></select></label><label>Format<select data-direct-media-format><option value="jpeg">JPEG</option><option value="png">PNG</option></select></label></div>`;
  if (mediaKind === 'image') return `<div class="eon-create-grid-2"><label>Frame<select data-direct-media-aspect><option value="1:1">Square 1:1</option><option value="16:9">Landscape 16:9</option><option value="9:16">Portrait 9:16</option><option value="4:3">Landscape 4:3</option><option value="3:4">Portrait 3:4</option></select></label><label>Format<select data-direct-media-format><option value="webp">WebP</option><option value="png">PNG</option></select></label></div>`;
  if (model.providerId === 'fal') return `<div class="eon-create-grid-2"><label>Frame<select data-direct-media-aspect><option value="16:9">Landscape 16:9</option><option value="9:16">Portrait 9:16</option><option value="1:1">Square 1:1</option><option value="21:9">Cinematic 21:9</option><option value="auto">Auto</option></select></label><label>Resolution<select data-direct-media-resolution><option value="720p">720p · balanced</option><option value="1080p">1080p · high</option><option value="4k">4K · highest / expensive</option><option value="480p">480p · faster</option></select></label><label>Duration<select data-direct-media-duration><option value="5">5 sec</option><option value="8">8 sec</option><option value="10">10 sec</option><option value="15">15 sec</option><option value="auto">Auto</option></select></label><label>Encoding<select data-direct-media-bitrate><option value="standard">Standard bitrate · balanced</option><option value="high">High bitrate · premium quality</option></select></label><label class="eon-create-check"><input type="checkbox" data-direct-media-audio checked /> Generate synchronized audio</label></div>`;
  return `<div class="eon-create-grid-2"><label>Frame<select data-direct-media-aspect><option value="16:9">Landscape 16:9</option><option value="9:16">Portrait 9:16</option><option value="1:1">Square 1:1</option><option value="adaptive">Adaptive</option></select></label><label>Resolution<select data-direct-media-resolution><option value="720p">720p · balanced</option><option value="1080p">1080p · premium / higher cost</option><option value="4k">4K · maximum / expensive</option><option value="480p">480p · faster</option></select></label><label>Duration<select data-direct-media-duration><option value="5">5 sec</option><option value="7">7 sec</option><option value="10">10 sec</option><option value="15">15 sec</option><option value="-1">Auto</option></select></label><label class="eon-create-check"><input type="checkbox" data-direct-media-audio checked /> Generate synchronized audio</label></div>`;
}

function preview(mediaKind, artifact) {
  if (!artifact?.url) return '<p class="eon-create-guide-status">No hosted artifact is held in browser memory yet.</p>';
  return mediaKind === 'image'
    ? `<img src="${esc(artifact.url)}" alt="Hosted BYOK image preview" style="max-width:100%;border-radius:16px" />`
    : `<video src="${esc(artifact.url)}" controls playsinline preload="metadata" style="max-width:100%;border-radius:16px"></video>`;
}

export function renderDirectMediaStudio({ mediaKind = '' } = {}) {
  if (!ALLOWED_KINDS.has(mediaKind)) return '';
  const state = stateFor(mediaKind);
  const model = selectedModel(state);
  const provider = model ? configuredProvider(state, model.providerId) : null;
  const label = mediaKind === 'image' ? 'Image' : 'Video';
  const options = state.models.length
    ? state.models.map((row) => `<option value="${esc(row.id)}" ${row.id === (model?.id || '') ? 'selected' : ''}>${esc(row.providerId)} · ${esc(row.id)}</option>`).join('')
    : '<option value="">Load paired reviewed models first</option>';
  return `<section class="eon-direct-media-studio" data-eon-direct-media="${mediaKind}">
    <div class="eon-create-section-head"><div><p class="eon-create-eyebrow">Hosted ${label} · Direct BYOK</p><h3>Generate through your own paired provider account</h3><p>Reviewed prompt-first models only. EONAPP never receives your provider key or stores generated media in Cloudflare. Every request is one explicit provider job.</p></div></div>
    <div class="eon-create-actions"><button type="button" class="eon-create-secondary" data-direct-media-load ${state.busy ? 'disabled' : ''}>Load paired reviewed models</button></div>
    <label>Reviewed provider model<select data-direct-media-model ${state.busy ? 'disabled' : ''}>${options}</select></label>
    <p class="eon-create-guide-status">${provider?.credentialConfigured ? 'A credential is configured in the Companion OS vault for this provider.' : 'This provider needs a key moved into the Companion OS vault.'}</p>
    <div class="eon-create-grid-2"><label>Provider API key<input type="password" autocomplete="off" data-direct-media-key placeholder="Paste once, then move to OS vault" /></label><div class="eon-create-actions"><button type="button" class="eon-create-secondary" data-direct-media-key-save ${model && !state.busy ? '' : 'disabled'}>Move key to OS vault</button><button type="button" class="eon-create-secondary" data-direct-media-key-clear ${model && !state.busy ? '' : 'disabled'}>Remove key</button></div></div>
    <label>${label} prompt<textarea rows="4" maxlength="12000" data-direct-media-prompt placeholder="Describe the ${mediaKind} you want to create">${esc(state.prompt || '')}</textarea></label>
    ${renderQualityControls(mediaKind, model)}
    <label class="eon-create-check"><input type="checkbox" data-direct-media-budget /> I reviewed my provider plan/credits and approve exactly one ${label.toLowerCase()} job. EON cannot pre-confirm provider cost.</label>
    <div class="eon-create-actions"><button type="button" class="eon-create-primary" data-direct-media-generate ${state.busy ? 'disabled' : ''}>${state.busy ? 'Provider job running…' : `Generate hosted ${label}`}</button><button type="button" class="eon-create-secondary" data-direct-media-cancel ${state.jobId && state.busy && provider?.supportsCancel !== false ? '' : 'disabled'}>Cancel provider job</button></div>
    ${renderJobProgress(state)}
    <p class="eon-create-guide-status" data-direct-media-status aria-live="polite">${esc(state.message)}</p>
    <div data-direct-media-preview>${preview(mediaKind, state.artifact)}</div>
    ${hostedProofSummary(mediaKind, state.artifact)}
    <input type="file" hidden data-direct-media-reopen-file accept="${mediaKind === 'image' ? 'image/png,image/jpeg,image/webp' : 'video/mp4,video/webm'}" />
    <div class="eon-create-actions"><button type="button" class="eon-create-secondary" data-direct-media-save ${state.artifact ? '' : 'disabled'}>Save locally</button><button type="button" class="eon-create-secondary" data-direct-media-reopen ${state.artifact?.saved ? '' : 'disabled'}>Reopen saved ${label.toLowerCase()}</button><button type="button" class="eon-create-secondary" data-direct-media-share ${state.artifact ? '' : 'disabled'}>Share file</button><button type="button" class="eon-create-secondary" data-direct-media-variation ${state.artifact ? '' : 'disabled'}>Prepare variation</button><button type="button" class="eon-create-secondary" data-direct-media-remix ${state.artifact ? '' : 'disabled'}>Prepare Remix</button></div>
    <p class="eon-create-guide-status">This provider rail stays marked unverified until a real authenticated output check succeeds in this browser. No reference-image upload, automatic retry, background generation or provider fallback is enabled here.</p>
  </section>`;
}

export function bindDirectMediaStudio(root, { mediaKind = '', rerender = null } = {}) {
  if (!ALLOWED_KINDS.has(mediaKind)) return;
  const host = root?.querySelector?.(`[data-eon-direct-media="${mediaKind}"]`);
  if (!host) return;
  const state = stateFor(mediaKind);
  const status = (text) => { state.message = String(text || '').slice(0, 300); const node = host.querySelector('[data-direct-media-status]'); if (node) node.textContent = state.message; };
  const modelSelect = host.querySelector('[data-direct-media-model]');
  const promptInput = host.querySelector('[data-direct-media-prompt]');
  promptInput?.addEventListener('input', () => { state.prompt = String(promptInput.value || '').slice(0, 12000); });

  host.querySelector('[data-direct-media-load]')?.addEventListener('click', async () => {
    try {
      const snapshot = await listDirectProviders();
      state.providers = Array.isArray(snapshot?.providers) ? snapshot.providers : [];
      state.models = (Array.isArray(snapshot?.models) ? snapshot.models : []).filter((row) => row.enabled === true && row.mediaKind === mediaKind);
      if (!state.models.some((row) => row.id === state.selectedModelId)) state.selectedModelId = state.models[0]?.id || '';
      status(state.models.length ? `${state.models.length} reviewed ${mediaKind} model${state.models.length === 1 ? '' : 's'} loaded from the paired Companion. No provider request has started.` : `No reviewed ${mediaKind} models are enabled in this Companion build.`);
      rerender?.();
    } catch (error) { status(`Pair the Creator Companion first: ${String(error?.message || error)}`); }
  });
  modelSelect?.addEventListener('change', () => { state.selectedModelId = modelSelect.value; rerender?.(); });

  host.querySelector('[data-direct-media-key-save]')?.addEventListener('click', async () => {
    const model = selectedModel(state); const input = host.querySelector('[data-direct-media-key]'); const credential = String(input?.value || '');
    if (!model) { status('Load and choose a reviewed model first.'); return; }
    try { await setDirectProviderCredential(model.providerId, credential); if (input) input.value = ''; const snapshot = await listDirectProviders(); state.providers = snapshot.providers || []; status('Provider key moved to the Companion OS secure vault and was not echoed to this browser.'); rerender?.(); }
    catch (error) { if (input) input.value = ''; status(String(error?.message || error)); }
  });
  host.querySelector('[data-direct-media-key-clear]')?.addEventListener('click', async () => {
    const model = selectedModel(state); if (!model) return;
    try { await deleteDirectProviderCredential(model.providerId); const snapshot = await listDirectProviders(); state.providers = snapshot.providers || []; status('Provider key removed from the Companion OS secure vault.'); rerender?.(); }
    catch (error) { status(String(error?.message || error)); }
  });

  host.querySelector('[data-direct-media-cancel]')?.addEventListener('click', async () => {
    if (!state.jobId || !state.busy) return;
    try {
      const result = await cancelDirectJob(state.jobId);
      const accepted = isDirectMediaCancellationAccepted(result);
      state.cancelled = accepted;
      applyJobProgress(state, result); syncJobProgress(host, state);
      status(accepted ? 'Cancellation requested. The provider decides when the job stops.' : (result?.message || 'The provider did not confirm cancellation; EON will keep the job state honest.'));
    } catch (error) { state.cancelled = false; status(`Cancel request failed: ${String(error?.message || error)}`); }
  });

  host.querySelector('[data-direct-media-generate]')?.addEventListener('click', async () => {
    const model = selectedModel(state);
    const prompt = String(promptInput?.value || state.prompt || '').trim();
    state.prompt = prompt.slice(0, 12000);
    const budgetConfirmed = host.querySelector('[data-direct-media-budget]')?.checked === true;
    if (!model) { status('Load and choose a reviewed model first.'); return; }
    if (!prompt) { status(`Describe the ${mediaKind} first.`); return; }
    if (!budgetConfirmed) { status('Review your provider plan/credits and approve exactly one job before any paid provider request.'); return; }
    const input = buildHostedMediaInput({
      providerId: model.providerId, modelId: model.id, mediaKind,
      aspect: host.querySelector('[data-direct-media-aspect]')?.value || '',
      format: host.querySelector('[data-direct-media-format]')?.value || '',
      duration: host.querySelector('[data-direct-media-duration]')?.value || '',
      resolution: host.querySelector('[data-direct-media-resolution]')?.value || '',
      bitrateMode: host.querySelector('[data-direct-media-bitrate]')?.value || '',
      generateAudio: host.querySelector('[data-direct-media-audio]')?.checked !== false
    });
    const candidate = { providerId: model.providerId, mediaKind, modelId: model.id, prompt, input, sourceSurface: currentCreatorSurface(mediaKind).sourceSurface, safeLabel: `Direct BYOK hosted ${mediaKind}`, userBudget: { currency: 'USD', warningAmount: 0, hardStopAmount: 0 } };
    const verdict = buildDirectJobRequest(candidate, { explicitUserAction: true, explicitUserApproval: true, budgetConfirmed: true });
    if (!verdict.ok) { status(`Hosted ${mediaKind} review rejected: ${verdict.reason}.`); return; }
    state.busy = true; state.cancelled = false; state.jobId = verdict.job.jobId; state.lastSubmittedPrompt = state.prompt;
    state.jobState = 'submitting'; state.progress = null; state.authoritativeProgress = false; syncJobProgress(host, state);
    status(`Submitting one reviewed ${model.providerId} ${mediaKind} job. No automatic paid retry or provider fallback will occur.`);
    setDirectMediaBusyControls(host, true, { supportsCancel: configuredProvider(state, model.providerId)?.supportsCancel !== false, artifactAvailable: Boolean(state.artifact) });
    try {
      let response = await submitDirectJob({ ...candidate, jobId: verdict.job.jobId, explicitUserApproval: true, budgetConfirmed: true });
      applyJobProgress(state, response); syncJobProgress(host, state);
      const started = Date.now();
      while (['queued', 'running'].includes(response?.state) && Date.now() - started < MAX_POLL_MS && !state.cancelled) {
        status(response?.state === 'queued' ? 'Provider accepted the job; waiting in its queue…' : 'Provider is generating…');
        await sleep(POLL_MS);
        response = await readDirectJob(verdict.job.jobId);
        applyJobProgress(state, response); syncJobProgress(host, state);
      }
      if (state.cancelled) throw new Error('provider-cancellation-requested');
      if (Date.now() - started >= MAX_POLL_MS && ['queued', 'running'].includes(response?.state)) throw new Error('browser-wait-window-ended');
      if (response?.state !== 'completed' || response?.result?.outputAvailable !== true) throw new Error(response?.message || response?.code || `hosted-${mediaKind}-generation-failed`);
      const output = await readDirectJobOutput(verdict.job.jobId, { expectedMediaKind: mediaKind });
      await setArtifact(mediaKind, output.blob, output.mimeType, verdict.job.jobId, { providerId: model.providerId, modelId: model.id });
      state.jobState = 'completed'; state.progress = 100; state.authoritativeProgress = true; syncJobProgress(host, state);
      const receipt = toDirectJobPublicReceipt(verdict.job, { state: 'completed', progress: 100, authoritativeProgress: true, code: 'provider-completed', message: `Hosted ${mediaKind} completed through the paired Creator Companion.` });
      if (receipt) recordDirectHistoryReceipt(receipt);
      status(`Hosted ${mediaKind} received into this browser (${Math.max(1, Math.round(output.byteLength / 1024))} KB). Save, share or prepare a Remix. Real-provider launch proof is still pending.`);
    } catch (error) {
      const reason = String(error?.message || error);
      state.jobState = reason === 'provider-cancellation-requested' ? 'cancelled-or-cancellation-requested' : reason === 'browser-wait-window-ended' ? 'poll-window-ended' : 'failed';
      status(reason === 'browser-wait-window-ended' ? 'This browser stopped polling after 12 minutes. No retry was started; reopen/read the provider job only through the paired Companion.' : `Hosted ${mediaKind} did not complete: ${reason.slice(0, 180)}. No automatic paid retry was attempted.`);
    } finally { state.busy = false; setDirectMediaBusyControls(host, false, { supportsCancel: false, artifactAvailable: Boolean(state.artifact) }); rerender?.(); }
  });

  host.querySelector('[data-direct-media-save]')?.addEventListener('click', () => {
    const artifact = state.artifact; if (!artifact?.blob) { status('Generate a hosted artifact first.'); return; }
    if (!downloadArtifact(artifact)) { status('Local download is unavailable in this browser.'); return; }
    artifact.saved = true;
    artifact.reopened = false; artifact.digestMatched = false; artifact.playbackCompleted = false; artifact.outcomeRecorded = false;
    if (artifact.reopenedUrl) { try { URL.revokeObjectURL(artifact.reopenedUrl); } catch {} artifact.reopenedUrl = ''; }
    status(`Hosted ${mediaKind} save started. Reopen the saved file${mediaKind === 'video' ? ' and play the reopened copy to the end' : ''} before EON records a verified Creator outcome.`);
    rerender?.();
  });
  const reopenInput = host.querySelector('[data-direct-media-reopen-file]');
  host.querySelector('[data-direct-media-reopen]')?.addEventListener('click', () => reopenInput?.click?.());
  reopenInput?.addEventListener('change', async () => {
    const artifact = state.artifact; const file = reopenInput.files?.[0];
    if (!artifact?.saved || !file) { if (reopenInput) reopenInput.value = ''; return; }
    const result = await verifyHostedMediaReopen(file, { mediaKind, expectedSha256: artifact.sha256, expectedBytes: artifact.byteLength });
    artifact.reopened = result.ok === true;
    artifact.digestMatched = result.verifiedReopen === true;
    artifact.playbackCompleted = mediaKind === 'image' ? true : false;
    if (artifact.reopenedUrl) { try { URL.revokeObjectURL(artifact.reopenedUrl); } catch {} artifact.reopenedUrl = ''; }
    if (artifact.digestMatched) artifact.reopenedUrl = URL.createObjectURL(file);
    status(artifact.digestMatched
      ? (mediaKind === 'video' ? 'Saved video reopened with matching bytes. Play the reopened copy to the end to complete verified Creator proof.' : 'Saved image reopened with matching bytes. Verified Creator outcome recorded without prompt, key or media content.')
      : `Reopen verification failed: ${result.reason}. No verified Creator outcome was recorded.`);
    maybeRecordHostedOutcome(state, mediaKind);
    if (reopenInput) reopenInput.value = '';
    rerender?.();
  });
  host.querySelector('[data-direct-media-reopened-preview]')?.addEventListener('ended', () => {
    const artifact = state.artifact;
    if (!artifact?.digestMatched || mediaKind !== 'video') return;
    artifact.playbackCompleted = true;
    maybeRecordHostedOutcome(state, mediaKind);
    status('Reopened hosted video played to the end. Verified Creator outcome recorded with redacted proof metadata only.');
    rerender?.();
  });

  host.querySelector('[data-direct-media-share]')?.addEventListener('click', async () => {
    const artifact = state.artifact; if (!artifact?.blob) return;
    const result = await shareEonLocalMedia({ file: fileFromArtifact(artifact), title: `Made with EON ${mediaKind === 'image' ? 'Image' : 'Video'}`, text: `Hosted BYOK ${mediaKind} generated through my own paired provider connection.` }, { userGesture: true });
    status(result.ok ? 'Native share menu opened. Sharing is not referral/EONKEY proof by itself.' : 'Native file sharing is unavailable here; save the file locally instead.');
  });
  host.querySelector('[data-direct-media-variation]')?.addEventListener('click', () => {
    if (!state.artifact) return;
    const nextIndex = (Number(state.variationIndex) || 0) + 1;
    const plan = buildCreatorVariationPrompt({ mediaKind, prompt: state.lastSubmittedPrompt || state.prompt, iteration: nextIndex, maxChars: 12000 });
    if (!plan.ok) { status(`Variation could not be prepared: ${plan.reason}.`); return; }
    state.variationIndex = nextIndex;
    state.prompt = plan.prompt;
    status(`Variation ${nextIndex} prepared in this browser. Review/edit it and separately approve one new provider job; nothing was submitted or charged.`);
    rerender?.();
  });
  host.querySelector('[data-direct-media-remix]')?.addEventListener('click', () => {
    if (!state.artifact) return;
    const handoff = writeEonOutputShareHandoff({ explicitUserAction: true, origin: 'creator-draft', remixKind: mediaKind === 'image' ? 'image-concept' : 'video-storyboard', title: `EON hosted BYOK ${mediaKind}`, audience: 'creators', usefulOutcome: `A hosted BYOK ${mediaKind} was generated and reviewed in EON Create.`, firstRemixStep: `Create a new ${mediaKind} variation; the original prompt, provider key and media remain private unless explicitly shared.` });
    status(handoff.ok ? 'Public-safe Remix starter prepared. The original prompt and media were not copied into it.' : handoff.reason);
  });
}

export function getDirectMediaStudioTruth() {
  return freeze({ mediaKinds: freeze(['image', 'video']), reviewedModelsOnly: true, explicitBudgetApprovalPerJob: true, autoGenerate: false, autoPaidRetry: false, autoProviderFallback: false, referenceUploadEnabled: false, outputFromCompanionMemory: true, providerOutputUrlShownToBrowser: false, artifactProviderProvenancePinnedAtGeneration: true, cancellationRequiresProviderAcknowledgement: true, inFlightControlsLocked: true, providerProgressRenderedWhenReported: true, coreReceiptOnlyAfterExplicitSave: false, coreReceiptOnlyAfterSaveReopenDigestMatch: true, hostedVideoCoreReceiptAlsoRequiresReopenedPlaybackCompletion: true, reviewedQualityControls: true, variationPlanningLocalOnly: true, variationRequiresSeparateGenerateAction: true, promptSessionMemoryOnly: true, safetyCheckerForcedOnForImage: true, realProviderProofComplete: false });
}
