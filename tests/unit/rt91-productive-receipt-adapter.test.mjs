import test from 'node:test';
import assert from 'node:assert/strict';
import { recordEonCoreOutcome } from '../../assets/js/contracts/outcomes/eon-core-outcome-authority.js';
import { EON_CITY_W659G_PROGRESSION_SCHEMA, EON_CITY_W659G_PROGRESSION_STORAGE_KEY, recordEonCityW659gVerifiedAction } from '../../assets/js/contracts/city/w659g/eon-city-w659g-progression-ledger.js';
import { createEonCityRt91ProductiveReceiptAdapter } from '../../assets/js/city/rt91/eon-city-rt91-productive-receipt-adapter.js';
import { EON_CITY_RT91_MY_FRONTIER_DISTRICT_MISSIONS } from '../../assets/js/city/rt91/my-frontier/eon-city-rt91-my-frontier-district-missions.js';

function memoryStorage(){const map=new Map();return{getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};}
function core(storage, input){const result=recordEonCoreOutcome({...input,verified:true},{storage,environment:{},now:input.verifiedAt||100});assert.equal(result.ok,true);}
function seedProofs(storage){
  core(storage,{kind:'command-status-reviewed',route:'/eoncity',source:'command-centre-local-review',receiptId:'status:1',verifiedAt:101});
  core(storage,{kind:'creator-image-verified',route:'/create',source:'eon-direct-byok-fal',receiptId:'creator:1',verifiedAt:102});
  core(storage,{kind:'project-resume',route:'/projects',source:'projects-local',receiptId:'project:1',verifiedAt:103});
  core(storage,{kind:'library-item-reused',route:'/library',source:'library-local-use',receiptId:'knowledge:1',verifiedAt:104});
  core(storage,{kind:'local-ai-self-test',route:'/local-ai',source:'local-ai-device',receiptId:'local:1',verifiedAt:105});
  core(storage,{kind:'automation-proposal',route:'/automations',source:'automations-local',receiptId:'automation:1',verifiedAt:106});
  core(storage,{kind:'creator-capture-saved',route:'/',source:'creator-capture-local',receiptId:'capture:1',verifiedAt:107});
  core(storage,{kind:'reviewed-signed-handoff',route:'/',source:'share-center-local',receiptId:'share:1',verifiedAt:108});
  recordEonCityW659gVerifiedAction({type:'city.agent-receipt.reviewed',receiptId:'agent:1',verified:true,verifiedAt:109,source:'agent-theatre'},{storage,now:109});
  recordEonCityW659gVerifiedAction({type:'eonbot.real-reply',receiptId:'eonbot:1',verified:true,verifiedAt:110,source:'eoncity-lightweight-chat'},{storage,now:110});
  const p=JSON.parse(storage.getItem(EON_CITY_W659G_PROGRESSION_STORAGE_KEY));
  p.schema=EON_CITY_W659G_PROGRESSION_SCHEMA;
  p.revealHistory=[{kind:'cosmetic',rewardId:'signal-mist',label:'Signal Mist',family:'eonbot-skin',openedAt:111,revealNumber:1}];
  p.openedReveals=1;
  storage.setItem(EON_CITY_W659G_PROGRESSION_STORAGE_KEY,JSON.stringify(p));
}

test('RT91 productive adapter resolves every district mission receipt class from existing native redacted proof',()=>{
  const storage=memoryStorage(); seedProofs(storage);
  const adapter=createEonCityRt91ProductiveReceiptAdapter({storage,now:()=>200,getTravelReadinessReceipt:()=>({id:'transit:1',kind:'transit-journey-completed',verified:true,verifiedAt:112,sourceAuthority:'w766h-transit-journey'})});
  const required=[...new Set(EON_CITY_RT91_MY_FRONTIER_DISTRICT_MISSIONS.flatMap(m=>m.objectives).map(o=>o.requiredProductiveReceiptKind).filter(Boolean))];
  assert.equal(required.length,13);
  for(const kind of required){const result=adapter.resolve(kind);assert.equal(result.ok,true,`${kind}: ${result.reason}`);assert.equal(result.receipt.kind,kind);assert.equal(result.receipt.privateContentStored,false);assert.equal(result.receipt.awardsXp,false);}
});

test('RT91 productive adapter fails closed when native proof does not exist',()=>{
  const adapter=createEonCityRt91ProductiveReceiptAdapter({storage:memoryStorage(),getTravelReadinessReceipt:()=>null});
  const result=adapter.resolve('local-ai-ready-verified');
  assert.equal(result.ok,false);
  assert.equal(result.reason,'reviewed-native-outcome-required');
});

test('RT91 productive adapter never trusts a stale caller-selected proof over current native authority',()=>{
  const storage=memoryStorage(); seedProofs(storage);
  const adapter=createEonCityRt91ProductiveReceiptAdapter({storage});
  const current=adapter.resolve('creator-output-reviewed'); assert.equal(current.ok,true);
  assert.equal(adapter.verify({requiredKind:'creator-output-reviewed',receipt:{id:'rt91:fake'}}).ok,false);
  assert.equal(adapter.verify({requiredKind:'creator-output-reviewed',receipt:{id:current.receipt.id}}).ok,true);
});

test('RT91 productive adapter owns no native outcome, XP, unlock, network, or private-content authority',()=>{
  const adapter=createEonCityRt91ProductiveReceiptAdapter({storage:memoryStorage()});
  assert.equal(adapter.ownsNativeOutcomeAuthority,false);
  assert.equal(adapter.ownsXpAuthority,false);
  assert.equal(adapter.ownsUnlockAuthority,false);
  assert.equal(adapter.readsPrivateContent,false);
  assert.equal(adapter.networkRequestCreated,false);
});
