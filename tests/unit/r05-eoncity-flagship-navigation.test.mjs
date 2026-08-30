import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const accessibility = fs.readFileSync(new URL('../../assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../../assets/css/eon-city-play.css', import.meta.url), 'utf8');

test('R05 permanent runtime HUD is Explore and Menu, leaving shell-owned Exit City intact', () => {
  assert.match(runtime, /makeLauncher\('Explore', 'eonCityExploreOpen'/);
  assert.match(runtime, /makeLauncher\('Menu', 'eonCityMenuOpen'/);
  assert.match(runtime, /actions\?\.prepend\(exploreLauncher, menuLauncher, eonbotLauncher\)/);
  assert.doesNotMatch(runtime, /makeLauncher\('Nexus', 'eonCityNexusOpen'/);
  assert.doesNotMatch(runtime, /makeLauncher\('Live Monitors', 'eonCityMonitorsOpen'/);
  assert.doesNotMatch(runtime, /makeLauncher\('Share', 'eonCityShareOpen'/);
});

test('R05 menu makes Open Worlds primary and operations secondary', () => {
  assert.match(runtime, /aria-label="EON Open Worlds"/);
  assert.match(runtime, />Signal Frontier</);
  assert.match(runtime, />Storm Sector</);
  assert.match(runtime, />My Frontier</);
  assert.match(runtime, /aria-label="Command Hub operations"/);
  assert.match(runtime, /data-eon-city-quick="accessible-map"/);
  assert.match(runtime, /menu\.dataset\.eonCityMenuMode = 'explore'/);
  assert.match(css, /data-eon-city-menu-mode="explore"/);
});

test('R05 accessible map remains available but no longer occupies permanent HUD space', () => {
  assert.match(accessibility, /showLauncher = true/);
  assert.match(runtime, /showLauncher: false/);
  assert.match(runtime, /onOpenAccessibleMap/);
});

test('RT90 Storm direct-review copy remains progression-safe and independently accessible', () => {
  assert.match(runtime, /Atmospheric world · available for direct review/);
  assert.match(runtime, /Direct review grants no certification, XP or progression/);
  assert.match(runtime, /data-eon-city-world-status="available"/);
  assert.doesNotMatch(runtime, /Availability is tied only to its own certified build—not Signal completion/);
});
