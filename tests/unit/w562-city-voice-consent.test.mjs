import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_VOICE_CONSENT_SCHEMA,
  createEonCityVoiceConsentController,
  getEonCityVoiceCapability,
  getEonCityVoiceConsentTruth,
  speakEonCityCaption,
  stopEonCityCaption
} from '../../assets/js/city/eon-city-voice-consent.js';
import { inspectW562CityVoiceConsent } from '../../scripts/w562-city-voice-consent-gate.mjs';
import { grantVoiceConversationConsent } from '../../assets/js/chat/eon-voice-session-authority.js';

function makeEnvironment({ secure = true, recognition = true, microphone = true, telegram = false } = {}) {
  const tracks = [];
  const recognitions = [];
  class FakeRecognition {
    constructor() { recognitions.push(this); }
    start() {
      this.onstart?.();
    }
    stop() {
      this.onend?.();
    }
    emit(text, { final = true } = {}) {
      this.onresult?.({ resultIndex: 0, results: [{ 0: { transcript: text }, isFinal: final }] });
    }
  }
  const getUserMedia = async () => {
    const track = { stopped: false, stop() { this.stopped = true; } };
    tracks.push(track);
    return { getTracks: () => [track] };
  };
  const sessionData = new Map();
  const environment = {
    isSecureContext: secure,
    sessionStorage: { getItem: (key) => sessionData.has(key) ? sessionData.get(key) : null, setItem: (key, value) => sessionData.set(key, String(value)), removeItem: (key) => sessionData.delete(key) },
    navigator: {
      userAgent: telegram ? 'Telegram WebView Chrome' : 'Mozilla/5.0 Chrome/149.0',
      mediaDevices: microphone ? { getUserMedia } : undefined
    },
    speechSynthesis: {},
    SpeechRecognition: recognition ? FakeRecognition : undefined
  };
  return { environment, tracks, recognitions, FakeRecognition };
}

test('W562 reports browser capability as availability, not a proven local voice model or device result', () => {
  const ready = getEonCityVoiceCapability({ environment: makeEnvironment().environment });
  assert.equal(ready.schema, EON_CITY_VOICE_CONSENT_SCHEMA);
  assert.equal(ready.mode, 'ready-for-explicit-dictation');
  assert.equal(ready.browserAssisted, true);
  assert.equal(ready.localSpeechModelClaimed, false);
  assert.equal(ready.physicalDeviceProven, false);
  assert.equal(ready.languageDeviceProven, false);
  assert.equal(ready.captionsFirst, true);
  assert.equal(ready.explicitMicrophoneActionRequired, true);
  assert.equal(ready.continuousListening, false);
  const insecure = getEonCityVoiceCapability({ environment: makeEnvironment({ secure: false }).environment });
  assert.equal(insecure.mode, 'blocked-insecure-context');
  const telegram = getEonCityVoiceCapability({ environment: makeEnvironment({ telegram: true }).environment });
  assert.equal(telegram.mode, 'full-browser-required');
});

test('W562 requires explicit microphone check, stops permission-check tracks immediately, and starts dictation only after a second action', async () => {
  const { environment, tracks, recognitions } = makeEnvironment();
  const controller = createEonCityVoiceConsentController({ environment });
  assert.equal(controller.getSnapshot().microphonePermission, 'not-requested');
  assert.equal((await controller.checkMicrophonePermission()).error, 'explicit-user-action-required');
  assert.equal(controller.startDictation().error, 'explicit-user-action-required');
  const checked = await controller.checkMicrophonePermission({ explicitUserAction: true });
  assert.equal(checked.ok, true);
  assert.equal(checked.stoppedTrackCount, 1);
  assert.equal(tracks[0].stopped, true);
  assert.equal(controller.getSnapshot().microphoneTrackActive, false);
  const started = controller.startDictation({ explicitUserAction: true, locale: 'hi-IN' });
  assert.equal(started.ok, true);
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.dictationState, 'listening');
  assert.equal(snapshot.selectedLocale, 'hi-IN');
  assert.equal(recognitions[0].lang, 'hi-IN');
  assert.equal(snapshot.backgroundListening, false);
});

test('W562 automatic City Voice Conversation microphone turns require the shared reviewed session consent', async () => {
  const { environment, recognitions } = makeEnvironment();
  const controller = createEonCityVoiceConsentController({ environment });
  await controller.checkMicrophonePermission({ explicitUserAction: true });
  assert.equal(controller.startDictation({ mode: 'voice', locale: 'en-US' }).error, 'voice-consent-missing-or-expired');
  const consent = grantVoiceConversationConsent({ explicitUserAction: true, autoSendAcknowledged: true, continuousListeningAcknowledged: true, locale: 'en-US', routeLabel: 'City EONBOT' }, { store: environment.sessionStorage, cryptoImpl: { randomUUID: () => 'city-voice-consent-token' } });
  assert.equal(consent.ok, true);
  const started = controller.startDictation({ mode: 'voice', consentToken: consent.token, locale: 'en-US' });
  assert.equal(started.ok, true);
  assert.equal(controller.getSnapshot().startedByUser, false);
  assert.equal(recognitions.length, 1);
  environment.sessionStorage.removeItem('eon:voice:conversation-consent:a15:v1');
  controller.stopDictation('user-stop');
  assert.equal(controller.startDictation({ mode: 'voice', consentToken: consent.token, locale: 'en-US' }).error, 'voice-consent-missing-or-expired');
  controller.dispose();
});

test('W562 keeps browser dictation review text memory-only and never auto-sends, routes, tools, or persists it', async () => {
  const { environment, recognitions } = makeEnvironment();
  const controller = createEonCityVoiceConsentController({ environment });
  await controller.checkMicrophonePermission({ explicitUserAction: true });
  controller.startDictation({ explicitUserAction: true, locale: 'en-US' });
  assert.equal(controller.getSnapshot().dictationState, 'listening');
  recognitions[0].emit('Review this sentence before using it elsewhere.');
  const listening = controller.getSnapshot();
  assert.equal(listening.dictationState, 'listening', 'the Stop action remains available until the browser ends');
  assert.equal(listening.transcript, 'Review this sentence before using it elsewhere.');
  controller.stopDictation('user-stop');
  const stopped = controller.getSnapshot();
  assert.equal(stopped.dictationState, 'review-ready');
  assert.equal(stopped.microphoneTrackActive, false);
  assert.equal(stopped.transcriptMemoryOnly, true);
  assert.equal(stopped.transcriptPersisted, false);
  assert.equal(stopped.audioPersisted, false);
  assert.equal(stopped.chatMessageSent, false);
  assert.equal(stopped.routeOpened, false);
  assert.equal(stopped.toolExecuted, false);
  assert.equal(stopped.providerRequestCreated, false);
  assert.equal(controller.clearReview().error, 'explicit-user-action-required');
  assert.equal(controller.clearReview({ explicitUserAction: true }).ok, true);
  controller.dispose();
  assert.equal(controller.getSnapshot().transcript, '');
});


test('W605 browser caption speech stays explicit, non-persistent and separate from dictation', () => {
  const spoken = [];
  const environment = {
    speechSynthesis: { cancel: () => spoken.push('cancel'), speak: (utterance) => spoken.push(utterance) },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    navigator: { userAgent: 'Mozilla/5.0 Chrome/149.0' }
  };
  assert.equal(speakEonCityCaption({ environment, text: 'Hello guide.' }).error, 'explicit-user-action-required');
  const result = speakEonCityCaption({ environment, text: 'Hello guide.', locale: 'en-US', explicitUserAction: true });
  assert.equal(result.ok, true);
  assert.equal(result.liveConversation, false);
  assert.equal(result.captionPersisted, false);
  assert.equal(spoken.length, 2);
  assert.equal(spoken[1].text, 'Hello guide.');
  assert.equal(spoken[1].lang, 'en-US');
  assert.equal(stopEonCityCaption({ environment }).error, 'explicit-user-action-required');
  assert.equal(stopEonCityCaption({ environment, explicitUserAction: true }).ok, true);
});

test('W562 source gate and truth remain fail-closed about background listening, storage, automatic execution, and live voice proof', () => {
  const gate = inspectW562CityVoiceConsent();
  const truth = getEonCityVoiceConsentTruth();
  assert.equal(gate.status, 'pass');
  assert.ok(gate.checkCount >= 27);
  assert.equal(truth.microphoneStartsOnBoot, false);
  assert.equal(truth.explicitMicrophoneActionRequired, true);
  assert.equal(truth.explicitDictationActionRequired, true);
  assert.equal(truth.continuousListening, false);
  assert.equal(truth.backgroundListening, false);
  assert.equal(truth.audioPersisted, false);
  assert.equal(truth.transcriptPersisted, false);
  assert.equal(truth.automaticChatSend, false);
  assert.equal(truth.automaticRoute, false);
  assert.equal(truth.automaticToolExecution, false);
  assert.equal(truth.providerRequestCreated, false);
  assert.equal(truth.localSpeechModelClaimed, false);
  assert.equal(truth.liveVoiceProof, false);
});
