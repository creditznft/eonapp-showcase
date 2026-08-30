import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_TRUTHFUL_COMMAND_CENTER_FAMILIES,
  EON_CITY_TRUTHFUL_COMMAND_CENTER_STATES,
  createEonCityTruthfulCommandCenterController,
  getEonCityTruthfulCommandCenterSnapshot,
  loadEonCityTruthfulCommandCenterSnapshot,
  validateEonCityTruthfulCommandCenterSnapshot
} from '../../assets/js/city/eon-city-truthful-command-center.js';
import { EON_PROJECTS_STORAGE_KEY } from '../../assets/js/utils/eon-workspace-store.js';
import { EONBOT_JOB_FABRIC_STORAGE_KEY } from '../../assets/js/chat/eonbot-job-fabric.js';
import { EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { validateW624hTruthfulCommandCenterContract } from '../../config/w624h-truthful-command-center-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const memoryStorage = (seed = {}) => { const data = new Map(Object.entries(seed).map(([key, value]) => [key, JSON.stringify(value)])); return { getItem: (key) => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key) }; };

function populatedStorage(now = 1_770_000_000_000) {
  return memoryStorage({
    [EON_PROJECTS_STORAGE_KEY]: { updatedAt: now - 1000, projects: [{ id: 'p1', name: 'SECRET PROJECT', content: 'SECRET CONTENT', updatedAt: now - 1000 }] },
    [EONBOT_JOB_FABRIC_STORAGE_KEY]: { updatedAt: now - 2000, jobs: [{ id: 'j1', state: 'ready-for-review', label: 'SECRET JOB', prompt: 'SECRET PROMPT', updatedAt: now - 2000 }] },
    [EON_CITY_PRODUCTIVE_RPG_STORAGE_KEY]: { missions: { 'local-ai-byok': { outcome: { verified: true, kind: 'local-ai-self-test', verifiedAt: now - 3000 } }, 'vault-recovery': { outcome: { verified: true, kind: 'backup-readiness-receipt', verifiedAt: now - 4000 } } } }
  });
}

test('W624H defines six status families and seven honest states', () => {
  assert.deepEqual(EON_CITY_TRUTHFUL_COMMAND_CENTER_FAMILIES.map((entry) => entry.id), ['projects', 'ai-runtime', 'jobs', 'billing', 'backup', 'outcomes']);
  assert.deepEqual(EON_CITY_TRUTHFUL_COMMAND_CENTER_STATES, ['loading', 'current', 'empty', 'stale', 'offline', 'unavailable', 'error']);
  const snapshot = getEonCityTruthfulCommandCenterSnapshot({ storage: memoryStorage(), now: 1000 });
  assert.equal(validateEonCityTruthfulCommandCenterSnapshot(snapshot).ok, true);
  assert.equal(snapshot.cards.length, 6);
});

test('W624H projects bounded counts and receipts without private work', () => {
  const snapshot = getEonCityTruthfulCommandCenterSnapshot({ storage: populatedStorage(), now: 1_770_000_000_000 });
  assert.equal(snapshot.cards.find((entry) => entry.id === 'projects').count, 1);
  assert.equal(snapshot.cards.find((entry) => entry.id === 'jobs').count, 1);
  assert.equal(snapshot.cards.find((entry) => entry.id === 'ai-runtime').state, 'current');
  const serialized = JSON.stringify(snapshot);
  assert.doesNotMatch(serialized, /SECRET PROJECT|SECRET CONTENT|SECRET JOB|SECRET PROMPT/);
  assert.equal(snapshot.readsPrivateWork, false);
  assert.equal(snapshot.mutationAllowed, false);
});

test('W624H billing status is server-authoritative with empty, current, offline and error truth', async () => {
  const now = 1_770_000_000_000;
  const empty = await loadEonCityTruthfulCommandCenterSnapshot({ now: () => now, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ ok: true, account: { signedIn: false, entitlement: null } }) }) });
  assert.equal(empty.cards.find((entry) => entry.id === 'billing').state, 'empty');
  const current = await loadEonCityTruthfulCommandCenterSnapshot({ now: () => now, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ ok: true, account: { signedIn: true, accountId: 'SECRET', entitlement: { tier_id: 'studio', status: 'active', updated_at: new Date(now - 1000).toISOString() } } }) }) });
  assert.equal(current.cards.find((entry) => entry.id === 'billing').state, 'current');
  assert.doesNotMatch(JSON.stringify(current), /SECRET/);
  const offline = await loadEonCityTruthfulCommandCenterSnapshot({ now: () => now, fetchImpl: async () => { throw new TypeError('offline'); } });
  assert.equal(offline.cards.find((entry) => entry.id === 'billing').state, 'offline');
  const error = await loadEonCityTruthfulCommandCenterSnapshot({ now: () => now, fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({ ok: false }) }) });
  assert.equal(error.cards.find((entry) => entry.id === 'billing').state, 'error');
});

test('W624H requires explicit review and explicit server refresh', async () => {
  const controller = createEonCityTruthfulCommandCenterController({ storage: populatedStorage(), now: () => 1_770_000_000_000, fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ ok: true, account: { signedIn: false, entitlement: null } }) }) });
  assert.equal(controller.review('projects').reason, 'explicit-valid-review-required');
  assert.equal(controller.review('projects', { explicitUserAction: true }).snapshot.selectedId, 'projects');
  assert.equal((await controller.refresh()).reason, 'explicit-refresh-required');
  assert.equal((await controller.refresh({ explicitUserAction: true })).ok, true);
  assert.equal(controller.getSnapshot().cards.find((entry) => entry.id === 'billing').state, 'empty');
  assert.equal(controller.dispose().disposed, true);
});

test('W624H source contains one same-origin read and no product or commercial mutation', () => {
  const source = read('assets/js/city/eon-city-truthful-command-center.js');
  assert.match(source, /fetchImpl\('\/api\/billing\/status'/);
  assert.doesNotMatch(source, /setItem\(|removeItem\(|checkout|grantReward|location\.(?:assign|replace)/);
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(station, /bindTruthfulCommandCenter/);
  assert.match(station, /data-eon-truth-refresh/);
  assert.match(station, /data-eon-truth-review-button/);
  assert.match(station, /data-eon-truth-route/);
});

test('W624H gate preserves W624B-G and the review-first Command Room boundary', async () => {
  const gate = await validateW624hTruthfulCommandCenterContract();
  assert.equal(gate.ok, true, gate.checks.filter((entry) => !entry.pass).map((entry) => entry.id).join(', '));
  assert.ok(gate.total >= 30);
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(station, /bindProductiveRpgLoop/);
  assert.match(station, /bindCommandDistrictNpcSystem/);
  assert.match(station, /bindEonbotOrbitCompanion/);
  assert.match(read('assets/css/eon-city-play.css'), /W624H · read-only Truthful Command Center/);
});
