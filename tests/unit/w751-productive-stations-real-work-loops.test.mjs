import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W751_ACTIVITY_STORAGE_KEY,
  EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA,
  EON_CITY_W751_STATION_LOOPS,
  EON_CITY_W751_VIEW_EVENT,
  createEonCityW751ProductiveStations,
  getEonCityW751StationLoop,
  projectEonCityW751ProductiveStations,
  readEonCityW751StationActivity,
  validateEonCityW751ProductiveStations
} from '../../assets/js/city/w751/eon-city-w751-productive-stations.js';
import { EON_CITY_W731_STATIONS } from '../../assets/js/city/w731/eon-city-w731-command-hub-contract.js';
import { getEonCityProductiveRpgPlan, recordEonCityProductiveRpgOutcome } from '../../assets/js/contracts/city/eon-city-productive-rpg-loop.js';
import { recordEonCoreOutcome } from '../../assets/js/contracts/outcomes/eon-core-outcome-authority.js';
import { listVerifiedEonCityProgressReceipts, syncEonCoreOutcomesToCity } from '../../assets/js/contracts/city/eon-city-progress-bridge.js';
import { renderEonCityW751StationWorkLoop } from '../../assets/js/work-surface/eon-station-work-loop.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const memoryStorage = () => { const data = new Map(); return { getItem: (key) => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: (key) => data.delete(key), dump: () => data }; };
class FakeCustomEvent extends Event { constructor(type, options = {}) { super(type); this.detail = options.detail; } }

function environment() {
  const target = new EventTarget();
  target.CustomEvent = FakeCustomEvent;
  return target;
}

test('W751 defines ten distinctive three-step loops over the existing station authority', () => {
  const validation = validateEonCityW751ProductiveStations();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(validation.schema, EON_CITY_W751_PRODUCTIVE_STATIONS_SCHEMA);
  assert.equal(validation.stationCount, 10);
  assert.deepEqual(EON_CITY_W751_STATION_LOOPS.map((entry) => entry.stationId), EON_CITY_W731_STATIONS.map((entry) => entry.id));
  assert.equal(new Set(EON_CITY_W751_STATION_LOOPS.map((entry) => entry.title)).size, 10);
  for (const loop of EON_CITY_W751_STATION_LOOPS) {
    assert.equal(loop.steps.length, 3, loop.stationId);
    assert.equal(new Set(loop.steps.map((step) => step.id)).size, 3, loop.stationId);
    assert.equal(loop.automaticExecution, false);
    assert.equal(loop.automaticNavigation, false);
    assert.equal(loop.privateDataRead, false);
    assert.equal(loop.reward, null);
  }
});

test('W751 verifies Core-backed stations only from a current validated Core progress receipt', () => {
  const storage = memoryStorage();
  let view = projectEonCityW751ProductiveStations({ productivePlan: getEonCityProductiveRpgPlan({ storage }), missionView: [], activity: readEonCityW751StationActivity(storage), progressReceipts: listVerifiedEonCityProgressReceipts({ storage }) });
  assert.equal(view.verifiedCount, 0);
  assert.equal(getEonCityW751StationLoop(view, 'project-atlas').completionClaimed, false);

  // Historical W624G state is compatibility data, not current claim authority.
  const legacy = recordEonCityProductiveRpgOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'project-shell:w751-legacy', verified: true, verifiedAt: 751000 }, { storage, now: 751000 });
  assert.equal(legacy.ok, true);
  view = projectEonCityW751ProductiveStations({ productivePlan: getEonCityProductiveRpgPlan({ storage }), missionView: [], activity: readEonCityW751StationActivity(storage), progressReceipts: listVerifiedEonCityProgressReceipts({ storage }) });
  assert.notEqual(getEonCityW751StationLoop(view, 'project-atlas').state, 'verified');

  const outcome = recordEonCoreOutcome({ kind: 'project-shell', route: '/projects', source: 'projects-local', receiptId: 'project-shell:w751-core', verified: true }, { storage, now: 751010 });
  assert.equal(outcome.ok, true);
  assert.equal(syncEonCoreOutcomesToCity({ storage, now: 751020 }).ok, true);
  view = projectEonCityW751ProductiveStations({ productivePlan: getEonCityProductiveRpgPlan({ storage }), missionView: [], activity: readEonCityW751StationActivity(storage), progressReceipts: listVerifiedEonCityProgressReceipts({ storage }) });
  const project = getEonCityW751StationLoop(view, 'project-atlas');
  assert.equal(project.state, 'verified');
  assert.equal(project.completionClaimed, true);
  assert.match(project.verifiedOutcome.receiptId, /^city-progress:/);
  assert.equal(project.verifiedOutcome.privateContentStored, false);
  for (const id of ['share-capture', 'command-console', 'my-realm-portal', 'plans-access']) assert.notEqual(getEonCityW751StationLoop(view, id).state, 'verified');
});

test('W751 records only explicit reviewed, opened and returned City activity', () => {
  const storage = memoryStorage();
  const env = environment();
  const events = [];
  env.addEventListener(EON_CITY_W751_VIEW_EVENT, (event) => events.push(event.detail));
  let now = 100;
  const controller = createEonCityW751ProductiveStations({ storage, environment: env, now: () => ++now });
  assert.equal(controller.reviewStation('create-forge').reason, 'explicit-user-action-required');
  assert.equal(storage.getItem(EON_CITY_W751_ACTIVITY_STORAGE_KEY), null);
  assert.equal(controller.reviewStation('create-forge', { explicitUserAction: true }).ok, true);
  assert.equal(controller.markOpened('create-forge', { explicitUserAction: true }).ok, true);
  assert.equal(controller.markReturned('create-forge', { explicitUserAction: true }).ok, true);
  const activity = readEonCityW751StationActivity(storage).stations['create-forge'];
  assert.ok(activity.reviewedAt > 0);
  assert.ok(activity.openedAt > 0);
  assert.ok(activity.returnedAt > 0);
  assert.equal(activity.lastAction, 'returned');
  assert.equal(activity.completionClaimed, false);
  assert.doesNotMatch(storage.getItem(EON_CITY_W751_ACTIVITY_STORAGE_KEY), /prompt|credential|projectTitle|verifiedOutcome/i);
  assert.ok(events.length >= 3);
  controller.dispose();
});

test('W751 fails closed when storage and receipt readers are unavailable', () => {
  const deniedStorage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  const env = environment();
  const controller = createEonCityW751ProductiveStations({
    storage: deniedStorage,
    environment: env,
    getProductivePlan() { throw new Error('receipt reader unavailable'); },
    getMissionView() { throw new Error('mission reader unavailable'); }
  });
  assert.equal(controller.getView().stationCount, 10);
  assert.equal(controller.getView().verifiedCount, 0);
  assert.equal(controller.reviewStation('local-ai-lab', { explicitUserAction: true }).ok, false);
  assert.doesNotThrow(() => controller.refresh('reader-fallback'));
  assert.equal(controller.getStation('local-ai-lab').completionClaimed, false);
  controller.dispose();
});

test('W751 renders accessible truthful loop guidance without private work content', () => {
  const view = projectEonCityW751ProductiveStations({ productivePlan: { missions: [] }, missionView: [], activity: { stations: {} } });
  const create = getEonCityW751StationLoop(view, 'create-forge');
  const html = renderEonCityW751StationWorkLoop(create);
  assert.match(html, /W751 · real station work loop/);
  assert.match(html, /Completion authority/);
  assert.match(html, /Review loop/);
  assert.match(html, /Check real proof/);
  assert.equal((html.match(/<li /g) || []).length, 3);
  assert.doesNotMatch(html, /api key|raw prompt|payment complete|reward earned/i);
});

test('W751 runtime, shared host, CSS, release and build gates converge without duplicate station editors', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const host = read('assets/js/work-surface/eon-work-surface-host.js');
  const helper = read('assets/js/work-surface/eon-station-work-loop.js');
  const registry = read('assets/js/contracts/work-surface/eon-work-surface-registry.js');
  const css = read('assets/css/eon-work-surface.css');
  const sw = read('sw.js');
  const publicSw = read('public/sw.js');
  const build = read('scripts/build-production.mjs');

  assert.match(runtime, /createEonCityW751ProductiveStations/);
  assert.match(runtime, /stationWorkLoop/);
  assert.match(runtime, /markOpened/);
  assert.match(runtime, /markReturned/);
  assert.match(runtime, /getProductiveStationLoops/);
  assert.match(runtime, /productiveStationStorage = null/);
  assert.match(host, /mountEonCityW751StationWorkLoop/);
  assert.match(host, /data-eon-station-work-loop-slot/);
  assert.match(host, /data-eon-work-surface-adapter-root/);
  assert.match(helper, /EON_CITY_W751_VIEW_EVENT/);
  assert.match(css, /\.eon-station-work-loop/);
  assert.match(css, /orientation:landscape/);
  assert.match(registry, /id: 'projects'/);
  assert.doesNotMatch(registry, /w751-project-editor|w751-create-editor|w751-automation-editor/);
  assert.match(sw, /RELEASE_ID = 'w765-2026-07-31-release-identity-source-template'/);
  assert.equal(publicSw, sw);
  assert.match(build, /eon\.city\.productive-stations\.w751\.v1/);
});
