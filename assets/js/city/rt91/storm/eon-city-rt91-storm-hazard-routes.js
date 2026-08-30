/** RT91 Storm — readable hazard/safe-route projection; never blocks Hub return. */
import { EON_EXPANSE_W792B_STORM_SECTOR_ROUTES } from '../../w792/eon-expanse-w792b-storm-sector-layout.js';
export const EON_CITY_RT91_STORM_HAZARD_ROUTE_SCHEMA='eon.city.storm.hazard-routes.rt91.v1';
const freeze=Object.freeze;
export function deriveEonCityRt91StormHazardRoutes({weather=null,restoredFamilies=[]}={}){
  const restored=new Set((restoredFamilies||[]).map(String));
  const severity=Math.max(0,Math.min(4,Number(weather?.severity)||0));
  const rows=EON_EXPANSE_W792B_STORM_SECTOR_ROUTES.map((route,index)=>{
    const mitigated=(index===0&&restored.has('relay-repair'))||(index===1&&restored.has('weather-restoration'))||(index===2&&restored.has('storm-rescue'));
    const effective=Math.max(0,severity-(mitigated?2:0));
    return freeze({id:route.id,status:effective>=4?'hazard':effective>=2?'caution':'safe',hazardSeverity:effective,routeWidth:route.width,visualCue:effective>=4?'red-grounding-pulses':effective>=2?'amber-charged-markers':'cyan-safe-route',blocked:false,navigationAuthority:false,collisionAuthority:false});
  });
  return freeze({schema:EON_CITY_RT91_STORM_HAZARD_ROUTE_SCHEMA,worldId:'storm-sector',routes:freeze(rows),hubReturn:freeze({available:true,status:'safe',cannotBeDisabledByWeather:true}),allRoutesBlocked:false,ownsNavigation:false,ownsRenderLoop:false});
}
export function validateEonCityRt91StormHazardRoutes(plan={}){const errors=[];if(plan.schema!==EON_CITY_RT91_STORM_HAZARD_ROUTE_SCHEMA||plan.routes?.length!==3)errors.push('schema-routes');if(plan.routes?.some(r=>r.blocked||r.navigationAuthority||r.collisionAuthority))errors.push('route-authority');if(plan.hubReturn?.available!==true||plan.hubReturn?.cannotBeDisabledByWeather!==true||plan.allRoutesBlocked!==false||plan.ownsNavigation||plan.ownsRenderLoop)errors.push('escape-boundary');return freeze({ok:errors.length===0,errors:freeze(errors)});}
export default freeze({EON_CITY_RT91_STORM_HAZARD_ROUTE_SCHEMA,deriveEonCityRt91StormHazardRoutes,validateEonCityRt91StormHazardRoutes});
