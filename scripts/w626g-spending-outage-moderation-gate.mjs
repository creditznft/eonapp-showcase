#!/usr/bin/env node
import assert from 'node:assert/strict';
import { classifyDirectProviderFailure, getDirectSpendingSafetyTruth } from '../assets/js/direct-byok/budget-safety.js';
const truth = getDirectSpendingSafetyTruth();
assert.equal(truth.perJobConfirmationRequired, true);
assert.equal(truth.userBudgetWarnings, true);
assert.equal(truth.hardStopSupported, true);
assert.equal(truth.automaticPaidRetry, false);
assert.equal(truth.quotaAndRateLimitHonest, true);
assert.equal(truth.moderationResponsesPreserved, true);
assert.equal(classifyDirectProviderFailure({ status: 503 }).code, 'provider-outage');
assert.equal(classifyDirectProviderFailure({ message: 'moderation policy' }).code, 'provider-moderation-response');
console.log('[W626G] PASS 8/8 spending, outage and moderation safety invariants');
