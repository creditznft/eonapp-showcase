import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderEonPremiumCapabilityPreview,
  renderEonPremiumTierPreview,
  validateEonPremiumPreviewSurface,
  refreshEonPremiumCapabilitySurfaces
} from '../../assets/js/capabilities/eon-premium-preview-surface.js';

test('premium capability surface exposes value without direct checkout or browser grants', () => {
  const result = validateEonPremiumPreviewSurface();
  assert.equal(result.ok, true, result.errors.join('\n'));
  const html = renderEonPremiumCapabilityPreview('workspace');
  assert.match(html, /Professional capabilities/);
  assert.match(html, /data-checkout-active="server-status-required"/);
  assert.doesNotMatch(html, /\/api\/billing\/checkout|data-billing-tier=|data-plan-checkout=/);
});

test('professional capability surface reflects signed Pro/Ultimate access instead of remaining a future preview', () => {
  const proHtml = renderEonPremiumCapabilityPreview('local-ai', { capabilitySnapshot: { tierId: 'pro', perpetualLicenses: [] } });
  assert.match(proHtml, /Available with current access/);
  assert.match(proHtml, /data-eon-premium-state="AVAILABLE"/);

  const ultimateHtml = renderEonPremiumCapabilityPreview('forge', { capabilitySnapshot: { tierId: 'free', perpetualLicenses: ['ultimate'] } });
  assert.match(ultimateHtml, /Available with current access/);
  assert.match(ultimateHtml, /data-eon-premium-state="AVAILABLE"/);
  assert.equal(typeof refreshEonPremiumCapabilitySurfaces, 'function');
});

test('premium tier preview freezes Pro Ultra and Ultimate presentation', () => {
  const html = renderEonPremiumTierPreview();
  assert.match(html, /Pro/);
  assert.match(html, /\$99\/month/);
  assert.match(html, /Ultra/);
  assert.match(html, /\$199\/month/);
  assert.match(html, /Ultimate/);
  assert.match(html, /\$1,299 one time/);
  assert.match(html, /Checkout unavailable/);
  assert.match(html, /VERIFY BILLING/);
});

test('premium tier surface becomes server-authoritative and actionable only from confirmed premium status', () => {
  const active = {
    ok: true,
    subscriptionActionsActive: true,
    account: { signedIn: true, trialEligible: true, billing: { tierId: 'studio' } },
    checkoutActive: true,
    plans: [{ id: 'pro', label: 'Pro' }, { id: 'ultra', label: 'Ultra' }],
    premium: {
      checkoutActive: true,
      plans: [{ id: 'ultimate', label: 'Ultimate', checkoutActive: true }],
      account: { ultimateOwned: false }
    }
  };
  const html = renderEonPremiumTierPreview({ status: active });
  assert.match(html, /data-checkout-active="true"/);
  assert.match(html, /data-premium-billing-tier="pro"[^>]*>Review change to Pro/);
  assert.match(html, /data-premium-billing-tier="ultra"[^>]*>Review change to Ultra/);
  assert.match(html, /data-premium-billing-tier="ultimate"[^>]*>Buy Ultimate software/);
  assert.match(html, /Browser redirects never grant access/);
});

test('premium tier surface disables current recurring tier and verified Ultimate ownership', () => {
  const owned = {
    ok: true,
    subscriptionActionsActive: true,
    account: { signedIn: true, trialEligible: false, billing: { tierId: 'pro' } },
    checkoutActive: true,
    plans: [{ id: 'pro', label: 'Pro' }, { id: 'ultra', label: 'Ultra' }],
    premium: {
      checkoutActive: true,
      plans: [{ id: 'ultimate', label: 'Ultimate', checkoutActive: true }],
      account: { ultimateOwned: true }
    }
  };
  const html = renderEonPremiumTierPreview({ status: owned });
  assert.match(html, /data-premium-billing-tier="pro" disabled aria-disabled="true">Current plan/);
  assert.match(html, /data-premium-billing-tier="ultimate" disabled aria-disabled="true">Ultimate owned/);
  assert.match(html, /data-premium-billing-tier="ultra"[^>]*>Review change to Ultra/);
});
