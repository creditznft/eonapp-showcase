/** W649C — deterministic primary/fallback selection. */
export const EON_CITY_W649_CAPABILITY_SCHEMA = 'eon.city.w649.capability.v1';
const freeze = (value) => Object.freeze(value);
export function normalizeEonCityW649Capabilities(value = {}) {
  return freeze({
    schema: EON_CITY_W649_CAPABILITY_SCHEMA,
    meshoptDecoderReady: value.meshoptDecoderReady === true,
    webpTextureReady: value.webpTextureReady === true,
    reducedData: value.reducedData === true,
    deviceMemoryGb: Number.isFinite(Number(value.deviceMemoryGb)) ? Number(value.deviceMemoryGb) : null
  });
}
export function resolveEonCityW649AssetVariant(asset = {}, capabilities = {}) {
  const caps = normalizeEonCityW649Capabilities(capabilities);
  const primaryAllowed = caps.meshoptDecoderReady && caps.webpTextureReady && !caps.reducedData;
  const preferred = primaryAllowed ? 'primary' : 'fallback';
  const selected = asset?.variants?.[preferred] || asset?.variants?.fallback || asset?.variants?.primary || null;
  return freeze({ schema: EON_CITY_W649_CAPABILITY_SCHEMA, assetId: asset?.id || null, variant: selected ? preferred : 'missing', selected, primaryAllowed, reason: selected ? (primaryAllowed ? 'meshopt-webp-ready' : 'decoder-free-fallback') : 'asset-variant-missing' });
}
export async function detectEonCityW649WebpSupport({ documentRef = globalThis.document } = {}) {
  try {
    const canvas = documentRef?.createElement?.('canvas');
    return Boolean(canvas?.toDataURL?.('image/webp')?.startsWith('data:image/webp'));
  } catch { return false; }
}
export function validateEonCityW649CapabilityResolution(asset = {}) {
  const errors = [];
  const primary = resolveEonCityW649AssetVariant(asset, { meshoptDecoderReady: true, webpTextureReady: true });
  const fallback = resolveEonCityW649AssetVariant(asset, { meshoptDecoderReady: false, webpTextureReady: true });
  if (primary.variant !== 'primary') errors.push('primary');
  if (fallback.variant !== 'fallback') errors.push('fallback');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}
