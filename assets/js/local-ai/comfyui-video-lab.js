/** W625D–W625H — proof-first Local Video Lab. */
import {
  buildLocalVideoCapabilityEvidence,
  evaluateLocalVideoCapability
} from './comfyui-video-capability.js';
import {
  COMFYUI_VIDEO_DEFAULT_ENDPOINT,
  cancelComfyUiVideoJob,
  discoverComfyUiVideoRuntime,
  fetchComfyUiVideoOutputBlob,
  generateComfyUiVideo
} from './comfyui-video-runtime.js';
import {
  COMFYUI_VIDEO_WORKFLOW_ID,
  reviewComfyUiVideoApiWorkflow
} from './comfyui-video-workflow-registry.js';
import {
  buildLocalVideoSafetyPlan,
  normalizeLocalVideoRecipe
} from './local-video-efficiency-governor.js';
import {
  buildLocalVideoProofReceipt,
  downloadLocalVideoProofReceipt,
  inspectLocalVideoBlob,
  reopenLocalVideoFile,
  saveLocalVideoBlob,
  validateLocalVideoInputFile
} from './local-video-proof.js';
import { recordEonCoreOutcome } from '../contracts/outcomes/eon-core-outcome-authority.js';
import { shareEonLocalMedia } from '../share/eon-viral-share-kit.js';
import { buildCreatorVariationPrompt } from '../creator/eon-creator-iteration-planner.js';
import { acquireLocalMediaWorkload, releaseLocalMediaWorkload } from './local-media-workload-admission.js';

import { readEonLocalBridgeSession, startEonLocalCompanionRuntime } from './eon-local-bridge-client.js';
const W625C_SOURCE_ZIP_SHA256 = '9b27b94b3737bf9a27d880bcb2ccbc00e2c476389787a5ad958a460929125d09';

function currentCreatorOutcomeRoute() {
  const path = String(globalThis.location?.pathname || '').trim();
  return ['/create', '/eoncity', '/local-ai'].includes(path) ? path : '/local-ai';
}

const NEGATIVE_LANES = Object.freeze([
  'runtimeStoppedAndRecovered',
  'fourGbFallback',
  'missingModelAndRecovered',
  'invalidInputRejected',
  'unapprovedEndpointRejected',
  'corsDeniedAndRecovered',
  'cancelledAndRetried',
  'timeoutOrCrashRecovered',
  'lowDiskProtected',
  'refreshResumeTruth',
  'previewDecodeRecovery'
]);

function recordVerifiedVideoOutcome(video = {}) {
  if (video.digestMatched !== true || video.playbackCompleted !== true) return false;
  const digest = String(video.outputInspection?.sha256 || '').trim();
  if (!digest) return false;
  const result = recordEonCoreOutcome({
    kind: 'creator-video-verified', route: currentCreatorOutcomeRoute(), source: 'comfyui-video-lab',
    receiptId: `video:${digest}`, verified: true
  });
  return result.ok === true;
}

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function bytesLabel(bytes = 0) {
  const value = Number(bytes || 0);
  return value > 0 ? `${(value / (1024 ** 3)).toFixed(1)} GB` : 'not confirmed';
}

function ensureVideoState(state = {}) {
  state.video = state.video || {
    endpoint: COMFYUI_VIDEO_DEFAULT_ENDPOINT,
    expanded: /(?:\?|&)creator=video(?:&|$)/.test(globalThis.location?.search || ''),
    runtime: null,
    capability: evaluateLocalVideoCapability({ runtimeReached: false }),
    workflowReview: null,
    workflowConfirmed: false,
    firstFrameFile: null,
    firstFrameInspection: null,
    prompt: 'A calm futuristic command plaza at sunrise. Slow camera push forward, soft moving fog, subtle lights, stable architecture, no text, no people, no sudden cuts.',
    systemRamGb: 0,
    freeStorageGb: 0,
    acPower: false,
    thermalMonitoring: false,
    batteryPercent: 100,
    requiredModelsReady: false,
    recipe: normalizeLocalVideoRecipe({}),
    busy: '',
    status: 'Run a capability scan. No model, workflow or video job starts automatically.',
    jobState: 'idle',
    activePromptId: '',
    abortController: null,
    progressObserved: false,
    output: null,
    outputBlob: null,
    outputInspection: null,
    outputObjectUrl: '',
    reopenedObjectUrl: '',
    reopenedFile: null,
    saveInitiated: false,
    reopened: false,
    digestMatched: false,
    playbackCompleted: false,
    negativeLanes: Object.fromEntries(NEGATIVE_LANES.map((key) => [key, 'pending'])),
    variationIndex: 0
  };
  return state.video;
}

function revokeUrls(video) {
  for (const key of ['outputObjectUrl', 'reopenedObjectUrl']) {
    if (!video[key]) continue;
    try { URL.revokeObjectURL(video[key]); } catch {}
    video[key] = '';
  }
}

function currentCapability(video) {
  const devices = video.runtime?.devices || [];
  const workflowReviewed = video.workflowReview?.ok === true && video.workflowConfirmed === true;
  const capability = evaluateLocalVideoCapability({
    devices,
    runtimeReached: video.runtime?.ok === true,
    systemRamBytes: Number(video.systemRamGb || 0) * (1024 ** 3),
    freeStorageBytes: Number(video.freeStorageGb || 0) * (1024 ** 3),
    workflowReviewed,
    requiredModelsReady: video.requiredModelsReady,
    acPower: video.acPower,
    batteryPercent: video.batteryPercent,
    thermalMonitoring: video.thermalMonitoring,
    ...video.recipe
  });
  video.capability = capability;
  return capability;
}

function renderCapability(video) {
  const capability = currentCapability(video);
  const blockerRows = capability.blockers.length ? `<ul>${capability.blockers.map((row) => `<li>${escapeHtml(row.replaceAll('-', ' '))}</li>`).join('')}</ul>` : '<p>No blocking item is recorded.</p>';
  const warningRows = capability.warnings.length ? `<p class="local-ai-disclosure">Warnings: ${escapeHtml(capability.warnings.join(' · ').replaceAll('-', ' '))}</p>` : '';
  return `<article class="local-ai-runtime-card local-ai-video-capability is-${escapeHtml(capability.verdict)}"><h3>Capability verdict: ${escapeHtml(capability.verdict)}</h3><p>${escapeHtml(capability.reason)}</p><p><strong>Usable VRAM:</strong> ${escapeHtml(bytesLabel(capability.usableVramBytes))} · <strong>RAM:</strong> ${escapeHtml(bytesLabel(capability.systemRamBytes))} · <strong>Free storage:</strong> ${escapeHtml(bytesLabel(capability.freeStorageBytes))}</p>${blockerRows}${warningRows}<p class="local-ai-disclosure">The reviewed 4 GB RTX 3050 lane stays blocked. Detection cannot start a queue, model download, install or cloud fallback.</p></article>`;
}

function renderWorkflow(video) {
  const review = video.workflowReview;
  const digest = review?.sha256 || '';
  return `<article class="local-ai-runtime-card"><h3>Reviewed native workflow</h3><p>Choose a ComfyUI <strong>API-format JSON</strong> exported from the native Wan2.2 TI2V 5B image-to-video template. EONAPP rejects unknown node classes, network/execution nodes and missing workflow roles before submission.</p><label>API workflow JSON<input data-video-workflow-file type="file" accept="application/json,.json" /></label>${review ? `<p class="local-ai-result">${escapeHtml(review.message)}</p><p class="local-ai-disclosure">Workflow: ${escapeHtml(COMFYUI_VIDEO_WORKFLOW_ID)} · ${review.nodeCount || 0} nodes · SHA-256 ${escapeHtml(digest.slice(0, 16))}…</p>${review.blockers?.length ? `<p>Blocked: ${escapeHtml(review.blockers.join(', '))}</p>` : `<label class="local-ai-check"><input data-video-workflow-confirm type="checkbox" ${video.workflowConfirmed ? 'checked' : ''} /> I reviewed and confirm this exact digest for this browser session.</label>`}` : '<p class="local-ai-disclosure">No workflow file has been reviewed.</p>'}<label class="local-ai-check"><input data-video-models-ready type="checkbox" ${video.requiredModelsReady ? 'checked' : ''} /> I confirmed the required local models and licences in ComfyUI.</label></article>`;
}

function renderGovernor(video) {
  const plan = buildLocalVideoSafetyPlan({ ...video.recipe, freeStorageBytes: Number(video.freeStorageGb || 0) * (1024 ** 3), acPower: video.acPower, batteryPercent: video.batteryPercent, thermalMonitoring: video.thermalMonitoring });
  const recipe = plan.safeDefaults;
  video.recipe = recipe;
  return `<article class="local-ai-runtime-card"><h3>Efficiency governor</h3><div class="local-ai-grid"><label>System RAM (GB)<input data-video-ram type="number" min="0" max="512" step="1" value="${escapeHtml(video.systemRamGb || '')}" placeholder="32" /></label><label>Free storage (GB)<input data-video-storage type="number" min="0" max="4096" step="1" value="${escapeHtml(video.freeStorageGb || '')}" placeholder="35" /></label><label>Battery %<input data-video-battery type="number" min="0" max="100" step="1" value="${escapeHtml(video.batteryPercent)}" /></label></div><label class="local-ai-check"><input data-video-ac type="checkbox" ${video.acPower ? 'checked' : ''} /> AC power connected</label><label class="local-ai-check"><input data-video-thermal type="checkbox" ${video.thermalMonitoring ? 'checked' : ''} /> Thermal monitoring available</label><p><strong>${recipe.width}×${recipe.height}</strong> · ${recipe.frames} frames · ${recipe.fps} FPS · about ${recipe.durationSeconds}s · batch 1 · queue 1</p><p class="local-ai-disclosure">Workload: ${escapeHtml(plan.workload.workloadClass)}. Estimated temporary space ${(plan.workload.temporaryBytes / (1024 ** 2)).toFixed(0)} MB. Cleanup is only proposed; saved media is never deleted automatically.</p></article>`;
}

function renderInput(video) {
  return `<article class="local-ai-runtime-card"><h3>Image-to-video proof input</h3><label>Harmless first frame<input data-video-first-frame type="file" accept="image/png,image/jpeg,image/webp" /></label><p class="local-ai-result">${escapeHtml(video.firstFrameInspection?.message || 'PNG, JPEG or WebP · maximum 20 MB · sent only to approved loopback ComfyUI after Generate.')}</p><label>Motion brief<textarea data-video-prompt rows="5" maxlength="1400">${escapeHtml(video.prompt)}</textarea></label><div class="local-ai-grid"><label>Frames<input data-video-frames type="number" min="9" max="49" step="1" value="${video.recipe.frames}" /></label><label>FPS<input data-video-fps type="number" min="8" max="24" step="1" value="${video.recipe.fps}" /></label><label>Seed<input data-video-seed type="number" min="0" max="2147483647" step="1" value="${escapeHtml(video.recipe.seed ?? '')}" placeholder="Fixed for proof" /></label><label>Motion<select data-video-motion><option value="low"${video.recipe.motionStrength === 'low' ? ' selected' : ''}>Low</option><option value="medium"${video.recipe.motionStrength === 'medium' ? ' selected' : ''}>Medium</option></select></label></div><p class="local-ai-disclosure">First proof has no audio, interpolation, upscaler, LoRA, ControlNet or custom node.</p></article>`;
}

function renderOutput(video) {
  if (!video.outputObjectUrl) return '<div class="local-ai-image-empty local-ai-video-empty"><strong>Your real local video appears here</strong><p>Source strings, mocks, ComfyUI-only screenshots and files created outside EONAPP do not count.</p></div>';
  const inspection = video.outputInspection || {};
  return `<figure class="local-ai-image-output local-ai-video-output"><video src="${escapeHtml(video.outputObjectUrl)}" controls muted playsinline preload="metadata" data-video-preview></video><figcaption>${escapeHtml(video.output?.filename || 'Local video')} · ${inspection.width || '?'}×${inspection.height || '?'} · ${Number(inspection.durationSeconds || 0).toFixed(2)}s</figcaption><div class="local-ai-output-actions"><button type="button" class="eon-hub-primary" data-video-save ${video.busy ? 'disabled' : ''}>Save to this device</button><button type="button" class="local-ai-secondary" data-video-reopen ${video.busy ? 'disabled' : ''}>Reopen saved video</button><input data-video-reopen-file type="file" accept="video/mp4,video/webm,image/gif" hidden /><button type="button" class="local-ai-secondary is-quiet" data-video-receipt>Export redacted receipt</button><button type="button" class="local-ai-secondary" data-video-variation ${video.busy ? 'disabled' : ''}>Prepare variation</button>${video.digestMatched && video.playbackCompleted && video.reopenedFile ? '<button type="button" class="local-ai-secondary" data-video-share>Share verified video…</button>' : ''}</div><ol class="local-ai-proof-checklist"><li class="${video.outputBlob ? 'is-pass' : ''}">Fetched into EONAPP</li><li class="${video.outputObjectUrl ? 'is-pass' : ''}">Previewed in EONAPP</li><li class="${video.saveInitiated ? 'is-pass' : ''}">Save started</li><li class="${video.reopened ? 'is-pass' : ''}">Saved file reopened</li><li class="${video.digestMatched ? 'is-pass' : ''}">Reopened SHA-256 matches</li><li class="${video.playbackCompleted ? 'is-pass' : ''}">Playback reached the end</li></ol></figure>`;
}

function buildReceipt(video) {
  const capability = currentCapability(video);
  const recipe = video.recipe;
  return buildLocalVideoProofReceipt({
    sourceRevisionOrZipSha256: W625C_SOURCE_ZIP_SHA256,
    eonappOrigin: globalThis.location?.origin || '',
    comfyEndpoint: video.endpoint,
    usableVramBytes: capability.usableVramBytes,
    systemRamBytes: capability.systemRamBytes,
    freeStorageBytes: capability.freeStorageBytes,
    capabilityVerdict: capability.verdict,
    ownerFourGbCapabilityVerdict: capability.usableVramBytes > 0 && capability.usableVramBytes < 8 * (1024 ** 3) ? capability.verdict : 'pending-owner-lane',
    ownerFourGbSubmissionBlocked: capability.usableVramBytes > 0 && capability.usableVramBytes < 8 * (1024 ** 3) ? capability.reviewedWorkflowSubmissionAllowed === false : false,
    workflowId: video.workflowReview?.workflowId || '',
    workflowVersion: video.workflowReview?.version || '',
    workflowSha256: video.workflowReview?.sha256 || '',
    standardCoreNodesOnly: video.workflowReview?.standardCoreNodesOnly === true,
    width: recipe.width,
    height: recipe.height,
    frames: recipe.frames,
    fps: recipe.fps,
    seedRecorded: recipe.seed !== null,
    promptSubmitted: Boolean(video.activePromptId),
    promptIdRecorded: Boolean(video.activePromptId),
    realProgressObserved: video.progressObserved,
    historyCompleted: video.historyCompleted,
    outputFetched: Boolean(video.outputBlob),
    outputPreviewed: Boolean(video.outputObjectUrl),
    outputSaved: video.saveInitiated,
    outputReopened: video.reopened,
    digestMatched: video.digestMatched,
    container: video.outputInspection?.type || '',
    outputBytes: video.outputInspection?.bytes || 0,
    outputSha256: video.outputInspection?.sha256 || '',
    durationSeconds: video.outputInspection?.durationSeconds || 0,
    outputWidth: video.outputInspection?.width || 0,
    outputHeight: video.outputInspection?.height || 0,
    playbackCompleted: video.playbackCompleted,
    negativeLanes: video.negativeLanes,
    openBlockers: ['Real owner/reference-machine W625E and W625H evidence remains pending until every recovery lane passes.']
  });
}

export function renderComfyUiVideoLab(state = {}, { compact = false, embedded = false } = {}) {
  const video = ensureVideoState(state);
  if (embedded) video.expanded = true;
  if (compact) return `<section class="local-ai-catalog-card local-ai-video-lab is-compact" data-comfy-video-lab><div class="local-ai-catalog-head"><div><p class="local-ai-eyebrow">Local Video Lab · capability only</p><h2>Use Guide mode on this compact device</h2><p>Phone-local ComfyUI video is not promised. No model download, queue or cloud relay starts here.</p></div><span class="local-ai-chip">unsupported compact lane</span></div><a class="eon-hub-primary" href="/workspace#creator-engine">Prepare a storyboard</a></section>`;
  if (!video.expanded) return `<section class="local-ai-catalog-card local-ai-video-lab" data-comfy-video-lab><div class="local-ai-catalog-head"><div><p class="local-ai-eyebrow">Local Video</p><h2>Check this device before attempting video</h2><p>This device must pass the local-video fit check before generation. Lower-memory devices stay on a safe fallback path.</p></div><span class="local-ai-chip">device check required</span></div><div class="local-ai-actions"><a class="eon-hub-primary" href="/local-ai?creator=video">Open Local Video Lab</a><a class="local-ai-secondary" href="/workspace#creator-engine">Prepare storyboard</a></div></section>`;
  const capability = currentCapability(video);
  const canGenerate = capability.reviewedWorkflowSubmissionAllowed && video.firstFrameInspection?.ok === true && video.workflowReview?.ok === true && video.workflowConfirmed && !video.busy;
  return `<section class="local-ai-catalog-card local-ai-video-lab" data-comfy-video-lab aria-labelledby="local-video-title"><div class="local-ai-catalog-head"><div><p class="local-ai-eyebrow">Local Video</p><h2 id="local-video-title">Check this computer, then create locally</h2><p>Video is heavier than chat or images, so EON checks the local engine, reviewed workflow, models and device budget before enabling Generate. Technical connection details stay in Advanced.</p></div><span class="local-ai-chip">${escapeHtml(capability.verdict)} · separate video check</span></div><div class="local-ai-actions"><button type="button" class="eon-hub-primary" data-video-scan ${video.busy ? 'disabled' : ''}>${video.busy === 'scan' ? 'Checking local video…' : 'Check local video'}</button><button type="button" class="local-ai-secondary is-quiet" data-video-reset ${video.busy ? 'disabled' : ''}>Reset video setup</button></div><p class="local-ai-result" aria-live="polite">${escapeHtml(video.status)}</p><details class="local-ai-media-advanced"><summary>Advanced video connection</summary><label>Approved local ComfyUI endpoint<input data-video-endpoint value="${escapeHtml(video.endpoint)}" inputmode="url" autocomplete="off" spellcheck="false" /></label><p class="local-ai-disclosure">Normally leave this unchanged. EON Local Companion handles the protected browser-to-local boundary when direct access is blocked.</p></details><div class="local-ai-grid local-ai-video-grid">${renderCapability(video)}${renderWorkflow(video)}${renderGovernor(video)}${renderInput(video)}</div><div class="local-ai-comfy-workspace"><div><div class="local-ai-actions"><button type="button" class="eon-hub-primary" data-video-generate ${canGenerate ? '' : 'disabled'}>${video.busy === 'generate' ? 'Creating local video…' : 'Create local video proof'}</button>${video.busy === 'generate' ? '<button type="button" class="local-ai-secondary" data-video-cancel>Cancel local video job</button>' : ''}</div><p>Job state: <strong>${escapeHtml(video.jobState)}</strong></p><p class="local-ai-disclosure">Generate stays disabled unless capability is supported, the exact workflow digest is confirmed, required models are confirmed, storage/power evidence is safe and the first frame passes validation.</p></div>${renderOutput(video)}</div><aside class="local-ai-video-boundary"><strong>Video stays honest</strong><p>A working chat or image setup never unlocks video by implication. EON marks it ready only after a real local output completes the required checks.</p></aside></section>`;
}

function updateRecipeFromRoot(root, video) {
  video.recipe = normalizeLocalVideoRecipe({
    ...video.recipe,
    frames: root.querySelector?.('[data-video-frames]')?.value ?? video.recipe.frames,
    fps: root.querySelector?.('[data-video-fps]')?.value ?? video.recipe.fps,
    seed: root.querySelector?.('[data-video-seed]')?.value ?? video.recipe.seed,
    motionStrength: root.querySelector?.('[data-video-motion]')?.value ?? video.recipe.motionStrength
  });
}

export function bindComfyUiVideoLab(root, state = {}, { rerender = () => {} } = {}) {
  const video = ensureVideoState(state);
  const endpointInput = root?.querySelector?.('[data-video-endpoint]');
  endpointInput?.addEventListener('input', () => { video.endpoint = endpointInput.value; });
  for (const selector of ['[data-video-ram]', '[data-video-storage]', '[data-video-battery]', '[data-video-frames]', '[data-video-fps]', '[data-video-seed]', '[data-video-motion]']) {
    root?.querySelector?.(selector)?.addEventListener('change', () => {
      video.systemRamGb = Number(root.querySelector?.('[data-video-ram]')?.value || 0);
      video.freeStorageGb = Number(root.querySelector?.('[data-video-storage]')?.value || 0);
      video.batteryPercent = Number(root.querySelector?.('[data-video-battery]')?.value || 100);
      updateRecipeFromRoot(root, video);
      rerender();
    });
  }
  root?.querySelector?.('[data-video-ac]')?.addEventListener('change', (event) => { video.acPower = event.target.checked; rerender(); });
  root?.querySelector?.('[data-video-thermal]')?.addEventListener('change', (event) => { video.thermalMonitoring = event.target.checked; rerender(); });
  root?.querySelector?.('[data-video-models-ready]')?.addEventListener('change', (event) => { video.requiredModelsReady = event.target.checked; rerender(); });
  root?.querySelector?.('[data-video-prompt]')?.addEventListener('input', (event) => { video.prompt = event.target.value; });

  root?.querySelector?.('[data-video-scan]')?.addEventListener('click', async () => {
    video.endpoint = endpointInput?.value || video.endpoint;
    video.busy = 'scan';
    video.jobState = 'scanning';
    video.status = 'Checking only the approved ComfyUI loopback endpoint and measured device budget…';
    rerender();
    const scanVideo = () => discoverComfyUiVideoRuntime({
      endpoint: video.endpoint,
      systemRamBytes: Number(video.systemRamGb || 0) * (1024 ** 3),
      freeStorageBytes: Number(video.freeStorageGb || 0) * (1024 ** 3),
      workflowReviewed: video.workflowReview?.ok === true && video.workflowConfirmed,
      requiredModelsReady: video.requiredModelsReady,
      acPower: video.acPower,
      batteryPercent: video.batteryPercent,
      thermalMonitoring: video.thermalMonitoring
    });
    let result = await scanVideo();
    if (!result.ok && readEonLocalBridgeSession()) {
      video.status = 'The local video engine is not responding. EON Local Companion is trying to open installed ComfyUI…';
      rerender();
      const started = await startEonLocalCompanionRuntime('comfyui');
      if (started.ok) {
        await new Promise((resolve) => setTimeout(resolve, 2200));
        result = await scanVideo();
      }
    }
    video.runtime = result;
    video.capability = result.capability;
    video.busy = '';
    video.jobState = result.ok ? `capability-${result.capability.verdict}` : 'runtime-unavailable';
    video.status = result.ok ? result.message : `${result.message || 'Local video is not ready.'} ${readEonLocalBridgeSession() ? 'Open ComfyUI once if the installed app did not start automatically, then recheck.' : 'Connect EON Local Companion from Advanced diagnostics if the browser cannot reach ComfyUI.'}`;
    rerender();
  });

  root?.querySelector?.('[data-video-workflow-file]')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    video.workflowConfirmed = false;
    if (!file) return;
    if (file.size > 1_500_000) {
      video.workflowReview = { ok: false, blockers: ['workflow-size-invalid'], message: 'The workflow exceeds the reviewed local size limit.' };
    } else {
      video.workflowReview = await reviewComfyUiVideoApiWorkflow(await file.text());
    }
    video.status = video.workflowReview.message;
    event.target.value = '';
    rerender();
  });
  root?.querySelector?.('[data-video-workflow-confirm]')?.addEventListener('change', (event) => { video.workflowConfirmed = event.target.checked && video.workflowReview?.ok === true; rerender(); });
  root?.querySelector?.('[data-video-first-frame]')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    video.firstFrameFile = null;
    video.firstFrameInspection = file ? await validateLocalVideoInputFile(file) : null;
    if (video.firstFrameInspection?.ok) video.firstFrameFile = file;
    video.status = video.firstFrameInspection?.message || 'No first frame selected.';
    rerender();
  });

  root?.querySelector?.('[data-video-generate]')?.addEventListener('click', async () => {
    updateRecipeFromRoot(root, video);
    const capability = currentCapability(video);
    if (!capability.reviewedWorkflowSubmissionAllowed) { video.status = capability.reason; rerender(); return; }

    const admission = await acquireLocalMediaWorkload('video', {
      source: 'comfyui-video-lab',
      label: 'Local ComfyUI video generation',
      confirmPauseCity: async () => globalThis.confirm?.('Local video generation is a heavy GPU task and can compete with EON City. Pause City while this video is created? City will resume automatically when this workload finishes unless you manually paused it.') === true
    });
    if (!admission.ok) {
      video.jobState = admission.cancelled ? 'cancelled-before-submit' : 'waiting-for-device-capacity';
      video.status = admission.cancelled
        ? 'Local video generation was cancelled before any ComfyUI job started. City was not changed.'
        : 'This device is busy with another protected workload. Finish or cancel that work, then try the video again.';
      rerender();
      return;
    }

    video.busy = 'generate';
    video.abortController = new AbortController();
    video.jobState = 'preparing';
    video.status = admission.cityPauseApproved
      ? 'City is paused by your approval. Preparing the reviewed local video job…'
      : 'Uploading the selected first frame only to approved loopback ComfyUI, then submitting one reviewed job…';
    video.progressObserved = false;
    video.activePromptId = '';
    video.output = null;
    video.outputBlob = null;
    video.outputInspection = null;
    video.saveInitiated = false;
    video.reopened = false;
    video.digestMatched = false; video.reopenedFile = null;
    video.playbackCompleted = false;
    revokeUrls(video);
    rerender();

    try {
      const result = await generateComfyUiVideo({
        endpoint: video.endpoint,
        capability,
        workflowReview: video.workflowReview,
        confirmedWorkflowSha256: video.workflowReview?.sha256,
        firstFrameFile: video.firstFrameFile,
        prompt: video.prompt,
        ...video.recipe,
        explicitUserAction: true,
        signal: video.abortController.signal,
        onState: ({ state: nextState, promptId }) => {
          video.jobState = nextState || video.jobState;
          if (promptId) video.activePromptId = promptId;
          if (['queued', 'running'].includes(nextState)) video.progressObserved = true;
          video.status = nextState === 'queued' ? 'The reviewed local video job is queued…' : nextState === 'running' ? 'ComfyUI is generating the video locally…' : video.status;
          rerender();
        }
      });
      video.historyCompleted = result.historyCompleted === true;
      video.progressObserved = result.progressObserved === true || video.progressObserved;
      video.status = result.message || (result.ok ? 'The local video job completed.' : 'The local video job did not complete.');
      video.jobState = result.cancelled ? 'cancelled' : result.ok ? 'fetching-output' : result.error === 'comfyui-video-job-timeout' ? 'timeout' : 'failed';
      if (result.ok && result.outputs?.[0]) {
        const output = result.outputs.find((row) => row.outputKind === 'videos') || result.outputs.find((row) => row.outputKind === 'gifs') || result.outputs[0];
        const fetched = await fetchComfyUiVideoOutputBlob(output);
        if (fetched.ok) {
          const inspected = await inspectLocalVideoBlob(fetched.blob, { filename: fetched.filename });
          video.output = output;
          video.outputBlob = fetched.blob;
          video.outputInspection = inspected.ok ? inspected : null;
          video.outputObjectUrl = URL.createObjectURL(fetched.blob);
          video.jobState = 'preview-ready-save-and-reopen-required';
          video.status = inspected.message;
        } else {
          video.jobState = 'output-fetch-failed';
          video.status = fetched.message;
        }
      }
    } catch (error) {
      video.jobState = video.abortController?.signal?.aborted ? 'cancelled' : 'failed';
      video.status = video.abortController?.signal?.aborted
        ? 'The local video job was cancelled.'
        : `The protected local video job stopped safely: ${String(error?.message || 'unknown local error').slice(0, 180)}.`;
    } finally {
      video.abortController = null;
      video.busy = '';
      releaseLocalMediaWorkload(admission, video.jobState || 'completed');
      rerender();
    }
  });
  root?.querySelector?.('[data-video-cancel]')?.addEventListener('click', async () => {
    video.jobState = 'cancelling';
    video.status = 'Stopping local waiting and asking ComfyUI to cancel the identified job…';
    rerender();
    const result = await cancelComfyUiVideoJob({ endpoint: video.endpoint, promptId: video.activePromptId, explicitUserAction: true });
    video.abortController?.abort?.();
    video.busy = '';
    video.jobState = result.ok ? 'cancelled' : 'cancel-unconfirmed';
    video.status = result.message;
    rerender();
  });
  root?.querySelector?.('[data-video-save]')?.addEventListener('click', async () => {
    const result = await saveLocalVideoBlob(video.outputBlob, video.output?.filename || 'eonapp-local-video.webm');
    video.saveInitiated = result.ok === true;
    video.status = result.message;
    video.jobState = result.ok ? 'saved-reopen-required' : 'save-not-completed';
    rerender();
  });
  const reopenInput = root?.querySelector?.('[data-video-reopen-file]');
  root?.querySelector?.('[data-video-reopen]')?.addEventListener('click', () => reopenInput?.click?.());
  reopenInput?.addEventListener('change', async () => {
    const file = reopenInput.files?.[0];
    if (!file) return;
    const result = await reopenLocalVideoFile(file, { expectedSha256: video.outputInspection?.sha256 || '' });
    video.reopened = result.ok === true;
    video.digestMatched = result.verifiedReopen === true;
    video.reopenedFile = video.digestMatched ? file : null;
    if (result.objectUrl) {
      if (video.reopenedObjectUrl) try { URL.revokeObjectURL(video.reopenedObjectUrl); } catch {}
      video.reopenedObjectUrl = result.objectUrl;
    }
    video.status = result.message;
    video.jobState = video.digestMatched ? 'positive-path-verified-negative-lanes-pending' : 'reopen-mismatch';
    recordVerifiedVideoOutcome(video);
    reopenInput.value = '';
    rerender();
  });
  const preview = root?.querySelector?.('[data-video-preview]');
  preview?.addEventListener('ended', () => { video.playbackCompleted = true; recordVerifiedVideoOutcome(video); video.status = 'Playback reached the end in EONAPP. Save/reopen verification is still required before this output counts as verified.'; rerender(); });
  root?.querySelector?.('[data-video-receipt]')?.addEventListener('click', () => {
    const result = downloadLocalVideoProofReceipt(buildReceipt(video));
    video.status = result.ok ? 'Redacted local-video verification receipt downloaded. Any checks not yet run remain pending.' : 'This browser could not download the receipt.';
    rerender();
  });

  root?.querySelector?.('[data-video-variation]')?.addEventListener('click', () => {
    if (!video.outputBlob) return;
    const nextIndex = (Number(video.variationIndex) || 0) + 1;
    const plan = buildCreatorVariationPrompt({ mediaKind: 'video', prompt: video.prompt, iteration: nextIndex, maxChars: 1400 });
    if (!plan.ok) { video.status = `Variation could not be prepared: ${plan.reason}.`; rerender(); return; }
    video.variationIndex = nextIndex;
    video.prompt = plan.prompt;
    video.recipe = normalizeLocalVideoRecipe({ ...video.recipe, seed: '' });
    video.status = `Variation ${nextIndex} prepared locally. It reuses the reviewed first-frame/workflow context but is a new generation, not a media extension. Press Generate separately; no ComfyUI job started.`;
    rerender();
  });

  root?.querySelector?.('[data-video-share]')?.addEventListener('click', async () => {
    const result = await shareEonLocalMedia({
      file: video.reopenedFile,
      title: 'Made with EONAPP',
      text: 'I created and verified this video locally with EONAPP.',
      url: globalThis.location?.origin ? `${globalThis.location.origin}/` : ''
    }, { userGesture: true });
    video.status = result.ok ? 'Your device share menu opened. EONAPP does not claim the video was posted.' : (result.reason === 'native-share-unavailable' ? 'Native file sharing is unavailable here. Keep the video and use Share Command Center for a public-safe caption/link.' : `Share unavailable: ${result.reason || 'unknown'}`);
    rerender();
  });
  root?.querySelector?.('[data-video-reset]')?.addEventListener('click', () => {
    video.abortController?.abort?.();
    revokeUrls(video);
    state.video = null;
    rerender();
  });
}

export function getLocalVideoLabEvidence(state = {}) {
  const video = ensureVideoState(state);
  return Object.freeze({ capability: buildLocalVideoCapabilityEvidence(currentCapability(video)), receipt: buildReceipt(video) });
}
