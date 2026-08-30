/**
 * W232 — private, local EONBOT action receipts.
 *
 * A receipt is created only after a person taps a prepared Chat destination.
 * It deliberately contains no chat text, account identifier, public handle,
 * credential, provider setting, reward balance, attribution, or remote event.
 * It is a transparency aid, not an entitlement or audit ledger.
 */

import {
  getEonbotCommandHubAction,
  isEonbotCommandHubActionGuarded,
  matchesEonbotCommandHubAction
} from './eonbot-command-hub.js';
import { getEonbotActionProposal } from './eonbot-action-proposals.js';

export const EONBOT_ACTION_RECEIPTS_VERSION = 1;
export const EONBOT_ACTION_RECEIPTS_KEY = 'eon:eonbot:action-receipts:v1';
const MAX_RECEIPTS = 24;
const ACTIVE_WINDOW_MS = 2 * 60 * 60 * 1000;
const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
const ACTION_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,80}$/i;
const ACTION_TYPE_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}$/i;
const RECEIPT_ID_PATTERN = /^eonact_[a-z0-9_-]{8,80}$/i;
const PROPOSAL_ID_PATTERN = /^eonprop_[a-z0-9_-]{8,96}$/i;

function storageFor(storage) {
  if (storage && typeof storage.getItem === 'function') return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function iso(now = Date.now()) {
  const value = Number(now);
  return new Date(Number.isFinite(value) ? value : Date.now()).toISOString();
}

function parse(raw) {
  if (!raw || String(raw).length > 24000) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function safeRoute(value = '') {
  try {
    const url = new URL(String(value || ''), 'https://eonapp.invalid');
    if (url.origin !== 'https://eonapp.invalid') return '';
    if (!url.pathname.startsWith('/') || /(?:\r|\n|javascript:|data:)/i.test(String(value || ''))) return '';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '';
  }
}

function routeWithoutHash(value = '') {
  const route = safeRoute(value);
  return route ? route.split('#')[0] : '';
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
  return `eonact_${Number(now).toString(36)}_${random}`.slice(0, 80);
}

function normalizeReceipt(value, { now = Date.now() } = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const id = cleanToken(source.id, RECEIPT_ID_PATTERN, 80) || makeId(now);
  const actionId = cleanToken(source.actionId || source.interpretedAs || source.commandId, ACTION_ID_PATTERN, 80);
  const actionType = cleanToken(source.actionType, ACTION_TYPE_PATTERN, 48) || 'navigation';
  const route = routeWithoutHash(source.route);
  const action = getEonbotCommandHubAction(actionId);
  if (!action || !route || !matchesEonbotCommandHubAction({ actionId, actionType, route }, { allowHashless: true })) return null;
  const status = ['user-tapped', 'destination-opened', 'user-confirmed'].includes(String(source.status || ''))
    ? String(source.status)
    : 'user-tapped';
  const createdAt = typeof source.createdAt === 'string' && source.createdAt.length <= 40 ? source.createdAt : iso(now);
  const updatedAt = typeof source.updatedAt === 'string' && source.updatedAt.length <= 40 ? source.updatedAt : createdAt;
  const destination = safeRoute(source.destination || route) || route;
  const proposalId = cleanToken(source.proposalId, PROPOSAL_ID_PATTERN, 96) || null;
  if (isEonbotCommandHubActionGuarded(action) && !proposalId) return null;
  const target = getReceiptRouteTarget(route);
  return Object.freeze({
    version: EONBOT_ACTION_RECEIPTS_VERSION,
    id,
    actionId,
    actionType,
    route,
    destination,
    proposalId,
    targetDistrictId: target.targetDistrictId,
    focusObjective: target.focusObjective,
    status,
    completed: status === 'user-confirmed',
    externalEffect: false,
    createdAt,
    updatedAt
  });
}

function hasApprovedMatchingProposal(receipt, { storage, now = Date.now() } = {}) {
  const action = getEonbotCommandHubAction(receipt?.actionId);
  if (!action) return false;
  if (!isEonbotCommandHubActionGuarded(action)) return true;
  const proposal = getEonbotActionProposal(receipt?.proposalId, { storage, now });
  if (!proposal || proposal.status !== 'approved') return false;
  return proposal.actionId === action.id
    && proposal.actionType === receipt.actionType
    && routeWithoutHash(proposal.route) === receipt.route;
}

function readAll({ storage, now = Date.now() } = {}) {
  const resolved = storageFor(storage);
  const cutoff = Number(now) - RETENTION_MS;
  const seen = new Set();
  const rows = [];
  for (const entry of parse(resolved?.getItem(EONBOT_ACTION_RECEIPTS_KEY))) {
    const normalized = normalizeReceipt(entry, { now });
    if (!normalized || seen.has(normalized.id)) continue;
    if (!hasApprovedMatchingProposal(normalized, { storage: resolved, now })) continue;
    const createdAt = Date.parse(normalized.createdAt);
    if (Number.isFinite(createdAt) && createdAt < cutoff) continue;
    seen.add(normalized.id);
    rows.push(normalized);
  }
  return rows.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, MAX_RECEIPTS);
}

function writeAll(rows, { storage } = {}) {
  try {
    storageFor(storage)?.setItem(EONBOT_ACTION_RECEIPTS_KEY, JSON.stringify(rows.slice(0, MAX_RECEIPTS)));
    return true;
  } catch {
    return false;
  }
}

export function getReceiptRouteTarget(route = '') {
  const safe = safeRoute(route);
  if (!safe) return Object.freeze({ targetDistrictId: null, focusObjective: false });
  try {
    const url = new URL(safe, 'https://eonapp.invalid');
    if (!['/eoncity', '/eoncity/lite'].includes(url.pathname)) return Object.freeze({ targetDistrictId: null, focusObjective: false });
    const target = String(url.searchParams.get('target') || '').trim();
    const targetDistrictId = ['command', 'workspace', 'market', 'realm', 'library', 'trade', 'vault'].includes(target) ? target : null;
    return Object.freeze({ targetDistrictId, focusObjective: url.searchParams.get('focus') === 'objective' });
  } catch {
    return Object.freeze({ targetDistrictId: null, focusObjective: false });
  }
}

/** Returns sanitized local transparency receipts. */
export function listEonbotActionReceipts(options = {}) {
  return Object.freeze([...readAll(options)]);
}

/**
 * Persists a receipt only after the person taps the tool CTA. The provided
 * `commandReceipt.heard` text is intentionally never copied into storage. A
 * guarded confirmation may include an opaque local proposal ID so the two
 * local records can be correlated without retaining chat content or secrets.
 */
export function recordEonbotActionTap(commandReceipt = {}, { storage, now = Date.now() } = {}) {
  const actionId = cleanToken(commandReceipt.interpretedAs || commandReceipt.commandId || commandReceipt.actionId, ACTION_ID_PATTERN, 80);
  const actionType = cleanToken(commandReceipt.actionType, ACTION_TYPE_PATTERN, 48) || 'navigation';
  const route = safeRoute(commandReceipt.route);
  const action = getEonbotCommandHubAction(actionId);
  if (!action || !route || !matchesEonbotCommandHubAction({ actionId, actionType, route }, { allowHashless: true })) {
    return Object.freeze({ ok: false, receipt: null, reason: 'invalid-command-receipt' });
  }
  const proposalId = cleanToken(commandReceipt.proposalId, PROPOSAL_ID_PATTERN, 96) || null;
  if (isEonbotCommandHubActionGuarded(action)) {
    if (!proposalId) return Object.freeze({ ok: false, receipt: null, reason: 'proposal-required' });
    const proposal = getEonbotActionProposal(proposalId, { storage, now });
    const matchesApprovedProposal = Boolean(
      proposal
      && proposal.status === 'approved'
      && proposal.actionId === action.id
      && proposal.actionType === actionType
      && routeWithoutHash(proposal.route) === routeWithoutHash(route)
    );
    if (!matchesApprovedProposal) return Object.freeze({ ok: false, receipt: null, reason: 'proposal-not-approved' });
  }
  const normalized = normalizeReceipt({
    actionId,
    actionType,
    route,
    proposalId,
    status: 'user-tapped',
    createdAt: iso(now),
    updatedAt: iso(now)
  }, { now });
  if (!normalized) return Object.freeze({ ok: false, receipt: null, reason: 'invalid-command-receipt' });
  const rows = readAll({ storage, now });
  const next = [normalized, ...rows].slice(0, MAX_RECEIPTS);
  return Object.freeze({ ok: writeAll(next, { storage }), receipt: normalized, reason: null });
}

export function findLatestEonbotActionReceiptForRoute(route = '', { storage, now = Date.now(), actionType = '' } = {}) {
  const expected = routeWithoutHash(route);
  if (!expected) return null;
  const type = cleanToken(actionType, ACTION_TYPE_PATTERN, 48);
  const cutoff = Number(now) - ACTIVE_WINDOW_MS;
  return readAll({ storage, now }).find((receipt) => {
    if (receipt.route !== expected) return false;
    if (type && receipt.actionType !== type) return false;
    const updated = Date.parse(receipt.updatedAt);
    return !Number.isFinite(updated) || updated >= cutoff;
  }) || null;
}

function updateReceipt(id, updater, { storage, now = Date.now() } = {}) {
  const cleanId = cleanToken(id, RECEIPT_ID_PATTERN, 80);
  if (!cleanId) return Object.freeze({ ok: false, receipt: null, reason: 'invalid-receipt-id' });
  let changed = null;
  const rows = readAll({ storage, now }).map((receipt) => {
    if (receipt.id !== cleanId) return receipt;
    const next = normalizeReceipt(updater(receipt), { now });
    if (!next) return receipt;
    changed = next;
    return next;
  });
  if (!changed) return Object.freeze({ ok: false, receipt: null, reason: 'receipt-not-found' });
  return Object.freeze({ ok: writeAll(rows, { storage }), receipt: changed, reason: null });
}

/** Marks a local destination as opened; it never marks the requested task complete. */
export function markEonbotActionReceiptDestinationOpened(id, options = {}) {
  return updateReceipt(id, (receipt) => ({
    ...receipt,
    status: receipt.status === 'user-confirmed' ? 'user-confirmed' : 'destination-opened',
    completed: receipt.status === 'user-confirmed',
    updatedAt: iso(options.now)
  }), options);
}

/** Marks a City interaction that the person actually performed, locally. */
export function markEonbotActionReceiptUserConfirmed(id, options = {}) {
  return updateReceipt(id, (receipt) => ({
    ...receipt,
    status: 'user-confirmed',
    completed: true,
    externalEffect: false,
    updatedAt: iso(options.now)
  }), options);
}

export function clearEonbotActionReceiptsForTest({ storage } = {}) {
  try { storageFor(storage)?.removeItem(EONBOT_ACTION_RECEIPTS_KEY); } catch {}
}

export default Object.freeze({
  EONBOT_ACTION_RECEIPTS_VERSION,
  EONBOT_ACTION_RECEIPTS_KEY,
  getReceiptRouteTarget,
  listEonbotActionReceipts,
  recordEonbotActionTap,
  findLatestEonbotActionReceiptForRoute,
  markEonbotActionReceiptDestinationOpened,
  markEonbotActionReceiptUserConfirmed,
  clearEonbotActionReceiptsForTest
});
