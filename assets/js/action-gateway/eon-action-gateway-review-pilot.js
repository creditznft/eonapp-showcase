import { findEonActionGatewayType } from './eon-action-gateway-contract.js';

/**
 * W441 — approval-only Action Gateway review pilot.
 *
 * The pilot creates local, bounded proposals and approval receipts. It has no
 * adapter binding, network transport, credential read, task execution, or
 * background runner. Any execution attempt is intentionally fail-closed.
 */
export const EON_ACTION_GATEWAY_REVIEW_PILOT_SCHEMA = 'eon.action-gateway.review-pilot.w441.v1';
export const EON_ACTION_GATEWAY_REVIEW_PILOT_STORAGE_KEY = 'eon:action-gateway:review-pilot:v1';
export const EON_ACTION_GATEWAY_REVIEW_STATES = Object.freeze(['draft', 'review-ready', 'approval-held', 'cancelled', 'failed']);
const MAX_PROPOSALS = 24;
const freeze = (value) => Object.freeze(value);
const safeText = (value, fallback = '') => String(value || '').split('').filter((character) => character.charCodeAt(0) >= 32 && character !== '<' && character !== '>').join('').replace(/\s+/g, ' ').trim().slice(0, 120) || fallback;
const safeId = (value) => String(value || '').replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 96);
const safeHash = (value) => /^[a-z0-9:_-]{8,128}$/i.test(String(value || '').trim()) ? String(value).trim() : '';
const isStorage = (storage) => storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function';
const storeFor = (storage = null) => storage || (() => { try { return globalThis.localStorage || null; } catch { return null; } })();
const epoch = (now) => Number(typeof now === 'function' ? now() : Date.now());
const iso = (value) => new Date(Number(value) || Date.now()).toISOString();
function emptyState(now) { return { schema: EON_ACTION_GATEWAY_REVIEW_PILOT_SCHEMA, updatedAt: iso(now), proposals: [] }; }
function readState(storage, now) {
  if (!isStorage(storage)) return emptyState(now);
  try { const parsed = JSON.parse(storage.getItem(EON_ACTION_GATEWAY_REVIEW_PILOT_STORAGE_KEY) || 'null'); if (parsed?.schema === EON_ACTION_GATEWAY_REVIEW_PILOT_SCHEMA && Array.isArray(parsed.proposals)) return { ...parsed, proposals: parsed.proposals.slice(0, MAX_PROPOSALS) }; } catch {}
  return emptyState(now);
}
function writeState(storage, state) { try { storage?.setItem(EON_ACTION_GATEWAY_REVIEW_PILOT_STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; } }
function publicProposal(proposal) {
  return freeze({ proposalId: proposal.proposalId, actionTypeId: proposal.actionTypeId, safeLabel: proposal.safeLabel, scopeLabel: proposal.scopeLabel, payloadDigest: proposal.payloadDigest, state: proposal.state, createdAt: proposal.createdAt, updatedAt: proposal.updatedAt, approvalReceipt: proposal.approvalReceipt || null, executionStarted: false, credentialRead: false, networkRequestCreated: false, externalEffectCreated: false });
}
function snapshot(state) { return freeze({ schema: EON_ACTION_GATEWAY_REVIEW_PILOT_SCHEMA, proposals: freeze(state.proposals.map(publicProposal)), localOnly: true, executionAvailable: false }); }

export function createEonActionGatewayReviewPilot({ storage = null, now = () => Date.now() } = {}) {
  const targetStorage = storeFor(storage);
  const clock = () => epoch(now);
  const current = () => readState(targetStorage, clock());
  const persist = (state) => { const stored = writeState(targetStorage, state); return freeze({ stored, browserStorageChanged: stored, networkRequestCreated: false, credentialRead: false, externalEffectCreated: false, snapshot: snapshot(state) }); };
  return freeze({
    getSnapshot() { return snapshot(current()); },
    createProposal({ actionTypeId = '', safeLabel = '', scopeLabel = '', payloadDigest = '' } = {}, { explicitUserAction = false, explicitScopeApproval = false } = {}) {
      if (explicitUserAction !== true || explicitScopeApproval !== true) return freeze({ ok: false, error: 'explicit-user-action-and-scope-approval-required', browserStorageChanged: false, networkRequestCreated: false, externalEffectCreated: false });
      const actionType = findEonActionGatewayType(actionTypeId);
      if (!actionType) return freeze({ ok: false, error: 'action-type-not-recognized', browserStorageChanged: false, networkRequestCreated: false, externalEffectCreated: false });
      const digest = safeHash(payloadDigest);
      if (!digest) return freeze({ ok: false, error: 'payload-digest-required', browserStorageChanged: false, networkRequestCreated: false, externalEffectCreated: false });
      const timestamp = clock();
      const proposal = { proposalId: `action-review-${timestamp}-${Math.random().toString(36).slice(2, 8)}`, actionTypeId: actionType.id, safeLabel: safeText(safeLabel, actionType.label), scopeLabel: safeText(scopeLabel, 'A reviewed local scope'), payloadDigest: digest, state: 'review-ready', createdAt: iso(timestamp), updatedAt: iso(timestamp), approvalReceipt: null, executionStarted: false, credentialRead: false, networkRequestCreated: false, externalEffectCreated: false };
      const state = current();
      const next = { schema: EON_ACTION_GATEWAY_REVIEW_PILOT_SCHEMA, updatedAt: iso(timestamp), proposals: [proposal, ...state.proposals].slice(0, MAX_PROPOSALS) };
      const saved = persist(next);
      return freeze({ ok: saved.stored, proposal: publicProposal(proposal), ...saved });
    },
    holdApprovedProposal(proposalId = '', { explicitUserAction = false, explicitFinalApproval = false } = {}) {
      if (explicitUserAction !== true || explicitFinalApproval !== true) return freeze({ ok: false, error: 'explicit-final-approval-required', browserStorageChanged: false, networkRequestCreated: false, externalEffectCreated: false });
      const state = current();
      const proposal = state.proposals.find((item) => item.proposalId === safeId(proposalId));
      if (!proposal) return freeze({ ok: false, error: 'proposal-not-found', browserStorageChanged: false, networkRequestCreated: false, externalEffectCreated: false });
      if (proposal.state !== 'review-ready') return freeze({ ok: false, error: 'proposal-not-review-ready', browserStorageChanged: false, networkRequestCreated: false, externalEffectCreated: false });
      const updated = { ...proposal, state: 'approval-held', updatedAt: iso(clock()), approvalReceipt: `local-approval-${safeId(proposal.proposalId).slice(-16)}` };
      const next = { ...state, updatedAt: iso(clock()), proposals: state.proposals.map((item) => item.proposalId === proposal.proposalId ? updated : item) };
      const saved = persist(next);
      return freeze({ ok: saved.stored, proposal: publicProposal(updated), executionStarted: false, ...saved });
    },
    cancelProposal(proposalId = '', { explicitUserAction = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, networkRequestCreated: false, externalEffectCreated: false });
      const state = current(); const proposal = state.proposals.find((item) => item.proposalId === safeId(proposalId));
      if (!proposal) return freeze({ ok: false, error: 'proposal-not-found', browserStorageChanged: false, networkRequestCreated: false, externalEffectCreated: false });
      const updated = { ...proposal, state: 'cancelled', updatedAt: iso(clock()) };
      const saved = persist({ ...state, updatedAt: iso(clock()), proposals: state.proposals.map((item) => item.proposalId === proposal.proposalId ? updated : item) });
      return freeze({ ok: saved.stored, proposal: publicProposal(updated), ...saved });
    },
    requestExternalExecution(proposalId = '', { explicitUserAction = false } = {}) {
      return freeze({ ok: false, error: explicitUserAction === true ? 'external-execution-not-released' : 'explicit-user-action-required', proposalId: safeId(proposalId), browserStorageChanged: false, networkRequestCreated: false, credentialRead: false, externalEffectCreated: false, backgroundJobCreated: false });
    }
  });
}

export function getEonActionGatewayReviewPilotTruth() {
  return freeze({ schema: EON_ACTION_GATEWAY_REVIEW_PILOT_SCHEMA, localReviewProposal: true, explicitScopeApprovalRequired: true, explicitFinalApprovalRequired: true, localApprovalReceipt: true, adapterBound: false, externalExecution: false, networkRequestCreated: false, credentialRead: false, backgroundJobCreated: false, cancellationPath: true, productionExecutionProof: false });
}
