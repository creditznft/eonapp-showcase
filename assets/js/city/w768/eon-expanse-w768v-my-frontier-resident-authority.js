/**
 * W768V — exact character-arc receipt authority for My Frontier residents.
 *
 * Resident availability is derived only from the maintained Signal Frontier
 * mission ledger. Future productive resident bridges remain explicitly pending
 * until they have their own native receipt authority.
 */

export const EON_EXPANSE_W768V_RESIDENT_AUTHORITY_SCHEMA = 'eon.expanse.my-frontier-resident-authority.w768v.v1';

const freeze = (value) => Object.freeze(value);
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,159}$/i;

export const EON_EXPANSE_W768V_RESIDENT_POLICIES = freeze({
  pathfinder: freeze({ residentId: 'pathfinder', slotId: 'resident-pathfinder', authority: 'campaign-mission', missionId: 'beyond-the-gate', status: 'available' }),
  navigator: freeze({ residentId: 'navigator', slotId: 'resident-navigator', authority: 'campaign-mission', missionId: 'echoes-in-the-archive', status: 'available' }),
  'maintenance-specialist': freeze({ residentId: 'maintenance-specialist', slotId: 'resident-maintenance-specialist', authority: 'campaign-mission', missionId: 'the-broken-line', status: 'available' }),
  'creator-trade-master': freeze({ residentId: 'creator-trade-master', slotId: 'resident-creator-master', authority: 'productive-character-arc', missionId: 'create-expedition', status: 'native-receipt-bridge-pending' }),
  'vault-steward': freeze({ residentId: 'vault-steward', slotId: 'resident-vault-steward', authority: 'productive-character-arc', missionId: 'knowledge-recovery', status: 'native-receipt-bridge-pending' }),
  'eon-architect': freeze({ residentId: 'eon-architect', slotId: 'resident-eon-architect', authority: 'campaign-mission', missionId: 'the-first-reveal', status: 'available' })
});

function safeReceipt(input = null) {
  if (!input || typeof input !== 'object') return null;
  const id = String(input.id || '');
  const residentId = String(input.residentId || '');
  const completedAt = Number(input.completedAt || 0);
  if (!SAFE_ID.test(id) || !SAFE_ID.test(residentId) || !Number.isFinite(completedAt) || completedAt <= 0) return null;
  return freeze({ id, residentId, completedAt, privateContentStored: false });
}

export function deriveEonExpanseW768VResidentReceipt({ residentId = '', missionLedger = null } = {}) {
  const policy = EON_EXPANSE_W768V_RESIDENT_POLICIES[String(residentId || '')] || null;
  if (!policy) return freeze({ ok: false, reason: 'resident-policy-not-found' });
  if (policy.status !== 'available') return freeze({ ok: false, reason: policy.status, policy, receipt: null });
  const mission = missionLedger?.missions?.[policy.missionId] || null;
  const completedAt = Number(mission?.completedAt || 0);
  if (mission?.status !== 'completed' || !Number.isFinite(completedAt) || completedAt <= 0) {
    return freeze({ ok: false, reason: 'character-arc-incomplete', policy, receipt: null });
  }
  const receipt = safeReceipt({
    id: `character-arc:${policy.residentId}:${policy.missionId}:${completedAt}`,
    residentId: policy.residentId,
    completedAt
  });
  if (!receipt) return freeze({ ok: false, reason: 'resident-receipt-invalid', policy, receipt: null });
  return freeze({ ok: true, policy, receipt, mutatesMissionAuthority: false, awardsXp: false });
}

export function validateEonExpanseW768VResidentReceipt({ slotId = '', residentId = '', residentReceipt = null, missionLedger = null } = {}) {
  const policy = EON_EXPANSE_W768V_RESIDENT_POLICIES[String(residentId || '')] || null;
  if (!policy || policy.slotId !== String(slotId || '')) return freeze({ ok: false, reason: 'resident-slot-policy-mismatch' });
  const current = deriveEonExpanseW768VResidentReceipt({ residentId, missionLedger });
  if (!current.ok) return current;
  const candidate = safeReceipt(residentReceipt);
  if (!candidate
    || candidate.id !== current.receipt.id
    || candidate.residentId !== current.receipt.residentId
    || candidate.completedAt !== current.receipt.completedAt) {
    return freeze({ ok: false, reason: 'resident-receipt-mismatch', policy, receipt: null });
  }
  return freeze({ ok: true, policy, receipt: current.receipt, mutatesMissionAuthority: false, awardsXp: false });
}

export function listEonExpanseW768VResidentAvailability({ missionLedger = null } = {}) {
  return freeze(Object.values(EON_EXPANSE_W768V_RESIDENT_POLICIES).map((policy) => {
    const result = deriveEonExpanseW768VResidentReceipt({ residentId: policy.residentId, missionLedger });
    return freeze({
      slotId: policy.slotId,
      residentId: policy.residentId,
      authority: policy.authority,
      missionId: policy.missionId,
      status: result.ok ? 'receipt-ready' : result.reason,
      receipt: result.ok ? result.receipt : null,
      privateContentStored: false
    });
  }));
}

export default freeze({
  EON_EXPANSE_W768V_RESIDENT_AUTHORITY_SCHEMA,
  EON_EXPANSE_W768V_RESIDENT_POLICIES,
  deriveEonExpanseW768VResidentReceipt,
  validateEonExpanseW768VResidentReceipt,
  listEonExpanseW768VResidentAvailability
});
