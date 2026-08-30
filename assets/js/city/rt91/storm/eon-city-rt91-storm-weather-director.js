/** RT91 Storm — cadence-bound deterministic world-state weather director. */
import { EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE } from '../../w792/eon-expanse-w792a-storm-sector-authored-package.js';
export const EON_CITY_RT91_STORM_WEATHER_SCHEMA='eon.city.storm.weather-director.rt91.v1';
const freeze=Object.freeze;
const LABELS=freeze(['calm','charged','severe','critical','supercell']);
const CADENCE=freeze({lite:1400,balanced:1000,cinematic:850});
function hash32(value=''){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number(v)||0));

export function deriveEonCityRt91StormWeather({quality='balanced',worldSeed=91,at=Date.now(),baseSeverity=2,foundationRestoredRatio=0,campaignRestoredRatio=0,reducedSensory=false,hiddenWorld=false}={}){
  const resolvedQuality=EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.qualityProfiles[quality]?quality:'balanced';
  const profile=EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE.qualityProfiles[resolvedQuality];
  if(hiddenWorld)return freeze({schema:EON_CITY_RT91_STORM_WEATHER_SCHEMA,worldId:'storm-sector',severity:0,label:'suspended',active:false,cadenceMs:0,decisionRunsAtFrameRate:false,maxParticles:0,maxDynamicLights:0,lightningRatePerMinute:0,hubReturnBlocked:false,ownsRenderLoop:false});
  const cadenceMs=CADENCE[resolvedQuality];
  const bucket=Math.floor((Number(at)||0)/cadenceMs);
  const pulse=(hash32(`${worldSeed}:${bucket}:weather`)%3)-1;
  const restoration=Math.max(clamp(foundationRestoredRatio,0,1),clamp(campaignRestoredRatio,0,1));
  const severity=Math.round(clamp(Number(baseSeverity)+pulse-restoration*2.2,0,4));
  const sensoryScale=reducedSensory?0.45:1;
  return freeze({
    schema:EON_CITY_RT91_STORM_WEATHER_SCHEMA,worldId:'storm-sector',severity,label:LABELS[severity],active:true,cadenceMs,decisionRunsAtFrameRate:false,
    presentation:freeze({fogDensityScale:Number((0.35+severity*0.15).toFixed(2)),windScale:Number((0.25+severity*0.18).toFixed(2)),lightningIntensity:Number((severity/4*sensoryScale).toFixed(2)),rainIntensity:Number((Math.min(1,severity/3)*sensoryScale).toFixed(2)),audioIntensity:Number((0.25+severity*0.16).toFixed(2))}),
    maxParticles:Math.round(profile.maxParticles*(0.35+severity*0.1625)*sensoryScale),maxDynamicLights:Math.min(profile.maxDynamicLights,reducedSensory?2:1+severity),lightningRatePerMinute:reducedSensory?Math.min(4,severity):severity*3,
    hubReturnBlocked:false,irreversibleFailure:false,grantsProgression:false,ownsRenderLoop:false,ownsTimer:false
  });
}
export function validateEonCityRt91StormWeather(state={}){const errors=[];if(state.schema!==EON_CITY_RT91_STORM_WEATHER_SCHEMA||state.worldId!=='storm-sector')errors.push('schema-world');if(state.active&&(!Number.isInteger(state.severity)||state.severity<0||state.severity>4||state.cadenceMs<800))errors.push('severity-cadence');if(state.decisionRunsAtFrameRate||state.hubReturnBlocked||state.irreversibleFailure||state.grantsProgression||state.ownsRenderLoop||state.ownsTimer)errors.push('authority');return freeze({ok:errors.length===0,errors:freeze(errors),severity:state.severity});}
export default freeze({EON_CITY_RT91_STORM_WEATHER_SCHEMA,deriveEonCityRt91StormWeather,validateEonCityRt91StormWeather});
