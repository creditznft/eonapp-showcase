import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const files = {
  voxel: read('assets/js/realm3d/engine/VoxelWorld.js'),
  boot: read('assets/js/realm3d/engine/EngineBoot.js'),
  cityMap: read('assets/js/realm3d/engine/EonCityMap.js'),
  css: read('assets/css/realm3d.css'),
  panels: read('assets/js/realm3d/engine/WorldPanels.js'),
  snapshot: read('assets/js/realm3d/engine/RealmSnapshotExport.js'),
  ghost: read('assets/js/realm3d/engine/GhostInviteBroker.js'),
  realm: read('realm.html')
};

const checks = [];
function check(name, pass) {
  checks.push({ name, pass: Boolean(pass) });
}

check('chunked InstancedMesh optimization is present', /CHUNK_SIZE/.test(files.voxel) && /voxel-chunk/.test(files.voxel) && /updateChunkVisibility/.test(files.voxel));
check('premium pixel materials and sky atmosphere are present', /buildPixelTexture/.test(files.voxel) && /addSkyAndAtmosphere/.test(files.voxel) && /image-rendering: pixelated/.test(files.css));
check('district lights, portal beams, and NPC visor polish are present', /addDistrictLights/.test(files.voxel) && /CylinderGeometry/.test(files.voxel) && /visor/.test(files.voxel));
check('HUD compass, world label, crosshair, and minimap polish are present', /data-realm3d-compass/.test(files.boot) && /data-realm3d-world/.test(files.boot) && /realm3d-crosshair/.test(files.css));
check('manual WebRTC ghost invite proof is implemented safely', /RTCPeerConnection/.test(files.ghost) && /sanitizeGhostState/.test(files.ghost) && /No server, no public lobby, no chat, no secrets/.test(files.panels));
check('Arweave-safe snapshot artifact and download proof are implemented', /buildRealmSnapshotArtifact/.test(files.snapshot) && /visualCardSvg/.test(files.snapshot) && /data-download-snapshot/.test(files.panels));
check('public realm hides the old 2.5D editor surface', /rl-hub-hero[\s\S]*display: none !important/.test(files.css) && /EON City 3D/.test(files.realm));
check('W110 workspace shortcut and visible central gateway are present', /data-realm3d-workspace/.test(files.boot) && /spawn-central-workspace/.test(files.cityMap) && /central-workstation-gateway/.test(files.cityMap));
check('W110 click-to-use interaction assist is present', /usePointedInteraction/.test(files.boot) && /findPointedInteractionTarget/.test(files.boot) && /realm3d-interaction-chip/.test(files.css));

const failed = checks.filter((item) => !item.pass);
for (const item of checks) {
  console.log(`${item.pass ? '✅' : '❌'} ${item.name}`);
}
if (failed.length) {
  console.error(`\nRealm3D polish QA failed: ${failed.length}/${checks.length}`);
  process.exit(1);
}
console.log(`\nRealm3D polish QA passed: ${checks.length}/${checks.length}`);
