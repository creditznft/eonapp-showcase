import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { getW477SeoDirectiveForFile, W477_SITEMAP_LASTMOD } from '../../config/w477-route-seo-legacy-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const visibleWords = (html) => String(html)
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z0-9#]+;/gi, ' ')
  .trim().split(/\s+/).filter(Boolean).length;

test('RT96 keeps Google ownership declarations and guide Auto Ads bootstrap deployment-ready without inventing ad units', () => {
  const index = read('index.html');
  const adsTxt = read('ads.txt').trim();
  assert.match(index, /name="google-adsense-account"\s+content="ca-pub-6759380023085970"/);
  assert.equal(adsTxt, 'google.com, pub-6759380023085970, DIRECT, f08c47fec0942fa0');
  assert.doesNotMatch(index, /adsbygoogle/i);
  const guide = read('guides/ai-api-cost-calculator.html');
  assert.match(guide, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-6759380023085970/);
  assert.doesNotMatch(guide, /data-ad-slot=/i);
});

test('RT96 strengthens public Local AI content and crawlable trust navigation', () => {
  const localAi = read('local-ai.html');
  const index = read('index.html');
  assert.ok(visibleWords(localAi) >= 500, `Expected at least 500 static words, got ${visibleWords(localAi)}`);
  for (const href of ['/about', '/local-ai', '/insights', '/help', '/privacy']) {
    assert.match(index, new RegExp(`href="${href.replace('/', '\\/')}"`));
  }
});

test('RT96 keeps thin live status out of the search index and regenerates the current sitemap authority', () => {
  const statusDirective = getW477SeoDirectiveForFile('status.html');
  const sitemap = read('sitemap.xml');
  assert.equal(statusDirective?.robots, 'noindex, follow');
  assert.equal(statusDirective?.indexable, false);
  assert.equal(W477_SITEMAP_LASTMOD, '2026-08-30');
  assert.match(read('status.html'), /name="robots" content="noindex, follow"/);
  assert.doesNotMatch(sitemap, /https:\/\/eonapp\.ch\/status/);
  assert.match(sitemap, /<lastmod>2026-08-30<\/lastmod>/);
  assert.equal(read('public/sitemap.xml'), sitemap);
});
