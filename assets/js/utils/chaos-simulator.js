/* global CloseEvent */

/**
 * Chaos Simulator — AI Provider Outage Testing Utility
 * =====================================================
 * Simulates provider failures for E2E and integration testing.
 * Used to verify that the AI routing layer (model-policy-router.js,
 * ai-runtime.js) correctly falls back when providers are unavailable.
 *
 * MODES:
 * - provider-down: Simulate one or more providers returning HTTP 500/503
 * - latency-spike: Add artificial delay to provider requests
 * - all-down: All AI providers unavailable (graceful degradation test)
 * - nostr-down: Nostr relays unreachable (WebSocket failures)
 * - offline: navigator.onLine = false simulation
 *
 * USAGE (in tests):
 *   import { ChaosSimulator } from './chaos-simulator.js';
 *   const chaos = new ChaosSimulator();
 *   chaos.simulateProviderDown(['groq', 'gemini']);
 *   // ... run test ...
 *   chaos.restore();
 *
 * USAGE (dev console):
 *   window.__EON_CHAOS__.simulateProviderDown(['groq']);
 *   window.__EON_CHAOS__.restore();
 *
 * @module utils/chaos-simulator
 */

// ─── Provider URL patterns ──────────────────────────────────────────────────────

const PROVIDER_PATTERNS = /** @type {Record<string, RegExp>} */ ({
  groq:        /api\.groq\.com/,
  gemini:      /generativelanguage\.googleapis\.com/,
  together:    /api\.together\.xyz/,
  openai:      /api\.openai\.com/,
  anthropic:   /api\.anthropic\.com/,
  mistral:     /api\.mistral\.ai/,
  cohere:      /api\.cohere\.ai/,
  deepseek:    /api\.deepseek\.com/,
  huggingface: /api-inference\.huggingface\.co/,
  nostr:       /wss?:\/\//,  // All WebSocket connections
  backend:     /\/api\//,    // Local backend routes
});

const NOSTR_RELAY_RE = /wss:\/\//;

// ─── ChaosSimulator class ──────────────────────────────────────────────────────

export class ChaosSimulator {
  constructor() {
    /** @type {string[]} */
    this._downProviders = [];
    /** @type {Map<string, number>} */
    this._latencyMs = new Map();
    /** @type {boolean} */
    this._allDown = false;
    /** @type {boolean} */
    this._offlineMode = false;
    /** @type {typeof window.fetch | null} */
    this._originalFetch = null;
    /** @type {typeof WebSocket | null} */
    this._originalWebSocket = null;
    /** @type {boolean} */
    this._active = false;
    /** @type {any[]} */
    this._interceptLog = [];
  }

  // ─── Core fetch interceptor ────────────────────────────────────────────────

  /** Install the fetch interceptor. */
  _installFetchInterceptor() {
    if (this._originalFetch) return; // Already installed
    this._originalFetch = window.fetch;
    const sim = this;

    window.fetch = async function chaosInterceptedFetch(/** @type {any} */ input, /** @type {any} */ init) {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

      // Offline mode
      if (sim._offlineMode) {
        const err = new TypeError('Failed to fetch (chaos: offline mode)');
        sim._log('offline', url, 'TypeError');
        throw err;
      }

      // All-down mode
      if (sim._allDown) {
        const aiPatterns = Object.entries(PROVIDER_PATTERNS)
          .filter((/** @type {any} */ [k]) => k !== 'nostr' && k !== 'backend')
          .map((/** @type {any} */ [, re]) => re);
        const isAI = aiPatterns.some(/** @type {any} */ re => re.test(url));
        if (isAI) {
          sim._log('all-down', url, '503');
          return new Response(JSON.stringify({ error: 'Service Unavailable (chaos: all-down)' }), {
            status: 503,
            headers: { 'content-type': 'application/json' },
          });
        }
      }

      // Per-provider simulation
      for (const /** @type {any} */
provider of sim._downProviders) {
        const pattern = PROVIDER_PATTERNS[provider];
        if (pattern && pattern.test(url)) {
          sim._log(provider, url, '503');
          const latency = sim._latencyMs.get(provider) || 0;
          if (latency > 0) await _sleep(latency);
          return new Response(JSON.stringify({ error: `Service Unavailable (chaos: ${provider})` }), {
            status: 503,
            headers: { 'content-type': 'application/json' },
          });
        }
      }

      // Latency spike (for providers not marked down)
      for (const [provider, latency] of sim._latencyMs.entries()) {
        if (!sim._downProviders.includes(provider)) {
          const pattern = PROVIDER_PATTERNS[provider];
          if (pattern && pattern.test(url) && latency > 0) {
            await _sleep(latency);
          }
        }
      }

      return /** @type {any} */ (sim._originalFetch).call(window, input, init);
    };
  }

  /** Restore original fetch. */
  _removeFetchInterceptor() {
    if (this._originalFetch) {
      window.fetch = this._originalFetch;
      this._originalFetch = null;
    }
  }

  // ─── WebSocket interceptor (for Nostr relay simulation) ────────────────────

  /** Install WebSocket interceptor (for simulating Nostr relay failure). */
  _installWSInterceptor() {
    if (this._originalWebSocket) return;
    this._originalWebSocket = window.WebSocket;
    const sim = this;

    /** @type {any} */
    const ChaosWebSocket = function(/** @type {any} */ url, /** @type {any} */ protocols) {
      const isNostrRelay = NOSTR_RELAY_RE.test(String(url || ''));
      const isNostrDown  = sim._downProviders.includes('nostr') || (sim._allDown && isNostrRelay);

      if (isNostrDown && isNostrRelay) {
        sim._log('nostr', String(url), 'WebSocket error');
        // Return a fake WebSocket that immediately errors
        const fakeWS = new EventTarget();
        /** @type {any} */ (fakeWS).readyState = WebSocket.CONNECTING;
        /** @type {any} */ (fakeWS).send = () => {};
        /** @type {any} */ (fakeWS).close = () => {};
        /** @type {any} */ (fakeWS).url = url;
        /** @type {any} */ (fakeWS).protocol = '';
        /** @type {any} */ (fakeWS).bufferedAmount = 0;
        /** @type {any} */ (fakeWS).extensions = '';
        /** @type {any} */ (fakeWS).binaryType = 'blob';
        /** @type {any} */ (fakeWS).CONNECTING = 0;
        /** @type {any} */ (fakeWS).OPEN = 1;
        /** @type {any} */ (fakeWS).CLOSING = 2;
        /** @type {any} */ (fakeWS).CLOSED = 3;
        setTimeout(() => {
          /** @type {any} */ (fakeWS).readyState = WebSocket.CLOSED;
          fakeWS.dispatchEvent(new Event('error'));
          fakeWS.dispatchEvent(new CloseEvent('close', { code: 1006, reason: 'Chaos: relay down', wasClean: false }));
        }, 50);
        return /** @type {WebSocket} */ (/** @type {unknown} */ (fakeWS));
      }

      return new /** @type {any} */ (sim._originalWebSocket)(url, protocols);
    };

    ChaosWebSocket.prototype = WebSocket.prototype;
    ChaosWebSocket.CONNECTING = 0;
    ChaosWebSocket.OPEN = 1;
    ChaosWebSocket.CLOSING = 2;
    ChaosWebSocket.CLOSED = 3;

    window.WebSocket = /** @type {typeof WebSocket} */ (ChaosWebSocket);
  }

  _removeWSInterceptor() {
    if (this._originalWebSocket) {
      window.WebSocket = this._originalWebSocket;
      this._originalWebSocket = null;
    }
  }

  // ─── Offline mode ──────────────────────────────────────────────────────────

  /** Simulate navigator.onLine = false (using fetch interception + onLine override). */
  _installOfflineMode() {
    // Note: navigator.onLine is read-only; we can't directly override it.
    // Instead we intercept all fetches. Tests should also mock navigator.onLine
    // via Object.defineProperty in their setup if needed.
    this._offlineMode = true;
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Simulate one or more providers being down.
   * @param {string[]} providers - Provider names (e.g. ['groq', 'gemini'])
   */
  simulateProviderDown(/** @type {any} */ providers) {
    if (!Array.isArray(providers)) providers = [providers];
    this._downProviders = [...new Set([...this._downProviders, ...providers])];
    this._installFetchInterceptor();
    if (this._downProviders.includes('nostr')) this._installWSInterceptor();
    this._active = true;
    return this;
  }

  /**
   * Simulate all AI providers being simultaneously unavailable.
   * Used to test graceful degradation to "AI unavailable" state.
   */
  simulateAllProvidersDown() {
    this._allDown = true;
    this._installFetchInterceptor();
    this._installWSInterceptor();
    this._active = true;
    return this;
  }

  /**
   * Add artificial latency to provider requests (in ms).
   * Can be combined with simulateProviderDown for partial failures.
   * @param {string} provider
   * @param {number} latencyMs
   */
  simulateLatencySpike(/** @type {any} */ provider, /** @type {any} */ latencyMs) {
    this._latencyMs.set(provider, latencyMs);
    this._installFetchInterceptor();
    this._active = true;
    return this;
  }

  /**
   * Simulate device going offline.
   * All fetch calls throw TypeError (network error).
   */
  simulateOffline() {
    this._installOfflineMode();
    this._installFetchInterceptor();
    this._active = true;
    return this;
  }

  /**
   * Restore all original network functions.
   * Always call this in afterEach/cleanup.
   */
  restore() {
    this._downProviders = [];
    this._latencyMs.clear();
    this._allDown = false;
    this._offlineMode = false;
    this._active = false;
    this._removeFetchInterceptor();
    this._removeWSInterceptor();
    return this;
  }

  /**
   * Get the intercepted request log.
   * @returns {Array<{ provider: string, url: string, outcome: string, at: number }>}
   */
  getLog() { return [...this._interceptLog]; }

  /** Clear the log. */
  clearLog() { this._interceptLog = []; return this; }

  /** @param {string} provider @param {string} url @param {string} outcome */
  _log(/** @type {any} */ provider, /** @type {any} */ url, /** @type {any} */ outcome) {
    this._interceptLog.push({ provider, url, outcome, at: Date.now() });
  }

  /**
   * Check if a specific provider is currently being simulated as down.
   * @param {string} provider
   */
  isProviderDown(/** @type {any} */ provider) {
    return this._allDown || this._downProviders.includes(provider);
  }

  /** Get current simulation state */
  getState() {
    return {
      active:        this._active,
      downProviders: [...this._downProviders],
      latencySpikes: Object.fromEntries(this._latencyMs),
      allDown:       this._allDown,
      offlineMode:   this._offlineMode,
      logEntries:    this._interceptLog.length,
    };
  }
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function _sleep(/** @type {any} */ ms) {
  return new Promise(/** @type {any} */ resolve => setTimeout(resolve, ms));
}

// ─── Dev-mode global export ────────────────────────────────────────────────────

/** @type {any} */
const chaosWin = typeof window !== 'undefined' ? window : null;
if (chaosWin && chaosWin.DEBUG) {
  chaosWin.__EON_CHAOS__ = new ChaosSimulator();
}

// ─── Named exports ──────────────────────────────────────────────────────────────

/** Known provider names for simulateProviderDown() */
export const PROVIDERS = Object.keys(PROVIDER_PATTERNS);
