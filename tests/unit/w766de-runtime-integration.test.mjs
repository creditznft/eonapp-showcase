import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const gateway = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');

test('runtime integrates missions, regional Transit and named NPC interactions', () => {
  for (const token of ['createEonExpanseW766EMissionRuntime', 'createEonExpanseW766DTransitController', 'getExpanseMissionState()', 'requestExpanseTransit', 'confirmExpanseTransit', "recordSignal('pathfinder-met'"]) assert.match(runtime, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('Gateway Overlook mounts NPC authority inside the canonical scene root', () => {
  assert.match(gateway, /mountEonExpanseW766DNpcs/);
  assert.match(gateway, /parent: root/);
  assert.match(gateway, /npcRuntime\?\.dispose/);
});

test('no second Engine, Scene, canvas or render loop appears in W766 modules', () => {
  const files = ['eon-expanse-w766d-route-validator.js', 'eon-expanse-w766e-mission-runtime.js', 'eon-expanse-w766d-npc-transit.js'];
  for (const name of files) {
    const source = fs.readFileSync(new URL(`../../assets/js/city/w766/${name}`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /new\s+(Engine|Scene)\s*\(/);
    assert.doesNotMatch(source, /runRenderLoop\s*\(/);
    assert.doesNotMatch(source, /createElement\(['"]canvas/);
  }
});
