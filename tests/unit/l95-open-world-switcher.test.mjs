import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const runtime = await readFile(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../../assets/css/eon-city-play.css', import.meta.url), 'utf8');

test('L95 Expanse keeps a one-tap Worlds launcher beside persistent EONBOT', () => {
  assert.match(runtime, /exploreLauncher\.textContent = expanseActive \? 'Worlds' : 'Explore'/);
  assert.match(runtime, /menuLauncher\.hidden = expanseActive/);
  assert.match(runtime, /eonbotLauncher\.hidden = false/);
  assert.match(css, /data-eon-city-presentation-mode="expanse"[^\n]*data-eon-city-explore-open[^\n]*display:inline-flex!important/);
});

test('L95 world switcher can return directly to Signal without granting progression', () => {
  assert.match(runtime, /enterSignalFrontier\(\{ explicitUserAction = false \} = \{\}\)/);
  assert.match(runtime, /world-switch-signal-frontier/);
  assert.match(runtime, /worldId: 'signal-frontier', grantsXp: false, persistsProgression: false/);
  assert.match(runtime, /if \(uiWorldMode === 'EXPANSE_ACTIVE'\) handoffFromMenu\('signal-frontier-entry'/);
});

test('L95 Explore menu is allowed in Expanse but Command Hub operations menu stays blocked', () => {
  assert.match(runtime, /const openWorldSwitcher = uiWorldMode === 'EXPANSE_ACTIVE' && menu\.dataset\.eonCityMenuMode === 'explore'/);
  assert.match(runtime, /uiWorldMode === 'EXPANSE_ACTIVE' && !openWorldSwitcher/);
});


test('L95 Storm can switch directly to My Frontier without a forced Signal hop or progression grant', () => {
  assert.doesNotMatch(runtime, /return-to-signal-frontier-before-my-frontier/);
  assert.match(runtime, /clearInput\('l95-direct-my-frontier-from-storm'\)/);
  assert.match(runtime, /world-switch-my-frontier/);
  assert.match(runtime, /expanseStormSectorPresenter\?\.suspend\?\.\(\)/);
  assert.match(runtime, /campaignCompletionRequired: false, grantsXp: false, grantsConstructionPermit: false/);
});


test('L95 My Frontier can enter Storm directly through certified/review transit without a Signal prerequisite', () => {
  assert.match(runtime, /enterStormSector\(\{ explicitUserAction = false \} = \{\}\)/);
  assert.match(runtime, /expanseMyFrontierRenderer\?\.deactivate\?\.\(\);[\s\S]{0,500}expanseActiveRegionId = 'storm-sector'/);
  assert.doesNotMatch(runtime, /signalCampaignCompletionRequired:\s*true/);
  assert.match(runtime, /signalCampaignCompletionRequired: false, grantsXp: false/);
});


test('L95 Worlds switcher marks the active region and disables only its redundant open action', () => {
  assert.match(runtime, /const activeRegion = uiWorldMode === 'EXPANSE_ACTIVE' \? String\(getActiveWorldRegion\?\.\(\) \|\| 'signal-frontier'\) : ''/);
  assert.match(runtime, /card\.dataset\.eonCityWorldCurrent = current \? 'true' : 'false'/);
  assert.match(runtime, /button\.textContent = 'Current world'/);
  assert.match(runtime, /button\.setAttribute\('aria-current', 'location'\)/);
  assert.match(css, /data-eon-city-world-current="true"/);
});


test('L95 M key opens Worlds in an Open World and operations only in Command Hub', () => {
  assert.match(runtime, /const fromExpanse = uiWorldMode === 'EXPANSE_ACTIVE';[\s\S]{0,180}menu\.dataset\.eonCityMenuMode = fromExpanse \? 'explore' : 'operations'/);
  assert.match(runtime, /openMenu\(fromExpanse \? exploreLauncher : menuLauncher\)/);
});
