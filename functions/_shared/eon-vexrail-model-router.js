export const VEXRAIL_MODELS_UPSTREAM = 'https://api.vexrail.com/v1/models';
export const EON_VEXRAIL_REQUEST_CLASSES = Object.freeze([
  'simple_chat', 'ordinary_productivity', 'coding_building', 'complex_reasoning'
]);

const MODEL_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_MODEL_ID = 160;
let modelCache = Object.freeze({ key: '', expiresAt: 0, ids: Object.freeze([]) });

function clean(value = '', max = 160) {
  return String(value || '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
}

// Vexrail's `owned_by` field is not a reliable provider signal. Keep this
// classification derived only from the stable model identifier, and make
// unknown future ids supported-but-unqualified rather than rejecting them.
export function classifyVexrailModelId(value = '') {
  const id = clean(value, MAX_MODEL_ID).toLowerCase();
  const family = id.startsWith('gpt-') ? 'openai'
    : id.startsWith('claude-') ? 'anthropic'
      : id.startsWith('llama-') ? 'meta'
        : id.startsWith('deepseek-') ? 'deepseek'
          : id.startsWith('gemini-') ? 'google'
            : id.startsWith('gemma-') ? 'google'
              : 'unknown';
  return Object.freeze({
    id,
    family,
    safeguardOnly: /(?:^|-)safeguard(?:-|$)|(?:^|-)moderation(?:-|$)/.test(id),
    experimental: /(?:^|-)preview(?:-|$)|(?:^|-)experimental(?:-|$)/.test(id)
  });
}
function finiteNonNegative(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}
function clampScore(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : null;
}
function promptChars(messages = []) {
  return (Array.isArray(messages) ? messages : []).reduce((sum, entry) => sum + String(entry?.content || '').length, 0);
}
function userText(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .filter((entry) => entry?.role === 'user')
    .map((entry) => String(entry?.content || ''))
    .join('\n')
    .slice(0, 32_000);
}

export function classifyVexrailRequest(messages = []) {
  const text = userText(messages);
  const lower = text.toLowerCase();
  const chars = promptChars(messages);
  const codeSignal = /```|\b(?:javascript|typescript|python|rust|golang|java|c\+\+|sql|html|css|react|node(?:\.js)?|cloudflare|github|api|function|class|debug|compile|deploy|repository|code)\b/i.test(text);
  if (codeSignal) return 'coding_building';
  const complexSignal = chars > 5_000 || /\b(?:analy[sz]e|reason(?:ing)?|architecture|trade-?offs?|root cause|forensic|derive|prove|compare .* options|multi-?step|strategy|research|audit|optimi[sz]e)\b/i.test(lower);
  if (complexSignal) return 'complex_reasoning';
  const userTurns = (Array.isArray(messages) ? messages : []).filter((entry) => entry?.role === 'user').length;
  if (chars <= 600 && userTurns <= 2) return 'simple_chat';
  return 'ordinary_productivity';
}

export function parseVerifiedVexrailEconomics(raw = '') {
  if (!String(raw || '').trim()) return Object.freeze({ verified: false, models: Object.freeze({}), reason: 'economics_not_configured' });
  let source;
  try { source = JSON.parse(String(raw)); }
  catch { return Object.freeze({ verified: false, models: Object.freeze({}), reason: 'economics_invalid_json' }); }
  if (source?.version !== 1 || source?.verified !== true || !source?.models || typeof source.models !== 'object' || Array.isArray(source.models)) {
    return Object.freeze({ verified: false, models: Object.freeze({}), reason: 'economics_unverified' });
  }
  const models = {};
  for (const [rawId, rawEntry] of Object.entries(source.models)) {
    const id = clean(rawId, MAX_MODEL_ID);
    const entry = rawEntry && typeof rawEntry === 'object' ? rawEntry : {};
    const inputMicros = finiteNonNegative(entry.input_micros_per_1m_tokens);
    const outputMicros = finiteNonNegative(entry.output_micros_per_1m_tokens);
    const qualityScore = clampScore(entry.quality_score);
    const classes = Array.isArray(entry.classes)
      ? [...new Set(entry.classes.map((value) => clean(value, 40)).filter((value) => value === '*' || EON_VEXRAIL_REQUEST_CLASSES.includes(value)))]
      : [];
    if (!id || entry.enabled === false || inputMicros === null || outputMicros === null || qualityScore === null || classes.length === 0) continue;
    models[id] = Object.freeze({
      id,
      inputMicrosPer1M: inputMicros,
      outputMicrosPer1M: outputMicros,
      qualityScore,
      classes: Object.freeze(classes),
      streaming: entry.streaming !== false,
      spendQualified: entry.spend_qualified !== false,
      productionQualified: entry.production_qualified === true,
      metadata: classifyVexrailModelId(id)
    });
  }
  return Object.freeze({ verified: true, models: Object.freeze(models), reason: Object.keys(models).length ? 'verified' : 'economics_no_qualified_models' });
}

export function estimateVexrailRouteCostMicros(entry = {}, payload = {}) {
  const inputTokens = Math.max(1, Math.ceil(promptChars(payload?.messages) / 4));
  const outputTokens = Math.max(1, Math.floor(Number(payload?.max_tokens) || 1024));
  const input = finiteNonNegative(entry.inputMicrosPer1M);
  const output = finiteNonNegative(entry.outputMicrosPer1M);
  if (input === null || output === null) return null;
  return Math.max(0, Math.ceil((inputTokens * input + outputTokens * output) / 1_000_000));
}

function minimumQuality(requestClass = '') {
  if (requestClass === 'complex_reasoning') return 88;
  if (requestClass === 'coding_building') return 82;
  if (requestClass === 'ordinary_productivity') return 72;
  return 60;
}

export function isVexrailModelQualifiedForClass(entry = {}, requestClass = '', { stream = false } = {}) {
  if (!EON_VEXRAIL_REQUEST_CLASSES.includes(requestClass)) return false;
  if (!entry || typeof entry !== 'object') return false;
  if (entry.spendQualified !== true || entry.metadata?.safeguardOnly) return false;
  if (entry.metadata?.experimental && entry.productionQualified !== true) return false;
  if (stream && entry.streaming === false) return false;
  if (!(Array.isArray(entry.classes) && (entry.classes.includes('*') || entry.classes.includes(requestClass)))) return false;
  return Number(entry.qualityScore) >= minimumQuality(requestClass);
}

export async function discoverVexrailModelIds(config = {}, fetchImpl = fetch, now = Date.now()) {
  if (!config?.secretKey || !config?.publishableKey) return Object.freeze({ ok: false, ids: Object.freeze([]), reason: 'vexrail_credentials_unavailable', upstreamStatus: 0, cached: false });
  const cacheKey = `${config.publishableKey.slice(0, 24)}:${config.secretKey.slice(0, 12)}`;
  if (modelCache.key === cacheKey && modelCache.expiresAt > Number(now) && modelCache.ids.length) {
    return Object.freeze({ ok: true, ids: modelCache.ids, modelMetadata: Object.freeze(modelCache.ids.map(classifyVexrailModelId)), reason: 'cached', upstreamStatus: 200, cached: true });
  }
  let response;
  try {
    response = await fetchImpl(VEXRAIL_MODELS_UPSTREAM, {
      method: 'GET',
      headers: { accept: 'application/json', 'x-publishable-key': config.publishableKey, 'x-secret-key': config.secretKey },
      signal: AbortSignal.timeout(10_000)
    });
  } catch {
    return Object.freeze({ ok: false, ids: Object.freeze([]), reason: 'vexrail_models_unreachable', upstreamStatus: 0, cached: false });
  }
  if (!response?.ok) return Object.freeze({ ok: false, ids: Object.freeze([]), reason: 'vexrail_models_rejected', upstreamStatus: Number(response?.status || 0), cached: false });
  let payload = null;
  try { payload = await response.json(); } catch {}
  const ids = Object.freeze([...new Set((Array.isArray(payload?.data) ? payload.data : [])
    .map((entry) => clean(entry?.id || '', MAX_MODEL_ID)).filter(Boolean))].sort());
  if (!ids.length) return Object.freeze({ ok: false, ids, reason: 'vexrail_models_empty', upstreamStatus: Number(response.status || 200), cached: false });
  modelCache = Object.freeze({ key: cacheKey, expiresAt: Number(now) + MODEL_CACHE_TTL_MS, ids });
  return Object.freeze({ ok: true, ids, modelMetadata: Object.freeze(ids.map(classifyVexrailModelId)), reason: 'fresh', upstreamStatus: Number(response.status || 200), cached: false });
}

export async function selectVexrailModelRoute({ config = {}, payload = {}, env = {}, fetchImpl = fetch, now = Date.now() } = {}) {
  const requestClass = classifyVexrailRequest(payload?.messages || []);
  const economics = parseVerifiedVexrailEconomics(env.EON_VEXRAIL_MODEL_ECONOMICS_JSON || '');
  if (!economics.verified) {
    return Object.freeze({
      ok: false, model: '', requestClass, routingMode: 'unavailable', economicsVerified: false,
      estimatedCostMicros: null, modelAvailabilityVerified: false, candidateCount: 0,
      discoveryReason: economics.reason || 'economics_unverified', reason: 'vexrail_economics_unavailable'
    });
  }

  const discovery = await discoverVexrailModelIds(config, fetchImpl, now);
  if (!discovery.ok) {
    return Object.freeze({
      ok: false, model: '', requestClass, routingMode: 'unavailable', economicsVerified: true,
      estimatedCostMicros: null, modelAvailabilityVerified: false, candidateCount: 0,
      discoveryReason: discovery.reason, reason: 'vexrail_model_discovery_unavailable'
    });
  }

  const available = new Set(discovery.ids || []);
  const candidates = [];
  for (const [id, entry] of Object.entries(economics.models)) {
    if (!available.has(id)) continue;
    if (!isVexrailModelQualifiedForClass(entry, requestClass, { stream: payload?.stream === true })) continue;
    const estimatedCostMicros = estimateVexrailRouteCostMicros(entry, payload);
    if (estimatedCostMicros === null) continue;
    candidates.push({ id, entry, estimatedCostMicros });
  }
  candidates.sort((a, b) => a.estimatedCostMicros - b.estimatedCostMicros || b.entry.qualityScore - a.entry.qualityScore || a.id.localeCompare(b.id));
  if (!candidates.length) {
    return Object.freeze({
      ok: false, model: '', requestClass, routingMode: 'unavailable', economicsVerified: true,
      estimatedCostMicros: null, modelAvailabilityVerified: true, candidateCount: 0,
      discoveryReason: discovery.reason, reason: 'vexrail_no_qualified_model'
    });
  }
  const winner = candidates[0];
  return Object.freeze({
    ok: true, model: winner.id, requestClass, routingMode: 'verified_cheapest_qualified', economicsVerified: true,
    estimatedCostMicros: winner.estimatedCostMicros, modelAvailabilityVerified: true, candidateCount: candidates.length,
    discoveryReason: discovery.reason
  });
}

export function resetVexrailModelDiscoveryCacheForTests() {
  modelCache = Object.freeze({ key: '', expiresAt: 0, ids: Object.freeze([]) });
}
