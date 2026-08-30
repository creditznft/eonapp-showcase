/**
 * W662D — recovered Live Nexus visual intelligence workspace.
 *
 * The renderer consumes the same privacy-projected EON NEXUS adapter used by
 * Pulse and Chat. It owns no conversation, task, provider, approval or project
 * store and starts no work automatically. The desktop composition reserves a
 * 55–65% visual command field and keeps the remaining space readable.
 */

import { mountEonNexusProjectAtlas } from './eon-nexus-project-atlas.js';
import { projectEonNexusW668FlagshipState } from './w668/eon-nexus-w668-flagship-state.js';
import { getEonNexusW668CommandModel } from './w668/eon-nexus-w668-command-model.js';
import { projectEonNexusW683MorphicRenderer } from './w683/eon-nexus-w683-morphic-field-renderer.js';
import {
  createEonNexusW684InteractionController,
  createEonNexusW684LocalGestureMode,
  interpretEonNexusW684VoiceCommand
} from './w684/eon-nexus-w684-multimodal-controls.js';
import { projectEonNexusW699CommandClarity } from './w699/eon-nexus-w699-command-clarity.js';
import {
  interpretEonNexusW708KeyboardInput,
  resolveEonNexusW708CapturePolicy,
  resolveEonNexusW708ResponsiveLayout
} from './w708/eon-nexus-w708-responsive-interaction.js';

export const EON_NEXUS_LIVE_SCHEMA = 'eon.nexus.live.w662d.v1';
export const EON_NEXUS_LIVE_MAX_PRIMARY_NODES = 5;

const STATE_LABELS = Object.freeze({
  ready: 'Ready',
  listening: 'Listening',
  processing: 'Working',
  speaking: 'Speaking',
  'waiting-approval': 'Approval waiting',
  complete: 'Complete',
  error: 'Needs attention',
  offline: 'Offline'
});

const STATUS_PRIORITY = Object.freeze({
  active: 8,
  waiting: 7,
  failed: 6,
  selected: 5,
  complete: 4,
  blocked: 3,
  available: 2
});

const TAB_IDS = Object.freeze(['conversation', 'agents', 'results', 'atlas']);

function cleanText(value = '', max = 180) {
  return Array.from(String(value || ''), (character) => {
    const codePoint = character.codePointAt(0) || 0;
    return codePoint < 32 || codePoint === 127 ? ' ' : character;
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanId(value = '', max = 120) {
  return cleanText(value, max).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, max);
}

function safeRoute(value = '', fallback = '/') {
  try {
    const url = new URL(String(value || fallback), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid' || !url.pathname.startsWith('/')) return fallback;
    if (/(?:\r|\n|javascript:|data:)/i.test(String(value || ''))) return fallback;
    return `${url.pathname}${url.search}${url.hash}`.slice(0, 500);
  } catch {
    return fallback;
  }
}

function normalizeNode(node = {}, index = 0) {
  const status = Object.hasOwn(STATUS_PRIORITY, String(node.status || '')) ? String(node.status) : 'available';
  return Object.freeze({
    id: cleanId(node.id || `node-${index + 1}`) || `node-${index + 1}`,
    kind: cleanId(node.kind || 'tool', 64) || 'tool',
    label: cleanText(node.label || 'Tool', 100) || 'Tool',
    status,
    count: Math.max(0, Math.min(999, Number(node.count) || 0)),
    providerKind: ['guide', 'local', 'cloud'].includes(String(node.providerKind || '')) ? String(node.providerKind) : 'guide'
  });
}

function prioritizeNodes(nodes = [], stableOrder = []) {
  const order = new Map((Array.isArray(stableOrder) ? stableOrder : []).map((id, index) => [String(id), index]));
  return (Array.isArray(nodes) ? nodes : [])
    .map(normalizeNode)
    .sort((left, right) => {
      const leftStable = order.has(left.id) ? order.get(left.id) : Number.MAX_SAFE_INTEGER;
      const rightStable = order.has(right.id) ? order.get(right.id) : Number.MAX_SAFE_INTEGER;
      if (leftStable !== rightStable) return leftStable - rightStable;
      const statusDelta = (STATUS_PRIORITY[right.status] || 0) - (STATUS_PRIORITY[left.status] || 0);
      return statusDelta || left.label.localeCompare(right.label);
    });
}


function buildNarrative({ state, task, approval, results, project, connection, surface } = {}) {
  const resultCount = Math.max(0, Number(results?.count) || 0);
  if (approval?.pending === true) return cleanText(approval.label || 'A reviewed decision is waiting. Nothing changes until you approve or reject it.', 320);
  if (state === 'error') return cleanText(connection?.label || 'The active route needs attention. Open Chat for a recovery choice.', 320);
  if (state === 'offline') return cleanText(connection?.label || 'The selected route is unavailable. Existing local work remains unchanged.', 320);
  if (state === 'listening') return 'EONBOT is listening only after your microphone action. No background capture is running.';
  if (state === 'speaking') return 'EONBOT is speaking the current response. Stop and Chat remain available.';
  if (state === 'processing') return cleanText(task?.stageLabel || surface?.statusLabel || 'Working on the current foreground step.', 320);
  if (state === 'complete') return cleanText(resultCount ? (results?.label || `${resultCount} results are ready to review.`) : 'The current foreground step is complete.', 320);
  if (resultCount) return cleanText(results?.label || `${resultCount} results are ready to review.`, 320);
  if (project?.selected === true) return 'The selected project, current route and EONBOT state are synchronized across Pulse, Nexus and City.';
  return cleanText(surface?.summary || 'The same private EONBOT conversation remains available in Chat, Nexus and City.', 320);
}

export function getEonNexusLiveViewModel(snapshot = {}, {
  selectedNodeId = '',
  stableNodeOrder = [],
  selectedWorkObjectId = '',
  stableWorkObjectOrder = [],
  interactionState = null
} = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const eonbot = source.eonbot || {};
  const task = source.task || {};
  const route = source.route || {};
  const approval = source.approval || {};
  const results = source.results || {};
  const project = source.project || {};
  const connection = source.connection || {};
  const surface = source.surface || {};
  const flagship = projectEonNexusW668FlagshipState(source, { surface: 'expanded', stableNodeOrder });
  const commandField = projectEonNexusW683MorphicRenderer(source, {
    selectedObjectId: selectedWorkObjectId,
    stableObjectOrder: stableWorkObjectOrder,
    interactionState
  });
  const state = flagship.state;
  const focusNodeId = cleanId(surface.focusNodeId || '', 100);
  const surfaceOrder = focusNodeId
    ? [focusNodeId, ...(Array.isArray(stableNodeOrder) ? stableNodeOrder : []).filter((id) => id !== focusNodeId)]
    : stableNodeOrder;
  const allNodes = prioritizeNodes(source.nodes, surfaceOrder);
  const flagshipById = new Map(flagship.nodes.map((node) => [node.id, node]));
  const primaryNodes = allNodes.slice(0, EON_NEXUS_LIVE_MAX_PRIMARY_NODES).map((node, index) => Object.freeze({
    ...node,
    ...(flagshipById.get(node.id) || {}),
    displayAngleDeg: flagshipById.get(node.id)?.displayAngleDeg ?? (360 / Math.max(1, Math.min(allNodes.length, EON_NEXUS_LIVE_MAX_PRIMARY_NODES))) * index,
    orbitRadius: flagshipById.get(node.id)?.orbitRadius ?? 0.82
  }));
  const selected = primaryNodes.find((node) => node.id === selectedNodeId)
    || primaryNodes.find((node) => ['active', 'waiting', 'failed', 'selected'].includes(node.status))
    || primaryNodes[0]
    || null;
  const routeLabel = route.privateOnDevice === true
    ? `${cleanText(route.providerLabel || 'Local AI', 90)} · Private on this device`
    : cleanText(route.providerLabel || 'Guide mode', 110);
  const resultCount = Math.max(0, Math.min(999, Number(results.count) || 0));
  const approvalCount = Math.max(0, Math.min(99, Number(approval.count) || 0));
  const surfaceLabel = cleanText(surface.label || '', 80);
  const taskStage = state === 'ready'
    ? 'Ready for your next action'
    : state === 'complete'
      ? cleanText(task.stageLabel || results.label || 'Current step complete', 170)
      : cleanText(task.stageLabel || surface.statusLabel || eonbot.statusLabel || STATE_LABELS[state], 170);
  const statusSummary = buildNarrative({ state, task, approval, results, project, connection, surface });

  return Object.freeze({
    schema: EON_NEXUS_LIVE_SCHEMA,
    state,
    stateLabel: STATE_LABELS[state],
    title: surfaceLabel ? `${surfaceLabel} Nexus · ${STATE_LABELS[state]}` : `EONBOT · ${STATE_LABELS[state]}`,
    kicker: surfaceLabel ? `EON NEXUS · ${surfaceLabel}` : 'EON NEXUS',
    surfaceLabel,
    surfaceRoute: safeRoute(surface.route || '/', '/'),
    taskStage,
    statusSummary,
    routeLabel,
    routeMode: cleanId(route.mode || 'guide', 40) || 'guide',
    privateRoute: route.privateOnDevice === true,
    projectSelected: project.selected === true,
    projectLabel: cleanText(project.label || (project.selected ? 'Active project' : 'No project selected'), 160),
    projectStatus: cleanId(project.status || 'none', 40) || 'none',
    projectRoute: safeRoute(project.openRoute || '/projects', '/projects'),
    atlasAvailable: source.atlas?.selected === true,
    atlasIncompleteCount: Math.max(0, Math.min(999, Number(source.atlas?.incompleteCount) || 0)),
    conversationRoute: safeRoute(source.conversation?.openRoute || '/', '/'),
    conversationLabel: cleanText(source.conversation?.label || 'Private conversation', 120),
    conversationMessageCount: Math.max(0, Math.min(500, Number(source.conversation?.messageCount) || 0)),
    reviewVisible: approval.pending === true,
    approvalCount,
    reviewLabel: cleanText(approval.label || 'Review approval', 150),
    reviewRoute: safeRoute(approval.reviewRoute || '/workspace', '/workspace'),
    resultVisible: resultCount > 0,
    resultCount,
    resultLabel: cleanText(results.label || `${resultCount} results available`, 150),
    resultRoute: safeRoute(results.openRoute || '/workspace', '/workspace'),
    canSpeak: eonbot.canListen === true,
    canStop: task.cancellable === true,
    taskState: cleanId(task.state || 'ready', 60) || 'ready',
    primaryNodes: Object.freeze(primaryNodes),
    allNodes: Object.freeze(allNodes),
    hiddenNodeCount: Math.max(0, allNodes.length - primaryNodes.length),
    selectedNode: selected,
    stableNodeOrder: Object.freeze(allNodes.map((node) => node.id)),
    spatialNexusAvailable: true,
    commandField,
    flagship
  });
}

function makeElement(documentRef, tag, className = '', text = '') {
  const node = documentRef.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function makeButton(documentRef, label, action, className = 'eon-nexus-live__button') {
  const button = makeElement(documentRef, 'button', className, label);
  button.type = 'button';
  button.dataset.action = action;
  return button;
}

function makeLink(documentRef, label, action, href, className = 'eon-nexus-live__button') {
  const link = makeElement(documentRef, 'a', className, label);
  link.dataset.action = action;
  link.href = href;
  return link;
}

export function ensureEonNexusLiveStyles(documentRef) {
  if (!documentRef?.head?.appendChild) return false;
  if (documentRef.querySelector?.('link[data-eon-nexus-live-style]')) return true;
  const link = documentRef.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/css/eon-nexus-live.css';
  link.dataset.eonNexusLiveStyle = '1';
  documentRef.head.appendChild(link);
  return true;
}

export function mountEonNexusLive({
  adapter,
  environment = globalThis,
  document: documentRef = environment?.document || globalThis.document,
  mountTarget = documentRef?.body || null,
  initialMode = 'split',
  onClose = null,
  onOpenChat = null,
  onSpeak = null,
  onStop = null,
  onPause = null,
  onApprove = null,
  onReject = null,
  onReview = null,
  onResult = null,
  onProject = null,
  onNodeSelect = null,
  onEnterSpatialNexus = null,
  gestureDetectorFactory = null,
  onGestureModeChange = null,
  onSignatureFlowEvent = null
} = {}) {
  if (!adapter?.getSnapshot || !adapter?.subscribe || !documentRef?.createElement || !mountTarget?.appendChild) {
    return Object.freeze({ ok: false, reason: 'live-nexus-environment-unavailable', dispose() {} });
  }
  const existing = documentRef.querySelector?.('[data-eon-nexus-live]');
  if (existing) return Object.freeze({ ok: false, reason: 'live-nexus-already-mounted', element: existing, dispose() {} });

  ensureEonNexusLiveStyles(documentRef);
  const root = makeElement(documentRef, 'section', 'eon-nexus-live');
  root.dataset.eonNexusLive = '1';
  root.dataset.mode = 'split';
  root.dataset.eonbotState = 'ready';
  root.dataset.privateRoute = 'false';
  root.dataset.activeTab = 'conversation';
  root.dataset.eonNexusCommandField = 'morphic';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-label', 'EON NEXUS live visual workspace');
  root.setAttribute('aria-modal', 'false');
  root.tabIndex = -1;

  const header = makeElement(documentRef, 'header', 'eon-nexus-live__header');
  const brand = makeElement(documentRef, 'div', 'eon-nexus-live__brand');
  const kicker = makeElement(documentRef, 'p', 'eon-nexus-live__kicker', 'EON NEXUS');
  const heading = makeElement(documentRef, 'h2', '', 'EONBOT · Ready');
  const headerMeta = makeElement(documentRef, 'p', 'eon-nexus-live__header-meta', 'Guide mode');
  brand.append(kicker, heading, headerMeta);
  const headerActions = makeElement(documentRef, 'div', 'eon-nexus-live__header-actions');
  const modeButton = makeButton(documentRef, 'Full screen', 'mode');
  const gestureButton = makeButton(documentRef, 'Gestures off', 'gesture-mode');
  gestureButton.setAttribute('aria-pressed', 'false');
  gestureButton.title = 'Optional local camera gestures. Mouse, touch, keyboard and voice remain primary.';
  const minimizeButton = makeButton(documentRef, 'Minimize', 'minimize');
  const closeButton = makeButton(documentRef, 'Close', 'close');
  headerActions.append(modeButton, minimizeButton, closeButton);
  header.append(brand, headerActions);

  const body = makeElement(documentRef, 'div', 'eon-nexus-live__body');
  const visual = makeElement(documentRef, 'section', 'eon-nexus-live__visual');
  visual.tabIndex = 0;
  visual.setAttribute('aria-label', 'Morphic Command Field. Select a real work object, use left and right arrow keys to rotate, plus and minus to zoom, and zero to reset.');
  const visualGrid = makeElement(documentRef, 'div', 'eon-nexus-live__visual-grid');
  const signalLayer = makeElement(documentRef, 'div', 'eon-nexus-live__signal-field');
  signalLayer.setAttribute('aria-hidden', 'true');
  for (let index = 0; index < 8; index += 1) {
    const signal = makeElement(documentRef, 'span', 'eon-nexus-live__signal');
    signal.style?.setProperty?.('--eon-signal-index', String(index));
    signal.style?.setProperty?.('--eon-signal-angle', `${index * 45}deg`);
    signal.style?.setProperty?.('--eon-signal-delay', `${(-index * 0.22).toFixed(2)}s`);
    signalLayer.appendChild(signal);
  }
  const stageArchitecture = makeElement(documentRef, 'div', 'eon-nexus-live__stage-architecture');
  stageArchitecture.setAttribute('aria-hidden', 'true');
  const stageHorizon = makeElement(documentRef, 'span', 'eon-nexus-live__stage-horizon');
  const stageCoreAxis = makeElement(documentRef, 'span', 'eon-nexus-live__stage-axis');
  const laneLayer = makeElement(documentRef, 'div', 'eon-nexus-live__lane-layer');
  for (const [id, label] of [['intent', 'INTENT'], ['work', 'WORK'], ['context', 'CONTEXT'], ['system', 'SYSTEM']]) {
    const lane = makeElement(documentRef, 'span', 'eon-nexus-live__lane');
    lane.dataset.lane = id;
    lane.textContent = label;
    laneLayer.appendChild(lane);
  }
  stageArchitecture.append(stageHorizon, stageCoreAxis, laneLayer);
  const connectionLayer = makeElement(documentRef, 'div', 'eon-nexus-live__connections');
  const nodeLayer = makeElement(documentRef, 'div', 'eon-nexus-live__work-objects eon-nexus-live__nodes');
  const orbButton = makeButton(documentRef, '', 'orb', 'eon-nexus-live__orb');
  orbButton.setAttribute('aria-label', 'EONBOT status');
  const orbCore = makeElement(documentRef, 'span', 'eon-nexus-live__orb-core');
  const orbRing = makeElement(documentRef, 'span', 'eon-nexus-live__orb-ring');
  const morphicLattice = makeElement(documentRef, 'span', 'eon-nexus-live__morphic-lattice');
  const morphicWave = makeElement(documentRef, 'span', 'eon-nexus-live__morphic-wave');
  const orbLabel = makeElement(documentRef, 'span', 'eon-nexus-live__orb-label', 'Ready');
  orbButton.append(orbRing, morphicLattice, morphicWave, orbCore, orbLabel);
  visualGrid.append(signalLayer, stageArchitecture, connectionLayer, nodeLayer, orbButton);
  const commandField = makeElement(documentRef, 'div', 'eon-nexus-live__command-field');
  const commandStage = makeElement(documentRef, 'strong', '', 'Ready for your next action');
  const commandSummary = makeElement(documentRef, 'span', '', 'The same private EONBOT state is visible across EONAPP.');
  const commandActions = makeElement(documentRef, 'div', 'eon-nexus-live__command-actions');
  const primaryCommand = makeLink(documentRef, 'Continue conversation', 'primary-command', '/', 'eon-nexus-live__button eon-nexus-live__button--primary eon-nexus-live__command-primary');
  const atlasCommand = makeButton(documentRef, 'Choose a project', 'command-atlas', 'eon-nexus-live__button eon-nexus-live__command-secondary');
  const moreCommand = makeButton(documentRef, 'More', 'command-more', 'eon-nexus-live__button eon-nexus-live__command-secondary');
  moreCommand.setAttribute('aria-expanded', 'false');
  const spatialCommand = makeButton(documentRef, 'Enter EON City', 'command-spatial', 'eon-nexus-live__button eon-nexus-live__command-secondary');
  commandActions.append(primaryCommand, atlasCommand, moreCommand);
  const morePanel = makeElement(documentRef, 'section', 'eon-nexus-live__more-panel');
  morePanel.hidden = true;
  morePanel.setAttribute('aria-label', 'Additional Nexus controls');
  const cityContext = makeElement(documentRef, 'p', 'eon-nexus-live__city-context', 'Select a real work object to see its City destination.');
  const gestureStatus = makeElement(documentRef, 'p', 'eon-nexus-live__gesture-status', 'Gestures off. Normal controls remain available.');
  const stopCameraButton = makeButton(documentRef, 'Stop camera', 'stop-gesture-camera');
  stopCameraButton.hidden = true;
  const voiceExamples = makeElement(documentRef, 'p', 'eon-nexus-live__voice-examples', 'Examples: Open Atlas · Select result · Move left · Compare selected · Enter City');
  morePanel.append(spatialCommand, gestureButton, stopCameraButton, cityContext, gestureStatus, voiceExamples);
  commandField.append(commandStage, commandSummary, commandActions, morePanel);
  const rotateControls = makeElement(documentRef, 'div', 'eon-nexus-live__rotate-controls');
  const rotateLeft = makeButton(documentRef, 'Rotate left', 'rotate-left');
  const rotateRight = makeButton(documentRef, 'Rotate right', 'rotate-right');
  const zoomOut = makeButton(documentRef, 'Zoom out', 'zoom-out');
  const resetView = makeButton(documentRef, 'Reset view', 'reset-view');
  const zoomIn = makeButton(documentRef, 'Zoom in', 'zoom-in');
  rotateControls.append(rotateLeft, rotateRight, zoomOut, resetView, zoomIn);
  visual.append(visualGrid, commandField, rotateControls);

  const detail = makeElement(documentRef, 'aside', 'eon-nexus-live__detail');
  const statusStrip = makeElement(documentRef, 'div', 'eon-nexus-live__status-strip');
  const statusDot = makeElement(documentRef, 'span', 'eon-nexus-live__status-dot');
  const statusStripCopy = makeElement(documentRef, 'span', '', 'Ready');
  statusStrip.append(statusDot, statusStripCopy);

  const tabList = makeElement(documentRef, 'div', 'eon-nexus-live__tabs');
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-label', 'Nexus detail views');
  const tabButtons = new Map();
  for (const [id, label] of [['conversation', 'Now'], ['agents', 'Nodes'], ['results', 'Activity'], ['atlas', 'Atlas']]) {
    const tab = makeButton(documentRef, label, `tab-${id}`, 'eon-nexus-live__tab');
    tab.id = `eon-nexus-live-tab-${id}`;
    tab.dataset.tab = id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', `eon-nexus-live-panel-${id}`);
    tab.setAttribute('aria-selected', String(id === 'conversation'));
    tab.tabIndex = id === 'conversation' ? 0 : -1;
    tabButtons.set(id, tab);
    tabList.appendChild(tab);
  }

  const panels = makeElement(documentRef, 'div', 'eon-nexus-live__panels');
  const panelMap = new Map();
  for (const id of TAB_IDS) {
    const panel = makeElement(documentRef, 'section', 'eon-nexus-live__panel');
    panel.id = `eon-nexus-live-panel-${id}`;
    panel.dataset.panel = id;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `eon-nexus-live-tab-${id}`);
    panel.hidden = id !== 'conversation';
    panelMap.set(id, panel);
    panels.appendChild(panel);
  }

  const liveStatus = makeElement(documentRef, 'div', 'eon-nexus-live__status');
  liveStatus.setAttribute('role', 'status');
  liveStatus.setAttribute('aria-live', 'polite');
  liveStatus.setAttribute('aria-atomic', 'true');
  const statusTitle = makeElement(documentRef, 'h3', '', 'Ready');
  const statusStage = makeElement(documentRef, 'p', 'eon-nexus-live__stage', 'Ready for your next action');
  const statusSummary = makeElement(documentRef, 'p', 'eon-nexus-live__summary', 'The same private EONBOT state is visible across EONAPP.');
  liveStatus.append(statusTitle, statusStage, statusSummary);

  const focusCard = makeElement(documentRef, 'section', 'eon-nexus-live__card eon-nexus-live__focus-card');
  const focusKicker = makeElement(documentRef, 'p', 'eon-nexus-live__focus-kicker', 'COMMAND FOCUS');
  const focusTitle = makeElement(documentRef, 'h3', '', 'Private conversation');
  const focusMeta = makeElement(documentRef, 'p', 'eon-nexus-live__focus-meta', 'Select a real work object in the field.');
  const focusActions = makeElement(documentRef, 'div', 'eon-nexus-live__actions eon-nexus-live__focus-actions');
  const focusPrimary = makeButton(documentRef, 'Continue conversation', 'focus-primary', 'eon-nexus-live__button eon-nexus-live__button--primary');
  const focusAsk = makeButton(documentRef, 'Ask EONBOT', 'focus-ask');
  const focusAtlas = makeButton(documentRef, 'Open Atlas', 'focus-atlas');
  const focusSpatial = makeButton(documentRef, 'Enter City', 'focus-spatial');
  focusActions.append(focusPrimary);
  const manipulationBar = makeElement(documentRef, 'div', 'eon-nexus-live__manipulation-bar');
  manipulationBar.setAttribute('aria-label', 'Selected work object controls');
  manipulationBar.hidden = true;
  const groupObject = makeButton(documentRef, 'Group', 'group-object');
  const compareObject = makeButton(documentRef, 'Compare', 'compare-object');
  const parkObject = makeButton(documentRef, 'Park', 'park-object');
  const restoreObject = makeButton(documentRef, 'Restore', 'restore-object');
  const undoLayout = makeButton(documentRef, 'Undo', 'undo-layout');
  const redoLayout = makeButton(documentRef, 'Redo', 'redo-layout');
  manipulationBar.append(groupObject, compareObject, parkObject, restoreObject, undoLayout, redoLayout);
  const commandForm = makeElement(documentRef, 'form', 'eon-nexus-live__multimodal-command');
  commandForm.setAttribute('aria-label', 'Typed or voice-transcript command');
  const commandInput = makeElement(documentRef, 'input', 'eon-nexus-live__command-input');
  commandInput.type = 'text';
  commandInput.autocomplete = 'off';
  commandInput.maxLength = 220;
  commandInput.placeholder = 'Select project, move left, compare, open Atlas…';
  commandInput.setAttribute('aria-label', 'Typed or voice-transcript Nexus command');
  const applyCommandButton = makeButton(documentRef, 'Apply', 'apply-multimodal-command');
  applyCommandButton.type = 'submit';
  const commandFeedback = makeElement(documentRef, 'span', 'eon-nexus-live__command-feedback', 'Local layout controls only.');
  commandFeedback.setAttribute('role', 'status');
  commandFeedback.setAttribute('aria-live', 'polite');
  commandForm.append(commandInput, applyCommandButton, commandFeedback);
  focusCard.append(focusKicker, focusTitle, focusMeta, focusActions, manipulationBar, commandForm);

  const routeCard = makeElement(documentRef, 'section', 'eon-nexus-live__card eon-nexus-live__context-card');
  routeCard.append(makeElement(documentRef, 'h3', '', 'AI route'));
  const routeValue = makeElement(documentRef, 'p', '', 'Guide mode');
  routeCard.append(routeValue);
  const projectCard = makeElement(documentRef, 'section', 'eon-nexus-live__card eon-nexus-live__context-card');
  projectCard.append(makeElement(documentRef, 'h3', '', 'Current project'));
  const projectValue = makeElement(documentRef, 'p', '', 'No project selected');
  const projectLink = makeLink(documentRef, 'Open Projects', 'project', '/projects');
  projectCard.append(projectValue, projectLink);
  panelMap.get('conversation').append(liveStatus, focusCard, routeCard, projectCard);

  const nodeCard = makeElement(documentRef, 'section', 'eon-nexus-live__card eon-nexus-live__agent-card');
  nodeCard.append(makeElement(documentRef, 'h3', '', 'Selected node'));
  const nodeValue = makeElement(documentRef, 'p', '', 'No real node is active.');
  const moreNodes = makeElement(documentRef, 'p', 'eon-nexus-live__more-nodes');
  const accessibleNodes = makeElement(documentRef, 'ul', 'eon-nexus-live__accessible-nodes');
  moreNodes.hidden = true;
  nodeCard.append(nodeValue, moreNodes, accessibleNodes);
  panelMap.get('agents').append(nodeCard);

  const resultCard = makeElement(documentRef, 'section', 'eon-nexus-live__card');
  resultCard.append(makeElement(documentRef, 'h3', '', 'Results and approvals'));
  const resultSummary = makeElement(documentRef, 'p', '', 'No result or approval is waiting.');
  const reviewAction = makeLink(documentRef, 'Review approval', 'review', '/workspace');
  const approveAction = makeButton(documentRef, 'Approve', 'approve');
  const rejectAction = makeButton(documentRef, 'Reject', 'reject');
  const resultAction = makeLink(documentRef, 'Open result', 'result', '/workspace');
  reviewAction.hidden = approveAction.hidden = rejectAction.hidden = resultAction.hidden = true;
  const resultActions = makeElement(documentRef, 'div', 'eon-nexus-live__actions');
  resultActions.append(reviewAction, approveAction, rejectAction, resultAction);
  resultCard.append(resultSummary, resultActions);
  panelMap.get('results').append(resultCard);

  detail.append(statusStrip, tabList, panels);
  body.append(visual, detail);

  const footer = makeElement(documentRef, 'footer', 'eon-nexus-live__footer');
  const chatAction = makeLink(documentRef, 'Return to Chat', 'chat', '/');
  const speakAction = makeButton(documentRef, 'Speak', 'speak');
  const stopAction = makeButton(documentRef, 'Stop task', 'stop');
  const pauseAction = makeButton(documentRef, 'Pause task', 'pause');
  const spatialAction = makeButton(documentRef, 'Enter Spatial Nexus', 'spatial-nexus', 'eon-nexus-live__button eon-nexus-live__button--primary');
  speakAction.hidden = stopAction.hidden = pauseAction.hidden = true;
  footer.append(chatAction, speakAction, stopAction, pauseAction);
  root.append(header, body, footer);
  mountTarget.appendChild(root);

  let model = null;
  let selectedNodeId = '';
  let stableNodeOrder = [];
  let selectedWorkObjectId = '';
  let stableWorkObjectOrder = [];
  let mode = 'split';
  let requestedMode = initialMode;
  let responsiveLayout = null;
  let activeTab = 'conversation';
  let rotation = 0;
  let zoom = 1;
  let disposed = false;
  const spatialSurfaceSubscribers = new Set();
  const notifySpatialSurface = (reason = 'surface-change') => {
    const state = Object.freeze({
      reason,
      mode,
      activeTab,
      selectedWorkObjectId,
      atlasSpatialModel: projectAtlas?.getSpatialModel?.() || null
    });
    for (const callback of spatialSurfaceSubscribers) {
      try { callback(state); } catch {}
    }
  };
  let previousFocus = documentRef.activeElement || null;
  let longPressTimer = 0;
  let longPressTriggered = false;
  let renderCurrent = () => {};
  const bodyClassTarget = documentRef.body;
  const interactionController = createEonNexusW684InteractionController({
    initialState: {
      view: {
        rotation: 0,
        zoom: 1,
        expanded: initialMode === 'full' || (() => { try { return environment.matchMedia?.('(max-width: 899px)')?.matches === true; } catch { return false; } })()
      }
    },
    onChange(nextState) {
      if (disposed) return;
      root.dataset.eonNexusInteractionRevision = String(nextState.revision || 0);
      if (['view-change', 'reset-layout', 'undo', 'redo'].includes(nextState.reason)) {
        setRotation(nextState.view.rotation);
        setZoom(nextState.view.zoom);
        const responsiveRequest = ['compact', 'in-world', 'auto'].includes(requestedMode)
          ? requestedMode
          : nextState.view.expanded ? 'full' : 'split';
        applyMode(responsiveRequest);
      }
      renderCurrent(adapter.getSnapshot());
    }
  });
  const localGestureMode = createEonNexusW684LocalGestureMode({
    controller: interactionController,
    detectorFactory: gestureDetectorFactory,
    environment,
    onFrame(receipt) {
      if (receipt?.ok) commandFeedback.textContent = `Gesture: ${receipt.action.replaceAll('-', ' ')}`;
    }
  });
  const projectAtlas = mountEonNexusProjectAtlas({
    adapter,
    document: documentRef,
    mountTarget: panelMap.get('atlas'),
    getFocusedWorkObject() { return model?.commandField?.selectedObject || null; },
    onNodeSelect(node) {
      const objects = model?.commandField?.visibleObjects || [];
      const mappedKind = node.kind === 'artifact' ? 'result' : node.kind;
      const candidate = (node.focusWorkObjectId ? objects.find((object) => object.id === node.focusWorkObjectId) : null)
        || objects.find((object) => object.kind === mappedKind && object.sourceId === node.sourceId)
        || null;
      if (!candidate) return;
      interactionController.select(candidate.id);
      selectedWorkObjectId = candidate.id;
    },
    onClose() { tabButtons.get('atlas')?.focus?.(); }
  });

  const invoke = (callback, payload = model) => {
    if (typeof callback !== 'function') return false;
    try { return callback(payload); } catch { return false; }
  };

  const getViewport = () => ({
    width: Number(environment.innerWidth || documentRef.documentElement?.clientWidth || 1280),
    height: Number(environment.innerHeight || documentRef.documentElement?.clientHeight || 800),
    coarsePointer: (() => { try { return environment.matchMedia?.('(pointer: coarse)')?.matches === true; } catch { return false; } })(),
    reducedMotion: (() => { try { return environment.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true; } catch { return false; } })()
  });

  const resolveResponsiveLayout = (requested = requestedMode) => resolveEonNexusW708ResponsiveLayout({
    ...getViewport(),
    requestedMode: requested,
    embeddedInWorld: requested === 'in-world'
  });

  const isCompactViewport = () => resolveResponsiveLayout('auto').viewport.singleColumn;

  const applyMode = (requested = requestedMode) => {
    requestedMode = ['compact', 'split', 'full', 'in-world', 'auto'].includes(String(requested)) ? String(requested) : 'auto';
    responsiveLayout = resolveResponsiveLayout(requestedMode);
    mode = responsiveLayout.mode;
    root.dataset.mode = mode;
    root.dataset.eonNexusResponsive = 'w708';
    root.dataset.eonNexusDetailPlacement = responsiveLayout.detailPlacement;
    root.dataset.eonNexusPointerModel = responsiveLayout.pointerModel;
    root.style?.setProperty?.('--eon-nexus-min-target', `${responsiveLayout.minimumTargetPx}px`);
    root.style?.setProperty?.('--eon-nexus-canvas-min-height', `${responsiveLayout.canvasMinimumHeight}px`);
    root.setAttribute('aria-modal', String(responsiveLayout.modal));
    modeButton.hidden = responsiveLayout.canToggleFullScreen !== true;
    modeButton.textContent = mode === 'full' ? 'Split view' : 'Full screen';
    bodyClassTarget?.classList?.toggle('eon-nexus-live-open', true);
    for (const layoutMode of ['compact', 'split', 'full', 'in-world']) {
      bodyClassTarget?.classList?.toggle(`eon-nexus-live-${layoutMode}`, mode === layoutMode);
    }
    notifySpatialSurface('layout-mode-change');
  };

  const setTab = (id = 'conversation', { focus = false } = {}) => {
    const next = TAB_IDS.includes(id) ? id : 'conversation';
    activeTab = next;
    root.dataset.activeTab = next;
    for (const [tabId, button] of tabButtons) {
      const selected = tabId === next;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      panelMap.get(tabId).hidden = !selected;
    }
    if (next === 'atlas') { projectAtlas.open?.(); invoke(onSignatureFlowEvent, { type: 'atlas-reviewed', model, selectedWorkObject: model?.commandField?.selectedObject || null }); }
    else projectAtlas.close?.();
    notifySpatialSurface('active-tab-change');
    if (focus) tabButtons.get(next)?.focus?.();
  };

  const setRotation = (next) => {
    rotation = Math.max(-180, Math.min(180, Number(next) || 0));
    root.style?.setProperty?.('--eon-nexus-live-rotation', `${rotation}deg`);
    root.style?.setProperty?.('--eon-nexus-live-counter-rotation', `${-rotation}deg`);
  };
  const setZoom = (next) => {
    zoom = Math.max(0.78, Math.min(1.18, Number(next) || 1));
    root.style?.setProperty?.('--eon-nexus-live-zoom', String(zoom));
    visual.setAttribute('aria-valuetext', `Zoom ${Math.round(zoom * 100)} percent`);
  };
  const resetVisualView = () => interactionController.setView({ rotation: 0, zoom: 1 });

  const renderNodes = () => {
    nodeLayer.replaceChildren();
    connectionLayer.replaceChildren();
    accessibleNodes.replaceChildren();
    const objects = model?.commandField?.visibleObjects || [];
    const byId = new Map(objects.map((object) => [object.id, object]));

    for (const relation of model?.commandField?.connections || []) {
      const from = byId.get(relation.fromId);
      const to = byId.get(relation.toId);
      if (!from || !to) continue;
      const dx = Number(to.x || 50) - Number(from.x || 50);
      const dy = Number(to.y || 50) - Number(from.y || 50);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const distance = Math.hypot(dx, dy);
      const line = makeElement(documentRef, 'span', 'eon-nexus-live__connection eon-nexus-live__work-connection eon-nexus-live__relation');
      line.style?.setProperty?.('--eon-relation-x', `${from.x}%`);
      line.style?.setProperty?.('--eon-relation-y', `${from.y}%`);
      line.style?.setProperty?.('--eon-relation-angle', `${angle}deg`);
      line.style?.setProperty?.('--eon-relation-distance', `${distance}%`);
      line.style?.setProperty?.('--eon-relation-strength', String(relation.strength));
      line.dataset.kind = relation.kind;
      line.dataset.attention = String(relation.attention === true);
      connectionLayer.appendChild(line);
    }

    for (const object of objects) {
      const button = makeButton(documentRef, '', 'work-object', 'eon-nexus-live__work-object');
      button.dataset.objectId = object.id;
      button.dataset.slot = String(object.slot);
      button.dataset.kind = object.kind;
      button.dataset.shape = object.shape;
      button.dataset.status = object.status;
      button.dataset.lane = object.lane;
      button.dataset.grouped = object.groupId ? 'true' : 'false';
      button.dataset.compared = object.compared ? 'true' : 'false';
      button.dataset.parked = object.parked ? 'true' : 'false';
      button.style?.setProperty?.('--eon-work-x', `${object.x}%`);
      button.style?.setProperty?.('--eon-work-y', `${object.y}%`);
      button.style?.setProperty?.('--eon-work-z', `${object.z}`);
      button.style?.setProperty?.('--eon-work-scale', `${object.scale}`);
      button.style?.setProperty?.('--eon-work-tilt', `${object.tilt}deg`);
      button.style?.setProperty?.('--eon-work-elevation', `${object.elevation}rem`);
      button.style?.setProperty?.('--eon-work-accent', object.accent);
      button.setAttribute('aria-pressed', String(model.commandField.selectedObject?.id === object.id));
      button.setAttribute('aria-label', `${object.label}. ${object.kind}. ${object.status}. ${object.meta}. Drag to rearrange locally; arrow keys nudge.`);
      const kind = makeElement(documentRef, 'span', 'eon-nexus-live__work-kind', `${object.kind} · ${object.laneLabel}`);
      const label = makeElement(documentRef, 'strong', '', object.label);
      const meta = makeElement(documentRef, 'span', 'eon-nexus-live__work-meta', object.meta || object.status);
      const stateTags = makeElement(documentRef, 'span', 'eon-nexus-live__work-tags');
      if (object.compared) stateTags.appendChild(makeElement(documentRef, 'i', '', 'COMPARE'));
      if (object.groupId) stateTags.appendChild(makeElement(documentRef, 'i', '', 'GROUP'));
      if (object.parked) stateTags.appendChild(makeElement(documentRef, 'i', '', 'PARKED'));
      button.append(kind, label, meta, stateTags);

      let drag = null;
      button.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        const rect = visual.getBoundingClientRect?.();
        if (!rect?.width || !rect?.height) return;
        drag = { startX: Number(event.clientX || 0), startY: Number(event.clientY || 0), x: object.x, y: object.y, nextX: object.x, nextY: object.y, moved: false, rect };
        button.setPointerCapture?.(event.pointerId);
      });
      button.addEventListener('pointermove', (event) => {
        if (!drag) return;
        const dx = Number(event.clientX || 0) - drag.startX;
        const dy = Number(event.clientY || 0) - drag.startY;
        if (Math.abs(dx) + Math.abs(dy) > 5) drag.moved = true;
        drag.nextX = Math.max(7, Math.min(93, drag.x + (dx / drag.rect.width) * 100));
        drag.nextY = Math.max(7, Math.min(93, drag.y + (dy / drag.rect.height) * 100));
        button.style?.setProperty?.('--eon-work-x', `${drag.nextX}%`);
        button.style?.setProperty?.('--eon-work-y', `${drag.nextY}%`);
      });
      const finishObjectDrag = (event) => {
        if (!drag) return;
        const completed = drag;
        drag = null;
        button.releasePointerCapture?.(event.pointerId);
        if (completed.moved) {
          button.dataset.dragMoved = 'true';
          interactionController.moveTo(object.id, completed.nextX, completed.nextY);
        }
      };
      button.addEventListener('pointerup', finishObjectDrag);
      button.addEventListener('pointercancel', () => { drag = null; renderCurrent(adapter.getSnapshot()); });
      button.addEventListener('click', (event) => {
        if (button.dataset.dragMoved === 'true') { button.dataset.dragMoved = 'false'; event.preventDefault(); return; }
        interactionController.select(object.id, { additive: event.shiftKey || event.ctrlKey || event.metaKey });
        selectedWorkObjectId = object.id;
        invoke(onSignatureFlowEvent, { type: 'work-object-selected', model, selectedWorkObject: object });
        selectedNodeId = object.action === 'node' ? object.sourceId : selectedNodeId;
        setTab('conversation');
      });
      button.addEventListener('keydown', (event) => {
        const step = event.shiftKey ? 6 : 2;
        const deltas = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        if (deltas[event.key]) {
          event.preventDefault();
          interactionController.moveBy(object.id, deltas[event.key][0], deltas[event.key][1]);
        } else if (event.key.toLowerCase() === 'c') {
          event.preventDefault(); interactionController.toggleCompare(object.id);
        } else if (event.key.toLowerCase() === 'g') {
          event.preventDefault(); interactionController.select(object.id, { additive: event.shiftKey }); interactionController.groupSelected();
        } else if (event.key.toLowerCase() === 'p') {
          event.preventDefault(); interactionController.park(object.id);
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); interactionController.select(object.id); activateFocusedObject(event);
        }
      });
      nodeLayer.appendChild(button);
    }

    for (const object of objects) {
      const item = makeElement(documentRef, 'li');
      const button = makeButton(documentRef, `${object.label} · ${object.kind} · ${object.status}`, 'accessible-node', 'eon-nexus-live__accessible-node');
      button.dataset.objectId = object.id;
      button.setAttribute('aria-pressed', String(model.commandField.selectedObject?.id === object.id));
      button.addEventListener('click', () => {
        interactionController.select(object.id);
        selectedWorkObjectId = object.id;
        invoke(onSignatureFlowEvent, { type: 'work-object-selected', model, selectedWorkObject: object });
        setTab('conversation');
      });
      item.appendChild(button);
      accessibleNodes.appendChild(item);
    }
  };

  const render = (snapshot) => {
    const interactionState = interactionController.getState();
    model = getEonNexusLiveViewModel(snapshot, { selectedNodeId, stableNodeOrder, selectedWorkObjectId, stableWorkObjectOrder, interactionState });
    interactionController.reconcile(model.commandField.visibleObjects);
    stableNodeOrder = [...model.stableNodeOrder];
    stableWorkObjectOrder = [...model.commandField.stableObjectOrder];
    selectedNodeId = model.selectedNode?.id || '';
    selectedWorkObjectId = model.commandField.selectedObject?.id || '';
    root.dataset.eonbotState = model.state;
    root.dataset.privateRoute = String(model.privateRoute);
    root.dataset.eonNexusContext = model.surfaceLabel || 'shared';
    root.dataset.eonNexusShape = model.flagship.shape;
    root.dataset.eonNexusTopology = model.flagship.topology;
    root.dataset.eonNexusContinuity = model.flagship.continuityId;
    root.dataset.eonNexusComposition = model.commandField.composition;
    root.dataset.eonNexusDensity = model.commandField.density;
    root.dataset.eonNexusSelectedKind = model.commandField.selectedObject?.kind || 'none';
    root.dataset.eonNexusRenderer = model.commandField.renderer?.engine || 'hybrid-dom-babylon';
    root.dataset.eonNexusRendererStage = model.commandField.renderer?.stage || model.commandField.composition;
    root.dataset.eonNexusGestureMode = interactionState.gestureMode || 'off';
    root.dataset.eonNexusComparedCount = String(model.commandField.comparedObjects?.length || 0);
    root.dataset.eonNexusParkedCount = String(model.commandField.parkedObjectCount || 0);
    root.style?.setProperty?.('--eon-nexus-perspective', `${model.commandField.renderer?.perspective || 980}px`);
    root.style?.setProperty?.('--eon-nexus-accent', model.flagship.accent);
    root.style?.setProperty?.('--eon-nexus-secondary', model.flagship.secondaryAccent);
    root.style?.setProperty?.('--eon-nexus-energy', String(model.flagship.energy));
    root.style?.setProperty?.('--eon-nexus-pulse-ms', `${model.flagship.pulseMs}ms`);
    root.style?.setProperty?.('--eon-nexus-orbit-speed', String(model.flagship.orbitSpeed));
    root.style?.setProperty?.('--eon-nexus-halo', String(model.flagship.halo));
    kicker.textContent = model.kicker;
    heading.textContent = model.title;
    headerMeta.textContent = `${model.routeLabel}${model.projectSelected ? ` · ${model.projectLabel}` : ''}`;
    orbButton.setAttribute('aria-label', `${model.title}. ${model.taskStage}.`);
    orbLabel.textContent = model.stateLabel;
    commandStage.textContent = model.taskStage;
    commandSummary.textContent = model.statusSummary;
    statusTitle.textContent = model.title;
    statusStage.textContent = model.taskStage;
    statusSummary.textContent = model.statusSummary;
    statusStripCopy.textContent = `${model.stateLabel} · ${model.taskStage}`;
    const focusedObject = model.commandField.selectedObject;
    const clarity = projectEonNexusW699CommandClarity(model, interactionState, { detectorAvailable: typeof gestureDetectorFactory === 'function', cameraAvailable: Boolean(environment?.navigator?.mediaDevices?.getUserMedia), spatialAvailable: typeof onEnterSpatialNexus === 'function' });
    root.dataset.eonNexusPersistentActionCount = String(clarity.persistentActionCount);
    root.dataset.eonNexusGestureStatus = clarity.gesture.status;
    root.dataset.eonNexusCityDistrict = clarity.city.districtId || 'none';
    focusKicker.textContent = focusedObject ? `${focusedObject.kind.toUpperCase()} · ${focusedObject.status.toUpperCase()}` : 'COMMAND FOCUS';
    focusTitle.textContent = focusedObject?.label || 'Private conversation';
    focusMeta.textContent = focusedObject?.meta || model.commandField.instruction;
    focusPrimary.textContent = model.commandField.selectedPrimaryVerb.label;
    focusPrimary.dataset.commandKind = model.commandField.selectedPrimaryVerb.action;
    focusPrimary.hidden = model.commandField.selectedPrimaryVerb.action === 'inspect';
    focusAsk.hidden = true;
    focusAtlas.hidden = true;
    focusSpatial.hidden = true;
    routeValue.textContent = model.routeLabel;
    projectValue.textContent = `${model.projectLabel}${model.projectSelected ? ` · ${model.projectStatus}` : ''}`;
    projectLink.href = model.projectRoute;
    projectLink.textContent = model.projectSelected ? 'Continue current project' : 'Open Projects';
    nodeValue.textContent = model.selectedNode
      ? `${model.selectedNode.label} · ${model.selectedNode.status}${model.selectedNode.count > 1 ? ` · ${model.selectedNode.count} observed` : ''}`
      : 'No real node is active.';
    moreNodes.hidden = model.hiddenNodeCount === 0;
    moreNodes.textContent = model.hiddenNodeCount ? `+${model.hiddenNodeCount} more in the accessible node list.` : '';
    resultSummary.textContent = model.reviewVisible
      ? `${model.reviewLabel}. Review is required before anything changes.`
      : model.resultVisible
        ? model.resultLabel
        : 'No result or approval is waiting.';
    chatAction.href = model.conversationRoute;
    chatAction.textContent = `Return to ${model.surfaceLabel === 'Chat' ? 'Chat' : 'conversation'}`;
    speakAction.hidden = !(model.canSpeak && typeof onSpeak === 'function');
    stopAction.hidden = !(model.canStop && typeof onStop === 'function');
    pauseAction.hidden = !(model.canStop && model.taskState === 'running' && typeof onPause === 'function');
    reviewAction.hidden = !model.reviewVisible;
    reviewAction.href = model.reviewRoute;
    approveAction.hidden = !(model.reviewVisible && typeof onApprove === 'function');
    rejectAction.hidden = !(model.reviewVisible && typeof onReject === 'function');
    resultAction.hidden = !model.resultVisible;
    resultAction.href = model.resultRoute;
    tabButtons.get('results').textContent = model.reviewVisible
      ? `Activity · ${model.approvalCount || 1}`
      : model.resultCount
        ? `Activity · ${model.resultCount}`
        : 'Activity';
    tabButtons.get('atlas').textContent = model.atlasAvailable
      ? `Atlas${model.atlasIncompleteCount ? ` · ${model.atlasIncompleteCount}` : ''}`
      : 'Atlas';
    const commandModel = getEonNexusW668CommandModel(model, {
      atlasAvailable: model.atlasAvailable,
      spatialAvailable: typeof onEnterSpatialNexus === 'function'
    });
    root.dataset.eonNexusPrimaryAction = commandModel.primary.kind;
    primaryCommand.textContent = clarity.persistentActions[0].label;
    primaryCommand.href = commandModel.primary.route || '#';
    primaryCommand.dataset.commandKind = commandModel.primary.kind;
    atlasCommand.textContent = clarity.persistentActions[1].label;
    atlasCommand.dataset.commandKind = model.atlasAvailable ? 'atlas' : 'project';
    moreCommand.textContent = clarity.persistentActions[2].label;
    spatialCommand.hidden = !clarity.city.available;
    spatialCommand.textContent = clarity.city.label;
    spatialCommand.title = clarity.city.reason;
    cityContext.textContent = clarity.city.reason;
    gestureStatus.textContent = `${clarity.gesture.label}. ${clarity.gesture.reason}`;
    stopCameraButton.hidden = clarity.gesture.canStop !== true;
    voiceExamples.textContent = `Examples: ${clarity.voice.examples.join(' · ')}`;
    spatialAction.hidden = true;
    const interaction = interactionController.getState();
    compareObject.setAttribute('aria-pressed', String(interaction.compareIds.includes(focusedObject?.id || '')));
    compareObject.textContent = interaction.compareIds.includes(focusedObject?.id || '') ? 'Compared' : 'Compare';
    parkObject.hidden = focusedObject?.parked === true;
    restoreObject.hidden = focusedObject?.parked !== true;
    manipulationBar.hidden = !clarity.advancedToolsContextual;
    groupObject.disabled = !clarity.group.ready;
    groupObject.title = clarity.group.instruction;
    compareObject.disabled = !focusedObject;
    compareObject.title = clarity.compare.instruction;
    parkObject.disabled = !focusedObject;
    restoreObject.disabled = !focusedObject;
    undoLayout.disabled = interaction.canUndo !== true;
    redoLayout.disabled = interaction.canRedo !== true;
    gestureButton.textContent = clarity.gesture.label;
    gestureButton.disabled = clarity.gesture.status === 'unavailable' || (clarity.gesture.status === 'off' && clarity.gesture.canStart !== true);
    gestureButton.setAttribute('aria-pressed', String(clarity.gesture.status === 'active'));
    if (interaction.gestureReason && interaction.gestureMode !== 'off') commandFeedback.textContent = interaction.gestureReason;
    renderNodes();
    if (activeTab === 'atlas') projectAtlas.render?.(snapshot);
  };
  renderCurrent = render;

  const close = () => {
    if (disposed) return;
    localGestureMode.stop();
    root.hidden = true;
    bodyClassTarget?.classList?.remove('eon-nexus-live-open', 'eon-nexus-live-compact', 'eon-nexus-live-split', 'eon-nexus-live-full', 'eon-nexus-live-in-world');
    invoke(onClose, model);
    previousFocus?.focus?.();
  };
  const open = (requestedMode = mode) => {
    if (disposed) return;
    previousFocus = documentRef.activeElement || previousFocus;
    root.hidden = false;
    applyMode(requestedMode);
    render(adapter.getSnapshot());
    closeButton.focus?.();
  };
  const activateLink = (event, callback) => {
    if (typeof callback !== 'function') return;
    event.preventDefault();
    invoke(callback, model);
  };
  const activateFocusedObject = (event = null) => {
    const object = model?.commandField?.selectedObject;
    if (!object) return false;
    event?.preventDefault?.();
    if (object.action === 'review') return invoke(onReview, model);
    if (object.action === 'result') return invoke(onResult, model);
    if (object.action === 'project') return invoke(onProject, model);
    if (object.action === 'chat') return invoke(onOpenChat, model);
    if (object.action === 'node') return invoke(onNodeSelect, object);
    return false;
  };
  const applyMultimodalCommand = (input = '') => {
    const receipt = typeof input === 'string'
      ? interpretEonNexusW684VoiceCommand(input, model?.commandField?.visibleObjects || [])
      : input;
    if (!receipt?.ok) {
      commandFeedback.textContent = `Command not applied: ${String(receipt?.reason || 'invalid command').replaceAll('-', ' ')}.`;
      return receipt;
    }
    if (receipt.action === 'request-atlas') {
      setTab('atlas', { focus: true });
    } else if (receipt.action === 'request-city') invoke(onEnterSpatialNexus, model);
    else if (receipt.action === 'request-primary') activateFocusedObject();
    else interactionController.applyCommand(receipt, model?.commandField?.visibleObjects || []);
    commandFeedback.textContent = `Applied: ${receipt.action.replaceAll('-', ' ')}.`;
    return receipt;
  };

  moreCommand.addEventListener('click', () => { morePanel.hidden = !morePanel.hidden; moreCommand.setAttribute('aria-expanded', String(!morePanel.hidden)); if (!morePanel.hidden) (spatialCommand.hidden ? gestureButton : spatialCommand).focus?.(); });
  stopCameraButton.addEventListener('click', () => { const result = localGestureMode.stop(); commandFeedback.textContent = result.ok ? 'Local gesture camera stopped.' : 'Gesture camera was not active.'; render(adapter.getSnapshot()); });
  modeButton.addEventListener('click', () => {
    const next = mode === 'full' ? 'split' : 'full';
    requestedMode = next;
    interactionController.setView({ expanded: next === 'full' });
  });
  gestureButton.addEventListener('click', async () => {
    const state = interactionController.getState();
    const capturePolicy = resolveEonNexusW708CapturePolicy({
      kind: 'camera',
      explicitUserAction: true,
      available: typeof gestureDetectorFactory === 'function' && Boolean(environment?.navigator?.mediaDevices?.getUserMedia),
      localOnly: true
    });
    const result = state.gestureMode === 'active'
      ? localGestureMode.stop()
      : capturePolicy.ok
        ? await localGestureMode.start({ explicitUserAction: true })
        : capturePolicy;
    root.dataset.eonNexusCameraConsent = state.gestureMode === 'active' ? 'stopped' : capturePolicy.ok ? 'explicit-local-only' : capturePolicy.reason;
    commandFeedback.textContent = result.ok
      ? (state.gestureMode === 'active' ? 'Local gesture mode stopped.' : 'Local gesture mode active. Camera frames are not uploaded.')
      : `Gesture mode unavailable: ${String(result.reason || 'unknown').replaceAll('-', ' ')}.`;
    invoke(onGestureModeChange, { result, policy: capturePolicy, state: interactionController.getState() });
  });
  minimizeButton.addEventListener('click', close);
  closeButton.addEventListener('click', close);
  chatAction.addEventListener('click', (event) => activateLink(event, onOpenChat));
  projectLink.addEventListener('click', (event) => activateLink(event, onProject));
  focusPrimary.addEventListener('click', activateFocusedObject);
  focusAsk.addEventListener('click', () => invoke(onOpenChat, model));
  focusAtlas.addEventListener('click', () => { setTab('atlas', { focus: true }); });
  focusSpatial.addEventListener('click', () => { const result = invoke(onEnterSpatialNexus, model); if (result?.ok === false) commandFeedback.textContent = `City handoff unavailable: ${String(result.reason || 'review required').replaceAll('-', ' ')}.`; });
  groupObject.addEventListener('click', () => interactionController.groupSelected());
  compareObject.addEventListener('click', () => interactionController.toggleCompare());
  parkObject.addEventListener('click', () => interactionController.park());
  restoreObject.addEventListener('click', () => interactionController.restore());
  undoLayout.addEventListener('click', () => interactionController.undo());
  redoLayout.addEventListener('click', () => interactionController.redo());
  commandForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = commandInput.value;
    const receipt = applyMultimodalCommand(value);
    if (receipt?.ok) commandInput.value = '';
  });
  reviewAction.addEventListener('click', (event) => activateLink(event, onReview));
  resultAction.addEventListener('click', (event) => activateLink(event, onResult));
  const requestVoiceCapture = (source = 'button') => {
    const policy = resolveEonNexusW708CapturePolicy({
      kind: 'voice', explicitUserAction: true, available: model?.canSpeak === true && typeof onSpeak === 'function'
    });
    root.dataset.eonNexusVoiceConsent = policy.ok ? 'explicit' : policy.reason;
    if (!policy.ok) {
      commandFeedback.textContent = `Voice unavailable: ${policy.reason.replaceAll('-', ' ')}.`;
      return policy;
    }
    invoke(onSpeak, model);
    commandFeedback.textContent = `Voice started by ${source}.`;
    return policy;
  };
  speakAction.addEventListener('click', () => requestVoiceCapture('button press'));
  stopAction.addEventListener('click', () => invoke(onStop, model));
  pauseAction.addEventListener('click', () => invoke(onPause, model));
  approveAction.addEventListener('click', () => invoke(onApprove, model));
  rejectAction.addEventListener('click', () => invoke(onReject, model));
  spatialAction.addEventListener('click', () => { const result = invoke(onEnterSpatialNexus, model); if (result?.ok === false) commandFeedback.textContent = `City handoff unavailable: ${String(result.reason || 'review required').replaceAll('-', ' ')}.`; });
  spatialCommand.addEventListener('click', () => { const result = invoke(onEnterSpatialNexus, model); if (result?.ok === false) commandFeedback.textContent = `City handoff unavailable: ${String(result.reason || 'review required').replaceAll('-', ' ')}.`; });
  atlasCommand.addEventListener('click', () => { setTab('atlas', { focus: true }); });
  primaryCommand.addEventListener('click', (event) => {
    const kind = String(primaryCommand.dataset.commandKind || 'chat');
    if (kind === 'review') return activateLink(event, onReview);
    if (kind === 'result') return activateLink(event, onResult);
    if (kind === 'project') return activateLink(event, onProject);
    return activateLink(event, onOpenChat);
  });
  rotateLeft.addEventListener('click', () => interactionController.setView({ rotation: rotation - 18 }));
  rotateRight.addEventListener('click', () => interactionController.setView({ rotation: rotation + 18 }));
  zoomOut.addEventListener('click', () => interactionController.setView({ zoom: zoom - 0.1 }));
  zoomIn.addEventListener('click', () => interactionController.setView({ zoom: zoom + 0.1 }));
  resetView.addEventListener('click', resetVisualView);

  for (const [id, tab] of tabButtons) {
    tab.addEventListener('click', () => setTab(id));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const currentIndex = TAB_IDS.indexOf(id);
      const nextIndex = event.key === 'Home' ? 0
        : event.key === 'End' ? TAB_IDS.length - 1
          : (currentIndex + (event.key === 'ArrowRight' ? 1 : -1) + TAB_IDS.length) % TAB_IDS.length;
      setTab(TAB_IDS[nextIndex], { focus: true });
    });
  }

  visual.addEventListener('keydown', (event) => {
    const command = interpretEonNexusW708KeyboardInput(event);
    if (!command.ok) return;
    if (command.preventDefault) event.preventDefault();
    if (command.action === 'rotate') interactionController.setView({ rotation: rotation + command.delta });
    else if (command.action === 'zoom') interactionController.setView({ zoom: zoom + command.delta });
    else if (command.action === 'reset-view') resetVisualView();
    else if (command.action === 'activate-selected') activateFocusedObject(event);
    else if (command.action === 'focus-command') commandInput.focus?.();
  });
  visual.addEventListener('wheel', (event) => {
    if (isCompactViewport()) return;
    event.preventDefault();
    interactionController.setView({ zoom: zoom + (event.deltaY < 0 ? 0.08 : -0.08) });
  }, { passive: false });

  let dragStartX = 0;
  let dragStartRotation = 0;
  visual.addEventListener('pointerdown', (event) => {
    if (event.target?.closest?.('button, a')) return;
    dragStartX = Number(event.clientX || 0);
    dragStartRotation = rotation;
    visual.setPointerCapture?.(event.pointerId);
    root.dataset.dragging = 'true';
  });
  visual.addEventListener('pointermove', (event) => {
    if (root.dataset.dragging !== 'true') return;
    setRotation(dragStartRotation + (Number(event.clientX || 0) - dragStartX) * 0.35);
  });
  const stopDragging = (event) => {
    if (root.dataset.dragging !== 'true') return;
    root.dataset.dragging = 'false';
    visual.releasePointerCapture?.(event.pointerId);
    interactionController.setView({ rotation });
  };
  visual.addEventListener('pointerup', stopDragging);
  visual.addEventListener('pointercancel', stopDragging);

  orbButton.addEventListener('pointerdown', () => {
    longPressTriggered = false;
    if (!(model?.canSpeak && typeof onSpeak === 'function')) return;
    longPressTimer = environment.setTimeout?.(() => {
      longPressTriggered = true;
      requestVoiceCapture('long press');
    }, 650) || 0;
  });
  const clearLongPress = () => {
    if (longPressTimer) environment.clearTimeout?.(longPressTimer);
    longPressTimer = 0;
  };
  orbButton.addEventListener('pointerup', clearLongPress);
  orbButton.addEventListener('pointercancel', clearLongPress);
  orbButton.addEventListener('click', (event) => {
    if (longPressTriggered) {
      event.preventDefault();
      longPressTriggered = false;
      return;
    }
    statusTitle.focus?.();
  });
  statusTitle.tabIndex = -1;

  root.addEventListener('keydown', (event) => {
    const target = event.target;
    const editable = Boolean(target?.matches?.('input, textarea, select, [contenteditable="true"]'));
    const command = interpretEonNexusW708KeyboardInput(event, { editable });
    if (command.ok && ['undo', 'redo', 'close', 'focus-command'].includes(command.action)) {
      if (command.preventDefault) event.preventDefault();
      if (command.action === 'undo') interactionController.undo();
      else if (command.action === 'redo') interactionController.redo();
      else if (command.action === 'close') close();
      else if (command.action === 'focus-command') commandInput.focus?.();
      return;
    }
    if (event.key !== 'Tab' || responsiveLayout?.focusTrapRequired !== true) return;
    const focusable = [...root.querySelectorAll('a[href]:not([hidden]), button:not([hidden]), [tabindex]:not([tabindex="-1"])')]
      .filter((node) => !node.disabled && node.getAttribute('aria-hidden') !== 'true' && !node.closest?.('[hidden]'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && documentRef.activeElement === first) { event.preventDefault(); last.focus?.(); }
    else if (!event.shiftKey && documentRef.activeElement === last) { event.preventDefault(); first.focus?.(); }
  });

  const compactQuery = environment.matchMedia?.('(max-width: 899px)');
  const viewportHandler = () => { if (!root.hidden) { applyMode(requestedMode); renderCurrent(adapter.getSnapshot()); } };
  compactQuery?.addEventListener?.('change', viewportHandler);
  environment.addEventListener?.('resize', viewportHandler, { passive: true });

  setRotation(0);
  setZoom(1);
  setTab('conversation');
  render(adapter.getSnapshot());
  const unsubscribe = adapter.subscribe((snapshot) => render(snapshot));
  applyMode(initialMode);

  return Object.freeze({
    ok: true,
    reason: null,
    schema: EON_NEXUS_LIVE_SCHEMA,
    element: root,
    getViewModel: () => model,
    getMode: () => mode,
    getActiveTab: () => activeTab,
    subscribeSpatialSurface(callback) {
      if (typeof callback !== 'function') return () => {};
      spatialSurfaceSubscribers.add(callback);
      return () => spatialSurfaceSubscribers.delete(callback);
    },
    getSelectedWorkObject: () => model?.commandField?.selectedObject || null,
    getInteractionState: () => interactionController.getState(),
    interactionController,
    localGestureMode,
    applyMultimodalCommand,
    selectWorkObject(id, options = {}) { return interactionController.select(id, options); },
    projectAtlas,
    setMode(next = 'split') {
      requestedMode = ['compact', 'split', 'full', 'in-world', 'auto'].includes(String(next)) ? String(next) : 'auto';
      if (requestedMode === 'full' || requestedMode === 'split') return interactionController.setView({ expanded: requestedMode === 'full' });
      applyMode(requestedMode);
      renderCurrent(adapter.getSnapshot());
      return true;
    },
    getResponsiveLayout: () => responsiveLayout,
    setTab,
    setRotation,
    setZoom,
    resetView: resetVisualView,
    open,
    openAtlas(requestedMode = mode) { open(requestedMode); setTab('atlas', { focus: true }); return true; },
    close,
    render,
    dispose() {
      if (disposed) return;
      disposed = true;
      clearLongPress();
      localGestureMode.stop();
      compactQuery?.removeEventListener?.('change', viewportHandler);
      environment.removeEventListener?.('resize', viewportHandler);
      projectAtlas.dispose?.();
      spatialSurfaceSubscribers.clear();
      try { unsubscribe?.(); } catch {}
      bodyClassTarget?.classList?.remove('eon-nexus-live-open', 'eon-nexus-live-compact', 'eon-nexus-live-split', 'eon-nexus-live-full', 'eon-nexus-live-in-world');
      root.remove?.();
    }
  });
}

export function getEonNexusLiveTruth() {
  return Object.freeze({
    sameStateAdapter: true,
    secondConversationStore: false,
    rawMessageBodyRead: false,
    rawProjectContentRead: false,
    startsAiWork: false,
    startsVoiceAutomatically: false,
    startsMicrophoneAutomatically: false,
    approvesActionAutomatically: false,
    rendersFakeAgents: false,
    rendersFakeProgress: false,
    maximumPrimaryNodes: EON_NEXUS_LIVE_MAX_PRIMARY_NODES,
    visualCommandFieldPercent: Object.freeze({ minimum: 55, maximum: 65 }),
    readableDetailPanel: true,
    compactSplitFullAndInWorldModes: true,
    responsiveAutoFitW708: true,
    maximumPersistentActions: 3,
    advancedActionsContextual: true,
    minimumInteractiveTargetPx: 48,
    mobileVisualFieldAndSheet: true,
    stableNodeOrder: true,
    gesturesHaveButtonEquivalents: true,
    keyboardSupport: true,
    keyboardTabs: true,
    keyboardUndoRedoReset: true,
    mouseKeyboardTouchParity: true,
    voicePressToStart: true,
    cameraRequiresExplicitLocalConsent: true,
    desktopWheelZoom: true,
    projectAtlasUsesSameAdapter: true,
    spatialNexusExplicitHandoff: true,
    boundedZoom: Object.freeze({ minimum: 0.78, maximum: 1.18 }),
    reducedMotionSupportedByCss: true,
    fullW683MorphicRenderer: true,
    realW684ObjectManipulation: true,
    optionalLocalCameraGestures: true,
    cameraStartsAutomatically: false,
    fullW685SpatialProjectAtlas: true,
    selectedWorkObjectPreservedInAtlas: true,
    explicitW686CityWorkObjectHandoff: true,
    requiresCanvas: false,
    requiresWebGl: false,
    requiresBabylon: false,
    babylonEnhancementOptional: true,
    requiresGlb: false,
    rendererEngine: 'hybrid-dom-babylon-with-dom-fallback'
  });
}

export default Object.freeze({
  EON_NEXUS_LIVE_SCHEMA,
  EON_NEXUS_LIVE_MAX_PRIMARY_NODES,
  getEonNexusLiveViewModel,
  ensureEonNexusLiveStyles,
  mountEonNexusLive,
  getEonNexusLiveTruth
});
