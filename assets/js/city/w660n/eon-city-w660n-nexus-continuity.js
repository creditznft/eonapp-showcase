/**
 * W660N — privacy-projected continuity between the shared EON NEXUS state,
 * EONCITY's physical hologram stations and the native EONAPP surfaces.
 *
 * This module owns no conversation, project, task, provider, approval or render
 * state. It creates a bounded view model and review-first links from an already
 * normalized Nexus snapshot.
 */
import { getEonNexusPulseViewModel } from '../../nexus/eon-nexus-pulse.js';

export const EON_CITY_W660N_NEXUS_CONTINUITY_SCHEMA = 'eon.city.w660n.nexus-continuity.v1';
const freeze = (value) => Object.freeze(value);

function cleanText(value = '', max = 220) {
  const withoutControls = Array.from(String(value || ''), (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : character;
  }).join('');
  return withoutControls.replace(/\s+/g, ' ').trim().slice(0, max);
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

function action(id, label, { route = '', panel = '', purpose = '', source = 'shared-nexus' } = {}) {
  return freeze({
    id: cleanText(id, 100),
    label: cleanText(label, 100),
    route: route ? safeRoute(route, '/') : '',
    panel: cleanText(panel, 80),
    purpose: cleanText(purpose, 260),
    source,
    reviewRequired: true,
    explicitUserAction: true,
    autoExecute: false,
    autoNavigate: false,
    privateDataRead: false
  });
}

function uniqueActions(actions = []) {
  const seen = new Set();
  return freeze(actions.filter((entry) => {
    const key = `${entry.id}|${entry.route}|${entry.panel}`;
    if (!entry.id || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10));
}

export function projectEonCityW660nNexusView({
  snapshot = {},
  station = null,
  distance = Number.POSITIVE_INFINITY,
  districtId = '',
  stationActionsAvailable = false,
  continuity = null
} = {}) {
  const pulse = getEonNexusPulseViewModel(snapshot);
  const project = snapshot?.project || {};
  const task = snapshot?.task || {};
  const approval = snapshot?.approval || {};
  const results = snapshot?.results || {};
  const connection = snapshot?.connection || {};
  const handoff = continuity?.workObjectHandoff || null;
  const workObject = handoff?.workObject || null;
  const boundedDistance = Number.isFinite(Number(distance)) ? Math.max(0, Number(distance)) : null;
  const contextual = [
    action('nexus-continue-chat', 'Continue EONBOT', {
      route: pulse.chatRoute,
      purpose: 'Continue the same private EONBOT conversation on the native Chat surface.'
    })
  ];

  if (workObject?.id) {
    contextual.push(action('nexus-work-object-guide', `Guide to ${workObject.label}`, {
      panel: 'travel-map',
      purpose: `Review the proposed ${workObject.placementRole || 'work object'} placement at ${workObject.stationId}. Travel still requires separate confirmation.`,
      source: 'w686-work-object-handoff'
    }));
  }

  if (project.selected === true && project.openRoute) {
    contextual.push(action('nexus-current-project', 'Open current project', {
      route: project.openRoute,
      purpose: 'Continue the selected project from its native Projects surface.'
    }));
  }
  if (approval.pending === true) {
    contextual.push(action('nexus-review-approval', 'Review waiting approval', {
      route: approval.reviewRoute || '/workspace',
      purpose: approval.label || 'Review the pending action before anything changes.'
    }));
  }
  if (Number(results.count) > 0) {
    contextual.push(action('nexus-open-results', 'Open available results', {
      route: results.openRoute || '/workspace',
      purpose: results.label || 'Open the native result surface.'
    }));
  }
  if (stationActionsAvailable && Array.isArray(station?.actions)) {
    for (const item of station.actions) contextual.push(action(item.id, item.label, { route: item.route, panel: item.panel, purpose: item.purpose, source: 'physical-city-station' }));
  }

  const stationLabel = cleanText(station?.label || 'Nearest EON NEXUS station', 120);
  const stationPurpose = cleanText(String(station?.purpose || 'shared-eonbot-state').replace(/-/g, ' '), 220);
  const inRange = stationActionsAvailable === true;
  const connectionLabel = connection.state === 'available'
    ? 'Connected to the shared local EONAPP state'
    : cleanText(connection.label || connection.state || 'Connection needs attention', 160);

  return freeze({
    schema: EON_CITY_W660N_NEXUS_CONTINUITY_SCHEMA,
    state: pulse.state,
    stateLabel: pulse.title,
    flagship: pulse.flagship,
    shape: pulse.flagship.shape,
    topology: pulse.flagship.topology,
    accent: pulse.flagship.accent,
    secondaryAccent: pulse.flagship.secondaryAccent,
    continuityId: pulse.flagship.continuityId,
    morphSignature: pulse.flagship.morphSignature,
    stageLabel: pulse.stageLabel,
    routeLabel: pulse.routeLabel,
    privateRoute: pulse.privateRoute,
    summary: pulse.summary,
    connectionLabel,
    project: freeze({
      selected: project.selected === true,
      label: cleanText(project.label || 'No project selected', 160),
      status: cleanText(project.status || 'none', 40),
      taskCount: Math.max(0, Number(project.taskCount) || 0),
      artefactCount: Math.max(0, Number(project.artefactCount ?? project.artifactCount) || 0)
    }),
    task: freeze({
      active: Boolean(task.id),
      label: cleanText(task.label || 'No active task', 160),
      stageLabel: cleanText(task.stageLabel || 'Ready', 120),
      cancellable: task.cancellable === true
    }),
    approval: freeze({ pending: approval.pending === true, count: Math.max(0, Number(approval.count) || 0), label: cleanText(approval.label || 'No approval waiting', 160) }),
    results: freeze({ count: Math.max(0, Number(results.count) || 0), unread: Math.max(0, Number(results.unread) || 0), label: cleanText(results.label || 'No new results', 160) }),
    workObjectHandoff: workObject ? freeze({
      present: true,
      handoffId: cleanText(handoff.handoffId || '', 180),
      id: cleanText(workObject.id || '', 160),
      kind: cleanText(workObject.kind || 'tool', 64),
      label: cleanText(workObject.label || 'Work object', 150),
      meta: cleanText(workObject.meta || 'available', 120),
      status: cleanText(workObject.status || 'available', 64),
      districtId: cleanText(workObject.districtId || handoff.placement?.districtId || '', 80),
      stationId: cleanText(workObject.stationId || handoff.placement?.stationId || '', 100),
      placementRole: cleanText(workObject.placementRole || handoff.placement?.placementRole || '', 100),
      placementReason: cleanText(workObject.placementReason || handoff.placement?.reason || '', 220),
      atTargetDistrict: cleanText(workObject.districtId || '', 80) === cleanText(districtId || station?.districtId || '', 80),
      atTargetStation: cleanText(workObject.stationId || '', 100) === cleanText(station?.id || '', 100),
      reviewRequired: true,
      entryConfirmationRequired: true,
      nativeActionConfirmationRequired: true,
      autoNavigate: false,
      autoExecute: false
    }) : freeze({ present: false }),
    station: freeze({
      id: cleanText(station?.id || '', 100),
      label: stationLabel,
      purpose: stationPurpose,
      districtId: cleanText(station?.districtId || districtId, 80),
      distance: boundedDistance,
      distanceLabel: boundedDistance == null ? 'Location unavailable' : `${boundedDistance.toFixed(1)} m away`,
      inRange,
      interactionLabel: inRange ? 'Physical station actions available' : 'Approach the hologram to unlock its district actions'
    }),
    actions: uniqueActions(contextual),
    privacyProjected: true,
    sameConversation: true,
    sameProjectState: true,
    ownsConversation: false,
    ownsProjectStore: false,
    ownsRenderLoop: false,
    startsAiWork: false,
    startsVoiceCapture: false,
    autoNavigation: false,
    autoApproval: false
  });
}

export function getEonCityW660nNexusContinuityTruth() {
  return freeze({
    schema: EON_CITY_W660N_NEXUS_CONTINUITY_SCHEMA,
    ninePhysicalStationsUseSharedState: true,
    sameConversation: true,
    sameSelectedProject: true,
    selectedWorkObjectHandoff: true,
    workObjectRequiresSeparateTravelAndActionConfirmation: true,
    pageRoutesRemainNative: true,
    districtActionsRequireProximity: true,
    privacyProjected: true,
    rawConversationTextRead: false,
    rawProjectContentRead: false,
    startsAiWork: false,
    startsVoiceCapture: false,
    autoNavigation: false,
    autoApproval: false,
    ownsRenderLoop: false
  });
}

export default freeze({
  EON_CITY_W660N_NEXUS_CONTINUITY_SCHEMA,
  projectEonCityW660nNexusView,
  getEonCityW660nNexusContinuityTruth
});
