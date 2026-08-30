import { registerEonServiceWorker } from './utils/eon-service-worker-registration.js';
import { EONChatbot } from './chat/chatbot.js';
import {
  PROVIDERS,
  createAIReplyStream,
  getRateStatus,
  getProviderVerification,
  loadAISettings,
  saveAISettings,
  verifyProviderReadiness
} from './chat/ai-runtime.js';
import { createLoadGovernor } from './chat/load-governor.js';
import { safeHTML } from './utils/safe-html.js';
import { copyToClipboard, showToast } from './utils/share.js';
import { ensureProfile, getProfileStats } from './utils/profile.js';
import { generateInviteLink } from './utils/referral-par.js';
import { applyTheme, initThemeToggle } from './utils/storage.js';
import { escapeHtml } from './utils/escape.js';
import { initSiteShell } from './utils/site-shell.js';
import multiLanguageService from './utils/multi-language.js';
import { detectLikelyLanguageFromText, getChatLanguagePreference, getCurrentLanguage, getPreferredLanguage, initAppLanguage, localizeStatic, resolveChatLanguage, setChatLanguagePreference, translateForUser } from './utils/app-language.js';
import { parseEonKernelPlanCommand } from './ai-kernel/eon-command-intake.js';
import { rememberEonAiStructuredSignal } from './ai-kernel/eon-ai-structured-memory.js';
import { getEonAiMemoryStats } from './ai-kernel/eon-ai-memory-ledger.js';
import { readEonAiMemoryPolicy, writeEonAiMemoryPolicy } from './ai-kernel/eon-ai-memory-policy.js';
import { readEonSponsoredAiContextPolicy, writeEonSponsoredAiContextPolicy } from './ai-kernel/eon-sponsored-ai-context-policy.js';
import { clearEonAiEvaluations, recordEonAiUserQualityFeedback } from './ai-kernel/eon-ai-evaluation-ledger.js';
import { resolveSpeechLocale, buildRecognitionLocaleCandidates, applySpeechVoice } from './utils/speech-locale.js';
import { VOICE_LANGUAGE_OPTIONS, getVoiceLanguageBase, getVoiceLanguageOption, normalizeVoiceLanguagePreference, readVoiceLanguagePreference, saveVoiceLanguagePreference } from './chat/voice-language-preferences.js';
import { mapEonbotMultilingualRoutingSeed } from './chat/eonbot-multilingual-routing.js';
import { getAIReadiness, getSuperappSetupPlan, CANONICAL_AI_SETUP_PATH, CANONICAL_AI_KEYS_PATH } from './utils/ai-readiness.js';
import { listModeOptions, listRuntimePreferences, listModelSelectionPolicies, normalizeModeSettings } from './utils/eon-mode-system.js';
import { buildEonbotTruthPlan } from './chat/eonbot-truth-contract.js';
import { resolveEonbotCapabilityMode } from './chat/eonbot-capability-registry.js';
import { buildEonbotVoiceCapabilityGateway } from './chat/eonbot-voice-capability-gateway.js';
import {
  authorizeVoiceInput,
  buildVoiceConversationReview,
  clearVoiceConversationConsent,
  grantVoiceConversationConsent,
  readVoiceConversationConsent
} from './chat/eon-voice-session-authority.js';
import { buildEonbotProactiveSuggestion, dismissEonbotProactiveSuggestion, readEonbotProactiveSettings, recordEonbotProactiveSuggestion, setEonbotProactiveEnabled } from './utils/eonbot-proactive-suggestions.js';
import { readLocalRuntimeStatus } from './local-ai/local-runtime-status.js';
import { BUDGET_MODE_LABELS, formatMissionMemorySummary, summarizeMissionMemory } from './utils/mission-memory.js';
import { exportMissionCapsule, getLatestResumableMissionJob, getMissionDurabilitySummary, importMissionCapsuleFile, resumeMissionJob } from './utils/mission-durability.js';
import { buildMissionClarifiers, buildMissionPreview } from './utils/mission-intake.js';
import { clearLegacyPlaintextChatThreads, createNewChatThread, deleteChatThread, getChatThreadQuery, getLegacyPlaintextChatThreadStatus, renameChatThread, resolveChatThread, updateChatThreadMessages } from './utils/chat-threads.js';
import { recordEonbotActionTap } from './chat/eonbot-action-receipts.js';
import {
  approveEonbotActionProposal,
  cancelEonbotActionProposal,
  createEonbotActionProposal,
  failEonbotActionProposal
} from './chat/eonbot-action-proposals.js';
import {
  readEonbotInteractionPreferences,
  setEonbotInteractionPreferences
} from './chat/eonbot-interaction-preferences.js';
import { buildEonbotLocalActionCardPlan, createEonbotLocalActionCards } from './chat/eonbot-action-cards.js';
import { beginEonKernelForegroundTask, completeEonKernelForegroundTask, createEonKernelMissionDraft, failEonKernelForegroundTask } from './ai-kernel/eon-ai-kernel-bridge.js';
import { bindCityModeLinkTracking, enterCityMode } from './contracts/city/city-mode-transition.js';
import { consumeQueuedLocalAttachmentRequest, getQueuedLocalAttachmentRequest } from './chat/local-attachments.js';
import { writeEonShareIntent } from './share/eon-share-intent.js';
import { writeEonCreatorIntentHandoff } from './create/eon-creator-intent-handoff.js';
import { bootEonGrowthAttribution, emitEonGrowthEvent } from './growth/eon-growth-attribution.js';
import {
  CHAT_DAILY_FREE_GUIDE_LIMIT,
  CHAT_DAILY_GUIDE_USAGE_KEY,
  CHAT_MISSION_TIMELINE_KEY,
  CHAT_MISSION_UI_MODE_KEY,
  createChatDailyGuideUsageStore,
  createChatMissionTimelineStore,
  sanitizeChatInput
} from './chat/chat-page-session-state.js';

// Browser global type cast for custom window properties
const appWin = /** @type {any} */ (window);

// DOM type cast for property access
const doc = /** @type {any} */ (document);

const SESSION_KEY = 'eon:chat-history:v2';
const CHAT_LANGUAGE_PROMPT_KEY = 'eon:chat:language-prompt:v1';
const initialEonbotInteractionPreferences = readEonbotInteractionPreferences();
const transientCreatorIntentByMessage = new WeakMap();
const transientShareIntentByMessage = new WeakMap();
const transientActionCardPlanByMessage = new WeakMap();

function creatorModeFromCommandReceipt(receipt = {}) {
  const commandId = String(receipt?.interpretedAs || receipt?.commandId || '').trim();
  if (commandId === 'open-create-image') return 'image';
  if (commandId === 'open-create-video') return 'video';
  if (commandId === 'open-create-music') return 'music';
  return '';
}

const /** @type {any} */
PROVIDER_SETUP_PATTERNS = [
  { provider: 'groq', trigger: /(groq|gsk_)/i },
  { provider: 'gemini', trigger: /(gemini|google ai|aistudio|AIza)/i },
  { provider: 'openrouter', trigger: /(openrouter|sk-or-v1-)/i },
  { provider: 'cerebras', trigger: /(cerebras|csk-)/i },
  { provider: 'deepseek', trigger: /(deepseek)/i },
  { provider: 'mistral', trigger: /(mistral)/i },
  { provider: 'together', trigger: /(together(\.ai)?|tgp_v1_)/i },
  { provider: 'nvidia', trigger: /(nvidia|nim|nvapi-)/i },
  { provider: 'cloudflare', trigger: /(cloudflare|workers ai|cfut_)/i },
  { provider: 'huggingface', trigger: /(huggingface|hf_)/i },
  { provider: 'fireworks', trigger: /(fireworks|fw_)/i },
  { provider: 'cohere', trigger: /(cohere)/i },
  { provider: 'sambanova', trigger: /(sambanova)/i },
  { provider: 'openai', trigger: /(openai|chatgpt|gpt|sk-proj-|\bsk-[A-Za-z0-9_-]{18,})/i },
  { provider: 'anthropic', trigger: /(anthropic|claude|sk-ant-)/i },
  { provider: 'ollama', trigger: /(ollama|local ai|local model)/i },
  { provider: 'lmstudio', trigger: /(lm studio|lmstudio)/i }
];

const RAW_CREDENTIAL_PATTERNS = Object.freeze([
  /\b(?:gsk|AIza|sk-or-v1|sk-ant|csk|tgp_v1|nvapi|cfut|hf|fw|sk-proj)_[A-Za-z0-9_-]{16,}\b/i,
  /\bsk-[A-Za-z0-9_-]{18,}\b/i,
  /\b(?:api[-_ ]?key|access[-_ ]?token|secret[-_ ]?key|password)\s*[:=]\s*[^\s]{8,}/i
]);


const /** @type {any} */
state = {
  bot: new EONChatbot(),
  governor: null,
  settings: normalizeModeSettings(loadAISettings()),
  conversation: [],
  activeThreadId: '',
  detectingLocal: false,
  localProviders: [],
  pending: false,
  voiceListening: false,
  voiceSession: 'idle',
  voiceConversationActive: false,
  voiceAwaitingReply: false,
  emotion: 'ready',
  emotionDetail: '',
  lastEmotionTs: 0,
  ttsEnabled: initialEonbotInteractionPreferences.voiceOutputEnabled,
  continuousVoice: false,
  voiceConsentToken: '',
  personalizedGreetingEnabled: initialEonbotInteractionPreferences.personalizedGreetingEnabled,
  speechLanguagePreference: readVoiceLanguagePreference()
};

let _voiceRecognition = /** @type {any} */ (null);
let /** @type {any} */
_voiceLocaleCandidates = ['en-US'];
let _voiceLocaleIndex = 0;

function applyEonbotInteractionPreferenceState(preference = readEonbotInteractionPreferences()) {
  state.ttsEnabled = preference.voiceOutputEnabled === true;
  // A remembered preference never starts or authorizes a microphone session.
  state.continuousVoice = state.voiceConversationActive === true;
  state.personalizedGreetingEnabled = preference.personalizedGreetingEnabled === true;
  if (!state.ttsEnabled && 'speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch {}
  }
  void updateVoiceButtons();
}

function getDom() {
  return {
    runtimeName: doc.getElementById('chat-runtime-name'),
    runtimeLabel: doc.getElementById('chat-runtime-label'),
    controls: doc.getElementById('chat-controls'),
    messages: doc.getElementById('chat-messages'),
    input: doc.getElementById('chat-input'),
    send: doc.getElementById('chat-send'),
    emotionStrip: doc.getElementById('eonbot-emotion-strip'),
    emotionEmoji: doc.getElementById('eonbot-emotion-emoji'),
    emotionLabel: doc.getElementById('eonbot-emotion-label'),
    emotionDetail: doc.getElementById('eonbot-emotion-detail'),
    voiceChip: doc.getElementById('eonbot-voice-chip'),
    modelChip: doc.getElementById('eonbot-model-chip'),
    missionChip: doc.getElementById('eonbot-mission-chip')
  };
}

const chatDailyGuideUsage = createChatDailyGuideUsageStore({
  key: CHAT_DAILY_GUIDE_USAGE_KEY,
  limit: CHAT_DAILY_FREE_GUIDE_LIMIT,
  // W623C: subscriptions can unlock EONAPP product limits, but AI execution still
  // uses a local runtime or a user-configured provider. No plan implies unlimited
  // hosted generation or bypasses these browser-side safety limits.
  isUnlimited: () => false
});
const chatMissionTimeline = createChatMissionTimelineStore({
  timelineKey: CHAT_MISSION_TIMELINE_KEY,
  uiModeKey: CHAT_MISSION_UI_MODE_KEY
});

function incrementDailyGuideUsage() {
  const next = chatDailyGuideUsage.increment();
  updateChatDailyLimitPanel();
  return next;
}

function updateChatDailyLimitPanel() {
  const node = doc.getElementById('chat-daily-free-status');
  if (!node) return;
  const allowance = chatDailyGuideUsage.getAllowance();
  node.textContent = `${allowance.remaining}/${allowance.limit} free guide replies left today · install local AI or connect your own provider for longer tasks.`;
}

function stylesheetHasRules(/** @type {HTMLLinkElement} */ link) {
  try {
    return Boolean(link.sheet && link.sheet.cssRules && link.sheet.cssRules.length > 0);
  } catch {
    return false;
  }
}

function withDirectCssHref(/** @type {string} */ href) {
  const url = new URL(href, window.location.origin);
  if (url.searchParams.get('direct') === '') return url.toString();
  url.searchParams.set('direct', '');
  return url.toString().replace(/=(&|$)/, '$1');
}

function waitForStylesheetLoad(/** @type {HTMLLinkElement} */ link) {
  return new Promise((/** @type {any} */ resolve) => {
    const done = () => resolve(undefined);
    link.addEventListener('load', done, { once: true });
    link.addEventListener('error', done, { once: true });
  });
}

async function ensureChatStylesheets() {
  // W18 launch polish: the bundled chat styles are already stable in production.
  // Rewriting stylesheet hrefs during boot can trigger visible layout shifts.
  if (!window.location.search.includes('repair-css=1')) return;

  const links = [...document.querySelectorAll('link[rel="stylesheet"]')]
    .filter((/** @type {any} */ link) => /\/assets\/css\/.+\.css$/i.test(link.getAttribute('href') || ''));

  const broken = links.filter((/** @type {any} */ link) => !stylesheetHasRules(link));
  if (!broken.length) return;

  await Promise.all(broken.map(async (/** @type {any} */ link) => {
    const currentHref = link.getAttribute('href') || '';
    if (!currentHref) return;
    const directHref = withDirectCssHref(currentHref);
    if (currentHref === directHref) return;
    link.setAttribute('href', directHref);
    await waitForStylesheetLoad(link);
  }));
}

function focusProviderSetup() {
  const dom = getDom();
  dom.controls?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function inferProviderFromText(/** @type {any} */ text) {
  const source = String(text || '');
  const found = PROVIDER_SETUP_PATTERNS.find((entry) => entry.trigger.test(source));
  return found?.provider || '';
}

function containsRawCredentialValue(text) {
  const source = String(text || '');
  return RAW_CREDENTIAL_PATTERNS.some((pattern) => pattern.test(source));
}

function buildSensitiveCredentialReply() {
  return buildEonbotTruthPlan('api key');
}



const EONBOT_EMOTIONS = Object.freeze({
  ready: { emoji: '🙂', label: 'Ready to help', detail: 'Ask naturally. Guide Mode can answer product questions now, and Local or Connected AI can handle model-powered work when ready.' },
  thinking: { emoji: '🤔', label: 'Thinking through it', detail: 'EONBOT is routing your request and preparing the safest useful answer.' },
  listening: { emoji: '👂', label: 'Listening', detail: 'Microphone input is active. Speak clearly in your chosen language.' },
  speaking: { emoji: '🗣️', label: 'Speaking', detail: 'Voice output is on. EONBOT can read short replies aloud after user interaction.' },
  scanning: { emoji: '🔎', label: 'Scanning local AI', detail: 'Checking Ollama, LM Studio, and Jan on your device without sending prompts to EONAPP servers.' },
  connected: { emoji: '⚡', label: 'AI engine connected', detail: 'A tested provider or local model is ready for model-powered work.' },
  happy: { emoji: '😄', label: 'Reply ready', detail: 'Answer delivered. Choose a quick reply or send the next mission.' },
  careful: { emoji: '🛡️', label: 'Careful mode', detail: 'EONBOT is keeping account, rewards, and Vault actions safe and explainable.' },
  error: { emoji: '😵‍💫', label: 'Needs attention', detail: 'Something needs setup or retry. EONBOT will suggest a safe recovery path.' },
  sleeping: { emoji: '✦', label: 'Guide Mode ready', detail: 'Built-in guidance, multilingual chat and supported browser voice remain available without an AI key.' }
});

function getChatModelSummary() {
  const provider = PROVIDERS[state.settings.provider] || PROVIDERS.guide;
  const readiness = getAIReadiness(state.settings);
  const onlineLocal = Array.isArray(state.localProviders) ? state.localProviders.filter((item) => item?.available) : [];
  if (state.detectingLocal) return { text: '🧠 Models: scanning…', tone: 'active' };
  if (onlineLocal.length) {
    const first = onlineLocal[0];
    const count = onlineLocal.reduce((sum, item) => sum + (Array.isArray(item.models) ? item.models.length : 0), 0);
    return { text: `🧠 Models: ${providerLabel(first.provider)} ${count ? `· ${count} found` : 'ready'}`, tone: 'ready' };
  }
  if (readiness.ready) return { text: `🧠 Models: ${provider.label}${state.settings.model ? ` · ${state.settings.model}` : ''}`, tone: 'ready' };
  return { text: '🧠 Models: guide mode', tone: 'warning' };
}

function getEonbotVoiceCapability() {
  const capability = resolveEonbotCapabilityMode({
    settings: state.settings,
    localRuntimeStatus: readLocalRuntimeStatus(),
    readiness: getAIReadiness(state.settings)
  });
  return buildEonbotVoiceCapabilityGateway({
    activeMode: capability.activeId,
    recognitionSupported: typeof window !== 'undefined' && Boolean(window.SpeechRecognition || appWin.webkitSpeechRecognition),
    synthesisSupported: typeof window !== 'undefined' && Boolean(window.speechSynthesis),
    microphoneCaptureSupported: Boolean(globalThis.navigator?.mediaDevices?.getUserMedia),
    browserSpeechAllowed: true,
    targetLocale: getSpeechLocale(),
    voices: typeof window !== 'undefined' && window.speechSynthesis?.getVoices ? window.speechSynthesis.getVoices() : [],
    localCompanionReady: false,
    localCompanionAirplaneModeProven: false
  });
}

function getVoiceCapabilitySummary() {
  const voice = getEonbotVoiceCapability();
  if (state.voiceListening) return { text: `🎙️ Voice: listening ${getVoiceLocaleTag()}`, tone: 'active' };
  if (state.voiceConversationActive && state.voiceAwaitingReply) return { text: '🎙️ Voice: thinking', tone: 'active' };
  if (state.voiceConversationActive) return { text: '🎙️ Voice: conversation on', tone: 'active' };
  if (voice.mode === 'blocked') return { text: '🎙️ Voice: device fallback', tone: 'warning' };
  if (voice.mode === 'voice-ready') return { text: '🎙️ Voice: Dictate + Use Voice', tone: 'ready' };
  if (voice.mode === 'dictation-ready') return { text: '🎙️ Voice: Dictate ready', tone: 'ready' };
  return { text: '🎙️ Voice: browser limited', tone: 'warning' };
}

function getMissionStatusSummary() {
  if (state.pending) return { text: '🛠️ Mission: thinking', tone: 'active' };
  if (state.governor) {
    const status = state.governor.getStatus?.();
    const budget = status?.budget?.label || state.governor.getBudget?.()?.label || '';
    if (budget) return { text: `🛠️ Mission: ${String(budget).toLowerCase()}`, tone: 'ready' };
  }
  return { text: '🛠️ Mission: idle', tone: 'warning' };
}

function paintStatusChip(node, summary) {
  if (!node || !summary) return;
  node.textContent = summary.text;
  node.classList.toggle('is-ready', summary.tone === 'ready');
  node.classList.toggle('is-active', summary.tone === 'active');
  node.classList.toggle('is-warning', summary.tone === 'warning');
}

function setEonbotEmotion(mode, detail = '') {
  const dom = getDom();
  const nextMode = EONBOT_EMOTIONS[mode] ? mode : 'ready';
  const model = EONBOT_EMOTIONS[nextMode];
  state.emotion = nextMode;
  state.emotionDetail = detail || model.detail;
  state.lastEmotionTs = Date.now();
  if (dom.emotionStrip) dom.emotionStrip.dataset.emotionState = nextMode;
  if (dom.emotionEmoji) dom.emotionEmoji.textContent = model.emoji;
  if (dom.emotionLabel) dom.emotionLabel.textContent = model.label;
  if (dom.emotionDetail) dom.emotionDetail.textContent = state.emotionDetail;
  paintStatusChip(dom.voiceChip, getVoiceCapabilitySummary());
  paintStatusChip(dom.modelChip, getChatModelSummary());
  paintStatusChip(dom.missionChip, getMissionStatusSummary());
}

function refreshEonbotEmotion() {
  if (state.voiceListening) {
    setEonbotEmotion('listening');
    return;
  }
  if (state.detectingLocal) {
    setEonbotEmotion('scanning');
    return;
  }
  if (state.pending) {
    setEonbotEmotion('thinking');
    return;
  }
  const readiness = getAIReadiness(state.settings);
  if (readiness.ready) {
    setEonbotEmotion('connected', `Connected through ${PROVIDERS[state.settings.provider]?.label || 'AI'}${state.settings.model ? ` · ${state.settings.model}` : ''}.`);
    return;
  }
  const onlineLocal = Array.isArray(state.localProviders) ? state.localProviders.some((item) => item?.available) : false;
  if (onlineLocal) {
    setEonbotEmotion('connected', 'A local runtime is available. EONBOT can route private tasks to your device.');
    return;
  }
  setEonbotEmotion('ready');
}

function exposeEonbotEmotionDiagnostics() {
  appWin.EONBOTEmotion = Object.freeze({
    getState() {
      return {
        emotion: state.emotion,
        detail: state.emotionDetail,
        voiceListening: state.voiceListening,
        voiceSession: state.voiceSession,
        voiceConversationActive: state.voiceConversationActive,
        voiceCapability: getEonbotVoiceCapability(),
        speechLanguagePreference: getSpeechLanguagePreference(),
        speechLocale: getSpeechLocale(),
        ttsEnabled: state.ttsEnabled,
        provider: state.settings.provider,
        model: state.settings.model,
        localProviders: Array.isArray(state.localProviders) ? state.localProviders.map((item) => ({
          provider: item.provider,
          available: Boolean(item.available),
          modelCount: Array.isArray(item.models) ? item.models.length : 0
        })) : [],
        pending: state.pending,
        ts: state.lastEmotionTs
      };
    },
    setEmotion(mode, detail) {
      setEonbotEmotion(mode, detail);
      return this.getState();
    },
    refresh() {
      refreshEonbotEmotion();
      return this.getState();
    }
  });
}

function applyProviderPreset(/** @type {any} */ providerId, /** @type {any} */ options = {}) {
  const provider = PROVIDERS[providerId];
  if (!provider) return false;

  state.settings = saveAISettings({
    ...state.settings,
    mode: provider.id === 'guide' ? 'guide' : 'hybrid',
    provider: provider.id,
    model: provider.id === state.settings.provider ? state.settings.model : '',
    modelPinned: provider.id === state.settings.provider ? state.settings.modelPinned === true : false,
    endpoint: provider.defaultEndpoint || '',
    persistApiKey: options.persistApiKey ?? false
  });

  updateInputPlaceholder();
  updateHeaderStatus();
  refreshEonbotEmotion();
  renderControls();

  return true;
}

function shouldOfferVoiceShortcut(/** @type {any} */ text) {
  return /(voice|microphone|mic|talk|speak|dictate|hands free|habla|voz|parler|sprich|音声|話して|बोल|صوت|تحدث)/i.test(String(text || ''));
}

function isCreationIntent(/** @type {any} */ text) {
  return /(make|build|create|launch|generate|write|design|website|site|app|landing page|video|post|campaign|funnel|automation|bot|agent|workflow|sitio|aplicaci[oó]n|video|site web|ويب|موقع|تطبيق|वीडियो|ऐप|サイト|アプリ)/i.test(String(text || ''));
}

function isSetupIntent(/** @type {any} */ text) {
  return /(setup|set up|api key|provider|free ai|local ai|ollama|lm studio|gemini|groq|openrouter|openai|claude|key|sign up|signup|console|aistudio|llm|modelo|clave|configurar|مفتاح|اعداد|कुंजी|सेटअप)/i.test(String(text || ''));
}

function getSpeechLanguagePreference() {
  state.speechLanguagePreference = normalizeVoiceLanguagePreference(state.speechLanguagePreference || readVoiceLanguagePreference());
  return state.speechLanguagePreference;
}

function getSpeechLanguageOption() {
  return getVoiceLanguageOption(getSpeechLanguagePreference());
}

function isManualSpeechLanguage() {
  return getSpeechLanguagePreference() !== 'auto';
}

function getSpeechLocale() {
  const option = getSpeechLanguageOption();
  return resolveSpeechLocale({
    explicitSpeechLocale: option.value === 'auto' ? '' : option.locale,
    appLanguage: String(resolveChatLanguage() || getCurrentLanguage() || ''),
    preferredLanguage: String(getPreferredLanguage() || ''),
    browserLocales: Array.isArray(navigator.languages) ? navigator.languages : []
  });
}

function getRecognitionLocaleCandidates() {
  return buildRecognitionLocaleCandidates(
    getSpeechLocale(),
    Array.isArray(navigator.languages) ? navigator.languages : [],
    { includeEnglishFallback: !isManualSpeechLanguage() }
  );
}

function normalizeSpeechMessageMetadata(value = null) {
  if (!value || typeof value !== 'object') return null;
  const preference = normalizeVoiceLanguagePreference(value.preference || value.languagePreference || 'auto');
  const locale = String(value.locale || '').trim().replace(/_/g, '-').slice(0, 18);
  if (!locale || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/i.test(locale)) return null;
  return { locale, preference };
}

function syncSpeechLanguageSelector() {
  const select = /** @type {HTMLSelectElement|null} */ (doc.getElementById('chat-speech-language'));
  if (!select) return;
  const expectedValues = VOICE_LANGUAGE_OPTIONS.map((entry) => entry.value).join('|');
  const currentValues = Array.from(select.options || []).map((entry) => entry.value).join('|');
  if (currentValues !== expectedValues) {
    select.replaceChildren();
    for (const entry of VOICE_LANGUAGE_OPTIONS) {
      const option = doc.createElement('option');
      option.value = entry.value;
      option.textContent = entry.label;
      select.append(option);
    }
  }
  const preference = getSpeechLanguagePreference();
  select.value = preference;
  if (select.value !== preference) select.value = 'auto';
}

function refreshVoiceRecognitionLocale() {
  _voiceLocaleCandidates = getRecognitionLocaleCandidates();
  _voiceLocaleIndex = 0;
  if (_voiceRecognition) _voiceRecognition.lang = _voiceLocaleCandidates[0] || getSpeechLocale() || 'en-US';
}

function setSpeechLanguagePreference(value, options = {}) {
  const next = saveVoiceLanguagePreference(value);
  const previous = state.speechLanguagePreference;
  state.speechLanguagePreference = next;
  syncSpeechLanguageSelector();
  refreshVoiceRecognitionLocale();

  const option = getVoiceLanguageOption(next);
  if (next !== 'auto' && option.language && option.language !== 'auto') {
    setChatLanguagePreference(option.language);
    if (options.announce === true) rememberEonAiStructuredSignal('chat-language', option.language, { explicitControlChange: true });
    try { doc.dispatchEvent(new CustomEvent('eon:chat-language-changed', { detail: { lang: option.language, source: 'speech-language' } })); } catch {}
  }
  if (options.announce && previous !== next) {
    void showLocalizedToast(next === 'auto'
      ? 'Speech language set to Auto. Recognition follows your chat or device language.'
      : `Speech language set to ${option.label.replace(/^Voice:\s*/i, '')}. EONBOT replies will follow this language.`, 'success');
  }
  void updateVoiceButtons();
  return next;
}

function getVoiceLocaleTag() {
  const locale = String(getSpeechLocale() || 'en-US').trim();
  return locale || 'en-US';
}

async function getMicrophonePermissionState() {
  try {
    const perms = navigator.permissions;
    if (!perms || typeof perms.query !== 'function') return 'unsupported';
    const result = await perms.query({ name: 'microphone' });
    return String(result?.state || 'unknown');
  } catch {
    return 'unknown';
  }
}

async function detectMicrophoneDevices() {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return { supported: false, hasAudioInput: false, count: 0 };
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((/** @type {any} */ d) => d.kind === 'audioinput');
    return { supported: true, hasAudioInput: audioInputs.length > 0, count: audioInputs.length };
  } catch {
    return { supported: true, hasAudioInput: false, count: 0 };
  }
}

async function ensureMicrophoneAccess() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: 'GET_USER_MEDIA_UNSUPPORTED' };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((/** @type {any} */ t) => t.stop());
    return { ok: true, reason: 'OK' };
  } catch (/** @type {any} */ err) {
    const msg = String(err?.name || err?.message || 'MIC_ACCESS_FAILED').toUpperCase();
    if (msg.includes('NOTALLOWED')) return { ok: false, reason: 'MIC_PERMISSION_DENIED' };
    if (msg.includes('NOTFOUND')) return { ok: false, reason: 'MIC_DEVICE_NOT_FOUND' };
    if (msg.includes('NOTREADABLE')) return { ok: false, reason: 'MIC_DEVICE_BUSY' };
    return { ok: false, reason: 'MIC_ACCESS_FAILED' };
  }
}

function getVoiceDiagnostics(/** @type {any[]} */ languageCodes = []) {
  const list = Array.isArray(languageCodes) && languageCodes.length
    ? languageCodes
    : ['en', 'ar', 'ja', 'hi', 'es'];

  const browserLocales = Array.isArray(navigator.languages) ? navigator.languages : [];
  const recognitionSupported = Boolean(window.SpeechRecognition || appWin.webkitSpeechRecognition);
  const synthesisSupported = Boolean(typeof window !== 'undefined' && 'speechSynthesis' in window);

  const entries = list.map((/** @type {any} */ lang) => {
    const resolvedLocale = resolveSpeechLocale({
      appLanguage: String(lang || ''),
      preferredLanguage: String(lang || ''),
      browserLocales
    });

    const candidates = buildRecognitionLocaleCandidates(resolvedLocale, browserLocales);
    return {
      language: String(lang || ''),
      resolvedLocale,
      candidates,
      recognitionSupported,
      synthesisSupported,
      isRTL: ['ar', 'he', 'ur'].includes(String(lang || '').toLowerCase())
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    browserLocale: String(navigator.language || ''),
    browserLocales,
    recognitionSupported,
    synthesisSupported,
    entries
  };
}

async function runVoiceSelfTest(/** @type {any[]} */ languageCodes = []) {
  const diagnostics = getVoiceDiagnostics(languageCodes);
  const micPermission = await getMicrophonePermissionState();
  const micDevices = await detectMicrophoneDevices();

  const result = {
    ...diagnostics,
    microphone: {
      permission: micPermission,
      enumerateSupported: micDevices.supported,
      hasAudioInput: micDevices.hasAudioInput,
      inputCount: micDevices.count,
      getUserMediaSupported: Boolean(navigator.mediaDevices?.getUserMedia)
    }
  };

  try {
    localStorage.setItem('eon:chat:voice-diagnostics:v1', JSON.stringify(result));
  } catch {}

  return result;
}

function captureVoiceDiagnostics(/** @type {any[]} */ languageCodes = []) {
  const report = getVoiceDiagnostics(languageCodes);
  try {
    localStorage.setItem('eon:chat:voice-diagnostics:v1', JSON.stringify(report));
  } catch {}
  return report;
}

function shouldRateLimitChatLanguagePrompt(/** @type {any} */ lang) {
  const next = String(lang || '').toLowerCase();
  if (!next) return true;
  try {
    const raw = localStorage.getItem(CHAT_LANGUAGE_PROMPT_KEY) || '{}';
    const seen = JSON.parse(raw);
    const ts = Number(seen?.[next] || 0);
    if (Number.isFinite(ts) && Date.now() - ts < 15 * 60 * 1000) return true;
    seen[next] = Date.now();
    localStorage.setItem(CHAT_LANGUAGE_PROMPT_KEY, JSON.stringify(seen));
  } catch {}
  return false;
}

function getChatSurfaceLanguage() {
  return String(resolveChatLanguage() || getCurrentLanguage() || 'en').toLowerCase();
}

function translateChatUi(/** @type {any} */ text, /** @type {any} */ category = 'guide', /** @type {any} */ fromLang = 'en') {
  return translateForUser(text, { fromLang, toLang: getChatSurfaceLanguage(), category });
}

async function translateChatControlUi(/** @type {any} */ text, /** @type {any} */ category = 'guide') {
  let timeoutId;
  try {
    return await Promise.race([
      translateChatUi(text, category),
      new Promise((resolve) => { timeoutId = setTimeout(() => resolve(String(text || '')), 1_500); })
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function showLocalizedToast(/** @type {any} */ text, /** @type {'success'|'error'|'warning'} */ tone = 'success', /** @type {any} */ category = 'guide') {
  try {
    const localized = await translateChatUi(String(text || ''), category);
    showToast(localized, tone);
  } catch {
    showToast(String(text || ''), tone);
  }
}

async function refreshVoiceControlLabels() {
  const voice = getEonbotVoiceCapability();
  const /** @type {any} */ useVoiceBtn = doc.getElementById('chat-voice-toggle');
  const /** @type {any} */ dictateBtn = doc.getElementById('chat-voice-send');
  const /** @type {any} */ ttsBtn = doc.getElementById('chat-tts-toggle');
  const /** @type {any} */ modeBtn = doc.getElementById('chat-voice-mode');

  if (useVoiceBtn) {
    const label = state.voiceConversationActive ? voice.stopVoiceTooltip : voice.useVoiceTooltip;
    useVoiceBtn.title = await translateChatUi(label);
    useVoiceBtn.setAttribute('aria-label', useVoiceBtn.title);
  }
  if (dictateBtn) {
    const label = state.voiceListening && state.voiceSession === 'dictate'
      ? 'Stop Dictate — end microphone now.'
      : voice.dictateTooltip;
    dictateBtn.title = await translateChatUi(label);
    dictateBtn.setAttribute('aria-label', dictateBtn.title);
  }
  if (ttsBtn) {
    ttsBtn.title = state.ttsEnabled
      ? await translateChatUi('Voice output is on')
      : await translateChatUi('Voice output is off');
  }
  if (modeBtn) {
    modeBtn.hidden = true;
    modeBtn.setAttribute('aria-hidden', 'true');
  }
}

function mapMultilingualIntentKeyword(text) {
  return mapEonbotMultilingualRoutingSeed(text);
}

async function toEnglishForRouting(/** @type {any} */ text) {
  const source = String(text || '').trim();
  if (!source) return '';
  const mapped = mapMultilingualIntentKeyword(source);
  if (mapped) return mapped;
  const chatLang = getChatSurfaceLanguage();
  if (!chatLang || chatLang === 'en') return source;
  const looksNonLatin = !/^[\p{ASCII}\s.,!?;:'"()\-_/]+$/u.test(source);
  // An ASCII prompt is already safe for the routing vocabulary. Do not let an
  // optional UI-language translation delay a connected-provider request.
  if (!looksNonLatin) return source;
  try {
    const translated = await translateForUser(source, { fromLang: chatLang, toLang: 'en', category: 'guide' });
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

function normalizeGuideText(/** @type {any} */ text) {
  return text.toLowerCase().trim().replace(/[?!.,]/g, '');
}

async function localizeQuickReplies(/** @type {any} */ quickReplies = [], /** @type {any} */ category = 'guide') {
  const list = Array.isArray(quickReplies) ? quickReplies : [];
  return Promise.all(list.map((/** @type {any} */ reply) => translateChatUi(String(reply || ''), category)));
}

async function localizeToolCTA(/** @type {any} */ toolCTA, /** @type {any} */ category = 'guide') {
  if (!toolCTA) return null;
  return {
    ...toolCTA,
    label: await translateChatUi(String(toolCTA.label || ''), category)
  };
}

async function localizeActionCTA(/** @type {any} */ actionCTA, /** @type {any} */ category = 'guide') {
  if (!actionCTA) return null;
  return {
    ...actionCTA,
    label: await translateChatUi(String(actionCTA.label || ''), category)
  };
}

function sanitizeUiLink(/** @type {any} */ url, /** @type {any} */ fallback = '/') {
  try {
    const parsed = new URL(String(url || ''), window.location.origin);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return fallback;
    }
    return parsed.toString();
  } catch {
    return fallback;
  }
}


function sanitizeCommandReceipt(/** @type {any} */ value) {
  if (!value || typeof value !== 'object') return null;
  const interpretedAs = String(value.interpretedAs || value.commandId || '').trim().replace(/[^a-z0-9-]/gi, '').slice(0, 80);
  let route = '';
  try {
    const parsed = new URL(String(value.route || ''), window.location.origin);
    if (/^https?:$/i.test(parsed.protocol) && parsed.origin === window.location.origin && parsed.pathname.startsWith('/')) {
      // Store a relative internal route only. The receipt layer rejects absolute
      // URLs, which prevents a prepared Chat action from becoming an external
      // tracking or navigation record.
      route = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {}
  const actionType = String(value.actionType || 'navigation').trim().replace(/[^a-z0-9-]/gi, '').slice(0, 48) || 'navigation';
  if (!interpretedAs || !route) return null;
  return {
    interpretedAs,
    route,
    actionType,
    execution: 'prepared-user-tap',
    completed: false,
    externalEffect: false
  };
}


function sanitizeCommandProposal(/** @type {any} */ value) {
  if (!value || typeof value !== 'object') return null;
  const actionId = String(value.actionId || '').trim().replace(/[^a-z0-9-]/gi, '').slice(0, 80);
  let route = '';
  try {
    const parsed = new URL(String(value.route || ''), window.location.origin);
    if (/^https?:$/i.test(parsed.protocol) && parsed.origin === window.location.origin && parsed.pathname.startsWith('/')) {
      route = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {}
  if (!actionId || !route) return null;
  return {
    schema: 'eon.eonbot.action-proposal.v1',
    actionId,
    actionType: String(value.actionType || 'navigation').trim().replace(/[^a-z0-9-]/gi, '').slice(0, 48) || 'navigation',
    route,
    label: String(value.label || actionId).replace(/\r?\n/g, ' ').trim().slice(0, 120),
    reviewLabel: String(value.reviewLabel || 'Review action').replace(/\r?\n/g, ' ').trim().slice(0, 120),
    expiresInMs: Math.min(30 * 60 * 1000, Math.max(60 * 1000, Number(value.expiresInMs) || 10 * 60 * 1000)),
    sensitive: Boolean(value.sensitive),
    requiresPermission: Boolean(value.requiresPermission),
    requiresDeviceReview: Boolean(value.requiresDeviceReview),
    vaultReturnContext: Boolean(value.vaultReturnContext)
  };
}

function getCurrentChatReturnRoute() {
  return state.activeThreadId ? getChatThreadQuery(state.activeThreadId) : '/';
}

function renderCommandProposalReview(/** @type {any} */ host, /** @type {any} */ proposalTemplate, /** @type {any} */ commandReceipt) {
  if (!host || !proposalTemplate || !commandReceipt) return;
  const existing = host.querySelector('[data-eonbot-proposal-card]');
  if (existing) return;
  const created = createEonbotActionProposal(commandReceipt, { returnRoute: getCurrentChatReturnRoute() });
  const card = document.createElement('section');
  card.className = 'msg-command-receipt';
  card.dataset.eonbotProposalCard = '1';
  card.setAttribute('aria-live', 'polite');
  if (!created.ok || !created.proposal) {
    card.textContent = 'This action could not be prepared safely. Nothing was opened.';
    host.appendChild(card);
    return;
  }
  const proposal = created.proposal;
  const title = document.createElement('strong');
  title.textContent = `Review: ${proposal.label}`;
  const summary = document.createElement('p');
  summary.textContent = `EONBOT has not opened anything. This local proposal expires after 10 minutes unless you confirm it.`;
  const detail = document.createElement('p');
  detail.textContent = proposal.sensitive
    ? 'Vault is the only place for provider keys or other sensitive settings. Do not paste secrets into Chat.'
    : proposal.requiresPermission
      ? 'The destination keeps its own browser permission boundary.'
      : 'The destination keeps its own device suitability boundary.';
  const actions = document.createElement('div');
  actions.className = 'msg-quick-replies';
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'quick-chip';
  cancel.textContent = 'Cancel';
  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'msg-action-cta';
  confirm.textContent = `Confirm and open ${proposal.label}`;
  const status = document.createElement('p');
  status.className = 'msg-command-receipt';
  status.textContent = 'Awaiting your separate confirmation.';
  cancel.addEventListener('click', () => {
    const result = cancelEonbotActionProposal(proposal.id);
    confirm.disabled = true;
    cancel.disabled = true;
    status.textContent = result.ok ? 'Cancelled. Nothing was opened.' : 'This proposal can no longer be cancelled because it is no longer active.';
  });
  confirm.addEventListener('click', () => {
    const approved = approveEonbotActionProposal(proposal.id);
    if (!approved.ok || !approved.navigation?.route) {
      confirm.disabled = true;
      cancel.disabled = true;
      status.textContent = approved.reason === 'proposal-expired'
        ? 'This proposal expired before confirmation. Nothing was opened.'
        : 'This action could not be confirmed safely. Nothing was opened.';
      return;
    }
    const tap = recordEonbotActionTap({ ...commandReceipt, proposalId: proposal.id });
    if (!tap.ok) {
      failEonbotActionProposal(proposal.id, 'receipt-write-failed');
      confirm.disabled = true;
      cancel.disabled = true;
      status.textContent = 'This action could not be confirmed safely. Nothing was opened.';
      return;
    }
    confirm.disabled = true;
    cancel.disabled = true;
    status.textContent = 'Confirmed locally. Opening the destination now…';
    try {
      window.location.assign(approved.navigation.route);
    } catch {
      failEonbotActionProposal(proposal.id, 'local-navigation-failed');
      status.textContent = 'The destination could not open. The proposal is recorded as failed; nothing else ran.';
    }
  });
  actions.append(cancel, confirm);
  card.append(title, summary, detail, actions, status);
  host.appendChild(card);
}


function renderLocalActionCardReview(/** @type {any} */ host, /** @type {any} */ plan) {
  if (!host || !plan?.matched || !Array.isArray(plan.cards) || !plan.cards.length) return;
  const existing = host.querySelector('[data-eonbot-local-action-cards]');
  if (existing) return;
  const card = document.createElement('section');
  card.className = 'msg-command-receipt';
  card.dataset.eonbotLocalActionCards = '1';
  card.setAttribute('aria-live', 'polite');
  const title = document.createElement('strong');
  title.textContent = 'Local action plan · review required';
  const summary = document.createElement('p');
  summary.textContent = String(plan.summary || 'This is a local planning view only.');
  const list = document.createElement('ul');
  for (const template of plan.cards.slice(0, 6)) {
    const item = document.createElement('li');
    item.textContent = `${String(template.title || 'Review item')}: ${String(template.summary || 'No external action is available.')}`;
    list.appendChild(item);
  }
  const detail = document.createElement('p');
  detail.textContent = 'Saving this plan creates local Review Inbox records only. It does not connect an account, initiate OAuth, call a provider, create a server Action Packet, run a job, schedule, publish, send, deploy, or change Cloudflare.';
  const actions = document.createElement('div');
  actions.className = 'msg-quick-replies';
  const save = document.createElement('button');
  save.type = 'button';
  save.className = 'msg-action-cta';
  save.textContent = 'Save to local Review Inbox';
  const workspace = document.createElement('a');
  workspace.className = 'msg-tool-cta';
  workspace.href = '/workspace';
  workspace.textContent = 'Open advanced review';
  const status = document.createElement('p');
  status.className = 'msg-command-receipt';
  status.textContent = 'Not saved yet. Nothing has started.';
  save.addEventListener('click', () => {
    const result = createEonbotLocalActionCards(plan);
    save.disabled = true;
    status.textContent = result.ok
      ? `${result.cards.length} local review item${result.cards.length === 1 ? '' : 's'} saved. Nothing else started.`
      : 'The local Review Inbox could not be written. Nothing has started.';
  });
  actions.append(save, workspace);
  card.append(title, summary, list, detail, actions, status);
  host.appendChild(card);
}

function scrollToBottom(/** @type {any} */ smooth = true) {
  const dom = getDom();
  dom.messages?.scrollTo({ top: dom.messages.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
}

function hasCurrentVoiceConversationConsent() {
  if (!state.voiceConsentToken) return false;
  return readVoiceConversationConsent({ token: state.voiceConsentToken }).ok === true;
}

function scheduleNextVoiceTurn() {
  if (!state.voiceConversationActive || !hasCurrentVoiceConversationConsent() || state.pending || state.voiceAwaitingReply) return;
  window.setTimeout(() => {
    if (!state.voiceConversationActive || !hasCurrentVoiceConversationConsent() || state.pending || state.voiceAwaitingReply || state.voiceListening) return;
    startVoiceInput('voice', { explicitUserAction: false });
  }, 180);
}

function speakReply(/** @type {any} */ text, /** @type {any} */ options = {}) {
  const voiceConversation = options.voiceConversation === true;
  if (!state.ttsEnabled && !voiceConversation) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (voiceConversation) scheduleNextVoiceTurn();
    return;
  }
  if (!voiceConversation && !navigator.userActivation?.isActive) return;
  const spoken = String(text || '').trim().slice(0, 420);
  if (!spoken) {
    if (voiceConversation) scheduleNextVoiceTurn();
    return;
  }
  try {
    setEonbotEmotion('speaking');
    window.speechSynthesis.cancel();
    const SpeechUtteranceCtor = window.SpeechSynthesisUtterance;
    if (typeof SpeechUtteranceCtor !== 'function') {
      if (voiceConversation) scheduleNextVoiceTurn();
      return;
    }
    const utter = new SpeechUtteranceCtor(spoken);
    applySpeechVoice(utter, getSpeechLocale());
    utter.rate = 1;
    utter.pitch = 1;
    utter.onend = () => {
      refreshEonbotEmotion();
      if (voiceConversation) scheduleNextVoiceTurn();
    };
    utter.onerror = () => {
      refreshEonbotEmotion();
      if (voiceConversation) scheduleNextVoiceTurn();
    };
    window.speechSynthesis.speak(utter);
  } catch {
    if (voiceConversation) scheduleNextVoiceTurn();
  }
}

function setVoiceRouteStatus(text = '') {
  const node = doc.querySelector('[data-eon-voice-route]');
  if (!node) return;
  node.textContent = String(text || '');
  node.hidden = !text;
}

async function updateVoiceButtons() {
  const voice = getEonbotVoiceCapability();
  const unavailableText = voice.reason || 'Voice is unavailable in this browser. You can keep typing.';
  const /** @type {any} */ useVoiceBtn = doc.getElementById('chat-voice-toggle');
  const /** @type {any} */ dictateBtn = doc.getElementById('chat-voice-send');
  const /** @type {any} */ ttsBtn = doc.getElementById('chat-tts-toggle');
  const /** @type {any} */ modeBtn = doc.getElementById('chat-voice-mode');

  if (useVoiceBtn) {
    useVoiceBtn.hidden = !voice.showUseVoice;
    useVoiceBtn.disabled = !voice.voiceReady && !state.voiceConversationActive;
    useVoiceBtn.classList.toggle('is-listening', state.voiceConversationActive);
    useVoiceBtn.classList.toggle('is-unavailable', !voice.voiceReady && !state.voiceConversationActive);
    useVoiceBtn.setAttribute('aria-pressed', state.voiceConversationActive ? 'true' : 'false');
    useVoiceBtn.setAttribute('aria-disabled', useVoiceBtn.disabled ? 'true' : 'false');
    useVoiceBtn.textContent = state.voiceConversationActive ? '■' : '◉';
  }
  if (dictateBtn) {
    dictateBtn.hidden = !voice.showDictate;
    dictateBtn.disabled = !voice.dictationReady;
    dictateBtn.classList.toggle('is-listening', state.voiceListening && state.voiceSession === 'dictate');
    dictateBtn.classList.toggle('is-unavailable', !voice.dictationReady);
    dictateBtn.setAttribute('aria-pressed', state.voiceListening && state.voiceSession === 'dictate' ? 'true' : 'false');
    dictateBtn.setAttribute('aria-disabled', dictateBtn.disabled ? 'true' : 'false');
  }
  const speechLanguageWrap = doc.getElementById('chat-speech-language-wrap');
  if (speechLanguageWrap) {
    speechLanguageWrap.hidden = true;
    speechLanguageWrap.classList.toggle('is-unavailable', !voice.dictationReady);
    speechLanguageWrap.title = 'Speech language is managed in Profile → Voice & language';
  }
  const speechLanguageSelect = /** @type {HTMLSelectElement|null} */ (doc.getElementById('chat-speech-language'));
  if (speechLanguageSelect) {
    speechLanguageSelect.disabled = !voice.dictationReady;
    syncSpeechLanguageSelector();
  }
  const speechSupportNote = doc.getElementById('chat-speech-support-note');
  if (speechSupportNote) {
    const show = voice.activeAi && !voice.dictationReady;
    speechSupportNote.hidden = !show;
    speechSupportNote.textContent = show ? unavailableText : '';
  }
  if (ttsBtn) {
    ttsBtn.hidden = !voice.showVoiceOutputToggle;
    ttsBtn.disabled = !voice.showVoiceOutputToggle;
    ttsBtn.classList.toggle('is-muted', !state.ttsEnabled);
    ttsBtn.setAttribute('aria-pressed', state.ttsEnabled ? 'true' : 'false');
    ttsBtn.textContent = state.ttsEnabled ? '🔊' : '🔈';
  }
  if (modeBtn) {
    modeBtn.hidden = true;
    modeBtn.setAttribute('aria-hidden', 'true');
  }
  setVoiceRouteStatus(voice.activeAi ? `${voice.routeLabel} · ${voice.privacyNote}` : '');
  await refreshVoiceControlLabels();
}

function stopVoiceInput({ keepConversation = false } = {}) {
  state.voiceListening = false;
  state.voiceSession = 'idle';
  if (!keepConversation) state.voiceAwaitingReply = false;
  try { _voiceRecognition?.stop(); } catch {}
  void updateVoiceButtons();
}

function stopVoiceConversation({ announce = false } = {}) {
  state.voiceConversationActive = false;
  state.voiceAwaitingReply = false;
  state.continuousVoice = false;
  state.voiceConsentToken = '';
  clearVoiceConversationConsent();
  stopVoiceInput();
  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch {}
  }
  if (announce) void showLocalizedToast('Voice stopped. Microphone, automatic sending and spoken output are off.', 'success');
  refreshEonbotEmotion();
}

function closeVoiceConversationReview() {
  const dialog = doc.querySelector('[data-eon-voice-review]');
  try { dialog?.close?.(); } catch { dialog?.removeAttribute?.('open'); }
}

function openVoiceConversationReview() {
  const voice = getEonbotVoiceCapability();
  if (!voice.voiceReady) {
    void showLocalizedToast(voice.reason, 'error');
    return;
  }
  if (state.voiceConversationActive) {
    stopVoiceConversation({ announce: true });
    return;
  }
  const dialog = doc.querySelector('[data-eon-voice-review]');
  if (!dialog) {
    void showLocalizedToast('Voice Conversation review is unavailable. Use Dictate to review text before sending.', 'error');
    return;
  }
  const review = buildVoiceConversationReview({ locale: getSpeechLocale(), routeLabel: voice.routeLabel, browserAssisted: voice.browserAssisted });
  const route = dialog.querySelector('[data-eon-voice-review-route]');
  const privacy = dialog.querySelector('[data-eon-voice-review-privacy]');
  const acknowledgement = dialog.querySelector('[data-eon-voice-review-ack]');
  const start = dialog.querySelector('[data-eon-voice-review-start]');
  if (route) route.textContent = `${review.routeLabel} · ${review.locale}`;
  if (privacy) privacy.textContent = review.privacy;
  if (acknowledgement) acknowledgement.checked = false;
  if (start) start.disabled = true;
  try { dialog.showModal?.(); } catch { dialog.setAttribute('open', ''); }
}

function confirmVoiceConversationStart() {
  const voice = getEonbotVoiceCapability();
  const acknowledgement = doc.querySelector('[data-eon-voice-review-ack]');
  const consent = grantVoiceConversationConsent({
    explicitUserAction: true,
    autoSendAcknowledged: acknowledgement?.checked === true,
    continuousListeningAcknowledged: acknowledgement?.checked === true,
    locale: getSpeechLocale(),
    routeLabel: voice.routeLabel
  });
  if (!consent.ok) {
    void showLocalizedToast('Review and accept the Voice Conversation disclosures before starting.', 'error');
    return;
  }
  closeVoiceConversationReview();
  state.voiceConsentToken = consent.token;
  state.voiceConversationActive = true;
  state.voiceAwaitingReply = false;
  state.continuousVoice = true;
  const preferences = setEonbotInteractionPreferences({ voiceOutputEnabled: true, continuousVoiceEnabled: false });
  state.ttsEnabled = preferences.voiceOutputEnabled;
  void showLocalizedToast('Voice Conversation (Beta) started. Final spoken turns send automatically until you tap Stop.', 'success');
  startVoiceInput('voice', { explicitUserAction: true });
}

function startVoiceInput(session = 'dictate', { explicitUserAction = false } = {}) {
  const voice = getEonbotVoiceCapability();
  const sessionKind = session === 'voice' ? 'voice' : 'dictate';
  const authority = authorizeVoiceInput({
    mode: sessionKind,
    explicitUserAction,
    consentToken: state.voiceConsentToken
  });
  if (!authority.ok) {
    if (sessionKind === 'voice') stopVoiceConversation();
    void showLocalizedToast(sessionKind === 'dictate'
      ? 'Tap Dictate to start the microphone. Typed input remains available.'
      : 'Voice Conversation consent expired. Review the Beta disclosures again or use Dictate.', 'error');
    return;
  }
  const allowed = sessionKind === 'voice' ? voice.voiceReady : voice.dictationReady;
  if (!allowed) {
    void showLocalizedToast(voice.reason, 'error');
    return;
  }
  const SpeechRecognition = window.SpeechRecognition || appWin.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    void showLocalizedToast('Browser speech is not supported here. You can keep typing, or try a supported full browser.', 'error');
    return;
  }

  void (async () => {
    const permission = await getMicrophonePermissionState();
    if (permission === 'denied') {
      void showLocalizedToast('Microphone permission is blocked. Enable mic access in browser settings.', 'error');
      if (sessionKind === 'voice') stopVoiceConversation();
      return;
    }

    const access = await ensureMicrophoneAccess();
    if (!access.ok) {
      if (access.reason === 'MIC_PERMISSION_DENIED') {
        void showLocalizedToast('Microphone permission denied. Please allow access and retry.', 'error');
      } else if (access.reason === 'MIC_DEVICE_NOT_FOUND') {
        void showLocalizedToast('No microphone device detected on this system.', 'error');
      } else if (access.reason === 'MIC_DEVICE_BUSY') {
        void showLocalizedToast('Microphone appears busy in another app. Close other capture apps and retry.', 'error');
      } else if (access.reason !== 'GET_USER_MEDIA_UNSUPPORTED') {
        void showLocalizedToast('Could not access microphone. Check browser permissions.', 'error');
      }
      if (sessionKind === 'voice') stopVoiceConversation();
      if (access.reason !== 'GET_USER_MEDIA_UNSUPPORTED') return;
    }

    if (!_voiceRecognition) {
      _voiceRecognition = new SpeechRecognition();
      _voiceRecognition.maxAlternatives = 1;
      _voiceRecognition.onresult = ((/** @type {any} */ event) => {
        const dom = getDom();
        let finalText = '';
        let interim = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const transcript = String(event?.results?.[index]?.[0]?.transcript || '').trim();
          if (!transcript) continue;
          if (event.results[index].isFinal) finalText = `${finalText} ${transcript}`.trim();
          else interim = transcript;
        }
        if (dom.input && interim) dom.input.value = interim;
        if (!finalText) return;
        if (dom.input) dom.input.value = finalText;
        if (state.voiceSession === 'voice' && state.voiceConversationActive) {
          const sendAuthority = authorizeVoiceInput({ mode: 'voice', consentToken: state.voiceConsentToken });
          if (!sendAuthority.ok || !sendAuthority.autoSend) {
            stopVoiceConversation();
            void showLocalizedToast('Voice Conversation consent expired. The transcript remains editable and was not sent.', 'error');
            return;
          }
          state.voiceAwaitingReply = true;
          stopVoiceInput({ keepConversation: true });
          void handleSend(finalText, {
            speech: { locale: String(_voiceRecognition?.lang || getSpeechLocale()), preference: getSpeechLanguagePreference(), interaction: 'voice-conversation-beta', autoSendDisclosed: true }
          });
          return;
        }
        // Dictate is deliberately editable-first. It never sends text by itself.
        stopVoiceInput();
        void showLocalizedToast('Dictation ready to edit. Press Send when you are happy with it.', 'success');
      });

      _voiceRecognition.onerror = ((/** @type {any} */ event) => {
        const errCode = String(event?.error || 'unknown');
        const canRetryLocale = _voiceLocaleIndex < _voiceLocaleCandidates.length - 1;
        if (canRetryLocale && state.voiceSession !== 'idle') {
          _voiceLocaleIndex += 1;
          _voiceRecognition.lang = _voiceLocaleCandidates[_voiceLocaleIndex];
          void showLocalizedToast(`Voice retry with locale ${_voiceRecognition.lang}.`, 'success');
          try {
            _voiceRecognition.start();
            return;
          } catch {}
        }
        if (errCode === 'not-allowed' || errCode === 'service-not-allowed') {
          void showLocalizedToast('Microphone permission denied by browser.', 'error');
        } else if (errCode === 'audio-capture') {
          void showLocalizedToast('No working microphone input detected.', 'error');
        } else if (errCode === 'language-not-supported') {
          void showLocalizedToast('Your preferred speech locale is not supported. Choose another language in Profile → Voice & language.', 'error');
        } else if (errCode === 'network') {
          void showLocalizedToast('Browser speech recognition needs a network connection here. Keep typing or retry in a supported browser.', 'error');
        } else if (errCode === 'no-speech') {
          void showLocalizedToast('No speech detected. Tap Dictate and speak clearly.', 'error');
        } else if (errCode !== 'aborted') {
          void showLocalizedToast(`Voice error: ${errCode}. Try refreshing or using a different browser.`, 'error');
        }
        const wasConversation = state.voiceSession === 'voice' || state.voiceConversationActive;
        stopVoiceInput();
        if (wasConversation) stopVoiceConversation();
      });

      _voiceRecognition.onend = () => {
        state.voiceListening = false;
        if (state.voiceConversationActive && !hasCurrentVoiceConversationConsent()) {
          stopVoiceConversation();
          void showLocalizedToast('Voice Conversation consent expired. Microphone and automatic sending are off.', 'error');
          return;
        }
        void updateVoiceButtons();
      };
    }

    try {
      refreshVoiceRecognitionLocale();
      _voiceRecognition.lang = _voiceLocaleCandidates[_voiceLocaleIndex] || getSpeechLocale() || 'en-US';
      _voiceRecognition.interimResults = sessionKind === 'voice';
      _voiceRecognition.continuous = false;
      state.voiceSession = sessionKind;
      state.voiceListening = true;
      state.voiceAwaitingReply = false;
      void updateVoiceButtons();
      _voiceRecognition.start();
    } catch (/** @type {any} */ startErr) {
      const msg = String((/** @type {Error} */ (startErr))?.message || '');
      stopVoiceInput();
      if (sessionKind === 'voice') stopVoiceConversation();
      if (msg.toLowerCase().includes('already started')) {
        void showLocalizedToast('Voice is already listening.', 'error');
      } else {
        void showLocalizedToast('Could not start voice input. Check microphone permissions and try again.', 'error');
      }
    }
  })();
}

function initVoiceControls() {
  syncSpeechLanguageSelector();
  doc.getElementById('chat-speech-language')?.addEventListener('change', (event) => {
    const next = setSpeechLanguagePreference(event?.target?.value || 'auto', { announce: true });
    if (event?.target) event.target.value = next;
  });

  doc.getElementById('chat-voice-toggle')?.addEventListener('click', () => {
    openVoiceConversationReview();
  });

  const voiceReview = doc.querySelector('[data-eon-voice-review]');
  const voiceReviewAck = voiceReview?.querySelector?.('[data-eon-voice-review-ack]');
  const voiceReviewStart = voiceReview?.querySelector?.('[data-eon-voice-review-start]');
  voiceReviewAck?.addEventListener('change', () => { voiceReviewStart.disabled = voiceReviewAck.checked !== true; });
  voiceReviewStart?.addEventListener('click', confirmVoiceConversationStart);
  voiceReview?.querySelectorAll?.('[data-eon-voice-review-cancel]')?.forEach?.((button) => button.addEventListener('click', closeVoiceConversationReview));
  voiceReview?.addEventListener('cancel', () => closeVoiceConversationReview());

  doc.getElementById('chat-voice-send')?.addEventListener('click', () => {
    if (state.voiceListening && state.voiceSession === 'dictate') stopVoiceInput();
    else startVoiceInput('dictate', { explicitUserAction: true });
  });

  doc.getElementById('chat-tts-toggle')?.addEventListener('click', () => {
    const next = setEonbotInteractionPreferences({ voiceOutputEnabled: !state.ttsEnabled });
    state.ttsEnabled = next.voiceOutputEnabled;
    if (!state.ttsEnabled && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    void updateVoiceButtons();
  });

  window.addEventListener('pagehide', () => stopVoiceConversation());
  window.addEventListener('beforeunload', () => stopVoiceConversation());

  doc.addEventListener('language-changed', () => {
    if (_voiceRecognition) {
      refreshVoiceRecognitionLocale();
      _voiceRecognition.lang = _voiceLocaleCandidates[_voiceLocaleIndex] || getSpeechLocale() || 'en-US';
    }
    void updateVoiceButtons();
  });

  doc.addEventListener('eon:chat-language-changed', () => {
    if (_voiceRecognition) {
      refreshVoiceRecognitionLocale();
      _voiceRecognition.lang = _voiceLocaleCandidates[_voiceLocaleIndex] || getSpeechLocale() || 'en-US';
    }
    void updateVoiceButtons();
  });

  void updateVoiceButtons();
}

function runAction(/** @type {any} */ action) {
  if (action === 'copyInvite') {
    void (async () => {
      const url = await generateInviteLink(ensureProfile(), { source: 'chat-action', destination: '/' });
      copyToClipboard(url);
    })().catch(() => showToast('Could not create a signed invite link.', 'error'));
    return;
  }
  if (action === 'openLocalAi') {
    appWin.location.assign('/local-ai');
    return;
  }
  if (action === 'openSecureProviderSetup') {
    appWin.location.assign(CANONICAL_AI_KEYS_PATH);
    return;
  }
  if (action === 'secretProtected') {
    void showLocalizedToast('No sensitive value was sent or saved in chat.', 'success');
    return;
  }
  if (action === 'startVoice') {
    focusProviderSetup();
    openVoiceConversationReview();
    return;
  }
  if (action === 'detectLocal') {
    appWin.location.assign('/local-ai#eonbot-local-ai-setup');
    return;
  }
  if (String(action || '').startsWith('setupProvider:')) {
    const providerId = String(action).split(':')[1] || '';
    if (!providerId) return;
    if (providerId === 'browserlocal' || providerId === 'ollama' || providerId === 'lmstudio' || providerId === 'jan') {
      appWin.location.assign('/local-ai#eonbot-local-ai-setup');
      return;
    }
    applyProviderPreset(providerId);
    void showLocalizedToast(`${providerLabel(providerId)} was selected. Credentials are managed securely in Vault, never in chat.`, 'success');
    appWin.location.assign(CANONICAL_AI_KEYS_PATH);
    return;
  }
  if (String(action || '').startsWith('switchLang:')) {
    const next = String(action).split(':')[1] || '';
    if (!next) return;
    try {
      localStorage.setItem('eon:lang:preference:v1', next);
      localStorage.setItem('eon:lang:v1', next);
    } catch {}
    setChatLanguagePreference(next);
    rememberEonAiStructuredSignal('chat-language', next, { explicitControlChange: true });
    doc.dispatchEvent(new CustomEvent('eon:set-language', { detail: { lang: next } }));
    doc.dispatchEvent(new CustomEvent('eon:chat-language-changed', { detail: { lang: next, source: 'switchLang' } }));
    void showLocalizedToast(`Language switched to ${next.toUpperCase()}`, 'success');
    return;
  }
  if (String(action || '').startsWith('followChatLanguage:')) {
    const next = String(action).split(':')[1] || '';
    if (!next) return;
    setChatLanguagePreference(next);
    rememberEonAiStructuredSignal('chat-language', next, { explicitControlChange: true });
    doc.dispatchEvent(new CustomEvent('eon:chat-language-changed', { detail: { lang: next, source: 'followChatLanguage' } }));
    void showLocalizedToast(`Chat language set to ${next.toUpperCase()}`, 'success');
    return;
  }
  void showLocalizedToast('That action is not ready yet.', 'error');
}

function shouldPromptLanguageSwitchForText(/** @type {any} */ text) {
  const detected = String(detectLikelyLanguageFromText(text) || '').toLowerCase();
  if (!detected || detected === 'en') return null;
  const current = String(resolveChatLanguage() || getCurrentLanguage() || 'en').toLowerCase();
  if (detected === current) return null;
  return detected;
}

function stripAttachmentControlCharacters(value) {
  return Array.from(String(value || '')).filter((character) => {
    const code = character.charCodeAt(0);
    return code >= 32 && code !== 127;
  }).join('');
}

function normalizeChatAttachments(rows = []) {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, 8).map((entry) => ({
    id: String(entry?.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80),
    name: stripAttachmentControlCharacters(entry?.name || 'Local file').replace(/[\\/]+/g, '-').trim().slice(0, 140) || 'Local file',
    type: String(entry?.type || '').slice(0, 120),
    kind: ['text', 'image', 'pdf', 'audio', 'video', 'office', 'document'].includes(String(entry?.kind || '')) ? String(entry.kind) : 'document',
    viewerKind: ['text', 'markdown', 'code', 'json', 'table', 'image', 'pdf', 'audio', 'video', 'office-metadata', 'document-metadata'].includes(String(entry?.viewerKind || '')) ? String(entry.viewerKind) : 'document-metadata',
    size: Math.max(0, Math.min(12 * 1024 * 1024, Number(entry?.size || 0) || 0)),
    textIncluded: entry?.textIncluded === true
  })).filter((entry) => entry.id && entry.name);
}

function formatChatAttachmentBytes(value) {
  const bytes = Math.max(0, Number(value || 0));
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderChatAttachments(wrap, attachments = []) {
  const safeAttachments = normalizeChatAttachments(attachments);
  if (!safeAttachments.length) return;
  const list = document.createElement('div');
  list.className = 'msg-local-attachments';
  safeAttachments.forEach((attachment) => {
    const item = document.createElement('span');
    const capability = attachment.kind === 'text' && attachment.textIncluded
      ? 'text included'
      : attachment.kind === 'image'
        ? 'image local preview'
        : attachment.kind === 'pdf'
          ? 'PDF local preview'
          : attachment.kind === 'audio' || attachment.kind === 'video'
            ? 'media local preview'
            : attachment.kind === 'office'
              ? 'metadata only'
              : 'document local';
    item.textContent = `${attachment.name} · ${formatChatAttachmentBytes(attachment.size)} · ${capability}`;
    item.title = item.textContent;
    list.appendChild(item);
  });
  wrap.appendChild(list);
}

function emitChatThreadChange() {
  try { window.dispatchEvent(new CustomEvent('eon:chat-threads-changed', { detail: { activeThreadId: state.activeThreadId } })); } catch {}
}

function saveConversation() {
  const safeConversation = state.conversation.slice(-80);
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(safeConversation));
  } catch {}
  if (!state.activeThreadId) {
    const resolved = resolveChatThread({ search: window.location.search });
    state.activeThreadId = resolved.thread.id;
  }
  updateChatThreadMessages(state.activeThreadId, safeConversation);
  emitChatThreadChange();
}

function renderEmptyChatState() {
  const dom = getDom();
  if (!dom.messages) return;
  if (document.body.classList.contains('eonbot-home')) {
    dom.messages.innerHTML = `<section class="eonbot-home-welcome" data-eonbot-home-welcome>
      <p class="eonbot-home-kicker">EONAPP</p>
      <h2>What would you like to make?</h2>
      <p>Start with a message. EONBOT can guide the next step, open a project, or help you create something useful.</p>
      <div class="eonbot-home-suggestions" aria-label="Suggested ways to start">
        <button type="button" data-eonbot-home-prompt="Help me plan a project">Plan a project</button>
        <button type="button" data-eonbot-home-prompt="Help me build a website">Build a website</button>
        <button type="button" data-eonbot-home-prompt="Help me create visual ideas for a campaign">Create visuals</button>
        <button type="button" data-eonbot-home-prompt="Help me research an idea">Research an idea</button>
      </div>
    </section>`;
    window.dispatchEvent(new CustomEvent('eonbot:home-welcome-rendered'));
    return;
  }
  dom.messages.innerHTML = '<p class="eon-chat-welcome">What would you like to work on?</p>';
}

function updateChatThreadUrl(threadId = '') {
  try { window.history.replaceState({}, '', getChatThreadQuery(threadId)); } catch {}
}

function startNewChatThread(options = {}) {
  const thread = createNewChatThread();
  state.activeThreadId = thread.id;
  state.conversation = [];
  updateChatThreadUrl(thread.id);
  renderEmptyChatState();
  emitChatThreadChange();
  if (options.focus) requestAnimationFrame(() => getDom().input?.focus());
  return thread;
}

function renameCurrentChatThread() {
  if (!state.activeThreadId) return;
  const currentTitle = state.conversation.find((entry) => entry.role === 'user')?.text || 'New chat';
  const title = window.prompt('Rename chat', currentTitle.slice(0, 72));
  if (title && renameChatThread(state.activeThreadId, title)) emitChatThreadChange();
}

function deleteCurrentChatThread() {
  if (!state.activeThreadId) return;
  if (!window.confirm('Delete this local chat from this browser? This cannot be undone.')) return;
  const result = deleteChatThread(state.activeThreadId);
  emitChatThreadChange();
  window.location.assign(result.nextThread ? getChatThreadQuery(result.nextThread.id) : '/?new=1');
}

function safeAiSourceUrl(value = '') {
  try {
    const parsed = new URL(String(value || '').trim());
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) return '';
    parsed.hash = '';
    return parsed.toString().slice(0, 1000);
  } catch {
    return '';
  }
}

function sanitizeAiSourceEntry(value = {}, index = 0) {
  const item = value && typeof value === 'object' ? value : {};
  const url = safeAiSourceUrl(item.url || item.link || '');
  const title = Array.from(String(item.title || item.name || '')).filter((character) => { const code = character.charCodeAt(0); return code > 31 && code !== 127; }).join('').trim().slice(0, 240);
  if (!url && !title) return null;
  return { index: Math.max(1, Number(item.index) || index + 1), title, url };
}

function sanitizeLocalConnectionReceipt(value = {}) {
  const receipt = value && typeof value === 'object' ? value : {};
  if (!receipt.schema) return null;
  return {
    schema: String(receipt.schema).slice(0, 120),
    runtimeId: String(receipt.runtimeId || '').slice(0, 40),
    transport: String(receipt.transport || '').slice(0, 60),
    endpointClass: String(receipt.endpointClass || '').slice(0, 80),
    path: String(receipt.path || '').slice(0, 120),
    authenticated: Boolean(receipt.authenticated),
    status: Math.max(0, Number(receipt.status) || 0),
    ok: Boolean(receipt.ok),
    localityState: String(receipt.localityState || 'unverified').slice(0, 80),
    offlineProofRequested: Boolean(receipt.offlineProofRequested),
    browserReportedOffline: Boolean(receipt.browserReportedOffline),
    elapsedMs: Math.max(0, Number(receipt.elapsedMs) || 0),
    error: String(receipt.error || '').slice(0, 120),
    containsCredential: false,
    containsPrompt: false,
    containsReply: false
  };
}

function sanitizeAiMessageMeta(value = {}) {
  const meta = value && typeof value === 'object' ? value : {};
  const provenance = meta.provenanceReceipt && typeof meta.provenanceReceipt === 'object' ? meta.provenanceReceipt : {};
  const search = provenance.search && typeof provenance.search === 'object' ? provenance.search : {};
  const usage = provenance.usage && typeof provenance.usage === 'object' ? provenance.usage : {};
  const cost = provenance.cost && typeof provenance.cost === 'object' ? provenance.cost : {};
  const context = provenance.context && typeof provenance.context === 'object' ? provenance.context : {};
  const attachments = context.attachments && typeof context.attachments === 'object' ? context.attachments : {};
  const citations = (Array.isArray(search.citations) ? search.citations : []).map(sanitizeAiSourceEntry).filter(Boolean).slice(0, 20);
  const searchResults = (Array.isArray(search.searchResults) ? search.searchResults : []).map(sanitizeAiSourceEntry).filter(Boolean).slice(0, 20);
  const requestReceipt = meta.requestReceipt && typeof meta.requestReceipt === 'object' ? meta.requestReceipt : {};
  return {
    provider: String(meta.provider || '').slice(0, 64),
    providerId: String(meta.providerId || '').slice(0, 80),
    model: String(meta.model || '').slice(0, 180),
    taskType: String(meta.taskType || 'chat').trim().toLowerCase().slice(0, 64),
    local: Boolean(meta.local),
    monetization: meta.monetization && typeof meta.monetization === 'object' && meta.monetization.sponsored === true ? {
      sponsored: true,
      provider: String(meta.monetization.provider || '').slice(0, 40),
      label: String(meta.monetization.label || 'Ad-supported').slice(0, 64)
    } : null,
    elapsedMs: Number.isFinite(Number(meta.elapsedMs)) ? Math.max(0, Math.round(Number(meta.elapsedMs))) : null,
    localConnectionReceipt: sanitizeLocalConnectionReceipt(meta.localConnectionReceipt),
    requestReceipt: requestReceipt.requestId ? {
      requestId: String(requestReceipt.requestId).slice(0, 160),
      state: String(requestReceipt.state || '').slice(0, 40),
      attemptCount: Math.max(0, Number(requestReceipt.attemptCount) || 0),
      fallbackAttempted: false
    } : null,
    provenanceReceipt: provenance.schema ? {
      schema: String(provenance.schema).slice(0, 120),
      context: {
        historyRequested: Math.max(0, Number(context.historyRequested) || 0),
        historyIncluded: Math.max(0, Number(context.historyIncluded) || 0),
        historyOmitted: Math.max(0, Number(context.historyOmitted) || 0),
        attachments: {
          total: Math.max(0, Number(attachments.total) || 0),
          includedText: Math.max(0, Number(attachments.includedText) || 0),
          omitted: Math.max(0, Number(attachments.omitted) || 0)
        },
        clientResearchSources: Math.max(0, Number(context.clientResearchSources) || 0),
        forgeIsolation: Boolean(context.forgeIsolation)
      },
      search: {
        requested: Boolean(search.requested),
        enabled: Boolean(search.enabled),
        state: String(search.state || '').slice(0, 120),
        disableSearchSent: Boolean(search.disableSearchSent),
        citations,
        searchResults
      },
      usage: {
        status: String(usage.status || 'not-reported-by-provider').slice(0, 80),
        inputTokens: Number.isFinite(Number(usage.inputTokens)) ? Math.max(0, Number(usage.inputTokens)) : null,
        outputTokens: Number.isFinite(Number(usage.outputTokens)) ? Math.max(0, Number(usage.outputTokens)) : null,
        totalTokens: Number.isFinite(Number(usage.totalTokens)) ? Math.max(0, Number(usage.totalTokens)) : null
      },
      cost: {
        status: String(cost.status || 'not-reported-by-provider').slice(0, 80),
        amount: Number.isFinite(Number(cost.amount)) ? Math.max(0, Number(cost.amount)) : null,
        currency: String(cost.currency || '').slice(0, 12),
        estimatedByEonapp: false,
        hiddenRetryCostPossible: false
      },
      containsPrompt: false,
      containsReply: false,
      containsApiKey: false,
      containsAttachmentContent: false
    } : null
  };
}

function renderAiProvenance(wrap, meta = {}) {
  const provenance = meta?.provenanceReceipt;
  if (!provenance) return;
  const context = provenance.context || {};
  const attachments = context.attachments || {};
  const usage = provenance.usage || {};
  const cost = provenance.cost || {};
  const search = provenance.search || {};
  const localConnection = meta?.localConnectionReceipt || null;
  const facts = [];
  if (attachments.total) facts.push(`${attachments.includedText} text file${attachments.includedText === 1 ? '' : 's'} included · ${attachments.omitted} preview-only omitted`);
  if (context.historyOmitted) facts.push(`${context.historyOmitted} older message${context.historyOmitted === 1 ? '' : 's'} omitted by context limit`);
  if (usage.status === 'provider-reported' && usage.totalTokens !== null) facts.push(`${usage.totalTokens} provider-reported tokens`);
  if (cost.status === 'provider-reported' && cost.amount !== null) facts.push(`${cost.amount} ${cost.currency || ''} provider-reported cost`.trim());
  else facts.push('provider cost not reported');
  if (search.disableSearchSent) facts.push('provider web search disabled');
  if (localConnection?.ok) {
    const transport = localConnection.transport === 'paired-local-bridge' ? 'paired Local Bridge' : 'direct browser loopback';
    const auth = localConnection.authenticated ? 'session-authenticated' : 'no runtime credential';
    facts.push(`${transport} · ${auth} · ${localConnection.localityState || 'locality unverified'}`);
  }
  if (facts.length) {
    const note = document.createElement('p');
    note.className = 'msg-provenance-note';
    note.textContent = facts.join(' · ');
    wrap.appendChild(note);
  }
  const sources = [...(search.citations || []), ...(search.searchResults || [])].filter((item, index, rows) => item?.url && rows.findIndex((other) => other.url === item.url) === index);
  if (!sources.length) return;
  const details = document.createElement('details');
  details.className = 'msg-sources';
  const summary = document.createElement('summary');
  summary.textContent = `Sources · ${sources.length}`;
  details.appendChild(summary);
  const list = document.createElement('ol');
  for (const source of sources) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = source.title || new URL(source.url).hostname;
    item.appendChild(link);
    list.appendChild(item);
  }
  details.appendChild(list);
  wrap.appendChild(details);
}

let vexrailAutoStatusCache = Object.freeze({ checkedAt: 0, value: null });

async function readVexrailAutoStatus() {
  const now = Date.now();
  if (vexrailAutoStatusCache.value && now - vexrailAutoStatusCache.checkedAt < 30_000) return vexrailAutoStatusCache.value;
  try {
    const response = await fetch('/api/ai/vexrail', { method: 'GET', credentials: 'same-origin', headers: { accept: 'application/json' }, cache: 'no-store' });
    const value = await response.json().catch(() => null);
    if (!response.ok || !value || value.ok !== true) return null;
    vexrailAutoStatusCache = Object.freeze({ checkedAt: now, value });
    return value;
  } catch { return null; }
}

function renderSafeLinkedText(target, text = '', { sponsored = false } = {}) {
  const source = String(text || '');
  const urlPattern = /https:\/\/[^\s<>"']+/gi;
  let cursor = 0;
  for (const match of source.matchAll(urlPattern)) {
    const index = Number(match.index || 0);
    let rawUrl = String(match[0] || '');
    while (/[),.;!?]$/.test(rawUrl)) rawUrl = rawUrl.slice(0, -1);
    if (index > cursor) target.appendChild(document.createTextNode(source.slice(cursor, index)));
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('unsafe');
      const link = document.createElement('a');
      link.href = parsed.toString(); link.target = '_blank';
      link.rel = sponsored ? 'sponsored noopener noreferrer' : 'noopener noreferrer';
      link.textContent = rawUrl; target.appendChild(link);
    } catch { target.appendChild(document.createTextNode(rawUrl)); }
    cursor = index + rawUrl.length;
  }
  if (cursor < source.length) target.appendChild(document.createTextNode(source.slice(cursor)));
}

function renderMessage(/** @type {any} */ entry) {
  const dom = getDom();
  if (!dom.messages) return;

  dom.messages.querySelector('.eon-chat-welcome')?.remove();
  const /** @type {any} */
row = document.createElement('div');
  row.className = `msg-row ${entry.role}`;

  if (entry.role === 'bot') {
    const /** @type {any} */
avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = entry.source === 'ai' ? '✨' : '🤖';
    row.appendChild(avatar);
  }

  const /** @type {any} */
wrap = document.createElement('div');
  wrap.className = 'msg-bubble-wrap';

  const sponsoredMeta = entry.meta ? sanitizeAiMessageMeta(entry.meta)?.monetization : null;
  if (entry.role === 'bot' && entry.source === 'ai' && sponsoredMeta?.sponsored) {
    const sponsored = document.createElement('div');
    sponsored.className = 'msg-sponsored-label';
    sponsored.textContent = sponsoredMeta.label || 'Ad-supported';
    sponsored.setAttribute('aria-label', 'Ad-supported AI response; sponsored content may be present');
    wrap.appendChild(sponsored);
  }

  const /** @type {any} */
bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  const safeEntryMeta = entry.meta ? sanitizeAiMessageMeta(entry.meta) : null;
  const isSponsoredVexrailReply = entry.role === 'bot' && entry.source === 'ai'
    && safeEntryMeta?.providerId === 'vexrail' && safeEntryMeta?.monetization?.sponsored === true;
  if (isSponsoredVexrailReply) renderSafeLinkedText(bubble, entry.text, { sponsored: true });
  else bubble.textContent = entry.text;
  wrap.appendChild(bubble);
  renderChatAttachments(wrap, entry.attachments);

  if (entry.meta) {
    const safeMeta = sanitizeAiMessageMeta(entry.meta);
    const /** @type {any} */
meta = document.createElement('div');
    meta.className = 'msg-meta';
    meta.textContent = `${safeMeta.provider} · ${safeMeta.model}${safeMeta.local ? ' · local' : ''}${safeMeta.elapsedMs ? ` · ${safeMeta.elapsedMs}ms` : ''}`;
    wrap.appendChild(meta);
    renderAiProvenance(wrap, safeMeta);

    if (entry.role === 'bot' && entry.source === 'ai' && safeMeta.providerId && safeMeta.model) {
      const feedbackRow = document.createElement('div');
      feedbackRow.className = 'msg-quick-replies msg-ai-feedback';
      feedbackRow.setAttribute('aria-label', 'Model quality feedback');

      const feedbackLabel = document.createElement('span');
      feedbackLabel.className = 'msg-meta';
      feedbackLabel.textContent = 'Was this model helpful?';
      feedbackRow.appendChild(feedbackLabel);

      [
        { rating: 'positive', label: '👍 Helpful' },
        { rating: 'negative', label: '👎 Not helpful' }
      ].forEach(({ rating, label }) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quick-chip';
        button.textContent = label;
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => {
          const requestId = safeMeta.requestReceipt?.requestId
            || `${safeMeta.providerId}:${safeMeta.model}:${safeMeta.taskType || 'chat'}:${safeMeta.elapsedMs || 0}`;
          const result = recordEonAiUserQualityFeedback({
            providerId: safeMeta.providerId,
            modelId: safeMeta.model,
            taskType: safeMeta.taskType || 'chat',
            local: safeMeta.local === true,
            rating,
            requestId
          }, { explicitUserFeedback: true });
          if (!result.ok) {
            showToast('Model feedback could not be saved on this device.', 'error');
            return;
          }
          feedbackRow.querySelectorAll('button').forEach((candidate) => {
            candidate.setAttribute('aria-pressed', candidate === button ? 'true' : 'false');
          });
          showToast('Saved on this device for model selection. Message text was not copied into the learning ledger.', 'success');
        });
        feedbackRow.appendChild(button);
      });
      wrap.appendChild(feedbackRow);
    }
  }

  if (entry.commandProposal && entry.commandReceipt) {
    const review = document.createElement('button');
    review.type = 'button';
    review.className = 'msg-action-cta';
    review.textContent = entry.commandProposal.reviewLabel || 'Review action';
    review.addEventListener('click', () => {
      review.disabled = true;
      renderCommandProposalReview(wrap, entry.commandProposal, entry.commandReceipt);
    });
    wrap.appendChild(review);
  }

  const actionCardPlan = transientActionCardPlanByMessage.get(entry) || null;
  if (actionCardPlan?.matched) {
    const reviewLocalPlan = document.createElement('button');
    reviewLocalPlan.type = 'button';
    reviewLocalPlan.className = 'msg-action-cta';
    reviewLocalPlan.textContent = 'Review local action plan';
    reviewLocalPlan.addEventListener('click', () => {
      reviewLocalPlan.disabled = true;
      renderLocalActionCardReview(wrap, actionCardPlan);
    });
    wrap.appendChild(reviewLocalPlan);
  }

  if (entry.toolCTA) {
    const /** @type {any} */
link = document.createElement('a');
    link.href = sanitizeUiLink(entry.toolCTA.url, '/');
    link.className = 'msg-tool-cta';
    link.textContent = entry.toolCTA.label || 'Open';
    const /** @type {any} */
arrow = document.createElement('span');
    arrow.className = 'msg-tool-cta-arrow';
    arrow.textContent = '→';
    link.appendChild(arrow);
    const transientCreatorIntent = transientCreatorIntentByMessage.get(entry) || null;
    const shareIntent = transientShareIntentByMessage.get(entry) || null;
    if (entry.commandReceipt || shareIntent || transientCreatorIntent) {
      link.addEventListener('click', (event) => {
        // A local transparency receipt is written only after the user chooses the CTA.
        // It stores no chat text and cannot grant value or cause an external effect.
        if (shareIntent) {
          const handoff = writeEonShareIntent(shareIntent);
          if (!handoff.ok) {
            event.preventDefault();
            showToast('The local Share draft could not be prepared in this browser. Nothing was opened.', 'error');
            return;
          }
        }
        if (transientCreatorIntent) {
          const handoff = writeEonCreatorIntentHandoff(transientCreatorIntent, { explicitUserAction: true });
          if (!handoff.ok) {
            // Navigation remains useful even when private prompt continuity is
            // unavailable. Never weaken the secret filter just to prefill Create.
            showToast(
              handoff.reason === 'creator-prompt-sensitive-value-rejected'
                ? 'Create will open without copying sensitive text.'
                : 'Create will open without the temporary prompt handoff.',
              'info'
            );
          }
        }
        if (entry.commandReceipt) recordEonbotActionTap(entry.commandReceipt);
      });
    }
    wrap.appendChild(link);
  }

  if (entry.commandReceipt) {
    const receipt = document.createElement('p');
    receipt.className = 'msg-command-receipt';
    receipt.textContent = 'Action receipt: ready for your tap. EONBOT has not completed this task.';
    wrap.appendChild(receipt);
  }

  if (entry.actionCTA) {
    const /** @type {any} */
button = document.createElement('button');
    button.type = 'button';
    button.className = 'msg-action-cta';
    button.textContent = entry.actionCTA.label;
    button.addEventListener('click', () => runAction(entry.actionCTA.action));
    wrap.appendChild(button);
  }

  if (entry.quickReplies?.length) {
    const /** @type {any} */
chipsRow = document.createElement('div');
    chipsRow.className = 'msg-quick-replies';
    entry.quickReplies.forEach((/** @type {any} */ reply) => {
      const /** @type {any} */
chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'quick-chip';
      chip.textContent = reply;
      chip.addEventListener('click', () => handleSend(reply));
      chipsRow.appendChild(chip);
    });
    wrap.appendChild(chipsRow);
  }

  row.appendChild(wrap);
  dom.messages.appendChild(row);
  scrollToBottom();
}

function pushMessage(/** @type {any} */ entry, /** @type {any} */ options = {}) {
  const normalizedEntry = {
    role: entry.role,
    text: entry.text,
    source: entry.source || (entry.role === 'user' ? 'user' : 'guide'),
    meta: entry.meta ? sanitizeAiMessageMeta(entry.meta) : null,
    speech: normalizeSpeechMessageMetadata(entry.speech),
    attachments: normalizeChatAttachments(entry.attachments),
    toolCTA: entry.toolCTA || null,
    actionCTA: entry.actionCTA || null,
    commandProposal: sanitizeCommandProposal(entry.commandProposal),
    commandReceipt: sanitizeCommandReceipt(entry.commandReceipt),
    quickReplies: Array.isArray(entry.quickReplies) ? entry.quickReplies : []
  };
  state.conversation.push(normalizedEntry);
  if (entry.shareIntent?.accepted === true) transientShareIntentByMessage.set(normalizedEntry, entry.shareIntent);
  if (entry.actionCardPlan?.matched === true) transientActionCardPlanByMessage.set(normalizedEntry, entry.actionCardPlan);
  if (options.transientCreatorIntent?.mode && options.transientCreatorIntent?.prompt) {
    transientCreatorIntentByMessage.set(normalizedEntry, {
      mode: String(options.transientCreatorIntent.mode || ''),
      prompt: String(options.transientCreatorIntent.prompt || '')
    });
  }
  if (!options.skipRender) {
    renderMessage(normalizedEntry);
  }
  if (entry.role === 'bot' && entry.text) {
    if (!state.pending) setEonbotEmotion(entry.source === 'ai' ? 'happy' : 'careful');
    speakReply(entry.text, { voiceConversation: state.voiceConversationActive });
  }
  saveConversation();
}

function showTyping() {
  setEonbotEmotion('thinking');
  const dom = getDom();
  if (!dom.messages) return;
  const /** @type {any} */
row = document.createElement('div');
  row.className = 'msg-row bot';
  row.id = 'typing-row';

  const /** @type {any} */
avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = state.settings.assistantMode === 'guide' ? '🤖' : '✨';

  const /** @type {any} */
wrap = document.createElement('div');
  wrap.className = 'msg-bubble-wrap';

  const /** @type {any} */
indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  for (let i = 0; i < 3; i += 1) {
    indicator.appendChild(document.createElement('span'));
  }

  wrap.appendChild(indicator);
  row.appendChild(avatar);
  row.appendChild(wrap);
  dom.messages.appendChild(row);
  scrollToBottom();
}

function removeTyping() {
  doc.getElementById('typing-row')?.remove();
  refreshEonbotEmotion();
}

function providerLabel(/** @type {any} */ providerId) {
  return PROVIDERS[providerId]?.label || PROVIDERS.guide.label;
}

function getGuideIntent(/** @type {any} */ text) {
  return state.bot._detectIntent(normalizeGuideText(text));
}

async function buildDirectSetupReply(/** @type {any} */ text) {
  if (isSetupIntent(text)) {
    const providerId = inferProviderFromText(text) || 'groq';
    const provider = PROVIDERS[providerId] || PROVIDERS.groq;
    if (providerId === 'ollama' || providerId === 'lmstudio') {
      return {
        type: 'guide',
        response: {
          text: `For ${provider.label}, open Local AI setup and tap Make Local AI ready. EON will check the safest approved path, reuse ${provider.label} if it is available, connect the Local Companion only when needed, and self-test a fitting model before EONBOT uses it. You do not need to configure ports or CORS in the normal flow.`,
          actionCTA: { label: 'Make Local AI ready', action: 'openLocalAi' },
          quickReplies: ['Use microphone now', 'Make Local AI ready', 'Make me a website']
        }
      };
    }
    return {
      type: 'guide',
      response: {
        text: `${provider.label} credentials are configured in Vault, not in chat. Open the secure provider setup when you are ready, or use Local AI to keep a model on this device. EONBOT can continue to guide you without either path.`,
        toolCTA: { label: 'Open secure provider setup', url: CANONICAL_AI_KEYS_PATH },
        actionCTA: { label: 'Make Local AI ready', action: 'openLocalAi' },
        quickReplies: ['Use microphone now', 'Make Local AI ready', 'Open AI Cockpit']
      }
    };
  }

  if (shouldOfferVoiceShortcut(text)) {
    return {
      type: 'guide',
      response: {
        text: 'You do not need to type. Tap Dictate for editable speech-to-text or Use Voice for a hands-free Guide conversation. Built-in Guide replies work without an AI key; model-powered answers still need a tested local runtime or a securely connected provider.',
        actionCTA: { label: 'Start voice now', action: 'startVoice' },
        quickReplies: ['Make Local AI ready', 'Explain provider setup', 'Local AI on this device']
      }
    };
  }

  if (isCreationIntent(text) && !getAIReadiness(state.settings).ready) {
    return {
      type: 'guide',
      response: {
        text: 'I can guide that work now. For private model-powered replies, choose Make Local AI ready; EON will use Local Lite or a verified desktop runtime when this device supports it. A Connected provider remains a separate explicit Vault choice.',
        toolCTA: { label: 'Make Local AI ready', url: '/local-ai#eonbot-local-ai-setup' },
        actionCTA: { label: 'Open secure provider setup', action: 'openSecureProviderSetup' },
        quickReplies: ['Make Local AI ready', 'Open AI Cockpit', 'Explain provider setup']
      }
    };
  }

  return null;
}

function updateHeaderStatus() {
  const dom = getDom();
  const status = state.governor.getStatus();
  const readiness = getAIReadiness(state.settings, {
    readyPrimaryLabel: 'Open AI Chat',
    readyPrimaryUrl: '/',
    readySecondaryLabel: 'Open secure provider setup',
    readySecondaryUrl: CANONICAL_AI_KEYS_PATH,
    setupPrimaryLabel: 'Make Local AI ready',
    setupPrimaryUrl: '/local-ai#eonbot-local-ai-setup',
    setupSecondaryLabel: 'Open secure provider setup',
    setupSecondaryUrl: CANONICAL_AI_KEYS_PATH
  });
  const capability = resolveEonbotCapabilityMode({
    settings: state.settings,
    localRuntimeStatus: readLocalRuntimeStatus(),
    readiness
  });

  if (dom.runtimeName) {
    // The everyday header should feel like a conversation, not a diagnostic panel.
    // Detailed readiness remains available to assistive technology and Settings.
    dom.runtimeName.textContent = 'EONBOT';
  }

  const voiceLocale = getVoiceLocaleTag();
  const providerLabel = capability.activeId === 'connected'
    ? String(readiness.providerLabel || 'connected provider')
    : capability.activeId === 'local'
      ? 'tested local runtime'
      : 'built-in guide';
  const modelText = capability.activeId === 'guide' || !state.settings.model ? '' : ` · ${state.settings.model}`;
  const detailedHeadline = `${capability.activeLabel} · ${providerLabel}${modelText} · voice ${voiceLocale} · ${status.budget.label.toLowerCase()}`;
  const headline = capability.activeId === 'connected' ? 'Ready' : capability.activeId === 'local' ? 'Ready locally' : 'Ready to help';

  if (dom.runtimeLabel) {
    dom.runtimeLabel.textContent = headline;
    dom.runtimeLabel.title = detailedHeadline;
    dom.runtimeLabel.setAttribute('aria-label', detailedHeadline);
  }
}


function updateInputPlaceholder() {
  const dom = getDom();
  if (!dom.input) return;
  void (async () => {
    if (!dom.input) return;
    dom.input.placeholder = await translateChatUi('Message EONBOT…', 'guide');
  })();
}

function syncComposerHeight() {
  const input = getDom().input;
  if (!input || input.tagName !== 'TEXTAREA') return;
  input.style.height = 'auto';
  const maxHeight = Math.round(window.innerHeight * 0.28);
  input.style.height = `${Math.min(input.scrollHeight, Math.max(44, maxHeight))}px`;
  input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

async function renderControls() {
  const dom = getDom();
  if (!dom.controls) return;
  dom.controls.dataset.ready = '0';
  const debug = /** @type {any} */ (window);
  debug.__eonChatControlsDebug = { startedAt: Date.now(), status: 'rendering' };
  try {

  const status = state.governor.getStatus();
  const readiness = getAIReadiness(state.settings);
  const localRuntimeStatus = readLocalRuntimeStatus();
  const capability = resolveEonbotCapabilityMode({ settings: state.settings, localRuntimeStatus, readiness });
  const proactiveSettings = readEonbotProactiveSettings();
  const proactiveSuggestion = buildEonbotProactiveSuggestion({ settings: proactiveSettings, localRuntimeStatus });
  const superappPlan = getSuperappSetupPlan(state.settings, { localProviders: state.localProviders });
  const legacyPlaintextChatStatus = getLegacyPlaintextChatThreadStatus();
  const superappBullets = superappPlan.setupBullets.slice(0, 3)
    .map((/** @type {any} */ item) => `<li>${escapeHtml(item)}</li>`)
    .join('');
  const superappMatches = Array.isArray(superappPlan.recommendedMatches) && superappPlan.recommendedMatches.length
    ? superappPlan.recommendedMatches.slice(0, 3)
      .map((/** @type {any} */ row) => `<li>Best for ${escapeHtml(row.label)}: ${escapeHtml(row.modelLabel)} (${escapeHtml(row.providerLabel)})</li>`)
      .join('')
    : '';
  const missionNextAction = escapeHtml(superappPlan.suggestedNextStep || 'Plan work');
  const missionNextReason = escapeHtml(superappPlan.recommendedReason || 'Use the most capable routed provider available.');
  const provider = PROVIDERS[state.settings.provider] || PROVIDERS.guide;
  const missionUiMode = chatMissionTimeline.getMode();
  const advancedVisible = missionUiMode === 'advanced';
  const missionLanguage = String(resolveChatLanguage() || getCurrentLanguage() || 'en').toLowerCase();
  const missionLanguageOptions = [
    '<option value="auto">Auto</option>',
    ...multiLanguageService.getChatGuideLanguages().map((lang) => `<option value="${lang.code}" ${missionLanguage === lang.code ? 'selected' : ''}>${lang.name} (${lang.englishName})</option>`)
  ]
    .join('');

  const assistantModeOptions = listModeOptions().map((entry) => `
    <option value="${entry.id}" ${entry.id === state.settings.assistantMode ? 'selected' : ''}>${entry.label}</option>
  `).join('');

  const runtimePreferenceOptions = listRuntimePreferences().map((entry) => `
    <option value="${entry.id}" ${entry.id === state.settings.runtimePreference ? 'selected' : ''}>${entry.label}</option>
  `).join('');

  const modelSelectionPolicyOptions = listModelSelectionPolicies().map((entry) => `
    <option value="${entry.id}" ${entry.id === state.settings.modelSelectionPolicy ? 'selected' : ''}>${entry.label}</option>
  `).join('');

  const providerOptions = Object.values(PROVIDERS)
    .filter((/** @type {any} */ entry) => entry.enabled !== false)
    .map((/** @type {any} */ entry) => `
      <option value="${entry.id}" ${entry.id === state.settings.provider ? 'selected' : ''}>${entry.label}</option>
    `).join('');

  const localSummary = state.localProviders.length
    ? state.localProviders.map((/** @type {any} */ item) => `${providerLabel(item.provider)}${item.available ? ` (${item.models.slice(0, 2).join(', ') || 'online'})` : ' offline'}`).join(' · ')
    : 'Not checked yet';
  const recentMissions = chatMissionTimeline.load().slice(-3).reverse();
  const missionRows = recentMissions.length
    ? recentMissions.map((/** @type {any} */ row) => `
      <li class="chat-mission-item">
        <div class="chat-mission-top">
          <strong>${escapeHtml(row.missionId || row.id || 'mission')}</strong>
          <span class="chat-mission-chip">${escapeHtml(row.providerLabel || row.provider || 'guide')}</span>
          <span class="chat-mission-chip">${escapeHtml(row.mode || 'ask')}</span>
        </div>
        <div class="chat-mission-summary">${escapeHtml(row.summary || row.result || 'Mission recorded.')}</div>
        <div class="chat-mission-meta">
          <span>${escapeHtml(row.model || 'n/a')}</span>
          <span>${escapeHtml(row.budget?.label || row.budget?.mode || row.budgetMode || 'auto')}</span>
          ${row.routeExplanation ? `<span>${escapeHtml(row.routeExplanation)}</span>` : ''}
          <span>${escapeHtml(row.status || 'completed')}</span>
          <span>${escapeHtml(chatMissionTimeline.formatStamp(row.timestamp || row.ts || Date.now()))}</span>
        </div>
      </li>
    `).join('')
    : '<li class="chat-mission-empty">No mission receipts yet. Ask EONBOT to plan, build, or research, and the Mission Engine will appear here.</li>';
  const budget = state.governor.getBudget();
  const safeModel = escapeHtml(state.settings.model || '');
  const safeEndpoint = escapeHtml(state.settings.endpoint || '');
  const safeLocalSummary = escapeHtml(localSummary);
  const safeBudgetSummary = escapeHtml(`${budget.label} · ${budget.maxHistoryMessages} msgs · ${budget.maxInputChars} chars · ${budget.maxOutputTokens} out · ${budget.timeoutMs / 1000}s`);
  const memorySummary = summarizeMissionMemory();
  const safeMemorySummary = escapeHtml(formatMissionMemorySummary(/** @type {any} */ (memorySummary)));
  const memoryTop = memorySummary.topProfiles?.[0];
  const safeMemoryTop = memoryTop
    ? escapeHtml(`${memoryTop.label} → ${memoryTop.budgetMode} · ${memoryTop.providerLabel || /** @type {any} */ (memoryTop).providerId || 'n/a'}${memoryTop.model ? ` · ${memoryTop.model}` : ''}`)
    : '';
  const durabilitySummary = getMissionDurabilitySummary();
  const safeDurabilitySummary = escapeHtml(`Resumable missions: ${durabilitySummary.resumableCount} · Exported capsules: ${durabilitySummary.capsuleCount}`);
  const resumableMission = durabilitySummary.latestResumable || getLatestResumableMissionJob();
  const safeResumableMissionLabel = resumableMission
    ? escapeHtml(`${resumableMission.title || resumableMission.id} · ${resumableMission.status || 'ready'}`)
    : '';
  const capabilityModesMarkup = capability.modes.map((mode) => `
    <li class="eonbot-mode-row ${mode.active ? 'is-active' : ''}">
      <div><strong>${escapeHtml(mode.label)}</strong><span>${escapeHtml(mode.active ? 'Active' : mode.status === 'ready' ? 'Ready' : 'Setup required')}</span></div>
      <p>${escapeHtml(mode.description)}</p>
      ${mode.active ? '' : `<a class="msg-action-cta" href="${escapeHtml(mode.setupUrl)}">${mode.id === 'local' ? 'Review local AI' : mode.id === 'connected' ? 'Open Vault setup' : 'Use Guide'}</a>`}
    </li>
  `).join('');
  const proactiveMarkup = proactiveSuggestion
    ? `<div class="eonbot-proactive-note" data-eonbot-proactive-id="${escapeHtml(proactiveSuggestion.id)}"><p>${escapeHtml(proactiveSuggestion.label)}</p><div><a class="msg-action-cta" href="${escapeHtml(proactiveSuggestion.url)}">${escapeHtml(proactiveSuggestion.actionLabel)}</a><button type="button" class="msg-action-cta" data-eonbot-proactive-dismiss="${escapeHtml(proactiveSuggestion.id)}">Dismiss</button></div></div>`
    : '';

  safeHTML(dom.controls, `
    <div class="chat-control-grid">
      <section class="chat-control-card eonbot-capability-card" aria-labelledby="eonbot-capability-title">
        <div class="chat-control-title" id="eonbot-capability-title">EONBOT mode · ${escapeHtml(capability.activeLabel)}</div>
        <p class="chat-note">${escapeHtml(capability.activeDescription)}</p>
        <ul class="eonbot-mode-list">${capabilityModesMarkup}</ul>
        <div class="chat-inline-row"><a class="msg-action-cta" href="${escapeHtml(capability.nextAction.url)}">${escapeHtml(capability.nextAction.label)}</a><button type="button" class="msg-action-cta" id="chat-use-sponsored-gemini">Use Sponsored AI</button><a class="msg-action-cta" href="/workspace">Open advanced review</a></div>
        <p class="chat-note"><strong>Sponsored AI · Free:</strong> eligible guests may receive one Sponsored Vexrail answer before sign-in, and eligible signed-in FREE accounts use Sponsored Vexrail as the normal Auto hosted-chat route. Contextual sponsored recommendations may appear when relevant inventory exists. Paid plans remain ad-free by default but may explicitly opt into Sponsored AI. Local AI and BYOK inference remain private and unsponsored.</p>
        <p class="chat-note">${escapeHtml(capability.truthNote)}</p>
        <label class="chat-checkbox"><input type="checkbox" id="eonbot-proactive-enabled" ${proactiveSettings.enabled ? 'checked' : ''} /><span>Allow optional in-app EONBOT reminders</span></label>
        <p class="chat-note">Off by default. No browser notification permission is requested.</p>
        ${proactiveMarkup}
      </section>
      <div class="chat-control-card chat-mission-card">
        <div class="chat-control-title">Planning panel</div>
        <div class="chat-note">
          EONBOT plans work here. Advanced review opens focused tools only when you need them, and the timeline below shows the latest local Mission Engine receipts.
        </div>
        <div class="chat-inline-grid" style="margin-top:.7rem;">
          <label class="chat-control-field">
            <span>Mission goal</span>
            <textarea id="chat-mission-goal" rows="3" placeholder="${escapeHtml(String(await translateChatControlUi('Build me a website, create a video campaign, or run research…')))}" maxlength="1200" style="resize:vertical;min-height:90px;"></textarea>
          </label>
          <label class="chat-control-field">
            <span>Delegation plan</span>
            <select id="chat-mission-autonomy">
              <option value="guided">Hands-on</option>
              <option value="balanced" selected>Balanced</option>
              <option value="autonomous">Maximum delegation (plan only)</option>
            </select>
          </label>
          <label class="chat-control-field">
            <span>Review level</span>
            <select id="chat-mission-approval">
              <option value="strict">Review every risky step</option>
              <option value="normal" selected>Normal review</option>
              <option value="fast">Fewer review pauses (plan only)</option>
            </select>
          </label>
          <label class="chat-control-field">
            <span>Budget mode</span>
            <select id="chat-mission-budget">
              <option value="auto" selected>Auto</option>
              <option value="safe">Safe</option>
              <option value="balanced">Balanced</option>
              <option value="performance">Performance</option>
            </select>
          </label>
          <label class="chat-control-field">
            <span>Language</span>
            <select id="chat-mission-language">
              ${missionLanguageOptions}
            </select>
          </label>
        </div>
        <div class="chat-note" id="chat-mission-preview">Plan preview: a business mission. Language: auto. Delegation plan: balanced. Review level: normal review. Budget mode: auto. No background work starts from this preview.</div>
        <div class="chat-inline-row" style="margin-top:.5rem;">
          <button type="button" class="msg-action-cta" id="chat-toggle-mission-ui">${advancedVisible ? 'Simple view' : 'Advanced view'}</button>
        </div>
        <ul class="chat-mission-list">
          ${missionRows}
        </ul>
        <div class="chat-inline-row">
          <a class="msg-action-cta" href="/workspace">Open advanced review</a>
          <button type="button" class="msg-action-cta" id="chat-open-mission-commander">Plan work</button>
          <button type="button" class="msg-action-cta" id="chat-run-mission">Save plan</button>
        </div>
        <div class="chat-inline-row" style="margin-top:.45rem;flex-wrap:wrap;">
          <button type="button" class="msg-action-cta" id="chat-resume-latest-mission"${resumableMission ? '' : ' disabled'}>Review latest plan</button>
          <button type="button" class="msg-action-cta" id="chat-export-latest-mission"${resumableMission ? '' : ' disabled'}>Export checkpoint</button>
          <button type="button" class="msg-action-cta" id="chat-import-mission-capsule">Import checkpoint</button>
          <input id="chat-import-mission-capsule-file" type="file" accept="application/json" hidden />
        </div>
        <div class="chat-note">${safeDurabilitySummary}${safeResumableMissionLabel ? `<br />Latest resumable: ${safeResumableMissionLabel}` : ''}</div>
        <div class="chat-note"><strong>Local plan boundary</strong><br />Plans and checkpoint files stay on this device unless you deliberately export a file. No background runner, relay mirror, publishing connection, or remote worker starts from Chat.</div>
        <div class="chat-note">Current budget: ${safeBudgetSummary}</div>
        <div class="chat-note"><strong>Next action</strong><br />${missionNextAction}<br />${missionNextReason}</div>
        <div class="chat-note">
          <strong>Mission memory</strong><br />
          ${safeMemorySummary}
          ${safeMemoryTop ? `<br />Top route: ${safeMemoryTop}` : ''}
        </div>
      </div>
      <div class="chat-control-card${advancedVisible ? '' : ' is-hidden'}" data-mission-advanced="1">
        <div class="chat-control-title">Runtime</div>
        <div class="chat-inline-grid">
          <label class="chat-control-field">
            <span>Assistant mode</span>
            <select id="chat-mode-select">${assistantModeOptions}</select>
          </label>
          <label class="chat-control-field">
            <span>Runtime preference</span>
            <select id="chat-runtime-preference">${runtimePreferenceOptions}</select>
          </label>
          <label class="chat-control-field">
            <span>Provider</span>
            <select id="chat-provider-select">${providerOptions}</select>
          </label>
          <label class="chat-control-field ${provider.serverManaged === true ? 'is-hidden' : ''}">
            <span>Model policy</span>
            <select id="chat-model-policy">${modelSelectionPolicyOptions}</select>
          </label>
          ${provider.serverManaged === true ? '<div class="chat-control-field"><span>Model routing</span><small class="chat-note"><strong>Automatic · server managed</strong><br />Verified lowest-cost qualified Vexrail model inside the current quality and profitability envelope. The browser cannot pin an expensive Vexrail model.</small></div>' : ''}
          <label class="chat-control-field">
            <span>Memory</span>
            <select id="chat-memory-policy">
              <option value="off" ${readEonAiMemoryPolicy().mode === 'off' ? 'selected' : ''}>Off</option>
              <option value="ask" ${readEonAiMemoryPolicy().mode === 'ask' ? 'selected' : ''}>Ask / manual</option>
              <option value="safe-auto" ${readEonAiMemoryPolicy().mode === 'safe-auto' ? 'selected' : ''}>Safe auto</option>
            </select>
          </label>
          <label class="chat-control-field">
            <span>Sponsored AI memory</span>
            <select id="chat-sponsored-context-policy">
              <option value="off" ${readEonSponsoredAiContextPolicy().enabled ? '' : 'selected'}>Off</option>
              <option value="on" ${readEonSponsoredAiContextPolicy().enabled ? 'selected' : ''}>Share selected context</option>
            </select>
          </label>
          <label class="chat-control-field">
            <span>Load profile</span>
            <select id="chat-load-mode">
              <option value="auto" ${state.governor.getModeOverride() === 'auto' ? 'selected' : ''}>Auto</option>
              <option value="safe" ${state.governor.getModeOverride() === 'safe' ? 'selected' : ''}>Safe</option>
              <option value="balanced" ${state.governor.getModeOverride() === 'balanced' ? 'selected' : ''}>Balanced</option>
              <option value="performance" ${state.governor.getModeOverride() === 'performance' ? 'selected' : ''}>Performance</option>
            </select>
          </label>
        </div>
        <div class="chat-note"><strong>Routing boundary</strong><br />Auto / Best / Fast / Economy rank only models already verified for the selected provider. Runtime preference guides setup and recommendations; it never silently switches providers, installs a runtime, downloads a model, or starts a request.</div>
        <div class="chat-status-pills">
          <span class="chat-pill ${status.profile}">${status.budget.label}</span>
          <span class="chat-pill neutral">Stress ${status.stressScore}</span>
          <span class="chat-pill neutral">${status.reasons.length ? status.reasons.join(', ') : 'device healthy'}</span>
          ${(() => { const r = getRateStatus(); return `<span class="chat-pill neutral" title="AI requests: ${r.hourUsed}/${r.hourLimit} this hour, ${r.dayUsed}/${r.dayLimit} today">Requests ${r.dayUsed}/${r.dayLimit} today</span>`; })()}
        </div>
        <div class="chat-inline-row">
          <a class="msg-action-cta" href="/local-ai#eon-ai-quality-title">Manage memory</a>
          <button type="button" class="msg-action-cta" id="chat-clear-model-learning">Clear learned model performance</button>
        </div>
        <div class="chat-note"><strong>Memory transparency</strong><br />${(() => { const memoryPolicy = readEonAiMemoryPolicy(); const stats = getEonAiMemoryStats(); return `${stats.total} active local memory card${stats.total === 1 ? '' : 's'} · ${memoryPolicy.mode === 'safe-auto' ? 'Safe auto learns only finite explicit controls' : memoryPolicy.mode === 'off' ? 'memory injection is off' : 'manual memory only'}. Raw chat is never auto-saved or used to fine-tune models.`; })()}</div>
        <div class="chat-note"><strong>Sponsored AI context</strong><br />Saved memory stays off by default. If you explicitly choose “Share selected context”, EONAPP may send only 0–2 relevant memory cards for normal chat or up to 3 for coding/reasoning/project continuation, plus an intent-gated redacted recent-work summary. Memory Off always wins. Separately, if you explicitly queue public cited sources in the client-only Research Ledger for the next turn, Sponsored AI may receive a tighter one-turn research packet (max 3 bounded sources) after Sponsored-specific filtering. This does not give Vexrail autonomous browser/tool control. The full ledger, raw chats, Vault/keys, private files and raw receipts are never shared.</div>
        <div class="chat-note">Clears only local speed, reliability and explicit quality-selection evidence. Chat, Memory, provider credentials and installed models are unchanged.</div>
      </div>
      <form class="chat-control-card${advancedVisible ? '' : ' is-hidden'}" id="chat-settings-form" autocomplete="off" data-mission-advanced="1">
        <div class="chat-control-title">Provider setup</div>
        <div class="chat-inline-grid">
          <label class="chat-control-field ${provider.serverManaged === true ? 'is-hidden' : ''}">
            <span>Model</span>
            <input id="chat-model-input" type="text" value="${safeModel}" placeholder="${escapeHtml(String(await translateChatControlUi('Model name')))}" maxlength="120" />
          </label>
          <label class="chat-control-field ${provider.supportsEndpoint ? '' : 'is-hidden'}">
            <span>Endpoint</span>
            <input id="chat-endpoint-input" type="text" value="${safeEndpoint}" placeholder="${escapeHtml(String(await translateChatControlUi('https://... or http://127.0.0.1:11434')))}" maxlength="220" />
          </label>
          <div class="chat-control-field ${provider.id === 'guide' || provider.serverManaged === true ? 'is-hidden' : ''}">
            <span>Credentials</span>
            <small class="chat-note">Credentials are managed in Vault. EONBOT never asks for, displays, or saves a key from chat.</small>
            <a class="msg-action-cta" href="${CANONICAL_AI_KEYS_PATH}">Open secure provider setup</a>
          </div>
        </div>
        <div class="chat-inline-row">
          <button type="button" class="msg-action-cta" id="chat-save-settings">Save non-secret settings</button>
          <button type="button" class="msg-action-cta" id="chat-detect-local">Set up Local AI</button>
          <a class="msg-action-cta" href="${CANONICAL_AI_KEYS_PATH}">Manage credentials in Vault</a>
        </div>
        <div class="chat-note">
          ${escapeHtml(readiness.ready ? `Ready: ${provider.label} is configured.` : readiness.bannerBody || readiness.reason || 'Guide Mode is active.')}
        </div>
        <div class="chat-note">
          <strong>Superapp setup</strong><br />
          ${escapeHtml(superappPlan.readiness.ready
            ? `Ready path: ${superappPlan.readiness.providerLabel} can run EONBOT and the creator stack.`
            : `Best next step: ${superappPlan.suggestedNextStep} · ${superappPlan.recommendedReason}`)}
          <ul style="margin:.35rem 0 0 1.1rem;padding:0;">
            ${superappBullets}
            ${superappMatches}
          </ul>
        </div>
        <div class="chat-inline-row">
          <a class="msg-action-cta" href="${sanitizeUiLink(readiness.primaryAction.url, CANONICAL_AI_SETUP_PATH)}">${escapeHtml(readiness.primaryAction.label)}</a>
          <a class="msg-action-cta" href="${sanitizeUiLink(readiness.secondaryAction.url, CANONICAL_AI_KEYS_PATH)}">${escapeHtml(readiness.secondaryAction.label)}</a>
        </div>
        <div class="chat-note">Local runtimes: ${safeLocalSummary}</div>
        <div class="chat-note"><strong>Chat privacy</strong><br />New Chat threads are session-only and are not saved as a persistent plaintext browser profile. Use an encrypted Vault backup for recovery.${legacyPlaintextChatStatus.present ? ' An older plaintext Chat cache was detected on this device.' : ''}</div>
        ${legacyPlaintextChatStatus.present ? '<div class="chat-inline-row"><button type="button" class="msg-action-cta" id="chat-clear-legacy-plaintext">Remove legacy plaintext Chat cache</button></div>' : ''}
      </form>
    </div>
  `, 'ui');

  dom.controls.querySelector('#eonbot-proactive-enabled')?.addEventListener('change', (/** @type {any} */ event) => {
    const next = setEonbotProactiveEnabled(Boolean(event.currentTarget.checked));
    void showLocalizedToast(next.enabled ? 'Optional in-app EONBOT reminders are enabled. Browser notifications remain off.' : 'Optional EONBOT reminders are disabled.', 'success');
    renderControls();
  });
  dom.controls.querySelectorAll('[data-eonbot-proactive-dismiss]').forEach((button) => button.addEventListener('click', (event) => {
    const id = event.currentTarget?.dataset?.eonbotProactiveDismiss || '';
    dismissEonbotProactiveSuggestion(id);
    renderControls();
  }));
  if (proactiveSuggestion) recordEonbotProactiveSuggestion(proactiveSuggestion.id);

  dom.controls.querySelector('#chat-mode-select')?.addEventListener('change', (/** @type {any} */ event) => {
    const assistantMode = event.target.value;
    state.settings = saveAISettings({
      ...state.settings,
      assistantMode,
      provider: assistantMode === 'guide' ? 'guide' : state.settings.provider
    });
    updateInputPlaceholder();
    updateHeaderStatus();
    renderControls();
  });

  dom.controls.querySelector('#chat-runtime-preference')?.addEventListener('change', (/** @type {any} */ event) => {
    state.settings = saveAISettings({ ...state.settings, runtimePreference: event.target.value });
    rememberEonAiStructuredSignal('runtime-preference', state.settings.runtimePreference, { explicitControlChange: true });
    updateInputPlaceholder();
    updateHeaderStatus();
    renderControls();
  });

  dom.controls.querySelector('#chat-model-policy')?.addEventListener('change', (event) => {
    state.settings = saveAISettings({ ...state.settings, modelSelectionPolicy: event.target.value });
    rememberEonAiStructuredSignal('model-selection-policy', state.settings.modelSelectionPolicy, { explicitControlChange: true });
    updateInputPlaceholder();
    updateHeaderStatus();
    renderControls();
  });

  dom.controls.querySelector('#chat-memory-policy')?.addEventListener('change', (event) => {
    const result = writeEonAiMemoryPolicy(String(event.target?.value || 'ask'), { explicitUserAction: true });
    showToast(
      result.ok
        ? result.policy.mode === 'safe-auto'
          ? 'Safe Auto memory enabled for finite explicit controls only.'
          : result.policy.mode === 'off'
            ? 'Memory injection is off. Existing local cards were not deleted.'
            : 'Memory is in Ask / manual mode.'
        : 'Memory behavior could not be saved in this browser.',
      result.ok ? 'success' : 'error'
    );
    if (result.ok) renderControls();
  });

  dom.controls.querySelector('#chat-sponsored-context-policy')?.addEventListener('change', (event) => {
    const enabled = String(event.target?.value || 'off') === 'on';
    const result = writeEonSponsoredAiContextPolicy(enabled, { explicitUserAction: true });
    showToast(
      result.ok
        ? enabled
          ? 'Sponsored AI context sharing is on. Only a few relevant redacted EONBOT memory cards and safe recent-work labels can be included; Memory Off still overrides this.'
          : 'Sponsored AI context sharing is off. Vexrail receives no saved EONBOT memory or recent local activity.'
        : 'Sponsored AI context preference could not be saved in this browser.',
      result.ok ? 'success' : 'error'
    );
    if (result.ok) renderControls();
  });

  dom.controls.querySelector('#chat-clear-model-learning')?.addEventListener('click', () => {
    const approved = typeof window.confirm === 'function'
      ? window.confirm('Clear learned model speed, reliability and quality evidence on this device? Chat, Memory, credentials and installed models will not be changed.')
      : false;
    if (!approved) return;
    const cleared = clearEonAiEvaluations();
    showToast(
      cleared ? 'Learned model performance was cleared on this device.' : 'Learned model performance could not be cleared.',
      cleared ? 'success' : 'error'
    );
    if (cleared) renderControls();
  });

  dom.controls.querySelector('#chat-use-sponsored-gemini')?.addEventListener('click', () => {
    const providerSelect = dom.controls.querySelector('#chat-provider-select');
    if (!providerSelect) return;
    providerSelect.value = 'vexrail';
    providerSelect.dispatchEvent(new Event('change', { bubbles: true }));
  });

  dom.controls.querySelector('#chat-provider-select')?.addEventListener('change', async (/** @type {any} */ event) => {
    const providerId = event.target.value;
    const preset = PROVIDERS[providerId] || PROVIDERS.guide;
    let verifiedModel = providerId === state.settings.provider ? state.settings.model : '';
    if (preset.serverManaged === true) {
      const proof = await verifyProviderReadiness(providerId, '', { forceRefresh: true, modelSelectionPolicy: state.settings.modelSelectionPolicy });
      if (proof?.ok !== true || !proof?.model) {
        const reason = String(proof?.error || proof?.status || 'The sponsored free-AI route is unavailable.');
        if (reason.includes('vexrail_sign_in_required')) {
          void showLocalizedToast('Sign in with Google to use Sponsored AI. Guide Mode, Local AI and BYOK remain available while signed out.', 'error');
          event.target.value = state.settings.provider;
          window.location.assign('/api/auth/google/start?returnTo=%2F');
          return;
        }
        const message = reason.includes('vexrail_geo_unavailable')
          ? 'Sponsored AI is not enabled in this country during the current economic pilot. Guide Mode, Local AI and BYOK remain available.'
          : reason.includes('vexrail_network_') || reason.includes('vexrail_automated_traffic')
            ? 'Sponsored AI is unavailable on this network under the current anti-abuse policy. Guide Mode, Local AI and BYOK remain available.'
            : 'Sponsored AI is not ready yet. Its server configuration or eligibility could not be verified.';
        void showLocalizedToast(message, 'error');
        event.target.value = state.settings.provider;
        return;
      }
      verifiedModel = proof.model;
      if (providerId === 'vexrail' && proof?.sponsoredOptInRequired === true) {
        const approved = typeof window.confirm === 'function'
          ? window.confirm('Your paid plan remains ad-free by default. Switch EONBOT to Sponsored AI? Contextual sponsored recommendations may appear in this sponsored AI route only, and only where the current economic pilot allows it. Ordinary display ads stay off. Fair-use, human-verification, network and global safety protections still apply.')
          : false;
        if (!approved) {
          event.target.value = state.settings.provider;
          return;
        }
      }
    }
    state.settings = saveAISettings({
      ...state.settings,
      provider: providerId,
      model: verifiedModel,
      modelPinned: false,
      endpoint: preset.defaultEndpoint || '',
      assistantMode: providerId === 'guide' ? 'guide' : state.settings.assistantMode
    });
    updateInputPlaceholder();
    updateHeaderStatus();
    renderControls();
    if (preset.serverManaged === true) void showLocalizedToast('EON Sponsored AI · Vexrail is ready for this signed-in account and pilot market. Paid accounts remain ad-free by default; choosing this provider is an explicit sponsored-chat opt-in. Guide, Local AI and BYOK stay unsponsored.', 'success');
  });

  dom.controls.querySelector('#chat-load-mode')?.addEventListener('change', (/** @type {any} */ event) => {
    state.governor.setModeOverride(event.target.value);
    renderControls();
    updateHeaderStatus();
  });

  const missionGoalField = dom.controls.querySelector('#chat-mission-goal');
  const missionAutonomyField = dom.controls.querySelector('#chat-mission-autonomy');
  const missionApprovalField = dom.controls.querySelector('#chat-mission-approval');
  const missionBudgetField = dom.controls.querySelector('#chat-mission-budget');
  const missionLanguageField = dom.controls.querySelector('#chat-mission-language');
  const missionPreviewEl = dom.controls.querySelector('#chat-mission-preview');

  const refreshMissionPreview = () => {
    if (!missionPreviewEl) return;
    missionPreviewEl.textContent = buildMissionPreview(
      missionGoalField?.value || '',
      missionAutonomyField?.value || 'balanced',
      missionApprovalField?.value || 'normal',
      missionBudgetField?.value || 'auto',
      missionLanguageField?.value || 'auto'
    );
  };

  missionGoalField?.addEventListener('input', refreshMissionPreview);
  missionAutonomyField?.addEventListener('change', refreshMissionPreview);
  missionApprovalField?.addEventListener('change', refreshMissionPreview);
  missionBudgetField?.addEventListener('change', refreshMissionPreview);
  missionLanguageField?.addEventListener('change', refreshMissionPreview);
  refreshMissionPreview();

  dom.controls.querySelector('#chat-open-mission-commander')?.addEventListener('click', () => {
    try {
      const input = dom.input;
      if (input) {
        input.value = 'Plan work for my business';
        input.focus();
      }
      void showLocalizedToast('Planning panel ready. Describe the work you want to structure.', 'success');
    } catch {}
  });

  dom.controls.querySelector('#chat-toggle-mission-ui')?.addEventListener('click', () => {
    const nextMode = missionUiMode === 'advanced' ? 'simple' : 'advanced';
    chatMissionTimeline.setMode(nextMode);
    const advanced = nextMode === 'advanced';
    dom.controls.querySelectorAll('[data-mission-advanced]').forEach((panel) => panel.classList.toggle('is-hidden', !advanced));
    const toggle = dom.controls.querySelector('#chat-toggle-mission-ui');
    if (toggle) toggle.textContent = advanced ? 'Simple view' : 'Advanced view';
  });

  dom.controls.querySelector('#chat-run-mission')?.addEventListener('click', async () => {
    const goal = sanitizeChatInput(missionGoalField?.value || '');
    const autonomy = String(missionAutonomyField?.value || 'balanced');
    const approval = String(missionApprovalField?.value || 'normal');
    const budgetMode = String(missionBudgetField?.value || 'auto');
    const language = String(missionLanguageField?.value || resolveChatLanguage() || getCurrentLanguage() || 'en');
    const clarifiers = buildMissionClarifiers(goal, autonomy, approval, language);

    if (!goal || (goal.split(/\s+/).length < 4 && clarifiers.length >= 2)) {
      pushMessage({
        role: 'bot',
        source: 'guide',
        text: await translateChatUi(`Before I save this plan, I need a bit more detail. ${clarifiers.slice(0, 3).join(' ')}`, 'guide'),
        quickReplies: await localizeQuickReplies([
          'Use my current goal',
          'Make it guided',
          'Plan maximum delegation'
        ])
      });
      return;
    }

    const job = await createEonKernelMissionDraft({
      origin: 'mission-intake',
      intentText: goal,
      privacyClass: 'device-local'
    });

    const steps = Array.isArray(job.steps) ? job.steps.join(' -> ') : 'plan';
    const previewText = buildMissionPreview(goal, autonomy, approval, budgetMode, language);
    const budgetLabel = /** @type {any} */ (BUDGET_MODE_LABELS)[budgetMode] || budgetMode;
    chatMissionTimeline.append({
      mode: 'mission-intake',
      prompt: goal,
      status: job.status === 'blocked' ? 'blocked' : job.status,
      provider: state.settings.provider || 'guide',
      providerLabel: PROVIDERS[state.settings.provider]?.label || state.settings.provider || 'guide',
      model: state.settings.model || 'auto',
      summary: previewText,
      missionId: job.id,
      planId: job.id,
      budget: {
        ...state.governor.getBudget(),
        mode: budgetMode,
        label: budgetLabel,
        reason: `User-selected budget mode for mission intake (${budgetLabel}).`
      },
      budgetMode,
      taskClass: 'mission',
      routing: {
        autonomy,
        approval,
        budgetMode,
        routeExplanation: `Mission intake budget: ${budgetLabel}. Language: ${language}.`
      }
    });
    if (job.status === 'blocked') {
      pushMessage({
        role: 'bot',
        source: 'guide',
        text: await translateChatUi(`Mission blocked by policy: ${job.notes || 'action is not allowed'}. ${previewText}`, 'guide'),
        toolCTA: { label: 'Open advanced review', url: '/workspace' },
        quickReplies: await localizeQuickReplies(['Show policy summary', 'Create a safer mission'])
      });
      return;
    }

    pushMessage({
      role: 'bot',
      source: 'guide',
      text: await translateChatUi(`Local plan saved: ${steps}. ${previewText}`, 'guide'),
      toolCTA: { label: 'Open advanced review', url: '/workspace' },
      quickReplies: await localizeQuickReplies(['Review the plan', 'Refine mission', 'Show receipts'])
    });

    // W228: a Chat mission creates a browser-local plan only. It does not start
    // a background agent, call a provider, publish content, or continue after
    // the user leaves this page. Open advanced review to inspect and act deliberately.
    chatMissionTimeline.append({
      mode: 'mission-intake',
      prompt: goal,
      status: 'planned',
      provider: 'guide',
      providerLabel: 'Guide plan',
      model: 'none',
      summary: 'Plan saved locally. No background execution has started.',
      missionId: job.id,
      planId: job.id,
      budget: { ...state.governor.getBudget(), mode: budgetMode, label: budgetLabel, reason: 'Planning-only mode. No provider or external action started.' },
      budgetMode,
      taskClass: 'mission-plan',
      routing: { autonomy, approval, budgetMode, routeExplanation: 'Local planning only; continue manually in advanced review.', state: 'planned' }
    });
  });

  dom.controls.querySelector('#chat-resume-latest-mission')?.addEventListener('click', async () => {
    const target = getLatestResumableMissionJob();
    if (!target) {
      void showLocalizedToast('No resumable mission found yet.', 'warning');
      return;
    }
    const result = await resumeMissionJob(target.id, { surface: 'chat-mission-intake', origin: 'chat' });
    if (result.ok) {
      void showLocalizedToast(`Local plan is ready for advanced review: ${target.title || target.id}.`, 'success');
      renderControls();
    } else {
      void showLocalizedToast(result.reason || 'Resume failed.', 'error');
    }
  });

  dom.controls.querySelector('#chat-export-latest-mission')?.addEventListener('click', async () => {
    const target = getLatestResumableMissionJob();
    if (!target) {
      void showLocalizedToast('No mission checkpoint available to export.', 'warning');
      return;
    }
    const passphrase = window.prompt('Optional passphrase to encrypt this mission checkpoint. Leave blank for plain JSON.', '') || '';
    const result = await exportMissionCapsule(target.id, {
      download: true,
      passphrase: passphrase.trim()
    });
    if (result.ok) {
      void showLocalizedToast(passphrase.trim() ? 'Encrypted mission checkpoint exported.' : 'Mission checkpoint exported.', 'success');
      renderControls();
    } else {
      void showLocalizedToast(result.reason || 'Export failed.', 'error');
    }
  });

  const importBtn = dom.controls.querySelector('#chat-import-mission-capsule');
  const importFile = dom.controls.querySelector('#chat-import-mission-capsule-file');
  importBtn?.addEventListener('click', () => {
    /** @type {HTMLInputElement|null} */
    const el = importFile;
    if (!el) return;
    el.value = '';
    el.click();
  });
  importFile?.addEventListener('change', async (/** @type {any} */ event) => {
    const file = event.target?.files?.[0];
    if (!file) return;
    const passphrase = window.prompt('If this checkpoint is encrypted, enter its passphrase. Leave blank for plain JSON.', '') || '';
    const result = await importMissionCapsuleFile(file, passphrase.trim());
    if (result.ok) {
      void showLocalizedToast(`Imported mission checkpoint for ${result.job?.title || result.job?.id || 'mission'}.`, 'success');
      renderControls();
    } else {
      void showLocalizedToast(result.reason || 'Import failed.', 'error');
    }
  });


  dom.controls.dataset.ready = '1';

  dom.controls?.querySelector('#chat-clear-legacy-plaintext')?.addEventListener('click', () => {
    if (!window.confirm('Remove older plaintext Chat threads from this browser? This cannot be undone. Export an encrypted Vault backup first if you need them.')) return;
    const result = clearLegacyPlaintextChatThreads();
    void showLocalizedToast(result.ok ? 'Older plaintext Chat cache removed. Current Chat stays session-only.' : 'Could not remove the older Chat cache.', result.ok ? 'success' : 'error');
    renderControls();
  });

  dom.controls?.querySelector('#chat-save-settings')?.addEventListener('click', async () => {
    const ctrl = dom.controls;
    if (!ctrl) return;
    const model = ctrl.querySelector('#chat-model-input')?.value?.trim() || '';
    const endpoint = ctrl.querySelector('#chat-endpoint-input')?.value?.trim() || '';
    state.settings = saveAISettings({
      ...state.settings,
      model: model && model.toLowerCase() !== 'auto' ? model : '',
      modelPinned: Boolean(model && model.toLowerCase() !== 'auto'),
      endpoint,
    });
    updateInputPlaceholder();
    updateHeaderStatus();
    renderControls();

    const provider = PROVIDERS[state.settings.provider] || PROVIDERS.guide;
    if (provider.serverManaged === true) {
      const proof = await verifyProviderReadiness(provider.id, '', { forceRefresh: true, modelSelectionPolicy: state.settings.modelSelectionPolicy });
      if (proof?.ok === true && proof?.model) {
        state.settings = saveAISettings({ ...state.settings, model: proof.model, modelPinned: false, endpoint: provider.defaultEndpoint || '' });
        void showLocalizedToast('Sponsored AI settings saved and server eligibility verified. The route may contain contextual sponsored recommendations. Paid subscriptions keep ordinary ads off; selecting this provider is a voluntary sponsored-chat exception.', 'success');
      } else {
        void showLocalizedToast('Sponsored AI could not be verified. It may be outside the current pilot geography or server budget, or its configuration may be incomplete. Guide Mode, Local AI and BYOK remain available.', 'error');
      }
      renderControls();
      return;
    }
    if (provider.id !== 'guide') {
      void showLocalizedToast(`${provider.label} preferences were saved. Complete a current compatibility check in Vault before EONBOT can use it.`, 'success');
      window.location.assign('/vault#provider-check');
      return;
    }

    void showLocalizedToast('Non-secret AI chat settings saved. Credentials and provider verification are managed only in Vault.', 'success');
  });


    dom.controls.querySelector('#chat-detect-local')?.addEventListener('click', () => {
      window.location.assign('/local-ai#eonbot-local-ai-setup');
    });
    debug.__eonChatControlsDebug = { startedAt: debug.__eonChatControlsDebug.startedAt, completedAt: Date.now(), status: 'ready' };
  } catch (error) {
    debug.__eonChatControlsDebug = { startedAt: debug.__eonChatControlsDebug.startedAt, completedAt: Date.now(), status: 'failed', errorName: error instanceof Error ? error.name : 'unknown' };
    dom.controls.dataset.ready = 'error';
    dom.controls.innerHTML = '<p class="chat-note">AI setup controls could not load. Your existing Chat and Vault settings were not changed.</p>';
  }
}

function restoreSession() {
  const resolved = resolveChatThread({ search: window.location.search });
  state.activeThreadId = resolved.thread.id;
  const history = Array.isArray(resolved.thread.messages) ? resolved.thread.messages : [];
  if (!history.length) {
    renderEmptyChatState();
    emitChatThreadChange();
    return false;
  }

  history.forEach((/** @type {any} */ entry) => {
    if (!entry || typeof entry !== 'object') return;
    const role = entry.role === 'user' ? 'user' : 'bot';
    const text = sanitizeChatInput(entry.text || '');
    if (!text) return;
    const /** @type {any} */
normalized = {
      role,
      text,
      source: entry.source === 'ai' ? 'ai' : role === 'user' ? 'user' : 'guide',
      meta: entry.meta && typeof entry.meta === 'object' ? sanitizeAiMessageMeta(entry.meta) : null,
      speech: normalizeSpeechMessageMetadata(entry.speech),
      attachments: normalizeChatAttachments(entry.attachments),
      toolCTA: entry.toolCTA && typeof entry.toolCTA === 'object'
        ? {
            label: String(entry.toolCTA.label || '').slice(0, 80),
            url: sanitizeUiLink(entry.toolCTA.url, '/')
          }
        : null,
      actionCTA: entry.actionCTA && typeof entry.actionCTA === 'object'
        ? {
            label: String(entry.actionCTA.label || '').slice(0, 80),
            action: String(entry.actionCTA.action || '').slice(0, 40)
          }
        : null,
      commandProposal: sanitizeCommandProposal(entry.commandProposal),
      commandReceipt: sanitizeCommandReceipt(entry.commandReceipt),
      quickReplies: Array.isArray(entry.quickReplies)
        ? entry.quickReplies.map((/** @type {any} */ value) => sanitizeChatInput(value).slice(0, 80)).filter(Boolean).slice(0, 6)
        : []
    };
    state.conversation.push(normalized);
    renderMessage(normalized);
  });
  emitChatThreadChange();
  return true;
}

async function _renderWelcome() {
  const stats = getProfileStats();
  const greeting = state.personalizedGreetingEnabled && stats.alias
    ? `👋 Hey ${stats.alias}.`
    : '👋 Welcome.';
  const localizedText = await translateChatUi(`${greeting} Tell me what you want to do—in writing or by voice. Guide Mode can explain EONAPP and prepare the next step without an AI key. Voice output stays off until you enable it. For model-powered work, choose Make Local AI ready for Local Lite or a verified desktop runtime, or connect your own provider securely outside chat. EONBOT never asks for API keys in a message.`, 'guide');
  pushMessage({
    role: 'bot',
    source: 'guide',
    text: localizedText,
    actionCTA: await localizeActionCTA({ label: 'Start voice now', action: 'startVoice' }),
    quickReplies: await localizeQuickReplies(['Make Local AI ready', 'Explain provider setup', 'Open AI Cockpit', 'Make me a website'])
  });
}

function getKernelPrivacyClass() {
  const provider = String(state.settings?.provider || '').toLowerCase();
  if (state.settings?.assistantMode === 'guide' || ['guide', 'browserlocal', 'ollama', 'lmstudio', 'webllm', 'jan', 'llama-cpp'].includes(provider)) return 'device-local';
  return 'direct-to-provider';
}

function getKernelCompletionTruth(result = {}) {
  if (result?.type !== 'ai') return Object.freeze({ provenance: 'guide', truthLabel: 'drafted' });
  if (result?.response?.meta?.local === true) return Object.freeze({ provenance: 'local-runtime', truthLabel: 'generated-locally' });
  return Object.freeze({ provenance: 'direct-provider', truthLabel: 'generated-by-selected-provider' });
}

async function buildAssistantReply(/** @type {any} */ text, /** @type {any} */ historyForAI, /** @type {any} */ requestContext = {}) {
  const setupReply = await buildDirectSetupReply(text);
  if (setupReply) return setupReply;

  const cmd = parseEonKernelPlanCommand(text);
  if (cmd) {
    const job = await createEonKernelMissionDraft({
      origin: 'chat-command',
      intentText: cmd.payload,
      privacyClass: 'device-local'
    });

    const steps = Array.isArray(job.steps) ? job.steps.join(' -> ') : 'plan';
    if (job.status === 'blocked') {
      return {
        type: 'guide',
        response: {
          text: `Orchestration request blocked by policy: ${job.notes || 'action is not allowed'}`,
          toolCTA: { label: 'Open advanced review', url: '/workspace' },
          quickReplies: ['Show policy summary', 'Create safe workflow']
        }
      };
    }

    const approvalText = job.status === 'awaiting_approval'
      ? 'The plan includes steps that would need human approval before any future action.'
      : 'The plan is saved locally. No agent is running in the background.';

    return {
      type: 'guide',
      response: {
        text: `Orchestration plan created: ${steps}. ${approvalText}`,
        toolCTA: { label: 'Open advanced review', url: '/workspace' },
        quickReplies: ['Prepare distribution draft', 'Review policy guardrails']
      }
    };
  }

  const routingText = await toEnglishForRouting(text);
  const attachmentCount = Number(requestContext.attachmentCount || 0);
  const providerId = String(state.settings.provider || 'guide').toLowerCase();
  const privateOrByokProviderSelected = providerId !== 'guide' && providerId !== 'vexrail';
  const intent = getGuideIntent(routingText);

  if (state.settings.assistantMode === 'guide') return { type: 'guide', response: state.bot.respond(routingText) };

  let autoSponsoredMode = '';
  let vexrailStatus = null;
  if (state.settings.assistantMode === 'auto' && !privateOrByokProviderSelected && attachmentCount === 0) {
    vexrailStatus = await readVexrailAutoStatus();
    if (vexrailStatus?.guestOneShotAvailable === true && vexrailStatus?.signedIn !== true) autoSponsoredMode = 'guest_one_shot';
    else if (vexrailStatus?.eligible === true && vexrailStatus?.accessClass === 'signed_in_free') autoSponsoredMode = 'signed_in_free';
  }
  const guestSponsoredBootstrap = requestContext.allowGuestSponsoredBootstrap === true && autoSponsoredMode === 'guest_one_shot';
  const signedInFreeSponsoredDefault = autoSponsoredMode === 'signed_in_free';
  const guideIntentIsProductHelp = Boolean(intent) && /(?:eonapp|eonbot|local ai|vault|provider|api key|workspace|project|library|create|eon city|eoncity|settings|profile|share|invite|referral|install|guide mode)/i.test(routingText);
  if (!guestSponsoredBootstrap && !signedInFreeSponsoredDefault && state.settings.assistantMode === 'auto' && guideIntentIsProductHelp) {
    return { type: 'guide', response: state.bot.respond(routingText) };
  }

  if (signedInFreeSponsoredDefault && !getProviderVerification('vexrail')?.ready) {
    const refreshed = await verifyProviderReadiness('vexrail', '', { modelSelectionPolicy: state.settings.modelSelectionPolicy });
    if (!refreshed?.ok) throw new Error(String(refreshed?.error || refreshed?.status || vexrailStatus?.reason || 'vexrail_dynamic_routing_unavailable'));
  }

  const readiness = signedInFreeSponsoredDefault ? { ready: true } : getAIReadiness(state.settings);
  if (!guestSponsoredBootstrap && !signedInFreeSponsoredDefault && !readiness.ready) {
    if (state.settings.assistantMode === 'advanced' && state.settings.runtimePreference === 'provider-connected') throw new Error(readiness.reason || 'Advanced provider mode is not configured yet.');
    return { type: 'guide', response: state.bot.respond(routingText) };
  }

  // Create a live streaming bubble — replaces typing indicator with progressive text
  let streamBubbleEl = null;
  const dom = getDom();
  const typingRow = doc.getElementById('typing-row');
  if (typingRow && dom.messages) {
    typingRow.id = 'stream-row';
    const wrap = typingRow.querySelector('.msg-bubble-wrap');
    if (wrap) {
      wrap.innerHTML = '';
      const bubble = doc.createElement('div');
      bubble.className = 'msg-bubble ai streaming';
      bubble.id = 'stream-bubble';
      wrap.appendChild(bubble);
      streamBubbleEl = bubble;
    }
  }

  const requestSettings = guestSponsoredBootstrap
    ? { ...state.settings, provider: 'vexrail', assistantMode: 'advanced', runtimePreference: 'provider-connected', modelPinned: false, model: '', replyLanguage: getChatSurfaceLanguage(), requestContext: { ...requestContext, guestSponsoredBootstrap: true, userInitiated: true, consentSource: 'guest-first-prompt', origin: 'chat' } }
    : signedInFreeSponsoredDefault
      ? { ...state.settings, provider: 'vexrail', assistantMode: 'auto', runtimePreference: 'provider-connected', modelPinned: false, model: 'server-dynamic', replyLanguage: getChatSurfaceLanguage(), requestContext: { ...requestContext, sponsoredAutoDefault: true, userInitiated: true, consentSource: 'signed-in-free-auto', origin: 'chat' } }
      : { ...state.settings, replyLanguage: getChatSurfaceLanguage(), requestContext: { ...requestContext, userInitiated: true, consentSource: 'chat-send-action', origin: 'chat' } };
  try {
    const aiReply = await createAIReplyStream({
      input: text,
      history: guestSponsoredBootstrap ? [] : historyForAI,
      settings: requestSettings,
      governor: state.governor,
      onChunk: (/** @type {any} */ chunk) => {
        if (streamBubbleEl) {
          streamBubbleEl.textContent += chunk;
          scrollToBottom();
        }
      }
    });
    doc.getElementById('stream-row')?.remove();
    return { type: 'ai', response: aiReply };
  } catch (error) {
    doc.getElementById('stream-row')?.remove();
    throw error;
  }
}

async function handleSend(/** @type {any} */ explicitText = '', /** @type {any} */ options = {}) {
  const dom = getDom();
  if (state.pending) return;
  const attachmentPreview = getQueuedLocalAttachmentRequest();
  const suppliedText = sanitizeChatInput(explicitText || dom.input?.value);
  const text = suppliedText || (attachmentPreview.attachments.length ? 'Please help me work with the attached local file.' : '');
  if (!text) return;
  if (containsRawCredentialValue(text)) {
    if (dom.input) dom.input.value = '';
    const truth = buildSensitiveCredentialReply();
    pushMessage({ role: 'user', text: 'Sensitive credential removed before sending or saving.', source: 'user' });
    pushMessage({
      role: 'bot',
      source: 'guide',
      text: truth.text,
      toolCTA: truth.toolCTA,
      actionCTA: truth.actionCTA,
      quickReplies: truth.quickReplies
    });
    return;
  }

  const allowance = chatDailyGuideUsage.getAllowance();
  if (!allowance.unlimited && allowance.remaining <= 0) {
    pushMessage({
      role: 'bot',
      source: 'guide',
      text: await translateChatUi('The daily EONBOT guidance allowance is used for today. Choose Make Local AI ready for Local Lite or a verified desktop runtime, or verify your own Connected provider in Vault for model-powered work. Your text box stays available so you can copy or save your prompt.', 'guide'),
      toolCTA: await localizeToolCTA({ label: 'Make Local AI ready', url: '/local-ai#eonbot-local-ai-setup' }),
      quickReplies: await localizeQuickReplies(['Make Local AI ready', 'Explain provider setup', 'Open AI Cockpit'])
    });
    updateChatDailyLimitPanel();
    return;
  }

  if (dom.input) {
    dom.input.value = '';
    syncComposerHeight();
  }

  const attachmentRequest = consumeQueuedLocalAttachmentRequest();
  if (attachmentRequest.attachments.length) {
    try { window.dispatchEvent(new CustomEvent('eon:chat-attachments-consumed')); } catch {}
  }
  const textForRouting = attachmentRequest.context ? `${text}\n\n${attachmentRequest.context}` : text;
  const historyBeforeSend = state.conversation.slice();
  void emitEonGrowthEvent('first_prompt');
  state.pending = true;
  setEonbotEmotion('thinking');
  state.governor.beginRequest();

  pushMessage({
    role: 'user',
    text,
    source: 'user',
    speech: normalizeSpeechMessageMetadata(options.speech),
    attachments: attachmentRequest.attachments
  });

  const detectedLang = shouldPromptLanguageSwitchForText(text);
  if (detectedLang) {
    pushMessage({
      role: 'bot',
      source: 'guide',
      text: await translateChatUi(`I noticed you are writing in ${detectedLang.toUpperCase()}. Should I switch EONAPP and the chat to this language?`, 'guide'),
      actionCTA: await localizeActionCTA({ label: `Switch to ${detectedLang.toUpperCase()}`, action: `switchLang:${detectedLang}` })
    });
  }

  showTyping();

  let kernelContext = null;
  try {
    kernelContext = beginEonKernelForegroundTask({
      intentText: text,
      privacyClass: getKernelPrivacyClass(),
      // This is a bounded selected-provider ID for an optional local City
      // visual only. It never contains model, endpoint, key, prompt or output.
      providerId: String(state?.settings?.provider || 'guide'),
      origin: 'chat'
    });
  } catch {
    // The existing chat remains usable if a browser lacks Web Crypto. No task is recorded.
  }

  try {
    const routingSeed = mapMultilingualIntentKeyword(textForRouting) || textForRouting;
    const result = await buildAssistantReply(routingSeed, historyBeforeSend, { allowGuestSponsoredBootstrap: true, attachmentCount: attachmentRequest.attachments.length, attachmentCoverage: attachmentRequest.coverage });
    removeTyping();

    const actionCardPlan = buildEonbotLocalActionCardPlan(text);
    if (kernelContext) {
      const truth = getKernelCompletionTruth(result);
      await completeEonKernelForegroundTask(kernelContext, {
        output: result.response.text,
        provenance: truth.provenance,
        truthLabel: truth.truthLabel,
        requiresReview: actionCardPlan.matched,
        providerId: String(result?.response?.meta?.providerId || state?.settings?.provider || 'guide')
      });
    }

    const localizedText = await translateChatUi(result.response.text, result.type === 'ai' ? 'technical' : 'guide');

    if (result.type === 'guide') {
      const creatorMode = creatorModeFromCommandReceipt(result.response.commandReceipt);
      pushMessage({
        role: 'bot',
        text: localizedText,
        source: 'guide',
        toolCTA: await localizeToolCTA(result.response.toolCTA),
        actionCTA: await localizeActionCTA(result.response.actionCTA),
        commandProposal: sanitizeCommandProposal(result.response.proposal),
        commandReceipt: sanitizeCommandReceipt(result.response.commandReceipt),
        shareIntent: result.response.shareIntent || null,
        actionCardPlan,
        quickReplies: await localizeQuickReplies(result.response.quickReplies)
      }, creatorMode ? { transientCreatorIntent: { mode: creatorMode, prompt: text } } : {});
      incrementDailyGuideUsage();
    } else {
      pushMessage({
        role: 'bot',
        text: localizedText,
        source: 'ai',
        meta: result.response.meta,
        toolCTA: result.response.meta?.monetization?.guestOneShot === true
          ? await localizeToolCTA({ label: 'Sign in to keep using Sponsored AI', url: '/api/auth/google/start?returnTo=%2F' })
          : null
      });
    }
  } catch (/** @type {any} */
error) {
    removeTyping();
    if (kernelContext) failEonKernelForegroundTask(kernelContext);
    const rawMsg = String((/** @type {Error} */ (error)).message || '');
    const fallback = state.bot.respond(text);
    // Map common API errors to actionable user-facing guidance
    let userMsg = rawMsg;
    let errorToolCTA = fallback.toolCTA;
    let errorQuickReplies = ['Make Local AI ready', 'Explain provider setup', 'Check my settings'];
    if (rawMsg.includes('vexrail_sign_in_required')) {
      userMsg = 'Sponsored AI is available only to signed-in EONAPP accounts. Sign in with Google to continue, or use Guide Mode, Local AI or BYOK without Vexrail.';
      errorToolCTA = { label: 'Sign in with Google', url: '/api/auth/google/start?returnTo=/' };
      errorQuickReplies = ['Make Local AI ready', 'Try Guide Mode', 'Check my settings'];
    } else if (rawMsg.includes('vexrail_paid_ad_free')) {
      userMsg = 'Your paid subscription remains ad-free by default. Sponsored AI is available only when you explicitly select that sponsored provider and the same country/profitability gate permits it. Ordinary display ads stay off. Use Local AI or a verified BYOK provider whenever you want an unsponsored route.';
      errorToolCTA = { label: 'Open AI setup', url: CANONICAL_AI_SETUP_PATH };
      errorQuickReplies = ['Make Local AI ready', 'Review Connected AI', 'Check my settings'];
    } else if (rawMsg.includes('vexrail_paid_fair_use_limited')) {
      userMsg = 'Sponsored AI reached the paid-account fair-use ceiling. It protects the shared Vexrail balance from abnormal automation or compromised accounts. Ordinary paid features remain available.';
      errorToolCTA = { label: 'Review Connected AI', url: CANONICAL_AI_SETUP_PATH };
      errorQuickReplies = ['Review Connected AI', 'Make Local AI ready', 'Try Guide Mode'];
    } else if (rawMsg.includes('vexrail_account_daily_limited')) {
      userMsg = 'Sponsored AI reached this account’s daily economic safety allowance. No further request was sent upstream. Guide Mode, Local AI and BYOK remain available.';
      errorToolCTA = { label: 'Try Guide Mode', url: '/' };
      errorQuickReplies = ['Try Guide Mode', 'Make Local AI ready', 'Review Connected AI'];
    } else if (rawMsg.includes('vexrail_network_rate_limited') || rawMsg.includes('vexrail_network_daily_limited') || rawMsg.includes('vexrail_network_restricted') || rawMsg.includes('vexrail_network_unverified') || rawMsg.includes('vexrail_automated_traffic')) {
      userMsg = 'Sponsored AI is unavailable on this network under EONAPP’s anti-abuse policy. The request was not sent to Vexrail. Guide Mode, Local AI and BYOK remain available.';
      errorToolCTA = { label: 'Try Guide Mode', url: '/' };
      errorQuickReplies = ['Try Guide Mode', 'Make Local AI ready', 'Review Connected AI'];
    } else if (rawMsg.includes('vexrail_human_verification_required') || rawMsg.includes('vexrail_human_verification_unavailable')) {
      userMsg = 'Sponsored AI could not complete its human-verification check. No sponsored AI request was sent. Retry once, or use Guide Mode, Local AI or BYOK.';
      errorToolCTA = { label: 'Try Guide Mode', url: '/' };
      errorQuickReplies = ['Try Guide Mode', 'Make Local AI ready', 'Check my settings'];
    } else if (rawMsg.includes('vexrail_rate_limited')) {
      userMsg = 'Sponsored AI reached its hourly signed-in FREE-account safety limit. Your request was not sent upstream after the limit was reached. Use Local AI or a verified BYOK provider, or try Sponsored AI again later.';
      errorToolCTA = { label: 'Make Local AI ready', url: '/local-ai#eonbot-local-ai-setup' };
      errorQuickReplies = ['Make Local AI ready', 'Review Connected AI', 'Try Guide Mode'];
    } else if (rawMsg.includes('vexrail_geo_unavailable') || rawMsg.includes('vexrail_geo_disabled')) {
      userMsg = 'Sponsored AI is not enabled for this browser under the current country/economic rollout. Guide Mode remains available, and you can use Local AI or a verified BYOK provider without routing the prompt through Vexrail.';
      errorToolCTA = { label: 'Try Guide Mode', url: '/' };
      errorQuickReplies = ['Try Guide Mode', 'Make Local AI ready', 'Review Connected AI'];
    } else if (rawMsg.includes('vexrail_country_budget_limited')) {
      userMsg = 'Sponsored AI reached the safety budget for this pilot country. No further request was sent upstream. Guide Mode, Local AI and BYOK remain available.';
      errorToolCTA = { label: 'Try Guide Mode', url: '/' };
      errorQuickReplies = ['Try Guide Mode', 'Make Local AI ready', 'Review Connected AI'];
    } else if (rawMsg.includes('vexrail_global_budget_limited')) {
      userMsg = 'Sponsored AI reached EONAPP’s global safety budget for the current period. No further request was sent upstream. Guide Mode, Local AI and BYOK remain available.';
      errorToolCTA = { label: 'Try Guide Mode', url: '/' };
      errorQuickReplies = ['Try Guide Mode', 'Make Local AI ready', 'Review Connected AI'];
    } else if (rawMsg.includes('vexrail_paid_opt_in_required')) {
      userMsg = 'Your paid subscription remains ad-free by default. To use Sponsored AI, explicitly select EON Sponsored AI · Vexrail; that opt-in applies only to sponsored chat and does not re-enable ordinary display ads.';
      errorToolCTA = { label: 'Open AI setup', url: CANONICAL_AI_SETUP_PATH };
      errorQuickReplies = ['Review Connected AI', 'Make Local AI ready', 'Check my settings'];
    } else if (rawMsg.includes('vexrail_rate_limit_unavailable')) {
      userMsg = 'Sponsored AI is temporarily unavailable because its server-side safety authority could not be verified. The request was not sent to Vexrail.';
      errorToolCTA = { label: 'Make Local AI ready', url: '/local-ai#eonbot-local-ai-setup' };
      errorQuickReplies = ['Make Local AI ready', 'Review Connected AI', 'Try Guide Mode'];
    } else if (rawMsg.includes('vexrail_not_configured') || rawMsg.includes('vexrail_identity_unavailable') || rawMsg.includes('vexrail_billing_unavailable')) {
      userMsg = 'Sponsored AI is temporarily unavailable because its server configuration or eligibility authority could not be verified. EONBOT did not expose a publisher key or silently reroute your request.';
      errorToolCTA = { label: 'Make Local AI ready', url: '/local-ai#eonbot-local-ai-setup' };
      errorQuickReplies = ['Make Local AI ready', 'Try Guide Mode', 'Check my settings'];
    } else if (rawMsg.toLowerCase().includes('api key') || rawMsg.toLowerCase().includes('add an api key') || rawMsg.toLowerCase().includes('401') || rawMsg.toLowerCase().includes('unauthorized')) {
      userMsg = 'No configured provider credential is available for this browser profile. EONBOT never accepts credentials in chat. Open Vault for a Connected provider, or choose Make Local AI ready for a private device-local route.';
      errorToolCTA = { label: 'Open secure provider setup', url: CANONICAL_AI_KEYS_PATH };
      errorQuickReplies = ['Make Local AI ready', 'Explain provider setup', 'Local AI on this device'];
    } else if (rawMsg.toLowerCase().includes('model') || rawMsg.toLowerCase().includes('not found') || rawMsg.toLowerCase().includes('does not exist')) {
      userMsg = 'The selected model is unavailable. Refresh the verified model list in Vault or Local AI and choose a replacement explicitly. EONBOT did not switch models or providers for you.';
      errorToolCTA = { label: 'Make Local AI ready', url: '/local-ai#eonbot-local-ai-setup' };
      errorQuickReplies = ['Make Local AI ready', 'Review Connected AI', 'Try again'];
    } else if (rawMsg.toLowerCase().includes('rate limit') || rawMsg.toLowerCase().includes('quota') || rawMsg.toLowerCase().includes('too many')) {
      userMsg = 'The selected provider reached a rate or quota limit. Wait and retry, use Guide Mode, or explicitly select another provider after its own verification.';
      errorQuickReplies = ['Switch to Groq', 'Switch to Gemini', 'Try again'];
    } else if (rawMsg.toLowerCase().includes('network') || rawMsg.toLowerCase().includes('fetch') || rawMsg.toLowerCase().includes('failed to fetch')) {
      userMsg = 'The selected AI route could not be reached. Choose Make Local AI ready to recheck Local Lite or an approved desktop runtime, or review the explicitly selected Connected provider. EON did not switch routes automatically.';
      errorQuickReplies = ['Make Local AI ready', 'Try again', 'Check my settings'];
    } else if (rawMsg.toLowerCase().includes('guide mode')) {
      userMsg = 'Guide Mode uses built-in product guidance and can work with supported browser dictation and spoken replies. Model-powered answers require a verified Local AI path or a Connected provider configured securely outside chat.';
      errorToolCTA = { label: 'Make Local AI ready', url: '/local-ai#eonbot-local-ai-setup' };
      errorQuickReplies = ['Make Local AI ready', 'Explain provider setup', 'Local AI on this device'];
    } else if (rawMsg) {
      userMsg = `${rawMsg}`;
    }
    setEonbotEmotion('error', userMsg);
    pushMessage({
      role: 'bot',
      source: 'guide',
      text: await translateChatUi(userMsg, 'guide'),
      toolCTA: await localizeToolCTA(errorToolCTA),
      actionCTA: await localizeActionCTA(fallback.actionCTA),
      quickReplies: await localizeQuickReplies(errorQuickReplies)
    });
  } finally {
    state.pending = false;
    state.governor.endRequest();
    refreshEonbotEmotion();
  }
}

function bindInput() {
  const dom = getDom();
  dom.send?.addEventListener('click', () => handleSend());
  dom.input?.addEventListener('input', syncComposerHeight);
  dom.input?.addEventListener('keydown', (/** @type {any} */ event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      handleSend();
    }
  });
  syncComposerHeight();
}

async function localizeChatStaticUi() {
  const /** @type {any} */
targets = [
    ['#chat-runtime-label', 'Ready to help'],
    ['#chat-input', 'Message EONBOT…', 'placeholder']
  ];
  for (const [selector, source, attr] of targets) {
    const /** @type {any} */
node = doc.querySelector(selector);
    if (!node) continue;
    const localized = await translateChatUi(source, 'guide');
    if (attr === 'placeholder') node.setAttribute('placeholder', localized);
    else node.textContent = localized;
  }
}

function getPrefillPrompt() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = sanitizeChatInput(params.get('q') || '');
  if (fromQuery) return fromQuery;

  try {
    const stored = sanitizeChatInput(localStorage.getItem('eon:chat:prefill:v1') || '');
    if (stored) {
      localStorage.removeItem('eon:chat:prefill:v1');
      return stored;
    }
  } catch {}

  return '';
}

function getReviewDraftPrompt() {
  try {
    const raw = localStorage.getItem('eon:chat:draft:v1');
    if (!raw) return '';
    localStorage.removeItem('eon:chat:draft:v1');
    const parsed = JSON.parse(raw);
    if (parsed?.schema !== 'eon.chat.review-draft.v1') return '';
    const ageMs = Date.now() - Number(parsed.createdAt || 0);
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > 30 * 60 * 1000) return '';
    return sanitizeChatInput(parsed.text || '');
  } catch {
    return '';
  }
}

function applyReviewDraftPrompt() {
  const prompt = getReviewDraftPrompt();
  if (!prompt) return false;
  const dom = getDom();
  if (!dom.input) return false;
  dom.input.value = prompt;
  syncComposerHeight();
  dom.input.focus();
  return true;
}

function bindExternalPrompts() {
  window.addEventListener('eonbot:ask', (/** @type {any} */ event) => {
    const prompt = sanitizeChatInput(event?.detail?.prompt || '');
    if (!prompt) return;
    const dom = getDom();
    if (dom.input) {
      dom.input.value = prompt;
      dom.input.focus();
      handleSend(prompt);
    }
  });

  window.addEventListener('eonbot:remote-command', async () => {
    pushMessage({
      role: 'bot',
      source: 'guide',
      text: await translateChatUi('Remote agent commands are disabled in this release. Use EONBOT to create a local plan, then review it in Workspace before taking any external action.', 'guide'),
      toolCTA: await localizeToolCTA({ label: 'Open AI Cockpit', url: '/workspace' })
    });
  });
}


async function initChatPage() {
  bootEonGrowthAttribution();
  enterCityMode('chat', { entry: 'chat' });
  bindCityModeLinkTracking(document, 'chat', { entry: 'chat' });
  await ensureChatStylesheets();
  initAppLanguage();
  localizeStatic(document);
  initSiteShell();
  applyTheme();
  initThemeToggle();
  ensureProfile();
  state.governor = createLoadGovernor();
  exposeEonbotEmotionDiagnostics();
  refreshEonbotEmotion();

  if ('serviceWorker' in navigator) {
    void registerEonServiceWorker();
  }

  initVoiceControls();
  applyEonbotInteractionPreferenceState(initialEonbotInteractionPreferences);
  window.addEventListener('eon:eonbot-interaction-preferences-changed', () => {
    applyEonbotInteractionPreferenceState(readEonbotInteractionPreferences());
  });
  bindInput();
  document.querySelectorAll('[data-eon-chat-starter]').forEach((button) => {
    button.addEventListener('click', () => {
      const prompt = sanitizeChatInput(button.getAttribute('data-eon-chat-starter') || '');
      const dom = getDom();
      if (!prompt || !dom.input) return;
      dom.input.value = prompt;
      dom.input.focus();
    });
  });
  bindExternalPrompts();
  updateInputPlaceholder();
  void localizeChatStaticUi();
  updateHeaderStatus();
  renderControls();

  doc.addEventListener('eon:load-governor', () => {
    updateHeaderStatus();
    refreshEonbotEmotion();
  });

  doc.addEventListener('language-changed', () => {
    localizeStatic(document);
    void localizeChatStaticUi();
    updateInputPlaceholder();
    updateHeaderStatus();
    renderControls();
    const next = String(getCurrentLanguage() || 'en').toLowerCase();
    const chatPref = String(getChatLanguagePreference() || 'auto').toLowerCase();
    if (next && chatPref && chatPref !== 'auto' && chatPref !== next && state.conversation.length > 0 && !shouldRateLimitChatLanguagePrompt(next)) {
      void (async () => {
        pushMessage({
          role: 'bot',
          source: 'guide',
          text: await translateChatUi(`The app is now in ${next.toUpperCase()}. Should I switch the chat to this language too?`, 'guide'),
          actionCTA: await localizeActionCTA({ label: `Follow ${next.toUpperCase()}`, action: `followChatLanguage:${next}` })
        });
      })();
    }
  });

  // Abort all in-flight AI requests when user leaves or hides the page
  doc.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      state.governor.abortAll();
    }
  });
  window.addEventListener('beforeunload', () => {
    state.governor.abortAll();
  });


  const params = new URLSearchParams(window.location.search);
  if (params.get('new') === '1') {
    startNewChatThread();
  }
  const restored = params.get('new') === '1' ? false : restoreSession();
  const prefill = getPrefillPrompt();
  const reviewDraft = prefill ? false : applyReviewDraftPrompt();
  if (!restored && !prefill && !reviewDraft) renderEmptyChatState();
  if (prefill) void handleSend(prefill);

  window.addEventListener('eon:chat-new-thread', (event) => {
    startNewChatThread({ focus: Boolean(event?.detail?.focus) });
  });
  window.addEventListener('eon:chat-rename-thread', renameCurrentChatThread);
  window.addEventListener('eon:chat-delete-thread', deleteCurrentChatThread);
}

if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', () => { void initChatPage(); }, { once: true });
else void initChatPage();

window.ChatVoiceEvidence = {
  getVoiceDiagnostics,
  getSpeechLanguagePreference: () => ({ preference: getSpeechLanguagePreference(), locale: getSpeechLocale(), language: getVoiceLanguageBase(getSpeechLanguagePreference()) }),
  captureVoiceDiagnostics,
  runVoiceSelfTest,
  getLatestVoiceDiagnostics() {
    try {
      return JSON.parse(localStorage.getItem('eon:chat:voice-diagnostics:v1') || 'null');
    } catch {
      return null;
    }
  }
};
