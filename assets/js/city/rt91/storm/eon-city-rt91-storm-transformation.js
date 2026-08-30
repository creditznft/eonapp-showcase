/** RT91 Storm — read-only visual transformation projection across foundation + living campaign. */
import { EON_EXPANSE_W792B_STORM_SECTOR_ZONES } from '../../w792/eon-expanse-w792b-storm-sector-layout.js';
import { deriveEonExpanseW799AStormTransformations } from '../../w799/eon-expanse-w799a-storm-sector-transformations.js';
import { deriveEonCityRt91StormCampaignView } from './eon-city-rt91-storm-campaign-runtime.js';
import { projectEonCityRt91WorldTransformation, validateEonCityRt91WorldTransformationProjection } from '../eon-city-rt91-world-transformation-projection.js';

export const EON_CITY_RT91_STORM_TRANSFORMATION_SCHEMA='eon.city.storm.transformation.rt91.v1';
const freeze=Object.freeze;
export function projectEonCityRt91StormTransformation({foundationState=null,campaignState=null}={}){
  const foundation=deriveEonExpanseW799AStormTransformations(foundationState);
  const campaign=deriveEonCityRt91StormCampaignView({state:campaignState,foundationState});
  const units=EON_EXPANSE_W792B_STORM_SECTOR_ZONES.map((zone)=>{
    const foundationRows=foundation.rows.filter((row)=>row.zoneId===zone.id);
    const foundationRatio=foundationRows.length?foundationRows.reduce((sum,row)=>sum+row.completedObjectives/Math.max(1,row.totalObjectives),0)/foundationRows.length:0;
    const campaignRows=campaign.missions.filter((row)=>row.zoneId===zone.id);
    const campaignRatio=campaignRows.length?campaignRows.reduce((sum,row)=>sum+row.completedObjectiveCount/Math.max(1,row.objectiveCount),0)/campaignRows.length:0;
    const progressRatio=Math.max(0,Math.min(1,foundationRatio*.35+campaignRatio*.65));
    return freeze({id:zone.id,label:zone.label,progressRatio});
  });
  const generic=projectEonCityRt91WorldTransformation({worldId:'storm-sector',units});
  return freeze({schema:EON_CITY_RT91_STORM_TRANSFORMATION_SCHEMA,worldId:'storm-sector',zones:freeze(generic.units.map((unit)=>freeze({...unit,presentationMutationPolicy:'materials-lights-audio-ambient-activity-first',structuralGeometryMutationRequired:false}))),foundationRestored:foundation.regionRestored,campaignComplete:campaign.campaignComplete,foundationRestoredCount:foundation.restoredCount,campaignCompleted:campaign.completedMissionCount,campaignTotal:campaign.totalMissionCount,worldStage:generic.worldStage,writesMissionState:false,writesProgression:false,createsGeometry:false,ownsRenderLoop:false});
}
export function validateEonCityRt91StormTransformation(result={}){const errors=[];if(result.schema!==EON_CITY_RT91_STORM_TRANSFORMATION_SCHEMA||result.worldId!=='storm-sector')errors.push('schema-world');const generic=validateEonCityRt91WorldTransformationProjection({schema:'eon.city.world-transformation.rt91.v1',worldId:'storm-sector',units:result.zones||[],writesPersistence:false,grantsProgression:false,ownsRenderLoop:false});if(!generic.ok)errors.push(...generic.errors.map((error)=>`projection:${error}`));if(result.zones?.length!==4)errors.push('zone-count');for(const zone of result.zones||[])if(zone.presentationMutationPolicy!=='materials-lights-audio-ambient-activity-first'||zone.structuralGeometryMutationRequired!==false)errors.push(`mutation:${zone.id}`);if(result.writesMissionState||result.writesProgression||result.createsGeometry||result.ownsRenderLoop)errors.push('authority');return freeze({ok:errors.length===0,errors:freeze(errors),zoneCount:result.zones?.length||0});}
export default freeze({EON_CITY_RT91_STORM_TRANSFORMATION_SCHEMA,projectEonCityRt91StormTransformation,validateEonCityRt91StormTransformation});
