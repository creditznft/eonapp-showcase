import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const files = {
  palette: read('assets/js/realm3d/engine/BlockPalette.js'),
  map: read('assets/js/realm3d/engine/EonCityMap.js'),
  voxel: read('assets/js/realm3d/engine/VoxelWorld.js'),
  boot: read('assets/js/realm3d/engine/EngineBoot.js'),
  panels: read('assets/js/realm3d/engine/WorldPanels.js'),
  director: read('assets/js/realm3d/engine/RealmExperienceDirector.js'),
  player: read('assets/js/realm3d/engine/PlayerController.js'),
  css: read('assets/css/realm3d.css')
};
const checks = [];
const check = (name, pass) => checks.push({ name, pass: Boolean(pass) });

check('final polish schema and acceptance readiness exist', /REALM3D_POLISH_SCHEMA/.test(files.palette) && /METAVERSE_READINESS/.test(files.palette));
check('premium block palette has final polish blocks', /spawnGlass/.test(files.palette) && /photoPad/.test(files.palette) && /energyLine/.test(files.palette) && /beaconWhite/.test(files.palette));
check('EON City has spawn monument, portal boulevard, and district interior kits', /addSpawnMonument/.test(files.map) && /addPortalBoulevard/.test(files.map) && /addDistrictInteriorKit/.test(files.map));
check('Private workstation is segmented and upgraded', /Command Table/.test(files.map) && /workstation\.v2/.test(files.map) && /glassCyan/.test(files.map));
check('My Realm generator has names, layouts, photo pad, and expanded safe modules', /realmName/.test(files.map) && /layout/.test(files.map) && /photo-pad/.test(files.map) && /portal-court/.test(files.map));
check('Guided tour director and route hint are wired into engine', /RealmExperienceDirector/.test(files.director) && /data-realm3d-tour/.test(files.boot) && /data-realm3d-route/.test(files.boot));
check('Tour markers and portal labels render in the 3D world', /addGuidedTourMarkers/.test(files.voxel) && /TOUR ·/.test(files.voxel) && /portal.label/.test(files.voxel));
check('Photo mode and guided tour terminal panels exist', /renderGuidedTour/.test(files.panels) && /renderPhotoMode/.test(files.panels) && /renderCityMap/.test(files.panels));
check('Player teleport support exists for tour navigation', /teleportTo/.test(files.player));
check('Final polish CSS badges and mobile rules exist', /SAFE METAVERSE/.test(files.css) && /realm3d-tour-list/.test(files.css));

for (const item of checks) console.log(`${item.pass ? '✅' : '❌'} ${item.name}`);
const failed = checks.filter((item) => !item.pass);
if (failed.length) {
  console.error(`\nRealm3D final polish QA failed: ${failed.length}/${checks.length}`);
  process.exit(1);
}
console.log(`\nRealm3D final polish QA passed: ${checks.length}/${checks.length}`);
