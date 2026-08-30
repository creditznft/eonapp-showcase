/**
 * W662C — privacy-safe three-layer continuity contract.
 *
 * The contract carries only the already privacy-projected EON NEXUS facts
 * required to make Pulse, Live Nexus and the EONCITY Spatial Nexus feel like
 * one system. It never stores message bodies, prompts, provider credentials,
 * project contents, files, identity tokens or approval payloads.
 */

import { createEonNexusW686Handoff, normalizeEonNexusW686Handoff } from './w686/eon-nexus-w686-work-object-continuity.js';

export const EON_NEXUS_CONTINUITY_SCHEMA = 'eon.nexus.continuity.w662c.v1';
export const EON_NEXUS_CONTINUITY_STORAGE_KEY = 'eon:nexus:continuity:w662c:v1';
export const EON_NEXUS_CONTINUITY_TTL_MS = 30 * 60 * 1000;

const freeze = Object.freeze;

function cleanText(value = '', max = 180) {
  return Array.from(String(value || ''), (character) => {
    const code = character.codePointAt(0) || 0;
    return code < 32 || code === 127 ? ' ' : character;
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanId(value = '', max = 160) {
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

function bounded(value, max = 9999) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(max, Math.floor(number))) : 0;
}

function normalizeNode(node = {}, index = 0) {
  return freeze({
    id: cleanId(node.id || `node-${index + 1}`, 120) || `node-${index + 1}`,
    kind: cleanId(node.kind || 'tool', 64) || 'tool',
    label: cleanText(node.label || node.kind || 'Tool', 100) || 'Tool',
    status: cleanId(node.status || 'available', 32) || 'available',
    count: bounded(node.count, 999)
  });
}

function normalizeReturnContext(source = {}, fallbackRoute = '/') {
  return freeze({
    surfaceId: cleanId(source.surfaceId || source.id || 'app', 80) || 'app',
    surfaceLabel: cleanText(source.surfaceLabel || source.label || 'EONAPP', 100) || 'EONAPP',
    route: safeRoute(source.route || fallbackRoute, fallbackRoute),
    cityDestination: cleanId(source.cityDestination || 'core', 64) || 'core',
    expanseCellId: cleanId(source.expanseCellId || '', 80),
    realmId: cleanId(source.realmId || '', 80)
  });
}

function normalizeStoredContinuity(source = {}, now = Date.now()) {
  const createdAtMs = Number.isFinite(Date.parse(String(source.createdAt || '')))
    ? Date.parse(String(source.createdAt))
    : Number(now);
  const expiresAtMs = Number.isFinite(Date.parse(String(source.expiresAt || '')))
    ? Date.parse(String(source.expiresAt))
    : createdAtMs + EON_NEXUS_CONTINUITY_TTL_MS;
  const identity = source.identity || {};
  const conversation = source.conversation || {};
  const project = source.project || {};
  const providerRoute = source.providerRoute || {};
  const task = source.task || {};
  const approval = source.approval || {};
  const results = source.results || {};
  const atlas = source.atlas || {};
  const workObjectHandoff = normalizeEonNexusW686Handoff(source.workObjectHandoff || {}, now);
  const nodes = (Array.isArray(source.nodes) ? source.nodes : []).slice(0, 5).map(normalizeNode);
  const returnContext = normalizeReturnContext(source.returnContext || {}, '/');
  return freeze({
    schema: EON_NEXUS_CONTINUITY_SCHEMA,
    createdAt: new Date(createdAtMs).toISOString(),
    expiresAt: new Date(expiresAtMs).toISOString(),
    identity: freeze({
      assistantId: cleanId(identity.assistantId || 'eonbot', 80) || 'eonbot',
      assistantLabel: cleanText(identity.assistantLabel || 'EONBOT', 100) || 'EONBOT',
      state: cleanId(identity.state || 'ready', 48) || 'ready',
      stateLabel: cleanText(identity.stateLabel || identity.state || 'Ready', 120) || 'Ready'
    }),
    conversation: freeze({
      id: cleanId(conversation.id, 160),
      label: cleanText(conversation.label || 'Private conversation', 120) || 'Private conversation',
      messageCount: bounded(conversation.messageCount, 500),
      openRoute: safeRoute(conversation.openRoute || returnContext.route, returnContext.route)
    }),
    project: freeze({
      id: cleanId(project.id, 160),
      label: cleanText(project.label || (project.selected ? 'Active project' : 'No project selected'), 180),
      selected: project.selected === true,
      status: cleanId(project.status || 'none', 40) || 'none',
      taskCount: bounded(project.taskCount, 1000),
      artefactCount: bounded(project.artefactCount ?? project.artifactCount, 1000),
      openRoute: safeRoute(project.openRoute || '/projects', '/projects')
    }),
    providerRoute: freeze({
      mode: cleanId(providerRoute.mode || 'guide', 48) || 'guide',
      providerId: cleanId(providerRoute.providerId || '', 80),
      providerLabel: cleanText(providerRoute.providerLabel || 'Guide mode', 120) || 'Guide mode',
      privateOnDevice: providerRoute.privateOnDevice === true,
      verified: providerRoute.verified === true
    }),
    task: freeze({
      id: cleanId(task.id, 160),
      label: cleanText(task.label || 'No active task', 180),
      state: cleanId(task.state || 'ready', 64) || 'ready',
      stage: cleanId(task.stage || task.state || 'ready', 80) || 'ready',
      stageLabel: cleanText(task.stageLabel || 'Ready', 140) || 'Ready',
      cancellable: task.cancellable === true
    }),
    approval: freeze({
      pending: approval.pending === true,
      count: bounded(approval.count, 200),
      label: cleanText(approval.label || 'No approval waiting', 160),
      reviewRoute: safeRoute(approval.reviewRoute || '/workspace', '/workspace')
    }),
    nodes: freeze(nodes),
    selectedNodeId: cleanId(source.selectedNodeId || nodes[0]?.id || '', 120),
    results: freeze({
      count: bounded(results.count, 1000),
      unread: bounded(results.unread, 1000),
      label: cleanText(results.label || 'No new results', 140),
      openRoute: safeRoute(results.openRoute || '/workspace', '/workspace')
    }),
    atlas: freeze({
      selected: atlas.selected === true,
      projectId: cleanId(atlas.projectId || project.id, 160),
      incompleteCount: bounded(atlas.incompleteCount, 1000),
      completedTaskCount: bounded(atlas.completedTaskCount, 1000),
      nextActionKind: cleanId(atlas.nextActionKind || atlas.nextAction?.kind || '', 64),
      nextActionLabel: cleanText(atlas.nextActionLabel || atlas.nextAction?.label || '', 160)
    }),
    workObjectHandoff,
    returnContext,
    privacy: freeze({
      privacyProjected: true,
      rawMessageBodies: false,
      rawPrompts: false,
      rawProjectContents: false,
      rawFiles: false,
      providerCredentials: false,
      identityTokens: false,
      approvalPayloads: false
    })
  });
}

export function createEonNexusContinuitySnapshot(snapshot = {}, {
  sourceSurface = null,
  sourceRoute = '',
  cityDestination = 'core',
  selectedWorkObject = null,
  now = Date.now()
} = {}) {
  const source = snapshot && typeof snapshot === 'object' ? snapshot : {};
  const surface = source.surface || sourceSurface || {};
  const conversation = source.conversation || {};
  const project = source.project || {};
  const route = source.route || {};
  const task = source.task || {};
  const approval = source.approval || {};
  const results = source.results || {};
  const atlas = source.atlas || {};
  const nodes = (Array.isArray(source.nodes) ? source.nodes : []).slice(0, 5).map(normalizeNode);
  const createdAtMs = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const handoffResult = createEonNexusW686Handoff({ selectedWorkObject, project, sourceSurfaceId: surface.id || sourceSurface?.id || 'app', explicitUserAction: true, now: createdAtMs });
  const workObjectHandoff = handoffResult.ok ? handoffResult.handoff : null;
  const returnRoute = safeRoute(sourceRoute || surface.route || conversation.openRoute || '/', '/');

  return freeze({
    schema: EON_NEXUS_CONTINUITY_SCHEMA,
    createdAt: new Date(createdAtMs).toISOString(),
    expiresAt: new Date(createdAtMs + EON_NEXUS_CONTINUITY_TTL_MS).toISOString(),
    identity: freeze({
      assistantId: 'eonbot',
      assistantLabel: 'EONBOT',
      state: cleanId(source.eonbot?.state || 'ready', 48) || 'ready',
      stateLabel: cleanText(source.eonbot?.statusLabel || source.eonbot?.state || 'Ready', 120) || 'Ready'
    }),
    conversation: freeze({
      id: cleanId(conversation.id, 160),
      label: cleanText(conversation.label || 'Private conversation', 120) || 'Private conversation',
      messageCount: bounded(conversation.messageCount, 500),
      openRoute: safeRoute(conversation.openRoute || returnRoute, returnRoute)
    }),
    project: freeze({
      id: cleanId(project.id, 160),
      label: cleanText(project.label || (project.selected ? 'Active project' : 'No project selected'), 180),
      selected: project.selected === true,
      status: cleanId(project.status || 'none', 40) || 'none',
      taskCount: bounded(project.taskCount, 1000),
      artefactCount: bounded(project.artefactCount ?? project.artifactCount, 1000),
      openRoute: safeRoute(project.openRoute || '/projects', '/projects')
    }),
    providerRoute: freeze({
      mode: cleanId(route.mode || 'guide', 48) || 'guide',
      providerId: cleanId(route.providerId || '', 80),
      providerLabel: cleanText(route.providerLabel || 'Guide mode', 120) || 'Guide mode',
      privateOnDevice: route.privateOnDevice === true,
      verified: route.verified === true
    }),
    task: freeze({
      id: cleanId(task.id, 160),
      label: cleanText(task.label || 'No active task', 180),
      state: cleanId(task.state || 'ready', 64) || 'ready',
      stage: cleanId(task.stage || task.state || 'ready', 80) || 'ready',
      stageLabel: cleanText(task.stageLabel || 'Ready', 140) || 'Ready',
      cancellable: task.cancellable === true
    }),
    approval: freeze({
      pending: approval.pending === true,
      count: bounded(approval.count, 200),
      label: cleanText(approval.label || 'No approval waiting', 160),
      reviewRoute: safeRoute(approval.reviewRoute || '/workspace', '/workspace')
    }),
    nodes: freeze(nodes),
    selectedNodeId: cleanId(surface.focusNodeId || nodes.find((node) => ['active', 'waiting', 'failed', 'selected'].includes(node.status))?.id || nodes[0]?.id || '', 120),
    results: freeze({
      count: bounded(results.count, 1000),
      unread: bounded(results.unread, 1000),
      label: cleanText(results.label || 'No new results', 140),
      openRoute: safeRoute(results.openRoute || '/workspace', '/workspace')
    }),
    atlas: freeze({
      selected: atlas.selected === true,
      projectId: cleanId(atlas.projectId || project.id, 160),
      incompleteCount: bounded(atlas.incompleteCount, 1000),
      completedTaskCount: bounded(atlas.completedTaskCount, 1000),
      nextActionKind: cleanId(atlas.nextAction?.kind || '', 64),
      nextActionLabel: cleanText(atlas.nextAction?.label || '', 160)
    }),
    workObjectHandoff,
    returnContext: normalizeReturnContext({
      surfaceId: surface.id || sourceSurface?.id,
      surfaceLabel: surface.label || sourceSurface?.label,
      route: returnRoute,
      cityDestination
    }, returnRoute),
    privacy: freeze({
      privacyProjected: true,
      rawMessageBodies: false,
      rawPrompts: false,
      rawProjectContents: false,
      rawFiles: false,
      providerCredentials: false,
      identityTokens: false,
      approvalPayloads: false
    })
  });
}

export function writeEonNexusContinuitySnapshot(snapshot = {}, {
  storage = globalThis.sessionStorage,
  explicitUserAction = false,
  sourceSurface = null,
  sourceRoute = '',
  cityDestination = 'core',
  selectedWorkObject = null,
  now = Date.now()
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', route: '' });
  const continuity = createEonNexusContinuitySnapshot(snapshot, { sourceSurface, sourceRoute, cityDestination, selectedWorkObject, now });
  try {
    storage?.setItem?.(EON_NEXUS_CONTINUITY_STORAGE_KEY, JSON.stringify(continuity));
  } catch {
    return freeze({ ok: false, reason: 'continuity-storage-unavailable', route: '' });
  }
  return freeze({
    ok: true,
    reason: null,
    continuity,
    route: continuity.workObjectHandoff?.workObject?.districtId
      ? `/eoncity?nexus=spatial&destination=${encodeURIComponent(continuity.workObjectHandoff.workObject.districtId)}&station=${encodeURIComponent(continuity.workObjectHandoff.workObject.stationId)}`
      : `/eoncity?nexus=spatial&destination=${encodeURIComponent(continuity.returnContext.cityDestination)}`,
    autoNavigate: false
  });
}

export function readEonNexusContinuitySnapshot({
  storage = globalThis.sessionStorage,
  now = Date.now(),
  consumeExpired = true
} = {}) {
  let parsed = null;
  try { parsed = JSON.parse(storage?.getItem?.(EON_NEXUS_CONTINUITY_STORAGE_KEY) || 'null'); } catch { parsed = null; }
  if (!parsed || parsed.schema !== EON_NEXUS_CONTINUITY_SCHEMA) return null;
  const expiry = Date.parse(String(parsed.expiresAt || ''));
  if (!Number.isFinite(expiry) || expiry <= Number(now)) {
    if (consumeExpired) {
      try { storage?.removeItem?.(EON_NEXUS_CONTINUITY_STORAGE_KEY); } catch {}
    }
    return null;
  }
  return normalizeStoredContinuity(parsed, now);
}

export function clearEonNexusContinuitySnapshot({ storage = globalThis.sessionStorage } = {}) {
  try { storage?.removeItem?.(EON_NEXUS_CONTINUITY_STORAGE_KEY); return true; } catch { return false; }
}

export function getEonNexusContinuityTruth() {
  return freeze({
    schema: EON_NEXUS_CONTINUITY_SCHEMA,
    sameAssistantIdentity: true,
    samePrivacyProjectedState: true,
    explicitUserActionRequired: true,
    automaticNavigation: false,
    rawMessageBodiesStored: false,
    rawPromptsStored: false,
    rawProjectContentsStored: false,
    rawFilesStored: false,
    providerCredentialsStored: false,
    identityTokensStored: false,
    approvalPayloadsStored: false,
    boundedTtlMs: EON_NEXUS_CONTINUITY_TTL_MS,
    selectedWorkObjectHandoff: true,
    workObjectPrivacyProjected: true,
    cityPlacementIsProposalOnly: true
  });
}

export default freeze({
  EON_NEXUS_CONTINUITY_SCHEMA,
  EON_NEXUS_CONTINUITY_STORAGE_KEY,
  EON_NEXUS_CONTINUITY_TTL_MS,
  createEonNexusContinuitySnapshot,
  writeEonNexusContinuitySnapshot,
  readEonNexusContinuitySnapshot,
  clearEonNexusContinuitySnapshot,
  getEonNexusContinuityTruth
});
