import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRealmCameraState,
  nudgeRealmCamera,
  buildRealmParallaxLayers,
  buildRealmPortalNodes,
  buildRealmGhostAvatars,
  buildRealmMinimapModel,
  getRealmWebXRSupportInfo,
  createPortalTransitionState
} from '../../assets/js/utils/realmworld-renderer.js';
import { buildRealmWorldSnapshot } from '../../assets/js/utils/realmworld-generator.js';

test('RealmWorld renderer camera clamps and nudges safely', () => {
  const camera = createRealmCameraState({ x: 200, y: -50, zoom: 9, rotation: 99, pitch: 1, mode: '3d' });
  assert.equal(camera.x, 100);
  assert.equal(camera.y, 0);
  assert.equal(camera.zoom, 1.85);
  assert.equal(camera.rotation, 18);
  assert.equal(camera.pitch, 36);
  assert.equal(camera.mode, '3d');
  const nudged = nudgeRealmCamera(camera, { x: -30, y: 25, zoom: -0.5, mode: 'canvas' });
  assert.equal(nudged.mode, 'canvas');
  assert.ok(nudged.x < camera.x);
  assert.ok(nudged.zoom < camera.zoom);
});

test('RealmWorld renderer creates phase objects without server dependencies', () => {
  const snapshot = buildRealmWorldSnapshot({ username: 'phase realm' }, { presenceMode: 'public-listed', now: '2026-06-02T00:00:00.000Z' });
  const layers = buildRealmParallaxLayers(snapshot);
  const portals = buildRealmPortalNodes(snapshot);
  const ghosts = buildRealmGhostAvatars(snapshot);
  const minimap = buildRealmMinimapModel(snapshot);
  assert.ok(layers.length >= 3);
  assert.equal(portals.length, 4);
  assert.ok(ghosts.length <= 4);
  assert.ok(minimap.points.some((point) => point.kind === 'portal'));
  assert.equal(snapshot.renderer.cloudflareWorkerRequired, false);
  assert.equal(snapshot.renderer.centralGameServerRequired, false);
});

test('RealmWorld optional WebXR stays optional and portal transitions stay local', () => {
  const xr = getRealmWebXRSupportInfo({ navigator: {}, isSecureContext: false, document: {} });
  assert.equal(xr.apiPresent, false);
  assert.match(xr.note, /optional/);
  const transition = createPortalTransitionState({ id: 'portal-chat', label: 'EONBOT Chat', href: '/chat.html' }, '2026-06-02T12:00:00.000Z');
  assert.equal(transition.requiresCloudflareWorker, false);
  assert.equal(transition.serverGameState, false);
  assert.equal(transition.href, '/chat.html');
});
