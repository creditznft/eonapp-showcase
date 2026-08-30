import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');

test('R04 pointer/touch picks resolve semantic owner through authored parent meshes', () => {
  assert.match(runtime, /resolveEonCityR04MeshInteraction\(pickedMesh\)/);
  assert.match(runtime, /PointerEventTypes\.POINTERMOVE/);
  assert.match(runtime, /canvas\.style\.cursor = resolved\.ok \? 'pointer' : 'default'/);
  assert.doesNotMatch(runtime, /const metadata = pickedMesh\?\.metadata \|\| \{\};/);
});

test('R04 keyboard E and pointer activation share one Hub dispatcher', () => {
  assert.match(runtime, /const activateResolvedHubInteraction =/);
  assert.match(runtime, /activateResolvedHubInteraction\(nearest, \{ source: 'keyboard-e'/);
  assert.match(runtime, /activateResolvedHubInteraction\(resolved, \{ source: 'city-3d-pick'/);
});

test('R04 labels obey viewport-provided one-to-three label budget', () => {
  assert.match(runtime, /resolveEonCityR04LabelBudget\(productRoot, 3\)/);
  assert.match(runtime, /placed\.length >= labelBudget/);
});
