import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSignalExpeditionPostcard, createSignalExpeditionSession, EON_SIGNAL_EXPEDITION_MAX_AGE_MS, getSignalExpeditionTemplates, getSignalExpeditionTruth, recordSignalExpeditionMission, validateSignalExpeditionSession } from '../../assets/js/city/eon-signal-expeditions.js';
import { EON_CITY_METROPOLIS_DISTRICTS, getMetropolisDistrictTruth, validateMetropolisDistricts } from '../../assets/js/city/eon-city-metropolis-districts.js';
import { readEonOutputShareHandoff, writeEonOutputShareHandoff } from '../../assets/js/share/eon-output-share-handoff.js';
import { inspectW413W414CityExpeditionsMetropolis } from '../../scripts/w413-w414-city-expeditions-metropolis-gate.mjs';

function memoryStorage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
}

test('W413 ships four finite authored templates and does not market an open project world', () => {
  assert.deepEqual(getSignalExpeditionTemplates().map((entry) => entry.id), ['campaign-media-district', 'forge-build-citadel', 'video-cinematic-studio', 'automation-data-observatory']);
  assert.ok(getSignalExpeditionTemplates().every((entry) => entry.durationMinutes >= 5 && entry.durationMinutes <= 15 && entry.setPieces.length === 3 && entry.missions.length === 3));
  const truth = getSignalExpeditionTruth();
  assert.equal(truth.localOnly, true);
  assert.equal(truth.projectRead, false);
  assert.equal(truth.directPublishing, false);
  assert.equal(truth.referralReward, false);
  assert.equal(truth.finalVisualCertification, false);
});

test('W413 requires a visible action, validates a bounded local session, and rejects secret-like labels', () => {
  assert.throws(() => createSignalExpeditionSession({ templateId: 'campaign-media-district', projectLabel: 'draft' }), /visible user action/i);
  const now = Date.now();
  const session = createSignalExpeditionSession({ explicitUserAction: true, templateId: 'campaign-media-district', projectLabel: 'Launch draft' }, { now });
  assert.equal(validateSignalExpeditionSession(session, { now }).ok, true);
  assert.equal(session.expiresAt - session.createdAt, EON_SIGNAL_EXPEDITION_MAX_AGE_MS);
  assert.throws(() => createSignalExpeditionSession({ explicitUserAction: true, templateId: 'campaign-media-district', projectLabel: 'api key: ' + ['sk', 'cccccccccccccccccccc'].join('-') }, { now }), /credentials|secret/i);
});

test('W413 steps and postcard remain explicit, session-local, and public-safe', () => {
  const previous = globalThis.sessionStorage;
  const storage = memoryStorage();
  globalThis.sessionStorage = storage;
  try {
    const now = Date.now();
    let session = createSignalExpeditionSession({ explicitUserAction: true, templateId: 'forge-build-citadel', projectLabel: 'Landing page' }, { now });
    for (const mission of session.missions) {
      const result = recordSignalExpeditionMission(session, mission.id, { explicitUserAction: true, now });
      assert.equal(result.ok, true);
      session = result.session;
    }
    assert.equal(session.state, 'complete');
    const postcard = buildSignalExpeditionPostcard(session);
    assert.equal(postcard.origin, 'city-expedition');
    assert.equal(postcard.remixKind, 'city-postcard');
    assert.equal(postcard.boundary.publicLink, false);
    const written = writeEonOutputShareHandoff(postcard);
    assert.equal(written.ok, true);
    assert.equal(readEonOutputShareHandoff()?.origin, 'city-expedition');
  } finally {
    globalThis.sessionStorage = previous;
  }
});

test('W414 completes the three remaining Living Creator Metropolis district surfaces without activation', () => {
  assert.deepEqual(EON_CITY_METROPOLIS_DISTRICTS.map((entry) => entry.id), ['signal-tower', 'automation-observatory', 'archive-gardens']);
  assert.equal(validateMetropolisDistricts().ok, true);
  const truth = getMetropolisDistrictTruth();
  assert.equal(truth.routesUserSelected, true);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automationExecution, false);
  assert.equal(truth.collectionGrant, false);
});

test('W413/W414 gate retains source-only proof boundaries', () => {
  const report = inspectW413W414CityExpeditionsMetropolis();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.equal(report.checkCount, 15);
});
