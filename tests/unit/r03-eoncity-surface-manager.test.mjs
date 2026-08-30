import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEonCityR03SurfaceManager,
  resolveEonCityR03SurfacePresentation
} from '../../assets/js/city/r03/eon-city-r03-surface-manager.js';

function environment() {
  return {
    CustomEvent: class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } },
    dispatchEvent() {},
    document: { querySelector() { return null; } }
  };
}

test('R03 maps mobile/tablet portrait to sheet and desktop to dock', () => {
  assert.equal(resolveEonCityR03SurfacePresentation({ id: 'mobile-portrait', surfaceMode: 'bottom-sheet' }), 'sheet');
  assert.equal(resolveEonCityR03SurfacePresentation({ id: 'tablet-portrait', surfaceMode: 'sheet' }), 'sheet');
  assert.equal(resolveEonCityR03SurfacePresentation({ id: 'desktop-standard', surfaceMode: 'dock' }), 'dock');
});

test('R03 permits only one open blocking surface', () => {
  const closed = [];
  const manager = createEonCityR03SurfaceManager({ environment: environment() });
  manager.register('menu', { close: () => { closed.push('menu'); return { ok: true }; } });
  manager.register('workspace', { close: () => { closed.push('workspace'); return { ok: true }; } });
  assert.equal(manager.requestOpen('menu').ok, true);
  assert.equal(manager.requestOpen('workspace').ok, true);
  assert.deepEqual(closed, ['menu']);
  const snapshot = manager.getSnapshot();
  assert.equal(snapshot.activeBlockingId, 'workspace');
  assert.equal(snapshot.openBlockingCount, 1);
});

test('R03 supports explicit minimize and restore without two blocking surfaces', () => {
  let minimized = 0;
  let restored = 0;
  const manager = createEonCityR03SurfaceManager({ environment: environment() });
  manager.register('map', {
    minimize: () => { minimized += 1; return { ok: true }; },
    restore: () => { restored += 1; return { ok: true }; }
  });
  manager.requestOpen('map');
  assert.equal(manager.minimize('map').ok, true);
  assert.equal(manager.getSnapshot().openBlockingCount, 0);
  assert.equal(manager.restore('map').ok, true);
  assert.equal(manager.getSnapshot().openBlockingCount, 1);
  assert.equal(minimized, 1);
  assert.equal(restored, 1);
});
