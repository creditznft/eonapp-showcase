/**
 * W685 — full spatial Project Atlas projection.
 *
 * Converts the truthful selected-project Atlas into a bounded, manipulable
 * project universe. It does not invent milestones, relationships, files or
 * activity, and exposes a calm empty universe when no project is selected.
 */
export const EON_NEXUS_W685_SPATIAL_ATLAS_SCHEMA = 'eon.nexus.spatial-project-atlas.w685.v1';
export const EON_NEXUS_W685_MAX_NODES = 24;
export const EON_NEXUS_W685_MAX_EDGES = 36;

const freeze = Object.freeze;
const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
const cleanText = (value = '', max = 180) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanId = (value = '', fallback = '') => cleanText(value, 160).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 160) || fallback;
const round = (value, precision = 2) => Number(Number(value || 0).toFixed(precision));

const SECTORS = freeze({
  work: freeze({ label: 'Work in motion', start: -150, span: 80, radius: 31, z: 2.2 }),
  outputs: freeze({ label: 'Outputs and evidence', start: -52, span: 88, radius: 41, z: 1.2 }),
  context: freeze({ label: 'Conversations and context', start: 52, span: 82, radius: 45, z: -0.5 }),
  history: freeze({ label: 'Completed history', start: 148, span: 72, radius: 48, z: -1.8 }),
  city: freeze({ label: 'City expression', start: 244, span: 1, radius: 38, z: 0.6 })
});

function sourceRows(atlas = {}) {
  const tasks = Array.isArray(atlas.tasks) ? atlas.tasks : [];
  const artifacts = Array.isArray(atlas.artifacts) ? atlas.artifacts : [];
  const conversations = Array.isArray(atlas.conversations) ? atlas.conversations : [];
  const activity = Array.isArray(atlas.activity) ? atlas.activity : [];
  return [
    ...tasks.filter((row) => row.status !== 'done').map((row) => ({ ...row, atlasKind: 'task', sector: 'work' })),
    ...activity.filter((row) => !['completed', 'cancelled'].includes(row.state)).map((row) => ({ ...row, atlasKind: 'activity', sector: 'work' })),
    ...artifacts.map((row) => ({ ...row, atlasKind: 'artifact', sector: 'outputs' })),
    ...conversations.map((row) => ({ ...row, atlasKind: 'conversation', sector: 'context' })),
    ...tasks.filter((row) => row.status === 'done').map((row) => ({ ...row, atlasKind: 'task', sector: 'history' })),
    ...activity.filter((row) => ['completed', 'cancelled'].includes(row.state)).map((row) => ({ ...row, atlasKind: 'activity', sector: 'history' }))
  ].slice(0, EON_NEXUS_W685_MAX_NODES - 1);
}

function focusSector(kind = '') {
  if (['approval', 'task', 'project'].includes(kind)) return 'work';
  if (kind === 'result') return 'outputs';
  if (kind === 'conversation') return 'context';
  return 'context';
}

function mergeFocusedWorkObject(rows = [], focusWorkObject = null, projectId = '') {
  if (!focusWorkObject?.id) return freeze({ rows: freeze([...rows]), focusNodeId: '', focusWorkObjectId: '' });
  const workObjectId = cleanId(focusWorkObject.id);
  const sourceId = cleanId(focusWorkObject.sourceId || focusWorkObject.id);
  const kind = cleanId(focusWorkObject.kind, 'tool');
  if (kind === 'project' && sourceId && sourceId === cleanId(projectId)) {
    return freeze({ rows: freeze([...rows]), focusNodeId: cleanId(projectId), focusWorkObjectId: workObjectId, focusCentre: true });
  }
  const matchingIndex = rows.findIndex((row) => {
    const rowId = cleanId(row.id);
    const rowKind = cleanId(row.atlasKind);
    return (rowKind === kind && rowId === sourceId)
      || (kind === 'conversation' && rowKind === 'conversation' && rowId === sourceId)
      || (kind === 'task' && rowKind === 'task' && rowId === sourceId);
  });
  const nextRows = [...rows];
  if (matchingIndex >= 0) {
    const matched = nextRows[matchingIndex];
    const focusNodeId = cleanId(`${matched.atlasKind}:${matched.id}`);
    nextRows[matchingIndex] = {
      ...matched,
      focusWorkObjectId: workObjectId,
      focusedFromNexus: true,
      nodeId: focusNodeId
    };
    return freeze({ rows: freeze(nextRows), focusNodeId, focusWorkObjectId: workObjectId });
  }
  const focusNodeId = cleanId(`nexus-focus:${workObjectId}`, 'nexus-focus:work-object');
  nextRows.unshift({
    id: sourceId || workObjectId,
    nodeId: focusNodeId,
    atlasKind: kind,
    sector: focusSector(kind),
    label: cleanText(focusWorkObject.label || kind, 150),
    status: cleanText(focusWorkObject.status || 'available', 72),
    state: cleanText(focusWorkObject.status || 'available', 72),
    kind,
    route: cleanText(focusWorkObject.route || '', 500),
    focusWorkObjectId: workObjectId,
    focusedFromNexus: true
  });
  return freeze({
    rows: freeze(nextRows.slice(0, EON_NEXUS_W685_MAX_NODES - 1)),
    focusNodeId,
    focusWorkObjectId: workObjectId
  });
}

function projectNode(row, index, sectorRows, view) {
  const sector = SECTORS[row.sector] || SECTORS.context;
  const sectorIndex = sectorRows.findIndex((entry) => entry === row);
  const total = Math.max(1, sectorRows.length);
  const angle = sector.start + sector.span * ((sectorIndex + 0.5) / total) + Number(view.rotation || 0);
  const radians = angle * Math.PI / 180;
  const attention = ['review-needed', 'failed', 'todo'].includes(String(row.state || row.status || ''));
  const nodeId = cleanId(row.nodeId || `${row.atlasKind}:${row.id || index + 1}`, `${row.atlasKind}-${index + 1}`);
  const selected = cleanId(view.selectedNodeId) === nodeId;
  const radius = sector.radius * Number(view.zoom || 1) + (index % 2 ? 1.6 : -1.2);
  return freeze({
    id: nodeId,
    sourceId: cleanId(row.id, `${row.atlasKind}-${index + 1}`),
    kind: row.atlasKind,
    sector: row.sector,
    sectorLabel: sector.label,
    label: cleanText(row.label || `${row.atlasKind} ${index + 1}`, 150),
    meta: cleanText(row.status || row.state || row.kind || 'linked', 72),
    route: cleanText(row.route || '', 500),
    x: round(50 + Math.cos(radians) * radius),
    y: round(50 + Math.sin(radians) * radius * 0.66),
    z: round(sector.z + (attention ? 1.1 : 0) + (selected ? 1.7 : 0)),
    angle: round(angle),
    radius: round(radius),
    attention,
    selected,
    focusedFromNexus: row.focusedFromNexus === true,
    focusWorkObjectId: cleanId(row.focusWorkObjectId),
    canOpen: Boolean(row.route),
    explicitUserActionRequired: true
  });
}

function edge(fromId, toId, kind, strength = 0.5) {
  if (!fromId || !toId || fromId === toId) return null;
  return freeze({ id: cleanId(`${kind}:${fromId}->${toId}`, `${kind}:edge`), fromId, toId, kind, strength: round(clamp(strength, 0.1, 1)), autoAction: false });
}

function buildEdges(projectId, nodes) {
  const rows = [];
  const add = (value) => { if (value && rows.length < EON_NEXUS_W685_MAX_EDGES) rows.push(value); };
  for (const node of nodes) add(edge(projectId, node.id, `project-${node.sector}`, node.attention ? 0.92 : 0.62));
  for (const sector of Object.keys(SECTORS)) {
    const sectorNodes = nodes.filter((node) => node.sector === sector);
    for (let index = 1; index < sectorNodes.length; index += 1) add(edge(sectorNodes[index - 1].id, sectorNodes[index].id, `${sector}-continuity`, 0.34));
  }
  return freeze(rows);
}

export function projectEonNexusW685SpatialProjectAtlas(atlas = {}, viewState = {}, { focusWorkObject = null } = {}) {
  const requestedView = {
    mode: ['overview', 'work', 'city'].includes(String(viewState.mode || '')) ? String(viewState.mode) : 'overview',
    rotation: clamp(viewState.rotation, -180, 180),
    zoom: clamp(viewState.zoom || 1, 0.78, 1.18),
    selectedNodeId: cleanId(viewState.selectedNodeId)
  };
  const selected = atlas?.selected === true && cleanId(atlas.projectId);
  if (!selected) {
    return freeze({
      schema: EON_NEXUS_W685_SPATIAL_ATLAS_SCHEMA,
      selected: false,
      view: freeze(requestedView),
      centre: freeze({ id: 'unselected-project', label: 'Choose a project', status: 'empty', x: 50, y: 50, z: 0 }),
      nodes: freeze([]),
      edges: freeze([]),
      sectors: freeze(Object.entries(SECTORS).map(([id, value]) => freeze({ id, ...value, count: 0 }))),
      cityAnchor: freeze({ id: 'city-anchor', label: 'City expression awaits a project', x: 28, y: 82, z: -0.2, active: false }),
      instruction: 'Select one project to assemble its real tasks, outputs, conversations and history.',
      emptyUniverse: true,
      fakeRecordsGenerated: false,
      startsAiWork: false,
      automaticNavigation: false
    });
  }

  const projectId = cleanId(atlas.projectId, 'active-project');
  const focus = mergeFocusedWorkObject(sourceRows(atlas), focusWorkObject, projectId);
  const view = freeze({ ...requestedView, selectedNodeId: requestedView.selectedNodeId || focus.focusNodeId });
  const rows = focus.rows;
  const nodes = rows.map((row, index) => projectNode(row, index, rows.filter((entry) => entry.sector === row.sector), view));
  const citySector = SECTORS.city;
  const cityAngle = (citySector.start + Number(view.rotation || 0)) * Math.PI / 180;
  const cityAnchor = freeze({
    id: 'city-anchor',
    label: 'EONCITY expression',
    meta: 'Reviewed project object handoff',
    x: round(50 + Math.cos(cityAngle) * citySector.radius * view.zoom),
    y: round(50 + Math.sin(cityAngle) * citySector.radius * view.zoom * 0.66),
    z: citySector.z,
    active: true,
    explicitUserActionRequired: true,
    route: '/eoncity?nexus=spatial&destination=core'
  });
  const edges = [...buildEdges(projectId, nodes), edge(projectId, cityAnchor.id, 'project-city-expression', 0.78)].filter(Boolean).slice(0, EON_NEXUS_W685_MAX_EDGES);
  const sectors = Object.entries(SECTORS).map(([id, value]) => freeze({ id, ...value, count: id === 'city' ? 1 : nodes.filter((node) => node.sector === id).length }));
  const visibleNodes = view.mode === 'work'
    ? nodes.filter((node) => node.sector === 'work' || node.attention)
    : view.mode === 'city'
      ? nodes.filter((node) => ['outputs', 'work'].includes(node.sector)).slice(0, 8)
      : nodes;
  return freeze({
    schema: EON_NEXUS_W685_SPATIAL_ATLAS_SCHEMA,
    selected: true,
    view,
    centre: freeze({
      id: projectId,
      sourceId: projectId,
      kind: 'project',
      label: cleanText(atlas.projectLabel || 'Active project', 180),
      status: cleanId(atlas.projectStatus, 'active'),
      x: 50,
      y: 50,
      z: 3.2,
      route: cleanText(atlas.projectRoute || '/projects', 500),
      selected: view.selectedNodeId === projectId,
      focusedFromNexus: focus.focusCentre === true,
      focusWorkObjectId: focus.focusCentre === true ? focus.focusWorkObjectId : ''
    }),
    nodes: freeze(visibleNodes),
    allNodes: freeze(nodes),
    edges: freeze(edges.filter((entry) => entry.fromId === projectId || visibleNodes.some((node) => node.id === entry.fromId || node.id === entry.toId))),
    sectors: freeze(sectors),
    cityAnchor,
    focusWorkObjectId: focus.focusWorkObjectId,
    focusNodeId: focus.focusNodeId,
    focusPreserved: Boolean(focus.focusNodeId),
    attentionCount: nodes.filter((node) => node.attention).length,
    instruction: view.mode === 'city' ? 'Select a real work object, inspect its proposed City placement, then confirm entry separately.' : 'Select, inspect and navigate real project relationships. No work runs from Atlas automatically.',
    emptyUniverse: false,
    fakeRecordsGenerated: false,
    startsAiWork: false,
    automaticNavigation: false,
    automaticCityPlacement: false,
    oneSelectedProject: true
  });
}

export function getEonNexusW685SpatialAtlasTruth() {
  return freeze({
    schema: EON_NEXUS_W685_SPATIAL_ATLAS_SCHEMA,
    fullSpatialProjectUniverse: true,
    realTasksOutputsConversationsHistory: true,
    boundedNodes: EON_NEXUS_W685_MAX_NODES,
    boundedEdges: EON_NEXUS_W685_MAX_EDGES,
    emptyUniverseWithoutFakeRecords: true,
    cityExpressionAnchor: true,
    preservesSelectedNexusWorkObject: true,
    accessibleEquivalentRequired: true,
    startsAiWork: false,
    automaticNavigation: false,
    automaticCityPlacement: false,
    privateContentRead: false
  });
}

export default freeze({ EON_NEXUS_W685_SPATIAL_ATLAS_SCHEMA, EON_NEXUS_W685_MAX_NODES, EON_NEXUS_W685_MAX_EDGES, projectEonNexusW685SpatialProjectAtlas, getEonNexusW685SpatialAtlasTruth });
