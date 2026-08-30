/** RT91 Storm — authored semantic activity cells for deterministic rescue/repair/weather contracts. */
import { EON_EXPANSE_W792B_STORM_SECTOR_ZONES } from '../../w792/eon-expanse-w792b-storm-sector-layout.js';
import { EON_CITY_RT91_ACTIVITY_CELL_SCHEMA, createEonCityRt91ActivityCell } from '../eon-city-rt91-world-cell-activity.js';

export const EON_CITY_RT91_STORM_CONTRACT_CELLS_SCHEMA='eon.city.storm.contract-cells.rt91.v1';
const freeze=Object.freeze;
const ROLE_SET=new Set(['stabilizer','grounding','weather-array','safe-zone','relay','industrial','maintenance','rescue','shelter','transit']);
const OFFSETS=freeze([{dx:-.34,dz:-.2},{dx:.3,dz:-.28},{dx:-.14,dz:.32},{dx:.37,dz:.2},{dx:.05,dz:-.42},{dx:-.4,dz:.08}]);
const rolesByZone=freeze({
  'charged-gateway':freeze([['transit','grounding'],['safe-zone','grounding'],['industrial','maintenance'],['transit','safe-zone'],['grounding','industrial'],['shelter','safe-zone']]),
  'relay-basin':freeze([['relay','industrial'],['weather-array','stabilizer'],['maintenance','relay'],['safe-zone','industrial'],['grounding','weather-array'],['shelter','safe-zone']]),
  'stabilizer-ridge':freeze([['stabilizer','grounding'],['maintenance','industrial'],['weather-array','stabilizer'],['relay','industrial'],['safe-zone','grounding'],['transit','safe-zone']]),
  'storm-eye':freeze([['rescue','shelter'],['safe-zone','rescue'],['transit','safe-zone'],['grounding','industrial'],['rescue','transit'],['shelter','safe-zone']])
});
export function buildEonCityRt91StormContractCells(){
  const cells=[];
  for(const zone of EON_EXPANSE_W792B_STORM_SECTOR_ZONES){
    const rows=rolesByZone[zone.id]||[];
    rows.forEach((roles,index)=>{const offset=OFFSETS[index];const cell=createEonCityRt91ActivityCell({worldId:'storm-sector',cellId:`storm-${zone.id}-cell-${index+1}`,zoneId:zone.id,regionId:zone.id,roles,position:{x:Number((zone.center.x+zone.radius*offset.dx).toFixed(2)),y:0,z:Number((zone.center.z+zone.radius*offset.dz).toFixed(2))},source:'rt91-storm-authored-semantic-cell',interactive:true});cells.push(freeze({...cell,authoredAnchor:true,generatedRawCoordinate:false,interactionRequiresRegistry:true,supportsMissionPlacement:true}));});
  }
  return freeze({schema:EON_CITY_RT91_STORM_CONTRACT_CELLS_SCHEMA,worldId:'storm-sector',cells:freeze(cells),cellCount:cells.length,rawUserCoordinatesAccepted:false,deterministic:true,ownsGeometry:false,ownsNavigation:false});
}
export function validateEonCityRt91StormContractCells(plan={}){const errors=[];if(plan.schema!==EON_CITY_RT91_STORM_CONTRACT_CELLS_SCHEMA||plan.worldId!=='storm-sector')errors.push('schema-world');if(plan.cellCount!==24||plan.cells?.length!==24)errors.push('cell-count');const ids=new Set(),zoneCounts=new Map();for(const cell of plan.cells||[]){if(cell.schema!==EON_CITY_RT91_ACTIVITY_CELL_SCHEMA||!cell.cellId||ids.has(cell.cellId))errors.push(`id:${cell?.cellId||'missing'}`);ids.add(cell.cellId);zoneCounts.set(cell.zoneId,(zoneCounts.get(cell.zoneId)||0)+1);if(!cell.roles?.length||cell.roles.some((role)=>!ROLE_SET.has(role)))errors.push(`roles:${cell.cellId}`);if(cell.generatedRawCoordinate!==false||cell.interactionRequiresRegistry!==true||cell.supportsMissionPlacement!==true)errors.push(`boundary:${cell.cellId}`);}for(const zone of EON_EXPANSE_W792B_STORM_SECTOR_ZONES)if(zoneCounts.get(zone.id)!==6)errors.push(`zone-count:${zone.id}`);if(plan.rawUserCoordinatesAccepted||plan.ownsGeometry||plan.ownsNavigation)errors.push('authority');return freeze({ok:errors.length===0,errors:freeze(errors),cellCount:plan.cells?.length||0,zoneCount:zoneCounts.size});}
export default freeze({EON_CITY_RT91_STORM_CONTRACT_CELLS_SCHEMA,buildEonCityRt91StormContractCells,validateEonCityRt91StormContractCells});
