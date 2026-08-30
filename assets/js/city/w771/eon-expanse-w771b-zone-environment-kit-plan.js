/** W771B — deterministic modular environment kit plan for the five authored zones. */
import { EON_EXPANSE_W766_ZONES } from '../w766/eon-expanse-w766-region-contract.js';
import { EON_EXPANSE_W771A_ZONE_IDENTITIES } from './eon-expanse-w771a-five-zone-cinematic-art-contract.js';

const freeze = Object.freeze;
const QUALITY_LIMITS = freeze({ lite: 4, balanced: 7, cinematic: 10 });
const ALLOWED_MODULES = freeze(new Set(['rail', 'pylon', 'cable', 'frame', 'wall', 'walkway', 'crystal', 'drone', 'lamp', 'gantry', 'ring', 'threshold', 'altar']));

export const EON_EXPANSE_W771B_ENVIRONMENT_PLAN_SCHEMA = 'eon.expanse.zone-environment-kit-plan.w771b.v1';

function unit(seed, index, channel = 0) {
  let value = (Number(seed || 1) ^ Math.imul(index + 31, 0x45d9f3b) ^ Math.imul(channel + 13, 0x27d4eb2d)) >>> 0;
  value ^= value >>> 16; value = Math.imul(value, 0x7feb352d) >>> 0; value ^= value >>> 15;
  return (value >>> 0) / 4294967295;
}

const moduleTemplates = freeze({
  'gateway-overlook': freeze(['rail', 'frame', 'cable', 'lamp', 'rail', 'frame', 'lamp', 'cable', 'rail', 'frame', 'lamp', 'cable', 'rail', 'frame', 'lamp']),
  'beacon-fields': freeze(['pylon', 'crystal', 'drone', 'lamp', 'pylon', 'crystal', 'pylon', 'drone', 'lamp', 'crystal', 'pylon', 'cable', 'lamp', 'crystal', 'pylon']),
  'archive-ruins': freeze(['wall', 'walkway', 'frame', 'lamp', 'wall', 'walkway', 'wall', 'frame', 'lamp', 'walkway', 'wall', 'frame', 'lamp', 'walkway', 'wall']),
  'transit-scar': freeze(['gantry', 'rail', 'cable', 'lamp', 'gantry', 'rail', 'gantry', 'cable', 'lamp', 'rail', 'gantry', 'cable', 'lamp', 'rail', 'gantry']),
  'horizon-vault': freeze(['ring', 'threshold', 'lamp', 'altar', 'ring', 'threshold', 'ring', 'lamp', 'threshold', 'ring', 'lamp', 'threshold', 'ring', 'lamp', 'threshold'])
});

function dimensions(type, scaleUnit) {
  // L95: primitives are support geometry, never the dominant silhouette.
  // Keep their authored-route scale intentionally below the zone hero assets.
  const scalar = 0.68 + scaleUnit * 0.38;
  if (type === 'rail') return freeze({ width: 3.4 * scalar, height: 0.16, depth: 0.18 });
  if (type === 'pylon') return freeze({ width: 0.34, height: 2.65 * scalar, depth: 0.34 });
  if (type === 'cable') return freeze({ width: 0.09, height: 0.09, depth: 3.7 * scalar });
  if (type === 'frame') return freeze({ width: 2.65 * scalar, height: 2.55 * scalar, depth: 0.2 });
  if (type === 'wall') return freeze({ width: 3.15 * scalar, height: 2.2 * scalar, depth: 0.3 });
  if (type === 'walkway') return freeze({ width: 3.0 * scalar, height: 0.18, depth: 1.1 });
  if (type === 'crystal') return freeze({ width: 0.52 * scalar, height: 1.7 * scalar, depth: 0.52 * scalar });
  if (type === 'drone') return freeze({ width: 0.62 * scalar, height: 0.46 * scalar, depth: 0.62 * scalar, hover: 1.35 + scaleUnit * 0.45 });
  if (type === 'lamp') return freeze({ width: 0.16, height: 2.15 * scalar, depth: 0.16 });
  if (type === 'gantry') return freeze({ width: 3.45 * scalar, height: 2.85 * scalar, depth: 0.26 });
  if (type === 'ring') return freeze({ diameter: 3.35 * scalar, thickness: 0.1 });
  if (type === 'threshold') return freeze({ width: 3.25 * scalar, height: 3.7 * scalar, depth: 0.22 });
  return freeze({ width: 1.8 * scalar, height: 0.95 * scalar, depth: 1.8 * scalar });
}

export function deriveEonExpanseW771BEnvironmentKitPlan({ worldSeed = 1, quality = 'balanced' } = {}) {
  const resolvedQuality = QUALITY_LIMITS[quality] ? quality : 'balanced';
  const limit = QUALITY_LIMITS[resolvedQuality];
  const zones = EON_EXPANSE_W766_ZONES.map((zone, zoneIndex) => {
    const identity = EON_EXPANSE_W771A_ZONE_IDENTITIES.find((entry) => entry.zoneId === zone.id);
    const templates = moduleTemplates[zone.id] || freeze([]);
    const modules = templates.slice(0, limit).map((type, index) => {
      const angle = (index / Math.max(1, limit)) * Math.PI * 2 + unit(worldSeed + zoneIndex * 101, index, 1) * 0.38;
      const radius = Math.max(6, zone.radius * (0.28 + unit(worldSeed + zoneIndex * 101, index, 2) * 0.24));
      const x = zone.x + Math.sin(angle) * radius;
      const z = zone.z + Math.cos(angle) * radius;
      const rotationY = -angle + (type === 'rail' || type === 'walkway' ? Math.PI / 2 : 0);
      const restoredOnly = index >= Math.ceil(limit * 0.66);
      return freeze({
        id: `${zone.id}-${type}-${index + 1}`,
        zoneId: zone.id,
        type,
        position: freeze({ x: Number(x.toFixed(3)), y: 0, z: Number(z.toFixed(3)) }),
        rotationY: Number(rotationY.toFixed(4)),
        dimensions: dimensions(type, unit(worldSeed + zoneIndex * 101, index, 3)),
        materialSlot: index % 4 === 0 ? 'warm' : index % 3 === 0 ? 'secondary' : 'primary',
        collision: ['rail', 'frame', 'wall', 'walkway', 'gantry', 'threshold', 'altar'].includes(type),
        restoredOnly,
        milestone: restoredOnly ? identity?.transformation?.milestone || '' : '',
        finishedHeroBuilding: false,
        modularEnvironmentProp: true,
        visualWeight: 'support',
        interactive: false
      });
    });
    return freeze({
      zoneId: zone.id,
      signature: identity?.signature || '',
      palette: identity?.palette || freeze({}),
      quality: resolvedQuality,
      moduleCount: modules.length,
      modules: freeze(modules),
      heroAssetId: identity?.heroAssetId || '',
      finishedHeroPrimitiveCount: 0
    });
  });
  return freeze({
    schema: EON_EXPANSE_W771B_ENVIRONMENT_PLAN_SCHEMA,
    worldSeed: Number(worldSeed || 1),
    quality: resolvedQuality,
    zoneCount: zones.length,
    moduleCount: zones.reduce((sum, zone) => sum + zone.moduleCount, 0),
    zones: freeze(zones),
    allowedModuleTypes: freeze([...ALLOWED_MODULES]),
    deterministic: true,
    rawUserCoordinatesAccepted: false,
    finishedHeroPrimitiveCount: 0,
    privateContentStored: false
  });
}

export function validateEonExpanseW771BEnvironmentKitPlan(plan = {}) {
  const errors = [];
  const expectedZones = new Set(EON_EXPANSE_W766_ZONES.map((zone) => zone.id));
  const seen = new Set();
  for (const zone of Array.isArray(plan?.zones) ? plan.zones : []) {
    if (!expectedZones.has(zone.zoneId)) errors.push(`unknown-zone:${zone.zoneId}`);
    if (seen.has(zone.zoneId)) errors.push(`duplicate-zone:${zone.zoneId}`);
    seen.add(zone.zoneId);
    for (const entry of Array.isArray(zone.modules) ? zone.modules : []) {
      if (!ALLOWED_MODULES.has(entry.type)) errors.push(`module-type-invalid:${entry.id}`);
      if (![entry.position?.x, entry.position?.y, entry.position?.z, entry.rotationY].every(Number.isFinite)) errors.push(`module-transform-invalid:${entry.id}`);
      if (entry.finishedHeroBuilding !== false || entry.modularEnvironmentProp !== true || entry.visualWeight !== 'support') errors.push(`module-truth-invalid:${entry.id}`);
      const visualHeight = Number(entry.dimensions?.height || entry.dimensions?.diameter || 0);
      if (!Number.isFinite(visualHeight) || visualHeight <= 0 || visualHeight > 4.5) errors.push(`module-visual-weight-invalid:${entry.id}`);
      if (entry.interactive !== false) errors.push(`module-interaction-invalid:${entry.id}`);
    }
  }
  for (const zoneId of expectedZones) if (!seen.has(zoneId)) errors.push(`zone-plan-missing:${zoneId}`);
  return freeze({ ok: errors.length === 0, schema: EON_EXPANSE_W771B_ENVIRONMENT_PLAN_SCHEMA, errors: freeze(errors), zoneCount: seen.size, moduleCount: Number(plan?.moduleCount || 0), finishedHeroPrimitiveCount: 0 });
}

export default freeze({ EON_EXPANSE_W771B_ENVIRONMENT_PLAN_SCHEMA, deriveEonExpanseW771BEnvironmentKitPlan, validateEonExpanseW771BEnvironmentKitPlan });
