/**
 * W388B — global social connector architecture registry.
 *
 * All records are planning metadata only. The registry does not launch OAuth,
 * store a platform token, call an API, schedule a post, scrape an audience or
 * claim availability for a person in any country.
 */
export const EON_SOCIAL_CONNECTOR_SCHEMA = 'eonapp.social-connector-registry.v1';
export const EON_SOCIAL_CONNECTOR_ROLLOUT = 'disabled';

const freeze = (value) => Object.freeze(value);

export const EON_SOCIAL_CONNECTORS = freeze([
  freeze({ id: 'instagram', label: 'Instagram professional', now: 'Export/native share', later: 'Official professional publishing approval', category: 'direct-when-approved' }),
  freeze({ id: 'facebook-pages', label: 'Facebook Pages', now: 'Export/native share', later: 'Official Page publishing approval', category: 'direct-when-approved' }),
  freeze({ id: 'tiktok', label: 'TikTok', now: 'Export/native share', later: 'Official Content Posting approval for eligible users', category: 'direct-when-approved' }),
  freeze({ id: 'youtube', label: 'YouTube', now: 'Export/native share', later: 'Official upload OAuth approval', category: 'direct-when-approved' }),
  freeze({ id: 'linkedin', label: 'LinkedIn', now: 'Export/native share', later: 'Official member or organization publishing approval', category: 'direct-when-approved' }),
  freeze({ id: 'pinterest', label: 'Pinterest', now: 'Export/native share', later: 'Official Pin creation approval', category: 'direct-when-approved' }),
  freeze({ id: 'x', label: 'X', now: 'Export/native share', later: 'Official post API plan and approval review', category: 'direct-when-approved' }),
  freeze({ id: 'telegram', label: 'Telegram channel or group', now: 'Export/native share', later: 'Bot/admin-consent posting proof', category: 'direct-when-approved' }),
  freeze({ id: 'discord', label: 'Discord', now: 'Export/native share', later: 'Official webhook or bot consent review', category: 'export-first' }),
  freeze({ id: 'reddit', label: 'Reddit', now: 'Export/native share', later: 'Official OAuth and community-rule review', category: 'export-first' }),
  freeze({ id: 'whatsapp', label: 'WhatsApp', now: 'Native share', later: 'Business API review only; never personal-account automation', category: 'export-first' }),
  freeze({ id: 'threads', label: 'Threads', now: 'Native share', later: 'Official platform capability review', category: 'export-first' }),
  freeze({ id: 'snapchat', label: 'Snapchat', now: 'Native share', later: 'Official platform capability review', category: 'export-first' })
]);

export function listEonSocialConnectors() {
  return EON_SOCIAL_CONNECTORS.map((connector) => ({ ...connector }));
}

export function getEonSocialConnector(connectorId = '') {
  const id = String(connectorId || '').trim().toLowerCase();
  const connector = EON_SOCIAL_CONNECTORS.find((candidate) => candidate.id === id);
  return connector ? freeze({ ...connector }) : null;
}

export function getEonSocialConnectorTruth() {
  return freeze({
    schema: EON_SOCIAL_CONNECTOR_SCHEMA,
    rollout: EON_SOCIAL_CONNECTOR_ROLLOUT,
    enabled: false,
    nativeShareAndExportOnly: true,
    oauthStarted: false,
    tokenStored: false,
    directPostCreated: false,
    schedulingCreated: false,
    analyticsClaimed: false,
    geographicEligibilityChecked: false,
    userConsentRequired: true,
    perPostApprovalRequired: true,
    revokeRequired: true,
    serverSideTokenCustodyRequired: true,
    activationPrerequisites: freeze([
      'platform-by-platform-official-api-review',
      'provider-privacy-and-token-custody-design',
      'official-oauth-client-and-callback-proof',
      'per-post-review-cancel-and-revoke-proof',
      'support-and-disclosure-copy-approved',
      'human-release-signoff'
    ])
  });
}

export default freeze({ EON_SOCIAL_CONNECTOR_SCHEMA, EON_SOCIAL_CONNECTOR_ROLLOUT, EON_SOCIAL_CONNECTORS, listEonSocialConnectors, getEonSocialConnector, getEonSocialConnectorTruth });
