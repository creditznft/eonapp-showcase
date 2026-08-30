/**
 * W452/W623C — canonical app-shell and live-billing truth contract.
 *
 * The root document is the sole public EONBOT Chat route. Legacy `/chat`
 * aliases remain inbound compatibility only; current navigation must not point
 * users through them. Billing is a transparent Dodo hosted-checkout surface whose buttons remain server-authoritative and fail closed when status cannot be verified.
 */
export const W452_APP_SHELL_QUALITY_SCHEMA = 'eonapp.w452.app-shell-quality.v2';

export const W452_CANONICAL_PUBLIC_ROUTES = Object.freeze({
  chat: '/',
  city: '/eoncity',
  research: '/insights',
  billing: '/billing'
});

export const W452_RETIRED_NAVIGATION_ALIASES = Object.freeze([
  '/chat',
  '/chat.html',
  '/trade',
  '/trade.html',
  '/realm',
  '/realmworld',
  '/game',
  '/games',
  '/marketplace',
  '/workbench',
  '/eon-browser'
]);

export const W452_BILLING_COPY_REQUIREMENTS = Object.freeze([
  'Plans &amp; billing',
  'Every paid plan starts with the same seven-day trial',
  'Dodo Payments hosted checkout',
  'server webhook updates the entitlement ledger',
  'EONKEYS never create a free subscription tier'
]);

export const W452_NAVIGATION_RULES = Object.freeze({
  rootChatIsCanonical: true,
  activeUiMayNotLinkToChatAlias: true,
  activeUiMayNotBypassServerBillingStatus: true,
  billingMayNotShowWalletOrCryptoActivationCopy: true,
  compatibilityParsingMayAcceptLegacyInboundPaths: true
});

export function validateW452AppShellQualityContract() {
  const errors = [];
  if (W452_CANONICAL_PUBLIC_ROUTES.chat !== '/') errors.push('Root must remain the canonical public Chat route.');
  if (W452_CANONICAL_PUBLIC_ROUTES.city !== '/eoncity') errors.push('EON City must remain canonical at /eoncity.');
  if (W452_CANONICAL_PUBLIC_ROUTES.research !== '/insights') errors.push('Research Lab must remain canonical at /insights.');
  if (W452_CANONICAL_PUBLIC_ROUTES.billing !== '/billing') errors.push('Billing status must remain canonical at /billing.');
  if (!W452_RETIRED_NAVIGATION_ALIASES.includes('/chat') || !W452_RETIRED_NAVIGATION_ALIASES.includes('/chat.html')) errors.push('Legacy Chat aliases must be declared for inbound compatibility review.');
  if (W452_NAVIGATION_RULES.rootChatIsCanonical !== true || W452_NAVIGATION_RULES.activeUiMayNotLinkToChatAlias !== true) errors.push('Current navigation must send Chat users directly to the root document.');
  if (W452_NAVIGATION_RULES.activeUiMayNotBypassServerBillingStatus !== true || W452_NAVIGATION_RULES.billingMayNotShowWalletOrCryptoActivationCopy !== true) errors.push('Billing truth rules must remain enabled.');
  if (new Set(W452_BILLING_COPY_REQUIREMENTS).size !== W452_BILLING_COPY_REQUIREMENTS.length) errors.push('Billing copy requirements must be unique.');
  return Object.freeze(errors);
}
