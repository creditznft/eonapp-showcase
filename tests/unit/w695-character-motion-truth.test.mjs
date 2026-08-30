import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getEonCityW695CharacterAxisCalibration,
  resolveEonCityW695CharacterVisualHeading,
  createEonCityW695LocomotionTruthController,
  validateEonCityW695CalibrationRegistry,
  getEonCityW695Truth
} from '../../assets/js/city/w695/eon-city-w695-character-motion-truth.js';
import { inspectW695CharacterMotion } from '../../scripts/w695-character-motion-gate.mjs';

test('W695 independently calibrates all Pathfinder asset variants', () => {
  const result = validateEonCityW695CalibrationRegistry();
  assert.equal(result.ok, true, result.errors.join(' | '));
  for (const assetId of ['eoncity-pathfinder-prime-11clips','eoncity-pathfinder-a-vanguard-6clips']) {
    for (const variant of ['primary','fallback']) {
      const calibration = getEonCityW695CharacterAxisCalibration(assetId, variant);
      assert.equal(calibration.modelForwardAxis, '+z');
      assert.equal(calibration.visualHeadingOffset, 0);
      assert.equal(resolveEonCityW695CharacterVisualHeading(Math.PI / 2, assetId, variant), Math.PI / 2);
    }
  }
});

test('W695 animation follows actual displacement instead of desired input', () => {
  const controller = createEonCityW695LocomotionTruthController({ initialPosition:{x:0,z:0}, stopHoldMs:80, runThreshold:5.3 });
  const blocked = controller.update({ position:{x:0,z:0}, desiredDirection:{x:0,z:1}, deltaSeconds:.1, activeAssetId:'eoncity-pathfinder-prime-11clips' });
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.moving, false);
  assert.equal(blocked.animationState, 'idle');
  const walking = controller.update({ position:{x:0,z:.45}, desiredDirection:{x:0,z:1}, deltaSeconds:.1, activeAssetId:'eoncity-pathfinder-prime-11clips' });
  assert.equal(walking.moving, true);
  assert.equal(walking.animationState, 'walk');
  assert.ok(Math.abs(walking.heading) < .001);
  const idle = controller.update({ position:{x:0,z:.45}, desiredDirection:null, deltaSeconds:.12, activeAssetId:'eoncity-pathfinder-prime-11clips' });
  assert.equal(idle.moving, false);
  assert.equal(idle.animationState, 'idle');
});

test('W695 diagonal and reverse movement align heading with measured velocity', () => {
  const controller = createEonCityW695LocomotionTruthController({ initialPosition:{x:0,z:0}, headingSmoothing:1 });
  const diagonal = controller.update({ position:{x:1,z:1}, desiredDirection:{x:1,z:1}, deltaSeconds:.25 });
  assert.ok(Math.abs(diagonal.heading - Math.PI/4) < .001);
  const reverse = controller.update({ position:{x:1,z:0}, desiredDirection:{x:0,z:-1}, deltaSeconds:.25 });
  assert.ok(Math.abs(Math.abs(reverse.heading) - Math.PI) < .001);
});

test('W695 source gate reads the real GLB bind poses and integration', () => {
  const report = inspectW695CharacterMotion();
  assert.equal(report.ok, true, report.checks.filter((entry)=>!entry.pass).map((entry)=>entry.id).join(','));
  assert.equal(report.audits.length, 4);
  assert.ok(report.audits.every((entry)=>entry.facesPositiveZ));
});

test('W695 truth keeps visual browser confirmation pending', () => {
  const truth = getEonCityW695Truth();
  assert.equal(truth.perAssetVariantCalibration, true);
  assert.equal(truth.animationUsesPostCollisionDisplacement, true);
  assert.equal(truth.blockedMovementReturnsIdle, true);
  assert.equal(truth.visualBrowserConfirmationStillRequired, true);
  assert.equal(truth.automaticNavigation, false);
});
