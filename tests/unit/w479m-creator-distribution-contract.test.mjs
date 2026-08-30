import assert from 'node:assert/strict';
import test from 'node:test';
import {
  W479M_CREATOR_DISTRIBUTION_SCHEMA,
  W479M_PLATFORM_HANDOFFS,
  W479M_REQUIRED_ADAPTER_PROOFS,
  getW479MCreatorDistributionTruth,
  validateW479MCreatorDistributionContract
} from '../../config/w479m-creator-distribution-contract.mjs';
import { createCreatorDistributionHandoff } from '../../assets/js/creator/creator-distribution-handoff.js';
import { inspectW479MCreatorDistributionContract } from '../../scripts/w479m-creator-distribution-contract-gate.mjs';

function proofedVideo() {
  return {
    id: 'local-video-001',
    title: 'Launch reel final',
    kind: 'video',
    format: '1080x1920 MP4',
    localPathHint: 'Creator Library / Launch reel final.mp4',
    adapterProofs: W479M_REQUIRED_ADAPTER_PROOFS
  };
}

test('W479-M6 keeps creator distribution bridge manual/export-first and metadata-only', () => {
  assert.deepEqual(validateW479MCreatorDistributionContract(), []);
  const handoff = createCreatorDistributionHandoff({
    platformId: 'tiktok',
    asset: proofedVideo(),
    caption: 'A finished local reel, ready for my review.',
    altText: 'Vertical launch video'
  });
  assert.equal(handoff.schema, W479M_CREATOR_DISTRIBUTION_SCHEMA);
  assert.equal(handoff.platform.id, 'tiktok');
  assert.equal(handoff.asset.mediaBodyIncluded, false);
  assert.equal(handoff.manualExportRequired, true);
  assert.equal(handoff.perPostReviewRequired, true);
  assert.equal(handoff.directPublishingCreated, false);
  assert.equal(handoff.remotePostCreated, false);
  assert.equal(handoff.noSilentCloudFallback, true);
  assert.ok(W479M_PLATFORM_HANDOFFS.some((entry) => entry.id === 'x'));
});

test('W479-M6 refuses raw media bodies and adapter claims without proof', () => {
  assert.throws(() => createCreatorDistributionHandoff({ platformId: 'x', asset: { ...proofedVideo(), dataUrl: 'data:video/mp4;base64,abc' } }), /metadata only/i);
  assert.throws(() => createCreatorDistributionHandoff({ platformId: 'youtube', asset: { ...proofedVideo(), adapterProofs: ['generation-passed'] } }), /must prove/i);
});

test('W479-M6 static gate remains non-live', () => {
  const truth = getW479MCreatorDistributionTruth();
  assert.equal(truth.mediaGenerationLive, false);
  assert.equal(truth.directPublishingLive, false);
  const report = inspectW479MCreatorDistributionContract({ writeArtifact: false });
  assert.equal(report.sourceStatus, 'pass');
  assert.equal(report.releaseStatus, 'planned-bridge-no-media-or-social-activation');
});
