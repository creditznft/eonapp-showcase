import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');

test('W798C mounts a dedicated Storm Sector board card', () => {
  assert.match(source, /data-eon-expanse-storm-sector/);
  assert.match(source, /Storm Sector field status/);
  assert.match(source, /stormSectorMissionList/);
  assert.match(source, /stormSectorTransitList/);
});

test('W798C switches title objective and statistics while Storm Sector is active', () => {
  assert.match(source, /const stormActive = stormSector\?\.active === true/);
  assert.match(source, /STORM SECTOR MISSIONS/);
  assert.match(source, /Active Storm objective/);
  assert.match(source, /explicit physical field interaction/);
  assert.match(source, /\['Transit',`\$\{stormSector\.unlockedTransitCount\}/);
});

test('W798C hides unrelated Signal Frontier cards instead of mixing regions', () => {
  assert.match(source, /restorationCard\.hidden = stormActive \|\| !restoration/);
  assert.match(source, /myFrontierCard\.hidden = stormActive \|\|/);
  assert.match(source, /frontierCard\.hidden = stormActive \|\|/);
  assert.match(source, /livingActivityCard\.hidden = stormActive \|\|/);
  assert.match(source, /assetRepairCard\.hidden = stormActive \|\|/);
});

test('W798C adds no new progression, travel or runtime authority', () => {
  assert.doesNotMatch(source, /recordAction\(|grantXp|new Engine\s*\(|new Scene\s*\(|runRenderLoop\s*\(/);
  assert.match(source, /stormSectorCardVisible/);
});
