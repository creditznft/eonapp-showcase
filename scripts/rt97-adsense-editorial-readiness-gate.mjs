import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EON_GUIDE_ROUTES, EON_GUIDE_QUALITY_POLICY, validateEonGuideCatalog } from '../config/eon-guide-catalog.mjs';
import { ALL_ROUTE_ROWS } from '../config/route-contract.mjs';
import { EON_ADSENSE_ACCOUNT, EON_ADSENSE_ADS_TXT, EON_ADSENSE_SOURCE_POLICY, EON_ADSENSE_ACCOUNT_ACTIVATION_POLICY } from '../config/rt97-adsense-live-policy.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const exists = (f) => fs.existsSync(path.join(ROOT, f));
const visibleWords = (html) => String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&[a-z0-9#]+;/gi,' ').trim().split(/\s+/).filter(Boolean).length;
const meta = (html, name) => (html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i')) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i')) || [])[1] || '';
const link = (html, rel) => (html.match(new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["']`, 'i')) || html.match(new RegExp(`<link[^>]+href=["']([^"']+)["'][^>]+rel=["']${rel}["']`, 'i')) || [])[1] || '';
const title = (html) => (html.match(/<title>([^<]+)<\/title>/i) || [])[1]?.trim() || '';
const count = (html, re) => (String(html).match(re) || []).length;
const errors = [...validateEonGuideCatalog()];
const seen = { title: new Map(), description: new Map(), canonical: new Map() };
const adsenseSrc = new RegExp(`pagead2\\.googlesyndication\\.com/pagead/js/adsbygoogle\\.js\\?client=${EON_ADSENSE_ACCOUNT.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`, 'i');
const footerLinks = ['/about','/editorial-policy','/advertising-disclosure','/privacy','/terms','/help'];
const supportMinimumWords = 800;
const guideIndexMinimumWords = 700;

for (const row of EON_GUIDE_ROUTES) {
  if (!exists(row.file)) { errors.push(`${row.file}:missing`); continue; }
  const html = read(row.file);
  const pageTitle = title(html); const description = meta(html,'description'); const canonical = link(html,'canonical');
  const words = visibleWords(html);
  if (!pageTitle || pageTitle.length < 20) errors.push(`${row.file}:weak-title`);
  if (!description || description.length < 70) errors.push(`${row.file}:weak-description`);
  const expectedCanonical = `https://eonapp.ch${row.from === '/guides' ? '/guides' : row.from}`;
  if (canonical !== expectedCanonical) errors.push(`${row.file}:canonical:${canonical || 'missing'}`);
  if (count(html, /<link\b[^>]*\brel=["']canonical["'][^>]*>/gi) !== 1) errors.push(`${row.file}:canonical-count`);
  if (count(html, /<meta\b[^>]*\bname=["']robots["'][^>]*>/gi) !== 1) errors.push(`${row.file}:robots-count`);
  if (count(html, /<h1\b[^>]*>/gi) !== 1) errors.push(`${row.file}:h1-count`);
  if (meta(html,'robots').toLowerCase() !== 'index, follow') errors.push(`${row.file}:robots`);
  if (!new RegExp(`name=["']google-adsense-account["']\\s+content=["']${EON_ADSENSE_ACCOUNT}["']`, 'i').test(html)) errors.push(`${row.file}:adsense-ownership`);
  if (!adsenseSrc.test(html)) errors.push(`${row.file}:adsense-bootstrap`);
  if (count(html, /pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/gi) !== 1) errors.push(`${row.file}:adsense-bootstrap-count`);
  if (/data-ad-slot=/i.test(html)) errors.push(`${row.file}:unissued-manual-ad-slot`);
  if (/\b(lorem ipsum|coming soon|todo|placeholder text)\b/i.test(html)) errors.push(`${row.file}:placeholder-content`);
  if (/\b(click (?:the|an|our) ads?|support us by clicking|click ads? to support)\b/i.test(html)) errors.push(`${row.file}:incentivized-ad-click-copy`);
  for (const href of footerLinks) if (!html.includes(`href="${href}"`) && !html.includes(`href='${href}'`)) errors.push(`${row.file}:missing-trust-link:${href}`);
  if (row.lifecycle.includes('utility') && words < EON_GUIDE_QUALITY_POLICY.minimumStaticWordsForHeroGuide) errors.push(`${row.file}:hero-thin:${words}`);
  else if (row.file === 'guides/index.html' && words < guideIndexMinimumWords) errors.push(`${row.file}:index-thin:${words}`);
  else if (row.lifecycle.includes('support') && words < supportMinimumWords) errors.push(`${row.file}:support-thin:${words}`);
  if (!/application\/ld\+json/i.test(html)) errors.push(`${row.file}:structured-data-missing`);
  if (!/BreadcrumbList/i.test(html)) errors.push(`${row.file}:breadcrumb-structured-data-missing`);
  if (!/dateModified["']?\s*:\s*["']2026-08-30["']/i.test(html)) errors.push(`${row.file}:date-modified-stale`);
  if (row.file !== 'guides/index.html') {
    if (!/data-eonbot-draft=/.test(html) || !/review/i.test(html)) errors.push(`${row.file}:review-first-eonbot`);
    if (!/Editorial method/i.test(html)) errors.push(`${row.file}:editorial-method`);
    if (!/data-adsense-exclusion-area=["']eonbot-cta["']/i.test(html)) errors.push(`${row.file}:eonbot-ad-exclusion-marker`);
  }
  if (row.lifecycle.includes('utility') && !/data-adsense-exclusion-area=["']interactive-tool["']/i.test(html)) errors.push(`${row.file}:tool-ad-exclusion-marker`);
  for (const [key,value] of [['title',pageTitle],['description',description],['canonical',canonical]]) {
    if (!value) continue;
    if (seen[key].has(value)) errors.push(`${row.file}:duplicate-${key}:${seen[key].get(value)}`); else seen[key].set(value,row.file);
  }
  for (const match of html.matchAll(/<a\b([^>]*?)href=["'](https?:\/\/[^"']+)["']([^>]*)>/gi)) {
    const attrs = `${match[1]} ${match[3]}`;
    if (!/\brel=["'][^"']*noopener[^"']*noreferrer[^"']*["']/i.test(attrs) && !/\brel=["'][^"']*noreferrer[^"']*noopener[^"']*["']/i.test(attrs)) errors.push(`${row.file}:external-link-rel:${match[2]}`);
  }
}

const liveHtmlFiles = [...new Set(ALL_ROUTE_ROWS.filter((row) => Number(row.status) === 200 && String(row.file || '').endsWith('.html')).map((row) => row.file))];
for (const file of liveHtmlFiles) {
  if (!exists(file)) continue;
  const html = read(file);
  const isGuide = file.startsWith('guides/');
  if (!isGuide && adsenseSrc.test(html)) errors.push(`${file}:adsense-bootstrap-outside-editorial-guides`);
  if (!isGuide && /data-ad-slot=/i.test(html)) errors.push(`${file}:manual-ad-slot-outside-editorial-guides`);
}

for (const file of ['editorial-policy.html','advertising-disclosure.html']) {
  const html = read(file);
  if (count(html, /<link\b[^>]*\brel=["']canonical["'][^>]*>/gi) !== 1) errors.push(`${file}:canonical-count`);
  if (count(html, /<meta\b[^>]*\bname=["']robots["'][^>]*>/gi) !== 1) errors.push(`${file}:robots-count`);
}

const sitemap = read('sitemap.xml');
for (const row of EON_GUIDE_ROUTES) if (!sitemap.includes(`<loc>https://eonapp.ch${row.from}</loc>`)) errors.push(`${row.file}:sitemap-missing`);
if (!sitemap.includes('<lastmod>2026-08-30</lastmod>')) errors.push('sitemap-lastmod-stale');
if (read('ads.txt').trim() !== EON_ADSENSE_ADS_TXT) errors.push('ads.txt-authority');
if (exists('public/ads.txt') && read('public/ads.txt').trim() !== EON_ADSENSE_ADS_TXT) errors.push('public-ads.txt-authority');

const receipt = Object.freeze({
  schema: 'eonapp.adsense.editorial-readiness.rt97.v2',
  status: errors.length ? 'fail' : 'code-pass-external-pending',
  codeReady: errors.length === 0,
  guideCount: EON_GUIDE_ROUTES.length,
  supportMinimumWords,
  guideIndexMinimumWords,
  manualAdSlotsIssued: false,
  appAndCityOrdinaryAdsEnabled: EON_ADSENSE_SOURCE_POLICY.appWorkSurfacesAllowed || EON_ADSENSE_SOURCE_POLICY.cityGameplayAllowed,
  placementBoundary: EON_ADSENSE_SOURCE_POLICY.ordinaryDisplayScope,
  accountActivationPolicy: EON_ADSENSE_ACCOUNT_ACTIVATION_POLICY,
  externalPending: EON_ADSENSE_ACCOUNT_ACTIVATION_POLICY.externalGates,
  errors
});
console.log(JSON.stringify(receipt, null, 2));
if (errors.length) process.exitCode = 1;
