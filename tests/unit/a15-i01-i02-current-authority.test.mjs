import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  A15_BUILD_HTML_ENTRY_FILES,
  A15_CURRENT_PRODUCT_ROUTES,
  A15_EMITTED_COMPATIBILITY_FILES,
  A15_REDIRECT_ONLY_COMPATIBILITY_FILES,
  validateA15CurrentProductAuthority
} from '../../config/a15-current-product-authority.mjs';
import { validateA15SystemDispositionContract } from '../../config/a15-system-disposition-contract.mjs';

const vite = readFileSync(new URL('../../vite.config.mjs', import.meta.url), 'utf8');

test('A15 I02 has one valid current product and build authority', () => {
  assert.deepEqual(validateA15CurrentProductAuthority(), []);
  assert.deepEqual(validateA15SystemDispositionContract(), []);
  assert.equal(A15_CURRENT_PRODUCT_ROUTES.length > 0, true);
  assert.equal(new Set(A15_BUILD_HTML_ENTRY_FILES).size, A15_BUILD_HTML_ENTRY_FILES.length);
});

test('redirect-only compatibility documents are excluded from Vite entries', () => {
  assert.equal(A15_REDIRECT_ONLY_COMPATIBILITY_FILES.includes('chat.html'), true);
  assert.equal(A15_REDIRECT_ONLY_COMPATIBILITY_FILES.includes('support.html'), true);
  assert.equal(A15_BUILD_HTML_ENTRY_FILES.includes('chat.html'), false);
  assert.equal(A15_BUILD_HTML_ENTRY_FILES.includes('support.html'), false);
  assert.match(vite, /A15_BUILD_HTML_ENTRY_FILES/);
  assert.doesNotMatch(vite, /\.\.\.COMPATIBILITY_ROUTES/);
});

test('bounded status-200 compatibility documents remain emitted but not current product routes', () => {
  assert.equal(A15_EMITTED_COMPATIBILITY_FILES.includes('telegram.html'), true);
  assert.equal(A15_EMITTED_COMPATIBILITY_FILES.includes('rewards.html'), true);
  assert.equal(A15_EMITTED_COMPATIBILITY_FILES.includes('archive.html'), true);
  assert.equal(A15_BUILD_HTML_ENTRY_FILES.includes('telegram.html'), true);
  assert.equal(A15_CURRENT_PRODUCT_ROUTES.some((row) => row.file === 'telegram.html'), false);
});
