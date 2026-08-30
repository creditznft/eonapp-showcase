import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('L95 City welcome has an immediate 48px dismiss path and direct Worlds/Menu/EONBOT choices', async () => {
  const source = await read('assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js');
  const css = await read('assets/css/eon-city-play.css');
  assert.match(source, /aria-label="Dismiss EON City welcome"/);
  assert.match(source, /data-eon-city-w756-worlds>Explore Worlds/);
  assert.match(source, /data-eon-city-w756-menu>Open Menu/);
  assert.match(source, /data-eon-city-w756-wake>EONBOT Nexus/);
  assert.match(source, /onOpenWorlds\(event\.target\)/);
  assert.doesNotMatch(source, /data-eon-city-w756-dismiss>Not now/);
  assert.match(css, /data-eon-city-w756-dismiss[^}]*min-width:48px/is);
  assert.match(css, /data-eon-city-w756-dismiss[^}]*min-height:48px/is);
});

test('L95 City welcome relinquishes the playfield on first movement or interaction intent', async () => {
  const source = await read('assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js');
  assert.match(source, /gameplayIntentKeys/);
  assert.match(source, /data-eon-city-move/);
  assert.match(source, /data-eon-city-sprint-toggle/);
  assert.match(source, /data-eon-city-command-open/);
  assert.match(source, /dismissOnboarding\(\)/);
  assert.match(source, /root\.addEventListener\('click', onGameplayIntent\)/);
});

test('L95 phone welcome uses the shared HUD safe zone instead of occupying the control/composer edge', async () => {
  const css = await read('assets/css/eon-city-play.css');
  assert.match(css, /eon-city-w756-onboarding[\s\S]*--eon-city-l95-contextual-bottom/);
  assert.match(css, /max-height:min\(13rem,36dvh\)/);
});
