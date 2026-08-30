function escapeHtml(/** @type {any} */ value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
/**
 * ProviderStatusBadge.js
 * 
 * Unified provider status badge for embedding across all EONAPP.CH surfaces
 * Shows:
 * - Provider name
 * - Current model
 * - Mode (local, hosted, guide)
 * - Status indicator
 * - Reputation
 * 
 * Usage:
 * <div id="provider-badge"></div>
 * <script>
 *   const badge = new ProviderStatusBadge('provider-badge');
 *   badge.update();
 * </script>
 */

class ProviderStatusBadge {
  constructor(/** @type {any} */ containerId, /** @type {any} */ options = {}) {
    this.containerId = containerId;
    this.service = window.getDistributedInferenceService();
    this.helpers = window.DistributedInferenceHelpers;
    this.currentProvider = null;
    this.currentModel = null;
    this.currentMode = 'guide'; // 'local', 'hosted', 'guide'

    this.options = {
      compact: options.compact || false,
      showReputation: options.showReputation !== false,
      clickable: options.clickable !== false,
      autoDetect: options.autoDetect === true,
      ...options,
    };

    this._initDOM();
    this._attachListeners();
  }

  _initDOM() {
    const /** @type {any} */
container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="provider-status-badge ${this.options.compact ? 'provider-status-badge--compact' : ''} ${this.options.clickable ? 'provider-status-badge--clickable' : ''}" id="${this.containerId}-badge" data-mode="guide">
        <div class="provider-status-badge__inner">
          <div id="provider-status-dot" class="provider-status-badge__dot"></div>
          <div class="provider-status-badge__content">
            <div id="provider-label" class="provider-status-badge__label">Provider</div>
            ${!this.options.compact ? `
              <div id="provider-model" class="provider-status-badge__model"></div>
            ` : ''}
          </div>
        </div>

        ${this.options.showReputation ? `
          <div class="provider-status-badge__rep">
            <span id="provider-rep">⭐</span>
            <span id="provider-rep-score" class="provider-status-badge__rep-score">0%</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  _attachListeners() {
    const /** @type {any} */
badge = document.getElementById(`${this.containerId}-badge`);
    if (badge && this.options.clickable) {
      badge.addEventListener('click', () => this._showProviderDetails());
    }
  }

  /**
   * UPDATE - Refresh badge with current provider state
   */
  async update(/** @type {any} */ provider = null, /** @type {any} */ model = null, /** @type {any} */ mode = null) {
    if (provider) this.currentProvider = provider;
    if (model) this.currentModel = model;
    if (mode) this.currentMode = mode;

    // Only auto-detect when a surface explicitly opts in.
    if (!this.currentProvider && this.options.autoDetect) {
      await this._detectProvider();
    }

    if (!this.currentProvider) {
      this.currentProvider = {
        name: 'Guide',
        type: 'guide',
        model: 'Assisted',
      };
      this.currentMode = 'guide';
    }

    this._render();
  }

  /**
   * AUTO-DETECT PROVIDER - Check for local runtimes or default to guide mode
   */
  async _detectProvider() {
    try {
      const canProbeLocal = this.options.autoDetect === true && typeof window.shouldProbeLocalRuntimes === 'function'
        ? window.shouldProbeLocalRuntimes()
        : false;
      if (!canProbeLocal) {
        this.currentProvider = {
          name: 'Guide',
          type: 'guide',
          model: 'Assisted',
        };
        this.currentMode = 'guide';
        return;
      }
      const fetchWithTimeout = async (/** @type {string} */ url, timeoutMs = 1000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          return await fetch(url, { signal: controller.signal });
        } finally {
          clearTimeout(timer);
        }
      };

      const probeEndpoints = async (/** @type {string[]} */ urls, /** @type {(data: any) => any} */ parser) => {
        for (const url of urls) {
          try {
            const response = await fetchWithTimeout(url);
            const data = await response?.json?.();
            const model = parser(data);
            if (model) return model;
          } catch {}
        }
        return null;
      };

      // Try Ollama
      const ollama = await probeEndpoints(
        ['http://127.0.0.1:11434/api/tags', 'http://localhost:11434/api/tags', 'http://127.0.0.1:11434/v1/models'],
        (/** @type {any} */ data) => data && (data.models || data.data) && (data.models || data.data).length ? data : null
      );
      if (ollama && (ollama.models || ollama.data) && (ollama.models || ollama.data).length) {
        this.currentProvider = {
          name: 'Ollama',
          type: 'local',
          model: (ollama.models?.[0]?.name || ollama.data?.[0]?.id || 'local-model'),
        };
        this.currentMode = 'local';
        return;
      }

      // Try LM Studio
      const lmstudio = await probeEndpoints(
        ['http://127.0.0.1:1234/v1/models', 'http://localhost:1234/v1/models'],
        (/** @type {any} */ data) => data && data.data && data.data.length ? data : null
      );
      if (lmstudio && lmstudio.data && lmstudio.data.length) {
        this.currentProvider = {
          name: 'LM Studio',
          type: 'local',
          model: lmstudio.data[0].id,
        };
        this.currentMode = 'local';
        return;
      }

      const jan = await probeEndpoints(
        ['http://127.0.0.1:1337/v1/models', 'http://localhost:1337/v1/models'],
        (/** @type {any} */ data) => data && data.data && data.data.length ? data : null
      );
      if (jan && jan.data && jan.data.length) {
        this.currentProvider = {
          name: 'Jan',
          type: 'local',
          model: jan.data[0].id,
        };
        this.currentMode = 'local';
        return;
      }

      // Fallback to guide mode
      this.currentProvider = {
        name: 'Guide',
        type: 'guide',
        model: 'Assisted',
      };
      this.currentMode = 'guide';
    } catch (/** @type {any} */
_err) {
      console.debug('Provider auto-detect failed, using guide mode');
      this.currentProvider = {
        name: 'Guide',
        type: 'guide',
        model: 'Assisted',
      };
      this.currentMode = 'guide';
    }
  }

  /**
   * RENDER - Update badge DOM with current state
   */
  _render() {
    if (!this.currentProvider) return;

    const /** @type {any} */
badge = document.getElementById(`${this.containerId}-badge`);
    const /** @type {any} */
label = document.getElementById('provider-label');
    const /** @type {any} */
modelEl = document.getElementById('provider-model');
    const /** @type {any} */
repEl = document.getElementById('provider-rep-score');

    if (label) {
      const modeEmoji = {
        'local': '🔵',
        'hosted': '🌐',
        'guide': '✨',
      }[this.currentMode] || '❓';

      label.textContent = `${modeEmoji} ${this.currentProvider.name}`;
    }

    if (badge) {
      badge.dataset.mode = this.currentMode || 'guide';
    }

    if (modelEl && this.currentProvider.model) {
      modelEl.textContent = this._shortModelName(this.currentProvider.model);
    }

    // The dot color is driven by CSS via [data-mode].

    // Update reputation if available
    if (repEl && this.currentProvider.reputation !== undefined) {
      const rep = Math.round(this.currentProvider.reputation);
      repEl.textContent = `${rep}%`;
      const /** @type {any} */
repEl2 = document.getElementById('provider-rep');
      if (repEl2) {
        repEl2.textContent = this.helpers.formatReputation(rep).split(' ')[0]; // Just emoji
      }
    }
  }

  /**
   * SHOW PROVIDER DETAILS - Display detailed modal or panel
   */
  _showProviderDetails() {
    if (!this.currentProvider) return;
    const providerName = escapeHtml(this.currentProvider.name || 'Unknown provider');
    const providerMode = escapeHtml(String(this.currentMode || 'guide'));
    const providerModel = escapeHtml(this.currentProvider.model || 'N/A');
    const providerNodeId = escapeHtml(this.currentProvider.nodeId || '');

    const detailsHtml = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        border: 1px solid rgba(79, 70, 229, 0.3);
        border-radius: 12px;
        padding: 24px;
        color: white;
        max-width: 400px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      " id="provider-details-modal">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Provider Details</h3>
          <button type="button" class="provider-details-close" style="
            background: transparent;
            border: none;
            color: #9CA3AF;
            cursor: pointer;
            font-size: 18px;
          ">×</button>
        </div>

        <div style="display: grid; gap: 12px; font-size: 13px;">
          <div>
            <div style="color: #9CA3AF; margin-bottom: 4px;">Provider</div>
            <div style="font-weight: 500;">${providerName}</div>
          </div>
          <div>
            <div style="color: #9CA3AF; margin-bottom: 4px;">Mode</div>
            <div style="font-weight: 500; text-transform: capitalize;">${providerMode}</div>
          </div>
          <div>
            <div style="color: #9CA3AF; margin-bottom: 4px;">Model</div>
            <div style="font-weight: 500; word-break: break-all;">${providerModel}</div>
          </div>
          ${this.currentProvider.reputation !== undefined ? `
            <div>
              <div style="color: #9CA3AF; margin-bottom: 4px;">Reputation</div>
              <div style="font-weight: 500; color: #10B981;">${this.helpers.formatReputation(this.currentProvider.reputation)}</div>
            </div>
          ` : ''}
          ${this.currentProvider.latency !== undefined ? `
            <div>
              <div style="color: #9CA3AF; margin-bottom: 4px;">Average Latency</div>
              <div style="font-weight: 500; color: #F59E0B;">${this.helpers.formatLatency(this.currentProvider.latency)}</div>
            </div>
          ` : ''}
          ${this.currentProvider.nodeId ? `
            <div>
              <div style="color: #9CA3AF; margin-bottom: 4px;">Node ID</div>
              <div style="font-weight: 500; font-family: monospace; font-size: 12px; word-break: break-all;">${providerNodeId}</div>
            </div>
          ` : ''}
        </div>

        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 12px; color: #9CA3AF;">
          ℹ️ This provider will be used for your AI interactions unless you explicitly select a different one.
        </div>
      </div>
    `;

    // Overlay
    const /** @type {any} */
overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
    `;
    overlay.id = 'provider-modal-overlay';
    overlay.addEventListener('click', () => overlay.remove());

    document.body.appendChild(overlay);
    document.body.insertAdjacentHTML('beforeend', detailsHtml);
    document.querySelector('.provider-details-close')?.addEventListener('click', () => {
      overlay.remove();
      document.getElementById('provider-details-modal')?.remove();
    });
  }

  /**
   * SHORT MODEL NAME - Truncate long model names
   */
  _shortModelName(/** @type {any} */ modelName) {
    if (modelName.length > 20) {
      return modelName.substring(0, 17) + '...';
    }
    return modelName;
  }
}

// Export globally
window.ProviderStatusBadge = ProviderStatusBadge;

// Auto-initialize on all pages if badges exist
document.addEventListener('DOMContentLoaded', () => {
  // Find all elements with class provider-status-badge or id ending with -provider-badge
  const /** @type {any} */
badges = document.querySelectorAll('[id$="-provider-badge"], .provider-status-badge');
    badges.forEach((/** @type {any} */ badge) => {
    if (!badge.dataset.badgeInitialized) {
      const badgeInstance = new ProviderStatusBadge(badge.id || badge.className);
      badgeInstance.update();
      badge.dataset.badgeInitialized = 'true';
    }
  });
});
