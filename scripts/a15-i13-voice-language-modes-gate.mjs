import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EON_VOICE_CONSENT_SESSION_KEY,
  authorizeVoiceInput,
  buildVoiceConversationReview,
  clearVoiceConversationConsent,
  getVoiceSessionAuthorityTruth,
  grantVoiceConversationConsent,
  readVoiceConversationConsent
} from '../assets/js/chat/eon-voice-session-authority.js';
import { buildEonbotVoiceCapabilityGateway } from '../assets/js/chat/eonbot-voice-capability-gateway.js';
import { getEonbotInteractionPreferenceTruth } from '../assets/js/chat/eonbot-interaction-preferences.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EVIDENCE_DIR = path.join(ROOT, 'docs/institutional/a15/evidence');
const OUTPUT = path.join(EVIDENCE_DIR, 'A15_I13_VOICE_LANGUAGE_GATE_RECEIPT.json');
const read = (relative) => readFileSync(path.join(ROOT, relative), 'utf8');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const errors = [];

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

const now = () => Date.parse('2026-08-05T00:30:00.000+05:30');
const cryptoImpl = { randomUUID: () => 'a15-i13-gate-session-token' };
const store = new MemoryStorage();

const dictate = authorizeVoiceInput({ mode: 'dictate', explicitUserAction: true });
if (!dictate.ok || dictate.autoSend || !dictate.editableBeforeSend) errors.push('Dictate is not editable-first and fail-closed against automatic sending.');

const denied = grantVoiceConversationConsent({
  explicitUserAction: true,
  autoSendAcknowledged: true,
  continuousListeningAcknowledged: false
}, { store, now, cryptoImpl });
if (denied.ok || store.getItem(EON_VOICE_CONSENT_SESSION_KEY)) errors.push('Voice Conversation can start without both reviewed disclosures.');

const review = buildVoiceConversationReview({ locale: 'en-US', routeLabel: 'Connected AI + browser voice' });
const granted = grantVoiceConversationConsent({
  explicitUserAction: true,
  autoSendAcknowledged: true,
  continuousListeningAcknowledged: true,
  locale: review.locale,
  routeLabel: review.routeLabel
}, { store, now, cryptoImpl });
if (!granted.ok || granted.receipt?.token !== '[session-token-redacted]') errors.push('Reviewed Voice Conversation consent did not produce a redacted session receipt.');
const authorized = authorizeVoiceInput({ mode: 'voice', consentToken: granted.token }, { store, now });
if (!authorized.ok || !authorized.autoSend || !authorized.continuous) errors.push('Current reviewed Voice Conversation consent does not authorize the bounded session.');
const rawConsent = String(store.getItem(EON_VOICE_CONSENT_SESSION_KEY) || '');
if (/audio|transcript/i.test(rawConsent) && /"(?:containsAudio|containsTranscript)":true/.test(rawConsent)) errors.push('Voice consent persisted audio or transcript content.');
if (/prompt|reply|api.?key|provider.?key/i.test(rawConsent)) errors.push('Voice consent contains private AI or credential material.');

const expired = readVoiceConversationConsent({ token: granted.token, store, now: () => now() + 31 * 60 * 1000 });
if (expired.ok) errors.push('Expired Voice Conversation consent remains valid.');
clearVoiceConversationConsent({ store });
if (store.getItem(EON_VOICE_CONSENT_SESSION_KEY) !== null) errors.push('Stop/clear did not remove the Voice Conversation session authority.');

const blocked = buildEonbotVoiceCapabilityGateway({
  activeMode: 'connected',
  recognitionSupported: false,
  synthesisSupported: false,
  microphoneCaptureSupported: false
});
if (blocked.mode !== 'blocked' || blocked.fallbackPlan?.typedChatAvailable !== true || !/keep typing/i.test(blocked.reason)) errors.push('Unsupported voice does not preserve permanent typed fallback.');

const preferenceTruth = getEonbotInteractionPreferenceTruth({ voiceOutputEnabled: true, continuousVoiceEnabled: true });
if (!/never starts a microphone/i.test(preferenceTruth.boundary) || !/per-session review/i.test(preferenceTruth.boundary)) errors.push('Persistent preferences can imply microphone or automatic-send authority.');

const chatSource = read('assets/js/chat-page.js');
const indexSource = read('index.html');
const legacySource = read('chat.html');
const authoritySource = read('assets/js/chat/eon-voice-session-authority.js');
for (const pattern of [/openVoiceConversationReview/, /grantVoiceConversationConsent/, /authorizeVoiceInput/, /transcript remains editable and was not sent/i]) {
  if (!pattern.test(chatSource)) errors.push(`Active Chat source is missing ${pattern}.`);
}
if (/continuousVoiceEnabled\s*:\s*true/.test(chatSource)) errors.push('Active Chat persists continuous voice as enabled.');
for (const [label, source] of [['index.html', indexSource], ['chat.html', legacySource]]) {
  if (!/Voice Conversation \(Beta\)/.test(source) || !/sent automatically/i.test(source) || !/Use Dictate[\s\S]*never sends by itself/i.test(source)) errors.push(`${label} lacks reviewed Voice Conversation disclosure.`);
}
if (/localStorage|indexedDB|CacheStorage|Math\.random|Date\.now\(\).*token/i.test(authoritySource)) errors.push('Voice session authority uses durable storage or weak token generation.');

const truth = getVoiceSessionAuthorityTruth();
if (truth.dictateAutoSend || !truth.dictateEditableBeforeSend || !truth.voiceConversationAutoSendDisclosed || truth.activeMicrophonePersisted || truth.transcriptPersisted || truth.audioPersisted || !truth.typedFallbackPermanent || !truth.stopClearsConsent) errors.push('Voice session authority truth is weaker than I13.');

const core = {
  schema: 'eonapp.a15.i13.voice-language-gate-receipt.v1',
  generatedAt: new Date().toISOString(),
  wave: 'I13',
  status: errors.length ? 'fail' : 'pass',
  authority: truth,
  review,
  simulations: {
    dictate,
    denied: { ok: denied.ok, error: denied.error },
    granted: granted.receipt,
    authorized,
    expired,
    blockedFallback: {
      mode: blocked.mode,
      typedChatAvailable: blocked.fallbackPlan?.typedChatAvailable === true,
      reason: blocked.reason
    }
  },
  sourceFiles: [
    'assets/js/chat/eon-voice-session-authority.js',
    'assets/js/chat/eon-voice-fallback-strategy.js',
    'assets/js/chat/eonbot-voice-capability-gateway.js',
    'assets/js/chat/eonbot-interaction-preferences.js',
    'assets/js/chat-page.js',
    'assets/css/chat.css',
    'index.html',
    'chat.html',
    'scripts/w394b-multilingual-voice-gate.mjs',
    'scripts/w479v-eonbot-voice-gate.mjs',
    'tests/unit/a15-i13-voice-language-modes.test.mjs'
  ],
  errors
};
const receipt = { ...core, digest: digest(JSON.stringify(core)) };
mkdirSync(EVIDENCE_DIR, { recursive: true });
writeFileSync(OUTPUT, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(`[A15 I13] ${receipt.status.toUpperCase()}: reviewed Voice Conversation, editable Dictate and permanent typed fallback verified.`);
if (errors.length) {
  for (const error of errors) console.error(`[A15 I13] ${error}`);
  process.exitCode = 1;
}
