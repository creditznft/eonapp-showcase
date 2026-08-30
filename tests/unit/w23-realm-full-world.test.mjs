import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  buildEonCityState,
  buildMyRealmV2,
  buildPrivateWorkstationRoom,
  getEonCityDistricts,
  getEonCityNpcs,
  getEonCityPortals,
  getEonCityWorkstationModules,
  getEonCityWorldPanels,
  getMyRealmV2Biomes,
  getSafeRealmTemplates,
  renderMyRealmV2Html,
  renderPrivateWorkstationHtml,
  validateRealmV23Safety
} from '../../assets/js/utils/realm-voxel-engine.js';

const read = (path) => fs.readFileSync(path, 'utf8');

test('Realm is the public hub and RealmWorld stays engine/developer route', () => {
  const html = read('realm.html');
  assert.match(html, /Enter EON City/);
  assert.match(html, /EON City World/);
  assert.match(html, /rl-city-world-stage/);
  assert.match(html, /realm-private-workstation/);
  assert.match(html, /realm-my-realm-v2/);
  assert.doesNotMatch(html, /Open RealmWorld/);
});

test('W23B voxel city exposes launch districts and a 2D fallback-friendly map', () => {
  const districts = getEonCityDistricts();
  const labels = new Set(districts.map((district) => district.label));
  assert.ok(labels.has('Spawn Plaza'));
  assert.ok(labels.has('Vault Tower'));
  assert.ok(labels.has('AI Tower'));
  assert.ok(labels.has('Market Arcade'));
  assert.ok(labels.has('EON Team Store'));
  assert.ok(labels.has('Referral Beacon'));
  assert.ok(labels.has('Trade Dome'));
  assert.ok(labels.has('Workbench Lab'));
  assert.ok(labels.has('Portal Hall'));
  assert.ok(districts.every((district) => district.route && district.panel));
});

test('W23C scripted NPCs and portals avoid public chat while opening app surfaces', () => {
  const npcs = getEonCityNpcs();
  const portals = getEonCityPortals();
  assert.ok(npcs.length >= 6);
  assert.ok(portals.length >= 7);
  assert.ok(npcs.every((npc) => npc.script && !/free-form public chat/i.test(npc.script)));
  assert.ok(portals.some((portal) => portal.panel === 'workspace'));
  assert.ok(portals.some((portal) => portal.panel === 'my-realm'));
  assert.ok(portals.every((portal) => !/^https?:\/\//.test(portal.href)));
});

test('W23D private workstation remains device-local and hides sensitive state', () => {
  const room = buildPrivateWorkstationRoom({ username: 'tester', displayName: 'Tester' });
  assert.equal(room.visibility, 'private-device-only');
  assert.equal(room.privacy.visitorAccess, false);
  assert.equal(room.privacy.apiKeysRenderedInPublic, false);
  assert.equal(room.privacy.vaultStateRenderedInPublic, false);
  assert.equal(room.network.requiresCloudflareWorker, false);
  assert.ok(getEonCityWorkstationModules().some((module) => module.id === 'provider-health-console'));
  assert.match(renderPrivateWorkstationHtml({ username: 'tester' }), /Provider Health Console/);
});

test('W23E My Realm generator V2 is deterministic and template-safe', () => {
  const first = buildMyRealmV2({ username: 'tester' }, { seed: 'seed-one' });
  const second = buildMyRealmV2({ username: 'tester' }, { seed: 'seed-one' });
  assert.deepEqual(first, second);
  assert.ok(getMyRealmV2Biomes().length >= 4);
  assert.ok(getSafeRealmTemplates().length >= 6);
  assert.equal(first.safety.noUserUploads, true);
  assert.equal(first.safety.noArbitraryHtml, true);
  assert.equal(first.safety.noPublicChat, true);
  assert.match(renderMyRealmV2Html({ username: 'tester' }, { seed: 'seed-one' }), /No arbitrary uploads/);
});

test('W23F app surfaces are panels, not unsafe iframes', () => {
  const panels = getEonCityWorldPanels();
  const ids = new Set(panels.map((panel) => panel.id));
  ['ai', 'vault', 'market', 'store', 'referral', 'trade', 'workbench', 'workspace', 'my-realm'].forEach((id) => {
    assert.ok(ids.has(id), `missing panel ${id}`);
  });
  const html = read('realm.html');
  assert.doesNotMatch(html, /<iframe/i);
});

test('W23G safety and mobile fallback rails pass', () => {
  const state = buildEonCityState({ username: 'mobile-user' });
  const safety = validateRealmV23Safety(state);
  const css = read('assets/css/realm.css');
  assert.equal(safety.ok, true);
  assert.equal(state.controls.landscapeRecommended, true);
  assert.match(css, /orientation: landscape/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /rl-city-world-controls/);
});
