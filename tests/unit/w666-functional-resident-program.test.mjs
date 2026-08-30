import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_W659G_NPC_OPERATORS,
  validateEonCityW659gNpcOperators
} from '../../assets/js/city/w659g/eon-city-w659g-npc-operator-registry.js';
import {
  EON_CITY_W660I_TERMINALS,
  validateEonCityW660iTerminals
} from '../../assets/js/city/w660i/eon-city-w660i-terminal-registry.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W666 every shipped resident role owns explicit review-first product actions', () => {
  const validation = validateEonCityW659gNpcOperators();
  assert.equal(validation.ok, true, validation.errors?.join('\n'));
  assert.equal(EON_CITY_W659G_NPC_OPERATORS.length, 13);
  for (const resident of EON_CITY_W659G_NPC_OPERATORS) {
    assert.ok(resident.label);
    assert.ok(resident.assetId);
    assert.ok(resident.prompt);
    assert.ok(resident.actions.length >= 1, resident.id);
    for (const action of resident.actions) {
      assert.equal(action.reviewRequired, true, `${resident.id}:${action.id}`);
      assert.equal(action.explicitUserAction, true, `${resident.id}:${action.id}`);
      assert.equal(action.autoExecute, false, `${resident.id}:${action.id}`);
      assert.equal(action.autoNavigate, false, `${resident.id}:${action.id}`);
    }
  }
});

test('W666 all authored district terminals remain exact, review-first functional targets', () => {
  const validation = validateEonCityW660iTerminals();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.ok(EON_CITY_W660I_TERMINALS.length >= 20);
  for (const terminal of EON_CITY_W660I_TERMINALS) {
    assert.ok(terminal.actions.length >= 2, terminal.id);
    assert.equal(terminal.autoExecute, false);
    assert.equal(terminal.autoNavigate, false);
  }
});

test('W666 visible terminal screens and NPC meshes carry exact world-pick identities', () => {
  const composition = read('assets/js/city/w660i/eon-city-w660i-district-composition.js');
  const district = read('assets/js/city/w649/eon-city-w649-district-runtime.js');
  assert.match(composition, /interactionKind: 'terminal'/);
  assert.match(composition, /assetId: terminal\.id/);
  assert.match(composition, /terminalId: terminal\.id/);
  assert.match(district, /interactiveCharacter \? 'npc'/);
  assert.match(district, /w649-district-npc-mesh/);
});

test('W666 direct picks show only the selected resident, terminal or station actions', () => {
  const product = read('assets/js/city/w659n/eon-city-w659n-product-layer.js');
  assert.match(product, /findOperatorForAsset/);
  assert.match(product, /findTerminalForAsset/);
  assert.match(product, /findStationForAsset/);
  assert.match(product, /Only this resident's actions are shown/);
  assert.match(product, /Only this terminal's actions are shown/);
  assert.match(product, /Transit cannot replace an NPC interaction/);
  assert.match(product, /Resident interaction/);
  assert.match(product, /Terminal interaction/);
  assert.match(product, /focusedInteraction \? \[focusedInteraction\] : getNearbyCandidates\(\)/);
});
