import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w771/eon-expanse-w771c-zone-environment-kit-presenter.js', import.meta.url), 'utf8');

test('W771F derives damaged, restoring and restored visual states inside the canonical presenter', () => {
  assert.match(source, /deriveEonExpanseW771ERestorationArtState/);
  assert.match(source, /restorationArtState/);
  assert.match(source, /artStage/);
  assert.match(source, /restorationPercent/);
});

test('W771F reveals restoration modules only after the zone art authority marks them restored', () => {
  assert.match(source, /art\?\.revealRestorationModules === true/);
  assert.doesNotMatch(source, /entry\.restoredOnly \|\| true/);
});

test('W771F adjusts existing zone material emission without replacing hero or resident materials', () => {
  assert.match(source, /zoneMaterials\.primary\.emissiveColor/);
  assert.match(source, /zoneMaterials\.secondary\.emissiveColor/);
  assert.match(source, /zoneMaterials\.warm\.emissiveColor/);
  assert.doesNotMatch(source, /container\.materials/);
  assert.doesNotMatch(source, /resident/);
});

test('W771F remains visual-only and creates no progression or runtime authority', () => {
  assert.match(source, /mutatesMissionState: false/);
  assert.match(source, /ownsRenderLoop: false/);
  assert.equal((source.match(/new Engine\s*\(/g) || []).length, 0);
  assert.equal((source.match(/new Scene\s*\(/g) || []).length, 0);
});
