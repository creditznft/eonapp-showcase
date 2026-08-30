import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const map = fs.readFileSync('assets/js/realm3d/engine/EonCityMap.js', 'utf8');
const panels = fs.readFileSync('assets/js/realm3d/engine/WorldPanels.js', 'utf8');
const world = fs.readFileSync('assets/js/realm3d/engine/VoxelWorld.js', 'utf8');
const blueprint = fs.readFileSync('assets/js/realm3d/engine/EonCityMegaBlueprint.js', 'utf8');

test('private workstation and generated realms expose positioned app screens', () => {
  assert.match(map, /buildWorkstationScreens/);
  assert.match(map, /workstationScreens: buildWorkstationScreens\(0, 0\)/);
  assert.match(map, /workstationScreens: buildWorkstationScreens\(0, -12\)\.slice\(0, 6\)/);
  assert.match(map, /mode: 'safe-panel-proxy'/);
});

test('workstation screens render as safe app panels with only one sandboxed same-origin code preview', () => {
  assert.match(panels, /openWorkstationScreen/);
  assert.match(panels, /full-screen app workspace/);
  assert.match(panels, /No API keys, seed phrases, or private wallet secrets/);
  const iframeTags = panels.match(/<iframe[^>]+>/gi) || [];
  assert.equal(iframeTags.length, 1);
  assert.match(iframeTags[0], /src="\/realm-code-preview\.html"/i);
  assert.match(iframeTags[0], /sandbox="allow-scripts"/i);
  assert.doesNotMatch(iframeTags[0], /allow-same-origin|https?:\/\//i);
});

test('EONBot companion is represented in world and follows player', () => {
  assert.match(world, /addEonBotCompanion/);
  assert.match(world, /eonbot-companion/);
  assert.match(world, /bot\.position\.lerp/);
  assert.match(blueprint, /follow-player/);
  assert.match(blueprint, /never-read-secrets-aloud/);
});

test('screen previews communicate ad/social/NFT economy rules safely', () => {
  assert.match(panels, /One ad\/share unlocks temporary access only/);
  assert.match(panels, /No IP, country, UID, or fingerprint storage/);
  assert.match(panels, /No X OAuth, scraping, or fake engagement metrics/);
});
