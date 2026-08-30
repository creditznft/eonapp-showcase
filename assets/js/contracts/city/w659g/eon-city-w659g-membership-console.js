/**
 * A15 I03 — Core-owned City contract extracted from assets/js/city/w659g/eon-city-w659g-membership-console.js.
 * Rendering/runtime implementation remains under assets/js/city; this module
 * is safe for Core routes and contains no City implementation imports.
 */
/** W659G/W728 — server-authoritative Plans & access bridge inside EON City. */
import { EON_PURCHASABLE_PLANS } from '../../../commerce/eon-commercial-catalog.js';
import { createBillingIdempotencyKey } from '../../../billing/eon-billing-client-idempotency.js';
import { dispatchEonWorkSurfaceOpen } from '../../../work-surface/eon-work-surface-registry.js';
import { fetchEonCityAccessProjection } from '../eon-city-access-distribution-projection.js';

export const EON_CITY_W659G_MEMBERSHIP_SCHEMA = 'eon.city.w659g.membership-console.v2';
export const EON_CITY_W659G_MEMBERSHIP_OPEN_EVENT = 'eon:city:open-membership';
const STATUS_ENDPOINT = '/api/billing/status';
const CHECKOUT_ENDPOINT = '/api/billing/checkout';

function trustedCheckoutUrl(value = '') {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && (url.hostname === 'dodopayments.com' || url.hostname.endsWith('.dodopayments.com')) ? url.href : '';
  } catch {
    return '';
  }
}

async function readJson(response) {
  try { return await response.json(); } catch { return null; }
}

export async function fetchEonCityW659gMembershipStatus(environment = globalThis) {
  const capabilityPromise = fetchEonCityAccessProjection({ environment }).catch(() => ({ ok: false, reason: 'capability-unavailable', projection: null }));
  try {
    const response = await environment.fetch(STATUS_ENDPOINT, { credentials: 'same-origin', headers: { accept: 'application/json' }, cache: 'no-store' });
    const body = await readJson(response);
    const capability = await capabilityPromise;
    if (!response?.ok || body?.ok !== true) return { ok: false, error: body?.error || body?.status || 'billing_status_unavailable', httpStatus: Number(response?.status || 0), cityAccess: capability.projection, capabilityVerified: capability.ok === true };
    return { ...body, ok: true, httpStatus: Number(response.status || 200), cityAccess: capability.projection, capabilityVerified: capability.ok === true };
  } catch {
    const capability = await capabilityPromise;
    return { ok: false, error: 'billing_status_unavailable', cityAccess: capability.projection, capabilityVerified: capability.ok === true };
  }
}

export async function createEonCityW659gCheckout(tierId = '', { explicitUserAction = false, environment = globalThis } = {}) {
  if (!explicitUserAction) return { ok: false, error: 'explicit-user-action-required' };
  const tier = EON_PURCHASABLE_PLANS.find((entry) => entry.id === String(tierId || '').toLowerCase());
  if (!tier) return { ok: false, error: 'invalid_purchasable_tier' };
  try {
    const response = await environment.fetch(CHECKOUT_ENDPOINT, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ tier: tier.id, idempotencyKey: createBillingIdempotencyKey(`city-checkout-${tier.id}`, environment.crypto), returnPath: '/eoncity?billing=return&station=plans', cancelPath: '/eoncity?billing=cancelled&station=plans' })
    });
    const body = await readJson(response) || {};
    const checkoutUrl = trustedCheckoutUrl(body.checkoutUrl);
    return { ...body, ok: response?.ok === true && body.ok === true && Boolean(checkoutUrl), checkoutUrl, httpStatus: Number(response?.status || 0) };
  } catch {
    return { ok: false, error: 'checkout_request_unavailable' };
  }
}

export function bindEonCityW659gMembershipConsole(root, { onStatus = () => {} } = {}) {
  if (!root?.ownerDocument) return () => {};
  const environment = root.ownerDocument.defaultView || globalThis;
  const open = () => {
    onStatus?.('Opening Plans & access. Current tier remains server-authoritative.');
    dispatchEonWorkSurfaceOpen({ id: 'plans', source: 'eoncity', explicitUserAction: true, context: { promotion: 'contextual', checkout: 'explicit-only' } }, environment);
  };
  environment.addEventListener?.(EON_CITY_W659G_MEMBERSHIP_OPEN_EVENT, open);
  root.dataset.eonCityW659gMembership = `${EON_CITY_W659G_MEMBERSHIP_SCHEMA}.shared-surface`;
  const search = String(environment.location?.search || '');
  if (search.includes('station=plans') || search.includes('station=creator-work-pod')) open();
  return () => {
    environment.removeEventListener?.(EON_CITY_W659G_MEMBERSHIP_OPEN_EVENT, open);
    delete root.dataset.eonCityW659gMembership;
  };
}
