/** W796A — authored Storm Sector NPC patrol plan. */
import { getEonCityW649Character } from '../w649/eon-city-w649-character-manifest.js';
import { EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST } from '../w792/eon-expanse-w792a-storm-sector-authored-package.js';

const freeze = Object.freeze;
const point = (x, y, z) => freeze({ x, y, z });
export const EON_EXPANSE_W796A_STORM_NPC_PLAN_SCHEMA = 'eon.expanse.storm-sector.npc-plan.w796a.v1';

const DEFINITIONS = freeze([
  freeze({ id: 'storm-warden', label: 'Storm Warden', assetAlias: 'security-sentinel', fallbackAlias: 'player-fallback', targetHeight: 2.2, speed: 1.25, zoneId: 'charged-gateway', briefing: 'The charged gateway is stable. Follow the active field marker in mission order.', route: freeze([point(948, 0.15, -170), point(958, 0.15, -162), point(968, 0.15, -174), point(956, 0.15, -184)]) }),
  freeze({ id: 'atmospheric-engineer', label: 'Atmospheric Engineer', assetAlias: 'device-lab-specialist', fallbackAlias: 'forge-worker', targetHeight: 2.16, speed: 1.05, zoneId: 'relay-basin', briefing: 'The weather and relay systems must be restored through explicit field checks.', route: freeze([point(994, 0.15, -142), point(1006, 0.15, -132), point(1020, 0.15, -146), point(1008, 0.15, -158)]) }),
  freeze({ id: 'rescue-scout', label: 'Rescue Scout', assetAlias: 'archive-guide', fallbackAlias: 'citizen-variant', targetHeight: 2.14, speed: 1.15, zoneId: 'storm-eye', briefing: 'The rescue signal is bounded inside the Storm Eye. Complete the active objective before advancing.', route: freeze([point(1106, 0.15, -184), point(1118, 0.15, -166), point(1132, 0.15, -180), point(1120, 0.15, -194)]) })
]);

function variant(asset, name) {
  const row = asset?.variants?.[name] || null;
  const path = String(row?.path || '');
  if (!/^\/assets\/city\/w649\/(primary|fallback)\/characters\/.+\.[a-f0-9]{12}\.glb$/i.test(path)) return null;
  return freeze({ path, bytes: Number(row.bytes || 0), sha256: String(row.sha256 || '') });
}
function resolve(alias) {
  const asset = getEonCityW649Character(alias);
  if (!asset || Number(asset.animations || 0) <= 0 || Number(asset.skins || 0) <= 0) return null;
  const primary = variant(asset, 'primary'); const fallback = variant(asset, 'fallback');
  return primary && fallback ? freeze({ assetId: asset.id, animationNames: freeze([...(asset.animationNames || [])]), primary, fallback }) : null;
}

export function createEonExpanseW796AStormNpcPlan() {
  const patrols = DEFINITIONS.map((definition) => freeze({
    ...definition,
    packageDigest: EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST,
    primaryAsset: resolve(definition.assetAlias),
    alternateAsset: resolve(definition.fallbackAlias),
    interactionAction: 'storm-npc-briefing',
    grantsXp: false,
    mutatesMissionState: false,
    automaticDialogue: false,
    privateContentStored: false
  }));
  return freeze({ schema: EON_EXPANSE_W796A_STORM_NPC_PLAN_SCHEMA, regionId: 'storm-sector', packageDigest: EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST, patrols: freeze(patrols), patrolCount: patrols.length, rawCoordinatesAccepted: false, developmentCharacterProxyCount: 0, privateContentStored: false });
}

export function validateEonExpanseW796AStormNpcPlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_EXPANSE_W796A_STORM_NPC_PLAN_SCHEMA || plan.regionId !== 'storm-sector' || plan.packageDigest !== EON_EXPANSE_W792A_STORM_SECTOR_PACKAGE_DIGEST) errors.push('identity-invalid');
  if (plan.patrolCount !== 3 || plan.patrols?.length !== 3) errors.push('patrol-count-invalid');
  for (const patrol of plan.patrols || []) {
    if (!patrol.id || !patrol.label || !patrol.zoneId || patrol.route?.length < 3 || !patrol.primaryAsset || !patrol.alternateAsset) errors.push(`patrol-invalid:${patrol.id || 'unknown'}`);
    if (!patrol.primaryAsset?.primary?.path || !patrol.primaryAsset?.fallback?.path || !patrol.primaryAsset?.animationNames?.length) errors.push(`asset-invalid:${patrol.id || 'unknown'}`);
    if (patrol.grantsXp || patrol.mutatesMissionState || patrol.automaticDialogue || patrol.privateContentStored) errors.push(`boundary-invalid:${patrol.id || 'unknown'}`);
  }
  if (plan.rawCoordinatesAccepted || plan.developmentCharacterProxyCount !== 0 || plan.privateContentStored) errors.push('plan-boundary-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({ EON_EXPANSE_W796A_STORM_NPC_PLAN_SCHEMA, createEonExpanseW796AStormNpcPlan, validateEonExpanseW796AStormNpcPlan });
