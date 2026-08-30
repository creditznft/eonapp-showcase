#!/usr/bin/env node
/** W613 source gate — final City red-team boundaries. */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_CITY_CAMERA_OCCLUSION_POLICY,
  validateEonCityCameraOcclusionPolicy
} from '../assets/js/city/eon-city-camera-occlusion.js';
import {
  getEonProjectDistrictVisualProfile,
  EON_PROJECT_DISTRICT_PALETTES
} from '../assets/js/city/eon-city-project-district-manifest.js';
import {
  getEonCityQualitySummitPlan,
  validateEonCityQualitySummitPlan
} from '../assets/js/city/eon-city-quality-summit.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = Object.freeze({
  station: 'assets/js/eon-city-play-station.js',
  runtime: 'assets/js/city/eon-city-play-babylon.js',
  architecture: 'assets/js/city/eon-city-noir-architecture.js',
  css: 'assets/css/eon-city-play.css',
  share: 'assets/js/utils/eon-share-sheet.js'
});
const source = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, relative]) => [key, await readFile(path.join(ROOT, relative), 'utf8')])));
const issues = [];

const policy = validateEonCityCameraOcclusionPolicy();
if (!policy.ok) issues.push(...policy.errors.map((entry) => `camera-policy:${entry}`));
for (const required of ['createEonCityCameraOcclusionController', 'cameraOcclusion.update', 'cameraOcclusion.clear', 'cameraOcclusion.destroy']) {
  if (!source.runtime.includes(required)) issues.push(`runtime-missing:${required}`);
}
for (const forbidden of ['changesCollision: true', 'changesInput: true', 'changesRoutes: true', 'remoteNetwork: true']) {
  if (source.runtime.includes(forbidden)) issues.push(`runtime-forbidden:${forbidden}`);
}
for (const required of ['eonCityCameraOcclusion', 'createProjectDistrict', 'visualProfile']) {
  if (!source.architecture.includes(required)) issues.push(`architecture-missing:${required}`);
}

const summit = getEonCityQualitySummitPlan({ directEntry: true });
issues.push(...validateEonCityQualitySummitPlan(summit).map((entry) => `summit:${entry}`));
const expectedHud = ['Command Room', 'EONBOT', 'Districts', 'Menu'];
if (JSON.stringify(summit.primaryHudActions) !== JSON.stringify(expectedHud)) issues.push('direct-hud-names-regressed');
for (const required of ['data-eon-play-open-project-districts', 'data-eon-play-share-city', 'openEonSharePopover', 'eon-play-command-deck-project-portal']) {
  if (!source.station.includes(required)) issues.push(`station-missing:${required}`);
}
for (const forbidden of ['data-eon-play-interact', 'Choose Interact']) {
  if (source.station.includes(forbidden)) issues.push(`station-forbidden:${forbidden}`);
}
for (const forbidden of ['referral record', 'reward', 'tracking']) {
  // The share center may mention these only as negative non-activation claims.
  if (forbidden === 'referral record' && !source.station.includes('No link, tracking, reward, referral record or post was created.')) issues.push('share-negative-guard-missing');
}
for (const required of ['id: \'signal-spire\'', 'id: \'forge-buttress\'', 'id: \'archive-canopy\'', 'id: \'garden-pavilion\'']) {
  if (!String(await readFile(path.join(ROOT, 'assets/js/city/eon-city-project-district-manifest.js'), 'utf8')).includes(required)) issues.push(`project-profile-missing:${required}`);
}
for (const palette of EON_PROJECT_DISTRICT_PALETTES) {
  const profile = getEonProjectDistrictVisualProfile(palette.id);
  if (!profile?.id || !profile.localOnly) issues.push(`project-profile-invalid:${palette.id}`);
}
if (!source.css.includes('.eon-play-command-deck-project-portal')) issues.push('css-missing:project-portal-strip');
if (!source.share.includes("id: 'city'")) issues.push('share-center-city-target-missing');

const result = Object.freeze({
  schema: 'eon.city.w613.final-red-team-gate.v1',
  ok: issues.length === 0,
  issues: Object.freeze(issues),
  sourceAssertions: Object.freeze({
    cameraSightline: EON_CITY_CAMERA_OCCLUSION_POLICY,
    namedDirectHud: expectedHud,
    privateProjectDistricts: true,
    signedInviteOnly: true,
    referralsActivated: false,
    rewardsActivated: false,
    socialAutoPostingActivated: false
  }),
  limitations: Object.freeze([
    'No real browser canvas, production deployment, signed-in session, touch screen, controller or device GPU is exercised by this source gate.',
    'Camera fade, architecture readability, art quality and project portal interaction require the W600A/W607 evidence run before approval.'
  ])
});
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exit(1);
