/** A15 C08 — one source authority for the Command Hub, stations and Living Nexus. */
import {
  EON_CITY_W731_STATIONS,
  EON_CITY_W737_DISCOVERIES,
  validateEonCityW731CommandHubContract
} from '../w731/eon-city-w731-command-hub-contract.js';
import {
  EON_CITY_W748_DEFAULT_INTERACTIONS,
  validateEonCityW748InteractionRegistry
} from '../w748/eon-city-w748-interaction-registry.js';
import {
  listEonWorkSurfaceDefinitions
} from '../../contracts/work-surface/eon-work-surface-registry.js';
import { getEonNexusCityProjectionTruth } from '../../contracts/nexus/eon-nexus-city-projection.js';

export const EON_CITY_C08_COMMAND_HUB_SCHEMA = 'eon.city.command-hub-convergence.a15.c08.v1';
const freeze = (value) => Object.freeze(value);
const SURFACE_IDS = new Set(listEonWorkSurfaceDefinitions().map((entry) => entry.id));
const PARTS = freeze(['station', 'terminal', 'npc']);

function interactionById(id = '') {
  return EON_CITY_W748_DEFAULT_INTERACTIONS.find((entry) => entry.id === id) || null;
}

function projectStation(station) {
  const parts = PARTS.map((part) => interactionById(`${part}:${station.id}`));
  return freeze({
    id: station.id,
    label: station.label,
    surface: station.surface,
    maintainedSurface: SURFACE_IDS.has(station.surface),
    assetId: station.assetId,
    npcId: station.npc?.id || '',
    npcRole: station.npc?.role || '',
    interactionParts: freeze(parts.map((entry, index) => freeze({
      part: PARTS[index],
      id: entry?.id || '',
      present: Boolean(entry),
      visible: entry?.visible !== false,
      label: entry?.label || '',
      purpose: entry?.oneLinePurpose || '',
      actionKind: entry?.primaryAction?.kind || '',
      surface: entry?.primaryAction?.surface || '',
      maintainedSurface: entry?.primaryAction?.kind !== 'open' || SURFACE_IDS.has(entry?.primaryAction?.surface || ''),
      accessibilityLabel: entry?.accessibilityLabel || '',
      truthBoundary: entry?.truthBoundary || ''
    })))
  });
}

function projectDiscovery(discovery) {
  const entry = interactionById(`discovery:${discovery.id}`) || interactionById(`portal:${discovery.id}`);
  return freeze({
    id: discovery.id,
    label: discovery.label,
    present: Boolean(entry),
    actionKind: entry?.primaryAction?.kind || '',
    actionLabel: entry?.primaryAction?.label || discovery.npc?.action || '',
    explicitUserActionRequired: entry?.primaryAction?.explicitUserActionRequired !== false,
    automaticNavigation: entry?.primaryAction?.automaticNavigation === true,
    truthBoundary: entry?.truthBoundary || ''
  });
}

export function buildEonCityC08CommandHubAudit() {
  const stations = freeze(EON_CITY_W731_STATIONS.map(projectStation));
  const discoveries = freeze(EON_CITY_W737_DISCOVERIES.map(projectDiscovery));
  const coveredIds = new Set([
    ...stations.flatMap((station) => station.interactionParts.map((part) => part.id)),
    ...discoveries.map((entry) => `discovery:${entry.id}`)
  ]);
  const supportObjects = freeze(EON_CITY_W748_DEFAULT_INTERACTIONS
    .filter((entry) => !coveredIds.has(entry.id) && !entry.stationId && !entry.discoveryId)
    .map((entry) => freeze({
      id: entry.id,
      label: entry.label,
      objectType: entry.objectType,
      visible: entry.visible !== false,
      declaredInteractive: ['open', 'inspect', 'focus', 'explain'].includes(entry.primaryAction?.kind),
      declaredUnavailable: entry.primaryAction?.kind === 'unavailable' && Boolean(entry.unavailableReason),
      purpose: entry.oneLinePurpose,
      accessibilityLabel: entry.accessibilityLabel,
      truthBoundary: entry.truthBoundary
    })));
  const nexus = getEonNexusCityProjectionTruth();
  return freeze({
    schema: EON_CITY_C08_COMMAND_HUB_SCHEMA,
    stationCount: stations.length,
    discoveryCount: discoveries.length,
    interactionCount: EON_CITY_W748_DEFAULT_INTERACTIONS.length,
    stations,
    discoveries,
    supportObjects,
    nexus: freeze({
      privacyProjected: nexus.privacyProjected === true,
      rawConversationTextRead: nexus.rawConversationTextRead === true,
      rawProjectContentRead: nexus.rawProjectContentRead === true,
      startsAiWork: nexus.startsAiWork === true,
      startsVoiceCapture: nexus.startsVoiceCapture === true,
      autoNavigation: nexus.autoNavigation === true,
      autoApproval: nexus.autoApproval === true,
      ownsRenderLoop: nexus.ownsRenderLoop === true
    }),
    menuHierarchy: freeze(['Signal Frontier', 'Storm Sector', 'My Frontier', 'Living Nexus', 'Mission Board', 'Share Command Center', 'Creator Capture', 'Plans & Access', 'Accessible Map']),
    monitorsRequireRealReceipts: true,
    transitReviewRequired: true,
    decorativeObjectsMustBeDeclared: true,
    privateContentStored: false
  });
}

export function validateEonCityC08CommandHubConvergence(audit = buildEonCityC08CommandHubAudit()) {
  const errors = [];
  const base = validateEonCityW731CommandHubContract();
  const interactions = validateEonCityW748InteractionRegistry();
  if (!base.ok) errors.push(...base.errors.map((value) => `hub:${value}`));
  if (!interactions.ok) errors.push(...interactions.errors.map((value) => `interaction:${value}`));
  if (audit.stationCount !== 10) errors.push('ten-stations-required');
  if (audit.discoveryCount !== 3) errors.push('three-discoveries-required');
  for (const station of audit.stations) {
    if (!station.maintainedSurface) errors.push(`dead-station-surface:${station.id}:${station.surface}`);
    if (!station.npcId || !station.npcRole) errors.push(`station-npc-role-missing:${station.id}`);
    if (station.interactionParts.length !== 3 || station.interactionParts.some((part) => !part.present)) errors.push(`station-interaction-coverage:${station.id}`);
    for (const part of station.interactionParts) {
      if (!part.label || !part.purpose || !part.accessibilityLabel || !part.truthBoundary) errors.push(`station-copy-or-a11y:${part.id}`);
      if (!part.maintainedSurface) errors.push(`dead-interaction-surface:${part.id}:${part.surface}`);
    }
  }
  for (const discovery of audit.discoveries) {
    if (!discovery.present || !discovery.actionLabel || !discovery.truthBoundary) errors.push(`discovery-dead:${discovery.id}`);
    if (discovery.automaticNavigation || !discovery.explicitUserActionRequired) errors.push(`discovery-auto-action:${discovery.id}`);
  }
  for (const object of audit.supportObjects) {
    if (!object.declaredInteractive && !object.declaredUnavailable) errors.push(`support-object-unclassified:${object.id}`);
    if (!object.label || !object.purpose || !object.accessibilityLabel || !object.truthBoundary) errors.push(`support-object-copy-or-a11y:${object.id}`);
  }
  if (!audit.nexus.privacyProjected || audit.nexus.rawConversationTextRead || audit.nexus.rawProjectContentRead || audit.nexus.startsAiWork || audit.nexus.startsVoiceCapture || audit.nexus.autoNavigation || audit.nexus.autoApproval || audit.nexus.ownsRenderLoop) errors.push('nexus-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), audit });
}

export function getEonCityC08CommandHubTruth() {
  const result = validateEonCityC08CommandHubConvergence();
  return freeze({
    schema: EON_CITY_C08_COMMAND_HUB_SCHEMA,
    sourceValid: result.ok,
    stationCount: result.audit.stationCount,
    discoveryCount: result.audit.discoveryCount,
    everyStationMaintained: result.audit.stations.every((entry) => entry.maintainedSurface),
    everyObjectClassified: result.audit.supportObjects.every((entry) => entry.declaredInteractive || entry.declaredUnavailable),
    nexusPrivacyProjected: result.audit.nexus.privacyProjected,
    deadLabelsOrRoutes: result.errors.filter((entry) => /dead|copy|a11y|surface/.test(entry)).length,
    browserEvidenceRequired: true,
    privateContentStored: false
  });
}

export default freeze({ buildEonCityC08CommandHubAudit, validateEonCityC08CommandHubConvergence, getEonCityC08CommandHubTruth });
