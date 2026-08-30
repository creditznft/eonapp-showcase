import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

import {
  beginEonLocalAgentTheatreJob,
  completeEonLocalAgentTheatreJob,
  failEonLocalAgentTheatreJob
} from '../../assets/js/local-ai/eon-local-agent-theatre-bridge.js';
import {
  EON_CITY_AGENT_THEATRE_STORAGE_KEY,
  getEonCityGenuineAgentTheatreSnapshot,
  recordEonCityDirectByokJobReceipt
} from '../../assets/js/city/eon-city-genuine-agent-theatre.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.get(String(key)) ?? null,
    setItem: (key, value) => map.set(String(key), String(value)),
    removeItem: (key) => map.delete(String(key)),
    dump: () => Object.fromEntries(map)
  };
}

const NOW = 1_776_000_000_000;

test('RT91 Local AI bridge records a genuine running -> completed local Theatre receipt without content', () => {
  const storage = memoryStorage();
  const started = beginEonLocalAgentTheatreJob({
    userInitiated: true,
    origin: 'eoncity-quick',
    taskType: 'chat',
    storage,
    now: () => NOW,
    jobId: 'eonagentjob_local_testbridge1234'
  });
  assert.equal(started.ok, true);
  let snapshot = getEonCityGenuineAgentTheatreSnapshot({ storage, now: () => NOW });
  assert.equal(snapshot.jobs[0].state, 'running');
  assert.equal(snapshot.jobs[0].rail, 'local');
  assert.equal(snapshot.localAiReceiptProjection, true);
  assert.equal(snapshot.localAiExecutionAuthority, false);

  const completed = completeEonLocalAgentTheatreJob(started, {
    requestReceiptId: 'opaque-request-id-123',
    elapsedMs: 321,
    storage,
    now: () => NOW + 321
  });
  assert.equal(completed.ok, true);
  snapshot = getEonCityGenuineAgentTheatreSnapshot({ storage, now: () => NOW + 321 });
  assert.equal(snapshot.jobs[0].state, 'completed');
  assert.match(snapshot.jobs[0].resultReceiptId, /^receipt_local_[a-f0-9]{16}$/);
  const raw = storage.dump()[EON_CITY_AGENT_THEATRE_STORAGE_KEY];
  assert.ok(raw);
  for (const forbidden of ['secret prompt', 'assistant answer', 'model-name', '127.0.0.1', 'apiKey', 'providerKey']) {
    assert.equal(raw.includes(forbidden), false, `forbidden local AI content leaked: ${forbidden}`);
  }
});

test('RT91 Local AI bridge fails closed without explicit user initiation and records bounded failure codes', () => {
  const storage = memoryStorage();
  const refused = beginEonLocalAgentTheatreJob({ userInitiated: false, storage, now: () => NOW });
  assert.equal(refused.ok, false);
  assert.equal(storage.getItem(EON_CITY_AGENT_THEATRE_STORAGE_KEY), null);

  const started = beginEonLocalAgentTheatreJob({
    userInitiated: true,
    origin: 'local-ai',
    taskType: 'chat',
    storage,
    now: () => NOW,
    jobId: 'eonagentjob_local_testfailure123'
  });
  const failed = failEonLocalAgentTheatreJob(started, { failureCode: 'network', storage, now: () => NOW + 50 });
  assert.equal(failed.ok, true);
  const snapshot = getEonCityGenuineAgentTheatreSnapshot({ storage, now: () => NOW + 50 });
  assert.equal(snapshot.jobs[0].state, 'failed');
  assert.equal(snapshot.jobs[0].failureCode, 'network');
  assert.equal(snapshot.jobs[0].rawPromptVisible, false);
  assert.equal(snapshot.jobs[0].rawOutputVisible, false);
});


test('RT91 Local AI bridge preserves existing Direct BYOK Theatre receipts while adding local lifecycle state', () => {
  const storage = memoryStorage();
  const byok = recordEonCityDirectByokJobReceipt({
    jobId: 'eonagentjob_byok_preserve1234',
    state: 'completed',
    jobType: 'chat',
    safeLabel: 'Reviewed Direct BYOK job',
    sourceSurface: 'chat',
    resultReceiptId: 'receipt_byok_preserve_123456',
    logs: [{ code: 'completed', state: 'completed', at: NOW }],
    supportedActions: ['result-handoff']
  }, { storage, now: () => NOW, explicitUserAction: true, explicitUserApproval: true });
  assert.equal(byok.ok, true);

  const started = beginEonLocalAgentTheatreJob({
    userInitiated: true,
    origin: 'local-ai',
    taskType: 'chat',
    storage,
    now: () => NOW + 10,
    jobId: 'eonagentjob_local_preserve1234'
  });
  assert.equal(started.ok, true);
  const snapshot = getEonCityGenuineAgentTheatreSnapshot({ storage, now: () => NOW + 10 });
  assert.equal(snapshot.jobs.some((job) => job.jobId === 'eonagentjob_byok_preserve1234' && job.rail === 'direct-byok'), true);
  assert.equal(snapshot.jobs.some((job) => job.jobId === 'eonagentjob_local_preserve1234' && job.rail === 'local'), true);
});

test('canonical AI runtime mounts the bridge only behind local provider + user-initiated request truth', () => {
  const source = fs.readFileSync(new URL('../../assets/js/chat/ai-runtime.js', import.meta.url), 'utf8');
  assert.match(source, /isLocalProvider\(provider\)[\s\S]{0,500}beginEonLocalAgentTheatreJob/);
  assert.match(source, /userInitiated:\s*runtimeSettings\.requestContext\?\.userInitiated\s*===\s*true/);
  assert.match(source, /completeEonLocalAgentTheatreJob\([\s\S]{0,300}requestReceiptId:\s*execution\.requestReceipt\?\.requestId/);
  assert.match(source, /failEonLocalAgentTheatreJob\(localTheatreJob/);
  assert.doesNotMatch(source, /beginEonLocalAgentTheatreJob\(\{[^}]*input:/);
});
