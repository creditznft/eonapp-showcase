import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EONAPP_W716_CRITICAL_JOURNEYS,
  EONAPP_W716_MIN_TARGET_PX,
  buildEonAppW716AccessibilityPlan,
  getEonAppW716AccessibilityLanguageInputTruth,
  resolveEonAppW716Language,
  validateEonAppW716AccessibilityPlan
} from '../../assets/js/runtime/w716/eonapp-w716-accessibility-language-input.js';
import { EON_CHAT_GUIDE_LANGUAGE_MATRIX, EON_FULL_PRODUCT_LANGUAGE_MATRIX } from '../../assets/js/utils/language-matrix.js';
import { W634_RESPONSIVE_ACCESSIBILITY_INPUT_CONTRACT } from '../../config/w634-responsive-accessibility-input-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W716 validates all eight responsive profiles without awarding device certification', () => {
  for (const profile of W634_RESPONSIVE_ACCESSIBILITY_INPUT_CONTRACT.deviceProfiles) {
    const plan = buildEonAppW716AccessibilityPlan(profile);
    assert.equal(validateEonAppW716AccessibilityPlan(plan).ok, true, profile.id);
    assert.equal(plan.viewport.layout, profile.expectedLayout, profile.id);
    assert.equal(plan.viewport.orientation, profile.expectedOrientation, profile.id);
    assert.equal(plan.device.physicalDeviceCertified, false);
    assert.ok(plan.input.minimumTargetPx >= EONAPP_W716_MIN_TARGET_PX);
  }
});

test('W716 resolves eleven Chat/Guide profiles while publishing only English UI', () => {
  assert.equal(EON_FULL_PRODUCT_LANGUAGE_MATRIX.length, 1);
  assert.equal(EON_CHAT_GUIDE_LANGUAGE_MATRIX.length, 11);
  for (const entry of EON_CHAT_GUIDE_LANGUAGE_MATRIX) {
    const language = resolveEonAppW716Language(entry.code);
    assert.equal(language.code, entry.code);
    assert.equal(language.speechLocale, entry.speechLocale);
    assert.equal(language.chatGuideLanguage, true);
    assert.equal(language.fullProductLanguage, entry.code === 'en');
  }
  const arabic = resolveEonAppW716Language('ar-SA');
  assert.equal(arabic.dir, 'rtl');
  assert.equal(arabic.logicalCssRequired, true);
  assert.equal(resolveEonAppW716Language('unsupported').code, 'en');
});

test('W716 gives keyboard, touch, pointer, controller and typed voice fallback explicit parity', () => {
  const plan = buildEonAppW716AccessibilityPlan({ width: 390, height: 844, coarsePointer: true, language: 'hi' });
  assert.equal(plan.input.keyboard.supported, true);
  assert.equal(plan.input.keyboard.visibleFocusRequired, true);
  assert.ok(plan.input.keyboard.actions.includes('undo'));
  assert.ok(plan.input.keyboard.actions.includes('redo'));
  assert.ok(plan.input.keyboard.actions.includes('reset-view'));
  assert.equal(plan.input.pointer.hoverRequired, false);
  assert.equal(plan.input.touch.supported, true);
  assert.equal(plan.input.controller.remappable, true);
  assert.equal(plan.input.controller.connectAutomatically, false);
  assert.equal(plan.input.voice.pressToStart, true);
  assert.equal(plan.input.voice.typedFallbackRequired, true);
  assert.equal(plan.input.voice.startsAutomatically, false);
});

test('W716 keeps visual surfaces paired with semantic alternatives and six complete journeys', () => {
  const plan = buildEonAppW716AccessibilityPlan();
  assert.deepEqual(plan.semanticAlternatives.map((row) => row.surface), ['nexus', 'atlas', 'city', 'command-centre']);
  assert.equal(plan.journeys.length, EONAPP_W716_CRITICAL_JOURNEYS.length);
  assert.equal(plan.journeys.length, 6);
  assert.equal(plan.sensory.non3dFallback, true);
  assert.equal(plan.sensory.soundOptional, true);
  assert.equal(plan.reading.captionsPrimary, true);
});

test('W716 source surfaces retain focus, reduced motion, live semantics and City fallback', () => {
  const nexusCss = read('public/assets/css/eon-nexus-live.css');
  const cityCss = read('assets/css/eon-city-play.css');
  const nexus = read('assets/js/nexus/eon-nexus-live.js');
  const atlas = read('assets/js/nexus/eon-nexus-project-atlas.js');
  const city = read('assets/js/eon-city-play-station.js');
  const cityAccessibility = read('assets/js/city/eon-city-accessibility-device-system.js');
  assert.match(nexusCss, /:focus-visible/);
  assert.match(nexusCss, /prefers-reduced-motion/);
  assert.match(cityCss, /:focus-visible/);
  assert.match(cityCss, /prefers-reduced-motion/);
  assert.match(cityCss, /safe-area-inset/);
  assert.match(nexus, /aria-live/);
  assert.match(atlas, /Accessible project records and data limits/);
  assert.match(city, /Touch movement controls/);
  assert.match(cityAccessibility, /non-3D fallback/);
});

test('W716 truth reserves browser, assistive-technology and device proof for W718', () => {
  const truth = getEonAppW716AccessibilityLanguageInputTruth();
  assert.equal(truth.fullProductLanguageCount, 1);
  assert.equal(truth.chatGuideLanguageCount, 11);
  assert.deepEqual(truth.rtlLanguages, ['ar']);
  assert.equal(truth.minimumTargetPx, 48);
  assert.equal(truth.realBrowserProofRequired, true);
  assert.equal(truth.assistiveTechnologyProofRequired, true);
  assert.equal(truth.automaticCapture, false);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.performsNetworkRequest, false);
  assert.equal(truth.writesStorage, false);
  assert.equal(truth.certifiesDevice, false);
});
