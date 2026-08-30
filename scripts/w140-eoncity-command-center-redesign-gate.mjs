#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { buildPrivateWorkstationVoxelWorld, buildEonCityVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import {
  W140_COMMAND_CENTER_SCHEMA,
  W140_PROTECTED_USER_STORAGE_KEYS,
  buildW140CommandCenterLayer,
  buildW140CommandCenterPlan,
  scoreW140CommandCenterPlan
} from '../assets/js/realm3d/engine/EonCityW140CommandCenterRuntime.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

const packageJson = JSON.parse(read('package.json'));
const plan = buildW140CommandCenterPlan({ quality: 'standard', worldKind: 'private-workstation', owner: 'gate' });
const score = scoreW140CommandCenterPlan(plan);
const privateWorld = buildPrivateWorkstationVoxelWorld({ owner: 'gate' });
const cityWorld = buildEonCityVoxelWorld();
const layer = buildW140CommandCenterLayer({ quality: 'low', plan });
const engine = read('assets/js/realm3d/engine/EngineBoot.js');
const flagship = read('assets/js/realm3d/engine/EonCityFlagshipScene.js');
const panels = read('assets/js/realm3d/engine/WorldPanels.js');
const css = read('assets/css/realm3d.css');
const mapJs = read('assets/js/realm3d/engine/EonCityMap.js');

assert(plan.schema === W140_COMMAND_CENTER_SCHEMA, 'W140 plan schema missing');
assert(score.ok === true && score.score === 100, 'W140 command center score is not 100');
assert((plan.zones || []).length >= 6, 'W140 command center missing zones');
assert((plan.appDeck || []).length >= 10, 'W140 command center app wall missing launcher apps');
assert((plan.quickActions || []).length >= 6, 'W140 command center missing quick actions');
assert(plan.layoutPolicy?.minimumTapTargetPx >= 48, 'W140 mobile tap target is below 48px');
assert(plan.privacyPolicy?.noApiKeysRendered === true, 'W140 does not explicitly redact API keys');
assert(plan.storageSafety?.backupPhaseSeparated === true, 'W140 did not separate Cloudflare update persistence phase');
assert(W140_PROTECTED_USER_STORAGE_KEYS.includes('eon:api-key-vault:v1'), 'W140 protected keys missing encrypted API-key vault');
assert(W140_PROTECTED_USER_STORAGE_KEYS.includes('eon:nft-collection:v3'), 'W140 protected keys missing v3 NFT collection');
assert(W140_PROTECTED_USER_STORAGE_KEYS.includes('eon:market:starter-vault-receipts:v1'), 'W140 protected keys missing Market starter receipt storage');
assert(privateWorld.w140CommandCenterPlan?.schema === W140_COMMAND_CENTER_SCHEMA, 'private workstation world missing W140 plan');
assert(privateWorld.w140CommandCenterScore?.score === 100, 'private workstation W140 score is not 100');
assert(cityWorld.w140CommandCenterScore?.score === 100, 'city world W140 route/entry plan is not 100');
assert(layer.stats?.appMonitorCount >= 10, 'W140 3D layer missing app monitors');
assert(layer.stats?.zoneCount >= 6, 'W140 3D layer missing zone pods');
assert(layer.stats?.protectedUserStorageKeys >= 10, 'W140 3D stats missing protected storage count');
assert(layer.stats?.everyVisualClusterHasUseTarget === true, 'W140 3D visuals are not all use targets');
assert(/realmCommandCenterSession\s*=\s*'w140'/.test(engine), 'EngineBoot missing W140 dataset');
assert(/openW140CommandCenter/.test(engine), 'EngineBoot missing W140 command center method');
assert(/data-realm3d-command-center/.test(engine), 'EngineBoot missing W140 command center buttons');
assert(/buildW140CommandCenterLayer/.test(flagship), 'Flagship scene missing W140 layer');
assert(/updateW140CommandCenter/.test(flagship), 'Flagship scene missing W140 animation update');
assert(/w140CommandCenter/.test(flagship), 'Flagship scene missing W140 stats');
assert(/renderW140CommandCenter/.test(panels), 'WorldPanels missing W140 command center card');
assert(/data-w140-command-center="true"/.test(panels), 'WorldPanels missing W140 proof marker');
assert(/Protected storage keys/.test(panels), 'WorldPanels missing protected storage proof text');
assert(/W140 EON City command-center redesign/.test(css), 'CSS missing W140 marker');
assert(/\.realm3d-w140-zone-grid/.test(css), 'CSS missing W140 zone grid');
assert(/min-height:\s*48px/.test(css), 'CSS missing W140 mobile tap targets');
assert(/buildW140CommandCenterPlan/.test(mapJs) && /w140CommandCenterScore/.test(mapJs), 'EonCityMap missing W140 plan/score wiring');
assert(Boolean(packageJson.scripts?.['qa:w140-eoncity-command-center-redesign']), 'package.json missing W140 QA script');
assert(Boolean(packageJson.scripts?.['qa:w121-w140-visual-overhaul']), 'package.json missing cumulative W121-W140 script');

const stats = {
  schema: W140_COMMAND_CENTER_SCHEMA,
  ok: failures.length === 0,
  score: failures.length ? Math.max(0, Math.round(((28 - failures.length) / 28) * 100)) : 100,
  generatedAt: new Date().toISOString(),
  zoneCount: plan.zones?.length || 0,
  appMonitorCount: plan.appDeck?.length || 0,
  quickActionCount: plan.quickActions?.length || 0,
  protectedUserStorageKeys: W140_PROTECTED_USER_STORAGE_KEYS.length,
  privateWorldScore: privateWorld.w140CommandCenterScore?.score || 0,
  layerStats: layer.stats,
  futureDataSurvivalPhaseSeparated: true,
  failures
};
fs.mkdirSync(path.join(root, 'tmp'), { recursive: true });
fs.writeFileSync(path.join(root, 'tmp', 'w140-eoncity-command-center-redesign-stats.json'), `${JSON.stringify(stats, null, 2)}\n`);

if (failures.length) {
  console.error('[W140] EON City command-center redesign gate failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`[W140] EON City command-center redesign passed (${stats.score}/100): ${stats.zoneCount} zones, ${stats.appMonitorCount} app monitors, ${stats.protectedUserStorageKeys} protected keys.`);
