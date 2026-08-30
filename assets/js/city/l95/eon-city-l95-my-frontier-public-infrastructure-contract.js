/** L95 — pure My Frontier public-infrastructure contract (no Babylon dependency). */
import { getEonCityW649WorldAsset } from '../w649/eon-city-w649-world-manifest.js';
import { getEonCityW659fFunctionalAsset } from '../w659f/eon-city-w659f-functional-asset-manifest.js';

const freeze = Object.freeze;
const point = (x, y, z) => freeze({ x: Number(x), y: Number(y), z: Number(z) });
const QUALITY_RANK = freeze({ lite: 0, balanced: 1, cinematic: 2 });

export const EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE_SCHEMA = 'eon.city.l95.my-frontier-public-infrastructure.v1';

const placement = ({ id, district, sourceAuthority, assetId, x, z, rotationY, targetHeight, role, minimumQuality = 'balanced' }) => freeze({
  id,
  district,
  sourceAuthority,
  assetId,
  position: point(x, 0, z),
  rotationY: Number(rotationY || 0),
  targetHeight: Number(targetHeight),
  role,
  minimumQuality,
  ownership: 'public-infrastructure',
  interactive: false,
  grantsXp: false,
  grantsConstruction: false,
  mutatesMissionState: false,
  userBuilding: false,
  rawCoordinatesAccepted: false
});

export const EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE = freeze([
  placement({ id: 'central-map-beacon', district: 'central', sourceAuthority: 'w649-world', assetId: 'eoncity-holo-map-beacon', x: 11.5, z: 1.8, rotationY: -Math.PI / 2, targetHeight: 3.1, role: 'public district map', minimumQuality: 'lite' }),
  placement({ id: 'creator-public-work-pod', district: 'creator', sourceAuthority: 'w659f-functional', assetId: 'creator-work-pod', x: -31.5, z: -18.4, rotationY: Math.PI / 3, targetHeight: 3.5, role: 'public creator utilities', minimumQuality: 'balanced' }),
  placement({ id: 'knowledge-public-kiosk', district: 'knowledge', sourceAuthority: 'w649-world', assetId: 'eoncity-nav-info-kiosk', x: -10.2, z: -35.2, rotationY: Math.PI * 0.08, targetHeight: 2.25, role: 'public knowledge wayfinding', minimumQuality: 'lite' }),
  placement({ id: 'systems-public-relay', district: 'systems', sourceAuthority: 'w659f-functional', assetId: 'agent-theatre-relay-console', x: 30.5, z: -22.7, rotationY: -Math.PI / 3, targetHeight: 3.35, role: 'public systems relay', minimumQuality: 'balanced' }),
  placement({ id: 'signal-public-totem', district: 'signal', sourceAuthority: 'w659f-functional', assetId: 'command-signal-totem', x: 32.5, z: 14.5, rotationY: -Math.PI * 0.7, targetHeight: 3.15, role: 'public signal infrastructure', minimumQuality: 'lite' }),
  placement({ id: 'transit-public-arrival-gate', district: 'transit', sourceAuthority: 'w659f-functional', assetId: 'district-arrival-gate', x: 10.8, z: 35.1, rotationY: Math.PI * 0.84, targetHeight: 4.8, role: 'public transit threshold', minimumQuality: 'balanced' }),
  placement({ id: 'personal-public-eonbot-dock', district: 'personal', sourceAuthority: 'w659f-functional', assetId: 'eonbot-companion-dock', x: -31.2, z: 19.1, rotationY: Math.PI * 0.72, targetHeight: 2.7, role: 'public EONBOT dock', minimumQuality: 'lite' })
]);

function resolveAsset(entry) {
  if (entry.sourceAuthority === 'w649-world') return getEonCityW649WorldAsset(entry.assetId);
  if (entry.sourceAuthority === 'w659f-functional') return getEonCityW659fFunctionalAsset(entry.assetId);
  return null;
}

export function isEonCityL95MyFrontierPublicInfrastructureVariant(value) {
  return Boolean(value?.path?.startsWith('/assets/city/'))
    && /^\/assets\/city\/(w649|w659f)\/(primary|fallback)\/world\/.+\.[a-f0-9]{12}\.glb$/i.test(String(value?.path || ''))
    && Number(value?.bytes || 0) > 0
    && /^[a-f0-9]{64}$/i.test(String(value?.sha256 || ''));
}

export function createEonCityL95MyFrontierPublicInfrastructurePlan({ quality = 'balanced' } = {}) {
  const resolvedQuality = QUALITY_RANK[quality] == null ? 'balanced' : quality;
  const entries = EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE
    .filter((entry) => QUALITY_RANK[resolvedQuality] >= QUALITY_RANK[entry.minimumQuality])
    .map((entry) => {
      const asset = resolveAsset(entry);
      return freeze({ ...entry, variants: freeze({ primary: asset?.variants?.primary || null, fallback: asset?.variants?.fallback || null }), sourceStatus: asset?.status || '' });
    });
  return freeze({
    schema: EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE_SCHEMA,
    quality: resolvedQuality,
    entries: freeze(entries),
    authoredPlacementCount: entries.length,
    publicInfrastructureOnly: true,
    userBuildingCount: 0,
    automaticConstruction: false,
    grantsXp: false,
    mutatesMissionState: false,
    privateContentStored: false
  });
}

export function validateEonCityL95MyFrontierPublicInfrastructurePlan(plan = createEonCityL95MyFrontierPublicInfrastructurePlan()) {
  const errors = [];
  const entries = Array.isArray(plan?.entries) ? plan.entries : [];
  if (plan?.schema !== EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE_SCHEMA) errors.push('schema-invalid');
  if (new Set(entries.map((entry) => entry.id)).size !== entries.length) errors.push('placement-ids-unique');
  if (new Set(entries.map((entry) => entry.district)).size !== entries.length) errors.push('one-public-anchor-per-presented-district');
  for (const entry of entries) {
    if (!['w649-world', 'w659f-functional'].includes(entry.sourceAuthority) || entry.sourceStatus !== 'READY') errors.push(`source-invalid:${entry.id}`);
    if (!isEonCityL95MyFrontierPublicInfrastructureVariant(entry.variants?.primary) || !isEonCityL95MyFrontierPublicInfrastructureVariant(entry.variants?.fallback)) errors.push(`variant-invalid:${entry.id}`);
    if (![entry.position?.x, entry.position?.y, entry.position?.z, entry.rotationY, entry.targetHeight].every(Number.isFinite) || entry.targetHeight <= 0) errors.push(`transform-invalid:${entry.id}`);
    if (Math.hypot(entry.position.x, entry.position.z) < 10 || Math.hypot(entry.position.x, entry.position.z) > 39) errors.push(`public-ring-invalid:${entry.id}`);
    if (entry.ownership !== 'public-infrastructure' || entry.interactive || entry.grantsXp || entry.grantsConstruction || entry.mutatesMissionState || entry.userBuilding || entry.rawCoordinatesAccepted) errors.push(`truth-boundary-invalid:${entry.id}`);
  }
  if (!plan.publicInfrastructureOnly || plan.userBuildingCount || plan.automaticConstruction || plan.grantsXp || plan.mutatesMissionState || plan.privateContentStored) errors.push('plan-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), placementCount: entries.length, quality: plan?.quality || '' });
}

export default freeze({
  EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE_SCHEMA,
  EON_CITY_L95_MY_FRONTIER_PUBLIC_INFRASTRUCTURE,
  isEonCityL95MyFrontierPublicInfrastructureVariant,
  createEonCityL95MyFrontierPublicInfrastructurePlan,
  validateEonCityL95MyFrontierPublicInfrastructurePlan
});
