import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  EON_CITY_W765R7_WALL_DISPLAY_PROFILE,
  resolveEonCityW765R7WallDisplayPose,
  validateEonCityW765R7WallDisplayPose,
  validateEonCityW765R7WallDisplayContract
} from '../../assets/js/city/w765/eon-city-w765r7-wall-display-gallery.js';
import { EON_CITY_W731_STATIONS } from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';

const runtimeSource = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const wallSource = await readFile(new URL('../../assets/js/city/w765/eon-city-w765r7-wall-display-gallery.js', import.meta.url), 'utf8');
const legacyMonitorSource = await readFile(new URL('../../assets/js/city/w765/eon-city-w765r5-station-monitor.js', import.meta.url), 'utf8');
const commandWallSource = await readFile(new URL('../../assets/js/city/w750/eon-city-w750-command-centre.js', import.meta.url), 'utf8');

test('W765R7 wall displays are large, outer-ring and face the room centre', () => {
  assert.ok(EON_CITY_W765R7_WALL_DISPLAY_PROFILE.width >= 6);
  assert.ok(EON_CITY_W765R7_WALL_DISPLAY_PROFILE.height >= 3.3);
  assert.ok(EON_CITY_W765R7_WALL_DISPLAY_PROFILE.radius >= 21);
  for (const [index, station] of EON_CITY_W731_STATIONS.entries()) {
    const pose = resolveEonCityW765R7WallDisplayPose({ station, index, count: EON_CITY_W731_STATIONS.length });
    const facing = validateEonCityW765R7WallDisplayPose({ pose });
    assert.equal(pose.ok, true, station.id);
    assert.equal(facing.ok, true, station.id);
    assert.ok(Math.hypot(pose.position.x, pose.position.z) >= 21, station.id);
  }
  assert.equal(validateEonCityW765R7WallDisplayContract({ stations: EON_CITY_W731_STATIONS }).ok, true);
});

test('W765R7 uses one pixel-level upright texture authority and asymmetric calibration', () => {
  assert.match(wallSource, /texture\.update\?\.\(true\)/);
  assert.match(wallSource, /TOP LEFT/);
  assert.match(wallSource, /↑/);
  assert.match(wallSource, /calibrationPattern: true/);
  assert.doesNotMatch(wallSource, /texture\.update\?\.\(false\)/);
  assert.doesNotMatch(legacyMonitorSource, /texture\.update\?\.\(false\)/);
  assert.doesNotMatch(commandWallSource, /texture\.update\??\.?\(false\)/);
});

test('R01 preserves clickable wall-display implementation but retires the nine-screen gallery from default Hub geometry', () => {
  assert.match(runtimeSource, /createEonCityW765R7WallDisplay/);
  assert.match(runtimeSource, /parent: world\.root/);
  assert.match(runtimeSource, /wallDisplay: true/);
  assert.match(runtimeSource, /EON_CITY_R01_OUTER_WALL_GALLERY_ENABLED = false/);
  assert.match(runtimeSource, /wallGalleryStations = EON_CITY_R01_OUTER_WALL_GALLERY_ENABLED/);
  assert.doesNotMatch(runtimeSource, /primaryRole: 'outer-wall-display'/);
  assert.doesNotMatch(runtimeSource, /createEonCityW765R5StationMonitor\(/);
  assert.match(wallSource, /hit-proxy/);
  assert.match(wallSource, /visibility = 0\.001/);
  assert.match(wallSource, /stationId: station\.id/);
  assert.match(wallSource, /openSurface\(station\.id/);
});

test('W765R7 Transit capsule opens a dedicated review dialog with Board, Skip and Cancel', () => {
  assert.match(runtimeSource, /data-eon-city-transit-review/);
  assert.match(runtimeSource, /data-eon-city-transit-board/);
  assert.match(runtimeSource, /data-eon-city-transit-skip/);
  assert.match(runtimeSource, /data-eon-city-transit-cancel/);
  assert.match(runtimeSource, /openTransitReview/);
  assert.match(runtimeSource, /w754TransitController\.request/);
  assert.match(runtimeSource, /w754TransitController\.confirm/);
  assert.match(runtimeSource, /w754TransitController\.cancel/);
  assert.doesNotMatch(runtimeSource, /metadata\.transitCapsule[\s\S]{0,280}ui\?\.openMenu/);
});

test('W765R7 records raw pick and resolved interaction diagnostics', () => {
  assert.match(runtimeSource, /eonCityLastPickedMesh/);
  assert.match(runtimeSource, /eonCityLastResolvedInteraction/);
  assert.match(runtimeSource, /pickedMesh\?\.name/);
});

import {
  EON_CITY_W765R7_INTERACTION_MATRIX,
  validateEonCityW765R7InteractionMatrix
} from '../../assets/js/city/w765/eon-city-w765r7-interaction-matrix.js';

test('W765R7 interaction matrix covers every station, discovery and control restoration path', () => {
  const validation = validateEonCityW765R7InteractionMatrix();
  assert.equal(validation.ok, true, validation.errors.join(', '));
  assert.ok(validation.actionCount >= EON_CITY_W731_STATIONS.length + 8);
  for (const station of EON_CITY_W731_STATIONS) {
    const action = EON_CITY_W765R7_INTERACTION_MATRIX.find((entry) => entry.id === `station:${station.id}`);
    assert.ok(action, station.id);
    assert.equal(action.expectedOutcome, 'maintained-workspace');
    assert.equal(action.restoresControls, true);
    assert.ok(action.inputModes.includes('wall-display'));
  }
});

test('W765R7 decorative meshes cannot steal important picks', () => {
  assert.match(runtimeSource, /resolveEonCityR04MeshInteraction\(pickedMesh\)/);
  assert.match(runtimeSource, /ignored:\$\{resolved\.reason \|\| 'unresolved'\}/);
  assert.match(runtimeSource, /transitRing\.isPickable = false/);
  assert.match(runtimeSource, /transitLight\.isPickable = false/);
  assert.match(wallSource, /mesh\.isPickable = false/);
});

test('W765R7 publishes interaction matrix readiness to browser diagnostics', () => {
  assert.match(runtimeSource, /eonCityInteractionMatrix/);
  assert.match(runtimeSource, /eonCityInteractionActionCount/);
  assert.match(runtimeSource, /validateEonCityW765R7InteractionMatrix/);
});
