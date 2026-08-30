import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { ALL_ROUTE_ROWS } from '../../config/route-contract.mjs';
import {
  EON_CITY_W655_DISTRICT_ACTIONS,
  EON_CITY_W655_DISTRICT_EXPERIENCE,
  EON_CITY_W655_REAL_WORK_TERMINALS,
  EON_CITY_W655_WORLD_DENSITY,
  validateEonCityW655Experience
} from '../../assets/js/city/w655/eon-city-w655-experience-contract.js';
import {
  EON_CITY_CONTROL_CONVENTION,
  resolveEonCityCameraRelativeMove,
  resolveEonCityInputIntent
} from '../../assets/js/city/eon-city-gameplay-contract.js';

const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');

test('W655 district experience covers all eight resident districts and real EONAPP work surfaces', () => {
  const routes = ALL_ROUTE_ROWS.map((row) => row.from);
  const validation = validateEonCityW655Experience({ canonicalRoutes: routes });
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(validation.districtCount, 8);
  assert.ok(validation.terminalCount >= 10);
  assert.ok(validation.nativeRouteCount >= 9);
  assert.equal(EON_CITY_W655_DISTRICT_ACTIONS['trade-dome'][0].route, '/realm-studio');
  assert.equal(EON_CITY_W655_DISTRICT_ACTIONS['vault-station'][0].route, '/local-ai');
  assert.equal(EON_CITY_W655_DISTRICT_EXPERIENCE['agent-theatre'].canonicalRole, 'automation-evidence');
  for (const terminal of EON_CITY_W655_REAL_WORK_TERMINALS) {
    assert.equal(terminal.reviewRequired, true, terminal.id);
    assert.equal(terminal.explicitOpenRequired, true, terminal.id);
    assert.equal(terminal.autoExecute, false, terminal.id);
    assert.equal(terminal.performsWorkInsideRenderer, false, terminal.id);
    assert.equal(terminal.privateDataInWorldTexture, false, terminal.id);
  }
});

test('W655 keyboard, touch and controller intents share the same non-inverted screen-relative convention in all cardinal camera headings', () => {
  assert.equal(EON_CITY_CONTROL_CONVENTION.leftRightInverted, false);
  const cameraHeadings = [
    { x: 0, z: 1 }, { x: 1, z: 0 }, { x: 0, z: -1 }, { x: -1, z: 0 }
  ];
  for (const forward of cameraHeadings) {
    const expectedRight = { x: forward.z, z: -forward.x };
    const right = resolveEonCityCameraRelativeMove({ input: { strafe: 1, forward: 0 }, cameraForward: forward });
    const left = resolveEonCityCameraRelativeMove({ input: { strafe: -1, forward: 0 }, cameraForward: forward });
    const ahead = resolveEonCityCameraRelativeMove({ input: { strafe: 0, forward: 1 }, cameraForward: forward });
    assert.ok(right.x * expectedRight.x + right.z * expectedRight.z > 0.99, JSON.stringify({ forward, right }));
    assert.ok(left.x * expectedRight.x + left.z * expectedRight.z < -0.99, JSON.stringify({ forward, left }));
    assert.ok(ahead.x * forward.x + ahead.z * forward.z > 0.99, JSON.stringify({ forward, ahead }));
  }
  for (const channel of ['keyboard', 'touch', 'controller']) {
    const intent = resolveEonCityInputIntent({ [channel]: { x: 0.7, z: 0.7 } });
    assert.equal(intent.source, channel);
    assert.ok(intent.strafe > 0 && intent.forward > 0);
  }
});

test('W655 live Babylon source keeps keyboard, touch and controller mappings aligned and review-only', () => {
  const source = read('assets/js/city/eon-city-play-babylon.js');
  const keyboardAuthority = read('assets/js/city/w719/eon-city-w719-input-authority.js');
  assert.match(source, /resolveEonCityW719KeyboardCode/);
  assert.match(source, /resolveEonCityW719MovementDirection/);
  assert.match(keyboardAuthority, /KeyW: 'up'.*ArrowUp: 'up'.*KeyS: 'down'.*ArrowDown: 'down'.*KeyA: 'left'.*ArrowLeft: 'left'.*KeyD: 'right'.*ArrowRight: 'right'/s);
  assert.match(keyboardAuthority, /keyboardKeyFallback: true/);
  assert.match(source, /touch: \{ x: analogMovement\.x, z: -analogMovement\.z \}/);
  assert.match(source, /controller: \{ x: gamepad\.x, z: -gamepad\.z \}/);
  assert.match(source, /action button can request the visible interaction review, but never confirms a destination/);
  assert.match(source, /click a district signal to inspect it, or click the floor to move locally/i);
});

test('W655 City density uses plentiful low-cost street furniture without preloading high-poly districts', () => {
  const art = read('assets/js/city/eon-city-play-art-direction.js');
  const runtime = read('assets/js/city/eon-city-play-babylon.js');
  assert.deepEqual(EON_CITY_W655_WORLD_DENSITY.streetLightsByQuality, { lite: 6, balanced: 11, cinematic: 16 });
  assert.equal(EON_CITY_W655_WORLD_DENSITY.maxResidentBinaryDistricts, 1);
  assert.equal(EON_CITY_W655_WORLD_DENSITY.repeatLowCostProceduralProps, true);
  assert.equal(EON_CITY_W655_WORLD_DENSITY.repeatHighPolyCharacters, false);
  assert.match(art, /streetProps: 6/);
  assert.match(art, /streetProps: 11/);
  assert.match(art, /streetProps: 16/);
  assert.match(runtime, /addDistrictFurnishings/);
  assert.match(runtime, /w649DistrictRuntime\.update\(operator\.position\)/);
});

test('W655 keeps the superseded pre-Realm action-order test as an exact non-certifying archive', () => {
  const manifest = JSON.parse(read('tests/archive/w655-pre-realm-workspace-taxonomy/MANIFEST.json'));
  assert.equal(manifest.classification, 'non-certifying-historical-exact-copy');
  assert.equal(manifest.certifying, false);
  assert.equal(manifest.releaseGate, false);
  assert.equal(manifest.files.length, 1);
});
