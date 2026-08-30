import assert from 'node:assert/strict';
import test from 'node:test';
import { W388A1_EON_SHARE_PACK_CONTRACT, validateW388A1EonSharePackContract } from '../../config/w388a1-eon-share-pack-contract.mjs';
import { buildEonSharePackExport, buildEonSharePackText, createEonSharePack, EON_SHARE_PACK_FORMATS, getEonSharePackTruth, shareEonSharePack } from '../../assets/js/share/eon-share-pack.js';
import { inspectW388A1EonSharePack } from '../../scripts/w388a1-eon-share-pack-gate.mjs';

test('W388A.1 creates a local, non-publishing Share Pack with approved formats', () => {
  assert.deepEqual(validateW388A1EonSharePackContract(), []);
  assert.deepEqual(EON_SHARE_PACK_FORMATS.map((format) => format.id), W388A1_EON_SHARE_PACK_CONTRACT.formats);
  const pack = createEonSharePack({ title: 'Creator workflow preview', audience: 'Independent creators', goal: 'Show a repeatable workflow.', link: 'https://example.com/preview', cta: 'Open the preview.', formats: ['vertical-video', 'square-post'] });
  assert.equal(pack.execution.directPublishing, false);
  assert.equal(pack.execution.oauthConnections, false);
  assert.equal(pack.execution.referralReward, false);
  assert.equal(pack.formats.length, 2);
  assert.match(buildEonSharePackText(pack), /Creator workflow preview/);
  assert.equal(getEonSharePackTruth().tracking, false);
});

test('W388A.1 keeps exports textual and rejects secret-looking fields', () => {
  const pack = createEonSharePack({ title: 'Share preview', goal: 'Show the useful output.' });
  const exported = buildEonSharePackExport(pack);
  assert.match(exported.text, /Draft\/export\/native-share only/);
  assert.match(exported.limitations.join(' '), /No media bodies/i);
  assert.throws(() => createEonSharePack({ title: 'Bad key', goal: 'api key: example-secret-123456789' }), /secret/i);
});

test('W388A.1 native share requires an explicit caller and source gate remains honest', async () => {
  const pack = createEonSharePack({ title: 'Native share', goal: 'Share only after review.' });
  const calls = [];
  const blocked = await shareEonSharePack(pack, { nativeShare: async (payload) => { calls.push(payload); } });
  assert.equal(blocked.ok, false);
  assert.equal(blocked.reason, 'explicit-user-action-required');
  const result = await shareEonSharePack(pack, { userGesture: true, nativeShare: async (payload) => { calls.push(payload); } });
  assert.equal(result.ok, true);
  assert.equal(calls.length, 1);
  const report = inspectW388A1EonSharePack({ writeArtifact: false });
  assert.equal(report.status, 'pass');
  assert.match(report.limitations.join(' '), /No direct platform publishing/i);
});
