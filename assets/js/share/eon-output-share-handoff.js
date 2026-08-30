/**
 * Share-2 — completed-output handoff for local Share Pack and Remix Card drafts.
 *
 * This carries only a short, public-safe text summary through browser session
 * storage after an explicit button press. It never transfers source files,
 * media, private chat, credentials, accounts, links, publish state or tracking.
 */

export const EON_OUTPUT_SHARE_HANDOFF_SCHEMA = 'eonapp.output-share-handoff.share2.v1';
export const EON_OUTPUT_SHARE_HANDOFF_SESSION_KEY = 'eon:share:output-handoff:v1';
export const EON_OUTPUT_SHARE_HANDOFF_MAX_AGE_MS = 20 * 60 * 1000;

const freeze = (value) => Object.freeze(value);
const ALLOWED_ORIGINS = new Set(['creator-draft', 'creator-music', 'forge-project', 'city-expedition']);
const ALLOWED_KINDS = new Set(['campaign-brief', 'content-series', 'image-concept', 'forge-starter', 'video-storyboard', 'music-track', 'dj-set', 'radio-station', 'city-postcard']);
const SECRET_LIKE = /(?:\b(?:api[-_ ]?key|secret|token|password|passphrase|private[-_ ]?key|seed(?:\s+phrase)?|mnemonic|recovery)\b\s*[:=]|\b(?:sk|gsk|AIza|sk-or-v1|sk-ant|csk|tgp_v1|nvapi|cfut|hf|fw|ghp|gho)_[A-Za-z0-9_-]{12,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/i;
const MAX_TITLE = 120;
const MAX_AUDIENCE = 240;
const MAX_TEXT = 720;

function clean(value = '', limit = MAX_TEXT) {
  const output = Array.from(String(value ?? ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code < 32 || code === 127 ? ' ' : character;
  }).join('').replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, limit);
  if (SECRET_LIKE.test(output)) throw new Error('Remove credentials, private links, recovery material, or other secret-like text before preparing a Share or Remix starter.');
  return output;
}

function normalizeOrigin(value = '') {
  const origin = String(value || '').trim();
  if (!ALLOWED_ORIGINS.has(origin)) throw new Error('Only a local Creator draft or Forge project can start this handoff.');
  return origin;
}

function normalizeKind(value = '') {
  const kind = String(value || '').trim();
  return ALLOWED_KINDS.has(kind) ? kind : 'campaign-brief';
}

function sourceLabel(origin = '') {
  if (origin === 'forge-project') return 'EON Forge project';
  if (origin === 'city-expedition') return 'EON City Signal Expedition';
  if (origin === 'creator-music') return 'EON Music';
  return 'Creator Suite draft';
}

function nowMs(value = Date.now()) {
  const number = Number(value);
  return Number.isFinite(number) ? number : Date.now();
}

function validHandoff(value = {}, now = Date.now()) {
  if (!value || value.schema !== EON_OUTPUT_SHARE_HANDOFF_SCHEMA || !ALLOWED_ORIGINS.has(value.origin)) return false;
  const createdAt = Number(value.createdAt);
  const expiresAt = Number(value.expiresAt);
  if (!Number.isFinite(createdAt) || !Number.isFinite(expiresAt) || expiresAt < nowMs(now) || expiresAt - createdAt > EON_OUTPUT_SHARE_HANDOFF_MAX_AGE_MS) return false;
  try {
    return Boolean(clean(value.title, MAX_TITLE) && clean(value.usefulOutcome, MAX_TEXT) && clean(value.firstRemixStep, MAX_TEXT));
  } catch { return false; }
}

export function createEonOutputShareHandoff(input = {}, { now = Date.now() } = {}) {
  if (input?.explicitUserAction !== true) throw new Error('Preparing a Share or Remix starter requires a visible user action.');
  const origin = normalizeOrigin(input?.origin);
  const title = clean(input?.title, MAX_TITLE);
  const audience = clean(input?.audience, MAX_AUDIENCE);
  const usefulOutcome = clean(input?.usefulOutcome, MAX_TEXT);
  const firstRemixStep = clean(input?.firstRemixStep, MAX_TEXT);
  if (!title) throw new Error('Give the completed output a clear title first.');
  if (!usefulOutcome) throw new Error('Describe the useful public-safe outcome before sharing it.');
  if (!firstRemixStep) throw new Error('Add one safe first remix step before sharing it.');
  const createdAt = nowMs(now);
  return freeze({
    schema: EON_OUTPUT_SHARE_HANDOFF_SCHEMA,
    origin,
    sourceLabel: sourceLabel(origin),
    createdAt,
    expiresAt: createdAt + EON_OUTPUT_SHARE_HANDOFF_MAX_AGE_MS,
    title,
    audience,
    usefulOutcome,
    firstRemixStep,
    remixKind: normalizeKind(input?.remixKind),
    boundary: freeze({
      explicitUserAction: true,
      browserSessionOnly: true,
      sourceFiles: false,
      mediaBodies: false,
      privateChat: false,
      credentials: false,
      publicLinkIncluded: false,
      accounts: false,
      directPublishing: false,
      socialConnection: false,
      tracking: false,
      referralReward: false
    })
  });
}

export function writeEonOutputShareHandoff(input = {}, options = {}) {
  try {
    const handoff = createEonOutputShareHandoff(input, options);
    const storage = globalThis.sessionStorage;
    if (!storage?.setItem) throw new Error('browser-session-storage-unavailable');
    storage.setItem(EON_OUTPUT_SHARE_HANDOFF_SESSION_KEY, JSON.stringify(handoff));
    return freeze({ ok: true, handoff });
  } catch (error) {
    return freeze({ ok: false, reason: String(error?.message || 'browser-session-storage-unavailable') });
  }
}

export function readEonOutputShareHandoff({ now = Date.now() } = {}) {
  try {
    const parsed = JSON.parse(globalThis.sessionStorage?.getItem(EON_OUTPUT_SHARE_HANDOFF_SESSION_KEY) || 'null');
    if (!validHandoff(parsed, now)) {
      globalThis.sessionStorage?.removeItem(EON_OUTPUT_SHARE_HANDOFF_SESSION_KEY);
      return null;
    }
    return freeze({
      schema: EON_OUTPUT_SHARE_HANDOFF_SCHEMA,
      origin: normalizeOrigin(parsed.origin),
      sourceLabel: sourceLabel(parsed.origin),
      createdAt: Number(parsed.createdAt),
      expiresAt: Number(parsed.expiresAt),
      title: clean(parsed.title, MAX_TITLE),
      audience: clean(parsed.audience, MAX_AUDIENCE),
      usefulOutcome: clean(parsed.usefulOutcome, MAX_TEXT),
      firstRemixStep: clean(parsed.firstRemixStep, MAX_TEXT),
      remixKind: normalizeKind(parsed.remixKind),
      boundary: createEonOutputShareHandoff({ ...parsed, explicitUserAction: true }, { now: Number(parsed.createdAt) }).boundary
    });
  } catch { return null; }
}

export function clearEonOutputShareHandoff() {
  try { globalThis.sessionStorage?.removeItem(EON_OUTPUT_SHARE_HANDOFF_SESSION_KEY); return freeze({ ok: true }); }
  catch { return freeze({ ok: false, reason: 'browser-session-storage-unavailable' }); }
}

export function getEonOutputShareHandoffTruth() {
  return freeze({
    schema: EON_OUTPUT_SHARE_HANDOFF_SCHEMA,
    explicitUserActionRequired: true,
    browserSessionOnly: true,
    sourceFiles: false,
    mediaBodies: false,
    privateChat: false,
    credentials: false,
    publicLinkIncluded: false,
    accounts: false,
    directPublishing: false,
    socialConnection: false,
    tracking: false,
    referralReward: false,
    supportedRemixKinds: freeze([...ALLOWED_KINDS]),
    externalRemixProof: false
  });
}
