/**
 * W388A.3 — short-lived, browser-session handoff from an explicit EONBOT CTA
 * into local EON Share tools. The handoff never auto-runs from message text.
 */

export const EON_SHARE_INTENT_SCHEMA = 'eonapp.share-intent.w388a3.v1';
export const EON_SHARE_INTENT_SESSION_KEY = 'eon:share-intent:w388a3:v1';
const MAX_TEXT = 720;
const MAX_TITLE = 120;
const MAX_AGE_MS = 20 * 60 * 1000;
const SECRET_LIKE = /(?:\b(?:api[-_ ]?key|secret|token|password|passphrase|seed phrase|private key)\b\s*[:=]|\b(?:sk|gsk|AIza|sk-or-v1|sk-ant|csk|tgp_v1|nvapi|cfut|hf|fw)_[A-Za-z0-9_-]{16,}\b|\bsk-[A-Za-z0-9_-]{18,}\b)/i;

const freeze = (value) => Object.freeze(value);

function clean(value = '', limit = MAX_TEXT) {
  const text = [...String(value ?? '')].filter((character) => { const code = character.charCodeAt(0); return code >= 32 && code !== 127; }).join('').replace(/\s+/g, ' ').trim().slice(0, limit);
  if (SECRET_LIKE.test(text)) throw new Error('This request looks like it contains a secret. Remove secrets before creating a Share Pack or Remix Card.');
  return text;
}

function titleFrom(text = '') {
  const stripped = clean(text, MAX_TEXT)
    .replace(/^(?:please\s+)?(?:make|turn|help\s+make|help\s+turn)\s+(?:this|it|my\s+(?:creation|video|image|project|post))\s+(?:into\s+)?(?:more\s+)?(?:shareable|a\s+share\s+pack|a\s+remix\s+card)[:\s-]*/i, '')
    .replace(/^(?:make|turn)\s+(?:this|it)\s+shareable[:\s-]*/i, '')
    .trim();
  const sentence = stripped.split(/[.!?]/)[0].trim();
  return (sentence || 'Shareable creator draft').slice(0, MAX_TITLE);
}

export function buildEonShareIntentFromChat(input = '') {
  const sourceText = clean(input, MAX_TEXT);
  if (!sourceText) return freeze({ accepted: false, reason: 'empty-input' });
  const wantsRemix = /\b(remix|collab(?:orate|oration)?|template|starter)\b/i.test(sourceText);
  const title = titleFrom(sourceText);
  return freeze({
    schema: EON_SHARE_INTENT_SCHEMA,
    accepted: true,
    origin: 'chat',
    createdAt: Date.now(),
    expiresAt: Date.now() + MAX_AGE_MS,
    title,
    usefulOutcome: `Turn this into a clear, useful creator outcome: ${sourceText}`.slice(0, MAX_TEXT),
    firstRemixStep: wantsRemix
      ? 'Choose one part to change for your own audience, style, or use case before you publish anything.'
      : 'Review the goal, audience, and CTA, then choose one version you would be comfortable sharing manually.',
    wantsRemix,
    limitations: freeze([
      'This is a short-lived local browser-session draft created only after a visible CTA tap.',
      'It does not include attachments, private chat history, API keys, files, media, account data, referral code, or platform credentials.',
      'It does not publish, create a social connection, schedule, track reach, or award a referral.'
    ])
  });
}

function validIntent(value = {}) {
  return value?.schema === EON_SHARE_INTENT_SCHEMA
    && value?.accepted === true
    && Number.isFinite(Number(value?.createdAt))
    && Number.isFinite(Number(value?.expiresAt))
    && Number(value.expiresAt) > Date.now()
    && typeof value?.title === 'string'
    && typeof value?.usefulOutcome === 'string'
    && typeof value?.firstRemixStep === 'string';
}

export function writeEonShareIntent(intent = {}) {
  if (!validIntent(intent)) return freeze({ ok: false, reason: 'invalid-or-expired-intent' });
  const safe = {
    schema: EON_SHARE_INTENT_SCHEMA,
    accepted: true,
    origin: 'chat',
    createdAt: Number(intent.createdAt),
    expiresAt: Number(intent.expiresAt),
    title: clean(intent.title, MAX_TITLE),
    usefulOutcome: clean(intent.usefulOutcome, MAX_TEXT),
    firstRemixStep: clean(intent.firstRemixStep, MAX_TEXT),
    wantsRemix: intent.wantsRemix === true
  };
  try {
    globalThis.sessionStorage?.setItem(EON_SHARE_INTENT_SESSION_KEY, JSON.stringify(safe));
    return freeze({ ok: true, intent: freeze({ ...safe }) });
  } catch {
    return freeze({ ok: false, reason: 'browser-session-storage-unavailable' });
  }
}

export function readEonShareIntent() {
  try {
    const parsed = JSON.parse(globalThis.sessionStorage?.getItem(EON_SHARE_INTENT_SESSION_KEY) || 'null');
    if (!validIntent(parsed)) {
      globalThis.sessionStorage?.removeItem(EON_SHARE_INTENT_SESSION_KEY);
      return null;
    }
    return freeze({
      schema: EON_SHARE_INTENT_SCHEMA,
      accepted: true,
      origin: 'chat',
      createdAt: Number(parsed.createdAt),
      expiresAt: Number(parsed.expiresAt),
      title: clean(parsed.title, MAX_TITLE),
      usefulOutcome: clean(parsed.usefulOutcome, MAX_TEXT),
      firstRemixStep: clean(parsed.firstRemixStep, MAX_TEXT),
      wantsRemix: parsed.wantsRemix === true
    });
  } catch {
    return null;
  }
}

export function clearEonShareIntent() {
  try { globalThis.sessionStorage?.removeItem(EON_SHARE_INTENT_SESSION_KEY); return freeze({ ok: true }); }
  catch { return freeze({ ok: false, reason: 'browser-session-storage-unavailable' }); }
}

export function getEonShareIntentTruth() {
  return freeze({
    schema: EON_SHARE_INTENT_SCHEMA,
    explicitCtaRequired: true,
    sessionStorageOnly: true,
    maxAgeMs: MAX_AGE_MS,
    attachmentTransfer: false,
    privateChatTransfer: false,
    providerCredentials: false,
    accountData: false,
    socialConnection: false,
    directPublishing: false,
    tracking: false,
    referralReward: false
  });
}
