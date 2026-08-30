/**
 * W660A2 — adapter from existing EONAPP stores/events to the renderer-neutral
 * EON NEXUS observable-state contract.
 *
 * This module reads existing truth and subscribes to existing safe lifecycle
 * notifications. It never starts AI work, voice capture, a provider request,
 * an approval, an automation or an EONCITY action.
 */

import { getActiveChatThread } from '../utils/chat-threads.js';
import { readActiveProjectContext } from '../shell/eon-whole-app-ux.js';
import { loadProjects } from '../utils/eon-workspace-store.js';
import { loadAISettings } from '../chat/ai-runtime.js';
import { getAIReadiness } from '../utils/ai-readiness.js';
import { readEonKernelForegroundSession } from '../ai-kernel/eon-ai-kernel-session-store.js';
import { listEonKernelForegroundReviewItems } from '../ai-kernel/eon-ai-kernel-review-inbox.js';
import { listPendingEonbotLocalReviewCards } from '../chat/eonbot-action-cards.js';
import { listEonbotActionProposals } from '../chat/eonbot-action-proposals.js';
import { listAgentPresence } from '../operator/agent-presence.js';
import { createEonNexusStore } from './eon-nexus-state-contract.js';
import { buildEonNexusPrivacyProjectedState } from './eon-nexus-privacy-projection.js';
import { readEonNexusProductAdapterSnapshot } from './eon-nexus-product-adapters.js';

export const EON_NEXUS_SOURCE_REFRESH_EVENT = 'eon:nexus-source-refreshed';

export const EON_NEXUS_GLOBAL_SOURCE_EVENTS = Object.freeze([
  'eon:active-project-context-changed',
  'eon:agent-presence',
  'eon:chat-thread-state-changed',
  'eon:eonbot-live-state-changed',
  'eon:ai-route-state-changed',
  'eon:kernel-foreground-state-changed',
  'eon:review-inbox-state-changed'
]);

export const EON_NEXUS_DOCUMENT_SOURCE_EVENTS = Object.freeze([
  'eon:workspace-state-changed',
  'eon:project-saved',
  'eon:w631-state-changed',
  'eon:automation-state-changed'
]);

function safeStorage(candidate = null, fallbackName = '') {
  if (candidate && typeof candidate.getItem === 'function') return candidate;
  try { return fallbackName ? globalThis[fallbackName] || null : null; } catch { return null; }
}

function safeOnline(environment = globalThis) {
  const online = environment?.navigator?.onLine;
  return online !== false;
}

function safeChatState(environment = globalThis, supplied = null) {
  if (supplied && typeof supplied === 'object') return supplied;
  try {
    const diagnostics = environment?.EONBOTEmotion?.getState?.();
    if (!diagnostics || typeof diagnostics !== 'object') return {};
    return {
      pending: diagnostics.pending === true,
      voiceListening: diagnostics.voiceListening === true,
      isSpeaking: diagnostics.emotion === 'speaking',
      emotion: String(diagnostics.emotion || '')
    };
  } catch {
    return {};
  }
}

function selectProject(activeContext, projects = []) {
  const id = String(activeContext?.projectId || '');
  if (!id) return null;
  return (Array.isArray(projects) ? projects : []).find((project) => String(project?.id || '') === id) || null;
}

export function readEonNexusSourceSnapshot(options = {}) {
  const environment = options.environment || globalThis;
  const localStorage = safeStorage(options.localStorage, 'localStorage');
  const sessionStorage = safeStorage(options.sessionStorage, 'sessionStorage');
  const now = Number(options.now || Date.now());

  const readers = {
    getActiveChatThread: options.readers?.getActiveChatThread || getActiveChatThread,
    readActiveProjectContext: options.readers?.readActiveProjectContext || readActiveProjectContext,
    loadProjects: options.readers?.loadProjects || loadProjects,
    loadAISettings: options.readers?.loadAISettings || loadAISettings,
    getAIReadiness: options.readers?.getAIReadiness || getAIReadiness,
    readKernelSession: options.readers?.readKernelSession || readEonKernelForegroundSession,
    listPendingCards: options.readers?.listPendingCards || listPendingEonbotLocalReviewCards,
    listReviewItems: options.readers?.listReviewItems || listEonKernelForegroundReviewItems,
    listProposals: options.readers?.listProposals || listEonbotActionProposals,
    listAgentPresence: options.readers?.listAgentPresence || listAgentPresence,
    readProductAdapters: options.readers?.readProductAdapters || readEonNexusProductAdapterSnapshot
  };

  const thread = options.thread ?? readers.getActiveChatThread({ storage: sessionStorage, now });
  const activeProjectContext = options.activeProjectContext ?? readers.readActiveProjectContext({ storage: localStorage });
  const projectState = options.projectState ?? readers.loadProjects({ storage: localStorage });
  const project = options.project ?? selectProject(activeProjectContext, projectState?.projects || []);
  const settings = options.settings ?? readers.loadAISettings();
  const readiness = options.readiness ?? readers.getAIReadiness(settings);
  const kernelSession = options.kernelSession ?? readers.readKernelSession({ storage: sessionStorage });
  const pendingCards = options.pendingCards ?? readers.listPendingCards({ storage: localStorage, now });
  const reviewItems = options.reviewItems ?? readers.listReviewItems({ storage: sessionStorage, legacyCards: pendingCards });
  const proposals = options.proposals ?? readers.listProposals({ storage: localStorage, now });
  const agentPresence = options.agentPresence ?? readers.listAgentPresence({ storage: localStorage, limit: 16 });
  const productAdapters = options.productAdapters ?? readers.readProductAdapters({
    localStorage, sessionStorage, activeProjectContext, projectState, project, settings, readiness, kernelSession, now
  });

  return buildEonNexusPrivacyProjectedState({
    thread,
    activeProjectContext,
    project,
    readiness,
    taskRecords: kernelSession?.records || [],
    reviewItems,
    proposals,
    agentPresence,
    productNodes: productAdapters?.presence || [],
    chatState: safeChatState(environment, options.chatState),
    voiceState: options.voiceState || {},
    online: options.online ?? safeOnline(environment),
    detailsOpened: options.detailsOpened === true,
    quality: options.quality || {},
    now
  });
}

export function createEonNexusEventAdapter(options = {}) {
  const environment = options.environment || globalThis;
  const documentRef = options.document || environment?.document || null;
  const now = typeof options.now === 'function' ? options.now : Date.now;
  const sourceOptions = { ...options, environment, document: undefined, now: undefined };
  const store = options.store || createEonNexusStore({
    initialState: readEonNexusSourceSnapshot({ ...sourceOptions, now: now() }),
    now,
    eventTarget: options.emitOnTarget || null
  });
  const removers = [];
  let started = false;
  let disposed = false;

  const emitRefresh = (reason, snapshot) => {
    try {
      options.onRefresh?.(snapshot, reason);
    } catch {}
    try {
      options.emitOnTarget?.dispatchEvent?.(new CustomEvent(EON_NEXUS_SOURCE_REFRESH_EVENT, {
        detail: { reason: String(reason || 'refresh').slice(0, 80), updatedAt: snapshot.updatedAt }
      }));
    } catch {}
  };

  const refresh = (reason = 'manual', overrides = {}) => {
    if (disposed) return Object.freeze({ ok: false, reason: 'adapter-disposed', state: store.getSnapshot() });
    const snapshot = readEonNexusSourceSnapshot({ ...sourceOptions, ...overrides, now: now() });
    const result = store.replace(snapshot);
    emitRefresh(reason, result.state);
    return Object.freeze({ ok: true, reason: null, state: result.state });
  };

  const listen = (target, eventName) => {
    if (!target?.addEventListener) return;
    const handler = () => refresh(eventName);
    target.addEventListener(eventName, handler);
    removers.push(() => target.removeEventListener?.(eventName, handler));
  };

  const start = () => {
    if (disposed) return Object.freeze({ ok: false, reason: 'adapter-disposed' });
    if (started) return Object.freeze({ ok: true, reason: 'already-started' });
    for (const eventName of EON_NEXUS_GLOBAL_SOURCE_EVENTS) listen(environment, eventName);
    for (const eventName of EON_NEXUS_DOCUMENT_SOURCE_EVENTS) listen(documentRef, eventName);
    listen(environment, 'online');
    listen(environment, 'offline');
    listen(documentRef, 'visibilitychange');
    started = true;
    refresh('adapter-start');
    return Object.freeze({ ok: true, reason: null });
  };

  const stop = () => {
    while (removers.length) {
      try { removers.pop()?.(); } catch {}
    }
    started = false;
    return Object.freeze({ ok: true });
  };

  return Object.freeze({
    getSnapshot: () => store.getSnapshot(),
    subscribe: (listener) => store.subscribe(listener),
    refresh,
    start,
    stop,
    dispose() {
      if (disposed) return;
      stop();
      store.dispose?.();
      disposed = true;
    },
    getStatus: () => Object.freeze({ started, disposed })
  });
}

export function getEonNexusEventAdapterTruth() {
  return Object.freeze({
    readsExistingTruth: true,
    startsAiWork: false,
    startsVoiceCapture: false,
    callsProvider: false,
    approvesAction: false,
    runsAutomation: false,
    controlsCity: false,
    pollingRequired: false,
    rendererReceivesRawStores: false
  });
}

export default Object.freeze({
  EON_NEXUS_SOURCE_REFRESH_EVENT,
  EON_NEXUS_GLOBAL_SOURCE_EVENTS,
  EON_NEXUS_DOCUMENT_SOURCE_EVENTS,
  readEonNexusSourceSnapshot,
  createEonNexusEventAdapter,
  getEonNexusEventAdapterTruth
});
