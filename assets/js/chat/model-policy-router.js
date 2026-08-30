import { readBrowserLocalLiteReceipt } from '../local-ai/browser-local-lite.js';

const DEFAULT_TASK_TYPE = 'chat';

// P1: Model health cache — tracks last verified status per provider
// Populated lazily on first resolveModelPolicyV1() call.
const /** @type {any} */
_modelHealthCache = new Map(); // providerId -> { ok: boolean, checkedAt: number }
const MODEL_HEALTH_TTL = 5 * 60 * 1000; // Re-check every 5 minutes

// Provider ping endpoints (HEAD requests, no auth required)
const /** @type {any} */
PROVIDER_PING = {
  groq:        'https://api.groq.com/openai/v1/models',
  gemini:      'https://generativelanguage.googleapis.com/v1beta/models',
  together:    'https://api.together.xyz/v1/models',
  openrouter:  'https://openrouter.ai/api/v1/models',
  openai:      'https://api.openai.com/v1/models',
  anthropic:   'https://api.anthropic.com/v1/models',
};

/**
 * Soft health check for a provider. Returns true if reachable, false on timeout/error.
 * Non-blocking: never throws. Failures degrade silently, not fatally.
 */
async function checkProviderHealth(/** @type {any} */ providerId) {
  const url = PROVIDER_PING[providerId];
  if (!url) return true; // Unknown provider — assume OK (local/custom)

  const cached = _modelHealthCache.get(providerId);
  if (cached && Date.now() - cached.checkedAt < MODEL_HEALTH_TTL) return cached.ok;

  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 3000); // 3s ping timeout
    const resp = await fetch(url, {
      method: 'HEAD',
      signal: ctrl.signal,
      credentials: 'omit',
      headers: { 'Accept': '*/*' }
    });
    clearTimeout(timeout);
    // 2xx or 4xx (auth error) both mean the endpoint is reachable
    const ok = resp.status < 500;
    _modelHealthCache.set(providerId, { ok, checkedAt: Date.now() });
    if (!ok) console.warn(`[ModelPolicyRouter] Provider ${providerId} returned ${resp.status} — may be degraded.`);
    return ok;
  } catch {
    // Network error or timeout — mark as unhealthy for this window
    _modelHealthCache.set(providerId, { ok: false, checkedAt: Date.now() });
    console.warn(`[ModelPolicyRouter] Provider ${providerId} unreachable — will skip in routing.`);
    return false;
  }
}

/**
 * Run health checks in background for all known providers.
 * Call once on app startup. Non-blocking.
 */
export function prefetchModelHealth() {
  for (const /** @type {any} */
providerId of Object.keys(PROVIDER_PING)) {
    checkProviderHealth(providerId).catch(() => {});
  }
}

const /** @type {any} */
TASK_PROFILES = {
  chat: {
    localFirst: true,
    preferredFree: ['groq', 'gemini', 'together', 'openrouter'],
    preferredPremium: ['openai', 'anthropic']
  },
  coding: {
    localFirst: false,
    preferredFree: ['groq', 'openrouter', 'together'],
    preferredPremium: ['openai', 'anthropic']
  },
  strategy: {
    localFirst: false,
    preferredFree: ['gemini', 'groq', 'openrouter'],
    preferredPremium: ['openai', 'anthropic']
  },
  creator: {
    localFirst: true,
    preferredFree: ['gemini', 'groq', 'together'],
    preferredPremium: ['openai', 'anthropic']
  },
  high_stakes: {
    localFirst: false,
    preferredFree: ['gemini', 'groq'],
    preferredPremium: ['openai', 'anthropic']
  }
};

function detectTaskType(/** @type {any} */ input = '', /** @type {any} */ explicitTaskType = '') {
  const explicit = String(explicitTaskType || '').trim().toLowerCase();
  if (explicit && TASK_PROFILES[explicit]) return explicit;

  const text = String(input || '').toLowerCase();
  if (/\b(code|typescript|javascript|refactor|debug|compile|test)\b/.test(text)) return 'coding';
  if (/\b(strategy|roadmap|plan|kpi|launch|retention|conversion)\b/.test(text)) return 'strategy';
  if (/\b(content|script|creator|thumbnail|video|post|caption)\b/.test(text)) return 'creator';
  if (/\b(financial advice|live trade|real money|legal|security critical)\b/.test(text)) return 'high_stakes';
  return DEFAULT_TASK_TYPE;
}

function hasUsableKey(/** @type {any} */ providerId, /** @type {any} */ getApiKey) {
  if (providerId === 'guide') return false;
  if (providerId === 'browserlocal') return Boolean(readBrowserLocalLiteReceipt()?.ok);
  if (providerId === 'ollama' || providerId === 'lmstudio' || providerId === 'jan') return true;
  return Boolean(String(getApiKey(providerId) || '').trim());
}

function chooseByPreference(/** @type {any} */ preferred = [], /** @type {any} */ getApiKey) {
  for (const /** @type {any} */
providerId of preferred) {
    if (hasUsableKey(providerId, getApiKey)) {
      return providerId;
    }
  }
  return '';
}

export function resolveModelPolicyV1(/** @type {any} */ { input = '', settings = {}, getApiKey }) {
  const taskType = detectTaskType(input, settings.taskType);
  const profile = TASK_PROFILES[taskType] || TASK_PROFILES[DEFAULT_TASK_TYPE];

  const localProvider = chooseByPreference(['browserlocal', 'ollama', 'lmstudio', 'jan'], getApiKey);
  const freeProvider = chooseByPreference(profile.preferredFree, getApiKey);
  const premiumProvider = chooseByPreference(profile.preferredPremium, getApiKey);

  const policyTier = String(settings.policyTier || 'balanced').toLowerCase();
  let selectedProvider = String(settings.provider || '').trim().toLowerCase();

  if (!selectedProvider || selectedProvider === 'auto') {
    if (policyTier === 'local-private' && localProvider) {
      selectedProvider = localProvider;
    } else if (policyTier === 'fast-free') {
      selectedProvider = freeProvider || localProvider || premiumProvider;
    } else if (policyTier === 'premium') {
      selectedProvider = premiumProvider || freeProvider || localProvider;
    } else if (profile.localFirst) {
      selectedProvider = localProvider || freeProvider || premiumProvider;
    } else {
      selectedProvider = freeProvider || premiumProvider || localProvider;
    }
  }

  if (!selectedProvider) {
    selectedProvider = 'guide';
  }

  return {
    taskType,
    provider: selectedProvider,
    reason: `policy:${policyTier};task:${taskType}`
  };
}

/**
 * Async version of resolveModelPolicyV1 that skips providers known to be unhealthy.
 * Prefer this in production code; fall back to resolveModelPolicyV1 for sync paths.
 */
export async function resolveModelPolicyV1Async(/** @type {any} */ { input = '', settings = {}, getApiKey }) {
  const taskType = detectTaskType(input, settings.taskType);
  const profile = TASK_PROFILES[taskType] || TASK_PROFILES[DEFAULT_TASK_TYPE];

  // Filter to only providers that pass health check
  async function chooseHealthy(/** @type {any} */ preferred = []) {
    for (const /** @type {any} */
providerId of preferred) {
      if (!hasUsableKey(providerId, getApiKey)) continue;
      const healthy = await checkProviderHealth(providerId);
      if (healthy) return providerId;
    }
    return '';
  }

  const localProvider = await chooseHealthy(['browserlocal', 'ollama', 'lmstudio', 'jan']);
  const freeProvider = await chooseHealthy(profile.preferredFree);
  const premiumProvider = await chooseHealthy(profile.preferredPremium);

  const policyTier = String(settings.policyTier || 'balanced').toLowerCase();
  let selectedProvider = String(settings.provider || '').trim().toLowerCase();

  if (!selectedProvider || selectedProvider === 'auto') {
    if (policyTier === 'local-private' && localProvider) {
      selectedProvider = localProvider;
    } else if (policyTier === 'fast-free') {
      selectedProvider = freeProvider || localProvider || premiumProvider;
    } else if (policyTier === 'premium') {
      selectedProvider = premiumProvider || freeProvider || localProvider;
    } else if (profile.localFirst) {
      selectedProvider = localProvider || freeProvider || premiumProvider;
    } else {
      selectedProvider = freeProvider || premiumProvider || localProvider;
    }
  }

  if (!selectedProvider) selectedProvider = 'guide';

  return {
    taskType,
    provider: selectedProvider,
    reason: `policy:${policyTier};task:${taskType};health-checked:true`
  };
}
