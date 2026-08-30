/** W768Z — explicit authored-resident reaction authority for My Frontier. */
export const EON_EXPANSE_W768Z_RESIDENT_REACTION_SCHEMA = 'eon.expanse.my-frontier-resident-reaction.w768z.v1';
const freeze = Object.freeze;

export function deriveEonExpanseW768ZResidentReaction({
  slotId = '',
  residentId = '',
  explicitUserAction = false,
  presentedResident = null
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required', grantsXp: false, mutatesMissionState: false });
  if (!presentedResident || presentedResident.status !== 'presented-authored-resident') return freeze({ ok: false, reason: 'authored-resident-not-presented', grantsXp: false, mutatesMissionState: false });
  if (String(slotId || '') !== String(presentedResident.slotId || '')) return freeze({ ok: false, reason: 'resident-slot-changed', grantsXp: false, mutatesMissionState: false });
  if (String(residentId || '') !== String(presentedResident.residentId || '')) return freeze({ ok: false, reason: 'resident-identity-changed', grantsXp: false, mutatesMissionState: false });
  if (!presentedResident.requestKey || !presentedResident.interactionName) return freeze({ ok: false, reason: 'resident-interaction-clip-unavailable', grantsXp: false, mutatesMissionState: false });
  return freeze({
    ok: true,
    schema: EON_EXPANSE_W768Z_RESIDENT_REACTION_SCHEMA,
    action: freeze({
      type: 'play-authored-resident-interaction',
      slotId: presentedResident.slotId,
      residentId: presentedResident.residentId,
      requestKey: presentedResident.requestKey,
      interactionKind: presentedResident.interactionKind || 'talk',
      interactionName: presentedResident.interactionName,
      idleName: presentedResident.idleName || ''
    }),
    explicitUserAction: true,
    grantsXp: false,
    mutatesMissionState: false,
    automaticDialogue: false,
    privateContentStored: false
  });
}

export default freeze({
  EON_EXPANSE_W768Z_RESIDENT_REACTION_SCHEMA,
  deriveEonExpanseW768ZResidentReaction
});
