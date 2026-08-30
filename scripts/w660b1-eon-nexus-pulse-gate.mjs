import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getEonNexusPulseTruth, getEonNexusPulseViewModel } from '../assets/js/nexus/eon-nexus-pulse.js';
import { getEonNexusChatPulseTruth, projectEonNexusChatPulseSnapshot } from '../assets/js/nexus/eon-nexus-chat-pulse.js';
import { createDefaultEonNexusState } from '../assets/js/nexus/eon-nexus-state-contract.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = Object.freeze([
  'assets/js/nexus/eon-nexus-pulse.js',
  'assets/js/nexus/eon-nexus-chat-pulse.js',
  'assets/css/eon-nexus-pulse.css',
  'assets/js/chat-page-deferred.js',
  'tests/unit/w660b1-eon-nexus-pulse.test.mjs',
  'docs/W660_EON_NEXUS_VISUAL_DESIGN_SYSTEM_2026-07-19.md'
]);

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

export function inspectW660B1EonNexusPulse() {
  const checks = [];
  for (const relative of required) checks.push({ id: `required:${relative}`, pass: fs.existsSync(path.join(root, relative)) });

  const component = read('assets/js/nexus/eon-nexus-pulse.js');
  const integration = read('assets/js/nexus/eon-nexus-chat-pulse.js');
  const css = read('assets/css/eon-nexus-pulse.css');
  const cssWithoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const deferred = read('assets/js/chat-page-deferred.js');
  const sources = `${component}\n${integration}`;

  // Release policy W759: W736A supersedes only the retired
  // `chat-dynamically-imports-visible-pulse` requirement. Chat keeps Quick
  // Command as its sole persistent launcher and must not auto-mount the legacy
  // Nexus pulse; the rest of this W660B1 source gate remains in force.
  checks.push({
    id: 'w736a-retired-chat-pulse-remains-unmounted',
    pass: !/eon-nexus-chat-pulse|installEonNexusChatPulse|installDeferredEonNexusPulse/.test(deferred)
      && /Quick Command is the sole persistent frontend launcher/.test(deferred)
  });
  checks.push({ id: 'no-babylon-import', pass: !/(?:from\s+['"][^'"]*babylon|import\s*\([^)]*babylon|BABYLON\.)/i.test(sources) });
  checks.push({ id: 'no-glb-dependency', pass: !/\.glb\b/i.test(sources) });
  checks.push({ id: 'no-webgl-context', pass: !/getContext\s*\(\s*['"](?:webgl|webgl2)['"]|WebGLRenderingContext/i.test(sources) });
  checks.push({ id: 'no-continuous-js-loop', pass: !/setInterval\s*\(|requestAnimationFrame\s*\(/.test(sources) });
  checks.push({
    id: 'css-motion-remains-opt-in-and-lightweight',
    pass: /@keyframes\s+eon-nexus-/.test(cssWithoutComments)
      && /data-motion-active=['"]true['"]/.test(cssWithoutComments)
      && /data-motion-active=['"]false['"]/.test(cssWithoutComments)
      && !/canvas|webgl|babylon/i.test(cssWithoutComments)
  });
  checks.push({ id: 'reduced-motion-contract', pass: /prefers-reduced-motion/.test(cssWithoutComments) && /animation:\s*none\s*!important/.test(cssWithoutComments) });
  checks.push({ id: 'hidden-motion-pause-contract', pass: /data-motion-active=['"]false['"]/.test(cssWithoutComments) && /animation-play-state:\s*paused\s*!important/.test(cssWithoutComments) });
  checks.push({ id: 'visible-chat-and-speak-controls', pass: /Open Chat/.test(component) && /label:\s*'Speak'/.test(component) });
  checks.push({ id: 'existing-voice-control-only', pass: /chat-voice-toggle/.test(integration) && /\.click\?\.\(\)/.test(integration) });
  checks.push({ id: 'no-microphone-api', pass: !/getUserMedia|SpeechRecognition\s*\(/.test(integration) });
  checks.push({ id: 'no-second-chat-store', pass: !/sessionStorage\.setItem|localStorage\.setItem|createNewChatThread|updateChatThreadMessages/.test(integration) });
  checks.push({ id: 'no-fake-progress', pass: !/progressPercent|percentComplete|fakePercent|\b\d{1,3}%\b/.test(sources) });

  const base = createDefaultEonNexusState({ now: Date.parse('2026-07-19T12:00:00.000Z') });
  const live = projectEonNexusChatPulseSnapshot(base, { emotion: 'thinking', pending: true, voiceCapability: { dictationReady: true } });
  const model = getEonNexusPulseViewModel(live);
  checks.push({ id: 'observable-state-maps-to-working', pass: live.eonbot.state === 'processing' && /(?:EONBOT|Chat Nexus) · Working$/.test(model.title) && model.canSpeak === true });

  const pulseTruth = getEonNexusPulseTruth();
  const chatTruth = getEonNexusChatPulseTruth();
  checks.push({ id: 'pulse-has-no-effects', pass: pulseTruth.startsVoiceCapture === false && pulseTruth.startsAiWork === false && pulseTruth.approvesAction === false });
  checks.push({ id: 'pulse-motion-has-static-fallback', pass: pulseTruth.staticFallbackAvailable === true && pulseTruth.continuousJsAnimation === false && pulseTruth.reducedMotionStatic === true });
  checks.push({ id: 'chat-bridge-has-no-duplicate-runtime', pass: chatTruth.secondConversationStore === false && chatTruth.startsVoiceAutomatically === false && chatTruth.polling === false });

  return Object.freeze({
    wave: 'W660B1',
    scope: 'accessible-eon-pulse-chat-baseline',
    ok: checks.every((entry) => entry.pass),
    passed: checks.filter((entry) => entry.pass).length,
    total: checks.length,
    checks: Object.freeze(checks.map(Object.freeze)),
    claims: Object.freeze({
      chatPulseImplemented: true,
      staticFallbackCertified: pulseTruth.staticFallbackAvailable === true,
      cssStateMotionImplemented: pulseTruth.cssStateMotion === true,
      liveNexusImplemented: false,
      atlasImplemented: false,
      cityHologramImplemented: false,
      productionBrowserCertified: false,
      physicalDeviceCertified: false
    })
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = inspectW660B1EonNexusPulse();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
}
