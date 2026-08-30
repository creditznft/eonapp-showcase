/**
 * A15 C05 — neutral verified Core outcome authority.
 *
 * Core surfaces may record only bounded proof that a native action completed.
 * The authority stores no user content, prompt, file, credential, media, URL,
 * destination, payment data or City progression state. EONCITY may subscribe
 * to policy-approved outcomes through its own progress bridge.
 */
export const EON_CORE_OUTCOME_SCHEMA = 'eon.core-outcome.a15.v1';
export const EON_CORE_OUTCOME_STORAGE_KEY = 'eon:core:outcomes:a15:v1';
export const EON_CORE_OUTCOME_EVENT = 'eon:core-outcome-recorded';
export const EON_CORE_OUTCOME_MAX_RECORDS = 256;

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 160) => String(value || '').trim().slice(0, max);
const safeId = (value = '', max = 160) => clean(value, max).toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const routePath = (value = '') => {
  const normalized = clean(value, 240) || '/';
  const hashIndex = normalized.indexOf('#');
  const queryIndex = normalized.indexOf('?');
  const end = [hashIndex, queryIndex].filter((index) => index >= 0).reduce((minimum, index) => Math.min(minimum, index), normalized.length);
  const path = normalized.slice(0, end) || '/';
  return path.startsWith('/') ? path : `/${path}`;
};

const define = (kind, stationId, missionId, routes, sources, nativeAuthority, sourceAuthorities = {}) => freeze({
  kind,
  stationId,
  missionId,
  routes: freeze(routes),
  sources: freeze(sources),
  nativeAuthority,
  sourceAuthorities: freeze({ ...sourceAuthorities })
});

function resolvePolicyNativeAuthority(policy, source = '') {
  if (!policy) return '';
  const normalizedSource = safeId(source);
  return safeId(policy.sourceAuthorities?.[normalizedSource] || policy.nativeAuthority);
}

export const EON_CORE_OUTCOME_POLICIES = freeze([
  define('creator-guide-artifact', 'create-forge', 'creator', ['/create'], ['create-local-guide'], 'create-guide'),
  define('creator-image-verified', 'create-forge', 'creator', ['/local-ai', '/create', '/eoncity'], ['comfyui-image-lab', 'eon-direct-byok-fal', 'eon-direct-byok-replicate'], 'comfyui-image-positive-path', { 'comfyui-image-lab': 'comfyui-image-positive-path', 'eon-direct-byok-fal': 'direct-byok-fal-image-positive-path', 'eon-direct-byok-replicate': 'direct-byok-replicate-image-positive-path' }),
  define('creator-video-verified', 'create-forge', 'creator', ['/local-ai', '/create', '/eoncity'], ['comfyui-video-lab', 'eon-direct-byok-fal', 'eon-direct-byok-replicate'], 'comfyui-video-positive-path', { 'comfyui-video-lab': 'comfyui-video-positive-path', 'eon-direct-byok-fal': 'direct-byok-fal-video-positive-path', 'eon-direct-byok-replicate': 'direct-byok-replicate-video-positive-path' }),
  define(
    'creator-music-exported',
    'create-forge',
    'creator',
    ['/create', '/eoncity'],
    ['eon-music-studio', 'eon-acestep-local', 'eon-direct-byok-elevenlabs'],
    'browser-music-wav-export',
    {
      'eon-music-studio': 'browser-music-wav-export',
      'eon-acestep-local': 'acestep-local-music-positive-path',
      'eon-direct-byok-elevenlabs': 'direct-byok-hosted-music-positive-path'
    }
  ),
  define('creator-radio-station', 'create-forge', 'creator', ['/create', '/eoncity'], ['eon-radio-station'], 'local-generative-radio-profile'),
  define('forge-source-applied', 'create-forge', 'creator', ['/forge'], ['forge-local-apply'], 'forge-review-apply'),
  define('project-shell', 'project-atlas', 'project', ['/projects'], ['projects-local'], 'universal-project-registry'),
  define('project-resume', 'project-atlas', 'project', ['/projects'], ['projects-local'], 'universal-project-registry'),
  define('library-item-reused', 'library-vault', 'vault-recovery', ['/library'], ['library-local-use'], 'unified-library'),
  define('backup-readiness-receipt', 'library-vault', 'vault-recovery', ['/capsule'], ['capsule-local'], 'data-survival-centre'),
  define('recovery-restore-receipt', 'library-vault', 'vault-recovery', ['/capsule'], ['capsule-local'], 'data-survival-centre'),
  define('local-ai-self-test', 'local-ai-lab', 'local-ai-byok', ['/local-ai'], ['local-ai-device'], 'local-connection-authority'),
  define('byok-provider-verification', 'local-ai-lab', 'local-ai-byok', ['/vault'], ['vault-direct-byok'], 'credential-custody'),
  define('automation-proposal', 'automation-theatre', 'automation', ['/automations'], ['automations-local'], 'workflow-action-authority'),
  define('command-status-reviewed', 'command-console', 'command-review', ['/eoncity'], ['command-centre-local-review'], 'truthful-command-centre-review'),
  define('realm-layout-saved', 'my-realm-portal', 'my-realm', ['/realm-studio'], ['realm-studio-local-save'], 'my-realm-local-state'),
  define('plans-access-reviewed', 'plans-access', 'plans-access', ['/eoncity'], ['city-server-access-review'], 'server-access-review'),
  define('reviewed-signed-handoff', 'share-capture', 'sharing', ['/'], ['share-center-local'], 'reviewed-share-receipt'),
  define('creator-capture-saved', 'share-capture', 'sharing', ['/'], ['creator-capture-local'], 'creator-media-lifecycle')
]);

const policyByKind = new Map(EON_CORE_OUTCOME_POLICIES.map((entry) => [entry.kind, entry]));

function resolveStorage(storage = null) {
  if (storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function emptyStore() {
  return { schema: EON_CORE_OUTCOME_SCHEMA, revision: 0, updatedAt: 0, outcomes: [] };
}

function deterministicDigest(value = '') {
  let hash = 0x811c9dc5;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv1a32:${hash.toString(16).padStart(8, '0')}`;
}

function normalizeStoredOutcome(value = {}) {
  const kind = safeId(value.kind);
  const policy = policyByKind.get(kind);
  const route = routePath(value.route);
  const source = safeId(value.source);
  const evidenceReceiptId = safeId(value.evidenceReceiptId || value.receiptId);
  const outcomeId = safeId(value.outcomeId || `${kind}:${evidenceReceiptId}`, 220);
  if (!policy || !outcomeId || !evidenceReceiptId || value.verified !== true) return null;
  if (!policy.routes.includes(route) || !policy.sources.includes(source)) return null;
  const nativeAuthority = resolvePolicyNativeAuthority(policy, source);
  if (!nativeAuthority || safeId(value.nativeAuthority) !== nativeAuthority) return null;
  return freeze({
    schema: EON_CORE_OUTCOME_SCHEMA,
    outcomeId,
    kind,
    stationId: policy.stationId,
    missionId: policy.missionId,
    route,
    source,
    nativeAuthority,
    evidenceReceiptId,
    verified: true,
    verifiedAt: Math.max(1, finite(value.verifiedAt)),
    privacyClass: 'redacted-proof',
    containsPrivateContent: false,
    cityMaySubscribe: true,
    policyTags: freeze(['native-proof', 'explicit-action', 'city-subscribable']),
    metadataDigest: clean(value.metadataDigest, 80) || deterministicDigest(`${kind}|${route}|${source}|${evidenceReceiptId}`),
    xpGranted: false,
    rewardGranted: false,
    automaticExecution: false,
    automaticNavigation: false
  });
}

export function readEonCoreOutcomeStore({ storage = null } = {}) {
  const target = resolveStorage(storage);
  try {
    const parsed = JSON.parse(target?.getItem?.(EON_CORE_OUTCOME_STORAGE_KEY) || 'null');
    if (parsed?.schema !== EON_CORE_OUTCOME_SCHEMA || !Array.isArray(parsed.outcomes)) return freeze(emptyStore());
    const outcomes = parsed.outcomes.map(normalizeStoredOutcome).filter(Boolean);
    return freeze({
      schema: EON_CORE_OUTCOME_SCHEMA,
      revision: Math.max(0, finite(parsed.revision)),
      updatedAt: Math.max(0, finite(parsed.updatedAt)),
      outcomes: freeze(outcomes)
    });
  } catch {
    return freeze(emptyStore());
  }
}

export function listEonCoreOutcomes(options = {}) {
  return readEonCoreOutcomeStore(options).outcomes;
}

function emitOutcome(environment, outcome) {
  if (typeof environment?.dispatchEvent !== 'function' || typeof environment?.CustomEvent !== 'function') return false;
  environment.dispatchEvent(new environment.CustomEvent(EON_CORE_OUTCOME_EVENT, {
    detail: freeze({ schema: EON_CORE_OUTCOME_SCHEMA, outcome })
  }));
  return true;
}

export function recordEonCoreOutcome(input = {}, { storage = null, environment = globalThis, now = Date.now() } = {}) {
  const kind = safeId(input.kind || input.type);
  const policy = policyByKind.get(kind);
  if (!policy) return freeze({ ok: false, reason: 'outcome-policy-not-found' });
  if (input.verified !== true) return freeze({ ok: false, reason: 'verified-native-proof-required' });
  if (input.containsPrivateContent === true || input.privateContentStored === true) return freeze({ ok: false, reason: 'private-content-forbidden' });
  const route = routePath(input.route);
  const source = safeId(input.source);
  if (!policy.routes.includes(route) || !policy.sources.includes(source)) return freeze({ ok: false, reason: 'native-authority-mismatch' });
  const nativeAuthority = resolvePolicyNativeAuthority(policy, source);
  if (!nativeAuthority) return freeze({ ok: false, reason: 'native-authority-mismatch' });
  const evidenceReceiptId = safeId(input.evidenceReceiptId || input.receiptId);
  if (!evidenceReceiptId) return freeze({ ok: false, reason: 'evidence-receipt-required' });
  const outcomeId = safeId(`${kind}:${evidenceReceiptId}`, 220);
  const target = resolveStorage(storage);
  if (!target) return freeze({ ok: false, reason: 'outcome-storage-unavailable' });
  const current = readEonCoreOutcomeStore({ storage: target });
  const duplicate = current.outcomes.find((entry) => entry.outcomeId === outcomeId);
  if (duplicate) return freeze({ ok: true, reason: 'already-recorded', duplicate: true, outcome: duplicate, store: current });
  if (current.outcomes.length >= EON_CORE_OUTCOME_MAX_RECORDS) return freeze({ ok: false, reason: 'outcome-capacity-reached', store: current });
  const verifiedAt = Math.max(1, finite(input.verifiedAt || now, Date.now()));
  const outcome = normalizeStoredOutcome({
    schema: EON_CORE_OUTCOME_SCHEMA,
    outcomeId,
    kind,
    route,
    source,
    nativeAuthority,
    evidenceReceiptId,
    verified: true,
    verifiedAt,
    metadataDigest: deterministicDigest(`${kind}|${route}|${source}|${evidenceReceiptId}`)
  });
  const next = {
    schema: EON_CORE_OUTCOME_SCHEMA,
    revision: current.revision + 1,
    updatedAt: verifiedAt,
    outcomes: [...current.outcomes, outcome]
  };
  try {
    const serialized = JSON.stringify(next);
    target.setItem(EON_CORE_OUTCOME_STORAGE_KEY, serialized);
    if (target.getItem(EON_CORE_OUTCOME_STORAGE_KEY) !== serialized) throw new Error('outcome-write-verification-failed');
  } catch {
    return freeze({ ok: false, reason: 'outcome-write-verification-failed', store: current });
  }
  emitOutcome(environment, outcome);
  return freeze({ ok: true, reason: 'verified-core-outcome-recorded', duplicate: false, outcome, store: freeze(next) });
}

export function getEonCoreOutcomeTruth() {
  return freeze({
    schema: EON_CORE_OUTCOME_SCHEMA,
    policyCount: EON_CORE_OUTCOME_POLICIES.length,
    localOnly: true,
    nativeProofRequired: true,
    privateContentStored: false,
    promptsStored: false,
    filesStored: false,
    credentialsStored: false,
    mediaStored: false,
    cityMaySubscribeToApprovedProof: true,
    routeOpeningGrantsOutcome: false,
    cityReturnReceiptGrantsOutcome: false,
    xpGranted: false,
    rewardGranted: false,
    automaticExecution: false,
    silentEviction: false
  });
}

export function validateEonCoreOutcome(outcome = {}) {
  const normalized = normalizeStoredOutcome(outcome);
  const errors = [];
  if (!normalized) errors.push('outcome-invalid');
  if (outcome?.containsPrivateContent || outcome?.privateContentStored || outcome?.xpGranted || outcome?.rewardGranted || outcome?.automaticExecution || outcome?.automaticNavigation) errors.push('truth-boundary-invalid');
  const serialized = JSON.stringify(outcome);
  if (/rawPrompt|promptText|providerKey|apiKey|fileContent|mediaBlob|signedUrl|cardNumber/i.test(serialized)) errors.push('private-field-present');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), outcome: normalized });
}

export default freeze({
  EON_CORE_OUTCOME_SCHEMA,
  EON_CORE_OUTCOME_STORAGE_KEY,
  EON_CORE_OUTCOME_EVENT,
  EON_CORE_OUTCOME_MAX_RECORDS,
  EON_CORE_OUTCOME_POLICIES,
  readEonCoreOutcomeStore,
  listEonCoreOutcomes,
  recordEonCoreOutcome,
  getEonCoreOutcomeTruth,
  validateEonCoreOutcome
});
