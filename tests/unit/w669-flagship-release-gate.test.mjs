import assert from 'node:assert/strict';
import test from 'node:test';
import {
  W669_EVIDENCE_LANES,
  W669_FLAGSHIP_RECEIPT_SCHEMA,
  W669_FLAGSHIP_RELEASE_CONTRACT,
  W669_REQUIRED_BROWSERS,
  W669_REQUIRED_DEVICES,
  W669_REQUIRED_REALMS,
  createW669OwnerReceiptTemplate,
  validateW669FlagshipReleaseContract,
  validateW669OwnerReceipt
} from '../../config/w669-flagship-release-contract.mjs';
import '../../scripts/w669-flagship-release-gate.mjs';

test('W669 keeps the 9.5 claim owner-scored and evidence-gated', () => {
  assert.equal(validateW669FlagshipReleaseContract().ok, true);
  assert.equal(W669_FLAGSHIP_RELEASE_CONTRACT.quality.overallMinimum, 9.5);
  assert.equal(W669_FLAGSHIP_RELEASE_CONTRACT.quality.criticalDefectsMaximum, 0);
  assert.equal(W669_FLAGSHIP_RELEASE_CONTRACT.quality.automationMayAssignScore, false);
  assert.equal(W669_FLAGSHIP_RELEASE_CONTRACT.releaseState, 'source-ready-human-proof-required');
});

test('W669 covers all recovery waves with separate human acceptance lanes', () => {
  assert.equal(W669_EVIDENCE_LANES.length, 7);
  assert.deepEqual(W669_EVIDENCE_LANES.map((lane) => lane.sourceWave), ['W664', 'W665', 'W666', 'W667', 'W668', 'W668C', 'W669']);
  assert.ok(W669_EVIDENCE_LANES.every((lane) => lane.minimumMinutes > 0 && lane.humanProof.length > 40));
});

test('W669 blank owner template cannot accidentally approve release', () => {
  const template = createW669OwnerReceiptTemplate();
  const result = validateW669OwnerReceipt(template);
  assert.equal(result.ok, false);
  assert.equal(result.releaseApproved, false);
  assert.ok(result.blockers.includes('evidence-lanes-incomplete'));
  assert.ok(result.blockers.includes('owner-go-required'));
  assert.ok(result.blockers.includes('overall-score-below-9.5'));
});

test('W669 accepts only a complete exact-candidate owner receipt', () => {
  const evidenceRows = (ids, field = 'evidenceRef') => ids.map((id) => ({ id, status: 'pass', [field]: `evidence/${id}.json`, screenshotDigest: 'a'.repeat(64) }));
  const receipt = {
    schema: W669_FLAGSHIP_RECEIPT_SCHEMA,
    candidate: { commitSha: 'a'.repeat(40), candidateDigest: 'b'.repeat(64), deploymentId: 'production-deployment-id', productionUrl: 'https://eonapp.ch' },
    evidence: {
      lanes: evidenceRows(W669_EVIDENCE_LANES.map((lane) => lane.id), 'recordingRef'),
      browsers: evidenceRows(W669_REQUIRED_BROWSERS),
      devices: evidenceRows(W669_REQUIRED_DEVICES),
      realms: evidenceRows(W669_REQUIRED_REALMS),
      diagnostics: { pageErrors: 0, consoleErrors: 0, firstPartyHttpErrors: 0, requestFailuresReviewed: true }
    },
    quality: {
      overallScore: 9.5,
      categoryScores: ['visual', 'controls', 'world', 'nexus', 'performance', 'mobile'].map((id) => ({ id, score: 9.2 })),
      criticalDefects: 0,
      ownerVisualApproval: true
    },
    ownerGo: true
  };
  const result = validateW669OwnerReceipt(receipt);
  assert.equal(result.ok, true, result.blockers.join(', '));
  assert.equal(result.releaseApproved, true);
});

test('W669 local source work requires neither Codex nor Actions artifacts', () => {
  assert.equal(W669_FLAGSHIP_RELEASE_CONTRACT.sourceAuthority.localFirst, true);
  assert.equal(W669_FLAGSHIP_RELEASE_CONTRACT.sourceAuthority.codexRequired, false);
  assert.equal(W669_FLAGSHIP_RELEASE_CONTRACT.sourceAuthority.githubActionsArtifactsRequired, false);
});
