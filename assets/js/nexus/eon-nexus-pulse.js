import { createEonNexusPulseMotionController } from './eon-nexus-pulse-motion.js';
import { projectEonNexusW668FlagshipState } from './w668/eon-nexus-w668-flagship-state.js';

/**
 * W660B1/W660B2 — accessible EON Pulse with CSS-only state motion.
 *
 * The component renders only the privacy-projected Nexus snapshot. It owns no
 * Chat, voice, task, provider, approval or result state and starts no work.
 */

export const EON_NEXUS_PULSE_SCHEMA = 'eon.nexus.pulse.v1';

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

function cleanText(value = '', max = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeRoute(value = '', fallback = '/') {
  try {
    const url = new URL(String(value || fallback), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid' || !url.pathname.startsWith('/')) return fallback;
    return `${url.pathname}${url.search}${url.hash}`.slice(0, 500);
  } catch {
    return fallback;
  }
}

function stateLabel(state = '') {
  return STATE_LABELS[String(state || '')] || STATE_LABELS.ready;
}

export function getEonNexusPulseViewModel(snapshot = {}) {
  const eonbot = snapshot?.eonbot || {};
  const task = snapshot?.task || {};
  const route = snapshot?.route || {};
  const approval = snapshot?.approval || {};
  const results = snapshot?.results || {};
  const connection = snapshot?.connection || {};
  const surface = snapshot?.surface || {};
  const flagship = projectEonNexusW668FlagshipState(snapshot, { surface: 'pulse' });
  const state = flagship.state;
  const approvalCount = Math.max(0, Math.min(99, Number(approval.count) || 0));
  const resultCount = Math.max(0, Math.min(999, Number(results.count) || 0));
  const badgeCount = approvalCount || resultCount;
  const routeLabel = route.privateOnDevice === true
    ? `${cleanText(route.providerLabel || 'Local AI', 80)} · Private on this device`
    : cleanText(route.providerLabel || 'Guide mode', 100);
  const stageLabel = cleanText(surface.statusLabel || task.stageLabel || eonbot.statusLabel || stateLabel(state), 160);
  const summary = approval.pending === true
    ? cleanText(approval.label || 'Approval waiting', 220)
    : state === 'error' || state === 'offline'
      ? cleanText(connection.label || 'Open Chat for a recovery option.', 220)
      : cleanText(surface.summary || (resultCount > 0
        ? results.label || `${resultCount} results available`
        : snapshot?.project?.selected
          ? 'Current project and task status are synchronized with EONBOT.'
          : 'The same EONBOT conversation remains available in standard Chat.'), 260);
  const surfaceLabel = cleanText(surface.label || '', 80);

  return Object.freeze({
    schema: EON_NEXUS_PULSE_SCHEMA,
    state,
    title: surfaceLabel ? `${surfaceLabel} Nexus · ${stateLabel(state)}` : `EONBOT · ${stateLabel(state)}`,
    kicker: surfaceLabel ? `EON NEXUS · ${surfaceLabel}` : 'EON NEXUS',
    surfaceLabel,
    surfaceRoute: safeRoute(surface.route || '/', '/'),
    stageLabel,
    routeLabel,
    summary,
    privateRoute: route.privateOnDevice === true,
    approvalCount,
    resultCount,
    badgeCount,
    badgeLabel: approvalCount ? `${approvalCount} approval${approvalCount === 1 ? '' : 's'} waiting` : resultCount ? `${resultCount} result${resultCount === 1 ? '' : 's'} available` : '',
    canSpeak: eonbot.canListen === true,
    reviewVisible: approval.pending === true,
    reviewRoute: safeRoute(approval.reviewRoute || '/workspace', '/workspace'),
    resultVisible: resultCount > 0,
    resultRoute: safeRoute(results.openRoute || '/workspace', '/workspace'),
    chatRoute: safeRoute(snapshot?.conversation?.openRoute || '/', '/'),
    flagship
  });
}

function makeElement(documentRef, tag, className = '', text = '') {
  const node = documentRef.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function makeAction(documentRef, { action, label, href = '', hidden = false } = {}) {
  const node = href ? makeElement(documentRef, 'a', 'eon-nexus-pulse__action', label) : makeElement(documentRef, 'button', 'eon-nexus-pulse__action', label);
  node.dataset.action = action;
  if (href) node.setAttribute('href', href);
  else node.setAttribute('type', 'button');
  node.hidden = hidden;
  return node;
}

export function mountEonNexusPulse({
  adapter,
  environment = globalThis,
  document: documentRef = environment?.document || globalThis.document,
  mountTarget = documentRef?.body || null,
  motionPreference = 'auto',
  onOpenChat = null,
  onSpeak = null,
  onReview = null,
  onResult = null,
  onExpand = null,
  onExpandFull = null,
  maxPrimaryControls = 6
} = {}) {
  if (!adapter?.getSnapshot || !adapter?.subscribe || !documentRef?.createElement || !mountTarget?.appendChild) {
    return Object.freeze({ ok: false, reason: 'pulse-environment-unavailable', dispose() {} });
  }

  const existing = documentRef.querySelector?.('[data-eon-nexus-pulse]');
  if (existing) return Object.freeze({ ok: false, reason: 'pulse-already-mounted', element: existing, dispose() {} });

  const root = makeElement(documentRef, 'aside', 'eon-nexus-pulse');
  root.dataset.eonNexusPulse = '1';
  root.dataset.eonbotState = 'ready';
  root.dataset.privateRoute = 'false';
  root.setAttribute('aria-label', 'EON NEXUS visual assistant');

  const panel = makeElement(documentRef, 'section', 'eon-nexus-pulse__panel');
  const panelId = `eon-nexus-pulse-panel-${Math.random().toString(36).slice(2, 10)}`;
  panel.id = panelId;
  panel.hidden = true;
  panel.setAttribute('aria-label', 'EONBOT status and actions');

  const toggle = makeElement(documentRef, 'button', 'eon-nexus-pulse__toggle');
  toggle.type = 'button';
  toggle.dataset.eonNexusOpenControl = '1';
  toggle.dataset.eonNexusAction = 'open';
  toggle.setAttribute('aria-controls', panelId);
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open EON NEXUS status');

  const orb = makeElement(documentRef, 'span', 'eon-nexus-pulse__orb');
  orb.setAttribute('aria-hidden', 'true');
  const core = makeElement(documentRef, 'span', 'eon-nexus-pulse__core');
  orb.appendChild(core);
  const badge = makeElement(documentRef, 'span', 'eon-nexus-pulse__badge');
  badge.hidden = true;
  badge.setAttribute('aria-hidden', 'true');
  const toggleLabel = makeElement(documentRef, 'span', 'eon-nexus-pulse__toggle-label', 'EON NEXUS');
  toggle.append(orb, toggleLabel, badge);

  const heading = makeElement(documentRef, 'div', 'eon-nexus-pulse__heading');
  const headingCopy = makeElement(documentRef, 'div');
  const kicker = makeElement(documentRef, 'p', 'eon-nexus-pulse__kicker', 'EON NEXUS');
  const title = makeElement(documentRef, 'h2', '', 'EONBOT · Ready');
  const close = makeElement(documentRef, 'button', 'eon-nexus-pulse__close', '×');
  close.type = 'button';
  close.setAttribute('aria-label', 'Close EON NEXUS status');
  headingCopy.append(kicker, title);
  heading.append(headingCopy, close);

  const liveStatus = makeElement(documentRef, 'div');
  liveStatus.setAttribute('role', 'status');
  liveStatus.setAttribute('aria-live', 'polite');
  liveStatus.setAttribute('aria-atomic', 'true');
  const stage = makeElement(documentRef, 'p', 'eon-nexus-pulse__stage', 'Ready');
  const route = makeElement(documentRef, 'p', 'eon-nexus-pulse__route', 'Guide mode');
  const summary = makeElement(documentRef, 'p', 'eon-nexus-pulse__summary', 'The same EONBOT conversation remains available in standard Chat.');
  liveStatus.append(stage, route, summary);

  const actions = makeElement(documentRef, 'div', 'eon-nexus-pulse__actions');
  const primaryControlBudget = Math.max(1, Math.min(6, Number(maxPrimaryControls) || 6));
  const chatAction = makeAction(documentRef, { action: 'chat', label: 'Open Chat', href: '/' });
  const speakAction = makeAction(documentRef, { action: 'speak', label: 'Speak', hidden: true });
  const reviewAction = makeAction(documentRef, { action: 'review', label: 'Review', href: '/workspace', hidden: true });
  const resultAction = makeAction(documentRef, { action: 'result', label: 'Open result', href: '/workspace', hidden: true });
  const expandAction = makeAction(documentRef, { action: 'expand', label: 'Expand Nexus', hidden: typeof onExpand !== 'function' });
  const fullScreenAction = makeAction(documentRef, { action: 'full-screen', label: 'Full screen', hidden: typeof onExpandFull !== 'function' });
  actions.append(chatAction, speakAction, reviewAction, resultAction, expandAction, fullScreenAction);
  panel.append(heading, liveStatus, actions);
  root.append(panel, toggle);
  mountTarget.appendChild(root);
  const motion = createEonNexusPulseMotionController({
    root,
    environment,
    userPreference: motionPreference,
    state: 'ready',
    privateRoute: false
  });

  let model = null;
  const setOpen = (open) => {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close EON NEXUS status' : `Open EON NEXUS status. ${model?.title || 'EONBOT ready'}`);
    if (open) close.focus?.();
  };

  const render = (snapshot) => {
    model = getEonNexusPulseViewModel(snapshot);
    root.dataset.eonbotState = model.state;
    root.dataset.privateRoute = String(model.privateRoute);
    root.dataset.eonNexusShape = model.flagship.shape;
    root.dataset.eonNexusTopology = model.flagship.topology;
    root.dataset.eonNexusContinuity = model.flagship.continuityId;
    root.style?.setProperty?.('--eon-nexus-accent', model.flagship.accent);
    root.style?.setProperty?.('--eon-nexus-secondary', model.flagship.secondaryAccent);
    root.style?.setProperty?.('--eon-nexus-energy', String(model.flagship.energy));
    root.style?.setProperty?.('--eon-nexus-pulse-ms', `${model.flagship.pulseMs}ms`);
    motion.update?.({ state: model.state, privateRoute: model.privateRoute });
    kicker.textContent = model.kicker;
    title.textContent = model.title;
    root.dataset.eonNexusSurface = model.surfaceLabel ? 'page-specific' : (root.dataset.eonNexusSurface || 'shared');
    root.dataset.eonNexusLabel = model.surfaceLabel || 'EON';
    toggleLabel.textContent = model.surfaceLabel ? `${model.surfaceLabel} Nexus` : 'EON NEXUS';
    stage.textContent = model.stageLabel;
    route.textContent = model.routeLabel;
    summary.textContent = model.summary;
    badge.hidden = model.badgeCount === 0;
    badge.textContent = model.badgeCount > 9 ? '9+' : String(model.badgeCount || '');
    toggle.setAttribute('aria-label', `${panel.hidden ? 'Open' : 'Close'} EON NEXUS status. ${model.title}. ${model.stageLabel}${model.badgeLabel ? `. ${model.badgeLabel}` : ''}`);
    chatAction.setAttribute('href', model.chatRoute);
    speakAction.hidden = !(model.canSpeak && typeof onSpeak === 'function');
    reviewAction.hidden = !model.reviewVisible;
    reviewAction.setAttribute('href', model.reviewRoute);
    resultAction.hidden = !model.resultVisible;
    resultAction.setAttribute('href', model.resultRoute);

    const rankedActions = [reviewAction, resultAction, fullScreenAction, expandAction, chatAction, speakAction];
    let visible = 0;
    for (const action of rankedActions) {
      if (action.hidden) continue;
      visible += 1;
      if (visible > primaryControlBudget) action.hidden = true;
    }
    root.dataset.primaryControlCount = String(Math.min(visible, primaryControlBudget));
    root.dataset.primaryControlBudget = String(primaryControlBudget);
  };

  const activate = (event, callback, fallback) => {
    if (typeof callback !== 'function') return;
    event.preventDefault();
    try { callback(model); } catch { fallback?.(); }
  };

  let suppressToggleClick = false;
  toggle.addEventListener('click', (event) => {
    if (suppressToggleClick || Number(event.detail || 0) >= 2) {
      suppressToggleClick = false;
      return;
    }
    setOpen(panel.hidden);
  });
  let gestureStartY = 0;
  let gestureStartAt = 0;
  toggle.addEventListener('pointerdown', (event) => {
    gestureStartY = Number(event.clientY || 0);
    gestureStartAt = Date.now();
  });
  toggle.addEventListener('pointerup', (event) => {
    const distance = gestureStartY - Number(event.clientY || 0);
    const elapsed = Date.now() - gestureStartAt;
    if (distance >= 42 && elapsed <= 700 && typeof onExpandFull === 'function') {
      event.preventDefault();
      suppressToggleClick = true;
      setOpen(false);
      try { onExpandFull(model); } catch {}
    }
  });
  toggle.addEventListener('dblclick', (event) => {
    if (typeof onExpandFull !== 'function') return;
    event.preventDefault();
    suppressToggleClick = true;
    setOpen(false);
    try { onExpandFull(model); } catch {}
  });
  close.addEventListener('click', () => setOpen(false));
  chatAction.addEventListener('click', (event) => activate(event, onOpenChat));
  speakAction.addEventListener('click', (event) => activate(event, onSpeak));
  reviewAction.addEventListener('click', (event) => activate(event, onReview));
  resultAction.addEventListener('click', (event) => activate(event, onResult));
  expandAction.addEventListener('click', (event) => activate(event, onExpand));
  fullScreenAction.addEventListener('click', (event) => activate(event, onExpandFull));
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();
      setOpen(false);
      toggle.focus?.();
    }
  });

  render(adapter.getSnapshot());
  const unsubscribe = adapter.subscribe((snapshot) => render(snapshot));

  return Object.freeze({
    ok: true,
    reason: null,
    element: root,
    motion,
    getViewModel: () => model,
    getMotionPolicy: () => motion.getPolicy?.() || null,
    setMotionPreference: (preference = 'auto') => motion.setPreference?.(preference),
    render,
    open: () => setOpen(true),
    close: () => setOpen(false),
    dispose() {
      try { unsubscribe?.(); } catch {}
      motion.dispose?.();
      root.remove?.();
    }
  });
}

export function getEonNexusPulseTruth() {
  return Object.freeze({
    staticFallbackAvailable: true,
    cssStateMotion: true,
    continuousAnimation: false,
    continuousJsAnimation: false,
    hiddenMotionPaused: true,
    reducedMotionStatic: true,
    startsVoiceCapture: false,
    startsAiWork: false,
    approvesAction: false,
    opensExistingRoutesOnly: true,
    standardChatAlwaysAvailable: true,
    rawStoreAccess: false,
    requiresBabylon: false,
    requiresGlb: false,
    pageSpecificContext: true,
    swipeOrDoubleClickFullScreen: true,
    explicitFullScreenAction: true
  });
}

export default Object.freeze({
  EON_NEXUS_PULSE_SCHEMA,
  getEonNexusPulseViewModel,
  mountEonNexusPulse,
  getEonNexusPulseTruth
});
