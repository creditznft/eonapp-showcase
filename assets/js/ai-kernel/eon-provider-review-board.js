/**
 * W338 — one-at-a-time provider/connector feasibility board.
 *
 * This is a local decision helper only. It validates a candidate's declared
 * boundaries; it cannot call a provider, discover models, connect an account,
 * retain a key, initiate OAuth, or activate an adapter.
 */

import { normalizeEonProviderProtocol } from './eon-provider-protocol-contract.js';

export const EON_PROVIDER_REVIEW_BOARD_SCHEMA = 'eonapp.provider-review-board.v1';

function cleanId(value = '') {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 96);
}

function cleanText(value = '', max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function candidateErrors(candidate = {}) {
  const errors = [];
  const providerId = cleanId(candidate.providerId);
  const adapterId = cleanText(candidate.adapterId, 96);
  const protocol = normalizeEonProviderProtocol(candidate.protocol).protocol;
  const destination = cleanText(candidate.dataDestination, 96);
  const lifecycle = candidate.lifecycle && typeof candidate.lifecycle === 'object' ? candidate.lifecycle : {};
  const privacy = candidate.privacy && typeof candidate.privacy === 'object' ? candidate.privacy : {};

  if (!providerId) errors.push('provider-id-required');
  if (!adapterId) errors.push('adapter-id-required');
  if (!protocol) errors.push('protocol-not-approved');
  if (!['direct-to-provider', 'device-local'].includes(destination)) errors.push('explicit-data-destination-required');
  if (candidate.userInitiatedReview !== true) errors.push('explicit-user-review-required');
  if (candidate.models === 'hardcoded-defaults') errors.push('hardcoded-model-defaults-forbidden');
  if (candidate.models !== 'user-discovered-device-local') errors.push('device-local-model-manifest-required');
  if (lifecycle.packVersioned !== true) errors.push('versioned-provider-pack-required');
  if (lifecycle.deprecationPrompt !== 'explicit-user-prompt') errors.push('explicit-deprecation-prompt-required');
  if (privacy.cloudRelayAllowed !== false) errors.push('cloud-relay-forbidden');
  if (privacy.crossProviderFallback !== 'none') errors.push('silent-fallback-forbidden');
  if (candidate.oauthRequested === true || candidate.accountConnectionRequested === true) errors.push('connector-account-flow-out-of-scope');
  return errors;
}

/** Create a review board with exactly one pending candidate. */
export function createEonProviderReviewBoard(candidate = {}) {
  const source = candidate && typeof candidate === 'object' ? candidate : {};
  const errors = candidateErrors(source);
  const providerId = cleanId(source.providerId);
  const adapterId = cleanText(source.adapterId, 96);
  const protocolResolution = normalizeEonProviderProtocol(source.protocol);
  const protocol = protocolResolution.protocol;
  const dataDestination = cleanText(source.dataDestination, 96);

  return Object.freeze({
    schema: EON_PROVIDER_REVIEW_BOARD_SCHEMA,
    status: errors.length ? 'incomplete' : 'review-required',
    candidate: Object.freeze({
      providerId,
      adapterId,
      protocol,
      protocolAliasUsed: protocolResolution.aliasUsed,
      dataDestination,
      modelManifest: 'user-discovered-device-local',
      packVersioned: source.lifecycle?.packVersioned === true,
      deprecationPrompt: source.lifecycle?.deprecationPrompt === 'explicit-user-prompt',
      directDestinationDisclosed: ['direct-to-provider', 'device-local'].includes(dataDestination),
      userInitiatedReview: source.userInitiatedReview === true
    }),
    errors: Object.freeze(errors),
    eligibleForActivation: false,
    activeProviderCount: 0,
    modelListFetched: false,
    providerCallCreated: false,
    oauthInitiated: false,
    accountConnected: false,
    keyStored: false,
    nextStep: errors.length
      ? 'Complete the evidence fields; do not activate or call the candidate.'
      : 'Run a separately user-initiated adapter contract fixture and record only a local review result.'
  });
}

export function getEonProviderReviewBoardTruth() {
  return Object.freeze({
    schema: EON_PROVIDER_REVIEW_BOARD_SCHEMA,
    oneCandidateAtATime: true,
    hardcodedModels: false,
    automaticModelDiscovery: false,
    providerCallCreated: false,
    oauthInitiated: false,
    accountConnectionActive: false,
    cloudRelayAllowed: false,
    silentCrossProviderFallback: false,
    activationFromReviewBoard: false
  });
}
