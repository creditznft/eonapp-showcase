import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importBrowserModule } from './helpers/import-browser-module.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const files = ['assets/js/social/social-platform-adapters.js','assets/js/social/x-public-proof.js'];
const x = await importBrowserModule(root, 'assets/js/social/x-public-proof.js', files);

test('X proof URL accepts only public status URLs', () => {
  assert.equal(x.parseXStatusUrl('https://x.com/EonAppz/status/123456').ok, true);
  assert.equal(x.parseXStatusUrl('https://x.com/EonAppz').ok, false);
  assert.equal(x.parseXStatusUrl('https://evil.example/EonAppz/status/123').ok, false);
});

test('X oEmbed assessment is honest accepted/pending/rejected', () => {
  const base = { proofUrl: 'https://x.com/EonAppz/status/123456', missionCode: 'EON-ABC12345', trackingLink: 'https://eonapp.ch/r/#eon1.token.sig' };
  assert.equal(x.assessXEmbedProof({ ...base, embedHtml: '' }).status, 'pending');
  assert.equal(x.assessXEmbedProof({ ...base, embedHtml: '<blockquote>No code here</blockquote>' }).status, 'rejected');
  assert.equal(x.assessXEmbedProof({ ...base, embedHtml: '<blockquote>EON-ABC12345 https://eonapp.ch/r/#eon1.token.sig</blockquote>' }).status, 'accepted');
});
