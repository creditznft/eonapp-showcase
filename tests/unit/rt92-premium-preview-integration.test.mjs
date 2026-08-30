import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('professional capability status stays on canonical surfaces while plan surfaces use the unified catalogue', () => {
  const expectations = [
    ['assets/js/projects/eon-projects-page.js', "renderEonPremiumCapabilityPreview('projects'"],
    ['assets/js/eon-workspace-pages.js', "renderEonPremiumCapabilityPreview('workspace'"],
    ['assets/js/local-ai/local-ai-page.js', "renderEonPremiumCapabilityPreview('local-ai'"],
    ['assets/js/eon-automations-page.js', "renderEonPremiumCapabilityPreview('automations'"],
    ['assets/js/forge/eon-forge-quick-build.js', "renderEonPremiumCapabilityPreview('forge'"],
    ['assets/js/work-surface/adapters/eon-plans-panel.js', 'EON_PURCHASABLE_PLANS'],
    ['assets/js/commerce/billing-commercial-status.js', 'EON_PURCHASABLE_PLANS']
  ];
  for (const [path, marker] of expectations) assert.match(read(path), new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${path} missing professional capability status`);
});

test('capability surfaces expose no direct checkout control while Billing owns premium actions', async () => {
  const renderer = read('assets/js/capabilities/eon-premium-preview-surface.js');
  assert.match(renderer, /data-checkout-active="server-status-required"/);
  assert.match(renderer, /eon:capability-snapshot-changed/);
  assert.match(renderer, /getCurrentCapabilitySnapshot/);
  const mod = await import('../../assets/js/capabilities/eon-premium-preview-surface.js');
  const rendered = [
    mod.renderEonPremiumTierPreview({ context: 'billing' }),
    mod.renderEonPremiumCapabilityPreview('forge', { compact: true }),
    mod.renderEonPremiumCapabilityPreview('local-ai')
  ].join('\n');
  assert.doesNotMatch(rendered, /data-billing-tier=|data-plan-checkout=|\/api\/billing\/checkout|checkoutHref=/);
  const billing = read('assets/js/commerce/billing-commercial-status.js');
  assert.doesNotMatch(billing, /DODO_PRODUCT_PRO|DODO_PRODUCT_ULTRA|DODO_PRODUCT_ULTIMATE/);
});

test('billing and Forge reuse existing styles instead of a new premium app shell', () => {
  assert.match(read('billing.html'), /assets\/css\/eon-feature-locks\.css/);
  assert.match(read('forge.html'), /assets\/css\/eon-feature-locks\.css/);
  assert.match(read('billing.html'), /id="eon-billing-plans"/);
  assert.doesNotMatch(read('billing.html'), /id="eon-premium-preview"/);
});

test('RT92 current capability grounding routes Billing to the live seven-product commercial authority rather than historical W348 planning truth', async () => {
  const { getCapabilityTruth, getCapabilityTruthForRoute } = await import('../../assets/js/capabilities/capability-truth-registry.js');
  const billing = getCapabilityTruthForRoute('/billing');
  assert.equal(billing?.id, 'rt92-billing-commercial');
  assert.equal(billing?.lifecycle, 'active-connected');
  assert.match(billing?.truthfulUserFacingNote || '', /Plus, Studio, Power, Max, Pro and Ultra/);
  assert.match(billing?.truthfulUserFacingNote || '', /Ultimate one-time software purchase/);
  assert.match(billing?.truthfulUserFacingNote || '', /Dodo Payments/);
  assert.deepEqual(getCapabilityTruth('eon-offer-catalog')?.routes, []);
  assert.equal(getCapabilityTruth('eon-offer-catalog')?.lifecycle, 'planned');
});
