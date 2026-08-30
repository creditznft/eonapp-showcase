import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EON_EXPANSE_W768A_BUILDING_CATALOG } from '../../assets/js/city/w768/eon-expanse-w768a-my-frontier-layout-contract.js';
import { EON_EXPANSE_W768R_ROUTE_BINDINGS, deriveEonExpanseW768RBuildingTerminal, validateEonExpanseW768RBuildingTerminal } from '../../assets/js/city/w768/eon-expanse-w768r-my-frontier-building-terminal.js';

const ready = deriveEonExpanseW768RBuildingTerminal({ plotId: 'plot-creator', buildingId: 'creator-workshop', presentationStatus: 'constructed-foundation' });

test('W768R exposes terminals only for verified constructed foundations', () => {
  assert.equal(deriveEonExpanseW768RBuildingTerminal({ plotId: 'plot-creator', buildingId: 'creator-workshop', presentationStatus: 'planned-hologram' }).available, false);
  assert.equal(ready.available, true);
  assert.equal(ready.action.stationId, 'create-forge');
  assert.equal(ready.action.surface, 'create');
});

test('W768R maps every approved building route to a maintained station and surface', () => {
  for (const building of Object.values(EON_EXPANSE_W768A_BUILDING_CATALOG)) {
    assert.ok(EON_EXPANSE_W768R_ROUTE_BINDINGS[building.nativeRoute], `${building.id}:${building.nativeRoute}`);
  }
});

test('W768R requires explicit action and rejects stale terminal identities', () => {
  assert.equal(validateEonExpanseW768RBuildingTerminal(ready).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW768RBuildingTerminal(ready, { explicitUserAction: true, expectedTerminalToken: ready.action.terminalToken, expectedPlotId: 'plot-creator', expectedBuildingId: 'creator-workshop' }).ok, true);
  assert.equal(validateEonExpanseW768RBuildingTerminal(ready, { explicitUserAction: true, expectedTerminalToken: 'changed' }).reason, 'building-terminal-changed');
});

test('W768R cannot award XP, open automatically, execute work or store private content', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768r-my-frontier-building-terminal.js', import.meta.url), 'utf8');
  assert.equal(ready.automaticOpen, false);
  assert.equal(ready.automaticExecution, false);
  assert.equal(ready.grantsXp, false);
  assert.equal(ready.privateContentStored, false);
  assert.doesNotMatch(source, /fetch\s*\(|localStorage|runRenderLoop|new\s+(?:BABYLON\.)?(?:Engine|Scene)|awardXp/);
});

test('W768R is wired through constructed-plot metadata and the canonical interaction dispatcher', () => {
  const renderer = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
  const gateway = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', import.meta.url), 'utf8');
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  assert.match(renderer, /deriveEonExpanseW768RBuildingTerminal/);
  assert.match(renderer, /expectedTerminalToken:\s*terminal\.action\.terminalToken/);
  assert.match(gateway, /action === 'open-my-frontier-building-terminal'/);
  assert.match(runtime, /validateEonExpanseW768RBuildingTerminal/);
  assert.match(runtime, /interactionSource:\s*'expanse-my-frontier-building-terminal'/);
  assert.match(runtime, /openSurfaceForStation\(validated\.action\.stationId/);
  assert.equal((runtime.match(/new\s+(?:BABYLON\.)?Engine/g) || []).length, 1);
  assert.equal((runtime.match(/new\s+(?:BABYLON\.)?Scene/g) || []).length, 1);
  assert.equal((runtime.match(/runRenderLoop/g) || []).length, 1);
});
