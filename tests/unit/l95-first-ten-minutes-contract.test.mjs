import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const overlay = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../../assets/css/eon-city-play.css', import.meta.url), 'utf8');
const proximity = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w767b-guidance-director.js', import.meta.url), 'utf8');

test('L95 first-session player can choose Story or Build without a mandatory Signal completion lock', () => {
  assert.match(runtime, /Available now · personal build world/);
  assert.match(runtime, /campaignCompletionRequired: false, grantsXp: false, grantsConstructionPermit: false/);
  assert.doesNotMatch(runtime, /return-to-signal-frontier-before-my-frontier/);
  assert.match(runtime, /Recommended first · guided restoration story/);
});

test('L95 each Open World exposes an immediate meaningful action and persistent EONBOT continuity', () => {
  assert.match(runtime, /scan-dormant-eonbot/);
  assert.match(proximity, /getEonExpanseW767BInteractionTargetId/);
  assert.match(runtime, /expanseUiOverlay\.openMyFrontierPlanner\?\.\(inspection\.plotId\)/);
  assert.match(runtime, /stormSector\.activeObjective\?\.label/);
  assert.match(runtime, /eonbotLauncher\.hidden = false/);
  assert.match(runtime, /returnWorld = fromExpanse \? String\(getActiveWorldRegion\?\.\(\) \|\| 'signal-frontier'\) : 'command-hub'/);
});

test('L95 first-session mobile path preserves controls, dismissal, Worlds navigation and the primary playfield', () => {
  assert.match(css, /--eon-city-l95-control-size,48px/);
  assert.match(css, /data-eon-city-menu-close/);
  assert.match(css, /data-eon-city-menu-minimize/);
  assert.match(css, /data-eon-city-presentation-mode="expanse"[^\n]*data-eon-city-explore-open[^\n]*display:inline-flex!important/);
  assert.match(runtime, /exploreLauncher\.textContent = expanseActive \? 'Worlds' : 'Explore'/);
  assert.match(runtime, /openMenu\(fromExpanse \? exploreLauncher : menuLauncher\)/);
  assert.match(overlay, /openMyFrontierPlanner\(plotId=''\)/);
});

test('L95 My Frontier first-entry arrival teaches the physical build loop in one glance', () => {
  assert.match(runtime, /MY FRONTIER'[\s\S]*Walk to a plot → E \/ tap Use → choose a building → Plan · EONBOT is always one tap away/);
});

test('L95 Storm arrival teaches its immediate physical objective interaction', () => {
  assert.match(runtime, /STORM SECTOR'[\s\S]*Follow the highlighted objective → E \/ tap Use at the field target · EONBOT remains one tap away/);
});

test('L95 Signal arrival teaches E/touch interaction before the player can get stuck', () => {
  assert.match(runtime, /SIGNAL FRONTIER'[\s\S]*Follow the highlighted signal → E \/ tap Use at the field target/);
  assert.match(runtime, /Approach the dormant EONBOT signal → E \/ tap Use to begin recovery/);
});
