/**
 * W624C — Productive Nocturne Command District vertical slice.
 *
 * This contract adds final-slice wayfinding and honest native-route boundaries
 * without rewriting the historic City landmark registry. All destinations are
 * internal, finite, review-first, and require a separate user confirmation.
 */
export const EON_CITY_COMMAND_DISTRICT_SLICE_SCHEMA = 'eon.city.command-district-vertical-slice.w624c.v1';
export const EON_CITY_COMMAND_DISTRICT_CACHE_VERSION = 'eon-city-w624c-command-district-1';

const freeze = (value) => Object.freeze(value);
const clone = (value) => JSON.parse(JSON.stringify(value));

export const EON_CITY_COMMAND_DISTRICT_SPAWN = freeze({
  id: 'arrival-plaza-spawn',
  label: 'Arrival Plaza',
  x: 0,
  y: 0,
  z: 9.35,
  heading: Math.PI,
  safeRadius: 1.35,
  camera: freeze({ alpha: -Math.PI / 4, beta: 1.03, radius: 15.2 }),
  heroView: 'Command Loom centred; Creator Atrium and Forge Basilica frame the middle distance.'
});

export const EON_CITY_COMMAND_DISTRICT_DESTINATIONS = freeze([
  freeze({
    id: 'agent-theatre', title: 'Agent Theatre', zone: 'Command Commons', style: 'amber',
    description: 'A receipt-backed review stage for dormant AI roles and automation proposals. No job is implied to be running.',
    inspect: 'The stage reads only bounded local status. Empty seats remain visibly dormant until a real, reviewable receipt exists.',
    focusLabel: 'Focus Agent Theatre', quickOpenLabel: 'Review Automations',
    action: freeze({ id: 'automation-review', destinationLabel: 'Automations', route: '/automations', purpose: 'Review a local automation proposal or receipt. No schedule, provider call, or external action starts from the City.' }),
    play: freeze({ x: 4.75, z: 1.8, radius: 3.05 }),
    boundary: 'proof-gated', operationalClaim: 'dormant-until-receipt'
  }),
  freeze({
    id: 'creator-portal', title: 'Creator Atrium', zone: 'Creator Court', style: 'violet',
    description: 'A warm authoring threshold for starting a real EONAPP creation.',
    inspect: 'The portal leads to the canonical Create surface only after a visible review and confirmation. It does not generate or publish anything by itself.',
    focusLabel: 'Focus Creator Atrium', quickOpenLabel: 'Review Create',
    action: freeze({ id: 'create', destinationLabel: 'Create', route: '/create', purpose: 'Open the canonical Create surface with no prompt, private work, or publishing action prefilled.' }),
    play: freeze({ x: -8.4, z: -4.1, radius: 3.35 }),
    boundary: 'native-route', operationalClaim: 'user-started-authoring'
  }),
  freeze({
    id: 'forge-basilica', title: 'Forge Basilica', zone: 'Forge Court', style: 'violet',
    description: 'The website and coding destination for deliberate build work.',
    inspect: 'The City exposes the canonical Forge route without reviving a duplicate top-level product or claiming that a build is already running.',
    focusLabel: 'Focus Forge Basilica', quickOpenLabel: 'Review EON Forge',
    action: freeze({ id: 'forge', destinationLabel: 'EON Forge', route: '/forge', purpose: 'Open EON Forge for user-directed coding or website work. No repository, deployment, or provider is selected automatically.' }),
    play: freeze({ x: 8.2, z: -3.2, radius: 3.45 }),
    boundary: 'native-route', operationalClaim: 'user-started-build'
  }),
  freeze({
    id: 'project-dock', title: 'Project Dock', zone: 'Project Walk', style: 'cyan',
    description: 'A compact return point for active projects and saved milestones.',
    inspect: 'Project names and files stay outside the public world. The landmark opens the canonical project list only after confirmation.',
    focusLabel: 'Focus Project Dock', quickOpenLabel: 'Review Projects',
    action: freeze({ id: 'projects', destinationLabel: 'Projects', route: '/projects', purpose: 'Open the project list. No project body, file, prompt, or private reference is transferred from City.' }),
    play: freeze({ x: -4.55, z: 2.2, radius: 2.55 }),
    boundary: 'native-route', operationalClaim: 'private-by-default'
  }),
  freeze({
    id: 'archive-canopy', title: 'Archive Canopy', zone: 'Archive Rise', style: 'mint',
    description: 'A calm landmark for returning to saved outputs and curated local work.',
    inspect: 'The canopy carries no document titles or private content. It only prepares the canonical Library route for review.',
    focusLabel: 'Focus Archive Canopy', quickOpenLabel: 'Review Library',
    action: freeze({ id: 'library', destinationLabel: 'Library', route: '/library', purpose: 'Open Library without exposing or preselecting private saved content.' }),
    play: freeze({ x: 9.25, z: 9.25, radius: 2.8 }),
    boundary: 'native-route', operationalClaim: 'private-content-hidden'
  }),
  freeze({
    id: 'signal-sail', title: 'Signal Sail', zone: 'Signal Walk', style: 'cyan',
    description: 'A wayfinding landmark for workspace signals and explicit sharing controls.',
    inspect: 'The sail is not a live social feed. It leads to Workspace, where sharing remains a separate, explicit user action.',
    focusLabel: 'Focus Signal Sail', quickOpenLabel: 'Review Workspace',
    action: freeze({ id: 'workspace', destinationLabel: 'Workspace', route: '/workspace', purpose: 'Open Workspace to review useful signals. Nothing is shared, posted, or sent automatically.' }),
    play: freeze({ x: -9.45, z: 8.8, radius: 2.8 }),
    boundary: 'native-route', operationalClaim: 'no-live-feed'
  })
]);

export const EON_CITY_COMMAND_DISTRICT_JOURNEY = freeze({
  firstTenSeconds: freeze([
    freeze({ second: 0, cue: 'Arrival threshold opens onto a readable plaza with the Command Loom centred in the hero view.' }),
    freeze({ second: 3, cue: 'Warm path lights and a cyan route spine establish human scale and the forward direction.' }),
    freeze({ second: 6, cue: 'Creator Atrium and Forge Basilica read as distinct silhouettes on the left and right thirds.' }),
    freeze({ second: 10, cue: 'The first objective names the Command Loom; nothing opens or starts automatically.' })
  ]),
  firstSixtySeconds: freeze([
    freeze({ id: 'arrival', second: 0, label: 'Arrive safely', point: freeze({ x: 0, z: 9.35 }), proof: 'spawn-clearance' }),
    freeze({ id: 'orient', second: 10, label: 'Read the district', point: freeze({ x: 0, z: 6.4 }), proof: 'hero-sightline' }),
    freeze({ id: 'agent', second: 22, label: 'Review honest agent state', point: freeze({ x: 4.1, z: 2.55 }), proof: 'dormant-receipt-boundary' }),
    freeze({ id: 'command', second: 38, label: 'Reach the Command Loom', point: freeze({ x: 0, z: -3.6 }), proof: 'command-entry-boundary' }),
    freeze({ id: 'choose', second: 60, label: 'Choose Creator, Forge, Project, Archive, or Signal', point: freeze({ x: 0, z: -1.2 }), proof: 'five-readable-destinations' })
  ]),
  autoNavigation: false,
  automaticExecution: false
});

export const EON_CITY_COMMAND_DISTRICT_PATHS = freeze([
  freeze({ id: 'arrival-spine', from: freeze({ x: 0, z: 9.35 }), to: freeze({ x: 0, z: -4.2 }), width: 2.1, surface: 'wet-graphite', lit: true }),
  freeze({ id: 'creator-branch', from: freeze({ x: -0.9, z: -1.0 }), to: freeze({ x: -7.25, z: -3.45 }), width: 1.35, surface: 'graphite-inlay', lit: true }),
  freeze({ id: 'forge-branch', from: freeze({ x: 0.9, z: -1.0 }), to: freeze({ x: 7.15, z: -2.65 }), width: 1.35, surface: 'graphite-inlay', lit: true }),
  freeze({ id: 'project-branch', from: freeze({ x: -0.8, z: 4.5 }), to: freeze({ x: -3.95, z: 2.7 }), width: 1.2, surface: 'graphite-inlay', lit: true }),
  freeze({ id: 'agent-branch', from: freeze({ x: 0.8, z: 4.5 }), to: freeze({ x: 4.05, z: 2.35 }), width: 1.2, surface: 'graphite-inlay', lit: true }),
  freeze({ id: 'signal-branch', from: freeze({ x: -1.1, z: 7.2 }), to: freeze({ x: -8.3, z: 8.35 }), width: 1.1, surface: 'graphite-inlay', lit: true }),
  freeze({ id: 'archive-branch', from: freeze({ x: 1.1, z: 7.2 }), to: freeze({ x: 8.15, z: 8.65 }), width: 1.1, surface: 'graphite-inlay', lit: true })
]);

export const EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES = freeze([
  freeze({ id: 'command-loom-shell', x: 0, z: -7.2, radius: 2.55 }),
  freeze({ id: 'creator-atrium-shell', x: -8.4, z: -4.1, radius: 2.1 }),
  freeze({ id: 'forge-basilica-shell', x: 8.2, z: -3.2, radius: 2.2 }),
  freeze({ id: 'agent-theatre-shell', x: 4.75, z: 1.8, radius: 1.85 }),
  freeze({ id: 'project-dock-shell', x: -4.55, z: 2.2, radius: 1.45 }),
  freeze({ id: 'archive-canopy-shell', x: 9.25, z: 9.25, radius: 1.65 }),
  freeze({ id: 'signal-sail-shell', x: -9.45, z: 8.8, radius: 1.4 })
]);

export const EON_CITY_COMMAND_DISTRICT_UNSTUCK_POINTS = freeze([
  freeze({ id: 'arrival-centre', x: 0, y: 0, z: 9.35, heading: Math.PI }),
  freeze({ id: 'commons-centre', x: 0, y: 0, z: 4.8, heading: Math.PI }),
  freeze({ id: 'command-approach', x: 0, y: 0, z: -3.5, heading: Math.PI }),
  freeze({ id: 'creator-approach', x: -5.7, y: 0, z: -2.5, heading: -Math.PI / 2 }),
  freeze({ id: 'forge-approach', x: 5.65, y: 0, z: -1.9, heading: Math.PI / 2 }),
  freeze({ id: 'agent-approach', x: 2.5, y: 0, z: 2.65, heading: Math.PI / 2 })
]);

export const EON_CITY_COMMAND_DISTRICT_PERFORMANCE_BUDGET = freeze({
  requiredRuntimeAssets: 5,
  optionalRuntimeAssets: 5,
  maxNewInteractiveLandmarks: 6,
  maxAuthoredCollisionVolumes: 10,
  maxDynamicLightsAdded: 2,
  maxContinuousSliceAnimations: 8,
  remoteArtRequired: false,
  audioStartsAutomatically: false,
  detailFailureBlocksCore: false
});

export function getEonCityCommandDistrictInteraction(landmarkId = '') {
  const entry = EON_CITY_COMMAND_DISTRICT_DESTINATIONS.find((candidate) => candidate.id === String(landmarkId || ''));
  if (!entry) return null;
  return freeze({
    ...clone(entry),
    landmarkId: entry.id,
    localOnly: true,
    remoteNetwork: false,
    readsPrivateWork: false,
    autoNavigation: false,
    automaticExecution: false
  });
}

export function getEonCityCommandDistrictInteractions() {
  return EON_CITY_COMMAND_DISTRICT_DESTINATIONS.map((entry) => getEonCityCommandDistrictInteraction(entry.id));
}

export function getEonCityCommandDistrictDestination(landmarkId = '') {
  const interaction = getEonCityCommandDistrictInteraction(landmarkId);
  if (!interaction?.action) return null;
  return freeze({
    id: interaction.action.id,
    landmarkId: interaction.id,
    landmarkLabel: interaction.title,
    destinationLabel: interaction.action.destinationLabel,
    route: interaction.action.route,
    purpose: interaction.action.purpose
  });
}

export function findEonCityCommandDistrictUnstuckPoint(position = {}) {
  const x = Number(position?.x) || 0;
  const z = Number(position?.z) || 0;
  const point = EON_CITY_COMMAND_DISTRICT_UNSTUCK_POINTS
    .map((entry) => ({ ...entry, distance: Math.hypot(x - entry.x, z - entry.z) }))
    .sort((left, right) => left.distance - right.distance)[0] || EON_CITY_COMMAND_DISTRICT_UNSTUCK_POINTS[0];
  return freeze({ id: point.id, x: point.x, y: point.y, z: point.z, heading: point.heading, distance: Math.round(point.distance * 100) / 100 });
}

export function getEonCityCommandDistrictVerticalSlicePlan() {
  return freeze({
    schema: EON_CITY_COMMAND_DISTRICT_SLICE_SCHEMA,
    cacheVersion: EON_CITY_COMMAND_DISTRICT_CACHE_VERSION,
    artDirection: 'Productive Nocturne',
    spawn: clone(EON_CITY_COMMAND_DISTRICT_SPAWN),
    destinations: getEonCityCommandDistrictInteractions(),
    journey: clone(EON_CITY_COMMAND_DISTRICT_JOURNEY),
    paths: clone(EON_CITY_COMMAND_DISTRICT_PATHS),
    collisionVolumes: clone(EON_CITY_COMMAND_DISTRICT_COLLISION_VOLUMES),
    unstuckPoints: clone(EON_CITY_COMMAND_DISTRICT_UNSTUCK_POINTS),
    performanceBudget: clone(EON_CITY_COMMAND_DISTRICT_PERFORMANCE_BUDGET),
    canonicalHeavyRoute: '/eoncity',
    runtimeOwner: 'assets/js/city/eon-city-runtime-owner.js',
    finalQualityExpansionAllowed: false,
    requiredIndependentScore: 90,
    localOnly: true,
    remoteArtRequired: false,
    fakeOperationalActivity: false
  });
}

export function validateEonCityCommandDistrictVerticalSlice(plan = getEonCityCommandDistrictVerticalSlicePlan()) {
  const errors = [];
  const routes = new Set(['/create', '/forge', '/projects', '/library', '/workspace', '/automations']);
  if (plan?.schema !== EON_CITY_COMMAND_DISTRICT_SLICE_SCHEMA) errors.push('Slice schema is invalid.');
  if (plan?.artDirection !== 'Productive Nocturne') errors.push('Productive Nocturne must remain the art direction.');
  if (plan?.canonicalHeavyRoute !== '/eoncity') errors.push('The canonical heavy route must remain /eoncity.');
  if (plan?.runtimeOwner !== 'assets/js/city/eon-city-runtime-owner.js') errors.push('The W624B runtime owner changed.');
  if (!Array.isArray(plan?.destinations) || plan.destinations.length !== 6) errors.push('Six finite W624C destinations are required.');
  const ids = new Set();
  for (const entry of plan?.destinations || []) {
    if (!/^[a-z0-9-]{3,48}$/.test(entry?.id || '') || ids.has(entry.id)) errors.push('Destination id is invalid or duplicated.');
    ids.add(entry?.id);
    if (!routes.has(entry?.action?.route)) errors.push(`${entry?.id || 'unknown'} has a non-canonical route.`);
    if (!Number.isFinite(entry?.play?.x) || !Number.isFinite(entry?.play?.z) || !Number.isFinite(entry?.play?.radius)) errors.push(`${entry?.id || 'unknown'} has invalid world coordinates.`);
    if (entry?.autoNavigation || entry?.automaticExecution || entry?.remoteNetwork || entry?.readsPrivateWork) errors.push(`${entry?.id || 'unknown'} violates the review-first boundary.`);
  }
  if ((plan?.journey?.firstTenSeconds || []).length !== 4) errors.push('First-ten-second review needs four timed cues.');
  if ((plan?.journey?.firstSixtySeconds || []).length !== 5) errors.push('First-sixty-second review needs five milestones.');
  if ((plan?.paths || []).length < 7) errors.push('The authored path network is incomplete.');
  if ((plan?.collisionVolumes || []).length < 7) errors.push('Authored collision coverage is incomplete.');
  if ((plan?.unstuckPoints || []).length < 6) errors.push('Safe unstuck coverage is incomplete.');
  if (plan?.performanceBudget?.remoteArtRequired || plan?.performanceBudget?.audioStartsAutomatically || plan?.performanceBudget?.detailFailureBlocksCore) errors.push('Performance budget violates W624B boundaries.');
  const serialised = JSON.stringify(plan);
  if (/https?:\/\/|api[-_ ]?key|credential|private prompt|fake job|fake economy/i.test(serialised)) errors.push('Slice contract contains a forbidden external, credential, private, or fake-operational claim.');
  return freeze({ schema: EON_CITY_COMMAND_DISTRICT_SLICE_SCHEMA, ok: errors.length === 0, errors: freeze(errors), scoreGate: 90, destinationCount: plan?.destinations?.length || 0 });
}
