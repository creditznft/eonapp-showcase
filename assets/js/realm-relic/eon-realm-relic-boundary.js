/**
 * W346-C0 — Realm and Relic local-first product boundary.
 *
 * A Realm is a private City work environment and optional portable identity.
 * A Relic is an original local visual record. Neither is an active marketplace,
 * payment instrument, investment, transferable asset, wallet entitlement, or
 * payout path. This module is intentionally browser-only and has no network,
 * wallet, payment, storage, or provider side effects.
 */

export const EON_REALM_RELIC_BOUNDARY_SCHEMA = 'eon.realm-relic-local-boundary.v1';
export const EON_REALM_RELIC_BOUNDARY_VERSION = 1;

export const EON_REALM_RELIC_CAPABILITIES = Object.freeze({
  localRealmStudioActive: true,
  localRelicGenerationActive: true,
  localRelicVaultSaveActive: true,
  portableIdentityShareActive: true,
  publicRealmStoreActive: false,
  userSellerMarketplaceActive: false,
  relicTransferActive: false,
  relicSaleActive: false,
  relicMintActive: false,
  relicRoyaltyActive: false,
  lootboxValueActive: false,
  tokenSettlementActive: false,
  referralValueActive: false,
  payoutActive: false,
  productLicenseActive: false,
  chainRuntimeActive: false
});

const FORBIDDEN_FINANCIAL_FIELDS = /(?:wallet|payment|price|sale|sell|transfer|royalt|payout|commission|referral|token|liquidity|yield|income|earn|investment|marketplace)/i;

function cleanText(value = '', max = 120) {
  return Array.from(String(value || '').trim(), (character) => {
    const code = character.codePointAt(0) || 0;
    return code < 32 || code === 127 ? ' ' : character;
  }).join('').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanId(value = '', fallback = '') {
  const id = String(value || '').trim().replace(/[^a-zA-Z0-9._:-]/g, '').slice(0, 160);
  return id || fallback;
}

function boolsFalse(...keys) {
  return keys.every((key) => EON_REALM_RELIC_CAPABILITIES[key] === false);
}

/** Build a display-safe local-only record for an original visual preview. */
export function buildLocalRelicBoundary(descriptor = {}) {
  const source = descriptor && typeof descriptor === 'object' ? descriptor : {};
  return Object.freeze({
    schema: EON_REALM_RELIC_BOUNDARY_SCHEMA,
    version: EON_REALM_RELIC_BOUNDARY_VERSION,
    relicId: cleanId(source.id, 'local-relic'),
    displayName: cleanText(source.title, 'Local Relic', 96),
    classification: 'local-nontransferable-creative-record',
    generatedOnDevice: true,
    storageScope: 'this-browser-profile',
    vaultSaveScope: 'local-record-only',
    chainReference: null,
    walletReference: null,
    paymentReference: null,
    transferAllowed: false,
    saleAllowed: false,
    resaleAllowed: false,
    royaltyProgramActive: false,
    financialValueAssigned: false,
    featureEntitlementCreated: false,
    note: 'This local Relic is a visual/creative record. It is not minted, sold, listed, transferable, or assigned financial value.'
  });
}

export function getEonRealmRelicPublicSummary() {
  return Object.freeze({
    schema: EON_REALM_RELIC_BOUNDARY_SCHEMA,
    version: EON_REALM_RELIC_BOUNDARY_VERSION,
    realm: Object.freeze({
      lifecycle: 'active-local',
      label: 'Private City work environment',
      note: 'A Realm holds local City style, landmarks, and private showcase references. It is not a public property, seller account, storefront, or earnings surface.'
    }),
    relic: Object.freeze({
      lifecycle: 'active-local',
      label: 'Local Relic preview',
      note: 'Relic generation creates local visual records for a Vault or Realm moodboard. A local Share Relic may record a user-completed system share or a verified incoming signed Realm link. It creates no NFT, wallet asset, paid unlock, subscription time, referral conversion, transfer, sale, royalty, or financial claim.'
    }),
    productLicense: Object.freeze({
      lifecycle: 'planned',
      label: 'Future official personal licence',
      note: 'A future card/UPI purchase may issue a signed personal licence for an official EONAPP pack. It will be a product receipt/entitlement, not a token, NFT, user-resellable item, wallet asset, or marketplace listing.'
    }),
    chain: Object.freeze({
      lifecycle: 'blocked',
      label: 'Legacy chain stack',
      note: 'Existing EONLite/Polygon contracts are not connected to the app. No wallet, transfer, token, marketplace, royalty, reward, referral, or payout flow is active.'
    }),
    active: Object.freeze({ ...EON_REALM_RELIC_CAPABILITIES })
  });
}

/** Reject commercial/personal data fields from a Realm/Relic display descriptor. */
export function validateLocalRealmRelicDescriptor(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const errors = [];
  const unsafeKeys = Object.keys(source).filter((key) => FORBIDDEN_FINANCIAL_FIELDS.test(key));
  if (unsafeKeys.length) errors.push(`Commercial or wallet-shaped fields are not allowed: ${unsafeKeys.join(', ')}.`);
  if (source.transferAllowed === true || source.saleAllowed === true || source.resaleAllowed === true) errors.push('Local Relics cannot be transferable or sellable.');
  if (source.financialValueAssigned === true) errors.push('Local Relics cannot be assigned financial value.');
  return Object.freeze({
    ok: errors.length === 0,
    errors: Object.freeze(errors),
    schema: EON_REALM_RELIC_BOUNDARY_SCHEMA
  });
}

export function assertRealmRelicBoundary() {
  const disabled = boolsFalse(
    'publicRealmStoreActive',
    'userSellerMarketplaceActive',
    'relicTransferActive',
    'relicSaleActive',
    'relicMintActive',
    'relicRoyaltyActive',
    'lootboxValueActive',
    'tokenSettlementActive',
    'referralValueActive',
    'payoutActive',
    'productLicenseActive',
    'chainRuntimeActive'
  );
  return Object.freeze({
    ok: disabled,
    schema: EON_REALM_RELIC_BOUNDARY_SCHEMA,
    reason: disabled ? 'Local Realm and Relic boundaries are fail-closed.' : 'A commercial Realm or Relic capability must not be enabled in the browser.'
  });
}

export default Object.freeze({
  EON_REALM_RELIC_BOUNDARY_SCHEMA,
  EON_REALM_RELIC_BOUNDARY_VERSION,
  EON_REALM_RELIC_CAPABILITIES,
  buildLocalRelicBoundary,
  getEonRealmRelicPublicSummary,
  validateLocalRealmRelicDescriptor,
  assertRealmRelicBoundary
});
