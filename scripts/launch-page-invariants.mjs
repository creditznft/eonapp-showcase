import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const PAGE_RULES = [
  { file: 'index.html', canonical: 'https://eonapp.ch/', pageType: 'home', requireSchema: true, trustSurface: false },
  { file: 'chat.html', canonical: 'https://eonapp.ch/chat', pageType: 'chat', requireSchema: true, trustSurface: false },
  { file: 'vault.html', canonical: 'https://eonapp.ch/vault', pageType: 'vault', requireSchema: true, trustSurface: true },
  { file: 'about.html', canonical: 'https://eonapp.ch/about', pageType: 'static', requireSchema: true, trustSurface: true },
  { file: 'privacy.html', canonical: 'https://eonapp.ch/privacy', pageType: 'static', requireSchema: true, trustSurface: true },
  { file: 'archive.html', canonical: 'https://eonapp.ch/archive', pageType: 'archive', requireSchema: true, trustSurface: false },
  { file: '404.html', canonical: 'https://eonapp.ch/404.html', pageType: 'static', requireSchema: true, trustSurface: false },
  { file: 'offline.html', canonical: 'https://eonapp.ch/offline.html', pageType: null, requireSchema: true, trustSurface: false },
];

const blockers = [];
const warnings = [];

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function hasTag(html, pattern) {
  return pattern.test(html);
}

function getMetaByName(html, name) {
  const re1 = new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i');
  const re2 = new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["'][^>]*>`, 'i');
  const m1 = html.match(re1);
  if (m1) return m1[1];
  const m2 = html.match(re2);
  if (m2) return m2[1];
  return null;
}

function getMetaByProperty(html, property) {
  const re1 = new RegExp(`<meta\\s+[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["'][^>]*>`, 'i');
  const re2 = new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["'][^>]*>`, 'i');
  const m1 = html.match(re1);
  if (m1) return m1[1];
  const m2 = html.match(re2);
  if (m2) return m2[1];
  return null;
}

function addBlocker(file, message) {
  blockers.push(`[${file}] ${message}`);
}

function addWarning(file, message) {
  warnings.push(`[${file}] ${message}`);
}

function validatePage(rule) {
  const { file, canonical, pageType, requireSchema, trustSurface } = rule;
  const abs = path.join(ROOT, file);

  if (!fs.existsSync(abs)) {
    addBlocker(file, 'File missing.');
    return;
  }

  const html = read(file);
  const bodyOnly = html.replace(/<head[\s\S]*?<\/head>/i, '');

  if (!hasTag(html, /<title>[^<]{3,}<\/title>/i)) {
    addBlocker(file, 'Missing or empty <title>.');
  }

  const desc = getMetaByName(html, 'description');
  if (!desc || desc.trim().length < 40) {
    addBlocker(file, 'Missing or weak meta description (min 40 chars).');
  }

  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!canonicalMatch) {
    addBlocker(file, 'Missing canonical link.');
  } else if (canonicalMatch[1] !== canonical) {
    addBlocker(file, `Canonical mismatch. Expected ${canonical} got ${canonicalMatch[1]}.`);
  }

  const ogTitle = getMetaByProperty(html, 'og:title');
  const ogDesc = getMetaByProperty(html, 'og:description');
  const ogUrl = getMetaByProperty(html, 'og:url');
  const twitterTitle = getMetaByName(html, 'twitter:title');
  const twitterDesc = getMetaByName(html, 'twitter:description');

  if (!ogTitle) addBlocker(file, 'Missing og:title.');
  if (!ogDesc) addBlocker(file, 'Missing og:description.');
  if (!ogUrl) addBlocker(file, 'Missing og:url.');
  if (ogUrl && ogUrl !== canonical) addBlocker(file, `og:url mismatch. Expected ${canonical} got ${ogUrl}.`);
  if (!twitterTitle) addBlocker(file, 'Missing twitter:title.');
  if (!twitterDesc) addBlocker(file, 'Missing twitter:description.');

  if (!hasTag(html, /<link\s+rel=["']manifest["']\s+href=["']\/manifest\.webmanifest["']/i)) {
    addWarning(file, 'Missing manifest link.');
  }

  if (pageType && !hasTag(html, new RegExp(`<body[^>]*data-page-type=["']${pageType}["']`, 'i'))) {
    addBlocker(file, `Missing body data-page-type="${pageType}".`);
  }

  if (requireSchema && !hasTag(html, /<script\s+type=["']application\/ld\+json["']/i)) {
    addBlocker(file, 'Missing JSON-LD structured data.');
  }

  if (trustSurface && hasTag(bodyOnly, /data-ad-slot=/i)) {
    addBlocker(file, 'Trust surface contains ad slot markup (data-ad-slot).');
  }

  const monetizationDisabled = hasTag(bodyOnly, /data-monetization=["']disabled["']/i);
  if (trustSurface && !monetizationDisabled && hasTag(bodyOnly, /offerwall|monetag|adsterra|bidvertiser|cpalead|adgate/i)) {
    addWarning(file, 'Trust surface references ad-network keywords; verify page intent remains trust-first.');
  }

  if (file === '404.html' || file === 'offline.html') {
    if (!hasTag(html, /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i)) {
      addBlocker(file, 'Missing noindex robots directive for non-index pages.');
    }
  }
}

for (const rule of PAGE_RULES) {
  validatePage(rule);
}

console.log('EONAPP.CH Page Invariants Gate');
console.log('==============================');
console.log(`Blockers: ${blockers.length}`);
console.log(`Warnings: ${warnings.length}`);

if (blockers.length > 0) {
  console.log('\nBlockers:');
  for (const b of blockers) console.log(`- ${b}`);
}

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const w of warnings) console.log(`- ${w}`);
}

if (blockers.length > 0) {
  process.exit(1);
}
