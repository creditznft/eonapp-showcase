#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EON_REALM_RELIC_CAPABILITIES,
  assertRealmRelicBoundary,
  getEonRealmRelicPublicSummary
} from '../assets/js/realm-relic/eon-realm-relic-boundary.js';
import {
  EON_PRODUCT_LICENSE_FEATURE_FLAGS,
  createDisabledPersonalLicenceIntent,
  getEonProductLicenseFoundation
} from '../assets/js/commerce/eon-product-license-foundation.js';
import { getCapabilityTruth } from '../assets/js/capabilities/capability-truth-registry.js';
import {
  W346_ACTIVE_SURFACE_FORBIDDEN,
  W346_REALM_RELIC_COMMERCE_SCHEMA,
  W346_REQUIRED_CAPABILITIES,
  W346_REQUIRED_SOURCES
} from '../config/w346-realm-relic-commerce-boundary-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

function allFalse(value) {
  return Object.values(value).every((item) => item === false);
}

export function runW346RealmRelicCommerceBoundaryGate(root = DEFAULT_ROOT) {
  const errors = [];
  for (const relative of W346_REQUIRED_SOURCES) {
    if (!fs.existsSync(path.join(root, relative))) errors.push(`Missing required W346 source: ${relative}`);
  }

  const boundary = assertRealmRelicBoundary();
  if (!boundary.ok) errors.push(boundary.reason);
  if (EON_REALM_RELIC_CAPABILITIES.localRealmStudioActive !== true || EON_REALM_RELIC_CAPABILITIES.localRelicGenerationActive !== true) errors.push('Local Realm/Relic capability should remain active.');
  if (!allFalse(Object.fromEntries(Object.entries(EON_REALM_RELIC_CAPABILITIES).filter(([key]) => !['localRealmStudioActive', 'localRelicGenerationActive', 'localRelicVaultSaveActive', 'portableIdentityShareActive'].includes(key))))) errors.push('Realm/Relic commercial capability must remain disabled.');

  const summary = getEonRealmRelicPublicSummary();
  if (summary.realm.lifecycle !== 'active-local' || summary.relic.lifecycle !== 'active-local') errors.push('Realm and Relic public summary must stay local-active.');
  if (summary.productLicense.lifecycle !== 'planned' || summary.chain.lifecycle !== 'blocked') errors.push('Personal licence and chain public summaries have invalid lifecycle.');

  const licence = getEonProductLicenseFoundation();
  if (licence.active !== false || licence.lifecycle !== 'design-only' || !allFalse(EON_PRODUCT_LICENSE_FEATURE_FLAGS)) errors.push('Product licence foundation must remain design-only and inactive.');
  if (licence.productModel.transferable !== false || licence.productModel.walletRequired !== false || licence.productModel.nftRequired !== false) errors.push('Future product licences must not be transferable, wallet-backed, or NFT-backed.');
  const intent = createDisabledPersonalLicenceIntent('relic_pack!!');
  if (intent.status !== 'disabled' || intent.networkRequestCreated || intent.checkoutOpened || intent.paymentAccepted || intent.licenceIssued || intent.entitlementActivated) errors.push('Disabled personal licence intent has side effects.');

  for (const id of W346_REQUIRED_CAPABILITIES) {
    if (!getCapabilityTruth(id)) errors.push(`Capability registry is missing ${id}.`);
  }
  if (getCapabilityTruth('realm-local-studio')?.lifecycle !== 'active-local') errors.push('Realm registry lifecycle must be active-local.');
  if (getCapabilityTruth('local-relic-previews')?.lifecycle !== 'active-local') errors.push('Relic registry lifecycle must be active-local.');
  if (getCapabilityTruth('official-personal-licenses')?.lifecycle !== 'planned') errors.push('Product licence registry lifecycle must be planned.');
  if (getCapabilityTruth('legacy-eonlite-polygon-stack')?.lifecycle !== 'blocked') errors.push('Legacy EONLite/Polygon lifecycle must be blocked.');

  const activeSurface = [
    'market.html',
    'realm-studio.html',
    'assets/js/market/eon-market-page.js',
    'assets/js/market/market-private-drop.js',
    'assets/js/realm-studio-page.js'
  ].map((relative) => ({ relative, source: read(root, relative) }));
  for (const { relative, source } of activeSurface) {
    for (const pattern of W346_ACTIVE_SURFACE_FORBIDDEN) {
      if (pattern.test(source)) errors.push(`${relative} contains an active commercial/wallet claim: ${pattern}`);
    }
  }

  const market = read(root, 'assets/js/market/eon-market-page.js');
  const realm = read(root, 'assets/js/realm-studio-page.js');
  const relicBoundarySource = read(root, 'assets/js/realm-relic/eon-realm-relic-boundary.js');
  const oldMarket = read(root, 'assets/js/market-page.js');
  const relicNft = read(root, 'Smart Contracts/contracts/EONRelicNFT.sol');
  const eonLite = read(root, 'Smart Contracts/contracts/EONLiteToken.sol');
  if (!/getEonRealmRelicPublicSummary/.test(market) || !/Local Relic preview/.test(market)) errors.push('Canonical Market is not wired to the Realm/Relic boundary.');
  if (!/getEonRealmRelicPublicSummary/.test(realm)) errors.push('Realm Studio is not wired to the Realm/Relic boundary.');
  if (!/not minted, sold, listed, transferable, or assigned financial value/i.test(relicBoundarySource)) errors.push('Realm/Relic boundary must state Local Relic non-transferability.');
  if (!/not published or transferable/i.test(realm)) errors.push('Realm Studio must state Relic non-transferability.');
  if (!/EonLite/.test(oldMarket)) errors.push('Legacy market quarantine evidence unexpectedly changed; do not reactivate it.');
  if (!/ERC721/.test(relicNft) || !/ERC2981/.test(relicNft) || !/function mint\(/.test(relicNft)) errors.push('Existing EONRelicNFT source audit no longer detects transferable royalty-capable legacy contract shape.');
  if (!/ERC20/.test(eonLite) || !/function mint\(/.test(eonLite)) errors.push('Existing EONLite token source audit no longer detects legacy fungible-token shape.');

  return {
    schema: W346_REALM_RELIC_COMMERCE_SCHEMA,
    ok: errors.length === 0,
    errors,
    activeLocal: ['realm-local-studio', 'local-relic-previews'],
    planned: ['official-personal-licenses'],
    blocked: ['legacy-eonlite-polygon-stack'],
    legacyContractAudit: { relicNft: 'transferable-erc721-with-erc2981-source-detected', eonLite: 'fungible-erc20-source-detected' }
  };
}

function main() {
  const result = runW346RealmRelicCommerceBoundaryGate();
  if (!result.ok) {
    console.error(`[W346] Realm/Relic commerce boundary failed (${result.errors.length} finding(s)).`);
    result.errors.forEach((error) => console.error(` - ${error}`));
    return 1;
  }
  console.log('[W346] PASS: Realm and Relic remain local/non-transferable; licences planned; EONLite/Polygon stack blocked.');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) process.exitCode = main();
