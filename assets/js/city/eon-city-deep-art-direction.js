/**
 * W422 — EON City deep environmental art direction.
 *
 * This module maps the original local W419/W422 vector catalogue to authored
 * City chapters. It intentionally carries no user data, remote URLs, camera
 * capture, telemetry, publishing, rewards, or final-binary-art claim.
 */
import { getCityVectorArtAsset, getCityVectorArtPlan, normalizeCityVectorArtQuality } from './eon-city-vector-art-kit.js';

export const EON_CITY_DEEP_ART_DIRECTION_SCHEMA = 'eon.city.deep-art-direction.w422.v1';

const freeze = (value) => Object.freeze(value);
const chapter = (entry) => freeze({
  localOnly: true,
  remoteNetwork: false,
  userData: false,
  finalBinaryArt: false,
  ...entry,
  artIds: freeze([...entry.artIds]),
  landmarkIds: freeze([...(entry.landmarkIds || [])])
});
const placement = (entry) => freeze({
  localOnly: true,
  remoteNetwork: false,
  userData: false,
  finalBinaryArt: false,
  capturesMedia: false,
  uploadsMedia: false,
  ...entry,
  position: freeze({ ...entry.position }),
  qualities: freeze([...(entry.qualities || ['balanced', 'cinematic'])])
});

export const EON_CITY_DEEP_ART_CHAPTERS = freeze([
  chapter({
    id: 'arrival-command',
    title: 'Arrival and Command',
    detail: 'Wet orientation path, controlled protocol geometry and a moon-grid skyline establish the first readable City landmark.',
    landmarkIds: ['command-centre'],
    artIds: ['obsidian-ceramic', 'vapor-caustics', 'moon-grid', 'rain-veil', 'arrival-star', 'safety-grid', 'protocol-grid', 'command-circuit', 'neon-lantern', 'street-barrier']
  }),
  chapter({
    id: 'creator-forge',
    title: 'Creator and Forge',
    detail: 'Prismatic glass, amber industrial rails and clear workshop marks distinguish imagination from build execution without copying a real product interface.',
    landmarkIds: ['creator-atrium', 'forge-bay'],
    artIds: ['prismatic-glass', 'amber-rail', 'forge-plumes', 'creator-prism', 'forge-stripe', 'kinetic-lane', 'transit-rune', 'holo-kiosk', 'tram-silhouette']
  }),
  chapter({
    id: 'signal-automation',
    title: 'Signal and Automation',
    detail: 'Violet field mesh, aerial signals and bounded portals create a legible navigation identity for sharing preparation and automation review.',
    landmarkIds: ['signal-tower', 'automation-observatory'],
    artIds: ['signal-mesh', 'signal-array', 'aurora-ribbon', 'aerial-traffic', 'relay-emblem', 'observatory-emblem', 'signal-chevron', 'portal-ring', 'signal-kite', 'drone-silhouette']
  }),
  chapter({
    id: 'archive-gardens',
    title: 'Archive Gardens',
    detail: 'Biolume lattice, warm archival inlays and quiet garden props create a softer, slower visual counterpoint to the command streets.',
    landmarkIds: ['archive-gardens'],
    artIds: ['bio-lattice', 'archive-warmth', 'garden-canopy', 'biolume-leaf', 'archive-rune', 'garden-pod', 'archive-orb']
  }),
  chapter({
    id: 'signal-expeditions',
    title: 'Signal Expeditions',
    detail: 'Four finite visual thresholds give each optional local expedition a distinct authored symbol without becoming an unbounded open world.',
    landmarkIds: ['signal-tower'],
    artIds: ['expedition-ember', 'expedition-tide', 'expedition-aurora', 'expedition-echo']
  })
]);

export const EON_CITY_DEEP_ART_PLACEMENTS = freeze([
  // Backdrops are layered behind the existing City skyline. The render surface
  // is still wholly local and each layer is guarded by its art-quality tier.
  placement({ id: 'moon-grid-horizon', layer: 'backdrop', artId: 'moon-grid', position: { x: 1.8, y: 9.2, z: -15.5 }, width: 33, height: 12.4, rotationY: Math.PI, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'signal-array-horizon', layer: 'backdrop', artId: 'signal-array', position: { x: -2.8, y: 8.6, z: -15.25 }, width: 31, height: 11.6, rotationY: Math.PI, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'garden-canopy-horizon', layer: 'backdrop', artId: 'garden-canopy', position: { x: 2.5, y: 7.45, z: -14.96 }, width: 30, height: 10.6, rotationY: Math.PI, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'rain-veil-horizon', layer: 'backdrop', artId: 'rain-veil', position: { x: 0, y: 7.8, z: -14.75 }, width: 31, height: 10.9, rotationY: Math.PI, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'aurora-ribbon-horizon', layer: 'backdrop', artId: 'aurora-ribbon', position: { x: -1.4, y: 10.2, z: -15.7 }, width: 34, height: 13.2, rotationY: Math.PI, qualities: ['cinematic'] }),
  placement({ id: 'aerial-traffic-horizon', layer: 'backdrop', artId: 'aerial-traffic', position: { x: 0.8, y: 8.4, z: -14.62 }, width: 32, height: 11.4, rotationY: Math.PI, qualities: ['cinematic'] }),
  placement({ id: 'forge-plumes-horizon', layer: 'backdrop', artId: 'forge-plumes', position: { x: 3.7, y: 7.2, z: -14.53 }, width: 30, height: 10.2, rotationY: Math.PI, qualities: ['cinematic'] }),

  // Floor and facade markings make the procedural world read as authored space.
  placement({ id: 'arrival-star-floor', layer: 'floor-decal', artId: 'arrival-star', position: { x: 0, y: 0.069, z: 9.82 }, width: 1.28, height: 1.28, rotationZ: 0, qualities: ['lite', 'balanced', 'cinematic'] }),
  placement({ id: 'arrival-safety-floor', layer: 'floor-decal', artId: 'safety-grid', position: { x: 0, y: 0.07, z: 4.82 }, width: 1.18, height: 1.18, rotationZ: 0, qualities: ['lite', 'balanced', 'cinematic'] }),
  placement({ id: 'command-protocol-floor', layer: 'floor-decal', artId: 'protocol-grid', position: { x: 0, y: 0.114, z: -5.75 }, width: 2.14, height: 2.14, rotationZ: Math.PI / 4, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'command-circuit-floor', layer: 'floor-decal', artId: 'command-circuit', position: { x: 0, y: 0.121, z: -7.62 }, width: 1.56, height: 1.56, rotationZ: 0, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'creator-prism-floor', layer: 'floor-decal', artId: 'creator-prism', position: { x: -8.4, y: 0.131, z: -1.92 }, width: 1.28, height: 1.28, rotationZ: 0, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'forge-stripe-floor', layer: 'floor-decal', artId: 'forge-stripe', position: { x: 8.2, y: 0.132, z: -0.84 }, width: 1.42, height: 1.42, rotationZ: Math.PI / 2, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'signal-chevron-floor', layer: 'floor-decal', artId: 'signal-chevron', position: { x: -10.35, y: 0.129, z: -0.82 }, width: 1.28, height: 1.28, rotationZ: 0, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'observatory-orbit-floor', layer: 'floor-decal', artId: 'observatory-emblem', position: { x: 10.15, y: 0.129, z: -0.55 }, width: 1.25, height: 1.25, rotationZ: 0, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'archive-rune-floor', layer: 'floor-decal', artId: 'archive-rune', position: { x: 0.15, y: 0.128, z: 8.35 }, width: 1.32, height: 1.32, rotationZ: 0, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'archive-leaf-floor', layer: 'floor-decal', artId: 'biolume-leaf', position: { x: 2.08, y: 0.128, z: 9.18 }, width: 1.18, height: 1.18, rotationZ: .72, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'relay-emblem-floor', layer: 'floor-decal', artId: 'relay-emblem', position: { x: -7.2, y: 0.13, z: 4.72 }, width: 1.28, height: 1.28, rotationZ: 0, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'transit-rune-floor', layer: 'floor-decal', artId: 'transit-rune', position: { x: 0, y: 0.075, z: 1.95 }, width: 1.12, height: 1.12, rotationZ: 0, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'kinetic-lane-floor', layer: 'floor-decal', artId: 'kinetic-lane', position: { x: 5.36, y: 0.074, z: 1.82 }, width: 1.36, height: 1.36, rotationZ: -Math.PI / 2, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'portal-threshold-floor', layer: 'floor-decal', artId: 'portal-ring', position: { x: -10.35, y: 0.13, z: 3.78 }, width: 1.64, height: 1.64, rotationZ: 0, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'ember-threshold-floor', layer: 'floor-decal', artId: 'expedition-ember', position: { x: -11.55, y: 0.135, z: 3.02 }, width: .78, height: .78, rotationZ: 0, qualities: ['cinematic'] }),
  placement({ id: 'tide-threshold-floor', layer: 'floor-decal', artId: 'expedition-tide', position: { x: -9.2, y: 0.135, z: 3.02 }, width: .78, height: .78, rotationZ: 0, qualities: ['cinematic'] }),
  placement({ id: 'aurora-threshold-floor', layer: 'floor-decal', artId: 'expedition-aurora', position: { x: -11.55, y: 0.135, z: 5.12 }, width: .78, height: .78, rotationZ: 0, qualities: ['cinematic'] }),
  placement({ id: 'echo-threshold-floor', layer: 'floor-decal', artId: 'expedition-echo', position: { x: -9.2, y: 0.135, z: 5.12 }, width: .78, height: .78, rotationZ: 0, qualities: ['cinematic'] }),

  // Transparent billboard props add authored silhouettes without shipping an
  // unreviewed model binary. They never display user data or carry interactions.
  placement({ id: 'arrival-lantern-prop', layer: 'prop', artId: 'neon-lantern', position: { x: -2.25, y: 1.32, z: 8.3 }, width: .96, height: 1.7, billboard: true, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'command-kiosk-prop', layer: 'prop', artId: 'holo-kiosk', position: { x: 3.55, y: 1.02, z: -4.85 }, width: 1.24, height: 1.38, billboard: true, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'signal-kite-prop', layer: 'prop', artId: 'signal-kite', position: { x: -10.35, y: 5.8, z: 1.15 }, width: 1.06, height: 1.56, billboard: true, qualities: ['cinematic'] }),
  placement({ id: 'garden-pod-prop', layer: 'prop', artId: 'garden-pod', position: { x: 2.25, y: 1.34, z: 10.14 }, width: 1.24, height: 1.48, billboard: true, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'archive-orb-prop', layer: 'prop', artId: 'archive-orb', position: { x: -1.82, y: 1.22, z: 10.4 }, width: 1.18, height: 1.18, billboard: true, qualities: ['balanced', 'cinematic'] }),
  placement({ id: 'street-barrier-prop', layer: 'prop', artId: 'street-barrier', position: { x: 4.7, y: .68, z: 2.55 }, width: 1.44, height: .76, billboard: true, qualities: ['lite', 'balanced', 'cinematic'] }),
  placement({ id: 'drone-silhouette-prop', layer: 'prop', artId: 'drone-silhouette', position: { x: -4.8, y: 7.4, z: -6.2 }, width: 1.3, height: .92, billboard: true, qualities: ['cinematic'] }),
  placement({ id: 'tram-silhouette-prop', layer: 'prop', artId: 'tram-silhouette', position: { x: 7.1, y: 2.18, z: 5.8 }, width: 1.72, height: .82, billboard: true, qualities: ['cinematic'] })
]);

export const EON_CITY_DEEP_ART_SURFACES = freeze({
  command: freeze({ artId: 'obsidian-ceramic', uScale: 3.6, vScale: 3.6 }),
  arrival: freeze({ artId: 'vapor-caustics', uScale: 1.8, vScale: 4.2 }),
  creator: freeze({ artId: 'prismatic-glass', uScale: 2.1, vScale: 2.5 }),
  forge: freeze({ artId: 'amber-rail', uScale: 2.3, vScale: 2.9 }),
  signal: freeze({ artId: 'signal-mesh', uScale: 2.7, vScale: 2.8 }),
  automation: freeze({ artId: 'signal-mesh', uScale: 3.2, vScale: 3.2 }),
  archive: freeze({ artId: 'bio-lattice', uScale: 2.8, vScale: 2.8 }),
  archiveWarm: freeze({ artId: 'archive-warmth', uScale: 2.3, vScale: 2.3 })
});

export function getCityDeepArtChapters() {
  return EON_CITY_DEEP_ART_CHAPTERS;
}

export function getCityDeepArtPlacementPlan({ quality = 'balanced', layer = '' } = {}) {
  const resolvedQuality = normalizeCityVectorArtQuality(quality);
  const eligible = new Set(getCityVectorArtPlan({ quality: resolvedQuality }).entries.map((entry) => entry.id));
  const placements = EON_CITY_DEEP_ART_PLACEMENTS
    .filter((entry) => (!layer || entry.layer === layer) && entry.qualities.includes(resolvedQuality) && eligible.has(entry.artId))
    .map((entry) => freeze({ ...entry }));
  return freeze({
    schema: EON_CITY_DEEP_ART_DIRECTION_SCHEMA,
    quality: resolvedQuality,
    layer: layer || 'all',
    placements: freeze(placements),
    localOnly: true,
    remoteNetwork: false,
    finalBinaryArt: false
  });
}

export function getCityDeepArtSurface(id = '') {
  const entry = EON_CITY_DEEP_ART_SURFACES[String(id || '').trim()];
  return entry ? freeze({ ...entry }) : null;
}

export function getCityDeepArtDirectionSummary({ quality = 'balanced' } = {}) {
  const plan = getCityDeepArtPlacementPlan({ quality });
  const byLayer = plan.placements.reduce((result, entry) => {
    result[entry.layer] = Number(result[entry.layer] || 0) + 1;
    return result;
  }, {});
  return freeze({
    schema: EON_CITY_DEEP_ART_DIRECTION_SCHEMA,
    quality: plan.quality,
    chapters: EON_CITY_DEEP_ART_CHAPTERS,
    placementCount: plan.placements.length,
    layerCounts: freeze({ ...byLayer }),
    originalVectorArt: true,
    finalBinaryArt: false,
    localOnly: true,
    remoteNetwork: false,
    userData: false,
    finalVisualCertification: false,
    finalInstitutionalArtClaim: false
  });
}

export function validateCityDeepArtDirection() {
  const errors = [];
  const chapterIds = new Set();
  const placementIds = new Set();
  if (EON_CITY_DEEP_ART_CHAPTERS.length !== 5) errors.push('W422 requires five authored deep-art chapters.');
  if (EON_CITY_DEEP_ART_PLACEMENTS.length !== 33) errors.push('W422 requires thirty-three authored deep-art placements.');
  for (const entry of EON_CITY_DEEP_ART_CHAPTERS) {
    if (!/^[a-z0-9-]{4,48}$/.test(entry.id || '') || chapterIds.has(entry.id)) errors.push('Deep-art chapter id is invalid or duplicated.');
    chapterIds.add(entry.id);
    if (!entry.title || !entry.detail || !entry.artIds.length) errors.push(`${entry.id || 'unknown'} chapter is incomplete.`);
    for (const artId of entry.artIds) if (!getCityVectorArtAsset(artId)) errors.push(`${entry.id || 'unknown'} references unknown art: ${artId}.`);
    if (entry.localOnly !== true || entry.remoteNetwork !== false || entry.userData !== false || entry.finalBinaryArt !== false) errors.push(`${entry.id || 'unknown'} chapter violates the source-art boundary.`);
  }
  for (const entry of EON_CITY_DEEP_ART_PLACEMENTS) {
    if (!/^[a-z0-9-]{4,64}$/.test(entry.id || '') || placementIds.has(entry.id)) errors.push('Deep-art placement id is invalid or duplicated.');
    placementIds.add(entry.id);
    if (!['backdrop', 'floor-decal', 'prop'].includes(entry.layer)) errors.push(`${entry.id || 'unknown'} has an unsupported visual layer.`);
    if (!getCityVectorArtAsset(entry.artId)) errors.push(`${entry.id || 'unknown'} references unknown art: ${entry.artId}.`);
    if (!Number.isFinite(Number(entry.position?.x)) || !Number.isFinite(Number(entry.position?.y)) || !Number.isFinite(Number(entry.position?.z))) errors.push(`${entry.id || 'unknown'} needs bounded local coordinates.`);
    if (!Number.isFinite(Number(entry.width)) || entry.width <= 0 || !Number.isFinite(Number(entry.height)) || entry.height <= 0) errors.push(`${entry.id || 'unknown'} has invalid dimensions.`);
    if (!Array.isArray(entry.qualities) || !entry.qualities.length || !entry.qualities.every((value) => ['lite', 'balanced', 'cinematic'].includes(value))) errors.push(`${entry.id || 'unknown'} has invalid quality selection.`);
    if (entry.localOnly !== true || entry.remoteNetwork !== false || entry.userData !== false || entry.finalBinaryArt !== false || entry.capturesMedia !== false || entry.uploadsMedia !== false) errors.push(`${entry.id || 'unknown'} violates the deep-art safety boundary.`);
  }
  return freeze({ schema: EON_CITY_DEEP_ART_DIRECTION_SCHEMA, ok: errors.length === 0, errors: freeze(errors), chapterCount: EON_CITY_DEEP_ART_CHAPTERS.length, placementCount: EON_CITY_DEEP_ART_PLACEMENTS.length, localOnly: true });
}
