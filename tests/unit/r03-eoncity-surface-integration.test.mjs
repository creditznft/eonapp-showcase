import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
const presenter = fs.readFileSync(new URL('../../assets/js/city/w748/eon-city-w748-workspace-presenter.js', import.meta.url), 'utf8');
const registry = fs.readFileSync(new URL('../../assets/js/contracts/work-surface/eon-work-surface-registry.js', import.meta.url), 'utf8');
const host = fs.readFileSync(new URL('../../assets/js/work-surface/eon-work-surface-host.js', import.meta.url), 'utf8');
const cityCss = fs.readFileSync(new URL('../../assets/css/eon-city-play.css', import.meta.url), 'utf8');
const workCss = fs.readFileSync(new URL('../../assets/css/eon-work-surface.css', import.meta.url), 'utf8');

test('R03 runtime routes all major City blocking surfaces through one manager', () => {
  assert.match(runtime, /createEonCityR03SurfaceManager/);
  for (const id of ['city-menu', 'transit-review', 'expanse-review', 'accessible-map', 'work-surface']) {
    assert.match(runtime, new RegExp(`['\"]${id}['\"]`));
  }
  assert.match(runtime, /surfaceManager\.requestOpen\('accessible-map'/);
  assert.match(runtime, /requestSurfaceOpen: \(surfaceId, options = \{\}\) => surfaceManager\.requestOpen/);
});

test('R03 work surface supports profile-derived sheet presentation', () => {
  assert.match(registry, /\['focus', 'dock', 'sheet'\]/);
  assert.match(presenter, /eonCityManagedSurfacePresentation === 'sheet'/);
  assert.match(presenter, /presentationMode = .*\? 'sheet' : 'dock'/);
  assert.match(host, /eon-work-surface-sheet-open/);
  assert.match(workCss, /data-eon-work-surface-presentation="sheet"/);
});

test('R03 removes dock canvas translation and composes mobile surfaces as sheets', () => {
  assert.match(cityCss, /eon-work-surface-sheet-open/);
  assert.match(cityCss, /transform:none!important/);
  assert.match(cityCss, /data-eon-city-managed-surface-presentation="sheet"/);
  assert.match(cityCss, /eon-city-w756-semantic-map/);
});
