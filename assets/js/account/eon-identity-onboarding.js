/**
 * W374B — guest-first Google identity onboarding surface helpers.
 *
 * These helpers never start OAuth, read a session, collect identity data, or
 * write browser state. They only route a user to Profile, where the explicit
 * local-data acknowledgement and backup controls live.
 */

export const EON_IDENTITY_ONBOARDING_SCHEMA = 'eonapp.identity-onboarding.w374b.v1';

export const EON_IDENTITY_RETURN_PATHS = Object.freeze([
  '/',
  '/profile',
  '/chat',
  '/apps',
  '/workspace',
  '/eoncity',
  '/eoncity/lite',
  '/eoncity/tour',
  '/eoncity/play',
  '/realm-studio',
  '/billing'
]);

function cleanPath(value = '') {
  const raw = String(value || '').trim();
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\') || raw.includes('\u0000')) return '/profile';
  try {
    const parsed = new URL(raw, 'https://eonapp.invalid');
    if (parsed.origin !== 'https://eonapp.invalid') return '/profile';
    return EON_IDENTITY_RETURN_PATHS.includes(parsed.pathname)
      ? `${parsed.pathname}${parsed.search}`
      : '/profile';
  } catch {
    return '/profile';
  }
}

export function getIdentityReturnTo(value = '') {
  return cleanPath(value);
}

export function getIdentityAccountHref(returnTo = '/profile') {
  const safe = getIdentityReturnTo(returnTo);
  const params = new URLSearchParams();
  if (safe !== '/profile') params.set('returnTo', safe);
  const query = params.toString();
  return `/profile${query ? `?${query}` : ''}#eon-profile-account-foundation`;
}

export function getIdentityOnboardingCopy(surface = 'app') {
  const label = String(surface || 'app').replace(/[^a-z-]/gi, '').toLowerCase();
  const surfaceLabel = Object.freeze({
    chat: 'your Chat workspace',
    apps: 'the App Deck',
    city: 'EON City',
    realm: 'My Realm',
    billing: 'future purchases',
    app: 'EONAPP'
  })[label] || 'EONAPP';
  return Object.freeze({
    title: 'Guest-first account access',
    description: `Use ${surfaceLabel} without an account. Optional Google Login is for account access, future verified purchase entitlements and recovery of minimal cloud account metadata.`,
    warning: 'Google Login is not a backup. Chat, Vault, projects, files, Realm setup, City progress, provider keys and settings stay on this device unless you export an encrypted backup yourself.',
    accountLabel: 'Account & backup',
    backupLabel: 'Create encrypted Capsule'
  });
}

export function createIdentityOnboardingMarkup({ surface = 'app', returnTo = '/profile', compact = false } = {}) {
  const copy = getIdentityOnboardingCopy(surface);
  const accountHref = getIdentityAccountHref(returnTo);
  return `<section class="eon-identity-onboarding${compact ? ' is-compact' : ''}" data-eon-identity-onboarding="${String(surface).replace(/[^a-z-]/gi, '').toLowerCase() || 'app'}" aria-label="Optional Google Login and backup notice"><div class="eon-identity-onboarding-copy"><p class="eon-identity-onboarding-kicker">Account &amp; backup</p><h2>${copy.title}</h2><p>${copy.description}</p><p class="eon-identity-onboarding-warning"><strong>Important:</strong> ${copy.warning}</p></div><div class="eon-identity-onboarding-actions"><a class="eon-identity-onboarding-primary" href="${accountHref}">${copy.accountLabel}</a><a class="eon-identity-onboarding-secondary" href="/capsule">${copy.backupLabel}</a></div></section>`;
}
