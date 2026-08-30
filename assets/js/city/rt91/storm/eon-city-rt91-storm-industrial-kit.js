/** RT91 Storm — bounded industrial/debris continuity kit; support geometry only. */
import { EON_EXPANSE_W792B_STORM_SECTOR_ZONES } from '../../w792/eon-expanse-w792b-storm-sector-layout.js';

export const EON_CITY_RT91_STORM_INDUSTRIAL_KIT_SCHEMA = 'eon.city.storm.industrial-kit.rt91.v1';
const freeze = Object.freeze;
const QUALITY = freeze({ lite: 3, balanced: 5, cinematic: 7 });
const TYPES = freeze(['grounding-rod', 'cable-segment', 'pipe-segment', 'storm-barrier', 'broken-platform', 'rescue-wreckage', 'service-gantry', 'warning-beacon']);
const zoneTypes = freeze({
  'charged-gateway': freeze(['grounding-rod', 'storm-barrier', 'cable-segment', 'warning-beacon', 'pipe-segment', 'grounding-rod', 'storm-barrier']),
  'relay-basin': freeze(['pipe-segment', 'cable-segment', 'service-gantry', 'grounding-rod', 'warning-beacon', 'broken-platform', 'pipe-segment']),
  'stabilizer-ridge': freeze(['service-gantry', 'grounding-rod', 'broken-platform', 'cable-segment', 'storm-barrier', 'pipe-segment', 'warning-beacon']),
  'storm-eye': freeze(['rescue-wreckage', 'storm-barrier', 'warning-beacon', 'grounding-rod', 'broken-platform', 'cable-segment', 'rescue-wreckage'])
});
function hash32(value=''){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function unit(key){return hash32(key)/4294967295;}

export function buildEonCityRt91StormIndustrialKit({ quality='balanced', worldSeed=91 }={}) {
  const resolvedQuality = Object.hasOwn(QUALITY, quality) ? quality : 'balanced';
  const limit = QUALITY[resolvedQuality];
  const zones = EON_EXPANSE_W792B_STORM_SECTOR_ZONES.map((zone) => {
    const props = (zoneTypes[zone.id] || TYPES).slice(0, limit).map((type,index) => {
      const angle = (index / Math.max(1, limit)) * Math.PI * 2 + unit(`${worldSeed}:${zone.id}:${index}:a`) * 0.45;
      const radius = zone.radius * (0.38 + unit(`${worldSeed}:${zone.id}:${index}:r`) * 0.28);
      return freeze({
        id: `rt91-storm-${zone.id}-${type}-${index+1}`,
        zoneId: zone.id,
        type,
        position: freeze({ x: Number((zone.center.x + Math.cos(angle)*radius).toFixed(2)), y: 0, z: Number((zone.center.z + Math.sin(angle)*radius).toFixed(2)) }),
        rotationY: Number((-angle + unit(`${worldSeed}:${zone.id}:${index}:rot`)*0.3).toFixed(4)),
        distanceTier: index < 2 ? 'near' : index < 5 ? 'mid' : 'horizon',
        interactive: false,
        checkCollisions: type === 'storm-barrier' || type === 'broken-platform',
        instancingPreferred: true,
        finishedHeroBuilding: false,
        bootCritical: false
      });
    });
    return freeze({ zoneId: zone.id, props: freeze(props), propCount: props.length });
  });
  return freeze({ schema:EON_CITY_RT91_STORM_INDUSTRIAL_KIT_SCHEMA, worldId:'storm-sector', quality:resolvedQuality, zones:freeze(zones), propCount:zones.reduce((sum,z)=>sum+z.propCount,0), allowedTypes:TYPES, bootCriticalAssetDelta:0, optionalOnly:true, firstFrameExcluded:true, ownsEngine:false, ownsScene:false, ownsRenderLoop:false, wholeMapEagerLoadAllowed:false });
}

export function validateEonCityRt91StormIndustrialKit(plan={}){
  const errors=[];
  if(plan.schema!==EON_CITY_RT91_STORM_INDUSTRIAL_KIT_SCHEMA||plan.worldId!=='storm-sector')errors.push('schema-world');
  if(plan.zones?.length!==4)errors.push('zone-count');
  const expected=QUALITY[plan.quality]||0;
  for(const zone of plan.zones||[]){
    if(zone.propCount!==expected)errors.push(`budget:${zone.zoneId}`);
    for(const prop of zone.props||[]){if(!TYPES.includes(prop.type)||prop.interactive!==false||prop.finishedHeroBuilding!==false||prop.bootCritical!==false)errors.push(`prop:${prop?.id||'missing'}`);}
  }
  if(plan.bootCriticalAssetDelta!==0||plan.optionalOnly!==true||plan.firstFrameExcluded!==true||plan.ownsEngine||plan.ownsScene||plan.ownsRenderLoop||plan.wholeMapEagerLoadAllowed)errors.push('runtime-boundary');
  return freeze({ok:errors.length===0,errors:freeze(errors),propCount:Number(plan.propCount||0),zoneCount:plan.zones?.length||0});
}
export default freeze({EON_CITY_RT91_STORM_INDUSTRIAL_KIT_SCHEMA,buildEonCityRt91StormIndustrialKit,validateEonCityRt91StormIndustrialKit});
