/** RT91 — seeded, certified-template repeatable contract generator. */
import { EON_CITY_RT91_MISSION_GRAMMAR_SCHEMA, EON_CITY_RT91_MISSION_FAMILIES, validateEonCityRt91MissionTemplate } from './eon-city-rt91-mission-grammar.js';
import { scoreEonCityRt91ActivityCandidate } from './eon-city-rt91-anti-repetition.js';
import { createEonCityRt91ObjectiveGraph, validateEonCityRt91ObjectiveGraph } from './eon-city-rt91-objective-graph.js';
import { placeEonCityRt91MissionObjectives } from './eon-city-rt91-world-cell-activity.js';

export const EON_CITY_RT91_CONTRACT_GENERATOR_SCHEMA = 'eon.city.contract-generator.rt91.v1';
const freeze = Object.freeze;
const clean = (value = '') => String(value || '').trim().toLowerCase();

function hash32(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'rt91')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const VERB_LABELS = freeze({ reach: 'Reach', inspect: 'Inspect', scan: 'Scan', recover: 'Recover', repair: 'Repair', route: 'Route', activate: 'Activate', stabilize: 'Stabilize', rescue: 'Rescue', escort: 'Escort', construct: 'Construct', calibrate: 'Calibrate', investigate: 'Investigate', return: 'Return' });

function deterministicObjectiveVerbs(family, seedKey) {
  const allowed = family.allowedVerbs.filter((verb) => verb !== 'return');
  const count = Math.max(family.minimumObjectives, Math.min(family.maximumObjectives, 3));
  const chosen = [];
  for (let index = 0; index < Math.max(1, count - 1); index += 1) {
    const candidates = allowed.filter((verb) => !chosen.includes(verb));
    const list = candidates.length ? candidates : allowed;
    chosen.push(list[hash32(`${seedKey}:verb:${index}`) % list.length]);
  }
  if (family.allowedVerbs.includes('return') && chosen.length < count) chosen.push('return');
  while (chosen.length < count) chosen.push(allowed[chosen.length % allowed.length]);
  return chosen.slice(0, count);
}

const ROLE_PREFERENCES = freeze({
  return: freeze(['route', 'safe-zone', 'district-core', 'transit', 'public-space']),
  rescue: freeze(['rescue', 'resident', 'shelter']),
  escort: freeze(['route', 'transit', 'safe-zone', 'resident']),
  construct: freeze(['plot', 'civic-support', 'district-core']),
  repair: freeze(['maintenance', 'relay', 'utility', 'industrial']),
  calibrate: freeze(['transit', 'stabilizer', 'grounding', 'maintenance'])
});

function roleCandidates(family, verb, seedKey, index, availableRoleSet = null) {
  const compatibleRoles = availableRoleSet && availableRoleSet.size
    ? family.validCellRoles.filter((role) => availableRoleSet.has(role))
    : [...family.validCellRoles];
  const roles = compatibleRoles.length ? compatibleRoles : [...family.validCellRoles];
  const preferences = ROLE_PREFERENCES[verb] || freeze([]);
  return roles.sort((a, b) => {
    const prefA = preferences.indexOf(a); const prefB = preferences.indexOf(b);
    if (prefA >= 0 || prefB >= 0) {
      if (prefA < 0) return 1;
      if (prefB < 0) return -1;
      if (prefA !== prefB) return prefA - prefB;
    }
    const scoreA = hash32(`${seedKey}:role:${verb}:${index}:${a}`);
    const scoreB = hash32(`${seedKey}:role:${verb}:${index}:${b}`);
    return scoreA - scoreB || a.localeCompare(b);
  });
}

function assignObjectiveRoles({ family, verbs, seedKey, candidateCells = [], availableRoleSet = null }) {
  if (!candidateCells.length) return verbs.map((verb, index) => roleCandidates(family, verb, seedKey, index, availableRoleSet)[0]);
  const cells = candidateCells.filter((cell) => cell?.cellId && Array.isArray(cell?.roles));
  let solved = null;
  const search = (index, usedCellIds, roles) => {
    if (index >= verbs.length) { solved = roles; return true; }
    const verb = verbs[index];
    for (const role of roleCandidates(family, verb, seedKey, index, availableRoleSet)) {
      const eligibleCells = cells
        .filter((cell) => cell.roles.includes(role) && !usedCellIds.has(cell.cellId))
        .sort((a, b) => {
          const scoreA = hash32(`${seedKey}:role-cell:${verb}:${index}:${role}:${a.cellId}`);
          const scoreB = hash32(`${seedKey}:role-cell:${verb}:${index}:${role}:${b.cellId}`);
          return scoreA - scoreB || a.cellId.localeCompare(b.cellId);
        });
      for (const cell of eligibleCells) {
        const nextUsed = new Set(usedCellIds); nextUsed.add(cell.cellId);
        if (search(index + 1, nextUsed, [...roles, role])) return true;
      }
    }
    return false;
  };
  search(0, new Set(), []);
  return solved;
}

function rankFamilies({ worldId, seedKey, history, availableRoleSet = null, candidateCells = [] }) {
  const families = EON_CITY_RT91_MISSION_FAMILIES.filter((entry) => {
    if (entry.worldId !== worldId) return false;
    if (!availableRoleSet || !availableRoleSet.size) return true;
    const targetCount = Math.max(entry.minimumObjectives, Math.min(entry.maximumObjectives, 3));
    const compatibleCellCount = candidateCells.filter((cell) => Array.isArray(cell?.roles) && cell.roles.some((role) => entry.validCellRoles.includes(role))).length;
    return entry.validCellRoles.some((role) => availableRoleSet.has(role)) && compatibleCellCount >= targetCount;
  });
  return families.map((family) => {
    const objectiveSignature = family.allowedVerbs.join('-');
    const anti = scoreEonCityRt91ActivityCandidate({ familyId: family.id, objectiveSignature }, history);
    const deterministicJitter = hash32(`${seedKey}:${family.id}`) % 23;
    return { family, score: anti.score * 100 + deterministicJitter };
  }).sort((a, b) => b.score - a.score || a.family.id.localeCompare(b.family.id));
}

export function generateEonCityRt91DeterministicContract({ worldId = '', worldSeed = 'rt91-world', cycleKey = 'default', contractIndex = 0, history = [], candidateCells = [] } = {}) {
  const world = clean(worldId);
  const seedKey = `${worldSeed}:${world}:${cycleKey}:${Math.max(0, Number(contractIndex) || 0)}`;
  const availableRoleSet = candidateCells.length ? new Set(candidateCells.flatMap((cell) => Array.isArray(cell?.roles) ? cell.roles : [])) : null;
  const rankedFamilies = rankFamilies({ worldId: world, seedKey, history, availableRoleSet, candidateCells });
  if (!rankedFamilies.length) return freeze({ ok: false, reason: availableRoleSet?.size ? 'no-compatible-cells-for-family' : 'world-has-no-certified-family' });
  let family = null; let verbs = null; let roleAssignment = null;
  for (const ranked of rankedFamilies) {
    const nextVerbs = deterministicObjectiveVerbs(ranked.family, seedKey);
    const nextRoles = assignObjectiveRoles({ family: ranked.family, verbs: nextVerbs, seedKey, candidateCells, availableRoleSet });
    if (nextRoles?.length === nextVerbs.length) { family = ranked.family; verbs = nextVerbs; roleAssignment = nextRoles; break; }
  }
  if (!family || !verbs || !roleAssignment) return freeze({ ok: false, reason: 'no-compatible-objective-placement' });
  const objectives = verbs.map((verb, index) => {
    const role = roleAssignment[index];
    const suffix = hash32(`${seedKey}:${family.id}:${verb}:${index}`).toString(36).slice(0, 6);
    return freeze({
      id: `${verb}-${role}-${index + 1}-${suffix}`,
      verb,
      cellRole: role,
      action: `${verb}-${role}-${suffix}`,
      label: `${VERB_LABELS[verb] || verb} ${role.replaceAll('-', ' ')}`,
      automaticCompletion: false
    });
  });
  const missionId = `contract-${world}-${family.id}-${hash32(seedKey).toString(36)}`;
  const template = freeze({
    schema: EON_CITY_RT91_MISSION_GRAMMAR_SCHEMA,
    id: missionId,
    label: `${family.label} · ${String(cycleKey).slice(0, 32)}`,
    worldId: world,
    familyId: family.id,
    objectives: freeze(objectives),
    grantsXp: false,
    mutatesProgression: false,
    rewardAuthority: false,
    privateContentStored: false,
    networkRequestCreated: false,
    runtimeAiRequired: false,
    aiMayChangeCompletionAuthority: false
  });
  const validation = validateEonCityRt91MissionTemplate(template);
  if (!validation.ok) return freeze({ ok: false, reason: 'generated-template-invalid', errors: validation.errors });
  const graph = createEonCityRt91ObjectiveGraph({ missionId, objectives });
  const graphValidation = validateEonCityRt91ObjectiveGraph(graph);
  if (!graphValidation.ok) return freeze({ ok: false, reason: 'generated-graph-invalid', errors: graphValidation.errors });
  const placement = candidateCells.length ? placeEonCityRt91MissionObjectives({ missionId, objectives, candidateCells, seed: seedKey }) : null;
  if (placement && !placement.ok) return freeze({ ok: false, reason: placement.reason, template, graph, placement });
  return freeze({
    ok: true,
    schema: EON_CITY_RT91_CONTRACT_GENERATOR_SCHEMA,
    seedSignature: hash32(seedKey).toString(36),
    worldId: world,
    familyId: family.id,
    template,
    graph,
    placement,
    deterministic: true,
    awardsXp: false,
    writesProgression: false,
    runtimeAiRequired: false
  });
}

export default freeze({ EON_CITY_RT91_CONTRACT_GENERATOR_SCHEMA, generateEonCityRt91DeterministicContract });
