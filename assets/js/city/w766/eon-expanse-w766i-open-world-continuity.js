import { EON_EXPANSE_W766C_QUALITY_BUDGETS } from './eon-expanse-w766c-sector-streamer.js';
import { getEonCityW667WorldGrammarSummary } from '../w667/eon-city-w667-expanse-world-grammar.js';
import {
  buildEonCityW681ExpanseMacroRegionPlan,
  validateEonCityW681ExpanseMacroRegionPlan
} from '../w681/eon-city-w681-expanse-macro-regions.js';
import {
  buildEonCityW682ExpansePopulationPlan,
  validateEonCityW682ExpansePopulationPlan
} from '../w682/eon-city-w682-expanse-population.js';
import {
  buildEonCityW698ExpansePresentation,
  validateEonCityW698ExpansePresentation
} from '../w698/eon-city-w698-expanse-open-world-presentation.js';

const freeze = (value) => Object.freeze(value);
const finite = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;

const FRONTIER_CONTRACT_FAMILIES = freeze({
  survey: freeze([
    freeze({ id: 'scan-perimeter', label: 'Scan the local signal perimeter', action: 'scan' }),
    freeze({ id: 'inspect-landmark', label: 'Inspect the landmark interface', action: 'inspect' }),
    freeze({ id: 'stabilize-signal', label: 'Stabilize the frontier signal', action: 'stabilize' })
  ]),
  navigation: freeze([
    freeze({ id: 'trace-route', label: 'Trace the safe route markers', action: 'trace' }),
    freeze({ id: 'calibrate-anchor', label: 'Calibrate the return anchor', action: 'calibrate' }),
    freeze({ id: 'confirm-route', label: 'Confirm the route back to Transit', action: 'confirm' })
  ]),
  archive: freeze([
    freeze({ id: 'recover-echo', label: 'Recover the local archive echo', action: 'recover' }),
    freeze({ id: 'decode-pattern', label: 'Decode the signal pattern', action: 'decode' }),
    freeze({ id: 'record-finding', label: 'Record the verified finding', action: 'record' })
  ]),
  systems: freeze([
    freeze({ id: 'inspect-system', label: 'Inspect the local system state', action: 'inspect' }),
    freeze({ id: 'align-nodes', label: 'Align the three control nodes', action: 'align' }),
    freeze({ id: 'verify-readiness', label: 'Verify system readiness', action: 'verify' })
  ]),
  companion: freeze([
    freeze({ id: 'locate-signal', label: 'Locate the companion signal', action: 'locate' }),
    freeze({ id: 'guide-companion', label: 'Guide EONBOT through the signal path', action: 'guide' }),
    freeze({ id: 'confirm-rendezvous', label: 'Confirm the rendezvous point', action: 'confirm' })
  ]),
  anomaly: freeze([
    freeze({ id: 'sample-anomaly', label: 'Sample the anomaly safely', action: 'sample' }),
    freeze({ id: 'align-anomaly', label: 'Align the anomaly signals', action: 'align' }),
    freeze({ id: 'seal-reading', label: 'Seal and record the reading', action: 'seal' })
  ])
});

function resolveFrontierContractFamily(purpose = '', landmark = null) {
  const text = `${String(purpose)} ${String(landmark?.role || '')} ${String(landmark?.purpose || '')}`.toLowerCase();
  if (/return|route|traversal|checkpoint|transit|navigation/.test(text)) return 'navigation';
  if (/archive|knowledge|story|research|observation/.test(text)) return 'archive';
  if (/device|provider|productive|project|creator|system/.test(text)) return 'systems';
  if (/eonbot|companion|resident|encounter/.test(text)) return 'companion';
  if (/realm|rare|rift|temporal|anomaly/.test(text)) return 'anomaly';
  return 'survey';
}

export const EON_EXPANSE_W766I_CONTINUITY_SCHEMA = 'eon.city.expanse.open-world-continuity.w766i.v1';

function fallbackCells(position = {}, sectorSize = 48) {
  const centerX = Math.round(finite(position.x) / sectorSize);
  const centerZ = Math.round(finite(position.z) / sectorSize);
  const cells = [];
  for (let dz = -2; dz <= 2; dz += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dz));
      cells.push(freeze({
        id: `sector:${centerX + dx}:${centerZ + dz}`,
        x: ((centerX + dx) * sectorSize) / 10,
        z: ((centerZ + dz) * sectorSize) / 10,
        interactive: distance <= 1,
        residencyTier: distance <= 1 ? 'interactive' : 'horizon'
      }));
    }
  }
  return freeze(cells);
}

function populationCells(records = [], position = {}, sectorSize = 48) {
  if (!Array.isArray(records) || records.length < 9) return fallbackCells(position, sectorSize);
  return freeze(records.map((record) => freeze({
    id: record.id,
    x: finite(record?.plan?.worldOrigin?.x) / 10,
    z: finite(record?.plan?.worldOrigin?.z) / 10,
    interactive: record.ring === 'interactive',
    residencyTier: record.ring
  })));
}

export function buildEonExpanseW766IFrontierContract({ sectorPlan = {}, cycleKey = '' } = {}) {
  const cell = sectorPlan?.worldCell || {};
  const landmark = cell.landmark || null;
  const purpose = String(cell.gameplayPurpose || 'frontier survey');
  const labelBase = landmark?.label || cell?.discovery?.label || cell?.region?.archetype?.label || 'Frontier Signal';
  const rarity = landmark?.rarity || 'common';
  const xpByRarity = { common: 35, uncommon: 45, rare: 65, epic: 90, legendary: 125 };
  const resolvedCycle = String(cycleKey || 'persistent');
  const sectorId = String(sectorPlan?.id || 'sector:0:0');
  const family = resolveFrontierContractFamily(purpose, landmark);
  const steps = FRONTIER_CONTRACT_FAMILIES[family] || FRONTIER_CONTRACT_FAMILIES.survey;
  return freeze({
    schema: `${EON_EXPANSE_W766I_CONTINUITY_SCHEMA}.frontier-contract.v2`,
    id: `frontier:${sectorId}:${resolvedCycle}`,
    sectorId,
    cycleKey: resolvedCycle,
    label: `${labelBase} Contract`,
    objective: `Complete ${steps.length} field actions around the ${labelBase}.`,
    purpose,
    family,
    steps,
    rarity,
    xp: xpByRarity[rarity] || xpByRarity.common,
    landmarkId: landmark?.id || `generated:${sectorId}`,
    reviewFirst: true,
    explicitUserAction: true,
    repeatable: true,
    privateByDefault: true,
    automaticCompletion: false
  });
}

export function buildEonExpanseW766IOpenWorldContinuity({
  worldSeed = 1,
  position = {},
  quality = 'balanced',
  reducedMotion = false,
  sectorRecords = [],
  sectorSize = 48
} = {}) {
  const seed = `eonapp-w766:${String(worldSeed)}`;
  const worldGrammar = getEonCityW667WorldGrammarSummary();
  const macroPlan = buildEonCityW681ExpanseMacroRegionPlan({ position, seed, quality });
  const presentation = buildEonCityW698ExpansePresentation({ macroPlan, quality, seed });
  const cells = populationCells(sectorRecords, position, sectorSize);
  let population = null;
  let populationValidation = null;
  let populationSeedAttempt = 0;
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const candidate = buildEonCityW682ExpansePopulationPlan({ cells, seed: `${seed}:population:${attempt}`, quality, reducedMotion });
    const validation = validateEonCityW682ExpansePopulationPlan(candidate);
    population = candidate;
    populationValidation = validation;
    populationSeedAttempt = attempt;
    if (validation.ok) break;
  }
  const validations = freeze({
    macro: validateEonCityW681ExpanseMacroRegionPlan(macroPlan),
    presentation: validateEonCityW698ExpansePresentation(presentation),
    population: populationValidation
  });
  const failures = freeze(Object.entries(validations).flatMap(([key, result]) => result.ok ? [] : (result.errors || []).map((error) => `${key}:${error}`)));
  const sectorEstimate = sectorRecords.reduce((total, record) => ({
    triangles: total.triangles + finite(record?.effectiveEstimate?.triangles),
    drawCalls: total.drawCalls + finite(record?.effectiveEstimate?.drawCalls),
    lights: total.lights + finite(record?.effectiveEstimate?.lights),
    particles: total.particles + finite(record?.effectiveEstimate?.particles)
  }), { triangles: 0, drawCalls: 0, lights: 0, particles: 0 });
  const continuityDrawCalls = presentation.skylineNodeCount + (presentation.roadHierarchy?.length || 0) + population.populationCount + population.discoveryCount + population.streetActivityCount;
  const continuityTriangles = presentation.skylineNodeCount * 12 + (presentation.roadHierarchy?.length || 0) * 12 + population.populationCount * 240 + population.discoveryCount * 760 + population.streetActivityCount * 12;
  const performanceEstimate = freeze({
    triangles: sectorEstimate.triangles + continuityTriangles,
    drawCalls: sectorEstimate.drawCalls + continuityDrawCalls,
    lights: sectorEstimate.lights,
    particles: sectorEstimate.particles,
    ambientVisuals: population.populationCount,
    sectorCount: sectorRecords.length
  });
  const performanceBudget = EON_EXPANSE_W766C_QUALITY_BUDGETS[String(quality)] || EON_EXPANSE_W766C_QUALITY_BUDGETS.balanced;
  return freeze({
    schema: EON_EXPANSE_W766I_CONTINUITY_SCHEMA,
    worldSeed: String(worldSeed),
    quality: ['lite', 'balanced', 'cinematic'].includes(String(quality)) ? String(quality) : 'balanced',
    reducedMotion: Boolean(reducedMotion),
    worldGrammar,
    macroPlan,
    presentation,
    population,
    populationSeedAttempt,
    cells,
    validations,
    ok: failures.length === 0,
    failures,
    performanceEstimate,
    performanceBudget,
    retentionMatrix: freeze({
      regionArchetypes: worldGrammar.regionArchetypeCount,
      buildingForms: worldGrammar.buildingFormCount,
      terrainProfiles: worldGrammar.terrainProfileCount,
      publicSpaces: worldGrammar.publicSpaceProfileCount,
      skylineProfiles: worldGrammar.skylineProfileCount,
      microClimates: worldGrammar.microClimateCount,
      landmarkTypes: worldGrammar.landmarkTypeCount,
      gameplayPurposes: worldGrammar.gameplayPurposeCount,
      macroRegionsVisible: macroPlan.macroRegionCount,
      skylineNodes: presentation.skylineNodeCount,
      ambientActors: population.populationCount,
      ambientDiscoveries: population.discoveryCount,
      streetActivities: population.streetActivityCount,
      approximateCombinationSpace: worldGrammar.approximateCombinationSpace
    }),
    oneCanonicalScene: true,
    ownsEngine: false,
    ownsScene: false,
    ownsRenderLoop: false,
    visibleHardBorder: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export function validateEonExpanseW766IOpenWorldContinuity(plan = {}) {
  const errors = [];
  if (plan.schema !== EON_EXPANSE_W766I_CONTINUITY_SCHEMA) errors.push('schema-invalid');
  if (!plan.ok || plan.failures?.length) errors.push('nested-validation-failed');
  if (Number(plan?.retentionMatrix?.regionArchetypes || 0) < 9) errors.push('region-variety-insufficient');
  if (Number(plan?.retentionMatrix?.buildingForms || 0) < 30) errors.push('building-variety-insufficient');
  if (Number(plan?.retentionMatrix?.skylineNodes || 0) < 27) errors.push('skyline-density-insufficient');
  if (Number(plan?.retentionMatrix?.ambientActors || 0) < 14) errors.push('population-insufficient');
  if (Number(plan?.performanceEstimate?.drawCalls || Infinity) > Number(plan?.performanceBudget?.maxDrawCalls || 0) * 0.9) errors.push('combined-draw-call-reserve-exceeded');
  if (Number(plan?.performanceEstimate?.triangles || Infinity) > Number(plan?.performanceBudget?.maxTriangles || 0) * 0.78) errors.push('combined-triangle-reserve-exceeded');
  if (plan.visibleHardBorder || plan.privateDataRead || plan.networkRequestCreated) errors.push('truth-boundary-invalid');
  if (!plan.oneCanonicalScene || plan.ownsEngine || plan.ownsScene || plan.ownsRenderLoop) errors.push('runtime-ownership-invalid');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), retentionMatrix: plan.retentionMatrix || null });
}

export default freeze({
  EON_EXPANSE_W766I_CONTINUITY_SCHEMA,
  buildEonExpanseW766IFrontierContract,
  buildEonExpanseW766IOpenWorldContinuity,
  validateEonExpanseW766IOpenWorldContinuity
});
