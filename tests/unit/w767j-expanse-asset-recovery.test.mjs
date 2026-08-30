import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createEonExpanseW767JAssetRecoveryController } from '../../assets/js/city/w766/eon-expanse-w767j-asset-recovery.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const report = (overrides = {}) => ({
  releaseReady: false,
  totals: { requested: 5, presented: 3, pending: 0, rejected: 2, proceduralFallback: 2 },
  ...overrides
});

test('W767J recovery is explicit-user gated and only available for settled repair-required reports', () => {
  const controller = createEonExpanseW767JAssetRecoveryController({ now: () => 1000 });
  assert.equal(controller.request(report(), { expanseActive: true }).reason, 'explicit-user-action-required');
  assert.equal(controller.request(report(), { explicitUserAction: true, expanseActive: false }).reason, 'expanse-not-active');
  assert.equal(controller.request(report({ totals: { requested: 5, presented: 2, pending: 3, rejected: 0, proceduralFallback: 3 } }), { explicitUserAction: true, expanseActive: true }).reason, 'asset-load-pending');
  assert.equal(controller.request(report({ releaseReady: true, totals: { requested: 5, presented: 5, pending: 0, rejected: 0, proceduralFallback: 0 } }), { explicitUserAction: true, expanseActive: true }).reason, 'authored-assets-retry-not-required');
});

test('W767J recovery enforces cooldown and bounded attempts without automatic loops', () => {
  let clock = 1000;
  const controller = createEonExpanseW767JAssetRecoveryController({ now: () => clock, cooldownMs: 2000, maxAttempts: 2 });
  const first = controller.request(report(), { explicitUserAction: true, expanseActive: true, at: clock });
  assert.equal(first.ok, true);
  controller.complete(first.token, { ok: false, report: report(), reason: 'network-failure', at: clock + 100, expanseActive: true });
  clock = 1500;
  assert.equal(controller.request(report(), { explicitUserAction: true, expanseActive: true, at: clock }).reason, 'asset-retry-cooldown');
  clock = 3100;
  const second = controller.request(report(), { explicitUserAction: true, expanseActive: true, at: clock });
  assert.equal(second.ok, true);
  controller.complete(second.token, { ok: false, report: report(), reason: 'presentation-rejected', at: 3200, expanseActive: true });
  clock = 5200;
  const exhausted = controller.request(report(), { explicitUserAction: true, expanseActive: true, at: clock });
  assert.equal(exhausted.reason, 'asset-retry-attempts-exhausted');
  assert.equal(exhausted.state.remainingAttempts, 0);
  assert.equal(exhausted.state.automaticRetry, false);
});

test('W767J completion can reach release-ready and requires its issued token', () => {
  const controller = createEonExpanseW767JAssetRecoveryController({ now: () => 5000 });
  const requested = controller.request(report(), { explicitUserAction: true, expanseActive: true });
  assert.equal(controller.complete('wrong-token', { ok: true, report: report() }).reason, 'valid-active-retry-token-required');
  const completed = controller.complete(requested.token, {
    ok: true,
    expanseActive: true,
    report: report({ releaseReady: true, totals: { requested: 5, presented: 5, pending: 0, rejected: 0, proceduralFallback: 0 } })
  });
  assert.equal(completed.ok, true);
  assert.equal(completed.state.status, 'release-ready');
  assert.equal(completed.state.releaseReady, true);
});

test('W767J source integration uses the canonical gateway and existing overlay without another engine or scene', async () => {
  const gateway = await read('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(gateway, /reloadAuthoredAssets/);
  assert.match(gateway, /explicit-user-action-required/);
  assert.match(gateway, /disposeDeferredAssets\(\)/);
  assert.match(gateway, /mountDeferredAssets\(\)/);
  assert.match(overlay, /Retry world assets/);
  assert.match(overlay, /updateAssetRecovery/);
  assert.match(runtime, /createEonExpanseW767JAssetRecoveryController/);
  assert.match(runtime, /retryExpanseAuthoredAssetsAction/);
  assert.match(runtime, /retryExpanseAuthoredAssets/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
