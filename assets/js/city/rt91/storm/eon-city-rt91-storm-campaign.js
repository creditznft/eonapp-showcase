/** RT91 Storm — twelve authored missions layered after the W795 foundation tutorial. */
import { EON_EXPANSE_W792B_STORM_SECTOR_ZONES } from '../../w792/eon-expanse-w792b-storm-sector-layout.js';

export const EON_CITY_RT91_STORM_CAMPAIGN_SCHEMA = 'eon.city.storm.living-campaign.rt91.v1';
const freeze = Object.freeze;
const VERBS = new Set(['reach', 'inspect', 'scan', 'recover', 'repair', 'route', 'activate', 'stabilize', 'rescue', 'escort', 'calibrate', 'investigate', 'return']);
const objective = (id, verb, label, targetKey) => freeze({ id, verb, label, targetKey, automaticCompletion: false });
const mission = ({ id, label, act, sequence, zoneId, prerequisiteMissionId = '', objectives, transformationHint, weatherIntent }) => freeze({
  schema: EON_CITY_RT91_STORM_CAMPAIGN_SCHEMA,
  id,
  label,
  worldId: 'storm-sector',
  zoneId,
  act,
  sequence,
  prerequisiteMissionId,
  requiresFoundationComplete: act === 1 && sequence === 1,
  objectives: freeze(objectives),
  transformationHint,
  weatherIntent,
  storyClass: 'storm-living-campaign',
  authored: true,
  repeatable: false,
  rewardAuthority: false,
  grantsXp: false,
  writesFoundationLedger: false,
  automaticCompletion: false,
  runtimeAiRequired: false,
  privateContentStored: false
});

export const EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS = freeze([
  mission({ id:'storm-enter-the-storm', label:'Enter the Storm', act:1, sequence:1, zoneId:'charged-gateway', transformationHint:'gateway-operational', weatherIntent:'charged', objectives:[objective('reach-charged-threshold','reach','Reach the charged threshold.','storm-charged-threshold'),objective('inspect-grounding-marker','inspect','Inspect the gateway grounding marker.','storm-gateway-grounding-marker'),objective('activate-entry-beacon','activate','Activate the safe-entry beacon.','storm-entry-beacon')] }),
  mission({ id:'storm-grounding-protocol', label:'Grounding Protocol', act:1, sequence:2, zoneId:'charged-gateway', prerequisiteMissionId:'storm-enter-the-storm', transformationHint:'gateway-grounded', weatherIntent:'severe', objectives:[objective('reach-grounding-bank','reach','Reach the primary grounding bank.','storm-grounding-bank'),objective('calibrate-grounding-grid','calibrate','Calibrate the grounding grid.','storm-grounding-grid'),objective('stabilize-gateway-charge','stabilize','Stabilize the gateway charge.','storm-gateway-charge')] }),
  mission({ id:'storm-lost-relay', label:'Lost Relay', act:1, sequence:3, zoneId:'relay-basin', prerequisiteMissionId:'storm-grounding-protocol', transformationHint:'relay-search-lit', weatherIntent:'severe', objectives:[objective('scan-lost-relay-bearing','scan','Scan for the lost relay bearing.','storm-lost-relay-bearing'),objective('recover-relay-coupler','recover','Recover the relay coupler.','storm-relay-coupler'),objective('repair-field-relay','repair','Repair the field relay.','storm-field-relay')] }),
  mission({ id:'storm-shelter-line', label:'Shelter Line', act:1, sequence:4, zoneId:'relay-basin', prerequisiteMissionId:'storm-lost-relay', transformationHint:'shelter-line-online', weatherIntent:'critical', objectives:[objective('reach-shelter-line','reach','Reach the emergency shelter line.','storm-shelter-line'),objective('route-shelter-power','route','Route stabilized power to the shelters.','storm-shelter-power'),objective('activate-shelter-network','activate','Activate the shelter network.','storm-shelter-network')] }),

  mission({ id:'storm-stabilizer-failure', label:'Stabilizer Failure', act:2, sequence:5, zoneId:'stabilizer-ridge', prerequisiteMissionId:'storm-shelter-line', transformationHint:'stabilizer-secondary-online', weatherIntent:'critical', objectives:[objective('investigate-stabilizer-fault','investigate','Investigate the secondary stabilizer fault.','storm-stabilizer-fault'),objective('repair-stabilizer-feed','repair','Repair the stabilizer feed.','storm-stabilizer-feed'),objective('calibrate-stabilizer-phase','calibrate','Calibrate the stabilizer phase.','storm-stabilizer-phase')] }),
  mission({ id:'storm-charged-transit', label:'Charged Transit', act:2, sequence:6, zoneId:'stabilizer-ridge', prerequisiteMissionId:'storm-stabilizer-failure', transformationHint:'charged-transit-safe', weatherIntent:'severe', objectives:[objective('inspect-transit-charge','inspect','Inspect the charged transit junction.','storm-transit-charge'),objective('route-transit-ground','route','Route the transit grounding path.','storm-transit-ground'),objective('activate-service-capsule','activate','Activate the protected service capsule.','storm-service-capsule')] }),
  mission({ id:'storm-rescue-corridor', label:'Rescue Corridor', act:2, sequence:7, zoneId:'storm-eye', prerequisiteMissionId:'storm-charged-transit', transformationHint:'rescue-corridor-visible', weatherIntent:'critical', objectives:[objective('scan-rescue-corridor','scan','Scan the rescue corridor.','storm-rescue-corridor'),objective('rescue-stranded-maintainer','rescue','Recover the stranded maintainer.','storm-stranded-maintainer'),objective('escort-maintainer-shelter','escort','Escort the maintainer to the safe shelter.','storm-maintainer-shelter')] }),
  mission({ id:'storm-relay-cascade', label:'Relay Cascade', act:2, sequence:8, zoneId:'relay-basin', prerequisiteMissionId:'storm-rescue-corridor', transformationHint:'relay-cascade-contained', weatherIntent:'critical', objectives:[objective('investigate-relay-cascade','investigate','Investigate the relay cascade.','storm-relay-cascade'),objective('repair-cascade-node','repair','Repair the cascade node.','storm-cascade-node'),objective('stabilize-relay-chain','stabilize','Stabilize the relay chain.','storm-relay-chain')] }),

  mission({ id:'storm-atmospheric-collapse', label:'Atmospheric Collapse', act:3, sequence:9, zoneId:'stabilizer-ridge', prerequisiteMissionId:'storm-relay-cascade', transformationHint:'atmosphere-contained', weatherIntent:'supercell', objectives:[objective('scan-collapse-front','scan','Scan the atmospheric collapse front.','storm-collapse-front'),objective('calibrate-emergency-array','calibrate','Calibrate the emergency array.','storm-emergency-array'),objective('stabilize-collapse-front','stabilize','Stabilize the collapse front.','storm-collapse-stabilizer')] }),
  mission({ id:'storm-command-spire', label:'Command Spire', act:3, sequence:10, zoneId:'relay-basin', prerequisiteMissionId:'storm-atmospheric-collapse', transformationHint:'command-spire-online', weatherIntent:'supercell', objectives:[objective('reach-command-spire','reach','Reach the Storm Command Spire.','storm-command-spire'),objective('inspect-command-grid','inspect','Inspect the command grid.','storm-command-grid'),objective('activate-sector-command','activate','Activate sector command.','storm-sector-command')] }),
  mission({ id:'storm-the-supercell', label:'The Supercell', act:3, sequence:11, zoneId:'storm-eye', prerequisiteMissionId:'storm-command-spire', transformationHint:'supercell-bounded', weatherIntent:'supercell', objectives:[objective('reach-storm-eye','reach','Reach the protected Storm Eye perimeter.','storm-eye-perimeter'),objective('investigate-supercell-core','investigate','Investigate the supercell core.','storm-supercell-core'),objective('stabilize-supercell-core','stabilize','Stabilize the supercell core.','storm-supercell-stabilizer')] }),
  mission({ id:'storm-restored', label:'Storm Restored', act:3, sequence:12, zoneId:'charged-gateway', prerequisiteMissionId:'storm-the-supercell', transformationHint:'storm-sector-signature-restored', weatherIntent:'calm', objectives:[objective('scan-restored-sector','scan','Scan the restored sector network.','storm-restored-sector'),objective('activate-regional-beacons','activate','Activate the regional safety beacons.','storm-regional-beacons'),objective('return-command-gateway','return','Return to the Charged Gateway command marker.','storm-command-return')] })
]);

export function validateEonCityRt91StormCampaign() {
  const errors = [];
  const zoneIds = new Set(EON_EXPANSE_W792B_STORM_SECTOR_ZONES.map((zone) => zone.id));
  const ids = new Set();
  let expectedSequence = 1;
  for (const entry of EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS) {
    if (ids.has(entry.id)) errors.push(`duplicate:${entry.id}`); ids.add(entry.id);
    if (!zoneIds.has(entry.zoneId)) errors.push(`zone:${entry.id}`);
    if (entry.sequence !== expectedSequence++) errors.push(`sequence:${entry.id}`);
    if (![1,2,3].includes(entry.act)) errors.push(`act:${entry.id}`);
    if (entry.objectives.length !== 3) errors.push(`objectives:${entry.id}`);
    for (const step of entry.objectives) if (!VERBS.has(step.verb) || !step.id || !step.targetKey || step.automaticCompletion !== false) errors.push(`objective:${entry.id}:${step?.id || 'missing'}`);
    if (entry.sequence === 1) { if (!entry.requiresFoundationComplete || entry.prerequisiteMissionId) errors.push('foundation-prerequisite'); }
    else if (!ids.has(entry.prerequisiteMissionId)) errors.push(`prerequisite:${entry.id}`);
    if (entry.grantsXp || entry.rewardAuthority || entry.writesFoundationLedger || entry.automaticCompletion || entry.runtimeAiRequired || entry.privateContentStored) errors.push(`authority:${entry.id}`);
  }
  if (EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS.length !== 12 || ids.size !== 12) errors.push('mission-count');
  for (const act of [1,2,3]) if (EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS.filter((entry) => entry.act === act).length !== 4) errors.push(`act-count:${act}`);
  return freeze({ ok: errors.length === 0, errors: freeze(errors), missionCount: EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS.length, objectiveCount: EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS.reduce((sum,m)=>sum+m.objectives.length,0), actCount: 3 });
}

export default freeze({ EON_CITY_RT91_STORM_CAMPAIGN_SCHEMA, EON_CITY_RT91_STORM_CAMPAIGN_MISSIONS, validateEonCityRt91StormCampaign });
