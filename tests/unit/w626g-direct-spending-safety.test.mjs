import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyDirectProviderFailure, evaluateDirectJobSpend, getDirectSpendingSafetyTruth } from '../../assets/js/direct-byok/budget-safety.js';

test('W626G requires per-job confirmation and enforces hard budget stops', () => {
  assert.equal(evaluateDirectJobSpend({ estimate: { available: true, amount: 2 }, budget: { hardStopAmount: 1 }, explicitConfirmation: true }).allowed, false);
  assert.equal(evaluateDirectJobSpend({ estimate: { available: false }, explicitConfirmation: false }).reason, 'per-job-confirmation-required');
  assert.equal(evaluateDirectJobSpend({ estimate: { available: false }, explicitConfirmation: true }).allowed, true);
  assert.equal(getDirectSpendingSafetyTruth().automaticPaidRetry, false);
});

test('W626G preserves provider outage, moderation, quota and region truth', () => {
  assert.equal(classifyDirectProviderFailure({ status: 429 }).code, 'rate-limited');
  assert.equal(classifyDirectProviderFailure({ status: 402 }).code, 'quota-exhausted');
  assert.equal(classifyDirectProviderFailure({ message: 'moderation policy rejected' }).code, 'provider-moderation-response');
  assert.equal(classifyDirectProviderFailure({ status: 451 }).code, 'region-restricted');
});

test('W626G never exposes raw provider failure text to public UI/receipts', () => {
  const failure = classifyDirectProviderFailure({ status: 500, message: 'provider echoed private prompt: SECRET-USER-TEXT' });
  assert.equal(failure.code, 'provider-failure');
  assert.equal(failure.rawProviderMessageIncluded, false);
  assert.doesNotMatch(failure.providerMessage, /SECRET-USER-TEXT|private prompt/i);
  assert.equal(getDirectSpendingSafetyTruth().rawProviderErrorTextExposed, false);
});
