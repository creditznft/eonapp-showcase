import test from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
import {buildEonCityW681ExpanseMacroRegionPlan} from '../../assets/js/city/w681/eon-city-w681-expanse-macro-regions.js';
import {buildEonCityW698ExpansePresentation,resolveEonCityW698DiscoveryVisual,resolveEonCityW698StreetActivityVisual,validateEonCityW698ExpansePresentation,getEonCityW698ExpansePresentationTruth} from '../../assets/js/city/w698/eon-city-w698-expanse-open-world-presentation.js';
import {inspectW698ExpanseOpenWorld} from '../../scripts/w698-expanse-open-world-gate.mjs';
const macro=buildEonCityW681ExpanseMacroRegionPlan({position:{x:0,z:0},seed:'eonapp-expanse',quality:'balanced'}); const plan=buildEonCityW698ExpansePresentation({macroPlan:macro,quality:'balanced',seed:'eonapp-expanse'});
test('W698 preserves bounded streaming while adding open-world composition',()=>{const r=validateEonCityW698ExpansePresentation(plan);assert.equal(r.ok,true,r.errors.join('|'));assert.equal(plan.macroRegionCount,9);assert.equal(plan.detailedFiveByFiveStreamingPreserved,true);assert.equal(plan.interactiveThreeByThreePreserved,true);assert.equal(plan.visibleHardBorder,false);assert.equal(plan.nearMidFarComposition,true);});
test('W698 provides regional architecture and road hierarchy',()=>{assert.ok(plan.uniqueArchitectureFamilies>=7);assert.equal(plan.adjacentFamilyRepeats,0);assert.ok(plan.skylineNodeCount>=40);assert.ok(plan.roadHierarchy.length>=14);assert.ok(plan.roadHierarchy.every(r=>r.curbs&&r.centerLine&&!r.automaticNavigation));});

test('W698 keeps all nine presentation families collision-free across repeated macro archetypes',()=>{
 const cases=[
  {seed:'w660r-test-seed',position:{x:0,z:0}},
  {seed:'w660u-test',position:{x:0,z:0}},
  {seed:'w681-repeat',position:{x:190,z:-210}}
 ];
 for(const fixture of cases){
  const macroPlan=buildEonCityW681ExpanseMacroRegionPlan(fixture);
  const presentation=buildEonCityW698ExpansePresentation({macroPlan,quality:'balanced',seed:fixture.seed});
  const validation=validateEonCityW698ExpansePresentation(presentation);
  assert.equal(validation.ok,true,`${fixture.seed}:${validation.errors.join(',')}`);
  assert.equal(presentation.uniqueArchitectureFamilies,9,fixture.seed);
  assert.equal(presentation.adjacentFamilyRepeats,0,fixture.seed);
  assert.equal(new Set(presentation.skylineClusters.map((entry)=>entry.presentationKitId)).size,9,fixture.seed);
 }
});
test('W698 gives discoveries and street activity semantic visual grammars',()=>{const discoveries=['signal-garden','memory-obelisk','realm-echo','street-performance','public-workshop','rare-material-display','transit-overlook','atlas-marker'].map(k=>resolveEonCityW698DiscoveryVisual(k));assert.equal(new Set(discoveries.map(x=>x.shape)).size,8);assert.ok(discoveries.every(x=>x.reviewFirst&&!x.automaticOpen));assert.equal(resolveEonCityW698StreetActivityVisual('public-art-cycle').shape,'kinetic-art');assert.equal(resolveEonCityW698StreetActivityVisual('maintenance-cue').shape,'maintenance-cone');});
test('W698 active runtime replaces macro boxes and universal discovery rings',()=>{const src=fs.readFileSync(new URL('../../assets/js/city/eon-city-living-nexus-babylon-runtime.js',import.meta.url),'utf8');assert.match(src,/createW698SkylineMesh/);assert.match(src,/resolveEonCityW698DiscoveryVisual/);assert.match(src,/expanseArchitectureFamilyCount/);assert.match(src,/expanseNearMidFarComposition/);});
test('W698 truth and focused gate remain one-scene and non-executing',()=>{const truth=getEonCityW698ExpansePresentationTruth();assert.equal(truth.oneCanonicalScene,true);assert.equal(truth.automaticNavigation,false);assert.equal(truth.networkRequestCreated,false);const r=inspectW698ExpanseOpenWorld();assert.equal(r.ok,true,r.checks.filter(x=>!x.pass).map(x=>x.id).join(','));});
