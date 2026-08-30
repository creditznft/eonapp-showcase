import {
  buildEonCityW667WorldCell,
  getEonCityW667WorldGrammarSummary,
  validateEonCityW667WorldCell
} from '../w667/eon-city-w667-expanse-world-grammar.js';

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const integer = (value, fallback = 0) => Math.trunc(finite(value, fallback));

export const EON_EXPANSE_W766C_STREAMER_SCHEMA = 'eon.city.expanse.sector-streamer.w766c.v3';
export const EON_EXPANSE_W766C_LIFECYCLE = freeze({
  UNLOADED: 'UNLOADED',
  QUEUED: 'QUEUED',
  LOADING: 'LOADING',
  MOUNTED_VISUAL: 'MOUNTED_VISUAL',
  MOUNTED_INTERACTIVE: 'MOUNTED_INTERACTIVE',
  SUSPENDED: 'SUSPENDED',
  DISPOSING: 'DISPOSING'
});

export const EON_EXPANSE_W766C_QUALITY_BUDGETS = freeze({
  lite: freeze({ interactiveRadius: 0, visibleRadius: 1, horizonRadius: 2, maxActiveSectors: 9, maxTriangles: 150000, maxDrawCalls: 170, maxNpcs: 6, maxLights: 10, maxParticles: 70, streamingShare: freeze({ triangles: 0.64, drawCalls: 0.5, lights: 0.5, particles: 0.5 }) }),
  balanced: freeze({ interactiveRadius: 1, visibleRadius: 2, horizonRadius: 3, maxActiveSectors: 25, maxTriangles: 360000, maxDrawCalls: 320, maxNpcs: 12, maxLights: 18, maxParticles: 180, streamingShare: freeze({ triangles: 0.64, drawCalls: 0.5, lights: 0.5, particles: 0.5 }) }),
  cinematic: freeze({ interactiveRadius: 1, visibleRadius: 3, horizonRadius: 4, maxActiveSectors: 49, maxTriangles: 620000, maxDrawCalls: 480, maxNpcs: 18, maxLights: 26, maxParticles: 320, streamingShare: freeze({ triangles: 0.64, drawCalls: 0.5, lights: 0.5, particles: 0.5 }) })
});

function hash32(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function edgeCode(worldSeed, axis, boundaryX, boundaryZ) {
  return hash32(`${integer(worldSeed, 1)}:${axis}:${integer(boundaryX)}:${integer(boundaryZ)}:w766c-edge`) % 3;
}

function emptyEstimate() {
  return { triangles: 0, drawCalls: 0, npcs: 0, lights: 0, particles: 0 };
}

function addEstimate(total, estimate = {}) {
  return {
    triangles: total.triangles + finite(estimate.triangles),
    drawCalls: total.drawCalls + finite(estimate.drawCalls),
    npcs: total.npcs + finite(estimate.npcs),
    lights: total.lights + finite(estimate.lights),
    particles: total.particles + finite(estimate.particles)
  };
}


function estimateForRing(estimate = {}, ring = 'interactive') {
  const factor = ring === 'interactive'
    ? { triangles: 1, drawCalls: 1, npcs: 1, lights: 1, particles: 1 }
    : ring === 'visible'
      ? { triangles: 0.32, drawCalls: 0.45, npcs: 0, lights: 0.35, particles: 0.2 }
      : { triangles: 0.08, drawCalls: 0.18, npcs: 0, lights: 0.08, particles: 0.05 };
  return freeze({
    triangles: Math.ceil(finite(estimate.triangles) * factor.triangles),
    drawCalls: Math.ceil(finite(estimate.drawCalls) * factor.drawCalls),
    npcs: Math.floor(finite(estimate.npcs) * factor.npcs),
    lights: Math.floor(finite(estimate.lights) * factor.lights),
    particles: Math.floor(finite(estimate.particles) * factor.particles)
  });
}

function withinBudget(estimate, budget) {
  const share = budget.streamingShare || { triangles: 1, drawCalls: 1, lights: 1, particles: 1 };
  return estimate.triangles <= budget.maxTriangles * finite(share.triangles, 1)
    && estimate.drawCalls <= budget.maxDrawCalls * finite(share.drawCalls, 1)
    && estimate.npcs <= budget.maxNpcs
    && estimate.lights <= budget.maxLights * finite(share.lights, 1)
    && estimate.particles <= budget.maxParticles * finite(share.particles, 1);
}

export function createEonExpanseW766CSectorId(x = 0, z = 0) {
  return `sector:${integer(x)}:${integer(z)}`;
}

export function createEonExpanseW766CSectorPlan({ worldSeed = 1, x = 0, z = 0, sectorSize = 48, regionKitId = 'signal-frontier' } = {}) {
  const sx = integer(x);
  const sz = integer(z);
  const seed = hash32(`${integer(worldSeed, 1)}:${sx}:${sz}:w766c`);
  const roadAxis = seed % 2 === 0 ? 'x' : 'z';
  const worldCell = buildEonCityW667WorldCell({ x: sx, z: sz, seed: `eonapp-w766:${integer(worldSeed, 1)}` });
  const worldCellValidation = validateEonCityW667WorldCell(worldCell);
  const landmarkSlot = worldCell?.landmark?.typeId || (seed % 7 === 0 ? 'signal-tower' : seed % 11 === 0 ? 'archive-fragment' : null);
  const lotCount = Array.isArray(worldCell?.lotPlan) ? worldCell.lotPlan.length : 0;
  const estimate = freeze({
    triangles: 5200 + lotCount * 1250 + seed % 5200,
    drawCalls: 7 + lotCount + seed % 6,
    npcs: 0,
    lights: 0,
    particles: 0
  });
  return freeze({
    schema: `${EON_EXPANSE_W766C_STREAMER_SCHEMA}.sector-plan.v1`,
    id: createEonExpanseW766CSectorId(sx, sz),
    x: sx,
    z: sz,
    worldOrigin: freeze({ x: sx * finite(sectorSize, 48), z: sz * finite(sectorSize, 48) }),
    seed,
    regionKitId: worldCell?.region?.archetype?.id || regionKitId,
    terrainFamily: worldCell?.terrainProfile?.id || ['signal-plateau', 'circuit-basin', 'archive-shelf'][seed % 3],
    worldCell,
    worldCellValid: worldCellValidation.ok,
    worldGrammar: getEonCityW667WorldGrammarSummary(),
    roadAxis,
    landmarkSlot,
    continuity: freeze({
      north: edgeCode(worldSeed, 'h', sx, sz),
      east: edgeCode(worldSeed, 'v', sx + 1, sz),
      south: edgeCode(worldSeed, 'h', sx, sz + 1),
      west: edgeCode(worldSeed, 'v', sx, sz)
    }),
    safeSpawn: freeze({ x: sx * sectorSize, y: 0.15, z: sz * sectorSize }),
    estimate,
    deterministicSignature: hash32(`${seed}:${worldCell?.variationSignature || regionKitId}:${roadAxis}:${landmarkSlot || 'none'}`).toString(16).padStart(8, '0')
  });
}

export function createEonExpanseW766CFallbackSectorPlan({ worldSeed = 1, x = 0, z = 0, sectorSize = 48 } = {}) {
  const base = createEonExpanseW766CSectorPlan({ worldSeed, x, z, sectorSize, regionKitId: 'certified-fallback' });
  return freeze({
    ...base,
    terrainFamily: 'certified-signal-plateau',
    worldCell: null,
    worldCellValid: false,
    roadAxis: 'z',
    landmarkSlot: null,
    estimate: freeze({ triangles: 1800, drawCalls: 3, npcs: 0, lights: 1, particles: 0 }),
    fallback: true,
    deterministicSignature: hash32(`${base.seed}:certified-fallback:z:none`).toString(16).padStart(8, '0')
  });
}

export function validateEonExpanseW766CSectorPlan(plan = {}, { quality = 'balanced' } = {}) {
  const errors = [];
  const budget = EON_EXPANSE_W766C_QUALITY_BUDGETS[quality] || EON_EXPANSE_W766C_QUALITY_BUDGETS.balanced;
  if (plan?.schema !== `${EON_EXPANSE_W766C_STREAMER_SCHEMA}.sector-plan.v1`) errors.push('schema-invalid');
  if (!/^sector:-?\d+:-?\d+$/.test(String(plan?.id || ''))) errors.push('id-invalid');
  if (!Number.isFinite(plan?.worldOrigin?.x) || !Number.isFinite(plan?.worldOrigin?.z)) errors.push('origin-invalid');
  if (!['x', 'z'].includes(plan?.roadAxis)) errors.push('road-axis-invalid');
  if (!plan?.deterministicSignature) errors.push('signature-required');
  if (!plan?.fallback && (!plan?.worldCell || plan?.worldCellValid !== true)) errors.push('world-grammar-invalid');
  if (!plan?.fallback && (!Array.isArray(plan?.worldCell?.lotPlan) || plan.worldCell.lotPlan.length < 3)) errors.push('world-lots-invalid');
  if (!plan?.fallback && plan?.worldCell?.privateDataRead) errors.push('private-data-boundary-invalid');
  if (!plan?.fallback && plan?.worldCell?.networkRequestCreated) errors.push('network-boundary-invalid');
  if (finite(plan?.estimate?.triangles, Infinity) > budget.maxTriangles) errors.push('triangle-budget-exceeded');
  if (finite(plan?.estimate?.drawCalls, Infinity) > budget.maxDrawCalls) errors.push('draw-call-budget-exceeded');
  if (finite(plan?.estimate?.npcs, Infinity) > budget.maxNpcs) errors.push('npc-budget-exceeded');
  if (finite(plan?.estimate?.lights, Infinity) > budget.maxLights) errors.push('light-budget-exceeded');
  if (finite(plan?.estimate?.particles, Infinity) > budget.maxParticles) errors.push('particle-budget-exceeded');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), fallbackRequired: errors.length > 0 });
}

export function validateEonExpanseW766CNeighborContinuity(a, b, direction = 'east') {
  const pairs = { east: ['east', 'west'], west: ['west', 'east'], north: ['north', 'south'], south: ['south', 'north'] };
  const pair = pairs[direction];
  if (!pair) return freeze({ ok: false, reason: 'direction-invalid' });
  const ok = Number(a?.continuity?.[pair[0]]) === Number(b?.continuity?.[pair[1]]);
  return freeze({ ok, direction, a: a?.continuity?.[pair[0]], b: b?.continuity?.[pair[1]], reason: ok ? '' : 'edge-continuity-mismatch' });
}

export function createEonExpanseW766CSectorStreamer({ worldSeed = 1, quality = 'balanced', sectorSize = 48, mountSector = null, unmountSector = null } = {}) {
  const profile = EON_EXPANSE_W766C_QUALITY_BUDGETS[quality] || EON_EXPANSE_W766C_QUALITY_BUDGETS.balanced;
  const mounted = new Map();
  let lastCenter = freeze({ x: 0, z: 0 });
  let lastBudget = freeze(emptyEstimate());
  const ringFor = (dx, dz) => {
    const distance = Math.max(Math.abs(dx), Math.abs(dz));
    return distance <= profile.interactiveRadius ? 'interactive'
      : distance <= profile.visibleRadius ? 'visible'
        : distance <= profile.horizonRadius ? 'horizon'
          : null;
  };
  const desiredAt = (centerX, centerZ) => {
    const desired = [];
    for (let dz = -profile.horizonRadius; dz <= profile.horizonRadius; dz += 1) {
      for (let dx = -profile.horizonRadius; dx <= profile.horizonRadius; dx += 1) {
        const ring = ringFor(dx, dz);
        if (!ring) continue;
        desired.push(freeze({ x: centerX + dx, z: centerZ + dz, ring }));
      }
    }
    return desired
      .sort((a, b) => (Math.max(Math.abs(a.x - centerX), Math.abs(a.z - centerZ)) - Math.max(Math.abs(b.x - centerX), Math.abs(b.z - centerZ))) || (a.z - b.z) || (a.x - b.x))
      .slice(0, profile.maxActiveSectors);
  };
  return freeze({
    update(position = {}) {
      const centerX = Math.round(finite(position.x) / sectorSize);
      const centerZ = Math.round(finite(position.z) / sectorSize);
      lastCenter = freeze({ x: centerX, z: centerZ });
      const desired = desiredAt(centerX, centerZ);
      const wanted = new Set();
      const mountedNow = [];
      const rejected = [];
      const budgetRefused = [];
      let aggregate = emptyEstimate();
      for (const entry of desired) {
        const id = createEonExpanseW766CSectorId(entry.x, entry.z);
        let plan = createEonExpanseW766CSectorPlan({ worldSeed, x: entry.x, z: entry.z, sectorSize });
        const validation = validateEonExpanseW766CSectorPlan(plan, { quality });
        if (!validation.ok) {
          rejected.push(freeze({ id, errors: validation.errors }));
          plan = createEonExpanseW766CFallbackSectorPlan({ worldSeed, x: entry.x, z: entry.z, sectorSize });
          if (!validateEonExpanseW766CSectorPlan(plan, { quality }).ok) continue;
        }
        const effectiveEstimate = estimateForRing(plan.estimate, entry.ring);
        const nextAggregate = addEstimate(aggregate, effectiveEstimate);
        if (!withinBudget(nextAggregate, profile)) {
          budgetRefused.push(freeze({ id, ring: entry.ring, estimate: effectiveEstimate }));
          continue;
        }
        aggregate = nextAggregate;
        wanted.add(id);
        const existing = mounted.get(id);
        if (existing) {
          if (existing.ring !== entry.ring) mounted.set(id, freeze({ ...existing, ring: entry.ring, lifecycle: entry.ring === 'interactive' ? EON_EXPANSE_W766C_LIFECYCLE.MOUNTED_INTERACTIVE : EON_EXPANSE_W766C_LIFECYCLE.MOUNTED_VISUAL }));
          continue;
        }
        const handle = mountSector?.(plan, entry.ring) || null;
        const record = freeze({ id, plan, effectiveEstimate, ring: entry.ring, lifecycle: entry.ring === 'interactive' ? EON_EXPANSE_W766C_LIFECYCLE.MOUNTED_INTERACTIVE : EON_EXPANSE_W766C_LIFECYCLE.MOUNTED_VISUAL, handle });
        mounted.set(id, record);
        mountedNow.push(record);
      }
      const disposed = [];
      for (const [id, record] of [...mounted.entries()]) {
        if (wanted.has(id)) continue;
        try { unmountSector?.(freeze({ ...record, lifecycle: EON_EXPANSE_W766C_LIFECYCLE.DISPOSING })); } catch {}
        mounted.delete(id);
        disposed.push(id);
      }
      lastBudget = freeze(aggregate);
      return freeze({ ok: true, center: lastCenter, mounted: freeze(mountedNow), disposed: freeze(disposed), rejected: freeze(rejected), budgetRefused: freeze(budgetRefused), activeCount: mounted.size, aggregateBudget: lastBudget });
    },
    disposeAll() {
      const ids = [];
      for (const record of mounted.values()) {
        try { unmountSector?.(freeze({ ...record, lifecycle: EON_EXPANSE_W766C_LIFECYCLE.DISPOSING })); } catch {}
        ids.push(record.id);
      }
      mounted.clear();
      lastBudget = freeze(emptyEstimate());
      return freeze({ ok: true, disposed: freeze(ids) });
    },
    getMountedRecords() {
      return freeze([...mounted.values()].map((record) => freeze({ id: record.id, ring: record.ring, plan: record.plan, lifecycle: record.lifecycle, effectiveEstimate: record.effectiveEstimate })));
    },
    getSummary() {
      const rings = { interactive: 0, visible: 0, horizon: 0 };
      for (const record of mounted.values()) rings[record.ring] += 1;
      return freeze({ schema: EON_EXPANSE_W766C_STREAMER_SCHEMA, quality, sectorSize, worldSeed: integer(worldSeed), center: lastCenter, activeCount: mounted.size, rings: freeze(rings), aggregateBudget: lastBudget, budget: profile, oneSceneAuthority: true });
    }
  });
}
