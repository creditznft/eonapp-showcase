import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import { EON_CREATE_MODES, validateEonCreateCatalog } from '../../assets/js/create/eon-create-catalog.js';
import {
  getCreateContinuityTruth,
  prepareCreateDestinationHandoff,
  resolveCreateModeAvailability
} from '../../assets/js/create/eon-create-continuity-authority.js';
import { consumeEonHandoff } from '../../assets/js/contracts/navigation/eon-handoff-authority.js';
import { EON_FORGE_QUICK_BUILD } from '../../assets/js/forge/eon-forge-quick-build.js';
import { listProjectRegistryRecords } from '../../assets/js/projects/eon-project-registry.js';

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(String(key)) ? this.map.get(String(key)) : null; }
  setItem(key, value) { this.map.set(String(key), String(value)); }
  removeItem(key) { this.map.delete(String(key)); }
  clear() { this.map.clear(); }
}

const now = Date.parse('2026-08-05T01:00:00.000+05:30');
const cryptoApi = globalThis.crypto;

test('A15 I14 Create modes expose only Create now, Setup required or Plan only truth', () => {
  assert.equal(validateEonCreateCatalog().ok, true);
  const status = Object.fromEntries(EON_CREATE_MODES.map((mode) => [mode.id, mode.status]));
  assert.deepEqual(status, {
    image: 'Setup required',
    video: 'Setup required',
    music: 'Create now',
    website: 'Create now',
    project: 'Create now',
    automation: 'Plan only',
    guide: 'Plan only'
  });
  assert.equal(resolveCreateModeAvailability('image').availability, 'setup-required');
  assert.equal(resolveCreateModeAvailability('video', { certifiedGenerationReady: true, certifiedBy: 'owner-proof' }).availability, 'create-now');
  assert.equal(resolveCreateModeAvailability('music').availability, 'create-now');
  assert.equal(resolveCreateModeAvailability('website').availability, 'create-now');
  assert.equal(resolveCreateModeAvailability('automation').availability, 'plan-only');
});

test('A15 I14 website selection creates one review-only single-use handoff to Forge', async () => {
  const sessionStorage = new MemoryStorage();
  const handoff = await prepareCreateDestinationHandoff('website', { explicitUserAction: true, sessionStorage, now, cryptoApi, handoffId: 'handoff_a15_i14_website' });
  assert.equal(handoff.ok, true);
  assert.equal(handoff.href, '/forge?handoff=handoff_a15_i14_website');
  assert.equal(handoff.handoff.payload.reviewBeforeApply, true);
  assert.equal(handoff.handoff.payload.externalExecutionAuthority, false);
  assert.equal(handoff.handoff.payload.universalProjectRegistry, true);
  assert.doesNotMatch(JSON.stringify(handoff.handoff), /prompt|credential|api.?key|media.?body/i);
  const consumed = await consumeEonHandoff(handoff.handoff.handoffId, { receiverId: 'forge', sessionStorage, now: now + 1, cryptoApi });
  assert.equal(consumed.ok, true);
  assert.equal((await consumeEonHandoff(handoff.handoff.handoffId, { receiverId: 'forge', sessionStorage, now: now + 2, cryptoApi })).reason, 'handoff-already-consumed');
});

test('A15 I14 manual website starter saves working source and registers universal Project continuity', () => {
  const previousLocalStorage = globalThis.localStorage;
  const previousSessionStorage = globalThis.sessionStorage;
  const storage = new MemoryStorage();
  globalThis.localStorage = storage;
  globalThis.sessionStorage = new MemoryStorage();
  try {
    const project = EON_FORGE_QUICK_BUILD.buildProject({
      title: 'A15 Website Continuity',
      brief: 'Build a reviewable local website with a clear main action.',
      type: 'website',
      style: 'graphite'
    });
    assert.equal(EON_FORGE_QUICK_BUILD.runProjectChecks(project.files).errors.length, 0);
    assert.equal(EON_FORGE_QUICK_BUILD.saveProject(project), true);
    const saved = EON_FORGE_QUICK_BUILD.readProjects();
    assert.equal(saved.length, 1);
    assert.equal(saved[0].id, project.id);
    assert.equal(saved[0].files['index.html'].includes('<main'), true);
    const records = listProjectRegistryRecords({ storage });
    assert.equal(records.length, 1);
    assert.equal(records[0].continueDestination, 'forge');
    assert.equal(records[0].sources.some((source) => source.namespace === 'forge' && source.relation === 'owner'), true);
  } finally {
    if (previousLocalStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousLocalStorage;
    if (previousSessionStorage === undefined) delete globalThis.sessionStorage; else globalThis.sessionStorage = previousSessionStorage;
  }
});

test('A15 I14 Forge remains review-before-Apply and does not bundle deployment', () => {
  const forge = readFileSync(new URL('../../assets/js/forge/eon-forge-quick-build.js', import.meta.url), 'utf8');
  assert.match(forge, /wait for your approval before applying anything/i);
  assert.match(forge, /data-eon-forge-ai-apply/);
  assert.match(forge, /AI output is reviewed before Apply/i);
  assert.match(forge, /No GitHub, hosting, backend, or deployment starts here/i);
  assert.doesNotMatch(forge, /autoApply\s*:\s*true|applyAiProposal\([^)]*\)\s*;\s*await requestAiProposal/);
});

test('A15 I14 source routes Create through the continuity authority and labels mode truth', () => {
  const hub = readFileSync(new URL('../../assets/js/create/eon-create-hub.js', import.meta.url), 'utf8');
  const catalog = readFileSync(new URL('../../assets/js/create/eon-create-catalog.js', import.meta.url), 'utf8');
  assert.match(hub, /prepareCreateDestinationHandoff/);
  assert.match(hub, /data-eon-create-availability/);
  assert.doesNotMatch(hub, /writeEonHandoff\s*\(/);
  assert.match(catalog, /status: 'Create now'/);
  assert.match(catalog, /status: 'Setup required'/);
  assert.match(catalog, /status: 'Plan only'/);
  const truth = getCreateContinuityTruth();
  assert.equal(truth.websiteMode, 'create-now');
  assert.equal(truth.hiddenGenerationFallback, false);
  assert.equal(truth.navigationStartsDeployment, false);
});
