#!/usr/bin/env node
/** W347-A — verifies that viral Realm sharing stays local, cosmetic, and value-free. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  EON_REALM_RELIC_PASSPORT_EVENTS,
  getLocalRealmShareRelicPassportTruth
} from '../assets/js/realm-relic/eon-realm-relic-passport.js';
import { getCapabilityTruth } from '../assets/js/capabilities/capability-truth-registry.js';
import {
  W347_FORBIDDEN_RUNTIME_TOKENS,
  W347_REALM_SHARE_RELIC_PASSPORT_SCHEMA,
  W347_REQUIRED_SOURCES,
  W347_REQUIRED_TRUTH
} from '../config/w347-realm-share-relic-passport-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_ROOT = path.resolve(__dirname, '..');

function read(root, relative) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

export function runW347RealmShareRelicPassportGate(root = DEFAULT_ROOT) {
  const errors = [];
  for (const relative of W347_REQUIRED_SOURCES) {
    if (!fs.existsSync(path.join(root, relative))) errors.push(`Missing required W347 source: ${relative}`);
  }
  if (errors.length) return { schema: W347_REALM_SHARE_RELIC_PASSPORT_SCHEMA, ok: false, errors };

  const truth = getLocalRealmShareRelicPassportTruth();
  for (const [key, expected] of Object.entries(W347_REQUIRED_TRUTH)) {
    if (truth[key] !== expected) errors.push(`W347 passport truth mismatch: ${key}.`);
  }
  const registry = getCapabilityTruth('realm-share-relic-passport');
  if (!registry || registry.lifecycle !== 'active-local' || registry.externalEffect !== false || registry.requiresConnection !== false) {
    errors.push('Capability truth registry must describe the Realm Share Relic Passport as local-only.');
  }

  const passport = read(root, 'assets/js/realm-relic/eon-realm-relic-passport.js');
  for (const token of W347_FORBIDDEN_RUNTIME_TOKENS) {
    if (passport.includes(token)) errors.push(`Realm Share Relic Passport must not contain ${token}.`);
  }
  for (const required of [
    EON_REALM_RELIC_PASSPORT_EVENTS.OUTBOUND_SYSTEM_SHARE,
    EON_REALM_RELIC_PASSPORT_EVENTS.INCOMING_VERIFIED_REALM_LINK,
    'paidFeatureEntitlementCreated: false',
    'subscriptionEntitlementCreated: false',
    'financialValueAssigned: false',
    'transferAllowed: false',
    'saleAllowed: false'
  ]) {
    if (!passport.includes(required)) errors.push(`Realm Share Relic Passport is missing fail-closed declaration: ${required}.`);
  }

  const studio = read(root, 'assets/js/realm-studio-page.js');
  const referral = read(root, 'assets/js/referral-landing-page.js');
  const html = read(root, 'realm-studio.html');
  const nativeShareIndex = studio.indexOf('if (navigator.share)');
  const signalAwardIndex = studio.indexOf('awardLocalRealmShareRelic', Math.max(0, nativeShareIndex));
  if (!studio.includes('awardLocalRealmShareRelic') || nativeShareIndex < 0) errors.push('Realm Studio must award a local Signal Relic only from the explicit system-share path.');
  if (signalAwardIndex < nativeShareIndex) errors.push('Realm Studio may not award a Signal Relic before the explicit system-share path.');
  const verifiedFailureGuard = referral.indexOf('if (!verified.ok)');
  const welcomeAwardIndex = referral.indexOf('awardLocalRealmShareRelic', Math.max(0, verifiedFailureGuard));
  if (!referral.includes('verifySignedShareToken') || !referral.includes('awardLocalRealmShareRelic')) errors.push('Referral landing must award a Welcome Relic only after signature verification.');
  if (welcomeAwardIndex < verifiedFailureGuard) errors.push('Referral landing may not award a Welcome Relic before a signed link is verified.');
  if (!html.includes('Relic Passport') || !html.includes('not NFTs, tokens, paid unlocks')) errors.push('Realm Studio must explain the non-commercial Relic Passport boundary in the UI.');

  return Object.freeze({
    schema: W347_REALM_SHARE_RELIC_PASSPORT_SCHEMA,
    ok: errors.length === 0,
    errors,
    truth,
    activeLocal: ['realm-share-relic-passport'],
    disabled: ['referral-conversion', 'subscription-entitlement', 'wallet', 'mint', 'sale', 'transfer', 'royalty']
  });
}

function main() {
  const result = runW347RealmShareRelicPassportGate();
  if (!result.ok) {
    console.error(`[W347] Realm Share Relic Passport gate failed (${result.errors.length} finding(s)).`);
    result.errors.forEach((error) => console.error(` - ${error}`));
    return 1;
  }
  console.log('[W347] PASS: Realm sharing creates only free local cosmetic Relics; no tracking, value, entitlement, wallet, mint, sale, or referral conversion.');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) process.exitCode = main();
