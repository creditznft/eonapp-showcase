/** RT91 Storm — explicit receipt-verified runtime for the post-foundation 12-mission campaign. */
import { deriveEonExpanseW795AStormMissionView } from '../../w795/eon-expanse-w795a-storm-sector-mission-runtime.js';
import { EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS } from './eon-city-rt91-storm-campaign.js';

export const EON_CITY_RT91_STORM_CAMPAIGN_RUNTIME_SCHEMA = 'eon.city.storm.living-campaign-runtime.rt91.v1';
const freeze = Object.freeze;
const missionById = new Map(EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS.map((mission) => [mission.id, mission]));
const campaignIds = new Set(missionById.keys());
const unique = (values=[]) => freeze([...new Set((Array.isArray(values)?values:[]).map(String).filter(Boolean))]);

export function createEonCityRt91StormCampaignInitialState(input={}) {
  const completedMissionIds = unique(input.completedMissionIds).filter((id)=>campaignIds.has(id));
  const activeMissionId = campaignIds.has(String(input.activeMissionId||'')) && !completedMissionIds.includes(String(input.activeMissionId||'')) ? String(input.activeMissionId) : '';
  const completedObjectives = {};
  for (const mission of EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS) {
    const valid = new Set(mission.objectives.map((objective)=>objective.id));
    completedObjectives[mission.id] = unique(input.completedObjectives?.[mission.id]).filter((id)=>valid.has(id));
  }
  return freeze({ schema:EON_CITY_RT91_STORM_CAMPAIGN_RUNTIME_SCHEMA, activeMissionId, completedMissionIds, completedObjectives:freeze(Object.fromEntries(Object.entries(completedObjectives).map(([key,value])=>[key,freeze(value)]))), processedReceiptIds:unique(input.processedReceiptIds), awardsXp:false, writesFoundationLedger:false, privateContentStored:false });
}

function prerequisiteSatisfied(mission,state,foundationState){
  if (mission.requiresFoundationComplete) return deriveEonExpanseW795AStormMissionView(foundationState).regionCompleted === true;
  return state.completedMissionIds.includes(mission.prerequisiteMissionId);
}

export function deriveEonCityRt91StormCampaignView({state=null,foundationState=null}={}) {
  const safe=createEonCityRt91StormCampaignInitialState(state||{});
  const foundation=deriveEonExpanseW795AStormMissionView(foundationState);
  const rows=EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS.map((mission)=>{
    const completed=safe.completedMissionIds.includes(mission.id);
    const active=safe.activeMissionId===mission.id&&!completed;
    const available=!completed&&!active&&!safe.activeMissionId&&prerequisiteSatisfied(mission,safe,foundationState);
    const done=new Set(safe.completedObjectives[mission.id]||[]);
    const activeObjective=mission.objectives.find((objective)=>!done.has(objective.id))||null;
    return freeze({id:mission.id,label:mission.label,zoneId:mission.zoneId,act:mission.act,sequence:mission.sequence,status:completed?'completed':active?'active':available?'available':'locked',active,available,completed,completedObjectiveCount:done.size,objectiveCount:mission.objectives.length,activeObjective,transformationHint:mission.transformationHint,weatherIntent:mission.weatherIntent});
  });
  return freeze({schema:`${EON_CITY_RT91_STORM_CAMPAIGN_RUNTIME_SCHEMA}.view.v1`,worldId:'storm-sector',foundationComplete:foundation.regionCompleted,missions:freeze(rows),activeMission:rows.find((row)=>row.active)||null,availableMissions:freeze(rows.filter((row)=>row.available)),completedMissionCount:rows.filter((row)=>row.completed).length,totalMissionCount:rows.length,completedObjectiveCount:rows.reduce((sum,row)=>sum+row.completedObjectiveCount,0),totalObjectiveCount:EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS.reduce((sum,m)=>sum+m.objectives.length,0),campaignComplete:rows.every((row)=>row.completed),projectionOnly:true,awardsXp:false,writesFoundationLedger:false});
}

export function createEonCityRt91StormCampaignRuntime({initial={},getFoundationState=()=>null,verifyObjectiveReceipt=null,onChange=null,onMissionComplete=null}={}){
  let state=createEonCityRt91StormCampaignInitialState(initial);
  const commit=(next)=>{state=createEonCityRt91StormCampaignInitialState(next);onChange?.(state);return state;};
  const startMission=(missionId,{explicitUserAction=false}={})=>{
    if(!explicitUserAction)return freeze({ok:false,reason:'explicit-user-action-required'});
    const mission=missionById.get(String(missionId||''));if(!mission)return freeze({ok:false,reason:'mission-not-found'});
    const view=deriveEonCityRt91StormCampaignView({state,foundationState:getFoundationState?.()});
    const row=view.missions.find((entry)=>entry.id===mission.id);
    if(!row?.available)return freeze({ok:false,reason:row?.completed?'mission-already-completed':state.activeMissionId?'another-storm-campaign-mission-active':view.foundationComplete?'mission-prerequisite-not-satisfied':'storm-foundation-incomplete'});
    commit({...state,activeMissionId:mission.id});
    return freeze({ok:true,mission,status:'active',activeObjective:mission.objectives[0],awardsXp:false});
  };
  const completeObjective=(missionId,objectiveId,{explicitUserAction=false,receipt=null}={})=>{
    if(!explicitUserAction)return freeze({ok:false,reason:'explicit-user-action-required'});
    const mission=missionById.get(String(missionId||''));if(!mission||state.activeMissionId!==mission.id)return freeze({ok:false,reason:'mission-not-active'});
    const completed=new Set(state.completedObjectives[mission.id]||[]);
    const activeObjective=mission.objectives.find((objective)=>!completed.has(objective.id));
    if(!activeObjective||activeObjective.id!==String(objectiveId||''))return freeze({ok:false,reason:'objective-not-active'});
    if(typeof verifyObjectiveReceipt!=='function')return freeze({ok:false,reason:'objective-receipt-authority-unavailable'});
    const verified=verifyObjectiveReceipt({mission,objective:activeObjective,receipt});
    const receiptId=String(verified?.receipt?.id||'');
    if(!verified?.ok||!receiptId)return freeze({ok:false,reason:verified?.reason||'valid-objective-receipt-required'});
    if(state.processedReceiptIds.includes(receiptId))return freeze({ok:false,reason:'objective-receipt-already-consumed'});
    completed.add(activeObjective.id);
    const missionComplete=completed.size===mission.objectives.length;
    const completedMissionIds=missionComplete?unique([...state.completedMissionIds,mission.id]):state.completedMissionIds;
    commit({...state,activeMissionId:missionComplete?'':mission.id,completedMissionIds,completedObjectives:{...state.completedObjectives,[mission.id]:[...completed]},processedReceiptIds:[...state.processedReceiptIds,receiptId]});
    const nextObjective=missionComplete?null:mission.objectives.find((objective)=>!completed.has(objective.id))||null;
    if(missionComplete)onMissionComplete?.(freeze({missionId:mission.id,zoneId:mission.zoneId,act:mission.act,transformationHint:mission.transformationHint,receiptId,awardsXp:false,writesFoundationLedger:false}));
    return freeze({ok:true,missionId:mission.id,objectiveId:activeObjective.id,receiptId,missionComplete,nextObjective,awardsXp:false,writesFoundationLedger:false});
  };
  return freeze({schema:EON_CITY_RT91_STORM_CAMPAIGN_RUNTIME_SCHEMA,getState:()=>state,getView:()=>deriveEonCityRt91StormCampaignView({state,foundationState:getFoundationState?.()}),startMission,completeObjective,awardsXp:false,writesFoundationLedger:false});
}

export default freeze({EON_CITY_RT91_STORM_CAMPAIGN_RUNTIME_SCHEMA,createEonCityRt91StormCampaignInitialState,deriveEonCityRt91StormCampaignView,createEonCityRt91StormCampaignRuntime});
