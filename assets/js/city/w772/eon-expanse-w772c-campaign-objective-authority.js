/** W772C — explicit completion-authority contract for all Signal Frontier campaign objectives. */
import { EON_EXPANSE_W766E_CAMPAIGN, EON_EXPANSE_W766E_OBJECTIVE_GUIDANCE } from '../w766/eon-expanse-w766e-mission-runtime.js';

const freeze = Object.freeze;
export const EON_EXPANSE_W772C_OBJECTIVE_AUTHORITY_SCHEMA = 'eon.expanse.campaign-objective-authority.w772c.v1';

const entry = (objectiveId, authority, interactionLabel, { physical = false, explicit = true, receiptBacked = true } = {}) => freeze({
  objectiveId,
  authority,
  interactionLabel,
  physical,
  explicitUserAction: explicit,
  receiptBacked,
  workspaceCompletionAllowed: false,
  automaticXpAllowed: false
});

export const EON_EXPANSE_W772C_OBJECTIVE_AUTHORITIES = freeze([
  entry('review-expedition', 'hub-reviewed-entry', 'Review the expedition at the Expanse Gate.'),
  entry('enter-expanse', 'world-mode-confirmation', 'Confirm entry after review.'),
  entry('detect-companion-signal', 'arrival-signal-detection', 'Enter Signal Frontier and detect the nearby signal.', { explicit: false }),
  entry('scan-dormant-eonbot', 'physical-rescue-interaction', 'Interact with dormant EONBOT.', { physical: true }),
  entry('recover-signal-core', 'physical-rescue-interaction', 'Pick up the nearby signal core.', { physical: true }),
  entry('restore-companion-link', 'physical-rescue-interaction', 'Return to EONBOT and restore the link.', { physical: true }),
  entry('meet-pathfinder', 'npc-interaction', 'Speak with Pathfinder.', { physical: true }),
  entry('activate-map', 'maintained-map-action', 'Open the Expanse Map.'),
  entry('visit-overlook', 'physical-zone-arrival', 'Walk to the Gateway Overlook panorama.', { physical: true, explicit: false }),
  entry('reach-beacon-one', 'physical-zone-arrival', 'Travel to Beacon Fields.', { physical: true, explicit: false }),
  entry('scan-beacon-one', 'physical-landmark-interaction', 'Inspect Beacon One.', { physical: true }),
  entry('recover-signal-components', 'physical-landmark-interaction', 'Recover components from Beacon One.', { physical: true }),
  entry('repair-beacon-one', 'physical-landmark-interaction', 'Complete the Beacon One repair.', { physical: true }),
  entry('reveal-beacon-fields', 'verified-restoration-projection', 'Finish the Beacon One restoration sequence.', { explicit: false }),
  entry('reach-archive-ruins', 'physical-zone-arrival', 'Travel to Archive Ruins.', { physical: true, explicit: false }),
  entry('meet-navigator', 'npc-interaction', 'Speak with Navigator.', { physical: true }),
  entry('recover-archive-records', 'physical-collection-interactions', 'Recover all three archive records.', { physical: true }),
  entry('solve-signal-routing', 'physical-console-interaction', 'Use the Archive routing console.', { physical: true }),
  entry('repair-beacon-two', 'physical-landmark-interaction', 'Repair Beacon Two.', { physical: true }),
  entry('reach-transit-scar', 'physical-zone-arrival', 'Travel to Transit Scar.', { physical: true, explicit: false }),
  entry('meet-maintainer', 'npc-interaction', 'Speak with the Maintenance Worker.', { physical: true }),
  entry('activate-relay-nodes', 'physical-multi-node-interactions', 'Activate all three relay nodes.', { physical: true }),
  entry('stabilize-transit-relay', 'physical-landmark-interaction', 'Stabilize the elevated relay.', { physical: true }),
  entry('restore-regional-transit', 'physical-landmark-interaction', 'Activate the Transit core.', { physical: true }),
  entry('reach-horizon-vault', 'physical-zone-arrival', 'Travel to Horizon Vault.', { physical: true, explicit: false }),
  entry('verify-three-signals', 'physical-console-interaction', 'Verify the restored regional signals.', { physical: true }),
  entry('synchronize-regional-core', 'physical-landmark-interaction', 'Synchronize the regional core.', { physical: true }),
  entry('unlock-horizon-transit', 'physical-transit-interaction', 'Activate the Horizon Transit anchor.', { physical: true }),
  entry('open-vault-route', 'physical-threshold-interaction', 'Open the Vault route.', { physical: true }),
  entry('enter-vault-chamber', 'physical-zone-arrival', 'Enter the Vault Reveal chamber.', { physical: true, explicit: false }),
  entry('claim-signal-vanguard', 'reviewed-reward-interaction', 'Claim Signal Vanguard at the pedestal.', { physical: true }),
  entry('activate-cosmetic', 'reviewed-reward-interaction', 'Activate the owned cosmetic.', { physical: true }),
  entry('return-command-hub', 'explicit-hub-return', 'Use the maintained Return to Command Hub control.'),
  entry('confirm-campaign-receipt', 'mission-board-confirmation', 'Confirm the completed campaign receipt on the Mission Board.')
]);

const byObjective = new Map(EON_EXPANSE_W772C_OBJECTIVE_AUTHORITIES.map((value) => [value.objectiveId, value]));

export function getEonExpanseW772CObjectiveAuthority(objectiveId = '') {
  return byObjective.get(String(objectiveId || '')) || null;
}

export function deriveEonExpanseW772CCurrentObjectiveAuthority(campaignBoard = {}) {
  const objectiveId = String(campaignBoard?.activeMission?.currentObjective || campaignBoard?.active?.objective || '');
  const authority = getEonExpanseW772CObjectiveAuthority(objectiveId);
  if (!authority) return freeze({ schema: EON_EXPANSE_W772C_OBJECTIVE_AUTHORITY_SCHEMA, active: false, objectiveId, reason: objectiveId ? 'objective-authority-missing' : 'no-active-objective' });
  return freeze({
    schema: EON_EXPANSE_W772C_OBJECTIVE_AUTHORITY_SCHEMA,
    active: true,
    objectiveId,
    missionId: String(campaignBoard?.activeMission?.id || campaignBoard?.active?.id || ''),
    guidance: EON_EXPANSE_W766E_OBJECTIVE_GUIDANCE[objectiveId]?.label || '',
    ...authority,
    detail: `${authority.interactionLabel} Progress is recorded only by ${authority.authority.replaceAll('-', ' ')} authority.`
  });
}

export function validateEonExpanseW772CCampaignAuthorityContract() {
  const objectives = EON_EXPANSE_W766E_CAMPAIGN.flatMap((mission) => mission.objectives);
  const expected = new Set(objectives);
  const actual = new Set(EON_EXPANSE_W772C_OBJECTIVE_AUTHORITIES.map((value) => value.objectiveId));
  const missing = objectives.filter((objectiveId) => !actual.has(objectiveId));
  const unknown = [...actual].filter((objectiveId) => !expected.has(objectiveId));
  const duplicates = EON_EXPANSE_W772C_OBJECTIVE_AUTHORITIES.map((value) => value.objectiveId).filter((value, index, values) => values.indexOf(value) !== index);
  return freeze({
    ok: missing.length === 0 && unknown.length === 0 && duplicates.length === 0,
    schema: EON_EXPANSE_W772C_OBJECTIVE_AUTHORITY_SCHEMA,
    objectiveCount: objectives.length,
    authorityCount: actual.size,
    physicalObjectiveCount: EON_EXPANSE_W772C_OBJECTIVE_AUTHORITIES.filter((value) => value.physical).length,
    explicitObjectiveCount: EON_EXPANSE_W772C_OBJECTIVE_AUTHORITIES.filter((value) => value.explicitUserAction).length,
    missing: freeze(missing),
    unknown: freeze(unknown),
    duplicates: freeze(duplicates),
    workspaceCompletionAllowed: false,
    fabricatedCompletionAllowed: false
  });
}

export default freeze({ EON_EXPANSE_W772C_OBJECTIVE_AUTHORITY_SCHEMA, EON_EXPANSE_W772C_OBJECTIVE_AUTHORITIES, getEonExpanseW772CObjectiveAuthority, deriveEonExpanseW772CCurrentObjectiveAuthority, validateEonExpanseW772CCampaignAuthorityContract });
