import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {
  EON_CITY_W750_COMMAND_CENTRE_SCHEMA,
  EON_CITY_W750_VIEW_EVENT,
  EON_CITY_W750_WALL_IDS,
  createEonCityW750CommandCentre,
  getEonCityW750Wall,
  projectEonCityW750CommandCentreView,
  validateEonCityW750CommandCentreContract
} from '../../assets/js/city/w750/eon-city-w750-command-centre.js';
import { getEonWorkSurfaceDefinition, normalizeEonWorkSurfaceInvocation } from '../../assets/js/contracts/work-surface/eon-work-surface-registry.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');

class FakeCustomEvent extends Event {
  constructor(type, options = {}) { super(type); this.detail = options.detail; }
}

class FakeNode {
  constructor(name) {
    this.name = name;
    this.parent = null;
    this.position = { x: 0, y: 0, z: 0, set: (x = 0, y = 0, z = 0) => Object.assign(this.position, { x, y, z }) };
    this.rotation = { x: 0, y: 0, z: 0, set: (x = 0, y = 0, z = 0) => Object.assign(this.rotation, { x, y, z }) };
    this.scaling = { x: 1, y: 1, z: 1, setAll: (value = 1) => Object.assign(this.scaling, { x: value, y: value, z: value }) };
    this.visibility = 1;
    this.enabled = true;
    this.disposed = false;
  }
  setEnabled(value) { this.enabled = Boolean(value); }
  dispose() { this.disposed = true; }
}
class FakeTransformNode extends FakeNode {}
const FakeMeshBuilder = Object.freeze({
  CreateBox: (name) => new FakeNode(name),
  CreatePlane: (name) => new FakeNode(name),
  CreatePolyhedron: (name) => new FakeNode(name)
});

const nexusView = (overrides = {}) => ({
  state: 'waiting-approval', freshness: { state: 'fresh', label: 'Live state' },
  workObject: { present: true, label: 'Creator package', placementReason: 'Continue at Project Atlas.' },
  rings: [
    { id: 'project', label: 'Project', shortLabel: 'Creator package', active: true, count: 3, source: 'project projection', detail: 'Three bounded items.' },
    { id: 'task', label: 'Task', shortLabel: 'Review capture', warning: true, active: true, count: 1, source: 'task projection', detail: 'Review needed.' },
    { id: 'approval', label: 'Approvals', shortLabel: 'One approval waiting', warning: true, active: true, count: 1, source: 'approval projection', detail: 'Explicit review required.' },
    { id: 'systems', label: 'Systems', shortLabel: 'Local runtime', active: true, count: 2, source: 'systems projection', detail: 'Two bounded nodes ready.' },
    { id: 'mission', label: 'Mission', shortLabel: 'Mission', active: true, count: 1, source: 'mission projection', detail: 'One mission touched.' },
    { id: 'results', label: 'Results', shortLabel: 'Two results', warning: true, active: true, count: 2, source: 'result projection', detail: 'One unread result.' }
  ],
  ...overrides
});

const commandSnapshot = () => ({
  schema: 'eon.city.truthful-command-center.w624h.v1',
  cards: [
    { id: 'projects', label: 'Projects', state: 'current', count: 2, summary: 'Two saved local projects.', source: 'projects-store', authority: 'local-browser', freshness: { state: 'current', label: 'Within 24 hours', ageMs: 1000 } },
    { id: 'jobs', label: 'Genuine jobs', state: 'current', count: 2, summary: 'Two bounded job receipts.', source: 'job-fabric', authority: 'bounded-local-job-receipts' },
    { id: 'outcomes', label: 'Recent outcomes', state: 'current', count: 1, summary: 'One verified outcome.', source: 'mission-receipts', authority: 'bounded-local-receipts' },
    { id: 'ai-runtime', label: 'AI runtime', state: 'current', count: 1, summary: 'A verified local receipt is present.', source: 'local-ai-receipt', authority: 'bounded-local-receipt' },
    { id: 'billing', label: 'Billing entitlement', state: 'loading', count: 0, summary: 'Explicit refresh required.', source: '/api/billing/status', authority: 'server-authoritative' },
    { id: 'backup', label: 'Backup / recovery', state: 'empty', count: 0, summary: 'No verified backup receipt.', source: 'recovery-receipts', authority: 'bounded-local-receipt' }
  ]
});

const theatreSnapshot = (jobs = []) => ({
  schema: 'eon.city.genuine-agent-theatre.w624i.v1', jobs, jobCount: jobs.length,
  empty: jobs.length === 0, emptyMessage: jobs.length ? '' : 'No genuine job receipt is present. The Theatre remains still.', selectedJobId: '',
  fakeWorkers: false, inventedProgress: false, startsWork: false
});

const realJobs = () => [
  { jobId: 'job:local-1', state: 'running', jobType: 'Local render', sourceSurface: 'create', railLabel: 'Local', authoritativeProgress: true, progress: 42, updatedAt: new Date(750_000).toISOString() },
  { jobId: 'job:direct-1', state: 'waiting-for-user', jobType: 'Direct provider draft', sourceSurface: 'automations', railLabel: 'Direct BYOK', authoritativeProgress: false, progress: null, updatedAt: new Date(750_000).toISOString() }
];

test('W750 defines five truthful Command Centre walls over existing authorities', () => {
  const validation = validateEonCityW750CommandCentreContract();
  assert.equal(validation.ok, true, validation.errors.join('\n'));
  assert.equal(validation.schema, EON_CITY_W750_COMMAND_CENTRE_SCHEMA);
  assert.deepEqual(EON_CITY_W750_WALL_IDS, ['work', 'review', 'systems', 'atlas-transit', 'agent-theatre']);

  const view = projectEonCityW750CommandCentreView({ nexusView: nexusView(), commandSnapshot: commandSnapshot(), theatreSnapshot: theatreSnapshot(realJobs()), districtCount: 9 });
  assert.equal(view.schema, EON_CITY_W750_COMMAND_CENTRE_SCHEMA);
  assert.deepEqual(view.walls.map((entry) => entry.id), EON_CITY_W750_WALL_IDS);
  assert.equal(getEonCityW750Wall(view, 'work').count, 3);
  assert.equal(getEonCityW750Wall(view, 'review').state, 'warning');
  assert.equal(getEonCityW750Wall(view, 'systems').cards.length, 3);
  assert.equal(getEonCityW750Wall(view, 'atlas-transit').count, 9);
  assert.equal(getEonCityW750Wall(view, 'agent-theatre').jobs.length, 2);
  assert.equal(view.truth.ownsProductState, false);
  assert.equal(view.truth.ownsJobFabric, false);
  assert.equal(view.truth.startsWork, false);
  assert.equal(view.truth.fakeWorkers, false);
  assert.equal(view.truth.inventedProgress, false);
  assert.equal(view.privacy.providerCredentials, false);
  assert.equal(view.privacy.rawProjectContents, false);
});

test('W750 Agent Theatre is still when empty and preserves authoritative progress only', () => {
  const empty = projectEonCityW750CommandCentreView({ nexusView: nexusView(), commandSnapshot: commandSnapshot(), theatreSnapshot: theatreSnapshot([]), districtCount: 9 });
  const emptyTheatre = getEonCityW750Wall(empty, 'agent-theatre');
  assert.equal(emptyTheatre.state, 'empty');
  assert.equal(emptyTheatre.jobs.length, 0);
  assert.match(emptyTheatre.detail, /remains still/i);

  const jobs = realJobs();
  jobs.push({ jobId: 'job:proposal', state: 'queued', jobType: 'Proposal', railLabel: 'Guide', authoritativeProgress: false, progress: 88 });
  const active = projectEonCityW750CommandCentreView({ nexusView: nexusView(), commandSnapshot: commandSnapshot(), theatreSnapshot: theatreSnapshot(jobs), districtCount: 9 });
  const theatre = getEonCityW750Wall(active, 'agent-theatre');
  assert.equal(theatre.state, 'active');
  assert.equal(theatre.jobs[0].progress, 42);
  assert.equal(theatre.jobs[1].progress, null);
  assert.equal(theatre.jobs[2].progress, null);
  assert.equal('prompt' in theatre.jobs[0], false);
  assert.equal('output' in theatre.jobs[0], false);
});

test('W750 strips private candidate fields and never carries raw work into the wall projection', () => {
  const secret = 'PRIVATE_PROMPT_MUST_NOT_APPEAR';
  const view = projectEonCityW750CommandCentreView({
    nexusView: nexusView({ rawPrompt: secret, projectContents: secret }),
    commandSnapshot: { ...commandSnapshot(), privateAccount: secret },
    theatreSnapshot: theatreSnapshot([{ ...realJobs()[0], prompt: secret, rawOutput: secret, credentials: secret }]),
    districtCount: 9
  });
  assert.doesNotMatch(JSON.stringify(view), new RegExp(secret));
  assert.equal(view.privacy.rawPrompts, false);
  assert.equal(view.privacy.rawOutputs, false);
  assert.equal(view.privacy.paymentRecords, false);
});

test('W750 fails closed when all source readers are unavailable and never invents placeholder status cards', () => {
  const projected = projectEonCityW750CommandCentreView({ nexusView: {}, commandSnapshot: {}, theatreSnapshot: {}, districtCount: 9 });
  assert.equal(getEonCityW750Wall(projected, 'work').cards.length, 1);
  assert.equal(getEonCityW750Wall(projected, 'review').cards.length, 2);
  assert.equal(getEonCityW750Wall(projected, 'systems').cards.length, 0);
  assert.equal(getEonCityW750Wall(projected, 'agent-theatre').cards.length, 0);
  assert.equal(getEonCityW750Wall(projected, 'agent-theatre').jobs.length, 0);

  const environment = new EventTarget();
  environment.CustomEvent = FakeCustomEvent;
  const controller = createEonCityW750CommandCentre({
    scene: {}, stationRecord: { root: new FakeTransformNode('command-station') }, MeshBuilder: FakeMeshBuilder,
    TransformNode: FakeTransformNode, Vector3: class {}, materials: {}, environment,
    getNexusView() { throw new Error('nexus unavailable'); },
    getCommandSnapshot() { throw new Error('storage unavailable'); },
    getTheatreSnapshot() { throw new Error('receipt reader unavailable'); },
    districtCount: 9
  });
  assert.equal(controller.ok, true);
  assert.equal(getEonCityW750Wall(controller.getView(), 'systems').cards.length, 0);
  assert.equal(getEonCityW750Wall(controller.getView(), 'agent-theatre').jobs.length, 0);
  assert.doesNotThrow(() => controller.refresh('reader-fallback'));
  controller.dispose();
});

test('W750 Babylon presenter shows receipt actors only for genuine receipts and disposes its own graph', () => {
  const environment = new EventTarget();
  environment.CustomEvent = FakeCustomEvent;
  let currentNexus = nexusView();
  let currentCommand = commandSnapshot();
  let currentTheatre = theatreSnapshot([]);
  const commandListeners = new Set();
  const theatreListeners = new Set();
  const events = [];
  environment.addEventListener(EON_CITY_W750_VIEW_EVENT, (event) => events.push(event.detail));
  const sharedMaterial = { id: 'shared', disposed: false };
  const controller = createEonCityW750CommandCentre({
    scene: {}, stationRecord: { root: new FakeTransformNode('command-station') }, MeshBuilder: FakeMeshBuilder,
    TransformNode: FakeTransformNode, Vector3: class {}, materials: { structure: sharedMaterial, signal: sharedMaterial, cyan: sharedMaterial, amber: sharedMaterial, mint: sharedMaterial, violet: sharedMaterial, magenta: sharedMaterial },
    environment, getNexusView: () => currentNexus, getCommandSnapshot: () => currentCommand, getTheatreSnapshot: () => currentTheatre,
    subscribeCommand(listener) { commandListeners.add(listener); listener(currentCommand); return () => commandListeners.delete(listener); },
    subscribeTheatre(listener) { theatreListeners.add(listener); listener(currentTheatre); return () => theatreListeners.delete(listener); },
    districtCount: 9
  });
  assert.equal(controller.ok, true);
  assert.ok(events.length >= 1);
  assert.equal(getEonCityW750Wall(controller.getView(), 'agent-theatre').jobs.length, 0);
  const receiptNodes = controller.root.disposed === false;
  assert.equal(receiptNodes, true);

  currentTheatre = theatreSnapshot(realJobs());
  for (const listener of theatreListeners) listener(currentTheatre);
  assert.equal(getEonCityW750Wall(controller.getView(), 'agent-theatre').jobs.length, 2);
  assert.equal(controller.inspectWall('agent-theatre').ok, true);
  assert.equal(controller.getSelectedWall(), 'agent-theatre');
  assert.doesNotThrow(() => controller.update(750_000));

  currentNexus = nexusView({ state: 'offline' });
  environment.dispatchEvent(new FakeCustomEvent('eon:city-w749-nexus-view-changed', { detail: { view: currentNexus } }));
  assert.equal(controller.getView().nexusState, 'offline');
  controller.dispose();
  assert.equal(controller.root.disposed, true);
  assert.equal(sharedMaterial.disposed, false);
  assert.equal(commandListeners.size, 0);
  assert.equal(theatreListeners.size, 0);
});

test('W750 registry, runtime, Dock, release and build gates converge on one command-centre adapter', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  const moduleSource = read('assets/js/city/w750/eon-city-w750-command-centre.js');
  const adapter = read('assets/js/work-surface/adapters/eon-command-centre-panel.js');
  const registry = read('assets/js/contracts/work-surface/eon-work-surface-registry.js');
  const host = read('assets/js/work-surface/eon-work-surface-host.js');
  const css = read('assets/css/eon-work-surface.css');
  const sw = read('sw.js');
  const publicSw = read('public/sw.js');
  const build = read('scripts/build-production.mjs');

  assert.equal(getEonWorkSurfaceDefinition('command-centre').adapter, '/assets/js/work-surface/adapters/eon-command-centre-panel.js');
  assert.equal(getEonWorkSurfaceDefinition('agent-theatre').adapter, '/assets/js/work-surface/adapters/eon-command-centre-panel.js');
  assert.equal(normalizeEonWorkSurfaceInvocation({ id: 'command-status', presentationMode: 'dock' }).id, 'command-status');
  assert.equal(getEonWorkSurfaceDefinition('command-status').adapter, '/assets/js/work-surface/adapters/eon-command-centre-panel.js');
  assert.match(runtime, /createEonCityTruthfulCommandCenterController/);
  assert.match(runtime, /createEonCityGenuineAgentTheatreController/);
  assert.match(runtime, /createEonCityW750CommandCentre/);
  assert.match(runtime, /commandWallId/);
  assert.match(moduleSource, /metadata\?\.commandWallId/);
  assert.match(runtime, /refreshCommandCentre/);
  assert.match(runtime, /inspectCommandCentreWall/);
  assert.match(runtime, /reviewAgentTheatreJob/);
  assert.match(runtime, /commandCentre\.update/);
  assert.match(runtime, /commandCentre\.dispose/);
  assert.match(moduleSource, /No receipt means a still empty stage/);
  assert.match(moduleSource, /authoritativeProgress/);
  assert.match(adapter, /EON_CITY_W750_VIEW_EVENT/);
  assert.match(adapter, /data-eon-command-wall/);
  assert.match(adapter, /data-eon-command-job/);
  assert.doesNotMatch(adapter, /command-centre-dock-mounted/);
  assert.match(registry, /id: 'command-centre'/);
  assert.match(registry, /id: 'agent-theatre'/);
  assert.match(host, /eon-command-centre-panel\.js/);
  assert.match(css, /\.eon-command-centre-dock/);
  assert.match(css, /max-width:600px/);
  assert.match(sw, /RELEASE_ID = 'w765-2026-07-31-release-identity-source-template'/);
  assert.equal(publicSw, sw);
  assert.match(build, /eon\.city\.command-centre-live-walls\.w750\.v1/);
});
