#!/usr/bin/env node
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const checks = [];
function check(name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail });
}

const files = {
  block: read('assets/js/realm3d/engine/BlockPalette.js'),
  map: read('assets/js/realm3d/engine/EonCityMap.js'),
  boot: read('assets/js/realm3d/engine/EngineBoot.js'),
  world: read('assets/js/realm3d/engine/VoxelWorld.js'),
  portals: read('assets/js/realm3d/engine/PortalSystem.js'),
  panels: read('assets/js/realm3d/engine/WorldPanels.js'),
  css: read('assets/css/realm3d.css'),
  realm: read('realm.html')
};

check('real Three.js engine still present', /WebGLRenderer/.test(files.boot) && /InstancedMesh/.test(files.world));
check('W29 expanded block palette present', /cityStone/.test(files.block) && /skyBridge/.test(files.block) && /myRealmCrystal/.test(files.block));
check('W30 private workstation world builder present', /buildPrivateWorkstationVoxelWorld/.test(files.map) && /AI Desk/.test(files.map));
check('W31 My Realm full voxel world builder present', /buildMyRealmVoxelWorld/.test(files.map) && /Product Shelves/.test(files.map));
check('W32 dynamic portal/NPC world switching present', /setWorldMap/.test(files.portals) && /onWorldSwitch/.test(files.portals));
check('W33 mobile controls and responsive QA styles present', /realm3d-mobile-controls/.test(files.css) && /orientation: landscape/.test(files.css));
check('W34 ghost invite policy is gated', /GHOST_PRESENCE_POLICY/.test(files.block) && /enabledByDefault: false/.test(files.block));
check('W35 Arweave export policy excludes secrets', /ARWEAVE_REALM_EXPORT_POLICY/.test(files.block) && /vaultSecrets/.test(files.block) && /requiresUserReview: true/.test(files.block));
check('public Realm remains real 3D first', /data-eon-city-3d-root/.test(files.realm) && !/Ghost 3D/.test(files.realm.slice(0, 4000)));

const failed = checks.filter((item) => !item.pass);
console.log('\nEON Realm3D Metaverse QA');
for (const item of checks) console.log(`${item.pass ? '✅' : '❌'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
console.log(`\n${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length) process.exit(1);
