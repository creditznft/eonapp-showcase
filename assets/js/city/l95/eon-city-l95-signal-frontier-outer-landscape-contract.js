/** L95-W12 — bounded outer-landscape contract for Signal Frontier. */
import { EON_EXPANSE_W766_ZONES } from '../w766/eon-expanse-w766-region-contract.js';
import { EON_EXPANSE_W771A_ZONE_IDENTITIES } from '../w771/eon-expanse-w771a-five-zone-cinematic-art-contract.js';

const freeze = Object.freeze;

export const EON_CITY_L95_SIGNAL_FRONTIER_OUTER_LANDSCAPE_SCHEMA = 'eon.city.l95.signal-frontier-outer-landscape.v1';

const QUALITY = freeze({
  lite: freeze({ boundaryBeacons: 2, skylineSupports: 2 }),
  balanced: freeze({ boundaryBeacons: 3, skylineSupports: 3 }),
  cinematic: freeze({ boundaryBeacons: 4, skylineSupports: 4 })
});

function qualityName(value = 'balanced') {
  const candidate = String(value || '').trim().toLowerCase();
  return Object.hasOwn(QUALITY, candidate) ? candidate : 'balanced';
}

function deterministicUnit(seed, zoneIndex, index, channel = 0) {
  let value = (Number(seed || 1) ^ Math.imul(zoneIndex + 19, 0x45d9f3b) ^ Math.imul(index + 41, 0x27d4eb2d) ^ Math.imul(channel + 7, 0x165667b1)) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d) >>> 0;
  value ^= value >>> 15;
  return (value >>> 0) / 4294967295;
}

function supportStyle(zoneId = '') {
  if (zoneId === 'beacon-fields') return 'signal-pylon';
  if (zoneId === 'archive-ruins') return 'archive-slab';
  if (zoneId === 'transit-scar') return 'industrial-fin';
  if (zoneId === 'horizon-vault') return 'vault-monolith';
  return 'gateway-fin';
}

export function createEonCityL95SignalFrontierOuterLandscapePlan({ quality = 'balanced', worldSeed = 1 } = {}) {
  const resolvedQuality = qualityName(quality);
  const budget = QUALITY[resolvedQuality];
  const identities = new Map(EON_EXPANSE_W771A_ZONE_IDENTITIES.map((entry) => [entry.zoneId, entry]));
  const zones = freeze(EON_EXPANSE_W766_ZONES.map((zone, zoneIndex) => {
    const identity = identities.get(zone.id);
    const boundaryBeacons = freeze(Array.from({ length: budget.boundaryBeacons }, (_, index) => {
      const angle = ((Math.PI * 2 * index) / budget.boundaryBeacons) + 0.31 + deterministicUnit(worldSeed, zoneIndex, index, 1) * 0.28;
      const radius = zone.radius * (0.69 + deterministicUnit(worldSeed, zoneIndex, index, 2) * 0.08);
      return freeze({
        id: `${zone.id}-boundary-beacon-${index + 1}`,
        x: zone.x + Math.cos(angle) * radius,
        z: zone.z + Math.sin(angle) * radius,
        heading: -angle,
        height: 1.75 + deterministicUnit(worldSeed, zoneIndex, index, 3) * 0.85,
        style: 'boundary-beacon',
        ownership: 'signal-frontier-public-landscape',
        visualWeight: 'background-support',
        finishedHeroBuilding: false,
        interactive: false
      });
    }));
    const skylineSupports = freeze(Array.from({ length: budget.skylineSupports }, (_, index) => {
      const angle = ((Math.PI * 2 * index) / budget.skylineSupports) + 0.74 + deterministicUnit(worldSeed, zoneIndex, index, 4) * 0.34;
      const radius = zone.radius * (0.86 + deterministicUnit(worldSeed, zoneIndex, index, 5) * 0.09);
      return freeze({
        id: `${zone.id}-outer-support-${index + 1}`,
        x: zone.x + Math.cos(angle) * radius,
        z: zone.z + Math.sin(angle) * radius,
        heading: -angle + Math.PI / 2,
        height: 3.4 + deterministicUnit(worldSeed, zoneIndex, index, 6) * 2.35,
        width: 0.58 + deterministicUnit(worldSeed, zoneIndex, index, 7) * 0.46,
        depth: 1.0 + deterministicUnit(worldSeed, zoneIndex, index, 8) * 0.75,
        style: supportStyle(zone.id),
        ownership: 'signal-frontier-public-landscape',
        visualWeight: 'background-support',
        finishedHeroBuilding: false,
        interactive: false
      });
    }));
    const terrainPatch = freeze({
      id: `${zone.id}-terrain-patch`,
      x: zone.x,
      z: zone.z,
      diameter: Number((zone.radius * 1.62).toFixed(2)),
      height: 0.065,
      ownership: 'signal-frontier-public-landscape',
      visualWeight: 'ground-support',
      finishedHeroBuilding: false,
      interactive: false
    });
    const perimeterTrace = freeze({
      id: `${zone.id}-perimeter-trace`,
      x: zone.x,
      z: zone.z,
      diameter: Number((zone.radius * 1.46).toFixed(2)),
      thickness: resolvedQuality === 'lite' ? 0.06 : 0.075,
      ownership: 'signal-frontier-public-landscape',
      visualWeight: 'ground-support',
      finishedHeroBuilding: false,
      interactive: false
    });
    return freeze({
      zoneId: zone.id,
      zoneLabel: zone.label,
      signature: identity?.signature || '',
      palette: identity?.palette || freeze({ base: '#07111f', primary: '#25b6ff', secondary: '#9d72ff', warm: '#ffbc62' }),
      heroAssetId: identity?.heroAssetId || '',
      terrainPatch,
      perimeterTrace,
      boundaryBeacons,
      skylineSupports,
      supportMeshBudget: 2 + boundaryBeacons.length + skylineSupports.length,
      authoredHeroRemainsDominant: true,
      screenshotDistinctWithoutLabels: true
    });
  }));
  const meshBudget = zones.reduce((sum, zone) => sum + zone.supportMeshBudget, 0);
  return freeze({
    schema: EON_CITY_L95_SIGNAL_FRONTIER_OUTER_LANDSCAPE_SCHEMA,
    quality: resolvedQuality,
    worldSeed: Number(worldSeed || 1),
    zones,
    zoneCount: zones.length,
    meshBudget,
    authoredHeroRemainsDominant: true,
    backgroundSupportOnly: true,
    createsEngine: false,
    createsScene: false,
    createsRenderLoop: false,
    grantsXp: false,
    mutatesMissionState: false,
    interactiveCount: 0,
    finishedHeroPrimitiveCount: 0,
    privateContentStored: false
  });
}

export function validateEonCityL95SignalFrontierOuterLandscapePlan(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_CITY_L95_SIGNAL_FRONTIER_OUTER_LANDSCAPE_SCHEMA) errors.push('schema');
  if (!['lite', 'balanced', 'cinematic'].includes(String(plan.quality || ''))) errors.push('quality');
  if (plan.zoneCount !== EON_EXPANSE_W766_ZONES.length || plan.zones?.length !== EON_EXPANSE_W766_ZONES.length) errors.push('zone-count');
  const expected = new Set(EON_EXPANSE_W766_ZONES.map((zone) => zone.id));
  const seen = new Set();
  for (const zone of plan.zones || []) {
    if (!expected.has(zone.zoneId) || seen.has(zone.zoneId)) errors.push(`zone:${zone.zoneId || 'unknown'}`);
    seen.add(zone.zoneId);
    if (!zone.signature || !zone.heroAssetId || !zone.authoredHeroRemainsDominant || !zone.screenshotDistinctWithoutLabels) errors.push(`identity:${zone.zoneId}`);
    const rows = [zone.terrainPatch, zone.perimeterTrace, ...(zone.boundaryBeacons || []), ...(zone.skylineSupports || [])];
    for (const row of rows) {
      if (!row?.id || row.ownership !== 'signal-frontier-public-landscape' || row.finishedHeroBuilding !== false || row.interactive !== false) errors.push(`truth:${row?.id || zone.zoneId}`);
      if (!['ground-support', 'background-support'].includes(String(row?.visualWeight || ''))) errors.push(`visual-weight:${row?.id || zone.zoneId}`);
      if (Number(row?.height || 0) > 6.25) errors.push(`support-too-tall:${row.id}`);
    }
  }
  for (const zoneId of expected) if (!seen.has(zoneId)) errors.push(`missing:${zoneId}`);
  const budget = Number(plan.meshBudget || 0);
  if (budget < 30 || budget > 50) errors.push('mesh-budget');
  if (!plan.authoredHeroRemainsDominant || !plan.backgroundSupportOnly || plan.createsEngine || plan.createsScene || plan.createsRenderLoop || plan.grantsXp || plan.mutatesMissionState || plan.interactiveCount !== 0 || plan.finishedHeroPrimitiveCount !== 0 || plan.privateContentStored) errors.push('runtime-boundary');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), meshBudget: budget, zoneCount: seen.size });
}

export default freeze({
  EON_CITY_L95_SIGNAL_FRONTIER_OUTER_LANDSCAPE_SCHEMA,
  createEonCityL95SignalFrontierOuterLandscapePlan,
  validateEonCityL95SignalFrontierOuterLandscapePlan
});
