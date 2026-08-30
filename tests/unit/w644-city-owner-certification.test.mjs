import test from 'node:test';
import assert from 'node:assert/strict';
import { W644_CITY_ARTIFACT_SCHEMA, W644_CITY_OWNER_RECEIPT_SCHEMA, W644_CITY_REQUIRED_CATEGORIES, validateW644CityOwnerCertificationContract } from '../../config/w644-city-owner-certification-contract.mjs';
import { evaluateW644CityOwnerCertification, validateW644CityOwnerReceipt } from '../../scripts/lib/w644-city-owner-certification.mjs';

const H = 'a'.repeat(64);
const C = 'b'.repeat(40);
const artifacts = [
  ['screenshot','desktop.png'], ['screenshot','portrait.png'], ['screenshot','landscape.png'],
  ['screen-recording','owner-tour.webm'], ['diagnostic-json','diagnostics.json'], ['performance-json','performance.json']
].map(([kind,label]) => ({ schema: W644_CITY_ARTIFACT_SCHEMA, kind, label, sha256: H, bytes: 1000, redactionReviewed: true }));
const receipt = {
  schema: W644_CITY_OWNER_RECEIPT_SCHEMA, wave: 'W644', status: 'pass', occurredAt: '2026-07-11T12:00:00.000Z',
  candidateDigest: H, commitSha: C, deploymentId: 'preview-deploy-123', route: '/eoncity', releaseIdentityVisible: true,
  guestGate: { heavyRendererBlocked: true, identityRequired: true, cacheNoStore: true },
  authenticatedLane: { manualGoogleSignIn: true, signedIn: true, rendererBooted: true, credentialsCaptured: false, cookiesCaptured: false, tokensCaptured: false, bypassUsed: false },
  viewports: [
    { id:'desktop-1440x900', canvasVisible:true, hudUsable:true, noBlockingOverflow:true, touchControlsUsable:false },
    { id:'mobile-portrait-390x844', canvasVisible:true, hudUsable:true, noBlockingOverflow:true, touchControlsUsable:true },
    { id:'mobile-landscape-844x390', canvasVisible:true, hudUsable:true, noBlockingOverflow:true, touchControlsUsable:true }
  ],
  diagnostics: { pageErrors:0, consoleErrors:0, firstPartyHttpErrors:0, requestFailures:0, requestFailuresReviewed:true, unexplainedRequestFailures:0 },
  interaction: { keyboardProof:true, pointerProof:true, mobileTouchProof:true, refreshRecovery:true, reducedMotionProof:true, resumeProof:true, commandRoomProof:true, eonbotWorkPathProof:true },
  performance: { firstUsableFrameMs:4200, observedFpsP50:54, catastrophicLongTaskObserved:false, crashObserved:false },
  artifacts,
  ownerScores: W644_CITY_REQUIRED_CATEGORIES.map((id, index) => ({ id, score: index === 0 ? 9.5 : 9.6, ownerNote: `Owner reviewed ${id} in the real candidate.` })),
  ownerReviewed:true, ownerVisualApproval:true, redactionReviewed:true, secretsIncluded:false, personalIdentityIncluded:false, absolutePathsIncluded:false
};

test('contract requires manual Google access and 9.5 owner score', () => assert.equal(validateW644CityOwnerCertificationContract().ok, true));
test('valid owner receipt passes all evidence boundaries', () => { const result=validateW644CityOwnerReceipt(receipt); assert.equal(result.ok,true); assert.ok(result.overallScore>=9.5); });
test('typed pass without owner scores cannot certify', () => assert.equal(validateW644CityOwnerReceipt({...receipt,ownerScores:[]}).ok,false));
test('a category below 9.0 is NO-GO', () => assert.equal(validateW644CityOwnerReceipt({...receipt,ownerScores:receipt.ownerScores.map((row,index)=>index?row:{...row,score:8.9})}).ok,false));
test('identity capture or access bypass is NO-GO', () => assert.equal(validateW644CityOwnerReceipt({...receipt,authenticatedLane:{...receipt.authenticatedLane,cookiesCaptured:true}}).ok,false));
test('console and first-party errors are fail closed', () => assert.equal(validateW644CityOwnerReceipt({...receipt,diagnostics:{...receipt.diagnostics,consoleErrors:1}}).ok,false));
test('board requires explicit production pass plus valid receipt', () => { assert.equal(evaluateW644CityOwnerCertification({productionVerdict:'pass',ownerReviewed:true,receipt}).pass,true); assert.equal(evaluateW644CityOwnerCertification({productionVerdict:'not-run',ownerReviewed:true,receipt}).pass,false); });
