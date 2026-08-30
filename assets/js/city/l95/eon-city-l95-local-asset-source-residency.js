/**
 * L95 same-session source residency audit for W731 progressive City assets.
 *
 * Network bytes are already protected by the content-addressed browser cache.
 * This contract focuses on the separate cost of parsing/decoding the same GLB
 * source more than once for different logical City instances in one session.
 * It is intentionally Babylon-free so the manifest can be audited in CI.
 */

export const EON_CITY_L95_LOCAL_ASSET_SOURCE_RESIDENCY_SCHEMA = 'eon.city.local-asset-source-residency.l95.v1';

const freeze = (value) => Object.freeze(value);
const GROUPS = freeze(['coreLazy', 'coreWorld', 'stationWorld', 'stationProps', 'discoveryWorld', 'roleCharacters', 'ambientAssets']);

function normalizeQuality(value = 'balanced') {
  const quality = String(value || '').trim().toLowerCase();
  return ['lite', 'balanced', 'cinematic'].includes(quality) ? quality : 'balanced';
}

function entriesForQuality(manifest, quality) {
  const budget = manifest?.budgets?.[quality] || manifest?.budgets?.balanced || {};
  return [
    ...(manifest?.coreLazy || []).map((entry) => ({ group: 'coreLazy', entry })),
    ...(manifest?.coreWorld || []).map((entry) => ({ group: 'coreWorld', entry })),
    ...(manifest?.stationWorld || []).slice(0, Math.max(0, Number(budget.stationWorld || 0))).map((entry) => ({ group: 'stationWorld', entry })),
    ...(manifest?.stationProps || []).slice(0, Math.max(0, Number(budget.stationProps || 0))).map((entry) => ({ group: 'stationProps', entry })),
    ...(manifest?.discoveryWorld || []).slice(0, Math.max(0, Number(budget.discoveryWorld || 0))).map((entry) => ({ group: 'discoveryWorld', entry })),
    ...(manifest?.roleCharacters || []).slice(0, Math.max(0, Number(budget.roleCharacters || 0))).map((entry) => ({ group: 'roleCharacters', entry })),
    ...(manifest?.ambientAssets || []).slice(0, Math.max(0, Number(budget.ambientAssets || 0))).map((entry) => ({ group: 'ambientAssets', entry }))
  ];
}

function sourceKey(entry) {
  return String(entry?.sourceId || entry?.variants?.primary?.path || entry?.id || entry?.alias || '').trim();
}

function isContentHashedGlb(path = '') {
  return /^\/assets\/city\/w649\/(?:primary|fallback)\/(?:characters|world)\/.+\.[a-f0-9]{12}\.glb$/i.test(String(path || ''));
}

function summarizeFamily(key, refs) {
  const primaryPaths = [...new Set(refs.map(({ entry }) => String(entry?.variants?.primary?.path || '')).filter(Boolean))];
  const fallbackPaths = [...new Set(refs.map(({ entry }) => String(entry?.variants?.fallback?.path || '')).filter(Boolean))];
  const allStaticWorld = refs.every(({ entry }) => entry?.kind === 'world' && /\/world\//.test(String(entry?.variants?.primary?.path || '')) && (entry?.animations || []).length === 0);
  const anyCharacter = refs.some(({ entry }) => entry?.kind === 'character' || /\/characters\//.test(String(entry?.variants?.primary?.path || '')));
  return freeze({
    sourceKey: key,
    sourceId: String(refs[0]?.entry?.sourceId || ''),
    logicalReferences: refs.length,
    groups: freeze([...new Set(refs.map(({ group }) => group))]),
    aliases: freeze(refs.map(({ entry }) => String(entry?.alias || ''))),
    kinds: freeze([...new Set(refs.map(({ entry }) => String(entry?.kind || '')))]),
    primaryPaths: freeze(primaryPaths),
    fallbackPaths: freeze(fallbackPaths),
    duplicate: refs.length > 1,
    staticPoolCandidate: refs.length > 1 && allStaticWorld,
    animatedOrCharacterReuse: refs.length > 1 && anyCharacter
  });
}

export function getEonCityL95LocalAssetSourceKey(entry) {
  return sourceKey(entry);
}

export function auditEonCityL95LocalAssetSourceResidency(manifest, { quality = 'balanced' } = {}) {
  const normalizedQuality = normalizeQuality(quality);
  const refs = entriesForQuality(manifest, normalizedQuality);
  const families = new Map();
  const variantPathRefs = new Map();

  for (const ref of refs) {
    const key = sourceKey(ref.entry);
    if (!key) continue;
    if (!families.has(key)) families.set(key, []);
    families.get(key).push(ref);
    for (const variantName of ['primary', 'fallback']) {
      const path = String(ref.entry?.variants?.[variantName]?.path || '');
      if (!path) continue;
      if (!variantPathRefs.has(path)) variantPathRefs.set(path, []);
      variantPathRefs.get(path).push({ ...ref, variantName });
    }
  }

  const sourceFamilies = [...families.entries()].map(([key, familyRefs]) => summarizeFamily(key, familyRefs));
  const duplicateFamilies = sourceFamilies.filter((family) => family.duplicate);
  const duplicateVariantPaths = [...variantPathRefs.entries()].filter(([, pathRefs]) => pathRefs.length > 1);
  const variantPaths = [...variantPathRefs.keys()];
  const contentAddressed = variantPaths.every(isContentHashedGlb);
  const sameOrigin = variantPaths.every((path) => String(path).startsWith('/'));

  return freeze({
    schema: EON_CITY_L95_LOCAL_ASSET_SOURCE_RESIDENCY_SCHEMA,
    quality: normalizedQuality,
    logicalEntryCount: refs.length,
    uniqueSourceCount: sourceFamilies.length,
    duplicateSourceCount: duplicateFamilies.length,
    duplicateLogicalReferenceCount: duplicateFamilies.reduce((total, family) => total + Math.max(0, family.logicalReferences - 1), 0),
    variantReferenceCount: refs.length * 2,
    uniqueVariantPathCount: variantPaths.length,
    duplicateVariantPathCount: duplicateVariantPaths.length,
    duplicateVariantReferenceCount: duplicateVariantPaths.reduce((total, [, pathRefs]) => total + Math.max(0, pathRefs.length - 1), 0),
    staticPoolCandidateCount: duplicateFamilies.filter((family) => family.staticPoolCandidate).length,
    animatedOrCharacterReuseCount: duplicateFamilies.filter((family) => family.animatedOrCharacterReuse).length,
    contentAddressed,
    sameOrigin,
    sourceFamilies: freeze(sourceFamilies),
    duplicateSources: freeze(duplicateFamilies),
    truth: freeze({
      browserCacheControlsNetworkResidency: true,
      sameSessionDecodeResidencyIsSeparate: true,
      duplicateSourceLoadsMustNotDecodeConcurrently: true,
      staticPoolingRequiresBrowserProofBeforeDefault: true,
      animatedCharactersMustNotBeBlindlyGpuInstanced: true
    })
  });
}

export function validateEonCityL95LocalAssetSourceResidency(report) {
  const errors = [];
  if (report?.schema !== EON_CITY_L95_LOCAL_ASSET_SOURCE_RESIDENCY_SCHEMA) errors.push('schema');
  if (!Number.isInteger(report?.logicalEntryCount) || report.logicalEntryCount < 1) errors.push('logical-entry-count');
  if (!Number.isInteger(report?.uniqueSourceCount) || report.uniqueSourceCount < 1 || report.uniqueSourceCount > report.logicalEntryCount) errors.push('unique-source-count');
  if (report?.contentAddressed !== true) errors.push('content-addressed');
  if (report?.sameOrigin !== true) errors.push('same-origin');
  if (report?.truth?.duplicateSourceLoadsMustNotDecodeConcurrently !== true) errors.push('decode-serialization-truth');
  if (report?.truth?.staticPoolingRequiresBrowserProofBeforeDefault !== true) errors.push('pooling-proof-truth');
  if (report?.truth?.animatedCharactersMustNotBeBlindlyGpuInstanced !== true) errors.push('character-instancing-truth');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export const EON_CITY_L95_LOCAL_ASSET_SOURCE_GROUPS = GROUPS;
