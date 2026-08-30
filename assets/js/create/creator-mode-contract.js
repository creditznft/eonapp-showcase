/** W627A/W627B — one Creator intent and progressive-disclosure contract. */

export const EON_CREATOR_MODE_SCHEMA = 'eon.creator.mode.w627ab.v1';
export const EON_CREATOR_UI_MODES = Object.freeze(['beginner', 'advanced']);
export const EON_CREATOR_MEDIA_KINDS = Object.freeze(['image', 'video']);
export const EON_CREATOR_RAILS = Object.freeze(['local-runtime', 'direct-user-owned-byok', 'guide']);

const MEDIA_SET = new Set(EON_CREATOR_MEDIA_KINDS);
const UI_SET = new Set(EON_CREATOR_UI_MODES);
const RAIL_SET = new Set(EON_CREATOR_RAILS);
const SECRET_LIKE_RE = /(?:api[-_ ]?key|access[-_ ]?token|secret|password|authorization|private[-_ ]?key|bearer)\s*[:=]/i;

function clean(value = '', limit = 12_000) {
  return String(value || '').replaceAll(String.fromCharCode(0), '').trim().slice(0, limit);
}

function randomId() {
  try { return `creator_${globalThis.crypto.randomUUID()}`; } catch { return `creator_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`; }
}

export function normalizeCreatorUiMode(value = 'beginner') {
  const mode = clean(value, 20).toLowerCase();
  return UI_SET.has(mode) ? mode : 'beginner';
}

export function buildCreatorIntent(candidate = {}, { explicitUserAction = false, now = () => Date.now() } = {}) {
  if (explicitUserAction !== true) return Object.freeze({ ok: false, reason: 'explicit-user-action-required' });
  const mediaKind = clean(candidate.mediaKind, 24).toLowerCase();
  const rail = clean(candidate.rail, 48).toLowerCase();
  const uiMode = normalizeCreatorUiMode(candidate.uiMode);
  const goal = clean(candidate.goal, 12_000);
  if (!MEDIA_SET.has(mediaKind)) return Object.freeze({ ok: false, reason: 'media-kind-required' });
  if (!RAIL_SET.has(rail)) return Object.freeze({ ok: false, reason: 'execution-rail-required' });
  if (!goal) return Object.freeze({ ok: false, reason: 'creator-goal-required' });
  if (SECRET_LIKE_RE.test(goal)) return Object.freeze({ ok: false, reason: 'secret-looking-input-rejected' });
  const timestamp = new Date(Number(now())).toISOString();
  const intent = Object.freeze({
    schema: EON_CREATOR_MODE_SCHEMA,
    intentId: randomId(),
    mediaKind,
    rail,
    uiMode,
    goal,
    savePromptToLibrary: candidate.savePromptToLibrary === true,
    advanced: Object.freeze(uiMode === 'advanced' ? {
      aspectRatio: clean(candidate.aspectRatio || '1:1', 20),
      durationSeconds: mediaKind === 'video' ? Math.min(30, Math.max(1, Number(candidate.durationSeconds || 4))) : 0,
      seed: Number.isSafeInteger(Number(candidate.seed)) ? Number(candidate.seed) : null,
      qualityProfile: clean(candidate.qualityProfile || 'balanced', 32)
    } : {
      aspectRatio: mediaKind === 'video' ? '16:9' : '1:1',
      durationSeconds: mediaKind === 'video' ? 4 : 0,
      seed: null,
      qualityProfile: 'safe-default'
    }),
    executionStarted: false,
    providerRequestCreated: false,
    createdAt: timestamp,
    updatedAt: timestamp
  });
  return Object.freeze({ ok: true, intent });
}

export function getCreatorRailContinuation(intent = {}) {
  const rail = String(intent.rail || 'guide');
  if (rail === 'local-runtime') return Object.freeze({ label: 'Open Local AI', href: `/local-ai?creator=${encodeURIComponent(intent.mediaKind || 'image')}`, executionOwner: 'owner-started-loopback-runtime' });
  if (rail === 'direct-user-owned-byok') return Object.freeze({ label: 'Review Direct BYOK', href: `/create?mode=${encodeURIComponent(intent.mediaKind || 'image')}#direct-byok`, executionOwner: 'signed-owner-companion' });
  return Object.freeze({ label: 'Ask EONBOT for guidance', href: '/?new=1', executionOwner: 'guide-only-no-generation' });
}

export function getCreatorModeTruth() {
  return Object.freeze({
    schema: EON_CREATOR_MODE_SCHEMA,
    oneCreateSurface: true,
    beginnerDefault: true,
    advancedControlsExplicit: true,
    localDirectGuideRailsOnly: true,
    draftCreationStartsGeneration: false,
    secretsAcceptedInGoal: false,
    hiddenCloudFallback: false
  });
}
