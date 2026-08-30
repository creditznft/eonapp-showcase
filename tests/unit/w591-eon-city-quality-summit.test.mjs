import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_CITY_QUALITY_SUMMIT_DECISIONS,
  EON_CITY_QUALITY_SUMMIT_SCHEMA,
  getEonCityQualitySummitPlan,
  validateEonCityQualitySummitPlan
} from '../../assets/js/city/eon-city-quality-summit.js';

test('W591/W607 gives direct City entry a named compact HUD and a Command Deck waypoint', () => {
  const plan = getEonCityQualitySummitPlan({ directEntry: true });
  assert.equal(plan.schema, EON_CITY_QUALITY_SUMMIT_SCHEMA);
  assert.deepEqual(plan.primaryHudActions, ['Command Room', 'EONBOT', 'Districts', 'Menu']);
  assert.equal(plan.arrivalCompass.landmarkId, 'command-centre');
  assert.deepEqual(validateEonCityQualitySummitPlan(plan), []);
});

test('W591 prevents modality overload and does not manufacture a quality certification', () => {
  const plan = getEonCityQualitySummitPlan({ directEntry: false });
  assert.equal(plan.overlayCoordinator.modalStackingAllowed, false);
  assert.equal(plan.externalAction, false);
  assert.equal(plan.automaticRouteOpen, false);
  assert.equal(plan.automaticCertification, false);
  assert.equal(plan.automaticProductionApproval, false);
  assert.match(EON_CITY_QUALITY_SUMMIT_DECISIONS.scorePolicy, /No synthetic visual/);
});

test('W591 rejects a broadened quality plan', () => {
  const plan = getEonCityQualitySummitPlan();
  assert.equal(validateEonCityQualitySummitPlan({ ...plan, automaticCertification: true }).includes('automaticCertification must remain false'), true);
  assert.equal(validateEonCityQualitySummitPlan({ ...plan, overlayCoordinator: { ...plan.overlayCoordinator, modalStackingAllowed: true } }).includes('modal stacking must remain disabled'), true);
});
