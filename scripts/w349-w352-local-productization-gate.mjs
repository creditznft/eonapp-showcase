#!/usr/bin/env node
/** W349–W352 verifies pre-integration merchant boundaries and useful local Outcome Kit previews. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EON_MERCHANT_READINESS_FLAGS,
  getEonMerchantReadiness,
  validateEonMerchantReadiness
} from '../assets/js/commerce/eon-merchant-readiness.js';
import {
  EON_OUTCOME_KIT_FEATURE_FLAGS,
  listEonOutcomeKitPreviews,
  validateEonOutcomeKitCatalog
} from '../assets/js/creator-suite-2/eon-outcome-kit-catalog.js';
import { getEonOfferCatalog } from '../assets/js/commerce/eon-offer-catalog.js';
import { getCapabilityTruth } from '../assets/js/capabilities/capability-truth-registry.js';
import {
  W349_W352_FORBIDDEN_RUNTIME_TOKENS,
  W349_W352_PRODUCTIZATION_SCHEMA,
  W349_W352_REQUIRED_KITS,
  W349_W352_REQUIRED_SOURCES
} from '../config/w349-w352-productization-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

export function runW349W352LocalProductizationGate(root = DEFAULT_ROOT) {
  const errors = [];
  for (const relative of W349_W352_REQUIRED_SOURCES) if (!fs.existsSync(path.join(root, relative))) errors.push(`Missing required W349–W352 source: ${relative}`);
  if (Object.values(EON_MERCHANT_READINESS_FLAGS).some(Boolean)) errors.push('Merchant readiness flags must remain false before an explicit processor test-mode decision.');
  if (Object.values(EON_OUTCOME_KIT_FEATURE_FLAGS).some(Boolean)) errors.push('Outcome Kit previews must remain free local drafts without commerce, provider calls, wallets, or referral value.');
  const merchant = validateEonMerchantReadiness();
  const kits = validateEonOutcomeKitCatalog();
  if (!merchant.ok) errors.push(...merchant.errors);
  if (!kits.ok) errors.push(...kits.errors);
  const kitIds = new Set(listEonOutcomeKitPreviews().map((kit) => kit.id));
  for (const id of W349_W352_REQUIRED_KITS) if (!kitIds.has(id)) errors.push(`Missing required local Outcome Kit preview: ${id}`);
  if (listEonOutcomeKitPreviews().some((kit) => kit.requiresPayment || kit.transferable || kit.tokenOrNft || kit.entitlement || kit.lifecycle !== 'active-local-preview')) errors.push('Outcome Kit previews must be free, local, non-transferable, non-token, and non-entitlement starting briefs.');
  const offer = getEonOfferCatalog().offers.find((entry) => entry.id === 'creator-outcome-kit-previews');
  if (!offer || offer.lifecycle !== 'active-local' || offer.requiresPayment !== false || offer.tokenOrNft !== false) errors.push('Offer catalog must distinguish free local Outcome Kit previews from future commercial packs.');
  const truth = getCapabilityTruth('creator-outcome-kit-previews');
  if (!truth || truth.lifecycle !== 'active-local' || truth.externalEffect !== false || truth.requiresConnection !== false) errors.push('Capability registry must describe Outcome Kit previews as active local work only.');
  for (const relative of ['assets/js/commerce/eon-merchant-readiness.js', 'assets/js/creator-suite-2/eon-outcome-kit-catalog.js']) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    for (const token of W349_W352_FORBIDDEN_RUNTIME_TOKENS) if (source.includes(token)) errors.push(`${relative} must not contain runtime payment/network token: ${token}`);
  }
  const billing = fs.readFileSync(path.join(root, 'billing.html'), 'utf8');
  if (!/No checkout, subscription, payment rail/i.test(billing) || !/data-commercial-active="false"/.test(billing)) errors.push('Billing page must remain explicit that commerce is inactive.');
  return Object.freeze({ schema: W349_W352_PRODUCTIZATION_SCHEMA, ok: errors.length === 0, errors, merchant: getEonMerchantReadiness(), kitCount: kitIds.size });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const result = runW349W352LocalProductizationGate();
  if (!result.ok) result.errors.forEach((error) => console.error(`[W349–W352] ${error}`));
  else console.log(`[W349–W352] PASS: merchant readiness remains pre-integration; ${result.kitCount} free local Outcome Kit previews are available without checkout, licence, provider, wallet, referral, or network behavior.`);
  process.exitCode = result.ok ? 0 : 1;
}
