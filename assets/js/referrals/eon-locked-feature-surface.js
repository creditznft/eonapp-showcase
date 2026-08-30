/**
 * W616D — real-surface locked feature cards.
 *
 * This module connects the W616C resolver to actual premium/limit UI
 * surfaces. Paid-plan and trial choices route to the canonical Billing page, while
 * verified referral/Sponsor grants are reflected only through the signed capability snapshot. No
 * browser-only entitlement grant or platform-hosted generation obligation is created.
 */

import {
  getLockedFeature,
  resolveLockedFeature,
  validateLockedFeatureResolver
} from './eon-feature-unlock-resolver.js';
import { getCurrentCapabilitySnapshot } from '../capabilities/eon-capability-service.js';

export const EON_LOCKED_FEATURE_SURFACE_SCHEMA = 'eonapp.referrals.locked-feature-surface.v1';
export const EON_LOCKED_FEATURE_SURFACE_VERSION = 1;

const FORBIDDEN_VALUE_PATTERN = new RegExp([
  'cash' + 'back',
  'wallet bal' + 'ance',
  'crypto pay' + 'out',
  'free mo' + 'nth',
  'renewal disc' + 'ount',
  'paid AI cred' + 'it',
  'loot' + 'box',
  'jack' + 'pot',
  'sp' + 'in'
].join('|'), 'i');

const freezeSurface = (surface) => Object.freeze({
  commercialActive: true,
  checkoutActive: true,
  referralGrantsActive: true,
  keyRedemptionActive: false,
  liveGrantActive: true,
  browserUnlockAllowed: false,
  platformPaidAiCost: false,
  ...surface,
  featureIds: Object.freeze([...(surface.featureIds || [])])
});

export const EON_LOCKED_FEATURE_SURFACES = Object.freeze([
  freezeSurface({
    id: 'projects',
    route: '/projects',
    label: 'Projects',
    title: 'Project limit upgrades stay transparent',
    summary: 'Free projects stay local. When a user reaches a project or template limit, this surface shows paid-plan/trial paths plus server-authoritative EONKEY and Sponsor-key alternatives.',
    featureIds: ['project-slots-plus', 'premium-template-library']
  }),
  freezeSurface({
    id: 'workspace',
    route: '/workspace',
    label: 'Workspace',
    title: 'Workspace premium paths',
    summary: 'Creator, export, workflow and showcase upgrades are explained inside the real Workspace instead of hiding them on a separate reward page.',
    featureIds: ['studio-workflow-systems', 'creator-preset-packs', 'premium-export-kits', 'private-showcase-slots']
  }),
  freezeSurface({
    id: 'local-ai',
    route: '/local-ai',
    label: 'Local AI',
    title: 'Local AI workflow unlocks do not sell AI-credit products',
    summary: 'Advanced local and own-key workflow packs are EONAPP capability unlocks only. Generation still uses the user’s own local runtime or provider/API key.',
    featureIds: ['local-ai-guided-workflows', 'advanced-local-ai-bundles', 'advanced-own-key-bundles']
  }),
  freezeSurface({
    id: 'automations',
    route: '/automations',
    label: 'Automations',
    title: 'Power automation packs',
    summary: 'Automation upgrades remain draft/simulation capability until future verified provider connections exist. No background job, spend, publish or account action starts here.',
    featureIds: ['power-automation-packs', 'studio-workflow-systems']
  }),
  freezeSurface({
    id: 'vault',
    route: '/vault',
    label: 'Vault',
    title: 'Vault and City cosmetic unlocks are separate from recovery',
    summary: 'Premium Vault Reveals, City skins and Builder Circle identity must never be confused with backup, payment receipts, ownership, recovery secrets or AI-credit products.',
    featureIds: ['max-city-and-vault-skins', 'private-showcase-slots']
  })
]);

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

export function getLockedFeatureSurface(surfaceId = '') {
  const id = String(surfaceId || '').trim().toLowerCase();
  return EON_LOCKED_FEATURE_SURFACES.find((surface) => surface.id === id) || null;
}

export function getLockedFeatureSurfaces() {
  return EON_LOCKED_FEATURE_SURFACES;
}

function renderSurfaceAction(action, labelFallback = 'Unavailable') {
  const label = action?.label || labelFallback;
  const type = action?.type || 'unknown';
  if (action?.enabled === true && action?.href) return `<a class="eon-feature-lock-action" data-eon-lock-action="${escapeHtml(type)}" href="${escapeHtml(action.href)}">${escapeHtml(label)}</a>`;
  return `<button type="button" class="eon-feature-lock-action" data-eon-lock-action="${escapeHtml(type)}" disabled aria-disabled="true">${escapeHtml(label)}</button>`;
}

function renderFeatureDecisionCard(featureId = '', options = {}) {
  const resolution = resolveLockedFeature(featureId, {
    keyInventory: options.keyInventory || {},
    checkoutActive: options.checkoutActive !== false,
    referralGrantsActive: options.referralGrantsActive !== false,
    keyRedemptionActive: options.keyRedemptionActive === true,
    capabilitySnapshot: options.capabilitySnapshot || getCurrentCapabilitySnapshot()
  });
  if (!resolution.ok) {
    return `<article class="eon-feature-lock-card" data-eon-lock-feature="${escapeHtml(featureId)}" data-eon-lock-state="unknown"><h3>Unknown premium gate</h3><p>This feature gate is not in the locked-feature resolver.</p></article>`;
  }
  const { feature, requiredTier, actions, copy } = resolution;
  if (resolution.accessActive) {
    return `<article class="eon-feature-lock-card is-available" data-eon-lock-feature="${escapeHtml(feature.id)}" data-eon-lock-state="available"><p class="eon-feature-lock-kicker">Available · verified capability</p><h3>${escapeHtml(feature.label)}</h3><p>${escapeHtml(feature.userBenefit)}</p><p class="eon-feature-lock-copy">Available through your ${escapeHtml(resolution.accessSource === 'eonkey-unlock' ? 'active EONKEY unlock' : `${resolution.capabilityTierId} plan`)}.</p></article>`;
  }
  const subscribe = (actions.subscribe || []).slice(0, 1).map((action) => renderSurfaceAction(action, 'Review plan')).join('');
  const trial = (actions.trial || []).slice(0, 1).map((action) => renderSurfaceAction(action, 'Review trial')).join('');
  const useKey = (actions.useKey || []).slice(0, 2).map((action) => renderSurfaceAction(action, 'Use key unavailable')).join('');
  const keyLabels = (actions.useKey || []).slice(0, 2).map((action) => `${action.inventory || 0} ${action.keyType}`).join(' · ') || '0 keys';
  return `<article class="eon-feature-lock-card" data-eon-lock-feature="${escapeHtml(feature.id)}" data-required-tier="${escapeHtml(requiredTier?.id || '')}" data-checkout-active="true" data-live-grant-active="true" data-browser-unlock-allowed="false">
    <p class="eon-feature-lock-kicker">Locked · ${escapeHtml(requiredTier?.label || 'Premium')}</p>
    <h3>${escapeHtml(feature.label)}</h3>
    <p>${escapeHtml(feature.userBenefit)}</p>
    <p class="eon-feature-lock-copy">${escapeHtml(copy.primary)}</p>
    ${copy.ai ? `<p class="eon-feature-lock-muted">${escapeHtml(copy.ai)}</p>` : ''}
    <div class="eon-feature-lock-actions">${subscribe}${trial}${useKey}<a class="eon-feature-lock-action" data-eon-lock-action="keys" href="/eon-keys">Referral EONKEYS</a><a class="eon-feature-lock-action" data-eon-lock-action="sponsor" href="/rewards">Sponsor Keys</a></div>
    <p class="eon-feature-lock-muted">Current referral-key inventory hint: ${escapeHtml(keyLabels)}. Paid plans use Billing; verified referral and Sponsor unlocks are reflected only through the signed server capability snapshot. No browser-only entitlement grant is accepted.</p>
  </article>`;
}

export function renderLockedFeatureSurface(surfaceId = '', options = {}) {
  const surface = getLockedFeatureSurface(surfaceId);
  if (!surface) return '';
  const cards = surface.featureIds.map((featureId) => renderFeatureDecisionCard(featureId, options)).join('');
  return `<section class="eon-feature-lock-surface${options.compact ? ' is-compact' : ''}" data-eon-premium-surface="${escapeHtml(surface.id)}" data-commercial-active="true" data-checkout-active="true" data-live-grant-active="true" data-browser-unlock-allowed="false" aria-labelledby="eon-feature-lock-${escapeHtml(surface.id)}-title">
    <div class="eon-feature-lock-head"><p class="eon-feature-lock-kicker">W616D · ${escapeHtml(surface.label)} premium boundary</p><h2 id="eon-feature-lock-${escapeHtml(surface.id)}-title">${escapeHtml(surface.title)}</h2><p>${escapeHtml(surface.summary)}</p></div>
    <div class="eon-feature-lock-grid">${cards}</div>
    <p class="eon-feature-lock-muted"><strong>Current boundary:</strong> Billing, verified referral EONKEY unlocks and rewarded Sponsor-key sessions are server authoritative. This surface only reflects the signed capability snapshot; browser-only entitlement overrides and platform-paid AI generation remain prohibited.</p>
  </section>`;
}

export function refreshLockedFeatureSurfaces(root = globalThis.document) {
  if (!root?.querySelectorAll) return 0;
  const snapshot = getCurrentCapabilitySnapshot();
  let refreshed = 0;
  for (const node of root.querySelectorAll('[data-eon-premium-surface]')) {
    const surfaceId = String(node.getAttribute('data-eon-premium-surface') || '').trim();
    if (!surfaceId) continue;
    const compact = node.getAttribute('data-eon-premium-compact') === 'true';
    const wrapper = globalThis.document?.createElement?.('div');
    if (!wrapper) continue;
    wrapper.innerHTML = renderLockedFeatureSurface(surfaceId, { compact, capabilitySnapshot: snapshot });
    const replacement = wrapper.firstElementChild;
    if (!replacement) continue;
    node.replaceWith(replacement);
    refreshed += 1;
  }
  return refreshed;
}

let capabilityRefreshBound = false;
export function bindLockedFeatureCapabilityRefresh(root = globalThis.document) {
  if (capabilityRefreshBound || !root?.addEventListener) return false;
  capabilityRefreshBound = true;
  root.addEventListener('eon:capability-snapshot-changed', () => { refreshLockedFeatureSurfaces(root); });
  return true;
}

if (globalThis.document) bindLockedFeatureCapabilityRefresh(globalThis.document);

export function validateLockedFeatureSurfaces() {
  const errors = [];
  const resolver = validateLockedFeatureResolver();
  if (!resolver.ok) errors.push(...resolver.errors.map((error) => `Resolver: ${error}`));
  if (EON_LOCKED_FEATURE_SURFACES.length < 5) errors.push('At least five real surfaces must be wired.');
  const requiredSurfaces = ['projects', 'workspace', 'local-ai', 'automations', 'vault'];
  for (const surfaceId of requiredSurfaces) if (!getLockedFeatureSurface(surfaceId)) errors.push(`Missing ${surfaceId} locked-feature surface.`);
  for (const surface of EON_LOCKED_FEATURE_SURFACES) {
    if (surface.commercialActive !== true || surface.checkoutActive !== true) errors.push(`${surface.id} must expose canonical Billing paths.`);
    if (surface.referralGrantsActive !== true || surface.keyRedemptionActive !== false || surface.liveGrantActive !== true || surface.browserUnlockAllowed !== false) errors.push(`${surface.id} must reflect verified server grants without allowing browser grants.`);
    if (!surface.featureIds.length) errors.push(`${surface.id} has no feature ids.`);
    for (const featureId of surface.featureIds) {
      const feature = getLockedFeature(featureId);
      if (!feature) errors.push(`${surface.id} references unknown feature ${featureId}.`);
      const resolution = resolveLockedFeature(featureId, { keyInventory: { signal: 1, builder: 1, power: 1 }, checkoutActive: true, referralGrantsActive: true, keyRedemptionActive: false, capabilitySnapshot: getCurrentCapabilitySnapshot() });
      if (!resolution.ok) errors.push(`${surface.id}/${featureId} did not resolve.`);
      if (resolution.checkoutActive !== true || resolution.commercialActive !== true) errors.push(`${surface.id}/${featureId} did not expose canonical Billing paths.`);
      if (resolution.keyRedemptionActive !== false) errors.push(`${surface.id}/${featureId} enabled browser-side key redemption.`);
      if (feature?.platformPaidAiCost !== false || resolution.aiBoundary?.platformPaidHostedGeneration !== false) errors.push(`${surface.id}/${featureId} implies platform-paid AI cost.`);
    }
    const html = renderLockedFeatureSurface(surface.id, { keyInventory: { signal: 1, builder: 1, power: 1 } });
    if (!/data-checkout-active="true"/.test(html) || !/data-live-grant-active="true"/.test(html) || !/data-browser-unlock-allowed="false"/.test(html)) errors.push(`${surface.id} render missing billing/key boundary markers.`);
    if (FORBIDDEN_VALUE_PATTERN.test(html)) errors.push(`${surface.id} contains forbidden value language.`);
  }
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), schema: EON_LOCKED_FEATURE_SURFACE_SCHEMA, version: EON_LOCKED_FEATURE_SURFACE_VERSION, surfaceCount: EON_LOCKED_FEATURE_SURFACES.length });
}

export default Object.freeze({
  EON_LOCKED_FEATURE_SURFACE_SCHEMA,
  EON_LOCKED_FEATURE_SURFACE_VERSION,
  EON_LOCKED_FEATURE_SURFACES,
  getLockedFeatureSurface,
  getLockedFeatureSurfaces,
  renderLockedFeatureSurface,
  refreshLockedFeatureSurfaces,
  bindLockedFeatureCapabilityRefresh,
  validateLockedFeatureSurfaces
});
