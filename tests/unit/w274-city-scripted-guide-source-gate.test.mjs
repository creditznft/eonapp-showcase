import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { CITY_SCRIPTED_GUIDE_SCHEMA, getCityScriptedGuideCard } from '../../assets/js/city/city-scripted-guide.js';

const root = process.cwd();
const gate = path.join(root, 'scripts', 'w274-city-scripted-guide-source-gate.mjs');
const guidePath = path.join(root, 'assets', 'js', 'city', 'city-scripted-guide.js');

test('W274 compiles finite local orientation from an allowlisted landmark only', () => {
  const card = getCityScriptedGuideCard('command-centre');
  assert.equal(card.schema, CITY_SCRIPTED_GUIDE_SCHEMA);
  assert.equal(card.kind, 'scripted-local-orientation');
  assert.equal(card.landmarkId, 'command-centre');
  assert.ok(card.message.length > 0);
  assert.ok(card.nextStep.length > 0);
  assert.equal(Object.hasOwn(card, 'route'), false);
  assert.match(card.boundaries.join(' '), /never opens a route/i);
});

test('W274 keeps unknown City orientation local and non-actionable', () => {
  const card = getCityScriptedGuideCard('not-a-real-landmark');
  assert.equal(card.landmarkId, null);
  assert.equal(card.kind, 'scripted-local-orientation');
  assert.match(card.nextStep, /separate review/i);
  assert.equal(Object.hasOwn(card, 'action'), false);
});

test('W274 source gate passes and fails closed if no-route boundary is removed', () => {
  execFileSync(process.execPath, [gate], { cwd: root, stdio: 'pipe' });
  const original = fs.readFileSync(guidePath, 'utf8');
  try {
    fs.writeFileSync(guidePath, original.replace('It never opens a route, confirms a work action, or starts a background task.', 'It may start a background task.'));
    const result = spawnSync(process.execPath, [gate], { cwd: root, encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /explicitBoundary/);
  } finally {
    fs.writeFileSync(guidePath, original);
  }
});
