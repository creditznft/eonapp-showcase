import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EON_CITY_R08_MY_FRONTIER_ENTRY,
  deriveEonCityR08MyFrontierEntry,
  deriveEonCityR08MyFrontierStarterReceipt,
  deriveEonCityR08MyFrontierUnlockReceipt,
  verifyEonCityR08MyFrontierUnlockReceipt
} from '../../assets/js/city/r08/eon-city-r08-my-frontier-access.js';

const read = (relative) => fs.readFileSync(new URL(`../../${relative}`, import.meta.url), 'utf8');
const missionLedger = {
  missions: {
    'first-light': { completedObjectives: ['reach-beacon-one', 'scan-beacon-one', 'recover-signal-components', 'repair-beacon-one'] }
  }
};

test('R08 derives early My Frontier access only from the canonical Beacon One objective', () => {
  assert.equal(deriveEonCityR08MyFrontierUnlockReceipt({ missions: { 'first-light': { completedObjectives: ['scan-beacon-one'] } } }), null);
  const receipt = deriveEonCityR08MyFrontierUnlockReceipt(missionLedger);
  assert.equal(receipt.id, 'milestone:beacon-one-repaired');
  assert.equal(receipt.campaignComplete, false);
  assert.equal(receipt.grantsXp, false);
  assert.equal(receipt.grantsConstructionPermit, false);
  assert.equal(verifyEonCityR08MyFrontierUnlockReceipt({ milestoneReceipt: receipt, missionLedger }).ok, true);
});



test('R08 starter receipt opens My Frontier without forging progression authority', () => {
  const receipt = deriveEonCityR08MyFrontierStarterReceipt();
  assert.equal(receipt.id, 'access:my-frontier-starter');
  assert.equal(receipt.milestone, 'starter-access');
  assert.equal(receipt.starterAccess, true);
  assert.equal(receipt.verifiedMissionState, false);
  assert.equal(receipt.campaignComplete, false);
  assert.equal(receipt.grantsXp, false);
  assert.equal(receipt.grantsConstructionPermit, false);
});

test('R08 My Frontier direct entry uses one fixed authored safe point', () => {
  const entry = deriveEonCityR08MyFrontierEntry({ unlocked: true });
  assert.equal(entry.available, true);
  assert.deepEqual(entry.target, EON_CITY_R08_MY_FRONTIER_ENTRY);
  assert.equal(entry.target.rawCoordinatesAccepted, false);
  assert.equal(entry.campaignCompletionRequired, false);
  assert.equal(entry.automaticMovement, false);
});

test('R08 runtime wires starter access and direct Explore entry without awarding campaign completion', () => {
  const runtime = read('assets/js/city/w731/eon-city-w731-command-hub-runtime.js');
  assert.match(runtime, /verifyEonCityR08MyFrontierUnlockReceipt/);
  assert.match(runtime, /deriveEonCityR08MyFrontierStarterReceipt/);
  assert.match(runtime, /unlockMyFrontierStarter/);
  assert.match(runtime, /unlockMyFrontierEarly/);
  assert.match(runtime, /enterMyFrontier/);
  assert.match(runtime, /runtime\.enterExpanse\(\{ explicitUserAction: true, starterAccess: true \}\)/);
  assert.match(runtime, /expanseWorldMode\.beginStarterEntry\(\{ snapshot, explicitUserAction \}\)/);
  assert.match(runtime, /data-eon-city-menu-open-my-frontier/);
  assert.match(runtime, /campaignCompletionRequired: false/);
});
