/**
 * RT91 — deterministic mission grammar shared by Signal, Storm and My Frontier.
 *
 * The grammar defines legal objective verbs and world-specific families. It
 * does not grant XP, write progression, invoke AI, place arbitrary geometry or
 * select rewards. Later generators must emit missions that validate here first.
 */
export const EON_CITY_RT91_MISSION_GRAMMAR_SCHEMA = 'eon.city.mission-grammar.rt91.v1';

const freeze = Object.freeze;
const frozenArray = (values = []) => freeze([...values]);
const id = (value = '') => String(value || '').trim().toLowerCase();

export const EON_CITY_RT91_OBJECTIVE_VERBS = freeze([
  'reach', 'inspect', 'scan', 'recover', 'repair', 'route', 'activate', 'stabilize',
  'rescue', 'escort', 'construct', 'calibrate', 'investigate', 'return'
]);

const family = (worldId, familyId, label, verbs, validCellRoles, minimumObjectives = 2, maximumObjectives = 4) => freeze({
  worldId,
  id: familyId,
  label,
  allowedVerbs: frozenArray(verbs),
  validCellRoles: frozenArray(validCellRoles),
  minimumObjectives,
  maximumObjectives,
  requiresCertifiedTemplate: true,
  aiMayRewriteObjectiveTextOnly: true,
  aiMayChangeCompletionAuthority: false,
  rewardsResolvedElsewhere: true
});

export const EON_CITY_RT91_MISSION_FAMILIES = freeze([
  family('signal-frontier', 'signal-restoration-contract', 'Signal Restoration', ['reach', 'inspect', 'scan', 'repair', 'activate', 'return'], ['relay', 'beacon', 'maintenance', 'route']),
  family('signal-frontier', 'archive-recovery-contract', 'Archive Recovery', ['reach', 'inspect', 'scan', 'recover', 'investigate', 'return'], ['archive', 'ruin', 'memory', 'research']),
  family('signal-frontier', 'transit-calibration-contract', 'Transit Calibration', ['reach', 'inspect', 'route', 'activate', 'calibrate', 'return'], ['transit', 'junction', 'route', 'maintenance']),
  family('signal-frontier', 'frontier-rescue-contract', 'Frontier Rescue', ['reach', 'investigate', 'scan', 'rescue', 'escort', 'return'], ['public', 'maintenance', 'route', 'shelter']),

  family('storm-sector', 'weather-restoration-contract', 'Weather Restoration', ['reach', 'inspect', 'calibrate', 'stabilize', 'activate', 'return'], ['stabilizer', 'grounding', 'weather-array', 'safe-zone']),
  family('storm-sector', 'relay-repair-contract', 'Storm Relay Repair', ['reach', 'inspect', 'recover', 'repair', 'activate', 'return'], ['relay', 'industrial', 'maintenance', 'grounding']),
  family('storm-sector', 'storm-rescue-contract', 'Storm Rescue', ['reach', 'scan', 'investigate', 'rescue', 'escort', 'return'], ['rescue', 'shelter', 'safe-zone', 'transit']),
  family('storm-sector', 'charged-transit-contract', 'Charged Transit', ['reach', 'inspect', 'route', 'stabilize', 'calibrate', 'return'], ['transit', 'grounding', 'industrial', 'safe-zone']),

  family('my-frontier', 'district-development-contract', 'District Development', ['reach', 'inspect', 'construct', 'activate', 'return'], ['district-core', 'civic-support', 'plot', 'public-space']),
  family('my-frontier', 'city-maintenance-contract', 'City Maintenance', ['reach', 'inspect', 'repair', 'calibrate', 'activate', 'return'], ['utility', 'transit', 'public-space', 'maintenance']),
  family('my-frontier', 'resident-assistance-contract', 'Resident Assistance', ['reach', 'investigate', 'recover', 'escort', 'return'], ['resident', 'district-core', 'public-space', 'transit']),
  family('my-frontier', 'productive-rpg-contract', 'Productive Mission', ['reach', 'inspect', 'activate', 'return'], ['district-core', 'productive-station'], 2, 3)
]);

const verbSet = new Set(EON_CITY_RT91_OBJECTIVE_VERBS);
const familyMap = new Map(EON_CITY_RT91_MISSION_FAMILIES.map((entry) => [`${entry.worldId}:${entry.id}`, entry]));

export function getEonCityRt91MissionFamily(worldId = '', familyId = '') {
  return familyMap.get(`${id(worldId)}:${id(familyId)}`) || null;
}

export function validateEonCityRt91MissionTemplate(template = {}) {
  const errors = [];
  const worldId = id(template.worldId);
  const familyId = id(template.familyId);
  const familyEntry = getEonCityRt91MissionFamily(worldId, familyId);
  const objectives = Array.isArray(template.objectives) ? template.objectives : [];
  if (template.schema !== EON_CITY_RT91_MISSION_GRAMMAR_SCHEMA) errors.push('schema');
  if (!familyEntry) errors.push('family');
  if (!/^[a-z0-9-]{3,96}$/.test(id(template.id))) errors.push('mission-id');
  if (!template.label || String(template.label).length > 120) errors.push('label');
  if (familyEntry) {
    if (objectives.length < familyEntry.minimumObjectives || objectives.length > familyEntry.maximumObjectives) errors.push('objective-count');
    const allowed = new Set(familyEntry.allowedVerbs);
    for (const [index, objective] of objectives.entries()) {
      const verb = id(objective?.verb);
      const cellRole = id(objective?.cellRole);
      if (!verbSet.has(verb) || !allowed.has(verb)) errors.push(`objective-verb:${index}`);
      if (!familyEntry.validCellRoles.includes(cellRole)) errors.push(`objective-cell-role:${index}`);
      if (!/^[a-z0-9-]{3,120}$/.test(id(objective?.action))) errors.push(`objective-action:${index}`);
      if (objective?.automaticCompletion === true) errors.push(`objective-auto-completion:${index}`);
    }
  }
  if (template.grantsXp === true || template.mutatesProgression === true || template.rewardAuthority === true) errors.push('progression-owned-by-template');
  if (template.privateContentStored === true || template.networkRequestCreated === true) errors.push('privacy-network-boundary');
  if (template.runtimeAiRequired === true || template.aiMayChangeCompletionAuthority === true) errors.push('ai-authority-boundary');
  return freeze({ ok: errors.length === 0, errors: frozenArray(errors), worldId, familyId, objectiveCount: objectives.length });
}

export function validateEonCityRt91MissionGrammar() {
  const errors = [];
  const worldIds = new Set(EON_CITY_RT91_MISSION_FAMILIES.map((entry) => entry.worldId));
  for (const required of ['signal-frontier', 'storm-sector', 'my-frontier']) if (!worldIds.has(required)) errors.push(`world-family-missing:${required}`);
  for (const entry of EON_CITY_RT91_MISSION_FAMILIES) {
    if (entry.allowedVerbs.some((verb) => !verbSet.has(verb))) errors.push(`unknown-verb:${entry.id}`);
    if ((entry.validCellRoles?.length || 0) < 2) errors.push(`cell-roles:${entry.id}`);
    if (entry.minimumObjectives < 2 || entry.maximumObjectives > 4 || entry.minimumObjectives > entry.maximumObjectives) errors.push(`objective-bounds:${entry.id}`);
    if (entry.aiMayChangeCompletionAuthority !== false || entry.rewardsResolvedElsewhere !== true) errors.push(`authority:${entry.id}`);
  }
  if (new Set(EON_CITY_RT91_MISSION_FAMILIES.map((entry) => `${entry.worldId}:${entry.id}`)).size !== EON_CITY_RT91_MISSION_FAMILIES.length) errors.push('duplicate-family');
  return freeze({ ok: errors.length === 0, errors: frozenArray(errors), familyCount: EON_CITY_RT91_MISSION_FAMILIES.length, objectiveVerbCount: EON_CITY_RT91_OBJECTIVE_VERBS.length });
}

export default freeze({
  EON_CITY_RT91_MISSION_GRAMMAR_SCHEMA,
  EON_CITY_RT91_OBJECTIVE_VERBS,
  EON_CITY_RT91_MISSION_FAMILIES,
  getEonCityRt91MissionFamily,
  validateEonCityRt91MissionTemplate,
  validateEonCityRt91MissionGrammar
});
