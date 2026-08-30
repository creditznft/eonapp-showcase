import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createEonExpanseW792BStormSectorPlan,
  validateEonExpanseW792BStormSectorPlan,
  resolveEonExpanseW792BStormSectorZone
} from '../../assets/js/city/w792/eon-expanse-w792b-storm-sector-layout.js';

test('W792B creates collision-safe authored layouts for all quality profiles', () => {
  const expected = { lite: 5, balanced: 9, cinematic: 13 };
  for (const [quality, count] of Object.entries(expected)) {
    const plan = createEonExpanseW792BStormSectorPlan({ quality });
    const result = validateEonExpanseW792BStormSectorPlan(plan);
    assert.equal(result.ok, true, `${quality}:${result.errors.join(',')}`);
    assert.equal(result.activeCellCount, count);
    assert.equal(result.heroCount, 3);
    assert.equal(result.routeCount, 3);
    assert.equal(result.missionAnchorCount, 3);
    assert.equal(result.rendersRegion, false);
  }
});

test('W792B rejects raw-coordinate and second-runtime authority', () => {
  const plan = createEonExpanseW792BStormSectorPlan();
  const result = validateEonExpanseW792BStormSectorPlan({ ...plan, rawCoordinateInputAccepted: true, ownsScene: true, automaticActivation: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('placement-policy-invalid'));
  assert.ok(result.errors.includes('runtime-authority-invalid'));
  assert.ok(result.errors.includes('safety-boundary-invalid'));
});

test('W792B resolves authored region zones from world position', () => {
  const result = resolveEonExpanseW792BStormSectorZone({ x: 1001, z: -147 });
  assert.equal(result.zone.id, 'relay-basin');
  assert.equal(result.inside, true);
});
