/**
 * W457.1 — EON City mobile and Share Pack evidence packet.
 *
 * This module turns the already-shipped local mobile modes, cinematic review
 * views and share boundaries into one portable, human-operated checklist.
 * It does not probe a phone, capture pixels, inspect a clipboard, call native
 * share, save device identity, upload evidence, or infer a pass.
 */
import { getCityCinematicShots } from './eon-city-art-review.js';
import { CITY_PERFORMANCE_LAB_CASES } from './eon-city-performance-lab.js';
import { CITY_VALIDATION_LAB_CASES } from './eon-city-validation-lab.js';
import { getEonRemixCardTruth } from '../share/eon-remix-card.js';
import { getEonSharePackTruth } from '../share/eon-share-pack.js';

export const EON_CITY_MOBILE_SHARE_PROOF_SCHEMA = 'eon.city.mobile-share-proof.w457.1.v1';

const freeze = (value) => Object.freeze(value);

const caseItem = (entry) => freeze({ ...entry, required: true, manualOnly: true, status: 'not-run' });

export const EON_CITY_MOBILE_SHARE_DEVICE_CASES = freeze([
  caseItem({
    id: 'android-portrait-companion',
    platform: 'android',
    label: 'Android portrait Companion',
    detail: 'Open /eoncity in portrait. Confirm the intentional Companion appears instead of a cramped desktop HUD, with no clipped primary action.'
  }),
  caseItem({
    id: 'android-landscape-explore-rotation',
    platform: 'android',
    label: 'Android landscape Explore + rotation',
    detail: 'Use the explicit Landscape Explore action, rotate between modes, then confirm touch controls, safe areas and a stable return path.'
  }),
  caseItem({
    id: 'ios-portrait-companion',
    platform: 'ios-safari',
    label: 'iOS Safari portrait Companion',
    detail: 'Confirm Companion layout, safe-area spacing, text scale and the explicit Explore choice on a real iPhone or iPad Safari session.'
  }),
  caseItem({
    id: 'ios-landscape-touch-exit',
    platform: 'ios-safari',
    label: 'iOS Safari landscape touch + exit',
    detail: 'Confirm joystick/camera gestures, menu, reset, full-screen best effort, exit and City Lite recovery in landscape.'
  }),
  caseItem({
    id: 'keyboard-controller-fullscreen',
    platform: 'desktop-or-tablet',
    label: 'Keyboard, controller and fullscreen recovery',
    detail: 'Confirm keyboard, optional controller, visible fullscreen request, escape/exit and no hidden automatic navigation.'
  })
]);

export const EON_CITY_MOBILE_SHARE_PRIVACY_CASES = freeze([
  caseItem({
    id: 'manual-cinematic-view-selection',
    label: 'Manual cinematic view selection',
    detail: 'Apply each supplied local cinematic view as needed. EONAPP does not take a screenshot or video; any browser/device capture is a separate deliberate tester action.'
  }),
  caseItem({
    id: 'share-pack-copy-redaction',
    label: 'Share Pack copy and export redaction',
    detail: 'Create a harmless test Share Pack/Remix Card. Inspect copied/exported text for no prompts, files, credentials, private links, account state or hidden City data.'
  }),
  caseItem({
    id: 'native-share-cancel-boundary',
    label: 'Native share cancel boundary',
    detail: 'Open then cancel native share where supported. Confirm no post, account connection, schedule, tracking event, reward or success claim appears.'
  }),
  caseItem({
    id: 'manual-postcard-destination-review',
    label: 'Manual postcard destination review',
    detail: 'Review every destination yourself before sending. EONAPP prepares text only and cannot verify a post, recipient, reach or outcome.'
  })
]);

function copyCinematicView(entry = {}) {
  return freeze({
    id: String(entry.id || ''),
    title: String(entry.title || ''),
    detail: String(entry.detail || ''),
    accent: String(entry.accent || ''),
    localOnly: entry.localOnly === true,
    opensRoute: entry.opensRoute === false,
    capturesMedia: entry.capturesMedia === false,
    uploadsMedia: entry.uploadsMedia === false,
    finalVisualCertification: entry.finalVisualCertification === false,
    manualCaptureOnly: true
  });
}

function referenceCases(items = []) {
  return freeze(items.map((entry) => freeze({ id: String(entry.id || ''), label: String(entry.label || ''), required: entry.required === true })));
}

/**
 * Builds a source-derived packet. The packet deliberately begins pending and
 * contains instructions only; a person must perform, record and independently
 * review real device evidence elsewhere.
 */
export function createCityMobileShareProofPacket() {
  const cinematicViews = freeze(getCityCinematicShots().map(copyCinematicView));
  const sharePackTruth = getEonSharePackTruth();
  const remixCardTruth = getEonRemixCardTruth();
  return freeze({
    schema: EON_CITY_MOBILE_SHARE_PROOF_SCHEMA,
    status: 'manual-evidence-pending',
    sourceOnly: true,
    deviceCases: EON_CITY_MOBILE_SHARE_DEVICE_CASES,
    sharePrivacyCases: EON_CITY_MOBILE_SHARE_PRIVACY_CASES,
    cinematicViews,
    relatedManualEvidence: freeze({
      validationLabCases: referenceCases(CITY_VALIDATION_LAB_CASES),
      performanceLabCases: referenceCases(CITY_PERFORMANCE_LAB_CASES)
    }),
    shareBoundaries: freeze({
      sharePack: freeze({
        localPageSessionOnly: sharePackTruth.localPageSessionOnly === true,
        providerCallsBlocked: sharePackTruth.providerCalls === false,
        directPublishingBlocked: sharePackTruth.directPublishing === false,
        oauthConnectionsBlocked: sharePackTruth.oauthConnections === false,
        trackingBlocked: sharePackTruth.tracking === false,
        referralRewardBlocked: sharePackTruth.referralReward === false
      }),
      remixCard: freeze({
        localPageSessionOnly: remixCardTruth.localPageSessionOnly === true,
        publicHostingBlocked: remixCardTruth.publicHosting === false,
        directPublishingBlocked: remixCardTruth.directPublishing === false,
        oauthConnectionsBlocked: remixCardTruth.oauthConnections === false,
        trackingBlocked: remixCardTruth.tracking === false,
        referralRewardBlocked: remixCardTruth.referralReward === false
      })
    }),
    truth: getCityMobileShareProofTruth()
  });
}

/** Creates a deliberate local-file export. No test/device data is read. */
export function buildCityMobileShareProofExport(packet = createCityMobileShareProofPacket(), { now = Date.now() } = {}) {
  const safe = packet?.schema === EON_CITY_MOBILE_SHARE_PROOF_SCHEMA ? packet : createCityMobileShareProofPacket();
  return JSON.stringify({
    schema: EON_CITY_MOBILE_SHARE_PROOF_SCHEMA,
    exportedAt: new Date(Number(now) || Date.now()).toISOString(),
    scope: 'manual-android-ios-city-and-share-boundary-evidence',
    status: safe.status,
    deviceCases: safe.deviceCases,
    sharePrivacyCases: safe.sharePrivacyCases,
    cinematicViews: safe.cinematicViews,
    relatedManualEvidence: safe.relatedManualEvidence,
    shareBoundaries: safe.shareBoundaries,
    proofBoundary: safe.truth
  }, null, 2);
}

export function getCityMobileShareProofTruth() {
  return freeze({
    schema: EON_CITY_MOBILE_SHARE_PROOF_SCHEMA,
    localExportOnly: true,
    phoneProbeCreated: false,
    deviceIdentityRead: false,
    screenshotCaptureCreated: false,
    videoCaptureCreated: false,
    clipboardRead: false,
    nativeShareOpened: false,
    remoteTelemetryCreated: false,
    remoteEvidenceUploadCreated: false,
    autoPosting: false,
    oauthConnections: false,
    trackingCreated: false,
    referralRewardCreated: false,
    automaticPass: false,
    deviceCertification: false,
    releaseApproval: false
  });
}

export function validateCityMobileShareProofPacket(packet = createCityMobileShareProofPacket()) {
  const errors = [];
  const ids = new Set();
  for (const entry of [...EON_CITY_MOBILE_SHARE_DEVICE_CASES, ...EON_CITY_MOBILE_SHARE_PRIVACY_CASES]) {
    if (!/^[a-z0-9-]{4,72}$/.test(entry.id || '') || ids.has(entry.id)) errors.push(`Invalid or duplicate proof case: ${entry.id || 'unknown'}.`);
    ids.add(entry.id);
    if (entry.required !== true || entry.manualOnly !== true || entry.status !== 'not-run') errors.push(`Proof case ${entry.id || 'unknown'} must remain manual and pending.`);
  }
  const views = Array.isArray(packet?.cinematicViews) ? packet.cinematicViews : [];
  if (packet?.schema !== EON_CITY_MOBILE_SHARE_PROOF_SCHEMA || packet?.status !== 'manual-evidence-pending') errors.push('Proof packet must remain source-only and pending.');
  if (views.length < 6 || views.some((view) => view.localOnly !== true || view.opensRoute !== true || view.capturesMedia !== true || view.uploadsMedia !== true || view.finalVisualCertification !== true || view.manualCaptureOnly !== true)) errors.push('Cinematic review views must remain local, non-capturing and manual-only.');
  const truth = getCityMobileShareProofTruth();
  if (Object.values(truth).some((value) => value === true && value !== truth.localExportOnly)) errors.push('Proof packet cannot create device, media, network or release evidence automatically.');
  return freeze({ schema: EON_CITY_MOBILE_SHARE_PROOF_SCHEMA, ok: errors.length === 0, errors: freeze(errors), sourceOnly: true, localExportOnly: true });
}
