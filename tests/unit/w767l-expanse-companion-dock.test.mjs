import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  deriveEonExpanseW767LCompanionDockPresentation,
  validateEonExpanseW767LCompanionDockRequest
} from '../../assets/js/city/w766/eon-expanse-w767l-companion-dock.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('W767L dock becomes visible and interactive only for the bonded active companion', () => {
  assert.equal(deriveEonExpanseW767LCompanionDockPresentation({ expanseActive: true, bonded: false }).visible, false);
  const ready = deriveEonExpanseW767LCompanionDockPresentation({ expanseActive: true, bonded: true });
  assert.equal(ready.visible, true);
  assert.equal(ready.interactive, true);
  assert.equal(ready.action, 'dock-eonbot');
  assert.equal(ready.oneCanonicalCompanion, true);
});

test('W767L dock request is explicit and blocked during Transit or route guidance', () => {
  assert.equal(validateEonExpanseW767LCompanionDockRequest({ expanseActive: true, bonded: true }).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW767LCompanionDockRequest({ explicitUserAction: true, expanseActive: true, bonded: true, transitActive: true }).reason, 'expanse-transit-active');
  assert.equal(validateEonExpanseW767LCompanionDockRequest({ explicitUserAction: true, expanseActive: true, bonded: true, guideActive: true }).reason, 'explicit-guidance-active');
  const accepted = validateEonExpanseW767LCompanionDockRequest({ explicitUserAction: true, expanseActive: true, bonded: true });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.grantsXp, false);
  assert.equal(accepted.mutatesMissionState, false);
});

test('W767L Gateway Overlook owns one physical dock and routes it through existing companion behavior', async () => {
  const gateway = await read('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js');
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const behavior = await read('../../assets/js/city/w766/eon-expanse-w767g-companion-behavior.js');
  assert.match(gateway, /w767l-eonbot-dock-root/);
  assert.match(gateway, /kind: 'expanse-companion-dock'/);
  assert.match(gateway, /action: 'dock-eonbot'/);
  assert.match(gateway, /gateway-overlook\.w767l\.v5/);
  assert.match(gateway, /deriveEonExpanseW767LCompanionDockPresentation/);
  assert.match(gateway, /companion-dock-handler-unavailable/);
  assert.match(runtime, /validateEonExpanseW767LCompanionDockRequest/);
  assert.match(runtime, /w767l-companion-dock/);
  assert.match(runtime, /detail\.explicitUserAction === true/);
  assert.match(runtime, /grantsXp: false/);
  assert.match(runtime, /automaticDocking: false/);
  assert.match(behavior, /'dock-recharge'/);
  assert.match(behavior, /action\.includes\('dock'\)/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});
