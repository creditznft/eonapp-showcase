import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('W177 in-app Code Showcase presents curated snippets without claiming full open source', () => {
  const text = fs.readFileSync('assets/js/realm3d/realm-code-preview.js', 'utf8');
  assert.match(text, /curated examples/i);
  assert.match(text, /not private source|not expose/i);
  assert.match(text, /Public GitHub showcase boundary/i);
  assert.match(text, /Sponsor Boost safe monetization contract/i);
});

test('W177 trust explorer covers public repo, ads, EONBOT, and mobile game UX boundaries', () => {
  const text = fs.readFileSync('assets/js/trust-showcase-page.js', 'utf8');
  for (const phrase of ['Sponsor Boost safety', 'EONBOT command operator', 'Mobile game UX guard', 'Curated Code Showcase snippets']) {
    assert.match(text, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('W177 showcase files do not expose common secret names', () => {
  const combined = fs.readFileSync('assets/js/realm3d/realm-code-preview.js', 'utf8') + fs.readFileSync('assets/js/trust-showcase-page.js', 'utf8');
  assert.doesNotMatch(combined, /TELEGRAM_BOT_TOKEN|NOWPAYMENTS_IPN_SECRET|AD_REWARD_POSTBACK_SECRET|FILEBASE_SECRET|PRIVATE_KEY/i);
});
