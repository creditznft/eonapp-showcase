import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_NEXUS_W685_MAX_EDGES,
  EON_NEXUS_W685_MAX_NODES,
  getEonNexusW685SpatialAtlasTruth,
  projectEonNexusW685SpatialProjectAtlas
} from '../../assets/js/nexus/w685/eon-nexus-w685-spatial-project-atlas.js';

const atlas = Object.freeze({
  selected: true, projectId: 'p1', projectLabel: 'EONAPP', projectStatus: 'active', projectRoute: '/projects?p=p1',
  tasks: [{ id: 't1', label: 'Build Atlas', status: 'in-progress' }, { id: 't2', label: 'Review output', status: 'todo' }, { id: 't3', label: 'Baseline', status: 'done' }],
  artifacts: [{ id: 'a1', label: 'Atlas candidate', kind: 'output' }],
  conversations: [{ id: 'c1', label: 'Private related conversation', route: '/?thread=c1' }],
  activity: [{ id: 'r1', label: 'Agent activity · review needed', state: 'review-needed' }, { id: 'r2', label: 'Agent activity · completed', state: 'completed' }]
});

test('W685 assembles one real selected project universe with a City anchor', () => {
  const model = projectEonNexusW685SpatialProjectAtlas(atlas);
  assert.equal(model.selected, true);
  assert.equal(model.centre.id, 'p1');
  assert.ok(model.nodes.length <= EON_NEXUS_W685_MAX_NODES);
  assert.ok(model.edges.length <= EON_NEXUS_W685_MAX_EDGES);
  assert.equal(model.cityAnchor.active, true);
  assert.ok(model.nodes.some((node) => node.sector === 'work'));
  assert.ok(model.nodes.some((node) => node.sector === 'outputs'));
  assert.ok(model.nodes.some((node) => node.sector === 'history'));
});

test('W685 view modes and rotation change presentation without changing real records', () => {
  const overview = projectEonNexusW685SpatialProjectAtlas(atlas, { mode: 'overview' });
  const work = projectEonNexusW685SpatialProjectAtlas(atlas, { mode: 'work', rotation: 18, zoom: 1.1 });
  assert.ok(work.nodes.length < overview.nodes.length);
  assert.ok(work.nodes.every((node) => node.sector === 'work' || node.attention));
  assert.notEqual(work.cityAnchor.x, overview.cityAnchor.x);
  assert.deepEqual(new Set(work.allNodes.map((node) => node.id)), new Set(overview.allNodes.map((node) => node.id)));
});

test('W685 calm empty universe does not generate fake project records', () => {
  const empty = projectEonNexusW685SpatialProjectAtlas({ selected: false });
  assert.equal(empty.selected, false);
  assert.equal(empty.nodes.length, 0);
  assert.equal(empty.fakeRecordsGenerated, false);
  assert.equal(empty.cityAnchor.active, false);
  assert.equal(empty.startsAiWork, false);
});

test('W685 preserves the exact selected NEXUS work object while Atlas shows its project relationships', () => {
  const selectedResult = { id: 'result:current', sourceId: 'result:current', kind: 'result', label: 'Verified current result', status: 'complete', route: '/workspace' };
  const model = projectEonNexusW685SpatialProjectAtlas(atlas, { mode: 'overview' }, { focusWorkObject: selectedResult });
  assert.equal(model.focusWorkObjectId, 'result:current');
  assert.equal(model.focusPreserved, true);
  const focus = model.allNodes.find((node) => node.focusWorkObjectId === 'result:current');
  assert.ok(focus);
  assert.equal(focus.selected, true);
  assert.equal(focus.label, 'Verified current result');

  const selectedProject = projectEonNexusW685SpatialProjectAtlas(atlas, {}, { focusWorkObject: { id: 'project:p1', sourceId: 'p1', kind: 'project', label: 'EONAPP' } });
  assert.equal(selectedProject.centre.focusedFromNexus, true);
  assert.equal(selectedProject.centre.focusWorkObjectId, 'project:p1');
  assert.equal(selectedProject.centre.kind, 'project');
  assert.equal(selectedProject.centre.sourceId, 'p1');
  assert.equal(selectedProject.allNodes.some((node) => node.focusWorkObjectId === 'project:p1'), false);
});

test('W685 is wired into the permanent accessible Atlas panel', () => {
  const source = fs.readFileSync('assets/js/nexus/eon-nexus-project-atlas.js', 'utf8');
  const css = fs.readFileSync('assets/css/eon-nexus-live.css', 'utf8');
  assert.match(source, /projectEonNexusW685SpatialProjectAtlas/);
  assert.match(source, /getSpatialModel/);
  assert.match(source, /getFocusedWorkObject/);
  assert.match(source, /onNodeSelect/);
  assert.match(source, /dataset\.atlasMode/);
  assert.match(css, /W685 — full spatial Project Atlas/);
  const truth = getEonNexusW685SpatialAtlasTruth();
  assert.equal(truth.emptyUniverseWithoutFakeRecords, true);
  assert.equal(truth.automaticCityPlacement, false);
});
