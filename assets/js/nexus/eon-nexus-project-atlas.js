/**
 * W662E — selected-project spatial Atlas.
 *
 * The Atlas projects one selected local project and project-bound kernel facts.
 * It keeps the existing truthful adapter, renders the project as the spatial
 * primary visual, and retains a readable list alternative. It invents no
 * milestones, files, relationships or project content.
 */

import { projectEonNexusW685SpatialProjectAtlas } from './w685/eon-nexus-w685-spatial-project-atlas.js';
import { buildEonNexusW705AtlasEntryModel } from './w705/eon-nexus-w705-atlas-entry.js';

export const EON_NEXUS_PROJECT_ATLAS_SCHEMA = 'eon.nexus.project-atlas.w662e.v1';
export const EON_NEXUS_PROJECT_ATLAS_LIMITS = Object.freeze({
  tasks: 12,
  artifacts: 10,
  activity: 8,
  conversations: 4,
  limitations: 5,
  spatialNodes: 12
});

function cleanText(value = '', max = 180) {
  return Array.from(String(value || ''), (character) => {
    const codePoint = character.codePointAt(0) || 0;
    return codePoint < 32 || codePoint === 127 ? ' ' : character;
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
}
function cleanId(value = '', max = 160) { return cleanText(value, max).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, max); }
function safeRoute(value = '', fallback = '/projects') {
  try {
    const url = new URL(String(value || fallback), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid' || !url.pathname.startsWith('/')) return fallback;
    if (/(?:\r|\n|javascript:|data:)/i.test(String(value || ''))) return fallback;
    return `${url.pathname}${url.search}${url.hash}`.slice(0, 500);
  } catch { return fallback; }
}
function safeIso(value = '') { const parsed = Date.parse(String(value || '')); return Number.isFinite(parsed) ? new Date(parsed).toISOString() : ''; }
function sortNewest(rows = []) { return [...rows].sort((a, b) => (Date.parse(b.updatedAt || b.createdAt || '') || 0) - (Date.parse(a.updatedAt || a.createdAt || '') || 0)); }

function projectTask(task = {}, index = 0, detailsOpened = false) {
  const status = ['todo', 'in-progress', 'done'].includes(String(task.status || '')) ? String(task.status) : 'todo';
  return Object.freeze({
    id: cleanId(task.id || `task-${index + 1}`) || `task-${index + 1}`,
    label: detailsOpened && cleanText(task.title, 140) ? cleanText(task.title, 140) : `Task ${index + 1}`,
    status,
    updatedAt: safeIso(task.updatedAt || task.createdAt)
  });
}
function projectArtifact(artifact = {}, index = 0, detailsOpened = false) {
  const kind = ['note', 'output', 'link', 'brief'].includes(String(artifact.type || '')) ? String(artifact.type) : 'note';
  return Object.freeze({
    id: cleanId(artifact.id || `artifact-${index + 1}`) || `artifact-${index + 1}`,
    label: detailsOpened && cleanText(artifact.title, 140) ? cleanText(artifact.title, 140) : `Project item ${index + 1}`,
    kind,
    updatedAt: safeIso(artifact.updatedAt || artifact.createdAt)
  });
}
function projectActivity(record = {}, index = 0) {
  const state = ['draft', 'ready', 'running', 'review-needed', 'completed', 'paused', 'failed', 'cancelled'].includes(String(record.state || ''))
    ? String(record.state) : 'ready';
  const stage = cleanText(record.workflowState || record.stage || state, 64).replace(/[-_]+/g, ' ');
  return Object.freeze({
    id: cleanId(record.taskId || record.id || `activity-${index + 1}`) || `activity-${index + 1}`,
    label: stage ? `Agent activity · ${stage}` : `Agent activity ${index + 1}`,
    state,
    resultCount: Math.max(0, Math.min(32, Array.isArray(record.artifactIds) ? record.artifactIds.length : Number(record.resultCount) || 0)),
    updatedAt: safeIso(record.updatedAt || record.createdAt)
  });
}
function deriveNextAction({ tasks = [], artifacts = [], activity = [], projectRoute = '/projects' } = {}) {
  if (activity.some((row) => row.state === 'review-needed')) return Object.freeze({ kind: 'review', label: 'Review the waiting output', route: '/workspace' });
  if (activity.some((row) => row.state === 'failed')) return Object.freeze({ kind: 'recover', label: 'Review the failed activity', route: '/workspace' });
  if (tasks.some((row) => row.status === 'in-progress')) return Object.freeze({ kind: 'continue-task', label: 'Continue the in-progress task', route: projectRoute });
  if (tasks.some((row) => row.status === 'todo')) return Object.freeze({ kind: 'start-task', label: 'Start the next task', route: projectRoute });
  if (artifacts.length) return Object.freeze({ kind: 'review-project-items', label: 'Review the project items', route: projectRoute });
  return Object.freeze({ kind: 'add-task', label: 'Add the first project task', route: projectRoute });
}

export function projectEonNexusProjectAtlas({ activeProjectContext = null, project = null, thread = null, taskRecords = [], detailsOpened = false } = {}) {
  const context = activeProjectContext && typeof activeProjectContext === 'object' ? activeProjectContext : {};
  const record = project && typeof project === 'object' ? project : {};
  const projectId = cleanId(context.projectId || record.id);
  if (!projectId || cleanId(record.id) !== projectId) {
    return Object.freeze({
      schema: EON_NEXUS_PROJECT_ATLAS_SCHEMA, selected: false, projectId: '', projectLabel: 'No project selected', projectStatus: 'none',
      projectRoute: '/projects', detailsOpened: false, conversations: Object.freeze([]), tasks: Object.freeze([]), artifacts: Object.freeze([]),
      activity: Object.freeze([]), incompleteCount: 0, completedTaskCount: 0,
      nextAction: Object.freeze({ kind: 'select-project', label: 'Select a project', route: '/projects' }), limitations: Object.freeze([])
    });
  }
  const projectRoute = safeRoute(context.route || '/projects', '/projects');
  const tasks = Object.freeze((Array.isArray(record.tasks) ? record.tasks : []).slice(0, EON_NEXUS_PROJECT_ATLAS_LIMITS.tasks).map((task, i) => projectTask(task, i, detailsOpened)));
  const artifacts = Object.freeze((Array.isArray(record.artifacts) ? record.artifacts : []).slice(0, EON_NEXUS_PROJECT_ATLAS_LIMITS.artifacts).map((artifact, i) => projectArtifact(artifact, i, detailsOpened)));
  const activity = Object.freeze(sortNewest((Array.isArray(taskRecords) ? taskRecords : []).filter((row) => cleanId(row?.projectId) === projectId).map(projectActivity)).slice(0, EON_NEXUS_PROJECT_ATLAS_LIMITS.activity));
  const linkedConversationId = cleanId(context.conversationId || context.threadId);
  const threadId = cleanId(thread?.id);
  const conversationLinked = Boolean(linkedConversationId && threadId && linkedConversationId === threadId);
  const conversations = Object.freeze(conversationLinked ? [Object.freeze({
    id: threadId,
    label: detailsOpened && cleanText(thread?.title, 120) ? cleanText(thread.title, 120) : 'Private related conversation',
    messageCount: Math.max(0, Math.min(500, Array.isArray(thread?.messages) ? thread.messages.length : 0)),
    route: safeRoute(`/?thread=${encodeURIComponent(threadId)}`, '/'),
    updatedAt: safeIso(thread?.updatedAt || thread?.createdAt)
  })] : []);
  const limitations = [];
  if (!conversationLinked) limitations.push('No durable conversation-to-project link is currently recorded.');
  limitations.push('The current Projects store has no distinct milestone records.');
  limitations.push('Project items are local artefacts; no first-class linked file records are exposed here.');
  const incompleteCount = tasks.filter((task) => task.status !== 'done').length + activity.filter((row) => !['completed', 'cancelled'].includes(row.state)).length;
  return Object.freeze({
    schema: EON_NEXUS_PROJECT_ATLAS_SCHEMA,
    selected: true,
    projectId,
    projectLabel: detailsOpened && cleanText(record.title || context.projectTitle, 180) ? cleanText(record.title || context.projectTitle, 180) : 'Active project',
    projectStatus: ['active', 'paused', 'complete'].includes(String(record.status || '')) ? String(record.status) : 'active',
    projectRoute,
    detailsOpened: detailsOpened === true,
    conversations, tasks, artifacts, activity, incompleteCount,
    completedTaskCount: tasks.filter((task) => task.status === 'done').length,
    nextAction: deriveNextAction({ tasks, artifacts, activity, projectRoute }),
    limitations: Object.freeze(limitations.slice(0, EON_NEXUS_PROJECT_ATLAS_LIMITS.limitations))
  });
}

function spatialNode(row = {}, sector = 'tasks', ring = 1, index = 0, total = 1) {
  const sectorOffset = { tasks: -90, linked: -54, history: -18 }[sector] ?? -90;
  const spacing = 360 / Math.max(1, total);
  return Object.freeze({
    id: cleanId(row.id || `${sector}-${index + 1}`, 160) || `${sector}-${index + 1}`,
    label: cleanText(row.label || `${sector} ${index + 1}`, 140),
    meta: cleanText(row.status || row.state || row.kind || 'linked', 64),
    route: row.route ? safeRoute(row.route, '/projects') : '',
    sector,
    ring,
    angle: Math.round(spacing * index + sectorOffset),
    attention: ['review-needed', 'failed', 'todo'].includes(String(row.state || row.status || ''))
  });
}

export function getEonNexusProjectAtlasSpatialModel(atlas = {}) {
  const source = atlas && typeof atlas === 'object' ? atlas : {};
  if (source.selected !== true) return Object.freeze({ selected: false, nodes: Object.freeze([]), attention: Object.freeze([]) });
  const currentTasks = (source.tasks || []).filter((row) => row.status !== 'done');
  const linked = [...(source.conversations || []), ...(source.artifacts || [])];
  const history = [
    ...(source.tasks || []).filter((row) => row.status === 'done'),
    ...(source.activity || []).filter((row) => row.state === 'completed')
  ];
  const attention = [
    ...(source.activity || []).filter((row) => ['review-needed', 'failed'].includes(row.state)),
    ...(source.tasks || []).filter((row) => row.status === 'todo').slice(0, 2)
  ].slice(0, 4).map((row) => Object.freeze({ id: row.id, label: row.label, state: row.state || row.status || 'waiting' }));
  const nodes = [
    ...currentTasks.slice(0, 4).map((row, index, rows) => spatialNode(row, 'tasks', 1, index, rows.length)),
    ...linked.slice(0, 4).map((row, index, rows) => spatialNode(row, 'linked', 2, index, rows.length)),
    ...history.slice(0, 4).map((row, index, rows) => spatialNode(row, 'history', 3, index, rows.length))
  ].slice(0, EON_NEXUS_PROJECT_ATLAS_LIMITS.spatialNodes);
  return Object.freeze({
    selected: true,
    centre: Object.freeze({
      id: cleanId(source.projectId, 160),
      label: cleanText(source.projectLabel || 'Active project', 180),
      status: cleanId(source.projectStatus || 'active', 48),
      nextActionLabel: cleanText(source.nextAction?.label || 'Open project', 160),
      route: safeRoute(source.nextAction?.route || source.projectRoute, '/projects')
    }),
    nodes: Object.freeze(nodes),
    attention: Object.freeze(attention),
    metrics: Object.freeze({
      tasks: Array.isArray(source.tasks) ? source.tasks.length : 0,
      completed: Number(source.completedTaskCount) || 0,
      projectItems: Array.isArray(source.artifacts) ? source.artifacts.length : 0,
      incomplete: Number(source.incompleteCount) || 0
    }),
    limitations: Object.freeze(Array.isArray(source.limitations) ? source.limitations.slice(0, EON_NEXUS_PROJECT_ATLAS_LIMITS.limitations) : [])
  });
}

function makeElement(documentRef, tag, className = '', text = '') { const node = documentRef.createElement(tag); if (className) node.className = className; if (text) node.textContent = text; return node; }
function renderRows(documentRef, rows = [], emptyText = 'No linked records are available.') {
  const list = makeElement(documentRef, 'ul', 'eon-nexus-atlas__list');
  if (!rows.length) { list.appendChild(makeElement(documentRef, 'li', 'eon-nexus-atlas__empty', emptyText)); return list; }
  for (const row of rows) {
    const item = makeElement(documentRef, 'li', 'eon-nexus-atlas__row');
    const label = makeElement(documentRef, 'strong', '', row.label || 'Project record');
    const metaParts = [row.status || row.state || row.kind || 'linked'];
    if (Number(row.resultCount) > 0) metaParts.push(`${row.resultCount} result${row.resultCount === 1 ? '' : 's'}`);
    if (Number(row.messageCount) > 0) metaParts.push(`${row.messageCount} message${row.messageCount === 1 ? '' : 's'}`);
    const meta = makeElement(documentRef, 'span', '', metaParts.join(' · '));
    item.append(label, meta);
    if (row.route) { const link = makeElement(documentRef, 'a', '', 'Open'); link.href = safeRoute(row.route, '/projects'); item.appendChild(link); }
    list.appendChild(item);
  }
  return list;
}

export function mountEonNexusProjectAtlas({
  adapter,
  document: documentRef = globalThis.document,
  mountTarget = null,
  onClose = null,
  getFocusedWorkObject = null,
  onNodeSelect = null
} = {}) {
  if (!adapter?.getSnapshot || !adapter?.subscribe || !documentRef?.createElement || !mountTarget?.appendChild) return Object.freeze({ ok: false, reason: 'project-atlas-environment-unavailable', dispose() {} });
  const panel = makeElement(documentRef, 'section', 'eon-nexus-atlas');
  panel.dataset.eonNexusProjectAtlas = '1';
  panel.setAttribute('aria-labelledby', 'eon-nexus-atlas-title');
  panel.hidden = true;
  const header = makeElement(documentRef, 'header', 'eon-nexus-atlas__header');
  const titleGroup = makeElement(documentRef, 'div');
  const kicker = makeElement(documentRef, 'p', 'eon-nexus-atlas__kicker', 'SELECTED PROJECT ONLY');
  const title = makeElement(documentRef, 'h3', '', 'Project Atlas'); title.id = 'eon-nexus-atlas-title'; title.tabIndex = -1;
  const subtitle = makeElement(documentRef, 'p', 'eon-nexus-atlas__subtitle', 'No project selected');
  titleGroup.append(kicker, title, subtitle);
  const atlasControls = makeElement(documentRef, 'div', 'eon-nexus-atlas__controls');
  const overviewMode = makeElement(documentRef, 'button', 'eon-nexus-live__button', 'Overview'); overviewMode.type = 'button'; overviewMode.dataset.atlasMode = 'overview';
  const workMode = makeElement(documentRef, 'button', 'eon-nexus-live__button', 'Work'); workMode.type = 'button'; workMode.dataset.atlasMode = 'work';
  const cityMode = makeElement(documentRef, 'button', 'eon-nexus-live__button', 'City'); cityMode.type = 'button'; cityMode.dataset.atlasMode = 'city';
  const rotateLeft = makeElement(documentRef, 'button', 'eon-nexus-live__button', 'Rotate left'); rotateLeft.type = 'button'; rotateLeft.dataset.atlasControl = 'rotate-left';
  const rotateRight = makeElement(documentRef, 'button', 'eon-nexus-live__button', 'Rotate right'); rotateRight.type = 'button'; rotateRight.dataset.atlasControl = 'rotate-right';
  const zoomOut = makeElement(documentRef, 'button', 'eon-nexus-live__button', 'Zoom out'); zoomOut.type = 'button'; zoomOut.dataset.atlasControl = 'zoom-out';
  const zoomIn = makeElement(documentRef, 'button', 'eon-nexus-live__button', 'Zoom in'); zoomIn.type = 'button'; zoomIn.dataset.atlasControl = 'zoom-in';
  const resetView = makeElement(documentRef, 'button', 'eon-nexus-live__button', 'Reset'); resetView.type = 'button'; resetView.dataset.atlasControl = 'reset';
  const close = makeElement(documentRef, 'button', 'eon-nexus-live__button', 'Close Atlas'); close.type = 'button';
  atlasControls.append(overviewMode, workMode, cityMode, rotateLeft, rotateRight, zoomOut, zoomIn, resetView, close);
  header.append(titleGroup, atlasControls);
  const spatial = makeElement(documentRef, 'div', 'eon-nexus-atlas__spatial');
  spatial.setAttribute('role', 'group');
  spatial.setAttribute('aria-label', 'Spatial project universe with real work, outputs, context, history and a reviewed City expression anchor.');
  const entry = makeElement(documentRef, 'section', 'eon-nexus-atlas__entry');
  entry.setAttribute('aria-label', 'Atlas first steps');
  const summary = makeElement(documentRef, 'div', 'eon-nexus-atlas__summary');
  const details = makeElement(documentRef, 'details', 'eon-nexus-atlas__details');
  const detailSummary = makeElement(documentRef, 'summary', '', 'Accessible project records and data limits');
  const sections = makeElement(documentRef, 'div', 'eon-nexus-atlas__sections');
  details.append(detailSummary, sections);
  const action = makeElement(documentRef, 'a', 'eon-nexus-live__button eon-nexus-atlas__next', 'Select a project'); action.href = '/projects';
  panel.append(header, spatial, entry, summary, details, action);
  mountTarget.appendChild(panel);

  let model = null;
  let spatialModel = null;
  let latestSnapshot = null;
  let viewState = { mode: 'overview', rotation: 0, zoom: 1, selectedNodeId: '' };
  let disposed = false;
  const spatialSubscribers = new Set();
  const notifySpatial = (reason = 'atlas-render') => {
    const state = Object.freeze({ reason, model, spatialModel, viewState: Object.freeze({ ...viewState }) });
    for (const callback of spatialSubscribers) {
      try { callback(state); } catch {}
    }
  };
  const render = (snapshot = {}) => {
    latestSnapshot = snapshot;
    model = snapshot?.atlas || {};
    const focusWorkObject = typeof getFocusedWorkObject === 'function' ? getFocusedWorkObject() : null;
    spatialModel = projectEonNexusW685SpatialProjectAtlas(model, viewState, { focusWorkObject });
    panel.hidden = false;
    spatial.replaceChildren();
    entry.replaceChildren();
    summary.replaceChildren();
    sections.replaceChildren();
    spatial.dataset.empty = model.selected === true ? 'false' : 'true';
    if (model.selected !== true) {
      subtitle.textContent = 'Choose one project to give Atlas a clear centre.';
      for (const [ring, label] of [[1, 'NOW'], [2, 'CONNECTED'], [3, 'HISTORY']]) {
        const ringNode = makeElement(documentRef, 'span', `eon-nexus-atlas__ring eon-nexus-atlas__ring--${['one','two','three'][ring-1]}`);
        ringNode.dataset.ringLabel = label;
        spatial.appendChild(ringNode);
      }
      const centre = makeElement(documentRef, 'div', 'eon-nexus-atlas__centre eon-nexus-atlas__centre--empty');
      centre.append(makeElement(documentRef, 'strong', '', 'Choose a project'), makeElement(documentRef, 'span', '', 'Your project becomes the centre'), makeElement(documentRef, 'small', '', 'Tasks, outputs, conversations and completed work will orbit here without exposing private content.'));
      spatial.appendChild(centre);
      const empty = makeElement(documentRef, 'p', 'eon-nexus-atlas__empty-guide', 'Atlas stays truthful until you select a project. No fake milestones or activity are generated.');
      spatial.appendChild(empty);
      const entryModel = buildEonNexusW705AtlasEntryModel(snapshot);
      entry.append(makeElement(documentRef, 'h4', '', entryModel.title), makeElement(documentRef, 'p', '', entryModel.detail));
      const entryGrid = makeElement(documentRef, 'div', 'eon-nexus-atlas__entry-grid');
      for (const entryAction of entryModel.actions) {
        const link = makeElement(documentRef, 'a', 'eon-nexus-atlas__entry-action');
        link.href = safeRoute(entryAction.href, '/projects');
        link.dataset.atlasEntryAction = entryAction.id;
        link.dataset.kind = entryAction.kind;
        link.append(makeElement(documentRef, 'strong', '', entryAction.label), makeElement(documentRef, 'span', '', entryAction.detail));
        entryGrid.appendChild(link);
      }
      entry.appendChild(entryGrid);
      entry.hidden = false;
      action.textContent = 'Open Projects';
      action.href = '/projects';
      panel.dataset.atlasMode = viewState.mode;
      for (const button of [overviewMode, workMode, cityMode]) button.setAttribute('aria-pressed', String(button.dataset.atlasMode === viewState.mode));
      notifySpatial('atlas-empty-render');
      return;
    }
    entry.hidden = true;
    const map = getEonNexusProjectAtlasSpatialModel(model);
    spatialModel = projectEonNexusW685SpatialProjectAtlas(model, viewState, { focusWorkObject });
    panel.dataset.atlasMode = viewState.mode;
    spatial.style?.setProperty?.('--atlas-view-rotation', `${viewState.rotation}deg`);
    spatial.style?.setProperty?.('--atlas-view-zoom', String(viewState.zoom));
    for (const button of [overviewMode, workMode, cityMode]) button.setAttribute('aria-pressed', String(button.dataset.atlasMode === viewState.mode));
    subtitle.textContent = `${model.projectLabel || 'Active project'} · ${model.projectStatus || 'active'}`;
    for (const [ring, label] of [[1, 'NOW'], [2, 'CONNECTED'], [3, 'HISTORY']]) {
      const ringNode = makeElement(documentRef, 'span', `eon-nexus-atlas__ring eon-nexus-atlas__ring--${['one','two','three'][ring-1]}`);
      ringNode.dataset.ringLabel = label;
      spatial.appendChild(ringNode);
    }
    const centre = makeElement(documentRef, 'a', 'eon-nexus-atlas__centre');
    centre.href = safeRoute(spatialModel.centre.route || map.centre.route, '/projects');
    centre.dataset.spatial = 'true';
    centre.dataset.focusedFromNexus = String(spatialModel.centre.focusedFromNexus === true);
    centre.setAttribute('aria-current', spatialModel.centre.selected ? 'true' : 'false');
    centre.append(makeElement(documentRef, 'strong', '', spatialModel.centre.label), makeElement(documentRef, 'span', '', spatialModel.centre.status), makeElement(documentRef, 'small', '', map.centre.nextActionLabel));
    centre.addEventListener('click', () => { try { onNodeSelect?.(spatialModel.centre, spatialModel); } catch {} });
    spatial.appendChild(centre);
    const positions = new Map([[spatialModel.centre.id, { x: 50, y: 50 }], [spatialModel.cityAnchor.id, spatialModel.cityAnchor], ...spatialModel.nodes.map((node) => [node.id, node])]);
    for (const edge of spatialModel.edges) {
      const from = positions.get(edge.fromId); const to = positions.get(edge.toId);
      if (!from || !to) continue;
      const dx = to.x - from.x; const dy = to.y - from.y;
      const line = makeElement(documentRef, 'span', 'eon-nexus-atlas__edge');
      line.dataset.kind = edge.kind;
      line.style?.setProperty?.('--atlas-edge-x', `${from.x}%`);
      line.style?.setProperty?.('--atlas-edge-y', `${from.y}%`);
      line.style?.setProperty?.('--atlas-edge-angle', `${Math.atan2(dy, dx) * 180 / Math.PI}deg`);
      line.style?.setProperty?.('--atlas-edge-distance', `${Math.hypot(dx, dy)}%`);
      line.style?.setProperty?.('--atlas-edge-strength', String(edge.strength));
      spatial.appendChild(line);
    }
    for (const node of spatialModel.nodes) {
      const item = node.route ? makeElement(documentRef, 'a', 'eon-nexus-atlas__node eon-nexus-atlas__node--spatial') : makeElement(documentRef, 'button', 'eon-nexus-atlas__node eon-nexus-atlas__node--spatial');
      if (node.route) item.href = safeRoute(node.route, '/projects'); else item.type = 'button';
      item.dataset.sector = node.sector;
      item.dataset.kind = node.kind;
      item.dataset.focusedFromNexus = String(node.focusedFromNexus === true);
      item.dataset.attention = node.attention ? 'true' : 'false';
      item.setAttribute('aria-pressed', String(node.selected));
      item.style?.setProperty?.('--atlas-x', `${node.x}%`);
      item.style?.setProperty?.('--atlas-y', `${node.y}%`);
      item.style?.setProperty?.('--atlas-z', String(node.z));
      item.append(makeElement(documentRef, 'strong', '', node.label), makeElement(documentRef, 'span', '', node.meta));
      item.addEventListener('click', (event) => {
        if (!node.route) event.preventDefault();
        viewState.selectedNodeId = node.id;
        try { onNodeSelect?.(node, spatialModel); } catch {}
        render(latestSnapshot || adapter.getSnapshot());
      });
      spatial.appendChild(item);
    }
    const cityAnchor = makeElement(documentRef, 'button', 'eon-nexus-atlas__city-anchor');
    cityAnchor.type = 'button';
    cityAnchor.dataset.active = String(spatialModel.cityAnchor.active);
    cityAnchor.style?.setProperty?.('--atlas-x', `${spatialModel.cityAnchor.x}%`);
    cityAnchor.style?.setProperty?.('--atlas-y', `${spatialModel.cityAnchor.y}%`);
    cityAnchor.append(makeElement(documentRef, 'strong', '', spatialModel.cityAnchor.label), makeElement(documentRef, 'span', '', spatialModel.cityAnchor.meta || 'Select a project first'));
    cityAnchor.addEventListener('click', () => { viewState.mode = 'city'; render(latestSnapshot || adapter.getSnapshot()); });
    spatial.appendChild(cityAnchor);
    const attention = makeElement(documentRef, 'aside', 'eon-nexus-atlas__attention');
    attention.appendChild(makeElement(documentRef, 'strong', '', 'Needs Attention'));
    attention.appendChild(makeElement(documentRef, 'span', '', spatialModel.attentionCount
      ? map.attention.map((row) => `${row.label} · ${row.state}`).join(' | ')
      : 'No waiting approval, failed activity or blocked task is recorded.'));
    spatial.appendChild(attention);

    for (const [label, value] of [['Tasks', map.metrics.tasks], ['Completed', map.metrics.completed], ['Project items', map.metrics.projectItems], ['Incomplete', map.metrics.incomplete]]) {
      const metric = makeElement(documentRef, 'div', 'eon-nexus-atlas__metric');
      metric.append(makeElement(documentRef, 'strong', '', String(value)), makeElement(documentRef, 'span', '', label));
      summary.appendChild(metric);
    }
    const groups = [
      ['Related conversations', model.conversations || [], 'No verified conversation link is recorded for this project.'],
      ['Tasks and milestones', model.tasks || [], 'No project tasks are recorded. Distinct milestone records are not available.'],
      ['Generated content and files', model.artifacts || [], 'No project items are recorded. First-class file links are not available.'],
      ['Previous agent activity', model.activity || [], 'No project-bound agent activity is recorded.']
    ];
    for (const [label, rows, emptyText] of groups) {
      const section = makeElement(documentRef, 'section', 'eon-nexus-atlas__section');
      section.append(makeElement(documentRef, 'h4', '', label), renderRows(documentRef, rows, emptyText));
      sections.appendChild(section);
    }
    if (Array.isArray(model.limitations) && model.limitations.length) {
      const limits = makeElement(documentRef, 'section', 'eon-nexus-atlas__section eon-nexus-atlas__limitations');
      limits.append(makeElement(documentRef, 'h4', '', 'Current data limits'), renderRows(documentRef, model.limitations.map((label) => ({ label, kind: 'not recorded' }))));
      sections.appendChild(limits);
    }
    action.textContent = model.nextAction?.label || 'Open project';
    action.href = safeRoute(model.nextAction?.route || model.projectRoute, '/projects');
    notifySpatial('atlas-project-render');
  };
  const changeView = (patch = {}) => { viewState = { ...viewState, ...patch }; render(latestSnapshot || adapter.getSnapshot()); };
  const selectSpatialNode = (id = '') => {
    const nodeId = cleanId(id);
    if (!nodeId || !spatialModel) return Object.freeze({ ok: false, reason: 'atlas-node-required' });
    if (nodeId === spatialModel.cityAnchor?.id) {
      changeView({ mode: 'city', selectedNodeId: nodeId });
      return Object.freeze({ ok: true, reason: null, node: spatialModel.cityAnchor });
    }
    const node = nodeId === spatialModel.centre?.id
      ? spatialModel.centre
      : [...(spatialModel.nodes || []), ...(spatialModel.allNodes || [])].find((entry) => entry.id === nodeId);
    if (!node) return Object.freeze({ ok: false, reason: 'atlas-node-not-found' });
    viewState = { ...viewState, selectedNodeId: nodeId };
    try { onNodeSelect?.(node, spatialModel); } catch {}
    render(latestSnapshot || adapter.getSnapshot());
    return Object.freeze({ ok: true, reason: null, node });
  };
  for (const button of [overviewMode, workMode, cityMode]) button.addEventListener('click', () => changeView({ mode: button.dataset.atlasMode }));
  rotateLeft.addEventListener('click', () => changeView({ rotation: Math.max(-180, viewState.rotation - 18) }));
  rotateRight.addEventListener('click', () => changeView({ rotation: Math.min(180, viewState.rotation + 18) }));
  zoomOut.addEventListener('click', () => changeView({ zoom: Math.max(.78, Number((viewState.zoom - .08).toFixed(2))) }));
  zoomIn.addEventListener('click', () => changeView({ zoom: Math.min(1.18, Number((viewState.zoom + .08).toFixed(2))) }));
  resetView.addEventListener('click', () => { viewState = { mode: 'overview', rotation: 0, zoom: 1, selectedNodeId: '' }; render(latestSnapshot || adapter.getSnapshot()); });
  const unsubscribe = adapter.subscribe((snapshot) => render(snapshot));
  close.addEventListener('click', () => { panel.hidden = true; try { onClose?.(); } catch {} });
  render(adapter.getSnapshot());
  return Object.freeze({
    ok: true, reason: null, schema: EON_NEXUS_PROJECT_ATLAS_SCHEMA, element: panel, render,
    open() { render(adapter.getSnapshot()); panel.hidden = false; title.focus?.(); },
    close() { panel.hidden = true; }, getViewModel: () => model, getSpatialModel: () => spatialModel, getViewState: () => Object.freeze({ ...viewState }),
    selectSpatialNode,
    subscribeSpatialModel(callback) { if (typeof callback !== 'function') return () => {}; spatialSubscribers.add(callback); return () => spatialSubscribers.delete(callback); },
    dispose() { if (disposed) return; disposed = true; try { unsubscribe?.(); } catch {} spatialSubscribers.clear(); panel.remove?.(); }
  });
}

export function getEonNexusProjectAtlasTruth() {
  return Object.freeze({
    selectedProjectOnly: true,
    opensWithoutSelectedProject: true,
    usefulEmptyEntryActions: true,
    spatialPrimaryRenderer: true,
    centreProject: true,
    threeRings: true,
    fullW685SpatialUniverse: true,
    overviewWorkCityViews: true,
    boundedRotateAndZoom: true,
    explicitCityExpressionAnchor: true,
    needsAttentionSector: true,
    accessibleListAlternative: true,
    selectedProjectChangesUpdateMap: true,
    ownsProjectStore: false,
    ownsConversationStore: false,
    ownsTaskRuntime: false,
    rawProjectSummaryRead: false,
    rawTaskNoteRead: false,
    rawArtifactContentRead: false,
    labelsRedactedByDefault: true,
    missingRelationshipsInvented: false,
    wholeAccountGalaxy: false,
    startsAiWork: false,
    externalEffect: false
  });
}

export default Object.freeze({
  EON_NEXUS_PROJECT_ATLAS_SCHEMA,
  EON_NEXUS_PROJECT_ATLAS_LIMITS,
  projectEonNexusProjectAtlas,
  getEonNexusProjectAtlasSpatialModel,
  mountEonNexusProjectAtlas,
  getEonNexusProjectAtlasTruth
});
