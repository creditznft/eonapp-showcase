import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {
  W119_QUEST_ONBOARDING_SCHEMA,
  buildW119QuestOnboardingPlan,
  scoreW119QuestOnboardingPlan,
  validateW119QuestOnboardingPlan
} from '../../assets/js/realm3d/engine/EonCityQuestOnboardingRuntime.js';

const bootSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EngineBoot.js', import.meta.url), 'utf8');
const cssSource = fs.readFileSync(new URL('../../assets/css/realm3d.css', import.meta.url), 'utf8');
const packageSource = fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8');

test('W119 builds a mobile-first quest coach from the active mission objective', () => {
  const plan = buildW119QuestOnboardingPlan({
    device: { mobile: true, touch: true, compactHud: true },
    world: 'eon-city',
    missionSnapshot: {
      activeMission: { id: 'first-arrival', title: 'First Arrival with EONBOT' },
      currentObjective: { id: 'meet-eonbot', label: 'Meet EONBOT', hint: 'Press Q or tap EONBOT.', waypoint: { type: 'companion', id: 'spawn', label: 'EONBOT companion' } },
      completedObjectives: 2,
      skippedObjectives: 0,
      totalObjectives: 7,
      progress: { status: 'active' }
    },
    voice: { voiceOptIn: true, micRequiresTap: true }
  });
  assert.equal(plan.schema, W119_QUEST_ONBOARDING_SCHEMA);
  assert.equal(plan.currentStepId, 'eonbot');
  assert.equal(plan.mobileFirst, true);
  assert.equal(plan.oneThumbSafe, true);
  assert.equal(plan.activeMission.percent, 29);
  assert.equal(plan.activeMission.waypoint.id, 'spawn');
  assert.equal(plan.privateOfficeCentral, true);
  assert.equal(plan.everyMajorVisualHasUseTarget, true);
  assert.ok(scoreW119QuestOnboardingPlan(plan) >= 98);
  assert.equal(validateW119QuestOnboardingPlan(plan).ok, true);
});

test('W119 reward cues are privacy-safe and avoid cash/investment promises', () => {
  const plan = buildW119QuestOnboardingPlan({
    device: { mobile: false, touch: false },
    missionSnapshot: {
      activeMission: { id: 'district-tour', title: 'EON City District Tour' },
      currentObjective: { id: 'return-city', label: 'Return to EON City', hint: 'Use the green exit ring.' },
      completedObjectives: 6,
      totalObjectives: 7,
      progress: { status: 'active' }
    }
  });
  assert.equal(plan.rewardCuePolicy.localOnly, true);
  assert.equal(plan.rewardCuePolicy.noCashPromise, true);
  assert.equal(plan.rewardCuePolicy.noInvestmentLanguage, true);
  assert.equal(plan.voiceOutputOptIn, true);
  assert.equal(plan.micRequiresTap, true);
  assert.ok(plan.steps.some((step) => step.id === 'workspace' && /private command room/i.test(step.title)));
});

test('W119 is wired into EngineBoot, CSS, and package QA scripts', () => {
  assert.match(bootSource, /EonCityQuestOnboardingRuntime/);
  assert.match(bootSource, /realmQuestOnboardingSession/);
  assert.match(bootSource, /getW119QuestOnboardingState/);
  assert.match(bootSource, /data-realm3d-quest/);
  assert.match(cssSource, /realm3d-w119-quest-coach/);
  assert.match(cssSource, /min-height: 48px/);
  assert.match(packageSource, /qa:w119-quest-onboarding/);
});
