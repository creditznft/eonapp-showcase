import {
  EON_CITY_W731_STATIONS,
  EON_CITY_W737_DISCOVERIES,
  getEonCityW731Station,
  getEonCityW737Discovery
} from '../w731/eon-city-w731-command-hub-contract.js';

const freeze = (value) => Object.freeze(value);
const VALID_OBJECT_TYPES = freeze(['station', 'terminal', 'npc', 'nexus', 'wall', 'prop', 'transit', 'portal', 'discovery', 'support']);
const VALID_ACTIONS = freeze(['open', 'inspect', 'focus', 'explain', 'unavailable']);
const VALID_QUALITY = freeze(['all', 'balanced', 'cinematic']);

export const EON_CITY_W748_INTERACTION_SCHEMA = 'eon.city.interaction-registry.w748.v1';
export const EON_CITY_W748_INTERACTION_BINDINGS = freeze({
  keyboard: freeze(['KeyE', 'Enter']),
  inspectKeyboard: freeze(['KeyI']),
  touch: freeze(['tap-primary', 'tap-inspect']),
  gamepad: freeze(['ButtonA', 'ButtonX'])
});

function point(value = {}) {
  return freeze({ x: Number(value.x || 0), y: Number(value.y || 0), z: Number(value.z || 0) });
}

function action(kind, label, surface = '', extra = {}) {
  return freeze({
    kind: VALID_ACTIONS.includes(kind) ? kind : 'inspect',
    label: String(label || (kind === 'open' ? 'Open' : 'Inspect')).slice(0, 80),
    surface: String(surface || '').slice(0, 64),
    explicitUserActionRequired: true,
    automaticNavigation: false,
    automaticExecution: false,
    ...extra
  });
}

function record(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const qualityModes = Array.isArray(source.qualityModes) && source.qualityModes.length
    ? source.qualityModes.filter((mode) => VALID_QUALITY.includes(mode))
    : VALID_QUALITY;
  return freeze({
    schema: EON_CITY_W748_INTERACTION_SCHEMA,
    id: String(source.id || '').trim().slice(0, 120),
    objectType: VALID_OBJECT_TYPES.includes(source.objectType) ? source.objectType : 'prop',
    role: String(source.role || 'city-object').slice(0, 80),
    label: String(source.label || source.id || 'City object').slice(0, 120),
    oneLinePurpose: String(source.oneLinePurpose || source.inspectText || 'Inspect this City object.').slice(0, 240),
    inspectText: String(source.inspectText || source.oneLinePurpose || 'No additional detail is available.').slice(0, 640),
    interactionRadius: Math.max(0.8, Math.min(12, Number(source.interactionRadius || 3.8))),
    focusPriority: Math.max(1, Math.min(100, Number(source.focusPriority || 50))),
    meshRoot: String(source.meshRoot || '').slice(0, 160),
    meshMetadata: freeze({ ...(source.meshMetadata || {}) }),
    stationId: String(source.stationId || '').slice(0, 80),
    discoveryId: String(source.discoveryId || '').slice(0, 80),
    missionId: String(source.missionId || '').slice(0, 80),
    progressionId: String(source.progressionId || '').slice(0, 80),
    position: point(source.position),
    primaryAction: source.primaryAction || action('inspect', 'Inspect'),
    secondaryAction: source.secondaryAction || action('explain', 'Ask EONBOT'),
    bindings: freeze({ ...EON_CITY_W748_INTERACTION_BINDINGS, ...(source.bindings || {}) }),
    accessibilityLabel: String(source.accessibilityLabel || `${source.primaryAction?.label || 'Inspect'} ${source.label || source.id || 'City object'}`).slice(0, 180),
    truthBoundary: String(source.truthBoundary || 'This interaction does not perform hidden work or navigation.').slice(0, 420),
    qualityModes: freeze([...new Set(qualityModes)]),
    unavailableReason: String(source.unavailableReason || '').slice(0, 240),
    visible: source.visible !== false,
    suggestive: source.suggestive !== false
  });
}

function stationRecords(station) {
  const common = {
    stationId: station.id,
    role: `${station.kind}-station`,
    label: station.label,
    oneLinePurpose: station.description,
    inspectText: `${station.description} ${station.npc.name} is the authored guide for this station. Work opens through the maintained EONAPP surface and never runs automatically.`,
    interactionRadius: station.activationRadius,
    focusPriority: Math.max(1, Number(station.priority || 10)),
    position: station.position,
    truthBoundary: 'Opening this station only presents the maintained native adapter. It does not read private work, call a provider, start checkout or navigate without explicit user action.'
  };
  const structure = record({
    ...common,
    id: `station:${station.id}`,
    objectType: station.id === 'eonbot-nexus' ? 'nexus' : 'station',
    meshRoot: `w744-station-${station.id}`,
    meshMetadata: { stationId: station.id, interactionPart: 'structure' },
    primaryAction: action('open', station.npc.action || `Open ${station.shortLabel}`, station.surface, { presentationMode: 'dock' }),
    secondaryAction: action('inspect', 'Inspect station')
  });
  const terminal = record({
    ...common,
    id: `terminal:${station.id}`,
    objectType: 'terminal',
    role: `${station.kind}-terminal`,
    label: `${station.label} terminal`,
    inspectText: `This terminal opens ${station.label} through the same maintained adapter used elsewhere in EONAPP. No City-only duplicate editor exists.`,
    interactionRadius: Math.min(station.activationRadius, 3.4),
    focusPriority: Math.max(1, Number(station.priority || 10) - 0.25),
    meshRoot: `w744-terminal-anchor-${station.id}`,
    meshMetadata: { stationId: station.id, interactionPart: 'terminal' },
    primaryAction: action('open', `Use ${station.shortLabel} terminal`, station.surface, { presentationMode: 'dock' }),
    secondaryAction: action('inspect', 'Inspect terminal')
  });
  const npc = record({
    ...common,
    id: `npc:${station.id}`,
    objectType: 'npc',
    role: station.npc.role,
    label: station.npc.name,
    oneLinePurpose: station.npc.greeting,
    inspectText: `${station.npc.name} is an authored City guide for ${station.label}. The character does not represent a hidden autonomous worker or fake online person.`,
    interactionRadius: Math.min(station.activationRadius, 3.6),
    focusPriority: Math.max(1, Number(station.priority || 10) - 0.5),
    meshRoot: `w744-npc-anchor-${station.id}`,
    meshMetadata: { stationId: station.id, interactionPart: 'npc' },
    primaryAction: action('open', station.npc.action || `Talk to ${station.npc.name}`, station.surface, { presentationMode: 'dock' }),
    secondaryAction: action('explain', `About ${station.npc.name}`),
    truthBoundary: 'The NPC is a local authored interface character. It does not claim independent agency, employment, online presence or background execution.'
  });
  return freeze([structure, terminal, npc]);
}

const SUPPORT_OBJECTS = freeze([
  record({
    id: 'support:eonbot-dock', objectType: 'support', role: 'eonbot-dock', label: 'EONBOT Dock',
    oneLinePurpose: 'The companion returns here when the Nexus is calm or focused on work.',
    inspectText: 'This is EONBOT’s visual docking point. Docking is presentation only and does not start an agent or provider request.',
    interactionRadius: 3.2, focusPriority: 12, meshRoot: 'w744-environment-anchor-eonbot-dock',
    primaryAction: action('focus', 'Focus EONBOT Dock'), secondaryAction: action('explain', 'Ask EONBOT about this'),
    truthBoundary: 'Visual companion state only; no autonomous work is implied.'
  }),
  record({
    id: 'support:command-chair', objectType: 'prop', role: 'command-seat', label: 'Creator Command Seat',
    oneLinePurpose: 'A secondary operations seat for focusing the Command Centre.',
    inspectText: 'The seat belongs to the Operations crescent and no longer competes with the central Nexus. Sitting or focusing it never executes work automatically.',
    interactionRadius: 3.3, focusPriority: 22, meshRoot: 'w744-environment-anchor-command-seat',
    primaryAction: action('focus', 'Focus command seat'), secondaryAction: action('inspect', 'Inspect seat')
  }),
  record({
    id: 'support:command-table', objectType: 'prop', role: 'command-table', label: 'Operations Command Table',
    oneLinePurpose: 'A shared review surface for Command Centre state.',
    inspectText: 'This table is a spatial review anchor. Detailed work opens in City Dock through maintained adapters.',
    interactionRadius: 4, focusPriority: 18, meshRoot: 'w744-master-command-table',
    primaryAction: action('open', 'Open Command Status', 'command-status', { presentationMode: 'dock', stationId: 'command-console' }),
    secondaryAction: action('inspect', 'Inspect table')
  }),
  record({
    id: 'support:atlas-hologram', objectType: 'prop', role: 'district-hologram', label: 'District Hologram Navigator',
    oneLinePurpose: 'Focus a productive station without changing routes.',
    inspectText: 'This hologram is a bounded City wayfinder. It cannot open retired Expanse or Realm runtimes.',
    interactionRadius: 3.4, focusPriority: 16, meshRoot: 'w744-environment-anchor-district-hologram',
    primaryAction: action('open', 'Open Project Atlas', 'projects', { presentationMode: 'dock', stationId: 'project-atlas' }),
    secondaryAction: action('inspect', 'Inspect navigator')
  }),
  record({
    id: 'support:capture-pad', objectType: 'prop', role: 'capture-pad', label: 'Creator Capture Pad',
    oneLinePurpose: 'Begin a reviewed local City recording flow.',
    inspectText: 'Creator Capture records locally after permission. Nothing uploads or posts automatically.',
    interactionRadius: 3.6, focusPriority: 14, meshRoot: 'w744-share-capture-pad', stationId: 'share-capture',
    primaryAction: action('open', 'Open Creator Capture', 'creator-capture', { presentationMode: 'dock' }),
    secondaryAction: action('inspect', 'Review capture privacy'),
    truthBoundary: 'Camera, microphone and screen permissions remain optional and explicit. No automatic upload or public post.'
  }),
  record({
    id: 'support:transit-platform', objectType: 'transit', role: 'transit-platform', label: 'Transit Platform',
    oneLinePurpose: 'Review the bounded City capsule journey.',
    inspectText: 'Transit stays inside the certified Command Core. Boarding and skipping remain explicit choices.',
    interactionRadius: 4.2, focusPriority: 26, meshRoot: 'w737-discovery-transit-overlook', discoveryId: 'transit-overlook',
    primaryAction: action('inspect', 'Inspect Transit'), secondaryAction: action('explain', 'Ask EONBOT about Transit')
  }),
  record({
    id: 'support:transit-capsule', objectType: 'transit', role: 'transit-vehicle', label: 'EON Transit Capsule',
    oneLinePurpose: 'A single bounded moving vehicle for optional City travel.',
    inspectText: 'The capsule is active through the W754 travel authority. Review a destination, then explicitly choose Board or Skip; opening or inspecting it never starts travel.',
    interactionRadius: 4.4, focusPriority: 28, meshRoot: 'w744-transit-capsule-anchor',
    primaryAction: action('inspect', 'Review Board / Skip Transit'), secondaryAction: action('explain', 'Ask EONBOT about Transit'),
    truthBoundary: 'One local capsule only. Review and confirmation are separate; no route, work, provider or private-data action starts automatically.'
  }),
  record({
    id: 'support:maintenance-worker', objectType: 'npc', role: 'maintenance-worker', label: 'X1 Maintenance Worker',
    oneLinePurpose: 'Inspect local City readiness and bounded maintenance behavior.',
    inspectText: 'X1 performs authored local movement only. It never implies that a hidden repair task or cloud worker is running.',
    interactionRadius: 3.6, focusPriority: 32, meshRoot: 'w744-maintenance-worker-anchor', discoveryId: 'maintenance-relay',
    primaryAction: action('inspect', 'Inspect maintenance relay'), secondaryAction: action('explain', 'Ask EONBOT about X1'),
    truthBoundary: 'Authored ambient movement only; no fake background job or agent state.'
  }),
  record({
    id: 'support:vault-reveal-pedestal', objectType: 'prop', role: 'vault-reveal-pedestal', label: 'Vault Reveal Pedestal',
    oneLinePurpose: 'Preview deterministic cosmetic reveal progress.',
    inspectText: 'Vault Reveals are deterministic cosmetic unlocks backed by progression receipts. No loot box or paid randomness is used.',
    interactionRadius: 3.5, focusPriority: 30, meshRoot: 'w748-vault-reveal-pedestal',
    primaryAction: action('unavailable', 'Vault Reveals arrive in W752'), secondaryAction: action('inspect', 'Inspect reveal rules'),
    unavailableReason: 'The progression bridge is intentionally not active until W752.'
  }),
]);

const DEFAULT_RECORDS = freeze([
  ...EON_CITY_W731_STATIONS.flatMap((station) => stationRecords(station)),
  ...EON_CITY_W737_DISCOVERIES.map((discovery, index) => record({
    id: `discovery:${discovery.id}`,
    objectType: discovery.id.includes('gateway') || discovery.id.includes('expanse') ? 'portal' : 'discovery',
    role: discovery.kind || 'discovery',
    label: discovery.label,
    oneLinePurpose: discovery.npc.greeting,
    inspectText: `${discovery.npc.greeting} This discovery responds without automatically opening a route or awarding progression.`,
    interactionRadius: discovery.activationRadius,
    focusPriority: 45 + index,
    meshRoot: `w737-discovery-${discovery.id}`,
    meshMetadata: { discoveryId: discovery.id, interactionPart: 'structure' },
    discoveryId: discovery.id,
    position: discovery.position,
    primaryAction: discovery.id === 'expanse-gate'
      ? action('inspect', 'Review Expanse entry')
      : discovery.id === 'maintenance-relay'
        ? action('inspect', 'Open City Readiness')
        : action('inspect', discovery.npc.action || 'Inspect'),
    secondaryAction: action('explain', 'Ask EONBOT about this'),
    truthBoundary: discovery.id === 'expanse-gate'
      ? 'Review, Enter Expanse and Cancel are separate explicit actions. Entry reuses the canonical Engine, Scene and render loop.'
      : discovery.id === 'maintenance-relay'
        ? 'This surface reports measured local readiness only. It never invents repair work, progress or success.'
        : 'Discovery and explanation only. No automatic route change, task execution, reward or hidden state mutation.'
  })),
  ...SUPPORT_OBJECTS
]);

export const EON_CITY_W748_DEFAULT_INTERACTIONS = DEFAULT_RECORDS;

export function normalizeEonCityW748Interaction(input = {}) {
  return record(input);
}

export function getEonCityW748DefaultInteraction(id = '') {
  const key = String(id || '');
  return DEFAULT_RECORDS.find((entry) => entry.id === key) || null;
}

export function getEonCityW748StationInteraction(stationId = '', part = 'structure') {
  const normalizedPart = part === 'npc' ? 'npc' : part === 'terminal' ? 'terminal' : 'station';
  return getEonCityW748DefaultInteraction(`${normalizedPart}:${String(stationId || '')}`);
}

export function createEonCityW748InteractionRegistry({ entries = DEFAULT_RECORDS } = {}) {
  const map = new Map();
  let revision = 0;
  const register = (input) => {
    const value = normalizeEonCityW748Interaction(input);
    if (!value.id) return freeze({ ok: false, reason: 'interaction-id-required' });
    map.set(value.id, value);
    revision += 1;
    return freeze({ ok: true, value, revision });
  };
  for (const value of entries) register(value);

  const unregister = (id = '') => {
    const removed = map.delete(String(id || ''));
    if (removed) revision += 1;
    return removed;
  };

  const list = ({ qualityMode = 'balanced', visibleOnly = true } = {}) => freeze([...map.values()].filter((entry) => {
    if (visibleOnly && !entry.visible) return false;
    return entry.qualityModes.includes('all') || entry.qualityModes.includes(qualityMode);
  }));

  const select = ({ playerPosition = {}, gazeId = '', pointerId = '', qualityMode = 'balanced', maxCandidates = 8 } = {}) => {
    const player = point(playerPosition);
    const gaze = String(gazeId || '');
    const pointer = String(pointerId || '');
    const candidates = list({ qualityMode }).map((entry) => {
      const hasPosition = Number.isFinite(entry.position.x) && Number.isFinite(entry.position.z) && (entry.position.x !== 0 || entry.position.z !== 0 || entry.stationId === 'eonbot-nexus');
      const distance = hasPosition ? Math.hypot(player.x - entry.position.x, player.z - entry.position.z) : Number.POSITIVE_INFINITY;
      const pointed = pointer === entry.id;
      const gazed = gaze === entry.id;
      const discovered = pointed || gazed || distance <= entry.interactionRadius;
      const score = (pointed ? -1000 : gazed ? -700 : 0) + entry.focusPriority + Math.min(200, distance * 4);
      return freeze({ entry, distance, pointed, gazed, discovered, score });
    }).filter((candidate) => candidate.discovered)
      .sort((a, b) => a.score - b.score || a.distance - b.distance)
      .slice(0, Math.max(1, Math.min(24, Number(maxCandidates || 8))));
    return freeze({
      schema: EON_CITY_W748_INTERACTION_SCHEMA,
      selected: candidates[0] || null,
      candidates: freeze(candidates),
      revision
    });
  };

  return freeze({
    schema: EON_CITY_W748_INTERACTION_SCHEMA,
    register,
    unregister,
    get: (id = '') => map.get(String(id || '')) || null,
    getStation: (stationId = '', part = 'structure') => map.get(`${part === 'npc' ? 'npc' : part === 'terminal' ? 'terminal' : 'station'}:${String(stationId || '')}`) || null,
    list,
    select,
    getRevision: () => revision,
    getSummary: () => freeze({ total: map.size, revision, stationCoverage: EON_CITY_W731_STATIONS.filter((station) => map.has(`station:${station.id}`) && map.has(`terminal:${station.id}`) && map.has(`npc:${station.id}`)).length })
  });
}

export function validateEonCityW748InteractionRegistry(entries = DEFAULT_RECORDS) {
  const errors = [];
  const ids = new Set();
  const values = Array.isArray(entries) ? entries : [];
  for (const value of values) {
    if (!value?.id || ids.has(value.id)) errors.push(`interaction-id:${value?.id || 'missing'}`);
    ids.add(value?.id);
    if (!VALID_OBJECT_TYPES.includes(value?.objectType)) errors.push(`object-type:${value?.id || 'missing'}`);
    if (!value?.label || !value?.oneLinePurpose || !value?.inspectText) errors.push(`copy:${value?.id || 'missing'}`);
    if (!VALID_ACTIONS.includes(value?.primaryAction?.kind) || !VALID_ACTIONS.includes(value?.secondaryAction?.kind)) errors.push(`action:${value?.id || 'missing'}`);
    if (!value?.accessibilityLabel || !value?.truthBoundary) errors.push(`accessibility-truth:${value?.id || 'missing'}`);
    if (value?.primaryAction?.kind === 'open' && !value?.primaryAction?.surface) errors.push(`surface:${value?.id || 'missing'}`);
  }
  for (const station of EON_CITY_W731_STATIONS) {
    for (const prefix of ['station', 'terminal', 'npc']) if (!ids.has(`${prefix}:${station.id}`)) errors.push(`station-coverage:${prefix}:${station.id}`);
    if (!getEonCityW731Station(station.id)) errors.push(`station-authority:${station.id}`);
  }
  for (const discovery of EON_CITY_W737_DISCOVERIES) {
    if (!ids.has(`discovery:${discovery.id}`)) errors.push(`discovery-coverage:${discovery.id}`);
    if (!getEonCityW737Discovery(discovery.id)) errors.push(`discovery-authority:${discovery.id}`);
  }
  for (const required of ['support:eonbot-dock', 'support:command-chair', 'support:command-table', 'support:atlas-hologram', 'support:capture-pad', 'support:transit-platform', 'support:transit-capsule', 'support:maintenance-worker', 'support:vault-reveal-pedestal']) {
    if (!ids.has(required)) errors.push(`support-coverage:${required}`);
  }
  return freeze({
    ok: errors.length === 0,
    errors: freeze(errors),
    interactionCount: values.length,
    stationCount: EON_CITY_W731_STATIONS.length,
    stationPartCount: EON_CITY_W731_STATIONS.length * 3,
    discoveryCount: EON_CITY_W737_DISCOVERIES.length,
    supportCount: SUPPORT_OBJECTS.length
  });
}
