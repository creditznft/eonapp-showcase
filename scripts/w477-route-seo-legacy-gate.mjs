#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RETIRED_REDIRECTS } from '../config/route-contract.mjs';
import { TIER_3_RETIRED_ROOT_DOCUMENTS } from '../config/route-tiering.mjs';
import {
  canonicalUrl,
  getW477SeoDirectiveForFile,
  renderW477RobotsTxt,
  renderW477SitemapXml,
  validateW477RouteSeoLegacyContract,
  W477_NOINDEX_ROUTE_FILES,
  W477_PRIMARY_PUBLIC_DESTINATIONS,
  W477_QUARANTINE_POLICY,
  W477_SEARCH_INDEX_ROUTES
} from '../config/w477-route-seo-legacy-contract.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

function extractTagAttribute(html, tagName, attribute, matchName, matchValue) {
  const pattern = new RegExp(`<${tagName}\\b(?=[^>]*\\b${matchName}=["']${matchValue}["'])[^>]*\\b${attribute}=["']([^"']+)["'][^>]*>`, 'i');
  return html.match(pattern)?.[1] || '';
}

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

export function inspectW477RouteSeoLegacy({ writeArtifact = false } = {}) {
  const errors = [...validateW477RouteSeoLegacyContract()];
  const warnings = [];
  const directives = [...W477_SEARCH_INDEX_ROUTES, ...W477_NOINDEX_ROUTE_FILES];
  const expectedSitemap = renderW477SitemapXml();
  const expectedRobots = renderW477RobotsTxt();
  const sitemapPaths = sitemapUrls(expectedSitemap).map((url) => new URL(url).pathname);

  for (const entry of directives) {
    if (!exists(entry.file)) {
      errors.push(`Missing W477 SEO document: ${entry.file}`);
      continue;
    }
    const directive = getW477SeoDirectiveForFile(entry.file);
    const html = read(entry.file);
    const canonical = extractTagAttribute(html, 'link', 'href', 'rel', 'canonical');
    const robots = extractTagAttribute(html, 'meta', 'content', 'name', 'robots');
    if (canonical !== directive.canonical) errors.push(`${entry.file} canonical mismatch: ${canonical || '(missing)'}`);
    if (robots.toLowerCase() !== directive.robots.toLowerCase()) errors.push(`${entry.file} robots mismatch: ${robots || '(missing)'}`);
    if (!/<title>[^<]+<\/title>/i.test(html)) errors.push(`${entry.file} is missing a page title.`);
  }

  for (const [relative, expected] of [['sitemap.xml', expectedSitemap], ['public/sitemap.xml', expectedSitemap], ['robots.txt', expectedRobots], ['public/robots.txt', expectedRobots]]) {
    if (!exists(relative)) errors.push(`Missing generated W477 file: ${relative}`);
    else if (read(relative) !== expected) errors.push(`${relative} is out of sync. Run node scripts/sync-w477-route-seo.mjs.`);
  }

  for (const primaryPath of W477_PRIMARY_PUBLIC_DESTINATIONS) {
    if (!sitemapPaths.includes(primaryPath)) errors.push(`Primary public destination absent from sitemap: ${primaryPath}`);
  }
  for (const retired of RETIRED_REDIRECTS) {
    const retiredUrl = canonicalUrl(retired.from);
    if (sitemapUrls(expectedSitemap).includes(retiredUrl)) errors.push(`Redirect-only route appears in sitemap: ${retired.from}`);
  }
  for (const entry of W477_NOINDEX_ROUTE_FILES) {
    if (sitemapPaths.includes(entry.path)) errors.push(`Noindex route appears in sitemap: ${entry.path}`);
  }

  const quarantineCandidates = TIER_3_RETIRED_ROOT_DOCUMENTS.map((file) => {
    const redirect = RETIRED_REDIRECTS.find((entry) => entry.from === `/${file}`);
    const sourceExists = exists(file);
    return {
      file,
      sourceExists,
      redirectContracted: Boolean(redirect),
      redirectTarget: redirect?.to || null,
      publicIndexable: W477_SEARCH_INDEX_ROUTES.some((entry) => entry.file === file),
      action: sourceExists ? W477_QUARANTINE_POLICY.mode : 'already-removed-from-public-source-keep-redirect-ledger'
    };
  });
  const unreadyQuarantine = quarantineCandidates.filter((entry) => !entry.redirectContracted || entry.publicIndexable);
  if (unreadyQuarantine.length) errors.push(`Legacy quarantine ledger is invalid for: ${unreadyQuarantine.map((entry) => entry.file).join(', ')}`);

  const releaseBlockers = [
    'W476-B reviewed deployed browser/device evidence is still required before legacy source is moved or deleted.',
    'W477 external-origin classification and CSP narrowing require real browser network observations; broad scheme allowances are not approved by this static gate.',
    'This source gate verifies canonical/SEO contracts only. It does not certify cache behaviour, search-console ingestion, browser redirect caching or production headers.'
  ];
  warnings.push(...releaseBlockers);

  const report = Object.freeze({
    schema: 'eonapp.w477.route-seo-legacy-gate.v1',
    sourceStatus: errors.length ? 'fail' : 'pass',
    releaseStatus: 'blocked-pending-reviewed-live-evidence',
    indexedRouteCount: W477_SEARCH_INDEX_ROUTES.length,
    noindexRouteCount: W477_NOINDEX_ROUTE_FILES.length,
    primaryPublicDestinations: W477_PRIMARY_PUBLIC_DESTINATIONS,
    quarantinePolicy: W477_QUARANTINE_POLICY,
    quarantineCandidates,
    errors: Object.freeze(errors),
    blockers: Object.freeze(releaseBlockers)
  });

  if (writeArtifact) {
    const outDir = path.join(root, 'artifacts', 'w477-route-seo-legacy-gate');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = inspectW477RouteSeoLegacy({ writeArtifact: true });
  assert.equal(report.sourceStatus, 'pass', report.errors.join('\n'));
  process.stdout.write(`W477 route/SEO/legacy source gate passed (${report.indexedRouteCount} indexable, ${report.noindexRouteCount} noindex, ${report.quarantineCandidates.length} reversible quarantine candidates).\n`);
}
