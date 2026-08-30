import {
  EON_PAID_SUBSCRIPTION_PLANS,
  EON_PURCHASABLE_PLANS,
  EON_SUBSCRIPTION_TRIAL_DAYS,
  formatMonthlyPlanPrice
} from '../../commerce/eon-commercial-catalog.js';
import {
  createEonCityW659gCheckout,
  fetchEonCityW659gMembershipStatus
} from '../../contracts/city/w659g/eon-city-w659g-membership-console.js';
import { recordEonCoreOutcome } from '../../contracts/outcomes/eon-core-outcome-authority.js';

function escapeText(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function currentTier(status = {}) {
  return String(status.cityAccess?.tierId || status.account?.billing?.tierId || status.account?.entitlement?.tier_id || 'free').toLowerCase();
}

function unlockMarkup(access = {}) {
  const unlocks = Array.isArray(access.activeCityUnlocks) ? access.activeCityUnlocks : [];
  if (!unlocks.length) return '<p><strong>Active EONKEY unlocks:</strong> None. EONKEYS never create a subscription or provider credit.</p>';
  return `<div class="eon-plan-unlocks"><strong>Active EONKEY unlocks</strong><ul>${unlocks.map((unlock) => `<li>${escapeText(unlock.unlockId)} · ${escapeText(unlock.featureGroup || unlock.category)}</li>`).join('')}</ul><p>These are bounded feature/cosmetic unlocks only. They do not change the whole tier.</p></div>`;
}


function serverPlanFor(status = {}, plan = {}) {
  if (plan.billingType === 'one-time') {
    const premiumPlans = Array.isArray(status?.premium?.plans) ? status.premium.plans : [];
    return premiumPlans.find((entry) => entry?.id === plan.id) || null;
  }
  const serverPlans = Array.isArray(status.plans) ? status.plans : [];
  return serverPlans.find((entry) => entry?.id === plan.id) || null;
}

function validateServerCatalog(status = {}) {
  const errors = [];
  for (const plan of EON_PURCHASABLE_PLANS) {
    const server = serverPlanFor(status, plan);
    if (!server) { errors.push(`${plan.label} is missing from the server catalogue.`); continue; }
    if (plan.billingType === 'one-time') {
      if (Number(server.priceUsd) !== plan.oneTimeUsd || String(server.pricingType || '') !== 'one-time') errors.push(`${plan.label} does not match the server one-time catalogue.`);
    } else if (Number(server.monthlyUsd) !== plan.monthlyUsd || Number(server.trialDays) !== plan.trialDays) {
      errors.push(`${plan.label} does not match the server subscription catalogue.`);
    }
  }
  return { ok: errors.length === 0, errors };
}

function planCheckoutReady(status = {}, plan = {}) {
  if (plan.billingType === 'one-time') return status?.premium?.checkoutActive === true && serverPlanFor(status, plan)?.checkoutActive === true;
  return status.checkoutActive === true;
}

function planMarkup(plan, { tier, ultimateOwned, signedIn, checkoutReady, serverCatalogReady, trialEligible }) {
  const oneTime = plan.billingType === 'one-time';
  const current = !oneTime && tier === plan.id;
  const owned = oneTime && ultimateOwned;
  const hasRecurringPaidPlan = tier !== 'free';
  const canCheckout = signedIn && checkoutReady && serverCatalogReady && (oneTime ? !owned : !hasRecurringPaidPlan);
  const canManage = signedIn && !oneTime && hasRecurringPaidPlan && !current;
  let action = '';
  if (owned) action = `<button type="button" disabled>Ultimate owned</button>`;
  else if (current) action = `<button type="button" disabled>Current plan</button>`;
  else if (canManage) action = `<button type="button" data-plan-manage="${escapeText(plan.id)}">Review change on billing page</button>`;
  else {
    const label = !signedIn ? 'Sign in to continue' : oneTime ? 'Buy Ultimate software' : (trialEligible ? `Start ${EON_SUBSCRIPTION_TRIAL_DAYS}-day trial` : 'Subscribe');
    action = `<button type="button" data-plan-checkout="${escapeText(plan.id)}"${canCheckout ? '' : ' disabled'}>${label}</button>`;
  }
  const billingCopy = oneTime
    ? '<strong>One-time perpetual software purchase.</strong> Hosted AI/cloud capacity remains separately governed.'
    : (trialEligible ? `<strong>${EON_SUBSCRIPTION_TRIAL_DAYS}-day trial</strong> for an eligible new account, then the monthly price shown.` : '<strong>Trial already used.</strong> The monthly price shown applies immediately after provider confirmation.');
  const typeLabel = owned ? 'Owned software' : current ? 'Current plan' : oneTime ? 'One-time software' : plan.featured ? 'Popular fit' : 'Monthly plan';
  return `<article class="eon-work-card" data-featured="${plan.featured === true}" data-plan-id="${escapeText(plan.id)}"><small>${typeLabel}</small><h3>${escapeText(plan.label)}</h3><p class="eon-plan-price">${escapeText(formatMonthlyPlanPrice(plan))}</p><p>${escapeText(plan.summary)}</p><p>${billingCopy}</p><ul>${plan.highlights.slice(0, 3).map((item) => `<li>${escapeText(item)}</li>`).join('')}</ul>${action}</article>`;
}

export async function mountEonWorkSurface({ root, environment, invocation }) {
  root.innerHTML = `<section class="eon-work-panel"><header class="eon-work-panel-intro"><div><p class="eon-work-panel-kicker">Plans & access · server verified</p><h2>Choose the EONAPP power that fits your work</h2><p>City may explain useful plan benefits, but access changes only after signed server billing events. No 3D object, browser return or local button can grant a tier.</p></div><div class="eon-work-panel-actions"><a href="/billing">Open full billing page</a><a href="/rewards?surface=workspace" data-eon-city-sponsor-terminal>Open Reward Center</a></div></header><div class="eon-plan-state" data-plan-state role="status" aria-live="polite">Checking current server access…</div><div class="eon-plan-grid" data-plan-grid></div><details class="eon-work-details"><summary>Payment and AI execution boundaries</summary><div>Checkout opens only on Dodo Payments after a reviewed, explicit user action. EON City never receives card details. Subscriptions unlock EONAPP product capability; image, video and other AI execution still uses a local runtime or the user’s own external provider/API key where stated.</div></details></section>`;
  const stateNode = root.querySelector('[data-plan-state]');
  const grid = root.querySelector('[data-plan-grid]');
  const status = await fetchEonCityW659gMembershipStatus(environment);
  const verified = status.ok === true;
  const accessVerified = status.capabilityVerified === true && status.cityAccess?.serverAuthoritative === true;
  const tier = verified ? currentTier(status) : 'free';
  const signedIn = verified && status.account?.signedIn === true;
  const serverCatalog = verified ? validateServerCatalog(status) : { ok: false, errors: ['Server billing status could not be verified.'] };
  const checkoutActive = verified && accessVerified && status.checkoutActive === true && serverCatalog.ok;
  const ultimateOwned = verified && status?.premium?.account?.ultimateOwned === true;
  const trialEligible = verified && status.account?.trialEligible !== false;
  const activeLabel = tier === 'free' ? 'Free' : EON_PAID_SUBSCRIPTION_PLANS.find((plan) => plan.id === tier)?.label || tier;

  if (!verified) {
    stateNode.innerHTML = '<strong>Server access could not be verified.</strong><p>Plan comparison is visible, but checkout and account claims remain disabled. No access changed.</p>';
  } else if (!signedIn) {
    stateNode.innerHTML = `<strong>Sign in to review account access or start checkout.</strong><p>Plan comparison remains public. Sign-in attaches a hosted checkout to the correct server account; it does not start a purchase.</p><a href="/api/auth/google/start?returnTo=${encodeURIComponent('/eoncity?station=plans')}">Sign in with Google</a>`;
  } else {
    const detail = serverCatalog.ok
      ? (checkoutActive || tier !== 'free' ? 'Server catalogue verified. Paid access changes remain provider-controlled.' : 'Plan comparison is available, but new checkout is not active in this deployment.')
      : 'Checkout is disabled because the server catalogue does not match the maintained public catalogue.';
    stateNode.innerHTML = `<strong>Current server access: ${escapeText(activeLabel)}</strong><p>${escapeText(detail)}</p>${unlockMarkup(status.cityAccess)}<p><strong>Downgrade/revocation safety:</strong> expired or revoked access falls back to Free capabilities without deleting local work.</p>`;
  }

  if (verified && accessVerified) {
    const reviewButton = environment.document?.createElement?.('button') || root.ownerDocument?.createElement?.('button');
    if (reviewButton) {
      reviewButton.type = 'button';
      reviewButton.dataset.planAccessReview = 'true';
      reviewButton.textContent = 'Record this access review';
      reviewButton.addEventListener('click', () => {
        const result = recordEonCoreOutcome({
          kind: 'plans-access-reviewed',
          route: '/eoncity',
          source: 'city-server-access-review',
          receiptId: `plans-access-reviewed:${Date.now()}`,
          verified: true
        }, { storage: environment.localStorage, environment });
        if (result.ok) {
          reviewButton.disabled = true;
          reviewButton.textContent = 'Access review recorded';
          const note = root.ownerDocument?.createElement?.('p');
          if (note) {
            note.textContent = 'Mission proof records only that you explicitly reviewed server-verified access. It does not start checkout, change a tier, or grant payment-linked XP.';
            reviewButton.insertAdjacentElement?.('afterend', note);
          }
        }
      });
      stateNode.append(reviewButton);
    }
  }

  grid.innerHTML = EON_PURCHASABLE_PLANS.map((plan) => planMarkup(plan, { tier, ultimateOwned, signedIn, checkoutReady: verified && accessVerified && planCheckoutReady(status, plan), serverCatalogReady: serverCatalog.ok, trialEligible })).join('');
  grid.querySelectorAll('[data-plan-manage]').forEach((button) => button.addEventListener('click', () => environment.location.assign('/billing')));
  grid.querySelectorAll('[data-plan-checkout]').forEach((button) => button.addEventListener('click', async () => {
    const plan = EON_PURCHASABLE_PLANS.find((entry) => entry.id === button.dataset.planCheckout);
    if (!plan || !verified || !accessVerified || !serverCatalog.ok || !planCheckoutReady(status, plan)) return;
    if (plan.billingType !== 'one-time' && tier !== 'free') return;
    if (plan.id === 'ultimate' && ultimateOwned) return;
    const confirmed = typeof environment.confirm === 'function'
      ? environment.confirm(plan.billingType === 'one-time'
        ? `Continue to Dodo Payments for the ${plan.label} $${Number(plan.oneTimeUsd).toLocaleString('en-US')} one-time software purchase? No software grant changes until the signed provider webhook is verified.`
        : `Continue to Dodo Payments for ${trialEligible ? `the ${plan.label} ${EON_SUBSCRIPTION_TRIAL_DAYS}-day trial` : `a ${plan.label} subscription without another trial`}? No access changes until the signed provider webhook is verified.`)
      : false;
    if (!confirmed) {
      stateNode.textContent = 'Checkout was not opened. No access changed.';
      return;
    }
    button.disabled = true;
    stateNode.textContent = `Preparing secure ${plan.label} checkout…`;
    const result = await createEonCityW659gCheckout(plan.id, { explicitUserAction: true, environment });
    if (!result.ok || !result.checkoutUrl) {
      stateNode.textContent = `Checkout was not opened: ${result.error || result.status || 'server unavailable'}. No access changed.`;
      button.disabled = false;
      return;
    }
    stateNode.textContent = 'Opening Dodo hosted checkout. Access changes only after the signed provider webhook updates the server ledger.';
    environment.location.assign(result.checkoutUrl);
  }));
  if (invocation.source === 'eoncity') {
    root.dataset.eonCityPlanPromotion = 'contextual-not-advertising';
    root.dataset.eonCitySponsorTerminal = 'explicit-navigation-only';
  }
  return { dispose() {} };
}

export default mountEonWorkSurface;
