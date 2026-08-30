/** RT91 Storm — bounded authored NPC life + EONBOT hazard behavior. */
import { createEonExpanseW796AStormNpcPlan } from '../../w796/eon-expanse-w796a-storm-sector-npc-plan.js';
import { deriveEonCityRt91NpcLifeDecision } from '../eon-city-rt91-npc-life-director.js';
import { deriveEonCityRt91EonbotWorldBehavior } from '../eon-city-rt91-eonbot-world-director.js';
export const EON_CITY_RT91_STORM_LIFE_SCHEMA='eon.city.storm.life-director.rt91.v1';
const freeze=Object.freeze;
const ROLE_BY_ID=freeze({'storm-warden':'security-guide','atmospheric-engineer':'maintenance-engineer','rescue-scout':'navigator-guide'});
export function deriveEonCityRt91StormLife({quality='balanced',at=Date.now(),nearPlayerNpcIds=[],objective=null,weather=null,missionCompletedRecently=false,hiddenWorld=false}={}){
  const plan=createEonExpanseW796AStormNpcPlan();const near=new Set((nearPlayerNpcIds||[]).map(String));const severity=Math.max(0,Math.min(4,Number(weather?.severity)||0));
  const npcDecisions=plan.patrols.map((patrol)=>deriveEonCityRt91NpcLifeDecision({npcId:patrol.id,worldId:'storm-sector',role:ROLE_BY_ID[patrol.id]||'citizen',quality,at,nearPlayer:near.has(patrol.id),activeObjectiveRole:objective?.verb||'',stormSeverity:severity,missionCompletedRecently,hiddenWorld}));
  const eonbot=deriveEonCityRt91EonbotWorldBehavior({worldId:'storm-sector',objective,hazardSeverity:severity,discoveryNearby:['scan','investigate'].includes(objective?.verb),interactableNearby:['inspect','repair','activate','calibrate','stabilize'].includes(objective?.verb),missionCompletedRecently,dockingAvailable:severity<=1});
  return freeze({schema:EON_CITY_RT91_STORM_LIFE_SCHEMA,worldId:'storm-sector',npcDecisions:freeze(npcDecisions),eonbot,hazardSeverity:severity,npcDecisionCadenceFrameRate:false,visibleAnimationMayRunAtFrameRate:!hiddenWorld,hiddenWorldSuspended:hiddenWorld,fullWorldPopulationAlwaysActive:false,runtimeAiRequired:false,ownsRenderLoop:false});
}
export function validateEonCityRt91StormLife(result={}){const errors=[];if(result.schema!==EON_CITY_RT91_STORM_LIFE_SCHEMA||result.worldId!=='storm-sector')errors.push('schema-world');if(result.npcDecisions?.length!==3)errors.push('npc-budget');for(const npc of result.npcDecisions||[])if(npc.worldId!=='storm-sector'||npc.decisionRunsAtFrameRate===true||npc.ownsAnimationLoop===true||npc.grantsProgression===true)errors.push(`npc:${npc?.npcId||'missing'}`);if(result.eonbot?.autoCompletesObjective!==false||result.eonbot?.autoNavigatesPlayer!==false||result.eonbot?.grantsProgression!==false)errors.push('eonbot-authority');if(result.npcDecisionCadenceFrameRate||result.fullWorldPopulationAlwaysActive||result.runtimeAiRequired||result.ownsRenderLoop)errors.push('runtime-boundary');return freeze({ok:errors.length===0,errors:freeze(errors),npcCount:result.npcDecisions?.length||0});}
export default freeze({EON_CITY_RT91_STORM_LIFE_SCHEMA,deriveEonCityRt91StormLife,validateEonCityRt91StormLife});
