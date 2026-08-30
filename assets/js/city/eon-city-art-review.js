/**
 * W421 — EON City local art review and cinematic composition kit.
 *
 * This module is intentionally presentation-only: it exposes the original
 * source-controlled vector art and bounded camera compositions so a person can
 * inspect the real shipped fallback. It takes no screenshot, uploads no media,
 * queries no device, and never upgrades the City to a final-art claim.
 */
import { getCityCinematicArtDirection, normalizeCityCinematicArtQuality } from './eon-city-cinematic-art-direction.js';
import { getCityVectorArtPlan, getCityVectorArtSummary, normalizeCityVectorArtQuality } from './eon-city-vector-art-kit.js';
import { getCityDeepArtChapters, getCityDeepArtDirectionSummary } from './eon-city-deep-art-direction.js';

export const EON_CITY_ART_REVIEW_SCHEMA = 'eon.city.art-review.w421.v1';

const shot = (entry) => Object.freeze({
  localOnly: true,
  opensRoute: false,
  capturesMedia: false,
  uploadsMedia: false,
  finalVisualCertification: false,
  ...entry,
  camera: Object.freeze({ ...entry.camera }),
  target: Object.freeze({ ...entry.target }),
  operator: Object.freeze({ ...entry.operator })
});

/**
 * Art-directed viewpoints retain a stable, reachable operator position and a
 * bounded camera. They are designed for manual review only; live movement can
 * immediately take over again.
 */
export const EON_CITY_CINEMATIC_SHOTS = Object.freeze([
  shot({
    id: 'arrival-gate',
    title: 'Arrival Gate',
    detail: 'Wet street, entry frame, local skyline and first-mission beacon.',
    accent: 'cyan',
    operator: { x: 0, y: 0, z: 7.8, heading: Math.PI },
    target: { x: 0, y: 2.5, z: -3.8 },
    camera: { alpha: -Math.PI / 4, beta: 1.08, radius: 18.8 }
  }),
  shot({
    id: 'command-deck',
    title: 'Command Deck',
    detail: 'PBR command plaza, monogram and neon command sightline.',
    accent: 'violet',
    operator: { x: 0, y: 0, z: -10.72, heading: Math.PI },
    target: { x: 0, y: 2.35, z: -8.0 },
    camera: { alpha: -Math.PI / 2, beta: 1.0, radius: 12.4 }
  }),
  shot({
    id: 'creator-atrium',
    title: 'Creator Atrium',
    detail: 'Glass, prism-color and local Creator/Forge wayfinding.',
    accent: 'mint',
    operator: { x: -1.92, y: 0, z: -10.68, heading: Math.PI },
    target: { x: -2.0, y: 2.25, z: -7.55 },
    camera: { alpha: -1.43, beta: 1.02, radius: 12.7 }
  }),
  shot({
    id: 'forge-bay',
    title: 'Forge Bay',
    detail: 'Graphite, circuit inlay and workshop silhouette composition.',
    accent: 'amber',
    operator: { x: -8.4, y: 0, z: -0.68, heading: Math.PI },
    target: { x: -7.35, y: 2.3, z: 1.2 },
    camera: { alpha: -1.21, beta: 1.04, radius: 14.4 }
  }),
  shot({
    id: 'signal-tower',
    title: 'Signal Tower',
    detail: 'Vertical signal landmark, skyline depth and violet route marks.',
    accent: 'violet',
    operator: { x: -8.5, y: 0, z: 6.2, heading: Math.PI },
    target: { x: -7.2, y: 3.4, z: 6.4 },
    camera: { alpha: -1.68, beta: 1.0, radius: 14.2 }
  }),
  shot({
    id: 'archive-gardens',
    title: 'Archive Gardens',
    detail: 'Quiet archive light, mint wayfinding and amber contrast.',
    accent: 'mint',
    operator: { x: 8.5, y: 0, z: -0.1, heading: Math.PI },
    target: { x: 7.5, y: 2.45, z: -2.8 },
    camera: { alpha: -1.05, beta: 1.03, radius: 13.6 }
  }),
  shot({
    id: 'automation-observatory',
    title: 'Automation Observatory',
    detail: 'Orbital mesh, local observatory glyph and mint industrial sightline.',
    accent: 'mint',
    operator: { x: 10.15, y: 0, z: -0.25, heading: Math.PI },
    target: { x: 10.15, y: 2.7, z: 1.65 },
    camera: { alpha: -1.21, beta: 1.0, radius: 14.2 }
  }),
  shot({
    id: 'relay-courtyard',
    title: 'Relay Courtyard',
    detail: 'Amber relay emblem, bounded local kiosk and transit silhouette composition.',
    accent: 'amber',
    operator: { x: -7.2, y: 0, z: 2.5, heading: Math.PI },
    target: { x: -7.2, y: 2.1, z: 5.05 },
    camera: { alpha: -1.58, beta: 1.05, radius: 13.2 }
  }),
  shot({
    id: 'expedition-threshold',
    title: 'Signal Expedition Threshold',
    detail: 'Four finite expedition marks and a portal ring; this is an art view, not a new world launch.',
    accent: 'violet',
    operator: { x: -10.35, y: 0, z: 5.9, heading: Math.PI },
    target: { x: -10.35, y: 1.6, z: 3.68 },
    camera: { alpha: -1.61, beta: 1.02, radius: 12.8 }
  }),
  shot({
    id: 'skyline-overlook',
    title: 'Skyline Overlook',
    detail: 'Layered local moon-grid, rain veil, City skyline and command route composition.',
    accent: 'cyan',
    operator: { x: 0, y: 0, z: 3.9, heading: Math.PI },
    target: { x: 0, y: 5.4, z: -13.2 },
    camera: { alpha: -Math.PI / 2, beta: .93, radius: 22.2 }
  })
]);

const SHOT_BY_ID = new Map(EON_CITY_CINEMATIC_SHOTS.map((entry) => [entry.id, entry]));

export function getCityCinematicShot(id = '') {
  return SHOT_BY_ID.get(String(id || '').trim()) || null;
}

export function getCityCinematicShots() {
  return EON_CITY_CINEMATIC_SHOTS;
}

export function getCityArtReviewSummary({ quality = 'balanced' } = {}) {
  const resolvedQuality = normalizeCityCinematicArtQuality(normalizeCityVectorArtQuality(quality));
  const vectorPlan = getCityVectorArtPlan({ quality: resolvedQuality });
  const vectorSummary = getCityVectorArtSummary({ quality: resolvedQuality });
  const artDirection = getCityCinematicArtDirection({ quality: resolvedQuality });
  const deepArt = getCityDeepArtDirectionSummary({ quality: resolvedQuality });
  const byCategory = vectorPlan.entries.reduce((result, entry) => {
    result[entry.category] = Number(result[entry.category] || 0) + 1;
    return result;
  }, {});
  return Object.freeze({
    schema: EON_CITY_ART_REVIEW_SCHEMA,
    quality: resolvedQuality,
    vectorArt: vectorSummary,
    originalArtEntries: vectorPlan.entries,
    originalArtCategories: Object.freeze({ ...byCategory }),
    artDirection,
    deepArt,
    artChapters: getCityDeepArtChapters(),
    cinematicShots: EON_CITY_CINEMATIC_SHOTS,
    originalVectorArtShipped: true,
    binaryArtShipped: false,
    localOnly: true,
    remoteNetwork: false,
    screenshotCapture: false,
    mediaUpload: false,
    deviceProbe: false,
    finalVisualCertification: false,
    finalInstitutionalArtClaim: false
  });
}

export function validateCityArtReview() {
  const errors = [];
  const ids = new Set();
  if (EON_CITY_CINEMATIC_SHOTS.length < 6) errors.push('W421 requires at least six local cinematic shots.');
  for (const entry of EON_CITY_CINEMATIC_SHOTS) {
    if (!/^[a-z0-9-]{3,40}$/.test(entry.id || '')) errors.push('A cinematic shot id is invalid.');
    if (ids.has(entry.id)) errors.push(`Duplicate cinematic shot: ${entry.id}.`);
    ids.add(entry.id);
    if (!entry.title || !entry.detail) errors.push(`${entry.id || 'unknown'} requires review copy.`);
    if (!['cyan', 'violet', 'mint', 'amber'].includes(entry.accent)) errors.push(`${entry.id || 'unknown'} has an unsupported accent.`);
    for (const field of ['alpha', 'beta', 'radius']) {
      if (!Number.isFinite(Number(entry.camera?.[field]))) errors.push(`${entry.id || 'unknown'} has an invalid camera value.`);
    }
    if (entry.camera?.radius < 10 || entry.camera?.radius > 24 || entry.camera?.beta < .7 || entry.camera?.beta > 1.36) errors.push(`${entry.id || 'unknown'} camera is outside City safety bounds.`);
    for (const point of [entry.target, entry.operator]) {
      if (!Number.isFinite(Number(point?.x)) || !Number.isFinite(Number(point?.y)) || !Number.isFinite(Number(point?.z))) errors.push(`${entry.id || 'unknown'} needs bounded local coordinates.`);
    }
    if (entry.localOnly !== true || entry.opensRoute !== false || entry.capturesMedia !== false || entry.uploadsMedia !== false || entry.finalVisualCertification !== false) errors.push(`${entry.id || 'unknown'} violates the local art-review boundary.`);
  }
  return Object.freeze({ schema: EON_CITY_ART_REVIEW_SCHEMA, ok: errors.length === 0, errors: Object.freeze(errors), shotCount: EON_CITY_CINEMATIC_SHOTS.length, localOnly: true });
}
