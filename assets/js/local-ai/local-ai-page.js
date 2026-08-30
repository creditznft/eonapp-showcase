import {
  clearLocalRuntimeStatus,
  discoverLocalRuntimeModels,
  markLocalRuntimeAsChatRuntime,
  readLocalRuntimeChatSettings,
  readLocalRuntimeStatus,
  runLocalRuntimeSelfTest,
  unmarkLocalRuntimeChatRuntime
} from './local-runtime-status.js';
import { buildOllamaPullCommand, findLocalAiStarterProfile, findPreferredDiscoveredLocalModel, getLocalAiStarterCatalog } from './local-ai-catalog.js';
import { buildLocalModelLifecycleState } from './eon-local-model-lifecycle.js';
import { buildLocalAiDeviceSafetyGuidance, detectLocalAiCapabilityProfile } from '../utils/local-ai-capability-matrix.js';
import { renderCreatorMediaCatalog } from './creator-media-catalog.js';
import { bindComfyUiImageLab, renderComfyUiImageLab } from './comfyui-image-lab.js';
import { bindComfyUiVideoLab, renderComfyUiVideoLab } from './comfyui-video-lab.js';
import { renderLocalAiBeginnerSetupGuide } from './local-ai-setup-guide.js';
import { buildLocalAiSetupGuide } from '../../../config/local-ai-setup-guide-contract.mjs';
import { dismissCityBeginnerMission, readCityBeginnerMissionFromSearch, recordCityLocalAiSelfTestOutcome, returnCityBeginnerMission } from '../contracts/city/city-work-mission.js';
import { bindCityModeLinkTracking, enterCityMode } from '../contracts/city/city-mode-transition.js';
import { getLocalAiRuntimeContract, getLocalAiRuntimeTruth } from '../../../config/local-ai-browser-contract.mjs';
import { buildLocalCreatorMediaProfilePlan } from './eon-local-creator-media-profiles.js';
import { exportEonAiMemorySnapshot, forgetEonAiMemory, forgetEonAiMemoryCard, getEonAiMemoryStats, listEonAiMemory, rememberEonAiMemory, updateEonAiMemoryCard } from '../ai-kernel/eon-ai-memory-ledger.js';
import { readEonAiMemoryPolicy, writeEonAiMemoryPolicy } from '../ai-kernel/eon-ai-memory-policy.js';
import { clearEonClientResearchSources, fetchEonClientResearchSource, listEonClientResearchSources, queueEonClientResearchForNextTurn, removeEonClientResearchSource, saveEonClientResearchSource } from '../ai-kernel/eon-client-research-ledger.js';
import { renderLockedFeatureSurface } from '../referrals/eon-locked-feature-surface.js';
import { renderEonPremiumCapabilityPreview } from '../capabilities/eon-premium-preview-surface.js';
import { recordEonCoreOutcome } from '../contracts/outcomes/eon-core-outcome-authority.js';
import { awaitEonLocalAiReviewedModelPack, detectEonLocalBridge, forgetEonLocalCompanionTrustedBrowser, installEonLocalAiReviewedModelPack, pairEonLocalBridge, pairEonLocalCompanionWithApproval, readEonLocalBridgeSession } from './eon-local-bridge-client.js';
import { clearAllLocalConnectionSessions, getLocalRuntimeSessionCredentialMetadata } from './eon-local-connection-authority.js';
import { buildLocalAiConsumerPlan, LOCAL_AI_LITE_TIERS } from '../../../config/local-ai-consumer-experience-contract.mjs';
import { benchmarkBrowserLocalLiteDevice, bindBrowserLocalLiteLifecycle, deleteBrowserLocalLiteCachedModel, getBrowserLocalLiteCapability, readBrowserLocalLiteLifecycleSnapshot, readBrowserLocalLiteReceipt } from './browser-local-lite.js';
import { runLocalAiConsumerSetup } from './local-ai-consumer-setup.js';
import { bindSponsoredDiscoveryPanel, renderSponsoredDiscoveryPanel } from '../sponsored-discovery/eon-sponsored-discovery.js';

const root = document.querySelector('#local-ai-root');
const state = {
  device: null,
  status: readLocalRuntimeStatus(),
  busy: false,
  scanning: {},
  actionStatus: {},
  discoveries: {},
  drafts: {},
  setupGoal: 'private-chat',
  setupRuntimeId: '',
  mediaVramGb: 0,
  memoryStatus: '',
  memoryEditingId: '',
  memoryDraftContent: '',
  memoryDraftKind: 'preference',
  memoryDraftProjectId: '',
  researchStatus: '',
  comfy: null,
  video: null,
  bridge: { paired: Boolean(readEonLocalBridgeSession()), checked: false, available: false, message: '' },
  consumer: { busy: false, phase: '', message: '', action: '', approvalRequired: false, approximateWeightMb: 0, modelPack: null, readyPath: '', browserLiteTier: 'auto' },
  sponsoredDiscovery: { query: '', category: 'general', review: null, answer: '', meta: {}, message: '', busy: false, completed: false, signInRequired: false }
};

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function deviceProfile() {
  const capability = detectLocalAiCapabilityProfile();
  const memoryGb = Number(capability.memoryGB || navigator.deviceMemory || 0) || 0;
  const cores = Number(capability.cpuCores || navigator.hardwareConcurrency || 0) || 0;
  const compact = Math.min(window.innerWidth || 1280, window.innerHeight || 720) < 680 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '');
  const reducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const recommendation = compact || capability.computeClass === 'mobile'
    ? 'Start with Local Lite on this phone or compact browser. No desktop AI app is required for basic private Chat.'
    : memoryGb && memoryGb <= 4
      ? 'Start with Local Lite or a very small installed runtime. EON will test the safest available option before selecting it.'
      : memoryGb >= 16 || cores >= 12
        ? 'This device may suit a compact or medium local model. Start compact, scan installed models, and run the self-test.'
        : 'Start with Local Lite, or let EON reuse a compact model from a supported runtime already installed on this computer.';
  return { ...capability, memoryGb, cores, compact, reducedMotion, recommendation };
}

function cityLocalAiMission() {
  const result = readCityBeginnerMissionFromSearch(globalThis.location?.search || '');
  if (!result.ok || !result.receipt || result.receipt.destination !== '/local-ai' || result.receipt.missionId !== 'local-ai-self-test' || result.receipt.state === 'dismissed') return null;
  return result.receipt;
}

function renderCityLocalAiMission() {
  const mission = cityLocalAiMission();
  if (!mission) return '';
  const returnHref = `${mission.returnRoute}?cityMission=${encodeURIComponent(mission.id)}`;
  const completed = mission.state === 'completed';
  const passed = mission.outcome === 'local-ai-self-test-passed';
  const outcomeText = passed
    ? 'A device-local self-test passed after your explicit tap. This does not automatically select the runtime for EONBOT.'
    : 'The local self-test did not pass. This is a truthful outcome, not a failure of your City progress; no runtime was selected for EONBOT.';
  if (completed) {
    return `<section class="local-ai-city-mission" data-city-local-ai-mission-id="${escapeHtml(mission.id)}" aria-labelledby="local-ai-city-mission-title"><div><p class="local-ai-eyebrow">City mission · local outcome recorded</p><h2 id="local-ai-city-mission-title">${escapeHtml(mission.missionLabel)}</h2><p>${escapeHtml(outcomeText)}</p></div><div class="local-ai-actions"><a class="local-ai-secondary" href="${escapeHtml(returnHref)}" data-city-local-ai-return="${escapeHtml(mission.id)}">Return to City Play</a></div></section>`;
  }
  return `<section class="local-ai-city-mission" data-city-local-ai-mission-id="${escapeHtml(mission.id)}" aria-labelledby="local-ai-city-mission-title"><div><p class="local-ai-eyebrow">City mission · choose your device check</p><h2 id="local-ai-city-mission-title">${escapeHtml(mission.missionLabel)}</h2><p>${escapeHtml(mission.purpose)} No scan or self-test begins from this card; select a runtime and tap its own controls below.</p></div><div class="local-ai-actions"><a class="local-ai-secondary" href="${escapeHtml(returnHref)}" data-city-local-ai-return="${escapeHtml(mission.id)}">Return to City Play</a><button type="button" class="local-ai-secondary is-quiet" data-city-local-ai-dismiss="${escapeHtml(mission.id)}">Dismiss mission</button></div><p class="local-ai-result" data-city-local-ai-mission-status></p></section>`;
}

function renderDeviceSafetyGuidance(profile) {
  const guidance = buildLocalAiDeviceSafetyGuidance(profile);
  return `<section class="local-ai-device-card" data-local-device-safety aria-labelledby="local-ai-device-safety-title"><h2 id="local-ai-device-safety-title">Device health and support limits</h2><p>EONAPP cannot safely infer all physical conditions from this browser. This guidance stays on this device and does not start a runtime, download a model, or send hardware details anywhere.</p><ul>${guidance.guidance.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul><p class="local-ai-disclosure">Suggested path: ${escapeHtml(guidance.route.replaceAll('-', ' '))}. This is not a performance guarantee or proof that a model will run well.</p></section>`;
}

function profileSummary(profile) {
  const rows = [];
  rows.push(profile.memoryGb ? `${profile.memoryGb} GB browser-reported memory` : 'Browser did not report device memory');
  rows.push(profile.cores ? `${profile.cores} logical CPU cores` : 'Browser did not report CPU cores');
  rows.push(profile.compact ? 'compact/mobile layout' : 'desktop layout');
  if (profile.gpuRenderer && profile.gpuRenderer !== 'Unknown') rows.push(profile.gpuRenderer.slice(0, 72));
  if (profile.reducedMotion) rows.push('reduced motion enabled');
  return rows.join(' · ');
}

function draftFor(id, fallback = {}) {
  return state.drafts[id] || fallback;
}

function renderLocalModelLifecycle({ id, label, draft, discovery, existing }) {
  const lifecycle = buildLocalModelLifecycleState({
    runtimeId: id,
    runtimeName: label,
    models: discovery?.models || [],
    selectedModel: draft?.model || existing?.model || '',
    device: state.device || deviceProfile(),
    scannedAt: discovery?.scannedAt || 0
  });
  const freshness = discovery?.scannedAt
    ? lifecycle.refreshRecommended
      ? 'Installed-model view may be stale — tap Scan installed models to refresh it.'
      : 'Installed-model view is fresh for this session.'
    : 'No installed-model scan has run in this page session.';
  const preferred = lifecycle.preferredInstalledModel
    ? `<strong>Reviewed installed candidate:</strong> <code>${escapeHtml(lifecycle.preferredInstalledModel)}</code>. `
    : '';
  const install = lifecycle.installHandoff
    ? lifecycle.installHandoff.kind === 'copy-command'
      ? `<button type="button" class="local-ai-secondary is-quiet" data-local-copy-lifecycle-install="${escapeHtml(id)}" data-local-install-command="${escapeHtml(lifecycle.installHandoff.command)}">Copy reviewed install command</button>`
      : `<a class="local-ai-secondary is-quiet" href="${escapeHtml(lifecycle.installHandoff.officialUrl)}" target="_blank" rel="noreferrer noopener">Open official model manager</a>`
    : '';
  return `<div class="local-ai-lifecycle is-${escapeHtml(lifecycle.state)}" data-local-model-lifecycle="${escapeHtml(id)}"><p>${preferred}${escapeHtml(lifecycle.message)}</p><p class="local-ai-disclosure">${escapeHtml(freshness)} This Advanced notice never downloads a model or changes your Chat runtime by itself. The main setup action may run bounded checks only after you tap it.</p>${install ? `<div class="local-ai-actions">${install}</div>` : ''}</div>`;
}

function runtimeCard({ id, label, endpoint, modelPlaceholder, description }) {
  const existing = state.status?.runtimeId === id ? state.status : null;
  const draft = draftFor(id, { endpoint: existing?.endpoint || endpoint, model: existing?.model || '' });
  const discovery = state.discoveries[id];
  const actionStatus = state.actionStatus[id] || '';
  const credential = getLocalRuntimeSessionCredentialMetadata(id);
  const models = discovery?.models || [];
  const selector = models.length
    ? `<label>Installed model<select data-local-installed-model><option value="">Choose from ${models.length} installed model${models.length === 1 ? '' : 's'}</option>${models.map((row) => `<option value="${escapeHtml(row.model)}"${row.model === draft.model ? ' selected' : ''}>${escapeHtml(row.model)}${row.sizeBytes ? ` · ${(row.sizeBytes / (1024 ** 3)).toFixed(1)} GB` : ''}</option>`).join('')}</select></label>`
    : '';
  const credentialField = id === 'ollama' ? '' : `<label>Runtime credential (optional, this tab only)<input data-local-credential type="password" value="" maxlength="512" autocomplete="off" spellcheck="false" placeholder="Bearer token only when your local server requires it" /></label><p class="local-ai-runtime-note">${credential ? `A session-only ${escapeHtml(credential.scheme)} credential is active. It is excluded from proof, backup and Chat history.` : 'Leave blank when the runtime has no authentication. Any value entered here exists only for this browser session.'}</p>`;
  const discoveredText = discovery
    ? escapeHtml(discovery.message || (discovery.ok ? 'Local scan complete.' : 'Local scan did not complete.'))
    : 'Scan only checks this runtime’s approved loopback endpoint after you tap the button. It does not contact a model cloud or download anything.';
  const stateLabel = existing?.localityState === 'offline-proven' ? 'offline locality proven' : existing?.ok ? 'loopback verified · offline proof pending' : 'device loopback only';
  return `<article id="local-ai-${escapeHtml(id)}" class="local-ai-runtime-card" data-runtime-card="${escapeHtml(id)}">
    <div class="local-ai-runtime-head"><div><h2>${escapeHtml(label)}</h2><p>${escapeHtml(description)}</p></div><span class="local-ai-chip">${escapeHtml(stateLabel)}</span></div>
    <label>Device-local endpoint<input data-local-endpoint value="${escapeHtml(draft.endpoint || endpoint)}" inputmode="url" autocomplete="off" spellcheck="false" aria-describedby="${escapeHtml(id)}-endpoint-note" /></label>
    <p id="${escapeHtml(id)}-endpoint-note" class="local-ai-runtime-note">Local mode accepts only this runtime’s approved <code>127.0.0.1</code> or <code>localhost</code> port. Public, LAN and arbitrary loopback endpoints are rejected.</p>
    ${credentialField}
    <label>Selected model<input data-local-model value="${escapeHtml(draft.model || '')}" placeholder="${escapeHtml(modelPlaceholder)}" autocomplete="off" spellcheck="false" /></label>
    ${selector}
    <div class="local-ai-actions"><button type="button" class="local-ai-secondary" data-local-scan="${escapeHtml(label)}" ${state.scanning[id] ? 'disabled' : ''}>${state.scanning[id] ? 'Scanning…' : 'Scan installed models'}</button><button type="button" class="eon-hub-primary" data-local-self-test="${escapeHtml(label)}">Run self-test</button><button type="button" class="local-ai-secondary" data-local-offline-proof="${escapeHtml(label)}">Prove while offline</button><button type="button" class="local-ai-secondary" data-local-use="${escapeHtml(label)}" ${existing?.ok ? '' : 'disabled'}>Use in EONBOT</button><button type="button" class="local-ai-secondary is-quiet" data-local-clear="${escapeHtml(label)}">Disconnect & clear</button></div>
    <p class="local-ai-runtime-note" data-local-discovery="${escapeHtml(id)}">${discoveredText}</p>
    ${renderLocalModelLifecycle({ id, label, draft, discovery, existing })}
    <p class="local-ai-result" data-local-result="${escapeHtml(id)}" aria-live="polite">${actionStatus ? escapeHtml(actionStatus) : existing ? escapeHtml(existing.note || (existing.ok ? 'Self-test passed.' : 'A previous self-test did not pass.')) : 'No local runtime has been verified yet.'}</p>
  </article>`;
}

function starterCatalog(profile) {
  const catalog = getLocalAiStarterCatalog({ device: profile });
  return `<section id="local-ai-instant-setup" class="local-ai-catalog-card" aria-labelledby="local-ai-catalog-title"><div class="local-ai-catalog-head"><div><p class="local-ai-eyebrow">Instant setup, with your approval</p><h2 id="local-ai-catalog-title">Choose a conservative starting profile</h2><p>EONAPP does not maintain a hidden model marketplace. These are reviewed starting profiles; the model list you can actually use comes from the local runtime you scan on this device.</p></div><a class="local-ai-secondary" href="https://ollama.com/library" target="_blank" rel="noreferrer">Open official model library</a></div><div class="local-ai-profile-grid">${catalog.profiles.map((item) => `<article class="local-ai-profile is-${escapeHtml(item.fit.level)}"><div><span class="local-ai-fit">${escapeHtml(item.fit.label)}</span><h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(item.summary)}</p></div><code>${escapeHtml(item.model)}</code><p class="local-ai-profile-work">${item.workloads.map(escapeHtml).join(' · ')}</p><p class="local-ai-profile-reason">${escapeHtml(item.fit.reason)}</p><p class="local-ai-runtime-note">${escapeHtml(item.caution)}</p><div class="local-ai-actions"><button type="button" class="local-ai-secondary" data-local-profile="${escapeHtml(item.id)}">Use this model name</button><button type="button" class="local-ai-secondary is-quiet" data-local-copy-profile="${escapeHtml(item.id)}">Copy pull command</button><a class="local-ai-inline-link" href="${escapeHtml(item.officialUrl)}" target="_blank" rel="noreferrer">Review official details</a></div></article>`).join('')}</div><p class="local-ai-disclosure">Catalogue snapshot: ${escapeHtml(catalog.updatedAt)}. Model families, tags, sizes, licences and hardware needs change. Verify the exact tag in the official library before downloading.</p></section>`;
}

function localRuntimeCardConfig(id, details = {}) {
  const runtime = getLocalAiRuntimeContract(id);
  return {
    id,
    label: runtime?.label || details.label || id,
    endpoint: runtime?.defaultEndpoint || '',
    modelPlaceholder: details.modelPlaceholder || 'the model name shown by your local server',
    description: details.description || 'Scan models exposed by a runtime you started on this device, then self-test a chosen model.'
  };
}

function consumerCapabilityRow(label, capability) {
  const stateLabel = capability?.state === 'ready'
    ? 'Ready'
    : capability?.state === 'not-on-this-device'
      ? 'Desktop only'
      : capability?.state === 'gated'
        ? 'Check required'
        : 'Setup';
  return `<div class="local-ai-consumer-capability is-${escapeHtml(capability?.state || 'setup')}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(stateLabel)}</strong><small>${escapeHtml(capability?.label || '')}</small></div>`;
}

function renderLocalAiConsumerSetup(profile) {
  const liteReceipt = readBrowserLocalLiteReceipt();
  const lite = getBrowserLocalLiteCapability({ knownGoodBalanced: liteReceipt?.tier === 'balanced' });
  const runtimeProof = readLocalRuntimeStatus();
  const companionPaired = Boolean(readEonLocalBridgeSession());
  const plan = buildLocalAiConsumerPlan(profile, {
    verifiedRuntime: runtimeProof,
    browserLiteSupported: lite.supported,
    browserLiteReady: Boolean(liteReceipt?.ok),
    companionAvailable: state.bridge.available === true,
    companionPaired,
    comfyReady: state.comfy?.selfTestPassed === true || state.comfy?.digestMatched === true,
    videoReady: state.video?.digestMatched === true && state.video?.playbackCompleted === true
  });
  const chatReady = plan.capabilities.chat.state === 'ready';
  const consumerAction = String(state.consumer.action || '');
  const primaryLabel = state.consumer.busy
    ? (consumerAction === 'approve-reviewed-model-pack' ? 'Downloading starter model…' : 'Making Local AI ready…')
    : consumerAction === 'approve-companion'
      ? 'Connect Local Companion'
      : consumerAction === 'approve-reviewed-model-pack'
        ? `Download starter model (~${Math.max(1, Number(state.consumer.approximateWeightMb || 0) || 0)} MB)`
        : state.consumer.approvalRequired
          ? `Download Local Lite (~${Math.max(1, Number(state.consumer.approximateWeightMb || 0) || 0)} MB)`
          : chatReady
            ? 'Recheck Local AI'
            : 'Make Local AI ready';
  const installGuide = consumerAction === 'install-local-runtime'
    ? buildLocalAiSetupGuide(profile, { goalId: 'private-chat' })
    : null;
  const recommendedInstaller = installGuide?.primaryRuntime || null;
  const primaryAttr = consumerAction === 'approve-companion'
    ? 'data-local-consumer-connect-companion'
    : consumerAction === 'approve-reviewed-model-pack'
      ? 'data-local-consumer-install-pack'
      : state.consumer.approvalRequired ? 'data-local-consumer-approve' : 'data-local-consumer-start';
  const primaryAction = consumerAction === 'install-local-runtime' && recommendedInstaller?.officialDownloadUrl
    ? `<a class="eon-hub-primary" href="${escapeHtml(recommendedInstaller.officialDownloadUrl)}" target="_blank" rel="noreferrer noopener" data-local-runtime-acquire="${escapeHtml(recommendedInstaller.eonRuntimeId || recommendedInstaller.id)}">Install ${escapeHtml(recommendedInstaller.label)}</a>`
    : consumerAction === 'install-local-runtime'
      ? '<a class="eon-hub-primary" href="#eonbot-local-ai-setup">Choose a local AI app</a>'
      : `<button class="eon-hub-primary" type="button" ${primaryAttr} ${state.consumer.busy ? 'disabled' : ''}>${escapeHtml(primaryLabel)}</button>`;
  const pathLabel = runtimeProof?.ok
    ? `${escapeHtml(runtimeProof.runtime)} · ${escapeHtml(runtimeProof.model)}`
    : liteReceipt?.ok
      ? `EON Local Lite · ${escapeHtml(liteReceipt.backend || 'browser')}`
      : escapeHtml(plan.primaryPath.label);
  const statusMessage = state.consumer.message || (chatReady
    ? `Local Chat is ready through ${pathLabel}. No silent cloud fallback is enabled.`
    : `${plan.reason} EON will reuse supported AI already installed before offering another setup.`);
  const lifecycle = readBrowserLocalLiteLifecycleSnapshot();
  const cacheControl = liteReceipt?.ok ? '<button type="button" class="local-ai-secondary is-quiet" data-local-consumer-remove-lite>Remove Local Lite model cache</button>' : '';
  const benchmarkNote = state.consumer.benchmark?.ok ? `<p class="local-ai-disclosure">Device worker check: ${escapeHtml(state.consumer.benchmark.iterationsPerMs || 0)} bounded iterations/ms · WebGPU ${state.consumer.benchmark.capability?.hasWebGPU ? 'available' : 'not reported'} · WASM SIMD ${state.consumer.benchmark.capability?.wasmSimd ? 'available' : 'not detected'} · WASM threads ${state.consumer.benchmark.capability?.wasmThreads ? 'available' : 'not available in this page context'}.</p>` : '';
  return `<section class="local-ai-consumer-card" data-local-consumer-setup aria-labelledby="local-ai-consumer-title">
    <div class="local-ai-consumer-head"><div><p class="local-ai-eyebrow">Local AI · simple setup</p><h2 id="local-ai-consumer-title">Use Local AI without the technical setup</h2><p>One setup action checks this device, reuses Ollama, LM Studio or Jan when they already work, and offers Local Lite when a small browser model is the better path. Images and video stay separately verified.</p></div><span class="local-ai-chip">${chatReady ? 'chat ready' : 'setup available'}</span></div>
    <div class="local-ai-consumer-capabilities" aria-label="Local AI capability readiness">${consumerCapabilityRow('Chat', plan.capabilities.chat)}${consumerCapabilityRow('Images', plan.capabilities.image)}${consumerCapabilityRow('Video', plan.capabilities.video)}</div>
    <div class="local-ai-consumer-path"><span>Best path on this device</span><strong>${pathLabel}</strong><p>${escapeHtml(statusMessage)}</p></div>
    <label class="local-ai-inline-field">Browser Local Lite quality<select data-browser-lite-tier ${state.consumer.busy ? 'disabled' : ''}><option value="auto"${state.consumer.browserLiteTier === 'auto' ? ' selected' : ''}>Auto — recommended</option><option value="lite"${state.consumer.browserLiteTier === 'lite' ? ' selected' : ''}>${escapeHtml(LOCAL_AI_LITE_TIERS.lite.label)}</option><option value="balanced"${state.consumer.browserLiteTier === 'balanced' ? ' selected' : ''}>${escapeHtml(LOCAL_AI_LITE_TIERS.balanced.label)}</option><option value="strong"${state.consumer.browserLiteTier === 'strong' ? ' selected' : ''}>Strong — manual/reviewed only</option><option value="advanced"${state.consumer.browserLiteTier === 'advanced' ? ' selected' : ''}>Advanced — experimental/manual</option></select></label>
    ${state.consumer.modelPack ? `<p class="local-ai-disclosure"><strong>Reviewed starter:</strong> ${escapeHtml(state.consumer.modelPack.label || '')} · about ${escapeHtml(state.consumer.modelPack.approximateDownloadMb || '')} MB · ${escapeHtml(state.consumer.modelPack.license || '')}. <a href="${escapeHtml(state.consumer.modelPack.sourceUrl || '#')}" target="_blank" rel="noopener noreferrer">Review source</a>. The download starts only after your tap.</p>` : ''}
    <div class="local-ai-actions">${primaryAction}${consumerAction === 'install-local-runtime' ? '<a class="local-ai-secondary" href="#eonbot-local-ai-setup">Other supported apps</a>' : ''}${chatReady ? '<a class="local-ai-secondary" href="/?new=1">Open EONBOT</a>' : ''}${cacheControl}<a class="local-ai-secondary" href="#creator-media">Local images</a><a class="local-ai-secondary" href="/local-ai?creator=video">Local video</a></div>
    ${benchmarkNote}<p class="local-ai-disclosure">Setup may check only approved local endpoints after this tap and self-test a bounded model that fits the device. Local Lite workers are released when this page backgrounds and recreated from browser cache when needed. Current worker: ${lifecycle.workerActive ? 'active' : 'released'}. Software/model downloads and OS permission prompts stay visible. EON never silently switches Local AI to a cloud provider.</p>
  </section>`;
}

function renderLocalAiScopeNotice() {
  const truth = getLocalAiRuntimeTruth();
  return `<section class="local-ai-truth-card" aria-labelledby="local-ai-scope-title"><h2 id="local-ai-scope-title">Local by workload, not by marketing claim</h2><p>Local Chat can use EON Local Lite in the browser or a supported desktop runtime after a passing local self-test. The main setup action handles approved detection so normal users do not need ports or CORS.</p><p>Local image generation uses the bounded ComfyUI adapter through the local connection authority when needed. Local video has its own capability/workflow/output proof and remains disabled until those checks pass. A working text model never unlocks media by implication.</p><p class="local-ai-disclosure">Text runtimes: ${escapeHtml(truth.localTextRuntimeIds.join(', '))}. Media runtimes: ${escapeHtml(truth.localMediaRuntimeIds.join(', '))}. Arbitrary LAN/private-network endpoints remain blocked; cloud fallback remains blocked until you make a new explicit choice.</p></section>`;
}

function renderW605AiQualityPanel(profile) {
  const mediaPlan = buildLocalCreatorMediaProfilePlan({ systemMemoryGb: profile.memoryGb, gpuVramGb: state.mediaVramGb });
  const cards = listEonAiMemory({ limit: 12 });
  const memoryPolicy = readEonAiMemoryPolicy();
  const memoryStats = getEonAiMemoryStats();
  const candidateProfiles = mediaPlan.profiles.filter((row) => row.eligibility === 'candidate' || row.eligibility === 'trial-only');
  const memoryRows = cards.length
    ? `<ul class="local-ai-memory-list">${cards.map((card) => `<li data-eon-memory-row="${escapeHtml(card.id)}"><strong>${escapeHtml(card.kind)}</strong> · ${escapeHtml(card.content)}<br /><span class="local-ai-disclosure">${escapeHtml(card.scope)} · confidence ${escapeHtml(card.confidence.toFixed(2))}${card.expiresAt ? ` · expires ${escapeHtml(new Date(card.expiresAt).toLocaleDateString())}` : ''}</span>${card.tags.length ? ` <span class="local-ai-disclosure">#${escapeHtml(card.tags.join(' #'))}</span>` : ''}<div class="local-ai-actions"><button type="button" class="local-ai-secondary is-quiet" data-eon-memory-edit="${escapeHtml(card.id)}">Edit</button><button type="button" class="local-ai-secondary is-quiet" data-eon-memory-forget="${escapeHtml(card.id)}">Forget</button></div></li>`).join('')}</ul>`
    : '<p class="local-ai-disclosure">No EONBOT memory cards have been saved in this browser.</p>';
  const profileRows = candidateProfiles.length
    ? `<ul>${candidateProfiles.map((row) => `<li><strong>${escapeHtml(row.label)}</strong> · ${escapeHtml(row.eligibility)}<br /><span class="local-ai-disclosure">${escapeHtml(row.reason)}</span></li>`).join('')}</ul>`
    : `<p class="local-ai-disclosure">${escapeHtml(mediaPlan.hardware.reason)}</p>`;
  const liveTextCommand = 'EON_W605_CONFIRM_LIVE=1 EON_W605_TEXT_MODEL="your-installed-model" node scripts/w605-live-ai-output-matrix.mjs --confirm-live';
  const liveMediaCommand = 'EON_W605_CONFIRM_LIVE=1 EON_LOCAL_MEDIA_ALLOW_HIGH_LOAD=1 EON_LOCAL_IMAGE_WORKFLOW_FILE="path/to/exported-comfy-api-workflow.json" node scripts/w605-live-ai-output-matrix.mjs --confirm-live --confirm-high-load';
  const saveLabel = state.memoryEditingId ? 'Save memory edit' : 'Remember in this browser';
  const cancelEdit = state.memoryEditingId ? '<button type="button" class="local-ai-secondary is-quiet" data-eon-memory-edit-cancel>Cancel edit</button>' : '';
  return `<section class="local-ai-truth-card" data-eon-ai-quality aria-labelledby="eon-ai-quality-title"><p class="local-ai-eyebrow">EONBOT knowledge and verification</p><h2 id="eon-ai-quality-title">Make model answers informed without pretending to train them</h2><p>EONBOT adds a versioned EONAPP grounding pack to compatible text-model calls. It includes product truth, capability boundaries, local-media safety, and research rules. This is runtime grounding, not hidden fine-tuning.</p><p><strong>Web research:</strong> research stays client-only. A local model cannot browse merely because EONAPP runs in a browser. Add a permitted public source extract below, or try a browser-direct CORS fetch that the source itself allows. EONAPP never relays the research through Cloudflare, a worker, or a server.</p><div class="local-ai-grid"><article class="local-ai-runtime-card"><h3>EONBOT memory</h3><p>Memory is local, reversible and provider-neutral. Project memories are hard-isolated from other projects. EONAPP never turns raw chat into durable memory or model training.</p><label>Memory behavior<select data-eon-memory-policy><option value="off"${memoryPolicy.mode === 'off' ? ' selected' : ''}>Off — do not inject saved memory</option><option value="ask"${memoryPolicy.mode === 'ask' ? ' selected' : ''}>Ask / manual — recommended</option><option value="safe-auto"${memoryPolicy.mode === 'safe-auto' ? ' selected' : ''}>Safe auto — structured preferences only</option></select></label><p class="local-ai-disclosure">Safe auto applies only to explicit product controls such as a saved project or Creator preference. Arbitrary chat text still requires confirmation.</p><label>Memory type<select data-eon-memory-kind><option value="preference"${state.memoryDraftKind === 'preference' ? ' selected' : ''}>Preference</option><option value="project"${state.memoryDraftKind === 'project' ? ' selected' : ''}>Project</option><option value="creator"${state.memoryDraftKind === 'creator' ? ' selected' : ''}>Creator</option><option value="workflow"${state.memoryDraftKind === 'workflow' ? ' selected' : ''}>Workflow</option><option value="context"${state.memoryDraftKind === 'context' ? ' selected' : ''}>Context (expires)</option><option value="correction"${state.memoryDraftKind === 'correction' ? ' selected' : ''}>Correction</option></select></label><label>Project ID (only for project memory)<input data-eon-memory-project value="${escapeHtml(state.memoryDraftProjectId)}" maxlength="96" placeholder="Example: eonapp-launch" autocomplete="off" /></label><label>What should EONBOT remember?<input data-eon-memory-content value="${escapeHtml(state.memoryDraftContent)}" maxlength="480" placeholder="Example: Prefer concise plans with real test receipts." autocomplete="off" /></label><div class="local-ai-actions"><button type="button" class="eon-hub-primary" data-eon-memory-save>${saveLabel}</button>${cancelEdit}<button type="button" class="local-ai-secondary" data-eon-memory-export>Export memory JSON</button><button type="button" class="local-ai-secondary is-quiet" data-eon-memory-clear>Clear all memory</button></div><p class="local-ai-result" data-eon-memory-status aria-live="polite">${escapeHtml(state.memoryStatus || `${memoryStats.total} active local memory card${memoryStats.total === 1 ? '' : 's'}. Secret-like text is rejected.`)}</p>${memoryRows}</article><article class="local-ai-runtime-card"><h3>Image and video test profiles</h3><p>Browser RAM is not GPU VRAM. Enter VRAM only when you know it from your device specifications or driver.</p><label>Known GPU VRAM in GB (optional)<input data-eon-media-vram type="number" min="0" max="128" step="1" value="${escapeHtml(state.mediaVramGb || '')}" placeholder="For example: 4" /></label><div class="local-ai-actions"><button type="button" class="local-ai-secondary" data-eon-media-plan-refresh>Refresh media plan</button></div><p><strong>${escapeHtml(mediaPlan.hardware.label)}</strong> · ${escapeHtml(mediaPlan.hardware.reason)}</p>${profileRows}<p class="local-ai-disclosure">The Local Image Lab below activates only after a user-triggered ComfyUI scan finds an installed checkpoint. The Local Video Lab stays locked until its workflow/device checks pass; an output counts only after the required save, reopen and playback verification succeeds.</p></article></div><details class="local-ai-runtime-card local-ai-technical-verification"><summary>Technical real-output verification (advanced)</summary><p>This is for owner/developer launch checks, not normal Local AI setup. It runs only after you install a runtime yourself. Image and video require an exported ComfyUI API workflow, a loopback server, and an explicit high-load confirmation. The script saves only a redacted JSON receipt; it does not copy outputs, download models, or post anywhere.</p><div class="local-ai-actions"><button type="button" class="local-ai-secondary" data-eon-copy-w605-text>Copy text verification command</button><button type="button" class="local-ai-secondary" data-eon-copy-w605-media>Copy image/video verification command</button></div><p class="local-ai-result" data-eon-w605-command-status></p><p class="local-ai-disclosure">Text command: <code>${escapeHtml(liveTextCommand)}</code></p><p class="local-ai-disclosure">Media command: <code>${escapeHtml(liveMediaCommand)}</code></p></details></section>`;
}


function renderW606ClientResearchPanel() {
  const sources = listEonClientResearchSources();
  const sourceRows = sources.length
    ? `<ul class="local-ai-memory-list">${sources.map((source) => `<li><strong>${escapeHtml(source.title)}</strong><br /><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.url)}</a><br /><span class="local-ai-disclosure">${escapeHtml(source.method)} · captured ${escapeHtml(source.capturedAt)}</span><br /><span>${escapeHtml(source.excerpt.slice(0, 360))}${source.excerpt.length > 360 ? '…' : ''}</span><br /><button type="button" class="local-ai-secondary is-quiet" data-eon-research-remove="${escapeHtml(source.id)}">Remove source</button></li>`).join('')}</ul>`
    : '<p class="local-ai-disclosure">No research sources are saved in this browser. Nothing will be sent to a model until you deliberately queue sources for one turn.</p>';
  return `<section class="local-ai-truth-card" data-eon-client-research aria-labelledby="eon-client-research-title"><p class="local-ai-eyebrow">W606 · client-only Research Ledger</p><h2 id="eon-client-research-title">Capture sources locally. Send them once, only when you choose.</h2><p>There is no EONAPP research server, Cloudflare Worker, proxy, hidden browser, or server-held API key in this flow. Many sites block browser-readable fetching by CORS; when that happens, open the page yourself and paste a short permitted extract. Only public <code>https</code> sources are accepted. Local/LAN links and secret-like values are blocked.</p><div class="local-ai-grid"><article class="local-ai-runtime-card"><h3>Add a local source</h3><label>Public source URL<input data-eon-research-url inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://publisher.example/article" /></label><label>Source title (optional)<input data-eon-research-title maxlength="180" autocomplete="off" placeholder="Publisher or article title" /></label><label>Permitted extract<textarea data-eon-research-excerpt maxlength="6000" rows="7" placeholder="Paste the relevant public text you are allowed to use. Do not paste credentials or private material."></textarea></label><div class="local-ai-actions"><button type="button" class="eon-hub-primary" data-eon-research-save>Save pasted source locally</button><button type="button" class="local-ai-secondary" data-eon-research-fetch>Try direct browser fetch</button><button type="button" class="local-ai-secondary is-quiet" data-eon-research-clear>Clear all local sources</button></div><p class="local-ai-result" data-eon-research-status aria-live="polite">${escapeHtml(state.researchStatus || 'Nothing is fetched or shared until you explicitly use one of these buttons.')}</p></article><article class="local-ai-runtime-card"><h3>Queue a research packet</h3><p>Saved sources remain local. Queueing places the selected local evidence into the <strong>next</strong> compatible EONBOT request once, with <code>[S1]</code>-style citations. It is then removed from the queue automatically.</p><label>Question for EONBOT<input data-eon-research-query maxlength="1400" autocomplete="off" placeholder="Ask a question about the saved sources" /></label><div class="local-ai-actions"><button type="button" class="local-ai-secondary" data-eon-research-queue ${sources.length ? '' : 'disabled'}>Use saved sources in next EONBOT reply</button><a class="local-ai-secondary" href="/?new=1">Open EONBOT Chat</a></div><p class="local-ai-disclosure">A source packet is not memory, training data, a live browser connection, or permission for EONBOT to take external action.</p></article></div><article class="local-ai-runtime-card"><h3>Saved client-only sources</h3>${sourceRows}</article></section>`;
}

function renderLocalConnectionPanel() {
  const paired = Boolean(readEonLocalBridgeSession());
  const message = state.bridge?.message || (paired
    ? 'EON Local Companion is connected for this browser session and can recover approved local connections that the browser blocks directly.'
    : 'This is an Advanced recovery control. Normal setup checks the easiest approved local path first and only asks for Companion connection when it is actually needed.');
  return `<section class="local-ai-truth-card" data-local-connection-authority aria-labelledby="local-connection-title"><p class="local-ai-eyebrow">Advanced · Local Connection Authority</p><h2 id="local-connection-title">EON Local Companion</h2><p>The Companion is the protected browser-to-local transport for heavier desktop tools. Short-lived bearer sessions stay session-only. After your first local approval, this browser can keep a non-exportable signing key while the Companion remembers only its public key, allowing safe automatic reconnect after restart. It cannot use arbitrary LAN addresses, choose a cloud model, or retry a paid request.</p><div class="local-ai-actions"><button type="button" class="local-ai-secondary" data-local-bridge-detect>Check Local Companion</button><label class="local-ai-inline-field">One-time code<input data-local-bridge-code inputmode="numeric" pattern="[0-9]{6,8}" maxlength="8" autocomplete="off" /></label><button type="button" class="local-ai-secondary" data-local-bridge-pair>Connect this browser</button><button type="button" class="local-ai-secondary is-quiet" data-local-connections-clear>Disconnect now</button><button type="button" class="local-ai-secondary is-quiet" data-local-companion-forget>Forget trusted browser</button></div><p class="local-ai-result" data-local-bridge-status aria-live="polite">${escapeHtml(message)}</p><p class="local-ai-disclosure">Companion state: ${paired ? 'connected with a short-lived local session' : 'not connected right now'}. If this browser was approved before, Check Local Companion can reconnect it automatically. Technical endpoint and recovery-code controls stay here so normal users do not have to understand CORS or local ports.</p></section>`;
}

function render() {
  if (!root) return;
  const profile = state.device || deviceProfile();
  state.device = profile;
  const guideContract = buildLocalAiSetupGuide(profile, { goalId: state.setupGoal });
  const guideRuntimeId = state.setupRuntimeId || guideContract.primaryRuntime?.eonRuntimeId || '';
  const guideDiscovery = guideRuntimeId ? state.discoveries[guideRuntimeId] || null : null;
  const guideRuntimeContract = guideRuntimeId ? getLocalAiRuntimeContract(guideRuntimeId) : null;
  const guideProof = state.status?.runtimeId === guideRuntimeId ? state.status : null;
  const guideDraft = guideRuntimeId ? draftFor(guideRuntimeId, { endpoint: guideProof?.endpoint || guideRuntimeContract?.defaultEndpoint || '', model: guideProof?.model || '' }) : {};
  root.innerHTML = `${renderCityLocalAiMission()}${renderLocalAiConsumerSetup(profile)}${renderLocalAiBeginnerSetupGuide(profile, {
    goalId: state.setupGoal,
    runtimeId: guideRuntimeId,
    runtimeLabel: guideRuntimeContract?.label || guideContract.primaryRuntime?.label || '',
    discovery: guideDiscovery,
    proof: guideProof,
    selectedModel: guideDraft.model || '',
    chatSettings: readLocalRuntimeChatSettings(),
    bridgeChecked: state.bridge.checked,
    bridgeAvailable: state.bridge.available,
    bridgePaired: state.bridge.paired
  })}
    ${renderComfyUiImageLab(state, { compact: profile.compact })}
    ${renderComfyUiVideoLab(state, { compact: profile.compact })}
    <details class="local-ai-advanced local-ai-more-details" data-local-ai-more-details><summary>Device, privacy and optional Local AI details</summary><div class="local-ai-advanced-body">
      <section class="local-ai-overview"><div><h2>Device-aware, but still your choice</h2><p>EON uses conservative hardware hints to choose the easiest local path. These details are optional; the main setup above remains the normal route.</p></div><button class="local-ai-secondary" type="button" data-local-device-check>${state.busy ? 'Checking…' : 'Refresh device check'}</button></section>
      <section class="local-ai-device-card"><h2>Device signal</h2><p>${escapeHtml(profileSummary(profile))}</p><strong>${escapeHtml(profile.recommendation)}</strong><p class="local-ai-disclosure">A browser device check is an estimate, not a hardware guarantee. EONAPP does not claim that a listed model will run well on every device.</p></section>
      ${renderDeviceSafetyGuidance(profile)}
      ${renderLocalAiScopeNotice()}
      ${renderSponsoredDiscoveryPanel(state.sponsoredDiscovery)}
      ${renderLockedFeatureSurface('local-ai')}${renderEonPremiumCapabilityPreview('local-ai')}
      ${renderW605AiQualityPanel(profile)}
      ${renderW606ClientResearchPanel()}
      ${starterCatalog(profile)}
      ${renderCreatorMediaCatalog(profile)}
    </div></details>
    <details class="local-ai-advanced" data-local-ai-advanced><summary>Advanced Local AI diagnostics</summary><div class="local-ai-advanced-body">${renderLocalConnectionPanel()}
    <section class="local-ai-grid" aria-label="Local runtime self-tests">
      ${runtimeCard(localRuntimeCardConfig('ollama', { modelPlaceholder: 'for example, a scanned installed model', description: 'Ollama exposes an installed-model list through its local API. Scan it here, then self-test a chosen model.' }))}
      ${runtimeCard(localRuntimeCardConfig('lmstudio', { description: 'Test the OpenAI-compatible Local Server you already started on this device.' }))}
      ${runtimeCard(localRuntimeCardConfig('jan', { description: 'Test Jan Desktop or Jan CLI only after its local API server is enabled.' }))}
    </section></div></details>
    <section class="local-ai-truth-card"><h2>What Local mode can and cannot do</h2><ul><li>It can use Local Lite in this browser or a supported desktop runtime that passed a local self-test.</li><li>EON may detect approved local runtimes after your setup tap. Third-party installation/model downloads remain explicit; setup is never silently sent to a cloud service. An optional LM Studio/Jan credential remains in session storage only and is never copied into proof, backup or Chat history.</li><li>Local image generation requires a verified local output. Local video is available only on the approved loopback path and stays marked unverified until its supported-device and low-memory fallback checks pass.</li><li>It cannot browse, trade, publish, send messages, connect social accounts, or act after you close the browser.</li><li>Use Vault only for optional connected-provider configuration; never paste credentials into Chat.</li></ul><div class="local-ai-actions"><a class="local-ai-secondary" href="/">Back to EONBOT</a><a class="local-ai-secondary" href="/device-check">Open device check</a><a class="local-ai-secondary" href="/vault">Open Vault</a></div></section>`;
  bind();
}

function cardFor(button) { return button.closest('[data-runtime-card]'); }
function valuesFor(button) {
  const card = cardFor(button);
  const id = String(card?.dataset.runtimeCard || '');
  return {
    id,
    runtimeName: String(button.dataset.localSelfTest || button.dataset.localOfflineProof || button.dataset.localUse || button.dataset.localClear || button.dataset.localScan || 'Local runtime'),
    endpoint: String(card?.querySelector('[data-local-endpoint]')?.value || state.drafts[id]?.endpoint || ''),
    model: String(card?.querySelector('[data-local-model]')?.value || state.drafts[id]?.model || ''),
    credential: String(card?.querySelector('[data-local-credential]')?.value || ''),
    result: card?.querySelector('[data-local-result]')
  };
}

async function copyText(text, feedback) {
  if (!text) return;
  try { await navigator.clipboard?.writeText(text); if (feedback) feedback.textContent = 'Command copied. Run it yourself in your local terminal if you choose.'; }
  catch { if (feedback) feedback.textContent = `Copy this command manually: ${text}`; }
}

function bind() {
  bindComfyUiImageLab(root, state, { rerender: render });
  bindSponsoredDiscoveryPanel(root, state.sponsoredDiscovery, { rerender: render });
  const runConsumer = async (approveDownload = false) => {
    if (state.consumer.busy) return;
    state.consumer = { ...state.consumer, busy: true, phase: 'start', message: 'Checking the easiest Local AI path on this device…', action: '', approvalRequired: false, modelPack: null };
    render();
    if (!state.consumer.benchmark) {
      const benchmark = await benchmarkBrowserLocalLiteDevice({ onStatus: (progress) => {
        const status = root?.querySelector('[data-local-consumer-setup] .local-ai-consumer-path p');
        if (status && progress.message) status.textContent = progress.message;
      }});
      state.consumer = { ...state.consumer, benchmark };
    }
    const result = await runLocalAiConsumerSetup({
      profile: state.device || deviceProfile(),
      userApprovedBrowserLiteDownload: approveDownload,
      browserLiteTier: state.consumer.browserLiteTier || 'auto',
      onProgress: (progress) => {
        state.consumer = { ...state.consumer, phase: progress.phase || '', message: progress.message || state.consumer.message };
        const status = root?.querySelector('[data-local-consumer-setup] .local-ai-consumer-path p');
        if (status && progress.message) status.textContent = progress.message;
      }
    });
    state.status = readLocalRuntimeStatus();
    state.consumer = {
      busy: false,
      phase: result.ok ? 'ready' : (result.approvalRequired ? 'approval-required' : 'needs-help'),
      message: result.ok ? `${result.runtime || 'Local AI'} is ready for EONBOT${result.model ? ` · ${result.model}` : ''}.` : (result.message || 'Local AI setup needs one more step.'),
      action: result.ok ? '' : String(result.action || ''),
      approvalRequired: result.approvalRequired === true,
      approximateWeightMb: Number(result.approximateWeightMb || 0) || 0,
      modelPack: result.modelPack || null,
      readyPath: result.ok ? String(result.path || '') : '',
      browserLiteTier: state.consumer.browserLiteTier || 'auto',
      benchmark: state.consumer.benchmark || null
    };
    if (result.ok) recordEonCoreOutcome({ kind: 'local-ai-self-test', route: '/local-ai', source: result.path || 'local-ai-consumer-setup', receiptId: `local-ai-consumer:${Date.now()}`, verified: true });
    render();
  };
  root.querySelectorAll('[data-local-consumer-start]').forEach((button) => button.addEventListener('click', () => { void runConsumer(false); }));
  root.querySelector('[data-browser-lite-tier]')?.addEventListener('change', (event) => { state.consumer = { ...state.consumer, browserLiteTier: String(event.target?.value || 'auto') }; render(); });
  root.querySelectorAll('[data-local-runtime-acquire]').forEach((link) => link.addEventListener('click', () => {
    state.consumer = { ...state.consumer, phase: 'runtime-installer-opened', message: 'Install the official local AI app, then return here. EON will check it automatically.', action: '' };
    const resume = () => {
      globalThis.setTimeout?.(() => { if (!state.consumer.busy) void runConsumer(false); }, 1200);
    };
    globalThis.addEventListener?.('focus', resume, { once: true });
  }));
  root.querySelector('[data-local-consumer-approve]')?.addEventListener('click', () => { void runConsumer(true); });
  root.querySelector('[data-local-consumer-remove-lite]')?.addEventListener('click', async () => {
    if (state.consumer.busy) return;
    state.consumer = { ...state.consumer, busy: true, message: 'Removing the reviewed Local Lite model cache from this browser…' };
    render();
    const removed = await deleteBrowserLocalLiteCachedModel({ explicitUserAction: true });
    state.consumer = { ...state.consumer, busy: false, action: '', approvalRequired: false, readyPath: '', message: removed.ok ? `Local Lite was stopped and its receipt cleared. ${removed.deletedEntries} approved model cache entr${removed.deletedEntries === 1 ? 'y was' : 'ies were'} removed; shared library cache was preserved.` : 'Local Lite cache removal could not complete.' };
    state.status = readLocalRuntimeStatus();
    render();
  });
  root.querySelector('[data-local-consumer-install-pack]')?.addEventListener('click', () => {
    const pack = state.consumer.modelPack;
    if (!pack?.id || state.consumer.busy) return;
    state.consumer = { ...state.consumer, busy: true, phase: 'model-pack-download', message: `Downloading ${pack.label || 'the reviewed starter model'} on this computer…` };
    render();
    void installEonLocalAiReviewedModelPack(pack.id).then(async (started) => {
      if (!started.ok) {
        state.consumer = { ...state.consumer, busy: false, phase: 'needs-help', message: started.message || 'The reviewed starter download could not start.' };
        render();
        return;
      }
      const finished = await awaitEonLocalAiReviewedModelPack(started.jobId, {
        onProgress: () => {
          const status = root?.querySelector('[data-local-consumer-setup] .local-ai-consumer-path p');
          if (status) status.textContent = `Downloading ${pack.label || 'starter model'}… EON will test it automatically when complete.`;
        }
      });
      if (!finished.ok) {
        state.consumer = { ...state.consumer, busy: false, phase: 'needs-help', message: finished.message || 'The starter model download was not verified.' };
        render();
        return;
      }
      state.consumer = { ...state.consumer, busy: false, phase: 'downloaded', action: '', approvalRequired: false, modelPack: null, message: 'Starter model downloaded. Running the local self-test…' };
      render();
      await runConsumer(false);
    });
  });
  root.querySelector('[data-local-consumer-connect-companion]')?.addEventListener('click', () => {
    // Open synchronously from the user's click so normal popup protection does
    // not turn Local Companion approval into a browser-settings problem.
    const approvalWindow = window.open('about:blank', 'eon-local-companion-approval', 'popup,width=560,height=680');
    if (!approvalWindow) {
      state.consumer = { ...state.consumer, busy: false, phase: 'needs-help', action: 'approve-companion', approvalRequired: true, message: 'Allow the EON Local Companion approval window, then click Connect again.' };
      render();
      return;
    }
    try {
      approvalWindow.document.title = 'EON Local Companion';
      approvalWindow.document.body.innerHTML = '<p style="font:16px system-ui;padding:24px">Opening EON Local Companion approval…</p>';
    } catch {}
    state.consumer = { ...state.consumer, busy: true, phase: 'companion-approval', action: 'approve-companion', approvalRequired: true, message: 'Approve EONAPP in the Local Companion window. EON will continue automatically.' };
    render();
    void pairEonLocalCompanionWithApproval({ approvalWindow }).then(async (result) => {
      state.bridge = { checked: true, available: result.ok === true || result.error !== 'bridge-unreachable', paired: result.ok === true, message: result.message || '' };
      if (!result.ok) {
        state.consumer = { ...state.consumer, busy: false, phase: 'needs-help', action: 'approve-companion', approvalRequired: true, message: result.message || 'Local Companion approval did not complete.' };
        render();
        return;
      }
      state.consumer = { ...state.consumer, busy: false, phase: 'connected', action: '', approvalRequired: false, message: 'Local Companion connected. Checking your installed AI automatically…' };
      render();
      await runConsumer(false);
    });
  });
  root.querySelector('[data-local-bridge-detect]')?.addEventListener('click', async () => {
    const status = root.querySelector('[data-local-bridge-status]');
    if (status) status.textContent = 'Checking EON Local Companion on this computer…';
    const result = await detectEonLocalBridge();
    state.bridge = { checked: true, available: Boolean(result.ok), paired: Boolean(readEonLocalBridgeSession()), message: result.message };
    render();
  });
  root.querySelector('[data-local-bridge-pair]')?.addEventListener('click', async () => {
    const code = String(root.querySelector('[data-local-bridge-code]')?.value || '');
    const result = await pairEonLocalBridge(code);
    state.bridge = { checked: true, available: Boolean(result.ok) || !['bridge-unreachable', 'pairing-code-required'].includes(String(result.error || '')), paired: Boolean(result.ok), message: result.message };
    render();
  });
  root.querySelector('[data-local-connections-clear]')?.addEventListener('click', () => {
    clearAllLocalConnectionSessions();
    state.bridge = { checked: true, available: true, paired: false, message: 'Current Local AI sessions were disconnected. If this browser was trusted before, EON can reconnect it automatically next time.' };
    render();
  });
  root.querySelector('[data-local-companion-forget]')?.addEventListener('click', async () => {
    const result = await forgetEonLocalCompanionTrustedBrowser();
    clearAllLocalConnectionSessions();
    state.bridge = { checked: true, available: true, paired: false, message: result.message || 'Trusted-browser access was removed. Local Companion will ask for approval next time.' };
    render();
  });
  bindComfyUiVideoLab(root, state, { rerender: render });
  root.querySelector('[data-eon-memory-policy]')?.addEventListener('change', (event) => {
    const result = writeEonAiMemoryPolicy(String(event.currentTarget?.value || 'ask'), { explicitUserAction: true });
    state.memoryStatus = result.ok
      ? result.policy.mode === 'off'
        ? 'Memory injection is off. Existing cards stay local so you can turn memory back on or delete them.'
        : result.policy.mode === 'safe-auto'
          ? 'Safe auto enabled for structured product preferences only. Raw chat is still never captured automatically.'
          : 'Manual memory mode enabled. Only memories you deliberately save are available to EONBOT.'
      : 'Memory behavior could not be saved in this browser.';
    render();
  });
  root.querySelector('[data-eon-memory-save]')?.addEventListener('click', () => {
    const content = String(root.querySelector('[data-eon-memory-content]')?.value || '');
    const kind = String(root.querySelector('[data-eon-memory-kind]')?.value || 'context');
    const projectId = kind === 'project' ? String(root.querySelector('[data-eon-memory-project]')?.value || '') : '';
    const result = state.memoryEditingId
      ? updateEonAiMemoryCard(state.memoryEditingId, { kind, content, projectId, scope: projectId ? `project:${projectId}` : 'global' }, { consent: true })
      : rememberEonAiMemory({ kind, content, projectId }, { consent: true });
    state.memoryStatus = result.ok
      ? state.memoryEditingId ? 'Memory updated locally.' : 'Saved locally for compatible EONBOT text requests. It was not sent for training.'
      : result.reason === 'secret-like-content-blocked'
        ? 'That looks like sensitive credential material, so it was not saved.'
        : result.reason === 'empty-memory-card'
          ? 'Write a short non-sensitive memory note first.'
          : 'Memory could not be saved in this browser.';
    if (result.ok) {
      state.memoryEditingId = '';
      state.memoryDraftContent = '';
      state.memoryDraftKind = 'preference';
      state.memoryDraftProjectId = '';
    }
    render();
  });
  root.querySelectorAll('[data-eon-memory-edit]').forEach((button) => button.addEventListener('click', () => {
    const id = String(button.dataset.eonMemoryEdit || '');
    const card = listEonAiMemory({ limit: 180 }).find((row) => row.id === id);
    if (!card) return;
    state.memoryEditingId = card.id;
    state.memoryDraftContent = card.content;
    state.memoryDraftKind = card.kind;
    state.memoryDraftProjectId = card.projectId || '';
    state.memoryStatus = 'Editing one local memory card. Save or cancel before changing another.';
    render();
  }));
  root.querySelector('[data-eon-memory-edit-cancel]')?.addEventListener('click', () => {
    state.memoryEditingId = '';
    state.memoryDraftContent = '';
    state.memoryDraftKind = 'preference';
    state.memoryDraftProjectId = '';
    state.memoryStatus = 'Memory edit cancelled.';
    render();
  });
  root.querySelectorAll('[data-eon-memory-forget]').forEach((button) => button.addEventListener('click', () => {
    const removed = forgetEonAiMemoryCard(String(button.dataset.eonMemoryForget || ''));
    state.memoryStatus = removed ? 'That memory card was forgotten.' : 'That memory card was already unavailable.';
    render();
  }));
  root.querySelector('[data-eon-memory-export]')?.addEventListener('click', () => {
    const snapshot = exportEonAiMemorySnapshot();
    const blob = new Blob([`${JSON.stringify(snapshot, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `eonapp-memory-${new Date(snapshot.exportedAt).toISOString().slice(0, 10)}.json`;
    anchor.rel = 'noopener';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    state.memoryStatus = `Exported ${snapshot.cards.length} active local memory card${snapshot.cards.length === 1 ? '' : 's'}. The export contains no credentials or raw Chat history.`;
    render();
  });
  root.querySelector('[data-eon-memory-clear]')?.addEventListener('click', () => {
    const cleared = forgetEonAiMemory();
    state.memoryEditingId = '';
    state.memoryDraftContent = '';
    state.memoryDraftProjectId = '';
    state.memoryStatus = cleared ? 'EONBOT local memory cleared from this browser.' : 'No local memory store was available to clear.';
    render();
  });
  root.querySelector('[data-eon-media-plan-refresh]')?.addEventListener('click', () => {
    state.mediaVramGb = Math.max(0, Math.min(128, Number(root.querySelector('[data-eon-media-vram]')?.value || 0) || 0));
    render();
  });
  root.querySelector('[data-eon-copy-w605-text]')?.addEventListener('click', async () => {
    const status = root.querySelector('[data-eon-w605-command-status]');
    await copyText('EON_W605_CONFIRM_LIVE=1 EON_W605_TEXT_MODEL="your-installed-model" node scripts/w605-live-ai-output-matrix.mjs --confirm-live', status);
  });
  root.querySelector('[data-eon-copy-w605-media]')?.addEventListener('click', async () => {
    const status = root.querySelector('[data-eon-w605-command-status]');
    await copyText('EON_W605_CONFIRM_LIVE=1 EON_LOCAL_MEDIA_ALLOW_HIGH_LOAD=1 EON_LOCAL_IMAGE_WORKFLOW_FILE="path/to/exported-comfy-api-workflow.json" node scripts/w605-live-ai-output-matrix.mjs --confirm-live --confirm-high-load', status);
  });
  root.querySelector('[data-eon-research-save]')?.addEventListener('click', () => {
    const url = String(root.querySelector('[data-eon-research-url]')?.value || '');
    const title = String(root.querySelector('[data-eon-research-title]')?.value || '');
    const excerpt = String(root.querySelector('[data-eon-research-excerpt]')?.value || '');
    const result = saveEonClientResearchSource({ url, title, excerpt, method: 'manual-paste' }, { explicitUserAction: true });
    state.researchStatus = result.ok
      ? 'Saved in this browser only. It will not reach any model unless you queue it for one turn.'
      : result.reason === 'secret-like-source-content-blocked'
        ? 'That source contains credential-like text, so it was not saved.'
        : result.reason === 'source-extract-required'
          ? 'Paste a short permitted extract before saving a source.'
          : 'Use a public https source URL and a permitted extract. Local/LAN/private links are blocked.';
    render();
  });
  root.querySelector('[data-eon-research-fetch]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    const status = root.querySelector('[data-eon-research-status]');
    const url = String(root.querySelector('[data-eon-research-url]')?.value || '');
    const title = String(root.querySelector('[data-eon-research-title]')?.value || '');
    button.disabled = true;
    if (status) status.textContent = 'Attempting a direct browser fetch. A blocked source will not be proxied.';
    const result = await fetchEonClientResearchSource({ url, title }, { explicitUserAction: true });
    state.researchStatus = result.ok
      ? 'Source captured through a browser-direct CORS request and saved locally. Review it before queueing.'
      : result.reason === 'cors-or-network-blocked'
        ? 'That source did not permit browser-readable fetching. Open it yourself and paste a short permitted extract instead; EONAPP will not proxy it.'
        : result.reason === 'research-source-too-large'
          ? 'That source is too large for a local capture. Paste a smaller permitted extract instead.'
          : 'The direct browser fetch could not save a usable public source.';
    render();
  });
  root.querySelector('[data-eon-research-clear]')?.addEventListener('click', () => {
    state.researchStatus = clearEonClientResearchSources() ? 'All saved local research sources and queued packet were cleared from this browser.' : 'No local research store was available to clear.';
    render();
  });
  root.querySelectorAll('[data-eon-research-remove]').forEach((button) => button.addEventListener('click', () => {
    const result = removeEonClientResearchSource(button.dataset.eonResearchRemove || '');
    state.researchStatus = result.ok ? 'Source removed from this browser.' : 'The source could not be removed from this browser.';
    render();
  }));
  root.querySelector('[data-eon-research-queue]')?.addEventListener('click', () => {
    const query = String(root.querySelector('[data-eon-research-query]')?.value || '');
    const sourceIds = listEonClientResearchSources().map((source) => source.id);
    const result = queueEonClientResearchForNextTurn({ query, sourceIds, explicitUserAction: true });
    state.researchStatus = result.ok
      ? `Queued ${result.packet.sourceCount} local source${result.packet.sourceCount === 1 ? '' : 's'} for one EONBOT reply. Open Chat and ask this question; the packet will be consumed once.`
      : result.reason === 'research-query-required'
        ? 'Write the research question before queueing sources for EONBOT.'
        : 'No usable saved sources were available to queue.';
    render();
  });
  root.querySelectorAll('[data-city-local-ai-return]').forEach((link) => link.addEventListener('click', (event) => {
    const returned = returnCityBeginnerMission(event.currentTarget.dataset.cityLocalAiReturn);
    if (!returned.ok) {
      event.preventDefault();
      const status = root.querySelector('[data-city-local-ai-mission-status]');
      if (status) status.textContent = 'This local mission receipt is no longer available. You can still return through City Lite.';
    }
  }));
  root.querySelector('[data-city-local-ai-dismiss]')?.addEventListener('click', (event) => {
    dismissCityBeginnerMission(event.currentTarget.dataset.cityLocalAiDismiss);
    try { globalThis.history?.replaceState?.({}, '', '/local-ai'); } catch {}
    render();
  });
  root.querySelector('[data-local-device-check]')?.addEventListener('click', () => {
    state.busy = true;
    render();
    window.setTimeout(() => { state.busy = false; state.device = deviceProfile(); render(); }, 80);
  });
  root.querySelectorAll('[data-local-setup-goal]').forEach((button) => button.addEventListener('click', () => {
    state.setupGoal = String(button.dataset.localSetupGoal || 'private-chat');
    state.setupRuntimeId = '';
    render();
    root.querySelector('#eonbot-local-ai-setup')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }));
  root.querySelectorAll('[data-local-guide-runtime]').forEach((button) => button.addEventListener('click', () => {
    const runtimeId = String(button.dataset.localGuideRuntime || '').trim();
    state.setupRuntimeId = runtimeId;
    const card = runtimeId ? root.querySelector(`#local-ai-${runtimeId}`) : null;
    if (!card) return;
    card.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => card.querySelector('[data-local-scan]')?.focus?.(), 200);
  }));
  root.querySelector('[data-local-guide-next]')?.addEventListener('click', (event) => {
    const action = String(event.currentTarget.dataset.localGuideNext || '');
    const runtimeId = String(event.currentTarget.dataset.localGuideNextRuntime || state.setupRuntimeId || '');
    state.setupRuntimeId = runtimeId;
    if (action === 'focus-bridge') {
      const panel = root.querySelector('[data-local-connection-authority]');
      panel?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => panel?.querySelector('[data-local-bridge-code]')?.focus?.(), 200);
      return;
    }
    const card = root.querySelector(`#local-ai-${runtimeId}`);
    if (!card) return;
    card.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    const selector = action === 'focus-use' ? '[data-local-use]' : action === 'focus-self-test' ? '[data-local-self-test]' : action === 'focus-model' ? '[data-local-installed-model], [data-local-model]' : '[data-local-scan]';
    window.setTimeout(() => {
      const target = card.querySelector(selector);
      target?.focus?.();
      if (['check-runtime', 'focus-self-test', 'focus-use'].includes(action)) target?.click?.();
    }, 200);
  });
  root.querySelectorAll('[data-local-endpoint],[data-local-model]').forEach((field) => field.addEventListener('input', (event) => {
    const card = event.currentTarget.closest('[data-runtime-card]');
    const id = card?.dataset.runtimeCard;
    if (!id) return;
    state.drafts[id] = {
      endpoint: card.querySelector('[data-local-endpoint]')?.value || '',
      model: card.querySelector('[data-local-model]')?.value || ''
    };
  }));
  root.querySelectorAll('[data-local-installed-model]').forEach((select) => select.addEventListener('change', (event) => {
    const card = event.currentTarget.closest('[data-runtime-card]');
    const input = card?.querySelector('[data-local-model]');
    if (input && event.currentTarget.value) input.value = event.currentTarget.value;
    input?.dispatchEvent(new Event('input', { bubbles: true }));
    if (event.currentTarget.value) render();
  }));
  root.querySelectorAll('[data-local-profile]').forEach((button) => button.addEventListener('click', () => {
    const profile = findLocalAiStarterProfile(button.dataset.localProfile);
    if (!profile) return;
    state.drafts.ollama = { endpoint: 'http://127.0.0.1:11434', model: profile.model };
    globalThis.location.hash = 'local-ai-ollama';
    render();
  }));
  root.querySelectorAll('[data-local-copy-profile]').forEach((button) => button.addEventListener('click', async () => {
    const profile = findLocalAiStarterProfile(button.dataset.localCopyProfile);
    const feedback = button.closest('.local-ai-profile')?.querySelector('.local-ai-profile-reason');
    await copyText(buildOllamaPullCommand(profile), feedback);
  }));
  root.querySelectorAll('[data-local-copy-lifecycle-install]').forEach((button) => button.addEventListener('click', async () => {
    const command = String(button.dataset.localInstallCommand || '');
    const feedback = button.closest('[data-runtime-card]')?.querySelector('[data-local-result]');
    await copyText(command, feedback);
  }));
  root.querySelectorAll('[data-local-scan]').forEach((button) => button.addEventListener('click', async () => {
    const values = valuesFor(button);
    state.setupRuntimeId = values.id || state.setupRuntimeId;
    state.scanning[values.id] = true;
    delete state.actionStatus[values.id];
    render();
    const result = await discoverLocalRuntimeModels(values);
    state.discoveries[values.id] = result;
    state.scanning[values.id] = false;
    if (result.ok && result.models.length && !state.drafts[values.id]?.model) {
      const preferredModel = findPreferredDiscoveredLocalModel(result.models, { device: state.device || deviceProfile() });
      if (preferredModel?.model) state.drafts[values.id] = { endpoint: result.endpoint, model: preferredModel.model };
    }
    render();
  }));
  root.querySelectorAll('[data-local-self-test]').forEach((button) => button.addEventListener('click', async () => {
    const values = valuesFor(button);
    state.setupRuntimeId = values.id || state.setupRuntimeId;
    button.disabled = true;
    delete state.actionStatus[values.id];
    if (values.result) values.result.textContent = 'Running a device-local self-test…';
    const result = await runLocalRuntimeSelfTest(values);
    state.status = result.status || readLocalRuntimeStatus();
    const mission = cityLocalAiMission();
    const missionRecord = mission?.state === 'opened' ? recordCityLocalAiSelfTestOutcome(mission.id, Boolean(result.ok)) : null;
    if (result.ok) recordEonCoreOutcome({ kind: 'local-ai-self-test', route: '/local-ai', source: 'local-ai-device', receiptId: `local-ai-self-test:${Date.now()}`, verified: true });
    const missionNote = missionRecord
      ? (missionRecord.ok
        ? (result.ok ? ' City mission recorded a passed self-test locally.' : ' City mission recorded a not-passed self-test locally; no runtime was selected.')
        : ' The City mission receipt could not be updated; the runtime result remains truthful.')
      : '';
    state.actionStatus[values.id] = `${result.ok ? 'Self-test passed. You may now choose this runtime for EONBOT.' : (result.message || state.status?.note || 'Self-test did not pass.')}${missionNote}`;
    if (values.result) values.result.textContent = state.actionStatus[values.id];
    render();
  }));
  root.querySelectorAll('[data-local-offline-proof]').forEach((button) => button.addEventListener('click', async () => {
    const values = valuesFor(button);
    state.setupRuntimeId = values.id || state.setupRuntimeId;
    button.disabled = true;
    if (values.result) values.result.textContent = navigator.onLine === false ? 'Running the explicit offline locality proof…' : 'Turn off internet connectivity first, then run this proof again.';
    const result = await runLocalRuntimeSelfTest({ ...values, offlineProofRequested: true, networkOnline: navigator.onLine !== false });
    state.status = result.status || readLocalRuntimeStatus();
    state.actionStatus[values.id] = result.ok ? 'Offline locality proof passed. This exact runtime/model is now proven to answer while the browser reports offline.' : (result.message || state.status?.note || 'Offline locality proof did not pass.');
    render();
  }));
  root.querySelectorAll('[data-local-use]').forEach((button) => button.addEventListener('click', () => {
    const values = valuesFor(button);
    state.setupRuntimeId = values.id || state.setupRuntimeId;
    const status = readLocalRuntimeStatus();
    const result = status?.ok ? markLocalRuntimeAsChatRuntime(values) : { ok: false };
    state.actionStatus[values.id] = result.ok ? 'Selected for EONBOT. Chat will still show the actual Local/Guide/Connected status.' : 'Run and pass the self-test before selecting a local runtime for Chat.';
    if (values.result) values.result.textContent = state.actionStatus[values.id];
    state.status = readLocalRuntimeStatus();
    render();
  }));
  root.querySelectorAll('[data-local-clear]').forEach((button) => button.addEventListener('click', () => {
    const values = valuesFor(button);
    unmarkLocalRuntimeChatRuntime(values);
    clearLocalRuntimeStatus(values);
    delete state.actionStatus[values.id];
    state.status = readLocalRuntimeStatus();
    render();
  }));
}

function initLocalAiSurface() {
  bindBrowserLocalLiteLifecycle(globalThis);
  enterCityMode('local-ai', { entry: 'local-ai' });
  bindCityModeLinkTracking(root || document, 'local-ai', { entry: 'local-ai' });
  render();
}

initLocalAiSurface();
