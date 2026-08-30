import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  buildProjectContinueAction,
  createProjectVersion,
  getW631WorkspaceSnapshot,
  loadW631State,
  recordProjectOutcome,
  saveAutomationLifecycle,
  syncProjectOperatingRecord,
  transitionAutomationLifecycle,
  transitionForgeLifecycle,
  validateW631ProjectOperatingContract
} from '../../assets/js/workspace/eon-project-operating-system.js';
import { EON_PROJECTS_STORAGE_KEY } from '../../assets/js/utils/eon-workspace-store.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: (key) => map.has(key) ? map.get(key) : null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key), map };
}

function projectStorage() {
  const storage = memoryStorage();
  storage.setItem(EON_PROJECTS_STORAGE_KEY, JSON.stringify({ schema: 'eon.projects.v3', projects: [{ id: 'p1', title: 'Launch', summary: 'Ship one safe release', status: 'active', tasks: [], artifacts: [], automationIds: [], createdAt: '2026-07-11T00:00:00.000Z', updatedAt: '2026-07-11T00:00:00.000Z' }] }));
  return storage;
}

test('W631 validates the project operating source contract', () => {
  const report = validateW631ProjectOperatingContract();
  assert.equal(report.ok, true);
  assert.equal(report.passed, 8);
});

test('W631 keeps Projects on its dedicated controller after the route split', () => {
  const projectsPage = fs.readFileSync(new URL('../../projects.html', import.meta.url), 'utf8');
  const projectsController = fs.readFileSync(new URL('../../assets/js/projects/eon-projects-page.js', import.meta.url), 'utf8');
  assert.match(projectsPage, /src="\/assets\/js\/projects\/eon-projects-page\.js"/);
  assert.doesNotMatch(projectsPage, /\/assets\/js\/eon-workspace-pages\.js/);
  assert.doesNotMatch(projectsPage, /installW631ContinuityPanel/);
  assert.match(projectsController, /resolveEonProjectsW704CommandWorkspace/);
});

test('W631 syncs an ordinary local project and prepares continue context', () => {
  const storage = projectStorage();
  const result = syncProjectOperatingRecord({ id: 'p1', title: 'Launch', summary: 'Ship one safe release' }, { storage, continueRoute: '/workspace' });
  assert.equal(result.ok, true);
  assert.equal(buildProjectContinueAction('p1', { storage }).href, '/workspace');
});

test('W631 records bounded versions and local outcomes', () => {
  const storage = projectStorage();
  syncProjectOperatingRecord({ id: 'p1', title: 'Launch' }, { storage });
  assert.equal(createProjectVersion('p1', { label: 'v1', summary: 'Initial' }, { storage }).ok, true);
  assert.equal(recordProjectOutcome('p1', { title: 'Brief complete', status: 'complete' }, { storage }).ok, true);
  const record = loadW631State({ storage }).projects.p1;
  assert.equal(record.versions.length, 1);
  assert.equal(record.outcomes[0].evidenceKind, 'local-record');
});

test('W631 requires a receipt for provider or deployment outcomes', () => {
  const storage = projectStorage();
  syncProjectOperatingRecord({ id: 'p1', title: 'Launch' }, { storage });
  const result = recordProjectOutcome('p1', { title: 'Deployed', evidenceKind: 'deployment-receipt' }, { storage });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'evidence-id-required');
});

test('W631 forge deployment fails closed without permission and provider proof', () => {
  const prepared = transitionForgeLifecycle('reviewed', 'deploy-prepared', { explicitUserAction: true });
  assert.equal(prepared.ok, true);
  const blocked = transitionForgeLifecycle('deploy-prepared', 'deployed', { explicitUserAction: true, permissionedConnector: true });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'permissioned-deployment-proof-required');
});

test('W631 forge deployment accepts a real permissioned receipt contract', () => {
  const result = transitionForgeLifecycle('deploy-prepared', 'deployed', { explicitUserAction: true, permissionedConnector: true, providerConfirmed: true, deploymentReceiptId: 'deploy_123' });
  assert.equal(result.ok, true);
  assert.equal(result.remoteEffectClaimed, true);
  assert.equal(result.deploymentReceiptId, 'deploy_123');
});

test('W631 automation scheduling is prepared-only and running needs executor proof', () => {
  const draft = { automationId: 'a1', title: 'Morning review', state: 'review', history: [] };
  const scheduled = transitionAutomationLifecycle(draft, 'scheduled', { explicitUserAction: true });
  assert.equal(scheduled.ok, true);
  assert.equal(scheduled.preparedOnly, true);
  const blocked = transitionAutomationLifecycle(scheduled.automation, 'running', { explicitUserAction: true });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'executor-proof-required');
});

test('W631 automation run history is redacted and persisted', () => {
  const storage = projectStorage();
  const running = transitionAutomationLifecycle({ automationId: 'a1', state: 'scheduled', history: [] }, 'running', { explicitUserAction: true, permissionedExecutor: true, executorReceiptId: 'exec_1' });
  assert.equal(running.ok, true);
  assert.equal(running.automation.history[0].credentialIncluded, false);
  assert.equal(saveAutomationLifecycle(running.automation, { storage }).ok, true);
  assert.equal(getW631WorkspaceSnapshot({ storage }).automationCount, 1);
});
