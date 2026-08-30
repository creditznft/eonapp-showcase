#!/usr/bin/env node
/** W369 — adaptive soundscape source gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { getCitySoundscapeTruth } from '../assets/js/city/eon-city-adaptive-soundscape.js';
import { W369_ADAPTIVE_SOUNDSCAPE_CONTRACT, validateW369AdaptiveSoundscapeContract } from '../config/w369-adaptive-soundscape-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const check = (condition, message) => { if (!condition) errors.push(message); };
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const soundscape = read('assets/js/city/eon-city-adaptive-soundscape.js');
const play = read('assets/js/eon-city-play-station.js');
const tour = read('assets/js/eon-city-3d-station.js');
const playCss = read('assets/css/eon-city-play.css');
const docs = read('docs/W369_ADAPTIVE_SOUNDSCAPE_IMPLEMENTATION_2026-06-26.md');
const imports = auditActiveSurfaceImports({ root: ROOT });
const truth = getCitySoundscapeTruth();

check(validateW369AdaptiveSoundscapeContract().length === 0, `W369 contract invalid: ${validateW369AdaptiveSoundscapeContract().join(' | ')}`);
check(truth.localOnly && !truth.remoteAudio && !truth.microphone && !truth.automaticAudio, 'W369 truth must reject remote audio, microphone use and automatic audio.');
check(/activateFromUserGesture/.test(soundscape) && /dispose/.test(soundscape) && /musicPackage: 'not-shipped'/.test(soundscape), 'W369 requires gesture activation, disposal and honest music-package status.');
check(/data-eon-play-soundscape/.test(play) && /createCityAdaptiveSoundscape/.test(play), 'W369 Immersive Work Mode needs soundscape controls and local controller wiring.');
check(/data-eon3-soundscape/.test(tour) && /createCityAdaptiveSoundscape/.test(tour), 'W369 Spatial Command Space needs explicit soundscape activation wiring.');
check(/eon-play-soundscape/.test(playCss), 'W369 needs accessible soundscape styles.');
check(/No original music stems, voice pack, microphone capture, downloaded audio/i.test(docs) && /does not claim/i.test(docs), 'W369 docs must disclose audio limits.');
check(!/fetch\s*\(|XMLHttpRequest|WebSocket|EventSource|SpeechRecognition|mediaDevices|getUserMedia|speechSynthesis/.test(`${soundscape}\n${play}\n${tour}`), 'W369 cannot add remote, microphone or automatic speech APIs.');
check(imports.ok, `Active graph crosses a fenced boundary: ${[...imports.legacyPrefixHits, ...imports.legacyValueHits, ...imports.forbiddenLiteralHits, ...imports.evmAddressLiteralHits].join(', ')}`);

const report = {
  schema: 'eonapp.w369.adaptive-soundscape-gate.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  soundscape: { localOnly: true, gestureRequired: true, musicPackage: 'not-shipped', voice: 'captions-only', microphone: false, automaticAudio: false },
  limitations: [
    'W369 proves source contracts and optional local procedural ambience only.',
    'No original music stems, voice pack, microphone capture, downloaded audio or listening proof is delivered in this code-only wave.',
    'No browser, device, accessibility, volume-mix or production proof is created by this source gate.'
  ],
  activeSurface: { routeEntryCount: imports.routeEntryCount, moduleCount: imports.moduleCount },
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'W369_ADAPTIVE_SOUNDSCAPE_REPORT_2026-06-26.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exitCode = 1;
