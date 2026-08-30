/**
 * W575 — deterministic Command Horizon review inventory.
 *
 * This module declares what a human/Codex review must cover. It does not read
 * device state, perform a browser action, request identity, or create proof.
 */
import { EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS, getCityAuthoredVerticalSlicePlan } from './eon-city-authored-vertical-slice.js';
import {
  W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT,
  W575_COMMAND_HORIZON_LIVE_GAMEPLAY_SCHEMA
} from '../../../config/w575-command-horizon-live-gameplay-contract.mjs';

export const EON_CITY_COMMAND_HORIZON_PROOF_SCHEMA = W575_COMMAND_HORIZON_LIVE_GAMEPLAY_SCHEMA;

const freeze = (value) => Object.freeze(value);
const VALID_QUALITY = new Set(['lite', 'balanced', 'cinematic']);
const VALID_LANE = new Set(['public-entry', 'authenticated-preview']);
const VALID_ACTION_CLASS = new Set(['safe-in-place', 'review-then-cancel', 'human-only']);
const SELECTOR = /^\[data-eon-[a-z0-9-]+\]$/;

const CONTROL_GROUPS = freeze([
  freeze({
    id: 'city-lifecycle',
    title: 'City lifecycle and recovery',
    actionClass: 'safe-in-place',
    automationSelectors: freeze([
      '[data-eon-play-pause]',
      '[data-eon-play-resume]',
      '[data-eon-play-reset-view]',
      '[data-eon-play-enter-fullscreen]',
      '[data-eon-play-exit-fullscreen]'
    ]),
    manualSelectors: freeze(['[data-eon-play-exit-city]']),
    expected: 'Pause/resume, reset and fullscreen requests remain explicit, reversible and leave local sound off unless separately enabled.'
  }),
  freeze({
    id: 'wayfinding-and-district-review',
    title: 'Wayfinding and the four-region vertical slice',
    actionClass: 'review-then-cancel',
    automationSelectors: freeze([
      '[data-eon-play-open-district-guide]',
      '[data-eon-play-close-guide]',
      '[data-eon-play-focus-authored-slice]',
      '[data-eon-play-close-authored-slice]'
    ]),
    manualSelectors: freeze([
      '[data-eon-play-landmark-enter]',
      '[data-eon-play-landmark-guide]',
      '[data-eon-play-landmark-inspect]',
      '[data-eon-play-landmark-quick-open]',
      '[data-eon-play-landmark-close]'
    ]),
    expected: 'Each landmark review is readable and any native work route is inspected then cancelled; no route is confirmed automatically.'
  }),
  freeze({
    id: 'companion-and-work-review',
    title: 'Companion, Command Deck and work review',
    actionClass: 'review-then-cancel',
    automationSelectors: freeze([
      '[data-eon-play-open-companion]',
      '[data-eon-play-close-companion]',
      '[data-eon-play-open-eonbot]',
      '[data-eon-play-close-eonbot]',
      '[data-eon-play-open-command-deck]',
      '[data-eon-play-close-command-deck]'
    ]),
    manualSelectors: freeze([
      '[data-eon-play-open-work]',
      '[data-eon-play-close-work]',
      '[data-eon-play-confirm-action]',
      '[data-eon-play-cancel-action]',
      '[data-eon-play-confirm-eonbot]',
      '[data-eon-play-cancel-eonbot]'
    ]),
    expected: 'EONBOT remains captions-first presentation; any work handoff opens a review and must be cancelled during automated proof.'
  }),
  freeze({
    id: 'visual-accessibility-and-sound-boundary',
    title: 'Visual, reduced-effects and explicit-sound boundary',
    actionClass: 'safe-in-place',
    automationSelectors: freeze([
      '[data-eon-play-open-settings]',
      '[data-eon-play-settings-quality]',
      '[data-eon-play-settings-open-sky]',
      '[data-eon-play-settings-reduced]',
      '[data-eon-play-close-settings]'
    ]),
    manualSelectors: freeze([
      '[data-eon-play-soundscape-enable]',
      '[data-eon-play-soundscape-mute]',
      '[data-eon-play-soundscape-stop]',
      '[data-eon-play-open-voice-consent]',
      '[data-eon-play-close-voice-consent]'
    ]),
    expected: 'Lite/reduced remains readable; sky styles are visual-only; sound and voice are reviewed as off-by-default without automated activation.'
  }),
  freeze({
    id: 'local-validation-and-proof-boundary',
    title: 'Manual validation and evidence boundary',
    actionClass: 'human-only',
    automationSelectors: freeze([
      '[data-eon-play-open-validation-lab]',
      '[data-eon-play-close-validation-lab]',
      '[data-eon-play-open-performance-lab]',
      '[data-eon-play-close-performance-lab]'
    ]),
    manualSelectors: freeze([
      '[data-eon-play-save-proof]',
      '[data-eon-play-performance-export]',
      '[data-eon-play-open-validation-device-lab]'
    ]),
    expected: 'The City may prepare local notes only; screenshots, device results, approval and release decisions stay separate human evidence.'
  })
]);

function normalizedQuality(value = 'balanced') {
  const quality = String(value || '').trim().toLowerCase();
  return VALID_QUALITY.has(quality) ? quality : 'balanced';
}

function normalizedLane(value = 'public-entry') {
  const lane = String(value || '').trim().toLowerCase();
  return VALID_LANE.has(lane) ? lane : 'public-entry';
}

function cloneGroup(group) {
  return freeze({
    id: group.id,
    title: group.title,
    actionClass: group.actionClass,
    automationSelectors: freeze([...group.automationSelectors]),
    manualSelectors: freeze([...group.manualSelectors]),
    expected: group.expected
  });
}

function regionReview(region) {
  return freeze({
    id: region.id,
    title: region.title,
    chapter: region.chapter,
    detail: region.detail,
    visualReviewRequired: true,
    inputReviewRequired: true,
    captureRequired: true,
    actionReviewRequired: region.id !== 'arrival-gate',
    sourceControlled: true,
    privateDataAllowed: false,
    routeConfirmationAllowed: false
  });
}

export function getEonCityCommandHorizonProofManifest({ quality = 'balanced', accessLane = 'public-entry' } = {}) {
  const resolvedQuality = normalizedQuality(quality);
  const resolvedLane = normalizedLane(accessLane);
  const slice = getCityAuthoredVerticalSlicePlan({ quality: resolvedQuality });
  const lane = W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT.accessLanes.find((entry) => entry.id === resolvedLane);
  return freeze({
    schema: EON_CITY_COMMAND_HORIZON_PROOF_SCHEMA,
    route: W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT.canonicalRoute,
    quality: resolvedQuality,
    accessLane: freeze({
      id: lane.id,
      requiresGoogleSession: lane.requiresGoogleSession,
      identityBypassAllowed: lane.identityBypassAllowed,
      humanGoogleSignInRequired: lane.requiresGoogleSession === true,
      heavyCityExpected: lane.heavyCityRequired
    }),
    verticalSlice: freeze({
      regionIds: freeze(slice.regions.map((region) => region.id)),
      regions: freeze(slice.regions.map(regionReview)),
      originalVectorArtOnly: slice.originalVectorArt === true,
      finalBinaryArt: slice.finalBinaryArt === true
    }),
    controlGroups: freeze(CONTROL_GROUPS.map(cloneGroup)),
    proofArtifacts: freeze(['screenshots', 'screen-recording', 'console-and-page-errors', 'failed-network-requests', 'pass-fail-notes']),
    requiredHumanChecks: freeze(['google-sign-in-bootstrap', 'captcha-or-consent-if-shown', 'real-device-touch-review', 'visual-review', 'release-decision']),
    automatedConfirmationAllowed: false,
    automaticCertification: false,
    automaticLaunchApproval: false,
    remoteTelemetry: false,
    remoteTestBypass: false,
    credentialsInSource: false,
    localSourceContractOnly: true
  });
}

export function getEonCityCommandHorizonProofControlGroups() {
  return freeze(CONTROL_GROUPS.map(cloneGroup));
}

export function validateEonCityCommandHorizonProofManifest(manifest = {}) {
  const errors = [];
  const value = manifest && typeof manifest === 'object' ? manifest : {};
  if (value.schema !== EON_CITY_COMMAND_HORIZON_PROOF_SCHEMA || value.route !== '/eoncity' || !VALID_QUALITY.has(value.quality)) errors.push('manifest-schema-route-or-quality-invalid');
  if (!VALID_LANE.has(value.accessLane?.id) || value.accessLane?.identityBypassAllowed !== false || typeof value.accessLane?.requiresGoogleSession !== 'boolean' || typeof value.accessLane?.humanGoogleSignInRequired !== 'boolean' || typeof value.accessLane?.heavyCityExpected !== 'boolean') errors.push('manifest-access-lane-invalid');
  const regionIds = value.verticalSlice?.regionIds || [];
  if (JSON.stringify(regionIds) !== JSON.stringify(W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT.requiredRegionIds)) errors.push('manifest-vertical-slice-regions-invalid');
  if (!Array.isArray(value.verticalSlice?.regions) || value.verticalSlice.regions.length !== 4 || value.verticalSlice.regions.some((region) => region.privateDataAllowed !== false || region.routeConfirmationAllowed !== false || region.visualReviewRequired !== true || region.inputReviewRequired !== true || region.captureRequired !== true)) errors.push('manifest-region-review-boundary-invalid');
  if (value.verticalSlice?.originalVectorArtOnly !== true || value.verticalSlice?.finalBinaryArt !== false) errors.push('manifest-art-boundary-invalid');
  const groupIds = (value.controlGroups || []).map((group) => group.id);
  if (JSON.stringify(groupIds) !== JSON.stringify(W575_COMMAND_HORIZON_LIVE_GAMEPLAY_CONTRACT.requiredControlGroupIds)) errors.push('manifest-control-groups-invalid');
  for (const group of value.controlGroups || []) {
    if (!VALID_ACTION_CLASS.has(group.actionClass) || !Array.isArray(group.automationSelectors) || !Array.isArray(group.manualSelectors) || ![...group.automationSelectors, ...group.manualSelectors].every((selector) => SELECTOR.test(selector))) errors.push(`manifest-control-group-invalid:${group.id || 'unknown'}`);
  }
  if (!Array.isArray(value.proofArtifacts) || value.proofArtifacts.length !== 5 || !Array.isArray(value.requiredHumanChecks) || !value.requiredHumanChecks.includes('google-sign-in-bootstrap')) errors.push('manifest-proof-artifacts-invalid');
  for (const key of ['automatedConfirmationAllowed', 'automaticCertification', 'automaticLaunchApproval', 'remoteTelemetry', 'remoteTestBypass', 'credentialsInSource']) {
    if (value[key] !== false) errors.push(`manifest-truth-${key}-invalid`);
  }
  if (value.localSourceContractOnly !== true) errors.push('manifest-source-only-invalid');
  return freeze(errors);
}

export function getEonCityCommandHorizonProofTruth() {
  return freeze({
    schema: EON_CITY_COMMAND_HORIZON_PROOF_SCHEMA,
    sourceControlledReviewInventory: true,
    publicGuestEntryLane: true,
    authenticatedPreviewLane: true,
    googleIdentityBypass: false,
    captchaAutomation: false,
    credentialsInSource: false,
    remoteTestBypass: false,
    automaticCertification: false,
    automaticLaunchApproval: false,
    liveGameplayProven: false,
    deviceProofProven: false,
    deploymentProven: false
  });
}

export const EON_CITY_COMMAND_HORIZON_PROOF_REGIONS = freeze(EON_CITY_AUTHORED_VERTICAL_SLICE_REGIONS.map(regionReview));
