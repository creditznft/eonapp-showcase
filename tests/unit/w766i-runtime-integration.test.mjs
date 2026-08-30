import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = {
  runtime: new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url),
  frontier: new URL('../../assets/js/city/w766/eon-expanse-w766b-signal-frontier.js', import.meta.url),
  streamer: new URL('../../assets/js/city/w766/eon-expanse-w766c-sector-streamer.js', import.meta.url),
  renderer: new URL('../../assets/js/city/w766/eon-expanse-w766i-open-world-renderer.js', import.meta.url),
  continuity: new URL('../../assets/js/city/w766/eon-expanse-w766i-open-world-continuity.js', import.meta.url),
  ui: new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url),
  presentation: new URL('../../assets/js/city/w766/eon-expanse-w766g-presentation-director.js', import.meta.url)
};

const source = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, url]) => [key, await readFile(url, 'utf8')])));

test('W766I integrates the proven world grammar into the existing canonical runtime', () => {
  assert.match(source.streamer, /buildEonCityW667WorldCell/);
  assert.match(source.continuity, /buildEonCityW681ExpanseMacroRegionPlan/);
  assert.match(source.continuity, /buildEonCityW682ExpansePopulationPlan/);
  assert.match(source.continuity, /buildEonCityW698ExpansePresentation/);
  assert.match(source.frontier, /mountEonExpanseW766IOpenWorldRenderer/);
  assert.match(source.frontier, /openWorld\.suspend\(\)/);
  assert.match(source.runtime, /frontier-contract-interaction/);
  assert.match(source.runtime, /frontier-contract-step/);
  assert.match(source.frontier, /emit\('frontier-contract-step'/);
  assert.match(source.runtime, /progressExpanseFrontierContract/);
  assert.match(source.renderer, /expanse-frontier-contract-step/);
  assert.match(source.runtime, /procedural-discovery-reviewed/);
  assert.match(source.runtime, /getExpanseOpenWorldSummary/);
  assert.match(source.ui, /Living frontier contract/);
  assert.match(source.presentation, /Living Frontier/);
});

test('W766I does not introduce another engine, scene, canvas or render loop', () => {
  const combined = `${source.renderer}\n${source.continuity}\n${source.streamer}`;
  assert.doesNotMatch(combined, /new\s+Engine\s*\(/);
  assert.doesNotMatch(combined, /new\s+Scene\s*\(/);
  assert.doesNotMatch(combined, /runRenderLoop\s*\(/);
  assert.doesNotMatch(combined, /createElement\s*\(\s*['"]canvas['"]\s*\)/);
  assert.match(source.renderer, /canonicalScene/);
  assert.match(source.renderer, /ownsRenderLoop:\s*false/);
  assert.match(source.renderer, /visibleHardBorder:\s*false/);
});

test('W766I generated content stays truthful and protected from authored-zone overlap', () => {
  assert.match(source.renderer, /isProtectedByAuthoredZone/);
  assert.match(source.renderer, /claimsRealWork:\s*false/);
  assert.match(source.renderer, /claimsRealActivity:\s*false/);
  assert.match(source.continuity, /privateDataRead:\s*false/);
  assert.match(source.continuity, /networkRequestCreated:\s*false/);
  assert.match(source.continuity, /automaticCompletion:\s*false/);
  assert.match(source.continuity, /reviewFirst:\s*true/);
  assert.match(source.continuity, /FRONTIER_CONTRACT_FAMILIES/);
  assert.match(source.continuity, /steps,/);
});
