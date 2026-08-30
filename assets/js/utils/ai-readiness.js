import { PROVIDERS, getApiKey, getProviderVerification, loadAISettings } from '../chat/ai-runtime.js';
import { buildModeGuidance, buildModeHeadline, normalizeModeSettings } from './eon-mode-system.js';
import { detectLocalAiCapabilityProfile, buildLocalWorkloadMatrix, buildLocalModelDiscoveryPlan, summarizeLocalCapabilityTruth } from './local-ai-capability-matrix.js';

export const CANONICAL_AI_SETUP_PATH = '/local-ai';
export const CANONICAL_AI_KEYS_PATH = '/vault#provider-check';
export const CANONICAL_AI_CHAT_PATH = '/';

const LOCAL_PROVIDER_IDS = new Set(['browserlocal', 'ollama', 'lmstudio', 'jan']);

function buildExplicitSetupRoutePlan({ providerId = 'guide', providerLabel = '', model = '' } = {}) {
  const selectedProviderId = String(providerId || 'guide').trim().toLowerCase() || 'guide';
  return Object.freeze({
    schema: 'eonapp.ai-explicit-setup-route.a15.v1',
    providerId: selectedProviderId,
    providerLabel: String(providerLabel || PROVIDERS[selectedProviderId]?.label || selectedProviderId).trim(),
    model: String(model || '').trim().slice(0, 180),
    source: 'explicit-user-selection-required',
    fallbackChain: Object.freeze([selectedProviderId]),
    automaticProviderSwitch: false,
    automaticModelSwitch: false,
    executionAuthority: false
  });
}

/**
 * @typedef {Object} ReadinessOptions
 * @property {string} [readyPrimaryLabel]
 * @property {string} [readyPrimaryUrl]
 * @property {string} [setupPrimaryLabel]
 * @property {string} [setupPrimaryUrl]
 * @property {string} [readySecondaryLabel]
 * @property {string} [readySecondaryUrl]
 * @property {string} [setupSecondaryLabel]
 * @property {string} [setupSecondaryUrl]
 */

/**
 * @typedef {Object} LocalProviderRow
 * @property {boolean} [available]
 * @property {string} [provider]
 * @property {any[]} [models]
 */

/**
 * @typedef {Object} SuperappContext
 * @property {string} [hardwareTier]
 * @property {LocalProviderRow[]} [localProviders]
 * @property {any} [gpu]
 * @property {any} [gpuRenderer]
 * @property {number} [ram]
 * @property {number} [memoryGB]
 * @property {number} [cpuCores]
 */

/**
 * @typedef {Object} LocalModelMatch
 * @property {string} providerId
 * @property {string} providerLabel
 * @property {string} modelId
 * @property {string} modelLabel
 * @property {string[]} capabilities
 */

/**
 * @typedef {Object} TaskMatch
 * @property {string} label
 * @property {string} desc
 * @property {string} modelId
 * @property {string} modelLabel
 * @property {string} providerLabel
 * @property {number} score
 */

/** @type {Record<string, string>} */
const CAPABILITY_TAGS = /** @type {any} */ (globalThis).EON_CAPABILITY_TAGS || {
  TEXT: 'text',
  CODE: 'code',
  IMAGE: 'image',
  VISION: 'vision',
  MULTILINGUAL: 'multilingual',
  EMBEDDING: 'embedding',
  TOOLS: 'tools',
  REASONING: 'reasoning',
  AUDIO: 'audio'
};

/**
 * @param {string} modelId
 * @returns {string[]}
 */
function inferModelCapabilities(modelId) {
  const id = String(modelId || '').toLowerCase();
  const caps = [CAPABILITY_TAGS.TEXT];
  if (/code|coder|codex|starcoder|deepseek.coder|wizard.*coder|codellama|phi.*code|qwen.*coder/.test(id)) caps.push(CAPABILITY_TAGS.CODE);
  if (/reason|math|qwq|r1|deepseek.r|o1|phi.4|mistral.large|llama.3.*70b|qwen.*72b|wizardmath|gemma.3|gemini.*think/.test(id)) caps.push(CAPABILITY_TAGS.REASONING);
  if (/vision|visual|llava|bakllava|qwen.*vl|intern.*vl|minicpm.*v|phi.*vision|cogvlm|pixtral|gemini|claude.*sonnet|gpt-4o|llama.*vision/.test(id)) caps.push(CAPABILITY_TAGS.VISION);
  if (/diffusion|sdxl|flux|dalle|dall-e|imagen|kandinsky|openjourney|midjourney|stable.*diffusion|sd-/.test(id)) caps.push(CAPABILITY_TAGS.IMAGE);
  if (/embed|bge|gte|e5|nomic.*embed|sfr.*embed|text-embedding|sentence-.*bert|mxbai|multilingual.*e5/.test(id)) caps.push(CAPABILITY_TAGS.EMBEDDING);
  if (/tool|function|hermes|firefunction|xtuner|gorilla|nexus|mistral.*instruct|llama.*instruct|qwen.*instruct|command-r/.test(id)) caps.push(CAPABILITY_TAGS.TOOLS);
  if (/multilingual|multi.lang|bloom|mistral|qwen|deepseek|command.r|aya|gemma|euro|fr-|de-|es-|zh-|ja-|ko-|ar-/.test(id)) caps.push(CAPABILITY_TAGS.MULTILINGUAL);
  if (/whisper|audio|speech|stt|asr|wav2vec|seamless/.test(id)) caps.push(CAPABILITY_TAGS.AUDIO);
  return [...new Set(caps)];
}

/**
 * @param {string[]} required
 * @param {string[]} available
 * @returns {number}
 */
function scoreCapabilityMatch(required, available) {
  if (!Array.isArray(required) || required.length === 0) return 1;
  if (!Array.isArray(available) || available.length === 0) return 0;
  const availSet = new Set(available);
  const matched = required.filter((c) => availSet.has(c)).length;
  return matched / required.length;
}

/**
 * @param {any} [settings]
 */
function normalizeSettings(settings = loadAISettings()) {
  const raw = normalizeModeSettings(settings && typeof settings === 'object' ? settings : {});
  const providerId = String(raw.provider || raw.providerId || 'guide').trim() || 'guide';
  const provider = PROVIDERS[providerId] || PROVIDERS.guide;
  const mode = String(raw.mode || 'guide').trim() || 'guide';
  const model = String(raw.model || '').trim();
  const endpoint = String(raw.endpoint || provider.defaultEndpoint || '').trim();
  return { raw, providerId, provider, mode, model, endpoint, assistantMode: raw.assistantMode || 'auto', runtimePreference: raw.runtimePreference || 'hybrid' };
}

/**
 * @param {string} label
 * @param {string} url
 */
function buildAction(label, url) {
  return {
    label: String(label || '').trim(),
    url: String(url || '').trim()
  };
}

function buildTrustSummary(normalized = {}, runtimeType = 'guide') {
  if (normalized.assistantMode === 'guide') {
    return 'Guide Mode stays in product-help mode until you configure a provider securely in Vault or complete a detected local runtime self-test.';
  }
  if (normalized.assistantMode === 'auto') {
    return runtimeType === 'local'
      ? 'Auto Mode can choose among verified models on the selected local runtime for each user-started turn. It does not switch providers or start external actions by itself.'
      : 'Auto Mode can choose among verified models on the selected provider for each user-started turn. It does not switch providers or start external actions by itself.';
  }
  return 'Advanced Mode gives you more direct control, but submit and sensitive actions still require approval.';
}

/**
 * @param {any} [settings]
 * @param {ReadinessOptions} [options]
 */
export function getAIReadiness(settings = loadAISettings(), options = /** @type {any} */ ({})) {
  const normalized = normalizeSettings(settings);
  const provider = normalized.provider;
  const providerId = normalized.providerId;
  const providerLabel = provider.label || providerId;
  const mode = normalized.mode;
  const assistantMode = normalized.assistantMode;
  const runtimePreference = normalized.runtimePreference;
  const requestedModel = normalized.model;
  const endpoint = normalized.endpoint;
  const apiKey = getApiKey(providerId);
  const runtimeType = LOCAL_PROVIDER_IDS.has(providerId)
    ? 'local'
    : providerId === 'guide'
      ? 'guide'
      : 'hosted';

  const hasKey = !provider.requiresApiKey || Boolean(apiKey);
  const hasEndpoint = !provider.supportsEndpoint || Boolean(endpoint);
  const verification = getProviderVerification(providerId, normalized);
  const effectiveModel = verification.ready ? String(verification.model || requestedModel || '') : '';
  const hasModel = Boolean(effectiveModel || provider.id === 'guide');

  let state = verification.state || 'verification-required';
  let ready = Boolean(verification.ready);
  let reason = verification.reason || '';

  if (assistantMode === 'guide' || mode === 'guide' || providerId === 'guide') {
    state = 'guide';
    ready = false;
    reason = 'Guide Mode is active. Connect a provider in Vault or complete a Local AI self-test for model-powered replies.';
  } else if (!hasEndpoint) {
    state = 'needs-endpoint';
    ready = false;
    reason = `Add an endpoint for ${providerLabel}.`;
  } else if (!verification.ready) {
    ready = false;
    reason = verification.reason || (!hasKey
      ? `Open Vault to add and verify a ${providerLabel} key.`
      : `Run a current compatibility check for ${providerLabel} in Vault.`);
  }

  const modeHeadline = buildModeHeadline(normalized.raw, { providerLabel });
  const modeGuidance = buildModeGuidance(normalized.raw, { providerLabel });
  const trustSummary = buildTrustSummary(normalized, runtimeType);

  const detail = ready
    ? `${modeHeadline} · ${runtimeType}${effectiveModel ? ` · ${effectiveModel}` : ''} · verified ${runtimeType === 'local' ? 'device self-test' : 'provider compatibility'}`
    : `${modeHeadline} · ${reason}`;

  const bannerLabel = ready
    ? `${providerLabel} verified`
    : assistantMode === 'guide' || providerId === 'guide'
      ? 'Guide mode active'
      : `${providerLabel} verification needed`;

  const bannerBody = ready
    ? `${buildModeGuidance(normalized.raw, { providerLabel })} Verified ${runtimeType === 'local' ? 'on this device' : 'from a current provider model list'} at ${verification.checkedAt || 'this session'}.`
    : assistantMode === 'guide'
      ? 'Guide Mode can explain the app now. Complete a Local AI self-test or run a Vault provider verification when you want model-powered replies.'
      : `${reason} ${buildModeGuidance(normalized.raw, { providerLabel })}`;

  return {
    ready,
    state,
    reason,
    providerId,
    providerLabel,
    model: effectiveModel,
    endpoint,
    mode,
    assistantMode,
    runtimePreference,
    runtimeType,
    verification,
    label: bannerLabel,
    detail,
    bannerLabel,
    bannerBody,
    modeHeadline,
    modeGuidance,
    trustSummary,
    primaryAction: ready
      ? buildAction(options.readyPrimaryLabel || 'Open AI Chat', options.readyPrimaryUrl || CANONICAL_AI_CHAT_PATH)
      : buildAction(options.setupPrimaryLabel || (runtimeType === 'local' ? 'Open Local AI setup' : 'Open Vault verification'), options.setupPrimaryUrl || (runtimeType === 'local' ? CANONICAL_AI_SETUP_PATH : CANONICAL_AI_KEYS_PATH)),
    secondaryAction: ready
      ? buildAction(options.readySecondaryLabel || 'Review provider status', options.readySecondaryUrl || CANONICAL_AI_KEYS_PATH)
      : buildAction(options.setupSecondaryLabel || 'Review provider status', options.setupSecondaryUrl || CANONICAL_AI_KEYS_PATH),
    hasKey,
    hasModel,
    hasEndpoint
  };
}
/**
 * @param {any} [settings]
 * @param {ReadinessOptions} [options]
 */
export function getAIReadinessText(settings = loadAISettings(), options = /** @type {any} */ ({})) {
  const readiness = getAIReadiness(settings, options);
  return `${readiness.label} · ${readiness.detail}`;
}

/**
 * @param {any[]} rows
 * @returns {string[]}
 */
function dedupeStrings(rows = []) {
  return [...new Set(rows.map((row) => String(row || '').trim()).filter(Boolean))];
}

const TASK_MATCH_PROFILES = [
  { label: 'Browser Copilot', caps: [CAPABILITY_TAGS.TEXT, CAPABILITY_TAGS.REASONING, CAPABILITY_TAGS.TOOLS], desc: 'Guided browser work, summaries, compare mode, and browser handoffs.' },
  { label: 'Code Maker', caps: [CAPABILITY_TAGS.CODE, CAPABILITY_TAGS.TOOLS, CAPABILITY_TAGS.REASONING], desc: 'Websites, apps, structured code generation, and debug help.' },
  { label: 'Creator Suite', caps: [CAPABILITY_TAGS.TEXT, CAPABILITY_TAGS.VISION, CAPABILITY_TAGS.MULTILINGUAL], desc: 'Scripts, image prompts, captions, and localization.' },
  { label: 'Video Lab', caps: [CAPABILITY_TAGS.VISION, CAPABILITY_TAGS.REASONING, CAPABILITY_TAGS.TOOLS], desc: 'Storyboard, edit plan, captions, and publish-ready video support.' },
  { label: 'Music Lab', caps: [CAPABILITY_TAGS.AUDIO, CAPABILITY_TAGS.REASONING, CAPABILITY_TAGS.TOOLS], desc: 'Music prompts, voice workflow, and audio production support.' },
  { label: 'Translator', caps: [CAPABILITY_TAGS.MULTILINGUAL, CAPABILITY_TAGS.TEXT], desc: 'Localization, RTL copy, and multilingual help output.' },
  { label: 'Private Inference', caps: [CAPABILITY_TAGS.TEXT], desc: 'Private device inference without sending keys to a cloud provider.' }
];

/**
 * @param {LocalProviderRow[]} localProviders
 */
function buildTaskMatches(localProviders = []) {
  const liveProviders = Array.isArray(localProviders) ? localProviders.filter((/** @type {LocalProviderRow} */ row) => row && row.available) : [];
  /** @type {LocalModelMatch[]} */
  const localModels = liveProviders.flatMap((/** @type {LocalProviderRow} */ row) => {
    const providerId = String(row.provider || '').trim();
    const providerLabel = PROVIDERS[providerId]?.label || providerId;
    return (Array.isArray(row.models) ? row.models : []).map((model) => {
      const modelName = String(model || '').trim();
      return {
        providerId,
        providerLabel,
        modelId: modelName,
        modelLabel: modelName,
        capabilities: inferModelCapabilities(modelName)
      };
    });
  }).filter((/** @type {LocalModelMatch} */ row) => row.modelId);

  if (!localModels.length) return [];

  return TASK_MATCH_PROFILES.map((task) => {
    const ranked = localModels
      .map((/** @type {LocalModelMatch} */ model) => ({
        model,
        score: scoreCapabilityMatch(task.caps, model.capabilities)
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.model.modelLabel).localeCompare(String(b.model.modelLabel));
      });
    const top = ranked[0];
    return top && top.score > 0
      ? {
          label: task.label,
          desc: task.desc,
          modelId: top.model.modelId,
          modelLabel: top.model.modelLabel,
          providerLabel: top.model.providerLabel,
          score: top.score
        }
      : null;
  }).filter((/** @type {TaskMatch | null} */ value) => Boolean(value));
}

/**
 * @param {any} [settings]
 * @param {SuperappContext} [context]
 */
export function getSuperappSetupPlan(settings = loadAISettings(), context = {}) {
  const localProviders = Array.isArray(context.localProviders) ? context.localProviders : [];
  const capabilityProfile = detectLocalAiCapabilityProfile({
    gpu: context.gpu,
    gpuRenderer: context.gpuRenderer || context.gpu,
    ram: context.ram || context.memoryGB,
    memoryGB: context.memoryGB,
    cpuCores: context.cpuCores
  });
  const readiness = getAIReadiness(settings, /** @type {any} */ ({ ...context, hardwareTier: capabilityProfile.tier }));
  const hardwareTier = String(context.hardwareTier || capabilityProfile.tier || 'unknown').toLowerCase();
  const localLiveProviders = localProviders.filter((/** @type {LocalProviderRow} */ row) => row && row.available);
  const localModelNames = dedupeStrings(
    localLiveProviders.flatMap((/** @type {LocalProviderRow} */ row) => Array.isArray(row.models) ? row.models : [])
  );
  const localProviderNames = dedupeStrings(localLiveProviders.map((/** @type {LocalProviderRow} */ row) => row.provider));
  const localProviderLabels = dedupeStrings(
    localLiveProviders.map((/** @type {LocalProviderRow} */ row) => PROVIDERS[row.provider || 'guide']?.label || row.provider)
  );
  const recommendedMatches = buildTaskMatches(localProviders);
  const hasLocalRuntime = localLiveProviders.length > 0;
  const hasLocalModels = localModelNames.length > 0;
  const workloadMatrix = buildLocalWorkloadMatrix(capabilityProfile, { localProviders });
  const capabilityTruth = summarizeLocalCapabilityTruth(capabilityProfile, workloadMatrix);
  const discoveryPlan = buildLocalModelDiscoveryPlan(capabilityProfile, { localProviders, workloadMatrix });
  const localRecommended = hardwareTier === 'high' || hardwareTier === 'medium' || hasLocalRuntime;
  const suggestedLocalLabel = localProviderNames.length
    ? `Use ${localProviderLabels.join(' + ')}`
    : 'Set up a local model runtime';

  let recommendedProviderId = readiness.providerId;
  let recommendedReason = readiness.reason || readiness.bannerBody;

  if (!readiness.ready) {
    if (localRecommended && hasLocalRuntime) {
      recommendedProviderId = localLiveProviders[0].provider || recommendedProviderId;
      recommendedReason = hasLocalModels
        ? `Your device can run local models: ${localModelNames.slice(0, 3).join(', ')}. ${capabilityTruth.summary}`
        : `Your device can run a private local runtime. ${capabilityTruth.summary}`;
    } else if (hardwareTier === 'low') {
      recommendedReason = `Cloud providers are the fastest path on this device. ${capabilityTruth.summary}`;
    }
  }

  const setupBullets = [];
  if (readiness.ready) {
    setupBullets.push(`Provider ready: ${readiness.providerLabel}`);
  } else {
    setupBullets.push(readiness.bannerBody || readiness.reason || 'AI setup needed.');
  }
  if (hasLocalRuntime) {
    setupBullets.push(`Local runtimes detected: ${localProviderNames.join(', ')}.`);
  } else {
    setupBullets.push('No local runtime detected yet.');
  }
  if (hasLocalModels) {
    setupBullets.push(`Local models available: ${localModelNames.slice(0, 4).join(', ')}.`);
  }
  if (capabilityTruth.summary) {
    setupBullets.push(capabilityTruth.summary);
  }
  if (recommendedMatches.length) {
    const topMatches = /** @type {TaskMatch[]} */ (recommendedMatches.slice(0, 3));
    setupBullets.push(`Top task matches: ${topMatches.map((row) => `${row.label} → ${row.modelLabel} (${row.providerLabel})`).join(' · ')}.`);
    if (!readiness.ready && localRecommended && hasLocalRuntime) {
      const bestMatches = /** @type {TaskMatch[]} */ (recommendedMatches.slice(0, 2));
      recommendedReason = `${recommendedReason} Best local task fits: ${bestMatches.map((row) => `${row.label} → ${row.modelLabel}`).join(' · ')}.`;
    }
  }

  const routeProviderId = readiness.ready ? readiness.providerId : recommendedProviderId;
  const routeProviderLabel = PROVIDERS[routeProviderId]?.label || routeProviderId || 'Guide';
  const routeModel = readiness.ready
    ? readiness.model
    : recommendedMatches.find((row) => row.providerLabel === routeProviderLabel)?.modelId || '';
  const routePlan = buildExplicitSetupRoutePlan({ providerId: routeProviderId, providerLabel: routeProviderLabel, model: routeModel });
  const routeLabels = [routePlan.providerLabel].filter(Boolean);
  const routeSummary = `${routePlan.providerLabel} suggested · choose explicitly before any request`;
  const routeBullets = [`No automatic provider or model fallback. Review and choose ${routePlan.providerLabel} before sending.`];

  return {
    readiness,
    hardwareTier,
    hasLocalRuntime,
    hasLocalModels,
    localProviderNames,
    localProviderLabels,
    localModelNames,
    recommendedMatches,
    recommendedProviderId,
    recommendedReason,
    suggestedLocalLabel,
    suggestedNextStep: readiness.ready ? 'Open AI Chat' : ((readiness.runtimeType === 'local' || hasLocalRuntime) ? 'Open Local AI setup' : 'Open Vault verification'),
    setupBullets: [...setupBullets, ...routeBullets],
    routePlan,
    routeSummary,
    routeLabels,
    capabilityProfile,
    workloadMatrix,
    capabilityTruth,
    discoveryPlan
  };
}
