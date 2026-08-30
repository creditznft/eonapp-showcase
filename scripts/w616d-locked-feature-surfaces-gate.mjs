#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  EON_LOCKED_FEATURE_SURFACES,
  renderLockedFeatureSurface,
  validateLockedFeatureSurfaces
} from '../assets/js/referrals/eon-locked-feature-surface.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

export function inspectW616dLockedFeatureSurfacesGate() {
  const errors = [];
  const validation = validateLockedFeatureSurfaces();
  if (!validation.ok) errors.push(...validation.errors);

  const requiredSurfaces = new Map([
    ['projects', 'assets/js/eon-workspace-pages.js'],
    ['workspace', 'assets/js/eon-workspace-pages.js'],
    ['local-ai', 'assets/js/local-ai/local-ai-page.js'],
    ['automations', 'assets/js/eon-automations-page.js'],
    ['vault', 'assets/js/vault/eon-vault-page.js']
  ]);

  for (const [surfaceId, file] of requiredSurfaces) {
    const source = read(file);
    if (!source.includes('renderLockedFeatureSurface')) errors.push(`${file} does not import/use renderLockedFeatureSurface.`);
    if (!source.includes(`renderLockedFeatureSurface('${surfaceId}'`)) errors.push(`${file} does not render ${surfaceId} surface.`);
  }

  for (const file of ['workspace.html', 'projects.html', 'local-ai.html', 'automations.html', 'vault.html']) {
    if (!read(file).includes('/assets/css/eon-feature-locks.css')) errors.push(`${file} missing shared feature-lock CSS.`);
  }

  const vault = read('vault.html');
  if (!vault.includes('id="eon-vault-premium-boundary"')) errors.push('Vault overview is missing premium boundary host.');
  if (!vault.includes('id="eon-vault-reveals-premium-boundary"')) errors.push('Vault Reveals is missing premium boundary host.');

  for (const surface of EON_LOCKED_FEATURE_SURFACES) {
    const html = renderLockedFeatureSurface(surface.id, { keyInventory: { signal: 1, builder: 1, power: 1 } });
    if (!html.includes(`data-eon-premium-surface="${surface.id}"`)) errors.push(`${surface.id} rendered without surface marker.`);
    if (!html.includes('data-commercial-active="false"')) errors.push(`${surface.id} rendered without commercial disabled marker.`);
    if (!html.includes('data-checkout-active="false"')) errors.push(`${surface.id} rendered without checkout disabled marker.`);
    if (!html.includes('data-live-grant-active="false"')) errors.push(`${surface.id} rendered without live grant disabled marker.`);
    if (!html.includes('data-browser-unlock-allowed="false"')) errors.push(`${surface.id} rendered without browser unlock disabled marker.`);
    if (!/Refer to earn EON Keys/.test(html)) errors.push(`${surface.id} does not show EON Keys referral path.`);
    if (!/disabled aria-disabled="true"/.test(html)) errors.push(`${surface.id} does not keep pay/trial/key buttons disabled.`);
  }

  const combinedNew = [
    read('assets/js/referrals/eon-locked-feature-surface.js'),
    read('assets/css/eon-feature-locks.css')
  ].join('\n');
  if (/cashback|wallet balance|crypto payout|free month|renewal discount|paid AI credit|lootbox|jackpot|spin/i.test(combinedNew)) {
    errors.push('Forbidden reward/billing language found in W616D source.');
  }
  if (/createCheckout|checkoutSession|dodo\.checkout|grantKey|redeemKey|entitlementOverride|localStorage\.setItem\(['"]eon:entitlement/i.test(combinedNew)) {
    errors.push('W616D must not add checkout, key grant, redemption, or browser entitlement unlock code.');
  }

  return Object.freeze({ ok: errors.length === 0, errors, schema: 'eonapp.w616d.locked-feature-surfaces-gate.v1', checks: 12 });
}

const report = inspectW616dLockedFeatureSurfacesGate();
if (!report.ok) {
  console.error(`[W616D] locked-feature surfaces gate failed:\n- ${report.errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`[W616D] locked-feature surfaces gate passed (${report.checks}/12).`);
