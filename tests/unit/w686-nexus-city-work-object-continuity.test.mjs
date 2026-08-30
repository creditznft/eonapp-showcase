import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createEonNexusW686Handoff,
  getEonNexusW686WorkObjectTruth,
  normalizeEonNexusW686Handoff,
  projectEonNexusW686WorkObject
} from '../../assets/js/nexus/w686/eon-nexus-w686-work-object-continuity.js';
import {
  readEonNexusContinuitySnapshot,
  writeEonNexusContinuitySnapshot
} from '../../assets/js/nexus/eon-nexus-continuity-contract.js';
import { projectEonCityW660nNexusView } from '../../assets/js/city/w660n/eon-city-w660n-nexus-continuity.js';
import { getEonCityW660NexusStation } from '../../assets/js/city/w660/eon-city-w660-nexus-stations.js';

function memoryStorage() { const rows = new Map(); return { getItem: (key) => rows.get(key) || null, setItem: (key, value) => rows.set(key, value), removeItem: (key) => rows.delete(key) }; }
const snapshot = Object.freeze({
  eonbot: { state: 'ready', statusLabel: 'Ready' }, surface: { id: 'projects', label: 'Projects', route: '/projects' },
  conversation: { id: 'c1', label: 'Private conversation', openRoute: '/' },
  project: { id: 'p1', selected: true, label: 'EONAPP', status: 'active', openRoute: '/projects?p=p1' },
  task: { id: 't1', label: 'Build', state: 'ready', stageLabel: 'Ready' }, approval: {}, results: {}, route: {}, atlas: { selected: true, projectId: 'p1' }, nodes: []
});
const selectedResult = Object.freeze({ id: 'result:r1', kind: 'result', label: 'Validated candidate', meta: '2 results available', status: 'complete', action: 'result' });

test('W686 maps each projected work-object kind to a productive physical station', () => {
  assert.equal(projectEonNexusW686WorkObject(selectedResult, snapshot.project).stationId, 'forge-workflow-nexus');
  assert.equal(projectEonNexusW686WorkObject({ ...selectedResult, id: 'approval:a1', kind: 'approval' }, snapshot.project).districtId, 'command-centre');
  assert.equal(projectEonNexusW686WorkObject({ ...selectedResult, id: 'task:t1', kind: 'task' }, snapshot.project).stationId, 'agent-theatre-nexus');
});

test('W686 requires explicit handoff and stores only privacy-projected bounded facts', () => {
  assert.equal(createEonNexusW686Handoff({ selectedWorkObject: selectedResult, project: snapshot.project }).reason, 'explicit-user-action-required');
  const result = createEonNexusW686Handoff({ selectedWorkObject: selectedResult, project: snapshot.project, explicitUserAction: true, now: 1000 });
  assert.equal(result.ok, true);
  assert.equal(result.handoff.workObject.rawContentIncluded, false);
  assert.equal(result.handoff.receipt.autoNavigate, false);
  assert.equal(result.handoff.placement.entryConfirmationRequired, true);

  const tampered = { ...result.handoff, workObject: { ...result.handoff.workObject, districtId: 'orientation-hall', stationId: 'orientation-nexus-guide' } };
  const normalized = normalizeEonNexusW686Handoff(tampered, 2000);
  assert.equal(normalized.workObject.districtId, 'forge-basilica');
  assert.equal(normalized.workObject.stationId, 'forge-workflow-nexus');
  assert.equal(normalizeEonNexusW686Handoff(result.handoff, 1000 + 30 * 60 * 1000), null);
});

test('W686 continuity survives the explicit NEXUS-to-City session handoff', () => {
  const storage = memoryStorage();
  const written = writeEonNexusContinuitySnapshot(snapshot, { storage, explicitUserAction: true, selectedWorkObject: selectedResult, now: 1000 });
  assert.equal(written.ok, true);
  assert.match(written.route, /destination=forge-basilica/);
  const continuity = readEonNexusContinuitySnapshot({ storage, now: 2000 });
  assert.equal(continuity.workObjectHandoff.workObject.id, 'result:r1');
  const station = getEonCityW660NexusStation('forge-workflow-nexus');
  const view = projectEonCityW660nNexusView({ snapshot, continuity, station, districtId: 'forge-basilica', distance: 1, stationActionsAvailable: true });
  assert.equal(view.workObjectHandoff.atTargetStation, true);
  assert.ok(view.actions.some((action) => action.id === 'nexus-work-object-guide'));
  assert.ok(view.actions.every((action) => action.reviewRequired && !action.autoNavigate && !action.autoExecute));
});

test('W686 renders a visible City work object without adding a renderer or automatic action', () => {
  const hologram = fs.readFileSync('assets/js/city/w660/eon-city-w660-nexus-hologram.js', 'utf8');
  const product = fs.readFileSync('assets/js/city/w659n/eon-city-w659n-product-layer.js', 'utf8');
  const shell = fs.readFileSync('assets/js/nexus/eon-nexus-app-shell.js', 'utf8');
  assert.match(hologram, /createWorkObjectVisual/);
  assert.match(hologram, /eon-city-w686-work-object/);
  assert.match(hologram, /interactionKind: 'nexus-work-object'/);
  assert.match(hologram, /prism\.isPickable = true/);
  assert.match(product, /eon-city-nexus-work-object/);
  assert.match(product, /nexus-work-object-out-of-range/);
  assert.match(product, /openPanel\('nexus'\)/);
  assert.match(shell, /selectedWorkObject: model\?\.commandField\?\.selectedObject/);
  const truth = getEonNexusW686WorkObjectTruth();
  assert.equal(truth.automaticNavigation, false);
  assert.equal(truth.automaticExecution, false);
  assert.equal(truth.automaticApproval, false);
});
