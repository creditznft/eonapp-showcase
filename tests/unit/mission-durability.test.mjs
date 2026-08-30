import test from 'node:test';
import assert from 'node:assert/strict';

import { CHAT_MISSION_TIMELINE_KEY, createChatMissionTimelineStore } from '../../assets/js/chat/chat-page-session-state.js';
import {
  exportMissionCapsule,
  getLatestResumableMissionJob,
  getMissionDurabilitySummary,
  importMissionCapsuleText,
  resumeMissionJob
} from '../../assets/js/utils/mission-durability.js';

const store = new Map();
globalThis.localStorage = {
  getItem(key) { return store.has(String(key)) ? store.get(String(key)) : null; },
  setItem(key, value) { store.set(String(key), String(value)); },
  removeItem(key) { store.delete(String(key)); },
  clear() { store.clear(); }
};

function seedPlan(id = 'plan-a15-1') {
  const timeline = createChatMissionTimelineStore({ storage: globalThis.localStorage });
  timeline.append({
    missionId: id,
    planId: id,
    title: 'Build a reviewed local plan',
    prompt: 'Build a reviewed local plan for my project',
    summary: 'Foreground plan prepared for review.',
    status: 'awaiting_approval',
    provider: 'guide',
    providerLabel: 'Guide plan',
    model: 'none',
    taskClass: 'mission-plan',
    routing: { externalActionAuthority: false }
  });
  return id;
}

test('foreground mission checkpoints round-trip without loading the legacy agent executor', async () => {
  localStorage.clear();
  const id = seedPlan();
  const exported = await exportMissionCapsule(id, { download: false });
  assert.equal(exported.ok, true);
  assert.equal(exported.capsule.manifest.schema, 'eonapp.foreground-mission-checkpoint.a15.v1');
  assert.equal(exported.capsule.manifest.authority.backgroundExecution, false);

  localStorage.removeItem(CHAT_MISSION_TIMELINE_KEY);
  const imported = await importMissionCapsuleText(JSON.stringify(exported.capsule));
  assert.equal(imported.ok, true);
  assert.equal(imported.execution, 'not-active');
  assert.equal(getLatestResumableMissionJob()?.id, id);
  assert.equal(getMissionDurabilitySummary().legacyExecutorLoaded, false);

  const resumed = await resumeMissionJob(id, { surface: 'test', origin: 'unit' });
  assert.equal(resumed.ok, true);
  assert.equal(resumed.planned, true);
  assert.equal(resumed.reviewUrl, '/workspace');
});

test('encrypted foreground mission checkpoints round-trip with a passphrase', async () => {
  localStorage.clear();
  const id = seedPlan('plan-a15-encrypted');
  const exported = await exportMissionCapsule(id, { download: false, passphrase: 'correct horse battery staple' });
  assert.equal(exported.ok, true);
  assert.equal(exported.capsule.encrypted, true);
  assert.equal(exported.capsule.manifest, null);

  localStorage.removeItem(CHAT_MISSION_TIMELINE_KEY);
  const imported = await importMissionCapsuleText(JSON.stringify(exported.capsule), 'correct horse battery staple');
  assert.equal(imported.ok, true);
  assert.equal(getLatestResumableMissionJob()?.id, id);
});

test('legacy manifests are quarantined into review-only local plans', async () => {
  localStorage.clear();
  const legacy = {
    schema: 'agent-job-manifest/v1',
    job: {
      id: 'legacy-plan-1',
      title: 'Legacy plan',
      status: 'running',
      intentText: 'Old local plan',
      action: 'build',
      createdAt: 100,
      updatedAt: 200
    }
  };
  const result = await importMissionCapsuleText(JSON.stringify(legacy));
  assert.equal(result.ok, true);
  assert.equal(result.job.status, 'planned');
  assert.equal(result.job.routing.legacyExecutionAuthority, false);
  assert.match(result.job.summary, /No legacy executor was reactivated/i);
});
