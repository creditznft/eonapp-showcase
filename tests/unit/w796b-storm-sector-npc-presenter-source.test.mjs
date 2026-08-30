import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source=await readFile(new URL('../../assets/js/city/w796/eon-expanse-w796b-storm-sector-npc-presenter.js',import.meta.url),'utf8');

test('W796B loads only validated same-origin authored animated NPCs',()=>{
  assert.match(source,/SceneLoader\.LoadAssetContainerAsync/);
  assert.match(source,/evaluateEonExpanseW767AAssetPresentation/);
  assert.match(source,/presented-authored-npc/);
  assert.match(source,/rejected-authored-npc/);
  assert.match(source,/developmentCharacterProxyCount:0/);
});

test('W796B patrols fixed routes and switches walk idle and talk clips',()=>{
  assert.match(source,/state\.patrol\.route/);
  assert.match(source,/setMotion\(state,'walk'\)/);
  assert.match(source,/setMotion\(state,'idle'\)/);
  assert.match(source,/setMotion\(state,'talk'\)/);
  assert.match(source,/onAnimationGroupEndObservable/);
});

test('W796B provides explicit guidance-only interactions',()=>{
  assert.match(source,/action:'storm-npc-briefing'/);
  assert.match(source,/explicit-user-action-required/);
  assert.match(source,/storm-npc-target-changed/);
  assert.match(source,/grantsXp:false/);
  assert.match(source,/mutatesMissionState:false/);
  assert.doesNotMatch(source,/new Engine\s*\(/);
  assert.doesNotMatch(source,/new Scene\s*\(/);
});

test('W796B authored NPC loading is pressure-aware and bounded',()=>{
  assert.match(source,/buildEonCityL95ProgressiveAssetAdmission/);
  assert.match(source,/optionalConcurrencyLimit/);
  assert.match(source,/maxConcurrentLoads=1/);
  assert.match(source,/queued-authored-npc/);
  assert.match(source,/setOptionalAssetAdmission/);
});


test('W796B retains and pauses presented Storm NPCs across same-session world switches',()=>{
  assert.match(source,/retainedPresentedNpcCount/);
  assert.match(source,/sameSessionReuse:true/);
  assert.match(source,/for\(const clip of state\.animationGroups\|\|\[\]\)try\{clip\.stop\?\.\(\);\}catch\{\}/);
  assert.match(source,/if\(identityChanged\)\{queue\.length=0;for\(const id of \[\.\.\.states\.keys\(\)\]\)clear\(id\);\}/);
  assert.match(source,/setMotion\(state,reducedMotion\?'idle':'walk'\)/);
});
