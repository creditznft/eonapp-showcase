/** RT92 — unified server-authoritative billing lifecycle and seven-product renderer. */
import {
  EON_KEYS_REFERRAL_POLICY,
  EON_PAID_SUBSCRIPTION_PLANS,
  EON_PURCHASABLE_PLANS,
  EON_SUBSCRIPTION_TRIAL_DAYS,
  formatMonthlyPlanPrice,
  getEonSubscriptionPlan,
  validateEonCommercialCatalog
} from './eon-commercial-catalog.js';
import { createBillingIdempotencyKey } from '../billing/eon-billing-client-idempotency.js';

const STATUS_ENDPOINT = '/api/billing/status';
const CHECKOUT_ENDPOINT = '/api/billing/checkout';
const PORTAL_ENDPOINT = '/api/billing/portal';
const ACTION_ENDPOINT = '/api/billing/subscription-action';
const LOGIN_PATH = '/api/auth/google/start?returnTo=%2Fbilling';
let lastStatus = null;

function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function safeProviderUrl(value = '') { try { const url = new URL(String(value || '')); if (url.protocol !== 'https:') return ''; const host = url.hostname.toLowerCase(); return host === 'dodopayments.com' || host.endsWith('.dodopayments.com') ? url.href : ''; } catch { return ''; } }
function formatDate(value = 0) { const epoch = Number(value || 0); return epoch > 0 ? new Date(epoch).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''; }
function checkoutReturnMessage() { const params = new URLSearchParams(window.location.search); if (params.get('checkout') === 'return') return 'Checkout returned. Access appears only after the signed Dodo webhook updates the server ledger.'; if (params.get('checkout') === 'cancelled') return 'Checkout was cancelled. No purchase or plan change was requested.'; if (params.get('portal') === 'return') return 'Returned from the Dodo customer portal. Refreshing server billing state.'; return ''; }
function setRuntimeStatus(state, title, detail) { const host = document.querySelector('#eon-billing-runtime-status'); if (!host) return; host.dataset.state = state; host.innerHTML = `<div class="billing-status-line"><span class="billing-status-dot" aria-hidden="true"></span><div><strong>${escapeHtml(title)}</strong><div class="billing-inline-status">${escapeHtml(detail)}</div></div></div>`; }
function setActionStatus(message = '', state = '') { const host = document.querySelector('#eon-billing-action-status'); if (!host) return; host.dataset.state = state; host.textContent = message; }
function premiumPlan(status = {}, tier = '') { const plans = Array.isArray(status?.premium?.plans) ? status.premium.plans : []; return plans.find((entry) => String(entry?.id || '').toLowerCase() === String(tier || '').toLowerCase()) || null; }
function planLabelForTier(tier = '', status = {}) { return getEonSubscriptionPlan(tier)?.label || premiumPlan(status, tier)?.label || String(tier || 'Free').replace(/^./, (char) => char.toUpperCase()); }

function renderManagement(status = {}) {
  const host = document.querySelector('#eon-billing-management'); if (!host) return;
  const account = status.account || {}; const billing = account.billing || {};
  if (!account.signedIn) { host.innerHTML = '<p>Sign in to open the provider portal or review subscription actions.</p>'; return; }
  const canPortal = status.customerPortalActive === true;
  const canActions = status.subscriptionActionsActive === true;
  const cancelLabel = billing.cancelAtPeriodEnd ? 'Cancellation scheduled' : 'Cancel at period end';
  const renewal = formatDate(billing.currentPeriodEnd);
  host.innerHTML = `<p><strong>Provider-managed recurring billing</strong></p>
    <p>${renewal ? `Current billing period ends ${escapeHtml(renewal)}.` : 'The server has not published a current recurring billing-period date.'}</p>
    <div class="billing-action-row">
      <button type="button" class="btn btn-outline btn-sm" data-billing-portal ${canPortal ? '' : 'disabled'}>Open Dodo customer portal</button>
      ${billing.cancelAtPeriodEnd
        ? `<button type="button" class="btn btn-outline btn-sm" data-billing-action="reactivate" ${canActions ? '' : 'disabled'}>Reactivate renewal</button>`
        : `<button type="button" class="btn btn-outline btn-sm" data-billing-action="cancel-at-period-end" ${canActions ? '' : 'disabled'}>${escapeHtml(cancelLabel)}</button>`}
    </div>
    <p class="billing-inline-status">Recurring subscription requests do not change access in the browser. EONAPP waits for the signed Dodo webhook and server-ledger reconciliation. Ultimate is a separate one-time software grant and has no renewal to cancel.</p>`;
  host.querySelector('[data-billing-portal]')?.addEventListener('click', openPortal);
  host.querySelectorAll('[data-billing-action]').forEach((button) => button.addEventListener('click', () => submitSubscriptionAction(button.dataset.billingAction, '', button, status)));
}

function renderAccountStatus(status = {}) {
  const host = document.querySelector('#eon-billing-account-status'); if (!host) return;
  const account = status.account || {}; const entitlement = account.entitlement || null; const billing = account.billing || {}; const returned = checkoutReturnMessage();
  if (status.ok === false) {
    host.innerHTML = account.signedIn
      ? '<p><strong>Signed in.</strong> Billing ledger status is temporarily unavailable. No checkout, plan change, cancellation or entitlement claim is enabled until server verification recovers.</p>'
      : '<p><strong>Billing status unavailable.</strong> No checkout or subscription action is enabled until the server can verify account and billing state.</p>';
    const management = document.querySelector('#eon-billing-management'); if (management) management.innerHTML = '<p>Billing management is temporarily unavailable. Existing provider state is not changed.</p>';
    return;
  }
  if (!account.signedIn) { host.innerHTML = `<p><strong>Not signed in.</strong> Sign in before checkout so the signed webhook can attach the subscription or Ultimate grant to the correct EON account.</p><p><a class="btn btn-primary btn-sm" href="${LOGIN_PATH}">Sign in with Google</a></p>${returned ? `<p class="billing-inline-status">${escapeHtml(returned)}</p>` : ''}`; renderManagement(status); return; }
  const plan = billing.tierId ? getEonSubscriptionPlan(billing.tierId) : null;
  const tierLabel = plan?.label || (billing.tierId && billing.tierId !== 'free' ? planLabelForTier(billing.tierId, status) : 'Free');
  const statusLabel = String(billing.status || entitlement?.status || 'free').replaceAll('_', ' ');
  const periodEnd = formatDate(billing.currentPeriodEnd); const graceEnd = formatDate(billing.graceEndsAt); const invoice = safeProviderUrl(billing.invoiceUrl); const receipt = safeProviderUrl(billing.receiptUrl);
  const warning = billing.status === 'past_due' ? 'Payment is past due. Paid recurring access is not shown as active.' : billing.status === 'disputed' ? 'The provider reported a dispute. Paid recurring access is revoked pending resolution.' : billing.status === 'grace' ? `Payment recovery grace is active${graceEnd ? ` until ${graceEnd}` : ''}.` : '';
  const ultimateOwned = status.premium?.account?.ultimateOwned === true;
  host.innerHTML = `<p><strong>${escapeHtml(tierLabel)}</strong> · ${escapeHtml(statusLabel)}</p>
    ${periodEnd ? `<p>${billing.cancelAtPeriodEnd ? 'Recurring access scheduled through' : 'Current recurring period through'} ${escapeHtml(periodEnd)}.</p>` : '<p>No paid recurring renewal date is currently shown.</p>'}
    ${ultimateOwned ? '<p><strong>Ultimate perpetual software grant:</strong> active on this EON account.</p>' : ''}
    ${warning ? `<p><strong>${escapeHtml(warning)}</strong></p>` : ''}
    ${(invoice || receipt) ? `<p>${invoice ? `<a href="${escapeHtml(invoice)}" target="_blank" rel="noopener noreferrer">Provider invoice</a>` : ''}${invoice && receipt ? ' · ' : ''}${receipt ? `<a href="${escapeHtml(receipt)}" target="_blank" rel="noopener noreferrer">Provider receipt</a>` : ''}</p>` : ''}
    <p class="billing-inline-status">Paid access comes only from server ledgers. Browser storage cannot award, extend or restore a subscription or Ultimate grant.</p>${returned ? `<p><strong>${escapeHtml(returned)}</strong></p>` : ''}`;
  renderManagement(status);
}

function planCard(plan, status = {}) {
  const recurring = plan.billingType === 'subscription';
  const oneTime = plan.billingType === 'one-time';
  const currentTier = status.account?.billing?.tierId || status.account?.entitlement?.tier_id || '';
  const isCurrent = recurring && currentTier === plan.id;
  const ultimateOwned = plan.id === 'ultimate' && status.premium?.account?.ultimateOwned === true;
  const signedIn = status.account?.signedIn === true;
  const hasRecurring = Boolean(currentTier && currentTier !== 'free');
  const trialEligible = status.account?.trialEligible !== false;
  const recurringReady = status.checkoutActive === true;
  const oneTimeReady = status.premium?.checkoutActive === true && premiumPlan(status, plan.id)?.checkoutActive === true;
  const checkoutReady = recurring ? recurringReady : oneTimeReady;
  const unavailable = status.ok === false;
  const buttonLabel = unavailable
    ? 'Billing unavailable'
    : ultimateOwned
      ? 'Ultimate owned'
      : isCurrent
        ? 'Current plan'
        : !signedIn
          ? `Sign in for ${plan.label}`
          : oneTime
            ? `Buy ${plan.label} · $${Number(plan.oneTimeUsd || 0).toLocaleString('en-US')}`
            : hasRecurring
              ? `Review change to ${plan.label}`
              : trialEligible
                ? `Start ${EON_SUBSCRIPTION_TRIAL_DAYS}-day ${plan.label} trial`
                : `Subscribe to ${plan.label}`;
  const disabled = unavailable || isCurrent || ultimateOwned || (signedIn && !checkoutReady) || (recurring && hasRecurring && status.subscriptionActionsActive !== true);
  const badge = isCurrent ? '<span class="sub-plan-badge sub-plan-badge--current">Current</span>' : ultimateOwned ? '<span class="sub-plan-badge sub-plan-badge--current">Owned</span>' : plan.featured ? '<span class="sub-plan-badge sub-plan-badge--popular">Popular</span>' : oneTime ? '<span class="sub-plan-badge">One time</span>' : '';
  const price = oneTime
    ? `<div class="sub-plan-price"><span class="sub-plan-price-amount">$${Number(plan.oneTimeUsd || 0).toLocaleString('en-US')}</span><span class="sub-plan-price-period"> one time</span></div>`
    : `<div class="sub-plan-price"><span class="sub-plan-price-amount">$${Number(plan.monthlyUsd).toFixed(2)}</span><span class="sub-plan-price-period">/ month</span></div>`;
  const billingCopy = oneTime
    ? 'Permanent eligible premium software capability. No recurring software fee and no trial. Hosted AI/cloud capacity remains separately governed.'
    : status.account?.trialEligible === false
      ? `Trial already used · ${formatMonthlyPlanPrice(plan)}`
      : `${EON_SUBSCRIPTION_TRIAL_DAYS}-day trial for an eligible new account · then ${formatMonthlyPlanPrice(plan)}`;
  return `<article class="sub-plan-card${plan.featured ? ' is-featured' : ''}${isCurrent || ultimateOwned ? ' is-current' : ''}" data-plan-id="${escapeHtml(plan.id)}"><div class="sub-plan-badge-row">${badge}</div><h3 class="sub-plan-name">${escapeHtml(plan.label)}</h3>${price}<p>${escapeHtml(plan.summary)}</p><p class="billing-plan-trial">${escapeHtml(billingCopy)}</p><ul class="sub-plan-features">${plan.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul><div class="sub-plan-cta"><button type="button" class="sub-plan-btn ${isCurrent || ultimateOwned ? 'sub-plan-btn--active' : 'sub-plan-btn--primary'}" data-billing-tier="${escapeHtml(plan.id)}" ${disabled ? 'disabled' : ''}>${escapeHtml(buttonLabel)}</button><div class="billing-plan-error" data-billing-plan-error="${escapeHtml(plan.id)}" role="status" aria-live="polite"></div><span class="sub-plan-note">Hosted billing by Dodo Payments. Access changes only after signed webhook reconciliation.</span></div></article>`;
}

function renderPlans(status = {}) {
  const host = document.querySelector('#eon-billing-plans'); if (!host) return;
  host.innerHTML = EON_PURCHASABLE_PLANS.map((plan) => planCard(plan, status)).join('');
  host.querySelectorAll('[data-billing-tier]').forEach((button) => button.addEventListener('click', () => handleTierRequest(button.dataset.billingTier || '', button, status)));
}
function setPlanError(tier, message = '') { const host = [...document.querySelectorAll('[data-billing-plan-error]')].find((node) => node.dataset.billingPlanError === tier); if (host) host.textContent = message; }
async function handleTierRequest(tier, button, status) {
  const plan = getEonSubscriptionPlan(tier); if (!plan || plan.id === 'free') return;
  if (!status.account?.signedIn) { window.location.assign(LOGIN_PATH); return; }
  if (plan.billingType === 'one-time') return startOneTimeCheckout(tier, button, status);
  const currentTier = status.account?.billing?.tierId || status.account?.entitlement?.tier_id || '';
  if (currentTier === tier) return;
  if (currentTier && currentTier !== 'free') return submitSubscriptionAction('change-plan', tier, button, status);
  return startCheckout(tier, button, status);
}

async function startCheckout(tier, button, status = {}) {
  const plan = getEonSubscriptionPlan(tier); if (!plan || plan.billingType !== 'subscription') return; setPlanError(tier, '');
  if (status.checkoutActive !== true) { setPlanError(tier, 'Secure recurring checkout is unavailable because the server did not confirm all six subscription product mappings and billing authority.'); return; }
  const original = button.textContent; button.disabled = true; button.textContent = 'Creating secure checkout…';
  try { const response = await fetch(CHECKOUT_ENDPOINT, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ tier: plan.id, idempotencyKey: createBillingIdempotencyKey(`checkout-${plan.id}`) }) }); const payload = await response.json().catch(() => ({})); if (response.status === 401 && payload.loginUrl) { window.location.assign(payload.loginUrl); return; } if (!response.ok || payload.ok !== true) throw new Error(payload.error || payload.status || 'checkout_unavailable'); const url = safeProviderUrl(payload.checkoutUrl); if (!url) throw new Error('invalid_checkout_destination'); window.location.assign(url); }
  catch (error) { setPlanError(tier, `Checkout could not start: ${String(error?.message || 'unknown error').replaceAll('_', ' ')}.`); button.disabled = false; button.textContent = original; }
}

async function startOneTimeCheckout(tier, button, status = {}) {
  const plan = getEonSubscriptionPlan(tier); if (!plan || plan.billingType !== 'one-time') return; setPlanError(tier, '');
  if (status.premium?.checkoutActive !== true || premiumPlan(status, tier)?.checkoutActive !== true) { setPlanError(tier, 'Ultimate checkout is unavailable because the server did not confirm the complete one-time purchase and software-grant configuration.'); return; }
  if (tier === 'ultimate' && status.premium?.account?.ultimateOwned === true) { setPlanError(tier, 'Ultimate software is already owned by this account.'); return; }
  const original = button.textContent; button.disabled = true; button.textContent = 'Creating secure checkout…';
  try { const response = await fetch(CHECKOUT_ENDPOINT, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ tier: plan.id, idempotencyKey: createBillingIdempotencyKey(`one-time-checkout-${plan.id}`) }) }); const payload = await response.json().catch(() => ({})); if (response.status === 401 && payload.loginUrl) { window.location.assign(payload.loginUrl); return; } if (!response.ok || payload.ok !== true) throw new Error(payload.error || payload.status || 'one_time_checkout_unavailable'); const url = safeProviderUrl(payload.checkoutUrl); if (!url) throw new Error('invalid_checkout_destination'); window.location.assign(url); }
  catch (error) { setPlanError(tier, `Checkout could not start: ${String(error?.message || 'unknown error').replaceAll('_', ' ')}.`); button.disabled = false; button.textContent = original; }
}

async function openPortal(event) {
  const button = event.currentTarget; const original = button.textContent; button.disabled = true; button.textContent = 'Opening secure portal…'; setActionStatus('', '');
  try { const response = await fetch(PORTAL_ENDPOINT, { method: 'POST', credentials: 'same-origin', headers: { accept: 'application/json' } }); const payload = await response.json().catch(() => ({})); if (!response.ok || payload.ok !== true) throw new Error(payload.error || payload.status || 'portal_unavailable'); const url = safeProviderUrl(payload.portalUrl); if (!url) throw new Error('invalid_portal_destination'); window.location.assign(url); }
  catch (error) { setActionStatus(`Portal could not open: ${String(error?.message || 'unknown error').replaceAll('_', ' ')}.`, 'error'); button.disabled = false; button.textContent = original; }
}

async function previewSubscriptionChange(tier, _status = {}) {
  const response = await fetch(ACTION_ENDPOINT, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ action: 'preview-change-plan', tier, confirmed: true, idempotencyKey: createBillingIdempotencyKey(`preview-change-${tier}`) }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok !== true) throw new Error(payload.error || payload.status || 'plan_change_preview_failed');
  return payload;
}

async function submitSubscriptionAction(action, tier, button, status = {}) {
  const targetLabel = tier ? planLabelForTier(tier, status) : '';
  let prompt = action === 'cancel-at-period-end' ? 'Schedule cancellation at the end of the current paid period? Access will remain governed by the provider webhook.' : action === 'reactivate' ? 'Reactivate renewal? The change appears only after provider webhook reconciliation.' : `Request a reviewed change to ${targetLabel || tier}?`;
  if (action === 'change-plan') {
    const originalPreviewLabel = button.textContent;
    button.disabled = true;
    button.textContent = 'Checking provider preview…';
    try {
      const preview = await previewSubscriptionChange(tier, status);
      const charge = String(preview.immediateChargeSummary || '').trim();
      prompt = preview.isDowngrade
        ? `Change to ${targetLabel || tier} at the next billing date? Dodo preview confirms no immediate proration charge from EONAPP's downgrade request.${charge ? ` Provider preview: ${charge}` : ''}`
        : `Upgrade to ${targetLabel || tier} immediately? Dodo will prorate the change now.${charge ? ` Provider preview: ${charge}` : ''}`;
    } catch (error) {
      setPlanError(tier, `Plan-change preview failed: ${String(error?.message || 'unknown error').replaceAll('_', ' ')}. No change was sent.`);
      button.disabled = false;
      button.textContent = originalPreviewLabel;
      return;
    }
    button.disabled = false;
    button.textContent = originalPreviewLabel;
  }
  if (!window.confirm(prompt)) return;
  const original = button.textContent; button.disabled = true; button.textContent = 'Sending reviewed request…'; setPlanError(tier, ''); setActionStatus('', '');
  try { const response = await fetch(ACTION_ENDPOINT, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ action, tier, confirmed: true, idempotencyKey: createBillingIdempotencyKey(`subscription-${action}-${tier || 'current'}`) }) }); const payload = await response.json().catch(() => ({})); if (!response.ok || payload.ok !== true) throw new Error(payload.error || payload.status || 'billing_action_failed'); const message = 'Provider accepted the request. EONAPP is waiting for a signed webhook before changing displayed access.'; tier ? setPlanError(tier, message) : setActionStatus(message, 'pending'); window.setTimeout(loadBilling, 1200); }
  catch (error) { const message = `Request failed: ${String(error?.message || 'unknown error').replaceAll('_', ' ')}.`; tier ? setPlanError(tier, message) : setActionStatus(message, 'error'); button.disabled = false; button.textContent = original; }
}

function validateStatusAgainstCatalog(status = {}) {
  const errors = [];
  const serverPlans = Array.isArray(status.plans) ? status.plans : [];
  for (const plan of EON_PAID_SUBSCRIPTION_PLANS) {
    const server = serverPlans.find((entry) => entry?.id === plan.id);
    if (!server) errors.push(`Server did not publish ${plan.label}.`);
    else if (Number(server.monthlyUsd) !== plan.monthlyUsd || Number(server.trialDays) !== plan.trialDays) errors.push(`${plan.label} server catalogue does not match the public catalogue.`);
    if (status.configured?.products?.[plan.id] !== true) errors.push(`${plan.label} Dodo product mapping is not configured.`);
  }
  const ultimate = getEonSubscriptionPlan('ultimate');
  const serverUltimate = premiumPlan(status, 'ultimate');
  if (!serverUltimate) errors.push('Server did not publish Ultimate.');
  else if (Number(serverUltimate.priceUsd) !== Number(ultimate?.oneTimeUsd || 0) || serverUltimate.pricingType !== 'one-time' || Number(serverUltimate.trialDays || 0) !== 0) errors.push('Ultimate server catalogue does not match the public catalogue.');
  if (status.premium?.configured?.products?.ultimate !== true) errors.push('Ultimate Dodo product mapping is not configured.');
  return errors;
}

async function loadBilling() {
  const validation = validateEonCommercialCatalog();
  if (!validation.ok) { const blocked = { ok: false, checkoutActive: false, account: { signedIn: false }, premium: { checkoutActive: false, account: { ultimateOwned: false } } }; setRuntimeStatus('error', 'Billing catalogue validation failed.', validation.errors.join(' ')); renderAccountStatus(blocked); renderPlans(blocked); return; }
  try {
    const response = await fetch(STATUS_ENDPOINT, { credentials: 'same-origin', headers: { accept: 'application/json' }, cache: 'no-store' });
    const status = await response.json();
    if (!response.ok || status.ok !== true) { lastStatus = { ...status, ok: false, checkoutActive: false, customerPortalActive: false, subscriptionActionsActive: false, premium: { ...(status.premium || {}), checkoutActive: false } }; setRuntimeStatus('error', 'Billing status could not be verified.', status.message || 'No checkout or subscription action has been enabled.'); renderAccountStatus(lastStatus); renderPlans(lastStatus); return; }
    const drift = validateStatusAgainstCatalog(status);
    const ready = status.checkoutActive === true && status.premium?.checkoutActive === true && drift.length === 0;
    lastStatus = { ...status, allProductsCheckoutActive: ready };
    if (ready) setRuntimeStatus('ready', 'All EONAPP purchases are configured.', `Six recurring plans use Dodo hosted checkout and signed-webhook lifecycle reconciliation; eligible new accounts receive one ${EON_SUBSCRIPTION_TRIAL_DAYS}-day trial. Ultimate is a $1,299 one-time perpetual software grant.`);
    else setRuntimeStatus('blocked', 'One or more purchases are temporarily unavailable.', drift.join(' ') || 'The server did not confirm every required Dodo product, webhook or ledger component.');
    renderAccountStatus(lastStatus); renderPlans(lastStatus);
  } catch {
    lastStatus = null; const blocked = { ok: false, checkoutActive: false, account: { signedIn: false }, premium: { checkoutActive: false, account: { ultimateOwned: false } } }; setRuntimeStatus('error', 'Billing status could not be verified.', 'No checkout or subscription action has been enabled.'); renderAccountStatus(blocked); renderPlans(blocked);
  }
}

export function getBillingPublicArchitecture() { return Object.freeze({ statusEndpoint: STATUS_ENDPOINT, checkoutEndpoint: CHECKOUT_ENDPOINT, portalEndpoint: PORTAL_ENDPOINT, subscriptionActionEndpoint: ACTION_ENDPOINT, checkoutAuthority: 'server-only', entitlementAuthority: 'verified-provider-webhook-only', hostedProvider: 'Dodo Payments', recurringPlans: EON_PAID_SUBSCRIPTION_PLANS, purchasablePlans: EON_PURCHASABLE_PLANS, trialDays: EON_SUBSCRIPTION_TRIAL_DAYS, referralPolicy: EON_KEYS_REFERRAL_POLICY, browserUnlockAllowed: false }); }
if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadBilling, { once: true }); else loadBilling(); }
