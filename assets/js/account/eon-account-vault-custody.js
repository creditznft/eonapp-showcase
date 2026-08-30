/**
 * W632 — account, Vault and secure-key custody separation.
 *
 * The browser may display credential metadata, but provider secrets are never
 * returned by this module and generic localStorage is never an approved secret
 * store. Account identity is also not treated as backup or sync.
 */

export const EON_W632_SCHEMA = 'eon.account-vault-custody.w632.v1';
export const EON_W632_CUSTODY_RECORD_KEY = 'eon:account-vault-custody:w632:v1';

export const EON_W632_DATA_DOMAINS = Object.freeze({
  account: Object.freeze({ label: 'Account data', examples: ['account id', 'email', 'session status'], custody: 'server-minimal', portableBackup: false }),
  localWork: Object.freeze({ label: 'Local work', examples: ['chat', 'projects', 'library', 'Forge source'], custody: 'browser-local', portableBackup: true }),
  providerCredentials: Object.freeze({ label: 'Provider credentials', examples: ['API key metadata'], custody: 'os-keychain-or-encrypted-vault', portableBackup: false }),
  generatedMedia: Object.freeze({ label: 'Generated media', examples: ['saved image', 'saved video'], custody: 'explicit-local-save', portableBackup: true }),
  receipts: Object.freeze({ label: 'Receipts and settings', examples: ['billing receipt id', 'preferences'], custody: 'server-or-browser-by-kind', portableBackup: true })
});

export const EON_W632_APPROVED_SECRET_CUSTODY = Object.freeze(['os-keychain', 'secure-companion', 'encrypted-local-vault']);
export const EON_W632_FORBIDDEN_ACTIVE_UI_TERMS = Object.freeze(['connect wallet', 'seed phrase login', 'crypto wallet required', 'token staking', 'gas fee']);

const SENSITIVE_KEY_RE = /(api[-_ ]?key|secret|access[-_ ]?token|refresh[-_ ]?token|password|passphrase|private[-_ ]?key|seed|mnemonic|authorization|cookie)/i;

function clean(value = '', limit = 240) {
  return Array.from(String(value || '')).filter((character) => {
    const code = character.charCodeAt(0);
    return code > 31 && code !== 127;
  }).join('').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function hasSensitiveShape(value, depth = 0) {
  if (depth > 8 || value == null) return false;
  if (Array.isArray(value)) return value.some((entry) => hasSensitiveShape(entry, depth + 1));
  if (typeof value !== 'object') return false;
  return Object.entries(value).some(([key, entry]) => {
    const sensitiveKey = SENSITIVE_KEY_RE.test(String(key || ''));
    if (sensitiveKey && entry !== false && entry !== '' && entry != null) return true;
    return hasSensitiveShape(entry, depth + 1);
  });
}

function storageRef(options = {}) {
  if (options.storage) return options.storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function nowIso(options = {}) { return String(options.now || new Date().toISOString()); }

function defaultState(options = {}) {
  const timestamp = nowIso(options);
  return {
    schema: EON_W632_SCHEMA,
    createdAt: timestamp,
    updatedAt: timestamp,
    session: { state: 'guest', sessionIdPresent: false, logoutPrepared: false, deleteRequestPrepared: false },
    credentials: [],
    recoveryReviews: []
  };
}

function normalizeCredentialMetadata(input = {}) {
  if (hasSensitiveShape(input)) throw new Error('Credential values are not accepted by the browser metadata contract.');
  const custody = EON_W632_APPROVED_SECRET_CUSTODY.includes(input.custody) ? input.custody : '';
  if (!custody) throw new Error('Approved secret custody is required.');
  return Object.freeze({
    id: clean(input.id || `credential_${Date.now().toString(36)}`, 140),
    provider: clean(input.provider || 'Provider', 100),
    label: clean(input.label || 'Provider credential', 140),
    custody,
    fingerprintSuffix: clean(input.fingerprintSuffix, 12).replace(/[^a-zA-Z0-9]/g, ''),
    createdAt: String(input.createdAt || new Date().toISOString()),
    lastCheckedAt: String(input.lastCheckedAt || ''),
    secretIncluded: false,
    exportable: false,
    generalLocalStorageAllowed: false
  });
}

function normalizeRecoveryReview(input = {}) {
  return Object.freeze({
    id: clean(input.id || `recovery_${Date.now().toString(36)}`, 140),
    backupId: clean(input.backupId, 180),
    source: ['encrypted-capsule', 'google-drive-user-file', 'local-export'].includes(input.source) ? input.source : 'encrypted-capsule',
    stage: ['preview', 'conflict-review', 'approved', 'cancelled'].includes(input.stage) ? input.stage : 'preview',
    conflictCount: Math.max(0, Number(input.conflictCount || 0)),
    destructiveWriteApplied: false,
    automaticRestore: false,
    reviewedAt: String(input.reviewedAt || new Date().toISOString())
  });
}

export function loadW632CustodyState(options = {}) {
  let parsed = null;
  try { parsed = JSON.parse(String(storageRef(options)?.getItem?.(EON_W632_CUSTODY_RECORD_KEY) || 'null')); } catch {}
  const base = defaultState(options);
  const source = parsed && typeof parsed === 'object' ? parsed : base;
  return {
    ...base,
    ...source,
    schema: EON_W632_SCHEMA,
    session: {
      state: ['guest', 'authenticated', 'expired'].includes(source.session?.state) ? source.session.state : 'guest',
      sessionIdPresent: Boolean(source.session?.sessionIdPresent),
      logoutPrepared: Boolean(source.session?.logoutPrepared),
      deleteRequestPrepared: Boolean(source.session?.deleteRequestPrepared)
    },
    credentials: (Array.isArray(source.credentials) ? source.credentials : []).slice(0, 80).map(normalizeCredentialMetadata),
    recoveryReviews: (Array.isArray(source.recoveryReviews) ? source.recoveryReviews : []).slice(0, 80).map(normalizeRecoveryReview)
  };
}

function persist(state, options = {}) {
  const next = { ...state, schema: EON_W632_SCHEMA, updatedAt: nowIso(options) };
  storageRef(options)?.setItem?.(EON_W632_CUSTODY_RECORD_KEY, JSON.stringify(next));
  try { globalThis.document?.dispatchEvent?.(new CustomEvent('eon:w632-custody-changed', { detail: { updatedAt: next.updatedAt } })); } catch {}
  return next;
}

export function registerCredentialMetadata(input = {}, options = {}) {
  let metadata;
  try { metadata = normalizeCredentialMetadata(input); }
  catch (error) { return Object.freeze({ ok: false, reason: 'credential-metadata-rejected', message: String(error?.message || error) }); }
  const state = loadW632CustodyState(options);
  state.credentials = [metadata, ...state.credentials.filter((entry) => entry.id !== metadata.id)].slice(0, 80);
  persist(state, options);
  return Object.freeze({ ok: true, metadata });
}

export function prepareSessionAction(action = '', options = {}) {
  const state = loadW632CustodyState(options);
  if (!['logout', 'delete-account'].includes(action)) return Object.freeze({ ok: false, reason: 'unsupported-action' });
  if (options.explicitUserAction !== true || options.confirmed !== true) return Object.freeze({ ok: false, reason: 'explicit-confirmation-required' });
  if (action === 'logout') state.session.logoutPrepared = true;
  if (action === 'delete-account') state.session.deleteRequestPrepared = true;
  persist(state, options);
  return Object.freeze({
    ok: true,
    action,
    preparedOnly: true,
    serverRequestSent: false,
    localWorkDeleted: false,
    credentialsDeleted: false,
    backupDeleted: false
  });
}

export function prepareRecoveryReview(input = {}, options = {}) {
  if (options.explicitUserAction !== true) return Object.freeze({ ok: false, reason: 'explicit-user-action-required' });
  const review = normalizeRecoveryReview(input);
  if (!review.backupId) return Object.freeze({ ok: false, reason: 'backup-id-required' });
  const state = loadW632CustodyState(options);
  state.recoveryReviews = [review, ...state.recoveryReviews.filter((entry) => entry.id !== review.id)].slice(0, 80);
  persist(state, options);
  return Object.freeze({ ok: true, review, restoreApplied: false });
}

export function evaluateAccountVaultSeparation(input = {}) {
  const credentialInputBlocked = hasSensitiveShape(input.browserCredentialInput || {});
  return Object.freeze({
    schema: EON_W632_SCHEMA,
    accountIdentityIsBackup: false,
    automaticCrossDeviceSync: false,
    browserCredentialInputBlocked: credentialInputBlocked,
    providerSecretReadableByUi: false,
    providerSecretExportable: false,
    localWorkDeletedOnLogout: false,
    restoreRequiresPreview: true,
    restoreRequiresConflictReview: true,
    automaticRestore: false,
    generatedMediaRequiresExplicitSave: true,
    domains: EON_W632_DATA_DOMAINS
  });
}

export function findForbiddenWalletLanguage(text = '') {
  const source = String(text || '').toLowerCase();
  return EON_W632_FORBIDDEN_ACTIVE_UI_TERMS.filter((term) => source.includes(term));
}

export function buildW632CustodySummary(options = {}) {
  const state = loadW632CustodyState(options);
  return Object.freeze({
    schema: EON_W632_SCHEMA,
    sessionState: state.session.state,
    credentialMetadataCount: state.credentials.length,
    recoveryReviewCount: state.recoveryReviews.length,
    identityBacksUpLocalWork: false,
    automaticRestore: false,
    approvedCustody: EON_W632_APPROVED_SECRET_CUSTODY,
    forbiddenWalletLanguageCount: EON_W632_FORBIDDEN_ACTIVE_UI_TERMS.length
  });
}

export function installW632CustodyPanel(options = {}) {
  const doc = options.document || globalThis.document;
  const main = doc?.querySelector?.('main');
  if (!main || doc.querySelector('[data-eon-w632-panel]')) return Object.freeze({ installed: false });
  const summary = buildW632CustodySummary(options);
  const panel = doc.createElement('section');
  panel.className = 'eon-w632-custody-panel';
  panel.dataset.eonW632Panel = '1';
  panel.innerHTML = `<div><span>Account and Vault boundaries</span><strong>${summary.credentialMetadataCount} credential record${summary.credentialMetadataCount === 1 ? '' : 's'} · metadata only</strong><small>Sign-in is not backup. Provider secrets stay in approved secure custody and restores always begin with a preview.</small></div><a href="/vault-backup">Review backup options</a>`;
  main.prepend(panel);
  return Object.freeze({ installed: true, summary });
}

export function validateW632AccountVaultContract() {
  const blocked = registerCredentialMetadata({ provider: 'fal', apiKey: 'secret' }, { storage: { getItem: () => null, setItem: () => {} } });
  const separation = evaluateAccountVaultSeparation({ browserCredentialInput: { apiKey: 'x' } });
  const checks = [
    Object.keys(EON_W632_DATA_DOMAINS).length === 5,
    EON_W632_APPROVED_SECRET_CUSTODY.length === 3,
    blocked.ok === false,
    separation.accountIdentityIsBackup === false,
    separation.providerSecretReadableByUi === false,
    separation.automaticRestore === false,
    separation.generatedMediaRequiresExplicitSave === true,
    findForbiddenWalletLanguage('Connect wallet to continue').includes('connect wallet')
  ];
  return Object.freeze({ schema: EON_W632_SCHEMA, ok: checks.every(Boolean), passed: checks.filter(Boolean).length, total: checks.length });
}
