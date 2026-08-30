import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../../${path}`, import.meta.url), 'utf8');

test('RT96 release identity is diagnostics-only during ordinary City play', async () => {
  const source = await read('assets/js/release/eon-release-identity.js');
  const css = await read('assets/css/eon-city-play.css');
  assert.match(source, /diagnostics/);
  assert.match(source, /cityDiagnostics/);
  assert.doesNotMatch(source, /localStorage|document\.cookie/);
  assert.match(source, /reason: 'diagnostics-disabled'/);
  assert.match(css, /\.eon-release-identity\[hidden\]\{display:none!important\}/);
});

test('RT96 mobile City shell removes duplicate new-chat control and compresses the global bar', async () => {
  const css = await read('assets/css/eon-app-shell.css');
  assert.match(css, /body\[data-eon-app-page="eoncity"\].*--eon-app-mobilebar-height: 3\.25rem/s);
  assert.match(css, /body\[data-eon-app-page="eoncity"\] \.eon-app-mobile-new \{ display: none !important; \}/);
});

test('RT96 mobile onboarding teaches movement/look/action instead of presenting three competing launch buttons', async () => {
  const source = await read('assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js');
  assert.match(source, /eonCityW756OnboardingMode/);
  assert.match(source, /Move to begin/);
  assert.match(source, /Left thumb: move\. Drag the right side to look\. Use the action prompt near a station\./);
  assert.match(source, /compactOnboarding/);
});

test('RT96 portrait HUD hides redundant objective and keeps two 48px top controls', async () => {
  const css = await read('assets/css/eon-city-play.css');
  assert.match(css, /data-eon-city-hud-layout="mobile-portrait-safe"[\s\S]*eon-city-reduced-objective[\s\S]*display:none!important/);
  assert.match(css, /eon-city-reduced-actions :is\(button,a\)[\s\S]*min-width:48px!important[\s\S]*min-height:48px!important/);
});
