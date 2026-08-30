/**
 * W660G/W660N — intentional application-shell EON NEXUS continuity.
 *
 * Product routes receive one page-specific lightweight Pulse. Routes with a
 * genuine workflow may expand the same Live Nexus; restrained support/security
 * routes keep the smaller status/help surface. Chat keeps its chat-native bridge
 * and EONCITY keeps the nine Babylon holograms, preventing duplicate owners.
 */
import { createEonNexusEventAdapter } from './eon-nexus-event-adapter.js';
import { mountEonNexusPulse } from './eon-nexus-pulse.js';
import { getEonNexusMorphicContract } from './eon-nexus-morphic-contract.js';
import { writeEonNexusContinuitySnapshot } from './eon-nexus-continuity-contract.js';
import {
  createEonAppW700SignatureFlowController,
  readEonAppW700SignatureFlow,
  writeEonAppW700SignatureFlow
} from './w700/eonapp-w700-signature-flow.js';

export const EON_NEXUS_APP_SHELL_SCHEMA = 'eon.nexus.app-shell.w661d.v1';
export const EON_NEXUS_APP_SHELL_EXCLUDED_PAGES = Object.freeze(['chat', 'eoncity']);
const freeze = (value) => Object.freeze(value);
const context = (value) => freeze({
  presentation: 'standard',
  allowLiveNexus: true,
  defaultLiveMode: 'split',
  ...value
});

export const EON_NEXUS_PAGE_CONTEXTS = freeze({
  forge: context({ id: 'forge', label: 'Forge', nodeKind: 'forge', route: '/forge', summary: 'Tracks the real Forge flow from request and planning through files, generation, validation, preview and approval.' }),
  projects: context({ id: 'projects', label: 'Projects', nodeKind: 'projects', route: '/projects', summary: 'Shows selected-project continuity, task presence and the bounded Project Atlas without exposing private project text.' }),
  workspace: context({ id: 'workspace', label: 'Workspace', nodeKind: 'forge', route: '/workspace', summary: 'Shows foreground work, approvals and results already present in the shared EONBOT workspace.' }),
  'local-ai': context({ id: 'local-ai', label: 'Local AI', nodeKind: 'local-ai', route: '/local-ai', summary: 'Shows verified local-runtime readiness and private-on-device routing without exposing endpoints or provider credentials.' }),
  library: context({ id: 'library', label: 'Library', nodeKind: 'library', route: '/library', summary: 'Shows privacy-safe asset and result presence without revealing filenames or private file contents.' }),
  automations: context({ id: 'automations', label: 'Automations', nodeKind: 'automations', route: '/automations', summary: 'Shows upcoming, waiting, completed or failed automation state. Nexus never starts an automation by itself.' }),
  vault: context({ id: 'vault', label: 'Vault', nodeKind: 'vault', route: '/vault', presentation: 'restrained', summary: 'Shows secure-state counts and recovery attention only. Vault contents, keys and recovery material never enter Nexus.' }),
  settings: context({ id: 'settings', label: 'Settings', nodeKind: 'settings', route: '/settings', presentation: 'restrained', allowLiveNexus: false, summary: 'Shows configuration readiness and contextual help while every setting change remains an explicit user action.' }),
  billing: context({ id: 'billing', label: 'Membership', nodeKind: 'billing', route: '/billing', presentation: 'restrained', allowLiveNexus: false, summary: 'Shows public plan availability only. Billing authority remains server-side and no purchase starts from Nexus.' }),
  create: context({ id: 'create', label: 'Create', nodeKind: 'library', route: '/create', summary: 'Shows creation-result presence and project continuity while generation still begins only from an explicit Create action.' }),
  profile: context({ id: 'profile', label: 'Account', nodeKind: 'settings', route: '/profile', presentation: 'restrained', allowLiveNexus: false, summary: 'Shows account and configuration readiness without exposing identity tokens, private account hints or backup contents.' }),
  'eon-keys': context({ id: 'eon-keys', label: 'EON Keys', nodeKind: 'vault', route: '/eon-keys', presentation: 'restrained', allowLiveNexus: false, summary: 'Shows unlock and secure-state presence only; it never represents raw keys or financial value.' }),
  insights: context({ id: 'insights', label: 'Research', nodeKind: 'projects', route: '/insights', summary: 'Shows current project and research-work presence while source content remains outside the visual projection.' }),
  market: context({ id: 'market', label: 'Preview Studio', nodeKind: 'library', route: '/market', summary: 'Shows preview and result presence only. Nexus does not publish, trade or create a marketplace action.' }),
  'preview-studio': context({ id: 'preview-studio', label: 'Preview Studio', nodeKind: 'library', route: '/preview-studio', summary: 'Shows preview and result presence only. Nexus does not publish, trade or create a marketplace action.' }),
  apps: context({ id: 'apps', label: 'Apps', nodeKind: 'projects', route: '/apps', summary: 'Shows the selected project, available product surfaces and current EONBOT state without launching an app automatically.' }),
  'realm-studio': context({ id: 'realm-studio', label: 'Realm Studio', nodeKind: 'projects', route: '/realm-studio', summary: 'Shows selected-project and generated-world continuity while all editing and publishing actions remain native to Realm Studio.' }),
  capsule: context({ id: 'capsule', label: 'Capsule', nodeKind: 'vault', route: '/capsule', presentation: 'restrained', allowLiveNexus: false, summary: 'Shows backup and recovery attention only. Capsule contents and encrypted payloads stay outside Nexus.' }),
  help: context({ id: 'help', label: 'Help', nodeKind: 'settings', route: '/help', presentation: 'restrained', allowLiveNexus: false, summary: 'Provides contextual EONBOT status and a direct return to Chat without turning Help into another command centre.' }),
  support: context({ id: 'help', label: 'Help', nodeKind: 'settings', route: '/help', presentation: 'restrained', allowLiveNexus: false, summary: 'Shows safe support readiness and a direct return to EONBOT. Nexus never submits a report, attaches evidence or exposes credentials by itself.' }),
  install: context({ id: 'install', label: 'Install', nodeKind: 'settings', route: '/install', presentation: 'restrained', allowLiveNexus: false, summary: 'Shows installation readiness and a safe return to Chat. Nexus never triggers browser installation by itself.' }),
  'retired-campaigns': context({ id: 'retired-campaigns', label: 'Archived Rewards', nodeKind: 'vault', route: '/rewards', presentation: 'restrained', allowLiveNexus: false, summary: 'Shows that this campaign surface is retired and provides only safe navigation back to active EONAPP products.' })
});

const PULSE_STYLE_HREF = '/assets/css/eon-nexus-pulse.css';

function cleanPage(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 64);
}

export function getEonNexusPageContext(page = '') {
  const normalized = cleanPage(page);
  return EON_NEXUS_PAGE_CONTEXTS[normalized] || null;
}

function pageStatusLabel(node = null) {
  const status = String(node?.status || 'available').replace(/-/g, ' ');
  const count = Math.max(0, Math.min(999, Number(node?.count) || 0));
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}${count ? ` · ${count} observed` : ''}`;
}

export function projectEonNexusPageSnapshot(snapshot = {}, contextValue = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const safeContext = getEonNexusPageContext(contextValue.id || contextValue.page || contextValue.label || '') || context({
    id: 'app',
    label: 'EONAPP',
    nodeKind: '',
    route: '/',
    presentation: 'restrained',
    allowLiveNexus: false,
    summary: 'Shows privacy-projected EONBOT state for this supported EONAPP surface.'
  });
  const nodes = Array.isArray(source.nodes) ? source.nodes : [];
  const focusId = safeContext.nodeKind ? `role:${safeContext.nodeKind}` : '';
  const focusNode = nodes.find((node) => node?.id === focusId || node?.kind === safeContext.nodeKind) || null;
  const orderedNodes = focusNode ? [focusNode, ...nodes.filter((node) => node !== focusNode)] : nodes;
  const statusLabel = pageStatusLabel(focusNode);
  const summary = `${safeContext.summary}${focusNode ? ` Current signal: ${statusLabel}.` : ' No active local signal is required for this page.'}`;
  return freeze({
    ...source,
    nodes: freeze(orderedNodes),
    surface: freeze({
      id: safeContext.id,
      label: safeContext.label,
      nodeKind: safeContext.nodeKind,
      route: safeContext.route,
      statusLabel,
      summary,
      focusNodeId: focusNode?.id || focusId,
      presentation: safeContext.presentation,
      allowLiveNexus: safeContext.allowLiveNexus,
      pageSpecific: true
    })
  });
}

function createPageProjectedAdapter(adapter, pageContext) {
  return freeze({
    getSnapshot: () => projectEonNexusPageSnapshot(adapter.getSnapshot(), pageContext),
    subscribe(listener) {
      return adapter.subscribe((snapshot) => listener(projectEonNexusPageSnapshot(snapshot, pageContext)));
    },
    refresh: (...args) => adapter.refresh(...args)
  });
}

function resolvePage(documentRef, environment) {
  const explicit = cleanPage(documentRef?.body?.dataset?.eonAppPage || documentRef?.body?.dataset?.pageType || '');
  if (explicit) return explicit;
  const route = String(environment?.location?.pathname || '/').replace(/^\/+|\/+$/g, '');
  return cleanPage(route || 'chat');
}

export function shouldInstallEonNexusAppShell({
  page = '',
  document: documentRef = globalThis.document
} = {}) {
  const resolved = cleanPage(page || documentRef?.body?.dataset?.eonAppPage || documentRef?.body?.dataset?.pageType || '');
  const supportedSurface = documentRef?.body?.dataset?.eonAppShell === '1'
    || documentRef?.body?.dataset?.eonNexusShell === '1';
  if (!documentRef?.body || !supportedSurface) return false;
  if (EON_NEXUS_APP_SHELL_EXCLUDED_PAGES.includes(resolved)) return false;
  return Boolean(getEonNexusPageContext(resolved));
}

function ensurePulseStyles(documentRef) {
  if (!documentRef?.head?.appendChild) return false;
  if (documentRef.querySelector?.('link[data-eon-nexus-pulse-style]')) return true;
  const link = documentRef.createElement('link');
  link.rel = 'stylesheet';
  link.href = PULSE_STYLE_HREF;
  link.dataset.eonNexusPulseStyle = '1';
  documentRef.head.appendChild(link);
  return true;
}

export function installEonNexusAppShell({
  environment = globalThis,
  document: documentRef = environment?.document || null,
  mountTarget = documentRef?.body || null,
  page = resolvePage(documentRef, environment)
} = {}) {
  if (!shouldInstallEonNexusAppShell({ page, document: documentRef })) {
    return freeze({ ok: false, reason: 'app-shell-nexus-not-required', page: cleanPage(page), dispose() {} });
  }
  if (!mountTarget?.appendChild) {
    return freeze({ ok: false, reason: 'app-shell-nexus-environment-unavailable', page: cleanPage(page), dispose() {} });
  }
  if (documentRef.querySelector?.('[data-eon-nexus-pulse]')) {
    return freeze({ ok: false, reason: 'app-shell-nexus-already-mounted', page: cleanPage(page), dispose() {} });
  }

  ensurePulseStyles(documentRef);
  const adapter = createEonNexusEventAdapter({ environment, document: documentRef, emitOnTarget: environment });
  adapter.start();
  const pageContext = getEonNexusPageContext(page);
  const pageAdapter = createPageProjectedAdapter(adapter, pageContext);

  let liveNexus = null;
  let livingCore = null;
  let disposed = false;
  const signatureFlow = createEonAppW700SignatureFlowController({
    initialState: readEonAppW700SignatureFlow(environment.sessionStorage) || {}
  });
  const persistSignatureFlow = () => writeEonAppW700SignatureFlow(signatureFlow.getState(), environment.sessionStorage);
  const projectedProject = () => {
    const project = pageAdapter.getSnapshot()?.project || {};
    return freeze({
      id: String(project.id || '').trim(),
      label: String(project.label || 'Active project').trim().slice(0, 180),
      selected: project.selected === true,
      status: String(project.status || 'none').trim().slice(0, 48)
    });
  };
  const applySignatureEvent = (event = {}) => {
    if (!event?.type) return freeze({ ok: false, reason: 'signature-event-required', state: signatureFlow.getState() });
    const project = projectedProject();
    let result = null;
    if (event.type === 'work-object-selected') {
      result = signatureFlow.selectWorkObject({ selectedWorkObject: event.selectedWorkObject, project, explicitUserAction: true });
    } else if (event.type === 'atlas-reviewed') {
      result = signatureFlow.reviewAtlas({ project, explicitUserAction: true });
    } else return freeze({ ok: false, reason: 'signature-event-unsupported', state: signatureFlow.getState() });
    if (result.ok) persistSignatureFlow();
    return result;
  };
  const getMorphicContract = () => getEonNexusMorphicContract({
    page: pageContext.id,
    context: pageContext,
    snapshot: pageAdapter.getSnapshot(),
    environment
  });
  const openLiveNexus = async (requestedMode = '') => {
    if (disposed) return freeze({ ok: false, reason: 'app-shell-nexus-disposed' });
    if (pageContext.allowLiveNexus !== true) return freeze({ ok: false, reason: 'live-nexus-not-required-for-page', page: pageContext.id });
    const openResult = signatureFlow.openNexus({ explicitUserAction: true });
    if (openResult.ok) persistSignatureFlow();
    const morphic = getMorphicContract();
    const responsiveMode = morphic.liveMode || (environment.matchMedia?.('(max-width: 899px)')?.matches ? 'full' : pageContext.defaultLiveMode);
    const mode = requestedMode === 'full' ? 'full' : responsiveMode;
    if (liveNexus?.ok) {
      liveNexus.open?.(mode);
      livingCore?.resume?.();
      return liveNexus;
    }
    const { mountEonNexusLive } = await import('./eon-nexus-live.js');
    liveNexus = mountEonNexusLive({
      adapter: pageAdapter,
      environment,
      document: documentRef,
      mountTarget,
      initialMode: mode,
      onSignatureFlowEvent: applySignatureEvent,
      onEnterSpatialNexus(model) {
        // W686 continuity source contract: selectedWorkObject: model?.commandField?.selectedObject
        const selectedWorkObject = model?.commandField?.selectedObject || liveNexus?.getSelectedWorkObject?.() || null;
        const state = signatureFlow.getState();
        if (state.stage !== 'atlas-reviewed') {
          return freeze({ ok: false, reason: 'atlas-review-required-before-city', state });
        }
        if (selectedWorkObject?.id !== state.selectedWorkObject?.id) {
          return freeze({ ok: false, reason: 'selected-work-object-changed-after-atlas', state });
        }
        const handoffReview = signatureFlow.reviewCityHandoff({ sourceSurfaceId: pageContext.id, explicitUserAction: true });
        if (!handoffReview.ok) return handoffReview;
        persistSignatureFlow();
        const result = writeEonNexusContinuitySnapshot(pageAdapter.getSnapshot(), {
          storage: environment.sessionStorage,
          explicitUserAction: true,
          sourceSurface: pageContext,
          sourceRoute: pageContext.route,
          cityDestination: handoffReview.state.handoff?.placement?.districtId || 'core',
          selectedWorkObject
        });
        if (!result.ok) return result;
        environment.location?.assign?.(result.route);
        return freeze({ ...result, signatureFlow: handoffReview.state });
      }
    });
    if (liveNexus?.ok && morphic.productive) {
      liveNexus.element.dataset.spatialRenderer = 'loading';
      try {
        const { mountEonNexusLivingCore } = await import('./eon-nexus-living-core.js');
        livingCore = mountEonNexusLivingCore({ adapter: pageAdapter, liveNexus, page: pageContext.id, context: pageContext, environment, document: documentRef });
        liveNexus.element.dataset.spatialRenderer = livingCore?.rendererReady === true ? 'ready' : 'fallback';
        liveNexus.element.dataset.spatialRendererReason = String(livingCore?.reason || (livingCore?.rendererReady ? 'babylon-ready' : 'renderer-unavailable')).slice(0, 100);
      } catch (error) {
        livingCore = freeze({ ok: false, rendererReady: false, reason: 'living-core-load-failed', dispose() {} });
        liveNexus.element.dataset.spatialRenderer = 'failed';
        liveNexus.element.dataset.spatialRendererReason = String(error?.name || 'Error').slice(0, 100);
      }
    }
    return liveNexus;
  };

  const liveCallbacks = pageContext.allowLiveNexus === true ? {
    onExpand() {
      pulse.close?.();
      void openLiveNexus();
    },
    onExpandFull() {
      pulse.close?.();
      void openLiveNexus('full');
    }
  } : {};
  const pulse = mountEonNexusPulse({ adapter: pageAdapter, environment, document: documentRef, mountTarget, maxPrimaryControls: 3, ...liveCallbacks });
  if (!pulse.ok) {
    adapter.dispose();
    return pulse;
  }

  pulse.element.dataset.eonNexusSurface = 'app-shell';
  pulse.element.dataset.eonNexusPage = cleanPage(page);
  pulse.element.dataset.eonNexusContext = pageContext.id;
  pulse.element.dataset.eonNexusLabel = pageContext.label;
  const morphicContract = getMorphicContract();
  pulse.element.dataset.eonNexusPresentation = morphicContract.presentation;
  pulse.element.dataset.eonNexusRenderer = morphicContract.renderer;
  pulse.element.dataset.eonNexusProductive = String(morphicContract.productive);
  pulse.element.dataset.eonNexusMaxPrimaryControls = String(morphicContract.maxPrimaryControls);
  pulse.element.dataset.eonNexusLiveAllowed = String(pageContext.allowLiveNexus === true);
  adapter.refresh('app-shell-nexus-mounted');
  let requestedAtlas = false;
  try { requestedAtlas = new URLSearchParams(environment.location?.search || '').get('nexus') === 'atlas'; } catch {}
  if (requestedAtlas && pageContext.allowLiveNexus === true) {
    const openRequestedAtlas = async () => { const live = await openLiveNexus(); live?.openAtlas?.(); };
    environment.requestAnimationFrame?.(() => { void openRequestedAtlas(); }) || void openRequestedAtlas();
  }

  const pageHide = () => controller.dispose();
  environment.addEventListener?.('pagehide', pageHide, { once: true });
  const controller = freeze({
    ok: true,
    reason: null,
    schema: EON_NEXUS_APP_SHELL_SCHEMA,
    page: cleanPage(page),
    adapter,
    pageAdapter,
    pageContext,
    pulse,
    openLiveNexus,
    getLiveNexus: () => liveNexus,
    getLivingCore: () => livingCore,
    getMorphicContract,
    getSignatureFlow: () => signatureFlow.getState(),
    applySignatureEvent,
    refresh: (reason = 'app-shell-manual-refresh') => adapter.refresh(reason),
    dispose() {
      if (disposed) return;
      disposed = true;
      environment.removeEventListener?.('pagehide', pageHide);
      livingCore?.dispose?.();
      liveNexus?.dispose?.();
      pulse.dispose();
      adapter.dispose();
    }
  });
  return controller;
}

export function getEonNexusAppShellTruth() {
  return freeze({
    schema: EON_NEXUS_APP_SHELL_SCHEMA,
    applicationShellVisible: true,
    standaloneSupportedPages: true,
    intentionalPlacementMatrix: true,
    unknownShellRoutesDoNotAutoMount: true,
    restrainedSupportAndSecurityRoutes: true,
    chatUsesDedicatedBridge: true,
    cityUsesBabylonHolograms: true,
    samePrivacyProjectedAdapter: true,
    secondConversationStore: false,
    secondProjectStore: false,
    startsAiWork: false,
    startsVoiceCapture: false,
    autoNavigation: false,
    autoApproval: false,
    requiresWebGl: false,
    lazyLiveNexus: true,
    adaptiveMorphicContract: true,
    productiveRoutesUseImmersiveMode: true,
    restrainedBillingAndSupport: true,
    maximumPrimaryControls: 3,
    lazyLivingCoreAfterExplicitExpansion: true,
    hiddenLivingCorePaused: true,
    reducedMotionStaticLivingCore: true,
    pageSpecificOrbs: true,
    fullScreenGesture: true,
    explicitFullScreenAction: true,
    privacySafeSpatialHandoff: true,
    spatialNavigationRequiresExplicitAction: true,
    signatureFlowRequiresAtlasBeforeCity: true,
    signatureFlowUsesSameProjectedWorkObject: true,
    signatureFlowStoredSessionOnly: true
  });
}

export default freeze({
  EON_NEXUS_APP_SHELL_SCHEMA,
  EON_NEXUS_APP_SHELL_EXCLUDED_PAGES,
  EON_NEXUS_PAGE_CONTEXTS,
  getEonNexusPageContext,
  projectEonNexusPageSnapshot,
  shouldInstallEonNexusAppShell,
  installEonNexusAppShell,
  getEonNexusAppShellTruth
});
