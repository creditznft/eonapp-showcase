import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const auditDir = path.join(repoRoot, 'CodexAuditPack');
const outputJson = path.join(auditDir, 'lighthouse-routes.json');
const outputMd = path.join(auditDir, 'lighthouse-routes.md');

const PUBLIC_ALIAS_ROUTES = [
  '/',
  '/chat',
  '/vault',
  '/market',
  '/marketplace',
  '/realm',
  '/trade',
  '/subscription',
  '/onboarding',
  '/creator-studio',
  '/workbench',
  '/tools',
  '/eon-browser',
  '/reward-access',
];

const EXCLUDED_EXACT = new Set(['/404.html', '/offline.html']);
const EXCLUDED_SEGMENT_RE = [
  /(^|\/)legacy-archive(\/|$)/i,
  /(^|\/)private(\/|$)/i,
  /(^|\/)debug(\/|$)/i,
  /(^|\/)dev(\/|$)/i,
  /(^|\/)draft(\/|$)/i,
  /(^|\/)internal(\/|$)/i,
];

function normalizeSlashes(value) {
  return String(value || '').replace(/\\/g, '/');
}

function isClearlyNonPublic(relPath) {
  const normalized = normalizeSlashes(relPath).replace(/^\.\//, '');
  if (EXCLUDED_EXACT.has(`/${normalized}`) || EXCLUDED_EXACT.has(normalized)) return true;
  if (/^admin\.html$/i.test(normalized)) return true;
  if (/^campaign-admin\.html$/i.test(normalized)) return true;
  if (/^serve-/i.test(path.basename(normalized))) return true;
  return EXCLUDED_SEGMENT_RE.some((re) => re.test(normalized));
}

async function walkFiles(rootDir, filter = () => true) {
  const output = [];
  async function walk(currentDir) {
    let entries = [];
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absolute = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }
      const rel = normalizeSlashes(path.relative(rootDir, absolute));
      if (filter(rel)) output.push(rel);
    }
  }
  await walk(rootDir);
  return output;
}

function toCandidateRoutes(relPath) {
  const normalized = normalizeSlashes(relPath).replace(/^\.\//, '');
  const routes = new Set();
  if (!normalized.endsWith('.html')) return routes;

  const filePath = `/${normalized}`;
  if (normalized === 'index.html') {
    routes.add('/');
    routes.add('/index.html');
    return routes;
  }

  routes.add(filePath);
  if (normalized.endsWith('/index.html')) {
    const base = `/${normalized.slice(0, -'index.html'.length)}`;
    routes.add(base);
    routes.add(base.endsWith('/') ? base.slice(0, -1) : `${base}/`);
  } else {
    routes.add(filePath.replace(/\.html$/i, ''));
  }
  return routes;
}

function relPathToDisplay(relPath) {
  return normalizeSlashes(relPath).replace(/^\.\//, '');
}

async function collectHtmlSources() {
  const sources = [];
  const rootHtml = await walkFiles(repoRoot, (rel) => /^([^/]+\.html)$/i.test(rel));
  const toolsHtml = await walkFiles(path.join(repoRoot, 'tools'), (rel) => rel.toLowerCase().endsWith('.html'));
  const gamesHtml = await walkFiles(path.join(repoRoot, 'games'), (rel) => rel.toLowerCase().endsWith('.html'));
  const blogHtml = await walkFiles(path.join(repoRoot, 'blog'), (rel) => rel.toLowerCase().endsWith('.html'));
  const campaignsRoot = path.join(repoRoot, 'campaigns');
  const campaignsHtml = await walkFiles(campaignsRoot, (rel) => rel.toLowerCase().endsWith('.html'));
  const distRoot = path.join(repoRoot, 'dist');
  let distHtml = [];
  try {
    await fs.access(distRoot);
    distHtml = await walkFiles(distRoot, (rel) => rel.toLowerCase().endsWith('.html'));
  } catch {}

  for (const [group, files] of [
    ['root', rootHtml],
    ['tools', toolsHtml],
    ['games', gamesHtml],
    ['blog', blogHtml],
    ['campaigns', campaignsHtml],
    ['dist', distHtml],
  ]) {
    for (const rel of files) {
      if (isClearlyNonPublic(rel)) continue;
      sources.push({ group, rel: relPathToDisplay(rel) });
    }
  }
  return sources;
}

function uniqueRoutes(sources, canonicalRelPaths) {
  const routes = new Map();
  const routeSources = canonicalRelPaths.length ? canonicalRelPaths : sources;
  for (const source of routeSources) {
    const candidateRoutes = toCandidateRoutes(source.rel);
    for (const route of candidateRoutes) {
      if (!route || route === '/index.html') continue;
      if (isClearlyNonPublic(route.replace(/^\//, ''))) continue;
      if (!routes.has(route)) {
        routes.set(route, { route, source: source.rel, group: source.group });
      }
    }
  }

  for (const alias of PUBLIC_ALIAS_ROUTES) {
    if (!routes.has(alias)) {
      routes.set(alias, { route: alias, source: 'explicit-alias', group: 'alias' });
    }
  }

  return [...routes.values()].sort((a, b) => a.route.localeCompare(b.route));
}

function buildMarkdown(routes, meta) {
  const lines = [];
  lines.push('# Lighthouse Route Audit');
  lines.push('');
  lines.push(`- Branch: \`${meta.branch}\``);
  lines.push(`- Commit: \`${meta.commit}\``);
  lines.push(`- Generated: \`${meta.generatedAt}\``);
  lines.push(`- Route count: \`${routes.length}\``);
  lines.push('');
  lines.push('| Route | Source | Group |');
  lines.push('| --- | --- | --- |');
  for (const row of routes) {
    lines.push(`| \`${row.route}\` | ${row.source} | ${row.group} |`);
  }
  lines.push('');
  return lines.join('\n');
}

async function main() {
  await fs.mkdir(auditDir, { recursive: true });
  const sources = await collectHtmlSources();
  const distSources = sources.filter((source) => source.group === 'dist');
  const routes = uniqueRoutes(sources, distSources);
  function safeGit(args, fallback) {
    if (process.env.EON_FORCE_NO_GIT === '1') {
      return fallback;
    }
    try {
      return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || fallback;
    } catch {
      return fallback;
    }
  }

  const meta = {
    schema: 'eon.lighthouse.routes.v2',
    repoRoot,
    branch: safeGit(['branch', '--show-current'], 'no-git-archive'),
    commit: safeGit(['rev-parse', '--short', 'HEAD'], 'no-git-archive'),
    generatedAt: new Date().toISOString(),
    routeCount: routes.length,
    aliasCount: PUBLIC_ALIAS_ROUTES.length,
  };

  const payload = { ...meta, routes, sources, canonicalRouteSources: distSources.length ? distSources : sources };
  await fs.writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  await fs.writeFile(outputMd, `${buildMarkdown(routes, meta)}`, 'utf8');
  console.log(JSON.stringify({ ok: true, routeCount: routes.length, outputJson, outputMd }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
