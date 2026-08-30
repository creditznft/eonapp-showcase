import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../../assets/js/city/w771/eon-expanse-w771c-zone-environment-kit-presenter.js', import.meta.url), 'utf8');

test('W771C mounts all modular environment props under one canonical scene root', () => {
  assert.match(source, /new TransformNode\('w771c-five-zone-environment-kit-root'/);
  assert.match(source, /root\.parent = parent/);
  assert.match(source, /canonicalSceneOnly: true/);
  assert.equal((source.match(/new Engine\s*\(/g) || []).length, 0);
  assert.equal((source.match(/new Scene\s*\(/g) || []).length, 0);
});

test('W771C marks every module as noninteractive environment support rather than a finished hero', () => {
  assert.match(source, /kind: 'expanse-modular-environment-prop'/);
  assert.match(source, /finishedHeroBuilding: false/);
  assert.match(source, /interactive: false/);
  assert.match(source, /finishedHeroPrimitiveCount: 0/);
});

test('W771C reveals restoration modules only from canonical campaign progress', () => {
  assert.match(source, /beacon-one-repaired/);
  assert.match(source, /beacon-two-repaired/);
  assert.match(source, /regional-transit-restored/);
  assert.match(source, /campaign:signal-restoration:complete/);
  assert.match(source, /art\?\.revealRestorationModules === true/);
  assert.match(source, /mutatesMissionState: false/);
});

test('W771C animation is reduced-motion safe and driven by the existing runtime update', () => {
  assert.match(source, /if \(!active \|\| disposed \|\| reducedMotion\)/);
  assert.match(source, /ownsRenderLoop: false/);
  assert.equal((source.match(/requestAnimationFrame/g) || []).length, 0);
  assert.equal((source.match(/setInterval/g) || []).length, 0);
});


test('W771C animates tiny Signal maintenance drones only on the existing bounded ambience cadence', () => {
  assert.match(source, /entry\.type === 'drone'/);
  assert.match(source, /Math\.sin\(t \* 1\.15/);
  assert.match(source, /dynamicTransformTypes: freeze\(\['ring', 'crystal', 'drone'\]\)/);
  assert.equal((source.match(/requestAnimationFrame/g) || []).length, 0);
});
