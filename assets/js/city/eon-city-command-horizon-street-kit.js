/**
 * W568 — Command Horizon original procedural street-kit contract.
 *
 * This module describes bounded, browser-side geometry dressing for the first
 * City district. It contains no binary asset, loader, network request,
 * storage, telemetry, project data, account data, or entitlement logic.
 */
import { getCityPlayArtBudget } from './eon-city-play-art-direction.js';

export const EON_CITY_COMMAND_HORIZON_STREET_KIT_SCHEMA = 'eon.city.command-horizon-street-kit.w568.v1';

const QUALITY_PROFILES = Object.freeze({
  lite: Object.freeze({ curbCount: 4, railCount: 0, planterCount: 0, rainChannelCount: 2, wayfindingCount: 2, paverGuideCount: 0 }),
  balanced: Object.freeze({ curbCount: 8, railCount: 4, planterCount: 2, rainChannelCount: 4, wayfindingCount: 3, paverGuideCount: 4 }),
  cinematic: Object.freeze({ curbCount: 12, railCount: 6, planterCount: 4, rainChannelCount: 6, wayfindingCount: 5, paverGuideCount: 6 })
});

export const EON_CITY_COMMAND_HORIZON_STREET_KIT_PROFILES = QUALITY_PROFILES;

const SAFE_ID = /^[a-z][a-z0-9-]{2,79}$/;
const SAFE_ACCENTS = new Set(['cyan', 'teal', 'violet', 'amber', 'mint']);
const VALID_QUALITY = new Set(Object.keys(QUALITY_PROFILES));
const MAX_COORDINATE = 14;
const freeze = (value) => Object.freeze(value);
const boundedNumber = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
const exactKeys = (value, keys) => Object.keys(value && typeof value === 'object' ? value : {}).every((key) => keys.includes(key));
const cloneEntry = (entry) => freeze({ ...entry });
const cloneEntries = (entries) => freeze(entries.map(cloneEntry));

function makeBox(id, x, z, width, depth) {
  return freeze({ id, x, z, width, depth });
}

function makePlanter(id, x, z, scale) {
  return freeze({ id, x, z, scale });
}

function makeMarker(id, x, z, accent) {
  return freeze({ id, x, z, accent });
}

function getProfile(quality) {
  return QUALITY_PROFILES[quality] || QUALITY_PROFILES.balanced;
}

function buildCurbs(count) {
  const candidates = [
    makeBox('curb-north-west', -4.2, -0.9, 0.16, 11.9),
    makeBox('curb-north-east', 4.2, -0.9, 0.16, 11.9),
    makeBox('curb-arrival-west', -1.84, 7.9, 0.12, 8.9),
    makeBox('curb-arrival-east', 1.84, 7.9, 0.12, 8.9),
    makeBox('curb-plaza-north', 0, -9.83, 7.8, 0.14),
    makeBox('curb-plaza-south', 0, -1.65, 7.8, 0.14),
    makeBox('curb-relay-branch', -6.72, 3.02, 8.2, 0.14),
    makeBox('curb-observatory-branch', 6.72, -3.02, 8.2, 0.14),
    makeBox('curb-west-edge', -11.1, -2.7, 0.14, 5.3),
    makeBox('curb-east-edge', 11.1, 2.7, 0.14, 5.3),
    makeBox('curb-command-left', -5.25, -5.75, 0.12, 3.2),
    makeBox('curb-command-right', 5.25, -5.75, 0.12, 3.2)
  ];
  return cloneEntries(candidates.slice(0, count));
}

function buildRainChannels(count) {
  const candidates = [
    makeBox('rain-channel-west', -4.02, -0.9, 0.08, 11.65),
    makeBox('rain-channel-east', 4.02, -0.9, 0.08, 11.65),
    makeBox('rain-channel-arrival-west', -1.7, 7.9, 0.055, 8.6),
    makeBox('rain-channel-arrival-east', 1.7, 7.9, 0.055, 8.6),
    makeBox('rain-channel-relay', -6.72, 2.83, 7.8, 0.055),
    makeBox('rain-channel-observatory', 6.72, -2.83, 7.8, 0.055)
  ];
  return cloneEntries(candidates.slice(0, count));
}

function buildRails(count) {
  const candidates = [
    makeBox('rail-plaza-west', -5.55, -5.75, 0.1, 2.8),
    makeBox('rail-plaza-east', 5.55, -5.75, 0.1, 2.8),
    makeBox('rail-relay-side', -9.15, 3.85, 0.1, 2.5),
    makeBox('rail-observatory-side', 9.15, -3.85, 0.1, 2.5),
    makeBox('rail-arrival-west', -3.72, 9.1, 0.1, 2.2),
    makeBox('rail-arrival-east', 3.72, 9.1, 0.1, 2.2)
  ];
  return cloneEntries(candidates.slice(0, count));
}

function buildPlanters(count) {
  const candidates = [
    makePlanter('planter-relay', -9.72, 1.8, 0.92),
    makePlanter('planter-observatory', 9.72, -1.8, 0.92),
    makePlanter('planter-plaza-west', -5.85, -8.25, 0.8),
    makePlanter('planter-plaza-east', 5.85, -8.25, 0.8)
  ];
  return cloneEntries(candidates.slice(0, count));
}

function buildWayfinding(count) {
  const candidates = [
    makeMarker('wayfinding-arrival', 0, 4.62, 'cyan'),
    makeMarker('wayfinding-command', 0, -2.55, 'teal'),
    makeMarker('wayfinding-relay', -7.95, 3.55, 'amber'),
    makeMarker('wayfinding-observatory', 7.95, -3.55, 'mint'),
    makeMarker('wayfinding-plaza', 0, -8.55, 'violet')
  ];
  return cloneEntries(candidates.slice(0, count));
}

function buildPaverGuides(count) {
  const candidates = [
    makeBox('paver-arrival-1', 0, 3.72, 1.24, 0.045),
    makeBox('paver-arrival-2', 0, 5.46, 1.24, 0.045),
    makeBox('paver-command-1', 0, -1.38, 1.24, 0.045),
    makeBox('paver-command-2', 0, -3.14, 1.24, 0.045),
    makeBox('paver-relay', -5.62, 3.44, 1.1, 0.045),
    makeBox('paver-observatory', 5.62, -3.44, 1.1, 0.045)
  ];
  return cloneEntries(candidates.slice(0, count));
}

function makeProps(profile) {
  return freeze({
    curbs: buildCurbs(profile.curbCount),
    rails: buildRails(profile.railCount),
    planters: buildPlanters(profile.planterCount),
    rainChannels: buildRainChannels(profile.rainChannelCount),
    wayfinding: buildWayfinding(profile.wayfindingCount),
    paverGuides: buildPaverGuides(profile.paverGuideCount)
  });
}

/**
 * Creates the exact quality-bounded plan used by the live Babylon scene.
 * The plan contains geometry descriptors only; it never names or requests an
 * external model, texture, image, audio asset, user field, or service.
 */
export function getEonCityCommandHorizonStreetKitPlan({ quality = 'balanced' } = {}) {
  const resolvedQuality = VALID_QUALITY.has(quality) ? quality : 'balanced';
  const profile = getProfile(resolvedQuality);
  const artBudget = getCityPlayArtBudget(resolvedQuality);
  const props = makeProps(profile);
  const decorativePropCount = props.rails.length + props.planters.length + props.wayfinding.length;
  return freeze({
    schema: EON_CITY_COMMAND_HORIZON_STREET_KIT_SCHEMA,
    quality: resolvedQuality,
    originalProcedural: true,
    binaryAssets: false,
    remoteAssets: false,
    userData: false,
    props,
    budgets: freeze({
      streetProps: artBudget.streetProps,
      signCount: artBudget.signCount,
      decorativePropCount,
      decorativePropBudgetRespected: decorativePropCount <= artBudget.streetProps
    })
  });
}

function validateBoxList(entries, expectedCount, prefix, errors) {
  if (!Array.isArray(entries) || entries.length !== expectedCount) {
    errors.push(`${prefix}-count-invalid`);
    return;
  }
  const ids = new Set();
  for (const entry of entries) {
    if (!exactKeys(entry, ['id', 'x', 'z', 'width', 'depth'])) errors.push(`${prefix}-has-unknown-fields`);
    if (!SAFE_ID.test(String(entry?.id || '')) || ids.has(entry?.id)) errors.push(`${prefix}-id-invalid-or-duplicate`);
    ids.add(entry?.id);
    if (!boundedNumber(entry?.x, -MAX_COORDINATE, MAX_COORDINATE) || !boundedNumber(entry?.z, -MAX_COORDINATE, MAX_COORDINATE)) errors.push(`${prefix}-position-out-of-bounds`);
    if (!boundedNumber(entry?.width, 0.03, 14) || !boundedNumber(entry?.depth, 0.03, 14)) errors.push(`${prefix}-dimensions-invalid`);
  }
}

function validatePlanterList(entries, expectedCount, errors) {
  if (!Array.isArray(entries) || entries.length !== expectedCount) {
    errors.push('planters-count-invalid');
    return;
  }
  const ids = new Set();
  for (const entry of entries) {
    if (!exactKeys(entry, ['id', 'x', 'z', 'scale'])) errors.push('planters-has-unknown-fields');
    if (!SAFE_ID.test(String(entry?.id || '')) || ids.has(entry?.id)) errors.push('planters-id-invalid-or-duplicate');
    ids.add(entry?.id);
    if (!boundedNumber(entry?.x, -MAX_COORDINATE, MAX_COORDINATE) || !boundedNumber(entry?.z, -MAX_COORDINATE, MAX_COORDINATE) || !boundedNumber(entry?.scale, 0.5, 1.2)) errors.push('planters-values-invalid');
  }
}

function validateWayfindingList(entries, expectedCount, errors) {
  if (!Array.isArray(entries) || entries.length !== expectedCount) {
    errors.push('wayfinding-count-invalid');
    return;
  }
  const ids = new Set();
  for (const entry of entries) {
    if (!exactKeys(entry, ['id', 'x', 'z', 'accent'])) errors.push('wayfinding-has-unknown-fields');
    if (!SAFE_ID.test(String(entry?.id || '')) || ids.has(entry?.id)) errors.push('wayfinding-id-invalid-or-duplicate');
    ids.add(entry?.id);
    if (!boundedNumber(entry?.x, -MAX_COORDINATE, MAX_COORDINATE) || !boundedNumber(entry?.z, -MAX_COORDINATE, MAX_COORDINATE) || !SAFE_ACCENTS.has(entry?.accent)) errors.push('wayfinding-values-invalid');
  }
}

/** Validates only the geometry descriptor contract; it has no side effects. */
export function validateEonCityCommandHorizonStreetKitPlan(plan = {}) {
  const errors = [];
  const value = plan && typeof plan === 'object' ? plan : {};
  const expected = getProfile(value.quality);
  const budget = getCityPlayArtBudget(value.quality);
  if (!exactKeys(value, ['schema', 'quality', 'originalProcedural', 'binaryAssets', 'remoteAssets', 'userData', 'props', 'budgets'])) errors.push('plan-has-unknown-or-sensitive-fields');
  if (value.schema !== EON_CITY_COMMAND_HORIZON_STREET_KIT_SCHEMA) errors.push('plan-schema-invalid');
  if (!VALID_QUALITY.has(value.quality)) errors.push('plan-quality-invalid');
  if (value.originalProcedural !== true || value.binaryAssets !== false || value.remoteAssets !== false || value.userData !== false) errors.push('plan-truth-flags-invalid');
  if (!exactKeys(value.props, ['curbs', 'rails', 'planters', 'rainChannels', 'wayfinding', 'paverGuides'])) errors.push('props-has-unknown-or-sensitive-fields');
  validateBoxList(value.props?.curbs, expected.curbCount, 'curbs', errors);
  validateBoxList(value.props?.rails, expected.railCount, 'rails', errors);
  validatePlanterList(value.props?.planters, expected.planterCount, errors);
  validateBoxList(value.props?.rainChannels, expected.rainChannelCount, 'rain-channels', errors);
  validateWayfindingList(value.props?.wayfinding, expected.wayfindingCount, errors);
  validateBoxList(value.props?.paverGuides, expected.paverGuideCount, 'paver-guides', errors);
  const decorativePropCount = (value.props?.rails?.length || 0) + (value.props?.planters?.length || 0) + (value.props?.wayfinding?.length || 0);
  if (!exactKeys(value.budgets, ['streetProps', 'signCount', 'decorativePropCount', 'decorativePropBudgetRespected'])) errors.push('budgets-has-unknown-fields');
  if (value.budgets?.streetProps !== budget.streetProps || value.budgets?.signCount !== budget.signCount) errors.push('budgets-do-not-match-city-profile');
  if (value.budgets?.decorativePropCount !== decorativePropCount || value.budgets?.decorativePropBudgetRespected !== (decorativePropCount <= budget.streetProps)) errors.push('decorative-prop-budget-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), decorativePropCount, maxStreetProps: budget.streetProps });
}

export function getEonCityCommandHorizonStreetKitTruth({ quality = 'balanced' } = {}) {
  const plan = getEonCityCommandHorizonStreetKitPlan({ quality });
  const validation = validateEonCityCommandHorizonStreetKitPlan(plan);
  return freeze({
    schema: EON_CITY_COMMAND_HORIZON_STREET_KIT_SCHEMA,
    quality: plan.quality,
    valid: validation.ok,
    originalProcedural: true,
    binaryAssets: false,
    remoteAssets: false,
    userData: false,
    fetchesAssets: false,
    proxiesAssets: false,
    storesUserData: false,
    decorativePropCount: validation.decorativePropCount,
    maxStreetProps: validation.maxStreetProps,
    qualityFallbackRespected: plan.quality === 'lite' ? validation.decorativePropCount <= 2 : true
  });
}
