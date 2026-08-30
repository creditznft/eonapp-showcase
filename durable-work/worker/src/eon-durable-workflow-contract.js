/** Pure contract shared by the future Cloudflare Workflows pilot. */
export const EON_DURABLE_WORKFLOW_ADMISSION_SCHEMA = 'eonapp.durable-workflow-admission.rt92.v1';
const ID_RE = /^[a-zA-Z0-9._:-]{1,140}$/;
const freeze = Object.freeze;
function id(value = '') { const text = String(value || '').trim(); return ID_RE.test(text) ? text : ''; }

export function normalizeEonDurableWorkflowAdmission(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return freeze({ ok: false, reason: 'object-input-required' });
  const rawForbidden = ['prompt','messages','rawInput','input','credentials','secret','apiKey','authorization','output','result'];
  if (rawForbidden.some((key) => Object.prototype.hasOwnProperty.call(input, key))) return freeze({ ok: false, reason: 'raw-work-payload-forbidden' });
  const accountRef = id(input.accountRef);
  const proposalId = id(input.proposalId);
  const leaseId = id(input.leaseId);
  if (!accountRef || !proposalId || !leaseId) return freeze({ ok: false, reason: 'account-proposal-lease-required' });
  return freeze({ ok: true, accountRef, proposalId, leaseId });
}

export function getEonDurableWorkflowPilotTruth() {
  return freeze({
    schema: EON_DURABLE_WORKFLOW_ADMISSION_SCHEMA,
    pilotOnly: true,
    productionEnabled: false,
    acceptsRawPrompt: false,
    acceptsCredentials: false,
    providerExecutionImplemented: false,
    externalEffectsImplemented: false,
    requiresPreparedProposal: true,
    requiresActiveCapacityLease: true,
    requiresDedicatedWorkDb: true,
    createsDodoProduct: false,
    grantsEntitlement: false
  });
}
