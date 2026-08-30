import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  EON_LOCKED_FEATURE_SURFACES,
  getLockedFeatureSurface,
  renderLockedFeatureSurface,
  validateLockedFeatureSurfaces
} from '../../assets/js/referrals/eon-locked-feature-surface.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('W616D locked-feature surfaces validate and cover real routes', () => {
  const report = validateLockedFeatureSurfaces();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.surfaceCount, EON_LOCKED_FEATURE_SURFACES.length);
  for (const surfaceId of ['projects', 'workspace', 'local-ai', 'automations', 'vault']) {
    const surface = getLockedFeatureSurface(surfaceId);
    assert.ok(surface, surfaceId);
    assert.ok(surface.route.startsWith('/'));
    assert.equal(surface.commercialActive, true);
    assert.equal(surface.checkoutActive, true);
    assert.equal(surface.referralGrantsActive, true);
    assert.equal(surface.keyRedemptionActive, false);
    assert.equal(surface.liveGrantActive, true);
    assert.equal(surface.browserUnlockAllowed, false);
    assert.ok(surface.featureIds.length >= 2);
  }
});

test('W616D rendered cards expose Billing and reflect only server-authoritative grants', () => {
  for (const surface of EON_LOCKED_FEATURE_SURFACES) {
    const html = renderLockedFeatureSurface(surface.id, { keyInventory: { signal: 1, builder: 1, power: 1 } });
    assert.match(html, new RegExp(`data-eon-premium-surface="${surface.id}"`));
    assert.match(html, /data-commercial-active="true"/);
    assert.match(html, /data-checkout-active="true"/);
    assert.match(html, /data-live-grant-active="true"/);
    assert.match(html, /data-browser-unlock-allowed="false"/);
    assert.match(html, /Referral EONKEYS/);
    assert.match(html, /Sponsor Keys/);
    assert.match(html, /href="\/billing\?plan=/);
    assert.match(html, /disabled aria-disabled="true"/);
    assert.match(html, /signed server capability snapshot/);
  }
});



test('W616D active Sponsor/EONKEY capability renders available and source listens for signed snapshot refresh', () => {
  const capabilitySnapshot = Object.freeze({
    schema: 'eonapp.capability-service.a15.v1',
    tierId: 'free',
    featureGroups: Object.freeze(['plus-template-library']),
    unlocks: Object.freeze([Object.freeze({ unlockId: 'sponsor-template-library-15m', featureGroup: 'plus-template-library', keyType: 'sponsor' })]),
    expiresAt: Date.now() + 60_000,
    serverAuthoritative: true
  });
  const html = renderLockedFeatureSurface('projects', { capabilitySnapshot });
  assert.match(html, /data-eon-lock-state="available"/);
  assert.match(html, /active EONKEY unlock/);
  const source = read('assets/js/referrals/eon-locked-feature-surface.js');
  assert.match(source, /eon:capability-snapshot-changed/);
  assert.match(source, /refreshLockedFeatureSurfaces/);
  assert.match(source, /data-eon-premium-compact/);
});
test('W616D is wired into actual UI page modules and stylesheets', () => {
  const workspace = read('assets/js/eon-workspace-pages.js');
  const projects = read('assets/js/projects/eon-projects-page.js');
  assert.match(projects, /renderLockedFeatureSurface\('projects'/);
  assert.match(workspace, /renderLockedFeatureSurface\('workspace'/);
  assert.match(read('assets/js/local-ai/local-ai-page.js'), /renderLockedFeatureSurface\('local-ai'/);
  assert.match(read('assets/js/eon-automations-page.js'), /renderLockedFeatureSurface\('automations'/);
  assert.match(read('assets/js/vault/eon-vault-page.js'), /renderLockedFeatureSurface\('vault'/);
  for (const file of ['workspace.html', 'projects.html', 'local-ai.html', 'automations.html', 'vault.html']) {
    assert.match(read(file), /eon-feature-locks\.css/, file);
  }
});

test('W616D Vault premium card stays separate from recovery and reveals tabs', () => {
  const vault = read('vault.html');
  assert.match(vault, /id="eon-vault-premium-boundary"/);
  assert.match(vault, /data-eon-vault-card="premium-boundary"/);
  assert.match(vault, /id="eon-vault-reveals-premium-boundary"/);
  assert.match(vault, /data-eon-vault-card="reveals-premium-boundary"/);
});

test('W616D source avoids checkout, key grant, browser entitlement and money-like reward code', () => {
  const combined = [
    read('assets/js/referrals/eon-locked-feature-surface.js'),
    read('assets/js/eon-workspace-pages.js'),
    read('assets/js/local-ai/local-ai-page.js'),
    read('assets/js/eon-automations-page.js'),
    read('assets/js/vault/eon-vault-page.js')
  ].join('\n');
  assert.doesNotMatch(combined, /cashback|wallet balance|crypto payout|free month|renewal discount|paid AI credit|lootbox|jackpot|spin/i);
  assert.doesNotMatch(combined, /createCheckout|checkoutSession|dodo\.checkout|grantKey|redeemKey|entitlementOverride|localStorage\.setItem\(['"]eon:entitlement/i);
});
