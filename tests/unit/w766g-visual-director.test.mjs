import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const director = fs.readFileSync('assets/js/city/w766/eon-expanse-w766g-visual-director.js', 'utf8');
const runtime = fs.readFileSync('assets/js/city/w731/eon-city-w731-command-hub-runtime.js', 'utf8');

test('W766G visual director applies bounded zone atmosphere and restores Hub scene state', () => {
  assert.match(director, /EON_EXPANSE_W766G_VISUAL_SCHEMA/);
  assert.match(director, /QUALITY_COUNTS/);
  assert.match(director, /scene\.fogDensity =/);
  assert.match(director, /scene\.clearColor =/);
  assert.match(director, /hubVisualStateRestored: true/);
  assert.match(director, /externalWeatherData: false/);
  assert.match(director, /visualAtmosphereOnly: true/);
  assert.doesNotMatch(director, /new Engine|new Scene|runRenderLoop/);
});

test('maintained runtime activates, updates, restores and disposes Expanse visuals', () => {
  assert.match(runtime, /mountEonExpanseW766GVisualDirector\(\{ scene/);
  assert.match(runtime, /expanseVisuals\.activate\(expansePresentation\)/);
  assert.match(runtime, /expanseVisuals\.apply\(expansePresentation\)/);
  assert.match(runtime, /expanseVisuals\.update\(seconds, playerAnchor\.position\)/);
  assert.match(runtime, /expanseVisuals\.deactivate\(\)/);
  assert.match(runtime, /expanseVisuals\.dispose\?\.\(\)/);
});
