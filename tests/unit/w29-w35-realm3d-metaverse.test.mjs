import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  BLOCKS,
  getRealm3dArweaveExportPolicy,
  getRealm3dGhostPresencePolicy,
  getRealm3dMetaverseModules,
  getRealm3dWorldPanels,
  REALM3D_METAVERSE_SCHEMA
} from '../../assets/js/realm3d/engine/BlockPalette.js';
import {
  buildEonCityVoxelWorld,
  buildMyRealm3dSeed,
  buildMyRealmVoxelWorld,
  buildPrivateWorkstationVoxelWorld,
  buildRealmSnapshotEnvelope
} from '../../assets/js/realm3d/engine/EonCityMap.js';

const read = (file) => fs.readFileSync(file, 'utf8');

test('W29 expands city districts, block palette, towers, and metaverse modules', () => {
  assert.equal(REALM3D_METAVERSE_SCHEMA, 'eon.realm3d.metaverse.v35.threejs.voxel.v1');
  ['cityStone', 'neonEdge', 'skyBridge', 'holoBlue', 'holoPurple', 'arweaveGold'].forEach((id) => assert.ok(BLOCKS[id], `missing block ${id}`));
  const city = buildEonCityVoxelWorld();
  assert.equal(city.schema, 'eon.realm3d.city-map.v35');
  assert.ok(city.blocks.length > 2500, 'city should be materially larger than W28 MVP');
  assert.ok(city.blocks.some((block) => block.type === 'skyBridge'));
  assert.ok(city.blocks.some((block) => block.type === 'arweaveGold'));
  assert.ok(getRealm3dMetaverseModules().some((module) => module.id === 'eon-city'));
});

test('W30 private workstation is a real 3D room with app terminals', () => {
  const room = buildPrivateWorkstationVoxelWorld({ owner: 'tester' });
  assert.equal(room.kind, 'private-workstation');
  assert.ok(room.blocks.length > 500);
  ['AI Desk', 'Vault Safe', 'Trade Monitor', 'Builder Board', 'Referral Console', 'Provider Health', 'Backup Terminal'].forEach((label) => {
    assert.ok(room.blocks.some((block) => block.sign === label), `missing ${label}`);
  });
  assert.ok(room.npcs.every((npc) => /local\/private|Never show API keys/i.test(npc.script)));
});

test('W31 My Realm generator creates a separate safe voxel world, not only a seed card', () => {
  const seed = buildMyRealm3dSeed({ username: 'manisha', seed: 'eon' });
  const world = buildMyRealmVoxelWorld({ username: 'manisha', seed: 'eon' });
  assert.equal(seed.safeTemplatesOnly, true);
  assert.equal(world.kind, 'my-realm');
  assert.ok(world.blocks.length > 700);
  assert.ok(world.portals.some((portal) => portal.id === 'my-realm-exit'));
  assert.ok(world.districts.some((district) => district.id === 'realm-market'));
  assert.equal(world.seedEnvelope.noUploads, true);
  assert.equal(world.seedEnvelope.noPublicChat, true);
  assert.equal(world.seedEnvelope.noArbitraryHtml, true);
});

test('W32 portal/NPC polish supports dynamic world maps and richer panels', () => {
  const portals = read('assets/js/realm3d/engine/PortalSystem.js');
  const panels = read('assets/js/realm3d/engine/WorldPanels.js');
  const boot = read('assets/js/realm3d/engine/EngineBoot.js');
  assert.match(portals, /setWorldMap/);
  assert.match(portals, /onWorldSwitch/);
  assert.match(panels, /openNpc/);
  assert.match(panels, /renderMetaverseModules/);
  assert.match(boot, /switchWorld\('private-workstation'\)/);
  assert.match(boot, /switchWorld\('my-realm'\)/);
  const panelIds = new Set(getRealm3dWorldPanels().map((panel) => panel.id));
  assert.ok(panelIds.has('ghost-invite'));
  assert.ok(panelIds.has('snapshot-export'));
});

test('W33 mobile/PWA QA script covers real game controls and fallback', () => {
  const script = read('scripts/realm3d-metaverse-qa.mjs');
  const pkg = JSON.parse(read('package.json'));
  const css = read('assets/css/realm3d.css');
  assert.equal(pkg.scripts['qa:realm3d-metaverse'], 'node scripts/realm3d-metaverse-qa.mjs');
  assert.match(script, /W33 mobile controls/);
  assert.match(css, /pointer: coarse/);
  assert.match(css, /orientation: landscape/);
  assert.match(css, /max-width: 520px/);
});

test('W34 ghost presence prototype is invite-only and cannot sync secrets', () => {
  const policy = getRealm3dGhostPresencePolicy();
  assert.equal(policy.enabledByDefault, false);
  assert.equal(policy.inviteOnly, true);
  assert.equal(policy.noPublicChat, true);
  assert.equal(policy.noUploads, true);
  assert.equal(policy.noSecretState, true);
  assert.ok(policy.syncFields.includes('position'));
  assert.ok(!policy.syncFields.includes('apiKeys'));
});

test('W35 Arweave snapshot/export is safe manifest only until proof rails exist', () => {
  const policy = getRealm3dArweaveExportPolicy();
  const envelope = buildRealmSnapshotEnvelope({ owner: 'tester', world: buildMyRealmVoxelWorld({ username: 'tester' }) });
  assert.equal(policy.uploadEnabledByDefault, false);
  assert.equal(policy.requiresUserReview, true);
  assert.ok(policy.excludes.includes('apiKeys'));
  assert.ok(policy.excludes.includes('vaultSecrets'));
  assert.equal(envelope.schema, 'eon.realm3d.snapshot-envelope.v1');
  assert.equal(envelope.world.kind, 'my-realm');
  assert.ok(envelope.world.blockCount > 700);
  assert.ok(!JSON.stringify(envelope).includes('privateKey'));
});
