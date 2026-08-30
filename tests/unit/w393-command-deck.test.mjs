import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getCommandDeckCards, getCommandDeckPanel, getCommandDeckSummary, validateCommandDeckCards } from '../../assets/js/city/eon-city-command-deck.js';
import { W393_COMMAND_DECK_CONTRACT, validateW393CommandDeckContract } from '../../config/w393-command-deck-contract.mjs';
import { inspectW393CommandDeck } from '../../scripts/w393-command-deck-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W429 keeps the Command Deck inside Babylon with seven bounded stations', () => {
  assert.deepEqual(validateW393CommandDeckContract(), []);
  const validation = validateCommandDeckCards();
  assert.equal(validation.ok, true);
  assert.deepEqual(getCommandDeckCards().map((card) => card.id), ['eonbot', 'forge', 'projects', 'library', 'vault', 'missions', 'settings']);
  assert.deepEqual(getCommandDeckCards().filter((card) => card.kind === 'native-route').map((card) => card.route), ['/forge', '/projects', '/library', '/vault']);
  assert.equal(getCommandDeckPanel('forge').confirmationRequired, true);
  assert.equal(getCommandDeckPanel('eonbot').kind, 'in-world');
  assert.equal(W393_COMMAND_DECK_CONTRACT.deck.separatePublicRenderer, false);
  const summary = getCommandDeckSummary();
  assert.equal(summary.localOnly, true);
  assert.equal(summary.commerce, false);
  assert.equal(summary.rewards, false);
  assert.equal(summary.socialConnectors, false);
});

test('W429 renders review-first Command Deck actions through the Babylon route only', () => {
  const station = read('assets/js/eon-city-play-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  assert.match(station, /data-eon-play-open-command-deck/);
  assert.match(station, /data-eon-play-command-deck-panel/);
  assert.match(station, /data-eon-play-command-deck-card/);
  assert.match(station, /data-eon-play-command-deck-confirm/);
  assert.match(station, /data-eon-play-mission-board-panel/);
  assert.match(station, /runtime\?\.focusCommandDeck\?\./);
  assert.match(scene, /function addCommandDeckDisplays/);
  assert.match(scene, /COMMAND DECK/);
  assert.match(scene, /focusCommandDeck\(\)/);
  assert.match(scene, /commandDeck: true/);
  assert.doesNotMatch(station, /location\.assign|window\.location|\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/);
});

test('W429 source gate is green without claiming device gameplay proof', () => {
  const report = inspectW393CommandDeck({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.ok(report.checkCount >= 14);
  assert.match(report.limitations.join(' '), /Static source verification only/i);
});
