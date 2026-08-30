#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildEonAppW716AccessibilityPlan,
  getEonAppW716AccessibilityLanguageInputTruth,
  validateEonAppW716AccessibilityPlan
} from '../assets/js/runtime/w716/eonapp-w716-accessibility-language-input.js';
import { EON_CHAT_GUIDE_LANGUAGE_MATRIX, EON_FULL_PRODUCT_LANGUAGE_MATRIX } from '../assets/js/utils/language-matrix.js';
import { validateW394CLanguageMatrixContract } from '../config/w394c-language-matrix-contract.mjs';
import {
  W634_RESPONSIVE_ACCESSIBILITY_INPUT_CONTRACT,
  validateW634ResponsiveAccessibilityInputContract
} from '../config/w634-responsive-accessibility-input-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const nexusLive = read('assets/js/nexus/eon-nexus-live.js');
const nexusCss = read('public/assets/css/eon-nexus-live.css');
const atlas = read('assets/js/nexus/eon-nexus-project-atlas.js');
const city = read('assets/js/eon-city-play-station.js');
const cityAccessibility = read('assets/js/city/eon-city-accessibility-device-system.js');
const cityCss = read('assets/css/eon-city-play.css');
const moduleSource = read('assets/js/runtime/w716/eonapp-w716-accessibility-language-input.js');
const responsiveContract = validateW634ResponsiveAccessibilityInputContract();
const languageErrors = validateW394CLanguageMatrixContract();
const profiles = W634_RESPONSIVE_ACCESSIBILITY_INPUT_CONTRACT.deviceProfiles.map((profile) => buildEonAppW716AccessibilityPlan(profile));
const languages = EON_CHAT_GUIDE_LANGUAGE_MATRIX.map((entry) => buildEonAppW716AccessibilityPlan({ language: entry.code }));
const truth = getEonAppW716AccessibilityLanguageInputTruth();

const checks = [
  ['existing-responsive-contract', responsiveContract.ok && responsiveContract.publicFileCount === 30 && profiles.every((plan) => validateEonAppW716AccessibilityPlan(plan).ok)],
  ['language-capability-matrix', languageErrors.length === 0 && EON_FULL_PRODUCT_LANGUAGE_MATRIX.length === 1 && languages.length === 11 && languages.every((plan) => validateEonAppW716AccessibilityPlan(plan).ok)],
  ['rtl-and-overflow', languages.find((plan) => plan.language.code === 'ar')?.language.dir === 'rtl' && languages.find((plan) => plan.language.code === 'zh')?.reading.overflowPolicy === 'cjk-line-break'],
  ['forty-eight-pixel-input-floor', profiles.every((plan) => plan.input.minimumTargetPx >= 48 && plan.input.touch.minimumTargetPx >= 48)],
  ['nexus-semantic-parity', /aria-live/.test(nexusLive) && /accessible-node/.test(nexusLive) && /accessible-controls-and-static-fallback/.test(read('assets/js/nexus/w706/eon-nexus-w706-spatial-scene-plan.js'))],
  ['atlas-readable-alternative', /Accessible project records and data limits/.test(atlas) && /Spatial project universe/.test(atlas) && /aria-label/.test(atlas)],
  ['city-semantic-and-non3d', /Touch movement controls/.test(city) && /aria-live/.test(city) && /non-3D fallback/.test(cityAccessibility) && /keyboardOnlySupported: true/.test(cityAccessibility)],
  ['visible-focus-and-motion', /:focus-visible/.test(nexusCss) && /prefers-reduced-motion/.test(nexusCss) && /:focus-visible/.test(cityCss) && /prefers-reduced-motion/.test(cityCss) && /safe-area-inset/.test(cityCss)],
  ['explicit-media-and-input-boundaries', profiles.every((plan) => !plan.input.voice.startsAutomatically && !plan.input.camera.startsAutomatically && !plan.input.controller.connectAutomatically)],
  ['truth-and-proof-boundaries', truth.fullProductLanguageCount === 1 && truth.chatGuideLanguageCount === 11 && truth.minimumTargetPx === 48 && truth.realBrowserProofRequired && truth.assistiveTechnologyProofRequired && !truth.automaticCapture && !truth.automaticNavigation && !truth.certifiesDevice],
  ['pure-authority', !/(?:fetch\s*\(|getUserMedia\s*\(|requestFullscreen\s*\(|orientation\.lock\s*\(|localStorage\.|sessionStorage\.)/.test(moduleSource)]
];
for (const [id, pass] of checks) console.log(`[W716] ${pass ? 'PASS' : 'FAIL'} ${id}`);
console.log(`[W716] INFO ${profiles.length} device profiles; ${languages.length} Chat/Guide languages; ${truth.rtlLanguages.length} RTL language`);
const ok = checks.every(([, pass]) => pass);
console.log(`[W716] ${ok ? 'PASS' : 'FAIL'} ${checks.filter(([, pass]) => pass).length}/${checks.length}`);
if (!ok) process.exitCode = 1;
