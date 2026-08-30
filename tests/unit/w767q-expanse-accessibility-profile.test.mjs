import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deriveEonExpanseW767QAccessibilityProfile } from '../../assets/js/city/w766/eon-expanse-w767q-accessibility-profile.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('W767Q reduced motion removes decorative animation but preserves all guidance', () => {
  const profile = deriveEonExpanseW767QAccessibilityProfile({ reducedMotion: true });
  assert.equal(profile.animationEnabled, false);
  assert.equal(profile.transitionDurationMs, 0);
  assert.equal(profile.preservesObjectiveText, true);
  assert.equal(profile.preservesDistanceText, true);
  assert.equal(profile.preservesEventText, true);
  assert.equal(profile.preservesHubReturn, true);
  assert.equal(profile.autoMovesPlayer, false);
  assert.equal(profile.mutatesProgression, false);
});

test('W767Q provides at least 44px controls and 48px for coarse pointers', () => {
  assert.equal(deriveEonExpanseW767QAccessibilityProfile().touchTargetPx, 44);
  assert.equal(deriveEonExpanseW767QAccessibilityProfile({ coarsePointer: true }).touchTargetPx, 48);
});

test('W767Q overlay honors reduced motion, forced colors, focus and live regions', async () => {
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(overlay, /prefers-reduced-motion: reduce/);
  assert.match(overlay, /forced-colors: active/);
  assert.match(overlay, /aria-live['"]:'polite/);
  assert.match(overlay, /min-height:44px/);
  assert.match(overlay, /data-reduced-motion/);
  assert.match(runtime, /reducedMotion,/);
  assert.match(runtime, /forcedColors:/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
