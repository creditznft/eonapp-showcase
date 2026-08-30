import test from 'node:test';
import assert from 'node:assert/strict';
import { generateEonCityRt91DeterministicContract } from '../../assets/js/city/rt91/eon-city-rt91-deterministic-contract-generator.js';
import { buildEonCityRt91SignalContractCells } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-contract-cells.js';
import { buildEonCityRt91StormContractCells } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-contract-cells.js';
import { createEonCityRt91RuntimeIntegration } from '../../assets/js/city/rt91/eon-city-rt91-runtime-integration.js';
import { createEonCityRt91SessionPersistence, EON_CITY_RT91_SESSION_STORAGE_KEY } from '../../assets/js/city/rt91/eon-city-rt91-session-save.js';
import { buildEonCityRt91ContentPerformanceBudget, validateEonCityRt91ContentPerformanceBudget } from '../../assets/js/city/rt91/eon-city-rt91-content-performance-budget.js';
import { buildEonCityRt91StormAtmosphere, validateEonCityRt91StormAtmosphere } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-atmosphere.js';
import { buildEonCityRt91MyFrontierAmbientPopulation, validateEonCityRt91MyFrontierAmbientPopulation } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-ambient-population.js';
import { buildEonCityRt91SignalMasteryTargets, validateEonCityRt91SignalMasteryTargets } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-mastery-targets.js';
import { buildEonCityRt91StormCampaignTargets, validateEonCityRt91StormCampaignTargets } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-campaign-targets.js';
import { buildEonCityRt91MyFrontierDistrictMissionTargets, validateEonCityRt91MyFrontierDistrictMissionTargets } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-district-mission-targets.js';
import { buildEonCityRt91MyFrontierFlagshipProjection, validateEonCityRt91MyFrontierFlagshipProjection } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-flagship.js';
import { buildEonCityRt91SignalFlagshipProjection, validateEonCityRt91SignalFlagshipProjection } from '../../assets/js/city/rt91/signal/eon-city-rt91-signal-flagship.js';
import { buildEonCityRt91StormFlagshipProjection, validateEonCityRt91StormFlagshipProjection } from '../../assets/js/city/rt91/storm/eon-city-rt91-storm-flagship.js';

function memoryStorage(seed={}){const map=new Map(Object.entries(seed).map(([k,v])=>[k,String(v)]));return{getItem:k=>map.has(String(k))?map.get(String(k)):null,setItem:(k,v)=>map.set(String(k),String(v)),removeItem:k=>map.delete(String(k)),dump:()=>new Map(map)};}
const completedSignal={completedMissions:['companion-in-the-static','beyond-the-gate','first-light','echoes-in-the-archive','the-broken-line','horizon-reconnected','the-first-reveal']};
const unlockedFrontier={unlocked:true,buildingChoices:{'plot-central-command':'command-core','plot-creator':'creator-workshop','plot-knowledge':'project-atlas','plot-systems':'local-ai-observatory','plot-signal':'broadcast-tower','plot-transit':'regional-transit-station','plot-personal':'eonbot-temple'}};
function makeRuntime(storage){let now=Date.UTC(2026,7,14,8);return createEonCityRt91RuntimeIntegration({storage,now:()=>++now,getWorldSeed:()=> 'phase-h-owner-world',getSignalState:()=>completedSignal,getStormFoundationState:()=>({regionCompleted:true,completedMissionIds:['weather-restoration','relay-repair','storm-rescue'],completedObjectiveActions:['weather-restoration:stabilizer','weather-restoration:grounding','weather-restoration:weather-array','relay-repair:relay','relay-repair:maintenance','relay-repair:grounding','storm-rescue:rescue','storm-rescue:shelter','storm-rescue:transit'],processedReceiptIds:[]}),getMyFrontierState:()=>unlockedFrontier});}

function fuzzWorld({worldId,cells,groups,iterations}){
  const families=new Set(); let count=0;
  for(const [groupId,candidateCells] of groups(cells)) for(let index=0;index<iterations;index+=1){
    const args={worldId,worldSeed:`phase-h:${worldId}:${groupId}:${index}`,cycleKey:`cycle-${index%37}`,contractIndex:index%3,history:[],candidateCells};
    const a=generateEonCityRt91DeterministicContract(args); const b=generateEonCityRt91DeterministicContract(args);
    assert.deepEqual(a,b,`non-deterministic:${worldId}:${groupId}:${index}`); assert.equal(a.ok,true,`${worldId}:${groupId}:${index}:${a.reason}`); assert.equal(a.placement?.ok,true);
    const ids=a.placement.placements.map((p)=>p.cellId); assert.equal(new Set(ids).size,ids.length,`duplicate placement:${worldId}:${groupId}:${index}`);
    families.add(a.familyId); count++;
  }
  return {count,families};
}

test('RT91 Phase H fuzzes 2,000 additional Signal/Storm contracts deterministically with unique compatible placement',()=>{
  const signal=buildEonCityRt91SignalContractCells().cells; const storm=buildEonCityRt91StormContractCells().cells;
  const s=fuzzWorld({worldId:'signal-frontier',cells:signal,groups:(cells)=>[...new Set(cells.map(c=>c.zoneId))].map(id=>[id,cells.filter(c=>c.zoneId===id)]),iterations:200});
  const t=fuzzWorld({worldId:'storm-sector',cells:storm,groups:(cells)=>[...new Set(cells.map(c=>c.zoneId))].map(id=>[id,cells.filter(c=>c.zoneId===id)]),iterations:250});
  assert.equal(s.count,1000); assert.equal(t.count,1000); assert.ok(s.families.size>=3); assert.ok(t.families.size>=3);
});

test('RT91 Phase H survives twenty Hub/Signal/Storm/My Frontier transition cycles and restores the final world without authority accumulation',()=>{
  const storage=memoryStorage(); let runtime=makeRuntime(storage); const sequence=['signal-frontier','storm-sector','my-frontier','command-hub'];
  for(let cycle=0;cycle<20;cycle++) for(const worldId of sequence){const changed=runtime.setCurrentWorld(worldId,{reason:`stress-${cycle}-${worldId}`});assert.equal(changed.ok,true);const summary=runtime.getSummary();assert.equal(summary.currentWorldId,worldId);assert.equal(summary.ownsBabylonEngine||summary.ownsScene||summary.ownsRenderLoop||summary.ownsXpAuthority||summary.ownsUnlockAuthority||summary.networkRequestCreated,false);}
  runtime=makeRuntime(storage); const summary=runtime.getSummary(); assert.equal(summary.sessionRestored,true); assert.equal(summary.currentWorldId,'command-hub'); assert.equal(summary.ownsRenderLoop,false);
});

test('RT91 Phase H session persistence fails closed on corrupt JSON and sanitizes hostile legacy-shaped fields',()=>{
  const storage=memoryStorage({[EON_CITY_RT91_SESSION_STORAGE_KEY]:'{broken'}); const persistence=createEonCityRt91SessionPersistence({storage,now:()=>123}); const broken=persistence.load();
  assert.equal(broken.ok,false); assert.equal(broken.reason,'invalid-local-session'); assert.equal(broken.session.privateContentStored,false);
  storage.setItem(EON_CITY_RT91_SESSION_STORAGE_KEY,JSON.stringify({worldSeed:'safe-seed',currentWorldId:'storm-sector',rawPrompt:'do not keep',credentials:'nope'}));
  const migrated=persistence.load(); assert.equal(migrated.ok,true); assert.equal(migrated.session.livingFrontier.currentWorldId,'storm-sector'); assert.equal('rawPrompt' in migrated.session,false); assert.equal('credentials' in migrated.session,false);
});

test('RT91 Phase H validates every quality/world performance budget and fully suspends hidden heavy work',()=>{
  for(const quality of ['lite','balanced','cinematic'])for(const worldId of ['signal-frontier','storm-sector','my-frontier']){
    const visible=buildEonCityRt91ContentPerformanceBudget({quality,worldId}); assert.equal(validateEonCityRt91ContentPerformanceBudget(visible).ok,true);
    const hidden=buildEonCityRt91ContentPerformanceBudget({quality,worldId,hidden:true}); assert.equal(validateEonCityRt91ContentPerformanceBudget(hidden).ok,true); assert.equal(hidden.streaming.maximumConcurrentOptionalAssetLoads,0); assert.equal(hidden.population.maximumNearAnimatedNpcs,0); assert.equal(hidden.effects.maximumActiveParticleEmitters,0); assert.equal(hidden.gameplay.maximumWorldStateEvaluationsPerSecond,0);
  }
});

test('RT91 Phase H stress budgets keep cinematic Storm VFX and My Frontier population bounded, with hidden-world zero activity',()=>{
  const storm=buildEonCityRt91StormAtmosphere({zoneId:'storm-eye',weather:{severity:4},missionId:'phase-h-supercell'}); assert.equal(validateEonCityRt91StormAtmosphere(storm).ok,true); assert.equal(storm.ownsTimer||storm.ownsRenderLoop||storm.ownsAudioContext,false);
  const stormHidden=buildEonCityRt91StormAtmosphere({zoneId:'storm-eye',weather:{severity:4},hiddenWorld:true}); assert.equal(validateEonCityRt91StormAtmosphere(stormHidden).ok,true); assert.equal(stormHidden.environment.some(e=>e.active||e.intensity),false);
  const pop=buildEonCityRt91MyFrontierAmbientPopulation({quality:'cinematic',focusDistrict:'creator',districtLevels:{creator:4}}); assert.equal(validateEonCityRt91MyFrontierAmbientPopulation(pop).ok,true); assert.ok(pop.nearActorCount<=3&&pop.midSilhouetteCount<=6);
  const hiddenPop=buildEonCityRt91MyFrontierAmbientPopulation({quality:'cinematic',focusDistrict:'creator',districtLevels:{creator:4},hiddenWorld:true}); assert.equal(hiddenPop.nearActorCount+hiddenPop.midSilhouetteCount,0);
});

test('RT91 Phase H physical interaction coverage reaches every authored flagship objective without raw-coordinate or automatic-progression authority',()=>{
  const signal=buildEonCityRt91SignalMasteryTargets(); const storm=buildEonCityRt91StormCampaignTargets(); const frontier=buildEonCityRt91MyFrontierDistrictMissionTargets();
  assert.equal(validateEonCityRt91SignalMasteryTargets(signal).ok,true); assert.equal(validateEonCityRt91StormCampaignTargets(storm).ok,true); assert.equal(validateEonCityRt91MyFrontierDistrictMissionTargets(frontier).ok,true);
  assert.equal(signal.targetCount,40); assert.equal(storm.targetCount,36); assert.equal(frontier.targetCount,63);
  for(const target of [...signal.targets,...storm.targets,...frontier.targets]){assert.equal(target.interactive,true);assert.equal(target.requiresExplicitUserAction,true);assert.equal(target.requiresVerifiedReceipt,true);assert.equal(target.rawUserCoordinatesAccepted,false);assert.equal(Boolean(target.grantsXp),false);}
});


test('RT91 Phase H long traversal changes local detail by focus without accumulating whole-world active detail, then hidden worlds drop heavy detail to zero',()=>{
  const levels=Object.fromEntries(['central','creator','knowledge','systems','signal','transit','personal'].map((id)=>[id,4]));
  const frontierState={unlocked:true,buildingChoices:{'plot-central-command':'command-core','plot-creator':'creator-workshop','plot-knowledge':'project-atlas','plot-systems':'local-ai-observatory','plot-signal':'broadcast-tower','plot-transit':'regional-transit-station','plot-personal':'eonbot-temple'}};
  const districtMissionState={completedMissionIds:[]};
  const seen=[];
  for(const focusDistrict of ['central','transit','creator','personal','knowledge','signal','systems']){
    const projection=buildEonCityRt91MyFrontierFlagshipProjection({quality:'cinematic',worldSeed:'phase-h-traversal',cycleKey:'2026-08-14',myFrontierState:frontierState,districtMissionState,existingUpgradeLevels:levels,focusDistrict});
    assert.equal(validateEonCityRt91MyFrontierFlagshipProjection(projection).ok,true);
    assert.equal(projection.ambientPopulation.focusDistrict,focusDistrict);
    assert.ok(projection.ambientPopulation.nearActorCount<=3);
    assert.ok(projection.ambientPopulation.midSilhouetteCount<=6);
    const activeMid=projection.skyline.districts.reduce((sum,d)=>sum+d.midStaticStructureCount,0);
    const activeHorizon=projection.skyline.districts.reduce((sum,d)=>sum+d.horizonSilhouetteCount,0);
    assert.ok(activeMid<=21,'mid-detail budget must remain bounded while traversing');
    assert.ok(activeHorizon<=28,'horizon budget must remain bounded while traversing');
    seen.push({focusDistrict,near:projection.ambientPopulation.nearActorCount,mid:projection.ambientPopulation.midSilhouetteCount,activeMid,activeHorizon});
  }
  assert.equal(new Set(seen.map((x)=>x.focusDistrict)).size,7);
  const hidden=buildEonCityRt91MyFrontierFlagshipProjection({quality:'cinematic',worldSeed:'phase-h-traversal',cycleKey:'2026-08-14',myFrontierState:frontierState,districtMissionState,existingUpgradeLevels:levels,focusDistrict:'systems',hiddenWorld:true});
  assert.equal(validateEonCityRt91MyFrontierFlagshipProjection(hidden).ok,true);
  assert.equal(hidden.ambientPopulation.nearActorCount,0);
  assert.equal(hidden.ambientPopulation.midSilhouetteCount,0);
  assert.equal(hidden.skyline.districts.reduce((sum,d)=>sum+d.midStaticStructureCount,0),0);
  assert.equal(hidden.skyline.districts.reduce((sum,d)=>sum+d.horizonSilhouetteCount,0),0);

  const signal=buildEonCityRt91SignalFlagshipProjection({quality:'cinematic',worldSeed:'phase-h-traversal',progress:{}});
  assert.equal(validateEonCityRt91SignalFlagshipProjection(signal).ok,true);
  assert.equal(signal.firstFrameAssetDelta,0);
  assert.equal(signal.wholeMapEagerLoadAllowed,false);

  const storm=buildEonCityRt91StormFlagshipProjection({quality:'cinematic',worldSeed:'phase-h-traversal',at:12345,hiddenWorld:true});
  assert.equal(validateEonCityRt91StormFlagshipProjection(storm).ok,true);
  assert.equal(storm.firstFrameAssetDelta,0);
  assert.equal(storm.wholeMapEagerLoadAllowed,false);
  assert.equal(storm.atmosphere.environment.some((entry)=>entry.active||entry.intensity),false);
});
