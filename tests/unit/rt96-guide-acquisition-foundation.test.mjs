import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EON_GUIDE_QUALITY_POLICY, EON_GUIDE_ROUTES, validateEonGuideCatalog } from '../../config/eon-guide-catalog.mjs';
import { getRouteRow } from '../../config/route-contract.mjs';
import { getW477SeoDirectiveForFile } from '../../config/w477-route-seo-legacy-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const visibleWords = (html) => String(html)
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z0-9#]+;/gi, ' ')
  .trim().split(/\s+/).filter(Boolean).length;

const heroFiles = EON_GUIDE_ROUTES.filter((row) => row.lifecycle === 'editorial-acquisition-utility').map((row) => row.file);

test('RT96 guide catalog is route/SEO authoritative rather than a hidden legacy blog', () => {
  assert.deepEqual(validateEonGuideCatalog(), []);
  assert.ok(EON_GUIDE_ROUTES.length >= 17);
  for (const row of EON_GUIDE_ROUTES) {
    assert.equal(getRouteRow(row.from)?.file, row.file);
    assert.equal(getW477SeoDirectiveForFile(row.file)?.robots, 'index, follow');
  }
  const redirects = read('_redirects');
  assert.match(redirects, /\/blog \/archive 301/);
  assert.match(read('sitemap.xml'), /https:\/\/eonapp\.ch\/guides\/ai-api-cost-calculator/);
});

test('RT96 hero acquisition pages pass the local content-depth and utility gate with approval-ready AdSense bootstrap only', () => {
  for (const file of heroFiles) {
    const html = read(file);
    const words = visibleWords(html);
    assert.ok(words >= EON_GUIDE_QUALITY_POLICY.minimumStaticWordsForHeroGuide, `${file}: expected >= ${EON_GUIDE_QUALITY_POLICY.minimumStaticWordsForHeroGuide} static words, got ${words}`);
    assert.match(html, /class="eon-guide-tool"/);
    assert.match(html, /data-eonbot-draft=/);
    assert.match(html, /review/i);
    assert.match(html, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-6759380023085970/);
    assert.match(html, /name="google-adsense-account" content="ca-pub-6759380023085970"/);
    assert.doesNotMatch(html, /data-ad-slot=/i);
    assert.doesNotMatch(html, /meta\s+name=["']keywords["']/i);
  }
});

test('RT96 guide-to-EONBOT handoff is review-first and does not use the legacy auto-send prefill key', () => {
  const action = read('assets/js/guides/eon-guide-actions.js');
  const chat = read('assets/js/chat-page.js');
  assert.match(action, /eon:chat:draft:v1/);
  assert.doesNotMatch(action, /eon:chat:prefill:v1/);
  assert.match(chat, /function getReviewDraftPrompt\(\)/);
  assert.match(chat, /applyReviewDraftPrompt\(\)/);
  assert.match(chat, /dom\.input\.value = prompt/);
  assert.doesNotMatch(action, /handleSend\(/);
});

test('RT96 adds editorial and advertising transparency pages to the live route and sitemap authority', () => {
  for (const [route, file] of [['/editorial-policy','editorial-policy.html'], ['/advertising-disclosure','advertising-disclosure.html']]) {
    assert.equal(getRouteRow(route)?.file, file);
    assert.equal(getW477SeoDirectiveForFile(file)?.robots, 'index, follow');
    assert.match(read('sitemap.xml'), new RegExp(`https:\\/\\/eonapp\\.ch${route.replaceAll('/', '\\/')}`));
  }
  assert.match(read('index.html'), /href="\/guides"/);
});
