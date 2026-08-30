#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getW477SeoDirectiveForFile, renderW477RobotsTxt, renderW477SitemapXml, validateW477RouteSeoLegacyContract, W477_NOINDEX_ROUTE_FILES, W477_SEARCH_INDEX_ROUTES } from '../config/w477-route-seo-legacy-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Some maintained editorial documents are intentionally compacted onto one
// line. Match metadata anywhere in the head, rather than only at a line start,
// so normalization replaces every stale/duplicate tag with one authority tag.
const CANONICAL_LINE_PATTERN = /[\t ]*<link\b(?=[^>]*\brel=[\"']canonical[\"'])[^>]*>[\t ]*(?:\r?\n)?/gim;
const ROBOTS_LINE_PATTERN = /[\t ]*<meta\b(?=[^>]*\bname=[\"']robots[\"'])[^>]*>[\t ]*(?:\r?\n)?/gim;

function writeIfChanged(relative, content) {
  const target = path.join(ROOT, relative);
  const previous = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
  if (previous === content) return false;
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  return true;
}

function replaceOrInsert(source, pattern, tag, lineEnding) {
  pattern.lastIndex = 0;
  const withoutExisting = source.replace(pattern, '');
  return withoutExisting.replace(/([\t ]*)<\/head>/i, `${tag}${lineEnding}$1</head>`);
}

export function normalizeHtmlSeoSource(source, directive) {
  // Source control normalizes these generated tags to LF. Using LF here keeps
  // the generator idempotent across Windows worktrees without adding CR-as-
  // trailing-whitespace diffs to a release candidate.
  const lineEnding = '\n';
  const canonicalTag = `  <link rel=\"canonical\" href=\"${directive.canonical}\" />`;
  const robotsTag = `  <meta name=\"robots\" content=\"${directive.robots}\" />`;
  let html = replaceOrInsert(source, CANONICAL_LINE_PATTERN, canonicalTag, lineEnding);
  html = replaceOrInsert(html, ROBOTS_LINE_PATTERN, robotsTag, lineEnding);
  return html;
}

function normalizeHtmlSeo(relative, directive) {
  const absolute = path.join(ROOT, relative);
  const html = normalizeHtmlSeoSource(fs.readFileSync(absolute, 'utf8'), directive);
  writeIfChanged(relative, html);
}

function main() {
  const errors = validateW477RouteSeoLegacyContract();
  if (errors.length) throw new Error(`Invalid W477 SEO contract:\n${errors.map((error) => `- ${error}`).join('\n')}`);
  const directives = [...W477_SEARCH_INDEX_ROUTES, ...W477_NOINDEX_ROUTE_FILES];
  for (const entry of directives) {
    const directive = getW477SeoDirectiveForFile(entry.file);
    if (!directive) throw new Error(`Missing W477 directive for ${entry.file}`);
    normalizeHtmlSeo(entry.file, directive);
  }
  const sitemap = renderW477SitemapXml();
  const robots = renderW477RobotsTxt();
  writeIfChanged('sitemap.xml', sitemap);
  writeIfChanged('robots.txt', robots);
  writeIfChanged('public/sitemap.xml', sitemap);
  writeIfChanged('public/robots.txt', robots);
  process.stdout.write(JSON.stringify({
    ok: true,
    schema: 'eonapp.w477.route-seo-sync.v1',
    htmlDocuments: directives.length,
    generated: ['sitemap.xml', 'robots.txt', 'public/sitemap.xml', 'public/robots.txt']
  }, null, 2) + '\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
