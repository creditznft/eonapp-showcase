import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EON_ACTIVATION_STORAGE_KEY,
  getEonActivationTruth,
  listEonSetupResumeCandidates,
  readEonActivationState,
  recordEonSetupProgress,
  refreshEonActivationState
} from '../../assets/js/activation/eon-activation-service.js';
import { listEonContinueCandidates, resolveEonContinueCandidate } from '../../assets/js/retention/eon-continue-resolver.js';
import { registerProjectSource } from '../../assets/js/projects/eon-project-registry.js';
import { getEonRetentionConsentTruth } from '../../assets/js/notifications/eon-retention-consent.js';
import { getIdentityOnboardingCopy } from '../../assets/js/account/eon-identity-onboarding.js';

class MemoryStorage {
  constructor(seed = {}) { this.map = new Map(Object.entries(seed)); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}

const now = Date.parse('2026-08-05T01:30:00.000+05:30');

function activationOptions(storage, sessionStorage = new MemoryStorage()) {
  return { storage, localStorage: storage, sessionStorage, now };
}

test('A15 I19 starts guest-first and does not imply account or marketing consent', () => {
  const storage = new MemoryStorage();
  const truth = getEonActivationTruth(activationOptions(storage));
  assert.equal(truth.guestFirst, true);
  assert.equal(truth.signInRequiredForFirstResult, false);
  assert.equal(truth.identityCreatesMarketingConsent, false);
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticOutboundDelivery, false);
  assert.equal(truth.contentBodiesStored, false);
  const identityCopy = getIdentityOnboardingCopy('chat');
  assert.match(identityCopy.description, /without an account/i);
  const consent = getEonRetentionConsentTruth();
  assert.equal(consent.googleLoginIsMarketingConsent, false);
  assert.equal(consent.googleLoginIsEmailDeliveryConsent, false);
  assert.equal(consent.automaticOutboundDelivery, false);
});

test('A15 I19 records a first useful guest Chat result without storing its content', () => {
  const storage = new MemoryStorage();
  const sessionStorage = new MemoryStorage({
    'eon:chat:threads:v1': JSON.stringify({
      schema: 'eon.chat.threads.v2',
      threads: [{
        id: 'chat_guest_result',
        title: 'Private title not copied',
        createdAt: new Date(now - 2000).toISOString(),
        updatedAt: new Date(now - 1000).toISOString(),
        messages: [
          { role: 'user', text: 'Private user content' },
          { role: 'bot', text: 'Useful guide response' }
        ]
      }]
    })
  });
  const result = refreshEonActivationState(activationOptions(storage, sessionStorage));
  assert.equal(result.ok, true);
  assert.equal(result.changed, true);
  const state = readEonActivationState(activationOptions(storage, sessionStorage));
  assert.equal(state.firstUsefulResultType, 'chat');
  assert.ok(state.firstUsefulResultAt);
  const serialized = storage.getItem(EON_ACTIVATION_STORAGE_KEY);
  assert.equal(serialized.includes('Private user content'), false);
  assert.equal(serialized.includes('Useful guide response'), false);
  assert.equal(serialized.includes('Private title'), false);
});

test('A15 I19 resumes an explicit setup and removes it from Continue after completion', () => {
  const storage = new MemoryStorage();
  const started = recordEonSetupProgress({ setupId: 'local-ai', state: 'in-progress', destinationId: 'local-ai', stepId: 'runtime-test' }, activationOptions(storage));
  assert.equal(started.ok, true);
  assert.equal(listEonSetupResumeCandidates(activationOptions(storage)).length, 1);
  const candidate = resolveEonContinueCandidate({ localStorage: storage, sessionStorage: new MemoryStorage(), now });
  assert.equal(candidate.type, 'setup');
  assert.equal(candidate.destinationId, 'local-ai');
  assert.equal(candidate.href, '/local-ai?handoff=setup-local-ai');
  const completed = recordEonSetupProgress({ setupId: 'local-ai', state: 'completed', destinationId: 'local-ai', stepId: 'verified' }, activationOptions(storage));
  assert.equal(completed.ok, true);
  assert.equal(listEonSetupResumeCandidates(activationOptions(storage)).length, 0);
  assert.equal(resolveEonContinueCandidate({ localStorage: storage, sessionStorage: new MemoryStorage(), now }), null);
});

test('A15 I19 Continue recognizes all active Universal Project destinations', () => {
  const storage = new MemoryStorage();
  const rows = [
    { namespace: 'ordinary-project', sourceId: 'project-1', title: 'Project one', continueDestination: 'projects' },
    { namespace: 'forge-project', sourceId: 'forge-1', title: 'Forge one', continueDestination: 'forge' },
    { namespace: 'w631-project', sourceId: 'workspace-1', title: 'Workspace one', continueDestination: 'workspace' }
  ];
  rows.forEach((row, index) => {
    const result = registerProjectSource({ ...row, relation: 'owner', createdAt: new Date(now - 3000 + index).toISOString(), updatedAt: new Date(now - 3000 + index).toISOString() }, { storage, now: now - 3000 + index });
    assert.equal(result.ok, true);
  });
  const candidates = listEonContinueCandidates({ localStorage: storage, sessionStorage: new MemoryStorage(), now });
  const projects = candidates.filter((candidate) => candidate.type === 'project');
  assert.equal(projects.length, 3);
  assert.deepEqual(new Set(projects.map((candidate) => candidate.destinationId)), new Set(['projects', 'forge', 'workspace']));
  assert.equal(projects.every((candidate) => candidate.href.includes('project=')), true);
  assert.equal(projects.every((candidate) => candidate.localOnly), true);
});

test('A15 I19 activation state rejects unknown setups and destinations', () => {
  const storage = new MemoryStorage();
  assert.equal(recordEonSetupProgress({ setupId: 'newsletter', state: 'in-progress', destinationId: 'home' }, activationOptions(storage)).ok, false);
  assert.equal(recordEonSetupProgress({ setupId: 'provider', state: 'in-progress', destinationId: 'external-site' }, activationOptions(storage)).ok, false);
  assert.equal(storage.getItem(EON_ACTIVATION_STORAGE_KEY), null);
});
