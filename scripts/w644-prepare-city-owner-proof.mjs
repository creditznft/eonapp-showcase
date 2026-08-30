#!/usr/bin/env node
/**
 * Prepare the real W644 owner proof run. This script never signs in, reads
 * cookies/tokens or bypasses Google. The owner starts an already signed-in
 * Chrome/Edge profile with a loopback CDP endpoint, then runs this command.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cdp = String(process.env.EON_CITY_CDP_ENDPOINT || 'http://127.0.0.1:9222');
if (!/^http:\/\/(?:127\.0\.0\.1|localhost):\d{2,5}$/.test(cdp)) throw new Error('EON_CITY_CDP_ENDPOINT must be a loopback-only HTTP endpoint.');
const baseUrl = String(process.env.EON_CITY_AUTH_BASE_URL || '').replace(/\/$/, '');
if (!/^https:\/\//.test(baseUrl)) throw new Error('EON_CITY_AUTH_BASE_URL must be the exact HTTPS Preview deployment URL.');
const expected = String(process.env.EON_CITY_EXPECTED_BUILD_PROVENANCE || '');
if (!expected) throw new Error('EON_CITY_EXPECTED_BUILD_PROVENANCE must point to the exact candidate build-provenance.json.');

for (const script of ['scripts/w599-live-city-access-preflight.mjs', 'scripts/w599-run-authenticated-eoncity.mjs']) {
  const result = spawnSync(process.execPath, [script], { cwd: root, stdio: 'inherit', env: { ...process.env, EON_CITY_PUBLIC_URL: baseUrl, EON_CITY_AUTH_BASE_URL: baseUrl, EON_CITY_CDP_ENDPOINT: cdp, EON_CITY_EXPECTED_BUILD_PROVENANCE: expected } });
  if (result.status !== 0) process.exit(result.status || 1);
}

const output = path.join(root, 'reports/w644-city-owner-proof');
fs.mkdirSync(output, { recursive: true });
const template = {
  schema: 'eonapp.city-owner-certification.w644.v1', wave: 'W644', status: 'not-run', occurredAt: null,
  candidateDigest: null, commitSha: null, deploymentId: null, route: '/eoncity', releaseIdentityVisible: false,
  guestGate: { heavyRendererBlocked: false, identityRequired: false, cacheNoStore: false },
  authenticatedLane: { manualGoogleSignIn: true, signedIn: false, rendererBooted: false, credentialsCaptured: false, cookiesCaptured: false, tokensCaptured: false, bypassUsed: false },
  viewports: [], diagnostics: { pageErrors: null, consoleErrors: null, firstPartyHttpErrors: null, requestFailures: null, requestFailuresReviewed: false, unexplainedRequestFailures: null },
  interaction: { keyboardProof: false, pointerProof: false, mobileTouchProof: false, refreshRecovery: false, reducedMotionProof: false, resumeProof: false, commandRoomProof: false, eonbotWorkPathProof: false },
  performance: { firstUsableFrameMs: null, observedFpsP50: null, catastrophicLongTaskObserved: null, crashObserved: null },
  artifacts: [], ownerScores: [], ownerReviewed: false, ownerVisualApproval: false, redactionReviewed: false, secretsIncluded: false, personalIdentityIncluded: false, absolutePathsIncluded: false
};
fs.writeFileSync(path.join(output, 'owner-certification-template.json'), `${JSON.stringify(template, null, 2)}\n`);
console.log(`W644 automated evidence was collected. Owner scoring remains NOT-RUN. Complete ${path.relative(root, path.join(output, 'owner-certification-template.json'))} only after visual review.`);
