/**
 * W476-A4 aggregate analytics bridge.
 *
 * This is the only GA loader for EONAPP. It is deliberately preference-gated,
 * production-host-only and route-ID-only. It never accepts raw URL values,
 * document titles, user IDs, account data, chat content, file names, model
 * names, error text, OAuth state or other user-entered values.
 *
 * The measurement ID is public browser configuration, not a credential. It is
 * intentionally kept here rather than in product copy or return evidence.
 */
import { createEonStorageGateway, EON_STORAGE_STATUSES } from './storage-gateway.js';

const ANALYTICS_ID = 'G-9D4K9XLB6G';
const SCRIPT_SELECTOR = 'script[data-eon-google-analytics="1"]';
const BOOTSTRAP_FLAG = '__EON_AGGREGATE_ANALYTICS_BOOTSTRAPPED__';

export const EON_AGGREGATE_ANALYTICS_PREFERENCE_KEY = 'eon:privacy:aggregate-measurement:v1';
export const EON_AGGREGATE_ANALYTICS_PREFERENCE_SCHEMA = 'eon.aggregate-measurement.preference.v1';
export const EON_AGGREGATE_ANALYTICS_DEFAULT_ENABLED = false;
export const EON_AGGREGATE_ANALYTICS_EVENT_NAME = 'eon_route_view';

const PRODUCTION_HOSTS = Object.freeze(['eonapp.ch', 'www.eonapp.ch']);
const ROUTE_IDS = Object.freeze({
  '/': 'home',
  '/chat': 'home',
  '/chat.html': 'home',
  '/projects': 'projects',
  '/projects.html': 'projects',
  '/library': 'library',
  '/library.html': 'library',
  '/workspace': 'workspace',
  '/workspace.html': 'workspace',
  '/apps': 'apps',
  '/apps.html': 'apps',
  '/forge': 'apps',
  '/forge.html': 'apps',
  '/market': 'preview_studio',
  '/market.html': 'preview_studio',
  '/profile': 'profile',
  '/profile.html': 'profile',
  '/local-ai': 'local_ai',
  '/local-ai.html': 'local_ai',
  '/vault': 'vault',
  '/vault.html': 'vault',
  '/capsule': 'workspace_capsule',
  '/capsule.html': 'workspace_capsule',
  '/vault/backup': 'workspace_capsule',
  '/vault-backup.html': 'workspace_capsule',
  '/collection': 'vault',
  '/collection.html': 'vault',
  '/automations': 'automations',
  '/automations.html': 'automations',
  '/eoncity': 'city',
  '/eoncity.html': 'city',
  '/eoncity/lite': 'city_lite',
  '/eoncity-lite.html': 'city_lite',
  '/eoncity/tour': 'city_tour',
  '/eoncity-3d.html': 'city_tour',
  '/eoncity-play.html': 'city',
  '/realm': 'city',
  '/realm-studio': 'realm_studio',
  '/realm-studio.html': 'realm_studio',
  '/insights': 'insights',
  '/trade': 'insights',
  '/trade.html': 'insights',
  '/support': 'support',
  '/support.html': 'support',
  '/privacy': 'privacy',
  '/privacy.html': 'privacy',
  '/terms': 'terms',
  '/terms.html': 'terms',
  '/legal': 'legal',
  '/legal.html': 'legal',
  '/about': 'about',
  '/about.html': 'about',
  '/billing': 'billing',
  '/billing.html': 'billing',
  '/archive': 'archive',
  '/archive.html': 'archive',
  '/404.html': 'not_found'
});

function resolvedWindow(options = {}) {
  return options.window || (typeof window !== 'undefined' ? window : null);
}

function resolvedDocument(options = {}, win = resolvedWindow(options)) {
  return options.document || win?.document || (typeof document !== 'undefined' ? document : null);
}

function resolvedStorage(options = {}, win = resolvedWindow(options)) {
  if (Object.prototype.hasOwnProperty.call(options, 'storage')) return options.storage;
  try { return win?.localStorage || null; } catch { return null; }
}

function nowMillis(options = {}) {
  return Number(options.now || Date.now());
}

function normalizePathname(value = '/') {
  const raw = String(value || '/').trim() || '/';
  const withoutHash = raw.split('#', 1)[0];
  const withoutQuery = withoutHash.split('?', 1)[0];
  const path = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  return path.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/';
}

function isAnalyticsExplicitlyDisabled(doc) {
  const value = String(doc?.body?.dataset?.eonAnalytics || '').trim().toLowerCase();
  return value === 'off' || value === 'disabled';
}

export function getAggregateAnalyticsRouteId(pathname = '/') {
  const path = normalizePathname(pathname);
  if (ROUTE_IDS[path]) return ROUTE_IDS[path];
  if (path.startsWith('/eoncity/')) return 'city';
  if (path.startsWith('/vault/')) return 'vault';
  if (path.startsWith('/blog/')) return 'blog';
  if (path.startsWith('/tools/')) return 'tools';
  return 'other';
}

export function isProductionAnalyticsEnvironment(options = {}) {
  const win = resolvedWindow(options);
  const hostname = String(options.hostname || win?.location?.hostname || '').trim().toLowerCase();
  const protocol = String(options.protocol || win?.location?.protocol || '').trim().toLowerCase();
  return PRODUCTION_HOSTS.includes(hostname) && protocol === 'https:';
}

export function getAggregateAnalyticsPreference(options = {}) {
  const gateway = createEonStorageGateway(resolvedStorage(options));
  const result = gateway.getJson(EON_AGGREGATE_ANALYTICS_PREFERENCE_KEY, null);
  const stored = result.ok && result.found && result.value && typeof result.value === 'object' ? result.value : null;
  const enabled = stored?.enabled === true;
  const decided = typeof stored?.enabled === 'boolean';
  const storageStatus = result.status || EON_STORAGE_STATUSES.UNAVAILABLE;
  const status = enabled ? 'enabled' : (decided ? 'disabled' : 'undecided');
  return Object.freeze({
    schema: EON_AGGREGATE_ANALYTICS_PREFERENCE_SCHEMA,
    enabled,
    status,
    decidedAt: Number(stored?.decidedAt || 0) || null,
    storageStatus,
    note: enabled
      ? 'Aggregate route measurement is enabled for this browser profile on the production site. It sends only approved logical route IDs.'
      : (decided
        ? 'Aggregate route measurement is off for this browser profile.'
        : 'Aggregate route measurement is off until you choose it in Privacy settings.')
  });
}

export function setAggregateAnalyticsPreference(enabled, options = {}) {
  const gateway = createEonStorageGateway(resolvedStorage(options));
  const next = Object.freeze({
    schema: EON_AGGREGATE_ANALYTICS_PREFERENCE_SCHEMA,
    enabled: enabled === true,
    decidedAt: nowMillis(options)
  });
  const write = gateway.setJson(EON_AGGREGATE_ANALYTICS_PREFERENCE_KEY, next);
  const preference = getAggregateAnalyticsPreference(options);
  const win = resolvedWindow(options);
  if (write.ok && next.enabled) {
    try { win[`ga-disable-${ANALYTICS_ID}`] = false; } catch {}
    if (isProductionAnalyticsEnvironment(options)) startAggregateAnalyticsBridge(options);
  } else {
    // A failed opt-in must never start remote measurement. Disabling is applied
    // in memory even if the browser cannot persist the opt-out preference.
    disableAggregateAnalyticsRuntime(options);
  }
  return Object.freeze({ ...preference, write });
}

export function disableAggregateAnalyticsRuntime(options = {}) {
  const win = resolvedWindow(options);
  const doc = resolvedDocument(options, win);
  if (!win) return false;
  try { win[`ga-disable-${ANALYTICS_ID}`] = true; } catch {}
  try {
    if (typeof win.gtag === 'function') {
      win.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
  } catch {}
  try { doc?.querySelector?.(SCRIPT_SELECTOR)?.remove?.(); } catch {}
  return true;
}

function buildGtag(win) {
  win.dataLayer = win.dataLayer || [];
  if (typeof win.gtag !== 'function') {
    win.gtag = function gtag() {
      win.dataLayer.push(arguments);
    };
  }
  return win.gtag;
}

function installGoogleTagScript(doc) {
  if (!doc?.createElement || !doc?.head) return false;
  if (doc.querySelector?.(SCRIPT_SELECTOR)) return true;
  const script = doc.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ANALYTICS_ID)}`;
  script.dataset.eonGoogleAnalytics = '1';
  doc.head.appendChild(script);
  return true;
}

function emitRouteEvent(win, routeId) {
  if (!win || typeof win.gtag !== 'function') return false;
  const safeRouteId = Object.values(ROUTE_IDS).includes(routeId) || ['city', 'vault', 'blog', 'tools', 'other'].includes(routeId)
    ? routeId
    : 'other';
  win.gtag('event', EON_AGGREGATE_ANALYTICS_EVENT_NAME, { route_id: safeRouteId });
  return true;
}

export function trackAggregateAnalyticsRoute(options = {}) {
  const win = resolvedWindow(options);
  const doc = resolvedDocument(options, win);
  if (!win || !isProductionAnalyticsEnvironment(options) || isAnalyticsExplicitlyDisabled(doc)) return false;
  if (!getAggregateAnalyticsPreference(options).enabled) return false;
  const path = options.pathname || win.location?.pathname || '/';
  return emitRouteEvent(win, getAggregateAnalyticsRouteId(path));
}

export function startAggregateAnalyticsBridge(options = {}) {
  const win = resolvedWindow(options);
  const doc = resolvedDocument(options, win);
  if (!win || !doc) return Object.freeze({ started: false, reason: 'browser-unavailable' });
  if (!isProductionAnalyticsEnvironment(options)) return Object.freeze({ started: false, reason: 'non-production-host' });
  if (isAnalyticsExplicitlyDisabled(doc)) return Object.freeze({ started: false, reason: 'page-disabled' });
  if (!getAggregateAnalyticsPreference(options).enabled) return Object.freeze({ started: false, reason: 'preference-disabled' });

  try { win[`ga-disable-${ANALYTICS_ID}`] = false; } catch {}
  const gtag = buildGtag(win);
  installGoogleTagScript(doc);
  gtag('js', new Date());
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  gtag('consent', 'update', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  gtag('config', ANALYTICS_ID, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    send_page_view: false,
    transport_type: 'beacon'
  });
  const tracked = trackAggregateAnalyticsRoute(options);
  return Object.freeze({ started: true, tracked, routeId: getAggregateAnalyticsRouteId(options.pathname || win.location?.pathname || '/') });
}

function installRouteListeners(options = {}) {
  const win = resolvedWindow(options);
  if (!win?.addEventListener || win[BOOTSTRAP_FLAG]) return;
  win[BOOTSTRAP_FLAG] = true;
  const track = () => { trackAggregateAnalyticsRoute(); };
  win.addEventListener('popstate', track);
  win.addEventListener('eon:route-change', track);
}

export function bootstrapAggregateAnalyticsBridge(options = {}) {
  const win = resolvedWindow(options);
  const doc = resolvedDocument(options, win);
  if (!win || !doc) return Object.freeze({ started: false, reason: 'browser-unavailable' });
  installRouteListeners(options);
  return startAggregateAnalyticsBridge(options);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  bootstrapAggregateAnalyticsBridge();
}
