import { shouldProbeLocalRuntimes } from '../utils/local-runtime-policy.js';
/**
 * LocalRuntimeDetector.js
 * 
 * Detects and profiles local AI runtimes:
 * - Ollama (port 11434)
 * - LM Studio (port 1234)
 * - Jan (port 1337)
 * 
 * Features:
 * - Model list retrieval
 * - Latency profiling
 * - Tier guidance (small/medium/heavy)
 * - GPU detection
 */

class LocalRuntimeDetector {
  constructor() {
    /** @type {any[]} */
    this.detectedRuntimes = [];
    /** @type {Record<string, any>} */
    this.modelProfiles = {};
    this.tierGuidance = {
      small: { description: 'Fast chat, 2-4s first-token', models: /7b|small/ },
      medium: { description: 'Creator workflows, 1-3s', models: /13b|medium|mid/ },
      heavy: { description: 'Quality-first, 3-10s, high VRAM', models: /30b|70b|large/ },
    };
  }

  /**
   * SCAN - Detect all available local runtimes
   */
  async scan(/** @type {{ force?: boolean } | boolean } */ options = {}) {
    if (!shouldProbeLocalRuntimes(options)) {
      this.detectedRuntimes = [];
      return this.detectedRuntimes;
    }
    this.detectedRuntimes = [];

    const /** @type {any} */
runtimes = [
      { name: 'Ollama', port: 11434, endpoints: ['http://127.0.0.1:11434/api/tags', 'http://localhost:11434/api/tags', 'http://127.0.0.1:11434/v1/models'], parser: this._parseOllama.bind(this) },
      { name: 'LM Studio', port: 1234, endpoints: ['http://127.0.0.1:1234/v1/models', 'http://localhost:1234/v1/models'], parser: this._parseLMStudio.bind(this) },
      { name: 'Jan', port: 1337, endpoints: ['http://127.0.0.1:1337/v1/models', 'http://localhost:1337/v1/models'], parser: this._parseJan.bind(this) },
    ];

    for (const /** @type {any} */
runtime of runtimes) {
      try {
        const result = await this._probeRuntime(runtime);
        if (result) {
          this.detectedRuntimes.push(result);
        }
      } catch (/** @type {any} */
_err) {
        console.debug(`${runtime.name} not detected on port ${runtime.port}`);
      }
    }

    return this.detectedRuntimes;
  }

  /**
   * PROBE RUNTIME - Check if runtime is available and get models
   */
  async _probeRuntime(/** @type {any} */ runtime) {
    try {
      const endpoints = Array.isArray(runtime.endpoints) ? runtime.endpoints : [runtime.endpoint].filter(Boolean);
      for (const endpoint of endpoints) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        try {
          const response = await fetch(endpoint, { method: 'GET', signal: controller.signal });
          if (!response.ok) continue;
          const data = await response.json();
          const models = runtime.parser(data);
          if (!models || !models.length) continue;

          return {
            name: runtime.name,
            port: runtime.port,
            endpoint,
            reachable: true,
            modelCount: models.length,
            models,
            detectedAt: Date.now(),
          };
        } finally {
          clearTimeout(timeoutId);
        }
      }
      return null;
    } catch (/** @type {any} */
_err) {
      return null;
    }
  }

  /**
   * PARSE OLLAMA - Extract models from Ollama API response
   */
  _parseOllama(/** @type {any} */ data) {
    if (!data.models || !Array.isArray(data.models)) return [];
    return data.models.map((/** @type {any} */ m) => ({
      id: m.name,
      name: m.name.split(':')[0], // Remove tag
      size: m.size || 0,
      digest: m.digest || null,
      modifiedAt: m.modified_at || null,
    }));
  }

  /**
   * PARSE LM STUDIO - Extract models from LM Studio API response
   */
  _parseLMStudio(/** @type {any} */ data) {
    if (!data.data || !Array.isArray(data.data)) return [];
    return data.data.map((/** @type {any} */ m) => ({
      id: m.id,
      name: m.id,
      owned_by: m.owned_by || 'unknown',
    }));
  }

  /**
   * PARSE JAN - Extract models from Jan API response
   */
  _parseJan(/** @type {any} */ data) {
    if (!data.data || !Array.isArray(data.data)) return [];
    return data.data.map((/** @type {any} */ m) => ({
      id: m.id,
      name: m.id,
      status: m.status || 'unknown',
    }));
  }

  /**
   * GET RUNTIME - Get runtime by name or port
   */
  getRuntime(/** @type {any} */ nameOrPort) {
    return this.detectedRuntimes.find(
      /** @type {any} */ r => r.name === nameOrPort || r.port === nameOrPort
    );
  }

  /**
   * PROFILE MODEL - Get performance characteristics and tier guidance
   */
  async profileModel(/** @type {any} */ modelId, /** @type {any} */ runtime = null) {
    // Check cache
    const profiles = /** @type {Record<string, any>} */ (this.modelProfiles);
    if (profiles[modelId]) {
      return profiles[modelId];
    }

    let latency = 0;
    let gpuAvailable = false;

    // Try to measure latency (ping the model)
    if (runtime) {
      latency = await this._measureLatency(modelId, runtime);
      gpuAvailable = await this._detectGPU(runtime);
    }

    // Determine tier based on model name
    let tier = 'small'; // default
    if (modelId.includes('70b') || modelId.includes('large')) {
      tier = 'heavy';
    } else if (modelId.includes('13b') || modelId.includes('medium')) {
      tier = 'medium';
    }

    const /** @type {any} */
profile = {
      modelId,
      tier,
      latency,
      gpuAvailable,
      recommendation: this._getTierRecommendation(tier),
      firstTokenLatency: this._estimateFirstTokenLatency(tier, gpuAvailable),
    };

    profiles[modelId] = profile;
    return profile;
  }

  /**
   * MEASURE LATENCY - Quick latency test by sending a small prompt
   */
  async _measureLatency(/** @type {any} */ modelId, /** @type {any} */ runtime) {
    try {
      const startTime = Date.now();

      // Send minimal prompt
      const response = await Promise.race([
        fetch(`http://127.0.0.1:${runtime.port}/v1/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelId,
            prompt: 'Hi',
            max_tokens: 1,
            temperature: 0,
          }),
        }),
        new Promise((/** @type {any} */ _, /** @type {any} */ reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
      ]);

      if (response.ok) {
        const latency = Date.now() - startTime;
        console.debug(`${modelId} latency: ${latency}ms`);
        return latency;
      }

      return 0;
    } catch (/** @type {any} */
_err) {
      console.debug(`Failed to measure latency for ${modelId}:`, _err.message);
      return 0;
    }
  }

  /**
   * DETECT GPU - Check if GPU acceleration is available
   */
  async _detectGPU(/** @type {any} */ runtime) {
    try {
      const url = `http://127.0.0.1:${runtime.port}/health`;
      const response = await fetch(url);
      const data = await response.json();

      // Different runtimes expose GPU info differently
      // This is a heuristic - customize based on runtime
      if (data.gpuAvailable) return true;
      if (data.gpuStatus && data.gpuStatus !== 'disabled') return true;
      if (runtime.name === 'Ollama' && data.memory) return true; // Ollama has memory info when GPU is used

      return false;
    } catch (/** @type {any} */
_err) {
      return false;
    }
  }

  /**
   * ESTIMATE FIRST TOKEN LATENCY - Based on tier and hardware
   */
  _estimateFirstTokenLatency(/** @type {any} */ tier, /** @type {any} */ gpuAvailable) {
    const /** @type {any} */
estimates = {
      small: { cpu: 4000, gpu: 500 },
      medium: { cpu: 8000, gpu: 1500 },
      heavy: { cpu: 15000, gpu: 3000 },
    };

    const est = /** @type {any} */ (estimates)[tier] || estimates.small;
    return gpuAvailable ? est.gpu : est.cpu;
  }

  /**
   * GET TIER RECOMMENDATION - Human-readable guidance
   */
  _getTierRecommendation(/** @type {any} */ tier) {
    const /** @type {any} */
recommendations = {
      small: {
        emoji: '⚡',
        title: 'Fast Chat',
        description: 'Best for quick conversations and rapid iteration.',
        vramMin: 2,
        contexts: ['rapid chat', 'quick brainstorm', 'testing'],
      },
      medium: {
        emoji: '⚙️',
        title: 'Creator Workflows',
        description: 'Balanced speed and quality for creative work.',
        vramMin: 8,
        contexts: ['content creation', 'script writing', 'design ideation'],
      },
      heavy: {
        emoji: '🚀',
        title: 'Quality First',
        description: 'Maximum quality, slower inference. Use when output matters more than speed.',
        vramMin: 16,
        contexts: ['research', 'polish pass', 'complex reasoning'],
      },
    };

    return /** @type {any} */ (recommendations)[tier] || recommendations.small;
  }

  /**
   * GET STATUS REPORT - Human-readable runtime status
   */
  getStatusReport() {
    if (!this.detectedRuntimes.length) {
      return {
        status: 'No local runtime detected',
        hint: 'Install Ollama, LM Studio, or Jan to run models locally',
        runtimes: [],
      };
    }

    return {
      status: `${this.detectedRuntimes.length} runtime(s) available`,
      runtimes: this.detectedRuntimes.map((/** @type {any} */ rt) => ({
        name: rt.name,
        modelCount: rt.modelCount,
        recommendation: rt.modelCount > 0 ? `Start with: ${rt.models[0].name}` : 'No models loaded',
      })),
    };
  }

  /**
   * RENDER STATUS UI - For embedding in pages
   */
  renderStatusHTML() {
    const report = this.getStatusReport();

    if (!this.detectedRuntimes.length) {
      return `
        <div class="local-runtime-detector local-runtime-detector--idle">
          <div class="local-runtime-detector__title">🔧 No Local Runtime Detected</div>
          <div class="local-runtime-detector__hint">${report.hint}</div>
          <div class="local-runtime-detector__links">
            <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" class="local-runtime-detector__link">📥 Ollama</a>
            <a href="https://lmstudio.ai" target="_blank" rel="noopener noreferrer" class="local-runtime-detector__link">📥 LM Studio</a>
            <a href="https://jan.ai" target="_blank" rel="noopener noreferrer" class="local-runtime-detector__link">📥 Jan</a>
          </div>
        </div>
      `;
    }

    const runtimesHTML = report.runtimes.map(/** @type {any} */ rt => `
      <div class="local-runtime-detector__runtime">
        <div class="local-runtime-detector__runtime-name">${rt.name}</div>
        <div class="local-runtime-detector__runtime-count">
          ✅ ${rt.modelCount} model(s) available
        </div>
        <div class="local-runtime-detector__runtime-note">
          ${rt.recommendation}
        </div>
      </div>
    `).join('');

    return `
      <div class="local-runtime-detector local-runtime-detector--active">
        <div class="local-runtime-detector__title">
          ✨ ${report.status}
        </div>
        ${runtimesHTML}
      </div>
    `;
  }

  /**
   * SAVE PROFILE - Persist detected runtimes to localStorage
   */
  saveProfile() {
    try {
      sessionStorage.setItem('localRuntimeProfile', JSON.stringify({
        runtimes: this.detectedRuntimes,
        timestamp: Date.now(),
      }));
    } catch (/** @type {any} */
err) {
      console.error('Failed to save runtime profile:', err);
    }
  }

  /**
   * LOAD PROFILE - Restore cached runtime detection
   */
  loadProfile() {
    try {
      const stored = sessionStorage.getItem('localRuntimeProfile');
      if (stored) {
        const data = JSON.parse(stored);
        // Only use cached data if less than 1 hour old
        if (Date.now() - data.timestamp < 60 * 60 * 1000) {
          this.detectedRuntimes = data.runtimes;
          return true;
        }
      }
    } catch (/** @type {any} */
err) {
      console.error('Failed to load runtime profile:', err);
    }
    return false;
  }
}

// Singleton instance
/** @type {LocalRuntimeDetector | null} */
let detectorInstance = null;

function getLocalRuntimeDetector() {
  if (!detectorInstance) {
    detectorInstance = new LocalRuntimeDetector();
  }
  return detectorInstance;
}

// Export globally only in browser contexts.
if (typeof window !== 'undefined') {
  window.LocalRuntimeDetector = LocalRuntimeDetector;
  window.getLocalRuntimeDetector = getLocalRuntimeDetector;
}

export { LocalRuntimeDetector, getLocalRuntimeDetector };
export default getLocalRuntimeDetector;
