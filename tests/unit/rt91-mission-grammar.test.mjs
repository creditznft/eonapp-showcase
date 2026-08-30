import assert from 'node:assert/strict';
import test from 'node:test';

import {
  EON_CITY_RT91_MISSION_GRAMMAR_SCHEMA,
  EON_CITY_RT91_MISSION_FAMILIES,
  EON_CITY_RT91_OBJECTIVE_VERBS,
  getEonCityRt91MissionFamily,
  validateEonCityRt91MissionGrammar,
  validateEonCityRt91MissionTemplate
} from '../../assets/js/city/rt91/eon-city-rt91-mission-grammar.js';

test('RT91 mission grammar covers all three worlds with bounded certified objective verbs', () => {
  const result = validateEonCityRt91MissionGrammar();
  assert.equal(result.ok, true, result.errors.join(', '));
  assert.equal(result.familyCount, 12);
  assert.equal(result.objectiveVerbCount, 14);
  assert.ok(EON_CITY_RT91_OBJECTIVE_VERBS.includes('repair'));
  assert.ok(EON_CITY_RT91_OBJECTIVE_VERBS.includes('rescue'));
  assert.ok(EON_CITY_RT91_OBJECTIVE_VERBS.includes('construct'));
  assert.ok(getEonCityRt91MissionFamily('storm-sector', 'storm-rescue-contract'));
});

test('RT91 accepts a deterministic Signal restoration template but owns no rewards/progression', () => {
  const template = {
    schema: EON_CITY_RT91_MISSION_GRAMMAR_SCHEMA,
    id: 'repair-relay-cell-a12',
    label: 'Repair the relay cell',
    worldId: 'signal-frontier',
    familyId: 'signal-restoration-contract',
    objectives: [
      { verb: 'reach', cellRole: 'relay', action: 'reach-relay-cell', automaticCompletion: false },
      { verb: 'inspect', cellRole: 'relay', action: 'inspect-relay-console', automaticCompletion: false },
      { verb: 'repair', cellRole: 'maintenance', action: 'repair-relay-console', automaticCompletion: false }
    ],
    grantsXp: false,
    mutatesProgression: false,
    rewardAuthority: false,
    privateContentStored: false,
    networkRequestCreated: false,
    runtimeAiRequired: false,
    aiMayChangeCompletionAuthority: false
  };
  assert.equal(validateEonCityRt91MissionTemplate(template).ok, true);
});

test('RT91 rejects impossible cross-family verbs and automatic completion', () => {
  const invalid = {
    schema: EON_CITY_RT91_MISSION_GRAMMAR_SCHEMA,
    id: 'bad-storm-template',
    label: 'Bad Storm Template',
    worldId: 'storm-sector',
    familyId: 'storm-rescue-contract',
    objectives: [
      { verb: 'construct', cellRole: 'rescue', action: 'construct-random-tower', automaticCompletion: true },
      { verb: 'rescue', cellRole: 'rescue', action: 'rescue-worker', automaticCompletion: false }
    ]
  };
  const result = validateEonCityRt91MissionTemplate(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('objective-verb:0'));
  assert.ok(result.errors.includes('objective-auto-completion:0'));
});

test('RT91 grammar prevents templates from becoming progression or AI authorities', () => {
  const family = EON_CITY_RT91_MISSION_FAMILIES.find((entry) => entry.worldId === 'my-frontier' && entry.id === 'productive-rpg-contract');
  const invalid = {
    schema: EON_CITY_RT91_MISSION_GRAMMAR_SCHEMA,
    id: 'productive-ai-authority',
    label: 'Productive AI Authority',
    worldId: 'my-frontier',
    familyId: family.id,
    objectives: [
      { verb: 'reach', cellRole: 'productive-station', action: 'reach-productive-station', automaticCompletion: false },
      { verb: 'activate', cellRole: 'productive-station', action: 'activate-productive-station', automaticCompletion: false }
    ],
    grantsXp: true,
    mutatesProgression: true,
    runtimeAiRequired: true,
    aiMayChangeCompletionAuthority: true
  };
  const result = validateEonCityRt91MissionTemplate(invalid);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('progression-owned-by-template'));
  assert.ok(result.errors.includes('ai-authority-boundary'));
});
