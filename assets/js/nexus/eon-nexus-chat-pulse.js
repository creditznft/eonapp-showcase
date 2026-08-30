/**
 * W660B1 — Chat integration for the static EON Pulse.
 *
 * This bridge reads the already-exposed, bounded EONBOT diagnostics and the
 * W660A2 privacy-projected snapshot. It does not read message bodies, start AI
 * work, open a microphone, approve actions or create a second conversation.
 */

import { normalizeEonNexusState } from './eon-nexus-state-contract.js';
import { createEonNexusEventAdapter } from './eon-nexus-event-adapter.js';
import { mountEonNexusPulse } from './eon-nexus-pulse.js';
import { writeEonNexusContinuitySnapshot } from './eon-nexus-continuity-contract.js';

export const EON_NEXUS_CHAT_PULSE_SCHEMA = 'eon.nexus.chat-pulse.w660b1.v1';

const CHAT_PULSE_STYLE_HREF = '/assets/css/eon-nexus-pulse.css';
const OBSERVED_SELECTORS = Object.freeze([
  '#eonbot-emotion-strip',
  '#eonbot-emotion-label',
  '#eonbot-emotion-detail',
  '#eonbot-model-chip',
  '#eonbot-voice-chip',
  '#eonbot-mission-chip',
  '#chat-runtime-label',
  '#chat-provider-badge',
  '#chat-messages'
]);

function cleanText(value = '', max = 140) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function readDiagnostics(environment = globalThis) {
  try {
    const value = environment?.EONBOTEmotion?.getState?.();
    return value && typeof value === 'object' ? value : {};
  } catch {
    return {};
  }
}

function mapEmotionToNexusState(emotion = '', currentState = 'ready') {
  if (['waiting-approval', 'offline'].includes(currentState)) return currentState;
  const value = String(emotion || '').toLowerCase();
  if (value === 'listening') return 'listening';
  if (value === 'speaking') return 'speaking';
  if (['thinking', 'scanning'].includes(value)) return 'processing';
  if (value === 'happy') return 'complete';
  if (value === 'error') return 'error';
  return currentState === 'error' ? 'error' : 'ready';
}

export function projectEonNexusChatPulseSnapshot(snapshot = {}, diagnostics = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const currentEonbot = source.eonbot || {};
  const voiceCapability = diagnostics?.voiceCapability && typeof diagnostics.voiceCapability === 'object'
    ? diagnostics.voiceCapability
    : {};
  const state = diagnostics.pending === true
    ? 'processing'
    : mapEmotionToNexusState(diagnostics.emotion, currentEonbot.state);
  const detail = cleanText(diagnostics.detail, 180);
  const statusLabel = state === 'complete'
    ? 'Reply ready'
    : state === 'processing'
      ? 'Working'
      : state === 'listening'
        ? 'Listening'
        : state === 'speaking'
          ? 'Speaking'
          : state === 'error'
            ? 'Needs attention'
            : cleanText(currentEonbot.statusLabel || 'Ready', 80);

  const normalized = normalizeEonNexusState({
    ...source,
    eonbot: {
      ...currentEonbot,
      state,
      detailCode: cleanText(diagnostics.emotion || currentEonbot.detailCode || state, 80),
      statusLabel,
      canListen: currentEonbot.canListen === true || voiceCapability.dictationReady === true || voiceCapability.voiceReady === true,
      isListening: state === 'listening',
      isSpeaking: state === 'speaking'
    },
    task: {
      ...(source.task || {}),
      stageLabel: state === 'complete' && !(source.task?.id)
        ? 'Reply ready'
        : state === 'processing' && !(source.task?.id)
          ? (detail || 'Preparing the reply')
          : source.task?.stageLabel
    }
  });
  return Object.freeze({
    ...normalized,
    surface: Object.freeze({
      id: 'chat',
      label: 'Chat',
      nodeKind: 'conversation',
      route: '/',
      statusLabel,
      summary: 'Shows the current EONBOT state for this same private Chat. Opening Nexus never creates a second conversation.',
      focusNodeId: 'role:conversation',
      pageSpecific: true
    })
  });
}

function createProjectedChatAdapter(baseAdapter, environment) {
  const listeners = new Set();
  let current = projectEonNexusChatPulseSnapshot(baseAdapter.getSnapshot(), readDiagnostics(environment));
  const unsubscribe = baseAdapter.subscribe((snapshot, event) => {
    current = projectEonNexusChatPulseSnapshot(snapshot, readDiagnostics(environment));
    for (const listener of listeners) {
      try { listener(current, event); } catch {}
    }
  });
  return Object.freeze({
    getSnapshot: () => current,
    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh(reason = 'chat-pulse-refresh') {
      const result = baseAdapter.refresh(reason);
      current = projectEonNexusChatPulseSnapshot(result.state, readDiagnostics(environment));
      for (const listener of listeners) {
        try { listener(current, { type: reason }); } catch {}
      }
      return Object.freeze({ ...result, state: current });
    },
    dispose() {
      try { unsubscribe?.(); } catch {}
      listeners.clear();
    }
  });
}

function ensurePulseStyles(documentRef) {
  if (!documentRef?.head?.appendChild) return false;
  if (documentRef.querySelector?.('link[data-eon-nexus-pulse-style]')) return true;
  const link = documentRef.createElement('link');
  link.rel = 'stylesheet';
  link.href = CHAT_PULSE_STYLE_HREF;
  link.dataset.eonNexusPulseStyle = '1';
  documentRef.head.appendChild(link);
  return true;
}

function installSourceObserver(documentRef, onChange) {
  if (typeof globalThis.MutationObserver !== 'function' || !documentRef?.querySelectorAll) return () => {};
  const targets = OBSERVED_SELECTORS.flatMap((selector) => [...documentRef.querySelectorAll(selector)]);
  if (!targets.length) return () => {};
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      try { onChange(); } catch {}
    });
  });
  for (const target of targets) observer.observe(target, { attributes: true, childList: true, characterData: true, subtree: true });
  return () => observer.disconnect();
}

function focusChatComposer(documentRef) {
  const input = documentRef?.getElementById?.('chat-input');
  input?.focus?.();
  input?.scrollIntoView?.({ block: 'nearest' });
}

function activateExistingVoice(documentRef) {
  const voice = documentRef?.getElementById?.('chat-voice-toggle') || documentRef?.getElementById?.('chat-voice-send');
  voice?.focus?.();
  voice?.click?.();
}

function isChatSurface(documentRef, environment) {
  const bodySurface = String(documentRef?.body?.dataset?.pageType || documentRef?.body?.dataset?.eonAppPage || '').toLowerCase();
  const route = String(environment?.location?.pathname || '').replace(/\/+$/, '') || '/';
  const chatDomReady = Boolean(documentRef?.getElementById?.('chat-input') && documentRef?.getElementById?.('chat-messages'));
  return bodySurface === 'chat' || route === '/chat' || chatDomReady;
}

export function installEonNexusChatPulse({
  environment = globalThis,
  document: documentRef = environment?.document || null,
  mountTarget = documentRef?.body || null
} = {}) {
  if (!documentRef?.body || !isChatSurface(documentRef, environment)) {
    return Object.freeze({ ok: false, reason: 'chat-surface-required', dispose() {} });
  }
  if (documentRef.querySelector?.('[data-eon-nexus-pulse]')) {
    return Object.freeze({ ok: false, reason: 'pulse-already-mounted', dispose() {} });
  }

  ensurePulseStyles(documentRef);
  const diagnostics = readDiagnostics(environment);
  const voiceCapability = diagnostics.voiceCapability || {};
  const baseAdapter = createEonNexusEventAdapter({
    environment,
    document: documentRef,
    emitOnTarget: environment,
    voiceState: {
      dictationReady: voiceCapability.dictationReady === true,
      voiceReady: voiceCapability.voiceReady === true,
      status: cleanText(diagnostics.voiceSession || diagnostics.emotion, 48)
    }
  });
  baseAdapter.start();
  const adapter = createProjectedChatAdapter(baseAdapter, environment);
  let liveNexus = null;
  let livingCore = null;
  const openLiveNexus = async (requestedMode = '') => {
    const defaultMode = environment.matchMedia?.('(max-width: 899px)')?.matches ? 'full' : 'split';
    const mode = requestedMode === 'full' ? 'full' : defaultMode;
    if (liveNexus?.ok) {
      liveNexus.open?.(mode);
      livingCore?.resume?.();
      return liveNexus;
    }
    const { mountEonNexusLive } = await import('./eon-nexus-live.js');
    liveNexus = mountEonNexusLive({
      adapter,
      environment,
      document: documentRef,
      mountTarget,
      initialMode: mode,
      onOpenChat() {
        focusChatComposer(documentRef);
        liveNexus?.close?.();
      },
      onSpeak() {
        activateExistingVoice(documentRef);
      },
      onEnterSpatialNexus() {
        const result = writeEonNexusContinuitySnapshot(adapter.getSnapshot(), {
          storage: environment.sessionStorage,
          explicitUserAction: true,
          sourceSurface: { id: 'chat', label: 'Chat', route: '/' },
          sourceRoute: '/',
          cityDestination: 'core'
        });
        if (!result.ok) return result;
        environment.location?.assign?.(result.route);
        return result;
      }
    });
    if (liveNexus?.ok) {
      liveNexus.element.dataset.spatialRenderer = 'loading';
      try {
        const { mountEonNexusLivingCore } = await import('./eon-nexus-living-core.js');
        livingCore = mountEonNexusLivingCore({
          adapter,
          liveNexus,
          page: 'chat',
          context: {
            id: 'chat',
            label: 'Chat',
            route: '/',
            presentation: 'productive',
            allowLiveNexus: true
          },
          environment,
          document: documentRef
        });
        liveNexus.element.dataset.spatialRenderer = livingCore?.rendererReady === true ? 'ready' : 'fallback';
        liveNexus.element.dataset.spatialRendererReason = String(livingCore?.reason || (livingCore?.rendererReady ? 'babylon-ready' : 'renderer-unavailable')).slice(0, 100);
      } catch (error) {
        livingCore = Object.freeze({ ok: false, rendererReady: false, reason: 'living-core-load-failed', dispose() {} });
        liveNexus.element.dataset.spatialRenderer = 'failed';
        liveNexus.element.dataset.spatialRendererReason = String(error?.name || 'Error').slice(0, 100);
      }
    }
    return liveNexus;
  };
  const pulse = mountEonNexusPulse({
    adapter,
    environment,
    document: documentRef,
    mountTarget,
    onOpenChat() {
      focusChatComposer(documentRef);
      pulse.close?.();
    },
    onSpeak() {
      activateExistingVoice(documentRef);
      pulse.close?.();
    },
    onExpand() {
      pulse.close?.();
      void openLiveNexus();
    },
    onExpandFull() {
      pulse.close?.();
      void openLiveNexus('full');
    }
  });
  if (!pulse.ok) {
    adapter.dispose();
    baseAdapter.dispose();
    return pulse;
  }

  pulse.element.dataset.eonNexusSurface = 'chat-shell';
  pulse.element.dataset.eonNexusPage = 'chat';
  pulse.element.dataset.eonNexusLabel = 'Chat';
  pulse.element?.querySelector?.('h2')?.setAttribute?.('tabindex', '-1');
  const removeObserver = installSourceObserver(documentRef, () => adapter.refresh('chat-observable-state-changed'));
  adapter.refresh('chat-pulse-mounted');

  const pageHide = () => controller.dispose();
  environment.addEventListener?.('pagehide', pageHide, { once: true });
  let disposed = false;
  const controller = Object.freeze({
    ok: true,
    reason: null,
    schema: EON_NEXUS_CHAT_PULSE_SCHEMA,
    pulse,
    adapter,
    openLiveNexus,
    getLiveNexus: () => liveNexus,
    getLivingCore: () => livingCore,
    refresh: (reason = 'manual') => adapter.refresh(reason),
    dispose() {
      if (disposed) return;
      disposed = true;
      environment.removeEventListener?.('pagehide', pageHide);
      try { removeObserver(); } catch {}
      livingCore?.dispose?.();
      liveNexus?.dispose?.();
      pulse.dispose();
      adapter.dispose();
      baseAdapter.dispose();
    }
  });
  return controller;
}

export function getEonNexusChatPulseTruth() {
  return Object.freeze({
    sameChatComposer: true,
    secondConversationStore: false,
    rawMessageBodyRead: false,
    startsVoiceAutomatically: false,
    startsAiWork: false,
    approvesActions: false,
    polling: false,
    mutationObserverOnly: true,
    lazyStyleLoad: true,
    rendererEngine: 'dom-css-state-motion',
    liveNexusUsesSameAdapter: true,
    liveNexusLazyLoaded: true,
    expandedChatUsesLazyBabylonLivingCore: true,
    compactPulseStillUsesDomCss: true,
    visibleChatIdentity: true,
    explicitFullScreenAction: true
  });
}

export default Object.freeze({
  EON_NEXUS_CHAT_PULSE_SCHEMA,
  projectEonNexusChatPulseSnapshot,
  installEonNexusChatPulse,
  getEonNexusChatPulseTruth
});
