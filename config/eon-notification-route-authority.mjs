/** Institutional AI V2 — safe same-origin navigation targets for service alerts.
 * Notification delivery may reopen useful EONAPP surfaces only. API, asset,
 * worker and arbitrary paths are never valid notification click destinations.
 */
export const EON_NOTIFICATION_ROUTE_SCHEMA = 'eonapp.notification-route-authority.ai-v2.v1';

export const EON_NOTIFICATION_SAFE_PATHS = Object.freeze([
  '/',
  '/create', '/projects', '/library', '/workspace', '/forge', '/eoncity',
  '/insights', '/automations', '/profile', '/vault', '/capsule', '/local-ai',
  '/realm-studio', '/settings', '/help', '/status', '/billing', '/eon-keys',
  '/referral'
]);

const SAFE_PATH_SET = new Set(EON_NOTIFICATION_SAFE_PATHS);
const CONTROL_OR_BACKSLASH = /[\\\u0000-\u001f\u007f]/;

export function normalizeEonNotificationRoute(value = '/') {
  const raw = String(value || '/').trim().slice(0, 320);
  if (!raw.startsWith('/') || raw.startsWith('//') || CONTROL_OR_BACKSLASH.test(raw)) return '/';
  try {
    const base = 'https://eonapp.invalid';
    const parsed = new URL(raw, base);
    if (parsed.origin !== base || !SAFE_PATH_SET.has(parsed.pathname)) return '/';
    const suffix = `${parsed.search || ''}${parsed.hash || ''}`.slice(0, 220);
    return `${parsed.pathname}${suffix}`.slice(0, 300);
  } catch {
    return '/';
  }
}

export function isEonNotificationRouteAllowed(value = '/') {
  return normalizeEonNotificationRoute(value) === String(value || '/').trim().slice(0, 300);
}

export function getEonNotificationRouteTruth() {
  return Object.freeze({
    schema: EON_NOTIFICATION_ROUTE_SCHEMA,
    sameOriginOnly: true,
    publicAppPathsOnly: true,
    apiPathsAllowed: false,
    arbitraryPathsAllowed: false,
    pathCount: EON_NOTIFICATION_SAFE_PATHS.length
  });
}
