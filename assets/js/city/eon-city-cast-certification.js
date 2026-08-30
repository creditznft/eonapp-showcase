/**
 * W662G — truthful cast and animation certification projection.
 *
 * This module projects source-controlled W649 manifests into a readable roster.
 * It does not claim a GLB rendered, a fallback disappeared, or an animation
 * looked correct unless the active runtime supplies that observation.
 */
import { EON_CITY_W649_CHARACTER_MANIFEST } from './w649/eon-city-w649-character-manifest.js';
import { EON_CITY_W649_ANIMATION_MANIFEST } from './w649/eon-city-w649-animation-manifest.js';
import { EON_CITY_W649_DISTRICT_MANIFEST } from './w649/eon-city-w649-district-manifest.js';

export const EON_CITY_CAST_CERTIFICATION_SCHEMA = 'eon.city.cast-certification.w662g.v1';
const freeze = Object.freeze;

function clean(value = '', max = 160) {
  const normalized = Array.from(String(value || ''), (character) => {
    const codePoint = character.codePointAt(0) || 0;
    return codePoint <= 0x1f || codePoint === 0x7f ? ' ' : character;
  }).join('');
  return normalized.replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeRuntimeRows(runtimeSummary = {}) {
  const rows = Array.isArray(runtimeSummary?.w649?.characters)
    ? runtimeSummary.w649.characters
    : Array.isArray(runtimeSummary?.characterAssets)
      ? runtimeSummary.characterAssets
      : [];
  return new Map(rows.map((row = {}) => [String(row.id || row.assetId || ''), row]));
}

function requiredStates(character, animation) {
  if (character.id === 'eoncity-eonbot-orbit') return freeze(['hover', 'follow', 'inspect', 'dock']);
  if (character.id === 'eoncity-eonbot-charging-station') return freeze(['available', 'occupied', 'release']);
  const aliases = animation?.aliases || {};
  return freeze(['idle', 'walk', 'run', 'turn', 'inspect'].filter((state) => {
    if (state === 'turn') return Boolean(aliases.walk || aliases.idle);
    if (state === 'inspect') return Boolean(aliases.interact || aliases.talk || aliases.open || aliases.wave);
    return Boolean(aliases[state]);
  }));
}

export function getEonCityCastCertificationPlan({ runtimeSummary = {} } = {}) {
  const animations = new Map(EON_CITY_W649_ANIMATION_MANIFEST.entries.map((entry) => [entry.characterId, entry]));
  const runtime = normalizeRuntimeRows(runtimeSummary);
  const rows = EON_CITY_W649_CHARACTER_MANIFEST.entries.map((character) => {
    const profile = animations.get(character.id) || null;
    const observed = runtime.get(character.id) || {};
    const expected = requiredStates(character, profile);
    const observedAnimations = Array.isArray(observed.animationStates) ? observed.animationStates.map(String) : [];
    const primaryLoaded = observed.primaryLoaded === true || observed.variant === 'primary';
    const fallbackLoaded = observed.fallbackLoaded === true || observed.variant === 'fallback';
    return freeze({
      assetId: character.id,
      role: clean(character.role),
      district: clean(character.district),
      lifecycle: character.lifecycle,
      sourceFile: character.sourceFile,
      primaryPath: character.variants.primary.path,
      fallbackPath: character.variants.fallback.path,
      expectedAnimations: expected,
      clipCount: profile?.clipCount ?? character.animations ?? 0,
      aliases: freeze({ ...(profile?.aliases || {}) }),
      runtimeObserved: Boolean(Object.keys(observed).length),
      loaded: primaryLoaded || fallbackLoaded,
      primaryLoaded,
      fallbackLoaded,
      fallbackInactive: primaryLoaded && !fallbackLoaded,
      observedAnimations: freeze(observedAnimations),
      animationCoverage: freeze(expected.map((state) => freeze({ state, observed: observedAnimations.includes(state) }))),
      functionalRoleObserved: observed.functionalRoleObserved === true,
      terminalOrDockObserved: observed.terminalOrDockObserved === true,
      browserProofRequired: true
    });
  });
  const districtRows = EON_CITY_W649_DISTRICT_MANIFEST.districts.map((district) => freeze({
    id: district.id,
    assetCount: district.assets.length,
    characterIds: freeze(district.assets.filter((id) => animations.has(id) || id.includes('eonbot'))),
    actionCount: district.actions.length,
    proximityLoad: district.proximityLoad
  }));
  const counts = rows.reduce((summary, row) => {
    summary.loaded += row.loaded ? 1 : 0;
    summary.primary += row.primaryLoaded ? 1 : 0;
    summary.fallback += row.fallbackLoaded ? 1 : 0;
    summary.roleObserved += row.functionalRoleObserved ? 1 : 0;
    summary.linkObserved += row.terminalOrDockObserved ? 1 : 0;
    return summary;
  }, { total: rows.length, loaded: 0, primary: 0, fallback: 0, roleObserved: 0, linkObserved: 0 });
  return freeze({
    schema: EON_CITY_CAST_CERTIFICATION_SCHEMA,
    rows: freeze(rows),
    districts: freeze(districtRows),
    counts: freeze(counts),
    sourceManifestValid: true,
    automatedAssetProof: true,
    authenticatedHumanProof: false,
    status: counts.loaded === counts.total && counts.roleObserved === counts.total
      ? 'browser-proof-required'
      : 'source-certified-browser-proof-required',
    truth: freeze({
      sourcePresenceIsNotVisualCertification: true,
      fallbackPresenceIsNotFailure: true,
      primaryMustBeObservedBeforeFallbackInactive: true,
      animationNamesDoNotProveDeformationQuality: true,
      noPrivateDataRead: true,
      noNetworkRequest: true
    })
  });
}

export function renderEonCityCastCertificationMarkup(plan = getEonCityCastCertificationPlan()) {
  const esc = (value) => clean(value, 300).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  return `<p class="eon-play-cast-summary"><strong>${plan.counts.total} source-controlled cast assets</strong><span>${plan.counts.loaded} observed in this runtime · ${plan.counts.primary} primary · ${plan.counts.fallback} fallback</span><small>Source and hash checks can pass automatically. Model appearance, fallback replacement, animation deformation, role behavior and terminal/dock linkage still require real-browser observation.</small></p><div class="eon-play-cast-grid">${plan.rows.map((row) => `<article data-eon-cast-row="${esc(row.assetId)}" data-loaded="${row.loaded}" data-primary="${row.primaryLoaded}" data-fallback="${row.fallbackLoaded}"><div><strong>${esc(row.role)}</strong><small>${esc(row.district)}</small></div><p>${esc(row.assetId)}</p><ul><li>Runtime: ${row.loaded ? (row.primaryLoaded ? 'primary observed' : 'fallback observed') : 'not observed in this session'}</li><li>Expected motion: ${esc(row.expectedAnimations.join(', ') || 'procedural/static')}</li><li>Role link: ${row.functionalRoleObserved ? 'observed' : 'browser proof required'}</li><li>Terminal/dock: ${row.terminalOrDockObserved ? 'observed' : 'browser proof required'}</li></ul></article>`).join('')}</div>`;
}

export function getEonCityCastCertificationTruth() {
  return freeze({
    schema: EON_CITY_CAST_CERTIFICATION_SCHEMA,
    sourceManifestProjected: true,
    activeRuntimeCanSupplyObservations: true,
    sourcePresenceIsNotCompletion: true,
    humanProofRequired: true,
    fallbackTruthVisible: true,
    noFabricatedPass: true
  });
}

export default freeze({
  EON_CITY_CAST_CERTIFICATION_SCHEMA,
  getEonCityCastCertificationPlan,
  renderEonCityCastCertificationMarkup,
  getEonCityCastCertificationTruth
});
