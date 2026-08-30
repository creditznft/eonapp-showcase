import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('RT96 hides contextual world actions behind every blocking City surface', () => {
  assert.match(runtime, /const hasBlockingPresentation = \(\) => Boolean\(/);
  assert.match(runtime, /eonCityActiveBlockingSurface/);
  assert.match(runtime, /prompt\.hidden = !entity \|\| hasBlockingPresentation\(\)/);
  assert.match(runtime, /if \(hasBlockingPresentation\(\)\) \{\s*prompt\.hidden = true;/);
});

test('RT96 restores the contextual action only after blocking presentation ends', () => {
  assert.match(runtime, /if \(promptTarget\?\.entity\) prompt\.hidden = false/);
  assert.match(runtime, /if \(paused\) prompt\.hidden = true/);
  assert.match(runtime, /else if \(promptTarget\?\.entity && !hasBlockingPresentation\(\)\) prompt\.hidden = false/);
});
