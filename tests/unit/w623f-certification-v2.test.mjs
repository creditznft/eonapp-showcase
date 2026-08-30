import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEonbotSystemContext } from '../../assets/js/chat/eonbot-context-pack.js';
import { buildEonbotVoiceCapabilityGateway } from '../../assets/js/chat/eonbot-voice-capability-gateway.js';
import { inspectW623fCertificationV2 } from '../../scripts/w623f-certification-v2-gate.mjs';

test('W623F Guide voice is usable without an AI model when browser speech is available', () => {
  const result = buildEonbotVoiceCapabilityGateway({ activeMode: 'guide', recognitionSupported: true, synthesisSupported: true, microphoneCaptureSupported: true });
  assert.equal(result.mode, 'voice-ready');
  assert.equal(result.activeAi, false);
  assert.equal(result.guideRepliesAvailable, true);
  assert.equal(result.noAutomaticMicrophone, true);
  assert.equal(result.noAudioPersistence, true);
  assert.match(result.privacyNote, /browser or operating-system recognition service/i);
});

test('W623F model context carries the chosen reply language', () => {
  assert.match(buildEonbotSystemContext('', { replyLanguage: 'ar' }), /Reply in Arabic \(ar\)/);
  assert.match(buildEonbotSystemContext('', { replyLanguage: 'hi' }), /Reply in Hindi \(hi\)/);
  assert.match(buildEonbotSystemContext('', { replyLanguage: 'ja' }), /Reply in Japanese \(ja\)/);
});

test('W623F certification board passes internally but remains NO-GO on stale deployment and pending real proofs', () => {
  const board = inspectW623fCertificationV2();
  assert.equal(board.gateOk, true, board.errors.join('\n'));
  assert.equal(board.launchReady, false);
  assert.equal(board.releaseState, 'limited-preview-no-go-public-launch');
  assert.equal(board.deploymentEvidence.conclusion, 'deployment-stale-no-go');
  assert.equal(board.deployedRoutes.find((route) => route.path === '/create')?.parity, false);
  assert.deepEqual(board.productTruth.productLanguages, ['en']);
  assert.equal(board.productTruth.chatGuideLanguages.length, 11);
  assert.match(board.productTruth.guideVoice, /no-model-required/);
  assert.equal(board.launchBlockingDomains.length > 0, true);
});
