import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const failures = [];
const warnings = [];
function read(path) { return readFileSync(join(root, path), 'utf8'); }
function assert(condition, message) { if (!condition) failures.push(message); }
function warn(condition, message) { if (!condition) warnings.push(message); }

const chatHtml = read('chat.html');
const chatJs = read('assets/js/chat-page.js');
const chatCss = read('assets/css/chat.css');

assert(/id="eonbot-emotion-strip"/.test(chatHtml), 'chat.html must expose EONBOT emotion strip');
assert(/id="eonbot-emotion-emoji"/.test(chatHtml), 'chat.html must expose EONBOT emotion emoji');
assert(/id="eonbot-voice-chip"/.test(chatHtml), 'chat.html must expose voice readiness chip');
assert(/id="eonbot-model-chip"/.test(chatHtml), 'chat.html must expose model discovery chip');
assert(/id="eonbot-mission-chip"/.test(chatHtml), 'chat.html must expose mission status chip');
assert(/EONBOT AI Operator schema/.test(chatHtml), 'chat.html must include EONBOT JSON-LD schema');
assert(!/name="viewport"[^>]+frame-src/i.test(chatHtml), 'chat.html viewport meta must not contain CSP frame-src');

assert(/const EONBOT_EMOTIONS/.test(chatJs), 'chat-page.js must define EONBOT emotion states');
assert(/function setEonbotEmotion/.test(chatJs), 'chat-page.js must define setEonbotEmotion');
assert(/function refreshEonbotEmotion/.test(chatJs), 'chat-page.js must define refreshEonbotEmotion');
assert(/exposeEonbotEmotionDiagnostics/.test(chatJs), 'chat-page.js must expose diagnostics for QA');
assert(/detectLocalProviders/.test(chatJs) && /scanning/.test(chatJs), 'chat-page.js must connect local runtime scanning to status');
assert(/SpeechRecognition/.test(chatJs) && /voiceListening/.test(chatJs), 'chat-page.js must preserve browser voice detection/listening controls');

for (const state of ['ready', 'thinking', 'listening', 'speaking', 'scanning', 'connected', 'happy', 'careful', 'error', 'sleeping']) {
  assert(chatJs.includes(`${state}:`) || chatJs.includes(`'${state}'`) || chatJs.includes(`"${state}"`), `chat-page.js missing emotion state: ${state}`);
}

assert(/eonbot-emotion-strip/.test(chatCss), 'chat.css must style EONBOT emotion strip');
assert(/eonbot-status-chip/.test(chatCss), 'chat.css must style EONBOT status chips');
assert(/@media \(max-width: 760px\)/.test(chatCss), 'chat.css must include mobile emotion strip layout');

warn(/aria-live="polite"/.test(chatHtml), 'Emotion strip should be polite live region');
warn(/Detect local AI models/.test(chatHtml), 'Starter prompts should include local AI discovery');

const report = {
  schema: 'eonapp.gpt55.eonbot-emotion-voice-gate.v1',
  generatedAt: new Date().toISOString(),
  status: failures.length ? 'FAIL' : 'PASS',
  checks: {
    emotionStrip: /id="eonbot-emotion-strip"/.test(chatHtml),
    voiceChip: /id="eonbot-voice-chip"/.test(chatHtml),
    modelChip: /id="eonbot-model-chip"/.test(chatHtml),
    missionChip: /id="eonbot-mission-chip"/.test(chatHtml),
    diagnostics: /EONBOTEmotion/.test(chatJs),
    mobileCss: /@media \(max-width: 760px\)/.test(chatCss)
  },
  failures,
  warnings
};
mkdirSync(join(root, 'reports/session4'), { recursive: true });
writeFileSync(join(root, 'reports/session4/eonbot-emotion-voice-gate.json'), JSON.stringify(report, null, 2));
if (failures.length) {
  console.error('EONBOT emotion/voice gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('EONBOT emotion/voice gate passed.');
if (warnings.length) {
  console.warn('Warnings:');
  for (const item of warnings) console.warn(`- ${item}`);
}
