#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEonKeysCatalog, EON_KEY_UNLOCK_MENU, EON_AI_COST_BOUNDARY, EON_SUBSCRIPTION_TIERS } from '../assets/js/referrals/eon-keys-catalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW616bEonKeysReferralGate() {
  const errors = [];
  const validation = validateEonKeysCatalog();
  if (!validation.ok) errors.push(...validation.errors);
  if (EON_AI_COST_BOUNDARY.platformPaidHostedGeneration !== false) errors.push('EONAPP platform-paid hosted generation must remain false.');
  if (!EON_KEY_UNLOCK_MENU.some((unlock) => unlock.category === 'ai-workflow' && unlock.requiresUserLocalOrOwnProviderKey === true)) errors.push('No local/own-key AI workflow unlocks found.');
  if (!EON_KEY_UNLOCK_MENU.some((unlock) => unlock.planEquivalent === 'max')) errors.push('No selected Max-level individual EONKEY unlock found.');
  if (EON_KEY_UNLOCK_MENU.some((unlock) => unlock.category === 'feature-pass')) errors.push('EONKEYS must not unlock whole subscription feature passes.');
  for (const tierId of ['plus', 'studio', 'power', 'max']) {
    const tier = EON_SUBSCRIPTION_TIERS.find((item) => item.id === tierId);
    if (!tier || tier.trialPublic !== true || tier.trialDays !== 7) errors.push(`${tierId} must expose the canonical 7-day public trial.`);
  }

  const shell = read('assets/js/eon-app-shell.js');
  const nav = read('assets/js/shell/eon-shell-navigation.js');
  const page = read('eon-keys.html');
  if (!/Invite & EON Keys/.test(shell)) errors.push('Profile hub must expose Invite & EON Keys.');
  if (!/Billing status & plan/.test(shell)) errors.push('Profile hub must expose Billing status & plan.');
  if (!/Automations \/ EON Flow/.test(shell)) errors.push('More tools menu must include Automations / EON Flow.');
  if (!/id: 'vault', href: '\/vault'/.test(nav)) errors.push('Vault must remain reachable from the canonical sidebar hierarchy.');
  if (!/data-commercial-active="true"/.test(page)) errors.push('EON Keys page must acknowledge live subscriptions.');
  if (!/data-key-redemption-active="false"/.test(page)) errors.push('EONKEY redemption must stay proof-gated until its ledger lifecycle is proven.');
  if (/cashback|wallet balance|crypto payout|free month|renewal discount/i.test(page)) errors.push('Forbidden billing or payout reward language found on public page.');

  return Object.freeze({ ok: errors.length === 0, errors, schema: 'eonapp.w616b.eon-keys-referral-gate.v2', checks: 14 });
}

const report = inspectW616bEonKeysReferralGate();
if (!report.ok) {
  console.error(`[W616B] EON Keys referral gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W616B] EON Keys referral gate passed (${report.checks}/14).`);
