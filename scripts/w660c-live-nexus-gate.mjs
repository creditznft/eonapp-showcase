#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EON_NEXUS_LIVE_MAX_PRIMARY_NODES,
  getEonNexusLiveTruth,
  getEonNexusLiveViewModel
} from '../assets/js/nexus/eon-nexus-live.js';
import { createDefaultEonNexusState } from '../assets/js/nexus/eon-nexus-state-contract.js';
import { getEonNexusChatPulseTruth } from '../assets/js/nexus/eon-nexus-chat-pulse.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = Object.freeze([
  'assets/js/nexus/eon-nexus-live.js',
  'assets/css/eon-nexus-live.css',
  'assets/js/nexus/eon-nexus-pulse.js',
  'assets/js/nexus/eon-nexus-chat-pulse.js',
  'tests/unit/w660c-live-nexus.test.mjs',
  'docs/W660C_LIVE_NEXUS_SOURCE_RECEIPT_2026-07-19.md'
]);

function read(relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

const checks = [];
const add = (id, pass, detail = '') => checks.push({ id, pass: Boolean(pass), detail });
for (const relative of required) add(`required:${relative}`, fs.existsSync(path.join(root, relative)));

const live = read('assets/js/nexus/eon-nexus-live.js');
const css = read('assets/css/eon-nexus-live.css');
const integration = read('assets/js/nexus/eon-nexus-chat-pulse.js');
const pulse = read('assets/js/nexus/eon-nexus-pulse.js');
const responsive = read('assets/js/nexus/w708/eon-nexus-w708-responsive-interaction.js');
const executable = `${live}\n${integration}\n${pulse}\n${responsive}`.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

add('same-adapter-lazy-integration', /mountEonNexusLive\(\{[\s\S]*?adapter,/.test(integration) && /import\('(?:\.\/|\/assets\/js\/nexus\/)eon-nexus-live\.js'\)/.test(integration));
add('pulse-expand-control', /Expand Nexus/.test(pulse) && /onExpand/.test(pulse));
add('split-and-full-modes', /data-mode/.test(css) && /eon-nexus-live-split/.test(css) && /eon-nexus-live-full/.test(live));
add('maximum-five-primary-nodes', EON_NEXUS_LIVE_MAX_PRIMARY_NODES === 5 && /slice\(0, EON_NEXUS_LIVE_MAX_PRIMARY_NODES\)/.test(live));
add('readable-status-panel', /Conversation|Current project|AI route|Active node/.test(live) && /role', 'status'/.test(live));
add('visible-button-equivalents', /Rotate left/.test(live) && /Rotate right/.test(live) && /Zoom out/.test(live) && /Reset view/.test(live) && /Zoom in/.test(live) && /Full screen/.test(live) && /Speak/.test(live));
add('keyboard-pointer-and-zoom-support', /interpretEonNexusW708KeyboardInput/.test(live) && /ArrowLeft/.test(responsive) && /ArrowRight/.test(responsive) && /key === '\+'|key === '='/.test(responsive) && /addEventListener\('wheel'/.test(live) && /pointerdown/.test(live) && /Escape/.test(responsive));
add('approval-controls-callback-gated', /typeof onApprove === 'function'/.test(live) && /typeof onReject === 'function'/.test(live));
add('no-automatic-microphone', !/getUserMedia\s*\(|SpeechRecognition\s*\(/.test(executable));
add('no-provider-or-ai-start', !/createAIReplyStream|fetch\s*\(|XMLHttpRequest/.test(executable));
add('no-heavy-renderer', !/(?:getContext\s*\(\s*['"](?:webgl|webgl2)['"]|\bBABYLON\.|from\s+['"][^'"]*babylon|import\s*\([^)]*babylon|\.glb\b)/i.test(executable));
add('no-second-conversation-store', !/sessionStorage\.setItem|localStorage\.setItem|createNewChatThread|conversationStore\s*=/.test(executable));
add('no-fake-progress', !/\b\d{1,3}%\b|fake progress|simulated agent|invented agent/i.test(executable));
add('reduced-motion-css', /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation:\s*none\s*!important/.test(css));

const snapshot = createDefaultEonNexusState({ now: Date.parse('2026-07-19T12:00:00.000Z') });
const model = getEonNexusLiveViewModel({
  ...snapshot,
  nodes: Array.from({ length: 7 }, (_, index) => ({ id: `role:${index}`, label: `Tool ${index}`, status: 'available' }))
});
add('view-model-bounds-nodes', model.primaryNodes.length === 5 && model.hiddenNodeCount === 2);

const truth = getEonNexusLiveTruth();
const chatTruth = getEonNexusChatPulseTruth();
add('truth-boundaries', truth.sameStateAdapter === true
  && truth.startsAiWork === false
  && truth.startsVoiceAutomatically === false
  && truth.approvesActionAutomatically === false
  && truth.desktopWheelZoom === true
  && truth.requiresCanvas === false
  && truth.requiresWebGl === false
  && truth.requiresBabylon === false
  && truth.requiresGlb === false
  && chatTruth.liveNexusUsesSameAdapter === true);

const failed = checks.filter((check) => !check.pass);
const report = {
  wave: 'W660C',
  scope: 'live-nexus-first-functional-slice',
  ok: failed.length === 0,
  passed: checks.length - failed.length,
  total: checks.length,
  checks,
  claims: {
    liveNexusSourceImplemented: failed.length === 0,
    usesSameEonbotStateContract: true,
    browserCertified: false,
    productionCertified: false,
    projectAtlasImplemented: false,
    eonCityNexusImplemented: false
  }
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (failed.length) process.exitCode = 1;
