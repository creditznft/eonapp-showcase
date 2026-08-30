import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_AGENT_THEATRE_STATES,
  EON_CITY_AGENT_THEATRE_STORAGE_KEY,
  createEonCityGenuineAgentTheatreController,
  getEonCityGenuineAgentTheatreSnapshot,
  recordEonCityDirectByokJobReceipt,
  recordEonCityLocalJobReceipt,
  validateEonCityGenuineAgentTheatreSnapshot
} from '../../assets/js/city/eon-city-genuine-agent-theatre.js';
import { EONBOT_JOB_FABRIC_SCHEMA, EONBOT_JOB_FABRIC_STORAGE_KEY } from '../../assets/js/chat/eonbot-job-fabric.js';
import { validateW624iGenuineAgentTheatreContract } from '../../config/w624i-genuine-agent-theatre-contract.mjs';

const read = (file) => fs.readFileSync(new URL(`../../${file}`, import.meta.url), 'utf8');
const memoryStorage = (seed = {}) => {
  const map = new Map(Object.entries(seed).map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]));
  return { getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key), dump: () => Object.fromEntries(map) };
};
const now = 1_770_100_000_000;

function w435Storage() {
  return memoryStorage({
    [EONBOT_JOB_FABRIC_STORAGE_KEY]: {
      schema: EONBOT_JOB_FABRIC_SCHEMA,
      version: 1,
      updatedAt: new Date(now).toISOString(),
      jobs: [{ schema: EONBOT_JOB_FABRIC_SCHEMA, version: 1, jobId: 'eonjob_test_local_1234', state: 'ready-for-review', safeLabel: 'Local plan review', taskClass: 'research', surfaceId: 'chat', capabilityMode: 'local', capabilityAvailable: true, reviewRequired: true, attempts: 1, createdAt: new Date(now - 2000).toISOString(), updatedAt: new Date(now - 1000).toISOString() }],
      events: []
    }
  });
}

test('W624I exposes the exact eight-state lifecycle and an honest empty theatre', () => {
  assert.deepEqual(EON_CITY_AGENT_THEATRE_STATES, ['queued', 'preparing', 'waiting-for-user', 'running', 'paused', 'failed', 'cancelled', 'completed']);
  const empty = getEonCityGenuineAgentTheatreSnapshot({ storage: memoryStorage(), now: () => now });
  assert.equal(empty.empty, true);
  assert.match(empty.emptyMessage, /No genuine job receipt/);
  assert.match(empty.emptyMessage, /Local AI or EONBOT/);
  assert.equal(empty.localAiReceiptProjection, true);
  assert.equal(empty.localAiExecutionAuthority, false);
  assert.equal(empty.fakeWorkers, false);
  assert.equal(validateEonCityGenuineAgentTheatreSnapshot(empty).ok, true);
});

test('W624I adapts W435 receipts without inventing running state or progress', () => {
  const snapshot = getEonCityGenuineAgentTheatreSnapshot({ storage: w435Storage(), now: () => now });
  assert.equal(snapshot.jobCount, 1);
  assert.equal(snapshot.jobs[0].state, 'waiting-for-user');
  assert.equal(snapshot.jobs[0].rail, 'local');
  assert.equal(snapshot.jobs[0].progress, null);
  assert.equal(snapshot.jobs[0].rawPromptVisible, false);
  assert.equal(snapshot.jobs[0].rawOutputVisible, false);
});

test('W624I local adapter accepts only bounded user-triggered receipts and authoritative progress', () => {
  const storage = memoryStorage();
  assert.equal(recordEonCityLocalJobReceipt({ jobId: 'eonagentjob_local_1234', state: 'running', sourceSurface: 'local-ai' }, { storage }).reason, 'explicit-user-action-required');
  const stored = recordEonCityLocalJobReceipt({ jobId: 'eonagentjob_local_1234', state: 'running', jobType: 'local-model', safeLabel: 'Local model run', sourceSurface: 'local-ai', authoritativeProgress: true, progress: 51, supportedActions: ['pause', 'cancel'] }, { storage, now: () => now, explicitUserAction: true });
  assert.equal(stored.ok, true);
  assert.equal(stored.receipt.progress, 51);
  assert.equal(stored.networkRequestCreated, false);
  assert.ok(JSON.parse(storage.dump()[EON_CITY_AGENT_THEATRE_STORAGE_KEY]).receipts.length === 1);
});

test('W624I Direct BYOK adapter requires approval and rejects private payload fields', () => {
  const storage = memoryStorage();
  const candidate = { jobId: 'eonagentjob_byok_1234', state: 'running', jobType: 'image', safeLabel: 'Direct image request', sourceSurface: 'create' };
  assert.equal(recordEonCityDirectByokJobReceipt(candidate, { storage, explicitUserAction: true }).reason, 'direct-byok-approval-required');
  assert.equal(recordEonCityDirectByokJobReceipt({ ...candidate, prompt: 'secret prompt' }, { storage, explicitUserAction: true, explicitUserApproval: true }).reason, 'private-or-sensitive-fields-rejected');
  const approved = recordEonCityDirectByokJobReceipt(candidate, { storage, now: () => now, explicitUserAction: true, explicitUserApproval: true });
  assert.equal(approved.ok, true);
  assert.equal(approved.receipt.rail, 'direct-byok');
  assert.equal(approved.receipt.progress, null);
  assert.match(approved.receipt.leavesDevice, /approved request/);
});

test('W624I review is explicit and the controller never executes native actions', () => {
  const storage = w435Storage();
  const controller = createEonCityGenuineAgentTheatreController({ storage, now: () => now });
  const jobId = controller.getSnapshot().jobs[0].jobId;
  assert.equal(controller.review(jobId).reason, 'explicit-review-required');
  const reviewed = controller.review(jobId, { explicitUserAction: true });
  assert.equal(reviewed.ok, true);
  assert.equal(reviewed.networkRequestCreated, false);
  assert.equal(reviewed.externalActionStarted, false);
  assert.ok(reviewed.job.actions.every((entry) => entry.theatreExecutes === false));
  assert.equal(controller.dispose().disposed, true);
});

test('W624I source gate preserves W624B-H and review-first City integration', async () => {
  const result = await validateW624iGenuineAgentTheatreContract();
  assert.equal(result.ok, true, result.checks.filter((entry) => !entry.pass).map((entry) => entry.id).join(', '));
  assert.ok(result.total >= 30);
  const station = read('assets/js/eon-city-play-station.js');
  assert.match(station, /bindGenuineAgentTheatre/);
  assert.match(station, /data-eon-genuine-agent-review-button/);
  assert.match(station, /data-eon-agent-native-route/);
  assert.match(station, /bindTruthfulCommandCenter/);
  assert.match(read('assets/css/eon-city-play.css'), /W624I · receipt-backed Genuine Agent Theatre/);
});
