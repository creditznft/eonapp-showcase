import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  inspectW766IR2FinalCertification,
  W766IR2_BROWSER_PROOF_SCHEMA,
  W766IR2_FINAL_CERTIFICATION_SCHEMA,
  W766IR2_MONITOR_REVIEW_SCHEMA
} from '../../scripts/w766ir2-final-certification-gate.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function proofFixture(proofId) {
  const browser = proofId.endsWith('-msedge') ? 'msedge' : 'chrome';
  const common = { claims: {} };
  if (proofId.startsWith('runtime-stability-')) return {
    ...common,
    cycles: 20,
    pageErrors: [],
    movement: { distance: 0.75 },
    finalState: { cameraFloorSafety: { ok: true }, lastPerformanceProtectionReason: '' },
    claims: { clickedVisibleLaunchers: true, runtimePreserved: true, preparationScreenUnchanged: true, movementReleased: true, postCycleMovementObserved: true, noFalseLowFpsProtection: true, cameraFloorSafe: true }
  };
  if (proofId.startsWith('command-actions-')) return {
    ...common,
    expanseMode: 'EXPANSE_ACTIVE',
    finalWorldMode: 'COMMAND_HUB',
    postTransitMovement: { distance: 0.8 },
    expanseMovement: { radialDistance: 31 },
    postReturnMovement: { distance: 0.9 },
    finalState: { cameraFloorSafety: { ok: true }, lastPerformanceProtectionReason: '' },
    claims: {
      clickedVisibleLaunchers: true, canonicalExpanseGate: true, relayOpened: true, transitReviewOpened: true,
      physicalRelayInteractionClicked: true, physicalTransitInteractionClicked: true, physicalExpanseInteractionClicked: true,
      expanseActive: true, expanseMovementBeyondHubRadius: true, returnedToCommandHub: true, postTransitMovementObserved: true,
      postReturnMovementObserved: true, movementReleased: true, greyControlsCleared: true, runtimePreserved: true,
      noFalseLowFpsProtection: true, cameraFloorSafe: true
    }
  };
  if (proofId.startsWith('monitor-rendering-')) return { ...common, browser, claims: { tenIndependentFaces: true, sameWorkspaceInteraction: true, renderedReviewRequired: true } };
  if (proofId === 'mobile-controls-chrome') return {
    ...common,
    cycles: 5,
    beforeTouch: { player: { x: 0, z: 0 } },
    afterTouch: { player: { x: 1, z: 0 } },
    finalState: { cameraFloorSafety: { ok: true } },
    claims: { clickedVisibleLaunchers: true, visibleTransitActionClicked: true, touchMovementObserved: true, runtimePreserved: true, movementReleased: true, cameraFloorSafe: true }
  };
  if (proofId === 'core-offline-chrome') return { ...common, routes: ['/', '/workspace', '/local-ai'], claims: { hardOfflineReload: true, exactInventoryVerified: true, zeroRepeatDownloads: true, cloudWritesNotQueued: true } };
  if (proofId === 'asset-reuse-chrome') return { ...common, authenticated: true, network: { binaryResponses: 2, locallyServed: 2, originTransfers: 0 }, claims: { secondEntryObserved: true, binaryResponsesObserved: true, zeroCloudflareBinaryTransfers: true, stableBrowserCacheUsed: true } };
  if (proofId === 'local-ai-offline-chrome') return { ...common, localAi: { ok: true, status: 200, endpointClass: 'loopback' }, cloudFailure: { status: 503 }, claims: { publicOriginBlocked: true, offlineRouteLoaded: true, realLocalAiRequestSucceeded: true, cloudWritesNotQueued: true } };
  if (proofId === 'authenticated-full-offline-chrome') return { ...common, authenticated: true, expanseMode: 'EXPANSE_ACTIVE', claims: { hardOfflineCityReload: true, exactInventoryVerified: true, zeroRepeatDownloads: true, expanseAvailableOffline: true } };
  throw new Error(`Unknown proof fixture: ${proofId}`);
}

function writeProof(directory, proofId, extra = {}) {
  fs.mkdirSync(directory, { recursive: true });
  const browser = proofId.endsWith('-msedge') ? 'msedge' : 'chrome';
  const fixture = proofFixture(proofId);
  const proof = {
    schema: W766IR2_BROWSER_PROOF_SCHEMA,
    proofId,
    ok: true,
    browser,
    baseUrl: 'https://preview.example.invalid',
    authenticated: fixture.authenticated === true,
    productionChanged: false,
    generatedAt: new Date().toISOString(),
    ...fixture,
    ...extra
  };
  if (proofId.startsWith('monitor-rendering-')) {
    const screenshots = ['front', 'rear'].map((view) => {
      const file = `${proofId}-${view}.png`;
      const body = Buffer.from(`${proofId}:${view}`);
      fs.writeFileSync(path.join(directory, file), body);
      return { file, sha256: crypto.createHash('sha256').update(body).digest('hex'), bytes: body.byteLength };
    });
    proof.screenshots = screenshots;
    fs.writeFileSync(path.join(directory, `${proofId}-review.json`), `${JSON.stringify({
      schema: W766IR2_MONITOR_REVIEW_SCHEMA,
      proofId: `${proofId}-review`,
      browser,
      ok: true,
      frontReadable: true,
      rearReadable: true,
      noMirroredText: true,
      allFiveWallsReviewed: true,
      screenshotSha256: screenshots.map((entry) => entry.sha256),
      reviewer: 'test-reviewer',
      reviewedAt: new Date().toISOString(),
      productionChanged: false
    }, null, 2)}\n`);
  }
  fs.writeFileSync(path.join(directory, `${proofId}.json`), `${JSON.stringify(proof, null, 2)}\n`);
}

test('W766IR2-F source gate passes without pretending Preview or production certification occurred', () => {
  const browserEvidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'w766ir2-pending-'));
  const report = inspectW766IR2FinalCertification({ root, browserEvidenceDir });
  assert.equal(report.schema, W766IR2_FINAL_CERTIFICATION_SCHEMA);
  assert.equal(report.sourceReady, true, report.sourceFailures.map((entry) => entry.id).join(', '));
  assert.equal(report.sourceCriteria.length, 10);
  assert.equal(report.browserCertified, false);
  assert.equal(report.authenticatedOfflineCertified, false);
  assert.equal(report.ok, true, 'source-only gate should pass while clearly marking browser proof pending');
  assert.equal(report.authority.previewDeploymentPerformed, false);
  assert.equal(report.authority.productionDeploymentPerformed, false);
  assert.equal(report.authority.productionChanged, false);
  assert.match(report.decision, /built Preview/i);
});

test('W766IR2-F fail-closed browser mode rejects missing, malformed or production-changing proof', () => {
  const browserEvidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'w766ir2-invalid-'));
  writeProof(browserEvidenceDir, 'runtime-stability-chrome');
  writeProof(browserEvidenceDir, 'runtime-stability-msedge');
  writeProof(browserEvidenceDir, 'command-actions-chrome');
  writeProof(browserEvidenceDir, 'command-actions-msedge');
  writeProof(browserEvidenceDir, 'monitor-rendering-chrome', { productionChanged: true });
  writeProof(browserEvidenceDir, 'monitor-rendering-msedge');
  writeProof(browserEvidenceDir, 'mobile-controls-chrome');
  fs.writeFileSync(path.join(browserEvidenceDir, 'core-offline-chrome.json'), '{broken');
  const report = inspectW766IR2FinalCertification({ root, browserEvidenceDir, requireBrowser: true });
  assert.equal(report.sourceReady, true);
  assert.equal(report.browserCertified, false);
  assert.equal(report.ok, false);
  assert.ok(report.browserProofs.some((entry) => entry.status === 'failed'));
  assert.ok(report.browserProofs.some((entry) => entry.status === 'pending'));
});

test('W766IR2-F accepts only the complete Preview proof matrix and authenticated full-offline receipt', () => {
  const browserEvidenceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'w766ir2-complete-'));
  for (const proofId of ['runtime-stability-chrome', 'runtime-stability-msedge', 'command-actions-chrome', 'command-actions-msedge', 'monitor-rendering-chrome', 'monitor-rendering-msedge', 'mobile-controls-chrome', 'core-offline-chrome', 'asset-reuse-chrome', 'local-ai-offline-chrome', 'authenticated-full-offline-chrome']) {
    writeProof(browserEvidenceDir, proofId);
  }
  const report = inspectW766IR2FinalCertification({
    root,
    browserEvidenceDir,
    requireBrowser: true,
    requireAuthenticatedOffline: true
  });
  assert.equal(report.sourceReady, true);
  assert.equal(report.browserCertified, true);
  assert.equal(report.authenticatedOfflineCertified, true);
  assert.equal(report.ok, true);
  assert.equal(report.browserProofs.every((entry) => entry.status === 'passed'), true);
  assert.equal(report.authority.productionChanged, false);
});
