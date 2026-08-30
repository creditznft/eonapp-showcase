#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
  scanFinancialClaims,
  scanHtmlBasics,
  scanSensitivePageAds,
  scanServiceWorkerSafety,
  scanCreatorCommerceText,
  buildRouteOwnershipMap,
  validateRouteOwnershipMap
} from '../assets/js/utils/app-surface-quality-gates.js';

const root = process.cwd();
const corePages = [
  'index.html',
  'chat.html',
  'projects.html',
  'library.html',
  'workspace.html',
  'vault.html',
  'market.html',
  'eoncity.html',
  'eoncity-lite.html',
  'eoncity-3d.html',
  'realm-studio.html',
  'trade.html',
  'rewards.html',
  'billing.html',
  'privacy.html',
  'terms.html',
  'legal.html',
  'help.html'
];

const blockers = [];
const warnings = [];
const evidence = [];

function readSafe(path) {
  try {
    return readFileSync(join(root, path), 'utf8');
  } catch {
    return '';
  }
}

for (const page of corePages) {
  if (!existsSync(join(root, page))) {
    warnings.push(`Core page missing or intentionally absent: ${page}`);
    continue;
  }
  const html = readSafe(page);
  const basics = scanHtmlBasics(page, html);
  // Allow old tool pages to be imperfect but keep primary pages strict.
  const strictPage = /^(index|chat|projects|library|workspace|vault|market|eoncity|eoncity-lite|eoncity-3d|realm-studio|trade|rewards|billing|privacy|terms|legal|help)\.html$/.test(page);
  if (strictPage) blockers.push(...basics);
  else warnings.push(...basics);
  blockers.push(...scanFinancialClaims(html).map((issue) => `${page}: ${issue}`));
  blockers.push(...scanSensitivePageAds(page, html));
  evidence.push(`${page}: scanned`);
}

const realmStudio = readSafe('realm-studio.html');
// Realm Studio creates local identities and portable signed links only. It has
// no sale, payout, owner split, or commercial routing while W215 is disabled.
if (!/data-monetization=["']disabled["']/i.test(realmStudio)) {
  warnings.push(...scanCreatorCommerceText(realmStudio).map((issue) => `realm-studio.html: ${issue}`));
}

for (const swPath of ['sw.js', 'public/sw.js']) {
  if (existsSync(join(root, swPath))) {
    blockers.push(...scanServiceWorkerSafety(readSafe(swPath)).map((issue) => `${swPath}: ${issue}`));
  } else {
    blockers.push(`${swPath} missing.`);
  }
}

const routeValidation = validateRouteOwnershipMap(buildRouteOwnershipMap());
if (!routeValidation.ok) blockers.push(...routeValidation.issues);

// Lightweight old-game promotion check.
const appDataPath = join(root, 'assets/js/app-data.js');
if (existsSync(appDataPath)) {
  const appData = readFileSync(appDataPath, 'utf8');
  const gameSlugMatches = [...appData.matchAll(/slug\s*:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const promotedOldGames = gameSlugMatches.filter((slug) => slug && !/realm|world|eon-city/i.test(slug));
  if (promotedOldGames.length) warnings.push(`Potential non-RealmWorld game slugs still promoted: ${promotedOldGames.join(', ')}`);
}

mkdirSync('CodexDocs', { recursive: true });
const markdown = [
  '# EONAPP App Surface Quality Gate Report',
  '',
  `Date: ${new Date().toISOString().slice(0, 10)}`,
  '',
  `Blockers: ${blockers.length}`,
  `Warnings: ${warnings.length}`,
  '',
  '## Blockers',
  ...(blockers.length ? blockers.map((item) => `- ${item}`) : ['- None']),
  '',
  '## Warnings',
  ...(warnings.length ? warnings.map((item) => `- ${item}`) : ['- None']),
  '',
  '## Evidence',
  ...evidence.map((item) => `- ${item}`),
  ''
].join('\n');

const outPath = 'CodexDocs/EONAPP_W216_APP_SURFACE_QUALITY_GATE_REPORT_2026-06-23.md';
writeFileSync(outPath, `${markdown}\n`);
console.log(`Wrote ${outPath}`);
console.log(`App surface quality gate: ${blockers.length ? 'FAIL' : 'PASS'} (${blockers.length} blockers, ${warnings.length} warnings)`);
if (blockers.length) process.exit(1);
