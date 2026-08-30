/**
 * EONBOT capability registry
 * --------------------------
 * This is a small, user-facing truth layer for the three modes EONBOT can
 * honestly expose in the Chat-first product:
 *
 * - Guide: deterministic product help, available without a model.
 * - Local: a user-selected runtime only after its explicit local self-test.
 * - Connected: a previously configured provider path that is ready now.
 *
 * It deliberately reads readiness booleans only. It never returns provider
 * credentials, endpoint query values, private prompts, or Vault records.
 */

import { readLocalRuntimeStatus } from '../local-ai/local-runtime-status.js';
import { readBrowserLocalLiteReceipt } from '../local-ai/browser-local-lite.js';
import { getAIReadiness } from '../utils/ai-readiness.js';

export const EONBOT_CAPABILITY_MODE_VERSION = 'eonbot-capability-modes:v1';

const LOCAL_PROVIDER_IDS = new Set(['browserlocal', 'ollama', 'lmstudio', 'jan']);

export const EONBOT_CAPABILITY_MODES = Object.freeze([
  Object.freeze({
    id: 'guide',
    label: 'Guide',
    description: 'Built-in product guidance. It does not pretend to be a connected model.',
    setupUrl: '/',
    privacy: 'No provider connection is required.'
  }),
  Object.freeze({
    id: 'local',
    label: 'Local',
    description: 'Private local runtime after a successful device self-test.',
    setupUrl: '/local-ai#eonbot-local-ai-setup',
    privacy: 'Runs on this device and has no web or external-action access by itself.'
  }),
  Object.freeze({
    id: 'connected',
    label: 'Connected',
    description: 'A user-configured provider path that is ready for this browser profile.',
    setupUrl: '/vault#api-keys',
    privacy: 'Credentials are managed in Vault, never collected in chat.'
  })
]);

function normalizeSettings(value = {}) {
  return value && typeof value === 'object' ? value : {};
}

function normalizeRuntimeStatus(value = null) {
  return value && typeof value === 'object' ? value : null;
}

function getModeMeta(id = 'guide') {
  return EONBOT_CAPABILITY_MODES.find((entry) => entry.id === id) || EONBOT_CAPABILITY_MODES[0];
}

function localProofForSelection(settings = {}, localStatus = null, browserLiteReceipt = readBrowserLocalLiteReceipt()) {
  const providerId = String(settings.provider || '').trim().toLowerCase();
  if (providerId === 'browserlocal') {
    return browserLiteReceipt?.ok === true
      ? { ok: true, runtime: 'EON Local Lite', runtimeId: 'browserlocal', model: browserLiteReceipt.model || '', checkedAt: browserLiteReceipt.checkedAt || '' }
      : null;
  }
  return localStatus?.ok ? localStatus : null;
}

function isVerifiedLocalSelection(settings = {}, localStatus = null, browserLiteReceipt = readBrowserLocalLiteReceipt()) {
  const providerId = String(settings.provider || '').trim().toLowerCase();
  const proof = localProofForSelection(settings, localStatus, browserLiteReceipt);
  const checkedModel = String(proof?.model || '').trim();
  const selectedModel = String(settings.model || '').trim();
  if (!LOCAL_PROVIDER_IDS.has(providerId) || !proof?.ok) return false;
  return !checkedModel || !selectedModel || checkedModel === selectedModel;
}

/**
 * Build a safe runtime truth receipt for the shell and Chat.
 * @param {object} options
 * @param {object} [options.settings]
 * @param {object|null} [options.localRuntimeStatus]
 * @param {object|null} [options.readiness]
 */
export function resolveEonbotCapabilityMode({
  settings = {},
  localRuntimeStatus = readLocalRuntimeStatus(),
  readiness = null,
  browserLiteReceipt = readBrowserLocalLiteReceipt()
} = {}) {
  const normalizedSettings = normalizeSettings(settings);
  const normalizedLocalStatus = normalizeRuntimeStatus(localRuntimeStatus);
  const safeReadiness = readiness && typeof readiness === 'object'
    ? readiness
    : getAIReadiness(normalizedSettings);
  const providerId = String(normalizedSettings.provider || '').trim().toLowerCase();
  const effectiveLocalProof = localProofForSelection(normalizedSettings, normalizedLocalStatus, browserLiteReceipt);
  const localSelected = isVerifiedLocalSelection(normalizedSettings, normalizedLocalStatus, browserLiteReceipt);
  const connectedReady = Boolean(
    safeReadiness?.ready
    && providerId
    && providerId !== 'guide'
    && !LOCAL_PROVIDER_IDS.has(providerId)
  );

  const activeId = localSelected ? 'local' : connectedReady ? 'connected' : 'guide';
  const active = getModeMeta(activeId);
  const localReady = Boolean(effectiveLocalProof?.ok);

  const modes = EONBOT_CAPABILITY_MODES.map((meta) => {
    if (meta.id === 'guide') {
      return Object.freeze({ ...meta, active: activeId === meta.id, available: true, status: activeId === meta.id ? 'active' : 'ready' });
    }
    if (meta.id === 'local') {
      return Object.freeze({
        ...meta,
        active: activeId === meta.id,
        available: localReady,
        status: activeId === meta.id ? 'active' : localReady ? 'ready' : 'setup-required',
        checkedAt: effectiveLocalProof?.checkedAt || null,
        runtime: localReady ? String(effectiveLocalProof?.runtime || 'Local runtime') : null,
        model: localReady ? String(effectiveLocalProof?.model || '') : null
      });
    }
    return Object.freeze({
      ...meta,
      active: activeId === meta.id,
      available: connectedReady,
      status: activeId === meta.id ? 'active' : connectedReady ? 'ready' : 'setup-required',
      providerLabel: connectedReady ? String(safeReadiness?.providerLabel || 'Connected provider') : null
    });
  });

  const nextAction = activeId === 'guide'
    ? localReady
      ? { label: 'Use tested local AI', url: '/local-ai' }
      : { label: 'Let EONBOT guide local AI', url: '/local-ai#eonbot-local-ai-setup' }
    : activeId === 'local'
      ? { label: 'Open AI Cockpit', url: '/workspace' }
      : { label: 'Open AI Cockpit', url: '/workspace' };

  return Object.freeze({
    version: EONBOT_CAPABILITY_MODE_VERSION,
    activeId,
    activeLabel: active.label,
    activeDescription: active.description,
    providerId: activeId === 'connected' ? providerId : null,
    localRuntimeReady: localReady,
    connectedReady,
    modes: Object.freeze(modes),
    nextAction: Object.freeze(nextAction),
    truthNote: 'EONBOT never asks for, stores, or exposes credentials in chat. Local and Connected status is shown only after local self-test or existing secure configuration proof.'
  });
}

export function listEonbotCapabilityModes() {
  return EONBOT_CAPABILITY_MODES.slice();
}
