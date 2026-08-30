#!/usr/bin/env node
/** W393/W429 static gate: one functional Command Deck inside Babylon. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRouteRow } from '../config/route-contract.mjs';
import { getCommandDeckCards, getCommandDeckPanel, getCommandDeckSummary, validateCommandDeckCards } from '../assets/js/city/eon-city-command-deck.js';
import { W393_COMMAND_DECK_CONTRACT, validateW393CommandDeckContract } from '../config/w393-command-deck-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const ensure = (value, message) => assert.equal(Boolean(value), true, message);

export function inspectW393CommandDeck() {
  const station = read('assets/js/eon-city-play-station.js');
  const scene = read('assets/js/city/eon-city-play-babylon.js');
  const css = read('assets/css/eon-city-play.css');
  const cards = getCommandDeckCards();
  const checks = [];
  const check = (id, value, detail) => { checks.push({ id, pass: Boolean(value), detail }); ensure(value, `${id}: ${detail}`); };

  check('contract-valid', validateW393CommandDeckContract().length === 0, 'Command Deck contract has no internal violations');
  check('card-contract-valid', validateCommandDeckCards(cards).ok, 'Command Deck cards remain compact and locally bounded');
  check('city-route', getRouteRow('/eoncity')?.lifecycle === 'direct-babylon-city', 'Command Deck uses the canonical direct Babylon City route');
  check('seven-stations', cards.length === 7 && ['eonbot', 'forge', 'projects', 'library', 'vault', 'missions', 'settings'].every((id) => cards.some((card) => card.id === id)), 'Deck exposes the required real station set');
  check('native-second-click', cards.filter((card) => card.kind === 'native-route').every((card) => Boolean(getCommandDeckPanel(card.id)?.confirmationRequired)), 'Native City exits require a separate visible confirmation');
  check('in-world-stations', ['eonbot', 'missions', 'settings'].every((id) => getCommandDeckPanel(id)?.kind === 'in-world'), 'EONBOT, Mission Board and City Settings stay in the current world');
  check('station-panel', /data-eon-play-command-deck-panel/.test(station) && /data-eon-play-open-command-deck/.test(station), 'City station exposes a visible Command Deck panel and user action');
  check('station-review-first', /data-eon-play-command-deck-card/.test(station) && /data-eon-play-command-deck-confirm/.test(station) && /second visible click/.test(station), 'Deck reviews a station before native routing');
  check('station-local-panels', /data-eon-play-command-deck-local/.test(station) && /data-eon-play-mission-board-panel/.test(station) && /data-eon-play-open-eonbot/.test(station), 'Local stations open functional in-world panels');
  check('station-no-auto-navigation', !/location\.assign|window\.location/.test(station), 'City station does not programmatically navigate from Command Deck');
  check('scene-integrated', /addCommandDeckDisplays/.test(scene) && /COMMAND DECK/.test(scene) && /focusCommandDeck\(\)/.test(scene), 'Babylon scene contains an integrated Command Deck and local focus method');
  check('scene-local-boundary', /displaysPrivateWork: false/.test(scene) && !/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/.test(scene), 'Babylon Deck stays local and does not read or transmit private work');
  check('deck-css', /eon-play-command-deck-panel/.test(css) && /eon-play-command-deck-detail/.test(css) && /safe-area-inset/.test(css), 'Deck has responsive safe-area-aware panel styles');
  check('summary-boundary', getCommandDeckSummary().localOnly && !getCommandDeckSummary().commerce && !getCommandDeckSummary().rewards && !getCommandDeckSummary().socialConnectors, 'Deck summary rejects commerce, rewards and social connectors');

  return Object.freeze({
    schema: 'eonapp.w429.command-deck-gate.v3',
    wave: W393_COMMAND_DECK_CONTRACT.wave,
    status: 'pass',
    checkCount: checks.length,
    checks,
    limitations: Object.freeze([
      'Static source verification only.',
      'No real device walkthrough, Babylon screenshot, interaction proof, social connection, reward, commercial or provider action was performed.'
    ])
  });
}

export function runW393CommandDeckGate({ writeArtifact = true } = {}) {
  const result = inspectW393CommandDeck();
  if (writeArtifact) {
    const directory = path.join(root, 'artifacts', 'w393-command-deck-gate');
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, 'stats.json'), `${JSON.stringify(result, null, 2)}\n`);
  }
  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runW393CommandDeckGate();
  process.stdout.write(`W429 Command Deck gate passed (${result.checkCount}/${result.checkCount}).\n`);
}
