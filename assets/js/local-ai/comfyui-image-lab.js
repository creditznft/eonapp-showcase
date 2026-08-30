/** W625A–W625C — proof-first Local Image Lab for the loopback-only ComfyUI adapter. */
import {
  COMFYUI_DEFAULT_ENDPOINT,
  cancelComfyUiJob,
  clearComfyUiMediaStatus,
  discoverComfyUiCapabilities,
  fetchComfyUiOutputBlob,
  generateComfyUiImage,
  readComfyUiMediaStatus,
  saveComfyUiMediaStatus
} from './comfyui-local-media.js';
import {
  COMFYUI_IMAGE_ASPECT_PRESETS,
  COMFYUI_IMAGE_QUALITY_PRESETS,
  classifyComfyUiCheckpoint,
  resolveComfyUiImageRecipe
} from './comfyui-image-workflow-registry.js';
import {
  buildLocalImageProofReceipt,
  downloadLocalImageProofReceipt,
  inspectLocalImageBlob,
  reopenLocalImageFile,
  saveLocalImageBlob
} from './local-image-proof.js';
import { recordEonCoreOutcome } from '../contracts/outcomes/eon-core-outcome-authority.js';
import { shareEonLocalMedia } from '../share/eon-viral-share-kit.js';
import { buildCreatorVariationPrompt } from '../creator/eon-creator-iteration-planner.js';
import { acquireLocalMediaWorkload, releaseLocalMediaWorkload } from './local-media-workload-admission.js';

import {
  awaitEonLocalAiReviewedModelPack,
  installEonLocalAiReviewedModelPack,
  pairEonLocalCompanionWithApproval,
  readEonLocalBridgeSession,
  startEonLocalCompanionRuntime
} from './eon-local-bridge-client.js';
import { chooseEonLocalImageStarterPack, publicEonLocalAiModelPack } from '../../../config/local-ai-reviewed-model-packs.mjs';
const SOURCE_ZIP_SHA256 = '9da1fb6dc641eb45e6890a28834fe5bc669d9571d77fad3c007d65ebe1798757';
const MAX_SESSION_HISTORY = 4;

function currentCreatorOutcomeRoute() {
  const path = String(globalThis.location?.pathname || '').trim();
  return ['/create', '/eoncity', '/local-ai'].includes(path) ? path : '/local-ai';
}

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function vramLabel(devices = []) {
  const bytes = Math.max(0, ...devices.map((row) => Number(row.vramTotalBytes || row.torchVramTotalBytes || 0) || 0));
  return bytes ? `${(bytes / (1024 ** 3)).toFixed(1)} GB reported VRAM` : 'VRAM not reported by ComfyUI';
}

function reportedVramGb(devices = []) {
  const bytes = Math.max(0, ...devices.map((row) => Number(row.vramTotalBytes || row.torchVramTotalBytes || 0) || 0));
  return bytes > 0 ? bytes / (1024 ** 3) : 0;
}

function ensureMediaState(state = {}) {
  const stored = readComfyUiMediaStatus();
  state.comfy = state.comfy || {
    endpoint: stored?.endpoint || COMFYUI_DEFAULT_ENDPOINT,
    checkpoint: stored?.checkpoint || '',
    prompt: 'A cinematic futuristic creative studio in a calm graphite city, glowing cyan details, highly detailed, no text',
    negativePrompt: 'blurry, low quality, distorted, watermark, letters, text artifacts',
    capabilities: null,
    busy: '',
    status: stored?.selfTestPassed
      ? 'A previous save-and-reopen image proof passed in this browser. Scan again before creating.'
      : '',
    output: null,
    outputBlob: null,
    outputInspection: null,
    outputObjectUrl: '',
    reopenedObjectUrl: '',
    reopenedFile: null,
    generatedDigest: '',
    selfTestPassed: Boolean(stored?.selfTestPassed),
    saveInitiated: false,
    reopened: false,
    digestMatched: false,
    jobState: 'idle',
    activePromptId: '',
    abortController: null,
    cancellationAttempted: false,
    proofMode: true,
    aspectId: 'square',
    qualityId: 'proof',
    seed: '',
    history: [],
    variationIndex: 0,
    companionRecommended: false,
    starterPackBusy: false,
    starterPackStatus: ''
  };
  return state.comfy;
}

function revokeMediaUrls(media) {
  for (const key of ['outputObjectUrl', 'reopenedObjectUrl']) {
    if (media[key]) {
      try { URL.revokeObjectURL(media[key]); } catch {}
      media[key] = '';
    }
  }
}

function renderProofChecklist(media) {
  const rows = [
    ['Generated', Boolean(media.output)],
    ['Fetched into EONAPP', Boolean(media.outputBlob)],
    ['Previewed in EONAPP', Boolean(media.outputObjectUrl)],
    ['Save started', media.saveInitiated === true],
    ['Saved file reopened', media.reopened === true],
    ['Reopened bytes match', media.digestMatched === true]
  ];
  return `<ol class="local-ai-proof-checklist" aria-label="Local image verification checklist">${rows.map(([label, pass]) => `<li class="${pass ? 'is-pass' : ''}"><span aria-hidden="true">${pass ? '✓' : '○'}</span><strong>${escapeHtml(label)}</strong></li>`).join('')}</ol>`;
}

function renderCreatorControls(media) {
  const unlocked = media.digestMatched === true;
  const recipe = resolveComfyUiImageRecipe({
    checkpoint: media.checkpoint,
    devices: media.capabilities?.devices || [],
    proofMode: !unlocked || media.proofMode,
    aspectId: media.aspectId,
    qualityId: media.qualityId,
    seed: media.seed
  });
  return `<fieldset class="local-ai-creator-controls" ${unlocked ? '' : 'disabled'}>
    <legend>${unlocked ? 'Creator controls unlocked by matching save/reopen proof' : 'Creator controls unlock after save + matching reopen'}</legend>
    <label>Aspect<select data-comfy-aspect>${COMFYUI_IMAGE_ASPECT_PRESETS.map((row) => `<option value="${row.id}"${row.id === media.aspectId ? ' selected' : ''}>${escapeHtml(row.label)} · ${escapeHtml(row.ratio)}</option>`).join('')}</select></label>
    <label>Quality<select data-comfy-quality>${COMFYUI_IMAGE_QUALITY_PRESETS.filter((row) => row.id !== 'proof').map((row) => `<option value="${row.id}"${row.id === media.qualityId ? ' selected' : ''}>${escapeHtml(row.label)}</option>`).join('')}</select></label>
    <label>Seed<input data-comfy-seed type="number" min="0" max="2147483647" step="1" value="${escapeHtml(media.seed)}" placeholder="Random" /></label>
    <p class="local-ai-disclosure">Next recipe: ${recipe.width}×${recipe.height}, ${recipe.steps} steps, batch 1. Queue concurrency stays one.</p>
  </fieldset>`;
}

function renderOutput(media) {
  if (!media.outputObjectUrl) return '<div class="local-ai-image-empty"><strong>Your image appears here</strong><p>Nothing is uploaded. EONAPP fetches the finished image only from your approved ComfyUI loopback endpoint.</p></div>';
  const output = media.output || {};
  const inspection = media.outputInspection || {};
  return `<figure class="local-ai-image-output">
    <img src="${escapeHtml(media.outputObjectUrl)}" alt="Your locally generated EONAPP image" />
    <figcaption>${escapeHtml(output.filename || 'Local image output')} · ${inspection.width || 512}×${inspection.height || 512} · generated and previewed locally</figcaption>
    <div class="local-ai-output-actions">
      <button type="button" class="eon-hub-primary" data-comfy-save ${media.busy ? 'disabled' : ''}>Save to this device</button>
      <button type="button" class="local-ai-secondary" data-comfy-reopen ${media.busy ? 'disabled' : ''}>Reopen saved image</button>
      <input data-comfy-reopen-file type="file" accept="image/png,image/jpeg,image/webp" hidden />
      <button type="button" class="local-ai-secondary is-quiet" data-comfy-receipt ${media.outputBlob ? '' : 'disabled'}>Export redacted proof receipt</button>
      <button type="button" class="local-ai-secondary" data-comfy-variation ${media.busy ? 'disabled' : ''}>Prepare variation</button>${media.digestMatched && media.reopenedFile ? '<button type="button" class="local-ai-secondary" data-comfy-share>Share verified image…</button>' : ''}
    </div>
    ${renderProofChecklist(media)}
    <p class="local-ai-disclosure">Image bytes stay in memory or in the file you choose. The receipt excludes your prompt, checkpoint filename, local path and media body.</p>
  </figure>`;
}

function renderHistory(media) {
  const history = Array.isArray(media.history) ? media.history : [];
  if (!history.length) return '';
  return `<details class="local-ai-session-history"><summary>Session-only creation history (${history.length})</summary><ol>${history.map((row) => `<li><strong>${escapeHtml(row.dimensions)}</strong><span>${escapeHtml(row.status)}</span><small>${escapeHtml(row.recordedAt)}</small></li>`).join('')}</ol><p>History is held only in page memory and disappears on reset or refresh.</p></details>`;
}

export function renderComfyUiImageLab(state = {}, { compact = false } = {}) {
  const media = ensureMediaState(state);
  if (compact) {
    return `<section id="creator-media" class="local-ai-catalog-card local-ai-comfy-lab is-compact" data-comfy-image-lab data-comfy-compact-guide aria-labelledby="comfy-image-lab-title">
      <div class="local-ai-catalog-head"><div><p class="local-ai-eyebrow">Creator Image · compact device</p><h2 id="comfy-image-lab-title">Create without pretending this phone is a desktop GPU</h2><p>Comfy Desktop cannot run inside this phone or compact browser. EONAPP keeps the local controls off here instead of sending you through a setup that cannot work.</p></div><span class="local-ai-chip">connected rail pending proof</span></div>
      <div class="local-ai-comfy-steps"><article><span>1</span><div><strong>Prepare the idea here</strong><p>Write the prompt, storyboard or caption in Workspace without uploading private media.</p><a class="eon-hub-primary" href="/workspace#creator-engine">Prepare a Creator brief</a></div></article><article><span>2</span><div><strong>Generate on a desktop today</strong><p>Open EONAPP on a capable Windows, macOS or Linux computer with ComfyUI, then use the local scan and image proof.</p><a class="local-ai-secondary" href="/install">Desktop setup guide</a></div></article><article><span>3</span><div><strong>Connected Creator comes later</strong><p>The small-device cloud rail stays locked until entitlement, quota, cost, safety, privacy and real-output proof pass. Cloud work will be labelled clearly.</p></div></article></div>
      <aside class="local-ai-video-boundary"><strong>Video is not available on this device yet</strong><p>EONAPP will not promise phone-local image or video generation. There is no hidden relay.</p></aside>
    </section>`;
  }
  const capabilities = media.capabilities;
  const checkpoints = capabilities?.checkpoints || [];
  const checkpoint = media.checkpoint || capabilities?.recommendedCheckpoint || '';
  const checkpointTruth = classifyComfyUiCheckpoint(checkpoint);
  const canGenerate = Boolean(capabilities?.imageReady && checkpoint && !media.busy);
  const modelSelect = checkpoints.length
    ? `<label>Installed image checkpoint<select data-comfy-checkpoint>${checkpoints.map((name) => { const truth = classifyComfyUiCheckpoint(name); return `<option value="${escapeHtml(name)}"${name === checkpoint ? ' selected' : ''}>${escapeHtml(name)} · ${truth.family}</option>`; }).join('')}</select></label>`
    : '<p class="local-ai-disclosure">No installed checkpoint has been discovered yet.</p>';
  const running = media.busy === 'generate';
  const companionPaired = Boolean(readEonLocalBridgeSession());
  const starterPack = publicEonLocalAiModelPack(chooseEonLocalImageStarterPack({ vramGb: reportedVramGb(capabilities?.devices || []) }));
  const needsStarterPack = Boolean(capabilities?.ok && !checkpoints.length && starterPack);
  const setupAssist = needsStarterPack
    ? (companionPaired
      ? `<div class="local-ai-guide-model"><span class="local-ai-fit">Reviewed image starter</span><strong>${escapeHtml(starterPack.label)}</strong><p>About ${(Number(starterPack.approximateDownloadMb || 0) / 1000).toFixed(1)} GB · ${escapeHtml(starterPack.license)}. This download starts only after your tap.</p><div class="local-ai-actions"><button type="button" class="eon-hub-primary" data-comfy-install-starter ${media.starterPackBusy ? 'disabled' : ''}>${media.starterPackBusy ? 'Downloading image model…' : 'Download image starter'}</button><a class="local-ai-secondary is-quiet" href="${escapeHtml(starterPack.sourceUrl)}" target="_blank" rel="noopener noreferrer">Review source</a></div></div>`
      : `<div class="local-ai-guide-model"><span class="local-ai-fit">One local approval needed</span><strong>Connect EON Local Companion</strong><p>EON needs the Companion only to install the reviewed image starter safely. You will not be asked for a port, CORS setting or pairing code.</p><div class="local-ai-actions"><button type="button" class="eon-hub-primary" data-comfy-connect>Connect Local Companion</button><a class="local-ai-secondary is-quiet" href="/install">Get Local Companion</a></div></div>`)
    : (media.companionRecommended && !companionPaired
      ? `<div class="local-ai-guide-model"><span class="local-ai-fit">Protected local connection</span><strong>Connect EON Local Companion</strong><p>Your browser could not reach ComfyUI directly. Connect once; EON will use the approved local path without changing ComfyUI CORS.</p><div class="local-ai-actions"><button type="button" class="eon-hub-primary" data-comfy-connect>Connect Local Companion</button><a class="local-ai-secondary is-quiet" href="/install">Get Local Companion</a></div></div>`
      : '');
  return `<section id="creator-media" class="local-ai-catalog-card local-ai-comfy-lab" data-comfy-image-lab aria-labelledby="comfy-image-lab-title">
    <div class="local-ai-catalog-head"><div><p class="local-ai-eyebrow">Local Images</p><h2 id="comfy-image-lab-title">Make images on this computer</h2><p>EON checks the local image engine for you and keeps the technical connection details out of the normal flow. Your prompt and generated image stay on this computer; there is no silent cloud fallback.</p></div><span class="local-ai-chip">${media.digestMatched ? 'image path verified' : capabilities?.proofReady ? 'ready for first image' : capabilities?.imageReady ? 'image model found' : 'setup needed'}</span></div>
    <div class="local-ai-comfy-steps"><article><span>1</span><div><strong>Have a local image engine</strong><p>If ComfyUI is already installed, just keep it open. If it is missing, install it once from the official source.</p><a class="local-ai-secondary is-quiet" href="https://www.comfy.org/download" target="_blank" rel="noopener noreferrer" data-comfy-acquire>Get ComfyUI</a></div></article><article><span>2</span><div><strong>Let EON check it</strong><p>No ports or CORS settings are required in the normal setup. EON checks only the approved local image connection after this tap.</p><button type="button" class="eon-hub-primary" data-comfy-scan ${media.busy ? 'disabled' : ''}>${media.busy === 'scan' ? 'Checking local images…' : capabilities?.ok ? 'Recheck local images' : 'Set up local images'}</button></div></article><article><span>3</span><div><strong>${capabilities?.imageReady ? 'Image model ready' : needsStarterPack ? 'One starter model can make images ready' : 'EON will check the image model'}</strong><p>${escapeHtml(capabilities?.message || 'EON will look only at models already available in the approved local image engine.')}</p>${capabilities?.devices?.length ? `<p class="local-ai-disclosure">${escapeHtml(vramLabel(capabilities.devices))}</p>` : ''}${setupAssist}${media.starterPackStatus ? `<p class="local-ai-result">${escapeHtml(media.starterPackStatus)}</p>` : ''}</div></article></div>
    <div class="local-ai-comfy-workspace"><div class="local-ai-comfy-form">${modelSelect}<p class="local-ai-disclosure">Selected family: ${escapeHtml(checkpointTruth.family)}. ${escapeHtml(checkpointTruth.reason)}</p><label>Describe your image<textarea data-comfy-prompt rows="5" maxlength="1200" placeholder="Describe the scene, subject, mood and style">${escapeHtml(media.prompt)}</textarea></label><details><summary>Negative prompt and proof boundaries</summary><label>Things to avoid<textarea data-comfy-negative rows="3" maxlength="800">${escapeHtml(media.negativePrompt)}</textarea></label><p class="local-ai-disclosure">The first proof is fixed at 512×512, 12 steps, batch 1. Reference images, inpaint, outpaint and upscale remain unavailable until separate allowlisted workflows and real evidence exist. No model install, LAN scan, public endpoint, hidden cloud fallback or prompt upload is performed by this Image Lab.</p></details>${renderCreatorControls(media)}<div class="local-ai-actions"><button type="button" class="eon-hub-primary" data-comfy-generate ${canGenerate ? '' : 'disabled'}>${running ? 'Creating locally…' : media.digestMatched ? 'Create another local image' : 'Create first local image'}</button>${running ? '<button type="button" class="local-ai-secondary" data-comfy-cancel>Cancel local job</button>' : ''}<button type="button" class="local-ai-secondary is-quiet" data-comfy-clear ${media.busy ? 'disabled' : ''}>Reset image setup</button></div><p class="local-ai-job-state">Job state: <strong>${escapeHtml(media.jobState || 'idle')}</strong></p><p class="local-ai-result" data-comfy-status aria-live="polite">${escapeHtml(media.status || 'Tap Set up local images. EON will tell you only the next action needed.')}</p><details class="local-ai-media-advanced"><summary>Advanced image connection</summary><label>Approved local ComfyUI endpoint<input data-comfy-endpoint value="${escapeHtml(media.endpoint)}" inputmode="url" autocomplete="off" spellcheck="false" /></label><p class="local-ai-disclosure">Normally leave this unchanged. EON Local Companion handles the protected browser-to-local boundary when direct access is blocked.</p></details>${renderHistory(media)}</div>${renderOutput(media)}</div>
    <aside class="local-ai-video-boundary"><strong>Video is checked separately</strong><p>A working image setup does not imply local video is ready. EON enables video only after its own model, workflow, device and real-output checks pass. No video task is submitted from the Image Lab.</p></aside>
  </section>`;
}

function addHistory(media, inspection, status) {
  media.history = [{
    dimensions: `${inspection?.width || 512}×${inspection?.height || 512}`,
    status,
    recordedAt: new Date().toLocaleString()
  }, ...(Array.isArray(media.history) ? media.history : [])].slice(0, MAX_SESSION_HISTORY);
}

function buildReceipt(media) {
  const recipe = media.lastRecipe || resolveComfyUiImageRecipe({ checkpoint: media.checkpoint, devices: media.capabilities?.devices || [], proofMode: true });
  const checkpoint = classifyComfyUiCheckpoint(media.checkpoint);
  return buildLocalImageProofReceipt({
    sourceRevisionOrZipSha256: SOURCE_ZIP_SHA256,
    eonappOrigin: globalThis.location?.origin || '',
    comfyEndpoint: media.endpoint,
    runtimeReached: media.capabilities?.ok === true,
    checkpointCount: media.capabilities?.checkpoints?.length || 0,
    checkpointFamily: checkpoint.family,
    workflowId: recipe.workflowId,
    profileId: recipe.profileId,
    width: recipe.width,
    height: recipe.height,
    steps: recipe.steps,
    standardNodesOnly: recipe.standardNodesOnly,
    generated: Boolean(media.output),
    historyCompleted: Boolean(media.historyCompleted),
    fetched: Boolean(media.outputBlob),
    previewed: Boolean(media.outputObjectUrl),
    saveInitiated: media.saveInitiated,
    reopened: media.reopened,
    digestMatched: media.digestMatched,
    outputSha256: media.generatedDigest,
    savedOutputBytes: media.reopenedInspection?.bytes || 0,
    savedOutputWidth: media.reopenedInspection?.width || 0,
    savedOutputHeight: media.reopenedInspection?.height || 0,
    cancellationAttempted: media.cancellationAttempted,
    negativeLanes: media.negativeLanes || {},
    openBlockers: ['Owner-runtime negative-lane evidence remains pending until executed on the real ComfyUI machine.']
  });
}

export function bindComfyUiImageLab(root, state = {}, { rerender = () => {} } = {}) {
  const media = ensureMediaState(state);
  const endpointInput = root?.querySelector?.('[data-comfy-endpoint]');
  const promptInput = root?.querySelector?.('[data-comfy-prompt]');
  const negativeInput = root?.querySelector?.('[data-comfy-negative]');
  const checkpointSelect = root?.querySelector?.('[data-comfy-checkpoint]');
  endpointInput?.addEventListener('input', () => { media.endpoint = endpointInput.value; });
  promptInput?.addEventListener('input', () => { media.prompt = promptInput.value; });
  negativeInput?.addEventListener('input', () => { media.negativePrompt = negativeInput.value; });
  checkpointSelect?.addEventListener('change', () => { media.checkpoint = checkpointSelect.value; media.selfTestPassed = false; media.digestMatched = false; media.reopenedFile = null; rerender(); });
  root?.querySelector?.('[data-comfy-aspect]')?.addEventListener('change', (event) => { media.aspectId = event.target.value; media.proofMode = false; rerender(); });
  root?.querySelector?.('[data-comfy-quality]')?.addEventListener('change', (event) => { media.qualityId = event.target.value; media.proofMode = false; rerender(); });
  root?.querySelector?.('[data-comfy-seed]')?.addEventListener('input', (event) => { media.seed = event.target.value; media.proofMode = false; });

  async function runImageSetupScan() {
    media.endpoint = endpointInput?.value || media.endpoint;
    media.busy = 'scan';
    media.jobState = 'scanning';
    media.status = 'Checking the approved local image engine…';
    media.starterPackStatus = '';
    rerender();
    let result = await discoverComfyUiCapabilities({ endpoint: media.endpoint });
    if (!result.ok && readEonLocalBridgeSession()) {
      media.status = 'The image engine is not responding yet. EON Local Companion is trying to open installed ComfyUI…';
      rerender();
      const started = await startEonLocalCompanionRuntime('comfyui');
      if (started.ok) {
        await new Promise((resolve) => setTimeout(resolve, 2200));
        result = await discoverComfyUiCapabilities({ endpoint: media.endpoint });
      }
    }
    media.capabilities = result;
    media.busy = '';
    media.companionRecommended = !result.ok && !readEonLocalBridgeSession();
    media.jobState = result.ok ? 'runtime-found' : 'runtime-unavailable';
    media.status = result.ok
      ? result.message
      : `${result.message || 'Local image engine was not ready.'} ${readEonLocalBridgeSession()
        ? 'If ComfyUI is installed but did not open, open it once and tap Set up local images again.'
        : 'Connect EON Local Companion and EON will retry through the protected local path; no port or CORS editing is needed.'}`;
    if (result.ok) {
      media.companionRecommended = false;
      media.endpoint = result.endpoint;
      media.checkpoint = media.checkpoint && result.checkpoints.includes(media.checkpoint) ? media.checkpoint : result.recommendedCheckpoint;
      media.selfTestPassed = false;
      media.digestMatched = false; media.reopenedFile = null;
      saveComfyUiMediaStatus({ endpoint: result.endpoint, checkpoint: media.checkpoint, imageReady: result.imageReady, selfTestPassed: false });
      if (!result.checkpoints.length) {
        const pack = chooseEonLocalImageStarterPack({ vramGb: reportedVramGb(result.devices || []) });
        media.starterPackStatus = pack
          ? (readEonLocalBridgeSession()
            ? `ComfyUI is ready, but it needs one image model. EON can install the reviewed ${pack.label} after your approval.`
            : 'ComfyUI is ready, but it needs one image model. Connect EON Local Companion to install the reviewed starter without manual folders or commands.')
          : 'ComfyUI is reachable, but this device is outside EON’s reviewed starter-image envelope. EON will not start a large model download on an unverified device.';
      }
    }
    rerender();
    return result;
  }

  root?.querySelector?.('[data-comfy-scan]')?.addEventListener('click', runImageSetupScan);
  root?.querySelector?.('[data-comfy-acquire]')?.addEventListener('click', () => {
    media.jobState = 'image-engine-installer-opened';
    media.status = 'Install ComfyUI from the official installer, then return here. EON will check local images automatically.';
    const resume = () => {
      globalThis.setTimeout?.(() => { if (!media.busy) void runImageSetupScan(); }, 1500);
    };
    globalThis.addEventListener?.('focus', resume, { once: true });
  });

  root?.querySelector?.('[data-comfy-connect]')?.addEventListener('click', async () => {
    let approvalWindow = null;
    try { approvalWindow = globalThis.open?.('about:blank', 'eon-local-companion-approval', 'popup,width=520,height=660') || null; } catch {}
    if (!approvalWindow) {
      media.status = 'Your browser blocked the Local Companion approval window. Allow this one EONAPP popup and tap Connect Local Companion again.';
      rerender();
      return;
    }
    media.busy = 'pair';
    media.jobState = 'awaiting-local-approval';
    media.status = 'Approve EONAPP in the Local Companion window. No pairing code is needed.';
    rerender();
    const paired = await pairEonLocalCompanionWithApproval({ approvalWindow });
    media.busy = '';
    if (!paired.ok) {
      media.jobState = 'companion-not-connected';
      media.status = paired.message || 'EON Local Companion did not connect. Open or install the Companion, then try again.';
      rerender();
      return;
    }
    media.jobState = 'companion-connected';
    media.status = 'Local Companion connected. EON is checking images again…';
    rerender();
    await runImageSetupScan();
  });

  root?.querySelector?.('[data-comfy-install-starter]')?.addEventListener('click', async () => {
    const pack = chooseEonLocalImageStarterPack({ vramGb: reportedVramGb(media.capabilities?.devices || []) });
    if (!pack) {
      media.starterPackStatus = 'This device is outside EON’s reviewed starter-image envelope. No model was downloaded.';
      rerender();
      return;
    }
    media.starterPackBusy = true;
    media.busy = 'starter-pack';
    media.jobState = 'starter-model-download';
    media.starterPackStatus = `Starting the reviewed ${pack.label} download…`;
    rerender();
    const started = await installEonLocalAiReviewedModelPack(pack.id);
    if (!started.ok) {
      media.starterPackBusy = false;
      media.busy = '';
      media.jobState = 'starter-model-not-started';
      media.starterPackStatus = started.error === 'runtime-command-not-found'
        ? 'This ComfyUI installation cannot accept EON’s automatic starter download. Open ComfyUI once and use its built-in first Image Generation setup, then tap Recheck local images.'
        : (started.message || 'The reviewed image starter download could not start. Your existing setup was not changed.');
      rerender();
      return;
    }
    const finished = await awaitEonLocalAiReviewedModelPack(started.jobId, {
      onProgress: ({ status }) => {
        media.starterPackStatus = status === 'downloading'
          ? `Downloading ${pack.label} locally… You can keep this page open.`
          : `Preparing ${pack.label}…`;
        rerender();
      }
    });
    media.starterPackBusy = false;
    media.busy = '';
    if (!finished.ok) {
      media.jobState = 'starter-model-download-failed';
      media.starterPackStatus = ['runtime-command-not-found', 'comfyui-workspace-unresolved'].includes(finished.error)
        ? 'EON could not safely identify this ComfyUI model folder. Open ComfyUI’s first Image Generation template once, approve its built-in model download, then tap Recheck local images. You do not need to edit ports or CORS.'
        : (finished.message || 'The image starter download did not complete. No other local AI settings were changed.');
      rerender();
      return;
    }
    media.jobState = 'starter-model-downloaded';
    media.starterPackStatus = 'Image starter downloaded. EON is checking ComfyUI again…';
    rerender();
    await new Promise((resolve) => setTimeout(resolve, 900));
    await runImageSetupScan();
  });

  root?.querySelector?.('[data-comfy-generate]')?.addEventListener('click', async () => {
    media.endpoint = endpointInput?.value || media.endpoint;
    media.prompt = promptInput?.value || media.prompt;
    media.negativePrompt = negativeInput?.value || media.negativePrompt;
    media.checkpoint = checkpointSelect?.value || media.checkpoint;

    const admission = await acquireLocalMediaWorkload('image', {
      source: 'comfyui-image-lab',
      label: 'Local ComfyUI image generation',
      confirmPauseCity: async () => globalThis.confirm?.('Local image generation can use the same GPU as EON City. Pause City while this image is created? City will resume automatically when this workload finishes unless you manually paused it.') === true
    });
    if (!admission.ok) {
      media.jobState = admission.cancelled ? 'cancelled-before-submit' : 'waiting-for-device-capacity';
      media.status = admission.cancelled
        ? 'Local image generation was cancelled before any ComfyUI job started. City was not changed.'
        : 'This device is busy with another protected workload. Finish or cancel that work, then try the image again.';
      rerender();
      return;
    }

    media.busy = 'generate';
    media.jobState = 'submitting';
    media.activePromptId = '';
    media.abortController = new AbortController();
    media.status = admission.cityPauseApproved
      ? 'City is paused by your approval. Submitting one allowlisted image workflow to the local runtime…'
      : 'Submitting one allowlisted image workflow to your local runtime…';
    media.output = null;
    media.outputBlob = null;
    media.outputInspection = null;
    media.generatedDigest = '';
    media.saveInitiated = false;
    media.reopened = false;
    media.digestMatched = false; media.reopenedFile = null;
    media.historyCompleted = false;
    revokeMediaUrls(media);
    rerender();

    try {
      const proofMode = !media.selfTestPassed || media.proofMode;
      const result = await generateComfyUiImage({
        endpoint: media.endpoint,
        checkpoint: media.checkpoint,
        prompt: media.prompt,
        negativePrompt: media.negativePrompt,
        proofMode,
        aspectId: media.aspectId,
        qualityId: media.qualityId,
        seed: media.seed,
        devices: media.capabilities?.devices || [],
        explicitUserAction: true,
        signal: media.abortController.signal,
        onState: ({ state: nextState, promptId }) => {
          media.jobState = nextState || media.jobState;
          if (promptId) media.activePromptId = promptId;
          media.status = nextState === 'queued' ? 'The local image is queued in ComfyUI…' : nextState === 'running' ? 'ComfyUI is generating the image locally…' : media.status;
          rerender();
        }
      });
      media.lastRecipe = result.recipe || null;
      media.historyCompleted = result.historyCompleted === true;
      media.status = result.message;
      media.jobState = result.cancelled ? 'cancelled' : result.ok ? 'fetching-output' : (result.error === 'comfyui-job-timeout' ? 'timeout' : 'failed');
      if (result.ok && result.outputs?.[0]) {
        const output = result.outputs[0];
        const fetched = await fetchComfyUiOutputBlob(output);
        if (fetched.ok) {
          const inspected = await inspectLocalImageBlob(fetched.blob, { filename: fetched.filename });
          media.output = output;
          media.outputBlob = fetched.blob;
          media.outputInspection = inspected.ok ? inspected : null;
          media.generatedDigest = inspected.sha256 || '';
          media.outputObjectUrl = URL.createObjectURL(fetched.blob);
          media.jobState = 'preview-ready-save-and-reopen-required';
          media.status = 'Image generated, fetched and previewed in EONAPP. Save it, then reopen the saved file to complete the positive path.';
          addHistory(media, inspected, 'previewed · reopen pending');
          saveComfyUiMediaStatus({ endpoint: media.endpoint, checkpoint: media.checkpoint, imageReady: true, selfTestPassed: false, outputFilename: output.filename });
        } else {
          media.jobState = 'output-fetch-failed';
          media.status = `${result.message} EONAPP could not read the image bytes back from ComfyUI.`;
        }
      }
    } catch (error) {
      media.jobState = media.abortController?.signal?.aborted ? 'cancelled' : 'failed';
      media.status = media.abortController?.signal?.aborted
        ? 'The local image job was cancelled.'
        : `The protected local image job stopped safely: ${String(error?.message || 'unknown local error').slice(0, 180)}.`;
    } finally {
      media.abortController = null;
      media.busy = '';
      releaseLocalMediaWorkload(admission, media.jobState || 'completed');
      rerender();
    }
  });
  root?.querySelector?.('[data-comfy-cancel]')?.addEventListener('click', async () => {
    media.cancellationAttempted = true;
    media.jobState = 'cancelling';
    media.status = 'Stopping EONAPP waiting and asking ComfyUI to cancel the identified local job…';
    rerender();
    const result = await cancelComfyUiJob({ endpoint: media.endpoint, promptId: media.activePromptId, explicitUserAction: true });
    media.abortController?.abort?.();
    media.busy = '';
    media.jobState = result.ok ? 'cancelled' : 'cancel-unconfirmed';
    media.status = result.message;
    rerender();
  });

  root?.querySelector?.('[data-comfy-save]')?.addEventListener('click', async () => {
    const result = await saveLocalImageBlob(media.outputBlob, media.output?.filename || 'eonapp-local-image.png');
    media.saveInitiated = result.ok === true;
    media.status = result.message;
    media.jobState = result.ok ? 'saved-reopen-required' : 'save-not-completed';
    rerender();
  });

  const reopenInput = root?.querySelector?.('[data-comfy-reopen-file]');
  root?.querySelector?.('[data-comfy-reopen]')?.addEventListener('click', () => reopenInput?.click?.());
  reopenInput?.addEventListener('change', async () => {
    const file = reopenInput.files?.[0];
    if (!file) return;
    const result = await reopenLocalImageFile(file, { expectedSha256: media.generatedDigest });
    media.reopened = result.ok === true;
    media.digestMatched = result.verifiedReopen === true;
    media.reopenedFile = media.digestMatched ? file : null;
    media.reopenedInspection = result.ok ? result : null;
    if (result.objectUrl) {
      if (media.reopenedObjectUrl) try { URL.revokeObjectURL(media.reopenedObjectUrl); } catch {}
      media.reopenedObjectUrl = result.objectUrl;
    }
    media.selfTestPassed = media.digestMatched;
    media.status = result.message;
    media.jobState = media.digestMatched ? 'positive-path-verified' : 'reopen-mismatch';
    if (media.digestMatched) {
      addHistory(media, result, 'saved + reopened + digest matched');
      saveComfyUiMediaStatus({ endpoint: media.endpoint, checkpoint: media.checkpoint, imageReady: true, selfTestPassed: true, outputFilename: media.output?.filename || result.filename });
      recordEonCoreOutcome({
        kind: 'creator-image-verified', route: currentCreatorOutcomeRoute(), source: 'comfyui-image-lab',
        receiptId: `image:${result.sha256 || media.generatedDigest || Date.now()}`, verified: true
      });
    }
    reopenInput.value = '';
    rerender();
  });

  root?.querySelector?.('[data-comfy-receipt]')?.addEventListener('click', () => {
    const result = downloadLocalImageProofReceipt(buildReceipt(media));
    media.status = result.ok ? 'Redacted local-image verification receipt downloaded. Any checks not yet run remain pending.' : 'This browser could not download the proof receipt.';
    rerender();
  });

  root?.querySelector?.('[data-comfy-variation]')?.addEventListener('click', () => {
    if (!media.outputBlob) return;
    const nextIndex = (Number(media.variationIndex) || 0) + 1;
    const plan = buildCreatorVariationPrompt({ mediaKind: 'image', prompt: media.prompt, iteration: nextIndex, maxChars: 1200 });
    if (!plan.ok) { media.status = `Variation could not be prepared: ${plan.reason}.`; rerender(); return; }
    media.variationIndex = nextIndex;
    media.prompt = plan.prompt;
    media.seed = '';
    media.proofMode = false;
    media.status = `Variation ${nextIndex} prepared locally. Review/edit the prompt, then press Create another local image separately. No ComfyUI job started.`;
    rerender();
  });

  root?.querySelector?.('[data-comfy-share]')?.addEventListener('click', async () => {
    const result = await shareEonLocalMedia({
      file: media.reopenedFile,
      title: 'Made with EONAPP',
      text: 'I created and verified this image locally with EONAPP.',
      url: globalThis.location?.origin ? `${globalThis.location.origin}/` : ''
    }, { userGesture: true });
    media.status = result.ok ? 'Your device share menu opened. EONAPP does not claim the image was posted.' : (result.reason === 'native-share-unavailable' ? 'Native file sharing is unavailable here. Keep the image and use Share Command Center for a public-safe caption/link.' : `Share unavailable: ${result.reason || 'unknown'}`);
    rerender();
  });

  root?.querySelector?.('[data-comfy-clear]')?.addEventListener('click', () => {
    media.abortController?.abort?.();
    revokeMediaUrls(media);
    clearComfyUiMediaStatus();
    state.comfy = null;
    rerender();
  });
}
