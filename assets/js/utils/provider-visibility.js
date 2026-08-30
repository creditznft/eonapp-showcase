/**
 * Unified Provider Visibility Component
 * Displays consistent provider information across all AI surfaces (Chat, EONBOT, Browser, Studio)
 */

import { PROVIDERS, loadAISettings } from '../chat/ai-runtime.js';
import { escapeHtml } from './escape.js';
import { getAIReadiness } from './ai-readiness.js';

const MODEL_CACHE_KEY = 'eon:discovered-models:v1';

function getModelAvailabilityLabel(/** @type {any} */ providerId, /** @type {any} */ model) {
  const cleanModel = String(model || '').trim();
  if (!cleanModel) return 'No model selected';
  try {
    const cache = JSON.parse(localStorage.getItem(MODEL_CACHE_KEY) || '{}');
    const cached = Array.isArray(cache?.[providerId]?.models) ? cache[providerId].models : [];
    return cached.includes(cleanModel)
      ? `Live now: ${cleanModel}`
      : `Cached/default: ${cleanModel}`;
  } catch {
    return `Configured: ${cleanModel}`;
  }
}

/**
 * Get provider info with status
 * @returns {Object} Provider info with label, model, mode, ready status, and badge
 */
export function getProviderInfo() {
  const settings = loadAISettings();
  const providerId = settings.provider || 'guide';
  const provider = PROVIDERS[providerId] || PROVIDERS.guide;
  const readiness = getAIReadiness(settings);
  const model = readiness.ready ? String(readiness.model || '') : '';
  const mode = settings.mode || 'chat';
  
  return {
    providerId,
    label: provider.label,
    model,
    mode,
    ready: readiness.ready,
    badge: provider.badge,
    free: false,
    endpoint: readiness.ready ? String(readiness.endpoint || '') : '',
    modelStatus: readiness.detail || getModelAvailabilityLabel(providerId, model),
    readiness
  };
}

/**
 * Update provider chip element with current provider info
 * @param {string|HTMLElement} element - Element ID or DOM element
 * @param {Object} options - Display options
 */
export function updateProviderChip(/** @type {any} */ element, /** @type {any} */ options = {}) {
  const { showModel = true, showMode = false, showBadge = true, showStatus = false } = options;
  const el = typeof element === 'string' ? document.getElementById(element) : element;
  if (!el) return;
  
  const info = getProviderInfo();
  const /** @type {any} */
parts = [info.label];
  
  if (showModel && info.model) {
    parts.push(info.model);
  }
  
  if (showMode && info.mode) {
    parts.push(`(${info.mode})`);
  }
  
  if (showBadge && info.badge) {
    parts.push(info.badge);
  }
  
  el.textContent = parts.join(' · ');
  
  if (showStatus) {
    el.classList.toggle('ready', info.ready);
    el.classList.toggle('no-key', !info.ready);
  }
}

/**
 * Create provider status HTML for consistent display
 * @param {Object} options - Display options
 * @returns {string} HTML string for provider status
 */
export function createProviderStatusHTML(/** @type {any} */ options = {}) {
  const { showModel = true, showMode = false, showBadge = true, showEndpoint = false, showRecovery = true } = options;
  const info = getProviderInfo();
  
  const /** @type {any} */
parts = [info.label];
  if (showModel && info.model) parts.push(info.model);
  if (showMode && info.mode) parts.push(`(${info.mode})`);
  if (showBadge && info.badge) parts.push(info.badge);

  const escapedParts = parts.map((/** @type {any} */ part) => escapeHtml(part));
  
  let html = `<span class="provider-status ${info.ready ? 'ready' : 'no-key'}">${escapedParts.join(' · ')}</span>`;
  
  if (showEndpoint && info.endpoint) {
    html += `<span class="provider-endpoint">${escapeHtml(info.endpoint)}</span>`;
  }

  if (showModel) {
    html += `<span class="provider-model-state">${escapeHtml(info.modelStatus)}</span>`;
  }

  if (showRecovery && !info.ready) {
    const setupAction = info.readiness?.primaryAction || null;
    const manageAction = info.readiness?.secondaryAction || null;
    html += `
      <div class="provider-recovery">
        <span class="provider-recovery__title">${escapeHtml(info.readiness?.bannerLabel || 'AI setup needed')}</span>
        <span class="provider-recovery__body">${escapeHtml(info.readiness?.bannerBody || 'Connect a provider or local runtime to continue.')}</span>
        <div class="provider-recovery__actions">
          ${setupAction?.url ? `<a class="btn btn-primary btn-sm" href="${escapeHtml(setupAction.url)}">${escapeHtml(setupAction.label || 'Start onboarding')}</a>` : ''}
          ${manageAction?.url ? `<a class="btn btn-outline btn-sm" href="${escapeHtml(manageAction.url)}">${escapeHtml(manageAction.label || 'Manage keys')}</a>` : ''}
        </div>
      </div>
    `;
  }
  
  return html;
}

/**
 * Initialize provider visibility on a page
 * @param {Object} config - Configuration for provider visibility elements
 */
export function initProviderVisibility(/** @type {any} */ config = {}) {
  const {
    chipElement = 'provider-chip',
    statusElement = 'provider-status',
    showModel = true,
    showMode = false,
    showBadge = true,
    showStatus = true,
    autoUpdate = true
  } = config;
  
  // Update chip element
  if (chipElement) {
    updateProviderChip(chipElement, { showModel, showMode, showBadge, showStatus });
  }
  
  // Update status element
  if (statusElement) {
    const statusEl = typeof statusElement === 'string' ? document.getElementById(statusElement) : statusElement;
    if (statusEl) {
      statusEl.innerHTML = createProviderStatusHTML({ showModel, showMode, showBadge, showRecovery: true });
    }
  }
  
  // Auto-update on settings change if requested
  if (autoUpdate) {
    window.addEventListener('storage', (/** @type {any} */ e) => {
      if (e.key === 'eon:ai-chat-settings:v1') {
        if (chipElement) updateProviderChip(chipElement, { showModel, showMode, showBadge, showStatus });
        if (statusElement) {
          const el = typeof statusElement === 'string' ? document.getElementById(statusElement) : statusElement;
          if (el) el.innerHTML = createProviderStatusHTML({ showModel, showMode, showBadge, showRecovery: true });
        }
      }
    });
  }
}

/**
 * Get provider info for EON Browser specifically
 * @returns {Object} Provider info for browser
 */
export function getBrowserProviderInfo() {
  const info = getProviderInfo();
  return {
    providerId: info.providerId,
    label: info.label,
    model: info.model,
    ready: info.ready,
    badge: info.badge,
    state: info.readiness?.state || 'guide',
    detail: info.readiness?.detail || info.modelStatus
  };
}

/**
 * Sync browser provider chip (backward compatibility)
 */
export function syncBrowserProviderChip() {
  updateProviderChip('browser-provider-chip', { showModel: true, showBadge: true });
}

/**
 * Get provider info for Creator Studio
 * @returns {Object} Provider info for studio
 */
export function getStudioProviderInfo() {
  const info = getProviderInfo();
  return {
    ...info,
    task: 'studio',
    canUseFor: ['text', 'image', 'voice', 'video', 'music']
  };
}
