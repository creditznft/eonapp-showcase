import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  buildEonAppW713CrossRouteCoherencePlan,
  getEonAppW713CrossRouteCoherenceTruth,
  normalizeEonAppW713ProviderReadiness,
  prepareEonAppW713CreatorAttachment,
  resolveEonAppW713RouteView,
  validateEonAppW713CrossRouteCoherencePlan
} from '../../assets/js/runtime/w713/eonapp-w713-cross-route-product-coherence.js';
import { projectLocalRuntimeStatusForW713 } from '../../assets/js/local-ai/local-runtime-status.js';
import { prepareCreatorContinuation } from '../../assets/js/create/creator-project-integration.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const state = {
  project: { id: 'project:1', label: 'EONAPP', selected: true },
  task: { id: 'task:1', label: 'Launch audit' },
  conversation: { id: 'chat:1', label: 'Private EONBOT conversation' },
  selectedWorkObject: { id: 'result:1', label: 'Verified result' }
};

test('W713 projects one selected project and one EONBOT identity across the complete product', () => {
  const plan = buildEonAppW713CrossRouteCoherencePlan({ state });
  assert.equal(validateEonAppW713CrossRouteCoherencePlan(plan).ok, true);
  assert.equal(plan.routeCount, 12);
  assert.equal(new Set(plan.routeViews.map((view) => view.project.id)).size, 1);
  assert.equal(new Set(plan.routeViews.map((view) => view.eonbotIdentity)).size, 1);
  assert.equal(plan.routeViews.every((view) => view.project.id === 'project:1'), true);
});

test('W713 keeps ordinary work, reusable content and secrets in distinct custody surfaces', () => {
  const plan = buildEonAppW713CrossRouteCoherencePlan({ state });
  assert.equal(resolveEonAppW713RouteView(plan, 'projects').custody, 'ordinary-work');
  assert.equal(resolveEonAppW713RouteView(plan, 'library').custody, 'reusable-content');
  assert.equal(resolveEonAppW713RouteView(plan, 'vault').custody, 'sensitive-material');
  assert.equal(resolveEonAppW713RouteView(plan, 'automations').custody, 'reviewed-workflow');
  assert.equal(resolveEonAppW713RouteView(plan, 'city').custody, 'state-projection');
});

test('W713 Creator attachments require a verified reference, explicit action and confirmation', () => {
  const output = { assetId: 'asset:1', title: 'Launch visual', sha256: 'abc' };
  assert.equal(prepareEonAppW713CreatorAttachment({ output, target: 'project', projectId: 'project:1' }).reason, 'explicit-user-action-required');
  assert.equal(prepareEonAppW713CreatorAttachment({ output, target: 'library', explicitUserAction: true }).reason, 'explicit-confirmation-required');
  const project = prepareEonAppW713CreatorAttachment({ output, target: 'project', projectId: 'project:1', explicitUserAction: true, confirmed: true });
  const library = prepareEonAppW713CreatorAttachment({ output, target: 'library', explicitUserAction: true, confirmed: true });
  assert.equal(project.ok, true);
  assert.equal(library.ok, true);
  assert.equal(project.publishes, false);
  assert.equal(library.writesStorage, false);
  assert.equal(library.href, '/library');
});

test('W713 integrates the existing Creator continuation with an explicit Library handoff', async () => {
  const asset = { assetId: 'asset:2', title: 'Reusable visual', sha256: 'def', mediaKind: 'image' };
  const storage = new Map();
  const sessionStorage = { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
  assert.equal((await prepareCreatorContinuation(asset, 'library', { explicitUserAction: true })).reason, 'explicit-confirmation-required');
  const result = await prepareCreatorContinuation(asset, 'library', { explicitUserAction: true, confirmed: true, sessionStorage, cryptoApi: globalThis.crypto, handoffId: 'handoff_w713_library' });
  assert.equal(result.ok, true);
  assert.equal(result.destination, 'library');
  assert.equal(result.preparedOnly, true);
  assert.equal(result.proposal.publishes, false);
  assert.equal(result.href, '/library?handoff=handoff_w713_library');
});

test('W713 provider readiness has four clear states and never carries secret material', () => {
  assert.equal(normalizeEonAppW713ProviderReadiness({}).state, 'empty');
  assert.equal(normalizeEonAppW713ProviderReadiness({ runtimeId: 'ollama', modelId: 'qwen' }).state, 'saved');
  assert.equal(normalizeEonAppW713ProviderReadiness({ runtimeId: 'ollama', ok: true }).state, 'verified');
  assert.equal(normalizeEonAppW713ProviderReadiness({ runtimeId: 'ollama', error: 'offline' }).state, 'error');
  const rejected = normalizeEonAppW713ProviderReadiness({ apiKey: 'must-not-cross' });
  assert.equal(rejected.state, 'error');
  assert.equal(rejected.secretMaterialIncluded, false);
  assert.equal(projectLocalRuntimeStatusForW713({ runtime: 'Ollama', model: 'qwen', checkedAt: 'now', ok: true }).state, 'verified');
});

test('W713 preserves existing route-level truth boundaries in source', () => {
  assert.match(read('assets/js/eon-automations-page.js'), /Creates a local draft only/);
  assert.match(read('assets/js/vault/eon-vault-page.js'), /only place for provider keys/);
  assert.match(read('assets/js/projects/w704/eon-projects-w704-command-workspace.js'), /ownsSingleResumeSurface: true/);
  assert.match(read('assets/js/create/creator-project-integration.js'), /prepareEonAppW713CreatorAttachment/);
  assert.match(read('assets/js/local-ai/local-runtime-status.js'), /projectLocalRuntimeStatusForW713/);
});

test('W713 truth prohibits hidden provider, navigation, publishing and storage work', () => {
  const truth = getEonAppW713CrossRouteCoherenceTruth();
  assert.equal(truth.oneCanonicalForegroundState, true);
  assert.equal(truth.oneSelectedProject, true);
  assert.equal(truth.oneEonbotIdentity, true);
  assert.equal(truth.writesStorage, false);
  assert.equal(truth.startsProvider, false);
  assert.equal(truth.navigatesAutomatically, false);
  assert.equal(truth.publishesAutomatically, false);
  assert.equal(truth.copiesSecretMaterial, false);
});
