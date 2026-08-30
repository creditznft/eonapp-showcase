import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  RT92_PREMIUM_PRODUCTION_PRODUCT_VARS,
  validateRt92PremiumCloudflareRollout
} from '../../config/rt92-premium-cloudflare-rollout-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const wrangler = JSON.parse(fs.readFileSync(path.join(root, 'wrangler.jsonc'), 'utf8'));

test('premium Cloudflare rollout keeps local/Preview disabled and enables certified Production checkout', () => {
  const report = validateRt92PremiumCloudflareRollout();
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(wrangler.vars.EON_PREMIUM_CHECKOUT_ROLLOUT, 'disabled');
  assert.equal(wrangler.env.preview.vars.EON_PREMIUM_CHECKOUT_ROLLOUT, 'disabled');
  assert.equal(wrangler.env.production.vars.EON_PREMIUM_CHECKOUT_ROLLOUT, 'production');
});

test('only Production receives the LIVE Pro Ultra Ultimate Dodo product ids', () => {
  for (const [key, productId] of Object.entries(RT92_PREMIUM_PRODUCTION_PRODUCT_VARS)) {
    assert.equal(wrangler.env.production.vars[key], productId);
    assert.equal(wrangler.env.preview.vars[key], undefined);
    assert.equal(wrangler.vars[key], undefined);
  }
  assert.equal(wrangler.env.production.vars.DODO_API_ENVIRONMENT, 'live');
  assert.equal(wrangler.env.preview.vars.DODO_API_ENVIRONMENT, 'test');
});
