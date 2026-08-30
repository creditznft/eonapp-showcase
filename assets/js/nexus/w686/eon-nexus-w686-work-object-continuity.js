/**
 * W686 — privacy-projected NEXUS-to-City work-object continuity.
 *
 * A selected, already projected work object can be carried into EONCITY only
 * after an explicit handoff action. The handoff proposes one physical Nexus
 * station and district; City entry and every native action remain separate.
 */
export const EON_NEXUS_W686_WORK_OBJECT_SCHEMA = 'eon.nexus.work-object-continuity.w686.v1';
export const EON_NEXUS_W686_HANDOFF_TTL_MS = 30 * 60 * 1000;

const freeze = Object.freeze;
const cleanText = (value = '', max = 180) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanId = (value = '', fallback = '') => cleanText(value, 160).replace(/[^a-zA-Z0-9:_-]/g, '').slice(0, 160) || fallback;

const PLACEMENTS = freeze({
  approval: freeze({ districtId: 'command-centre', stationId: 'command-status-nexus', placementRole: 'decision-review', reason: 'Approvals belong at the Command Status Nexus for explicit review.' }),
  result: freeze({ districtId: 'forge-basilica', stationId: 'forge-workflow-nexus', placementRole: 'verified-output', reason: 'Results belong at the Forge Workflow Nexus before reuse or continuation.' }),
  task: freeze({ districtId: 'agent-theatre', stationId: 'agent-theatre-nexus', placementRole: 'task-receipt', reason: 'Tasks belong at Agent Theatre where their real state and receipts can be inspected.' }),
  project: freeze({ districtId: 'archive-canopy', stationId: 'project-workstation-nexus', placementRole: 'project-continuity', reason: 'Projects belong at the Archive Project Nexus for durable continuity.' }),
  conversation: freeze({ districtId: 'orientation-hall', stationId: 'orientation-nexus-guide', placementRole: 'conversation-guide', reason: 'Conversation context begins at Orientation without exposing message bodies.' }),
  route: freeze({ districtId: 'transit-network', stationId: 'transit-nexus', placementRole: 'route-review', reason: 'Provider and route state belongs at Transit Nexus for review.' }),
  tool: freeze({ districtId: 'creator-atrium', stationId: 'creator-command-nexus', placementRole: 'capability-object', reason: 'Capabilities belong at Creator Command as selectable tools.' })
});

function placementFor(kind = '') { return PLACEMENTS[cleanId(kind)] || PLACEMENTS.tool; }

export function projectEonNexusW686WorkObject(selectedWorkObject = null, project = {}) {
  if (!selectedWorkObject?.id) return null;
  const kind = cleanId(selectedWorkObject.kind, 'tool');
  const placement = placementFor(kind);
  return freeze({
    schema: EON_NEXUS_W686_WORK_OBJECT_SCHEMA,
    id: cleanId(selectedWorkObject.id),
    kind,
    label: cleanText(selectedWorkObject.label || kind, 150),
    meta: cleanText(selectedWorkObject.meta || selectedWorkObject.status || 'available', 120),
    status: cleanId(selectedWorkObject.status, 'available'),
    action: cleanId(selectedWorkObject.action, 'inspect'),
    projectId: cleanId(project?.id),
    projectSelected: project?.selected === true,
    districtId: placement.districtId,
    stationId: placement.stationId,
    placementRole: placement.placementRole,
    placementReason: placement.reason,
    privacyProjected: true,
    rawContentIncluded: false,
    explicitUserActionRequired: true,
    autoNavigate: false,
    autoExecute: false,
    autoApprove: false
  });
}

export function createEonNexusW686Handoff({
  selectedWorkObject = null,
  project = {},
  sourceSurfaceId = 'app',
  explicitUserAction = false,
  now = Date.now()
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', handoff: null });
  const workObject = projectEonNexusW686WorkObject(selectedWorkObject, project);
  if (!workObject) return freeze({ ok: false, reason: 'work-object-required', handoff: null });
  const createdAtMs = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const handoff = freeze({
    schema: EON_NEXUS_W686_WORK_OBJECT_SCHEMA,
    handoffId: cleanId(`handoff:${workObject.id}:${createdAtMs}`, `handoff:${createdAtMs}`),
    createdAt: new Date(createdAtMs).toISOString(),
    expiresAt: new Date(createdAtMs + EON_NEXUS_W686_HANDOFF_TTL_MS).toISOString(),
    sourceSurfaceId: cleanId(sourceSurfaceId, 'app'),
    workObject,
    placement: freeze({
      districtId: workObject.districtId,
      stationId: workObject.stationId,
      placementRole: workObject.placementRole,
      reason: workObject.placementReason,
      reviewRequired: true,
      entryConfirmationRequired: true,
      nativeActionConfirmationRequired: true
    }),
    receipt: freeze({
      kind: 'nexus-city-work-object-handoff',
      explicitUserAction: true,
      autoNavigate: false,
      autoExecute: false,
      autoApprove: false,
      privateDataRead: false
    })
  });
  return freeze({ ok: true, reason: null, handoff, route: `/eoncity?nexus=spatial&destination=${encodeURIComponent(workObject.districtId)}&station=${encodeURIComponent(workObject.stationId)}` });
}

export function normalizeEonNexusW686Handoff(value = {}, now = Date.now()) {
  if (!value || value.schema !== EON_NEXUS_W686_WORK_OBJECT_SCHEMA) return null;
  const expiry = Date.parse(String(value.expiresAt || ''));
  if (!Number.isFinite(expiry) || expiry <= Number(now)) return null;
  const projected = projectEonNexusW686WorkObject(value.workObject, { id: value.workObject?.projectId, selected: value.workObject?.projectSelected });
  if (!projected) return null;
  return freeze({
    schema: EON_NEXUS_W686_WORK_OBJECT_SCHEMA,
    handoffId: cleanId(value.handoffId),
    createdAt: new Date(Date.parse(String(value.createdAt || '')) || Number(now)).toISOString(),
    expiresAt: new Date(expiry).toISOString(),
    sourceSurfaceId: cleanId(value.sourceSurfaceId, 'app'),
    workObject: projected,
    placement: freeze({
      districtId: projected.districtId,
      stationId: projected.stationId,
      placementRole: projected.placementRole,
      reason: projected.placementReason,
      reviewRequired: true,
      entryConfirmationRequired: true,
      nativeActionConfirmationRequired: true
    }),
    receipt: freeze({ kind: 'nexus-city-work-object-handoff', explicitUserAction: true, autoNavigate: false, autoExecute: false, autoApprove: false, privateDataRead: false })
  });
}

export function getEonNexusW686WorkObjectTruth() {
  return freeze({
    schema: EON_NEXUS_W686_WORK_OBJECT_SCHEMA,
    kindsMappedToPhysicalDistrictStations: freeze(Object.keys(PLACEMENTS)),
    explicitHandoffRequired: true,
    entryConfirmationRequired: true,
    nativeActionConfirmationRequired: true,
    privacyProjectedOnly: true,
    rawContentIncluded: false,
    automaticNavigation: false,
    automaticExecution: false,
    automaticApproval: false,
    boundedTtlMs: EON_NEXUS_W686_HANDOFF_TTL_MS
  });
}

export default freeze({ EON_NEXUS_W686_WORK_OBJECT_SCHEMA, EON_NEXUS_W686_HANDOFF_TTL_MS, projectEonNexusW686WorkObject, createEonNexusW686Handoff, normalizeEonNexusW686Handoff, getEonNexusW686WorkObjectTruth });
