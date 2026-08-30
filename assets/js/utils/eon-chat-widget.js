/**
 * eon-chat-widget.js — Universal Floating AI Chat Widget
 *
 * Floats on all pages as a bottom-right button.
 * • Local guide only: explains the canonical Chat, Workspace, Vault and City surfaces
 * • Never accepts a provider key, runs a model request, schedules work, or executes an action
 * • Keeps secret entry and direct provider calls inside the dedicated, user-reviewed surfaces
 * • Uses only safe guidance and explicit deep links to canonical product routes
 *
 * Drop-in: <script type="module" src="/assets/js/utils/eon-chat-widget.js"></script>
 * No dependencies on the page. Self-contained.
 */

import { initAppLanguage, translateForUser, getCurrentLanguage, detectLikelyLanguageFromText, getPreferredLanguage, resolveChatLanguage, setChatLanguagePreference } from './app-language.js';
import { resolveSpeechLocale, buildRecognitionLocaleCandidates, applySpeechVoice } from './speech-locale.js';
import { CANONICAL_AI_SETUP_PATH } from './ai-readiness.js';
import { getProfile } from './profile.js';

const WIDGET_CSS_URL = '/assets/css/eon-chat-widget.css';
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

// WIDGET_CSS previously injected inline (CSP-blocked). Now loaded via <link> from WIDGET_CSS_URL.

const WIDGET_POS_KEY = 'eon:widget:pos:v1';
const WIDGET_AUTO_OPEN_KEY = 'eon:widget:auto-opened:v2';
const WIDGET_LANG_PROMPT_KEY = 'eon:widget:lang-prompted:v1';
const WIDGET_VOICE_KEY = 'eon:widget:voice-enabled:v1';

function _looksLikeProviderSecret(/** @type {any} */ text) {
  const value = String(text || '');
  return /(sk-(?:or-v1-)?[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{16,}|gsk_[A-Za-z0-9_-]{16,}|sk-ant-[A-Za-z0-9_-]{16,}|nvapi-[A-Za-z0-9_-]{16,})/.test(value);
}

function _safeGet(/** @type {any} */ key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function _safeParse(/** @type {any} */ key, /** @type {any} */ fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function _escHtml(/** @type {any} */ value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _getUserAlias() {
  try {
    const profile = /** @type {any} */ (getProfile()) || /** @type {any} */ ({});
    return profile.alias || profile.name || null;
  } catch {
    return null;
  }
}

function _getSpeechLocaleForLang(/** @type {any} */ lang) {
  return resolveSpeechLocale({
    appLanguage: String(lang || ''),
    preferredLanguage: String(getPreferredLanguage() || ''),
    browserLocales: Array.isArray(navigator.languages) ? navigator.languages : []
  });
}

async function _getMicrophonePermissionState() {
  try {
    const permissions = navigator.permissions;
    if (!permissions || typeof permissions.query !== 'function') return 'unsupported';
    const result = await permissions.query({ name: 'microphone' });
    return String(result?.state || 'unknown');
  } catch {
    return 'unknown';
  }
}

async function _ensureMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) return { ok: false, reason: 'GET_USER_MEDIA_UNSUPPORTED' };
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((/** @type {any} */ track) => track.stop());
    return { ok: true, reason: 'OK' };
  } catch (/** @type {any} */ error) {
    const message = String(error?.name || error?.message || '').toUpperCase();
    if (message.includes('NOTALLOWED')) return { ok: false, reason: 'MIC_PERMISSION_DENIED' };
    if (message.includes('NOTFOUND')) return { ok: false, reason: 'MIC_DEVICE_NOT_FOUND' };
    if (message.includes('NOTREADABLE')) return { ok: false, reason: 'MIC_DEVICE_BUSY' };
    return { ok: false, reason: 'MIC_ACCESS_FAILED' };
  }
}

function _pageContext() {
  const path = (window.location.pathname || '/').toLowerCase();
  if (path.includes('/workspace')) {
    return {
      pageKey: 'workspace',
      intro: 'Workspace holds your local drafts, reviews, exports, and Creator Suite briefs.',
      next: ['Create a local draft', 'Review it', 'Export only when you choose'],
      quick: ['Open EONBOT Chat', 'Review my work', 'Creator Suite help']
    };
  }
  if (path.includes('/eoncity')) {
    return {
      pageKey: 'city',
      intro: 'EON City mirrors safe foreground work states and returns you to the native review surface.',
      next: ['Open a project', 'Review the local task', 'Return to Workspace'],
      quick: ['Open Workspace', 'What does City show?', 'Privacy boundary']
    };
  }
  if (path.includes('/vault')) {
    return {
      pageKey: 'vault',
      intro: 'Vault helps you keep local provider settings and encrypted recovery material under your control.',
      next: ['Review local settings', 'Create a protected backup', 'Keep provider secrets out of chat'],
      quick: ['Provider setup', 'Backup help', 'Privacy boundary']
    };
  }
  if (path.includes('/chat')) {
    return {
      pageKey: 'chat',
      intro: 'EONBOT Chat is the canonical place to choose a provider, create a bounded foreground task, and open its review.',
      next: ['Choose your own provider', 'Create a task', 'Review before export'],
      quick: ['Provider setup', 'Open Workspace', 'Use microphone now']
    };
  }
  return {
    pageKey: 'home',
    intro: 'Welcome to EONAPP: a local-first AI Outcome Studio with EONBOT Chat, Workspace review, and EON City work mirrors.',
    next: ['Choose a goal', 'Prepare a local task', 'Review and export'],
    quick: ['Open EONBOT Chat', 'Open Workspace', 'Privacy boundary']
  };
}

function _shouldAutoSpeak() {
  const saved = _safeGet(WIDGET_VOICE_KEY);
  if (saved === null) return true;
  return saved === '1';
}

function _speakText(/** @type {any} */ text) {
  if (!('speechSynthesis' in window)) return;
  if (!_shouldAutoSpeak()) return;
  if (!navigator.userActivation?.isActive) return;
  const content = String(text || '').trim();
  if (!content) return;
  const utterance = new window.SpeechSynthesisUtterance(content.replace(/\*\*/g, ''));
  const locale = _getSpeechLocaleForLang(getCurrentLanguage());
  applySpeechVoice(utterance, locale);
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {}
}

// ─── Guide responses ────────────────────────────────────────────────────────

const /** @type {any} */
GUIDE_REPLIES = [
  { patterns: ['hello','hi','hey','yo','start','begin'], reply: 'I am EONBOT, the local-first guide. I can help you plan a task, choose your own AI provider, review work in Workspace, and understand what City shows. I do not accept secrets, publish, schedule, spend, or run work after the browser closes.', quick: ['Open EONBOT Chat','Open Workspace','Privacy boundary'] },
  { patterns: ['workbench','mission','task','build','agent','workflow','run'], reply: 'Use EONBOT Chat to create a bounded foreground task. Workspace holds the draft and review. The task pauses when the browser closes; you choose any export or manual submission yourself.', link: {label:'Open EONBOT Chat →', url:'/chat'}, quick: ['Open Workspace','What can EONBOT do?','City status'] },
  { patterns: ['provider','api key','model','local ai','ollama','lm studio','openrouter','gemini','groq','anthropic','openai'], reply: 'EONAPP is provider-neutral. Choose a local runtime or a direct provider connection in the dedicated setup surface. Models are selected explicitly and EONAPP does not silently switch providers. Never paste an API key into a chat message.', link: {label:'Open provider setup →', url:CANONICAL_AI_SETUP_PATH}, quick: ['Open EONBOT Chat','Local runtime help','Privacy boundary'] },
  { patterns: ['vault','backup','recover','privacy','secret','key'], reply: 'Vault and local backup tools keep supported data on your device. Use the dedicated provider setup and encrypted backup surfaces for sensitive material. This guide does not read, store, or forward API keys, seed phrases, passwords, or card details.', link: {label:'Open Vault →', url:'/vault'}, quick: ['Create backup','Provider setup','Device privacy'] },
  { patterns: ['nft','collect','token','eonlite','pool point','loot','reward','wallet','crypto','airdrop'], reply: 'No token, wallet transfer, NFT sale, lootbox reward, EONLite claim, Pool Point conversion, or payout is active in this release. Market and City visuals are local previews only. Do not send funds or credentials expecting access or rewards.', link: {label:'Read current product status →', url:'/legal'}, quick: ['Open Workspace','Current boundaries','Privacy boundary'] },
  { patterns: ['referral','invite','share link','refer'], reply: 'Invite links may be used only for non-financial beta access or local sharing. No referral payout, token allocation, reward points, or “earn by inviting” program is active.', link: {label:'Read current product status →', url:'/billing'}, quick: ['Open Workspace','Current boundaries','Privacy boundary'] },
  { patterns: ['hustle','side hustle','business template','make money','freelance','monetize','business idea','income idea'], reply: 'EONAPP can help prepare a private strategy, campaign, brand, or build brief in Workspace. It does not promise income, run a marketplace, provide financial advice, or operate an agency on your behalf.', link: {label:'Open Workspace →', url:'/workspace'}, quick: ['Strategy Studio help','Campaign Studio help','Export a brief'] },
  { patterns: ['ai wallet','ai spend','ai payment','ai decision','card','checkout','subscription','buy'], reply: 'No checkout, payment rail, wallet action, subscription activation, or AI financial approval is active in this release. Never enter card data, wallet secrets, or payment evidence into EONBOT.', link: {label:'Billing status →', url:'/billing'}, quick: ['Current boundaries','Open Workspace','Privacy boundary'] },
  { patterns: ['onboard','setup','start fresh','first time','new user','get started'], reply: 'Start by choosing a local runtime or direct provider in the dedicated setup screen, then create a foreground task in EONBOT Chat and review it in Workspace. Provider use is always your explicit choice.', link: {label:'Open provider setup →', url:CANONICAL_AI_SETUP_PATH}, quick: ['Open EONBOT Chat','Open Workspace','Device readiness'] },
  { patterns: ['signal','market','research','stock','analysis','trade'], reply: 'Use research outputs as drafts, not financial advice. EONAPP can help structure questions, citations, and an exportable review package, but it does not execute trades, hold assets, or make investment promises.', link: {label:'Open EONBOT Chat →', url:'/chat'}, quick: ['Open Workspace','Research boundary','Privacy boundary'] },
  { patterns: ['realm','land','district','city'], reply: 'EON City is a visual mirror of safe local work states. It does not own land, run a second agent system, host wallet actions, or create earnings. Review and export decisions stay in Workspace.', link: {label:'Open EON City →', url:'/eoncity'}, quick: ['Open Workspace','What does City show?','Privacy boundary'] },
  { patterns: ['creator','studio','post','content','schedule','template','music','audio','video','subtitle'], reply: 'Creator Suite 2 lives in Workspace. It prepares briefs, scripts, assets, and export packages locally. It does not claim a generation, upload, schedule, or publish occurred unless you personally use a configured provider or manual submission flow.', link: {label:'Open Workspace →', url:'/workspace'}, quick: ['Build Studio','Content Studio','Export a brief'] },
  { patterns: ['browser mode','source research','account attachment','publish'], reply: 'EONAPP does not attach browser sessions, read cookies, capture passwords, or publish to connected accounts. Use a manual export or official destination only after reviewing your work.', link: {label:'Open Workspace →', url:'/workspace'}, quick: ['Manual export','Review a task','Privacy boundary'] },
  { patterns: ['bounty','board','approve','submission'], reply: 'There are no active bounties, paid submissions, rewards, or payout programs. Use Workspace review to prepare a local deliverable you control.', link: {label:'Open Workspace →', url:'/workspace'}, quick: ['Review my work','Export a brief','Current boundaries'] },
  { patterns: ['offline','no internet','works offline','pwa'], reply: 'Local drafts, review records, and selected device tools can remain available offline. Direct AI providers require the connection they specify, and no background work continues after you close the app.', quick: ['Open Workspace','Device readiness','Privacy boundary'] },
  { patterns: ['help','what can you do','guide','explain','how','confused'], reply: 'I can guide you to EONBOT Chat, local provider setup, Workspace review, encrypted backup, safe exports, and EON City status. I cannot accept secrets, use an account, spend money, publish, schedule, or promise earnings.', quick: ['Open EONBOT Chat','Open Workspace','Open Vault'] }
];

function _guideReply(/** @type {any} */ input) {
  const lower = input.toLowerCase();
  for (const /** @type {any} */
def of GUIDE_REPLIES) {
    if (def.patterns.some((/** @type {any} */ p) => lower.includes(p))) {
      return def;
    }
  }
  return {
    reply: 'I can guide you to provider setup, EONBOT Chat, Workspace review, Vault backup, and EON City status. I cannot accept secrets, create rewards, use wallets, publish, schedule, or promise earnings.',
    link: { label: 'Open EONBOT Chat →', url: '/chat' },
    quick: ['Open EONBOT Chat', 'Open Workspace', 'Privacy boundary']
  };
}

// ─── Widget ─────────────────────────────────────────────────────────────────

let _panelOpen = false;
let _aiMode    = false;
/** @type {any[]} */
const /** @type {any} */
_messages  = [];
let _busy      = false;
let _ignoreNextToggle = false;
/** @type {any} */
let _widgetRecognition = null;
let /** @type {any} */
_widgetRecognitionLocales = ['en-US'];
let _widgetRecognitionLocaleIndex = 0;

function _formatProviderStatus() {
  return {
    aiMode: false,
    text: 'Guide only · Full EONBOT Chat owns direct model requests',
    readiness: {
      ready: false,
      primaryUrl: '/chat'
    }
  };
}

async function _translate(/** @type {any} */ text, /** @type {any} */ category = 'guide') {
  return translateForUser(text, { fromLang: 'en', toLang: resolveChatLanguage(), category });
}

async function _translateList(/** @type {any} */ items = [], /** @type {any} */ category = 'guide') {
  const list = Array.isArray(items) ? items : [];
  return Promise.all(list.map((/** @type {any} */ item) => _translate(item, category)));
}

function _mapMultilingualIntentKeyword(/** @type {any} */ text) {
  const source = String(text || '');
  if (!source) return null;
  const /** @type {any} */
  checks = [
    { keyword: 'privacy backup vault', re: /(privacidad|confidencial|sauvegarde|vie privée|datenschutz|sicherung|プライバシー|バックアップ|गोपनीयता|बैकअप|خصوصية|نسخة احتياطية)/i },
    { keyword: 'workspace review', re: /(workspace|review|revisión|révision|überprüfung|レビュー|कार्यस्थान|समीक्षा|مراجعة)/i },
    { keyword: 'provider model setup', re: /(provider|model|modelo|modèle|modell|モデル|मॉडल|مزود)/i },
    { keyword: 'city project status', re: /(city|ciudad|ville|stadt|シティ|शहर|مدينة)/i }
  ];
  const found = checks.find((/** @type {any} */ entry) => entry.re.test(source));
  return found ? found.keyword : null;
}

async function _toEnglishForRouting(/** @type {any} */ text) {
  const source = String(text || '').trim();
  if (!source) return '';
  const mapped = _mapMultilingualIntentKeyword(source);
  if (mapped) return mapped;
  const lang = String(resolveChatLanguage() || getCurrentLanguage() || 'en').toLowerCase();
  if (lang === 'en') return source;
  const looksNonLatin = !/^[\p{ASCII}\s.,!?;:'"()\-_/]+$/u.test(source);
  try {
    const translated = await translateForUser(source, { fromLang: lang, toLang: 'en', category: 'guide' });
    const primary = String(translated || source);
    if (looksNonLatin && primary === source) {
      const fallback = await translateForUser(source, { fromLang: 'auto', toLang: 'en', category: 'guide' });
      return String(fallback || primary);
    }
    return primary;
  } catch {
    return source;
  }
}

function _loadWidgetPosition() {
  try {
    const raw = _safeGet(WIDGET_POS_KEY);
    if (!raw) return null;
    const pos = _safeParse(WIDGET_POS_KEY, null);
    if (!pos) return null;
    if (!Number.isFinite(pos?.x) || !Number.isFinite(pos?.y)) return null;
    return { x: Number(pos.x), y: Number(pos.y) };
  } catch {
    return null;
  }
}

function _saveWidgetPosition(/** @type {any} */ pos) {
  try {
    localStorage.setItem(WIDGET_POS_KEY, JSON.stringify(pos));
  } catch {}
}

function _applyWidgetPosition(/** @type {any} */ _btn, /** @type {any} */ _pos) {
  // Disabled to avoid inline-style writes under CSP.
  // Widget stays in the default fixed position.
}

function _initDrag(/** @type {any} */ _btn) {
  // Disabled to avoid inline-style writes under CSP.
}

void _loadWidgetPosition;
void _saveWidgetPosition;
void _applyWidgetPosition;
void _initDrag;

function _mount() {
  if (document.getElementById('eon-widget-btn')) return; // already mounted
  initAppLanguage();

  // Load widget CSS via <link> (CSP-safe — style-src 'self')
  if (!document.querySelector('link[data-ew-css]')) {
    const /** @type {any} */
link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = WIDGET_CSS_URL;
    link.setAttribute('data-ew-css', '1');
    document.head.appendChild(link);
  }

  const alias = _getUserAlias();
  const runtimeStatus = _formatProviderStatus();
  _aiMode = runtimeStatus.aiMode;
  const statusText = runtimeStatus.text;

  // Floating button
  const /** @type {any} */
btn = document.createElement('button');
  btn.id = 'eon-widget-btn';
  btn.setAttribute('aria-label', 'Open AI Chat');
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = `<span aria-hidden="true">⚡</span><span id="eon-widget-badge" aria-hidden="true" hidden></span>`;
  document.body.appendChild(btn);

  // Panel
  const /** @type {any} */
panel = document.createElement('div');
  panel.id = 'eon-widget-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'EONBOT');
  panel.setAttribute('aria-hidden', 'true');
  panel.setAttribute('tabindex', '-1');
  panel.inert = true;
  panel.innerHTML = `
    <div class="ew-header">
      <div class="ew-avatar" aria-hidden="true">⚡</div>
      <div class="ew-header-info">
        <span class="ew-title">EONBOT AI</span>
        <span class="ew-sub">
          <span class="ew-status-dot${_aiMode ? ' ai' : ''}"></span>
          ${_escHtml(statusText)}
        </span>
      </div>
      <button class="ew-close" aria-label="Close chat" id="ew-close-btn">✕</button>
    </div>
    <div class="ew-messages" id="ew-messages" aria-live="polite" aria-atomic="false"></div>
    <div class="ew-action-trail" id="ew-action-trail" aria-live="polite"></div>
    <div class="ew-input-row">
      <input id="ew-input" type="text" placeholder="Message EONBOT…" autocomplete="off" maxlength="500" />
      <button class="ew-mic" id="ew-mic" aria-label="Use microphone input">🎤</button>
      <button class="ew-send" id="ew-send" aria-label="Send message">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
      </button>
    </div>
    <div class="ew-setup-bar">Provider setup stays outside the guide · <a href="${CANONICAL_AI_SETUP_PATH}">Open setup →</a></div>
  `;
  document.body.appendChild(panel);
  void _localizeWidgetChrome();
  document.addEventListener('language-changed', () => {
    void _localizeWidgetChrome();
    const next = String(getCurrentLanguage() || 'en').toLowerCase();
    const current = String(resolveChatLanguage() || 'en').toLowerCase();
    if (!_panelOpen || !next || next === current) return;
    const prompted = _safeParse(WIDGET_LANG_PROMPT_KEY, {});
    if (prompted?.[next]) return;
    prompted[next] = Date.now();
    try { localStorage.setItem(WIDGET_LANG_PROMPT_KEY, JSON.stringify(prompted)); } catch {}
    void (async () => {
      await _addBotMessage(await _translate(`The app is now in ${next.toUpperCase()}. Should I switch the chat to this language too?`), {
        actions: [
          { id: 'switch-language', lang: next, label: `Switch to ${next.toUpperCase()}` },
          { id: 'keep-language', label: 'Keep current language' }
        ]
      });
    })();
  });

  // Event listeners
  btn.addEventListener('click', _toggle);
  document.getElementById('ew-close-btn')?.addEventListener('click', _toggle);
  document.getElementById('ew-send')?.addEventListener('click', _send);
  document.getElementById('ew-mic')?.addEventListener('click', _toggleMic);
  document.getElementById('ew-input')?.addEventListener('keydown', (/** @type {any} */ e) => {
    if (e.key === 'Enter') _send();
  });

  window.addEventListener('eonbot:ask', (/** @type {any} */ event) => {
    const prompt = String(event?.detail?.prompt || '').trim();
    if (!prompt) return;
    if (!_panelOpen) _toggle();
    const input = /** @type {HTMLInputElement|null} */ (document.getElementById('ew-input'));
    if (input) {
      input.value = prompt;
      input.focus();
    }
  });

  // Initial greeting
  void (async () => {
    const context = _pageContext();
    const greeting = `Hey${alias ? ` ${_escHtml(alias)}` : ''}! I'm EONBOT, a local guide for the canonical Chat, Workspace, Vault, and City surfaces.`;
    await _addBotMessage(await _translate(greeting), { quick: ['Open EONBOT Chat','Open Workspace','Privacy boundary'] });
    const nextPlan = `${context.intro}\nNext: ${(context.next || []).join(' -> ')}.`;
    await _addBotMessage(await _translate(nextPlan), { quick: context.quick });
    await _setActionTrail(['Ready', 'Local guide active', 'No execution path']);

    const hasMic = await _checkMicrophoneAvailability();
    if (hasMic) {
      await _addBotMessage(await _translate('Microphone detected. Tap 🎤 and speak in your language. I will listen and guide you live.'), {
        quick: ['Use microphone now', 'Language help']
      });
    }
  })();

  // Auto-open once per page for new users to increase engagement
  const context = _pageContext();
  const autoKey = `${context.pageKey}:${getCurrentLanguage()}`;
  const openedMap = _safeParse(WIDGET_AUTO_OPEN_KEY, {});
  const isNewUser = !_getUserAlias();
  if (isNewUser && !openedMap[autoKey]) {
    setTimeout(() => {
      if (!_panelOpen) _toggle();
      openedMap[autoKey] = Date.now();
      try { localStorage.setItem(WIDGET_AUTO_OPEN_KEY, JSON.stringify(openedMap)); } catch {}
    }, 1300);
  }

  // Heartbeat after 8 seconds if panel not opened
  setTimeout(() => {
    if (!_panelOpen) {
      btn.classList.add('heartbeat');
      btn.addEventListener('animationend', () => btn.classList.remove('heartbeat'), { once: true });
    }
  }, 8000);
}

function _toggle() {
  if (_ignoreNextToggle) {
    _ignoreNextToggle = false;
    return;
  }
  _panelOpen = !_panelOpen;
  const /** @type {any} */
panel = document.getElementById('eon-widget-panel');
  const /** @type {any} */
btn   = document.getElementById('eon-widget-btn');
  if (!panel || !btn) return;

  panel.classList.toggle('open', _panelOpen);
  panel.setAttribute('aria-hidden', String(!_panelOpen));
  panel.inert = !_panelOpen;
  btn.setAttribute('aria-expanded', String(_panelOpen));

  if (_panelOpen) {
    btn.innerHTML = `<span aria-hidden="true">✕</span>`;
    setTimeout(() => document.getElementById('ew-input')?.focus(), 150);
    // Clear notification badge
    const /** @type {any} */
badge = document.getElementById('eon-widget-badge');
    if (badge) badge.hidden = true;
  } else {
    btn.innerHTML = `<span aria-hidden="true">⚡</span><span id="eon-widget-badge" aria-hidden="true" hidden></span>`;
  }
}

async function _localizeWidgetChrome() {
  const input = /** @type {HTMLInputElement|null} */ (document.getElementById('ew-input'));
  const /** @type {any} */
closeBtn = document.getElementById('ew-close-btn');
  const /** @type {any} */
micBtn = document.getElementById('ew-mic');
  const /** @type {any} */
sendBtn = document.getElementById('ew-send');

  if (input) input.placeholder = await _translate('Message EONBOT…');
  if (closeBtn) closeBtn.setAttribute('aria-label', await _translate('Close chat'));
  if (micBtn) micBtn.setAttribute('aria-label', await _translate('Use microphone input'));
  if (sendBtn) sendBtn.setAttribute('aria-label', await _translate('Send message'));

  const /** @type {any} */
setupBar = document.querySelector('.ew-setup-bar');
  const /** @type {any} */
setupLink = setupBar?.querySelector('a');
  if (setupBar && setupLink) {
    setupBar.firstChild && (setupBar.firstChild.textContent = `${await _translate('Provider setup stays in the dedicated surface')} · `);
    setupLink.textContent = await _translate('Open setup →');
  }
}

function _refreshRuntimeHeader() {
  const runtimeStatus = _formatProviderStatus();
  _aiMode = runtimeStatus.aiMode;
  const /** @type {any} */
sub = document.querySelector('.ew-sub');
  if (sub) {
    sub.innerHTML = `<span class="ew-status-dot${_aiMode ? ' ai' : ''}"></span>${_escHtml(runtimeStatus.text)}`;
  }
  if (_aiMode) document.querySelector('.ew-setup-bar')?.remove();
}

async function _setActionTrail(/** @type {any[]} */ steps = []) {
  const /** @type {any} */
trail = document.getElementById('ew-action-trail');
  if (!trail) return;
  const list = Array.isArray(steps) ? steps.filter(Boolean).slice(0, 4) : [];
  if (!list.length) {
    trail.innerHTML = '';
    return;
  }
  const localized = await _translateList(list, 'guide');
  trail.innerHTML = '';
  localized.forEach((/** @type {any} */ step, /** @type {any} */ idx) => {
    const /** @type {any} */
chip = document.createElement('span');
    chip.className = 'ew-trail-chip';
    chip.textContent = String(step || '');
    if (idx === localized.length - 1) chip.classList.add('is-current');
    trail.appendChild(chip);
  });
}

async function _addBotMessage(/** @type {any} */ text, /** @type {any} */ opts = {}) {
  const /** @type {any} */
msgs = document.getElementById('ew-messages');
  if (!msgs) return;

  // Message bubble
  const /** @type {any} */
msg = document.createElement('div');
  msg.className = 'ew-msg bot';
  // Convert **bold** markdown and \n to <br>
  const htmlText = _escHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  msg.innerHTML = htmlText;
  msgs.appendChild(msg);
  _speakText(text);

  // CTA link
  if (opts.link) {
    const /** @type {any} */
cta = document.createElement('div');
    cta.className = 'ew-cta';
    const isExternal = opts.link.url.startsWith('http');
    const localizedLabel = await _translate(opts.link.label, 'guide');
    if (isExternal) {
      cta.innerHTML = `<a href="${_escHtml(opts.link.url)}" target="_blank" rel="noopener noreferrer">${_escHtml(localizedLabel)}</a>`;
    } else {
      cta.innerHTML = `<a href="${_escHtml(opts.link.url)}">${_escHtml(localizedLabel)}</a>`;
    }
    msgs.appendChild(cta);
  }

  // Action CTA
  if (opts.action) {
    const /** @type {any} */
cta = document.createElement('div');
    cta.className = 'ew-cta';
    const localizedLabel = await _translate(opts.action.label, 'guide');
    cta.innerHTML = `<button data-action="${_escHtml(opts.action.id)}">${_escHtml(localizedLabel)}</button>`;
    cta.querySelector('button')?.addEventListener('click', () => {
      if (opts.action.id === 'copyInvite') {
        void (async () => {
          try {
            const profile = /** @type {any} */ (getProfile() || {});
            const { generateInviteLink } = await import('./referral-par.js');
            const url = await generateInviteLink({ ...profile, id: profile.id || profile.uid || 'local-user' }, {
              source: 'eon-chat-widget',
              destination: window.location.pathname || '/'
            });
            await navigator.clipboard.writeText(url);
            await _addBotMessage('Signed invite link copied ✅');
          } catch {
            await _addBotMessage('I could not create the signed invite link on this device.');
          }
        })();
      }
    });
    msgs.appendChild(cta);
  }

  if (opts.actions?.length) {
    const /** @type {any} */
actionWrap = document.createElement('div');
    actionWrap.className = 'ew-cta';
    for (const /** @type {any} */
action of opts.actions) {
      const /** @type {any} */
btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = await _translate(action.label || action.id || 'Action', 'guide');
      btn.addEventListener('click', () => {
        const id = String(action.id || '').trim();
        if (!id) return;
        if (id === 'switch-language' && action.lang) {
          const lang = String(action.lang).toLowerCase();
          try {
            localStorage.setItem('eon:lang:preference:v1', lang);
            localStorage.setItem('eon:lang:v1', lang);
          } catch {}
          setChatLanguagePreference(lang);
          document.dispatchEvent(new CustomEvent('eon:set-language', { detail: { lang } }));
          void (async () => {
            await _addBotMessage(await _translate(`Language switched to ${lang.toUpperCase()}. I will guide you in this language now.`));
          })();
          return;
        }
        if (id === 'keep-language') {
          setChatLanguagePreference(resolveChatLanguage());
          void (async () => {
            await _addBotMessage(await _translate('Okay, keeping your current language. You can switch any time from the header picker.'));
          })();
        }
      });
      actionWrap.appendChild(btn);
    }
    msgs.appendChild(actionWrap);
  }

  // Quick replies
  if (opts.quick?.length) {
    const /** @type {any} */
qr = document.createElement('div');
    qr.className = 'ew-quick';
    const localizedQuick = await _translateList(opts.quick, 'guide');
    for (const /** @type {any} */
q of localizedQuick) {
      const /** @type {any} */
qBtn = document.createElement('button');
      qBtn.textContent = q;
      qBtn.addEventListener('click', () => {
        const /** @type {any} */
inp = document.getElementById('ew-input');
        if (inp) (/** @type {HTMLInputElement} */ (inp)).value = q;
        void _send();
      });
      qr.appendChild(qBtn);
    }
    msgs.appendChild(qr);
  }

  msgs.scrollTop = msgs.scrollHeight;
}

function _addUserMessage(/** @type {any} */ text) {
  const /** @type {any} */
msgs = document.getElementById('ew-messages');
  if (!msgs) return;
  const /** @type {any} */
msg = document.createElement('div');
  msg.className = 'ew-msg user';
  msg.textContent = text;
  msgs.appendChild(msg);
  msgs.scrollTop = msgs.scrollHeight;
}

function _showTyping() {
  const /** @type {any} */
msgs = document.getElementById('ew-messages');
  if (!msgs) return null;
  const /** @type {any} */
t = document.createElement('div');
  t.className = 'ew-msg bot ew-typing';
  t.id = 'ew-typing';
  t.innerHTML = '<span></span><span></span><span></span>';
  msgs.appendChild(t);
  msgs.scrollTop = msgs.scrollHeight;
  return t;
}

function _toggleMic() {
  const micBtn = /** @type {HTMLButtonElement|null} */ (document.getElementById('ew-mic'));
  if (!SpeechRecognitionAPI) {
    void (async () => {
      await _addBotMessage(await _translate('Voice input is not supported in this browser.'), { quick: ['Open AI Chat', 'AI Cockpit help'] });
    })();
    return;
  }

  if (_widgetRecognition) {
    try { _widgetRecognition.stop(); } catch {}
    _widgetRecognition = null;
    micBtn?.classList.remove('is-listening');
    micBtn?.setAttribute('aria-pressed', 'false');
    if (micBtn) micBtn.textContent = '🎤';
    return;
  }

  void (async () => {
  const permission = await _getMicrophonePermissionState();
  if (permission === 'denied') {
    await _addBotMessage(await _translate('Microphone permission is blocked in your browser settings. Enable it, then try again.'));
    return;
  }

  const micAccess = await _ensureMicrophoneAccess();
  if (!micAccess.ok && micAccess.reason !== 'GET_USER_MEDIA_UNSUPPORTED') {
    if (micAccess.reason === 'MIC_PERMISSION_DENIED') {
      await _addBotMessage(await _translate('Microphone permission denied. Allow access and retry.'));
    } else if (micAccess.reason === 'MIC_DEVICE_NOT_FOUND') {
      await _addBotMessage(await _translate('No microphone device detected on this system.'));
    } else if (micAccess.reason === 'MIC_DEVICE_BUSY') {
      await _addBotMessage(await _translate('Microphone is currently busy in another app. Close it and retry.'));
    } else {
      await _addBotMessage(await _translate('Could not access microphone. Check permission and device settings.'));
    }
    return;
  }

  const input = /** @type {HTMLInputElement|null} */ (document.getElementById('ew-input'));
  const recognition = new SpeechRecognitionAPI();
  _widgetRecognitionLocales = buildRecognitionLocaleCandidates(
    _getSpeechLocaleForLang(resolveChatLanguage()),
    Array.isArray(navigator.languages) ? navigator.languages : []
  );
  _widgetRecognitionLocaleIndex = 0;
  recognition.lang = _widgetRecognitionLocales[_widgetRecognitionLocaleIndex] || 'en-US';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onstart = () => {
    if (micBtn) {
      micBtn.classList.add('is-listening');
      micBtn.textContent = '🎙️';
      micBtn.setAttribute('aria-pressed', 'true');
    }
  };
  recognition.onresult = (/** @type {any} */ event) => {
    const transcript = String(event?.results?.[0]?.[0]?.transcript || '').trim();
    if (!transcript || !input) return;
    input.value = transcript;
    void _send();
  };
  recognition.onerror = ((/** @type {any} */ event) => {
    const errorCode = String(event?.error || 'unknown');
    const canRetryLocale = _widgetRecognitionLocaleIndex < _widgetRecognitionLocales.length - 1;
    if (canRetryLocale) {
      _widgetRecognitionLocaleIndex += 1;
      recognition.lang = _widgetRecognitionLocales[_widgetRecognitionLocaleIndex];
      void (async () => {
        await _addBotMessage(await _translate(`Voice retry in ${recognition.lang}.`));
      })();
      try {
        recognition.start();
        return;
      } catch {}
    }
    _widgetRecognition = null;
    micBtn?.classList.remove('is-listening');
    micBtn?.setAttribute('aria-pressed', 'false');
    if (micBtn) micBtn.textContent = '🎤';
    void (async () => {
      if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
        await _addBotMessage(await _translate('Microphone permission denied by browser. Enable mic access and retry.'));
      } else if (errorCode === 'audio-capture') {
        await _addBotMessage(await _translate('No working microphone was detected. Check your audio input device.'));
      } else if (errorCode === 'language-not-supported') {
        await _addBotMessage(await _translate('This voice locale is unsupported on your device. Switch language in the header and retry.'));
      } else if (errorCode === 'network') {
        await _addBotMessage(await _translate('Voice recognition requires an internet connection. Check your network and try again.'));
      } else if (errorCode === 'no-speech') {
        await _addBotMessage(await _translate('No speech detected. Tap the mic icon and speak clearly.'));
      } else if (errorCode !== 'aborted') {
        await _addBotMessage(await _translate(`Voice error: ${errorCode}. Try refreshing or using Chrome/Edge for best voice support.`));
      }
    })();
  });
  recognition.onend = () => {
    _widgetRecognition = null;
    micBtn?.classList.remove('is-listening');
    micBtn?.setAttribute('aria-pressed', 'false');
    if (micBtn) micBtn.textContent = '🎤';
  };

  _widgetRecognition = recognition;
  recognition.start();
  })();
}

async function _checkMicrophoneAvailability() {
  if (!navigator.mediaDevices?.enumerateDevices) return false;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some((/** @type {any} */ d) => d.kind === 'audioinput');
  } catch {
    return false;
  }
}

async function _send() {
  if (_busy) return;
  const inp = /** @type {HTMLInputElement} */ (document.getElementById('ew-input'));
  const /** @type {any} */
sendBtn = document.getElementById('ew-send');
  if (!inp) return;
  const text = inp.value.trim();
  if (!text) return;
  const looksLikeSecret = _looksLikeProviderSecret(text);

  const detectedLang = detectLikelyLanguageFromText(text);
  const currentLang = String(resolveChatLanguage() || getCurrentLanguage() || 'en').toLowerCase();
  if (detectedLang && detectedLang !== 'en' && detectedLang !== currentLang) {
    const prompted = _safeParse(WIDGET_LANG_PROMPT_KEY, {});
    if (!prompted[detectedLang]) {
      prompted[detectedLang] = Date.now();
      try { localStorage.setItem(WIDGET_LANG_PROMPT_KEY, JSON.stringify(prompted)); } catch {}
      await _addBotMessage(
        await _translate(`I noticed you are writing in ${detectedLang.toUpperCase()}. Do you want me to switch the app language now?`),
        {
          actions: [
            { id: 'switch-language', lang: detectedLang, label: `Switch to ${detectedLang.toUpperCase()}` },
            { id: 'keep-language', label: 'Keep current language' }
          ]
        }
      );
    }
  }

  inp.value = '';
  if (looksLikeSecret) {
    await _addBotMessage(await _translate('For your safety, this guide does not accept or store provider keys. Remove the key from the message and use the dedicated provider setup surface instead.'), {
      link: { label: 'Open provider setup →', url: CANONICAL_AI_SETUP_PATH },
      quick: ['Open EONBOT Chat', 'Open Vault', 'Privacy boundary']
    });
    return;
  }
  _addUserMessage(text);
  _messages.push({ role: 'user', text });

  _busy = true;
  if (sendBtn) (/** @type {HTMLButtonElement} */ (sendBtn)).disabled = true;
  await _setActionTrail(['Input received', 'Language routing', 'Guide mode selected']);

  const typing = _showTyping();

  try {
    await new Promise((/** @type {any} */ resolve) => setTimeout(resolve, 180));
    typing?.remove();
    const routingText = await _toEnglishForRouting(text);
    const guide = _guideReply(routingText);
    const localized = await _translate(guide.reply, 'guide');
    _messages.push({ role: 'bot', text: localized });
    await _setActionTrail(['Input received', 'Intent routing', 'Guide response', 'No execution']);
    await _addBotMessage(localized, { link: (/** @type {any} */ (guide)).link, action: (/** @type {any} */ (guide)).action, quick: (/** @type {any} */ (guide)).quick });
  } catch (/** @type {any} */
err) {
    typing?.remove();
    const rawMsg = String((/** @type {any} */ (err))?.message || 'Something went wrong');
    await _setActionTrail(['Input received', 'Processing', 'Failed']);
    // Map common provider errors to actionable guidance
    const errReply = rawMsg;
    await _addBotMessage(await _translate(`Guide error: ${errReply}. You can continue in full EONBOT Chat or use Workspace.`), { quick: ['Open EONBOT Chat', 'Open Workspace', 'Privacy boundary'] });
  } finally {
    _busy = false;
    if (sendBtn) (/** @type {HTMLButtonElement} */ (sendBtn)).disabled = false;
    inp.focus();
  }
}

// ─── Notification badge ───────────────────────────────────────────────────────

export function showWidgetNotification(/** @type {any} */ count = 1) {
  const /** @type {any} */
badge = document.getElementById('eon-widget-badge');
  if (!badge || _panelOpen) return;
  badge.textContent = String(count);
  badge.hidden = false;
}

// ─── Auto-inject on load ─────────────────────────────────────────────────────

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _mount);
  } else {
    _mount();
  }
}
