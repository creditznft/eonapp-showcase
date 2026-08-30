/**
 * W698 — bounded open-world presentation grammar for the Expanse.
 *
 * Keeps the proven 5×5 visible / 3×3 interactive stream, but projects the
 * W681 macro-regions and W682 discoveries into recognisable architecture,
 * road hierarchy, near/mid/far composition and non-repeating regional
 * silhouettes. Pure plan only; no engine, navigation or network ownership.
 */

export const EON_CITY_W698_EXPANSE_PRESENTATION_SCHEMA = 'eon.city.expanse-presentation.w698.v1';
const freeze=(value)=>Object.freeze(value);
const QUALITY=freeze({ lite:freeze({clusterSize:3,farScale:.72,streetDetail:1}), balanced:freeze({clusterSize:5,farScale:1,streetDetail:2}), cinematic:freeze({clusterSize:6,farScale:1.22,streetDetail:3}) });

const KITS=freeze({
 'civic-spine':freeze({family:'civic-command',silhouettes:freeze(['citadel','signal-tower','civic-bridge','operations-block','public-dome']),terrain:'hardscape',atmosphere:'cyan-haze'}),
 'maker-ward':freeze({family:'maker-forge',silhouettes:freeze(['cathedral','crane','foundry-stack','workshop-terrace','gantry']),terrain:'industrial',atmosphere:'violet-heat'}),
 'archive-quarter':freeze({family:'archive-canopy',silhouettes:freeze(['canopy','index-tower','archive-bridge','research-garden','memory-vault']),terrain:'living',atmosphere:'mint-mist'}),
 'golden-market':freeze({family:'golden-civic',silhouettes:freeze(['civic-dome','terrace','arcade','showcase-tower','market-hall']),terrain:'plaza',atmosphere:'gold-haze'}),
 'oceanic-habitat':freeze({family:'oceanic-light',silhouettes:freeze(['light-reef','wave-tower','water-dome','quay-bridge','habitat-shell']),terrain:'water',atmosphere:'ocean-mist'}),
 'bio-city':freeze({family:'living-bio',silhouettes:freeze(['bio-spire','garden-canopy','habitat-pod','root-bridge','greenhouse']),terrain:'living',atmosphere:'bio-glow'}),
 'noir-arcade':freeze({family:'archive-noir',silhouettes:freeze(['noir-bridge','investigation-tower','shadow-arcade','courtyard-block','signal-needle']),terrain:'noir-stone',atmosphere:'noir-fog'}),
 'time-gardens':freeze({family:'path-of-time',silhouettes:freeze(['chronology-terrace','time-obelisk','reflection-arch','garden-ring','history-tower']),terrain:'terraced',atmosphere:'amber-dust'}),
 'eonbot-temple':freeze({family:'eonbot-temple',silhouettes:freeze(['signal-sanctum','companion-beacon','temple-arch','guidance-spire','docking-court']),terrain:'signal-stone',atmosphere:'aqua-signal'})
});
const DISCOVERY=freeze({
 'signal-garden':freeze({shape:'signal-garden',animation:'pulse',verticalScale:.65}),
 'memory-obelisk':freeze({shape:'obelisk',animation:'float',verticalScale:1.45}),
 'realm-echo':freeze({shape:'echo-portal',animation:'rotate',verticalScale:1}),
 'street-performance':freeze({shape:'performance-stage',animation:'pulse',verticalScale:.35}),
 'public-workshop':freeze({shape:'workshop-kiosk',animation:'static',verticalScale:.85}),
 'rare-material-display':freeze({shape:'crystal-display',animation:'rotate',verticalScale:1.2}),
 'transit-overlook':freeze({shape:'overlook-bridge',animation:'static',verticalScale:.5}),
 'atlas-marker':freeze({shape:'atlas-prism',animation:'float',verticalScale:1})
});
const STREET=freeze({
 'pedestrian-crossing':freeze({shape:'crossing-bars',motion:'static'}), 'kiosk-pulse':freeze({shape:'kiosk-light',motion:'pulse'}),
 'delivery-route':freeze({shape:'route-chevron',motion:'pulse'}), 'maintenance-cue':freeze({shape:'maintenance-cone',motion:'static'}),
 'plaza-gathering':freeze({shape:'plaza-cluster',motion:'pulse'}), 'light-rail-passage':freeze({shape:'rail-segment',motion:'slide'}),
 'wayfinding-signal':freeze({shape:'signal-arrow',motion:'pulse'}), 'public-art-cycle':freeze({shape:'kinetic-art',motion:'rotate'})
});

function quality(value='balanced'){return QUALITY[String(value)]||QUALITY.balanced;}
function hash32(value=''){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function point(x=0,y=0,z=0){return freeze({x:Number(x)||0,y:Number(y)||0,z:Number(z)||0});}
function kitFor(id=''){return KITS[String(id)]||KITS['civic-spine'];}

/**
 * Macro-region archetypes are deterministic but may legitimately repeat in a
 * 3×3 neighbourhood. The presentation layer must not turn those repeats into
 * visually identical adjacent regions, so it assigns the preferred kit first
 * and then deterministically selects an unused presentation kit. With nine
 * regions and nine public-safe kits this guarantees a collision-free visual
 * family map without changing the authored macro archetype identity.
 */
function presentationKitsFor(regions=[],seed='eonapp-expanse',currentRegionId=''){
 const keys=Object.keys(KITS); const usedFamilies=new Set();
 return regions.map((region,regionIndex)=>{
  const preferredKey=Object.hasOwn(KITS,String(region?.archetype?.id||''))?String(region.archetype.id):'civic-spine';
  const preferred=KITS[preferredKey];
  if(!usedFamilies.has(preferred.family)){usedFamilies.add(preferred.family);return freeze({key:preferredKey,kit:preferred});}
  const start=hash32(`${seed}:${currentRegionId}:${region?.id}:${regionIndex}:presentation-kit`)%keys.length;
  for(let offset=0;offset<keys.length;offset+=1){
   const key=keys[(start+offset)%keys.length]; const candidate=KITS[key];
   if(!usedFamilies.has(candidate.family)){usedFamilies.add(candidate.family);return freeze({key,kit:candidate});}
  }
  return freeze({key:preferredKey,kit:preferred});
 });
}

export function buildEonCityW698ExpansePresentation({macroPlan={},quality='balanced',seed='eonapp-expanse'}={}){
 const q=qualityProfile(quality); const regions=Array.isArray(macroPlan.regions)?macroPlan.regions:[];
 const skylineClusters=[]; const presentationKits=presentationKitsFor(regions,seed,macroPlan.currentRegionId);
 for(const [regionIndex,region] of regions.entries()){
  const selection=presentationKits[regionIndex]||freeze({key:'civic-spine',kit:kitFor(region.archetype?.id)}); const kit=selection.kit;
  const roleScale=region.role==='current'?1:region.role==='adjacent'?q.farScale:.72*q.farScale;
  const count=region.role==='current'?Math.max(3,q.clusterSize-1):q.clusterSize;
  const nodes=Array.from({length:count},(_,index)=>{
    const angle=(Math.PI*2*index/count)+(hash32(`${seed}:${region.id}:angle`)%100)/240;
    const radius=(region.role==='current'?24:18)+(index%3)*7;
    const silhouette=kit.silhouettes[(hash32(`${seed}:${region.id}:${index}`)+index)%kit.silhouettes.length];
    const height=(7+(hash32(`${region.id}:${index}:height`)%12))*roleScale;
    return freeze({id:`${region.id}:skyline:${index+1}`,regionId:region.id,family:kit.family,silhouette,position:point(region.center.x+Math.cos(angle)*radius,height/2-.1,region.center.z+Math.sin(angle)*radius),width:Number((3.2+(index%3)*1.3).toFixed(2)),depth:Number((2.6+((index+1)%3)*1.15).toFixed(2)),height:Number(height.toFixed(2)),lod:region.role==='current'?'mid':region.role==='adjacent'?'far':'horizon',collision:false,interactive:false});
  });
  skylineClusters.push(freeze({regionId:region.id,archetypeId:region.archetype?.id,presentationKitId:selection.key,family:kit.family,terrain:kit.terrain,atmosphere:kit.atmosphere,nodes:freeze(nodes)}));
 }
 const roadHierarchy=freeze([...(macroPlan.arterials||[]),...(macroPlan.approaches||[])].map((road,index)=>freeze({...road,hierarchy:road.id?.includes('approach')?'regional-approach':'macro-arterial',curbs:true,centerLine:true,crossingEvery:index%3===0?42:58,lightSpacing:q.streetDetail===1?28:q.streetDetail===3?14:20,intersectionIdentity:`intersection-${index%6}`,automaticNavigation:false})));
 const transitions=freeze(regions.filter(r=>r.role!=='current').map((region,index)=>freeze({id:`transition:${macroPlan.currentRegionId}:${region.id}`,fromRegionId:macroPlan.currentRegionId,toRegionId:region.id,visualCue:index%3===0?'palette-and-skyline':index%3===1?'terrain-and-street':'atmosphere-and-landmark',hardBorder:false,streamingWindowUnchanged:true})));
 const adjacentFamilies=skylineClusters.filter(c=>(regions.find(r=>r.id===c.regionId)?.role)==='adjacent').map(c=>c.family);
 return freeze({schema:EON_CITY_W698_EXPANSE_PRESENTATION_SCHEMA,quality:Object.hasOwn(QUALITY,String(quality))?String(quality):'balanced',macroRegionCount:regions.length,skylineClusters:freeze(skylineClusters),skylineNodeCount:skylineClusters.reduce((n,c)=>n+c.nodes.length,0),roadHierarchy,transitions,uniqueArchitectureFamilies:new Set(skylineClusters.map(c=>c.family)).size,adjacentFamilyRepeats:adjacentFamilies.slice(1).filter((v,i)=>v===adjacentFamilies[i]).length,nearMidFarComposition:true,detailedFiveByFiveStreamingPreserved:true,interactiveThreeByThreePreserved:true,visibleHardBorder:false,oneCanonicalScene:true,automaticNavigation:false,networkRequestCreated:false});
}
function qualityProfile(value){return quality(value);}
export function resolveEonCityW698DiscoveryVisual(kind='',rarity='common'){const base=DISCOVERY[String(kind)]||freeze({shape:'discovery-prism',animation:'float',verticalScale:1});return freeze({...base,kind:String(kind),rarity:String(rarity),scale:rarity==='rare'?1.35:rarity==='uncommon'?1.12:1,reviewFirst:true,automaticOpen:false});}
export function resolveEonCityW698StreetActivityVisual(kind=''){const base=STREET[String(kind)]||freeze({shape:'street-cue',motion:'pulse'});return freeze({...base,kind:String(kind),claimsRealActivity:false,interactive:false});}
export function validateEonCityW698ExpansePresentation(plan={}){const errors=[];if(plan.schema!==EON_CITY_W698_EXPANSE_PRESENTATION_SCHEMA)errors.push('schema-invalid');if(plan.macroRegionCount!==9||plan.skylineClusters?.length!==9)errors.push('regions-invalid');if(plan.skylineNodeCount<27)errors.push('skyline-density-invalid');if(plan.uniqueArchitectureFamilies<7)errors.push('architecture-variety-invalid');if(plan.adjacentFamilyRepeats!==0)errors.push('adjacent-repeat-invalid');if(!plan.nearMidFarComposition||!plan.detailedFiveByFiveStreamingPreserved||!plan.interactiveThreeByThreePreserved||plan.visibleHardBorder)errors.push('streaming-composition-invalid');if(plan.automaticNavigation||plan.networkRequestCreated)errors.push('truth-boundary-invalid');return freeze({ok:errors.length===0,errors:freeze(errors),skylineNodeCount:plan.skylineNodeCount||0,uniqueArchitectureFamilies:plan.uniqueArchitectureFamilies||0,roadCount:plan.roadHierarchy?.length||0});}
export function getEonCityW698ExpansePresentationTruth(){return freeze({schema:EON_CITY_W698_EXPANSE_PRESENTATION_SCHEMA,boundedOpenWorldPerception:true,macroArchitectureKits:true,roadHierarchy:true,nearMidFarComposition:true,distinctDiscoveries:true,populationLod:true,detailedFiveByFiveStreamingPreserved:true,interactiveThreeByThreePreserved:true,oneCanonicalScene:true,automaticNavigation:false,networkRequestCreated:false});}
export default freeze({EON_CITY_W698_EXPANSE_PRESENTATION_SCHEMA,buildEonCityW698ExpansePresentation,resolveEonCityW698DiscoveryVisual,resolveEonCityW698StreetActivityVisual,validateEonCityW698ExpansePresentation,getEonCityW698ExpansePresentationTruth});
