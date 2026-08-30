/**
 * W606 compatibility entrypoint.
 *
 * The abandoned server-side connector design has been retired. Import the
 * client-only contract below; it never contains an EONAPP/Cloudflare proxy,
 * provider key, or internal research endpoint.
 */
export * from './eon-client-research-contract.mjs';

export const EON_RESEARCH_CONNECTOR_SCHEMA = 'eonapp.w606.client-only-research.v1';
export const EON_RESEARCH_CONNECTOR_VERSION = '2026-07-04';
export const EON_RESEARCH_QUERY_PATH = null;
export const EON_RESEARCH_STATUS_PATH = null;
export const EON_RESEARCH_PROVIDER_ID = 'client-only-local-evidence';
export const EON_RESEARCH_ALLOWED_ROLLOUTS = Object.freeze(['local-only']);

export function getEonResearchConnectorConfig() {
  return Object.freeze({ provider: EON_RESEARCH_PROVIDER_ID, configured: true, clientOnly: true, serverProxy: false, cloudflareWorker: false });
}

export function getPublicEonResearchConnectorStatus() {
  return Object.freeze({
    schema: EON_RESEARCH_CONNECTOR_SCHEMA,
    connector: EON_RESEARCH_PROVIDER_ID,
    configured: true,
    ready: true,
    automaticBrowsing: false,
    directLocalModelInternetAccess: false,
    explicitUserActionRequired: true,
    citationDisplayRequired: true,
    clientOnly: true,
    serverProxy: false,
    cloudflareWorker: false
  });
}

export function buildOpenAiWebSearchPayload() {
  throw new Error('server-side-research-connector-retired-client-only-research-required');
}

export function extractOpenAiResearchPacket() {
  throw new Error('server-side-research-connector-retired-client-only-research-required');
}
