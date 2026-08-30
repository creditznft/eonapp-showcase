import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
const marker = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-objective-marker.js', import.meta.url), 'utf8');

test('W767B isolates Command Hub markers and launchers while Expanse is active', () => {
  assert.match(runtime, /setWorldMode\(nextMode = 'COMMAND_HUB'\)/);
  assert.match(runtime, /labels\.hidden = expanseActive/);
  assert.match(runtime, /launcher\.hidden = expanseActive/);
  assert.match(runtime, /ui\?\.setWorldMode\?\.\('EXPANSE_ACTIVE'\)/);
  assert.match(runtime, /ui\?\.setWorldMode\?\.\('COMMAND_HUB'\)/);
});

test('W767B exposes an Expanse-only HUD and explicit EONBOT guidance control', () => {
  assert.match(overlay, /data-eon-expanse-ui':'hud'/);
  assert.match(overlay, /EONBOT, guide me/);
  assert.match(overlay, /onGuideObjective/);
  assert.match(runtime, /createEonExpanseW767BGuideController/);
  assert.match(runtime, /state = 'guide-route'/);
});

test('W767B renders bounded ground-circuit route segments from player to objective', () => {
  assert.match(marker, /w767b-objective-ground-circuit-root/);
  assert.match(marker, /buildEonExpanseW767BGroundCircuitRoute/);
  assert.match(marker, /routeSegmentCount/);
  assert.match(runtime, /expanseObjectiveMarker\.update\(expanseGuidance, seconds, playerAnchor\.position, expanseGuideState\)/);
});
