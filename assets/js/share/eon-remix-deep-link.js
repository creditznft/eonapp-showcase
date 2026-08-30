export const EON_REMIX_DEEP_LINK_SCHEMA = 'eonapp.remix-deep-link.v1';
export const EON_REMIX_DEEP_LINK_HASH_PREFIX = '#eon-remix=';
export const EON_REMIX_CANONICAL_ORIGIN = 'https://eonapp.ch';

const freeze = (value) => Object.freeze(value);
const SECRET_LIKE = /(?:\b(?:api[-_ ]?key|secret|token|password|passphrase|private[-_ ]?key|seed(?:\s+phrase)?|mnemonic|recovery)\b\s*[:=]|\b(?:sk|gsk|AIza|sk-or-v1|sk-ant|csk|tgp_v1|nvapi|cfut|hf|fw|ghp|gho)_[A-Za-z0-9_-]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i;
const KIND_TO_MODE = freeze({
  'image-concept': 'image',
  'video-storyboard': 'video',
  'music-track': 'music',
  'dj-set': 'music',
  'radio-station': 'music',
  'forge-starter': 'website'
});
const ALLOWED_KINDS = freeze(Object.keys(KIND_TO_MODE));

function clean(value = '', max = 360) {
  // Sanitization deliberately strips C0 controls from an explicit deep-link payload.
  // eslint-disable-next-line no-control-regex
  const output = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  if (SECRET_LIKE.test(output)) throw new Error('remix-starter-sensitive-value-rejected');
  return output;
}

function normalizeKind(value = '') {
  const kind = String(value || '').trim().toLowerCase();
  if (!ALLOWED_KINDS.includes(kind)) throw new Error('remix-kind-not-deep-linkable');
  return kind;
}

function buildPayload(card = {}) {
  const kind = normalizeKind(card?.kind || card?.card?.kind?.id);
  const title = clean(card?.title || card?.card?.title, 100);
  const usefulOutcome = clean(card?.usefulOutcome || card?.card?.usefulOutcome, 360);
  const firstRemixStep = clean(card?.firstRemixStep || card?.card?.firstRemixStep, 360);
  if (!title || !usefulOutcome || !firstRemixStep) throw new Error('remix-starter-incomplete');
  return freeze({ v: 1, kind, title, usefulOutcome, firstRemixStep });
}

export function buildEonRemixDeepLink(card = {}, options = {}) {
  try {
    const payload = buildPayload(card);
    const mode = KIND_TO_MODE[payload.kind];
    const base = new URL('/create', options.origin || EON_REMIX_CANONICAL_ORIGIN);
    base.searchParams.set('mode', mode);
    const encoded = encodeURIComponent(JSON.stringify(payload));
    if (encoded.length > 2800) return freeze({ ok: false, reason: 'remix-starter-too-large', url: '', mode: '' });
    base.hash = `${EON_REMIX_DEEP_LINK_HASH_PREFIX.slice(1)}${encoded}`;
    return freeze({
      ok: true,
      reason: null,
      url: base.toString(),
      mode,
      kind: payload.kind,
      boundary: freeze({
        publicSafeStarterTextOnly: true,
        urlFragmentOnly: true,
        fragmentIncludedInHttpRequest: false,
        serverStateCreated: false,
        accountRequiredToDecode: false,
        projectTransfer: false,
        mediaTransfer: false,
        credentialTransfer: false,
        trackingIdentifier: false,
        referralReward: false,
        memoryWrite: false,
        providerCalled: false,
        automaticGeneration: false
      })
    });
  } catch (error) {
    return freeze({ ok: false, reason: String(error?.message || 'remix-deep-link-invalid'), url: '', mode: '' });
  }
}

export function parseEonRemixDeepLinkHash(hash = '') {
  const raw = String(hash || '');
  if (!raw.startsWith(EON_REMIX_DEEP_LINK_HASH_PREFIX)) return freeze({ ok: false, reason: 'remix-deep-link-not-found', starter: null });
  try {
    const encoded = raw.slice(EON_REMIX_DEEP_LINK_HASH_PREFIX.length);
    if (!encoded || encoded.length > 2800) throw new Error('remix-starter-size-invalid');
    const parsed = JSON.parse(decodeURIComponent(encoded));
    if (parsed?.v !== 1) throw new Error('remix-starter-version-invalid');
    const payload = buildPayload(parsed);
    return freeze({
      ok: true,
      reason: null,
      starter: freeze({
        schema: EON_REMIX_DEEP_LINK_SCHEMA,
        kind: payload.kind,
        mode: KIND_TO_MODE[payload.kind],
        title: payload.title,
        usefulOutcome: payload.usefulOutcome,
        firstRemixStep: payload.firstRemixStep,
        source: 'public-url-fragment',
        untrustedPublicData: true,
        providerCalled: false,
        automaticGeneration: false,
        memoryWrite: false,
        referralReward: false,
        trackingIdentifier: false
      })
    });
  } catch (error) {
    return freeze({ ok: false, reason: String(error?.message || 'remix-deep-link-invalid'), starter: null });
  }
}

export function consumeEonRemixDeepLinkFromLocation(options = {}) {
  const location = options.location || globalThis.location;
  const history = options.history || globalThis.history;
  const parsed = parseEonRemixDeepLinkHash(location?.hash || '');
  if (!parsed.ok) return parsed;
  try {
    const cleanUrl = `${location.pathname || '/create'}${location.search || ''}`;
    history?.replaceState?.(history.state ?? null, '', cleanUrl);
  } catch { /* privacy cleanup is best effort; starter remains non-executable */ }
  return parsed;
}

export function getEonRemixDeepLinkTruth() {
  return freeze({
    schema: EON_REMIX_DEEP_LINK_SCHEMA,
    canonicalOrigin: EON_REMIX_CANONICAL_ORIGIN,
    deepLinkableKinds: ALLOWED_KINDS,
    publicSafeStarterTextOnly: true,
    urlFragmentOnly: true,
    fragmentIncludedInHttpRequest: false,
    serverStateCreated: false,
    trackingIdentifier: false,
    referralReward: false,
    memoryWrite: false,
    providerCalled: false,
    automaticGeneration: false,
    recipientMustReview: true,
    fragmentRemovedAfterConsumption: true
  });
}

export default freeze({
  EON_REMIX_DEEP_LINK_SCHEMA,
  buildEonRemixDeepLink,
  parseEonRemixDeepLinkHash,
  consumeEonRemixDeepLinkFromLocation,
  getEonRemixDeepLinkTruth
});
