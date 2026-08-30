const STORAGE_KEY = 'eon:load-governor:v1';

// ─── Subscription-aware extended budgets ─────────────────────────────────────
// Paid tiers get higher token/history ceilings regardless of hardware detection.
const /** @type {any} */
TIER_BUDGET_OVERRIDE = {
  spark: {
    maxHistoryMessages: 16,
    maxInputChars: 3000,
    maxOutputTokens: 600,
    timeoutMs: 30000,
  },
  builder: {
    maxHistoryMessages: 24,
    maxInputChars: 5000,
    maxOutputTokens: 1200,
    timeoutMs: 45000,
  },
  pro: {
    maxHistoryMessages: 30,
    maxInputChars: 8000,
    maxOutputTokens: 2000,
    timeoutMs: 60000,
  },
  operator: {
    maxHistoryMessages: 40,
    maxInputChars: 12000,
    maxOutputTokens: 4000,
    timeoutMs: 90000,
  }
};

const /** @type {any} */
PROFILE_CONFIG = {
  safe: {
    key: 'safe',
    label: 'Safe mode',
    maxHistoryMessages: 6,
    maxInputChars: 1200,
    timeoutMs: 15000,
    maxOutputTokens: 280,
    typingDelayMs: 180,
  },
  balanced: {
    key: 'balanced',
    label: 'Balanced mode',
    maxHistoryMessages: 12,
    maxInputChars: 2400,
    timeoutMs: 25000,
    maxOutputTokens: 520,
    typingDelayMs: 120,
  },
  performance: {
    key: 'performance',
    label: 'Performance mode',
    maxHistoryMessages: 18,
    maxInputChars: 4000,
    timeoutMs: 40000,
    maxOutputTokens: 900,
    typingDelayMs: 90,
  }
};

function readOverride() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return ['safe', 'balanced', 'performance', 'auto'].includes(raw.mode) ? raw.mode : 'auto';
  } catch {
    return 'auto';
  }
}

function writeOverride(/** @type {any} */ mode) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode }));
  } catch {}
}

function clamp(/** @type {any} */ value, /** @type {any} */ min, /** @type {any} */ max) {
  return Math.max(min, Math.min(max, value));
}

export class BrowserLoadGovernor {
  constructor() {
    this.overrideMode = readOverride();
    this.baseProfile = this.#detectBaseProfile();
    this.profile = this.baseProfile;
    this._tierOverride = null; // set via setTierOverride() after subscription loads
    this._abortControllers = new Set();
    this.status = {
      profile: this.profile,
      baseProfile: this.baseProfile,
      stressScore: 0,
      reasons: [],
      memoryRatio: /** @type {number | null} */ (null),
      longTasks: 0,
      activeRequests: 0
    };
    this._activeRequests = 0;
    /** @type {any[]} */
    this._longTasks = [];
    /** @type {any[]} */
    this._lagSamples = [];
    this._intervalId = null;
    this._lagIntervalId = null;
    this._observer = null;
    this._started = false;
  }

  start() {
    if (this._started) return this;
    this._started = true;
    this.#startLagSampler();
    this.#startLongTaskObserver();
    this.#sample();
this._intervalId = /** @type {any} */ (window.setInterval(() => this.#sample(), 5000));
    if (typeof this._intervalId?.unref === 'function') {
      this._intervalId.unref();
    }
    return this;
  }

  stop() {
    if (this._intervalId) window.clearInterval(this._intervalId);
    if (this._lagIntervalId) window.clearInterval(this._lagIntervalId);
    this._observer?.disconnect?.();
    this._intervalId = null;
    this._lagIntervalId = null;
    this._observer = null;
    this._started = false;
  }

  setModeOverride(/** @type {any} */ mode) {
    this.overrideMode = ['safe', 'balanced', 'performance', 'auto'].includes(mode) ? mode : 'auto';
    writeOverride(this.overrideMode);
    this.#sample();
  }

  getModeOverride() {
    return this.overrideMode;
  }

  getBudget() {
    const /** @type {any} */
base = { ...PROFILE_CONFIG[this.profile] };
    // Merge subscription tier overrides on top of hardware-detected profile
    if (this._tierOverride && TIER_BUDGET_OVERRIDE[this._tierOverride]) {
      const tier = TIER_BUDGET_OVERRIDE[this._tierOverride];
      return {
        ...base,
        maxHistoryMessages: Math.max(base.maxHistoryMessages, tier.maxHistoryMessages),
        maxInputChars:      Math.max(base.maxInputChars,      tier.maxInputChars),
        maxOutputTokens:    Math.max(base.maxOutputTokens,    tier.maxOutputTokens),
        timeoutMs:          Math.max(base.timeoutMs,          tier.timeoutMs)
      };
    }
    return base;
  }

  /**
   * Return a budget copy with soft overrides for mission routing.
   * This lets higher-level orchestration stay token-efficient without mutating
   * the user's persistent governor mode.
   * @param {{ maxHistoryMessages?: number, maxInputChars?: number, maxOutputTokens?: number, timeoutMs?: number }} overrides
   */
  getBudgetWithOverrides(/** @type {any} */ overrides = {}) {
    const base = this.getBudget();
    if (!overrides || typeof overrides !== 'object') return base;
    return {
      ...base,
      maxHistoryMessages: Number.isFinite(overrides.maxHistoryMessages) ? Math.max(1, Math.min(base.maxHistoryMessages, overrides.maxHistoryMessages)) : base.maxHistoryMessages,
      maxInputChars: Number.isFinite(overrides.maxInputChars) ? Math.max(256, Math.min(base.maxInputChars, overrides.maxInputChars)) : base.maxInputChars,
      maxOutputTokens: Number.isFinite(overrides.maxOutputTokens) ? Math.max(64, Math.min(base.maxOutputTokens, overrides.maxOutputTokens)) : base.maxOutputTokens,
      timeoutMs: Number.isFinite(overrides.timeoutMs) ? Math.max(5000, Math.min(base.timeoutMs, overrides.timeoutMs)) : base.timeoutMs
    };
  }

  /**
   * Set subscription tier so the governor can apply higher budgets for paid users.
   * Call this once after entitlements.js loads.
   * @param {string|null} tier — 'spark' | 'builder' | 'pro' | 'operator' | null
   *
   * SECURITY NOTE (P1): This is a client-side hint only. The tier value from
   * localStorage is NOT validated server-side here — it controls UI budget caps only.
   * For financial or access-control decisions, always verify tier via signed backend receipt
   * or on-chain entitlement before granting capabilities.
   */
  setTierOverride(/** @type {any} */ tier) {
    if (tier && !TIER_BUDGET_OVERRIDE[tier]) {
      console.warn(`[LoadGovernor] Unknown tier "${tier}" ignored. Valid: spark, builder, pro, operator.`);
    }
    this._tierOverride = (tier && TIER_BUDGET_OVERRIDE[tier]) ? tier : null;
  }

  /**
   * Create an AbortController tracked by this governor.
   * All tracked controllers are aborted when abortAll() is called.
   * @returns {AbortController}
   */
  createAbortController() {
    const ctrl = new AbortController();
    this._abortControllers.add(ctrl);
    ctrl.signal.addEventListener('abort', () => this._abortControllers.delete(ctrl), { once: true });
    return ctrl;
  }

  /**
   * Abort all in-flight requests (e.g. on page unload or when user navigates away).
   */
  abortAll() {
    for (const /** @type {any} */
ctrl of this._abortControllers) {
      try { ctrl.abort(); } catch {}
    }
    this._abortControllers.clear();
    this._activeRequests = 0;
    this.#sample();
  }

  getStatus() {
    return {
      ...this.status,
      budget: this.getBudget(),
      overrideMode: this.overrideMode
    };
  }

  beginRequest() {
    this._activeRequests += 1;
    this.#sample();
  }

  endRequest() {
    this._activeRequests = Math.max(0, this._activeRequests - 1);
    this.#sample();
  }

  #detectBaseProfile() {
    const appNav = /** @type {any} */ (navigator);
    const memory = appNav.deviceMemory || 4;
    const cores = appNav.hardwareConcurrency || 4;

    if (memory <= 4 || cores <= 4) return 'safe';
    if (memory >= 8 && cores >= 8) return 'performance';
    return 'balanced';
  }

  #startLagSampler() {
    let previous = performance.now();
this._lagIntervalId = /** @type {any} */ (window.setInterval(() => {
      const now = performance.now();
      const drift = Math.max(0, now - previous - 1000);
      previous = now;
      this._lagSamples.push({ ts: Date.now(), drift });
      const cutoff = Date.now() - 30000;
      this._lagSamples = this._lagSamples.filter((/** @type {any} */ sample) => sample.ts >= cutoff);
    }, 1000));
    if (typeof this._lagIntervalId?.unref === 'function') {
      this._lagIntervalId.unref();
    }
  }

  #startLongTaskObserver() {
    if (!('PerformanceObserver' in window)) return;
    try {
      this._observer = new PerformanceObserver((/** @type {any} */ list) => {
        const cutoff = Date.now() - 30000;
        for (const /** @type {any} */
entry of list.getEntries()) {
          this._longTasks.push({
            ts: Date.now(),
            duration: entry.duration || 0
          });
        }
        this._longTasks = this._longTasks.filter((/** @type {any} */ entry) => entry.ts >= cutoff);
      });
      this._observer.observe({ entryTypes: ['longtask'] });
    } catch {
      this._observer = null;
    }
  }

  #sample() {
    const /** @type {any} */
reasons = [];
    let stressScore = 0;

    const appNav = /** @type {any} */ (navigator);
    const connection = appNav.connection || appNav.mozConnection || appNav.webkitConnection;
    if (connection?.saveData) {
      stressScore += 18;
      reasons.push('data-saver');
    }
    if (connection?.effectiveType && /2g|slow-2g/.test(connection.effectiveType)) {
      stressScore += 14;
      reasons.push('slow-network');
    }

    const recentLongTasks = this._longTasks.filter((/** @type {any} */ entry) => entry.ts >= Date.now() - 30000);
    if (recentLongTasks.length >= 3) {
      stressScore += 24;
      reasons.push('main-thread-pressure');
    }

    const worstLag = this._lagSamples.reduce((/** @type {any} */ max, /** @type {any} */ sample) => Math.max(max, sample.drift), 0);
    if (worstLag >= 250) {
      stressScore += 26;
      reasons.push('event-loop-lag');
    } else if (worstLag >= 120) {
      stressScore += 12;
      reasons.push('minor-lag');
    }

    /** @type {number | null} */
    let memoryRatio = null;
    const perf = /** @type {any} */ (performance);
    if (perf.memory?.usedJSHeapSize && perf.memory?.jsHeapSizeLimit) {
      memoryRatio = perf.memory.usedJSHeapSize / perf.memory.jsHeapSizeLimit;
      if (memoryRatio >= 0.85) {
        stressScore += 28;
        reasons.push('heap-pressure');
      } else if (memoryRatio >= 0.7) {
        stressScore += 12;
        reasons.push('heap-rising');
      }
    }

    if (this._activeRequests >= 2) {
      stressScore += 16;
      reasons.push('parallel-requests');
    } else if (this._activeRequests === 1) {
      stressScore += 6;
    }

    let resolvedProfile = this.baseProfile;
    if (this.overrideMode !== 'auto') {
      resolvedProfile = this.overrideMode;
    } else if (stressScore >= 45) {
      resolvedProfile = 'safe';
    } else if (stressScore >= 20 && this.baseProfile === 'performance') {
      resolvedProfile = 'balanced';
    } else if (stressScore >= 20) {
      resolvedProfile = 'safe';
    }

    this.profile = resolvedProfile;
    this.status = {
      profile: resolvedProfile,
      baseProfile: this.baseProfile,
      stressScore: clamp(stressScore, 0, 100),
      reasons,
      memoryRatio: memoryRatio,
      longTasks: recentLongTasks.length,
      activeRequests: this._activeRequests
    };

    document.dispatchEvent(new CustomEvent('eon:load-governor', { detail: this.getStatus() }));
  }
}

export function createLoadGovernor() {
  return new BrowserLoadGovernor().start();
}

