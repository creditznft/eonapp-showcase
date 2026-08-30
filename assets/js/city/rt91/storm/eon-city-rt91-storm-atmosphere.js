/** RT91 Storm — bounded atmosphere/audio/VFX projection on top of W792 authored families. */
import { EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE } from '../../w792/eon-expanse-w792a-storm-sector-authored-package.js';
import { buildEonCityRt91AudioMix } from '../eon-city-rt91-audio-director.js';
export const EON_CITY_RT91_STORM_ATMOSPHERE_SCHEMA='eon.city.storm.atmosphere.rt91.v1';
const freeze=Object.freeze;
export function buildEonCityRt91StormAtmosphere({zoneId='charged-gateway',weather=null,missionId='',hiddenWorld=false,reducedSensory=false}={}){
  const severity=Math.max(0,Math.min(4,Number(weather?.severity)||0));
  const audio=buildEonCityRt91AudioMix({worldId:'storm-sector',zoneId,eventId:severity>=4?'supercell':severity>=2?'charged-front':'',missionId,hiddenWorld,reducedSensory});
  const environment=EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.environmentFamilies.map((family)=>freeze({id:family.id,active:!hiddenWorld&&(family.id==='signal-pylons'||severity>=1),intensity:hiddenWorld?0:Number((severity/4*(reducedSensory?.45:1)).toFixed(2)),reducedSensorySafe:family.reducedSensorySafe===true}));
  return freeze({schema:EON_CITY_RT91_STORM_ATMOSPHERE_SCHEMA,worldId:'storm-sector',zoneId,severity,audio,environment:freeze(environment),localAudioFamilies:EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.audioFamilies.map((row)=>row.id),usesExistingAuthoredFamilies:true,meshSpectaclePreferred:false,audioLightingFogPreferred:true,decisionRunsAtFrameRate:false,hiddenWorldSuspended:hiddenWorld,ownsAudioContext:false,ownsTimer:false,ownsRenderLoop:false,grantsProgression:false});
}
export function validateEonCityRt91StormAtmosphere(result={}){const errors=[];if(result.schema!==EON_CITY_RT91_STORM_ATMOSPHERE_SCHEMA||result.worldId!=='storm-sector')errors.push('schema-world');if(result.environment?.length!==4||result.localAudioFamilies?.length!==3)errors.push('family-count');if(result.meshSpectaclePreferred!==false||result.audioLightingFogPreferred!==true||result.decisionRunsAtFrameRate||result.ownsAudioContext||result.ownsTimer||result.ownsRenderLoop||result.grantsProgression)errors.push('authority-budget');if(result.hiddenWorldSuspended&&result.environment?.some((row)=>row.active||row.intensity))errors.push('hidden-world');return freeze({ok:errors.length===0,errors:freeze(errors)});}
export default freeze({EON_CITY_RT91_STORM_ATMOSPHERE_SCHEMA,buildEonCityRt91StormAtmosphere,validateEonCityRt91StormAtmosphere});
