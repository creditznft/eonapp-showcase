import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const npc = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766d-npc-transit.js', import.meta.url), 'utf8');
const gateway = await readFile(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');

test('L95 Signal authored NPC animations pause outside Signal while decoded assets remain resident', () => {
  assert.match(npc, /setActive\(nextActive = true\)/);
  assert.match(npc, /record\.animationState = 'paused'/);
  assert.match(npc, /retainedDecodedNpcCount/);
  assert.match(npc, /sameSessionReuse: true/);
  assert.match(npc, /if \(!active\) return freeze\(\{ ok: true, active: false, ownsRenderLoop: false \}\)/);
});

test('L95 Signal region lifecycle explicitly pauses and resumes the authored NPC runtime', () => {
  assert.ok((gateway.match(/npcRuntime\?\.setActive\?\.\(true\)/g) || []).length >= 2);
  assert.ok((gateway.match(/npcRuntime\?\.setActive\?\.\(false\)/g) || []).length >= 2);
  const deactivate = gateway.slice(gateway.indexOf('    deactivate() {'), gateway.indexOf('    suspendSignalPresentation'));
  assert.doesNotMatch(deactivate, /disposeDeferredAssets\(/);
});
