/**
 * W570 — local ambient NPC archetype, readability and spacing contract.
 *
 * This source-only roster describes decorative City inhabitants. It does not
 * simulate people, infer user activity, accept chat/voice, read private work,
 * execute routes, or connect to a network.
 */
export const EON_CITY_NPC_ARCHETYPES_SCHEMA = 'eon.city.npc-archetypes.w570.v1';

const freeze = (value) => Object.freeze(value);
const VALID_QUALITY = new Set(['lite', 'balanced', 'cinematic']);
const SAFE_ID = /^[a-z][a-z0-9-]{2,79}$/;

export const EON_CITY_AMBIENT_NPC_ARCHETYPES = freeze([
  freeze({
    id: 'human-wayfinder',
    species: 'human',
    silhouette: 'layered city coat and compact shoulder light',
    face: 'two readable eyes and one small mouth cue',
    motion: 'idle-shift',
    localVisualOnly: true
  }),
  freeze({
    id: 'robot-maintainer',
    species: 'robot',
    silhouette: 'service chassis with a compact signal core',
    face: 'two readable optic lamps and one mouth cue',
    motion: 'calibration-turn',
    localVisualOnly: true
  }),
  freeze({
    id: 'alien-cartographer',
    species: 'alien',
    silhouette: 'quiet tapered mantle and orbit marker',
    face: 'two readable eyes and one small mouth cue',
    motion: 'observatory-pause',
    localVisualOnly: true
  })
]);

const ARCHETYPE_BY_ID = new Map(EON_CITY_AMBIENT_NPC_ARCHETYPES.map((entry) => [entry.id, entry]));
const QUALITY_PROFILES = freeze({
  lite: freeze({ ambientCount: 0, minSpacing: 2.6, readableFaces: false, motion: false }),
  balanced: freeze({ ambientCount: 3, minSpacing: 2.6, readableFaces: true, motion: true }),
  cinematic: freeze({ ambientCount: 5, minSpacing: 2.45, readableFaces: true, motion: true })
});

export const EON_CITY_NPC_CROWD_QUALITY_PROFILES = QUALITY_PROFILES;

const ANCHORS = freeze([
  freeze({ x: -10.3, z: -8.2, heading: .42 }),
  freeze({ x: 10.2, z: -7.3, heading: -.36 }),
  freeze({ x: -10.25, z: 7.65, heading: .72 }),
  freeze({ x: 10.25, z: 7.55, heading: -.74 }),
  freeze({ x: .15, z: 10.45, heading: Math.PI })
]);

function normalizedQuality(quality = 'balanced') {
  return VALID_QUALITY.has(String(quality)) ? String(quality) : 'balanced';
}

function profileFor(quality) {
  return QUALITY_PROFILES[normalizedQuality(quality)];
}

function rounded(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

function makeEntity(index, quality) {
  const profile = profileFor(quality);
  const archetype = EON_CITY_AMBIENT_NPC_ARCHETYPES[index % EON_CITY_AMBIENT_NPC_ARCHETYPES.length];
  const anchor = ANCHORS[index];
  return freeze({
    id: `ambient-${archetype.id}-${index + 1}`,
    archetypeId: archetype.id,
    x: rounded(anchor.x),
    z: rounded(anchor.z),
    heading: rounded(anchor.heading),
    readableFace: profile.readableFaces,
    motionEnabled: profile.motion,
    localVisualOnly: true,
    privateDataVisible: false,
    interactive: false
  });
}

function minPairSpacing(entries = []) {
  let minimum = Infinity;
  for (let index = 0; index < entries.length; index += 1) {
    for (let other = index + 1; other < entries.length; other += 1) {
      minimum = Math.min(minimum, Math.hypot(entries[index].x - entries[other].x, entries[index].z - entries[other].z));
    }
  }
  return Number.isFinite(minimum) ? Math.round(minimum * 1000) / 1000 : null;
}

/** Returns a deterministic decorative roster; the Lite profile deliberately has no ambient crowd. */
export function getEonCityAmbientNpcCrowdPlan({ quality = 'balanced' } = {}) {
  const resolved = normalizedQuality(quality);
  const profile = profileFor(resolved);
  const entities = freeze(Array.from({ length: profile.ambientCount }, (_, index) => makeEntity(index, resolved)));
  return freeze({
    schema: EON_CITY_NPC_ARCHETYPES_SCHEMA,
    quality: resolved,
    archetypes: EON_CITY_AMBIENT_NPC_ARCHETYPES,
    entities,
    ambientCount: entities.length,
    minSpacing: profile.minSpacing,
    measuredMinSpacing: minPairSpacing(entities),
    readableFaces: profile.readableFaces,
    motionEnabled: profile.motion,
    originalProcedural: true,
    binaryAssets: false,
    remoteAssets: false,
    remoteTelemetry: false,
    userData: false,
    interactive: false,
    autonomous: false,
    socialMultiplayer: false
  });
}

export function getEonCityAmbientNpcArchetype(archetypeId = '') {
  return ARCHETYPE_BY_ID.get(String(archetypeId || '').trim()) || null;
}

function exactKeys(value, keys) {
  return Object.keys(value && typeof value === 'object' ? value : {}).every((key) => keys.includes(key));
}

export function validateEonCityAmbientNpcCrowdPlan(plan = {}) {
  const errors = [];
  const value = plan && typeof plan === 'object' ? plan : {};
  const quality = normalizedQuality(value.quality);
  const profile = profileFor(quality);
  if (!exactKeys(value, ['schema', 'quality', 'archetypes', 'entities', 'ambientCount', 'minSpacing', 'measuredMinSpacing', 'readableFaces', 'motionEnabled', 'originalProcedural', 'binaryAssets', 'remoteAssets', 'remoteTelemetry', 'userData', 'interactive', 'autonomous', 'socialMultiplayer'])) errors.push('plan-has-unknown-or-sensitive-fields');
  if (value.schema !== EON_CITY_NPC_ARCHETYPES_SCHEMA || !VALID_QUALITY.has(value.quality)) errors.push('plan-schema-or-quality-invalid');
  if (!Array.isArray(value.archetypes) || value.archetypes.length !== EON_CITY_AMBIENT_NPC_ARCHETYPES.length) errors.push('archetype-register-invalid');
  if (!Array.isArray(value.entities) || value.entities.length !== profile.ambientCount || value.ambientCount !== profile.ambientCount) errors.push('ambient-count-invalid');
  if (value.minSpacing !== profile.minSpacing || value.readableFaces !== profile.readableFaces || value.motionEnabled !== profile.motion) errors.push('quality-profile-invalid');
  if (value.originalProcedural !== true || value.binaryAssets !== false || value.remoteAssets !== false || value.remoteTelemetry !== false || value.userData !== false || value.interactive !== false || value.autonomous !== false || value.socialMultiplayer !== false) errors.push('truth-boundary-invalid');
  const ids = new Set();
  for (const entry of value.entities || []) {
    if (!exactKeys(entry, ['id', 'archetypeId', 'x', 'z', 'heading', 'readableFace', 'motionEnabled', 'localVisualOnly', 'privateDataVisible', 'interactive'])) errors.push('entity-has-unknown-or-sensitive-fields');
    if (!SAFE_ID.test(String(entry?.id || '')) || ids.has(entry?.id)) errors.push('entity-id-invalid-or-duplicate');
    ids.add(entry?.id);
    if (!ARCHETYPE_BY_ID.has(entry?.archetypeId)) errors.push('entity-archetype-invalid');
    if (![entry?.x, entry?.z, entry?.heading].every((item) => Number.isFinite(item)) || Math.abs(entry?.x || 0) > 14 || Math.abs(entry?.z || 0) > 14) errors.push('entity-position-invalid');
    if (entry?.readableFace !== profile.readableFaces || entry?.motionEnabled !== profile.motion || entry?.localVisualOnly !== true || entry?.privateDataVisible !== false || entry?.interactive !== false) errors.push('entity-flags-invalid');
  }
  const measured = minPairSpacing(value.entities || []);
  if (value.entities?.length > 1 && (!Number.isFinite(measured) || measured < profile.minSpacing || value.measuredMinSpacing !== measured)) errors.push('entity-spacing-invalid');
  if (value.entities?.length <= 1 && value.measuredMinSpacing !== null) errors.push('entity-spacing-must-be-null');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), measuredMinSpacing: measured, ambientCount: Array.isArray(value.entities) ? value.entities.length : 0 });
}

export function getEonCityNpcArchetypeTruth({ quality = 'balanced' } = {}) {
  const plan = getEonCityAmbientNpcCrowdPlan({ quality });
  const validation = validateEonCityAmbientNpcCrowdPlan(plan);
  return freeze({
    schema: EON_CITY_NPC_ARCHETYPES_SCHEMA,
    quality: plan.quality,
    valid: validation.ok,
    ambientCount: plan.ambientCount,
    readableFaces: plan.readableFaces,
    originalProcedural: true,
    binaryAssets: false,
    remoteAssets: false,
    remoteTelemetry: false,
    userData: false,
    interactive: false,
    autonomous: false,
    chatOrVoice: false,
    socialMultiplayer: false,
    browserDeviceProofCaptured: false
  });
}
