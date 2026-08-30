import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEonExpanseW770FCompositionRecoveryController } from '../../assets/js/city/w770/eon-expanse-w770f-my-frontier-composition-recovery.js';

const rejected = (overrides = {}) => ({
  requestedPartCount: 5,
  presentedPartCount: 3,
  rejectedPartCount: 2,
  loadingPartCount: 0,
  plots: [{ plotId: 'creator-plot', status: 'rejected-authored-composition' }],
  ...overrides
});

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('W770F recovery is explicit, settled and Expanse-active only', () => {
  const controller = createEonExpanseW770FCompositionRecoveryController({ now: () => 1000 });
  assert.equal(controller.request(rejected(), { expanseActive: true }).reason, 'explicit-user-action-required');
  assert.equal(controller.request(rejected(), { explicitUserAction: true, expanseActive: false }).reason, 'expanse-not-active');
  assert.equal(controller.request(rejected({ loadingPartCount: 2 }), { explicitUserAction: true, expanseActive: true }).reason, 'composition-load-pending');
  assert.equal(controller.request(rejected({ presentedPartCount: 5, rejectedPartCount: 0, plots: [] }), { explicitUserAction: true, expanseActive: true }).reason, 'composition-retry-not-required');
});

test('W770F recovery enforces cooldown and a maximum of three deliberate attempts', () => {
  let at = 1000;
  const controller = createEonExpanseW770FCompositionRecoveryController({ now: () => at, cooldownMs: 2000, maxAttempts: 2 });
  const first = controller.request(rejected(), { explicitUserAction: true, expanseActive: true, at });
  assert.equal(first.ok, true);
  controller.complete(first.token, { ok: false, summary: rejected(), reason: 'presentation-rejected', expanseActive: true, at: 1100 });
  at = 1500;
  assert.equal(controller.request(rejected(), { explicitUserAction: true, expanseActive: true, at }).reason, 'composition-retry-cooldown');
  at = 3100;
  const second = controller.request(rejected(), { explicitUserAction: true, expanseActive: true, at });
  assert.equal(second.ok, true);
  controller.complete(second.token, { ok: false, summary: rejected(), reason: 'presentation-rejected', expanseActive: true, at: 3200 });
  at = 5200;
  const exhausted = controller.request(rejected(), { explicitUserAction: true, expanseActive: true, at });
  assert.equal(exhausted.reason, 'composition-retry-attempts-exhausted');
  assert.equal(exhausted.state.remainingAttempts, 0);
  assert.equal(exhausted.state.automaticRetry, false);
});

test('W770F successful completion preserves truthful foundations and scaffolding policy', () => {
  const controller = createEonExpanseW770FCompositionRecoveryController({ now: () => 5000 });
  const request = controller.request(rejected(), { explicitUserAction: true, expanseActive: true });
  const complete = controller.complete(request.token, {
    ok: true,
    expanseActive: true,
    summary: rejected({ presentedPartCount: 5, rejectedPartCount: 0, plots: [] })
  });
  assert.equal(complete.ok, true);
  assert.equal(complete.state.releaseReady, true);
  assert.equal(complete.state.scaffoldingPreserved, true);
  assert.equal(complete.state.foundationPreserved, true);
});

test('W770F presenter exposes explicit rejected-part retry without creating another runtime', async () => {
  const presenter = await read('../../assets/js/city/w770/eon-expanse-w770c-my-frontier-building-composition-presenter.js');
  const renderer = await read('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js');
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(presenter, /retryRejected/);
  assert.match(presenter, /explicit-user-action-required/);
  assert.match(presenter, /rejected-authored-composition-part/);
  assert.match(presenter, /scaffoldingPreserved: true/);
  assert.match(renderer, /buildingCompositionPresenter/);
  assert.match(renderer, /retryBuildingCompositions/);
  assert.match(runtime, /createEonExpanseW770FCompositionRecoveryController/);
  assert.match(runtime, /retryBuildingCompositions/);
  assert.match(runtime, /w770f-expanse-combined-asset-recovery/);
  assert.equal((renderer.match(/new Engine\s*\(/g) || []).length, 0);
  assert.equal((renderer.match(/new Scene\s*\(/g) || []).length, 0);
});
