import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { EON_CITY_W731_STATIONS } from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import { getEonWorkSurfaceDefinition } from '../../assets/js/work-surface/eon-work-surface-registry.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('W733 maps every visible station to one real shared full-screen work surface', () => {
  for (const station of EON_CITY_W731_STATIONS) {
    const surface = getEonWorkSurfaceDefinition(station.surface);
    assert.ok(surface, `${station.id} must resolve to a shared surface`);
    assert.equal(surface.id, station.surface);
  }
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const presenter = read('assets/js/city/w748/eon-city-w748-workspace-presenter.js');
  assert.match(runtime, /createEonCityW748WorkspacePresenter/);
  assert.match(runtime, /explicitUserAction: true/);
  assert.match(presenter, /dispatchEonWorkSurfaceOpen/);
  assert.match(presenter, /source: 'eon-city-command-hub'/);
  assert.match(runtime, /workspacePresenter\.getState\(\)\.active \|\| workspacePresenter\.getState\(\)\.pending \|\| workSurfaceOpen/);
  assert.match(runtime, /work-surface-already-opening/);
});

test('W733 keeps Share, Creator Capture, Plans and My Realm explicit and useful', () => {
  const byId = new Map(EON_CITY_W731_STATIONS.map((station) => [station.id, station]));
  assert.equal(byId.get('share-capture').surface, 'share');
  assert.equal(byId.get('plans-access').surface, 'plans');
  assert.equal(byId.get('my-realm-portal').surface, 'my-realm');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /openSurfaceForStation\('share-capture', trigger, 'creator-capture'\)/);
  assert.match(runtime, /openSurfaceForStation\('share-capture', trigger, 'share'\)/);
  assert.equal(byId.get('share-capture').label, 'Share Command Center');
  assert.match(runtime, /data-eon-city-quick=\"share\">Share/);
  assert.match(runtime, /Creator Capture/);
  assert.match(runtime, /data-eon-city-quick=\"plans\">Plans &amp; Access/);
  assert.match(runtime, /checkoutAutomatic: false/);
  assert.doesNotMatch(runtime, /automaticCheckout|autoPost|autoUpload/);
});

test('W733 provides direct City Menu guidance, station opening and local resume', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /data-eon-city-menu-guide/);
  assert.match(runtime, /data-eon-city-menu-open-surface/);
  assert.match(runtime, /resumeLocation/);
  assert.match(runtime, /openCityMenu/);
  assert.match(runtime, /ui\?\.isMenuOpen/);
});
