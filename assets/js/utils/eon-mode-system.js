/**
 * EON Mode System
 * ----------------
 * Product-facing control plane that separates:
 * - assistant mode: how much the app decides for the user
 * - runtime preference: where work should prefer to run
 *
 * Legacy surfaces still use `mode` values of guide / ai / hybrid.
 * This module preserves those values for backward compatibility while
 * enabling the newer UX model from the CEO/CTO plan.
 */

export const ASSISTANT_MODE_OPTIONS = Object.freeze([
  {
    id: 'guide',
    label: 'Guide',
    shortLabel: 'Guide',
    description: 'No-key onboarding, built-in help, and safe product guidance without pretending to be full AI.'
  },
  {
    id: 'auto',
    label: 'Auto',
    shortLabel: 'Auto',
    description: 'Best default for normal users. EONAPP can choose a verified model inside the provider/privacy/cost envelope the user approved.'
  },
  {
    id: 'advanced',
    label: 'Advanced',
    shortLabel: 'Advanced',
    description: 'More direct provider and model control for users who know what they want.'
  }
]);


export const MODEL_SELECTION_POLICY_OPTIONS = Object.freeze([
  { id: 'auto', label: 'Auto', shortLabel: 'Auto', description: 'Choose the strongest verified model inside the currently approved provider and privacy/cost envelope.' },
  { id: 'private', label: 'Private', shortLabel: 'Private', description: 'Use a verified device-local model only. Never route to a hosted provider.' },
  { id: 'best', label: 'Best quality', shortLabel: 'Best', description: 'Prefer measured quality and capability inside the approved provider envelope.' },
  { id: 'fast', label: 'Fast', shortLabel: 'Fast', description: 'Prefer measured responsiveness and lighter compatible models inside the approved provider envelope.' },
  { id: 'economy', label: 'Economy', shortLabel: 'Economy', description: 'Prefer local/free/low-cost compatible models without silently crossing a billing boundary.' }
]);

export const RUNTIME_PREFERENCE_OPTIONS = Object.freeze([
  {
    id: 'local-first',
    label: 'Local-first',
    shortLabel: 'Local-first',
    description: 'Prefer local runtimes in setup guidance. Sending still uses only the provider you explicitly selected and verified; no hosted fallback starts by itself.'
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    shortLabel: 'Hybrid',
    description: 'Keep both local and hosted setup options visible. Each request still uses only the provider you explicitly selected and verified.'
  },
  {
    id: 'provider-connected',
    label: 'Provider-connected',
    shortLabel: 'Provider',
    description: 'Keep the explicitly selected connected provider as the active request path; no hidden cross-provider fallback is allowed.'
  }
]);

const ASSISTANT_MODE_IDS = new Set(ASSISTANT_MODE_OPTIONS.map((item) => item.id));
const RUNTIME_PREFERENCE_IDS = new Set(RUNTIME_PREFERENCE_OPTIONS.map((item) => item.id));
const MODEL_SELECTION_POLICY_IDS = new Set(MODEL_SELECTION_POLICY_OPTIONS.map((item) => item.id));
const LOCAL_PROVIDER_IDS = new Set(['browserlocal', 'ollama', 'lmstudio', 'jan']);

export function normalizeAssistantMode(value) {
  const raw = String(value || '').trim().toLowerCase();
  return ASSISTANT_MODE_IDS.has(raw) ? raw : 'auto';
}

export function normalizeRuntimePreference(value) {
  const raw = String(value || '').trim().toLowerCase();
  return RUNTIME_PREFERENCE_IDS.has(raw) ? raw : 'hybrid';
}

export function getAssistantModeMeta(value) {
  const id = normalizeAssistantMode(value);
  return ASSISTANT_MODE_OPTIONS.find((item) => item.id === id) || ASSISTANT_MODE_OPTIONS[1];
}

export function normalizeModelSelectionPolicy(value) {
  const raw = String(value || '').trim().toLowerCase();
  return MODEL_SELECTION_POLICY_IDS.has(raw) ? raw : 'auto';
}

export function getModelSelectionPolicyMeta(value) {
  const id = normalizeModelSelectionPolicy(value);
  return MODEL_SELECTION_POLICY_OPTIONS.find((item) => item.id === id) || MODEL_SELECTION_POLICY_OPTIONS[0];
}

export function getRuntimePreferenceMeta(value) {
  const id = normalizeRuntimePreference(value);
  return RUNTIME_PREFERENCE_OPTIONS.find((item) => item.id === id) || RUNTIME_PREFERENCE_OPTIONS[1];
}

function inferAssistantModeFromLegacy(raw = {}) {
  const legacy = /** @type {any} */ (raw);
  const legacyMode = String(legacy.mode || '').trim().toLowerCase();
  if (legacyMode === 'guide' || legacy.provider === 'guide') return 'guide';
  if (legacyMode === 'ai') return 'advanced';
  return 'auto';
}

function inferRuntimePreferenceFromLegacy(raw = {}) {
  const legacy = /** @type {any} */ (raw);
  const explicitProvider = String(legacy.provider || '').trim().toLowerCase();
  const legacyMode = String(legacy.mode || '').trim().toLowerCase();
  if (LOCAL_PROVIDER_IDS.has(explicitProvider)) return 'local-first';
  if (legacyMode === 'ai') return 'provider-connected';
  return 'hybrid';
}

export function computeLegacyExecutionMode(settings = {}) {
  const normalized = /** @type {any} */ (settings);
  const assistantMode = normalizeAssistantMode(normalized.assistantMode || inferAssistantModeFromLegacy(normalized));
  const runtimePreference = normalizeRuntimePreference(normalized.runtimePreference || inferRuntimePreferenceFromLegacy(normalized));
  const providerId = String(normalized.provider || '').trim().toLowerCase();

  if (assistantMode === 'guide' || providerId === 'guide') return 'guide';
  if (runtimePreference === 'provider-connected') return 'ai';
  return 'hybrid';
}

export function normalizeModeSettings(raw = {}) {
  const settings = raw && typeof raw === 'object' ? raw : {};
  const normalized = /** @type {any} */ (settings);
  const assistantMode = normalizeAssistantMode(normalized.assistantMode || inferAssistantModeFromLegacy(normalized));
  const runtimePreference = normalizeRuntimePreference(normalized.runtimePreference || inferRuntimePreferenceFromLegacy(normalized));
  const modelSelectionPolicy = normalizeModelSelectionPolicy(normalized.modelSelectionPolicy || 'auto');
  const legacyMode = computeLegacyExecutionMode({ ...settings, assistantMode, runtimePreference });

  return {
    ...settings,
    assistantMode,
    runtimePreference,
    modelSelectionPolicy,
    mode: legacyMode
  };
}

export function isGuideMode(settings = {}) {
  return normalizeModeSettings(settings).assistantMode === 'guide';
}

export function isAdvancedMode(settings = {}) {
  return normalizeModeSettings(settings).assistantMode === 'advanced';
}

export function shouldAutoSelectProvider(settings = {}) {
  const normalized = normalizeModeSettings(settings);
  if (normalized.assistantMode === 'guide') return false;
  return normalized.assistantMode === 'auto' || !String(normalized.provider || '').trim() || normalized.provider === 'guide' || normalized.provider === 'auto';
}

export function buildModeHeadline(settings = {}, context = {}) {
  const normalized = normalizeModeSettings(settings);
  const assistantMeta = getAssistantModeMeta(normalized.assistantMode);
  const runtimeMeta = getRuntimePreferenceMeta(normalized.runtimePreference);
  const providerLabel = String(context.providerLabel || '').trim();
  const providerFragment = providerLabel && normalized.assistantMode !== 'guide' ? ` · ${providerLabel}` : '';
  const runtimeFragment = normalized.assistantMode === 'guide' ? ' · local-first guidance' : ` · ${runtimeMeta.shortLabel.toLowerCase()} preference`;
  return `${assistantMeta.shortLabel} mode${providerFragment}${runtimeFragment}`;
}

export function buildModeGuidance(settings = {}, context = {}) {
  const normalized = normalizeModeSettings(settings);
  if (normalized.assistantMode === 'guide') {
    return 'Guide Mode explains the app, the next step, and when a provider key or local runtime is actually required.';
  }
  if (normalized.assistantMode === 'auto') {
    if (normalized.runtimePreference === 'local-first') {
      return 'Auto Mode uses your local-first preference for setup guidance and model ranking. A request still runs only through the provider you explicitly selected and verified.';
    }
    if (normalized.runtimePreference === 'provider-connected') {
      return 'Auto Mode keeps the selected connected provider and may optimize only its verified models. It does not silently jump to another provider.';
    }
    return 'Auto Mode optimizes verified models inside the provider you explicitly selected and verified. Runtime preference guides setup; it never grants a silent provider switch.';
  }

  const providerLabel = String(context.providerLabel || '').trim();
  if (providerLabel) {
    return `Advanced Mode keeps ${providerLabel} directly in your hands. Any provider change remains explicit.`;
  }
  return 'Advanced Mode gives you direct provider and model control without hidden provider fallback.';
}

export function listModeOptions() {
  return ASSISTANT_MODE_OPTIONS.slice();
}

export function listRuntimePreferences() {
  return RUNTIME_PREFERENCE_OPTIONS.slice();
}

export function listModelSelectionPolicies() {
  return MODEL_SELECTION_POLICY_OPTIONS.slice();
}
