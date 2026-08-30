import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildEonLocalAiAutopilotRecommendation,
  buildEonProjectAiRoutingEnvelope,
  normalizeEonProjectAiProfile,
  validateEonProjectAiProfileFoundation
} from '../../assets/js/local-ai/eon-project-ai-profile.js';
import { createProject, loadProjects, updateProject } from '../../assets/js/utils/eon-workspace-store.js';

function storage() {
  const map = new Map();
  return { getItem: (k) => map.has(k) ? map.get(k) : null, setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k) };
}

test('RT92 project AI profile preserves the existing routing security boundary', () => {
  const report = validateEonProjectAiProfileFoundation();
  assert.equal(report.ok, true, report.errors.join('\n'));
  const profile = normalizeEonProjectAiProfile({ qualityMode: 'private', preferLocal: true, preferredRuntimeId: 'ollama', crossProviderConsent: true, billableProviderConsent: true });
  assert.equal(profile.crossProviderConsent, false);
  assert.equal(profile.billableProviderConsent, false);
  assert.equal(profile.automaticRuntimeProbe, false);
  assert.equal(profile.automaticModelDownload, false);
  const policy = buildEonProjectAiRoutingEnvelope(profile);
  assert.equal(policy.privacyRoute, 'device-local');
  assert.equal(policy.allowCrossProvider, false);
  assert.equal(policy.allowBillableProvider, false);
});

test('RT92 Local AI Autopilot is advisory and never silently probes installs downloads or switches', () => {
  const recommendation = buildEonLocalAiAutopilotRecommendation({
    profile: { qualityMode: 'private', preferLocal: true, preferredRuntimeId: 'ollama' },
    localRuntime: { status: 'offline' }
  });
  assert.equal(recommendation.action, 'make-local-ai-ready');
  assert.equal(recommendation.route, '/local-ai');
  assert.equal(recommendation.advisoryOnly, true);
  assert.equal(recommendation.runtimeProbeStarted, false);
  assert.equal(recommendation.runtimeStartStarted, false);
  assert.equal(recommendation.modelDownloadStarted, false);
  assert.equal(recommendation.providerSwitchStarted, false);
  assert.equal(recommendation.networkRequestCreated, false);
});

test('RT92 project AI profile persists as metadata on the existing Project record', () => {
  const store = storage();
  const project = createProject({ title: 'AI project', aiProfile: { qualityMode: 'private', preferLocal: true, preferredRuntimeId: 'ollama' } }, { storage: store, capacitySnapshot: { resources: {} } });
  assert.equal(project.aiProfile.qualityMode, 'private');
  assert.equal(project.aiProfile.preferredRuntimeId, 'ollama');
  const updated = updateProject(project.id, { summary: 'Keep profile' }, { storage: store, capacitySnapshot: { resources: {} } });
  assert.equal(updated.aiProfile.qualityMode, 'private');
  assert.equal(loadProjects({ storage: store }).projects[0].aiProfile.preferredRuntimeId, 'ollama');
});
