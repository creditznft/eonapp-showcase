#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

export const W766IR2_FINAL_CERTIFICATION_SCHEMA = 'eonapp.w766ir2.final-certification-gate.v2';
export const W766IR2_BROWSER_PROOF_SCHEMA = 'eonapp.w766ir2.preview-browser-proof.v1';
export const W766IR2_MONITOR_REVIEW_SCHEMA = 'eonapp.w766ir2.monitor-render-review.v1';

const DEFAULT_BROWSER_PROOFS = Object.freeze([
  Object.freeze({ id: 'runtime-stability-chrome', file: 'runtime-stability-chrome.json', browser: 'chrome', required: true }),
  Object.freeze({ id: 'runtime-stability-msedge', file: 'runtime-stability-msedge.json', browser: 'msedge', required: true }),
  Object.freeze({ id: 'command-actions-chrome', file: 'command-actions-chrome.json', browser: 'chrome', required: true }),
  Object.freeze({ id: 'command-actions-msedge', file: 'command-actions-msedge.json', browser: 'msedge', required: true }),
  Object.freeze({ id: 'monitor-rendering-chrome', file: 'monitor-rendering-chrome.json', browser: 'chrome', required: true, reviewFile: 'monitor-rendering-chrome-review.json' }),
  Object.freeze({ id: 'monitor-rendering-msedge', file: 'monitor-rendering-msedge.json', browser: 'msedge', required: true, reviewFile: 'monitor-rendering-msedge-review.json' }),
  Object.freeze({ id: 'mobile-controls-chrome', file: 'mobile-controls-chrome.json', browser: 'chrome', required: true }),
  Object.freeze({ id: 'core-offline-chrome', file: 'core-offline-chrome.json', browser: 'chrome', required: true }),
  Object.freeze({ id: 'asset-reuse-chrome', file: 'asset-reuse-chrome.json', browser: 'chrome', required: true, authenticated: true }),
  Object.freeze({ id: 'local-ai-offline-chrome', file: 'local-ai-offline-chrome.json', browser: 'chrome', required: true }),
  Object.freeze({ id: 'authenticated-full-offline-chrome', file: 'authenticated-full-offline-chrome.json', browser: 'chrome', required: false, authenticated: true })
]);

const read = (root, file) => fs.readFileSync(path.join(root, file), 'utf8');
const freeze = (value) => Object.freeze(value);

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function isPreviewBaseUrl(value = '') {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) && url.hostname !== 'eonapp.ch';
  } catch { return false; }
}

function claimsInclude(proof, keys = []) {
  return keys.every((key) => proof?.claims?.[key] === true);
}

function validateProofClaims(definition, proof) {
  if (definition.id.startsWith('runtime-stability-')) {
    return Number(proof?.cycles || 0) >= 20
      && Array.isArray(proof?.pageErrors) && proof.pageErrors.length === 0
      && Number(proof?.movement?.distance || 0) >= 0.32
      && proof?.finalState?.cameraFloorSafety?.ok === true
      && proof?.finalState?.lastPerformanceProtectionReason !== 'sustained-11-fps'
      && claimsInclude(proof, ['clickedVisibleLaunchers', 'runtimePreserved', 'preparationScreenUnchanged', 'movementReleased', 'postCycleMovementObserved', 'noFalseLowFpsProtection', 'cameraFloorSafe']);
  }
  if (definition.id.startsWith('command-actions-')) {
    return proof?.expanseMode === 'EXPANSE_ACTIVE'
      && proof?.finalWorldMode === 'COMMAND_HUB'
      && Number(proof?.postTransitMovement?.distance || 0) >= 0.32
      && Number(proof?.expanseMovement?.radialDistance || 0) > 26
      && Number(proof?.postReturnMovement?.distance || 0) >= 0.32
      && proof?.finalState?.cameraFloorSafety?.ok === true
      && proof?.finalState?.lastPerformanceProtectionReason !== 'sustained-11-fps'
      && claimsInclude(proof, [
        'clickedVisibleLaunchers', 'canonicalExpanseGate', 'relayOpened', 'transitReviewOpened',
        'physicalRelayInteractionClicked', 'physicalTransitInteractionClicked', 'physicalExpanseInteractionClicked',
        'expanseActive', 'expanseMovementBeyondHubRadius', 'returnedToCommandHub', 'postTransitMovementObserved',
        'postReturnMovementObserved', 'movementReleased', 'greyControlsCleared', 'runtimePreserved',
        'noFalseLowFpsProtection', 'cameraFloorSafe'
      ]);
  }
  if (definition.id.startsWith('monitor-rendering-')) {
    return Array.isArray(proof?.screenshots) && proof.screenshots.length === 2
      && proof.screenshots.every((entry) => entry && typeof entry.file === 'string' && /^[a-f0-9]{64}$/.test(String(entry.sha256 || '')) && Number(entry.bytes || 0) > 0)
      && claimsInclude(proof, ['tenIndependentFaces', 'sameWorkspaceInteraction', 'renderedReviewRequired']);
  }
  if (definition.id === 'mobile-controls-chrome') {
    return Number(proof?.cycles || 0) >= 5
      && Number.isFinite(Number(proof?.beforeTouch?.player?.x))
      && Number.isFinite(Number(proof?.afterTouch?.player?.x))
      && proof?.finalState?.cameraFloorSafety?.ok === true
      && claimsInclude(proof, ['clickedVisibleLaunchers', 'visibleTransitActionClicked', 'touchMovementObserved', 'runtimePreserved', 'movementReleased', 'cameraFloorSafe']);
  }
  if (definition.id === 'core-offline-chrome') {
    return Array.isArray(proof?.routes) && ['/', '/workspace', '/local-ai'].every((route) => proof.routes.includes(route))
      && claimsInclude(proof, ['hardOfflineReload', 'exactInventoryVerified', 'zeroRepeatDownloads', 'cloudWritesNotQueued']);
  }
  if (definition.id === 'asset-reuse-chrome') {
    return Number(proof?.network?.binaryResponses || 0) > 0
      && Number(proof?.network?.locallyServed || 0) > 0
      && Number(proof?.network?.originTransfers ?? -1) === 0
      && claimsInclude(proof, ['secondEntryObserved', 'binaryResponsesObserved', 'zeroCloudflareBinaryTransfers', 'stableBrowserCacheUsed']);
  }
  if (definition.id === 'local-ai-offline-chrome') {
    return proof?.localAi?.ok === true && Number(proof?.localAi?.status || 0) >= 200 && Number(proof?.localAi?.status || 0) < 300
      && proof?.localAi?.endpointClass === 'loopback'
      && Number(proof?.cloudFailure?.status || 0) === 503
      && claimsInclude(proof, ['publicOriginBlocked', 'offlineRouteLoaded', 'realLocalAiRequestSucceeded', 'cloudWritesNotQueued']);
  }
  if (definition.id === 'authenticated-full-offline-chrome') {
    return proof?.expanseMode === 'EXPANSE_ACTIVE'
      && claimsInclude(proof, ['hardOfflineCityReload', 'exactInventoryVerified', 'zeroRepeatDownloads', 'expanseAvailableOffline']);
  }
  return false;
}

function validateMonitorReview(definition, proof, browserEvidenceDir) {
  if (!definition.reviewFile) return Object.freeze({ ok: true, status: 'not-required' });
  const file = path.join(browserEvidenceDir, definition.reviewFile);
  if (!fs.existsSync(file)) return Object.freeze({ ok: false, status: 'pending', reason: 'render-review-missing' });
  try {
    const review = JSON.parse(fs.readFileSync(file, 'utf8'));
    const screenshots = Array.isArray(proof?.screenshots) ? proof.screenshots : [];
    const expectedHashes = screenshots.map((entry) => entry.sha256).sort();
    const reviewedHashes = Array.isArray(review?.screenshotSha256) ? review.screenshotSha256.map(String).sort() : [];
    const ok = review?.schema === W766IR2_MONITOR_REVIEW_SCHEMA
      && review?.proofId === `${definition.id}-review`
      && review?.browser === definition.browser
      && review?.ok === true
      && review?.frontReadable === true
      && review?.rearReadable === true
      && review?.noMirroredText === true
      && review?.allFiveWallsReviewed === true
      && review?.productionChanged === false
      && expectedHashes.length === 2
      && JSON.stringify(expectedHashes) === JSON.stringify(reviewedHashes);
    return Object.freeze({ ok, status: ok ? 'passed' : 'failed', reason: ok ? null : 'render-review-invalid', reviewedAt: String(review?.reviewedAt || ''), reviewer: String(review?.reviewer || '') });
  } catch (error) {
    return Object.freeze({ ok: false, status: 'failed', reason: `render-review-json-invalid:${String(error?.message || error)}` });
  }
}

function inspectBrowserEvidence(browserEvidenceDir) {
  return freeze(DEFAULT_BROWSER_PROOFS.map((definition) => {
    const absolute = path.join(browserEvidenceDir, definition.file);
    if (!fs.existsSync(absolute)) return freeze({ ...definition, status: 'pending', ok: false, reason: 'proof-file-missing' });
    try {
      const proof = JSON.parse(fs.readFileSync(absolute, 'utf8'));
      const screenshotsValid = !definition.reviewFile || proof.screenshots.every((entry) => {
        const screenshot = path.join(browserEvidenceDir, String(entry.file || ''));
        return fs.existsSync(screenshot) && sha256File(screenshot) === entry.sha256;
      });
      const review = validateMonitorReview(definition, proof, browserEvidenceDir);
      const generatedAt = Date.parse(String(proof?.generatedAt || ''));
      const ok = proof?.schema === W766IR2_BROWSER_PROOF_SCHEMA
        && proof?.proofId === definition.id
        && proof?.browser === definition.browser
        && proof?.ok === true
        && proof?.productionChanged === false
        && (!definition.authenticated || proof?.authenticated === true)
        && isPreviewBaseUrl(proof?.baseUrl)
        && Number.isFinite(generatedAt)
        && validateProofClaims(definition, proof)
        && screenshotsValid
        && review.ok;
      return freeze({
        ...definition,
        status: ok ? 'passed' : review.status === 'pending' ? 'pending' : 'failed',
        ok,
        reason: ok ? null : review.status === 'pending' ? review.reason : 'proof-contract-invalid',
        browser: String(proof?.browser || ''),
        baseUrl: String(proof?.baseUrl || ''),
        authenticated: proof?.authenticated === true,
        generatedAt: String(proof?.generatedAt || ''),
        review
      });
    } catch (error) {
      return freeze({ ...definition, status: 'failed', ok: false, reason: `proof-json-invalid:${String(error?.message || error)}` });
    }
  }));
}

export function inspectW766IR2FinalCertification({
  root = process.cwd(),
  browserEvidenceDir = path.join(root, 'reports', 'w766ir2', 'browser'),
  requireBrowser = false,
  requireAuthenticatedOffline = false
} = {}) {
  const files = {
    access: read(root, 'assets/js/city/eon-city-access-station.js'),
    identity: read(root, 'assets/js/city/eon-city-runtime-identity.js'),
    runtime: read(root, 'assets/js/city/w731/eon-city-w731-command-hub-runtime.js'),
    contract: read(root, 'assets/js/city/w731/eon-city-w731-command-hub-contract.js'),
    interactions: read(root, 'assets/js/city/w748/eon-city-w748-interaction-registry.js'),
    semanticMap: read(root, 'assets/js/city/w756/eon-city-w756-onboarding-navigation-accessibility.js'),
    inputLeases: read(root, 'assets/js/city/w766/eon-city-w766ir2-input-lock-leases.js'),
    monitors: read(root, 'assets/js/city/w750/eon-city-w750-command-centre.js'),
    convergence: read(root, 'assets/js/city/w760/eon-city-w760-w765-command-core-convergence.js'),
    worker: read(root, 'sw.js'),
    publicWorker: read(root, 'public/sw.js'),
    offlineManager: read(root, 'assets/js/eon-offline-manager.js'),
    offlineManifest: read(root, 'scripts/eon-offline-pack-manifest.mjs'),
    offlineCapability: read(root, 'functions/api/offline/capability.js'),
    e2e: read(root, 'tests/e2e/w766ir2-final-recovery.spec.ts'),
    contentAddress: read(root, 'scripts/eon-city-content-addressed-binaries.mjs'),
    buildProduction: read(root, 'scripts/build-production.mjs'),
    headers: read(root, '_headers'),
    publicHeaders: read(root, 'public/_headers'),
    persistentAssetTest: read(root, 'tests/unit/w766ir2-persistent-city-asset-cache.test.mjs'),
    offlineTest: read(root, 'tests/unit/w766ir2-whole-app-offline-pack.test.mjs')
  };

  const criteria = [];
  const check = (id, condition, evidence) => criteria.push(freeze({ id, passed: Boolean(condition), evidence }));

  check('runtime-remount-quarantined',
    !files.worker.includes('client.navigate(')
      && !files.publicWorker.includes('client.navigate(')
      && files.access.includes('eonCityPreparationScreenCount')
      && files.identity.includes('preparationScreenCount')
      && files.runtime.includes('getRuntimeIdentitySnapshot'),
    'No activation-time document navigation; preparation count and Engine/Scene/canvas/player/camera/render-loop identities are observable.');

  check('one-canonical-expanse-gate',
    files.contract.includes("id: 'expanse-gate'")
      && !files.contract.includes("id: 'archive-garden'")
      && !files.contract.includes("id: 'expanse-overlook'")
      && !files.interactions.includes('support:sealed-expanse-gateway')
      && files.convergence.includes('expanseSealed: false')
      && files.convergence.includes('expanseGateReviewRequired: true')
      && files.convergence.includes('expanseRuntimeReachable: true')
      && files.runtime.includes("state: 'EXPANSE_ENTRY_REVIEW'")
      && files.runtime.includes('data-eon-city-expanse-enter')
      && files.runtime.includes('data-eon-city-expanse-cancel'),
    'Hub contract exposes one Expanse Gate and routes through visible review, enter and cancel controls.');

  check('relay-transit-and-map-authority',
    files.contract.includes("id: 'maintenance-relay'")
      && files.runtime.includes("if (discovery.id === 'maintenance-relay') return openCityReadiness('maintenance-relay')")
      && files.runtime.includes("if (discovery.id === 'transit-overlook') return ui?.openTransitReview?.(trigger)")
      && files.runtime.includes("if (discovery.id === 'expanse-gate') return ui?.openExpanseReview?.(trigger)")
      && files.interactions.includes("discoveryId: 'transit-overlook'")
      && files.interactions.includes("discoveryId: 'maintenance-relay'")
      && files.semanticMap.includes('data-eon-city-semantic-open-readiness')
      && files.semanticMap.includes('data-eon-city-semantic-review-transit')
      && files.semanticMap.includes('data-eon-city-semantic-review-expanse')
      && files.semanticMap.includes('Outside destinations'),
    'Physical discoveries and the accessible map route Relay, Transit and Expanse through maintained review/readiness controllers.');

  check('named-input-lock-leases',
    ['city-menu', 'accessible-map', 'transit-review', 'work-surface', 'expanse-entry-review', 'city-readiness']
      .every((owner) => files.inputLeases.includes(`'${owner}'`))
      && files.runtime.includes('inputLocks: inputLockManager.getSnapshot()')
      && files.runtime.includes('releaseInputLease'),
    'One observable lease authority owns all movement-blocking surfaces and explicit release paths.');

  check('accessible-controls-themed',
    files.semanticMap.includes('appearance:none!important')
      && files.semanticMap.includes('background:linear-gradient')
      && files.semanticMap.includes(':focus-visible')
      && files.semanticMap.includes('@media(forced-colors:active)')
      && files.semanticMap.includes('aria-busy=true'),
    'Map controls override native grey styling and include hover, active, focus, disabled, busy and forced-colour states.');

  check('five-monitors-dual-readable-faces',
    files.monitors.includes('sideOrientation: 0')
      && files.monitors.includes('dualReadableFaces')
      && files.monitors.includes('faceCount')
      && files.monitors.includes('independentTextures')
      && files.monitors.includes('sameWorkspaceInteraction')
      && files.runtime.includes('setCommandCentreMonitorProofView')
      && !files.monitors.includes('sideOrientation: 2'),
    'Five W750 walls expose ten independent front-facing interactive monitor faces without double-sided text planes.');

  check('stable-delta-city-assets',
    files.worker.includes("PERSISTENT_CITY_ASSET_CACHE = 'eonapp-city-assets-v1'")
      && files.worker.includes('reusedEntries')
      && files.worker.includes('downloadedEntries')
      && files.worker.includes('immutable\\/')
      && files.worker === files.publicWorker
      && files.contentAddress.includes('contentAddressEonCityBinaries')
      && files.contentAddress.includes('removeOriginals')
      && files.contentAddress.includes('auditEonCityContentAddressedDist')
      && files.buildProduction.includes('contentAddressEonCityBinaries({ distDir: DIST, removeOriginals: true })')
      && files.headers.includes('/assets/city/immutable/*')
      && files.headers === files.publicHeaders
      && files.persistentAssetTest.includes('without another fetch'),
    'Every emitted City binary is content-addressed, originals are removed, immutable headers apply, and one release-stable browser cache reports reused versus downloaded entries.');

  check('offline-pack-exact-inventory',
    files.worker.includes('packCacheUrls')
      && files.worker.includes('persistentCityUrls')
      && files.worker.includes('missingPackEntries')
      && files.worker.includes('unexpectedPackEntries')
      && files.worker.includes('packCacheInventoryVerified')
      && files.offlineTest.includes('wrong cached URLs even when the total entry count is unchanged'),
    'Offline readiness compares exact expected URLs rather than trusting cache counts, and detects missing, substituted or unexpected entries.');

  check('whole-app-offline-local-ai',
    files.offlineManifest.includes("EON_OFFLINE_PACK_IDS = Object.freeze(['core', 'city'])")
      && files.offlineCapability.includes('manifestDigest')
      && files.worker.includes('EONAPP_OFFLINE_PACK_INSTALL')
      && files.worker.includes('cloudActionQueued: false')
      && files.worker.includes('isLoopbackUrl')
      && files.offlineManager.includes("hostname === 'localhost'")
      && files.offlineManager.includes("hostname === '127.0.0.1'"),
    'Explicit verified core/full packs support offline hard reload while cloud writes fail truthfully and Local AI loopback bypasses caching.');

  check('preview-browser-matrix-authored',
    files.e2e.includes('20 Menu and accessible-map cycles preserve one Babylon runtime')
      && files.e2e.includes('Gate, Relay and Transit use maintained controllers and release movement')
      && files.e2e.includes('five Command Centre walls expose ten readable interactive faces')
      && files.e2e.includes('mobile controls release movement after Menu, Map and Transit cycles')
      && files.e2e.includes('core EONAPP pack hard-reloads offline and does not queue cloud writes')
      && files.e2e.includes('unchanged City binaries create zero origin transfers on a second authenticated browser entry')
      && files.e2e.includes('reaches a real localhost Local AI runtime')
      && files.e2e.includes('authenticated full pack hard-reloads EON City and reuses unchanged bytes')
      && files.e2e.includes("page.locator('[data-eon-city-menu-open]')")
      && files.e2e.includes("page.locator('[data-eon-city-semantic-map-open]')")
      && files.e2e.includes('guideToPhysicalDiscovery')
      && files.e2e.includes('data-eon-city-command-prompt')
      && files.e2e.includes('data-eon-expanse-ui="return-hub"')
      && files.e2e.includes('proveExpanseMovementBeyondHubRadius')
      && files.e2e.includes('postTransitMovementObserved')
      && files.e2e.includes('noFalseLowFpsProtection')
      && files.e2e.includes('cameraFloorSafe')
      && files.e2e.includes('data-eon-city-move="forward"')
      && !files.e2e.includes('openCityMenu?.')
      && !files.e2e.includes('openAccessibleCityMap?.')
      && !files.e2e.includes('openTransitReview?.')
      && files.e2e.includes('Network.responseReceived')
      && files.e2e.includes('EONAPP_W766IR2_LOCAL_AI_URL')
      && files.e2e.includes('captureEvidenceScreenshot')
      && files.e2e.includes('for (let cycle = 0; cycle < 20; cycle += 1)')
      && files.e2e.includes('EONAPP_W766IR2_AUTHENTICATED_OFFLINE_PROOF'),
    'Preview suite clicks visible controls and requires runtime, action, rendered monitor, mobile, core offline, zero-origin-transfer, real Local AI and authenticated full-offline evidence.');

  const sourceFailures = criteria.filter((entry) => !entry.passed);
  const browserProofs = inspectBrowserEvidence(browserEvidenceDir);
  const requiredBrowserProofs = browserProofs.filter((entry) => entry.required);
  const browserCertified = requiredBrowserProofs.every((entry) => entry.ok);
  const authenticatedOfflineCertified = browserProofs.find((entry) => entry.id === 'authenticated-full-offline-chrome')?.ok === true;
  const browserGateSatisfied = !requireBrowser || browserCertified;
  const authenticatedGateSatisfied = !requireAuthenticatedOffline || authenticatedOfflineCertified;
  const sourceReady = sourceFailures.length === 0;
  const ok = sourceReady && browserGateSatisfied && authenticatedGateSatisfied;

  return freeze({
    schema: W766IR2_FINAL_CERTIFICATION_SCHEMA,
    generatedAt: new Date().toISOString(),
    ok,
    sourceReady,
    sourceCriteria: freeze(criteria),
    sourceFailures: freeze(sourceFailures),
    browserEvidenceDir,
    browserCertified,
    authenticatedOfflineCertified,
    browserProofs,
    requirements: freeze({ requireBrowser, requireAuthenticatedOffline }),
    authority: freeze({
      previewDeploymentPerformed: false,
      productionDeploymentPerformed: false,
      productionChanged: false,
      rollbackChanged: false
    }),
    decision: sourceReady
      ? browserCertified
        ? authenticatedOfflineCertified
          ? 'Source, Chrome, Edge, mobile, core-offline and authenticated full-offline Preview evidence pass. Owner review and explicit production approval remain separate.'
          : 'Source, Chrome, Edge, mobile and core-offline Preview evidence pass. Authenticated full City/Expanse offline proof remains pending.'
        : 'Source is ready for a built Preview. Rendered Chrome/Edge, mobile and offline hard-reload evidence remain pending.'
      : 'Source certification failed. Do not build or deploy until every source criterion passes.'
  });
}

function main() {
  const requireBrowser = process.argv.includes('--require-browser');
  const requireAuthenticatedOffline = process.argv.includes('--require-authenticated-offline');
  const report = inspectW766IR2FinalCertification({ requireBrowser, requireAuthenticatedOffline });
  const output = path.join(process.cwd(), 'reports', 'w766ir2', 'W766IR2_FINAL_CERTIFICATION_GATE.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  const summary = {
    ok: report.ok,
    sourceReady: report.sourceReady,
    sourceCriteriaPassed: report.sourceCriteria.filter((entry) => entry.passed).length,
    sourceCriteriaTotal: report.sourceCriteria.length,
    browserCertified: report.browserCertified,
    authenticatedOfflineCertified: report.authenticatedOfflineCertified,
    report: path.relative(process.cwd(), output),
    decision: report.decision
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!report.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
