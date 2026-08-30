/**
 * W367 — safe projection for the optional Three.js Spatial Command Space.
 *
 * This module turns only public, local City references into a bounded command
 * board. It is deliberately not a project database, chat mirror, provider
 * inspector, agent executor or automation runner. The renderer may receive
 * mission stage, landmark IDs, finite City mode IDs and sanitized local signal
 * counts — never prompts, AI output, keys, private files, account records,
 * purchase data or provider endpoints.
 */
import { getCommandDistrictMissionCard, readCommandDistrictState } from './eon-city-command-district.js';

export const SPATIAL_COMMAND_SPACE_SCHEMA = 'eon.city.spatial-command.w367.v1';

const freeze = (value) => Object.freeze(value);
const SAFE_ID = /^[a-z0-9][a-z0-9:-]{0,63}$/i;
const SAFE_MODE_IDS = new Set(['portal', 'overview', 'command-space', 'immersive-work', 'chat', 'workspace', 'automations', 'apps', 'local-ai', 'realm-studio', 'projects', 'library']);
const SAFE_AGENT_STATUS = new Set(['ready', 'working', 'waiting', 'handoff', 'complete', 'blocked']);
const ROLE_LABELS = freeze({
  coordinator: 'Coordinator',
  researcher: 'Researcher',
  builder: 'Builder',
  reviewer: 'Reviewer',
  guide: 'Guide',
  'local-runner': 'Local Runner'
});

export const SPATIAL_COMMAND_CAMERA_PRESETS = freeze([
  freeze({ id: 'arrival', label: 'Arrival vista', detail: 'A calm wide view of the Neon Command District.' }),
  freeze({ id: 'command-centre', label: 'Command Centre', detail: 'A closer view of EONBOT and the Command Centre.' }),
  freeze({ id: 'skyline', label: 'City skyline', detail: 'A high overview of district routes and landmarks.' })
]);

const CAMERA_BY_ID = new Map(SPATIAL_COMMAND_CAMERA_PRESETS.map((entry) => [entry.id, entry]));
const CAMERA_POSES = freeze({
  arrival: freeze({ position: freeze([0, 18.5, 16.5]), target: freeze([0, 0.5, 0]) }),
  'command-centre': freeze({ position: freeze([-7.4, 8.8, 9.2]), target: freeze([-3.2, 1.1, -1.5]) }),
  skyline: freeze({ position: freeze([12.8, 19.5, 18.4]), target: freeze([0, 1.1, -1.4]) })
});

function plainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function safeText(value, fallback = '', max = 96) {
  const raw = [...String(value || '')].filter((character) => {
    const code = character.codePointAt(0) || 0;
    return code >= 32 && code !== 127;
  }).join('').trim();
  return raw ? raw.slice(0, max) : fallback;
}

function safeMode(value, fallback = 'command-space') {
  const mode = String(value || '').trim();
  return SAFE_MODE_IDS.has(mode) ? mode : fallback;
}

function safeAgentCue(entry = {}, index = 0) {
  const source = plainObject(entry);
  const role = String(source.role || '').trim().toLowerCase();
  const status = SAFE_AGENT_STATUS.has(String(source.status || '').trim().toLowerCase())
    ? String(source.status).trim().toLowerCase()
    : 'ready';
  return freeze({
    id: SAFE_ID.test(String(source.id || '')) ? String(source.id) : `city-crew-${index + 1}`,
    role: ROLE_LABELS[role] || 'City Guide',
    status,
    localOnly: true,
    detail: status === 'working'
      ? 'A local foreground status cue is available. Review in its native surface for any actual detail.'
      : status === 'blocked'
        ? 'A local status cue is waiting for a user decision in its native surface.'
        : 'No private task detail is shown inside Spatial Command Space.'
  });
}

export function normalizeSpatialCommandCameraPreset(value, fallback = 'arrival') {
  const id = String(value || '').trim();
  return CAMERA_BY_ID.has(id) ? id : (CAMERA_BY_ID.has(fallback) ? fallback : 'arrival');
}

export function getSpatialCommandCameraPose(value, fallback = 'arrival') {
  const id = normalizeSpatialCommandCameraPreset(value, fallback);
  const pose = CAMERA_POSES[id] || CAMERA_POSES.arrival;
  return freeze({
    id,
    position: [...pose.position],
    target: [...pose.target]
  });
}

/**
 * Builds a renderer-safe command board. Values are finite and local by design.
 */
export function buildSpatialCommandProjection(input = {}) {
  const source = plainObject(input);
  const city = plainObject(source.citySummary);
  const navigation = plainObject(city.navigation);
  const mission = getCommandDistrictMissionCard(source.commandDistrictState || readCommandDistrictState().state);
  const activeCues = Array.isArray(source.agentPresence)
    ? source.agentPresence.slice(0, 4).map((entry, index) => safeAgentCue(entry, index))
    : [];
  const currentMode = safeMode(navigation.currentMode, 'command-space');
  const returnMode = safeMode(navigation.lastTransition?.fromMode, 'portal');
  const objective = safeText(city.progress?.activeObjective, 'visit-command-centre', 63);
  const discovered = Array.isArray(city.unlockedDistricts)
    ? city.unlockedDistricts.filter((id) => SAFE_ID.test(String(id || ''))).slice(0, 12)
    : [];

  return freeze({
    schema: SPATIAL_COMMAND_SPACE_SCHEMA,
    localOnly: true,
    storesUserContent: false,
    execution: 'none',
    commandDistrict: freeze({
      title: 'Neon Command District',
      objective,
      mission: freeze({
        stageId: mission.stageId,
        progressLabel: mission.progressLabel,
        title: mission.title,
        detail: mission.detail,
        next: mission.next,
        lastLandmarkId: mission.lastLandmarkId
      }),
      discoveredDistrictCount: discovered.length,
      currentMode,
      returnMode
    }),
    crew: freeze({
      visibleCount: activeCues.length,
      maxVisible: 4,
      cues: freeze(activeCues),
      emptyCopy: 'No recorded work signal is active. The City does not invent busy AI characters.'
    }),
    workLanes: freeze([
      freeze({ id: 'start', label: 'Start a work route', detail: 'Choose a landmark, then review the native handoff yourself.', href: '/eoncity/play', destinationMode: 'immersive-work' }),
      freeze({ id: 'apps', label: 'Open App Deck', detail: 'Choose a Workroom, AI Crew role, Connection or Blueprint.', href: '/apps', destinationMode: 'apps' }),
      freeze({ id: 'chat', label: 'Ask EONBOT', detail: 'Open Chat for the full conversation and private work context.', href: '/chat?new=1', destinationMode: 'chat' })
    ]),
    cameraPresets: SPATIAL_COMMAND_CAMERA_PRESETS,
    truth: freeze({
      renders: freeze(['mission stage', 'safe landmark identifier', 'finite City mode', 'sanitized local cue count', 'camera preference']),
      neverRenders: freeze(['prompts', 'AI output', 'provider keys', 'provider endpoint', 'private files', 'Vault content', 'account data', 'payment data', 'background task details']),
      autoNavigation: false,
      autoExecution: false,
      remoteTelemetry: false
    })
  });
}

export function validateSpatialCommandProjection(projection = buildSpatialCommandProjection()) {
  const errors = [];
  const value = plainObject(projection);
  if (value.schema !== SPATIAL_COMMAND_SPACE_SCHEMA) errors.push('Unexpected Spatial Command Space schema.');
  if (value.localOnly !== true || value.storesUserContent !== false || value.execution !== 'none') errors.push('Spatial Command Space must remain local-only and non-executing.');
  if (!Array.isArray(value.cameraPresets) || value.cameraPresets.length < 3) errors.push('Spatial Command Space requires its bounded camera presets.');
  if (!Array.isArray(value.workLanes) || value.workLanes.length < 3) errors.push('Spatial Command Space requires bounded work lanes.');
  if (value.truth?.autoNavigation !== false || value.truth?.autoExecution !== false || value.truth?.remoteTelemetry !== false) errors.push('Spatial Command Space truth boundary is incomplete.');
  const serialized = JSON.stringify(value);
  if (/prompt|provider key|endpoint|vault content|payment data/i.test(JSON.stringify(value.truth?.renders || []))) errors.push('Forbidden private fields may not enter the render allowlist.');
  if (/https?:\/\//i.test(serialized)) errors.push('Spatial Command Space projection cannot include remote URLs.');
  return freeze({ schema: SPATIAL_COMMAND_SPACE_SCHEMA, ok: errors.length === 0, errors: freeze(errors), localOnly: true });
}

export function getSpatialCommandSpaceTruth() {
  return freeze({
    schema: SPATIAL_COMMAND_SPACE_SCHEMA,
    localOnly: true,
    execution: 'none',
    cameraPresets: SPATIAL_COMMAND_CAMERA_PRESETS.map((item) => item.id),
    neverStores: ['prompts', 'AI output', 'provider keys', 'private files', 'Vault content', 'account data', 'payment data', 'background task details']
  });
}
