export const NATIVE_VOICE_STRATEGY_VERSION = 'w623f-native-voice-no-key-strategy-v2';

const LANGUAGE_EXAMPLES = Object.freeze(['en-US', 'hi-IN', 'es-ES', 'ar-SA', 'de-DE', 'fr-FR', 'ja-JP', 'ko-KR', 'pt-BR', 'zh-CN']);

function detectBrowserFamily(userAgent = '') {
  const ua = String(userAgent || '').toLowerCase();
  if (ua.includes('telegram')) return 'telegram-webview';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('edg/')) return 'edge';
  if (ua.includes('chrome') || ua.includes('crios')) return 'chromium';
  if (ua.includes('safari')) return 'safari';
  return 'unknown';
}

export function buildNativeVoiceCapabilityPlan(options = {}) {
  const capabilities = options.capabilities || {};
  const ua = String(options.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''));
  const family = detectBrowserFamily(ua);
  const speechRecognition = Boolean(capabilities.speechRecognition ?? (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)));
  const speechSynthesis = Boolean(capabilities.speechSynthesis ?? (typeof window !== 'undefined' && window.speechSynthesis));
  const mediaRecorder = Boolean(capabilities.mediaRecorder ?? (typeof window !== 'undefined' && window.MediaRecorder));
  const getUserMedia = Boolean(capabilities.getUserMedia ?? (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia));
  const telegramMiniApp = Boolean(options.telegramMiniApp);

  const warnings = [];
  if (!speechRecognition) warnings.push('Native speech recognition is not exposed in this browser/runtime. Use typed input fallback.');
  if (family === 'firefox') warnings.push('Firefox does not provide dependable browser SpeechRecognition for this use case.');
  if (family === 'safari') warnings.push('Safari speech recognition is partial and should be treated as best-effort, especially in webviews/PWA mode.');
  if (telegramMiniApp) warnings.push('Telegram Mini App webviews may block or hide microphone permission prompts; route heavy voice work to the full browser when needed.');
  if (!getUserMedia) warnings.push('Microphone capture needs HTTPS and getUserMedia support.');

  return {
    version: NATIVE_VOICE_STRATEGY_VERSION,
    browserFamily: family,
    noUserApiKeyRequiredForCapture: speechRecognition || mediaRecorder || getUserMedia,
    speechRecognition,
    speechSynthesis,
    mediaRecorder,
    getUserMedia,
    telegramMiniApp,
    recommendedMode: speechRecognition && !telegramMiniApp ? 'native-live-dictation' : getUserMedia ? 'recording-or-typed-fallback' : 'typed-fallback',
    languageExamples: LANGUAGE_EXAMPLES,
    truth: 'Out-of-the-box multilingual voice can use native browser APIs where available, but there is no free universal browser speech recognition layer that works in every browser, every language, and every Telegram WebView.',
    productDecision: 'Use browser speech as the no-key convenience path for Dictate and spoken Guide replies, keep typing permanent, and never call it offline local speech unless a separately proven local STT/TTS adapter is active.',
    warnings
  };
}

export function buildVoiceCeoRoadmap() {
  return {
    decision: 'Use native browser voice as the free default; do not promise universal voice recognition.',
    phase1: [
      'Chat mic button uses SpeechRecognition/webkitSpeechRecognition when available.',
      'TTS uses SpeechSynthesis when available.',
      'Voice diagnostics explain browser, language, microphone, and Telegram WebView limitations.'
    ],
    phase2: [
      'Add command receipts: transcript → interpreted app command → approval → action.',
      'Keep the eleven-language Chat/Guide and browser-speech matrix separate from the English-only published interface until every additional UI language is certified.',
      'When Telegram WebView blocks microphone, show Open Full Browser for voice.'
    ],
    phase3: [
      'Optional future offline/local ASR model pack for desktop power users, only if bundle size and device performance are acceptable.',
      'Prefer an optional local desktop STT/TTS adapter before considering any server speech route; basic browser voice must never require an EONAPP API key.'
    ]
  };
}

export default { NATIVE_VOICE_STRATEGY_VERSION, buildNativeVoiceCapabilityPlan, buildVoiceCeoRoadmap };
