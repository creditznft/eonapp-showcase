import { shouldProbeLocalRuntimes } from './local-runtime-policy.js';
/**
 * EON AI Model Discovery
 * Auto-discovers available models from EVERY provider that exposes a /models endpoint.
 * Supports: OpenRouter, Groq, Fireworks, Cerebras, OpenAI, Mistral, DeepSeek,
 *           Perplexity, Together AI, Cohere, Google Gemini, Ollama (local),
 *           LM Studio (local), Jan (local)
 * Eliminates hardcoded model names — always shows what's actually available.
 * Cache TTL: 24 hours in localStorage.
 */

const CACHE_KEY = 'eon:ai:model-discovery:v2';
const CACHE_TTL  = 24 * 60 * 60 * 1000; // 24 h

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   contextLength: number | null,
 *   free: boolean,
 *   pricePer1k: number | null,
 *   provider: string,
 *   tags: string[]
 * }} DiscoveredModel
 */

/**
 * @typedef {{
 *   name: string,
 *   color: string,
 *   group: 'cloud' | 'local',
 *   modelsUrl: string,
 *   authHeader: (apiKey: string) => Record<string, string>,
 *   buildUrl?: (apiKey: string) => string,
 *   parseModels: (data: any) => DiscoveredModel[]
 * }} ProviderConfig
 */

/**
 * @param {any} value
 * @returns {any[]}
 */
function toAnyArray(value) {
  return Array.isArray(value) ? value : [];
}

function isLikelyChatModelId(value) {
  const id = String(value || '').trim();
  if (!id) return false;
  if (/whisper|transcrib|tts|speech|audio|voice|embed|embedding|rerank|moderation|guard|image|vision-preview|sdxl|stable-diffusion|dall-?e|video|music/i.test(id)) return false;
  return true;
}

function onlyChatModels(rows) {
  return (Array.isArray(rows) ? rows : []).filter((row) => isLikelyChatModelId(row?.id || row?.name));
}


/** @type {Record<string, string[]>} */
const LOCAL_PROVIDER_ENDPOINTS = {
  ollama: ['http://127.0.0.1:11434/api/tags', 'http://localhost:11434/api/tags', 'http://127.0.0.1:11434/v1/models'],
  lmstudio: ['http://127.0.0.1:1234/v1/models', 'http://localhost:1234/v1/models'],
  jan: ['http://127.0.0.1:1337/v1/models', 'http://localhost:1337/v1/models']
};

// ── Provider definitions ──────────────────────────────────────────────────────
/** @type {Record<string, ProviderConfig>} */
const PROVIDER_CONFIGS = {

  // ── CLOUD PROVIDERS ────────────────────────────────────────────────────────

  openrouter: {
    name:      'OpenRouter',
    color:     '#a78bfa',
    group:     'cloud',
    modelsUrl: 'https://openrouter.ai/api/v1/models',
    authHeader: k => ({ Authorization: `Bearer ${k}`, 'HTTP-Referer': 'https://eonapp.ch', 'X-Title': 'EON Browser' }),
    parseModels(data) {
      const rows = toAnyArray(data.data);
      return rows.map(m => {
        const pricePer1k = (parseFloat(m.pricing?.prompt || '1') + parseFloat(m.pricing?.completion || '1')) * 1000;
        return {
          id:            m.id,
          name:          m.name || m.id,
          contextLength: m.context_length || null,
          free:          pricePer1k === 0,
          pricePer1k:    pricePer1k,
          provider:      'openrouter',
          tags:          m.architecture?.modality ? [m.architecture.modality] : []
        };
      }).sort((a, b) => (a.free === b.free ? 0 : a.free ? -1 : 1));
    }
  },

  xai: {
    name:      'xAI Grok',
    color:     '#111827',
    group:     'cloud',
    modelsUrl: 'https://api.x.ai/v1/language-models',
    authHeader: k => ({ Authorization: `Bearer ${k}` }),
    parseModels(data) {
      const rows = toAnyArray(data.data || data.models);
      return rows
        .filter(m => !Array.isArray(m.output_modalities) || m.output_modalities.includes('text'))
        .map(m => ({
          id:            m.id,
          name:          m.display_name || m.name || m.id,
          contextLength: m.context_window || m.context_length || null,
          free:          false,
          pricePer1k:    null,
          provider:      'xai',
          tags:          Array.isArray(m.input_modalities) && m.input_modalities.includes('image') ? ['chat', 'vision'] : ['chat']
        }));
    }
  },

  qwen: {
    name:      'Qwen Cloud',
    color:     '#2563eb',
    group:     'cloud',
    modelsUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models',
    authHeader: k => ({ Authorization: `Bearer ${k}` }),
    parseModels(data) {
      const rows = toAnyArray(data.data || data.models);
      return rows.map(m => ({
        id:            m.id || m.name,
        name:          m.display_name || m.name || m.id,
        contextLength: m.context_window || m.inputTokenLimit || null,
        free:          false,
        pricePer1k:    null,
        provider:      'qwen',
        tags:          ['multimodal', 'coding', 'value']
      }));
    }
  },

  deepseek: {
    name:      'DeepSeek',
    color:     '#0f172a',
    group:     'cloud',
    modelsUrl: 'https://api.deepseek.com/models',
    authHeader: k => ({ Authorization: `Bearer ${k}` }),
    parseModels(data) {
      const rows = toAnyArray(data.data);
      return rows.map(m => ({
        id:            m.id,
        name:          m.id,
        contextLength: m.context_window || m.max_context_length || null,
        free:          false,
        pricePer1k:    null,
        provider:      'deepseek',
        tags:          /(reason|pro|flash|chat|coder|code)/i.test(m.id) ? ['reasoning', 'coding'] : ['value']
      }));
    }
  },

  perplexity: {
    name:      'Perplexity',
    color:     '#10b981',
    group:     'cloud',
    modelsUrl: 'https://api.perplexity.ai/v1/models',
    authHeader: k => ({ Authorization: `Bearer ${k}` }),
    parseModels(data) {
      const rows = toAnyArray(data.data || data.models);
      return rows.map(m => ({
        id:            m.id,
        name:          m.display_name || m.name || m.id,
        contextLength: m.context_window || m.context_length || null,
        free:          false,
        pricePer1k:    null,
        provider:      'perplexity',
        tags:          ['research', 'web']
      }));
    }
  },

  groq: {
    name:      'Groq',
    color:     '#f59e0b',
    group:     'cloud',
    modelsUrl: 'https://api.groq.com/openai/v1/models',
    authHeader: k => ({ Authorization: `Bearer ${k}` }),
    parseModels(data) {
      const rows = toAnyArray(data.data);
      return rows.map(m => ({
        id:            m.id,
        name:          m.id,
        contextLength: m.context_window || null,
        free:          true, // Groq free tier (rate-limited)
        pricePer1k:    0,
        provider:      'groq',
        tags:          ['fast']
      }));
    }
  },

  fireworks: {
    name:      'Fireworks AI',
    color:     '#f97316',
    group:     'cloud',
    modelsUrl: 'https://api.fireworks.ai/v1/accounts/fireworks/models?filter=supports_serverless%3Dtrue',
    authHeader: k => ({ Authorization: `Bearer ${k}` }),
    parseModels(data) {
      const rows = toAnyArray(data.models || data.data);
      return rows.map(m => ({
        id:            m.name || m.id,
        name:          String(m.displayName || m.name || m.id).replace('accounts/fireworks/models/', ''),
        contextLength: m.context_length || null,
        free:          Boolean(m.public),
        pricePer1k:    0,
        provider:      'fireworks',
        tags:          []
      }));
    }
  },

  cerebras: {
    name:      'Cerebras',
    color:     '#3b82f6',
    group:     'cloud',
    modelsUrl: 'https://api.cerebras.ai/v1/models',
    authHeader: k => ({ Authorization: `Bearer ${k}` }),
    parseModels(data) {
      const rows = toAnyArray(data.data);
      return rows.map(m => ({
        id:            m.id,
        name:          m.id,
        contextLength: m.context_window || null,
        free:          true,
        pricePer1k:    0,
        provider:      'cerebras',
        tags:          ['fast']
      }));
    }
  },

  openai: {
    name:      'OpenAI',
    color:     '#10b981',
    group:     'cloud',
    modelsUrl: 'https://api.openai.com/v1/models',
    authHeader: k => ({ Authorization: `Bearer ${k}` }),
    parseModels(data) {
      const chatModels = ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5', 'o1', 'o3', 'o4'];
      const rows = toAnyArray(data.data);
      return rows
        .filter(m => chatModels.some(p => m.id.startsWith(p)))
        .sort((a, b) => a.id.localeCompare(b.id))
        .map(m => ({
          id:            m.id,
          name:          m.id,
          contextLength: null,
          free:          false,
          pricePer1k:    null,
          provider:      'openai',
          tags:          []
        }));
    }
  },

  mistral: {
    name:      'Mistral AI',
    color:     '#f43f5e',
    group:     'cloud',
    modelsUrl: 'https://api.mistral.ai/v1/models',
    authHeader: k => ({ Authorization: `Bearer ${k}` }),
    parseModels(data) {
      const chat = ['mistral', 'mixtral', 'codestral', 'open-'];
      const rows = toAnyArray(data.data);
      return rows
        .filter(m => chat.some(p => m.id.toLowerCase().includes(p)))
        .map(m => ({
          id:            m.id,
          name:          m.id,
          contextLength: m.max_context_length || null,
          free:          m.id.startsWith('open-'),
          pricePer1k:    null,
          provider:      'mistral',
          tags:          m.capabilities?.completion_chat ? ['chat'] : []
        }));
    }
  },

  together: {
    name:      'Together AI',
    color:     '#8b5cf6',
    group:     'cloud',
    modelsUrl: 'https://api.together.xyz/v1/models',
    authHeader: k => ({ Authorization: `Bearer ${k}` }),
    parseModels(data) {
      const arr = toAnyArray(Array.isArray(data) ? data : (data.data || []));
      return arr
        .filter(m => (m.type || '').toLowerCase().includes('chat') || (m.display_type || '').toLowerCase().includes('chat'))
        .map(m => ({
          id:            m.id,
          name:          m.display_name || m.id,
          contextLength: m.context_length || null,
          free:          false,
          pricePer1k:    null,
          provider:      'together',
          tags:          m.license ? [m.license] : []
        }));
    }
  },

  cohere: {
    name:      'Cohere',
    color:     '#06b6d4',
    group:     'cloud',
    modelsUrl: 'https://api.cohere.ai/v1/models',
    authHeader: k => ({ Authorization: `Bearer ${k}` }),
    parseModels(data) {
      const rows = toAnyArray(data.models || data.data);
      return rows
        .filter(m => (m.endpoints || []).includes('chat') || (m.endpoints || []).includes('generate'))
        .map(m => ({
          id:            m.name || m.id,
          name:          m.name || m.id,
          contextLength: m.context_length || null,
          free:          false,
          pricePer1k:    null,
          provider:      'cohere',
          tags:          m.endpoints || []
        }));
    }
  },

  gemini: {
    name:      'Google Gemini',
    color:     '#4285f4',
    group:     'cloud',
    modelsUrl: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
    authHeader: () => ({}), // Gemini uses ?key= query param
    buildUrl(apiKey) { return `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(apiKey)}`; },
    parseModels(data) {
      const rows = toAnyArray(data.models);
      return rows
        .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map(m => ({
          id:            m.name,
          name:          m.displayName || m.name.replace('models/', ''),
          contextLength: m.inputTokenLimit || null,
          free:          true, // Gemini has a free tier
          pricePer1k:    null,
          provider:      'gemini',
          tags:          ['multimodal']
        }));
    }
  },

  // ── LOCAL INFERENCE PROVIDERS ──────────────────────────────────────────────

  ollama: {
    name:      'Ollama (Local)',
    color:     '#22d3ee',
    group:     'local',
    modelsUrl: 'http://127.0.0.1:11434/api/tags',
    authHeader: _k => ({}), // No auth for local
    parseModels(data) {
      const rows = toAnyArray(data.models);
      return rows.map(m => ({
        id:            m.name,
        name:          m.name,
        contextLength: null,
        free:          true,
        pricePer1k:    0,
        provider:      'ollama',
        tags:          ['local', 'private']
      }));
    }
  },

  lmstudio: {
    name:      'LM Studio (Local)',
    color:     '#a3e635',
    group:     'local',
    modelsUrl: 'http://127.0.0.1:1234/v1/models',
    authHeader: _k => ({}),
    parseModels(data) {
      const rows = toAnyArray(data.data);
      return rows.map(m => ({
        id:            m.id,
        name:          m.id,
        contextLength: null,
        free:          true,
        pricePer1k:    0,
        provider:      'lmstudio',
        tags:          ['local', 'private']
      }));
    }
  },

  jan: {
    name:      'Jan (Local)',
    color:     '#fb923c',
    group:     'local',
    modelsUrl: 'http://127.0.0.1:1337/v1/models',
    authHeader: _k => ({}),
    parseModels(data) {
      const rows = toAnyArray(data.data);
      return rows.map(m => ({
        id:            m.id,
        name:          m.id,
        contextLength: null,
        free:          true,
        pricePer1k:    0,
        provider:      'jan',
        tags:          ['local', 'private']
      }));
    }
  }
};

// ── Cache helpers ─────────────────────────────────────────────────────────────
function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, models } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return models;
  } catch { return null; }
}

/**
 * @param {any[]} models
 */
function saveCache(models) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), models })); } catch {}
}

// ── Core API ──────────────────────────────────────────────────────────────────

/**
 * Discover models from one provider.
 * Local providers (ollama/lmstudio/jan) are probed even without an API key.
 * @param {string} providerId
 * @param {string} [apiKey]
 * @returns {Promise<any[]>} empty if key missing/unavailable or request fails
 */
async function discoverProvider(providerId, apiKey) {
  const cfg = PROVIDER_CONFIGS[providerId];
  if (!cfg) return [];

  // Local providers never need a key; skip if offline
  const isLocal = cfg.group === 'local';
  if (isLocal && !shouldProbeLocalRuntimes()) return [];
  if (!isLocal && (!apiKey || apiKey.length < 8)) return [];

  try {
    const normalizedApiKey = apiKey || '';
    const urls = isLocal ? (LOCAL_PROVIDER_ENDPOINTS[providerId] || [cfg.modelsUrl]).filter(Boolean) : [typeof cfg.buildUrl === 'function' ? cfg.buildUrl(normalizedApiKey) : cfg.modelsUrl];
    const headers = { 'Content-Type': 'application/json', ...cfg.authHeader(normalizedApiKey) };
    const timeout = isLocal ? 2500 : 8000; // local probes are short

    for (const url of urls) {
      try {
        const resp = await fetch(url, { headers, signal: AbortSignal.timeout(timeout) });
        if (!resp.ok) continue;
        const models = onlyChatModels(cfg.parseModels(await resp.json()));
        if (models.length) return models;
      } catch {}
    }
    return [];
  } catch { return []; }
}

/**
 * Discover all available models across all providers with configured keys.
 * Free models are sorted first. Results cached for 24 h.
 *
 * @param {Record<string, string>} [keys]  { openrouter: 'sk-or-...', groq: 'gsk_...', ... }
 * @param {boolean} [forceRefresh]  bypass cache
 * @returns {Promise<any[]>}
 */
async function discoverAllModels(keys = {}, forceRefresh = false) {
  if (!forceRefresh) {
    const cached = loadCache();
    if (cached && cached.length > 0) return cached;
  }

  /** @type {any[]} */
  const all = [];

  // Cloud providers: only probe if key exists.
  // Local providers: probe only when local discovery is allowed.
  const fetches = Object.keys(PROVIDER_CONFIGS).map(id => {
    const cfg = PROVIDER_CONFIGS[id];
    if (cfg.group === 'local') return discoverProvider(id, '').then(m => all.push(...m));
    const key = /** @type {string} */ (keys[id] || '');
    if (!key || key.length < 8) return Promise.resolve();
    return discoverProvider(id, key).then(m => all.push(...m));
  });

  await Promise.allSettled(fetches);

  // Sort: free → paid, then alphabetically within provider
  all.sort((a, b) => {
    if (a.free !== b.free) return a.free ? -1 : 1;
    if (a.provider !== b.provider) return a.provider.localeCompare(b.provider);
    return a.id.localeCompare(b.id);
  });

  if (all.length > 0) saveCache(all);
  return all;
}

/**
 * Get the best (fastest-free) model for a specific provider.
 * @param {any[]} models
 * @param {string} providerId
 */
/** @type {(models: any[], providerId: string) => any} */
const getBestModel = (models, providerId) => {
  const subset = models.filter(m => m.provider === providerId);
  return subset.find(m => m.free) || subset[0] || null;
};

/**
 * Load API keys from the active runtime session store.
 * Persistent plaintext localStorage API-key aliases are intentionally ignored.
 * Local providers don't need keys but their entry is included as empty string.
 */
function loadStoredKeys() {
  const providers = [
    'openrouter', 'groq', 'xai', 'qwen', 'deepseek', 'perplexity', 'fireworks',
    'cerebras', 'openai', 'mistral', 'together', 'cohere', 'gemini',
    'ollama', 'lmstudio', 'jan'
  ];
  /** @type {Record<string, string>} */
  const result = {};
  let sessionKeys = {};
  try { sessionKeys = JSON.parse(sessionStorage.getItem('eon:ai-chat-session-keys:v1') || '{}'); } catch {}

  for (const provider of providers) {
    if (provider === 'ollama' || provider === 'lmstudio' || provider === 'jan') {
      result[provider] = '';
      continue;
    }
    const key = String(sessionKeys?.[provider] || '').trim();
    if (key.length > 8) result[provider] = key;
  }
  return result;
}

/** Clear the model cache — call when user updates API keys. */
function clearModelCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

/** Format a price per 1k tokens as a human string. */
/**
 * @param {number | null} pricePer1k
 */
function formatPrice(pricePer1k) {
  if (pricePer1k == null) return '?';
  if (pricePer1k === 0) return 'Free';
  if (pricePer1k < 0.01) return `$${(pricePer1k * 1000).toFixed(4)}/M`;
  return `$${pricePer1k.toFixed(3)}/1k`;
}

export { discoverAllModels, discoverProvider, getBestModel, loadStoredKeys, clearModelCache, formatPrice, PROVIDER_CONFIGS };

// Expose globally for non-module scripts
window.EONModelDiscovery = { discoverAllModels, discoverProvider, getBestModel, loadStoredKeys, clearModelCache, formatPrice, PROVIDER_CONFIGS };
