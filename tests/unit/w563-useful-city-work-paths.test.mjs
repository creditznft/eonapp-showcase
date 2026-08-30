import assert from 'node:assert/strict';
import test from 'node:test';
import {
  EON_CITY_USEFUL_WORK_PATHS_SCHEMA,
  createEonCityUsefulWorkPathReview,
  getEonCityUsefulWorkPath,
  getEonCityUsefulWorkPaths,
  getEonCityUsefulWorkPathsTruth,
  validateEonCityUsefulWorkPaths
} from '../../assets/js/city/eon-city-useful-work-paths.js';
import { inspectW563UsefulCityWorkPaths } from '../../scripts/w563-useful-city-work-paths-gate.mjs';

test('W563 provides exactly five useful core City paths with bounded native destinations', () => {
  const paths = getEonCityUsefulWorkPaths();
  assert.equal(paths.length, 5);
  assert.deepEqual(paths.map((path) => path.id), ['creator', 'builder', 'operator', 'analyst', 'guardian']);
  assert.deepEqual(paths.map((path) => path.route), ['/workspace#creator-engine', '/forge', '/automations', '/insights', '/vault']);
  for (const path of paths) {
    assert.equal(path.state, 'available-core');
    assert.ok(path.label.length > 0);
    assert.ok(path.district.length > 0);
    assert.ok(path.detail.length > 0);
    assert.ok(path.outcome.length > 0);
  }
  assert.equal(getEonCityUsefulWorkPath('unknown'), null);
  assert.equal(validateEonCityUsefulWorkPaths(paths).ok, true);
});

test('W563 creates a second-click, privacy-safe native handoff without a task, agent, provider, entitlement, reward, or completion claim', () => {
  const result = createEonCityUsefulWorkPathReview({ pathId: 'guardian' });
  assert.equal(result.ok, true);
  const review = result.review;
  assert.equal(review.schema, EON_CITY_USEFUL_WORK_PATHS_SCHEMA);
  assert.equal(review.pathId, 'guardian');
  assert.equal(review.destination.route, '/vault');
  assert.equal(review.confirmationRequired, true);
  assert.equal(review.localOnly, true);
  assert.equal(review.privateContentVisible, false);
  assert.equal(review.taskCreated, false);
  assert.equal(review.providerRequestCreated, false);
  assert.equal(review.backgroundWorkStarted, false);
  assert.equal(review.entitlementChecked, false);
  assert.equal(review.commercialOfferShown, false);
  assert.equal(review.rewardCreated, false);
  assert.equal(createEonCityUsefulWorkPathReview({ pathId: 'not-real' }).error, 'unknown-work-path');
});

test('W563 truth keeps core access useful and rejects subscriptions, rewards, private data, automatic actions, and fake completion', () => {
  const truth = getEonCityUsefulWorkPathsTruth();
  assert.equal(truth.corePathsUseful, true);
  assert.equal(truth.corePathsArtificiallyLocked, false);
  assert.equal(truth.subscriptionEntitlementChecked, false);
  assert.equal(truth.commercialOfferShown, false);
  assert.equal(truth.rewardCreated, false);
  assert.equal(truth.syntheticXpCreated, false);
  assert.equal(truth.privateDataRead, false);
  assert.equal(truth.automaticRoute, false);
  assert.equal(truth.automaticToolExecution, false);
  assert.equal(truth.completionClaimed, false);
  assert.equal(truth.nativeHandoffRequiresConfirmation, true);
});

test('W563 source gate stays fail-closed about commercial pressure and private work surfaces', () => {
  const report = inspectW563UsefulCityWorkPaths();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 27);
});
