/**
 * Institutional model intelligence registry.
 *
 * It ranks only models that a caller has already discovered/verified. It does
 * not fetch providers, read secrets, download weights or switch providers.
 */
export const EON_MODEL_INTELLIGENCE_SCHEMA = 'eonapp.model-intelligence.v1';
export const EON_MODEL_POLICY_MODES = Object.freeze(['auto', 'private', 'best', 'fast', 'economy']);

const LOCAL_PROVIDER_IDS = new Set(['browserlocal', 'ollama', 'lmstudio', 'jan']);
const clean = (value = '') => String(value || '').trim();

function parseSizeB(modelId = '') {
  const id = clean(modelId).toLowerCase();
  const matches = [...id.matchAll(/(?:^|[-_:/.])(\d+(?:\.\d+)?)b(?:$|[-_:/.])/g)];
  if (!matches.length) return 0;
  return Math.max(...matches.map((match) => Number(match[1]) || 0));
}

function inferTraits(modelId = '') {
  const id = clean(modelId).toLowerCase();
  return Object.freeze({
    reasoning: /reason|thinking|r1|o[134](?:-|$)|qwq/.test(id),
    coding: /code|coder|codestral|devstral/.test(id),
    vision: /vision|vl(?:-|:|$)|multimodal|pixtral/.test(id),
    fast: /flash|mini|small|nano|lite|instant|luna|8b|7b|4b|3b|2b|1b/.test(id),
    premium: /pro|sol(?:-|$)|large|max(?:-|$)|opus|sonnet|70b|72b|120b|235b|405b/.test(id) || /^(?:gpt|grok)-\d+(?:\.\d+)?$/.test(id),
    preview: /preview|beta|experimental|exp(?:-|$)/.test(id),
    embedding: /embed|embedding|rerank/.test(id),
    audio: /audio|whisper|tts|speech/.test(id),
    imageOnly: /image|diffusion|flux|sdxl/.test(id)
  });
}

export function describeEonModel(model, providerId = '', metadata = {}) {
  const id = clean(typeof model === 'string' ? model : model?.id || model?.model || '');
  const provider = clean(providerId || metadata.providerId || (typeof model === 'object' ? model?.providerId : '')).toLowerCase();
  const local = LOCAL_PROVIDER_IDS.has(provider) || metadata.local === true;
  const sizeB = Number(metadata.sizeB || parseSizeB(id));
  const traits = inferTraits(id);
  return Object.freeze({
    schema: EON_MODEL_INTELLIGENCE_SCHEMA,
    id,
    providerId: provider,
    local,
    sizeB,
    traits,
    metadataAuthority: metadata.providerReported === true ? 'provider-reported' : 'name-heuristic-fallback',
    contextWindow: Math.max(0, Number(metadata.contextWindow || 0)),
    outputTokenLimit: Math.max(0, Number(metadata.outputTokenLimit || 0)),
    sizeBytes: Math.max(0, Number(metadata.sizeBytes || 0)),
    quantization: clean(metadata.quantization || ''),
    publisher: clean(metadata.publisher || ''),
    modelType: clean(metadata.modelType || '').toLowerCase(),
    estimatedMemoryGB: Math.max(0, Number(metadata.estimatedMemoryGB || metadata.estimatedRamGB || 0)),
    measuredTokensPerSecond: Math.max(0, Number(metadata.measuredTokensPerSecond || metadata.tokensPerSecond || 0)),
    firstTokenLatencyMs: Math.max(0, Number(metadata.firstTokenLatencyMs || 0)),
    reliability: Math.max(0, Math.min(1, Number(metadata.reliability ?? 0.72))),
    evalScore: Math.max(0, Math.min(100, Number(metadata.evalScore || 0))),
    costClass: clean(metadata.costClass || (local ? 'local' : 'unknown')).toLowerCase(),
    capabilities: Object.freeze({
      chat: metadata.chat !== false && !traits.embedding && !traits.imageOnly && !traits.audio,
      reasoning: metadata.reasoning ?? traits.reasoning,
      coding: metadata.coding ?? traits.coding,
      vision: metadata.vision ?? traits.vision,
      toolCalling: metadata.toolCalling ?? false,
      structuredOutput: metadata.structuredOutput ?? false
    })
  });
}

function deviceFitScore(model, device = {}) {
  if (!model.local) return 0;
  const memory = Number(device.memoryGB || device.memoryGb || device.ram || 0);
  if (!model.sizeB || !memory) return 2;
  // Planning estimate for common quantized local inference. Prefer explicit
  // runtime/model metadata when available; otherwise use a cautious lower
  // bound plus OS/browser headroom. A real foreground self-test remains the
  // authority and can supply measured memory evidence later.
  const estimated = model.estimatedMemoryGB || (model.sizeB * 0.75 + 3);
  if (memory >= estimated * 1.25) return 12;
  if (memory >= estimated) return 5;
  // Institutional fail-closed admission: a discovered model name is not enough
  // to justify attempting a clearly oversized local model on this device.
  return -1000;
}

function taskScore(model, taskType = 'chat') {
  const task = clean(taskType).toLowerCase();
  let score = 0;
  if (!model.capabilities.chat) return -1000;
  if (/code|forge/.test(task)) score += model.capabilities.coding ? 34 : 0;
  if (/reason|strategy|high.stakes|planning/.test(task)) score += model.capabilities.reasoning ? 28 : 0;
  if (/vision|image.analysis/.test(task)) score += model.capabilities.vision ? 30 : -20;
  if (/tool|agent/.test(task)) score += model.capabilities.toolCalling ? 22 : 0;
  return score;
}

function modeScore(model, mode = 'auto') {
  const policy = EON_MODEL_POLICY_MODES.includes(mode) ? mode : 'auto';
  let score = 0;
  if (policy === 'private') score += model.local ? 70 : -1000;
  if (policy === 'best') score += model.traits.premium ? 22 : 0;
  if (policy === 'fast') score += model.traits.fast ? 28 : 0;
  if (policy === 'economy') score += model.local || model.costClass === 'free' ? 40 : model.costClass === 'low' ? 20 : model.traits.fast ? 10 : -5;
  if (policy === 'auto') score += (model.traits.premium ? 8 : 0) + (model.traits.fast ? 3 : 0) + (model.local ? 4 : 0);
  return score;
}

export function scoreEonModelCandidate(model, options = {}) {
  const descriptor = model?.schema === EON_MODEL_INTELLIGENCE_SCHEMA ? model : describeEonModel(model, options.providerId, options.metadata || {});
  let score = 50;
  score += taskScore(descriptor, options.taskType || 'chat');
  score += modeScore(descriptor, clean(options.mode || 'auto').toLowerCase());
  score += deviceFitScore(descriptor, options.device || {});
  score += descriptor.reliability * 18;
  score += descriptor.evalScore ? descriptor.evalScore * 0.25 : 0;
  score += descriptor.measuredTokensPerSecond ? Math.min(18, descriptor.measuredTokensPerSecond / 4) : 0;
  score -= descriptor.firstTokenLatencyMs ? Math.min(15, descriptor.firstTokenLatencyMs / 500) : 0;
  if (descriptor.traits.preview) score -= 7;
  if (descriptor.traits.embedding || descriptor.traits.audio || descriptor.traits.imageOnly) score -= 1000;
  if (options.requireVision && !descriptor.capabilities.vision) score -= 1000;
  if (options.requireTools && !descriptor.capabilities.toolCalling) score -= 1000;
  return Object.freeze({ descriptor, score: Math.round(score * 100) / 100 });
}

export function rankEonModelCandidates(models = [], providerId = '', options = {}) {
  return Object.freeze((Array.isArray(models) ? models : [])
    .map((model) => scoreEonModelCandidate(describeEonModel(model, providerId, options.metadataByModel?.[clean(model)] || {}), { ...options, providerId }))
    .filter((row) => row.descriptor.id && row.score > -500)
    .sort((a, b) => b.score - a.score || a.descriptor.id.localeCompare(b.descriptor.id)));
}

export const EON_VERIFIED_MODEL_ENVELOPE_MAX = 48;

/**
 * Compacts a provider model list into a finite verified request envelope without
 * trusting provider response order. The envelope preserves the current winner
 * plus diverse top candidates for chat/code/reasoning across Auto/Best/Fast/
 * Economy, then fills remaining capacity from the verified list. It does not
 * fetch, switch providers, price models or infer permission from discovery.
 */
export function buildEonVerifiedModelEnvelope(models = [], providerId = '', options = {}) {
  const unique = [...new Set((Array.isArray(models) ? models : [])
    .map((model) => clean(typeof model === 'string' ? model : model?.id || model?.model || ''))
    .filter(Boolean))];
  const limit = Math.max(8, Math.min(Number(options.limit || EON_VERIFIED_MODEL_ENVELOPE_MAX), EON_VERIFIED_MODEL_ENVELOPE_MAX));
  const ordered = new Set();
  const preferred = clean(options.preferredModel || '');
  if (preferred && unique.includes(preferred)) ordered.add(preferred);

  const tasks = ['chat', 'code', 'reasoning'];
  const modes = ['auto', 'best', 'fast', 'economy'];
  for (const taskType of tasks) {
    for (const mode of modes) {
      const ranked = rankEonModelCandidates(unique, providerId, {
        mode,
        taskType,
        device: options.device || {},
        metadataByModel: options.metadataByModel || {},
        topK: 4
      });
      for (const row of ranked.slice(0, 4)) {
        ordered.add(row.descriptor.id);
        if (ordered.size >= limit) return Object.freeze([...ordered]);
      }
    }
  }

  for (const id of unique) {
    ordered.add(id);
    if (ordered.size >= limit) break;
  }
  return Object.freeze([...ordered]);
}

export function selectEonInstitutionalModel(models = [], providerId = '', options = {}) {
  const ranked = rankEonModelCandidates(models, providerId, options);
  const winner = ranked[0] || null;
  return Object.freeze({
    schema: EON_MODEL_INTELLIGENCE_SCHEMA,
    model: winner?.descriptor?.id || '',
    score: winner?.score ?? null,
    policy: EON_MODEL_POLICY_MODES.includes(clean(options.mode).toLowerCase()) ? clean(options.mode).toLowerCase() : 'auto',
    taskType: clean(options.taskType || 'chat') || 'chat',
    candidateCount: ranked.length,
    reason: winner ? `ranked-verified-candidate:${winner.descriptor.id}` : 'no-compatible-verified-candidate',
    ranked: Object.freeze(ranked.slice(0, Math.max(1, Math.min(Number(options.topK || 5), 12))))
  });
}

export function getEonModelIntelligenceTruth() {
  return Object.freeze({
    schema: EON_MODEL_INTELLIGENCE_SCHEMA,
    ranksDiscoveredCandidatesOnly: true,
    verifiedEnvelopeFinite: true,
    verifiedEnvelopeMaximum: EON_VERIFIED_MODEL_ENVELOPE_MAX,
    providerResponseOrderAuthoritative: false,
    policyTaskDiverseEnvelope: true,
    readsSecrets: false,
    downloadsModels: false,
    switchesProviders: false,
    supportsPolicies: EON_MODEL_POLICY_MODES,
    deviceAware: true,
    benchmarkAware: true,
    providerMetadataPreferredOverNameHeuristics: true,
    unknownCapabilitiesRemainUnknown: true
  });
}
