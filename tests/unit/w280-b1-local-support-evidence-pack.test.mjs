import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SUPPORT_EVIDENCE_PACK_SCHEMA,
  createSupportEvidencePack,
  detectSupportBrowserClass,
  detectSupportDeviceClass,
  isSupportEvidencePackReadyForManualShare,
  normalizeSupportRoute,
  redactSupportEvidence
} from '../../assets/js/utils/support-evidence-pack.js';
import { SUPPORT_TOPICS } from '../../assets/js/utils/support-tools-footer-proof.js';
import { W280_B1_LOCAL_SUPPORT_EVIDENCE_PACK_CONTRACT, validateW280B1LocalSupportEvidencePackContract } from '../../config/w280-b1-local-support-evidence-pack-contract.mjs';

const allowedTopicIds = SUPPORT_TOPICS.map((topic) => topic.id);
const fakeApiKey = ['sk', 'abcdefghijklmnopqrstuvwxyz123456'].join('-');

test('W280-B1 strips query/fragment data and rejects external routes', () => {
  assert.equal(normalizeSupportRoute('/chat?token=private#reply'), '/chat');
  assert.equal(normalizeSupportRoute('//outside.example/hidden'), '/help');
  assert.equal(normalizeSupportRoute('https://outside.example/hidden'), '/help');
  assert.equal(normalizeSupportRoute(''), '/help');
});

test('W280-B1 redacts common secret-like values before a pack is built', () => {
  const redacted = redactSupportEvidence(`Bearer abcdefghijklmnopqrstuvwxyz.1234 api_key=${fakeApiKey} https://secret.example/x 0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa seed phrase: alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu`);
  assert.ok(redacted.redactions >= 4);
  assert.doesNotMatch(redacted.text, /secret\.example|sk-|0xaaaaaaaa|Bearer abc|alpha beta gamma/i);
});

test('W280-B1 creates a finite local manual-only pack and requires review', () => {
  const preview = createSupportEvidencePack({
    topicId: 'bug-security',
    allowedTopicIds,
    routePath: '/help?private=value',
    deviceClass: 'desktop',
    browserClass: 'chromium',
    expected: 'The page should load.',
    actual: `An error appeared at https://private.example/path with api_key=${fakeApiKey}`,
    capturedAt: '2026-06-25T00:00:00.000Z',
    reviewed: false
  });
  assert.equal(preview.schema, SUPPORT_EVIDENCE_PACK_SCHEMA);
  assert.equal(preview.scope, 'local-manual-export-only');
  assert.equal(preview.status, 'preview-only');
  assert.equal(preview.context.routePath, '/help');
  assert.equal(preview.boundaries.transmittedByEonapp, false);
  assert.equal(preview.boundaries.createsSupportTicket, false);
  assert.equal(isSupportEvidencePackReadyForManualShare(preview), false);
  assert.doesNotMatch(JSON.stringify(preview), /private\.example|sk-/);

  const reviewed = createSupportEvidencePack({ ...preview, allowedTopicIds, reviewed: true });
  assert.equal(reviewed.status, 'reviewed-for-manual-share');
  assert.equal(isSupportEvidencePackReadyForManualShare(reviewed), true);
});

test('W280-B1 exports only coarse device/browser classes', () => {
  assert.equal(detectSupportDeviceClass('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)'), 'mobile');
  assert.equal(detectSupportDeviceClass('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'desktop');
  assert.equal(detectSupportBrowserClass('Mozilla/5.0 Firefox/126.0'), 'firefox');
  assert.equal(detectSupportBrowserClass('Mozilla/5.0 Version/17.1 Safari/605.1.15'), 'safari');
  assert.equal(validateW280B1LocalSupportEvidencePackContract().ok, true);
  assert.equal(W280_B1_LOCAL_SUPPORT_EVIDENCE_PACK_CONTRACT.scope, 'source-only-local-manual-export');
});
