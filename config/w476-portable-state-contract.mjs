/**
 * W476-A2 portable state contract.
 *
 * This ledger is the launch-time truth source for what EONAPP may put into an
 * encrypted user-controlled Vault export. It is intentionally conservative:
 * only local-first, non-secret workspace records are exported; sensitive keys,
 * provider tokens, wallets, cookies, OAuth state, payment material, and raw
 * signed/share payloads are excluded even when they use an EONAPP prefix.
 */

export const EON_PORTABLE_STATE_CONTRACT_SCHEMA = 'eonapp.portable-state-contract.v1';
export const EON_PORTABLE_STATE_CONTRACT_VERSION = 1;

export const EON_PORTABLE_STATE_CATEGORIES = Object.freeze({
  INCLUDED_ENCRYPTED_BACKUP: 'included-encrypted-backup',
  EPHEMERAL_NOT_BACKED_UP: 'ephemeral-not-backed-up',
  SENSITIVE_EXCLUDED: 'sensitive-excluded',
  DELIBERATELY_EXCLUDED: 'deliberately-excluded'
});

export const EON_PORTABLE_STATE_RECORDS = Object.freeze([
  {
    id: 'chat-prefill',
    match: 'exact',
    keys: Object.freeze(['eon:chat:prefill:v1']),
    category: EON_PORTABLE_STATE_CATEGORIES.INCLUDED_ENCRYPTED_BACKUP,
    dataClass: 'short local composer handoff text',
    reason: 'Useful local workflow continuity and explicitly encrypted in user export.'
  },
  {
    id: 'chat-history-and-metadata',
    match: 'prefix',
    keys: Object.freeze(['eon:chat:history:', 'eon:chat:thread:', 'eon:chat:metadata:']),
    category: EON_PORTABLE_STATE_CATEGORIES.INCLUDED_ENCRYPTED_BACKUP,
    dataClass: 'local chat metadata/content selected for portable recovery',
    reason: 'Approved durable workspace state. Export remains encrypted and user-controlled.'
  },
  {
    id: 'projects-drafts-artifacts',
    match: 'prefix',
    keys: Object.freeze(['eon:projects:', 'eon:library:', 'eon:creator-library:', 'eon:creator-jobs:', 'eon:artifact:', 'eon:artifacts:', 'eon:forge:', 'eon:workspace:', 'eon:browser:downloads:']),
    category: EON_PORTABLE_STATE_CATEGORIES.INCLUDED_ENCRYPTED_BACKUP,
    dataClass: 'local projects, drafts, artifact index, non-secret workspace records',
    reason: 'Core local-first user work that must survive browser/profile migration when exported.'
  },
  {
    id: 'city-preferences-state',
    match: 'prefix',
    keys: Object.freeze(['eon:city:', 'eon:realm:visual-profile:', 'eon:realm:state:', 'eon:realm:settings:', 'eon:realm-relic:']),
    category: EON_PORTABLE_STATE_CATEGORIES.INCLUDED_ENCRYPTED_BACKUP,
    dataClass: 'local City preferences/state, Realm settings, cosmetic relic/passport state',
    reason: 'Non-financial local customization state approved for encrypted portability.'
  },
  {
    id: 'profile-settings-language-local-ai',
    match: 'mixed',
    keys: Object.freeze(['eon:profile:', 'eon:pwa:profile-state:', 'eon:settings:', 'eon:preferences:', 'eon:lang:', 'eon:local-ai:', 'eonapp_language']),
    category: EON_PORTABLE_STATE_CATEGORIES.INCLUDED_ENCRYPTED_BACKUP,
    dataClass: 'profile/settings/language/local runtime preference without model names or secrets',
    reason: 'Non-secret setup state. Sanitizer removes sensitive fields and model/private values before export.'
  },
  {
    id: 'trade-paper-journal',
    match: 'prefix',
    keys: Object.freeze(['eon:trade:paper:', 'eon:trade:journal:']),
    category: EON_PORTABLE_STATE_CATEGORIES.INCLUDED_ENCRYPTED_BACKUP,
    dataClass: 'paper trading and local journal records',
    reason: 'Local non-custodial educational state; no exchange credentials or real-money execution records.'
  },
  {
    id: 'automation-and-operator-local-records',
    match: 'prefix',
    keys: Object.freeze(['eon:automation-os:', 'eon:operator:activity:', 'eon:action-gateway:', 'eon:connector-consent:']),
    category: EON_PORTABLE_STATE_CATEGORIES.INCLUDED_ENCRYPTED_BACKUP,
    dataClass: 'local automation receipts/preferences and connector consent labels only',
    reason: 'Recoverable local app configuration. Secret material remains excluded by deny rules.'
  },
  {
    id: 'private-preview-and-relic-inventory',
    match: 'prefix',
    keys: Object.freeze(['eon:market:private-drop:', 'eon:market:user-nft-drops:', 'eon:market:visitor:', 'eon:market:starter-vault-receipts:', 'eon:nft:collection:', 'eon:nft-collection:']),
    category: EON_PORTABLE_STATE_CATEGORIES.INCLUDED_ENCRYPTED_BACKUP,
    dataClass: 'legacy-named local cosmetic inventory/receipts only',
    reason: 'Kept for data survival while W477 retires commercial naming. Not a financial asset or token proof.'
  },
  {
    id: 'ephemeral-ui-session',
    match: 'prefix',
    keys: Object.freeze(['sessionStorage:', 'eon:chat-widget-open', 'eon:theme', 'eon:browser:tabs:', 'eon:pwa:rollout:', 'eon:pwa:install:', 'eon:boot:', 'eon:performance:', 'eon:validation:', 'eon:proof:']),
    category: EON_PORTABLE_STATE_CATEGORIES.EPHEMERAL_NOT_BACKED_UP,
    dataClass: 'temporary UI state, diagnostics, proof records, cacheable runtime hints',
    reason: 'Can be recreated and should not be presented as recovered user work.'
  },
  {
    id: 'sensitive-secrets-identifiers',
    match: 'regex',
    keys: Object.freeze(['api[-_:]?key', '(?:access|refresh)?[-_:]?token', 'secret', 'password', 'mnemonic', 'seed', 'private[-_:]?key', 'exchange', 'wallet', 'recovery', 'authorization', 'cookie', 'bearer', 'identity', 'credential', 'oauth', 'session']),
    category: EON_PORTABLE_STATE_CATEGORIES.SENSITIVE_EXCLUDED,
    dataClass: 'credentials, OAuth/session material, wallets, recovery material, account identity',
    reason: 'Never included in generic portable export; requires a separate reviewed secret export design.'
  },
  {
    id: 'commercial-payment-reward-network',
    match: 'regex',
    keys: Object.freeze(['dodo', 'checkout', 'subscription', 'payment', 'webhook', 'payout', 'reward', 'referral', 'monetag', 'telegram', 'signed', 'share-payload']),
    category: EON_PORTABLE_STATE_CATEGORIES.DELIBERATELY_EXCLUDED,
    dataClass: 'payment/reward/referral/network-bound or signed material',
    reason: 'Out of W476 scope or unsafe to export as generic browser-portable state.'
  }
]);

const EXCLUSION_RECORDS_BY_PRIORITY = Object.freeze([
  ...EON_PORTABLE_STATE_RECORDS.filter((record) => record.category === EON_PORTABLE_STATE_CATEGORIES.DELIBERATELY_EXCLUDED),
  ...EON_PORTABLE_STATE_RECORDS.filter((record) => record.category === EON_PORTABLE_STATE_CATEGORIES.SENSITIVE_EXCLUDED)
]);

function matchesContractKey(record, key) {
  const value = String(key || '');
  if (record.match === 'exact') return record.keys.includes(value);
  if (record.match === 'prefix') return record.keys.some((prefix) => value.startsWith(prefix));
  if (record.match === 'mixed') return record.keys.some((candidate) => candidate.endsWith(':') ? value.startsWith(candidate) : value === candidate || value.startsWith(candidate));
  if (record.match === 'regex') return record.keys.some((pattern) => new RegExp(pattern, 'i').test(value));
  return false;
}

export function classifyPortableStateKey(key = '') {
  const value = String(key || '');
  for (const record of EXCLUSION_RECORDS_BY_PRIORITY) {
    if (record.keys.some((patternText) => new RegExp(patternText, 'i').test(value))) {
      return Object.freeze({
        category: record.category,
        recordId: record.id,
        reason: record.reason
      });
    }
  }
  for (const record of EON_PORTABLE_STATE_RECORDS) {
    if (record.category === EON_PORTABLE_STATE_CATEGORIES.SENSITIVE_EXCLUDED || record.category === EON_PORTABLE_STATE_CATEGORIES.DELIBERATELY_EXCLUDED) continue;
    if (matchesContractKey(record, value)) return Object.freeze({ category: record.category, recordId: record.id, reason: record.reason });
  }
  return Object.freeze({
    category: EON_PORTABLE_STATE_CATEGORIES.DELIBERATELY_EXCLUDED,
    recordId: 'unclassified',
    reason: 'Not part of the current W476 portable state allowlist.'
  });
}

export function isPortableBackupIncludedKey(key = '') {
  return classifyPortableStateKey(key).category === EON_PORTABLE_STATE_CATEGORIES.INCLUDED_ENCRYPTED_BACKUP;
}

export function getPortableStateContract() {
  return Object.freeze({
    schema: EON_PORTABLE_STATE_CONTRACT_SCHEMA,
    version: EON_PORTABLE_STATE_CONTRACT_VERSION,
    records: EON_PORTABLE_STATE_RECORDS,
    futureVersionsRejected: true,
    exportRequiresUserPassphrase: true,
    rawSecretsIncluded: false,
    networkRequestCreated: false
  });
}

export function buildPortableStateManifest(keys = []) {
  const rows = [...new Set(keys.map((key) => String(key || '')).filter(Boolean))]
    .sort()
    .map((key) => Object.freeze({ key, ...classifyPortableStateKey(key) }));
  const counts = rows.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + 1;
    return acc;
  }, {});
  return Object.freeze({
    schema: EON_PORTABLE_STATE_CONTRACT_SCHEMA,
    version: EON_PORTABLE_STATE_CONTRACT_VERSION,
    totalKeysReviewed: rows.length,
    counts: Object.freeze(counts),
    rows: Object.freeze(rows),
    unsupportedFutureVersionPolicy: 'reject safely before import',
    userVisibleExclusionExplanation: 'Credentials, OAuth/session data, wallets, payments, signed payloads, reward/referral material, raw URLs, and unrelated same-origin storage are excluded from portable backups.'
  });
}
