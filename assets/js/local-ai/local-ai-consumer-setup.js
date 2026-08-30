import { buildLocalAiConsumerPlan } from '../../../config/local-ai-consumer-experience-contract.mjs';
import { getLocalAiRuntimeContract } from '../../../config/local-ai-browser-contract.mjs';
import { detectLocalAiCapabilityProfile } from '../utils/local-ai-capability-matrix.js';
import { findPreferredDiscoveredLocalModel } from './local-ai-catalog.js';
import {
  discoverLocalRuntimeModels,
  markLocalRuntimeAsChatRuntime,
  readLocalRuntimeStatus,
  runLocalRuntimeSelfTest
} from './local-runtime-status.js';
import {
  getBrowserLocalLiteApproximateWeightMb,
  getBrowserLocalLiteCapability,
  markBrowserLocalLiteForChat,
  prepareBrowserLocalLite,
  readBrowserLocalLiteReceipt
} from './browser-local-lite.js';
import { detectEonLocalBridge, readEonLocalBridgeSession, startEonLocalCompanionRuntime } from './eon-local-bridge-client.js';
import { chooseEonLocalAiStarterPack, publicEonLocalAiModelPack } from '../../../config/local-ai-reviewed-model-packs.mjs';

export const LOCAL_AI_CONSUMER_SETUP_SCHEMA = 'eon.local-ai.consumer-setup.rt90.v1';
const RUNTIME_ORDER = Object.freeze(['lmstudio', 'ollama', 'jan']);
const MAX_SELF_TEST_ATTEMPTS = 3;

function clean(value = '', max = 220) {
  return String(value || '').trim().slice(0, max);
}

function emit(callback, payload = {}) {
  try { callback(Object.freeze({ schema: LOCAL_AI_CONSUMER_SETUP_SCHEMA, ...payload })); } catch {}
}

function estimatedParameterBillions(model = '') {
  const value = clean(model, 160).toLowerCase();
  const match = value.match(/(?:^|[-_:])(\d+(?:\.\d+)?)b(?:[-_:]|$)/);
  return match ? Math.max(0, Number(match[1]) || 0) : 0;
}

function looksLikeChatModel(model = '') {
  const value = clean(model, 160).toLowerCase();
  if (!value) return false;
  return !/(?:embed|embedding|rerank|whisper|tts|speech|clip|vae|controlnet|sdxl|flux|diffusion)/.test(value);
}

function sizeFitsDevice(row = {}, profile = {}) {
  const memoryGb = Math.max(0, Number(profile.memoryGB || profile.memoryGb || 0) || 0);
  const sizeBytes = Math.max(0, Number(row.sizeBytes || 0) || 0);
  const paramsB = estimatedParameterBillions(row.model);
  if (memoryGb > 0 && sizeBytes > 0) {
    // Keep generous headroom for the OS, runtime, KV cache and the browser.
    const modelBudgetBytes = Math.max(0.7, memoryGb * 0.52) * 1024 ** 3;
    if (sizeBytes > modelBudgetBytes) return false;
  }
  if (memoryGb > 0 && paramsB > 0) {
    if (memoryGb <= 4 && paramsB > 1.5) return false;
    if (memoryGb <= 8 && paramsB > 4) return false;
    if (memoryGb <= 16 && paramsB > 9) return false;
    if (memoryGb <= 32 && paramsB > 20) return false;
  }
  return true;
}

function candidateScore(row = {}, profile = {}, preferredModel = '') {
  const model = clean(row.model, 160);
  let score = 0;
  if (preferredModel && model === preferredModel) score += 10000;
  if (!looksLikeChatModel(model)) score -= 10000;
  if (!sizeFitsDevice(row, profile)) score -= 8000;
  const paramsB = estimatedParameterBillions(model);
  const sizeGb = Number(row.sizeBytes || 0) / (1024 ** 3);
  if (paramsB > 0) score += Math.min(120, paramsB * 10);
  if (sizeGb > 0) score += Math.min(60, sizeGb * 8);
  // Instruct/chat-labelled models are safer defaults than base/checkpoint names.
  if (/(?:instruct|chat|assistant)/i.test(model)) score += 80;
  if (/(?:qwen|gemma|llama|mistral|phi|smollm)/i.test(model)) score += 20;
  // Keep the first automatic path conservative instead of choosing the largest model.
  if (paramsB > 12) score -= (paramsB - 12) * 8;
  return score;
}

export function rankInstalledLocalTextModels(models = [], profile = {}, runtimeId = '') {
  const rows = Array.isArray(models) ? models.filter((row) => row?.localOnly !== false && looksLikeChatModel(row?.model)) : [];
  const preferred = findPreferredDiscoveredLocalModel(rows, { device: profile })?.model || '';
  return Object.freeze(rows
    .map((row) => Object.freeze({ ...row, fit: sizeFitsDevice(row, profile), score: candidateScore(row, profile, preferred), runtimeId }))
    .filter((row) => row.fit)
    .sort((left, right) => right.score - left.score || Number(left.sizeBytes || Number.MAX_SAFE_INTEGER) - Number(right.sizeBytes || Number.MAX_SAFE_INTEGER)));
}

async function scanDesktopRuntimes(profile, onProgress) {
  const findings = await Promise.all(RUNTIME_ORDER.map(async (runtimeId) => {
    const contract = getLocalAiRuntimeContract(runtimeId);
    emit(onProgress, { phase: 'scan', runtimeId, message: `Checking ${contract?.label || runtimeId}…` });
    const result = await discoverLocalRuntimeModels({
      runtimeName: runtimeId,
      endpoint: contract?.defaultEndpoint || '',
      timeoutMs: 4200
    });
    const ranked = result.ok ? rankInstalledLocalTextModels(result.models || [], profile, runtimeId) : Object.freeze([]);
    emit(onProgress, {
      phase: result.ok ? 'scan-found' : 'scan-miss',
      runtimeId,
      message: result.ok
        ? ranked.length ? `${contract?.label || runtimeId} found ${ranked.length} model${ranked.length === 1 ? '' : 's'} that fit this first setup.` : `${contract?.label || runtimeId} is running, but no installed chat model fits the conservative first setup.`
        : `${contract?.label || runtimeId} is not ready yet.`
    });
    return Object.freeze({ runtimeId, contract, result, ranked });
  }));
  return Object.freeze(findings);
}

function flattenCandidates(findings = []) {
  const runtimeIndex = new Map(RUNTIME_ORDER.map((id, index) => [id, index]));
  const candidates = [];
  for (const finding of findings) {
    for (const model of finding.ranked || []) {
      candidates.push({ finding, model, score: Number(model.score || 0) - (runtimeIndex.get(finding.runtimeId) || 0) * 2 });
    }
  }
  return candidates.sort((left, right) => right.score - left.score);
}

async function tryInstalledCandidates(candidates = [], onProgress) {
  let attempts = 0;
  const failures = [];
  for (const candidate of candidates) {
    if (attempts >= MAX_SELF_TEST_ATTEMPTS) break;
    attempts += 1;
    const { finding, model } = candidate;
    const runtimeId = finding.runtimeId;
    const label = finding.contract?.label || runtimeId;
    emit(onProgress, { phase: 'self-test', runtimeId, model: model.model, message: `Testing ${label} with ${model.model}…` });
    const result = await runLocalRuntimeSelfTest({
      runtimeName: runtimeId,
      endpoint: finding.contract?.defaultEndpoint || '',
      model: model.model,
      timeoutMs: 22000
    });
    if (result.ok) {
      const selection = markLocalRuntimeAsChatRuntime({
        runtimeName: runtimeId,
        endpoint: finding.contract?.defaultEndpoint || '',
        model: model.model
      });
      if (selection.ok) {
        emit(onProgress, { phase: 'ready', runtimeId, model: model.model, message: `${label} is ready. EONBOT will use ${model.model} locally.` });
        return Object.freeze({ ok: true, path: 'desktop-runtime', runtimeId, runtime: label, model: model.model, proof: result.status, settings: selection.settings, attempts, failures: Object.freeze(failures) });
      }
      failures.push({ runtimeId, model: model.model, message: 'The self-test passed but EONAPP could not save the local Chat selection.' });
    } else {
      failures.push({ runtimeId, model: model.model, message: clean(result.message || result.status?.note || result.error || 'Self-test failed.') });
      emit(onProgress, { phase: 'self-test-failed', runtimeId, model: model.model, message: `${label} could not use ${model.model}. Trying another safe local option…` });
    }
  }
  return Object.freeze({ ok: false, path: '', attempts, failures: Object.freeze(failures) });
}

async function tryStartInstalledRuntimeThroughCompanion(profile, onProgress) {
  if (!readEonLocalBridgeSession()) return Object.freeze({ ok: false, attempts: Object.freeze([]) });
  const attempts = [];
  let emptyFinding = null;
  for (const runtimeId of ['lmstudio', 'ollama']) {
    const label = getLocalAiRuntimeContract(runtimeId)?.label || runtimeId;
    emit(onProgress, { phase: 'runtime-start', runtimeId, message: `Trying to open ${label} through EON Local Companion…` });
    const started = await startEonLocalCompanionRuntime(runtimeId);
    attempts.push(Object.freeze({ runtimeId, ok: started.ok === true, error: started.error || '' }));
    if (!started.ok) continue;
    await new Promise((resolve) => setTimeout(resolve, 1800));
    const contract = getLocalAiRuntimeContract(runtimeId);
    const result = await discoverLocalRuntimeModels({ runtimeName: runtimeId, endpoint: contract?.defaultEndpoint || '', timeoutMs: 5200 });
    if (result.ok) {
      const ranked = rankInstalledLocalTextModels(result.models || [], profile, runtimeId);
      emit(onProgress, { phase: 'runtime-started', runtimeId, message: ranked.length ? `${label} is open. Checking a fitting installed model…` : `${label} is open but needs a small fitting chat model.` });
      const finding = Object.freeze({ runtimeId, contract, result, ranked });
      if (ranked.length) return Object.freeze({ ok: true, runtimeId, finding, attempts: Object.freeze(attempts) });
      emptyFinding = finding;
    }
  }
  return Object.freeze({ ok: false, emptyFinding, attempts: Object.freeze(attempts) });
}

export async function readLocalAiConsumerSnapshot(profile = detectLocalAiCapabilityProfile()) {
  const lite = getBrowserLocalLiteCapability();
  const liteReceipt = readBrowserLocalLiteReceipt();
  const runtimeProof = readLocalRuntimeStatus();
  const bridgeSession = readEonLocalBridgeSession();
  const bridge = await detectEonLocalBridge({ timeoutMs: 1400 });
  return Object.freeze({
    schema: LOCAL_AI_CONSUMER_SETUP_SCHEMA,
    profile,
    runtimeProof,
    browserLite: Object.freeze({ ...lite, ready: Boolean(liteReceipt?.ok), receipt: liteReceipt }),
    companion: Object.freeze({ available: bridge.ok === true, paired: Boolean(bridgeSession), version: bridge.version || '' }),
    plan: buildLocalAiConsumerPlan(profile, {
      verifiedRuntime: runtimeProof,
      browserLiteSupported: lite.supported,
      browserLiteReady: Boolean(liteReceipt?.ok),
      companionAvailable: bridge.ok === true,
      companionPaired: Boolean(bridgeSession)
    })
  });
}

/**
 * One explicit foreground setup action. It may scan the three approved desktop
 * text runtimes and self-test bounded candidates because the user has asked EON
 * to make Local AI ready. It never installs software, downloads a desktop model
 * or silently switches to cloud AI.
 */
export async function runLocalAiConsumerSetup(options = {}) {
  const onProgress = typeof options.onProgress === 'function' ? options.onProgress : () => {};
  const profile = options.profile || detectLocalAiCapabilityProfile();
  const liteTier = String(options.browserLiteTier || 'auto');
  const existingLiteReceipt = readBrowserLocalLiteReceipt();
  const liteCapability = getBrowserLocalLiteCapability({ tier: liteTier, knownGoodBalanced: existingLiteReceipt?.tier === 'balanced' });
  emit(onProgress, { phase: 'start', message: 'Making Local AI ready on this device…' });

  const mobile = String(profile.computeClass || '').toLowerCase() === 'mobile' || /mobile|android|ios/i.test(String(profile.platformFamily || ''));
  if (!mobile && options.skipInstalledRuntimeScan !== true) {
    const findings = await scanDesktopRuntimes(profile, onProgress);
    const candidates = flattenCandidates(findings);
    if (candidates.length) {
      const installed = await tryInstalledCandidates(candidates, onProgress);
      if (installed.ok) return Object.freeze({ ...installed, profile, findings });
    }
    if (readEonLocalBridgeSession()) {
      const started = await tryStartInstalledRuntimeThroughCompanion(profile, onProgress);
      if (started.ok) {
        const ranked = started.finding.ranked || [];
        const installed = await tryInstalledCandidates(ranked.map((model) => ({ finding: { ...started.finding, ranked }, model, score: model.score })), onProgress);
        if (installed.ok) return Object.freeze({ ...installed, profile, companionStart: started });
      }
      const emptyFinding = findings.find((finding) => finding.result?.ok && !(finding.ranked || []).length && ['lmstudio', 'ollama'].includes(finding.runtimeId)) || started.emptyFinding || null;
      if (emptyFinding) {
        const pack = chooseEonLocalAiStarterPack(emptyFinding.runtimeId, profile);
        if (pack) {
          const publicPack = publicEonLocalAiModelPack(pack);
          emit(onProgress, { phase: 'model-pack-approval-required', runtimeId: emptyFinding.runtimeId, message: `${emptyFinding.contract?.label || emptyFinding.runtimeId} is ready but needs a small chat model. EON can download one reviewed starter pack after your approval.` });
          return Object.freeze({
            ok: false,
            path: 'desktop-runtime',
            approvalRequired: true,
            action: 'approve-reviewed-model-pack',
            runtimeId: emptyFinding.runtimeId,
            modelPack: publicPack,
            approximateWeightMb: publicPack.approximateDownloadMb,
            message: `Download ${publicPack.label} (~${publicPack.approximateDownloadMb} MB, ${publicPack.license}) for ${emptyFinding.contract?.label || emptyFinding.runtimeId}. EON will recheck it automatically afterward.`,
            profile,
            findings
          });
        }
      }
    } else {
      const bridge = await detectEonLocalBridge({ timeoutMs: 1600 });
      if (bridge.ok) {
        emit(onProgress, { phase: 'companion-approval-required', message: 'EON Local Companion is already on this computer. Approve it once so EON can open and test your installed AI apps automatically.' });
        return Object.freeze({
          ok: false,
          path: 'desktop-companion',
          approvalRequired: true,
          action: 'approve-companion',
          companionAvailable: true,
          companionPaired: false,
          message: 'Connect EON Local Companion once. No code, port or CORS setting is needed in normal setup.',
          profile,
          findings
        });
      }
    }
  }

  if (liteCapability.supported) {
    if (existingLiteReceipt?.ok) {
      const selection = markBrowserLocalLiteForChat();
      if (selection.ok) {
        emit(onProgress, { phase: 'ready', runtimeId: 'browserlocal', model: liteCapability.model, message: 'EON Local Lite is ready for private Chat.' });
        return Object.freeze({ ok: true, path: 'browser-lite', runtimeId: 'browserlocal', runtime: 'EON Local Lite', model: liteCapability.model, settings: selection.settings, profile });
      }
    }
    if (options.userApprovedBrowserLiteDownload === true) {
      emit(onProgress, { phase: 'browser-lite-download', runtimeId: 'browserlocal', message: 'Preparing the small Local Lite model…' });
      const prepared = await prepareBrowserLocalLite({ userApprovedDownload: true, tier: liteTier, onStatus: (status) => emit(onProgress, { phase: 'browser-lite-progress', runtimeId: 'browserlocal', message: status.message || 'Preparing Local Lite…' }) });
      if (prepared.ok) {
        const selection = markBrowserLocalLiteForChat();
        if (selection.ok) {
          emit(onProgress, { phase: 'ready', runtimeId: 'browserlocal', model: liteCapability.model, message: 'Local Lite is ready. EONBOT can now reply without sending the prompt to an AI server.' });
          return Object.freeze({ ok: true, path: 'browser-lite', runtimeId: 'browserlocal', runtime: 'EON Local Lite', model: liteCapability.model, proof: prepared.receipt, settings: selection.settings, profile });
        }
      }
      return Object.freeze({ ok: false, path: 'browser-lite', error: prepared.error || 'browser-lite-not-ready', message: prepared.message || 'Local Lite could not be prepared.', profile });
    }
    const approx = getBrowserLocalLiteApproximateWeightMb({ tier: liteCapability.recommendedTier, backend: liteCapability.preferredBackend });
    emit(onProgress, { phase: 'approval-required', runtimeId: 'browserlocal', message: `No ready desktop model was found. Local Lite can start here after one model download of about ${approx} MB.` });
    return Object.freeze({
      ok: false,
      path: 'browser-lite',
      approvalRequired: true,
      action: 'approve-browser-lite-download',
      approximateWeightMb: approx,
      message: `Local Lite is available on this device. Approve the one-time model download (about ${approx} MB) to finish setup.`,
      profile
    });
  }

  const bridge = await detectEonLocalBridge({ timeoutMs: 1800 });
  emit(onProgress, { phase: 'needs-desktop-setup', message: bridge.ok ? 'EON Local Companion is available; connect it to continue.' : 'Install or open one supported local runtime, then EON will detect it for you.' });
  return Object.freeze({
    ok: false,
    path: 'desktop-companion',
    companionAvailable: bridge.ok === true,
    companionPaired: Boolean(readEonLocalBridgeSession()),
    action: bridge.ok ? 'connect-companion' : 'install-local-runtime',
    message: bridge.ok
      ? 'EON Local Companion is running. Connect this browser once, then EON can use your approved local runtimes.'
      : 'This browser cannot run Local Lite and no ready desktop runtime was found. Use EON Local Companion or install one supported local runtime.',
    profile
  });
}
