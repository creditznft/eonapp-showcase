import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EON_CITY_COMMAND_HORIZON_STREET_KIT_SCHEMA,
  EON_CITY_COMMAND_HORIZON_STREET_KIT_PROFILES,
  getEonCityCommandHorizonStreetKitPlan,
  getEonCityCommandHorizonStreetKitTruth,
  validateEonCityCommandHorizonStreetKitPlan
} from '../../assets/js/city/eon-city-command-horizon-street-kit.js';
import { inspectW568CommandHorizonStreetKit } from '../../scripts/w568-command-horizon-street-kit-gate.mjs';

test('W568 keeps Command Horizon street detail original, local, and quality-bounded', () => {
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const plan = getEonCityCommandHorizonStreetKitPlan({ quality });
    const profile = EON_CITY_COMMAND_HORIZON_STREET_KIT_PROFILES[quality];
    assert.equal(plan.schema, EON_CITY_COMMAND_HORIZON_STREET_KIT_SCHEMA);
    assert.equal(plan.quality, quality);
    assert.equal(plan.originalProcedural, true);
    assert.equal(plan.binaryAssets, false);
    assert.equal(plan.remoteAssets, false);
    assert.equal(plan.userData, false);
    assert.equal(plan.props.curbs.length, profile.curbCount);
    assert.equal(plan.props.rails.length, profile.railCount);
    assert.equal(plan.props.planters.length, profile.planterCount);
    assert.equal(plan.props.rainChannels.length, profile.rainChannelCount);
    assert.equal(plan.props.wayfinding.length, profile.wayfindingCount);
    assert.equal(plan.props.paverGuides.length, profile.paverGuideCount);
    assert.equal(plan.budgets.decorativePropBudgetRespected, true);
    assert.equal(validateEonCityCommandHorizonStreetKitPlan(plan).ok, true);
  }
});

test('W568 uses Lite as a real low-detail fallback rather than a relabelled desktop plan', () => {
  const lite = getEonCityCommandHorizonStreetKitPlan({ quality: 'lite' });
  const balanced = getEonCityCommandHorizonStreetKitPlan({ quality: 'balanced' });
  assert.equal(lite.props.rails.length, 0);
  assert.equal(lite.props.planters.length, 0);
  assert.equal(lite.props.paverGuides.length, 0);
  assert.ok(lite.budgets.decorativePropCount < balanced.budgets.decorativePropCount);
  const truth = getEonCityCommandHorizonStreetKitTruth({ quality: 'lite' });
  assert.equal(truth.valid, true);
  assert.equal(truth.qualityFallbackRespected, true);
  assert.equal(truth.fetchesAssets, false);
  assert.equal(truth.proxiesAssets, false);
  assert.equal(truth.storesUserData, false);
});

test('W568 rejects sensitive fields, remote/binary claims, and malformed bounded geometry', () => {
  const safe = getEonCityCommandHorizonStreetKitPlan({ quality: 'balanced' });
  const sensitive = { ...safe, accountId: 'do-not-store' };
  assert.equal(validateEonCityCommandHorizonStreetKitPlan(sensitive).ok, false);
  assert.ok(validateEonCityCommandHorizonStreetKitPlan(sensitive).errors.includes('plan-has-unknown-or-sensitive-fields'));

  const remote = { ...safe, remoteAssets: true };
  assert.equal(validateEonCityCommandHorizonStreetKitPlan(remote).ok, false);
  assert.ok(validateEonCityCommandHorizonStreetKitPlan(remote).errors.includes('plan-truth-flags-invalid'));

  const malformed = {
    ...safe,
    props: {
      ...safe.props,
      curbs: safe.props.curbs.slice(1)
    }
  };
  assert.equal(validateEonCityCommandHorizonStreetKitPlan(malformed).ok, false);
  assert.ok(validateEonCityCommandHorizonStreetKitPlan(malformed).errors.includes('curbs-count-invalid'));
});

test('W568 source gate stays fail-closed around budgeted source-only street geometry', () => {
  const report = inspectW568CommandHorizonStreetKit();
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 14);
});
