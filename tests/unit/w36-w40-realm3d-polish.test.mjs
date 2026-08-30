import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const voxel = read('assets/js/realm3d/engine/VoxelWorld.js');
const boot = read('assets/js/realm3d/engine/EngineBoot.js');
const css = read('assets/css/realm3d.css');
const panels = read('assets/js/realm3d/engine/WorldPanels.js');
const snapshot = read('assets/js/realm3d/engine/RealmSnapshotExport.js');
const ghost = read('assets/js/realm3d/engine/GhostInviteBroker.js');

test('W36 chunked rendering and culling polish are present', () => {
  assert.match(voxel, /CHUNK_SIZE/);
  assert.match(voxel, /voxel-chunk/);
  assert.match(voxel, /updateChunkVisibility/);
  assert.match(voxel, /filterBlocksForQuality/);
});

test('W37 premium voxel art polish is present without heavy assets', () => {
  assert.match(voxel, /buildPixelTexture/);
  assert.match(voxel, /addSkyAndAtmosphere/);
  assert.match(voxel, /addDistrictLights/);
  assert.match(voxel, /addAmbientDecor/);
  assert.match(css, /image-rendering: pixelated/);
});

test('W38 game HUD and mobile polish are present', () => {
  assert.match(boot, /data-realm3d-compass/);
  assert.match(boot, /data-realm3d-world/);
  assert.match(css, /realm3d-crosshair/);
  assert.match(css, /realm3d-minimap::after/);
});

test('W39 ghost invite proof remains invite-only and secret-safe', () => {
  assert.match(ghost, /RTCPeerConnection/);
  assert.match(ghost, /sanitizeGhostState/);
  assert.doesNotMatch(ghost, /localStorage\.getItem\(['"]api/i);
  assert.match(panels, /No server, no public lobby, no chat, no secrets/);
});

test('W40 Arweave snapshot export is proof-only and downloadable', () => {
  assert.match(snapshot, /buildRealmSnapshotArtifact/);
  assert.match(snapshot, /uploadReady: false/);
  assert.match(snapshot, /visualCardSvg/);
  assert.match(panels, /data-download-snapshot/);
});
