/**
 * W225 — future public Realm publication contract.
 *
 * This produces a design-only server submission proposal. It never posts a
 * Realm, reads private City state, registers a public profile, or exposes a
 * local moodboard/showcase. Signed eon3 links remain the only share mechanism
 * in the current release.
 */
import { getMyRealmPublicIdentity } from './realm-state.js';

export const PUBLIC_REALM_MANIFEST_SCHEMA = 'eon.public-realm-manifest.v1';
export const PUBLIC_REALM_MANIFEST_VERSION = 1;

export const PUBLIC_REALM_PUBLICATION_REQUIREMENTS = Object.freeze([
  'Verified server-side account and authenticated publication request.',
  'Server-side unique-handle validation and anti-impersonation controls.',
  'Terms acceptance, report route, takedown path, and abuse-review process.',
  'Versioned manifest, cache invalidation, audit trail, and safe public-data allowlist.',
  'No Vault data, credentials, private chat, private City layout, or local Market showcase data.'
]);

const FORBIDDEN_FIELD_PATTERN = /(api[-_ ]?key|secret|token|password|mnemonic|seed|private[-_ ]?key|wallet|recovery|chat|showcase|inventory|payment|payout|commission|affiliate|email|phone|address)/i;

function cleanText(value = '', fallback = '', max = 96) {
  let output = '';
  for (const character of String(value || '').trim()) {
    const code = character.codePointAt(0) || 0;
    if (code < 32 || code === 127) continue;
    output += character;
    if (output.length >= max) break;
  }
  return output || fallback;
}

function containsForbiddenField(value, depth = 0) {
  if (depth > 8 || value == null) return false;
  if (Array.isArray(value)) return value.some((entry) => containsForbiddenField(entry, depth + 1));
  if (typeof value !== 'object') return false;
  return Object.entries(value).some(([key, entry]) => FORBIDDEN_FIELD_PATTERN.test(String(key || '')) || containsForbiddenField(entry, depth + 1));
}

/**
 * Build an allowlisted publication proposal for future server work. The result
 * itself stays inert: `active` is always false and no network function exists.
 */
export function buildPublicRealmManifestProposal(realmState = {}) {
  const identity = getMyRealmPublicIdentity(realmState);
  const reviewReady = Boolean(identity.shareEligible);
  const realm = Object.freeze({
    id: cleanText(identity.id, '', 96),
    label: reviewReady ? cleanText(identity.label, '', 48) : '',
    handle: reviewReady ? cleanText(identity.handle, '', 48) : '',
    theme: cleanText(identity.theme, 'dark-purple', 32),
    entryDistrict: cleanText(identity.entryDistrict, 'realm', 32)
  });
  return Object.freeze({
    schema: PUBLIC_REALM_MANIFEST_SCHEMA,
    version: PUBLIC_REALM_MANIFEST_VERSION,
    lifecycle: 'design-only',
    active: false,
    realm,
    validation: Object.freeze({
      portableIdentityEligible: reviewReady,
      issues: Object.freeze([...identity.reviewIssues]),
      reportPath: '/support?topic=public-realm',
      serverAcceptanceRequired: true
    }),
    publication: Object.freeze({
      requested: false,
      serverAccountRequired: true,
      serverManifestRequired: true,
      publicEndpoint: null,
      cacheVersion: null,
      reportAndTakedownActive: false
    }),
    excluded: Object.freeze([
      'Vault data', 'credentials', 'private chat', 'private City state',
      'Market showcase references', 'wallet data', 'payment data',
      'affiliate attribution', 'payout data'
    ]),
    requirements: PUBLIC_REALM_PUBLICATION_REQUIREMENTS
  });
}

export function validatePublicRealmManifestProposal(proposal = {}) {
  const source = proposal && typeof proposal === 'object' ? proposal : {};
  const errors = [];
  if (source.schema !== PUBLIC_REALM_MANIFEST_SCHEMA) errors.push('Unsupported Realm publication schema.');
  if (source.lifecycle !== 'design-only' || source.active !== false) errors.push('Public Realm publication must remain design-only and inactive.');
  if (source.publication?.requested === true || source.publication?.publicEndpoint) errors.push('This browser-side contract cannot request or expose public publication.');
  if (!source.validation?.serverAcceptanceRequired) errors.push('Server acceptance must be required before publication.');
  if (containsForbiddenField(source.realm || {})) errors.push('Realm proposal contains a forbidden private or commercial field.');
  return Object.freeze({ ok: errors.length === 0, errors });
}

export function getPublicRealmPublicationStatus(realmState = {}) {
  const proposal = buildPublicRealmManifestProposal(realmState);
  return Object.freeze({
    schema: proposal.schema,
    active: false,
    portableIdentityEligible: proposal.validation.portableIdentityEligible,
    message: proposal.validation.portableIdentityEligible
      ? 'Portable identity sharing is available. Server-backed public Realm publication is not active.'
      : 'Resolve local Realm metadata review before portable identity sharing. Public publication is not active.',
    requirements: proposal.requirements
  });
}
