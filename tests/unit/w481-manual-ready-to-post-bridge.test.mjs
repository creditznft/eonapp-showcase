import assert from 'node:assert/strict';
import test from 'node:test';
import { W481_MANUAL_READY_TO_POST_BRIDGE_CONTRACT, validateW481ManualReadyToPostBridgeContract } from '../../config/w481-manual-ready-to-post-bridge-contract.mjs';
import { buildEonSharePackExport, buildEonSharePackText, createEonSharePack, EON_PLATFORM_VARIANT_GUIDANCE, getEonSharePackTruth, shareEonSharePack } from '../../assets/js/share/eon-share-pack.js';
import { inspectW481ManualReadyToPostBridge } from '../../scripts/w481-manual-ready-to-post-bridge-gate.mjs';

test('W481 contract keeps Ready-to-Post manual-first and connector-free', () => {
  assert.deepEqual(validateW481ManualReadyToPostBridgeContract(), []);
  assert.equal(W481_MANUAL_READY_TO_POST_BRIDGE_CONTRACT.truth.manualFirst, true);
  assert.equal(W481_MANUAL_READY_TO_POST_BRIDGE_CONTRACT.truth.directPublishingLive, false);
  assert.equal(W481_MANUAL_READY_TO_POST_BRIDGE_CONTRACT.truth.oauthConnectionsLive, false);
  assert.equal(W481_MANUAL_READY_TO_POST_BRIDGE_CONTRACT.truth.automaticPostingLive, false);
});

test('W481 share pack adds platform variant, alt text, first comment and format notes without media body', () => {
  const pack = createEonSharePack({ title: 'Launch reel', destination: 'youtube', goal: 'Show one useful result.', altText: 'Creator UI preview.', firstComment: 'Credits and disclosure.', formatNotes: 'Use Shorts 9:16.' });
  const text = buildEonSharePackText(pack);
  const exported = buildEonSharePackExport(pack);
  assert.equal(pack.destination.id, 'youtube');
  assert.equal(pack.platformVariant.destinationId, 'youtube');
  assert.match(text, /Alt text \/ accessibility description/);
  assert.match(text, /First comment/);
  assert.match(text, /Format notes/);
  assert.match(text, /Platform variant/);
  assert.equal(pack.assetHandoff.persistentMediaBody, false);
  assert.equal(JSON.stringify(exported).includes('mediaBody'), false);
});

test('W481 platform guidance covers all manual destinations', () => {
  for (const id of W481_MANUAL_READY_TO_POST_BRIDGE_CONTRACT.requiredDestinationIds) {
    assert.ok(EON_PLATFORM_VARIANT_GUIDANCE[id], `${id} has guidance`);
  }
  const truth = getEonSharePackTruth();
  assert.equal(truth.platformVariants, true);
  assert.equal(truth.hostedMedia, false);
  assert.equal(truth.directPublishing, false);
});

test('W481 native share still needs a visible user gesture', async () => {
  const pack = createEonSharePack({ title: 'Gesture test', goal: 'Manual only.' });
  const result = await shareEonSharePack(pack, { nativeShare: async () => undefined });
  assert.deepEqual(result, { ok: false, reason: 'explicit-user-action-required' });
});

test('W481 deterministic gate passes without activating connectors', async () => {
  const report = await inspectW481ManualReadyToPostBridge();
  assert.equal(report.status, 'pass');
  assert.equal(report.sourceOnly, true);
  assert.ok(report.checkCount >= 12);
  assert.equal(report.samplePack.execution.directPublishing, false);
});
