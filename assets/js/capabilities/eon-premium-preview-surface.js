/**
 * RT92 professional capability renderer.
 *
 * Reuses the existing capability registry and access-state resolver to make
 * Pro/Ultra/Ultimate value visible inside canonical EONAPP surfaces.
 * It does not create checkout actions, write entitlements, or imply hosted
 * capacity. Feature surfaces never create checkout themselves; the verified
 * Billing surface owns purchase controls and server-side entitlement truth.
 */
import {
  EON_PREMIUM_SOFTWARE_TIERS,
  getEonPremiumCapability,
  getEonPremiumSoftwareTier
} from './eon-premium-capability-registry.js';
import { buildEonPremiumPreviewModel, EON_PREMIUM_LIVE_COMMERCIAL_AVAILABILITY } from './eon-premium-preview-model.js';
import { getCurrentCapabilitySnapshot } from './eon-capability-service.js';

export const EON_PREMIUM_PREVIEW_SURFACE_SCHEMA = 'eonapp.premium-preview-surface.rt92.v2';
const freeze = Object.freeze;

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function tierPrice(tier = {}) {
  if (tier.id === 'ultimate') return '$1,299 one time';
  return `$${Number(tier.targetMonthlyUsd || 0).toFixed(0)}/month`;
}

function tierPromise(tierId = '') {
  if (tierId === 'pro') return 'Professional automation, recurring work, advanced intelligence, AI control and Forge operations.';
  if (tierId === 'ultra') return 'Scaled parallel work, multi-client operation, batch capacity and larger professional workloads.';
  if (tierId === 'ultimate') return 'Permanent premium software capability. Hosted AI, storage, scheduling and cloud compute remain separately governed.';
  return '';
}

function capabilityCopy(card = {}) {
  const capability = card.capability || {};
  const label = String(card.label || capability.label || 'Premium capability');
  const lower = label.toLowerCase();
  if (lower.includes('business intelligence')) return 'Turn existing project context into repeatable executive briefs and recurring business intelligence without creating a second Business dashboard.';
  if (lower.includes('opportunity monitor')) return 'Review opportunities from approved connected sources on a recurring schedule once the durable runtime and source connectors are certified.';
  if (lower.includes('project orchestration')) return 'Coordinate richer project work through the existing Projects and Workspace systems instead of a separate professional project engine.';
  if (lower.includes('client workspace')) return 'Group existing projects by client with project-scoped context and memory separation; Projects remain the canonical source of truth.';
  if (lower.includes('multi-client')) return 'See and coordinate work across multiple client project groups through the same Workspace Work Queue.';
  if (lower.includes('parallel eonbot')) return 'Run multiple bounded EONBOT jobs concurrently once server capacity and durable execution are independently certified.';
  if (lower.includes('autopilot')) return 'Use device-aware Local AI recommendations, health checks and routing guidance while local runtimes remain broadly accessible.';
  if (lower.includes('project-specific ai')) return 'Attach reusable AI routing profiles to existing projects without copying project context into a new system.';
  if (lower.includes('multi-model')) return 'Coordinate approved local, BYOK and hosted routes with explicit fallback and workload budgets.';
  if (lower.includes('batch ai')) return 'Process larger bounded batches through the existing AI and Work Queue layers with concurrency and hosted-budget protection.';
  if (lower.includes('repository intelligence')) return 'Analyze existing Forge/GitHub project state and produce reviewable repository intelligence without creating Forge v2.';
  if (lower.includes('test and release')) return 'Coordinate existing Forge checks, CI evidence and reviewed release steps through the current GitHub lane.';
  if (lower.includes('parallel forge')) return 'Coordinate multiple bounded Forge work items through the shared Work Queue once durable execution is certified.';
  if (lower.includes('recurring professional')) return 'Turn approved local workflow blueprints into scheduled professional work once the durable server runtime is certified.';
  if (lower.includes('work queue')) return 'See current, waiting, scheduled, completed and failed work through the existing Workspace. Basic visibility stays universal.';
  return 'An advanced EONAPP capability delivered through the existing canonical surface rather than a duplicate dashboard.';
}

function tierEligibility(card = {}) {
  const required = String(card.requiredTier || '').toLowerCase();
  if (!required) return 'Included';
  const tier = getEonPremiumSoftwareTier(required);
  const ultimate = getEonPremiumCapability(card.id)?.ultimateEligible === true;
  return `${tier?.label || required}${ultimate ? ' · also eligible for Ultimate software access' : ''}`;
}

export function renderEonPremiumCapabilityPreview(surface = '', options = {}) {
  let snapshot = options.capabilitySnapshot || null;
  if (!snapshot) {
    try { snapshot = getCurrentCapabilitySnapshot(); } catch { snapshot = null; }
  }
  const cards = buildEonPremiumPreviewModel({
    surface,
    subscriptionTierId: options.subscriptionTierId || snapshot?.tierId || 'free',
    perpetualLicenses: options.perpetualLicenses || snapshot?.perpetualLicenses || [],
    commercialAvailability: options.commercialAvailability || EON_PREMIUM_LIVE_COMMERCIAL_AVAILABILITY,
    usageByCapability: options.usageByCapability || {},
    limitByCapability: options.limitByCapability || {}
  }).filter((card) => card.requiredTier || card.softwareAccess || card.id === 'work-queue-overview');
  if (!cards.length) return '';
  const compact = options.compact === true;
  return `<section class="eon-feature-lock-surface eon-premium-preview-surface${compact ? ' is-compact' : ''}" data-eon-premium-preview-surface="${escapeHtml(surface)}" data-eon-premium-compact="${compact ? 'true' : 'false'}" data-commercial-status="billing-authority" data-checkout-active="server-status-required" data-browser-unlock-allowed="false" aria-label="EONAPP professional capabilities">
    <div class="eon-feature-lock-head">
      <p class="eon-feature-lock-kicker">Professional capabilities</p>
      <h2>Professional capability on this EONAPP surface.</h2>
      <p>These capabilities extend this existing surface. Purchase and plan changes happen only through verified Billing; this feature panel never grants a tier, software licence or hosted compute.</p>
    </div>
    <div class="eon-feature-lock-grid">${cards.map((card) => `<article class="eon-feature-lock-card" data-eon-premium-capability="${escapeHtml(card.id)}" data-eon-premium-state="${escapeHtml(card.state)}" data-required-tier="${escapeHtml(card.requiredTier)}">
      <p class="eon-feature-lock-kicker">${escapeHtml(card.state)} · ${escapeHtml(tierEligibility(card))}</p>
      <h3>${escapeHtml(card.label)}</h3>
      <p>${escapeHtml(capabilityCopy(card))}</p>
      <p class="eon-feature-lock-muted">Capability and hosted capacity are separate. ${card.tryOnceEligible ? 'Temporary access is available only when the server reward catalogue explicitly offers this capability; otherwise the paid entitlement is required.' : 'No browser-only entitlement is created here.'}</p>
      <div class="eon-feature-lock-actions">${card.softwareAccess ? '<span class="eon-feature-lock-action is-current" aria-label="Available with current verified access">Available with current access</span>' : '<a class="eon-feature-lock-action" href="/billing#billing-plans-title">Review plans & purchase</a>'}</div>
    </article>`).join('')}</div>
    <p class="eon-feature-lock-muted"><strong>Checkout authority:</strong> Billing verifies the live environment, product IDs and server grant schema before enabling any purchase action.</p>
  </section>`;
}

function runtimePlan(status = {}, tierId = '') {
  const id = String(tierId || '').toLowerCase();
  const plans = id === 'ultimate' ? status?.premium?.plans : status?.plans;
  return (Array.isArray(plans) ? plans : []).find((plan) => String(plan?.id || '').toLowerCase() === id) || null;
}

function premiumTierAction(tier = {}, status = {}) {
  const premium = status?.premium || {};
  const account = status?.account || {};
  const currentTier = String(account?.billing?.tierId || account?.entitlement?.tier_id || '').toLowerCase();
  const signedIn = account.signedIn === true;
  const checkoutActive = tier.id === 'ultimate'
    ? premium.checkoutActive === true && runtimePlan(status, tier.id)?.checkoutActive === true
    : status?.checkoutActive === true && Boolean(runtimePlan(status, tier.id));
  const ultimateOwned = premium?.account?.ultimateOwned === true;
  const hasRecurringPaid = Boolean(currentTier && currentTier !== 'free');
  if (status?.ok === false) return freeze({ disabled: true, label: 'Billing unavailable', state: 'unavailable' });
  if (tier.id === 'ultimate' && ultimateOwned) return freeze({ disabled: true, label: 'Ultimate owned', state: 'owned' });
  if (tier.id !== 'ultimate' && currentTier === tier.id) return freeze({ disabled: true, label: 'Current plan', state: 'current' });
  if (!checkoutActive) return freeze({ disabled: true, label: 'Checkout unavailable', state: 'blocked' });
  if (!signedIn) return freeze({ disabled: false, label: `Sign in for ${tier.label}`, state: 'signin' });
  if (tier.id !== 'ultimate' && hasRecurringPaid) {
    const actionsReady = status?.subscriptionActionsActive === true;
    return freeze({ disabled: !actionsReady, label: actionsReady ? `Review change to ${tier.label}` : 'Plan changes unavailable', state: actionsReady ? 'change-plan' : 'blocked' });
  }
  if (tier.id === 'ultimate') return freeze({ disabled: false, label: 'Buy Ultimate software', state: 'checkout' });
  const trialEligible = account?.trialEligible !== false;
  return freeze({ disabled: false, label: trialEligible ? `Start 7-day ${tier.label} trial` : `Subscribe to ${tier.label}`, state: 'checkout' });
}

export function refreshEonPremiumCapabilitySurfaces(root = globalThis.document) {
  if (!root?.querySelectorAll) return 0;
  let refreshed = 0;
  for (const node of root.querySelectorAll('[data-eon-premium-preview-surface]')) {
    const surface = String(node.dataset?.eonPremiumPreviewSurface || '').trim();
    if (!surface) continue;
    const compact = node.dataset?.eonPremiumCompact === 'true';
    const holder = globalThis.document?.createElement?.('div');
    if (!holder) continue;
    holder.innerHTML = renderEonPremiumCapabilityPreview(surface, { compact });
    const replacement = holder.firstElementChild;
    if (!replacement) continue;
    node.replaceWith(replacement);
    refreshed += 1;
  }
  return refreshed;
}

let premiumCapabilityRefreshBound = false;
export function bindEonPremiumCapabilityRefresh(root = globalThis.document) {
  if (premiumCapabilityRefreshBound || !root?.addEventListener) return false;
  root.addEventListener('eon:capability-snapshot-changed', () => { refreshEonPremiumCapabilitySurfaces(root); });
  premiumCapabilityRefreshBound = true;
  return true;
}

if (typeof document !== 'undefined') bindEonPremiumCapabilityRefresh(document);

export function renderEonPremiumTierPreview({ compact = false, context = 'billing', status = {} } = {}) {
  const premium = status?.premium || {};
  const checkoutActive = premium.checkoutActive === true;
  const activeCopy = checkoutActive
    ? 'Billing is server-ready for this environment. Access still changes only after signed Dodo webhook reconciliation.'
    : 'The seven-product catalogue is live, but this surface has not yet received current server billing readiness. Open Plans & Billing to verify checkout availability.';
  return `<section class="eon-premium-tier-preview${compact ? ' is-compact' : ''}" data-eon-premium-tier-preview="${escapeHtml(context)}" data-checkout-active="${checkoutActive ? 'true' : 'false'}" data-commercial-status="${checkoutActive ? 'server-certified' : 'server-readiness-unverified'}" data-browser-unlock-allowed="false">
    <div class="eon-feature-lock-head"><p class="eon-feature-lock-kicker">Professional plans</p><h2>Pro, Ultra and Ultimate</h2><p>${escapeHtml(activeCopy)}</p></div>
    <div class="eon-premium-tier-grid">${EON_PREMIUM_SOFTWARE_TIERS.map((tier) => {
      const action = premiumTierAction(tier, status);
      const badge = action.state === 'current' ? ' · CURRENT' : action.state === 'owned' ? ' · OWNED' : checkoutActive ? '' : ' · VERIFY BILLING';
      return `<article class="eon-premium-tier-card${action.state === 'current' || action.state === 'owned' ? ' is-current' : ''}" data-eon-premium-tier="${escapeHtml(tier.id)}" data-premium-action-state="${escapeHtml(action.state)}">
      <p class="eon-feature-lock-kicker">${tier.id === 'ultimate' ? 'Permanent software' : 'Monthly subscription'}${badge}</p>
      <h3>${escapeHtml(tier.label)}</h3>
      <p class="eon-premium-tier-price">${escapeHtml(tierPrice(tier))}</p>
      <p>${escapeHtml(tierPromise(tier.id))}</p>
      <button type="button" data-premium-billing-tier="${escapeHtml(tier.id)}" ${action.disabled ? 'disabled aria-disabled="true"' : ''}>${escapeHtml(action.label)}</button>
      <div class="billing-plan-error" data-billing-plan-error="${escapeHtml(tier.id)}" role="status" aria-live="polite"></div>
    </article>`;
    }).join('')}</div>
    <p class="eon-feature-lock-muted">Ultimate unlocks eligible premium software permanently; it never includes unlimited EONAPP-funded AI or cloud capacity. Pro and Ultra remain the recurring capacity tiers. Browser redirects never grant access.</p>
  </section>`;
}

export function validateEonPremiumPreviewSurface() {
  const errors = [];
  const localAi = renderEonPremiumCapabilityPreview('local-ai');
  const forge = renderEonPremiumCapabilityPreview('forge');
  const tiers = renderEonPremiumTierPreview();
  for (const [label, html] of [['local-ai', localAi], ['forge', forge], ['tiers', tiers]]) {
    if (!html) errors.push(`${label} preview must render.`);
    if (/data-billing-tier=|data-plan-checkout=|checkoutHref=|\/api\/billing\/checkout/.test(html)) errors.push(`${label} preview must not expose checkout.`);
  }
  if (!/\$99\/month/.test(tiers) || !/\$199\/month/.test(tiers) || !/\$1,299 one time/.test(tiers)) errors.push('Premium tier preview prices drifted.');
  if (!/Ultimate software access/.test(localAi)) errors.push('Premium capability preview must explain Ultimate software eligibility.');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), schema: EON_PREMIUM_PREVIEW_SURFACE_SCHEMA });
}

export default freeze({
  EON_PREMIUM_PREVIEW_SURFACE_SCHEMA,
  renderEonPremiumCapabilityPreview,
  refreshEonPremiumCapabilitySurfaces,
  bindEonPremiumCapabilityRefresh,
  renderEonPremiumTierPreview,
  validateEonPremiumPreviewSurface
});
