import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importBrowserModule, installStoragePolyfill } from './helpers/import-browser-module.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
installStoragePolyfill();
globalThis.EonPoolPoints = { awardPoints() {} };
const files = ['assets/js/utils/share-link-codec.js','assets/js/utils/share-receipts.js','assets/js/utils/share-attribution.js','assets/js/utils/signed-share-link.js','assets/js/utils/share-link-identity.js','assets/js/utils/share-event-schema.js','assets/js/utils/share-visitor-identity.js','assets/js/utils/share-reward-policy.js'];
const rewards = await importBrowserModule(root, 'assets/js/utils/share-reward-policy.js', files);

test('reward grants are idempotent and social proof cannot unlock subscription', async () => {
  const receipt = { eventId: 'event-1', eventType: 'public_proof_verified' };
  const first = await rewards.grantSocialReward(receipt, 'alice');
  const duplicate = await rewards.grantSocialReward(receipt, 'alice');
  const blocked = await rewards.grantSocialReward({ eventId: 'event-2', eventType: 'public_proof_verified' }, 'alice', { unlockSubscription: true });
  assert.equal(first.ok, true);
  assert.equal(first.grant.points, 15);
  assert.equal(duplicate.reason, 'duplicate');
  assert.equal(blocked.reason, 'social-proof-cannot-unlock-subscription');
});
