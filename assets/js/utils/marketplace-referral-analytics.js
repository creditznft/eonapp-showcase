import { readShareAttribution } from './share-attribution.js';
import { recordSharePerformance } from './share-performance.js';

const STORE_KEY = 'eon:market:referral-analytics:v1';
const MAX_EVENTS = 800;

function safeParse(/** @type {any} */ raw, /** @type {any} */ fallback) {
  try {
    const parsed = JSON.parse(String(raw || ''));
    return parsed == null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function readState() {
  const state = safeParse(localStorage.getItem(STORE_KEY), null);
  if (state && typeof state === 'object' && Array.isArray(state.events)) return state;
  return {
    version: 1,
    events: [],
    listings: {},
    byRouteMode: {},
    byReferrer: {},
    updatedAt: 0,
  };
}

function writeState(/** @type {any} */ state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {}
}

function normalizeWallet(/** @type {any} */ value) {
  return String(value || '').trim().toLowerCase();
}

export function getReferralContext() {
  const src = safeParse(localStorage.getItem('eon:referral:source:v1'), {});
  const attribution = readShareAttribution() || {};
  const params = new URLSearchParams(window.location.search || '');
  const fromId = String(attribution.rootReferralId || src.fromId || params.get('ref') || params.get('r') || '').trim();
  const route = String(attribution.source || params.get('route') || src.route || 'direct').trim();
  return {
    fromId,
    route,
    sourceNonce: String(attribution.nonce || src.nonce || '').trim(),
    capturedAt: Number(attribution.capturedAt || src.capturedAt || 0),
    shareId: String(attribution.shareId || ''),
    parentShareId: String(attribution.parentShareId || ''),
    campaignId: String(attribution.campaignId || ''),
    missionCode: String(attribution.missionCode || '')
  };
}

export function recordMarketplaceReferralEvent(/** @type {any} */ payload = {}) {
  const listingId = String(payload.listingId || '').trim();
  if (!listingId) return null;

  const state = readState();
  const now = Date.now();
  const context = payload.context || getReferralContext();
  const routeMode = String(payload.routeMode || context.route || 'direct').toLowerCase();
  const referrer = String(payload.referrerId || context.fromId || '').trim();

  const /** @type {any} */
event = {
    ts: now,
    eventType: String(payload.eventType || 'unknown').slice(0, 40),
    listingId,
    collectionType: String(payload.collectionType || '').slice(0, 60),
    sellerWallet: normalizeWallet(payload.sellerWallet),
    buyerWallet: normalizeWallet(payload.buyerWallet),
    priceUsdt: Math.max(0, Number(payload.priceUsdt || 0)),
    routeMode,
    referrerId: referrer,
    sourceSurface: String(payload.sourceSurface || 'marketplace').slice(0, 40),
  };

  state.events.unshift(event);
  state.events = state.events.slice(0, MAX_EVENTS);

  if (!state.listings[listingId]) {
    state.listings[listingId] = {
      views: 0,
      purchases: 0,
      revenueUsdt: 0,
      routeModes: {},
      referrers: {},
      lastEventAt: now,
    };
  }

  const listing = state.listings[listingId];
  if (event.eventType === 'listing-view') listing.views += 1;
  if (event.eventType === 'listing-purchase') {
    listing.purchases += 1;
    listing.revenueUsdt = Number((listing.revenueUsdt + event.priceUsdt).toFixed(2));
  }
  listing.routeModes[routeMode] = (listing.routeModes[routeMode] || 0) + 1;
  if (referrer) listing.referrers[referrer] = (listing.referrers[referrer] || 0) + 1;
  listing.lastEventAt = now;

  if (!state.byRouteMode[routeMode]) state.byRouteMode[routeMode] = { views: 0, purchases: 0 };
  if (event.eventType === 'listing-view') state.byRouteMode[routeMode].views += 1;
  if (event.eventType === 'listing-purchase') state.byRouteMode[routeMode].purchases += 1;

  if (referrer) {
    if (!state.byReferrer[referrer]) state.byReferrer[referrer] = { views: 0, purchases: 0, revenueUsdt: 0 };
    if (event.eventType === 'listing-view') state.byReferrer[referrer].views += 1;
    if (event.eventType === 'listing-purchase') {
      state.byReferrer[referrer].purchases += 1;
      state.byReferrer[referrer].revenueUsdt = Number((state.byReferrer[referrer].revenueUsdt + event.priceUsdt).toFixed(2));
    }
  }

  state.updatedAt = now;
  writeState(state);
  const unifiedType = event.eventType === 'listing-purchase' ? 'marketplace_purchase' : event.eventType === 'listing-view' ? 'marketplace_listing_view' : '';
  if (unifiedType && context.shareId) {
    void recordSharePerformance(unifiedType, {
      shareId: context.shareId,
      rootReferralId: context.fromId,
      parentShareId: context.parentShareId,
      campaignId: context.campaignId,
      missionCode: context.missionCode,
      proof: { listingId, routeMode, priceUsdt: event.priceUsdt, source: event.sourceSurface }
    });
  }
  return { ...event, attributionSchema: 'eon.attribution.v2', shareId: context.shareId || '', campaignId: context.campaignId || '' };
}

export function getMarketplaceReferralAnalyticsReport() {
  const state = readState();
  const listings = Object.entries(state.listings || {}).map((/** @type {any} */ [listingId, row]) => {
    const views = Number(row.views || 0);
    const purchases = Number(row.purchases || 0);
    const conversionRate = views > 0 ? Number(((purchases / views) * 100).toFixed(2)) : 0;
    return {
      listingId,
      views,
      purchases,
      revenueUsdt: Number(row.revenueUsdt || 0),
      conversionRate,
      routeModes: row.routeModes || {},
      referrers: row.referrers || {},
      lastEventAt: Number(row.lastEventAt || 0),
    };
  }).sort((/** @type {any} */ a, /** @type {any} */ b) => b.revenueUsdt - a.revenueUsdt);

  const /** @type {any} */
byRouteMode = {};
  for (const [mode, row] of Object.entries(state.byRouteMode || {})) {
    const views = Number(row.views || 0);
    const purchases = Number(row.purchases || 0);
    byRouteMode[mode] = {
      views,
      purchases,
      conversionRate: views > 0 ? Number(((purchases / views) * 100).toFixed(2)) : 0,
    };
  }

  return {
    totalEvents: Array.isArray(state.events) ? state.events.length : 0,
    updatedAt: Number(state.updatedAt || 0),
    listings,
    byRouteMode,
    byReferrer: state.byReferrer || {},
    latest: Array.isArray(state.events) ? state.events.slice(0, 40) : [],
  };
}
