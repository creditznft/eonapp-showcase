import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source=await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js',import.meta.url),'utf8');

test('W796C mounts patrols under the canonical Storm Sector root',()=>{
  assert.match(source,/mountEonExpanseW796BStormNpcPresenter/);
  assert.match(source,/parent: expanseStormSectorPresenter\.root/);
  assert.match(source,/expanseStormSectorNpcs\?\.apply/);
  assert.match(source,/expanseStormSectorNpcs\?\.update/);
});

test('W796C merges mission and NPC interactions before keyboard or touch dispatch',()=>{
  assert.match(source,/getStormSectorInteractionCandidates/);
  assert.match(source,/expanseStormSectorInteractions\?\.getInteractionCandidates/);
  assert.match(source,/expanseStormSectorNpcs\?\.getInteractionCandidates/);
  assert.match(source,/interactNearestStormSector/);
  assert.match(source,/storm-sector-authored-npc/);
});

test('W796C briefings are identity-bound and guidance-only',()=>{
  assert.match(source,/storm-npc-identity-stale/);
  assert.match(source,/w796c-storm-sector-npc-briefing/);
  assert.match(source,/grantsXp: false/);
  assert.match(source,/mutatesMissionState: false/);
  assert.match(source,/automaticDialogue: false/);
});

test('W796C preserves the single runtime lifecycle',()=>{
  assert.equal((source.match(/new Engine\s*\(/g)||[]).length,1);
  assert.equal((source.match(/new Scene\s*\(/g)||[]).length,1);
  assert.equal((source.match(/runRenderLoop\s*\(/g)||[]).length,1);
  assert.match(source,/expanseStormSectorNpcs\?\.dispose/);
});
