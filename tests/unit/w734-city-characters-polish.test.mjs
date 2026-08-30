import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EON_CITY_W731_STATIONS } from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import {
  EON_CITY_W731_LAUNCH_ASSET_MANIFEST,
  EON_CITY_W741_CHARACTER_REPLACEMENTS
} from '../../assets/js/city/w731/eon-city-w731-launch-asset-manifest.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W734 gives every visible station character a name, role, greeting and useful action', () => {
  for (const station of EON_CITY_W731_STATIONS) {
    assert.ok(station.npc.name);
    assert.ok(station.npc.role);
    assert.ok(station.npc.greeting);
    assert.ok(station.npc.action);
  }
  assert.equal(new Set(EON_CITY_W731_STATIONS.map((station) => station.npc.name)).size, 10);
});

test('W734 prioritizes Pathfinder and EONBOT with bounded quality-aware role loading', () => {
  assert.deepEqual(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.coreLazy.map((entry) => entry.alias), ['player-primary', 'eonbot']);
  assert.deepEqual(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.roleCharacters.map((entry) => entry.alias), [
    'device-lab-specialist', 'archive-guide', 'vault-steward', 'citizen-variant', 'security-sentinel',
    'holo-operator', 'forge-worker', 'creator-host', 'trade-steward'
  ]);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.budgets.lite.roleCharacters, 3);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.budgets.balanced.roleCharacters, 9);
  assert.equal(EON_CITY_W731_LAUNCH_ASSET_MANIFEST.budgets.cinematic.roleCharacters, 9);
});


test('W744 excludes the owner-rejected Command Status Architect from the launch cast', () => {
  assert.deepEqual(EON_CITY_W741_CHARACTER_REPLACEMENTS, [
    {
      stationId: 'command-console',
      rejectedAlias: 'architect',
      replacementAlias: 'security-sentinel',
      reason: 'owner-observed coat deformation at the Command Status station',
      scope: 'launch-role-only'
    }
  ]);
  const aliases = EON_CITY_W731_LAUNCH_ASSET_MANIFEST.roleCharacters.map((entry) => entry.alias);
  assert.equal(aliases.includes('architect'), false);
  assert.equal(aliases.includes('security-sentinel'), true);
  assert.equal(aliases.includes('holo-operator'), true, 'the stable Holo Operator remains assigned to Automation Theatre');
});

test('W745 EONBOT uses bounded public curiosity while NPCs never imply fake execution', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /createEonCityW745HeroPresentationDirector/);
  assert.match(runtime, /return-formation/);
  assert.match(runtime, /maxScoutDistanceFromPlayer/);
  assert.match(runtime, /EON_CITY_W731_EONBOT_DOCK/);
  assert.match(runtime, /fakeWork: false/);
  assert.match(runtime, /real-task-state-only/);
  assert.match(runtime, /const interactionAnimation = interactionPart === 'terminal' \? 'interact' : 'talk'/);
  assert.match(runtime, /loadedNpc[\s\S]*?playStationary\?\.\(interactionAnimation/);
});

test('W734 updates public City copy to the bounded Command Hub truth', () => {
  const html = read('eoncity.html');
  const access = read('assets/js/city/eon-city-access-station.js');
  assert.match(html, /EON City Command Hub/);
  assert.doesNotMatch(html, /streamed Expanse|six curated Realms|Living Nexus/);
  assert.match(access, /EON City · Command Hub/);
  assert.match(access, /Choose a station or open City Menu/);
  assert.doesNotMatch(access, /data-eon-city-district-actions|data-eon-city-open-menu/);
});
