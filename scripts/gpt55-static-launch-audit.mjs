#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = process.env.GPT55_AUDIT_OUT || 'reports/gpt55-mega-audit/static';
fs.mkdirSync(outDir, { recursive: true });

const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html')).sort();
const redirects = fs.existsSync('_redirects') ? fs.readFileSync('_redirects', 'utf8') : '';
const redirectAliases = new Set();
for (const line of redirects.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [from, to, code] = trimmed.split(/\s+/);
  if (from && to && code === '200') redirectAliases.add(from.replace(/^\//, '').replace(/\/$/, ''));
}

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function hasMetaDescription(html) {
  return /<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["'][^"']{30,}["'][^>]*>/i.test(html)
    || /<meta\b[^>]*\bcontent=["'][^"']{30,}["'][^>]*\bname=["']description["'][^>]*>/i.test(html);
}
function localTargetExists(href) {
  if (!href || /^(#|mailto:|tel:|https?:|javascript:|data:|\/\/)/i.test(href)) return true;
  let target = href.split('?')[0].split('#')[0].replace(/^\//, '').replace(/\/$/, '');
  if (!target) return true;
  if (redirectAliases.has(target)) return true;
  const candidates = [target];
  if (!path.extname(target)) candidates.push(`${target}.html`, path.join(target, 'index.html'));
  return candidates.some((candidate) => fs.existsSync(path.join(root, candidate)));
}

const publicCopyIssues = [];
const metaIssues = [];
const localLinkIssues = [];
const localScriptIssues = [];
const sensitiveAdIssues = [];
const routeStats = [];
const sensitivePages = new Set(['admin.html', 'billing.html', 'vault.html', 'privacy.html', 'terms.html', 'legal.html', 'support.html']);
const internalNeedles = [/\bW\d{2,3}\b/, /\bCodex\b/i, /GPT-?5\.5/i, /handoff/i, /proof bundle/i, /lorem ipsum/i];
function publicText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z0-9#]+;/gi, ' ')
    .replace(/\s+/g, ' ');
}
const adNeedle = /adwixo|monetag|eon-ad-slot|data-ad-slot|rewardGateway|reward-ad-slot|quge5|omg10/i;

for (const file of htmlFiles) {
  const html = read(file);
  routeStats.push({ file, bytes: Buffer.byteLength(html), title: (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || '' });
  const textForPublicCopy = publicText(html);
  const hits = internalNeedles.filter((re) => re.test(textForPublicCopy)).map((re) => String(re));
  if (hits.length) publicCopyIssues.push({ file, hits });
  if (!/<title>[^<]{5,}<\/title>/i.test(html)) metaIssues.push({ file, issue: 'missing_or_short_title' });
  if (!hasMetaDescription(html)) metaIssues.push({ file, issue: 'missing_or_short_description' });
  for (const href of html.matchAll(/href=["']([^"']+)["']/gi)) {
    if (!localTargetExists(href[1])) localLinkIssues.push({ file, href: href[1] });
  }
  for (const src of html.matchAll(/<script\b[^>]+src=["']([^"']+)["']/gi)) {
    const value = src[1].split('?')[0];
    if (!/^(https?:|\/\/|data:)/i.test(value) && !fs.existsSync(path.join(root, value.replace(/^\//, '')))) {
      localScriptIssues.push({ file, src: src[1] });
    }
  }
  if (sensitivePages.has(file) && adNeedle.test(html)) sensitiveAdIssues.push({ file });
}

const secretHits = [];
const secretPatterns = [
  ['openai_like_key', /sk-[A-Za-z0-9_-]{20,}/g],
  ['telegram_bot_token', /\b\d{7,12}:[A-Za-z0-9_-]{30,}\b/g],
  ['raw_private_key_hex', /(?:PRIVATE_KEY\s*=\s*)?0x[a-fA-F0-9]{64}\b/g]
];
const excludedDirs = new Set([
  'node_modules',
  'dist',
  'reports',
  '.git',
  'test-results',
  'playwright-report',
  '.codex-merge-backups',
  'tmp',
  'output',
  'LAUNCH'
]);
function scanDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.tmp')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue;
    const rel = path.relative(root, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (/^Smart Contracts\/(?:artifacts|cache|deployment-manifests)(?:\/|$)/.test(rel)) continue;
      if (!excludedDirs.has(entry.name)) scanDir(full);
      continue;
    }
    if (/^\.env(?:\.|$)/i.test(entry.name) || entry.name === '.env') continue;
    if (/^docs\/COPILOTHANDOVER\.MD$/i.test(rel)) continue;
    if (/\.(png|jpe?g|webp|ico|woff2?|ttf|map|zip|lock)$/i.test(entry.name) || entry.name === 'package-lock.json') continue;
    const text = fs.readFileSync(full, 'utf8');
    for (const [type, re] of secretPatterns) {
      for (const match of text.matchAll(re)) {
        const raw = match[0];
        if (/replace|example|placeholder|should-not-leak|micro-objects|session\d|test-super|w100-browser|00000000/i.test(raw)) continue;
        if (/^Smart Contracts\/deployment-manifests\//.test(rel)) continue;
        const before = text.slice(Math.max(0, match.index - 80), match.index).toLowerCase();
        if (/topic|selector|calldata|hash|address|contract|event|signature/.test(before) && !/private_key/.test(before)) continue;
        secretHits.push({ file: rel, type, line: text.slice(0, match.index).split(/\r?\n/).length, sample: `${raw.slice(0, 14)}…` });
      }
    }
  }
}
scanDir(root);

const result = {
  schema: 'eonapp.gpt55.static-launch-audit.v1',
  checkedAt: new Date().toISOString(),
  htmlRouteCount: htmlFiles.length,
  redirectAliasCount: redirectAliases.size,
  ok: publicCopyIssues.length === 0 && metaIssues.length === 0 && localLinkIssues.length === 0 && localScriptIssues.length === 0 && sensitiveAdIssues.length === 0 && secretHits.length === 0,
  findings: {
    publicCopyIssues,
    metaIssues,
    localLinkIssues,
    localScriptIssues,
    sensitiveAdIssues,
    secretHits,
    largestHtml: routeStats.sort((a, b) => b.bytes - a.bytes).slice(0, 12).map((item) => ({ ...item, kb: Math.round(item.bytes / 102.4) / 10 }))
  }
};

fs.writeFileSync(path.join(outDir, 'static-launch-audit.json'), `${JSON.stringify(result, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'static-launch-audit.md'), [
  '# GPT-5.5 Static Launch Audit',
  '',
  `Status: ${result.ok ? 'PASS' : 'REVIEW'}`,
  `HTML routes: ${result.htmlRouteCount}`,
  `Redirect aliases understood: ${result.redirectAliasCount}`,
  '',
  `Public-copy issues: ${publicCopyIssues.length}`,
  `Meta issues: ${metaIssues.length}`,
  `Missing local href targets: ${localLinkIssues.length}`,
  `Missing local script targets: ${localScriptIssues.length}`,
  `Sensitive-page ad marker issues: ${sensitiveAdIssues.length}`,
  `Secret-like review hits: ${secretHits.length}`,
  '',
  'Top large HTML files:',
  ...result.findings.largestHtml.map((item) => `- ${item.file}: ${item.kb} KB — ${item.title}`)
].join('\n'));
console.log(JSON.stringify(result, null, 2));
if (secretHits.length || localScriptIssues.length || sensitiveAdIssues.length) process.exit(1);
