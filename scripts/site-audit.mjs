import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createStaticRouteFileMap } from '../config/route-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const HTML_SCAN_DIRS = ['tools', 'games', 'blog', 'campaigns'];
const ROUTE_ALIASES = createStaticRouteFileMap();

function walkHtml(dirPath, acc) {
  if (!fs.existsSync(dirPath)) {
    return;
  }
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkHtml(full, acc);
      continue;
    }
    if (entry.isFile() && full.endsWith('.html')) {
      acc.push(full);
    }
  }
}

function normalizeLocalTarget(baseFile, rawTarget) {
  if (!rawTarget) return null;
  if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(rawTarget)) return null;
  if (rawTarget.startsWith('//')) return null;
  if (rawTarget.startsWith('#')) return null;

  let target = rawTarget.split('#')[0].split('?')[0];
  if (!target) return null;

  if (target.startsWith('/')) {
    const routeTarget = ROUTE_ALIASES.get(target.replace(/\/$/, '') || '/');
    if (routeTarget) {
      return path.join(ROOT, routeTarget);
    }
    const rootRelative = target.replace(/^\/+/, '');
    target = path.join(ROOT, rootRelative);
    // Vite serves files under public/ from the site root. During a source audit,
    // accept that canonical source location when the same root-relative file is
    // intentionally absent from ROOT itself.
    if (!fs.existsSync(target)) {
      const publicTarget = path.join(ROOT, 'public', rootRelative);
      if (fs.existsSync(publicTarget)) target = publicTarget;
    }
  } else {
    target = path.resolve(path.dirname(baseFile), target);
  }

  if (target.endsWith(path.sep)) {
    target = path.join(target, 'index.html');
  }

  return target;
}

function parseAttrTargets(html) {
  const targets = [];
  const regex = /\b(?:href|src)=["']([^"']+)["']/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const target = match[1];
    // Ignore JS template placeholders that are resolved at runtime.
    if (target.includes('${')) {
      continue;
    }
    // about:blank is an intentional placeholder iframe target.
    if (target === 'about:blank') {
      continue;
    }
    targets.push(target);
  }
  return targets;
}

function loadAppData() {
  const appDataPath = path.join(ROOT, 'assets', 'js', 'app-data.js');
  const source = fs.readFileSync(appDataPath, 'utf8').replace(/\bexport\s+/g, '');
  const sandbox = { globalThis: {} };
  vm.runInNewContext(`${source}\nglobalThis.__APP_DATA__ = { TOOLS, GAMES };`, sandbox);
  return sandbox.globalThis.__APP_DATA__;
}

function parseSitemapLocs() {
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    return [];
  }
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

function parseSwPrecache() {
  const swPath = path.join(ROOT, 'sw.js');
  if (!fs.existsSync(swPath)) {
    return [];
  }
  const source = fs.readFileSync(swPath, 'utf8');
  const match = source.match(/const PRECACHE = \[([\s\S]*?)\];/);
  if (!match) {
    return [];
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

const errors = [];
const htmlFiles = [];
for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) {
    htmlFiles.push(path.join(ROOT, entry.name));
  }
}
for (const dir of HTML_SCAN_DIRS) {
  walkHtml(path.join(ROOT, dir), htmlFiles);
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const targets = parseAttrTargets(html);
  for (const target of targets) {
    const localPath = normalizeLocalTarget(file, target);
    if (!localPath) continue;
    if (!fs.existsSync(localPath)) {
      errors.push({
        kind: 'broken-html-ref',
        file: path.relative(ROOT, file),
        ref: target,
        resolved: path.relative(ROOT, localPath),
      });
    }
  }
}

const { TOOLS = [], GAMES = [] } = loadAppData();
for (const item of [...TOOLS, ...GAMES]) {
  if (!item?.url) continue;
  const localPath = normalizeLocalTarget(path.join(ROOT, 'assets', 'js', 'app-data.js'), item.url);
  if (!localPath || fs.existsSync(localPath)) continue;
  errors.push({
    kind: 'missing-item-url',
    file: 'assets/js/app-data.js',
    ref: item.url,
    resolved: path.relative(ROOT, localPath),
    status: item.status || 'unknown',
  });
}

for (const loc of parseSitemapLocs()) {
  if (!/^https?:\/\/eonapp\.ch\//i.test(loc)) continue;
  const url = new URL(loc);
  const localPath = normalizeLocalTarget(path.join(ROOT, 'sitemap.xml'), url.pathname);
  if (!localPath || fs.existsSync(localPath)) continue;
  errors.push({
    kind: 'broken-sitemap-url',
    file: 'sitemap.xml',
    ref: loc,
    resolved: path.relative(ROOT, localPath),
  });
}

for (const entry of parseSwPrecache()) {
  const localPath = normalizeLocalTarget(path.join(ROOT, 'sw.js'), entry);
  if (!localPath || fs.existsSync(localPath)) continue;
  errors.push({
    kind: 'missing-precache-entry',
    file: 'sw.js',
    ref: entry,
    resolved: path.relative(ROOT, localPath),
  });
}

if (errors.length > 0) {
  console.error(`Site audit failed with ${errors.length} issue(s):`);
  for (const issue of errors) {
    console.error(`- [${issue.kind}] ${issue.file} -> "${issue.ref}" (resolved: ${issue.resolved})`);
  }
  process.exit(1);
}

console.log(`Site audit passed: ${htmlFiles.length} HTML files scanned, ${TOOLS.length} tools, ${GAMES.length} games, sitemap + precache verified.`);
