import assert from 'node:assert/strict';
import test from 'node:test';
import { W479_CITY_REALM_PLAYABLE_SCHEMA, W479_CITY_REQUIRED_SURFACES, W479_CITY_TRUTH, validateW479CityRealmPlayableContract } from '../../config/w479-city-realm-playable-contract.mjs';
import { EON_CITY_FIRST_RUN_PATHS, dismissEonCityFirstRun, readEonCityFirstRun, selectEonCityFirstRunPath, validateEonCityFirstRunPaths } from '../../assets/js/city/eon-city-first-run.js';
import { inspectW479CityRealmPlayable } from '../../scripts/w479-city-realm-playable-gate.mjs';

function memoryStorage() {
  const records = new Map();
  return {
    getItem(key) { return records.has(key) ? records.get(key) : null; },
    setItem(key, value) { records.set(key, String(value)); },
    removeItem(key) { records.delete(key); }
  };
}

test('W479 preserves the truthful City/Realm playable boundary', () => {
  assert.equal(validateW479CityRealmPlayableContract().length, 0);
  assert.equal(W479_CITY_REALM_PLAYABLE_SCHEMA, 'eonapp.w479.city-realm-playable.v1');
  assert.ok(W479_CITY_REQUIRED_SURFACES.some((surface) => surface.id === 'direct-city' && surface.route === '/eoncity'));
  assert.equal(W479_CITY_TRUTH.socialPublishing, false);
  assert.equal(W479_CITY_TRUTH.mediaGeneration, false);
  assert.equal(W479_CITY_TRUTH.deviceEvidenceRequired, true);
});

test('W479 City first-run guide is three simple explicit local paths', () => {
  assert.equal(validateEonCityFirstRunPaths().ok, true);
  assert.deepEqual(EON_CITY_FIRST_RUN_PATHS.map((path) => path.id), ['plan-project', 'create-post', 'set-up-local-ai']);
  assert.equal(EON_CITY_FIRST_RUN_PATHS.find((path) => path.id === 'set-up-local-ai')?.route, '/local-ai#eonbot-local-ai-setup');
  assert.equal(EON_CITY_FIRST_RUN_PATHS.find((path) => path.id === 'set-up-local-ai')?.label, 'Make Local AI ready');
  const storage = memoryStorage();
  assert.equal(readEonCityFirstRun({ storage }).status, 'new');
  const selected = selectEonCityFirstRunPath('create-post', { storage, now: 0 });
  assert.equal(selected.ok, true);
  assert.equal(selected.path.route, '/workspace#creator-engine');
  assert.equal(readEonCityFirstRun({ storage }).selectedPathId, 'create-post');
  const dismissed = dismissEonCityFirstRun({ storage, now: 1 });
  assert.equal(dismissed.ok, true);
  assert.equal(readEonCityFirstRun({ storage }).status, 'dismissed');
  assert.equal(selectEonCityFirstRunPath('unknown', { storage }).ok, false);
});

test('W479 source gate remains proof-aware and non-commercial', () => {
  const report = inspectW479CityRealmPlayable({ writeArtifact: false });
  assert.equal(report.sourceStatus, 'pass');
  assert.equal(report.releaseStatus, 'source-foundation-only-device-and-browser-evidence-pending');
  assert.equal(report.truth.walletOrMarketplace, false);
});
