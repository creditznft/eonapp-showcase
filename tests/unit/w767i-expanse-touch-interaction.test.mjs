import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  deriveEonExpanseW767ITouchInteraction,
  validateEonExpanseW767IInteractionDispatch
} from '../../assets/js/city/w766/eon-expanse-w767i-touch-interaction.js';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const target = { id: 'npc:navigator', label: 'Meet Navigator', distance: 3.6, privatePrompt: 'must-not-project' };

test('W767I exposes the nearest valid interaction only on an active coarse-pointer frontier', () => {
  const view = deriveEonExpanseW767ITouchInteraction({ coarsePointer: true, expanseActive: true, nearestInteraction: target });
  assert.equal(view.active, true);
  assert.equal(view.target.id, 'npc:navigator');
  assert.equal(view.buttonText, 'Meet Navigator · 4 m');
  assert.equal(view.keyboardHintAllowed, false);
  assert.equal(view.canonicalNearestDispatch, true);
  assert.equal(view.storesPrivateContent, false);
  assert.equal('privatePrompt' in view.target, false);
});

test('W767I hides touch interaction for desktop, Transit, mission-board display and absent targets', () => {
  const base = { coarsePointer: true, expanseActive: true, nearestInteraction: target };
  assert.equal(deriveEonExpanseW767ITouchInteraction({ ...base, coarsePointer: false }).active, false);
  assert.equal(deriveEonExpanseW767ITouchInteraction({ ...base, transitActive: true }).active, false);
  assert.equal(deriveEonExpanseW767ITouchInteraction({ ...base, boardOpen: true }).active, false);
  assert.equal(deriveEonExpanseW767ITouchInteraction({ ...base, nearestInteraction: null }).active, false);
  assert.equal(deriveEonExpanseW767ITouchInteraction({ ...base, expanseActive: false }).active, false);
});

test('W767I interaction dispatch requires explicit action and rejects stale target identity', () => {
  const base = { explicitUserAction: true, expanseActive: true, transitActive: false, currentTargetId: 'npc:navigator' };
  assert.equal(validateEonExpanseW767IInteractionDispatch({ ...base, explicitUserAction: false }).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW767IInteractionDispatch({ ...base, expanseActive: false }).reason, 'expanse-not-active');
  assert.equal(validateEonExpanseW767IInteractionDispatch({ ...base, transitActive: true }).reason, 'expanse-transit-active');
  assert.equal(validateEonExpanseW767IInteractionDispatch({ ...base, expectedTargetId: 'npc:pathfinder' }).reason, 'expanse-interaction-target-changed');
  assert.equal(validateEonExpanseW767IInteractionDispatch({ ...base, expectedTargetId: 'npc:navigator' }).ok, true);
});

test('W767I touch, keyboard and public controls share one canonical nearest-interaction action', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const overlay = await read('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js');
  const gateway = await read('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js');
  assert.match(runtime, /let interactNearestExpanseAction =/);
  assert.match(runtime, /onInteractNearest: \(options = \{\}\) => interactNearestExpanseAction\(options\)/);
  assert.match(runtime, /interactNearestExpanseAction\(\{ explicitUserAction: true, source: 'keyboard-e' \}\)/);
  assert.match(runtime, /return interactNearestExpanseAction\(\{ explicitUserAction, expectedTargetId, source \}\)/);
  assert.match(runtime, /if \(expanseWorldMode\.getState\(\)\.mode === 'EXPANSE_ACTIVE'\)/);
  assert.match(runtime, /resolveExpansePointerInteraction\(pickedMesh\)/);
  assert.match(runtime, /canonicalCompanionFallback/);
  assert.match(runtime, /source: 'expanse-3d-pick'/);
  assert.match(runtime, /expanse-owned:\$\{expanseResolved\.targetId\}/);
  assert.match(runtime, /keyboardHint: Boolean\(!coarsePointer/);
  assert.match(overlay, /data-eon-expanse-ui':'touch-interact'/);
  assert.match(overlay, /expectedTargetId, source: 'touch-hud'/);
  assert.match(overlay, /renderInteraction\(\)/);
  assert.match(gateway, /expected && expected !== candidate\.targetId/);
  assert.match(gateway, /source = 'expanse-proximity'/);
  assert.equal((runtime.match(/new Engine\s*\(/g) || []).length, 1);
  assert.equal((runtime.match(/new Scene\s*\(/g) || []).length, 1);
});

test('W767I preserves the one-primary two-nearby label budget while suppressing duplicate E hints on touch', async () => {
  const runtime = await read('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /maxPrimary: 1, maxNearby: 2/);
  assert.match(runtime, /expanseUiOverlay\.updateInteraction\?\.\(\{/);
  assert.match(runtime, /target: lastExpanseLabelSummary\.nearestInteraction/);
  assert.match(runtime, /coarsePointer = Boolean\(globalThis\.matchMedia/);
});
