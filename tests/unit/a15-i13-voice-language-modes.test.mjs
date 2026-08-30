import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import {
  EON_VOICE_CONSENT_SESSION_KEY,
  authorizeVoiceInput,
  buildVoiceConversationReview,
  clearVoiceConversationConsent,
  getVoiceSessionAuthorityTruth,
  grantVoiceConversationConsent,
  readVoiceConversationConsent
} from '../../assets/js/chat/eon-voice-session-authority.js';
import { buildEonbotVoiceCapabilityGateway } from '../../assets/js/chat/eonbot-voice-capability-gateway.js';
import { getEonbotInteractionPreferenceTruth } from '../../assets/js/chat/eonbot-interaction-preferences.js';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
}

const cryptoImpl = { randomUUID: () => '11111111-2222-4333-8444-555555555555' };
const now = () => Date.parse('2026-08-04T17:00:00.000Z');

test('A15 I13 Dictate requires a tap, remains editable-first and never gains send authority', () => {
  assert.deepEqual(authorizeVoiceInput({ mode: 'dictate', explicitUserAction: false }), {
    ok: false, mode: 'dictate', editableBeforeSend: true, autoSend: false, error: 'explicit-user-action-required'
  });
  assert.deepEqual(authorizeVoiceInput({ mode: 'dictate', explicitUserAction: true }), {
    ok: true, mode: 'dictate', editableBeforeSend: true, autoSend: false, error: ''
  });
});

test('A15 I13 Voice Conversation cannot start before both Beta disclosures are acknowledged', () => {
  const store = new MemoryStorage();
  assert.equal(grantVoiceConversationConsent({ explicitUserAction: false, autoSendAcknowledged: true, continuousListeningAcknowledged: true }, { store, now, cryptoImpl }).error, 'explicit-user-action-required');
  assert.equal(grantVoiceConversationConsent({ explicitUserAction: true, autoSendAcknowledged: true, continuousListeningAcknowledged: false }, { store, now, cryptoImpl }).error, 'voice-disclosures-not-acknowledged');
  assert.equal(store.getItem(EON_VOICE_CONSENT_SESSION_KEY), null);
});

test('A15 I13 consent is session-bounded, redacted and contains no audio, transcript or active-mic state', () => {
  const store = new MemoryStorage();
  const result = grantVoiceConversationConsent({
    explicitUserAction: true,
    autoSendAcknowledged: true,
    continuousListeningAcknowledged: true,
    locale: 'hi-IN',
    routeLabel: 'Local AI + browser voice'
  }, { store, now, cryptoImpl });
  assert.equal(result.ok, true);
  assert.equal(result.receipt.token, '[session-token-redacted]');
  assert.equal(result.receipt.containsAudio, false);
  assert.equal(result.receipt.containsTranscript, false);
  assert.equal(result.receipt.activeMicrophone, false);
  assert.doesNotMatch(JSON.stringify(result.receipt), /11111111-2222/);
  const raw = JSON.parse(store.getItem(EON_VOICE_CONSENT_SESSION_KEY));
  assert.equal(raw.locale, 'hi-IN');
  assert.equal(raw.autoSendFinalTurns, true);
});

test('A15 I13 final spoken turns auto-send only while the exact reviewed consent is current', () => {
  const store = new MemoryStorage();
  const granted = grantVoiceConversationConsent({ explicitUserAction: true, autoSendAcknowledged: true, continuousListeningAcknowledged: true }, { store, now, cryptoImpl });
  assert.equal(authorizeVoiceInput({ mode: 'voice', consentToken: granted.token }, { store, now }).autoSend, true);
  assert.equal(authorizeVoiceInput({ mode: 'voice', consentToken: 'wrong-token' }, { store, now }).ok, false);
  const expiredNow = () => now() + 31 * 60 * 1000;
  assert.equal(readVoiceConversationConsent({ token: granted.token, store, now: expiredNow }).ok, false);
  assert.equal(authorizeVoiceInput({ mode: 'voice', consentToken: granted.token }, { store, now: expiredNow }).autoSend, false);
});

test('A15 I13 Stop clears Voice Conversation send and restart authority immediately', () => {
  const store = new MemoryStorage();
  const granted = grantVoiceConversationConsent({ explicitUserAction: true, autoSendAcknowledged: true, continuousListeningAcknowledged: true }, { store, now, cryptoImpl });
  assert.equal(readVoiceConversationConsent({ token: granted.token, store, now }).ok, true);
  assert.equal(clearVoiceConversationConsent({ store }).ok, true);
  assert.equal(store.getItem(EON_VOICE_CONSENT_SESSION_KEY), null);
  assert.equal(authorizeVoiceInput({ mode: 'voice', consentToken: granted.token }, { store, now }).ok, false);
});

test('A15 I13 review copy distinguishes automatic Voice Conversation from review-first Dictate', () => {
  const review = buildVoiceConversationReview({ locale: 'de-DE', routeLabel: 'Connected AI + browser voice' });
  assert.equal(review.autoSendFinalTurns, true);
  assert.equal(review.continuousListeningUntilStopped, true);
  assert.equal(review.microphoneStartsOnlyAfterConfirmation, true);
  assert.match(review.dictateAlternative, /editable text without automatic sending/i);
  assert.match(review.privacy, /browser or operating-system service/i);
});

test('A15 I13 persistent interaction preferences cannot grant microphone or auto-send authority', () => {
  const truth = getEonbotInteractionPreferenceTruth({ voiceOutputEnabled: true, continuousVoiceEnabled: true });
  assert.match(truth.note, /separate user tap/i);
  assert.match(truth.boundary, /never starts a microphone/i);
  assert.match(truth.boundary, /per-session review/i);
});

test('A15 I13 unsupported browser voice keeps typed fallback permanent', () => {
  const capability = buildEonbotVoiceCapabilityGateway({ activeMode: 'connected', recognitionSupported: false, synthesisSupported: false, microphoneCaptureSupported: false });
  assert.equal(capability.mode, 'blocked');
  assert.match(capability.reason, /keep typing/i);
  assert.equal(capability.fallbackPlan.typedChatAvailable, true);
});

test('A15 I13 active Chat source enforces review, consent and editable-first failure behavior', () => {
  const chat = readFileSync(new URL('../../assets/js/chat-page.js', import.meta.url), 'utf8');
  const index = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const legacy = readFileSync(new URL('../../chat.html', import.meta.url), 'utf8');
  assert.match(chat, /openVoiceConversationReview/);
  assert.match(chat, /grantVoiceConversationConsent/);
  assert.match(chat, /authorizeVoiceInput/);
  assert.match(chat, /consent expired\. The transcript remains editable and was not sent/i);
  assert.match(chat, /startVoiceInput\('dictate', \{ explicitUserAction: true \}\)/);
  assert.doesNotMatch(chat, /continuousVoiceEnabled:\s*true/);
  for (const html of [index, legacy]) {
    assert.match(html, /Voice Conversation \(Beta\)/);
    assert.match(html, /final spoken turn is sent automatically/i);
    assert.match(html, /Use Dictate.*never sends by itself/i);
  }
});

test('A15 I13 authority truth is fail-closed and preserves no audio', () => {
  const truth = getVoiceSessionAuthorityTruth();
  assert.equal(truth.dictateAutoSend, false);
  assert.equal(truth.voiceConversationAutoSendDisclosed, true);
  assert.equal(truth.activeMicrophonePersisted, false);
  assert.equal(truth.transcriptPersisted, false);
  assert.equal(truth.audioPersisted, false);
  assert.equal(truth.stopClearsConsent, true);
  assert.equal(truth.typedFallbackPermanent, true);
});
