#!/usr/bin/env node
/** W479-V/W623F/W659G static gate: Dictate, Voice Conversation and Live Voice stay distinct and explicit. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildEonbotVoiceCapabilityGateway } from '../assets/js/chat/eonbot-voice-capability-gateway.js';
import { W479V_TRUTH, validateW479VEonbotVoiceContract } from '../config/w479v-eonbot-voice-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

export function inspectW479VEonbotVoice({ root = ROOT, writeArtifact = true } = {}) {
  const errors = [...validateW479VEonbotVoiceContract()];
  const chat = read(root, 'assets/js/chat-page.js');
  const gateway = read(root, 'assets/js/chat/eonbot-voice-capability-gateway.js');
  const index = read(root, 'index.html');
  const chatHtml = read(root, 'chat.html');
  const checks = [];
  const check = (id, pass, detail) => {
    checks.push(Object.freeze({ id, pass: Boolean(pass), detail }));
    if (!pass) errors.push(`${id}: ${detail}`);
  };
  const guide = buildEonbotVoiceCapabilityGateway({ activeMode: 'guide', recognitionSupported: true, synthesisSupported: true, microphoneCaptureSupported: true });
  const local = buildEonbotVoiceCapabilityGateway({ activeMode: 'local', recognitionSupported: true, synthesisSupported: true, microphoneCaptureSupported: true });
  const blocked = buildEonbotVoiceCapabilityGateway({ activeMode: 'connected', recognitionSupported: false, synthesisSupported: true, microphoneCaptureSupported: true });

  check('required-files', ['assets/js/chat/eonbot-voice-capability-gateway.js', 'config/w479v-eonbot-voice-contract.mjs', 'scripts/w479v-eonbot-voice-gate.mjs', 'tests/unit/w479v-eonbot-voice.test.mjs'].every((relative) => fs.existsSync(path.join(root, relative))), 'gateway, contract, gate and unit test are present');
  check('guide-browser-voice', guide.activeAi === false && guide.mode === 'voice-ready' && guide.showDictate === true && guide.showUseVoice === true && guide.guideRepliesAvailable === true, 'supported browser voice works with deterministic Guide replies without claiming an active model');
  check('ai-route-independent', local.activeAi === true && local.dictationReady === true && local.voiceReady === true && blocked.mode === 'blocked', 'browser voice capability is independent of model readiness while Local/Connected status remains explicit');
  check('dictate-editable-first', /voiceSession === 'dictate'/.test(chat) && /dom\.input\) dom\.input\.value = finalText/.test(chat) && /Dictation ready to edit/.test(chat) && /Dictate is deliberately editable-first/.test(chat), 'Dictate places final text into the composer and does not auto-send');
  check('voice-explicit-start-stop', /openVoiceConversationReview/.test(chat) && /confirmVoiceConversationStart/.test(chat) && /stopVoiceConversation/.test(chat) && /stopVoiceTooltip/.test(gateway), 'Use Voice has explicit start and immediate stop behavior');
  check('explicit-browser-controls', /voice\.showDictate/.test(chat) && /voice\.showUseVoice/.test(chat) && /dictateBtn\.disabled = !voice\.dictationReady/.test(chat), 'Chat exposes explicit browser voice controls and disables them when unsupported');
  check('no-audio-persistence', !/localStorage\.setItem\([^\n]*audio/i.test(chat) && !/indexedDB/i.test(chat), 'Chat does not persist audio');
  check('no-silent-network-claim', /browser speech is separate/i.test(gateway) && /noSilentAiFallback/.test(gateway), 'browser assistance and no silent AI fallback are explicit');
  check('tooltips-present', /Dictate — turn speech into editable text\./.test(gateway) && /Voice Conversation \(Beta\).*automatic sending.*continuous listening/.test(gateway) && /Live Voice — start an audio-native realtime conversation\./.test(gateway), 'Dictate, Voice Conversation and Live Voice tooltips are explicit and distinct');
  check('surfaces-marked', /data-eon-voice-route/.test(index) && /data-eon-voice-route/.test(chatHtml), 'both canonical chat surfaces expose a voice route status node');
  check('language-settings-hidden', !/id="chat-speech-language"/.test(index) && /id="eon-profile-speech-language"/.test(read(root, 'profile.html')) && /languageSettingsPath/.test(gateway), 'language overrides live in Profile instead of taking space in the main chat header');

  const report = Object.freeze({
    schema: 'eonapp.w479v-w623f-w659g.eonbot-voice-gate-report.v2',
    sourceStatus: errors.length ? 'fail' : 'pass',
    checkCount: checks.length,
    truth: W479V_TRUTH,
    checks: Object.freeze(checks),
    limitations: Object.freeze([
      'Source-level proof only.',
      'No browser/device microphone, transcript accuracy, output audio, local STT/TTS adapter, or production CSP evidence is proven by this gate.',
      'Browser speech remains an explicit beta convenience route until the W476-B/W478 device matrix is complete.'
    ]),
    errors: Object.freeze(errors)
  });
  if (writeArtifact) {
    const output = path.join(root, 'artifacts', 'w479v-eonbot-voice-gate');
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(path.join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW479VEonbotVoice();
  if (report.sourceStatus !== 'pass') {
    process.stderr.write(`${report.errors.join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`W479-V EONBOT voice source gate passed (${report.checkCount}/${report.checkCount}).\n`);
  }
}
