/**
 * W225 + W364A — guest-first account and data-custody contract.
 *
 * This browser module intentionally contains no OAuth request, no session
 * cookie, no storage write, and no credentials. It defines what a future
 * optional Google identity may do and, just as importantly, what it never
 * stores or backs up.
 */

import { getLocalFirstBoundaryNotice } from '../local-first/local-first-boundary.js';

export const EON_ACCOUNT_FOUNDATION_SCHEMA = 'eon.account.foundation.v2';
export const EON_ACCOUNT_FOUNDATION_VERSION = 2;
export const EON_ACCOUNT_DATA_CUSTODY_SCHEMA = 'eon.account.data-custody.v1';

export const EON_ACCOUNT_ACTIVATION_FLAGS = Object.freeze({
  optionalGoogleIdentityPlanned: true,
  googleIdentityConfigured: false,
  serverAccountActive: false,
  serverSessionActive: false,
  publicRealmPublishingActive: false,
  officialCatalogActive: false,
  checkoutActive: false,
  affiliateActive: false,
  payoutActive: false,
  tokenProgramActive: false
});

export const EON_MINIMAL_ACCOUNT_RECORD = Object.freeze([
  'random EON account identifier',
  'HMAC-protected Google issuer and subject reference',
  'verified-email flag without retaining the raw email by default',
  'account creation, last-login, consent, session-expiry, and revocation timestamps',
  'opaque server-side session hash',
  'later verified payment-customer reference and entitlement state only'
]);

export const EON_NEVER_CLOUD_ACCOUNT_DATA = Object.freeze([
  'Chat text, prompts, or raw AI outputs',
  'Vault contents, API keys, recovery material, passwords, or provider tokens',
  'local projects, files, assets, Realm layouts, or City progress',
  'local device activity, browser storage dumps, or private diagnostics',
  'Google access or refresh tokens for identity-only sign-in',
  'raw card details or card numbers'
]);

const SENSITIVE_FIELD_PATTERN = /(api[-_ ]?key|secret|token|password|mnemonic|seed|private[-_ ]?key|wallet|recovery|authorization|cookie|session)/i;

function cleanText(value = '', fallback = '', max = 64) {
  let output = '';
  for (const character of String(value || '').trim()) {
    const code = character.codePointAt(0) || 0;
    if (code < 32 || code === 127) continue;
    output += character;
    if (output.length >= max) break;
  }
  return output || fallback;
}

function hasSensitiveShape(value, depth = 0) {
  if (depth > 8 || value == null) return false;
  if (Array.isArray(value)) return value.some((entry) => hasSensitiveShape(entry, depth + 1));
  if (typeof value !== 'object') return false;
  return Object.entries(value).some(([key, entry]) => SENSITIVE_FIELD_PATTERN.test(String(key || '')) || hasSensitiveShape(entry, depth + 1));
}

function localProfileDisplay(input = {}) {
  const profile = input && typeof input === 'object' ? input : {};
  return Object.freeze({
    displayName: cleanText(profile.alias || profile.displayName || profile.username, 'Local profile', 24),
    avatar: cleanText(profile.avatar, '', 8),
    localOnly: true
  });
}

/**
 * Public, static data-custody explanation used before any Google login can be
 * configured. It is deliberately explicit: identity is not a backup product.
 */
export function getAccountDataCustodySummary() {
  return Object.freeze({
    schema: EON_ACCOUNT_DATA_CUSTODY_SCHEMA,
    lifecycle: 'planned-pre-auth',
    guestUseAvailable: true,
    googleIdentityRequired: false,
    googleIdentityConfigured: false,
    localDataBackupRequired: true,
    automaticCloudBackup: false,
    automaticCrossDeviceSync: false,
    cloudflareMayStoreOnlyWhenActivated: EON_MINIMAL_ACCOUNT_RECORD,
    cloudflareNeverStores: EON_NEVER_CLOUD_ACCOUNT_DATA,
    identityScope: Object.freeze(['openid', 'email', 'profile']),
    automaticGoogleServiceAccess: false,
    preSignInNotice: getLocalFirstBoundaryNotice('googleDataCustody'),
    profileNotice: getLocalFirstBoundaryNotice('profile'),
    backupNotice: getLocalFirstBoundaryNotice('backup')
  });
}

/**
 * Returns display-safe local and planned identity context. It deliberately
 * omits uid, email, Google subject, wallet, credentials, recovery data and all
 * server account fields.
 */
export function getAccountFoundationStatus(profile = {}) {
  const localProfile = localProfileDisplay(profile);
  const dataCustody = getAccountDataCustodySummary();
  return Object.freeze({
    schema: EON_ACCOUNT_FOUNDATION_SCHEMA,
    version: EON_ACCOUNT_FOUNDATION_VERSION,
    mode: 'guest-first-optional-google-identity',
    localProfile,
    activation: EON_ACCOUNT_ACTIVATION_FLAGS,
    optionalGoogleIdentity: Object.freeze({
      lifecycle: 'planned',
      configured: false,
      required: false,
      scopes: dataCustody.identityScope,
      note: getLocalFirstBoundaryNotice('googleIdentity')
    }),
    serverAccount: Object.freeze({
      connected: false,
      accountId: null,
      sessionActive: false,
      note: 'No Google identity or hosted session is active in this release.'
    }),
    dataCustody,
    storageBoundary: Object.freeze({
      chatMayStoreCredentials: false,
      generalLocalStorageMayStoreAuthSecrets: false,
      publicLinksMayCarryAccountCredentials: false,
      automaticCloudBackup: false,
      note: 'Google identity must not place credentials in Chat, public links, general browser storage, screenshots, or portable Realm manifests. It does not copy local work to Cloudflare.'
    }),
    publicRealmBoundary: Object.freeze({
      active: false,
      requiresServerAccount: true,
      requiresServerValidation: true,
      requiresReportAndTakedownPath: true
    })
  });
}

/**
 * Design-only statement for the future connection flow. No auth request is
 * initiated and no caller input is persisted or echoed into the response.
 */
export function createAccountConnectionDesign(input = {}) {
  const suppliedSensitiveValue = hasSensitiveShape(input);
  return Object.freeze({
    schema: EON_ACCOUNT_FOUNDATION_SCHEMA,
    kind: 'optional-google-identity-design-only',
    active: false,
    networkRequestCreated: false,
    storageWriteCreated: false,
    accepted: false,
    suppliedSensitiveValue,
    reason: suppliedSensitiveValue
      ? 'Sensitive values are not accepted in this browser-side design contract.'
      : 'Optional Google identity is planned but not configured in this release.',
    futureRequirements: Object.freeze([
      'Authorization Code with PKCE, state, nonce, exact redirect URI validation, and backend token validation.',
      'Server-issued opaque session with CSRF/origin protections and explicit consent for account metadata.',
      'A visible pre-sign-in notice that Google Login does not back up local Chat, Vault, projects, Realm data, City progress, or provider keys.',
      'No credentials in Chat, public links, general localStorage, screenshots, portable backups, or City renderer state.',
      'Account deletion, privacy, support, and recovery policy before public activation.'
    ])
  });
}

export function getAccountFoundationPublicSummary(profile = {}) {
  const status = getAccountFoundationStatus(profile);
  return Object.freeze({
    schema: status.schema,
    mode: status.mode,
    displayName: status.localProfile.displayName,
    accountConnected: false,
    optionalGoogleIdentityPlanned: true,
    googleIdentityConfigured: false,
    localDataBackupRequired: true,
    publicRealmPublishingActive: false,
    officialCommerceActive: false,
    message: 'Guest mode is active. Optional Google sign-in is planned for account access and purchases, not as a backup for this device.'
  });
}
