import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  arbitrateEonExpanseW767BLabels,
  formatEonExpanseW767BInteractionLabel,
  getEonExpanseW767BInteractionTargetId,
  getEonExpanseW767BLabelIdentity
} from '../../assets/js/city/w766/eon-expanse-w767b-guidance-director.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('W767C deduplicates authored child meshes and formats safe interaction labels', () => {
  const metadata = { kind: 'expanse-npc', action: 'meet-pathfinder', npcId: 'pathfinder-guide', npcLabel: 'Pathfinder' };
  assert.equal(getEonExpanseW767BLabelIdentity(metadata, 'mesh-a'), getEonExpanseW767BLabelIdentity(metadata, 'mesh-b'));
  assert.equal(formatEonExpanseW767BInteractionLabel(metadata), 'Pathfinder');
  assert.equal(formatEonExpanseW767BInteractionLabel({ kind: 'expanse-living-content', action: 'living-world-interaction', interactionAction: 'signal-fragment-collected' }), 'Signal Fragment Collected');
});

test('W767C separates presentation identity from canonical dispatch identity', () => {
  const rescue = { kind: 'w767a-companion-rescue', action: 'scan-dormant-eonbot', label: 'Scan dormant EONBOT', interactive: true };
  assert.equal(getEonExpanseW767BLabelIdentity(rescue), 'w767a-companion-rescue:scan-dormant-eonbot');
  assert.equal(getEonExpanseW767BInteractionTargetId(rescue), 'scan-dormant-eonbot');
  assert.equal(getEonExpanseW767BInteractionTargetId({ kind: 'expanse-npc', action: 'meet-pathfinder', npcId: 'pathfinder-guide' }), 'meet-pathfinder:pathfinder-guide');
});

test('W767C retains one distant objective and at most two visible nearby interactions', () => {
  const result = arbitrateEonExpanseW767BLabels([
    { id: 'objective', distance: 120, visible: true, inFront: true, primaryObjective: true },
    { id: 'near-a', distance: 3, visible: true, inFront: true },
    { id: 'near-b', distance: 4, visible: true, inFront: true },
    { id: 'near-c', distance: 5, visible: true, inFront: true },
    { id: 'hidden', distance: 2, visible: false },
    { id: 'occluded', distance: 1, visible: true, inFront: true, occluded: true }
  ], { maxPrimaryDistance: 180 });
  assert.deepEqual(result.selected.map((entry) => entry.id), ['objective', 'near-a', 'near-b']);
  assert.equal(result.primaryCount, 1);
  assert.equal(result.nearbyCount, 2);
});

test('W767C gateway exposes explicit proximity interaction without bypassing child authorities', async () => {
  const gateway = await read('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js');
  const frontier = await read('../../assets/js/city/w766/eon-expanse-w766b-signal-frontier.js');
  const npcs = await read('../../assets/js/city/w766/eon-expanse-w766d-npc-transit.js');
  const activities = await read('../../assets/js/city/w766/eon-expanse-w766f-activity-anchors.js');
  assert.match(gateway, /getInteractionCandidates\(position = \{\}, options = \{\}\)/);
  assert.match(gateway, /getEonExpanseW767BInteractionTargetId\(metadata, mesh\.name\)/);
  assert.match(gateway, /interactNearest\(position = \{\}, \{ maxDistance = 5\.2, explicitUserAction = false, expectedTargetId = ''/);
  assert.match(gateway, /explicit-user-action-required/);
  assert.match(gateway, /npcRuntime\?\.interact/);
  assert.match(gateway, /activityAnchors\?\.interact/);
  assert.match(gateway, /frontier\?\.interact/);
  assert.match(gateway, /Math\.hypot\(world\.x - playerX, world\.z - playerZ\)/);
  for (const source of [frontier, npcs, activities]) {
    assert.match(source, /interact\(metadata = \{\}/);
    assert.match(source, /explicit-user-action-required/);
    assert.match(source, /PointerEventTypes\.POINTERPICK/);
  }
});

test('W767C runtime supports keyboard E and occlusion-aware world labels', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  assert.match(runtime, /scene\.pickWithRay/);
  assert.match(runtime, /mesh\.isPickable === false/);
  assert.match(runtime, /maxPrimary: 1, maxNearby: 2/);
  assert.match(runtime, /expanseGateway\?\.interactNearest/);
  assert.match(runtime, /keyboardCode === 'KeyE' && event\.repeat !== true/);
  assert.doesNotMatch(runtime, /event\.key === 'e' \|\| event\.key === 'E'/);
  assert.match(runtime, /interactWithNearestExpanseTarget/);
  assert.match(runtime, /getEonExpanseW767BInteractionTargetId\(metadata, mesh\.name\)/);
  assert.match(runtime, /suppressWorldLabel: overlapsObjective/);
  assert.match(runtime, /deduped\.values\(\)\]\.filter\(\(candidate\) => candidate\.suppressWorldLabel !== true\)/);
  assert.doesNotMatch(runtime, /if \(objectiveTarget && Math\.hypot\(position\.x - objectiveTarget\.x, position\.z - objectiveTarget\.z\) < 2\.4\) continue/);
  assert.match(overlay, /record\.keyboardHint \? '\[E\] ' : ''/);
  assert.match(overlay, /Array\.from\(\{ length: 3 \}/);
});
