/**
 * W552 — EON Universe world grammar.
 *
 * This is the source-controlled bridge between the current Command District
 * prototype and the authored EON Universe rebuild. It deliberately defines
 * visual restraint and finite landmark interactions only. It does not add
 * accounts, multiplayer, commerce, rewards, telemetry, remote assets, or
 * automatic navigation to native EONAPP routes.
 */
import { CITY_LANDMARKS } from './city-landmark-registry.js';

export const EON_UNIVERSE_WORLD_GRAMMAR_SCHEMA = 'eon.city.universe-world-grammar.w552.v1';

const freeze = (value) => Object.freeze(value);
const clone = (value) => JSON.parse(JSON.stringify(value));

export const EON_UNIVERSE_RENDER_PROFILES = freeze({
  lite: freeze({
    id: 'lite',
    glowIntensity: 0.08,
    fogMultiplier: 0.92,
    cameraRadius: 14.4,
    cameraBeta: 1.04,
    cameraRadiusLimits: freeze([9.5, 20]),
    visualIntent: 'clear landmark silhouettes and stable low-detail traversal'
  }),
  balanced: freeze({
    id: 'balanced',
    glowIntensity: 0.16,
    fogMultiplier: 0.9,
    cameraRadius: 15.2,
    cameraBeta: 1.03,
    cameraRadiusLimits: freeze([9.5, 21]),
    visualIntent: 'open noir city composition with readable streets and faces'
  }),
  cinematic: freeze({
    id: 'cinematic',
    glowIntensity: 0.28,
    fogMultiplier: 0.84,
    cameraRadius: 15.8,
    cameraBeta: 1.02,
    cameraRadiusLimits: freeze([9.5, 22]),
    visualIntent: 'high-detail authored district review without obscuring geometry'
  })
});

const landmarkOverrides = freeze({
  'command-centre': freeze({
    title: 'Command Centre',
    zone: 'Horizon Commons',
    focusLabel: 'Enter Command Deck',
    inspect: 'EONBOT, the Command Dock and practical City navigation meet here. The full app remains one click away.',
    style: 'cyan'
  }),
  workshop: freeze({
    title: 'Forge Basilica',
    zone: 'Forge Court',
    focusLabel: 'Focus Forge Court',
    inspect: 'A build landmark for Projects and Forge. This release offers a local City focus plus an explicit native route review.',
    style: 'violet'
  }),
  relay: freeze({
    title: 'Realm Gateway',
    zone: 'Signal Transit',
    focusLabel: 'Focus Gateway',
    inspect: 'A local realm orientation landmark. Curated future expeditions remain separate from public-world claims.',
    style: 'violet'
  }),
  archive: freeze({
    title: 'Archive Gardens',
    zone: 'Archive Gardens',
    focusLabel: 'Focus Archive Gardens',
    inspect: 'A calm library landmark for returning to saved work and useful briefs without putting private content inside the City.',
    style: 'mint'
  }),
  observatory: freeze({
    title: 'Device Lab Observatory',
    zone: 'Device Lab Docks',
    focusLabel: 'Focus Device Lab',
    inspect: 'A local-AI orientation landmark. It never probes a device or starts a model until the user chooses that action in the native surface.',
    style: 'amber'
  })
});

function toInteraction(landmark) {
  const override = landmarkOverrides[landmark.id];
  if (!override || !landmark.play || !landmark.action) return null;
  return freeze({
    id: landmark.id,
    landmarkId: landmark.id,
    title: override.title,
    zone: override.zone,
    style: override.style,
    description: landmark.description,
    objective: landmark.objective,
    inspect: override.inspect,
    focusLabel: override.focusLabel,
    quickOpenLabel: `Review ${landmark.action.destinationLabel}`,
    action: freeze({
      id: landmark.action.id,
      route: landmark.action.route,
      destinationLabel: landmark.action.destinationLabel,
      purpose: landmark.action.purpose
    }),
    play: freeze({ ...landmark.play }),
    localOnly: true,
    remoteNetwork: false,
    readsPrivateWork: false,
    autoNavigation: false,
    automaticExecution: false
  });
}

export const EON_UNIVERSE_CITY_INTERACTIONS = freeze(
  CITY_LANDMARKS.map(toInteraction).filter(Boolean)
);

export function normalizeEonUniverseQuality(value = 'balanced') {
  const quality = String(value || '').trim().toLowerCase();
  return Object.hasOwn(EON_UNIVERSE_RENDER_PROFILES, quality) ? quality : 'balanced';
}

export function getEonUniverseRenderProfile({ quality = 'balanced' } = {}) {
  const resolvedQuality = normalizeEonUniverseQuality(quality);
  return freeze({
    schema: EON_UNIVERSE_WORLD_GRAMMAR_SCHEMA,
    quality: resolvedQuality,
    ...clone(EON_UNIVERSE_RENDER_PROFILES[resolvedQuality]),
    localOnly: true,
    remoteAssets: false,
    finalBinaryArt: false,
    finalVisualCertification: false
  });
}

export function getEonUniverseCityInteraction(landmarkId = '') {
  const interaction = EON_UNIVERSE_CITY_INTERACTIONS.find((entry) => entry.id === String(landmarkId || ''));
  return interaction ? freeze(clone(interaction)) : null;
}

export function getEonUniverseCityInteractions() {
  return EON_UNIVERSE_CITY_INTERACTIONS.map((entry) => freeze(clone(entry)));
}

export function validateEonUniverseWorldGrammar({ profiles = EON_UNIVERSE_RENDER_PROFILES, interactions = EON_UNIVERSE_CITY_INTERACTIONS } = {}) {
  const errors = [];
  for (const quality of ['lite', 'balanced', 'cinematic']) {
    const profile = profiles?.[quality];
    if (!profile || profile.id !== quality) errors.push(`${quality} render profile is missing.`);
    if (!Number.isFinite(profile?.glowIntensity) || profile.glowIntensity < 0 || profile.glowIntensity > 0.34) errors.push(`${quality} glow must stay restrained.`);
    if (!Number.isFinite(profile?.fogMultiplier) || profile.fogMultiplier < 0.75 || profile.fogMultiplier > 1) errors.push(`${quality} fog must preserve street legibility.`);
    if (!Number.isFinite(profile?.cameraRadius) || profile.cameraRadius < 9 || profile.cameraRadius > 23) errors.push(`${quality} camera radius is invalid.`);
    if (!Number.isFinite(profile?.cameraBeta) || profile.cameraBeta < 0.86 || profile.cameraBeta > 1.2) errors.push(`${quality} camera beta is invalid.`);
    if (!Array.isArray(profile?.cameraRadiusLimits) || profile.cameraRadiusLimits.length !== 2 || profile.cameraRadiusLimits.some((value) => !Number.isFinite(value))) errors.push(`${quality} camera limits are invalid.`);
  }
  const ids = new Set();
  for (const entry of Array.isArray(interactions) ? interactions : []) {
    if (!/^[a-z0-9-]{3,48}$/.test(entry?.id || '') || ids.has(entry.id)) errors.push('Interaction id is invalid or duplicated.');
    ids.add(entry?.id);
    if (!entry?.play || !Number.isFinite(entry.play.x) || !Number.isFinite(entry.play.z) || !Number.isFinite(entry.play.radius)) errors.push(`${entry?.id || 'unknown'} needs finite play coordinates.`);
    if (!entry?.action || !/^\/(?:$|[a-z0-9-]+(?:#[a-z0-9-]+)?)$/i.test(entry.action.route || '')) errors.push(`${entry?.id || 'unknown'} has an unsafe local route.`);
    if (entry?.autoNavigation || entry?.automaticExecution || entry?.remoteNetwork || entry?.readsPrivateWork) errors.push(`${entry?.id || 'unknown'} violates the local interaction boundary.`);
  }
  if (!Array.isArray(interactions) || interactions.length < 5) errors.push('The first Command Horizon slice needs five actionable landmarks.');
  const serialised = JSON.stringify({ profiles, interactions });
  if (/https?:\/\/|wallet|payment|token|reward|loot|referral|api[-_ ]?key|multiplayer|social/i.test(serialised)) errors.push('World grammar contains a forbidden network, value, credential or social surface.');
  return freeze({ schema: EON_UNIVERSE_WORLD_GRAMMAR_SCHEMA, ok: errors.length === 0, errors: freeze(errors), interactionCount: Array.isArray(interactions) ? interactions.length : 0, localOnly: true });
}
