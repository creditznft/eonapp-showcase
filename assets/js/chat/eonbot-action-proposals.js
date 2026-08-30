/**
 * W256 — local EONBOT action proposal and Vault-return contract.
 *
 * A proposal is created only after a person explicitly asks to review a guarded
 * EONBOT action. It never contains chat text, credentials, provider data,
 * wallet authority, payment/reward state, remote URLs or external effects.
 * Approval is a second explicit action. Vault return context is local-only and
 * lets a person return to the same Chat thread without moving any secret into
 * Chat.
 */
import {
  normalizeEonWorkflowAction,
  prepareEonWorkflowReviewAction,
  transitionEonWorkflowAction
} from '../contracts/workflow/eon-workflow-action-state-machine.js';
import {
  getEonbotCommandHubAction,
  isEonbotCommandHubActionGuarded,
  matchesEonbotCommandHubAction
} from './eonbot-command-hub.js';

export const EONBOT_ACTION_PROPOSAL_VERSION = 1;
export const EONBOT_ACTION_PROPOSALS_KEY = 'eon:eonbot:action-proposals:v1';
export const EONBOT_VAULT_RETURN_CONTEXT_KEY = 'eon:eonbot:vault-return-context:v1';
export const EONBOT_ACTION_PROPOSAL_TTL_MS = 10 * 60 * 1000;
export const EONBOT_VAULT_RETURN_TTL_MS = 30 * 60 * 1000;

const MAX_PROPOSALS = 24;
const PROPOSAL_RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const ACTION_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,80}$/i;
const ACTION_TYPE_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}$/i;
const PROPOSAL_ID_PATTERN = /^eonprop_[a-z0-9_-]{8,96}$/i;
const NONFAILABLE_STATUSES = new Set(['cancelled', 'expired', 'failed']);
function storageFor(storage) {
  if (storage && typeof storage.getItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function iso(now = Date.now()) {
  const value = Number(now);
  return new Date(Number.isFinite(value) ? value : Date.now()).toISOString();
}

function parse(raw) {
  if (!raw || String(raw).length > 28000) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function safeInternalRoute(value = '') {
  try {
    const url = new URL(String(value || ''), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid') return '';
    if (!url.pathname.startsWith('/') || /(?:\r|\n|javascript:|data:)/i.test(String(value || ''))) return '';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '';
  }
}

function safeChatReturnRoute(value = '') {
  const route = safeInternalRoute(value);
  if (!route) return '/';
  try {
    const url = new URL(route, 'https://eonapp.invalid');
    if (!['/', '/chat', '/chat.html'].includes(url.pathname)) return '/';
    const thread = String(url.searchParams.get('thread') || '').trim();
    if (!thread || !/^[a-z0-9_-]{4,96}$/i.test(thread)) return '/';
    return `/chat?thread=${encodeURIComponent(thread)}`;
  } catch {
    return '/';
  }
}

function cleanToken(value, pattern, max) {
  const clean = String(value || '').trim();
  if (!pattern.test(clean)) return '';
  return clean.slice(0, max);
}

function makeId(now = Date.now()) {
  let random = '';
  try {
    const bytes = new Uint32Array(2);
    globalThis.crypto?.getRandomValues?.(bytes);
    random = `${bytes[0].toString(36)}${bytes[1].toString(36)}`;
  } catch {}
  if (!random) random = `${Math.floor(Math.random() * 0x7fffffff).toString(36)}${Math.floor(Math.random() * 0x7fffffff).toString(36)}`;
  return `eonprop_${Number(now).toString(36)}_${random}`.slice(0, 96);
}

function resolveCommand(commandReceipt = {}) {
  const actionId = cleanToken(commandReceipt.interpretedAs || commandReceipt.commandId || commandReceipt.actionId, ACTION_ID_PATTERN, 80);
  const action = getEonbotCommandHubAction(actionId);
  if (!action) return null;
  const route = safeInternalRoute(commandReceipt.route);
  if (!route || route !== action.route) return null;
  const actionType = cleanToken(commandReceipt.actionType, ACTION_TYPE_PATTERN, 48) || 'navigation';
  if (!matchesEonbotCommandHubAction({ actionId, actionType, route })) return null;
  const guarded = isEonbotCommandHubActionGuarded(action);
  if (!guarded) return null;
  return Object.freeze({ action, actionId, actionType, route });
}

function normalizeProposal(value, { now = Date.now() } = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const id = cleanToken(source.id, PROPOSAL_ID_PATTERN, 96) || makeId(now);
  const actionId = cleanToken(source.actionId, ACTION_ID_PATTERN, 80);
  const action = getEonbotCommandHubAction(actionId);
  const route = safeInternalRoute(source.route);
  const actionType = cleanToken(source.actionType, ACTION_TYPE_PATTERN, 48) || 'navigation';
  if (!action || !route || !matchesEonbotCommandHubAction({ actionId, actionType, route })) return null;
  const status = ['reviewing', 'approved', 'cancelled', 'expired', 'failed'].includes(String(source.status || ''))
    ? String(source.status || '')
    : 'reviewing';
  const createdAt = typeof source.createdAt === 'string' && source.createdAt.length <= 40 ? source.createdAt : iso(now);
  const expiresAt = typeof source.expiresAt === 'string' && source.expiresAt.length <= 40
    ? source.expiresAt
    : iso(Number(now) + EONBOT_ACTION_PROPOSAL_TTL_MS);
  const updatedAt = typeof source.updatedAt === 'string' && source.updatedAt.length <= 40 ? source.updatedAt : createdAt;
  const failureCode = /^[a-z0-9-]{0,64}$/i.test(String(source.failureCode || '')) ? String(source.failureCode || '') : '';
  const returnRoute = route.split('#')[0] === '/vault' ? safeChatReturnRoute(source.returnRoute) : '';
  const canonicalState = status === 'reviewing' ? 'reviewed' : status === 'approved' ? 'approved' : status === 'cancelled' || status === 'expired' ? 'cancelled' : 'failed';
  const prepared = source.workflowAction
    ? normalizeEonWorkflowAction(source.workflowAction, { now })
    : normalizeEonWorkflowAction({
        actionId: `workflowaction_${id}`,
        actionType: actionType === 'navigation' ? 'local-navigation-review' : actionType,
        risk: source.sensitive ? 'sensitive' : source.requiresPermission ? 'submit' : 'draft',
        state: canonicalState,
        source: 'eonbot-action-proposal',
        createdAt, updatedAt,
        localApprovalOnly: true, externalExecutionAuthority: false, externalEffectCreated: false
      }, { now });
  return Object.freeze({
    version: EONBOT_ACTION_PROPOSAL_VERSION,
    id,
    actionId,
    actionType,
    route,
    label: String(action.label || actionId).slice(0, 120),
    sensitive: Boolean(action.sensitive),
    requiresPermission: Boolean(action.requiresPermission),
    requiresDeviceReview: Boolean(action.requiresDeviceReview),
    status,
    completed: status === 'approved',
    externalEffect: false,
    createdAt,
    expiresAt,
    updatedAt,
    returnRoute,
    failureCode,
    workflowAction: prepared,
    localApprovalOnly: prepared.localApprovalOnly !== false,
    externalExecutionAuthority: prepared.externalExecutionAuthority === true
  });
}

function readAll({ storage, now = Date.now() } = {}) {
  const resolved = storageFor(storage);
  const cutoff = Number(now) - PROPOSAL_RETENTION_MS;
  const seen = new Set();
  const rows = [];
  for (const entry of parse(resolved?.getItem(EONBOT_ACTION_PROPOSALS_KEY))) {
    let proposal = normalizeProposal(entry, { now });
    if (!proposal || seen.has(proposal.id)) continue;
    const created = Date.parse(proposal.createdAt);
    if (Number.isFinite(created) && created < cutoff) continue;
    if (proposal.status === 'reviewing' && Date.parse(proposal.expiresAt) <= Number(now)) {
      proposal = Object.freeze({ ...proposal, status: 'expired', completed: false, updatedAt: iso(now), failureCode: 'proposal-expired' });
    }
    seen.add(proposal.id);
    rows.push(proposal);
  }
  return rows.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, MAX_PROPOSALS);
}

function writeAll(rows, { storage } = {}) {
  try {
    storageFor(storage)?.setItem(EONBOT_ACTION_PROPOSALS_KEY, JSON.stringify(rows.slice(0, MAX_PROPOSALS)));
    return true;
  } catch {
    return false;
  }
}

function writeVaultReturnContext(proposal, { storage, now = Date.now() } = {}) {
  if (!proposal || proposal.route.split('#')[0] !== '/vault') return null;
  const context = Object.freeze({
    version: EONBOT_ACTION_PROPOSAL_VERSION,
    proposalId: proposal.id,
    actionId: proposal.actionId,
    returnRoute: safeChatReturnRoute(proposal.returnRoute),
    createdAt: iso(now),
    expiresAt: iso(Number(now) + EONBOT_VAULT_RETURN_TTL_MS)
  });
  try {
    storageFor(storage)?.setItem(EONBOT_VAULT_RETURN_CONTEXT_KEY, JSON.stringify(context));
    return context;
  } catch {
    return null;
  }
}

function updateProposal(id, updater, { storage, now = Date.now() } = {}) {
  const cleanId = cleanToken(id, PROPOSAL_ID_PATTERN, 96);
  if (!cleanId) return Object.freeze({ ok: false, proposal: null, reason: 'invalid-proposal-id' });
  let changed = null;
  const rows = readAll({ storage, now }).map((proposal) => {
    if (proposal.id !== cleanId) return proposal;
    const next = normalizeProposal(updater(proposal), { now });
    if (!next) return proposal;
    changed = next;
    return next;
  });
  if (!changed) return Object.freeze({ ok: false, proposal: null, reason: 'proposal-not-found' });
  return Object.freeze({ ok: writeAll(rows, { storage }), proposal: changed, reason: null });
}

/** Creates a local review record after an explicit user request to review. */
export function createEonbotActionProposal(commandReceipt = {}, { storage, now = Date.now(), returnRoute = '/' } = {}) {
  const command = resolveCommand(commandReceipt);
  if (!command) return Object.freeze({ ok: false, proposal: null, reason: 'invalid-or-unguarded-command' });
  const proposalId = makeId(now);
  const review = prepareEonWorkflowReviewAction({
    actionId: `workflowaction_${proposalId}`,
    actionType: command.actionType === 'navigation' ? 'local-navigation-review' : command.actionType,
    risk: command.sensitive ? 'sensitive' : command.requiresPermission ? 'submit' : 'draft',
    source: 'eonbot-action-proposal'
  }, { now });
  const proposal = normalizeProposal({
    id: proposalId,
    actionId: command.actionId,
    actionType: command.actionType,
    route: command.route,
    status: 'reviewing',
    createdAt: iso(now),
    expiresAt: iso(Number(now) + EONBOT_ACTION_PROPOSAL_TTL_MS),
    updatedAt: iso(now),
    returnRoute: command.route.split('#')[0] === '/vault' ? safeChatReturnRoute(returnRoute) : '',
    workflowAction: review.ok ? review.action : null
  }, { now });
  if (!proposal) return Object.freeze({ ok: false, proposal: null, reason: 'proposal-normalization-failed' });
  const rows = [proposal, ...readAll({ storage, now }).filter((entry) => entry.id !== proposal.id)].slice(0, MAX_PROPOSALS);
  return Object.freeze({ ok: writeAll(rows, { storage }), proposal, reason: null });
}

/** Returns sanitized local proposal records. */
export function listEonbotActionProposals(options = {}) {
  return Object.freeze([...readAll(options)]);
}

/** Returns one sanitized local proposal or null. This is used only to bind a local receipt to its reviewed capability. */
export function getEonbotActionProposal(id, { storage, now = Date.now() } = {}) {
  const cleanId = cleanToken(id, PROPOSAL_ID_PATTERN, 96);
  if (!cleanId) return null;
  return readAll({ storage, now }).find((proposal) => proposal.id === cleanId) || null;
}

/** Approves the second explicit action. It returns a finite local route only. */
export function approveEonbotActionProposal(id, { storage, now = Date.now() } = {}) {
  const current = readAll({ storage, now }).find((proposal) => proposal.id === String(id || '')) || null;
  if (!current) return Object.freeze({ ok: false, proposal: null, navigation: null, reason: 'proposal-not-found' });
  if (current.status === 'expired' || Date.parse(current.expiresAt) <= Number(now)) {
    const expired = updateProposal(current.id, (proposal) => ({ ...proposal, status: 'expired', completed: false, updatedAt: iso(now), failureCode: 'proposal-expired' }), { storage, now });
    return Object.freeze({ ok: false, proposal: expired.proposal || current, navigation: null, reason: 'proposal-expired' });
  }
  if (current.status !== 'reviewing') return Object.freeze({ ok: false, proposal: current, navigation: null, reason: `proposal-${current.status}` });
  const transition = transitionEonWorkflowAction(current.workflowAction, 'approved', { explicitUserAction: true, now });
  if (!transition.ok) return Object.freeze({ ok: false, proposal: current, navigation: null, reason: transition.reason });
  const approved = updateProposal(current.id, (proposal) => ({ ...proposal, status: 'approved', completed: true, updatedAt: iso(now), failureCode: '', workflowAction: transition.action, localApprovalOnly: true, externalExecutionAuthority: false }), { storage, now });
  if (!approved.ok || !approved.proposal) return Object.freeze({ ok: false, proposal: current, navigation: null, reason: 'proposal-write-failed' });
  const vaultReturn = writeVaultReturnContext(approved.proposal, { storage, now });
  return Object.freeze({
    ok: true,
    proposal: approved.proposal,
    navigation: Object.freeze({ route: approved.proposal.route, vaultReturn: vaultReturn ? Object.freeze({ returnRoute: vaultReturn.returnRoute, expiresAt: vaultReturn.expiresAt }) : null }),
    reason: null
  });
}

/** Cancels a reviewed proposal. It never navigates or creates an effect. */
export function cancelEonbotActionProposal(id, { storage, now = Date.now() } = {}) {
  const current = readAll({ storage, now }).find((proposal) => proposal.id === String(id || '')) || null;
  if (!current) return Object.freeze({ ok: false, proposal: null, reason: 'proposal-not-found' });
  if (current.status !== 'reviewing') return Object.freeze({ ok: false, proposal: current, reason: `proposal-${current.status}` });
  return updateProposal(current.id, (proposal) => ({ ...proposal, status: 'cancelled', completed: false, updatedAt: iso(now), failureCode: 'user-cancelled' }), { storage, now });
}

/** Records a local failure only when a reviewed proposal cannot continue. */
export function failEonbotActionProposal(id, failureCode = 'local-navigation-failed', { storage, now = Date.now() } = {}) {
  const code = /^[a-z0-9-]{1,64}$/i.test(String(failureCode || '')) ? String(failureCode) : 'local-navigation-failed';
  const current = readAll({ storage, now }).find((proposal) => proposal.id === String(id || '')) || null;
  if (!current) return Object.freeze({ ok: false, proposal: null, reason: 'proposal-not-found' });
  if (NONFAILABLE_STATUSES.has(current.status)) return Object.freeze({ ok: false, proposal: current, reason: `proposal-${current.status}` });
  const result = updateProposal(current.id, (proposal) => ({ ...proposal, status: 'failed', completed: false, updatedAt: iso(now), failureCode: code }), { storage, now });
  if (result.ok && current.route.split('#')[0] === '/vault') {
    try { storageFor(storage)?.removeItem(EONBOT_VAULT_RETURN_CONTEXT_KEY); } catch {}
  }
  return result;
}

/** Gets a local Vault → Chat return context without exposing a secret or Chat text. */
export function getEonbotVaultReturnContext({ storage, now = Date.now() } = {}) {
  const resolved = storageFor(storage);
  let source = null;
  try { source = JSON.parse(resolved?.getItem(EONBOT_VAULT_RETURN_CONTEXT_KEY) || 'null'); } catch {}
  if (!source || typeof source !== 'object') return null;
  const proposalId = cleanToken(source.proposalId, PROPOSAL_ID_PATTERN, 96);
  const actionId = cleanToken(source.actionId, ACTION_ID_PATTERN, 80);
  const expiresAt = typeof source.expiresAt === 'string' ? source.expiresAt : '';
  if (!proposalId || !actionId || !expiresAt || Date.parse(expiresAt) <= Number(now)) {
    try { resolved?.removeItem(EONBOT_VAULT_RETURN_CONTEXT_KEY); } catch {}
    return null;
  }
  return Object.freeze({
    version: EONBOT_ACTION_PROPOSAL_VERSION,
    proposalId,
    actionId,
    returnRoute: safeChatReturnRoute(source.returnRoute),
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : iso(now),
    expiresAt
  });
}

/** Completes only the local return acknowledgement and clears the context. */
export function completeEonbotVaultReturnContext(options = {}) {
  const context = getEonbotVaultReturnContext(options);
  if (!context) return Object.freeze({ ok: false, context: null, route: '/', reason: 'no-active-vault-return-context' });
  try { storageFor(options.storage)?.removeItem(EONBOT_VAULT_RETURN_CONTEXT_KEY); } catch {}
  return Object.freeze({ ok: true, context, route: context.returnRoute, reason: null });
}

export function clearEonbotActionProposalsForTest({ storage } = {}) {
  try { storageFor(storage)?.removeItem(EONBOT_ACTION_PROPOSALS_KEY); } catch {}
  try { storageFor(storage)?.removeItem(EONBOT_VAULT_RETURN_CONTEXT_KEY); } catch {}
}

export default Object.freeze({
  EONBOT_ACTION_PROPOSAL_VERSION,
  EONBOT_ACTION_PROPOSALS_KEY,
  EONBOT_VAULT_RETURN_CONTEXT_KEY,
  EONBOT_ACTION_PROPOSAL_TTL_MS,
  EONBOT_VAULT_RETURN_TTL_MS,
  createEonbotActionProposal,
  listEonbotActionProposals,
  getEonbotActionProposal,
  approveEonbotActionProposal,
  cancelEonbotActionProposal,
  failEonbotActionProposal,
  getEonbotVaultReturnContext,
  completeEonbotVaultReturnContext,
  clearEonbotActionProposalsForTest
});
