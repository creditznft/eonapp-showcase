/**
 * W624J — review-first Sharing Center.
 *
 * This module prepares public-safe share manifests. It never opens a route,
 * copies data, invokes navigator.share, posts to a platform, tracks a share,
 * grants a referral reward, or transfers collaboration access. The caller may
 * execute one reviewed platform action only after `finalize` returns a bounded
 * payload.
 */
import { createSignedShareLink, normalizeDestination } from '../utils/signed-share-link.js';
import { getEonCollaborationInviteTruth } from './eon-collaboration-invites.js';

export const EON_SHARING_CENTER_SCHEMA = 'eonapp.sharing-center.w624j.v1';
export const EON_SHARING_MANIFEST_SCHEMA = 'eonapp.sharing-manifest.w624j.v1';
export const EON_SHARING_CENTER_FAMILIES = Object.freeze([
  Object.freeze({ id: 'project-milestone', label: 'Project milestone card', route: '/projects', authority: 'selected-local-milestone' }),
  Object.freeze({ id: 'sanitized-preview', label: 'Sanitized preview', route: '/projects', authority: 'user-reviewed-public-fields' }),
  Object.freeze({ id: 'signed-invite', label: 'Signed public invite', route: '/eoncity', authority: 'local-p256-signed-link' }),
  Object.freeze({ id: 'collaboration-invite', label: 'Collaboration invitation', route: '/workspace', authority: 'verified-collaboration-delivery' }),
  Object.freeze({ id: 'city-postcard', label: 'City postcard', route: '/eoncity', authority: 'public-safe-city-output' }),
  Object.freeze({ id: 'platform-fallback', label: 'Plain share / copy / download', route: '/eoncity', authority: 'browser-user-action' })
]);
export const EON_SHARING_CENTER_ACTIONS = Object.freeze(['native-share', 'copy', 'download']);
export const EON_SHARING_CENTER_EXCLUSIONS = Object.freeze([
  'chat history and prompts',
  'Vault data and provider keys',
  'attachments and private files',
  'hidden project fields and account identifiers',
  'payment, billing, referral and reward state',
  'raw job inputs, logs and responses'
]);

const FAMILY_BY_ID = new Map(EON_SHARING_CENTER_FAMILIES.map((entry) => [entry.id, entry]));
const ACTION_SET = new Set(EON_SHARING_CENTER_ACTIONS);
const FORBIDDEN_KEY_RE = /(?:chat|prompt|vault|provider.?key|api.?key|secret|credential|token|cookie|attachment|private.?file|hidden|account|email|payment|billing|referral|reward|raw|response|job.?input|job.?log)/i;
const SECRET_TEXT_RE = /(sk-[a-z0-9_-]{18,}|AIza[\w-]{20,}|gsk_[a-z0-9_-]{16,}|sk-ant-[a-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:password|api\s*key|access\s*token|session\s*cookie|seed phrase|recovery phrase|mnemonic)\b)/i;
const SAFE_TEXT_RE = /^[\p{L}\p{N}][\p{L}\p{N}\s.,'’!?&()/_:+\-#@]{0,719}$/u;
const MAX_MANIFESTS = 12;
const freeze = (value) => Object.freeze(value);

function cleanText(value = '', fallback = '', max = 720) {
  const text = String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
  if (!text || SECRET_TEXT_RE.test(text) || !SAFE_TEXT_RE.test(text)) return fallback;
  return text;
}

function hasForbiddenFields(value, seen = new Set()) {
  if (!value || typeof value !== 'object') return false;
  if (seen.has(value)) return false;
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEY_RE.test(key)) return true;
    if (typeof child === 'string' && SECRET_TEXT_RE.test(child)) return true;
    if (child && typeof child === 'object' && hasForbiddenFields(child, seen)) return true;
  }
  return false;
}

function safePublicUrl(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw, globalThis.location?.origin || 'https://eonapp.ch');
    if (!['https:', 'http:'].includes(url.protocol)) return '';
    if (url.username || url.password) return '';
    for (const key of url.searchParams.keys()) if (FORBIDDEN_KEY_RE.test(key)) return '';
    return url.toString();
  } catch { return ''; }
}

function manifestId(now = Date.now()) {
  const random = globalThis.crypto?.getRandomValues ? [...globalThis.crypto.getRandomValues(new Uint8Array(8))].map((value) => value.toString(16).padStart(2, '0')).join('') : Math.random().toString(36).slice(2, 18);
  return `eonshare_${Math.floor(Number(now) || Date.now()).toString(36)}_${random}`;
}

function publicManifest(manifest) {
  return freeze({
    schema: EON_SHARING_MANIFEST_SCHEMA,
    manifestId: manifest.manifestId,
    family: manifest.family,
    familyLabel: manifest.familyLabel,
    state: manifest.state,
    title: manifest.title,
    summary: manifest.summary,
    publicUrl: manifest.publicUrl,
    destination: manifest.destination,
    sourceRoute: manifest.sourceRoute,
    authority: manifest.authority,
    authorityAvailable: manifest.authorityAvailable,
    authorityReason: manifest.authorityReason,
    included: manifest.included,
    excluded: EON_SHARING_CENTER_EXCLUSIONS,
    actions: manifest.actions,
    reviewedAt: manifest.reviewedAt || '',
    createdAt: manifest.createdAt,
    trackingCreated: false,
    autoPosted: false,
    autoInvited: false,
    autoCopied: false,
    referralMutation: false,
    rewardMutation: false,
    privateContentIncluded: false
  });
}

function buildManifest(input = {}, now = Date.now(), collaborationTruth = getEonCollaborationInviteTruth()) {
  if (hasForbiddenFields(input)) return freeze({ ok: false, reason: 'private-or-sensitive-fields-rejected' });
  const family = FAMILY_BY_ID.get(String(input.family || '').trim());
  if (!family) return freeze({ ok: false, reason: 'unsupported-share-family' });
  const title = cleanText(input.title, family.label, 120);
  const summary = cleanText(input.summary, family.id === 'signed-invite' ? 'Explore EON City through this public signed invitation.' : 'A public-safe EONAPP milestone prepared for review.', 720);
  const publicUrl = safePublicUrl(input.publicUrl);
  let destination = family.route;
  try { destination = normalizeDestination(input.destination || family.route); } catch { return freeze({ ok: false, reason: 'unsafe-destination' }); }
  let authorityAvailable = true;
  let authorityReason = 'available-after-explicit-review';
  if (family.id === 'collaboration-invite') {
    authorityAvailable = collaborationTruth?.deliveryEnabled === true && collaborationTruth?.acceptanceEnabled === true && collaborationTruth?.recipientIdentityVerification === true;
    authorityReason = authorityAvailable ? 'verified-collaboration-authority-available' : 'collaboration-delivery-not-released';
  }
  if (family.id === 'sanitized-preview' && !publicUrl) {
    authorityAvailable = false;
    authorityReason = 'reviewed-public-preview-url-required';
  }
  const included = freeze([
    freeze({ field: 'title', value: title }),
    freeze({ field: 'summary', value: summary }),
    ...(publicUrl ? [freeze({ field: 'publicUrl', value: publicUrl })] : []),
    freeze({ field: 'family', value: family.label })
  ]);
  const manifest = freeze({
    manifestId: manifestId(now),
    family: family.id,
    familyLabel: family.label,
    state: 'prepared',
    title,
    summary,
    publicUrl,
    destination,
    sourceRoute: family.route,
    authority: family.authority,
    authorityAvailable,
    authorityReason,
    included,
    actions: EON_SHARING_CENTER_ACTIONS,
    createdAt: new Date(now).toISOString(),
    reviewedAt: ''
  });
  return freeze({ ok: true, manifest: publicManifest(manifest), internal: manifest });
}

export function validateEonSharingManifest(manifest = {}) {
  const checks = [
    manifest?.schema === EON_SHARING_MANIFEST_SCHEMA,
    /^eonshare_[a-z0-9_]+$/i.test(String(manifest?.manifestId || '')),
    FAMILY_BY_ID.has(manifest?.family),
    ['prepared', 'reviewed', 'finalized'].includes(manifest?.state),
    Array.isArray(manifest?.included),
    Array.isArray(manifest?.excluded) && EON_SHARING_CENTER_EXCLUSIONS.every((entry) => manifest.excluded.includes(entry)),
    manifest?.privateContentIncluded === false,
    manifest?.trackingCreated === false,
    manifest?.autoPosted === false,
    manifest?.autoInvited === false,
    manifest?.autoCopied === false,
    manifest?.referralMutation === false,
    manifest?.rewardMutation === false,
    !hasForbiddenFields(manifest?.included || [])
  ];
  return freeze({ ok: checks.every(Boolean), checks: freeze(checks) });
}

export function createEonSharingCenterController({ now = () => Date.now(), signer = createSignedShareLink, collaborationTruth = getEonCollaborationInviteTruth } = {}) {
  const manifests = new Map();
  let selectedId = '';
  let disposed = false;
  const snapshot = () => freeze({
    schema: EON_SHARING_CENTER_SCHEMA,
    families: EON_SHARING_CENTER_FAMILIES,
    manifests: freeze([...manifests.values()].slice(-MAX_MANIFESTS).reverse().map(publicManifest)),
    selectedId,
    collaborationAuthority: collaborationTruth(),
    trackingEnabled: false,
    referralProgrammeSeparate: true,
    disposed
  });
  return freeze({
    getSnapshot: snapshot,
    prepare(input = {}, { explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'controller-disposed' });
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const result = buildManifest(input, now(), collaborationTruth());
      if (!result.ok) return result;
      manifests.set(result.internal.manifestId, result.internal);
      selectedId = result.internal.manifestId;
      return freeze({ ok: true, manifest: publicManifest(result.internal), snapshot: snapshot(), networkRequestCreated: false, externalActionStarted: false });
    },
    review(manifestId = '', { explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'controller-disposed' });
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-review-required' });
      const current = manifests.get(String(manifestId));
      if (!current) return freeze({ ok: false, reason: 'manifest-not-found' });
      const reviewed = freeze({ ...current, state: 'reviewed', reviewedAt: new Date(now()).toISOString() });
      manifests.set(reviewed.manifestId, reviewed);
      selectedId = reviewed.manifestId;
      return freeze({ ok: true, manifest: publicManifest(reviewed), networkRequestCreated: false, externalActionStarted: false });
    },
    async finalize(manifestId = '', action = '', { explicitUserAction = false } = {}) {
      if (disposed) return freeze({ ok: false, reason: 'controller-disposed' });
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-final-action-required' });
      if (!ACTION_SET.has(action)) return freeze({ ok: false, reason: 'unsupported-final-action' });
      const current = manifests.get(String(manifestId));
      if (!current) return freeze({ ok: false, reason: 'manifest-not-found' });
      if (current.state !== 'reviewed') return freeze({ ok: false, reason: 'manifest-review-required' });
      if (!current.authorityAvailable) return freeze({ ok: false, reason: current.authorityReason, manifest: publicManifest(current) });
      let link = current.publicUrl;
      let signing = null;
      if (current.family === 'signed-invite') {
        try {
          signing = await signer({ destination: current.destination, source: 'share-center', linkKind: 'referral' });
          link = String(signing?.canonicalLink || signing?.link || '');
          if (!link) return freeze({ ok: false, reason: 'signed-link-unavailable' });
        } catch { return freeze({ ok: false, reason: 'signed-link-unavailable' }); }
      }
      const finalized = freeze({ ...current, state: 'finalized' });
      manifests.set(finalized.manifestId, finalized);
      const payload = freeze({ title: finalized.title, text: finalized.summary, url: link, combinedText: [finalized.title, finalized.summary, link].filter(Boolean).join('\n\n'), filename: `${finalized.family}-${finalized.manifestId}.txt` });
      return freeze({ ok: true, action, manifest: publicManifest(finalized), payload, signedLinkCreated: Boolean(signing), networkRequestCreated: false, externalActionStarted: false, trackingCreated: false });
    },
    dismiss(manifestId = '', { explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, reason: 'explicit-user-action-required' });
      const deleted = manifests.delete(String(manifestId));
      if (selectedId === manifestId) selectedId = '';
      return freeze({ ok: deleted, reason: deleted ? 'dismissed' : 'manifest-not-found', networkRequestCreated: false });
    },
    dispose() { disposed = true; manifests.clear(); selectedId = ''; return freeze({ disposed: true }); }
  });
}
