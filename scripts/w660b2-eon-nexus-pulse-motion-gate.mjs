#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'assets/js/nexus/eon-nexus-pulse-motion.js',
  'assets/js/nexus/eon-nexus-pulse.js',
  'assets/js/nexus/eon-nexus-chat-pulse.js',
  'assets/css/eon-nexus-pulse.css',
  'tests/unit/w660b2-eon-nexus-pulse-motion.test.mjs'
];

const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });

for (const file of required) add(`required:${file}`, fs.existsSync(path.join(root, file)));

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const stripComments = (source) => source
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const motion = read('assets/js/nexus/eon-nexus-pulse-motion.js');
const motionExecutable = stripComments(motion);
const pulse = read('assets/js/nexus/eon-nexus-pulse.js');
const chat = read('assets/js/nexus/eon-nexus-chat-pulse.js');
const css = read('assets/css/eon-nexus-pulse.css');

add('motion-policy-schema', motion.includes('eon.nexus.pulse-motion.w660b2.v1'));
add('four-quality-profiles', ['full', 'balanced', 'low-power', 'static'].every((profile) => motion.includes(`'${profile}'`)));
add('state-motion-map', [
  'ready-breathe',
  'listening-ripple',
  'processing-orbit',
  'speaking-pulse',
  'approval-ring',
  'complete-once',
  'error-once',
  'offline-static'
].every((value) => motion.includes(value)));
add('reduced-motion-static', motion.includes("profile = 'static'") && motion.includes('Reduced motion is enabled'));
add('hidden-motion-paused', motion.includes('root.dataset.motionPaused') && motion.includes('visibilitychange'));
add('no-js-frame-loop', !/\brequestAnimationFrame\s*\(|\bcancelAnimationFrame\s*\(|\bsetInterval\s*\(/.test(motionExecutable));
add('no-heavy-renderer', !/(?:getContext\s*\(\s*['"](?:webgl|webgl2)['"]|\bBABYLON\.|from\s+['"][^'"]*babylon|import\s*\([^)]*babylon|\.glb\b)/i.test(motionExecutable));
add('no-provider-or-voice-start', !/getUserMedia|SpeechRecognition|createAIReplyStream|fetch\s*\(/.test(motionExecutable));
add('pulse-wires-motion-controller', pulse.includes("from './eon-nexus-pulse-motion.js'") && pulse.includes('createEonNexusPulseMotionController'));
add('pulse-updates-motion-from-view-model', pulse.includes('motion.update?.({ state: model.state, privateRoute: model.privateRoute })'));
add('chat-keeps-same-environment', chat.includes('environment,') && chat.includes("rendererEngine: 'dom-css-state-motion'"));
add('css-ready-motion', css.includes('@keyframes eon-nexus-ready-breathe'));
add('css-listening-motion', css.includes('@keyframes eon-nexus-listening-ripple'));
add('css-processing-motion', css.includes('@keyframes eon-nexus-processing-orbit'));
add('css-speaking-motion', css.includes('@keyframes eon-nexus-speaking-pulse'));
add('css-approval-motion', css.includes('@keyframes eon-nexus-approval-ring'));
add('css-complete-one-shot', css.includes('@keyframes eon-nexus-complete-once') && css.includes('1.1s ease-out 1'));
add('css-error-bounded', css.includes('@keyframes eon-nexus-error-once') && css.includes('.45s ease-in-out 2'));
add('css-hidden-paused', css.includes("[data-motion-active='false']") && css.includes('animation-play-state: paused'));
add('css-reduced-motion-none', /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation:\s*none\s*!important/.test(css));

const forbiddenSource = `${motion}\n${pulse}\n${chat}`;
add('no-fake-progress', !/\b\d{1,3}%\b|fake progress|simulated agent/i.test(forbiddenSource));
add('no-second-chat-store', !/new Map\(.*conversation|conversationStore\s*=/.test(forbiddenSource));
add('truth-boundaries', [
  'startsAiWork: false',
  'startsVoiceCapture: false',
  'continuousJsLoop: false',
  'requiresCanvas: false',
  'requiresWebGl: false',
  'requiresBabylon: false',
  'requiresGlb: false'
].every((value) => motion.includes(value)));

const failed = checks.filter((check) => !check.pass);
const report = {
  wave: 'W660B2',
  scope: 'css-only-state-motion-profiles',
  ok: failed.length === 0,
  passed: checks.length - failed.length,
  total: checks.length,
  checks
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
