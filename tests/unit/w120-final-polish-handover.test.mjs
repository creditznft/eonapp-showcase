import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {
  W120_FINAL_POLISH_SCHEMA,
  buildW120FinalPolishContract,
  buildW120NewChatContinuationPrompt,
  scoreW120FinalPolishContract,
  validateW120FinalPolishContract
} from '../../assets/js/realm3d/engine/EonCityFinalPolishHandover.js';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld } from '../../assets/js/realm3d/engine/EonCityMap.js';

const packageSource = fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8');
const mapSource = fs.readFileSync(new URL('../../assets/js/realm3d/engine/EonCityMap.js', import.meta.url), 'utf8');

test('W120 final polish contract protects build/test handoff and gameplay rules', () => {
  const world = buildEonCityVoxelWorld();
  const contract = buildW120FinalPolishContract({ world, device: { desktopHighDetailAllowed: true, detailMode: 'desktop-rich' } });
  const validation = validateW120FinalPolishContract(contract);
  assert.equal(contract.schema, W120_FINAL_POLISH_SCHEMA);
  assert.equal(validation.ok, true);
  assert.ok(scoreW120FinalPolishContract(contract) >= 98);
  assert.ok(contract.buildCommands.includes('npm run build'));
  assert.ok(contract.buildCommands.includes('npm run launch:readiness'));
  assert.ok(contract.sourceSlimRules.some((rule) => /exclude node_modules/.test(rule)));
  assert.ok(contract.experienceContract.every((item) => item.ok));
});

test('W119/W120 scores are attached to EON City and generated realms', () => {
  const city = buildEonCityVoxelWorld();
  const realm = buildMyRealmVoxelWorld({ username: 'tester', seed: 'w120' });
  assert.equal(city.questOnboardingPlan.schema, 'eon.realm3d.w119.quest-onboarding.v1');
  assert.ok(city.questOnboardingScore >= 98);
  assert.equal(city.finalPolishHandover.schema, W120_FINAL_POLISH_SCHEMA);
  assert.ok(city.finalPolishHandoverScore >= 98);
  assert.ok(realm.questOnboardingScore >= 98);
  assert.ok(realm.finalPolishHandoverScore >= 98);
});

test('W120 new-chat prompt and package scripts make continuation explicit', () => {
  const prompt = buildW120NewChatContinuationPrompt();
  assert.match(prompt, /W119\/W120/);
  assert.match(prompt, /EONAPP_W119_W120_SLIM_SOURCE_HANDOFF/);
  assert.match(prompt, /private command room central/);
  assert.match(packageSource, /qa:w119-w120-final-handoff/);
  assert.match(mapSource, /finalPolishHandoverScore/);
});
