import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  collectLocalEncryptedExportRecords,
  createEncryptedLocalExport,
  decryptLocalExport,
  restoreLocalEncryptedExportPayload,
  getLocalEncryptedExportTruth
} from '../../assets/js/local-first/eon-local-encrypted-export.js';
import { assessEonDevice } from '../../assets/js/device/eon-device-check.js';
import { clearRuntimeErrors, listRuntimeErrors, recordRuntimeError } from '../../assets/js/utils/runtime-error-telemetry.js';
import { createDevRouteRewrites } from '../../config/route-contract.mjs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

function storage(seed = {}) {
  const values = new Map(Object.entries(seed));
  return {
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] || null; },
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); }
  };
}

test('W197 encrypted backup only includes safe allowlisted records and restores without secrets', async () => {
  {
    const source = storage({
      'eon:chat:history:v2': JSON.stringify({ title: 'Safe conversation', apiKey: 'must-remove' }),
      'eon:automation-os:v3': JSON.stringify({ workflows: [{ id: 'flow-1', label: 'Safe', accessToken: 'must-remove' }] }),
      'eon:city:world-state:v1': JSON.stringify({ citySeed: 'visual-layout-seed', avatar: { x: 0.5, y: 0.8 }, wallet: 'must-remove' }),
      'eon:realm:state:v3': JSON.stringify({ label: 'Safe local Realm', handle: 'safe-realm', showcaseRefs: ['private-v3-safe-preview'], safety: { payoutActive: false, apiKey: 'must-remove' } }),
      'eon:api-key-vault:v1': 'never-export',
      'eon:profile:secret': 'never-export',
      'random-key': 'never-export'
    });
    const records = collectLocalEncryptedExportRecords({ storage: source });
    assert.equal(records.length, 4);
    assert.doesNotMatch(JSON.stringify(records), /must-remove|never-export/);
    const backup = await createEncryptedLocalExport('twelve-character-passphrase', { storage: source, now: 100 });
    assert.equal(backup.automaticCrossDeviceSync, false);
    const payload = await decryptLocalExport(backup, 'twelve-character-passphrase');
    assert.equal(payload.records.length, 4);
    const target = storage();
    const result = restoreLocalEncryptedExportPayload(payload, { storage: target });
    assert.equal(result.ok, true);
    assert.equal(target.getItem('eon:api-key-vault:v1'), null);
    assert.doesNotMatch(target.getItem('eon:chat:history:v2'), /must-remove/);
    assert.match(target.getItem('eon:city:world-state:v1'), /visual-layout-seed/);
    assert.doesNotMatch(target.getItem('eon:city:world-state:v1'), /must-remove/);
    assert.match(target.getItem('eon:realm:state:v3'), /Safe local Realm/);
    assert.match(target.getItem('eon:realm:state:v3'), /private-v3-safe-preview/);
    assert.doesNotMatch(target.getItem('eon:realm:state:v3'), /must-remove|apiKey/);
    assert.match(getLocalEncryptedExportTruth({ storage: source }).note, /does not upload, mirror, or synchronize/i);
  }
});

test('W198/W360 ship a clean optional Spatial Command Space and clean current City routes', () => {
  const entry = read('eoncity-3d.html');
  const station = read('assets/js/eon-city-3d-station.js');
  const redirects = read('_redirects');
  const vite = read('vite.config.mjs');
  const operator = read('assets/js/eon-operator-map.js');
  const runtimeFiles = [
    'assets/js/city/eon-city-3d-renderer.js',
    'assets/js/city/eon-city-3d-model.js',
    'assets/js/eon-city-3d-station.js',
    'assets/js/eon-city-play-station.js'
  ].map(read).join('\n');
  assert.match(entry, /data-eon-city-3d-root/);
  assert.match(station, /Enter the optional Spatial Command Space/i);
  assert.match(station, /does not introduce a second inventory, game economy, NPC crowd, market, reward loop, or background simulation/i);
  assert.doesNotMatch(redirects, /^\/eoncity\/tour\s/m); // concrete clean routes are emitted at build time, avoiding a self-rewrite loop
  assert.match(vite, /createDevRouteRewrites/);
  assert.equal(createDevRouteRewrites().get('/eoncity/tour'), '/eoncity-3d.html');
  assert.equal(createDevRouteRewrites().get('/eoncity/3d'), '/eoncity-3d.html');
  assert.match(operator, /\/eoncity\/tour\?world=/);
  assert.doesNotMatch(runtimeFiles, /eon-browser\.html|marketplace\.html|workbench\.html|realmworld\.html|reward-access\.html/);
});

test('W200 records only bounded redacted runtime evidence locally', () => {
  const store = storage();
  clearRuntimeErrors({ storage: store });
  const entry = recordRuntimeError({ message: 'API key ABCD failed at https://example.test/?token=secret', page: '/chat?token=abc' }, { storage: store, now: 100 });
  assert.match(entry.message, /\[redacted\]/i);
  assert.doesNotMatch(entry.message, /ABCD|secret/);
  const events = listRuntimeErrors({ storage: store });
  assert.equal(events.length, 1);
  assert.equal(events[0].page, '/chat');
});

test('W201 has a local device readiness lab without collection claims', () => {
  const report = assessEonDevice({
    now: 100,
    navigator: { deviceMemory: 2, hardwareConcurrency: 2, maxTouchPoints: 1, onLine: true, connection: { saveData: true } },
    matchMedia: () => ({ matches: false }),
    webgl: { webgl: false, webgl2: false }
  });
  assert.equal(report.cityRecommendation, '2D recommended');
  const page = read('profile.html');
  const deviceScript = read('assets/js/device/eon-device-check.js');
  const shell = read('assets/js/eon-app-shell.js');
  assert.match(page, /id="eon-profile-device-card"/);
  assert.match(page, /Open local AI setup/);
  assert.match(deviceScript, /does not send hardware data/i);
  assert.match(shell, /initEonRuntimeErrorTelemetry/);
});
