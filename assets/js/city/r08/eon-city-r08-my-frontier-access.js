/**
 * R08 — early My Frontier access authority.
 *
 * Public starter access opens the existing authored My Frontier world without
 * requiring Signal Frontier completion. Beacon One and campaign receipts remain
 * valid progression provenance for separately gated advanced construction; none
 * of these entry receipts grants XP, campaign completion, a construction permit
 * or raw-coordinate authority by itself.
 */
import { EON_EXPANSE_W768I_WORLD_OFFSET } from '../w768/eon-expanse-w768i-my-frontier-visual-model.js';

const freeze = Object.freeze;
export const EON_CITY_R08_MY_FRONTIER_ACCESS_SCHEMA = 'eon.city.my-frontier-access.r08.v1';
export const EON_CITY_R08_MY_FRONTIER_UNLOCK_MILESTONE = 'beacon-one-repaired';
export const EON_CITY_R08_MY_FRONTIER_UNLOCK_RECEIPT_ID = 'milestone:beacon-one-repaired';
export const EON_CITY_R08_MY_FRONTIER_STARTER_RECEIPT_ID = 'access:my-frontier-starter';
export const EON_CITY_R08_MY_FRONTIER_ENTRY = freeze({
  x: EON_EXPANSE_W768I_WORLD_OFFSET.x,
  y: 0.15,
  z: EON_EXPANSE_W768I_WORLD_OFFSET.z + 14,
  heading: Math.PI,
  authored: true,
  rawCoordinatesAccepted: false
});

export function deriveEonCityR08MyFrontierUnlockReceipt(missionLedger = {}) {
  const mission = missionLedger?.missions?.['first-light'] || null;
  const completed = Array.isArray(mission?.completedObjectives) && mission.completedObjectives.includes('repair-beacon-one');
  if (!completed) return null;
  return freeze({
    schema: EON_CITY_R08_MY_FRONTIER_ACCESS_SCHEMA,
    id: EON_CITY_R08_MY_FRONTIER_UNLOCK_RECEIPT_ID,
    milestone: EON_CITY_R08_MY_FRONTIER_UNLOCK_MILESTONE,
    sourceMissionId: 'first-light',
    sourceObjectiveId: 'repair-beacon-one',
    verifiedMissionState: true,
    grantsXp: false,
    campaignComplete: false,
    grantsConstructionPermit: false,
    privateContentStored: false
  });
}

/**
 * L95 public starter access authority.
 *
 * This grants world entry and the normal fixed-plot planning surface only. It
 * is deliberately not a mission/campaign receipt and cannot stand in for any
 * productive construction permit, XP, cosmetic, resident or campaign proof.
 */
export function deriveEonCityR08MyFrontierStarterReceipt() {
  return freeze({
    schema: EON_CITY_R08_MY_FRONTIER_ACCESS_SCHEMA,
    id: EON_CITY_R08_MY_FRONTIER_STARTER_RECEIPT_ID,
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
}

export function verifyEonCityR08MyFrontierUnlockReceipt({ milestoneReceipt = null, missionLedger = {} } = {}) {
  const authoritative = deriveEonCityR08MyFrontierUnlockReceipt(missionLedger);
  if (!authoritative || !milestoneReceipt) return freeze({ ok: false, reason: 'beacon-one-restoration-required' });
  const exact = ['schema', 'id', 'milestone', 'sourceMissionId', 'sourceObjectiveId']
    .every((key) => String(milestoneReceipt?.[key] || '') === String(authoritative[key] || ''));
  return exact
    ? freeze({ ok: true, receipt: authoritative, mutatesMissionAuthority: false, grantsXp: false, grantsConstructionPermit: false })
    : freeze({ ok: false, reason: 'my-frontier-milestone-receipt-mismatch' });
}

export function deriveEonCityR08MyFrontierEntry({ unlocked = false } = {}) {
  return freeze({
    schema: EON_CITY_R08_MY_FRONTIER_ACCESS_SCHEMA,
    available: unlocked === true,
    target: unlocked === true ? EON_CITY_R08_MY_FRONTIER_ENTRY : null,
    directWorldEntry: unlocked === true,
    explicitUserActionRequired: true,
    automaticMovement: false,
    campaignCompletionRequired: false,
    grantsXp: false,
    grantsConstructionPermit: false,
    privateContentStored: false
  });
}

export default freeze({
  EON_CITY_R08_MY_FRONTIER_ACCESS_SCHEMA,
  EON_CITY_R08_MY_FRONTIER_UNLOCK_MILESTONE,
  EON_CITY_R08_MY_FRONTIER_UNLOCK_RECEIPT_ID,
  EON_CITY_R08_MY_FRONTIER_STARTER_RECEIPT_ID,
  EON_CITY_R08_MY_FRONTIER_ENTRY,
  deriveEonCityR08MyFrontierStarterReceipt,
  deriveEonCityR08MyFrontierUnlockReceipt,
  verifyEonCityR08MyFrontierUnlockReceipt,
  deriveEonCityR08MyFrontierEntry
});
