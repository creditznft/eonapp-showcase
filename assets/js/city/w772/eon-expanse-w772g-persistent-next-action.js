/** W772G — durable Signal Frontier next-action projection.
 *
 * This module never mutates mission state or grants progression. It exists so
 * transient completion cards can never leave the player without one truthful
 * next step.
 */
const freeze = Object.freeze;

export const EON_EXPANSE_W772G_NEXT_ACTION_SCHEMA = 'eon.expanse.persistent-next-action.w772g.v1';

const projection = ({
  kind,
  label,
  detail,
  missionId = '',
  objectiveId = '',
  primaryAction = null,
  reason = ''
}) => freeze({
  schema: EON_EXPANSE_W772G_NEXT_ACTION_SCHEMA,
  visible: true,
  persistent: true,
  kind,
  label: String(label || ''),
  detail: String(detail || ''),
  missionId: String(missionId || ''),
  objectiveId: String(objectiveId || ''),
  primaryAction: primaryAction ? freeze({ ...primaryAction }) : null,
  reason: String(reason || ''),
  explicitUserActionRequired: true,
  grantsXp: false,
  mutatesProgression: false,
  automaticMovement: false,
  storesPrivateContent: false
});

export function deriveEonExpanseW772GPersistentNextAction({
  campaignBoard = null,
  objectiveAuthority = null,
  postCampaign = null
} = {}) {
  const activeMission = campaignBoard?.activeMission || null;
  const objectiveId = String(activeMission?.currentObjective || '');
  if (activeMission?.id && objectiveId) {
    const guidance = String(activeMission?.guidance?.label || objectiveAuthority?.interactionLabel || objectiveAuthority?.guidance || objectiveId.replaceAll('-', ' '));
    return projection({
      kind: 'active-objective',
      label: guidance,
      detail: objectiveAuthority?.physical === true
        ? `${objectiveAuthority.interactionLabel || guidance} Follow the marker, then press E / tap Use when in range.`
        : (objectiveAuthority?.interactionLabel || guidance),
      missionId: activeMission.id,
      objectiveId,
      reason: 'canonical-active-objective'
    });
  }

  if (campaignBoard?.completion?.campaignComplete === true) {
    const nextLabel = String(postCampaign?.nextLabel || 'Open the Mission Board to choose your next frontier activity.');
    return projection({
      kind: 'post-campaign',
      label: 'Signal Frontier restored — choose what comes next',
      detail: nextLabel,
      primaryAction: freeze({ kind: 'open-mission-board', label: 'Open Mission Board' }),
      reason: 'campaign-complete'
    });
  }

  const nextMission = campaignBoard?.availableMissions?.[0] || null;
  if (nextMission?.id) {
    return projection({
      kind: 'next-mission',
      label: `Next mission: ${nextMission.label}`,
      detail: `Open the Mission Board and start ${nextMission.label}.`,
      missionId: nextMission.id,
      primaryAction: freeze({ kind: 'open-mission-board', label: 'Open Mission Board' }),
      reason: 'canonical-mission-available'
    });
  }

  return projection({
    kind: 'guidance-unavailable',
    label: 'Guidance unavailable — open Mission Board',
    detail: 'The canonical mission ledger has no active objective. Open the Mission Board to restore the next approved action.',
    primaryAction: freeze({ kind: 'open-mission-board', label: 'Open Mission Board' }),
    reason: 'no-active-objective-or-available-mission'
  });
}

export default freeze({ EON_EXPANSE_W772G_NEXT_ACTION_SCHEMA, deriveEonExpanseW772GPersistentNextAction });
