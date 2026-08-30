import { normalizeModeSettings, shouldAutoSelectProvider } from './eon-mode-system.js';
import { assessEonAiProviderRoute, buildEonAiRoutingPolicy } from '../ai-kernel/eon-ai-routing-policy.js';

const LOCAL_PROVIDER_IDS = new Set(['browserlocal', 'ollama', 'lmstudio', 'jan']);
const GUIDE_PROVIDER_ID = 'guide';

function detectTaskType(input = '') {
  const lower = String(input || '').toLowerCase();
  if (/\b(image|thumbnail|poster|art|design|illustration)\b/.test(lower)) return 'image';
  if (/\b(video|reel|clip|shorts|render|storyboard)\b/.test(lower)) return 'video';
  if (/\b(audio|voice|speech|podcast|music|song)\b/.test(lower)) return 'audio';
  if (/\b(code|coding|debug|refactor|function|typescript|javascript|react|deploy)\b/.test(lower)) return 'code';
  if (/\b(research|browse|browser|search|compare|sources|citations|latest|news|investigate)\b/.test(lower)) return 'analysis';
  if (/\b(post|publish|schedule|campaign|growth|promote|content|script|caption)\b/.test(lower)) return 'creator';
  return 'chat';
}

function getVerification(providerId, settings, getProviderVerification) {
  if (providerId === GUIDE_PROVIDER_ID) return { ready: true, state: 'guide' };
  try {
    const value = typeof getProviderVerification === 'function'
      ? getProviderVerification(providerId, settings)
      : null;
    return value && typeof value === 'object' ? value : { ready: false, state: 'verification-required' };
  } catch {
    return { ready: false, state: 'verification-required' };
  }
}

function collectProviders(providers = {}) {
  return Object.values(providers || {}).filter((provider) => provider && provider.id);
}

function buildAvailabilityIndex({ providers = {}, getProviderVerification = null, localProviders = [], settings = {} } = {}) {
  const rows = collectProviders(providers);
  const safeSettings = /** @type {any} */ (settings);
  const localDetectedIds = new Set(
    (Array.isArray(localProviders) ? localProviders : [])
      .filter((row) => row && row.available !== false)
      .map((row) => String(row.provider || row.id || '').trim().toLowerCase())
      .filter(Boolean)
  );

  return rows
    .filter((provider) => provider.enabled !== false)
    .map((provider) => {
      const id = String(provider.id || '').trim().toLowerCase();
      const routeType = id === GUIDE_PROVIDER_ID ? 'guide' : (LOCAL_PROVIDER_IDS.has(id) ? 'local' : 'hosted');
      const verification = getVerification(id, safeSettings, getProviderVerification);
      const detected = LOCAL_PROVIDER_IDS.has(id) && localDetectedIds.has(id);
      // Detection is informative only. A local runtime becomes usable only after
      // its Local AI self-test; hosted runtimes need a current Vault verification.
      const usable = id === GUIDE_PROVIDER_ID || Boolean(verification.ready);
      return {
        ...provider,
        id,
        routeType,
        usable,
        detected,
        verification
      };
    });
}

function orderCandidates({ settings, taskType, providerId, index = [] }) {
  const normalized = /** @type {any} */ (normalizeModeSettings(settings));
  const manualProvider = String(providerId || normalized.provider || '').trim().toLowerCase();
  const available = index.filter((row) => row.usable && row.id !== GUIDE_PROVIDER_ID);
  const policy = buildEonAiRoutingPolicy({
    qualityMode: normalized.modelSelectionPolicy,
    selectedProviderId: manualProvider,
    approvedProviderIds: normalized.approvedProviderIds,
    crossProviderConsent: normalized.crossProviderConsent === true,
    billableProviderConsent: normalized.billableProviderConsent === true
  });

  if (normalized.assistantMode === 'guide') return { candidates: [GUIDE_PROVIDER_ID], policy };

  // Advanced/manual routing is deliberately single-provider. Verification
  // failure returns Guide rather than silently trying a different provider.
  if (!shouldAutoSelectProvider(normalized) && manualProvider && manualProvider !== GUIDE_PROVIDER_ID) {
    const manual = available.find((row) => row.id === manualProvider);
    return { candidates: [manual?.id || GUIDE_PROVIDER_ID], policy };
  }

  // Auto optimizes only inside the user's explicit routing envelope. It may
  // reorder approved candidates by runtime preference, but it never invents
  // provider consent from mere discovery/verification evidence.
  const allowed = available.filter((row) => {
    const provider = row || {};
    return assessEonAiProviderRoute({
      providerId: provider.id,
      local: provider.routeType === 'local',
      billable: provider.routeType === 'hosted' && provider.free !== true,
      costClass: provider.routeType === 'hosted' && provider.free !== true ? 'unknown' : 'free'
    }, policy).allowed;
  });
  const locals = allowed.filter((row) => row.routeType === 'local');
  const hosted = allowed.filter((row) => row.routeType === 'hosted');
  const creatorHeavy = taskType === 'video' || taskType === 'image' || taskType === 'audio';

  let ordered = [];
  if (normalized.runtimePreference === 'local-first') ordered = [...locals, ...hosted];
  else if (normalized.runtimePreference === 'provider-connected') ordered = [...hosted, ...locals];
  else ordered = creatorHeavy ? [...hosted, ...locals] : [...locals, ...hosted];

  const candidateIds = [...new Set(ordered.map((row) => row.id))];
  return { candidates: candidateIds.length ? [...candidateIds, GUIDE_PROVIDER_ID] : [GUIDE_PROVIDER_ID], policy };
}

export function buildAutoRoutePlan({
  input = '',
  settings = {},
  providers = {},
  getProviderVerification = null,
  localProviders = []
} = {}) {
  const safeSettings = /** @type {any} */ (settings);
  const safeProviders = /** @type {any} */ (providers);
  const normalized = /** @type {any} */ (normalizeModeSettings(safeSettings));
  const taskType = detectTaskType(input || safeSettings.taskType || '');
  const availability = buildAvailabilityIndex({ providers: safeProviders, getProviderVerification, localProviders, settings: normalized });
  const ordered = orderCandidates({ settings: normalized, taskType, providerId: normalized.provider, index: availability });
  const fallbackChain = ordered.candidates;
  const selectedId = fallbackChain[0] || GUIDE_PROVIDER_ID;
  const selected = availability.find((row) => row.id === selectedId) || safeProviders[selectedId] || safeProviders.guide || { id: GUIDE_PROVIDER_ID, label: 'Guide only' };

  const reason = normalized.assistantMode === 'guide'
    ? 'Guide mode is active, so EONBOT should stay in built-in multilingual guidance until a runtime or provider is connected.'
    : normalized.assistantMode === 'advanced' && String(normalized.provider || '').trim() && normalized.provider !== GUIDE_PROVIDER_ID
      ? `Advanced mode keeps ${selected.label || selected.id} primary unless it fails.`
      : normalized.runtimePreference === 'local-first'
        ? `Auto mode is preferring local-first routing for ${taskType} tasks.`
        : normalized.runtimePreference === 'provider-connected'
          ? `Auto mode is preferring connected providers for ${taskType} tasks.`
          : `Auto mode is using hybrid routing for ${taskType} tasks.`;

  return {
    assistantMode: normalized.assistantMode,
    runtimePreference: normalized.runtimePreference,
    taskType,
    provider: selectedId,
    providerLabel: selected.label || selectedId,
    providerType: LOCAL_PROVIDER_IDS.has(selectedId) ? 'local' : (selectedId === GUIDE_PROVIDER_ID ? 'guide' : 'hosted'),
    fallbackChain,
    reason,
    mode: normalized.mode,
    readyForRealAI: selectedId !== GUIDE_PROVIDER_ID,
    availability,
    routingPolicy: ordered.policy
  };
}
