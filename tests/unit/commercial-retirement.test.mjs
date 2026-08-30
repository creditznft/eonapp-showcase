import assert from 'node:assert/strict';
import test from 'node:test';
import { EONAPP_PRODUCT_SCOPE, getPublicProductScopeSummary, isRetiredProductCapability } from '../../assets/js/product/eonapp-product-scope.js';
import { inspectCommercialRetirement } from '../../scripts/commercial-retirement-gate.mjs';

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('COMMERCIAL-RETIREMENT locks ads, Telegram reward mechanics and trading execution outside launch scope', () => {
  assert.equal(EONAPP_PRODUCT_SCOPE.commerce.checkout, 'not-connected');
  assert.equal(EONAPP_PRODUCT_SCOPE.telegram.rewardMechanics, false);
  assert.equal(isRetiredProductCapability('rewarded-ads'), true);
  assert.equal(isRetiredProductCapability('trading-execution'), true);
  assert.equal(getPublicProductScopeSummary().truth.financialAdvice, false);
});

// W624D archived contract snapshot: superseded by current canonical alignment coverage.

test.skip('COMMERCIAL-RETIREMENT source gate retains a transparent legacy route without active campaigns', () => {
  const report = inspectCommercialRetirement({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.equal(report.checkCount, 7);
});
