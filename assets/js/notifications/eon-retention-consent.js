/**
 * W557 — retention-channel consent boundary.
 *
 * Google/EONAPP sign-in creates identity/session state only. It never creates
 * newsletter, marketing email, browser-push or social-message permission.
 * Browser service alerts are now source-ready behind a separate explicit opt-in.
 * Google sign-in still never grants browser-push, email, newsletter or social
 * messaging consent, and marketing channels remain unreleased.
 */
export const EON_RETENTION_CONSENT_SCHEMA = 'eonapp.retention-consent.w557.v1';

const freeze = (value) => Object.freeze(value);

export const EON_RETENTION_CHANNELS = freeze([
  freeze({ id: 'in-app-activity', label: 'In-app Activity Center', state: 'released-local-only', delivery: 'browser-local', identityConsentRequired: false, marketingConsentRequired: false }),
  freeze({ id: 'browser-push-service', label: 'Device service alerts', state: 'source-ready-opt-in', delivery: 'service-worker/web-push', identityConsentRequired: false, marketingConsentRequired: false }),
  freeze({ id: 'browser-push-marketing', label: 'Product/news browser push', state: 'not-released', delivery: 'none', identityConsentRequired: true, marketingConsentRequired: true }),
  freeze({ id: 'service-email', label: 'Service email', state: 'not-released', delivery: 'none', identityConsentRequired: true, marketingConsentRequired: false }),
  freeze({ id: 'product-newsletter', label: 'Product/newsletter email', state: 'not-released', delivery: 'none', identityConsentRequired: true, marketingConsentRequired: true }),
  freeze({ id: 'connected-social', label: 'Connected social messages', state: 'not-released', delivery: 'none', identityConsentRequired: true, marketingConsentRequired: true })
]);

export function getEonRetentionConsentTruth() {
  return freeze({
    schema: EON_RETENTION_CONSENT_SCHEMA,
    googleLoginIsMarketingConsent: false,
    googleLoginIsEmailDeliveryConsent: false,
    googleLoginIsSocialMessageConsent: false,
    googleLoginIsBrowserPushConsent: false,
    automaticOutboundDelivery: false,
    browserPermissionPrompt: false,
    browserPushSubscription: 'explicit-opt-in-only',
    emailProviderConfigured: false,
    newsletterSignupReleased: false,
    socialDirectMessageAutomation: false,
    eonbotMaySendWithoutUserChannelConsent: false,
    channels: EON_RETENTION_CHANNELS
  });
}

export function renderEonRetentionConsentNotice() {
  return `<section class="eon-shell-retention-boundary" aria-label="Delivery and consent boundary"><h3>Delivery &amp; consent</h3><p>Google/EONAPP sign-in never enrols you in email, a newsletter, browser push or social messages. Device service alerts are a separate explicit opt-in.</p><p>Service alerts may cover requested results, approvals, saved reminders or City progress. Product/news marketing remains a different unreleased channel and cannot inherit service-alert permission.</p></section>`;
}
