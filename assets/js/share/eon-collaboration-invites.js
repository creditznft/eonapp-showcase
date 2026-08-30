/**
 * W437 — safe result-share review and local collaboration-invite foundation.
 *
 * The only live sharing behavior remains the existing public-safe manual Share
 * Pack/Remix handoff. Collaboration here is deliberately a local draft record:
 * no email, account lookup, link, tracking, recipient delivery, acceptance,
 * publish action, file transfer or external permission is created.
 */

import { createEonOutputShareHandoff } from './eon-output-share-handoff.js';

export const EON_COLLABORATION_INVITE_SCHEMA = 'eonapp.collaboration-invite.w437.v1';
export const EON_COLLABORATION_INVITE_STORAGE_KEY = 'eon:collaboration-invites:v1';
export const EON_COLLABORATION_INVITE_MAX = 24;
export const EON_COLLABORATION_ROLES = Object.freeze(['viewer', 'commenter', 'editor']);

const INVITE_ID_RE = /^eoninvite_[a-z0-9_-]{8,96}$/i;
const RESOURCE_REF_RE = /^resource_[a-z0-9:_-]{3,160}$/i;
const HASH_RE = /^sha256:[a-z0-9_-]{20,160}$/i;
const SAFE_LABEL_RE = /^[\p{L}\p{N}][\p{L}\p{N} .,'’&()/_:-]{0,100}$/u;
const ROLE_SET = new Set(EON_COLLABORATION_ROLES);
const STATE_SET = new Set(['prepared-local', 'revoked']);
const SENSITIVE_TEXT = /(sk-[a-z0-9_-]{18,}|AIza[\w-]{20,}|gsk_[a-z0-9_-]{16,}|sk-ant-[a-z0-9_-]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:seed|recovery|mnemonic)\s+phrase\b|\b(?:password|api\s*key|access\s*token|session\s*cookie|prompt|raw output|attachment)\b)/i;
const freeze = (value) => Object.freeze(value);

function storageFor(candidate = null) {
  if (candidate && typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function') return candidate;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function time(value = Date.now()) {
  const candidate = Number(value);
  if (Number.isFinite(candidate) && candidate > 0) return Math.floor(candidate);
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : Date.now();
}

function iso(value = Date.now()) { return new Date(time(value)).toISOString(); }

function cleanLabel(value = '', fallback = '') {
  const label = String(value || '').replace(/\s+/g, ' ').trim().slice(0, 101);
  if (!SAFE_LABEL_RE.test(label) || SENSITIVE_TEXT.test(label) || /[@<>]|https?:\/\//i.test(label)) return fallback;
  return label;
}

function id(now = Date.now()) {
  let token = '';
  try {
    const bytes = new Uint32Array(2);
    globalThis.crypto?.getRandomValues?.(bytes);
    token = `${bytes[0].toString(36)}${bytes[1].toString(36)}`;
  } catch {}
  if (!token) token = `${Math.floor(Math.random() * 0x7fffffff).toString(36)}${Math.floor(Math.random() * 0x7fffffff).toString(36)}`;
  return `eoninvite_${Number(now).toString(36)}_${token}`.slice(0, 96);
}

function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

function normalizeExpiry(value, now = Date.now()) {
  const expiresAt = time(value);
  const minimum = time(now) + 60 * 60 * 1000;
  const maximum = time(now) + 30 * 24 * 60 * 60 * 1000;
  return expiresAt >= minimum && expiresAt <= maximum ? expiresAt : 0;
}

function normalizeInvite(candidate = {}, now = Date.now()) {
  if (!candidate || candidate.schema !== EON_COLLABORATION_INVITE_SCHEMA) return null;
  const inviteId = String(candidate.inviteId || '');
  const resourceReference = String(candidate.resourceReference || '');
  const resourceReceiptHash = String(candidate.resourceReceiptHash || '');
  const resourceLabel = cleanLabel(candidate.resourceLabel);
  const recipientLabel = cleanLabel(candidate.recipientLabel);
  const role = String(candidate.role || '');
  const state = String(candidate.state || 'prepared-local');
  const createdAt = time(candidate.createdAt || now);
  const expiresAt = normalizeExpiry(candidate.expiresAt, createdAt);
  if (!INVITE_ID_RE.test(inviteId) || !RESOURCE_REF_RE.test(resourceReference) || !HASH_RE.test(resourceReceiptHash) || !resourceLabel || !recipientLabel || !ROLE_SET.has(role) || !STATE_SET.has(state) || !expiresAt) return null;
  return freeze({
    schema: EON_COLLABORATION_INVITE_SCHEMA,
    version: 1,
    inviteId,
    resourceReference,
    resourceReceiptHash,
    resourceLabel,
    recipientLabel,
    role,
    state,
    createdAt: iso(createdAt),
    expiresAt: iso(expiresAt),
    updatedAt: iso(candidate.updatedAt || createdAt),
    revokedAt: state === 'revoked' && candidate.revokedAt ? iso(candidate.revokedAt) : '',
    localOnly: true,
    deliveryStatus: 'not-sent',
    acceptanceStatus: 'not-requested',
    resourceContentShared: false,
    recipientIdentityVerified: false,
    externalPermissionGranted: false,
    remoteRequestCreated: false,
    trackingCreated: false
  });
}

function readState(storage, now = Date.now()) {
  try {
    const parsed = JSON.parse(storage?.getItem?.(EON_COLLABORATION_INVITE_STORAGE_KEY) || 'null');
    const invites = [];
    const seen = new Set();
    for (const candidate of Array.isArray(parsed?.invites) ? parsed.invites : []) {
      const invite = normalizeInvite(candidate, now);
      if (!invite || seen.has(invite.inviteId)) continue;
      seen.add(invite.inviteId);
      invites.push(invite);
    }
    invites.sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
    return freeze({ schema: EON_COLLABORATION_INVITE_SCHEMA, version: 1, updatedAt: iso(parsed?.updatedAt || now), invites: freeze(invites.slice(0, EON_COLLABORATION_INVITE_MAX)) });
  } catch {
    return freeze({ schema: EON_COLLABORATION_INVITE_SCHEMA, version: 1, updatedAt: iso(now), invites: freeze([]) });
  }
}

function writeState(storage, state) {
  try { storage?.setItem?.(EON_COLLABORATION_INVITE_STORAGE_KEY, JSON.stringify(state)); return true; } catch { return false; }
}

function publicInvite(invite) {
  return freeze({
    inviteId: invite.inviteId,
    resourceLabel: invite.resourceLabel,
    recipientLabel: invite.recipientLabel,
    role: invite.role,
    state: invite.state,
    createdAt: invite.createdAt,
    expiresAt: invite.expiresAt,
    localOnly: true,
    deliveryStatus: 'not-sent',
    acceptanceStatus: 'not-requested',
    resourceContentShared: false,
    recipientIdentityVerified: false,
    remoteRequestCreated: false,
    trackingCreated: false,
    resourceReferenceVisible: false,
    resourceReceiptHashVisible: false
  });
}

function snapshotOf(state) {
  const prepared = state.invites.filter((invite) => invite.state === 'prepared-local');
  return freeze({
    schema: EON_COLLABORATION_INVITE_SCHEMA,
    updatedAt: state.updatedAt,
    invites: freeze(state.invites.map(publicInvite)),
    preparedLocalCount: prepared.length,
    externalDeliveryEnabled: false,
    acceptanceEnabled: false,
    trackingEnabled: false,
    localOnly: true
  });
}

/** Builds a manual-only share review from the established safe output handoff. */
export function prepareEonResultShareReview(input = {}, { now = Date.now() } = {}) {
  try {
    const handoff = createEonOutputShareHandoff({ ...input, explicitUserAction: input?.explicitUserAction === true }, { now });
    return freeze({
      ok: true,
      shareReview: freeze({
        schema: 'eonapp.result-share-review.w437.v1',
        title: handoff.title,
        sourceLabel: handoff.sourceLabel,
        expiresAt: handoff.expiresAt,
        manualCopyOnly: true,
        publicLinkCreated: false,
        recipientDeliveryStarted: false,
        trackingCreated: false,
        externalPublishStarted: false,
        privateContentIncluded: false
      }),
      handoff
    });
  } catch (error) {
    return freeze({ ok: false, error: String(error?.message || 'share-review-invalid') });
  }
}

export function createEonCollaborationInviteRegistry({ storage = null, now = () => Date.now() } = {}) {
  const targetStorage = storageFor(storage);
  const clock = () => time(now());
  const current = () => readState(targetStorage, clock());
  const persist = (state) => {
    const stored = writeState(targetStorage, state);
    return freeze({ stored, browserStorageChanged: stored, remoteRequestCreated: false, externalDeliveryStarted: false, snapshot: snapshotOf(readState(targetStorage, clock())) });
  };
  return freeze({
    getSnapshot() { return snapshotOf(current()); },
    prepareInvite({ resourceReference = '', resourceReceiptHash = '', resourceLabel = '', recipientLabel = '', role = '', expiresAt = 0 } = {}, { explicitUserAction = false, explicitResourceShareApproval = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, remoteRequestCreated: false });
      if (explicitResourceShareApproval !== true) return freeze({ ok: false, error: 'explicit-resource-share-approval-required', browserStorageChanged: false, remoteRequestCreated: false });
      const state = current();
      if (state.invites.length >= EON_COLLABORATION_INVITE_MAX) return freeze({ ok: false, error: 'collaboration-invite-limit-reached', browserStorageChanged: false, remoteRequestCreated: false });
      const invite = normalizeInvite({
        schema: EON_COLLABORATION_INVITE_SCHEMA,
        inviteId: id(clock()),
        resourceReference,
        resourceReceiptHash,
        resourceLabel,
        recipientLabel,
        role,
        state: 'prepared-local',
        createdAt: clock(),
        expiresAt,
        updatedAt: clock()
      }, clock());
      if (!invite) return freeze({ ok: false, error: 'invite-input-invalid-or-expiry-out-of-range', browserStorageChanged: false, remoteRequestCreated: false });
      const duplicate = state.invites.find((entry) => entry.resourceReference === invite.resourceReference && entry.resourceReceiptHash === invite.resourceReceiptHash && entry.recipientLabel === invite.recipientLabel && entry.role === invite.role && entry.state === 'prepared-local');
      if (duplicate) return freeze({ ok: true, deduped: true, invite: publicInvite(duplicate), browserStorageChanged: false, remoteRequestCreated: false, snapshot: snapshotOf(state) });
      const next = freeze({ ...state, updatedAt: iso(clock()), invites: freeze([invite, ...state.invites]) });
      const saved = persist(next);
      return freeze({ ok: saved.stored, invite: publicInvite(invite), deliveryStatus: 'not-sent', acceptanceStatus: 'not-requested', ...saved });
    },
    revokeInvite(inviteId = '', { explicitUserAction = false, confirmed = false } = {}) {
      if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required', browserStorageChanged: false, remoteRequestCreated: false });
      if (confirmed !== true) return freeze({ ok: false, error: 'revocation-confirmation-required', browserStorageChanged: false, remoteRequestCreated: false });
      const state = current();
      const existing = state.invites.find((invite) => invite.inviteId === String(inviteId));
      if (!existing) return freeze({ ok: false, error: 'collaboration-invite-not-found', browserStorageChanged: false, remoteRequestCreated: false });
      if (existing.state === 'revoked') return freeze({ ok: true, deduped: true, browserStorageChanged: false, remoteRequestCreated: false, snapshot: snapshotOf(state) });
      const revoked = normalizeInvite({ ...clone(existing), state: 'revoked', revokedAt: clock(), updatedAt: clock() }, clock());
      const next = freeze({ ...state, updatedAt: iso(clock()), invites: freeze(state.invites.map((invite) => invite.inviteId === existing.inviteId ? revoked : invite)) });
      const saved = persist(next);
      return freeze({ ok: saved.stored, invite: publicInvite(revoked), deliveryStatus: 'not-sent', acceptanceStatus: 'not-requested', ...saved });
    },
    recordAcceptance() {
      return freeze({ ok: false, error: 'external-delivery-and-verified-acceptance-not-released', remoteRequestCreated: false, recipientIdentityVerified: false, externalPermissionGranted: false });
    }
  });
}

export function getEonCollaborationInviteTruth() {
  return freeze({
    schema: EON_COLLABORATION_INVITE_SCHEMA,
    safeResultShareReview: true,
    localInviteDrafts: true,
    resourceRoleExpiry: true,
    deliveryEnabled: false,
    acceptanceEnabled: false,
    recipientIdentityVerification: false,
    resourceContentTransfer: false,
    externalPermissionGrant: false,
    tracking: false,
    directPublishing: false,
    autoPosting: false,
    remoteRequestCreated: false,
    productionCollaborationProof: false
  });
}
