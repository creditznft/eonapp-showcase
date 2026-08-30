import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildEonExpanseR06WorldAtlas, deriveEonExpanseR06FirstMinuteGuide, EON_EXPANSE_R06_ZONE_IDENTITIES } from '../../assets/js/city/r06/eon-expanse-r06-flagship-experience.js';
import { createEonExpanseW766AMapView, createEonExpanseW766AInitialState } from '../../assets/js/city/w766/eon-expanse-w766a-foundation.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

test('R06 Atlas maps all five Signal Frontier zones into a spatial route', () => {
  const atlas = buildEonExpanseR06WorldAtlas(createEonExpanseW766AMapView(createEonExpanseW766AInitialState()));
  assert.equal(atlas.nodes.length, 5);
  assert.equal(atlas.routes.length, 4);
  assert.equal(atlas.currentZoneId, 'gateway-overlook');
  assert.equal(atlas.listOnlyMap, false);
  assert.equal(atlas.spatialMap, true);
  assert.ok(atlas.nodes.every((node) => node.xPct >= 4 && node.xPct <= 96 && node.yPct >= 4 && node.yPct <= 96));
  assert.deepEqual(Object.keys(EON_EXPANSE_R06_ZONE_IDENTITIES), ['gateway-overlook','beacon-fields','archive-ruins','transit-scar','horizon-vault']);
});

test('R06 first minute tells a new player exactly how to move and interact', () => {
  const guide = deriveEonExpanseR06FirstMinuteGuide({ companion: { bonded: false, nextAction: 'scan-dormant-eonbot' } });
  assert.equal(guide.title, 'Restore the first Signal');
  assert.match(guide.detail, /gold circuit/);
  assert.match(guide.shortcut, /WASD \/ arrows move/);
  assert.match(guide.shortcut, /E \/ click \/ tap interact/);
  assert.match(guide.shortcut, /M Atlas/);
});

test('R06 presentation director publishes Atlas data instead of a list-only map', () => {
  const source = read('assets/js/city/w766/eon-expanse-w766g-presentation-director.js');
  assert.match(source, /buildEonExpanseR06WorldAtlas/);
  assert.match(source, /atlas: buildEonExpanseR06WorldAtlas\(map\)/);
});

test('R06 Mission Map renders a clickable spatial Atlas and routes zone selection into EONBOT guidance', () => {
  const overlay = read('assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(overlay, /data-eon-expanse-ui':'atlas'/);
  assert.match(overlay, /data-eon-expanse-atlas-zone/);
  assert.match(overlay, /onSelectMapZone\?\.\(zoneId, \{ explicitUserAction: true \}\)/);
  assert.match(runtime, /objective: `atlas:\$\{zone\.id\}`/);
  assert.match(runtime, /EONBOT is guiding \$\{zone\.label\}/);
  assert.match(runtime, /automaticTravel: false/);
});

test('R06 onboarding consumes the flagship first-minute copy authority', () => {
  const onboarding = read('assets/js/city/w766/eon-expanse-w767f-onboarding-director.js');
  assert.match(onboarding, /deriveEonExpanseR06FirstMinuteGuide/);
  assert.doesNotMatch(onboarding, /title: 'Recover EONBOT'/);
});


test('R06 world-density scenery is richer without fabricating new interactions', () => {
  const frontier = read('assets/js/city/w766/eon-expanse-w766b-signal-frontier.js');
  for (const family of ['route-pylon-', 'gateway-landmark-', 'beacon-crossbar-', 'archive-pillar-', 'transit-gantry-', 'vault-approach-pylon-']) {
    assert.match(frontier, new RegExp(family));
  }
  assert.match(frontier, /decorativeOnly: true, interactive: false/);
  assert.match(frontier, /expanse-beacon-one.*interactive: true/s);
  assert.match(frontier, /expanse-map-terminal.*interactive: true/s);
});
