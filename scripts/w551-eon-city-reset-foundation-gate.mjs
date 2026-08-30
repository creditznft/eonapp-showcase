#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(path.join(root, file), 'utf8');
const exists = (file) => existsSync(path.join(root, file));

const checks = [];
const check = (id, condition, detail) => {
  checks.push({ id, pass: Boolean(condition), detail });
  assert.equal(Boolean(condition), true, `${id}: ${detail}`);
};

const play = read('assets/js/city/eon-city-play-babylon.js');
const station = read('assets/js/eon-city-play-station.js');
const pkg = JSON.parse(read('package.json'));

check('pose-module-exists', exists('assets/js/contracts/city/eon-city-exploration-pose.js'), 'engine-agnostic exploration pose module exists');
check('pose-module-imported', /captureEonCityExplorationPose/.test(play) && /normalizeEonCityExplorationPose/.test(play), 'Babylon runtime captures and restores exploration pose');
check('runtime-exposes-pose-continuity', /getExplorationPose\(\)/.test(play) && /restoreExplorationPose\(pose/.test(play), 'runtime exposes explicit pose capture and restore methods');
check('command-deck-restores-pose', /let explorationPose = null/.test(station) && /runtime\?\.restoreExplorationPose\?\.\(explorationPose\)/.test(station), 'Command Deck restores the player view when the panel closes');
check('public-hud-hides-evidence', /previewMode \? '' : ' hidden'/.test(station) && /previewMode \? '<button type="button" data-eon-play-save-proof>Save local frame note<\/button>' : ''/.test(station), 'frame evidence UI is hidden outside explicit preview evidence mode');
check('package-script-wired', pkg.scripts['qa:w551-eon-city-reset-foundation'] === 'node scripts/w551-eon-city-reset-foundation-gate.mjs && node --test tests/unit/w551-eon-city-exploration-pose.test.mjs', 'W551 QA script is wired');

process.stdout.write(`W551 EON City reset foundation passed (${checks.length}/${checks.length}).\n`);
