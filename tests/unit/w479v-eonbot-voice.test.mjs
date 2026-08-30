import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEonbotVoiceCapabilityGateway } from '../../assets/js/chat/eonbot-voice-capability-gateway.js';
import { W479V_REQUIRED_VOICE_STATES, W479V_TRUTH, validateW479VEonbotVoiceContract } from '../../config/w479v-eonbot-voice-contract.mjs';
import { inspectW479VEonbotVoice } from '../../scripts/w479v-eonbot-voice-gate.mjs';

test('W623F lets supported browser voice work with deterministic Guide replies', () => {
  const capability = buildEonbotVoiceCapabilityGateway({
    activeMode: 'guide', recognitionSupported: true, synthesisSupported: true, microphoneCaptureSupported: true
  });
  assert.equal(capability.mode, 'voice-ready');
  assert.equal(capability.showDictate, true);
  assert.equal(capability.showUseVoice, true);
  assert.equal(capability.activeAi, false);
  assert.equal(capability.guideRepliesAvailable, true);
  assert.equal(capability.modelPoweredRepliesAvailable, false);
  assert.equal(capability.noAutomaticMicrophone, true);
});

test('W623F keeps browser voice separate from the active AI route', () => {
  const local = buildEonbotVoiceCapabilityGateway({
    activeMode: 'local', recognitionSupported: true, synthesisSupported: true, microphoneCaptureSupported: true
  });
  assert.equal(local.mode, 'voice-ready');
  assert.equal(local.dictationReady, true);
  assert.equal(local.voiceReady, true);
  assert.match(local.privacyNote, /browser speech/i);

  const blocked = buildEonbotVoiceCapabilityGateway({
    activeMode: 'connected', recognitionSupported: false, synthesisSupported: true, microphoneCaptureSupported: true
  });
  assert.equal(blocked.mode, 'blocked');
  assert.equal(blocked.dictationReady, false);
  assert.equal(blocked.showDictate, true);
});

test('W479-V contract and source gate stay fail-closed', () => {
  assert.deepEqual(validateW479VEonbotVoiceContract(), []);
  assert.ok(W479V_REQUIRED_VOICE_STATES.includes('voice-ready'));
  assert.equal(W479V_TRUTH.dictateAutoSend, false);
  const report = inspectW479VEonbotVoice({ writeArtifact: false });
  assert.equal(report.sourceStatus, 'pass', report.errors.join('\n'));
});
