import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createEonExpanseW768BMyFrontierState, validateEonExpanseW768BMyFrontierState } from '../../assets/js/city/w768/eon-expanse-w768b-my-frontier-state.js';

const authoritativeCampaignReceipt = Object.freeze({
  id: 'campaign:signal-restoration:complete',
  campaignId: 'signal-restoration',
  completedAt: 1785792600000,
  totalXp: 2100,
  cosmeticId: 'signal-vanguard-glow'
});

const verifyCampaignReceipt = ({ campaignReceipt }) => campaignReceipt?.id === authoritativeCampaignReceipt.id && campaignReceipt?.completedAt === authoritativeCampaignReceipt.completedAt
  ? { ok: true, receipt: authoritativeCampaignReceipt }
  : { ok: false, reason: 'campaign-receipt-mismatch' };

const verifyResidentReceipt = ({ residentId, residentReceipt }) => residentReceipt?.id === `character-arc:${residentId}:complete` && residentReceipt?.residentId === residentId && residentReceipt?.completedAt === 1785792700000
  ? { ok: true, receipt: { id: residentReceipt.id, residentId, completedAt: 1785792700000 } }
  : { ok: false, reason: 'resident-receipt-mismatch' };

const earlyReceipt = Object.freeze({
  schema: 'eon.city.my-frontier-access.r08.v1',
  id: 'milestone:beacon-one-repaired',
  milestone: 'beacon-one-repaired',
  sourceMissionId: 'first-light',
  sourceObjectiveId: 'repair-beacon-one'
});
const verifyMilestoneReceipt = ({ milestoneReceipt }) => milestoneReceipt?.id === earlyReceipt.id && milestoneReceipt?.sourceObjectiveId === earlyReceipt.sourceObjectiveId
  ? { ok: true, receipt: earlyReceipt }
  : { ok: false, reason: 'my-frontier-milestone-receipt-mismatch' };

const starterReceipt = Object.freeze({
  schema: 'eon.city.my-frontier-access.r08.v1',
  id: 'access:my-frontier-starter',
  milestone: 'starter-access',
  sourceMissionId: 'none',
  sourceObjectiveId: 'none',
  verifiedMissionState: false,
  starterAccess: true,
  grantsXp: false,
  campaignComplete: false,
  grantsConstructionPermit: false,
  privateContentStored: false
});

test('W768B fails closed until an exact maintained campaign receipt is explicitly confirmed', () => {
  const controller = createEonExpanseW768BMyFrontierState({ verifyCampaignReceipt, now: () => 1785792800000 });
  assert.equal(controller.getState().unlocked, false);
  assert.equal(controller.unlockMyFrontier({ campaignReceipt: authoritativeCampaignReceipt }).reason, 'explicit-user-action-required');
  assert.equal(controller.unlockMyFrontier({ campaignReceipt: { ...authoritativeCampaignReceipt, completedAt: 1 }, explicitUserAction: true }).reason, 'campaign-receipt-mismatch');
  const unlocked = controller.unlockMyFrontier({ campaignReceipt: authoritativeCampaignReceipt, explicitUserAction: true });
  assert.equal(unlocked.ok, true);
  assert.equal(unlocked.automaticConstruction, false);
  assert.equal(controller.getState().buildingChoices['plot-central-command'], 'command-core');
  assert.equal(validateEonExpanseW768BMyFrontierState(controller.getState()).ok, true);
});

test('W768B accepts only approved building ids and never stores supplied coordinates', () => {
  const controller = createEonExpanseW768BMyFrontierState({ verifyCampaignReceipt, now: () => 1785792800000 });
  controller.unlockMyFrontier({ campaignReceipt: authoritativeCampaignReceipt, explicitUserAction: true });
  assert.equal(controller.selectBuilding({ plotId: 'plot-knowledge', buildingId: 'creator-workshop', explicitUserAction: true }).reason, 'building-not-allowed-for-plot');
  assert.equal(controller.selectBuilding({ plotId: 'plot-central-command', buildingId: 'command-core', explicitUserAction: true }).reason, 'required-building-fixed');
  const selected = controller.selectBuilding({ plotId: 'plot-knowledge', buildingId: 'project-atlas', x: 9999, z: 9999, explicitUserAction: true });
  assert.equal(selected.ok, true);
  assert.equal(controller.getState().buildingChoices['plot-knowledge'], 'project-atlas');
  assert.doesNotMatch(JSON.stringify(controller.getState()), /9999|\"x\"|\"z\"/);
});

test('W768B invites only the authored resident after a verified character-arc receipt', () => {
  const controller = createEonExpanseW768BMyFrontierState({ verifyCampaignReceipt, verifyResidentReceipt });
  controller.unlockMyFrontier({ campaignReceipt: authoritativeCampaignReceipt, explicitUserAction: true });
  assert.equal(controller.inviteResident({ slotId: 'resident-navigator', residentId: 'pathfinder', residentReceipt: { id: 'character-arc:pathfinder:complete', residentId: 'pathfinder', completedAt: 1785792700000 }, explicitUserAction: true }).reason, 'resident-not-allowed-for-slot');
  assert.equal(controller.inviteResident({ slotId: 'resident-navigator', residentId: 'navigator', residentReceipt: { id: 'forged', residentId: 'navigator', completedAt: 1785792700000 }, explicitUserAction: true }).reason, 'resident-receipt-mismatch');
  const invited = controller.inviteResident({ slotId: 'resident-navigator', residentId: 'navigator', residentReceipt: { id: 'character-arc:navigator:complete', residentId: 'navigator', completedAt: 1785792700000 }, explicitUserAction: true });
  assert.equal(invited.ok, true);
  assert.equal(controller.getSafeProjection().residents.find((entry) => entry.residentId === 'navigator').invited, true);
});

test('W768B sanitizes persisted state against current campaign authority', () => {
  const valid = createEonExpanseW768BMyFrontierState({
    verifyCampaignReceipt,
    verifyResidentReceipt,
    initial: {
      unlockReceipt: authoritativeCampaignReceipt,
      buildingChoices: { 'plot-creator': 'media-foundry', injected: 'anything' },
      residents: { 'resident-pathfinder': 'pathfinder', injected: 'person' },
      residentReceipts: { 'resident-pathfinder': { id: 'character-arc:pathfinder:complete', residentId: 'pathfinder', completedAt: 1785792700000 }, injected: { id: 'forged', residentId: 'person', completedAt: 1 } },
      privatePrompt: 'must disappear',
      rawCoordinates: { x: 12, z: 30 }
    }
  });
  assert.equal(valid.getState().unlocked, true);
  assert.equal(valid.getState().buildingChoices['plot-creator'], 'media-foundry');
  assert.equal(valid.getState().buildingChoices.injected, undefined);
  assert.equal(valid.getState().residents['resident-pathfinder'], 'pathfinder');
  assert.equal(valid.getState().residentReceipts['resident-pathfinder'].id, 'character-arc:pathfinder:complete');
  assert.equal(valid.getState().residents.injected, undefined);
  assert.equal(valid.getState().residentReceipts.injected, undefined);
  assert.doesNotMatch(JSON.stringify(valid.getState()), /must disappear|\"rawCoordinates\":/);

  const legacyWithoutReceipt = createEonExpanseW768BMyFrontierState({ verifyCampaignReceipt, verifyResidentReceipt, initial: { unlockReceipt: authoritativeCampaignReceipt, residents: { 'resident-pathfinder': 'pathfinder' } } });
  assert.deepEqual(legacyWithoutReceipt.getState().residents, {});

  const stale = createEonExpanseW768BMyFrontierState({ verifyCampaignReceipt, initial: { unlockReceipt: { ...authoritativeCampaignReceipt, id: 'forged' }, buildingChoices: { 'plot-creator': 'media-foundry' } } });
  assert.equal(stale.getState().unlocked, false);
  assert.deepEqual(stale.getState().buildingChoices, {});
});


test('R08 early Beacon One authority unlocks My Frontier access without campaign completion', () => {
  const controller = createEonExpanseW768BMyFrontierState({ verifyCampaignReceipt, verifyMilestoneReceipt, now: () => 1785792800000 });
  assert.equal(controller.unlockMyFrontierEarly({ milestoneReceipt: earlyReceipt }).reason, 'explicit-user-action-required');
  const unlocked = controller.unlockMyFrontierEarly({ milestoneReceipt: earlyReceipt, explicitUserAction: true });
  assert.equal(unlocked.ok, true);
  assert.equal(unlocked.grantsCampaignCompletion, false);
  assert.equal(unlocked.grantsXp, false);
  assert.equal(controller.getState().unlocked, true);
  assert.equal(controller.getState().unlockAuthority, 'beacon-one-restoration');
  assert.equal(controller.getState().unlockReceipt, null);
  assert.equal(controller.getState().earlyUnlockReceipt.id, earlyReceipt.id);
  assert.equal(controller.getState().buildingChoices['plot-central-command'], 'command-core');
  assert.equal(validateEonExpanseW768BMyFrontierState(controller.getState()).ok, true);
});

test('R08 early unlock persists only while the maintained milestone verifier still confirms Beacon One', () => {
  const valid = createEonExpanseW768BMyFrontierState({ verifyMilestoneReceipt, initial: { earlyUnlockReceipt: earlyReceipt, buildingChoices: { 'plot-central-command': 'command-core' }, themeId: 'signal-dawn' } });
  assert.equal(valid.getState().unlocked, true);
  const stale = createEonExpanseW768BMyFrontierState({ verifyMilestoneReceipt: () => ({ ok: false, reason: 'milestone-stale' }), initial: { earlyUnlockReceipt: earlyReceipt, buildingChoices: { 'plot-central-command': 'command-core' }, themeId: 'signal-dawn' } });
  assert.equal(stale.getState().unlocked, false);
  assert.deepEqual(stale.getState().buildingChoices, {});
});

test('L95 starter access opens My Frontier without XP, campaign completion or construction authority', () => {
  const controller = createEonExpanseW768BMyFrontierState({ now: () => 1785792800000 });
  assert.equal(controller.unlockMyFrontierStarter({ starterAccessReceipt: starterReceipt }).reason, 'explicit-user-action-required');
  const unlocked = controller.unlockMyFrontierStarter({ starterAccessReceipt: starterReceipt, explicitUserAction: true });
  assert.equal(unlocked.ok, true);
  assert.equal(unlocked.status, 'starter-access-enabled');
  assert.equal(unlocked.grantsCampaignCompletion, false);
  assert.equal(unlocked.grantsXp, false);
  assert.equal(unlocked.grantsConstructionPermit, false);
  assert.equal(controller.getState().unlocked, true);
  assert.equal(controller.getState().unlockAuthority, 'starter-access');
  assert.equal(controller.getState().starterAccessReceipt.id, starterReceipt.id);
  assert.equal(controller.getState().unlockReceipt, null);
  assert.equal(controller.getState().earlyUnlockReceipt, null);
  assert.equal(controller.getSafeProjection().starterAccess, true);
  assert.equal(controller.getState().buildingChoices['plot-central-command'], 'command-core');
  assert.equal(validateEonExpanseW768BMyFrontierState(controller.getState()).ok, true);
});

test('RT92 reconciles a previously processed canonical starter receipt without duplicate ledger writes', () => {
  const ledgerId = `my-frontier-unlock:${starterReceipt.id}`;
  const controller = createEonExpanseW768BMyFrontierState({
    now: () => 1785792800000,
    initial: {
      processedReceipts: [ledgerId],
      starterAccessReceipt: null,
      buildingChoices: {},
      themeId: ''
    }
  });
  assert.equal(controller.getState().unlocked, false);
  assert.deepEqual(controller.getState().processedReceipts, [ledgerId]);

  const reconciled = controller.unlockMyFrontierStarter({ starterAccessReceipt: starterReceipt, explicitUserAction: true });
  assert.equal(reconciled.ok, true);
  assert.equal(reconciled.status, 'starter-access-reconciled');
  assert.equal(reconciled.grantsXp, false);
  assert.equal(reconciled.grantsCampaignCompletion, false);
  assert.equal(reconciled.grantsConstructionPermit, false);
  assert.equal(controller.getState().unlocked, true);
  assert.equal(controller.getState().unlockAuthority, 'starter-access');
  assert.equal(controller.getState().starterAccessReceipt.id, starterReceipt.id);
  assert.deepEqual(controller.getState().processedReceipts, [ledgerId]);
  assert.equal(controller.getState().buildingChoices['plot-central-command'], 'command-core');
  assert.equal(validateEonExpanseW768BMyFrontierState(controller.getState()).ok, true);
});

test('L95 starter access persists only as the bounded non-progression authority', () => {
  const valid = createEonExpanseW768BMyFrontierState({
    initial: {
      starterAccessReceipt: starterReceipt,
      buildingChoices: { 'plot-central-command': 'command-core', 'plot-knowledge': 'project-atlas' },
      themeId: 'signal-dawn',
      privatePrompt: 'must disappear',
      rawCoordinates: { x: 999, z: 999 }
    }
  });
  const state = valid.getState();
  assert.equal(state.unlocked, true);
  assert.equal(state.unlockAuthority, 'starter-access');
  assert.equal(state.starterAccessReceipt.id, starterReceipt.id);
  assert.equal(state.buildingChoices['plot-knowledge'], 'project-atlas');
  assert.equal(state.unlockReceipt, null);
  assert.equal(state.earlyUnlockReceipt, null);
  assert.doesNotMatch(JSON.stringify(state), /must disappear|\"rawCoordinates\":|999/);
  assert.equal(validateEonExpanseW768BMyFrontierState(state).ok, true);

  const forged = createEonExpanseW768BMyFrontierState({
    initial: { starterAccessReceipt: { ...starterReceipt, starterAccess: false }, buildingChoices: { 'plot-knowledge': 'project-atlas' } }
  });
  assert.equal(forged.getState().unlocked, false);
  assert.deepEqual(forged.getState().buildingChoices, {});
});

test('W768B is a bounded state authority and creates no renderer, network or public property system', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768b-my-frontier-state.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)\s*\(/);
  assert.doesNotMatch(source, /runRenderLoop\s*\(|fetch\s*\(|localStorage/);
  assert.doesNotMatch(source, /wallet|marketplace|payout|tradable\s*:\s*true/i);
});
