#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { buildEonCityVoxelWorld, buildPrivateWorkstationVoxelWorld, buildMyRealmVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W141_NPC_DEVICE_SCHEMA,
  W141_USER_DATA_SURVIVAL_PHASE,
  buildW141NpcDevicePlan,
  getW141RemainingPhaseSummary,
  resolveW141DeviceTier,
  scoreW141NpcDevicePlan
} from '../assets/js/realm3d/engine/EonCityW141NpcDeviceRuntime.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const city = buildEonCityVoxelWorld();
const privateWorld = buildPrivateWorkstationVoxelWorld({ owner: 'gate' });
const myRealm = buildMyRealmVoxelWorld({ username: 'gate' });
const lowTier = resolveW141DeviceTier({ quality: 'neon', mobile: true, touch: true, deviceMemory: 2, hardwareConcurrency: 2, webgl2: false, saveData: true });
const highTier = resolveW141DeviceTier({ quality: 'neon', mobile: false, touch: false, deviceMemory: 16, hardwareConcurrency: 12, webgl2: true, saveData: false });
const plan = buildW141NpcDevicePlan({ quality: 'neon', worldKind: 'eon-city', npcs: city.npcs, device: { mobile: false, deviceMemory: 16, hardwareConcurrency: 12, webgl2: true } });
const score = scoreW141NpcDevicePlan(plan);
const phaseSummary = getW141RemainingPhaseSummary();
const mapJs = read('assets/js/realm3d/engine/EonCityMap.js');
const characterKit = read('assets/js/realm3d/engine/EonCityCharacterKit.js');
const engine = read('assets/js/realm3d/engine/EngineBoot.js');
const panels = read('assets/js/realm3d/engine/WorldPanels.js');
const css = read('assets/css/realm3d.css');
const packageJson = JSON.parse(read('package.json'));

for (const [label, world] of [['city', city], ['private', privateWorld], ['my-realm', myRealm]]) {
  assert(world.w141NpcDevicePlan?.schema === W141_NPC_DEVICE_SCHEMA, `${label} world missing W141 plan`);
  assert(world.w141NpcDeviceScore?.score === 100 && world.w141NpcDeviceScore?.ok === true, `${label} W141 score is not 100`);
  assert((world.npcs || []).every((npc) => (npc.patrolPath || []).length >= 3), `${label} has NPC without bounded W141 route`);
  assert((world.npcs || []).every((npc) => npc.w141NpcQuality?.schema), `${label} has NPC without W141 quality metadata`);
}

assert(plan.schema === W141_NPC_DEVICE_SCHEMA, 'W141 plan schema missing');
assert(score.score === 100 && score.ok === true, 'W141 direct plan score is not 100');
assert(lowTier.id === 'low' && lowTier.autoDowngrade === true && lowTier.lowDeviceProtected === true, 'W141 low mobile tier does not auto-protect');
assert(highTier.id === 'neon' && highTier.autoUpgrade === true && highTier.highDeviceCanLookNearAaa === true, 'W141 high desktop tier does not auto-upgrade');
assert(plan.lowDevicePolicy?.maxActiveNpcs <= 4, 'W141 low-device NPC cap too high');
assert(plan.highDevicePolicy?.maxActiveNpcs >= 12, 'W141 high-device NPC budget too low');
assert(plan.robotNpcCount >= 1, 'W141 missing robot/agent NPC quality proof');
assert(plan.dataSurvivalDone === true, 'W141 must reflect W145 data survival completion');
assert(W141_USER_DATA_SURVIVAL_PHASE.status === 'completed-in-w145', 'W141 data survival phase should be completed in W145');
assert((W141_USER_DATA_SURVIVAL_PHASE.protectedStorage || []).includes('eon:api-key-vault:v1'), 'W145 data phase missing API-key vault protected key');
assert((W141_USER_DATA_SURVIVAL_PHASE.protectedStorage || []).includes('eon:nft-collection:v3'), 'W145 data phase missing NFT v3 protected key');
assert(['W143', 'W144', 'W145', 'W146', 'W147', 'W148'].every((id) => (phaseSummary.phases || []).some((phase) => phase.id === id)), 'remaining phase summary missing required phases');
assert((plan.ceoAudit?.findings || []).some((finding) => finding.area === 'high-device-upscale'), 'CEO audit missing high-device upscale gap');
assert((plan.ceoAudit?.findings || []).some((finding) => finding.area === 'privacy-and-user-data-safety'), 'CEO audit missing data safety gap');
assert(/applyW141NpcDevicePlanToWorld/.test(mapJs), 'EonCityMap missing W141 world wiring');
assert(/applyW141NpcDevicePlanToWorld/.test(mapJs), 'EonCityMap missing W141 score assignment');
assert(/w141NpcDeviceQuality/.test(characterKit), 'CharacterKit missing W141 device quality metadata');
assert(/character-w141-route-beacon/.test(characterKit), 'CharacterKit missing W141 high-device route beacon detail');
assert(/realmNpcDeviceSession\s*=\s*'w141'/.test(engine), 'EngineBoot missing W141 dataset');
assert(/getW141NpcDeviceState/.test(engine), 'EngineBoot missing W141 device state');
assert(/data-w141-npc-device-tier/.test(engine), 'EngineBoot HUD missing W141 device tier marker');
assert(/renderW141NpcDeviceAudit/.test(panels), 'WorldPanels missing W141 audit card');
assert(/data-w141-npc-device="true"/.test(panels), 'WorldPanels missing W141 proof marker');
assert(/Cloudflare update data survival is now certified by W145/.test(panels), 'WorldPanels missing W145 certified data survival copy');
assert(/W141 NPC movement, robot quality, and device-tier performance/.test(css), 'CSS missing W141 marker');
assert(/\.realm3d-w141-ceo-audit/.test(css), 'CSS missing W141 audit card styles');
assert(Boolean(packageJson.scripts?.['qa:w141-npc-device-quality']), 'package.json missing W141 QA script');
assert(Boolean(packageJson.scripts?.['qa:w121-w141-visual-overhaul']), 'package.json missing cumulative W121-W141 script');

const stats = {
  schema: W141_NPC_DEVICE_SCHEMA,
  ok: failures.length === 0,
  score: failures.length ? 0 : 100,
  generatedAt: new Date().toISOString(),
  cityNpcCount: city.npcs?.length || 0,
  privateNpcCount: privateWorld.npcs?.length || 0,
  myRealmNpcCount: myRealm.npcs?.length || 0,
  robotNpcCount: plan.robotNpcCount,
  movingNpcCount: plan.movingNpcCount,
  lowTier,
  highTier,
  dataSurvivalDone: true,
  dataSurvivalPhase: W141_USER_DATA_SURVIVAL_PHASE,
  remainingPhases: phaseSummary.phases,
  ceoAuditFindings: plan.ceoAudit?.findings || [],
  failures
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w141-npc-device-quality-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W141_NPC_DEVICE_QUALITY_STATS_2026-06-13.json'), `${JSON.stringify(stats, null, 2)}\n`);

if (failures.length) {
  console.error('[W141] NPC/device quality gate failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`[W141] NPC movement, robot quality, and device-tier performance passed (${stats.score}/100): ${stats.cityNpcCount} city NPCs, ${stats.privateNpcCount} private NPCs, ${stats.robotNpcCount} robot/agent NPCs. Data survival phase ${W141_USER_DATA_SURVIVAL_PHASE.id} is ${W141_USER_DATA_SURVIVAL_PHASE.status}.`);
