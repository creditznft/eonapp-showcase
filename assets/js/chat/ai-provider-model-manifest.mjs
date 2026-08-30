/**
 * Normalizes model-list responses into a privacy-safe verified manifest.
 *
 * Only bounded provider/runtime-reported facts are retained. Descriptions,
 * arbitrary metadata blobs, pricing claims and credentials are intentionally
 * excluded. Name-derived traits remain a lower-authority fallback in the model
 * intelligence registry.
 */
export const EON_PROVIDER_MODEL_MANIFEST_SCHEMA = 'eonapp.provider-model-manifest.v2';

const clean = (value = '', max = 180) => String(value || '').replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const finite = (value, max = Number.MAX_SAFE_INTEGER) => Number.isFinite(Number(value)) && Number(value) >= 0 ? Math.min(max, Number(value)) : 0;

function listRows(data = null) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.models)) return data.models;
  return [];
}

function parseSizeB(value = '') {
  const raw = clean(value, 80).toUpperCase();
  const match = raw.match(/(\d+(?:\.\d+)?)\s*([BM])/);
  if (!match) return 0;
  const amount = Number(match[1]) || 0;
  return match[2] === 'M' ? amount / 1000 : amount;
}

function modelId(row = null) {
  if (typeof row === 'string') return clean(row);
  return clean(row?.id || row?.key || row?.name || row?.model || '');
}

function normalizeReasoning(row = {}, providerId = '') {
  if (providerId === 'gemini' && row?.thinking === true) return true;
  const reasoning = row?.capabilities?.reasoning;
  if (reasoning && typeof reasoning === 'object') return true;
  return reasoning === true ? true : undefined;
}

function normalizeChat(row = {}, providerId = '') {
  const type = clean(row?.type || row?.object || '', 40).toLowerCase();
  if (['embedding', 'embeddings', 'image', 'audio', 'moderation', 'rerank'].includes(type)) return false;
  if (['chat', 'language', 'text'].includes(type)) return true;
  const capabilities = row?.capabilities && typeof row.capabilities === 'object' ? row.capabilities : {};
  if (typeof capabilities.completion_chat === 'boolean') return capabilities.completion_chat;
  if (providerId === 'gemini' && Array.isArray(row?.supportedGenerationMethods)) {
    return row.supportedGenerationMethods.includes('generateContent');
  }
  if (providerId === 'xai' && Array.isArray(row?.output_modalities)) {
    return row.output_modalities.includes('text');
  }
  if (providerId === 'fireworks') {
    // Fireworks documents conversationConfig as the authority that Chat
    // Completions is enabled for a listed model. Fail closed for serverless
    // models without that contract instead of attempting an image/embedding
    // model by name heuristic.
    return Boolean(row?.conversationConfig && typeof row.conversationConfig === 'object');
  }
  return undefined;
}

function selectHuggingFaceRoutingProvider(row = {}) {
  const providers = Array.isArray(row?.providers) ? row.providers : [];
  const live = providers
    .filter((item) => clean(item?.status, 24).toLowerCase() === 'live')
    .map((item) => ({
      id: clean(item?.provider, 72).toLowerCase(),
      throughput: finite(item?.throughput, 1_000_000),
      latencyMs: finite(item?.first_token_latency_ms, 10_000_000),
      supportsTools: typeof item?.supports_tools === 'boolean' ? item.supports_tools : undefined,
      supportsStructuredOutput: typeof item?.supports_structured_output === 'boolean' ? item.supports_structured_output : undefined
    }))
    .filter((item) => /^[a-z0-9][a-z0-9._-]{0,71}$/.test(item.id));
  if (!live.length) return null;
  live.sort((a, b) => (b.throughput - a.throughput) || ((a.latencyMs || Number.MAX_SAFE_INTEGER) - (b.latencyMs || Number.MAX_SAFE_INTEGER)) || a.id.localeCompare(b.id));
  return live[0];
}

function normalizeMetadata(row = {}, providerId = '') {
  const details = row?.details && typeof row.details === 'object' ? row.details : {};
  const capabilities = row?.capabilities && typeof row.capabilities === 'object' ? row.capabilities : {};
  const loaded = Array.isArray(row?.loaded_instances) ? row.loaded_instances : [];
  const loadedContext = loaded.reduce((max, instance) => Math.max(max, finite(instance?.config?.context_length, 10_000_000)), 0);
  const limits = row?.limits && typeof row.limits === 'object' ? row.limits : {};
  const topProvider = row?.top_provider && typeof row.top_provider === 'object' ? row.top_provider : {};
  const contextWindow = finite(row?.max_context_length || row?.inputTokenLimit || row?.context_length || limits?.max_context_length || topProvider?.context_length || loadedContext, 10_000_000);
  const sizeB = parseSizeB(row?.params_string || details?.parameter_size || '');
  const sizeBytes = finite(row?.size_bytes || row?.size, Number.MAX_SAFE_INTEGER);
  const chat = normalizeChat(row, providerId);
  const reasoning = normalizeReasoning(row, providerId);
  const vision = typeof capabilities?.vision === 'boolean'
    ? capabilities.vision
    : /\bvlm\b/i.test(clean(row?.type || '', 40)) ? true : undefined;
  const toolCalling = typeof capabilities?.trained_for_tool_use === 'boolean'
    ? capabilities.trained_for_tool_use
    : typeof capabilities?.tool_calling === 'boolean'
      ? capabilities.tool_calling
      : typeof capabilities?.function_calling === 'boolean'
        ? capabilities.function_calling
        : undefined;
  const quantization = clean(row?.quantization?.name || row?.quantization || details?.quantization_level || '', 48);
  const publisher = clean(row?.publisher || row?.owned_by || '', 100);
  const modelType = clean(row?.type || '', 40).toLowerCase();
  const outputTokenLimit = finite(row?.outputTokenLimit || row?.max_completion_tokens || limits?.max_completion_tokens || topProvider?.max_completion_tokens, 10_000_000);
  const createdAtUnix = finite(row?.created, 10_000_000_000);
  const huggingFaceRoute = providerId === 'huggingface' ? selectHuggingFaceRoutingProvider(row) : null;

  const metadata = {
    providerReported: true,
    metadataSource: `${clean(providerId, 48).toLowerCase() || 'provider'}:model-list`
  };
  if (contextWindow) metadata.contextWindow = contextWindow;
  if (outputTokenLimit) metadata.outputTokenLimit = outputTokenLimit;
  if (sizeB) metadata.sizeB = sizeB;
  if (sizeBytes) metadata.sizeBytes = sizeBytes;
  if (chat !== undefined) metadata.chat = chat;
  if (reasoning !== undefined) metadata.reasoning = reasoning;
  if (vision !== undefined) metadata.vision = vision;
  if (toolCalling !== undefined) metadata.toolCalling = toolCalling;
  if (quantization) metadata.quantization = quantization;
  if (publisher) metadata.publisher = publisher;
  if (modelType) metadata.modelType = modelType;
  if (createdAtUnix) metadata.createdAtUnix = createdAtUnix;
  if (huggingFaceRoute) {
    metadata.routingProvider = huggingFaceRoute.id;
    metadata.routingPolicy = 'eon-pinned-live-provider';
    if (huggingFaceRoute.supportsTools !== undefined) metadata.routingSupportsTools = huggingFaceRoute.supportsTools;
    if (huggingFaceRoute.supportsStructuredOutput !== undefined) metadata.routingSupportsStructuredOutput = huggingFaceRoute.supportsStructuredOutput;
  }
  return Object.freeze(metadata);
}

export function extractProviderModelManifest(data = null, providerId = '') {
  const provider = clean(providerId, 48).toLowerCase();
  const seen = new Set();
  const rows = [];
  for (const row of listRows(data)) {
    const id = modelId(row);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    rows.push(Object.freeze({
      schema: EON_PROVIDER_MODEL_MANIFEST_SCHEMA,
      id,
      providerId: provider,
      metadata: normalizeMetadata(typeof row === 'object' && row ? row : {}, provider)
    }));
  }
  return Object.freeze(rows);
}

/**
 * Provider-specific execution normalization. Perplexity's /v1/models endpoint
 * is an Agent-API catalogue, while this runtime executes the Sonar API. Do not
 * pass third-party Agent model IDs into /v1/sonar. The shared Sonar entry is
 * normalized to the Sonar execution ID; additional Sonar variants remain
 * fail-closed until a dedicated user-owned compatibility proof enables them.
 */
export function normalizeProviderModelManifestForExecution(manifest = [], providerId = '') {
  const provider = clean(providerId, 48).toLowerCase();
  const rows = Array.isArray(manifest) ? manifest : [];
  if (provider === 'huggingface') {
    // Hugging Face's OpenAI-compatible router otherwise defaults to provider=auto
    // and may fail over between upstream providers. Keep EONAPP's no-hidden-
    // fallback contract by retaining only models whose current catalogue lets
    // us pin one explicit live upstream provider for this verification cycle.
    return Object.freeze(rows.filter((row) => /^[a-z0-9][a-z0-9._-]{0,71}$/.test(clean(row?.metadata?.routingProvider, 72).toLowerCase())));
  }
  if (provider !== 'perplexity') return Object.freeze([...rows]);
  return Object.freeze(rows
    .filter((row) => {
      const id = clean(row?.id, 180).toLowerCase();
      const publisher = clean(row?.metadata?.publisher, 100).toLowerCase();
      const sonarId = id === 'perplexity/sonar' || id === 'sonar';
      return sonarId && (!publisher || publisher === 'perplexity');
    })
    .map((row) => Object.freeze({ ...row, id: 'sonar' })));
}

export function manifestMetadataByModel(manifest = []) {
  const out = {};
  for (const row of Array.isArray(manifest) ? manifest : []) {
    if (!row?.id || !row?.metadata || typeof row.metadata !== 'object') continue;
    out[String(row.id)] = { ...row.metadata };
  }
  return Object.freeze(out);
}

/** Compatibility helper retained for older callers/tests. */
export function extractOpenAICompatibleModelIds(data = null) {
  return extractProviderModelManifest(data, '').map((row) => row.id);
}

export function getProviderModelManifestTruth() {
  return Object.freeze({
    schema: EON_PROVIDER_MODEL_MANIFEST_SCHEMA,
    providerReportedFactsOnly: true,
    arbitraryDescriptionsStored: false,
    pricingInferred: false,
    credentialsStored: false,
    promptStored: false,
    responseStored: false,
    supportsGeminiTokenLimits: true,
    supportsOllamaSizeMetadata: true,
    supportsLmStudioNativeCapabilities: true,
    openAiCompatibleBasicMetadata: true,
    nestedProviderLimitsSupported: true,
    perplexitySonarExecutionCatalogueSeparated: true,
    huggingFaceUpstreamProviderPinned: true
  });
}
