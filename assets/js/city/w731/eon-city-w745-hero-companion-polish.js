/**
 * W745 — final hero and companion presentation director.
 *
 * This controller is deliberately local and visual. It may choose a public
 * Command Centre structure or terminal as a short-lived presentation target,
 * but it cannot activate a station, navigate Pathfinder, open a route, read
 * private data, start AI work, capture media or create a network request.
 */
import { EON_CITY_W731_EONBOT_DOCK, EON_CITY_W731_STATIONS } from './eon-city-w731-command-hub-contract.js';
import { getEonCityW744StationBlueprint } from './eon-city-w744-station-completion-contract.js';

export const EON_CITY_W745_HERO_PRESENTATION_SCHEMA = 'eon.city.hero-companion-polish.w745.v1';
export const EON_CITY_W745_COMPANION_STATES = Object.freeze([
  'formation-follow',
  'curious-hover',
  'scout-structure',
  'inspect-terminal',
  'greet-host',
  'nexus-spiral',
  'circuit-scan',
  'playful-loop',
  'dock-check',
  'return-formation',
  'reduced-hover'
]);
export const EON_CITY_W745_PLAYER_IDLE_STATES = Object.freeze([
  'idle', 'idle-alt', 'inspect', 'pose', 'wave'
]);

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const distance2d = (a = {}, b = {}) => Math.hypot(finite(a.x) - finite(b.x), finite(a.z) - finite(b.z));
const point = (source = {}) => freeze({ x: finite(source.x), y: finite(source.y), z: finite(source.z) });

function buildPublicTargets() {
  const targets = [];
  for (const station of EON_CITY_W731_STATIONS) {
    const blueprint = getEonCityW744StationBlueprint(station.id);
    if (!blueprint) continue;
    const terminalLength = Math.max(0.001, Math.hypot(blueprint.terminalOffset.x, blueprint.terminalOffset.z));
    const terminalApproach = {
      x: blueprint.terminalOffset.x / terminalLength,
      z: blueprint.terminalOffset.z / terminalLength
    };
    const npcHome = {
      x: station.ring === 'inner' ? 1.75 : 1.55,
      z: station.ring === 'inner' ? 0.42 : 0.25
    };
    // EONBOT observes authored structures from the same collision-safe focus
    // side used by Pathfinder instead of flying through the structure origin.
    targets.push(freeze({
      id: `${station.id}:structure`, stationId: station.id, kind: 'structure', label: station.label,
      safeApproach: true,
      position: point({ x: station.focus.x, y: station.id === 'eonbot-nexus' ? 2.05 : 1.85, z: station.focus.z })
    }));
    targets.push(freeze({
      id: `${station.id}:terminal`, stationId: station.id, kind: 'terminal', label: `${station.label} terminal`,
      safeApproach: true,
      position: point({
        x: station.position.x + blueprint.terminalOffset.x + terminalApproach.x * 0.72,
        y: 1.48 + blueprint.terminalOffset.y,
        z: station.position.z + blueprint.terminalOffset.z + terminalApproach.z * 0.72
      })
    }));
    if (station.id !== 'eonbot-nexus') {
      targets.push(freeze({
        id: `${station.id}:npc`, stationId: station.id, kind: 'npc', label: station.npc.name,
        safeApproach: true,
        position: point({
          x: station.position.x + npcHome.x,
          y: 1.52,
          z: station.position.z + npcHome.z
        })
      }));
    }
  }
  targets.push(
    freeze({ id: 'command-table', stationId: 'eonbot-nexus', kind: 'nexus', label: 'Master command table', position: point({ x: 0, y: 1.35, z: 1.2 }) }),
    freeze({ id: 'eonbot-dock', stationId: 'eonbot-nexus', kind: 'dock', label: 'EONBOT companion dock', position: point({ x: EON_CITY_W731_EONBOT_DOCK.x, y: 0.92, z: EON_CITY_W731_EONBOT_DOCK.z }) }),
    freeze({ id: 'circuit-north', stationId: 'eonbot-nexus', kind: 'circuit', label: 'Nexus circuit bus', position: point({ x: 0, y: 0.55, z: -5.4 }) }),
    freeze({ id: 'circuit-east', stationId: 'share-capture', kind: 'circuit', label: 'Signal circuit bus', position: point({ x: 5.8, y: 0.55, z: 2.8 }) }),
    freeze({ id: 'circuit-west', stationId: 'library-vault', kind: 'circuit', label: 'Archive circuit bus', position: point({ x: -5.8, y: 0.55, z: 2.8 }) })
  );
  return freeze(targets);
}

export const EON_CITY_W745_PUBLIC_COMPANION_TARGETS = buildPublicTargets();

function nearestEligibleTargets(playerPosition = {}, nearestStationId = '') {
  const ranked = EON_CITY_W745_PUBLIC_COMPANION_TARGETS
    .filter((entry) => distance2d(playerPosition, entry.position) <= 9.5)
    .map((entry) => freeze({ entry, distance: distance2d(playerPosition, entry.position) }))
    .sort((a, b) => {
      const aPriority = a.entry.stationId === nearestStationId ? -2 : 0;
      const bPriority = b.entry.stationId === nearestStationId ? -2 : 0;
      return (a.distance + aPriority) - (b.distance + bPriority);
    });
  return ranked.length ? ranked : EON_CITY_W745_PUBLIC_COMPANION_TARGETS
    .map((entry) => freeze({ entry, distance: distance2d(playerPosition, entry.position) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);
}

function selectTarget({ playerPosition = {}, nearestStationId = '', cycle = 0, kind = '' } = {}) {
  const ranked = nearestEligibleTargets(playerPosition, nearestStationId);
  let pool = ranked.filter(({ entry }) => !kind || entry.kind === kind);
  if (!pool.length && kind) {
    pool = EON_CITY_W745_PUBLIC_COMPANION_TARGETS
      .filter((entry) => entry.kind === kind)
      .map((entry) => freeze({ entry, distance: distance2d(playerPosition, entry.position) }))
      .sort((a, b) => a.distance - b.distance);
  }
  if (!pool.length) pool = ranked;
  if (!pool.length) return null;
  return pool[Math.abs(cycle) % pool.length].entry;
}

function playerIdleState(idleMs = 0, reducedMotion = false) {
  if (reducedMotion || idleMs < 2_600) return 'idle';
  const phase = (idleMs - 2_600) % 24_000;
  if (phase < 4_200) return 'idle-alt';
  if (phase < 6_500) return 'inspect';
  if (phase < 10_800) return 'idle';
  if (phase < 12_800) return 'pose';
  if (phase < 17_400) return 'idle-alt';
  if (phase < 19_200) return 'wave';
  return 'idle';
}

export function createEonCityW745HeroPresentationDirector({ now = () => Date.now() } = {}) {
  let lastMovingAt = finite(now());
  let lastTimestamp = lastMovingAt;
  let revision = 0;
  let previousState = 'formation-follow';
  let previousPlayerState = 'idle';
  let snapshot = freeze({
    schema: EON_CITY_W745_HERO_PRESENTATION_SCHEMA,
    companionState: 'formation-follow',
    playerIdleState: 'idle',
    target: null,
    localVisualOnly: true,
    revision: 0
  });

  const update = ({
    deltaMs = 16,
    moving = false,
    playerPosition = {},
    companionPosition = {},
    nearestStationId = '',
    reducedMotion = false
  } = {}) => {
    const timestamp = finite(now(), lastTimestamp + finite(deltaMs, 16));
    const safeDelta = clamp(finite(deltaMs, 16), 1, 100);
    lastTimestamp = Math.max(timestamp, lastTimestamp + safeDelta);
    if (moving) lastMovingAt = lastTimestamp;
    const idleMs = moving ? 0 : Math.max(0, lastTimestamp - lastMovingAt);
    const cycleMs = 24_000;
    const cycle = Math.floor(idleMs / cycleMs);
    const phase = idleMs % cycleMs;

    let companionState = moving ? 'formation-follow' : 'curious-hover';
    let target = null;
    let caption = moving ? 'Keeping a camera-safe side formation with Pathfinder.' : 'Watching the nearby Command Centre.';

    if (reducedMotion) {
      companionState = 'reduced-hover';
      caption = 'Reduced-motion companion hover remains visibly alive.';
    } else if (!moving && phase >= 2_600 && phase < 5_400) {
      companionState = 'scout-structure';
      target = selectTarget({ playerPosition, nearestStationId, cycle, kind: 'structure' });
      caption = target ? `Scouting ${target.label} as a public visual cue.` : 'Scouting the nearby Command Centre.';
    } else if (!moving && phase >= 5_400 && phase < 8_200) {
      companionState = 'inspect-terminal';
      target = selectTarget({ playerPosition, nearestStationId, cycle: cycle + 1, kind: 'terminal' });
      caption = target ? `Inspecting ${target.label} without activating it.` : 'Inspecting a nearby terminal without activating it.';
    } else if (!moving && phase >= 8_200 && phase < 10_400) {
      companionState = 'greet-host';
      target = selectTarget({ playerPosition, nearestStationId, cycle: cycle + 2, kind: 'npc' });
      caption = target ? `Greeting ${target.label} without interrupting their station routine.` : 'Greeting a nearby station host.';
    } else if (!moving && phase >= 10_400 && phase < 13_000) {
      companionState = 'nexus-spiral';
      target = EON_CITY_W745_PUBLIC_COMPANION_TARGETS.find((entry) => entry.id === 'command-table') || null;
      caption = 'Tracing a short spiral around the physical Nexus.';
    } else if (!moving && phase >= 13_000 && phase < 15_800) {
      companionState = 'circuit-scan';
      target = selectTarget({ playerPosition, nearestStationId, cycle: cycle + 3, kind: 'circuit' });
      caption = 'Following the illuminated Command Centre circuit language.';
    } else if (!moving && phase >= 15_800 && phase < 18_000) {
      companionState = 'playful-loop';
      caption = 'Performing a short playful loop without blocking the camera.';
    } else if (!moving && phase >= 18_000 && phase < 20_400) {
      companionState = 'dock-check';
      target = selectTarget({ playerPosition, nearestStationId, cycle, kind: 'dock' });
      caption = 'Checking the companion dock without claiming a charge or system action.';
    } else if (!moving && phase >= 20_400) {
      companionState = 'return-formation';
      caption = 'Returning to Pathfinder formation.';
    }

    const nextPlayerIdleState = moving ? 'idle' : playerIdleState(idleMs, reducedMotion);
    if (companionState !== previousState || nextPlayerIdleState !== previousPlayerState) revision += 1;
    previousState = companionState;
    previousPlayerState = nextPlayerIdleState;
    snapshot = freeze({
      schema: EON_CITY_W745_HERO_PRESENTATION_SCHEMA,
      companionState,
      playerIdleState: nextPlayerIdleState,
      target,
      caption,
      idleMs: Math.round(idleMs),
      targetDistanceFromPlayer: target ? Number(distance2d(playerPosition, target.position).toFixed(3)) : null,
      companionDistanceFromPlayer: Number(distance2d(playerPosition, companionPosition).toFixed(3)),
      maxScoutDistanceFromPlayer: 8.4,
      scanEffect: ['inspect-terminal', 'circuit-scan', 'dock-check'].includes(companionState),
      greetingEffect: companionState === 'greet-host',
      playfulLoop: companionState === 'playful-loop',
      visualDockVisit: companionState === 'dock-check',
      playfulTilt: !reducedMotion && companionState !== 'formation-follow',
      nonStaticPlayerIdle: true,
      nonStaticCompanionIdle: true,
      publicSceneTargetsOnly: true,
      localVisualOnly: true,
      autonomousAgent: false,
      automaticStationActivation: false,
      automaticNavigation: false,
      visualDockVisitOnly: true,
      automaticDocking: false,
      startsAiWork: false,
      startsVoiceCapture: false,
      startsCreatorCapture: false,
      privateDataRead: false,
      networkRequestCreated: false,
      reducedMotion: Boolean(reducedMotion),
      revision
    });
    return snapshot;
  };

  return freeze({ update, getSnapshot: () => snapshot });
}

export function getEonCityW745HeroPresentationTruth() {
  return freeze({
    schema: EON_CITY_W745_HERO_PRESENTATION_SCHEMA,
    companionModes: EON_CITY_W745_COMPANION_STATES,
    playerIdleModes: EON_CITY_W745_PLAYER_IDLE_STATES,
    publicTargetCount: EON_CITY_W745_PUBLIC_COMPANION_TARGETS.length,
    nonStaticPlayerIdle: true,
    nonStaticCompanionIdle: true,
    cameraSafeFollowFormation: true,
    boundedPublicScouting: true,
    automaticStationActivation: false,
    automaticNavigation: false,
    visualDockVisitOnly: true,
    automaticDocking: false,
    autonomousAgent: false,
    startsAiWork: false,
    startsVoiceCapture: false,
    startsCreatorCapture: false,
    privateDataRead: false,
    networkRequestCreated: false,
    ownsRenderLoop: false
  });
}

export default freeze({
  EON_CITY_W745_HERO_PRESENTATION_SCHEMA,
  EON_CITY_W745_COMPANION_STATES,
  EON_CITY_W745_PLAYER_IDLE_STATES,
  EON_CITY_W745_PUBLIC_COMPANION_TARGETS,
  createEonCityW745HeroPresentationDirector,
  getEonCityW745HeroPresentationTruth
});
