/**
 * W658H — Quick EONBOT work surface inside EON City.
 *
 * This module reuses the canonical Chat AI runtime after an explicit Send action
 * and the same session-only active Chat thread as the main EONBOT page. Browser
 * dictation and speech synthesis are explicit user actions. Route plans remain
 * prepared actions: the destination opens only from a separate visible link.
 */
import { createAIReply, loadAISettings } from '../chat/ai-runtime.js';
import { buildEonbotCommandHubPlan } from '../chat/eonbot-command-hub.js';
import { sanitizeChatInput } from '../chat/chat-page-session-state.js';
import {
  createEonCityVoiceConsentController,
  getEonCityVoiceCapability,
  getEonCityVoiceLanguageOptions,
  speakEonCityCaption,
  stopEonCityCaption
} from './eon-city-voice-consent.js';
import { createEonLiveVoiceController, getEonLiveVoiceCapability } from '../chat/eon-live-voice-realtime.js';
import {
  authorizeVoiceInput,
  buildVoiceConversationReview,
  clearVoiceConversationConsent,
  grantVoiceConversationConsent
} from '../chat/eon-voice-session-authority.js';
import {
  getVoiceLanguageBase,
  getVoiceLanguageOption,
  readVoiceLanguagePreference,
  saveVoiceLanguagePreference
} from '../chat/voice-language-preferences.js';
import { resolveChatLanguage, setChatLanguagePreference } from '../utils/app-language.js';
import { getChatThreadQuery, resolveChatThread, updateChatThreadMessages } from '../utils/chat-threads.js';
import { dispatchEonCityW659gVerifiedAction } from './w659g/eon-city-w659g-progression-ledger.js';
import { resolveEonbotCapabilityMode } from '../chat/eonbot-capability-registry.js';

export const EON_CITY_EONBOT_QUICK_WORK_SCHEMA = 'eon.city.eonbot.quick-work.w659g.v2';
const MAX_CITY_INPUT_CHARS = 1200;
const MAX_HISTORY_MESSAGES = 10;
const CHAT_HANDOFF_KEY = 'eon:chat:pending-composer-prompt:v1';

const CREDENTIAL_PATTERNS = Object.freeze([
  /\bsk-[a-z0-9_-]{20,}\b/i,
  /\bwhsec[_-][a-z0-9_./+=-]{16,}\b/i,
  /\bAIza[a-z0-9_-]{20,}\b/i,
  /\bBearer\s+[a-z0-9._~+/-]{20,}\b/i,
  /\b(?:api[_ -]?key|secret|token)\s*[:=]\s*[^\s]{12,}/i
]);

function escapeHtml(value = '') {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function containsCredentialShape(value = '') {
  return CREDENTIAL_PATTERNS.some((pattern) => pattern.test(String(value || '')));
}

function normalizeInput(value = '') {
  return sanitizeChatInput(value).slice(0, MAX_CITY_INPUT_CHARS);
}

function localeOptionsMarkup(selected = 'auto') {
  return getEonCityVoiceLanguageOptions()
    .map((option) => `<option value="${escapeHtml(option.value)}"${option.value === selected ? ' selected' : ''}>${escapeHtml(option.label)}</option>`)
    .join('');
}

export function renderEonCityEonbotQuickWorkMarkup() {
  const capability = getEonCityVoiceCapability();
  const liveCapability = getEonLiveVoiceCapability();
  const savedVoiceLocale = readVoiceLanguagePreference();
  return `
    <section class="eon-city-eonbot-quick" data-eon-city-eonbot-quick data-schema="${EON_CITY_EONBOT_QUICK_WORK_SCHEMA}">
      <div class="eon-city-eonbot-quick-head">
        <div><p class="eon-play-kicker">Quick EONBOT · City work bridge</p><h2 id="eon-play-eonbot-title">Talk, plan, and continue real work</h2></div>
        <span data-eon-city-eonbot-runtime-state>Checking saved AI setup…</span>
      </div>
      <p class="eon-city-eonbot-truth">Send uses the same Local/Connected AI setup and active session thread as EONBOT Chat. Route requests remain review-first and nothing runs in the background.</p>
      <div class="eon-city-eonbot-thread" data-eon-city-eonbot-thread aria-live="polite" aria-label="Quick EONBOT conversation">
        <article data-role="assistant"><strong>EONBOT</strong><p>Loading your active EONBOT thread…</p></article>
      </div>
      <label class="eon-city-eonbot-composer-label">Message EONBOT
        <textarea data-eon-city-eonbot-input maxlength="${MAX_CITY_INPUT_CHARS}" rows="3" autocomplete="off" placeholder="Ask a question, plan work, open a district, create something, or prepare a share…"></textarea>
      </label>
      <div class="eon-city-eonbot-quick-replies" aria-label="Quick prompts">
        <button type="button" data-eon-city-eonbot-prompt="Help me continue useful work">Continue useful work</button>
        <a href="/projects" data-eon-city-eonbot-direct-route="projects">Open Projects</a>
        <button type="button" data-eon-city-eonbot-prompt="Help me create an app">Create with EONBOT</button>
        <button type="button" data-eon-city-eonbot-prompt="Show sharing and EONKEY rewards">Share &amp; EONKEYS</button>
      </div>
      <div class="eon-city-eonbot-actions">
        <button type="button" class="eon-play-primary" data-eon-city-eonbot-send>Send</button>
        <button type="button" data-eon-city-eonbot-mic-check${capability.microphoneCheckAvailable ? '' : ' disabled'}>Enable microphone</button>
        <button type="button" data-eon-city-eonbot-dictate${capability.dictationAvailable ? '' : ' disabled'}>Dictate</button>
        <button type="button" data-eon-city-eonbot-conversation${capability.dictationAvailable && capability.speechSynthesisSupported ? '' : ' disabled'}>Voice Conversation</button>
        <button type="button" data-eon-city-eonbot-live${liveCapability.ready ? '' : ' disabled'} title="${escapeHtml(liveCapability.reason)}">Live Voice</button>
        <button type="button" data-eon-city-eonbot-stop-dictation disabled>Stop voice</button>
        <label>Voice language<select data-eon-city-eonbot-locale>${localeOptionsMarkup(savedVoiceLocale)}</select></label>
        <button type="button" data-eon-city-eonbot-speak-reply${capability.speechSynthesisSupported ? '' : ' disabled'}>Speak reply</button>
        <button type="button" data-eon-city-eonbot-stop-speech${capability.speechSynthesisSupported ? '' : ' disabled'}>Stop voice</button>
      </div>
      <div class="eon-city-eonbot-handoff" data-eon-city-eonbot-handoff>
        <a href="/" data-eon-city-eonbot-open-chat>Open full EONBOT Chat</a>
        <a href="/local-ai#eonbot-local-ai-setup">Make Local AI ready</a>
        <a href="/vault#ai-provider-settings">Connected AI setup</a>
      </div>
      <dialog class="eon-voice-review-dialog" data-eon-city-voice-review aria-labelledby="eon-city-voice-review-title">
        <header><div><small>Browser-assisted voice</small><h3 id="eon-city-voice-review-title">Voice Conversation (Beta)</h3></div><button type="button" data-eon-city-voice-review-cancel aria-label="Cancel Voice Conversation">×</button></header>
        <p><strong>Current route:</strong> <span data-eon-city-voice-review-route>Checking…</span></p>
        <p data-eon-city-voice-review-privacy>Browser speech support varies by device.</p>
        <label><input type="checkbox" data-eon-city-voice-review-ack /> I understand that final spoken turns send automatically and the microphone can restart for the next turn until I tap Stop.</label>
        <p>Use <strong>Dictate</strong> instead if you want speech converted to editable text without automatic sending.</p>
        <div class="eon-work-panel-actions"><button type="button" data-eon-city-voice-review-cancel>Cancel</button><button type="button" class="is-primary" data-eon-city-voice-review-start disabled>Start Voice Conversation</button></div>
      </dialog>
      <p class="eon-city-eonbot-status" data-eon-city-eonbot-status>${escapeHtml(capability.reason)} Live Voice: ${escapeHtml(liveCapability.reason)}</p>
    </section>`;
}

function makeMessage(documentLike, role, text, meta = '') {
  const article = documentLike.createElement('article');
  article.dataset.role = role;
  const heading = documentLike.createElement('strong');
  heading.textContent = role === 'user' ? 'You' : 'EONBOT';
  const body = documentLike.createElement('p');
  body.textContent = String(text || '');
  article.append(heading, body);
  if (meta) {
    const small = documentLike.createElement('small');
    small.textContent = String(meta || '');
    article.appendChild(small);
  }
  return article;
}

function renderPreparedRoute(documentLike, plan) {
  const wrap = documentLike.createElement('div');
  wrap.className = 'eon-city-eonbot-prepared-route';
  const route = plan?.toolCTA?.url || plan?.proposal?.route || '';
  if (!route) return wrap;
  const link = documentLike.createElement('a');
  link.href = route;
  link.dataset.eonCityEonbotPreparedRoute = plan.commandId || 'destination';
  link.textContent = plan?.toolCTA?.label || plan?.proposal?.reviewLabel || 'Review destination';
  wrap.appendChild(link);
  return wrap;
}

export function resolveEonCityPreparedRoute(route = '') {
  const value = String(route || '').trim();
  const creator = value.match(/^\/create(?:\?mode=(image|video|music))?(?:[&#].*)?$/i);
  if (creator) return Object.freeze({ ok: true, stationId: 'create-forge', surface: 'create', creatorMode: String(creator[1] || 'image').toLowerCase(), staysInCity: true });
  if (/^\/projects(?:[?#]|$)/i.test(value)) return Object.freeze({ ok: true, stationId: 'project-atlas', surface: 'projects', creatorMode: '', staysInCity: true });
  if (/^\/library(?:[?#]|$)/i.test(value)) return Object.freeze({ ok: true, stationId: 'library-vault', surface: 'library', creatorMode: '', staysInCity: true });
  if (/^\/automations(?:[?#]|$)/i.test(value)) return Object.freeze({ ok: true, stationId: 'automation-theatre', surface: 'automations', creatorMode: '', staysInCity: true });
  if (/^\/local-ai(?:[?#]|$)/i.test(value)) return Object.freeze({ ok: true, stationId: 'local-ai-lab', surface: 'local-ai', creatorMode: '', staysInCity: true });
  if (/^\/(?:workspace#eon-share|profile#eon-profile-share-center)(?:$|[?&])/i.test(value)) return Object.freeze({ ok: true, stationId: 'share-capture', surface: 'share', creatorMode: '', staysInCity: true });
  return Object.freeze({ ok: false, stationId: '', surface: '', creatorMode: '', staysInCity: false });
}

export function bindEonCityEonbotQuickWork(root, {
  getRuntime = () => null,
  onStatus = () => {},
  onLeaveCity = () => {}
} = {}) {
  const section = root?.querySelector?.('[data-eon-city-eonbot-quick]');
  if (!section) return () => {};
  const input = section.querySelector('[data-eon-city-eonbot-input]');
  const thread = section.querySelector('[data-eon-city-eonbot-thread]');
  const send = section.querySelector('[data-eon-city-eonbot-send]');
  const status = section.querySelector('[data-eon-city-eonbot-status]');
  const runtimeState = section.querySelector('[data-eon-city-eonbot-runtime-state]');
  const locale = section.querySelector('[data-eon-city-eonbot-locale]');
  const micCheck = section.querySelector('[data-eon-city-eonbot-mic-check]');
  const dictate = section.querySelector('[data-eon-city-eonbot-dictate]');
  const conversation = section.querySelector('[data-eon-city-eonbot-conversation]');
  const liveVoice = section.querySelector('[data-eon-city-eonbot-live]');
  const stopDictation = section.querySelector('[data-eon-city-eonbot-stop-dictation]');
  const speakReply = section.querySelector('[data-eon-city-eonbot-speak-reply]');
  const stopSpeech = section.querySelector('[data-eon-city-eonbot-stop-speech]');
  const openChat = section.querySelector('[data-eon-city-eonbot-open-chat]');
  const voiceReview = section.querySelector('[data-eon-city-voice-review]');
  const voiceReviewAck = section.querySelector('[data-eon-city-voice-review-ack]');
  const voiceReviewStart = section.querySelector('[data-eon-city-voice-review-start]');
  const settings = loadAISettings();
  const capabilityMode = resolveEonbotCapabilityMode({ settings });
  const activeCapability = capabilityMode.modes.find((entry) => entry.active) || capabilityMode.modes[0];
  const providerConfigured = capabilityMode.activeId !== 'guide';
  const sessionStore = section.ownerDocument?.defaultView?.sessionStorage || globalThis.sessionStorage;
  let canonicalThread = null;
  try { canonicalThread = resolveChatThread({ storage: sessionStore, sessionStorage: sessionStore }).thread || null; } catch {}
  const toAiHistory = () => (Array.isArray(canonicalThread?.messages) ? canonicalThread.messages : [])
    .slice(-MAX_HISTORY_MESSAGES)
    .map((entry) => ({ role: entry?.role === 'user' ? 'user' : 'assistant', content: String(entry?.text || '') }))
    .filter((entry) => entry.content);
  let history = toAiHistory();
  let latestReply = '';
  let pending = false;
  let latestDictation = '';
  let lastVoiceCompanionMode = 'return';
  let conversationActive = false;
  let lastConversationTranscript = '';
  let conversationRestartTimer = 0;
  let liveController = null;
  let voiceConsentToken = '';

  const setCompanionMode = (mode = 'return', durationMs = 1000) => {
    try {
      return getRuntime?.()?.setCompanionIntent?.(mode, { durationMs });
    } catch {
      return null;
    }
  };

  if (runtimeState) {
    if (capabilityMode.activeId === 'local') {
      const runtimeLabel = String(activeCapability?.runtime || 'Local AI');
      const modelLabel = String(activeCapability?.model || '').trim();
      runtimeState.textContent = `${runtimeLabel} verified${modelLabel ? ` · ${modelLabel}` : ''}`;
      runtimeState.dataset.state = 'local-ready';
    } else if (capabilityMode.activeId === 'connected') {
      runtimeState.textContent = `${String(activeCapability?.providerLabel || settings.provider || 'Connected AI')} verified`;
      runtimeState.dataset.state = 'connected-ready';
    } else {
      runtimeState.textContent = 'Guide ready · Make Local AI ready for private model replies';
      runtimeState.dataset.state = 'guide-ready';
    }
  }

  if (openChat && canonicalThread?.id) openChat.href = getChatThreadQuery(canonicalThread.id);

  const setLocalStatus = (message) => {
    if (status) status.textContent = String(message || '');
    onStatus?.(message);
  };
  const append = (role, text, meta = '') => {
    if (!thread) return null;
    const node = makeMessage(thread.ownerDocument, role, text, meta);
    thread.appendChild(node);
    thread.scrollTop = thread.scrollHeight;
    return node;
  };
  const refreshCanonicalHistory = () => { history = toAiHistory(); };
  const persistMessage = (role, text, extra = {}) => {
    const content = String(text || '').trim();
    if (!content) return null;
    if (!canonicalThread?.id) {
      history = [...history, { role: role === 'user' ? 'user' : 'assistant', content }].slice(-MAX_HISTORY_MESSAGES);
      return null;
    }
    const nextMessage = role === 'user'
      ? { role: 'user', text: content, source: 'user' }
      : {
          role: 'bot',
          text: content,
          source: extra.source === 'ai' ? 'ai' : 'guide',
          meta: extra.meta || null,
          toolCTA: extra.toolCTA || null
        };
    try {
      const updated = updateChatThreadMessages(canonicalThread.id, [...(canonicalThread.messages || []), nextMessage], { storage: sessionStore });
      if (updated) canonicalThread = updated;
    } catch {}
    refreshCanonicalHistory();
    if (openChat && canonicalThread?.id) openChat.href = getChatThreadQuery(canonicalThread.id);
    return canonicalThread;
  };
  const setPending = (value) => {
    pending = Boolean(value);
    if (send) {
      send.disabled = pending;
      send.textContent = pending ? 'EONBOT is working…' : 'Send';
    }
    if (input) input.disabled = pending;
  };
  if (thread) {
    thread.innerHTML = '';
    const stored = Array.isArray(canonicalThread?.messages) ? canonicalThread.messages.slice(-8) : [];
    if (stored.length) {
      for (const entry of stored) append(entry.role === 'user' ? 'user' : 'assistant', entry.text, entry?.meta?.provider ? `${entry.meta.provider}${entry.meta.model ? ` · ${entry.meta.model}` : ''}` : 'Same active EONBOT thread');
    } else {
      append('assistant', 'What would you like to do while you explore? This is the same active EONBOT session thread used on the main page.', 'Same active EONBOT thread');
    }
  }

  const resolvedSpeechLocale = () => {
    const selected = String(locale?.value || readVoiceLanguagePreference() || 'auto');
    if (selected !== 'auto') return selected;
    return getVoiceLanguageOption(resolveChatLanguage() || 'en')?.locale || 'en-US';
  };
  const resolvedReplyLanguage = () => {
    const selected = String(locale?.value || readVoiceLanguagePreference() || 'auto');
    return selected === 'auto' ? String(resolveChatLanguage() || 'en') : String(getVoiceLanguageBase(selected) || resolveChatLanguage() || 'en');
  };
  const hasConversationAuthority = () => authorizeVoiceInput({ mode: 'voice', consentToken: voiceConsentToken }, { store: section.ownerDocument?.defaultView?.sessionStorage || globalThis.sessionStorage }).ok === true;
  const closeVoiceReview = () => { try { voiceReview?.close?.(); } catch { voiceReview?.removeAttribute?.('open'); } };


  const clearConversationTimer = () => {
    if (conversationRestartTimer) globalThis.clearTimeout(conversationRestartTimer);
    conversationRestartTimer = 0;
  };
  const updateConversationButtons = () => {
    if (conversation) {
      conversation.classList.toggle('is-active', conversationActive);
      conversation.textContent = conversationActive ? 'Stop Conversation' : 'Voice Conversation';
      conversation.setAttribute('aria-pressed', conversationActive ? 'true' : 'false');
    }
    if (liveVoice) {
      const liveState = liveController?.getState?.();
      liveVoice.classList.toggle('is-active', liveState?.active === true);
      liveVoice.textContent = liveState?.active ? 'Stop Live Voice' : 'Live Voice';
      liveVoice.setAttribute('aria-pressed', liveState?.active ? 'true' : 'false');
    }
  };
  const startConversationListening = () => {
    if (!conversationActive || pending) return;
    if (!hasConversationAuthority()) return stopConversation('Voice Conversation consent expired. Microphone, automatic sending and spoken output are off.');
    voice.clearReview({ explicitUserAction: true });
    const result = voice.startDictation({ mode: 'voice', consentToken: voiceConsentToken, locale: resolvedSpeechLocale() });
    if (!result.ok) {
      conversationActive = false;
      clearVoiceConversationConsent({ store: section.ownerDocument?.defaultView?.sessionStorage || globalThis.sessionStorage });
      voiceConsentToken = '';
      updateConversationButtons();
      setLocalStatus(`Voice Conversation stopped: ${result.error}. Typed chat remains available.`);
    } else {
      setLocalStatus('Voice Conversation is listening under the reviewed session consent. Final turns send automatically until you tap Stop.');
    }
  };
  const speakConversationReply = () => {
    if (!conversationActive) return;
    const view = section.ownerDocument?.defaultView || globalThis;
    const synthesis = view?.speechSynthesis;
    const Utterance = view?.SpeechSynthesisUtterance || globalThis.SpeechSynthesisUtterance;
    const next = () => {
      clearConversationTimer();
      conversationRestartTimer = globalThis.setTimeout(startConversationListening, 180);
    };
    if (!latestReply || !synthesis || typeof Utterance !== 'function') return next();
    try {
      synthesis.cancel?.();
      const utterance = new Utterance(String(latestReply).slice(0, 1800));
      utterance.lang = resolvedSpeechLocale();
      utterance.onend = next;
      utterance.onerror = next;
      setCompanionMode('speak', Math.min(12000, Math.max(1800, latestReply.length * 45)));
      synthesis.speak(utterance);
    } catch { next(); }
  };
  const stopConversation = (message = 'Voice Conversation stopped. Microphone, automatic sending and spoken output are off.') => {
    conversationActive = false;
    voiceConsentToken = '';
    clearVoiceConversationConsent({ store: section.ownerDocument?.defaultView?.sessionStorage || globalThis.sessionStorage });
    clearConversationTimer();
    voice.stopDictation('user-stop');
    stopEonCityCaption({ explicitUserAction: true });
    try { (section.ownerDocument?.defaultView || globalThis).speechSynthesis?.cancel?.(); } catch {}
    updateConversationButtons();
    setCompanionMode('return', 900);
    setLocalStatus(message);
  };
  const getLiveController = () => {
    if (liveController) return liveController;
    liveController = createEonLiveVoiceController({
      environment: section.ownerDocument?.defaultView || globalThis,
      onState: (snapshot) => {
        updateConversationButtons();
        if (snapshot.active) {
          setCompanionMode('listen', 3600);
          setLocalStatus('Live Voice is connected through the paired local bridge. Audio-native conversation is active.');
        } else if (snapshot.status === 'error') {
          setCompanionMode('return', 900);
          setLocalStatus(`Live Voice stopped safely: ${snapshot.error}`);
        }
      },
      onTranscript: (receipt) => {
        const text = String(receipt?.text || '').trim();
        if (!text || receipt.kind === 'assistant-delta') return;
        const role = receipt.kind === 'user' ? 'user' : 'assistant';
        append(role, text, 'Live Voice transcript · active session thread');
        persistMessage(role, text, { source: role === 'assistant' ? 'ai' : 'user' });
      }
    });
    return liveController;
  };

  const voice = createEonCityVoiceConsentController({
    onState: (snapshot) => {
      latestDictation = String(snapshot.transcript || '');
      if (input && latestDictation) input.value = latestDictation.slice(0, MAX_CITY_INPUT_CHARS);
      if (dictate) dictate.disabled = !snapshot.capability.dictationAvailable || snapshot.microphonePermission !== 'granted-check-only' || snapshot.dictationState === 'listening';
      if (stopDictation) stopDictation.disabled = snapshot.dictationState !== 'listening' && snapshot.dictationState !== 'starting';
      if (micCheck) {
        micCheck.disabled = !snapshot.capability.microphoneCheckAvailable || snapshot.microphonePermission === 'checking';
        micCheck.textContent = snapshot.microphonePermission === 'granted-check-only' ? 'Microphone enabled' : snapshot.microphonePermission === 'checking' ? 'Checking…' : 'Enable microphone';
      }
      const isListening = snapshot.dictationState === 'starting' || snapshot.dictationState === 'listening';
      if (isListening && lastVoiceCompanionMode !== 'listen') {
        setCompanionMode('listen', 3600);
        lastVoiceCompanionMode = 'listen';
      } else if (!isListening && lastVoiceCompanionMode === 'listen') {
        setCompanionMode('return', 900);
        lastVoiceCompanionMode = 'return';
      }
      if (snapshot.lastError) setLocalStatus(`Voice: ${snapshot.lastError.replaceAll('-', ' ')}. Typed chat remains available.`);
      if (conversationActive && snapshot.reviewReady && snapshot.dictationState === 'review-ready') {
        if (!hasConversationAuthority()) {
          stopConversation('Voice Conversation consent expired. The transcript remains editable and was not sent.');
          return;
        }
        const transcript = normalizeInput(snapshot.transcript || '');
        if (transcript && transcript !== lastConversationTranscript && !pending) {
          lastConversationTranscript = transcript;
          if (input) input.value = transcript;
          voice.clearReview({ explicitUserAction: true });
          void handleSend({ voiceConversationTurn: true });
        }
      }
    }
  });

  const handlePreparedPlan = (text, plan) => {
    latestReply = [plan.text, plan.truthNote].filter(Boolean).join(' ');
    const node = append('assistant', latestReply, 'Prepared route · nothing opened yet');
    const route = renderPreparedRoute(thread.ownerDocument, plan);
    if (route.childElementCount) node?.appendChild(route);
    setCompanionMode('guide', 2600);
    persistMessage('assistant', latestReply, {
      source: 'guide',
      toolCTA: plan?.toolCTA?.url ? { label: plan.toolCTA.label || plan?.proposal?.reviewLabel || 'Review destination', url: plan.toolCTA.url } : null
    });
    setLocalStatus('EONBOT prepared a destination. Review the visible button before anything opens; City-capable tools stay inside City.');
  };

  const handleSend = async ({ voiceConversationTurn = false } = {}) => {
    if (pending) return;
    const text = normalizeInput(input?.value || '');
    if (!text) {
      setLocalStatus('Type or dictate a request first.');
      input?.focus?.({ preventScroll: true });
      return;
    }
    if (containsCredentialShape(text)) {
      if (input) input.value = '';
      append('assistant', 'A credential-shaped value was blocked before it could be sent. Keep keys and secrets in Vault, never in City chat.', 'Safety block · no provider request');
      setLocalStatus('Sensitive-looking text was blocked. No provider request was created.');
      return;
    }
    const priorHistory = history.slice(-MAX_HISTORY_MESSAGES);
    if (input) input.value = '';
    append('user', text);
    persistMessage('user', text);
    setCompanionMode('scan', 2400);
    setPending(true);
    try {
      const plan = buildEonbotCommandHubPlan(text, { source: 'eoncity-quick' });
      if (plan.matched) {
        handlePreparedPlan(text, plan);
        return;
      }
      if (!providerConfigured) {
        latestReply = 'I can prepare City and EONAPP destinations now. A model-powered answer needs a verified Local AI or Connected AI route. Choose Make Local AI ready for the simplest private setup, or open full EONBOT Chat.';
        append('assistant', latestReply, 'Guide response · no provider request');
        persistMessage('assistant', latestReply, { source: 'guide' });
        setLocalStatus('No model request was created. Make Local AI ready and full Chat remain visible choices.');
        return;
      }
      const reply = await createAIReply({
        input: text,
        history: priorHistory,
        settings: { ...settings, replyLanguage: resolvedReplyLanguage(), requestContext: { userInitiated: true, consentSource: 'city-quick-work-send-action', origin: 'eoncity-quick' } }
      });
      latestReply = String(reply?.text || 'No response returned.');
      const provider = reply?.meta?.provider || settings.provider || 'configured AI';
      const model = reply?.meta?.model ? ` · ${reply.meta.model}` : '';
      append('assistant', latestReply, `Real AI response · ${provider}${model}`);
      persistMessage('assistant', latestReply, { source: 'ai', meta: { provider, model: reply?.meta?.model || '', local: Boolean(reply?.meta?.local), elapsedMs: reply?.meta?.elapsedMs ?? null } });
      setCompanionMode('return', 1000);
      setLocalStatus('EONBOT answered through the configured AI runtime. No tool or route executed.');
      dispatchEonCityW659gVerifiedAction({ type: 'eonbot.real-reply', receiptId: `eonbot:${globalThis.crypto?.randomUUID?.() || Date.now()}`, verified: true, verifiedAt: Date.now(), source: 'eoncity-quick-work' });
    } catch (error) {
      latestReply = `The configured AI could not answer here: ${String(error?.message || 'request unavailable')}. Your request was not converted into a completed task. You can retry in full EONBOT Chat.`;
      append('assistant', latestReply, 'AI request failed safely');
      persistMessage('assistant', latestReply, { source: 'guide' });
      setCompanionMode('return', 1000);
      setLocalStatus('The AI request failed safely. Full Chat remains available for review and retry.');
    } finally {
      setPending(false);
      if (voiceConversationTurn && conversationActive) speakConversationReply();
    }
  };

  const onInputKeydown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };
  const onPrompt = (event) => {
    const button = event.target?.closest?.('[data-eon-city-eonbot-prompt]');
    if (!button || !input) return;
    input.value = String(button.dataset.eonCityEonbotPrompt || '').slice(0, MAX_CITY_INPUT_CHARS);
    input.focus({ preventScroll: true });
  };
  const onMicCheck = async () => {
    const result = await voice.checkMicrophonePermission({ explicitUserAction: true });
    setLocalStatus(result.ok ? 'Microphone permission check passed. Choose Speak when you are ready; listening does not start automatically.' : `Microphone check unavailable: ${result.error}. Typed chat remains available.`);
  };
  const onDictate = () => {
    const result = voice.startDictation({ explicitUserAction: true, locale: resolvedSpeechLocale() });
    if (result.ok) {
      setCompanionMode('listen', 3600);
      lastVoiceCompanionMode = 'listen';
    }
    setLocalStatus(result.ok ? 'Listening once. Speak now; the transcript will appear for review and will not send automatically.' : `Dictation did not start: ${result.error}.`);
  };
  const onStopDictation = () => {
    voice.stopDictation('user-stop');
    setCompanionMode('return', 900);
    lastVoiceCompanionMode = 'return';
    setLocalStatus(latestDictation ? 'Dictation stopped. Review the text, then choose Send.' : 'Dictation stopped. No text was sent.');
  };
  const onSpeakReply = () => {
    const result = speakEonCityCaption({ text: latestReply, locale: resolvedSpeechLocale(), explicitUserAction: true });
    if (result.ok) {
      const estimatedSpeechMs = Math.min(8000, Math.max(1600, latestReply.length * 45));
      setCompanionMode('speak', estimatedSpeechMs);
      lastVoiceCompanionMode = 'speak';
    }
    setLocalStatus(result.ok ? 'Speaking the latest EONBOT reply through browser speech.' : `Browser speech unavailable: ${result.error}.`);
  };
  const onStopSpeech = () => {
    stopEonCityCaption({ explicitUserAction: true });
    setCompanionMode('return', 900);
    lastVoiceCompanionMode = 'return';
    setLocalStatus('EONBOT browser speech stopped.');
  };
  const onOpenChat = (event) => {
    event?.preventDefault?.();
    const handoff = normalizeInput(input?.value || history.filter((entry) => entry.role === 'user').at(-1)?.content || '');
    if (handoff) {
      try { sessionStorage.setItem(CHAT_HANDOFF_KEY, handoff); } catch {}
    }
    onLeaveCity?.(canonicalThread?.id ? getChatThreadQuery(canonicalThread.id) : '/');
  };
  const onPreparedRoute = (event) => {
    const link = event.target?.closest?.('[data-eon-city-eonbot-prepared-route], [data-eon-city-eonbot-direct-route]');
    if (!link) return;
    event.preventDefault();
    const route = link.getAttribute('href') || '/';
    const cityTarget = resolveEonCityPreparedRoute(route);
    if (cityTarget.ok) {
      const opened = getRuntime?.()?.openStation?.(cityTarget.stationId, { explicitUserAction: true, surface: cityTarget.surface, creatorMode: cityTarget.creatorMode });
      if (opened?.ok) {
        setLocalStatus(`${cityTarget.stationId === 'create-forge' ? 'Creator' : 'Maintained work'} opened inside EON City. This user-tap handoff created no XP or automatic AI/provider action.`);
        return;
      }
      setLocalStatus(`The in-City workspace did not open: ${String(opened?.reason || 'surface-unavailable').replaceAll('-', ' ')}. No route or AI action ran automatically.`);
      return;
    }
    onLeaveCity?.(route);
  };

  const onSendClick = () => { void handleSend(); };

  const onConversation = () => {
    if (conversationActive) return stopConversation();
    getLiveController().stop({ reason: 'switch-to-conversation' });
    const review = buildVoiceConversationReview({ locale: resolvedSpeechLocale(), routeLabel: providerConfigured ? `EONBOT · ${String(settings.provider || 'configured AI')}` : 'EONBOT Guide / routing', browserAssisted: true });
    const route = voiceReview?.querySelector?.('[data-eon-city-voice-review-route]');
    const privacy = voiceReview?.querySelector?.('[data-eon-city-voice-review-privacy]');
    if (route) route.textContent = `${review.routeLabel} · ${review.locale}`;
    if (privacy) privacy.textContent = review.privacy;
    if (voiceReviewAck) voiceReviewAck.checked = false;
    if (voiceReviewStart) voiceReviewStart.disabled = true;
    try { voiceReview?.showModal?.(); } catch { voiceReview?.setAttribute?.('open', ''); }
  };
  const onVoiceReviewStart = async () => {
    const consent = grantVoiceConversationConsent({
      explicitUserAction: true,
      autoSendAcknowledged: voiceReviewAck?.checked === true,
      continuousListeningAcknowledged: voiceReviewAck?.checked === true,
      locale: resolvedSpeechLocale(),
      routeLabel: providerConfigured ? `EONBOT · ${String(settings.provider || 'configured AI')}` : 'EONBOT Guide / routing'
    }, { store: section.ownerDocument?.defaultView?.sessionStorage || globalThis.sessionStorage, cryptoImpl: section.ownerDocument?.defaultView?.crypto || globalThis.crypto });
    if (!consent.ok) {
      setLocalStatus('Review and accept the Voice Conversation disclosures before starting.');
      return;
    }
    closeVoiceReview();
    voiceConsentToken = consent.token;
    if (voice.getSnapshot().microphonePermission !== 'granted-check-only') {
      const permission = await voice.checkMicrophonePermission({ explicitUserAction: true });
      if (!permission.ok) {
        clearVoiceConversationConsent({ store: section.ownerDocument?.defaultView?.sessionStorage || globalThis.sessionStorage });
        voiceConsentToken = '';
        setLocalStatus(`Voice Conversation unavailable: ${permission.error}. Typed chat remains available.`);
        return;
      }
    }
    conversationActive = true;
    lastConversationTranscript = '';
    updateConversationButtons();
    startConversationListening();
  };
  const onVoiceReviewAck = () => { if (voiceReviewStart) voiceReviewStart.disabled = voiceReviewAck?.checked !== true; };
  const onVoiceReviewCancel = (event) => { if (!event.target?.closest?.('[data-eon-city-voice-review-cancel]')) return; closeVoiceReview(); };
  const onLocaleChange = () => {
    const selected = saveVoiceLanguagePreference(locale?.value || 'auto');
    if (locale) locale.value = selected;
    if (selected !== 'auto') setChatLanguagePreference(getVoiceLanguageBase(selected));
    setLocalStatus(selected === 'auto' ? 'Voice language follows your Chat/device language.' : `Voice and EONBOT reply language set to ${getVoiceLanguageOption(selected)?.label || selected}.`);
  };
  const onLiveVoice = async () => {
    const controller = getLiveController();
    const snapshot = controller.getState();
    if (snapshot.active || ['connecting', 'requesting-microphone'].includes(snapshot.status)) {
      controller.stop({ reason: 'user-stop' });
      setLocalStatus('Live Voice stopped. Microphone and realtime audio are off.');
      return;
    }
    stopConversation('Switching from Voice Conversation to Live Voice.');
    const result = await controller.start({ explicitUserAction: true, locale: resolvedSpeechLocale() });
    if (!result.active && result.status !== 'connecting') setLocalStatus(`Live Voice unavailable: ${result.error || result.capability?.reason || 'not configured'}`);
  };

  send?.addEventListener('click', onSendClick);
  input?.addEventListener('keydown', onInputKeydown);
  section.addEventListener('click', onPrompt);
  micCheck?.addEventListener('click', onMicCheck);
  dictate?.addEventListener('click', onDictate);
  conversation?.addEventListener('click', onConversation);
  voiceReviewAck?.addEventListener('change', onVoiceReviewAck);
  voiceReviewStart?.addEventListener('click', onVoiceReviewStart);
  voiceReview?.addEventListener('click', onVoiceReviewCancel);
  locale?.addEventListener('change', onLocaleChange);
  liveVoice?.addEventListener('click', onLiveVoice);
  stopDictation?.addEventListener('click', onStopDictation);
  speakReply?.addEventListener('click', onSpeakReply);
  stopSpeech?.addEventListener('click', onStopSpeech);
  openChat?.addEventListener('click', onOpenChat);
  section.addEventListener('click', onPreparedRoute);

  return () => {
    send?.removeEventListener('click', onSendClick);
    input?.removeEventListener('keydown', onInputKeydown);
    section.removeEventListener('click', onPrompt);
    micCheck?.removeEventListener('click', onMicCheck);
    dictate?.removeEventListener('click', onDictate);
    conversation?.removeEventListener('click', onConversation);
    voiceReviewAck?.removeEventListener('change', onVoiceReviewAck);
    voiceReviewStart?.removeEventListener('click', onVoiceReviewStart);
    voiceReview?.removeEventListener('click', onVoiceReviewCancel);
    locale?.removeEventListener('change', onLocaleChange);
    liveVoice?.removeEventListener('click', onLiveVoice);
    stopDictation?.removeEventListener('click', onStopDictation);
    speakReply?.removeEventListener('click', onSpeakReply);
    stopSpeech?.removeEventListener('click', onStopSpeech);
    openChat?.removeEventListener('click', onOpenChat);
    section.removeEventListener('click', onPreparedRoute);
    stopConversation('Voice controls closed.');
    liveController?.dispose?.();
    voice.dispose();
    stopEonCityCaption({ explicitUserAction: true });
    setCompanionMode('return', 900);
    history = [];
    canonicalThread = null;
    latestReply = '';
  };
}

export default Object.freeze({
  EON_CITY_EONBOT_QUICK_WORK_SCHEMA,
  renderEonCityEonbotQuickWorkMarkup,
  bindEonCityEonbotQuickWork
});
