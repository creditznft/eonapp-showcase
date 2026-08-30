#!/usr/bin/env node
/** W348-A — verifies product direction stays descriptive and commerce remains off. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EON_OFFER_CATALOG_FEATURE_FLAGS,
  getEonOfferCatalog,
  getEonOfferCatalogPublicSummary,
  validateEonOfferCatalog
} from '../assets/js/commerce/eon-offer-catalog.js';
import { getCapabilityTruth } from '../assets/js/capabilities/capability-truth-registry.js';
import {
  W348_FORBIDDEN_RUNTIME_TOKENS,
  W348_OFFER_CATALOG_SCHEMA,
  W348_REQUIRED_FALSE_FLAGS,
  W348_REQUIRED_SOURCES
} from '../config/w348-offer-catalog-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

export function runW348OfferCatalogGate(root = DEFAULT_ROOT) {
  const errors = [];
  for (const relative of W348_REQUIRED_SOURCES) if (!fs.existsSync(path.join(root, relative))) errors.push(`Missing required W348 source: ${relative}`);
  for (const key of W348_REQUIRED_FALSE_FLAGS) if (EON_OFFER_CATALOG_FEATURE_FLAGS[key] !== false) errors.push(`W348 commercial flag must remain false: ${key}.`);
  const catalog = getEonOfferCatalog();
  const validation = validateEonOfferCatalog();
  const summary = getEonOfferCatalogPublicSummary();
  if (!validation.ok) errors.push(...validation.errors);
  if (summary.active !== false || !/no price, checkout/i.test(summary.message)) errors.push('Public offer summary must remain explicitly non-commercial.');
  if (getCapabilityTruth('eon-offer-catalog')?.lifecycle !== 'planned') errors.push('Capability truth registry must describe the offer catalog as planned.');
  const source = fs.existsSync(path.join(root, 'assets/js/commerce/eon-offer-catalog.js')) ? fs.readFileSync(path.join(root, 'assets/js/commerce/eon-offer-catalog.js'), 'utf8') : '';
  for (const token of W348_FORBIDDEN_RUNTIME_TOKENS) if (source.includes(token)) errors.push(`W348 offer catalog must not contain ${token}.`);
  if (!catalog.offers.some((offer) => offer.id === 'eon-free-local' && offer.lifecycle === 'active-local')) errors.push('Free local core offer is missing.');
  if (!catalog.offers.some((offer) => offer.id === 'realm-share-relics' && offer.requiresPayment === false)) errors.push('Free local Share Relics offer is missing.');
  return Object.freeze({ schema: W348_OFFER_CATALOG_SCHEMA, ok: errors.length === 0, errors, flags: EON_OFFER_CATALOG_FEATURE_FLAGS });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const result = runW348OfferCatalogGate();
  if (!result.ok) result.errors.forEach((error) => console.error(`[W348] ${error}`));
  else console.log('[W348] PASS: product direction is visible; pricing, checkout, subscriptions, payments, licences, referrals, tokens, marketplace and payouts remain off.');
  process.exitCode = result.ok ? 0 : 1;
}
