/**
 * W306 + W364A — local-first boundary contract.
 *
 * EONAPP stays guest-first and local-first. Optional Google identity is a
 * narrowly-scoped account anchor for recovery, purchases, and entitlements;
 * it is never a cloud workspace, automatic backup, or data-upload promise.
 * This module contains only public product boundaries. It has no credentials,
 * runtime probes, network calls, or account state.
 */

export const EON_LOCAL_FIRST_BOUNDARY_SCHEMA = 'eonapp.local-first-boundary.v2';

export const EON_LOCAL_FIRST_BOUNDARY = Object.freeze({
  schema: EON_LOCAL_FIRST_BOUNDARY_SCHEMA,
  version: 2,
  identity: Object.freeze({
    googleLogin: 'planned-optional',
    oneTap: 'retired',
    compulsoryAccount: false,
    browserSessionAttachment: 'retired',
    googleIdentityIsDataBackup: false,
    googleServiceConnectionAutomatic: false
  }),
  data: Object.freeze({
    userWorkspaceCloudStore: false,
    automaticCrossDeviceSync: false,
    cloudControlPlane: false,
    defaultPersistence: 'this-device-only',
    portableRecovery: 'user-created-encrypted-export-only',
    minimalAccountMetadataOnlyWhenActivated: true,
    rawWorkspaceDataOnCloudflare: false
  }),
  execution: Object.freeze({
    backgroundAfterClose: false,
    unattendedPublishing: false,
    serverActionPackets: false,
    cloudQueue: false
  }),
  provider: Object.freeze({
    directProviderOnly: true,
    hiddenRelayAllowed: false,
    defaultCrossProviderFallback: false,
    googleIdentityRequiredForGemini: false
  }),
  city: Object.freeze({
    executor: false,
    oauthSurface: false,
    redactedLocalMirrorOnly: true
  })
});

export const EON_LOCAL_FIRST_NOTICES = Object.freeze({
  pwa: 'This device stores EONAPP state locally. Cross-device sync is not active. Optional Google sign-in does not create automatic cross-device sync or a cloud backup. Create an encrypted portable backup when you want your own recovery copy.',
  profile: 'Guest mode is always available. Optional Google sign-in will manage account access and purchases only; it will not upload your local Chat, Vault, projects, Realm, City progress, or provider keys. Create and keep an encrypted backup yourself.',
  backup: 'EON Sync creates an encrypted portable backup only. It does not upload, mirror, or synchronize your EONAPP data to Google, an EONAPP account, or a cloud service.',
  googleIdentity: 'Google sign-in is optional and identity-only. It does not grant Gmail, Drive, Calendar, Contacts, or YouTube access, and it does not back up local EONAPP data.',
  googleDataCustody: 'Before relying on Google sign-in, create an encrypted backup for local work you cannot lose. Signing in helps recover account access and purchases, not browser-local work.',
  geminiByok: 'A Gemini key is obtained from Google AI Studio under Google’s own account rules. That is separate from EONAPP identity: it does not automatically sign you in to EONAPP, connect Google services, or back up EONAPP data.',
  browserAttachment: 'Browser account attachments and legacy quick-login helpers are retired. EONAPP will use an explicit optional Google identity flow only after its server-side security and privacy checks are complete.'
});

export function getLocalFirstBoundaryNotice(kind = 'profile') {
  return EON_LOCAL_FIRST_NOTICES[kind] || EON_LOCAL_FIRST_NOTICES.profile;
}

export function isLocalFirstBoundarySatisfied(candidate = {}) {
  return Boolean(
    candidate?.identity?.googleLogin === 'planned-optional'
    && candidate?.identity?.oneTap === 'retired'
    && candidate?.identity?.compulsoryAccount === false
    && candidate?.identity?.googleIdentityIsDataBackup === false
    && candidate?.data?.userWorkspaceCloudStore === false
    && candidate?.data?.automaticCrossDeviceSync === false
    && candidate?.data?.cloudControlPlane === false
    && candidate?.data?.rawWorkspaceDataOnCloudflare === false
    && candidate?.execution?.backgroundAfterClose === false
    && candidate?.provider?.hiddenRelayAllowed === false
    && candidate?.city?.executor === false
  );
}
