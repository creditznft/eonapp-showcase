/**
 * SMART PROVIDER FALLBACK ORCHESTRATOR
 * Handles intelligent routing between cloud, local, and guide providers
 * 
 * Spec:
 * 1. Try primary provider (cloud - OpenAI/Anthropic) with user key
 * 2. Fallback to local runtime (Ollama/LM Studio) if available
 * 3. Fallback to guide mode if neither available
 * 4. Log all routing decisions for audit trail
 * 5. Notify user which provider is active
 * 
 * Location: assets/js/utils/provider-orchestrator.js
 * Used by: Creator Studio, EON Browser, Chat, all AI surfaces
 */

import { getApiKey, PROVIDERS } from '../chat/ai-runtime.js';

// ===== E1.2a: PROVIDER HEALTH METRICS STORAGE =====
const METRICS_KEY = 'eon:provider-orchestrator:metrics:v1';
const CACHE_KEY = 'eon:provider-orchestrator:cache:v1';
const LOAD_KEY = 'eon:provider-orchestrator:load:v1';
const ROUTING_PROOF_SCHEMA_VERSION = 'provider-routing-proof/v1';

// ===== E1.2c: RETRY CONFIGURATION =====
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 500,
  maxDelayMs: 5000,
  backoffMultiplier: 2
};

function sanitizeText(/** @type {any} */ value, /** @type {number} */ max = 2000) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function maskSecretLikeText(/** @type {any} */ value, /** @type {number} */ max = 2000) {
  return sanitizeText(value, max)
    .replace(/\b(sk-(?:proj-)?[A-Za-z0-9_-]{12,}|sk-ant-[A-Za-z0-9_-]{12,}|sk-or-v1-[A-Za-z0-9_-]{12,})\b/g, '[redacted-api-key]')
    .replace(/\b(gsk_[A-Za-z0-9_-]{12,}|AIza[0-9A-Za-z_-]{12,}|hf_[A-Za-z0-9]{12,})\b/g, '[redacted-api-key]')
    .replace(/\b([A-Fa-f0-9]{32,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})\b/g, '[redacted-token]');
}

/**
 * @param {any} value
 * @param {number} depth
 * @returns {any}
 */
function redactForAudit(value, depth = 0) {
  if (value == null) return value;
  if (depth > 5) return '[redacted-depth-limit]';
  if (typeof value === 'string') return maskSecretLikeText(value, 1200);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((/** @type {any} */ item) => redactForAudit(item, depth + 1));
  if (typeof value === 'object') {
    const /** @type {any} */ out = {};
    for (const [key, item] of Object.entries(value)) {
      if (/(key|secret|token|password|credential|authorization|signature|prompt|input|messages)/i.test(key)) {
        out[key] = '[redacted]';
      } else {
        out[key] = redactForAudit(item, depth + 1);
      }
    }
    return out;
  }
  return maskSecretLikeText(String(value), 1200);
}

/**
 * @param {any} value
 * @returns {string}
 */
function stableStringify(value) {
  if (value == null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((/** @type {any} */ item) => stableStringify(item)).join(',')}]`;
  return `{${Object.keys(value).sort().map((/** @type {string} */ key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

/**
 * @param {any} value
 * @returns {string}
 */
function localAuditHash(value) {
  const input = stableStringify(redactForAudit(value));
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32:${hash.toString(16).padStart(8, '0')}`;
}

function shouldProbeLocalRuntimes(/** @type {{ force?: boolean } | boolean | undefined } */ options = {}) {
  try {
    const force = typeof options === 'boolean' ? options : Boolean(options?.force);
    if (force) return true;
    if (typeof window !== 'undefined' && typeof window.shouldProbeLocalRuntimes === 'function' && window.shouldProbeLocalRuntimes !== shouldProbeLocalRuntimes) {
      return window.shouldProbeLocalRuntimes(options);
    }
    const host = String((typeof location !== 'undefined' && location.hostname) || '').toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (isLocal) return true;
    return localStorage.getItem('eon:local-runtime:auto-detect:v1') === 'true';
  } catch {
    return false;
  }
}

export class ProviderOrchestrator {
  constructor() {
    this.primaryProvider = null;
    this.cloudProviderSecrets = new Map();
    this.availableProviders = {
      cloud: /** @type {any[]} */ ([]), // OpenAI, Anthropic, OpenRouter
      local: /** @type {any[]} */ ([]), // Ollama, LM Studio, Jan
      guide: true // Always available
    };
    this.activeProvider = null;
    this.routingLog = /** @type {any[]} */ ([]);
    this.maxLogEntries = 500;
    // ===== E1.2a: METRICS STORAGE =====
    this.metrics = this.loadMetrics();
    // ===== E1.2d: CACHE FOR AVAILABILITY =====
    this.availabilityCache = this.loadCache();
    // ===== E1.2e: LOAD TRACKING =====
    this.concurrentRequests = this.loadLoad();
    this._healthCheckIntervalId = null;
    this.loadFromStorage();
  }

  shouldSkipRuntimeProbes() {
    const ua = String((typeof navigator !== 'undefined' && navigator.userAgent) || '').toLowerCase();
    if (ua.includes('nodetest') || ua.includes('node.js') || typeof process !== 'undefined' || typeof window === 'undefined') {
      return true;
    }
    return !shouldProbeLocalRuntimes();
  }

  // ===== E1.2a: PROVIDER HEALTH METRICS =====

  loadMetrics() {
    try {
      const stored = JSON.parse(localStorage.getItem(METRICS_KEY) || '{}');
      return stored.metrics || {};
    } catch {
      return {};
    }
  }

  saveMetrics() {
    try {
      localStorage.setItem(METRICS_KEY, JSON.stringify({ metrics: this.metrics }));
    } catch {}
  }

  /**
   * @param {string} providerId
   * @param {{ latency: number, success: boolean }} param1
   */
  recordMetric(providerId, { latency, success }) {
    if (!this.metrics[providerId]) {
      this.metrics[providerId] = {
        responseTime: [],
        successCount: 0,
        errorCount: 0,
        totalRequests: 0,
        lastChecked: Date.now()
      };
    }

    const m = this.metrics[providerId];
    m.responseTime.push(latency);
    m.responseTime = m.responseTime.slice(-100); // Keep last 100
    m.successCount += success ? 1 : 0;
    m.errorCount += success ? 0 : 1;
    m.totalRequests += 1;
    m.lastChecked = Date.now();

    this.saveMetrics();
  }

  /**
   * @param {string} providerId
   * @returns {number}
   */
  calculateProviderScore(providerId) {
    const m = this.metrics[providerId];
    if (!m || m.totalRequests === 0) return 0.5; // Neutral score for unknown

    const avgLatency = m.responseTime.reduce((/** @type {any} */ a, /** @type {any} */ b) => a + b, 0) / m.responseTime.length;
    const successRate = m.successCount / m.totalRequests;
    const errorRate = m.errorCount / m.totalRequests;

    // Score formula: (success_rate * 0.5) + (1 - normalized_latency * 0.3) + (1 - error_rate * 0.2)
    const normalizedLatency = Math.min(avgLatency / 5000, 1);
    const score = successRate * 0.5 + (1 - normalizedLatency) * 0.3 + (1 - errorRate) * 0.2;
    return Math.max(0, Math.min(1, score)); // Clamp to [0, 1]
  }

  getProviderRankings() {
    const providers = [
      ...this.availableProviders.cloud,
      ...this.availableProviders.local,
      { id: 'guide', label: 'Guide Mode' }
    ];

    return providers
      .map((/** @type {any} */ p) => ({
        ...p,
        score: this.calculateProviderScore(p.id),
        metrics: this.metrics[p.id] || {}
      }))
      .sort((/** @type {any} */ a, /** @type {any} */ b) => b.score - a.score);
  }

  /**
   * @param {any} provider
   * @returns {string}
   */
  getProviderLabel(provider) {
    return sanitizeText(provider?.label || provider?.id || 'Unknown provider', 80);
  }

  /**
   * @param {any} provider
   * @param {any} context
   * @returns {any}
   */
  explainProviderDecision(provider, context = {}) {
    const type = provider?.type || this.getProviderType(provider?.id);
    const score = typeof provider?.score === 'number' ? provider.score : this.calculateProviderScore(provider?.id);
    const load = provider?.id ? this.getCurrentLoad(provider.id) : 0;
    const metrics = provider?.id ? this.metrics[provider.id] || {} : {};
    const successRate = metrics.totalRequests ? Math.round((metrics.successCount / metrics.totalRequests) * 100) : null;
    const reasons = [];

    if (type === 'cloud') reasons.push('cloud provider is configured with a local key');
    if (type === 'local') reasons.push('local runtime was detected on this device');
    if (type === 'guide') reasons.push('guide mode is always available when live providers are unavailable');
    reasons.push(`health score ${Math.round(score * 100)}/100`);
    reasons.push(`current load ${load}`);
    if (successRate != null) reasons.push(`recent success rate ${successRate}%`);
    if (context.failoverFrom) reasons.push(`failover from ${this.getProviderLabel(context.failoverFrom)}`);
    if (context.reason) reasons.push(maskSecretLikeText(context.reason, 200));

    return {
      providerId: sanitizeText(provider?.id || 'guide', 80),
      providerLabel: this.getProviderLabel(provider),
      providerType: sanitizeText(type || 'guide', 40),
      selectedBecause: reasons,
      operatorSummary: `${this.getProviderLabel(provider)} selected: ${reasons.join('; ')}.`,
      score,
      load
    };
  }

  /**
   * @returns {any[]}
   */
  explainFallbackChain() {
    return this.getFallbackChain().map((/** @type {any} */ provider, /** @type {number} */ index) => ({
      order: index + 1,
      providerId: sanitizeText(provider.id, 80),
      providerLabel: this.getProviderLabel(provider),
      providerType: sanitizeText(provider.type || this.getProviderType(provider.id), 40),
      explanation: this.explainProviderDecision(provider, { reason: index === 0 ? 'current active provider' : 'fallback candidate' }).operatorSummary
    }));
  }

  // ===== E1.2d: PROVIDER AVAILABILITY CACHE =====

  /**
   * @returns {Record<string, { available: boolean, ts: number }>}
   */
  loadCache() {
    try {
      const stored = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
      return stored.cache || {};
    } catch {
      return {};
    }
  }

  saveCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ cache: this.availabilityCache }));
    } catch {}
  }

  /**
   * @param {string} providerId
   * @param {number} cacheWindowMs
   */
  getCachedAvailability(providerId, cacheWindowMs = 5 * 60 * 1000) {
    const cached = this.availabilityCache[providerId];
    if (cached && Date.now() - cached.ts < cacheWindowMs) {
      return cached.available;
    }
    return null; // Cache miss
  }

  /**
   * @param {string} providerId
   * @param {boolean} available
   */
  setCachedAvailability(providerId, available) {
    this.availabilityCache[providerId] = { available, ts: Date.now() };
    this.saveCache();
  }

  /**
   * @param {string} providerId
   */
  invalidateCache(providerId) {
    delete this.availabilityCache[providerId];
    this.saveCache();
  }

  // ===== E1.2e: LOAD BALANCING =====

  /**
   * @returns {Record<string, number>}
   */
  loadLoad() {
    try {
      const stored = JSON.parse(localStorage.getItem(LOAD_KEY) || '{}');
      return stored.load || {};
    } catch {
      return {};
    }
  }

  saveLoad() {
    try {
      localStorage.setItem(LOAD_KEY, JSON.stringify({ load: this.concurrentRequests }));
    } catch {}
  }

  /**
   * @param {string} providerId
   * @returns {number}
   */
  getCurrentLoad(providerId) {
    return this.concurrentRequests[providerId] || 0;
  }

  /**
   * @param {string} providerId
   */
  incrementLoad(providerId) {
    this.concurrentRequests[providerId] = (this.concurrentRequests[providerId] || 0) + 1;
    this.saveLoad();
  }

  /**
   * @param {string} providerId
   */
  decrementLoad(providerId) {
    this.concurrentRequests[providerId] = Math.max(0, (this.concurrentRequests[providerId] || 0) - 1);
    this.saveLoad();
  }

  // ===== E1.2b: ADAPTIVE MODEL SELECTION =====

  detectTaskType(/** @type {any} */ input) {
    const lower = (input || '').toLowerCase();
    if (lower.includes('code') || lower.includes('function') || lower.includes('debug')) return 'code';
    if (lower.includes('analyze') || lower.includes('analysis') || lower.includes('research') || lower.includes('search') || lower.includes('browse') || lower.includes('latest') || lower.includes('news') || lower.includes('sources') || lower.includes('citations') || lower.includes('explain') || lower.includes('investigate')) return 'analysis';
    if (lower.includes('story') || lower.includes('poem') || lower.includes('creative')) return 'creative';
    if (lower.includes('image') || lower.includes('art') || lower.includes('design')) return 'image';
    if (lower.includes('video') || lower.includes('edit footage') || lower.includes('render')) return 'video';
    if (lower.includes('music') || lower.includes('song') || lower.includes('mix') || lower.includes('audio')) return 'music';
    if (lower.includes('browse') || lower.includes('browser') || lower.includes('click') || lower.includes('login')) return 'browse';
    if (lower.includes('distribute') || lower.includes('publish') || lower.includes('share') || lower.includes('post')) return 'distribute';
    return 'chat'; // Default
  }

  /**
   * @param {string} providerId
   * @param {string} taskType
   * @returns {number}
   */
  getTaskProviderBonus(providerId, taskType) {
    const type = String(taskType || 'chat').toLowerCase();
    const id = String(providerId || '').toLowerCase();
    const isLocal = this.getProviderType(id) === 'local';
    const lowRiskLocalTasks = new Set(['ask', 'chat', 'voice', 'research', 'browse']);

    const bonuses = {
      code: {
        openai: 0.14,
        anthropic: 0.16,
        openrouter: 0.12,
        deepseek: 0.18,
        mistral: 0.14,
        together: 0.12,
        fireworks: 0.1,
        cerebras: 0.08,
        nvidia: 0.08,
        sambanova: 0.08,
        groq: 0.1,
        gemini: 0.08,
        cohere: 0.06,
        ollama: 0.08,
        'lm-studio': 0.08,
        jan: 0.08
      },
      analysis: {
        openai: 0.15,
        anthropic: 0.18,
        openrouter: 0.12,
        deepseek: 0.12,
        perplexity: 0.22,
        mistral: 0.12,
        together: 0.1,
        fireworks: 0.08,
        cerebras: 0.08,
        nvidia: 0.08,
        sambanova: 0.08,
        groq: 0.1,
        gemini: 0.12,
        cohere: 0.14,
        ollama: 0.07,
        'lm-studio': 0.07,
        jan: 0.07
      },
      creative: {
        openai: 0.14,
        anthropic: 0.12,
        openrouter: 0.12,
        deepseek: 0.08,
        mistral: 0.1,
        together: 0.1,
        fireworks: 0.1,
        cerebras: 0.08,
        nvidia: 0.08,
        sambanova: 0.08,
        groq: 0.08,
        gemini: 0.1,
        cohere: 0.08,
        ollama: 0.08,
        'lm-studio': 0.08,
        jan: 0.08
      },
      image: {
        openai: 0.12,
        anthropic: 0.05,
        openrouter: 0.14,
        deepseek: 0.03,
        mistral: 0.05,
        together: 0.1,
        fireworks: 0.1,
        cerebras: 0.06,
        nvidia: 0.1,
        sambanova: 0.08,
        groq: 0.08,
        gemini: 0.14,
        cohere: 0.03,
        ollama: 0.08,
        'lm-studio': 0.08,
        jan: 0.08
      },
      video: {
        openai: 0.12,
        anthropic: 0.05,
        openrouter: 0.12,
        deepseek: 0.03,
        mistral: 0.05,
        together: 0.1,
        fireworks: 0.1,
        cerebras: 0.06,
        nvidia: 0.1,
        sambanova: 0.08,
        groq: 0.08,
        gemini: 0.12,
        cohere: 0.03,
        ollama: 0.08,
        'lm-studio': 0.08,
        jan: 0.08
      },
      music: {
        openai: 0.1,
        anthropic: 0.08,
        openrouter: 0.1,
        deepseek: 0.05,
        mistral: 0.08,
        together: 0.08,
        fireworks: 0.08,
        cerebras: 0.06,
        nvidia: 0.08,
        sambanova: 0.08,
        groq: 0.1,
        gemini: 0.1,
        cohere: 0.03,
        ollama: 0.1,
        'lm-studio': 0.1,
        jan: 0.1
      },
      browse: {
        openai: 0.12,
        anthropic: 0.12,
        openrouter: 0.12,
        deepseek: 0.1,
        perplexity: 0.22,
        mistral: 0.08,
        together: 0.08,
        fireworks: 0.08,
        cerebras: 0.08,
        nvidia: 0.08,
        sambanova: 0.08,
        groq: 0.08,
        gemini: 0.1,
        cohere: 0.08,
        ollama: 0.12,
        'lm-studio': 0.12,
        jan: 0.12
      },
      distribute: {
        openai: 0.14,
        anthropic: 0.14,
        openrouter: 0.14,
        deepseek: 0.1,
        mistral: 0.1,
        together: 0.1,
        fireworks: 0.08,
        cerebras: 0.08,
        nvidia: 0.08,
        sambanova: 0.08,
        groq: 0.08,
        gemini: 0.08,
        cohere: 0.12,
        ollama: 0.06,
        'lm-studio': 0.06,
        jan: 0.06
      },
      chat: {
        openai: 0.12,
        anthropic: 0.12,
        openrouter: 0.12,
        deepseek: 0.1,
        perplexity: 0.12,
        mistral: 0.08,
        together: 0.08,
        fireworks: 0.08,
        cerebras: 0.08,
        nvidia: 0.08,
        sambanova: 0.08,
        groq: 0.1,
        gemini: 0.1,
        cohere: 0.1,
        ollama: 0.08,
        'lm-studio': 0.08,
        jan: 0.08
      }
    };

    const taskTable = /** @type {any} */ (((/** @type {any} */ (bonuses))[type]) || bonuses.chat);
    const key = Object.prototype.hasOwnProperty.call(taskTable, id) ? id : (id === 'lmstudio' ? 'lm-studio' : id);
    let bonus = taskTable[key] || 0;
    if (isLocal && lowRiskLocalTasks.has(type)) {
      bonus += 0.06;
    } else if (isLocal && ['browse', 'music', 'creative', 'distribute'].includes(type)) {
      bonus += 0.02;
    }
    return bonus;
  }

  /**
   * @param {string} taskType
   * @param {any[]} availableProviders
   * @returns {any}
   */
  selectModelForTask(taskType, availableProviders) {
    const normalizedTask = String(taskType || 'chat').toLowerCase();
    // Score available providers based on this task type and current load
    const scored = availableProviders.map((/** @type {any} */ p) => {
      const providerScore = this.calculateProviderScore(p.id);
      const load = this.getCurrentLoad(p.id);
      const loadPenalty = 1 - Math.min(load / 10, 0.5); // Reduce score by load (max 50% penalty at 10 concurrent)
      const taskBonus = this.getTaskProviderBonus(p.id, normalizedTask);
      return {
        ...p,
        taskType: normalizedTask,
        adaptiveScore: (providerScore * loadPenalty) + taskBonus,
        load
      };
    });

    scored.sort((/** @type {any} */ a, /** @type {any} */ b) => b.adaptiveScore - a.adaptiveScore);
    return scored[0] || null;
  }

  // ===== E1.2c: RETRY WITH BACKOFF =====

  async retryWithBackoff(/** @type {any} */ fn, /** @type {any} */ maxAttempts = RETRY_CONFIG.maxAttempts) {
    let lastError = null;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (/** @type {any} */ err) {
        lastError = err;
        if (attempt < maxAttempts - 1) {
          const delayMs = Math.min(
            RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
            RETRY_CONFIG.maxDelayMs
          );
          console.warn(`[ProviderOrchestrator] Retry attempt ${attempt + 1}/${maxAttempts} after ${delayMs}ms`);
          await new Promise((/** @type {any} */ resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }

  /**
   * Initialize orchestrator on app start
   */
  async initialize() {
    console.log('[ProviderOrchestrator] Initializing...');
    
    // Detect available providers
    await this.detectProviders();
    
    // Determine best active provider
    this.selectBestProvider();
    
    // Start periodic checks only in real browser runtimes.
    if (!this.shouldSkipRuntimeProbes()) {
      this.startHealthChecks();
    }
    
    return this.activeProvider;
  }

  /**
   * Detect which providers are available
   */
  async detectProviders() {
    this.availableProviders = {
      cloud: [],
      local: [],
      guide: true
    };
    this.cloudProviderSecrets.clear();

    // Check cloud providers (based on stored keys)
    const cloudKeys = await this.getCloudProviderKeys();
    this.availableProviders.cloud = cloudKeys;

    // Check local runtimes only in browser contexts. Node-based unit tests
    // should not spend time probing localhost services or keep the event loop open.
    if (!this.shouldSkipRuntimeProbes()) {
      await this.probeLocalRuntimes();
    }

    console.log('[ProviderOrchestrator] Available providers:', this.availableProviders);
  }

  /**
   * Get configured cloud provider keys — checks all 18 providers supported by ai-runtime.js
   */
  async getCloudProviderKeys() {
    /**
     * @param {string} providerId
     * @returns {string}
     */
    // Canonical custody only: never resurrect deprecated plaintext
    // `eon:provider-key:*` localStorage aliases. The provider catalogue is the
    // authority for which hosted BYOK providers are currently enabled.
    const readKey = (providerId) => getApiKey(providerId) || '';
    const ALL_PROVIDERS = Object.values(PROVIDERS || {})
      .filter((provider) => provider?.enabled !== false && provider?.requiresApiKey === true)
      .map((provider) => ({ id: provider.id, label: provider.label || provider.id }));

    const /** @type {any} */ available = [];
    for (const provider of ALL_PROVIDERS) {
      const key = readKey(provider.id);
      if (key) {
        this.cloudProviderSecrets.set(provider.id, key);
        available.push({ id: provider.id, label: provider.label });
      }
    }

    return available;
  }

  /**
   * Probe local runtime endpoints
   */
  async probeLocalRuntimes() {
    if (this.shouldSkipRuntimeProbes()) {
      return;
    }

    const /** @type {any} */
localEndpoints = [
      { name: 'Ollama', url: 'http://127.0.0.1:11434/api/tags', id: 'ollama' },
      { name: 'LM Studio', url: 'http://127.0.0.1:1234/v1/models', id: 'lmstudio' },
      { name: 'Jan', url: 'http://127.0.0.1:1337/v1/models', id: 'jan' }
    ];

    const buildCandidates = (/** @type {any} */ url) => {
      const base = String(url || '').trim().replace(/\/$/, '');
      const variants = new Set([base]);
      try {
        const parsed = new URL(base);
        const hosts = new Set([parsed.hostname]);
        if (['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname)) {
          hosts.add('127.0.0.1');
          hosts.add('localhost');
        }
        for (const host of hosts) {
          const next = new URL(parsed.toString());
          next.hostname = host;
          variants.add(next.toString().replace(/\/$/, ''));
        }
      } catch {}
      if (base.includes('/api/tags')) variants.add(base.replace('/api/tags', '/v1/models'));
      if (base.includes('/v1/models')) variants.add(base.replace('/v1/models', '/api/tags'));
      return Array.from(variants);
    };

    for (const /** @type {any} */
endpoint of localEndpoints) {
      try {
        for (const candidate of buildCandidates(endpoint.url)) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          try {
            const response = await fetch(candidate, { signal: controller.signal });
            if (response.ok) {
              this.availableProviders.local.push({
                id: endpoint.id,
                label: endpoint.name,
                endpoint: candidate
              });
              console.log(`[ProviderOrchestrator] Local runtime available: ${endpoint.name}`);
              break;
            }
          } finally {
            clearTimeout(timeoutId);
          }
        }
      } catch (/** @type {any} */
_error) {
        // Endpoint not available
      }
    }
  }

  /**
   * Select best provider based on priority and health metrics
   */
  selectBestProvider() {
    // ===== E1.2a: USE HEALTH METRICS FOR SELECTION =====
    const rankings = this.getProviderRankings();
    
    if (rankings.length === 0) {
      this.activeProvider = {
        type: 'guide',
        id: 'guide',
        label: 'Guide Mode',
        mode: 'guide',
        ready: true
      };
      this.logRouting('guide-fallback', this.activeProvider);
      return;
    }

    // Pick highest-ranked provider
    const bestProvider = rankings[0];
    this.activeProvider = {
      ...bestProvider,
      type: this.getProviderType(bestProvider.id),
      mode: this.getProviderMode(bestProvider.id),
      ready: true,
      score: bestProvider.score
    };
    
    this.logRouting('best-provider-selected', {
      provider: this.activeProvider,
      explanation: this.explainProviderDecision(this.activeProvider, { reason: 'highest ranked available provider' }),
      rankings: rankings.slice(0, 5).map((/** @type {any} */ row) => ({
        id: row.id,
        label: row.label,
        type: this.getProviderType(row.id),
        score: row.score,
        load: this.getCurrentLoad(row.id)
      }))
    });
  }

  getProviderType(/** @type {any} */ id) {
    if (this.availableProviders.cloud.find((/** @type {any} */ p) => p.id === id)) return 'cloud';
    if (this.availableProviders.local.find((/** @type {any} */ p) => p.id === id)) return 'local';
    return 'guide';
  }

  getProviderMode(/** @type {any} */ id) {
    if (id === 'guide') return 'guide';
    if (this.getProviderType(id) === 'local') return 'local';
    return 'cloud';
  }

  /**
   * Route AI request to best available provider
   */
  async routeRequest(/** @type {any} */ request) {
    const requestId = this.generateId();
    const startTime = Date.now();

    try {
      if (!this.activeProvider || !this.isProviderAvailable(this.activeProvider)) {
        this.selectBestProvider();
      }

      const currentProvider = this.activeProvider;
      if (!currentProvider) {
        return { success: false, error: 'No provider available', requestId, latency: Date.now() - startTime };
      }

      // Try active provider first
      let result = await this.tryProvider(currentProvider, request);
      
      if (result.success) {
        this.logRouting('request-success', {
          requestId,
          provider: currentProvider,
          latency: Date.now() - startTime,
          explanation: this.explainProviderDecision(currentProvider, { reason: 'active provider completed the request' })
        });
        return {
          success: true,
          output: result.output,
          provider: currentProvider,
          latency: Date.now() - startTime,
          requestId,
          providerExplanation: this.explainProviderDecision(currentProvider, { reason: 'active provider completed the request' })
        };
      }

      // If active provider failed, try fallback chain
      console.warn(`[ProviderOrchestrator] Active provider failed, trying fallback chain...`);
      
      const fallbackChain = this.getFallbackChain();
      for (const /** @type {any} */
provider of fallbackChain) {
        if (provider.id === currentProvider?.id) continue; // Skip current

        result = await this.tryProvider(provider, request);
        if (result.success) {
          this.activeProvider = provider; // Switch to working provider
          this.logRouting('failover-success', {
            requestId,
            from: currentProvider,
            to: provider,
            latency: Date.now() - startTime,
            explanation: this.explainProviderDecision(provider, { failoverFrom: currentProvider, reason: 'previous provider failed, fallback succeeded' })
          });
          return {
            success: true,
            output: result.output,
            provider: provider,
            latency: Date.now() - startTime,
            requestId,
            failover: true,
            providerExplanation: this.explainProviderDecision(provider, { failoverFrom: currentProvider, reason: 'previous provider failed, fallback succeeded' })
          };
        }
      }

      // All providers failed, use guide mode
      const guideResult = await this.tryProvider(
        { type: 'guide', id: 'guide', label: 'Guide Mode', mode: 'guide' },
        request
      );

      this.logRouting('all-providers-failed-guide-fallback', {
        requestId,
        latency: Date.now() - startTime,
        fallbackChain: this.explainFallbackChain(),
        explanation: this.explainProviderDecision({ type: 'guide', id: 'guide', label: 'Guide Mode', mode: 'guide' }, { reason: 'all live providers failed' })
      });

      return {
        success: true,
        output: guideResult.output,
        provider: { type: 'guide', id: 'guide', label: 'Guide Mode', mode: 'guide' },
        latency: Date.now() - startTime,
        requestId,
        failover: true,
        usingGuide: true,
        providerExplanation: this.explainProviderDecision({ type: 'guide', id: 'guide', label: 'Guide Mode', mode: 'guide' }, { reason: 'all live providers failed' })
      };
    } catch (/** @type {any} */
error) {
      const errorMessage = maskSecretLikeText(error?.message || error || 'Unknown provider routing error', 500);
      this.logRouting('request-error', {
        requestId,
        error: errorMessage,
        latency: Date.now() - startTime,
        fallbackChain: this.explainFallbackChain()
      });

      return {
        success: false,
        error: errorMessage,
        requestId,
        provider: this.activeProvider
      };
    }
  }

  /**
   * Try specific provider
   */
  async tryProvider(/** @type {any} */ provider, /** @type {any} */ request) {
    try {
      if (provider.type === 'cloud') {
        return await this.callCloudProvider(provider, request);
      } else if (provider.type === 'local') {
        return await this.callLocalProvider(provider, request);
      } else if (provider.type === 'guide') {
        return await this.callGuideMode(request);
      }
    } catch (/** @type {any} */
error) {
      const errorMessage = maskSecretLikeText(error?.message || error || 'Unknown provider error', 500);
      console.error(`[ProviderOrchestrator] Provider ${provider.id} failed:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Call cloud provider (OpenAI/Anthropic)
   */
  async callCloudProvider(/** @type {any} */ provider, /** @type {any} */ request) {
    // Implementation delegates to existing cloud service
    // This is a placeholder - actual implementation in api service
    if (typeof window.eonAIService?.callCloudProvider === 'function') {
      return await window.eonAIService.callCloudProvider(provider, request);
    }
    throw new Error(`Cloud provider ${provider.id} not configured`);
  }

  /**
   * Call local provider (Ollama/LM Studio)
   */
  async callLocalProvider(/** @type {any} */ provider, /** @type {any} */ request) {
    // Implementation delegates to local runtime service
    if (typeof window.eonAIService?.callLocalProvider === 'function') {
      return await window.eonAIService.callLocalProvider(provider, request);
    }
    throw new Error(`Local provider ${provider.id} not available`);
  }

  /**
   * Call guide mode (example output)
   */
  async callGuideMode(/** @type {any} */ request) {
    // Generate example output for guide mode
    const /** @type {any} */
examples = {
      'idea': 'Create a compelling story about sustainable technology innovation...',
      'music': 'Generate an upbeat electronic music production with synths and vocals...',
      'image': 'Create a premium digital artwork using modern techniques...',
      'code': 'Write a function that processes user input and returns formatted output...'
    };

    const output = examples[request.type] || examples.idea;
    return { success: true, output };
  }

  /**
   * Get fallback provider chain
   */
  getFallbackChain() {
    const /** @type {any} */
chain = [];

    // Current provider first
    if (this.activeProvider) {
      chain.push(this.activeProvider);
    }

    // Then other cloud providers
    for (const /** @type {any} */
provider of this.availableProviders.cloud) {
      if (provider.id !== this.activeProvider?.id) {
        chain.push({ type: 'cloud', ...provider, mode: 'cloud' });
      }
    }

    // Then local providers
    for (const /** @type {any} */
provider of this.availableProviders.local) {
      if (provider.id !== this.activeProvider?.id) {
        chain.push({ type: 'local', ...provider, mode: 'local' });
      }
    }

    // Finally guide mode
    chain.push({ type: 'guide', id: 'guide', label: 'Guide Mode', mode: 'guide' });

    return chain;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    if (this._healthCheckIntervalId) return;
    this._healthCheckIntervalId = setInterval(async () => {
      try {
        const previousActive = this.activeProvider;
        await this.detectProviders();
        
        // If active provider no longer available, reselect
        const isStillAvailable = this.isProviderAvailable(this.activeProvider);
        if (!isStillAvailable) {
          this.selectBestProvider();
          this.logRouting('provider-health-check-reselect', {
            previous: previousActive,
            current: this.activeProvider
          });
        }
      } catch (/** @type {any} */ err) {
        console.error('[ProviderOrchestrator] Health check failed:', err?.message || err);
      }
    }, 60_000); // Check every minute
    if (typeof this._healthCheckIntervalId.unref === 'function') {
      this._healthCheckIntervalId.unref();
    }
  }

  /**
   * Check if provider is still available
   */
  isProviderAvailable(/** @type {any} */ provider) {
    if (!provider || !provider.type) return false;
    if (provider.type === 'cloud') {
      return this.availableProviders.cloud.some(/** @type {any} */ p => p.id === provider.id);
    } else if (provider.type === 'local') {
      return this.availableProviders.local.some(/** @type {any} */ p => p.id === provider.id);
    } else if (provider.type === 'guide') {
      return true; // Guide mode always available
    }
    return false;
  }

  /**
   * Log routing decision for audit
   */
  logRouting(/** @type {any} */ event, /** @type {any} */ data) {
    const previousHash = this.routingLog.length ? this.routingLog[this.routingLog.length - 1].entryHash || '' : '';
    const /** @type {any} */
entry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      event: sanitizeText(event, 120),
      data: redactForAudit(data),
      explanation: data?.explanation?.operatorSummary || this.explainRoutingEvent(event, data),
      previousHash
    };
    entry.entryHash = localAuditHash(entry);

    this.routingLog.push(entry);

    // Keep only last N entries
    if (this.routingLog.length > this.maxLogEntries) {
      this.routingLog.shift();
    }

    this.saveToStorage();
    console.log('[ProviderOrchestrator] Routing event:', entry);
  }

  explainRoutingEvent(/** @type {any} */ event, /** @type {any} */ data = {}) {
    const cleanEvent = sanitizeText(event, 120);
    if (cleanEvent === 'guide-fallback') return 'Guide Mode selected because no live cloud or local provider was available.';
    if (cleanEvent === 'request-success') return `${this.getProviderLabel(data.provider)} completed the request successfully.`;
    if (cleanEvent === 'failover-success') return `${this.getProviderLabel(data.to)} completed the request after ${this.getProviderLabel(data.from)} failed.`;
    if (cleanEvent === 'all-providers-failed-guide-fallback') return 'All live providers failed, so the request moved to Guide Mode for a safe response.';
    if (cleanEvent === 'provider-health-check-reselect') return `Health check reselected provider from ${this.getProviderLabel(data.previous)} to ${this.getProviderLabel(data.current)}.`;
    if (cleanEvent === 'best-provider-selected') return data?.explanation?.operatorSummary || 'Provider selected from current rankings and health metrics.';
    return `Provider routing event recorded: ${cleanEvent}.`;
  }

  verifyRoutingLog(/** @type {any} */ entries = this.routingLog) {
    const rows = Array.isArray(entries) ? entries : [];
    let previousHash = '';
    for (const entry of rows) {
      const expectedPrevious = entry.previousHash || '';
      const recordedHash = entry.entryHash || '';
      const clone = /** @type {any} */ ({ ...entry });
      delete clone.entryHash;
      if (expectedPrevious !== previousHash || recordedHash !== localAuditHash(clone)) {
        return { ok: false, brokenAt: entry.id || entry.timestamp || 'unknown' };
      }
      previousHash = recordedHash;
    }
    return { ok: true, entries: rows.length, lastHash: previousHash };
  }

  /**
   * Get routing audit log
   */
  getRoutingLog() {
    return redactForAudit(this.routingLog);
  }

  /**
   * Export routing proof for evidence
   */
  exportProof() {
    const proof = /** @type {any} */ ({
      schema: ROUTING_PROOF_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      activeProvider: redactForAudit(this.activeProvider),
      activeProviderExplanation: this.explainProviderDecision(this.activeProvider || { id: 'guide', label: 'Guide Mode', type: 'guide' }),
      availableProviders: redactForAudit(this.availableProviders),
      fallbackChain: this.explainFallbackChain(),
      routingLog: redactForAudit(this.routingLog.slice(-50)), // Last 50 entries
      verification: this.verifyRoutingLog()
    });
    proof.proofHash = localAuditHash(proof);
    return proof;
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      activeProvider: this.activeProvider,
      activeProviderExplanation: this.explainProviderDecision(this.activeProvider || { id: 'guide', label: 'Guide Mode', type: 'guide' }),
      cloudProviders: this.availableProviders.cloud.length,
      localProviders: this.availableProviders.local.length,
      guideAvailable: this.availableProviders.guide,
      totalProviders: 
        this.availableProviders.cloud.length + 
        this.availableProviders.local.length + 
        (this.availableProviders.guide ? 1 : 0)
    };
  }

  /**
   * Generate ID for requests
   */
  generateId() {
    if (!window.crypto?.getRandomValues) return `req-${Date.now()}-fallback`;
    const bytes = new Uint8Array(6);
    window.crypto.getRandomValues(bytes);
    const suffix = Array.from(bytes, (/** @type {any} */ b) => b.toString(36).padStart(2, '0')).join('');
    return `req-${Date.now()}-${suffix}`;
  }

  /**
   * Save orchestrator state to localStorage
   */
  saveToStorage() {
    try {
      const /** @type {any} */
state = {
        activeProvider: redactForAudit(this.activeProvider),
        routingLog: redactForAudit(this.routingLog)
      };
      localStorage.setItem('eon:provider-orchestrator', JSON.stringify(state));
    } catch (/** @type {any} */
e) {
      console.warn('[ProviderOrchestrator] Failed to save state:', e);
    }
  }

  /**
   * Load orchestrator state from localStorage
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('eon:provider-orchestrator');
      if (saved) {
        const state = JSON.parse(saved);
        this.activeProvider = this.normalizeProviderState(state.activeProvider);
        this.routingLog = this.normalizeRoutingLog(state.routingLog || []);
      }
    } catch (/** @type {any} */
e) {
      console.warn('[ProviderOrchestrator] Failed to load state:', e);
    }
  }

  /**
   * Normalize persisted provider records before using them.
   */
  normalizeProviderState(/** @type {any} */ provider) {
    if (!provider || typeof provider !== 'object') return null;
    const type = String(provider.type || '').trim();
    const id = String(provider.id || '').trim();
    const label = String(provider.label || '').trim();
    if (!['cloud', 'local', 'guide'].includes(type) || !id || !label) return null;

      const normalized = /** @type {any} */ ({ type, id, label, mode: String(provider.mode || type).trim() || type, ready: provider.ready !== false });
    if (typeof provider.endpoint === 'string' && provider.endpoint.trim()) {
      normalized.endpoint = provider.endpoint.trim();
    }
    return normalized;
  }

  normalizeRoutingLog(/** @type {any} */ entries) {
    const rows = Array.isArray(entries) ? entries.slice(-this.maxLogEntries) : [];
    let previousHash = '';
    return rows.map((/** @type {any} */ raw) => {
      const entry = /** @type {any} */ ({
        id: sanitizeText(raw?.id || this.generateId(), 80),
        timestamp: sanitizeText(raw?.timestamp || new Date().toISOString(), 80),
        event: sanitizeText(raw?.event || 'legacy-routing-event', 120),
        data: redactForAudit(raw?.data || {}),
        explanation: sanitizeText(raw?.explanation || this.explainRoutingEvent(raw?.event || 'legacy-routing-event', raw?.data || {}), 1000),
        previousHash
      });
      entry.entryHash = localAuditHash(entry);
      previousHash = entry.entryHash;
      return entry;
    });
  }

  /**
   * Clear routing log (for testing)
   */
  clearLog() {
    this.routingLog = /** @type {any[]} */ ([]);
    this.saveToStorage();
  }
}

// Export singleton
export const providerOrchestrator = new ProviderOrchestrator();

// Initialize on window load
if (typeof window !== 'undefined' && !providerOrchestrator.shouldSkipRuntimeProbes()) {
  window.eonProviderOrchestrator = providerOrchestrator;
  
  // Auto-initialize when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      providerOrchestrator.initialize();
    });
  } else {
    providerOrchestrator.initialize();
  }
}
