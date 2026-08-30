import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { deriveEonExpanseW768IVisualFoundation, validateEonExpanseW768IVisualFoundation, EON_EXPANSE_W768I_WORLD_OFFSET } from '../../assets/js/city/w768/eon-expanse-w768i-my-frontier-visual-model.js';

test('W768I derives seven authored plots and six collision-safe road links at an isolated offset', () => {
  const model = deriveEonExpanseW768IVisualFoundation({ unlocked: true });
  const validation = validateEonExpanseW768IVisualFoundation(model);
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.equal(model.plots.length, 7);
  assert.equal(model.roads.length, 6);
  assert.ok(Math.hypot(EON_EXPANSE_W768I_WORLD_OFFSET.x, EON_EXPANSE_W768I_WORLD_OFFSET.z) >= 120);
  assert.equal(new Set(model.plots.map((entry) => entry.plotId)).size, 7);
});

test('W768I visibility follows only the verified unlock projection', () => {
  assert.equal(deriveEonExpanseW768IVisualFoundation({ unlocked: false }).visible, false);
  assert.equal(deriveEonExpanseW768IVisualFoundation({ unlocked: true }).visible, true);
});

test('W768I renderer mounts under the canonical scene without engine, scene or render-loop ownership', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
  assert.match(source, /new TransformNode\('w768i-my-frontier-root'/);
  assert.match(source, /root\.parent = parent/);
  assert.match(source, /w768i-my-frontier-platform/);
  assert.match(source, /checkCollisions = true/);
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(|runRenderLoop\s*\(/);
  assert.doesNotMatch(source, /finishedHeroPrimitives\s*:\s*[1-9]/);
});

test('W768I model refuses raw coordinates and private content', () => {
  const model = deriveEonExpanseW768IVisualFoundation({ unlocked: true });
  assert.equal(model.rawCoordinatePlacementAllowed, false);
  assert.equal(model.privateContentStored, false);
  assert.equal(model.finishedHeroPrimitives, 0);
  assert.ok(model.plots.every((entry) => entry.authoredPlacement && !entry.acceptsRawCoordinates));
});

test('W768I is wired through entry, return, state changes and runtime disposal', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(runtime, /mountEonExpanseW768IMyFrontierRenderer/);
  assert.match(runtime, /parent: expanseGateway\.root/);
  assert.match(runtime, /const activation = myFrontierRenderer\.activate\?\.\(getCurrentMyFrontierVisualPayload\(\)\)/);
  assert.match(runtime, /expanseMyFrontierRenderer\?\.deactivate\?\.\(\)/);
  assert.match(runtime, /syncExpanseMyFrontierVisuals\(\)/);
  assert.match(runtime, /getExpanseMyFrontierVisualSummary/);
  assert.match(runtime, /expanseMyFrontierRenderer\?\.dispose\?\.\(\)/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop\s*\(/g) || []).length, 1);
});
