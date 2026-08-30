import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { verifyW344PublicTruthCopy } from '../../scripts/w344-public-truth-copy-gate.mjs';
import {
  W344_COMMERCE_STATUS,
  W344_FLOATING_GUIDE_FORBIDDEN,
  W344_FLOATING_GUIDE_REQUIRED,
  W344_PUBLIC_TRUTH_SCHEMA
} from '../../config/w344-public-truth-contract.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

test('W344 public product language is local-first and commerce-safe', () => {
  const result = verifyW344PublicTruthCopy({ root });
  assert.equal(result.schema, W344_PUBLIC_TRUTH_SCHEMA);
  assert.equal(result.ok, true, result.errors.join('\n'));
  assert.equal(result.checkedSurfaceCount >= 5, true);
  assert.equal(result.checkedGuideFile, 'assets/js/utils/eon-chat-widget.js');
});

test('W344 contract keeps the floating guide executable only as guidance', () => {
  assert.equal(W344_FLOATING_GUIDE_FORBIDDEN.length >= 10, true);
  assert.equal(W344_FLOATING_GUIDE_REQUIRED.length >= 5, true);
  assert.deepEqual(W344_COMMERCE_STATUS, {
    payments: 'blocked-no-processor-selected',
    nftCommerce: 'blocked-chain-proof-and-legal-review-required',
    token: 'blocked-no-app-integration',
    referrals: 'blocked-no-financial-program',
    ads: 'blocked-private-surfaces-protected'
  });
});
