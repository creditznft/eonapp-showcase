const freeze = (value) => Object.freeze(value);
const token = (value = '', max = 120) => String(value || '').replace(/[^a-z0-9:_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, max);

export const EON_EXPANSE_W767X_VERIFIED_RESULT_ACTION_SCHEMA = 'eon.city.expanse.verified-result-action.w767x.v1';

export function deriveEonExpanseW767XVerifiedResultAction(item = null, receiptCandidate = null) {
  if (!item?.activityId || item.family !== 'productive-mission') return freeze({ available: false, reason: 'productive-activity-required' });
  if (item.status === 'completed') return freeze({ available: false, reason: 'productive-activity-already-completed', activityId: token(item.activityId) });
  if (!receiptCandidate?.ok || !receiptCandidate?.id || String(receiptCandidate.missionId || '') !== String(item.activityId)) {
    return freeze({ available: false, reason: receiptCandidate?.reason || 'verified-native-result-required', activityId: token(item.activityId) });
  }
  return freeze({
    schema: EON_EXPANSE_W767X_VERIFIED_RESULT_ACTION_SCHEMA,
    available: true,
    type: 'claim-verified-result',
    activityId: token(item.activityId),
    label: String(item.label || 'Productive mission').slice(0, 100),
    expectedReceiptId: token(receiptCandidate.id),
    receiptKind: token(receiptCandidate.kind),
    buttonLabel: 'Claim verified result',
    explicitUserActionRequired: true,
    automaticCompletion: false,
    mutatesNativeAuthority: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW767XVerifiedResultAction(action = null, {
  explicitUserAction = false,
  expectedActivityId = '',
  expectedReceiptId = ''
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (!action?.available || action.type !== 'claim-verified-result') return freeze({ ok: false, reason: action?.reason || 'verified-result-action-unavailable' });
  if (expectedActivityId && String(expectedActivityId) !== String(action.activityId)) return freeze({ ok: false, reason: 'productive-activity-selection-changed' });
  if (expectedReceiptId && token(expectedReceiptId) !== String(action.expectedReceiptId)) return freeze({ ok: false, reason: 'productive-receipt-selection-changed' });
  return freeze({ ok: true, action, explicitUserAction: true, automaticCompletion: false, mutatesNativeAuthority: false });
}
