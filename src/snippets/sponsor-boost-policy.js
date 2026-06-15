// Public-safe example: Sponsor Boost contract, not production monetization internals.
const SENSITIVE_ROUTE = /billing|subscription|privacy|legal|terms|refund|support|admin|vault-api|vault-backup|payment/i;

export function evaluateSponsorBoost({ route = '/', userOptedIn = false, trigger = 'none' }) {
  if (SENSITIVE_ROUTE.test(route)) return { allowed: false, reason: 'sensitive-route' };
  if (!userOptedIn) return { allowed: false, reason: 'ask-user-first' };
  if (trigger === 'auto-open-direct-link') return { allowed: false, reason: 'direct-link-must-be-user-tap' };
  return { allowed: true, rewardScope: 'local-soft-boost-only' };
}
