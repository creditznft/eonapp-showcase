/**
 * captcha-assist.js — browser-local anti-bot challenge detection for the Business Cockpit.
 * EONAPP can inspect and explain challenge types, but users complete CAPTCHA/identity checks themselves.
 */

const CAPTCHA_STATE_KEY = 'eon:captcha:assist:v1';
const CAPTCHA_PROVIDER_LABELS = {
  recaptcha: 'reCAPTCHA',
  hcaptcha: 'hCaptcha',
  turnstile: 'Cloudflare Turnstile',
  unknown: 'Unknown'
};
/**
 * @typedef {'recaptcha' | 'hcaptcha' | 'turnstile' | 'unknown'} CaptchaType
 */
/**
 * @typedef {Object} CaptchaState
 * @property {string} [lastDetectedType]
 * @property {string} [lastSolvedAt]
 * @property {number} [lastTaskId]
 * @property {string} [provider]
 * @property {string} [apiKey]
 * @property {boolean} [apiKeyStored]
 * @property {{ type: string, provider: string, solvedAt: string }} [lastSolve]
 */
/**
 * @typedef {Object} CaptchaChallenge
 * @property {CaptchaType} [type]
 * @property {string} [provider]
 * @property {string} [pageUrl]
 * @property {string} [siteKey]
 * @property {boolean} [apiKeyPresent]
 * @property {string} [message]
 * @property {string} [action]
 * @property {string} [cData]
 * @property {string} [chlPageData]
 * @property {number} [detectedAt]
 * @property {Document} [doc]
 */

/**
 * @param {string} s
 * @returns {string}
 */
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * @returns {CaptchaState}
 */
function loadState() {
  try {
    return /** @type {CaptchaState} */ (JSON.parse(localStorage.getItem(CAPTCHA_STATE_KEY) || '{}'));
  } catch {
    return {};
  }
}

/**
 * @param {any} value
 * @returns {CaptchaType}
 */
function normalizeProvider(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'recaptcha' || normalized === 'hcaptcha' || normalized === 'turnstile') {
    return /** @type {CaptchaType} */ (normalized);
  }
  return 'unknown';
}

/**
 * @param {CaptchaState} state
 */
function saveState(state) {
  try { localStorage.setItem(CAPTCHA_STATE_KEY, JSON.stringify(state || {})); } catch {}
}

/**
 * @param {Document} doc
 * @returns {CaptchaType}
 */
function getChallengeType(doc) {
  const html = String(doc?.documentElement?.innerHTML || '').toLowerCase();
  const body = String(doc?.body?.innerHTML || '').toLowerCase();
  const page = `${html}\n${body}`;
  if (page.includes('cf-turnstile') || page.includes('turnstile') || doc?.querySelector?.('[data-sitekey][data-callback*="turnstile"]')) return 'turnstile';
  if (page.includes('hcaptcha') || doc?.querySelector?.('[data-sitekey*="hcaptcha"]') || doc?.querySelector?.('iframe[src*="hcaptcha"]')) return 'hcaptcha';
  if (page.includes('recaptcha') || doc?.querySelector?.('[data-sitekey] iframe[src*="recaptcha"]') || doc?.querySelector?.('iframe[src*="recaptcha"]')) return 'recaptcha';
  return 'unknown';
}

/**
 * @param {Document} doc
 * @param {CaptchaType} type
 * @returns {string}
 */
function getSiteKey(doc, type) {
  /** @type {Record<CaptchaType | 'unknown', string[]>} */
  const selectors = {
    recaptcha: ['[data-sitekey]', '.g-recaptcha', 'iframe[src*="recaptcha"]'],
    hcaptcha: ['[data-sitekey]', '.h-captcha', 'iframe[src*="hcaptcha"]'],
    turnstile: ['[data-sitekey]', '.cf-turnstile', 'iframe[src*="turnstile"]'],
    unknown: []
  };
  for (const sel of selectors[type || 'unknown'] || []) {
    const node = doc.querySelector(sel);
    if (!node) continue;
    const fromAttr = String(node.getAttribute?.('data-sitekey') || node.getAttribute?.('sitekey') || '').trim();
    if (fromAttr) return fromAttr;
    const src = String(node.getAttribute?.('src') || '').trim();
    try {
      const url = new URL(src, window.location.href);
      const key = url.searchParams.get('k') || url.searchParams.get('sitekey') || url.searchParams.get('data-sitekey');
      if (key) return key;
    } catch {}
  }
  return '';
}

/**
 * @param {CaptchaChallenge} challenge
 * @returns {string}
 */
function getCaptchaSummary(challenge) {
  if (!challenge?.type || challenge.type === 'unknown') {
    return 'No active anti-bot challenge detected on the current browser-local page.';
  }
  const providerKey = normalizeProvider(challenge.provider || challenge.type);
  const provider = CAPTCHA_PROVIDER_LABELS[providerKey] || challenge.provider || providerKey;
  const keyState = challenge.apiKeyPresent ? 'solver key ready' : 'solver key missing';
  return `${challenge.type.toUpperCase()} detected · ${provider} · ${keyState}`;
}

/**
 * @param {Document} [doc]
 * @returns {CaptchaChallenge & { ok: boolean, pageUrl: string }}
 */
function detectCaptchaChallengeFromDoc(doc = document) {
  const type = getChallengeType(doc);
  const state = loadState();
  const provider = normalizeProvider(state.lastDetectedType || type);
  if (type === 'unknown') {
    return {
      ok: false,
      type: 'unknown',
      provider,
      pageUrl: String(window.location.href),
      message: 'No anti-bot challenge detected on this page.',
      apiKeyPresent: Boolean(state.apiKey || state.apiKeyStored),
      detectedAt: Date.now()
    };
  }
  return {
    ok: true,
    type,
    provider,
    pageUrl: String(window.location.href),
    siteKey: getSiteKey(doc, type),
    apiKeyPresent: Boolean(state.apiKey || state.apiKeyStored),
    detectedAt: Date.now()
  };
}

/**
 * @param {Partial<CaptchaState>} [partial]
 * @returns {CaptchaState}
 */
function writeSolverSettings(partial = {}) {
  const next = { ...loadState(), ...partial };
  saveState(next);
  return next;
}

/**
 * @param {Document} doc
 * @param {CaptchaChallenge} challenge
 * @param {string} token
 */
function _injectToken(doc, challenge, token) {
  /** @type {Record<CaptchaType | 'unknown', string[]>} */
  const selectors = {
    recaptcha: ['textarea[name="g-recaptcha-response"]', 'textarea#g-recaptcha-response', 'input[name="g-recaptcha-response"]'],
    hcaptcha: ['textarea[name="h-captcha-response"]', 'textarea[name="hcaptcha-response"]', 'input[name="h-captcha-response"]'],
    turnstile: ['textarea[name="cf-turnstile-response"]', 'input[name="cf-turnstile-response"]', 'textarea[name="g-recaptcha-response"]'],
    unknown: []
  };
  const list = selectors[challenge?.type || 'unknown'] || [];
  let found = false;
  for (const selector of list) {
    const el = doc.querySelector(selector);
    if (!el) continue;
    el.value = String(token || '');
    el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    found = true;
  }
  if (!found) {
    const hidden = doc.createElement('textarea');
    hidden.name = challenge?.type === 'turnstile' ? 'cf-turnstile-response' : 'g-recaptcha-response';
    hidden.style.display = 'none';
    hidden.value = String(token || '');
    doc.body?.appendChild(hidden);
    found = true;
  }
  try {
    const state = loadState();
    state.lastSolve = {
      type: challenge?.type || 'unknown',
      provider: challenge?.provider || '',
      solvedAt: new Date().toISOString()
    };
    saveState(state);
  } catch {}
  return found;
}

/**
 * @param {CaptchaChallenge} [_challenge]
 */
async function solveCaptchaChallenge(/** @type {CaptchaChallenge} */ _challenge = {}) {
  throw new Error('Automatic CAPTCHA solving has been removed. Review the challenge yourself and continue manually.');
}

function renderCaptchaSummary(target = document.getElementById('browser-captcha-status'), summary = detectCaptchaChallengeFromDoc()) {
  if (!target) return summary;
  const state = loadState();
  const providerKey = normalizeProvider(summary?.provider || state.lastDetectedType || summary?.type || 'unknown');
  const providerLabel = CAPTCHA_PROVIDER_LABELS[providerKey] || providerKey;
  const keyLabel = state.apiKeyStored ? 'Solver key stored' : 'Solver key not stored';
  const challengeLabel = summary?.ok ? `${String(summary.type || 'unknown').toUpperCase()} detected` : 'No active CAPTCHA';
  target.innerHTML = `${esc(challengeLabel)} · ${esc(providerLabel)} · ${esc(keyLabel)}${state.lastSolvedAt ? ` · Last solved ${new Date(state.lastSolvedAt).toLocaleString()}` : ''}`;
  return summary;
}

export {
  detectCaptchaChallengeFromDoc,
  getCaptchaSummary,
  renderCaptchaSummary,
  solveCaptchaChallenge,
  writeSolverSettings
};

try {
  window.EONCaptchaAssist = {
    detectCaptchaChallengeFromDoc,
    getCaptchaSummary,
    renderCaptchaSummary,
    solveCaptchaChallenge,
    writeSolverSettings
  };
} catch {}
