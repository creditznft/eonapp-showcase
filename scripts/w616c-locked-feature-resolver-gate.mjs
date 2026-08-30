#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_LOCKED_FEATURES,
  resolveLockedFeature,
  validateLockedFeatureResolver
} from '../assets/js/referrals/eon-feature-unlock-resolver.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW616cLockedFeatureResolverGate() {
  const errors = [];
  const validation = validateLockedFeatureResolver();
  if (!validation.ok) errors.push(...validation.errors);
  const requiredTiers = new Set(EON_LOCKED_FEATURES.map((feature) => feature.requiredTier));
  for (const tier of ['plus', 'studio', 'power', 'max']) if (!requiredTiers.has(tier)) errors.push(`No locked feature examples for ${tier}.`);

  for (const feature of EON_LOCKED_FEATURES) {
    const resolution = resolveLockedFeature(feature.id, { keyInventory: { signal: 1, builder: 1, power: 1 }, commercialActive: false });
    if (!resolution.ok) errors.push(`Could not resolve ${feature.id}.`);
    for (const action of ['subscribe', 'trial', 'useKey']) {
      if (!Array.isArray(resolution.actions[action]) || resolution.actions[action].length < 1) errors.push(`${feature.id} missing ${action}.`);
    }
    if (!resolution.actions.refer) errors.push(`${feature.id} missing refer action.`);
    if (resolution.commercialActive !== false || resolution.liveGrantActive !== false) errors.push(`${feature.id} accidentally enabled live commercial state.`);
    if (feature.requiresUserLocalOrOwnProviderKey && !/local AI runtime|own provider\/API key/i.test(resolution.copy.ai)) errors.push(`${feature.id} missing local/own-key AI copy.`);
  }

  const page = read('assets/js/referrals/eon-keys-page.js');
  const html = read('eon-keys.html');
  if (!/renderLockedFeatureCta/.test(page)) errors.push('EON Keys page must render locked feature CTA examples.');
  if (!/Locked feature resolver examples/.test(page)) errors.push('EON Keys page must explain resolver examples.');
  if (!/eon-key-lock-grid/.test(html)) errors.push('EON Keys page must include lock-grid styling.');
  if (!/data-commercial-active="false"/.test(html)) errors.push('EON Keys page must remain non-live.');
  if (/cashback|wallet balance|crypto payout|free month|renewal discount|paid AI credit|lootbox|jackpot|spin/i.test(`${page}\n${html}`)) errors.push('Forbidden reward/billing language found in W616C surface.');

  return Object.freeze({ ok: errors.length === 0, errors, schema: 'eonapp.w616c.locked-feature-resolver-gate.v1', checks: 10 });
}

const report = inspectW616cLockedFeatureResolverGate();
if (!report.ok) {
  console.error(`[W616C] locked-feature resolver gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W616C] locked-feature resolver gate passed (${report.checks}/10).`);
