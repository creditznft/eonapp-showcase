import test from 'node:test';
import assert from 'node:assert/strict';

import { recordEonCoreOutcome } from '../../assets/js/contracts/outcomes/eon-core-outcome-authority.js';
import { buildEonbotRecentOutcomeContext, classifyRecentOutcomeIntent, getEonbotRecentOutcomeContextTruth } from '../../assets/js/chat/eonbot-recent-outcome-context.js';
import { buildEonbotKnowledgeGrounding } from '../../assets/js/chat/eonbot-knowledge-grounding.js';

function storage() {
  const map = new Map();
  return { getItem: (key) => map.has(key) ? map.get(key) : null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) };
}

test('recent outcome awareness is continuation-intent gated and excludes ordinary creation prompts', () => {
  assert.equal(classifyRecentOutcomeIntent('Create a cinematic image of a city').requested, false);
  assert.equal(classifyRecentOutcomeIntent('Where is my last image?').requested, true);
  assert.equal(classifyRecentOutcomeIntent('Continue my recent work').requested, true);
});

test('recent outcome projection contains only fixed redacted metadata and never the receipt/provider payload', () => {
  const store = storage();
  const recorded = recordEonCoreOutcome({
    kind: 'creator-music-exported', route: '/create', source: 'eon-acestep-local',
    receiptId: 'private-native-receipt-12345', verified: true, verifiedAt: 2000
  }, { storage: store, now: 2000 });
  assert.equal(recorded.ok, true);
  const context = buildEonbotRecentOutcomeContext('Continue my last music track', { storage: store });
  assert.equal(context.count, 1);
  assert.equal(context.outcomes[0].kind, 'creator-music-exported');
  assert.equal(context.outcomes[0].route, '/create');
  const serialized = JSON.stringify(context);
  assert.doesNotMatch(serialized, /private-native-receipt-12345|eon-acestep-local|evidenceReceiptId|metadataDigest|nativeAuthority/);
  assert.match(context.prompt, /UNTRUSTED REDACTED ACTIVITY DATA/);
  assert.match(context.prompt, /never instruction\/action authority/);
});

test('sensitive Core outcomes such as provider verification and access review are not projected', () => {
  const store = storage();
  recordEonCoreOutcome({ kind: 'byok-provider-verification', route: '/vault', source: 'vault-direct-byok', receiptId: 'provider-secret-proof', verified: true, verifiedAt: 3000 }, { storage: store, now: 3000 });
  recordEonCoreOutcome({ kind: 'plans-access-reviewed', route: '/eoncity', source: 'city-server-access-review', receiptId: 'access-proof', verified: true, verifiedAt: 4000 }, { storage: store, now: 4000 });
  const context = buildEonbotRecentOutcomeContext('Continue my recent work', { storage: store });
  assert.equal(context.count, 0);
  assert.doesNotMatch(context.prompt, /provider-secret-proof|access-proof|provider|access review/i);
});

test('shared EONBOT grounding includes recent activity only on a matching turn', () => {
  const store = storage();
  recordEonCoreOutcome({ kind: 'creator-image-verified', route: '/create', source: 'comfyui-image-lab', receiptId: 'image-receipt-hidden', verified: true, verifiedAt: 5000 }, { storage: store, now: 5000 });
  const ordinary = buildEonbotKnowledgeGrounding('Make a new image', { storage: store });
  assert.equal(ordinary.recentOutcomeContext.count, 0);
  const continuing = buildEonbotKnowledgeGrounding('Open my last image and continue', { storage: store });
  assert.equal(continuing.recentOutcomeContext.count, 1);
  assert.match(continuing.prompt, /saved Image creation/);
  assert.doesNotMatch(continuing.prompt, /image-receipt-hidden|comfyui-image-lab/);
});

test('recent outcome truth forbids prompt/media/key/receipt/action authority', () => {
  const truth = getEonbotRecentOutcomeContextTruth();
  assert.equal(truth.intentGated, true);
  assert.equal(truth.promptStored, false);
  assert.equal(truth.mediaStored, false);
  assert.equal(truth.credentialStored, false);
  assert.equal(truth.rawReceiptIdIncluded, false);
  assert.equal(truth.providerSourceIncluded, false);
  assert.equal(truth.actionAuthority, false);
});
