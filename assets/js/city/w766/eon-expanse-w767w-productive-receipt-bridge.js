import { EON_CITY_PRODUCTIVE_RPG_SCHEMA } from '../eon-city-productive-rpg-loop.js';

const freeze = (value) => Object.freeze(value);
const clean = (value = '', max = 160) => String(value || '').trim().slice(0, max);
const safeId = (value = '', max = 120) => clean(value, max).toLowerCase().replace(/[^a-z0-9:_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max);

export const EON_EXPANSE_W767W_PRODUCTIVE_RECEIPT_SCHEMA = 'eon.city.expanse.productive-receipt-bridge.w767w.v1';

export const EON_EXPANSE_W767W_PRODUCTIVE_RECEIPT_POLICIES = freeze([
  freeze({ missionId: 'create-expedition', workspaceId: 'create', nativeMissionId: 'creator', outcomeKinds: freeze(['creator-guide-artifact']) }),
  freeze({ missionId: 'local-ai-survey', workspaceId: 'local-ai', nativeMissionId: 'local-ai-byok', outcomeKinds: freeze(['local-ai-self-test', 'byok-provider-verification']) }),
  freeze({ missionId: 'automation-relay', workspaceId: 'automations', nativeMissionId: 'automation', outcomeKinds: freeze(['automation-proposal']) }),
  freeze({ missionId: 'knowledge-recovery', workspaceId: 'library', nativeMissionId: 'vault-recovery', outcomeKinds: freeze(['backup-readiness-receipt', 'recovery-restore-receipt']) }),
  freeze({ missionId: 'status-review', workspaceId: 'status', nativeMissionId: '', outcomeKinds: freeze([]), unavailableReason: 'native-status-receipt-pending' })
]);

const policyFor = (missionId = '') => EON_EXPANSE_W767W_PRODUCTIVE_RECEIPT_POLICIES.find((entry) => entry.missionId === String(missionId || '')) || null;
const nativeMissionFor = (plan = {}, nativeMissionId = '') => (Array.isArray(plan?.missions) ? plan.missions : []).find((entry) => String(entry?.id || '') === nativeMissionId) || null;

export function deriveEonExpanseW767WProductiveReceipt(plan = {}, missionId = '') {
  const policy = policyFor(missionId);
  if (!policy) return freeze({ ok: false, reason: 'productive-mission-policy-not-found', missionId: safeId(missionId) });
  if (!policy.nativeMissionId) return freeze({ ok: false, reason: policy.unavailableReason || 'native-receipt-authority-unavailable', missionId: policy.missionId, workspaceId: policy.workspaceId });
  if (plan?.schema !== EON_CITY_PRODUCTIVE_RPG_SCHEMA) return freeze({ ok: false, reason: 'native-receipt-plan-invalid', missionId: policy.missionId, workspaceId: policy.workspaceId });
  const nativeMission = nativeMissionFor(plan, policy.nativeMissionId);
  const outcome = nativeMission?.outcome || null;
  if (nativeMission?.state !== 'completed' || outcome?.verified !== true) return freeze({ ok: false, reason: 'verified-native-outcome-required', missionId: policy.missionId, workspaceId: policy.workspaceId, nativeMissionId: policy.nativeMissionId });
  if (!policy.outcomeKinds.includes(String(outcome.kind || ''))) return freeze({ ok: false, reason: 'native-outcome-kind-mismatch', missionId: policy.missionId, workspaceId: policy.workspaceId, nativeMissionId: policy.nativeMissionId });
  const receiptId = safeId(outcome.receiptId);
  const verifiedAt = Number(outcome.verifiedAt || 0);
  if (!receiptId || !Number.isFinite(verifiedAt) || verifiedAt <= 0) return freeze({ ok: false, reason: 'native-outcome-receipt-invalid', missionId: policy.missionId, workspaceId: policy.workspaceId, nativeMissionId: policy.nativeMissionId });
  return freeze({
    ok: true,
    schema: EON_EXPANSE_W767W_PRODUCTIVE_RECEIPT_SCHEMA,
    missionId: policy.missionId,
    workspaceId: policy.workspaceId,
    status: 'completed',
    id: receiptId,
    authoritySchema: EON_CITY_PRODUCTIVE_RPG_SCHEMA,
    nativeMissionId: policy.nativeMissionId,
    kind: safeId(outcome.kind),
    route: clean(outcome.route),
    source: safeId(outcome.source),
    verifiedAt,
    verified: true,
    privateContentStored: false,
    automaticCompletion: false,
    rewardClaimed: false
  });
}

export function validateEonExpanseW767WProductiveReceipt({ missionId = '', workspaceReceipt = null, nativePlan = null } = {}) {
  const canonical = deriveEonExpanseW767WProductiveReceipt(nativePlan || {}, missionId);
  if (!canonical.ok) return canonical;
  if (!workspaceReceipt || typeof workspaceReceipt !== 'object') return freeze({ ok: false, reason: 'verified-native-workspace-receipt-required', missionId: canonical.missionId, workspaceId: canonical.workspaceId });
  const exact = workspaceReceipt.schema === canonical.schema
    && String(workspaceReceipt.missionId || '') === canonical.missionId
    && String(workspaceReceipt.workspaceId || '') === canonical.workspaceId
    && String(workspaceReceipt.status || '') === 'completed'
    && safeId(workspaceReceipt.id) === canonical.id
    && String(workspaceReceipt.authoritySchema || '') === canonical.authoritySchema
    && String(workspaceReceipt.nativeMissionId || '') === canonical.nativeMissionId
    && safeId(workspaceReceipt.kind) === canonical.kind
    && clean(workspaceReceipt.route) === canonical.route
    && safeId(workspaceReceipt.source) === canonical.source
    && Number(workspaceReceipt.verifiedAt || 0) === canonical.verifiedAt
    && workspaceReceipt.verified === true;
  if (!exact) return freeze({ ok: false, reason: 'native-workspace-receipt-mismatch', missionId: canonical.missionId, workspaceId: canonical.workspaceId });
  return freeze({ ok: true, receipt: canonical, privateContentStored: false, automaticCompletion: false, mutatesNativeAuthority: false });
}
