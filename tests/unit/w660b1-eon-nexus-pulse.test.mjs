import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getEonNexusPulseTruth,
  getEonNexusPulseViewModel
} from '../../assets/js/nexus/eon-nexus-pulse.js';
import {
  getEonNexusChatPulseTruth,
  projectEonNexusChatPulseSnapshot
} from '../../assets/js/nexus/eon-nexus-chat-pulse.js';
import { createDefaultEonNexusState } from '../../assets/js/nexus/eon-nexus-state-contract.js';

const fixedNow = Date.parse('2026-07-19T12:00:00.000Z');

function baseSnapshot() {
  return createDefaultEonNexusState({ now: fixedNow });
}

test('W660B1 Pulse view model exposes the existing Chat route and no invented badge', () => {
  const model = getEonNexusPulseViewModel({
    ...baseSnapshot(),
    conversation: { id: 'chat_safe', label: 'Private conversation', openRoute: '/?thread=chat_safe' },
    eonbot: { state: 'ready', statusLabel: 'Ready', canListen: false },
    results: { count: 0, unread: 0, label: 'No new results', openRoute: '/' },
    approval: { pending: false, count: 0, label: 'No approval waiting', reviewRoute: '/workspace' }
  });
  assert.equal(model.state, 'ready');
  assert.equal(model.chatRoute, '/?thread=chat_safe');
  assert.equal(model.badgeCount, 0);
  assert.equal(model.badgeLabel, '');
  assert.equal(model.canSpeak, false);
});

test('W660B1 Pulse prioritizes a real approval over result count', () => {
  const model = getEonNexusPulseViewModel({
    ...baseSnapshot(),
    eonbot: { state: 'waiting-approval', statusLabel: 'Approval waiting', canListen: true },
    approval: { pending: true, count: 2, label: '2 approvals waiting', reviewRoute: '/workspace?review=1' },
    results: { count: 4, unread: 0, label: '4 results available', openRoute: '/' }
  });
  assert.equal(model.state, 'waiting-approval');
  assert.equal(model.badgeCount, 2);
  assert.equal(model.badgeLabel, '2 approvals waiting');
  assert.equal(model.reviewVisible, true);
  assert.equal(model.reviewRoute, '/workspace?review=1');
  assert.match(model.summary, /approval/i);
});

test('W660B1 Pulse labels only a verified local route as private on device', () => {
  const local = getEonNexusPulseViewModel({
    ...baseSnapshot(),
    route: { mode: 'local', providerId: 'ollama', providerLabel: 'Ollama', privateOnDevice: true, verified: true }
  });
  assert.equal(local.privateRoute, true);
  assert.match(local.routeLabel, /Private on this device/);

  const hosted = getEonNexusPulseViewModel({
    ...baseSnapshot(),
    route: { mode: 'direct-provider', providerId: 'groq', providerLabel: 'Groq', privateOnDevice: false, verified: true }
  });
  assert.equal(hosted.privateRoute, false);
  assert.equal(hosted.routeLabel, 'Groq');
});

test('W660B1 Pulse rejects unsafe external action routes', () => {
  const model = getEonNexusPulseViewModel({
    ...baseSnapshot(),
    conversation: { openRoute: 'https://evil.invalid/chat' },
    approval: { pending: true, count: 1, reviewRoute: 'javascript:alert(1)' },
    results: { count: 1, openRoute: '//evil.invalid/result' }
  });
  assert.equal(model.chatRoute, '/');
  assert.equal(model.reviewRoute, '/workspace');
  assert.equal(model.resultRoute, '/workspace');
});

test('W660B1 Chat projection maps only observable EONBOT states', () => {
  const processing = projectEonNexusChatPulseSnapshot(baseSnapshot(), {
    emotion: 'thinking',
    detail: 'Preparing the safest useful answer.',
    pending: true,
    voiceCapability: { dictationReady: true }
  });
  assert.equal(processing.eonbot.state, 'processing');
  assert.equal(processing.eonbot.canListen, true);
  assert.match(processing.task.stageLabel, /Preparing/);

  const completed = projectEonNexusChatPulseSnapshot(baseSnapshot(), {
    emotion: 'happy',
    detail: 'Reply ready',
    pending: false
  });
  assert.equal(completed.eonbot.state, 'complete');
  assert.equal(completed.task.stageLabel, 'Reply ready');

  const error = projectEonNexusChatPulseSnapshot(baseSnapshot(), {
    emotion: 'error',
    pending: false
  });
  assert.equal(error.eonbot.state, 'error');
});

test('W660B1 truth receipts prohibit automatic or duplicate systems', () => {
  const pulse = getEonNexusPulseTruth();
  assert.equal(pulse.continuousAnimation, false);
  assert.equal(pulse.continuousJsAnimation, false);
  assert.equal(pulse.cssStateMotion, true);
  assert.equal(pulse.hiddenMotionPaused, true);
  assert.equal(pulse.reducedMotionStatic, true);
  assert.equal(pulse.startsVoiceCapture, false);
  assert.equal(pulse.startsAiWork, false);
  assert.equal(pulse.approvesAction, false);
  assert.equal(pulse.rawStoreAccess, false);
  assert.equal(pulse.requiresBabylon, false);
  assert.equal(pulse.requiresGlb, false);

  const chat = getEonNexusChatPulseTruth();
  assert.equal(chat.sameChatComposer, true);
  assert.equal(chat.secondConversationStore, false);
  assert.equal(chat.rawMessageBodyRead, false);
  assert.equal(chat.startsVoiceAutomatically, false);
  assert.equal(chat.polling, false);
  assert.equal(chat.rendererEngine, 'dom-css-state-motion');
});
