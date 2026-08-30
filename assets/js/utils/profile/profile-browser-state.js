/**
 * W520 profile-browser-state contract.
 *
 * Normalization for local browser attachment, workspace snapshot, entitlement
 * receipt and recovery metadata. No account authority, payment activation,
 * cloud recovery, relay or background sync is performed here.
 */

export const PROFILE_BROWSER_STATE_LIMITS = Object.freeze({
  attachments: 16,
  workspaces: 12,
  receipts: 24
});
const MAX_BROWSER_ATTACHMENTS = PROFILE_BROWSER_STATE_LIMITS.attachments;
const MAX_BROWSER_WORKSPACE_PROFILES = PROFILE_BROWSER_STATE_LIMITS.workspaces;
const MAX_ENTITLEMENT_RECEIPTS = PROFILE_BROWSER_STATE_LIMITS.receipts;
const RECOVERY_STATUSES = new Set(['local-only', 'encrypted-backup', 'mirrored', 'fully-recoverable']);

export function normalizeProfileIsoDate(value) {
  if (!value) return null;
  const timestamp = Date.parse(String(value));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function normalizeRecoveryStatus(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/\s+/g, '-');
  return RECOVERY_STATUSES.has(normalized) ? normalized : 'local-only';
}

function buildBrowserAttachmentLabel(provider, name = '', email = '') {
  const parts = [String(name || '').trim(), String(email || '').trim()].filter(Boolean);
  if (parts.length) return parts[0].slice(0, 64);
  const safeProvider = String(provider || 'browser').trim().toLowerCase() || 'browser';
  return `${safeProvider} attachment`.slice(0, 64);
}

export function normalizeBrowserAttachment(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const provider = String(entry.provider || entry.providerId || entry.kind || '').trim().toLowerCase();
  if (!provider) return null;
  const name = typeof entry.name === 'string' ? entry.name.trim().slice(0, 80) : '';
  const email = typeof entry.email === 'string' ? entry.email.trim().slice(0, 128) : '';
  const label = typeof entry.label === 'string' ? entry.label.trim().slice(0, 80) : '';
  const accountId = typeof entry.accountId === 'string' ? entry.accountId.trim().slice(0, 128) : '';
  const authKind = typeof entry.authKind === 'string' ? entry.authKind.trim().slice(0, 32) : 'browser';
  const source = typeof entry.source === 'string' ? entry.source.trim().slice(0, 32) : 'browser';
  const scope = Array.isArray(entry.scope)
    ? [...new Set(entry.scope.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean))].slice(0, 12)
    : [];
  const attachedAt = normalizeProfileIsoDate(entry.attachedAt) || new Date().toISOString();
  const lastUsedAt = normalizeProfileIsoDate(entry.lastUsedAt);
  const attachmentId = typeof entry.attachmentId === 'string' && entry.attachmentId.trim()
    ? entry.attachmentId.trim().slice(0, 128)
    : `${provider}:${accountId || email || name || 'session'}`;
  return {
    attachmentId,
    provider,
    label: label || buildBrowserAttachmentLabel(provider, name, email),
    name: name || null,
    email: email || null,
    accountId: accountId || null,
    authKind,
    source,
    scope,
    browserManaged: entry.browserManaged !== false,
    attachedAt,
    lastUsedAt
  };
}

export function normalizeBrowserAttachments(attachments = []) {
  if (!Array.isArray(attachments)) return [];
  const seen = new Map();
  for (const entry of attachments) {
    const normalized = normalizeBrowserAttachment(entry);
    if (!normalized) continue;
    const key = `${normalized.provider}:${normalized.accountId || normalized.email || normalized.name || normalized.attachmentId}`;
    const previous = seen.get(key);
    const currentTs = Date.parse(normalized.lastUsedAt || normalized.attachedAt || '');
    const previousTs = previous ? Date.parse(previous.lastUsedAt || previous.attachedAt || '') : -Infinity;
    if (!previous || currentTs >= previousTs) seen.set(key, normalized);
  }
  return [...seen.values()]
    .sort((a, b) => Date.parse(b.attachedAt || '') - Date.parse(a.attachedAt || ''))
    .slice(0, MAX_BROWSER_ATTACHMENTS);
}

export function normalizeBrowserWorkspaceProfile(entry = {}) {
  if (!entry || typeof entry !== 'object') return null;
  const attachments = normalizeBrowserAttachments(entry.attachments || entry.browserAttachments || []);
  const label = String(entry.label || entry.name || '').trim().slice(0, 72);
  const id = String(entry.profileId || entry.id || label || '').trim().slice(0, 96) || `workspace-${Date.now().toString(36)}`;
  const snapshotAt = normalizeProfileIsoDate(entry.snapshotAt || entry.createdAt) || new Date().toISOString();
  const updatedAt = normalizeProfileIsoDate(entry.updatedAt) || snapshotAt;
  return {
    id,
    label: label || 'Workspace profile',
    notes: String(entry.notes || '').trim().slice(0, 180),
    attachments,
    attachmentCount: attachments.length,
    snapshotAt,
    updatedAt,
    lastAppliedAt: normalizeProfileIsoDate(entry.lastAppliedAt),
    source: String(entry.source || 'local-profile').trim().slice(0, 40) || 'local-profile'
  };
}

export function normalizeBrowserWorkspaceProfiles(profiles = []) {
  if (!Array.isArray(profiles)) return [];
  const seen = new Map();
  for (const entry of profiles) {
    const normalized = normalizeBrowserWorkspaceProfile(entry);
    if (!normalized) continue;
    const key = normalized.id || normalized.label;
    const previous = seen.get(key);
    const currentTs = Date.parse(normalized.updatedAt || normalized.snapshotAt || '');
    const previousTs = previous ? Date.parse(previous.updatedAt || previous.snapshotAt || '') : -Infinity;
    if (!previous || currentTs >= previousTs) seen.set(key, normalized);
  }
  return [...seen.values()]
    .sort((a, b) => Date.parse(b.updatedAt || b.snapshotAt || '') - Date.parse(a.updatedAt || a.snapshotAt || ''))
    .slice(0, MAX_BROWSER_WORKSPACE_PROFILES);
}

export function normalizeEntitlementReceipt(entry) {
  if (!entry || typeof entry !== 'object') return null;
  const planId = String(entry.planId || entry.plan_id || '').trim().toLowerCase() || 'free';
  const receiptId = typeof entry.receiptId === 'string' && entry.receiptId.trim()
    ? entry.receiptId.trim().slice(0, 128)
    : `receipt-${planId}-${Date.now().toString(36)}`;
  const paymentAsset = String(entry.paymentAsset || entry.payment_asset || 'stable').trim().toLowerCase() || 'stable';
  const status = String(entry.status || 'active').trim().toLowerCase() || 'active';
  return {
    receiptId,
    planId,
    status,
    issuer: typeof entry.issuer === 'string' ? entry.issuer.trim().slice(0, 64) : 'local-vault',
    signature: typeof entry.signature === 'string' ? entry.signature.trim().slice(0, 128) : 'local-device',
    paymentAsset,
    issuedAt: normalizeProfileIsoDate(entry.issuedAt || entry.issued_at) || new Date().toISOString(),
    renewsAt: normalizeProfileIsoDate(entry.renewsAt || entry.renews_at),
    expiresAt: normalizeProfileIsoDate(entry.expiresAt || entry.expires_at),
    source: typeof entry.source === 'string' ? entry.source.trim().slice(0, 64) : 'local'
  };
}

export function normalizeEntitlementReceipts(receipts = []) {
  if (!Array.isArray(receipts)) return [];
  const seen = new Map();
  for (const entry of receipts) {
    const normalized = normalizeEntitlementReceipt(entry);
    if (!normalized) continue;
    const key = normalized.receiptId || `${normalized.planId}:${normalized.issuer}:${normalized.issuedAt}`;
    const previous = seen.get(key);
    const currentTs = Date.parse(normalized.issuedAt || '');
    const previousTs = previous ? Date.parse(previous.issuedAt || '') : -Infinity;
    if (!previous || currentTs >= previousTs) seen.set(key, normalized);
  }
  return [...seen.values()]
    .sort((a, b) => Date.parse(b.issuedAt || '') - Date.parse(a.issuedAt || ''))
    .slice(0, MAX_ENTITLEMENT_RECEIPTS);
}

export function normalizeRecoveryState(value = {}) {
  const raw = value && typeof value === 'object' ? value : {};
  const mirrorTargets = Array.isArray(raw.mirrorTargets)
    ? [...new Set(raw.mirrorTargets.map((item) => String(item || '').trim()).filter(Boolean))].slice(0, 5)
    : [];
  const lastExportAt = normalizeProfileIsoDate(raw.lastExportAt);
  const lastRestoreAt = normalizeProfileIsoDate(raw.lastRestoreAt);
  const passkeyReady = Boolean(raw.passkeyReady);
  const recoveryPhraseSet = Boolean(raw.recoveryPhraseSet);
  const fallbackStatus = lastRestoreAt
    ? 'fully-recoverable'
    : mirrorTargets.length
      ? 'mirrored'
      : lastExportAt
        ? 'encrypted-backup'
        : 'local-only';
  return {
    status: normalizeRecoveryStatus(raw.status || fallbackStatus),
    lastExportAt,
    lastRestoreAt,
    recoveryPhraseSet,
    passkeyReady,
    mirrorTargets,
    notes: typeof raw.notes === 'string' ? raw.notes.trim().slice(0, 120) : '',
    updatedAt: normalizeProfileIsoDate(raw.updatedAt) || new Date().toISOString()
  };
}

export function deriveRecoveryStatus(recovery = {}) {
  const normalized = normalizeRecoveryState(recovery);
  if (normalized.lastRestoreAt && (normalized.lastExportAt || normalized.recoveryPhraseSet || normalized.passkeyReady || normalized.mirrorTargets.length)) return 'fully-recoverable';
  if (normalized.mirrorTargets.length) return 'mirrored';
  if (normalized.lastExportAt) return 'encrypted-backup';
  return 'local-only';
}
