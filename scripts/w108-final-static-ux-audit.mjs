import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const reports = path.join(root, 'reports');
const auditPack = path.join(root, 'CodexAuditPack', 'W108_FINAL_UX');
fs.mkdirSync(reports, { recursive: true });
fs.mkdirSync(auditPack, { recursive: true });

const stripTags = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/\s+/g, ' ')
  .trim();

const titleOf = (html) => html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
const h1Of = (html) => stripTags(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
const htmlFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(full);
  }
}
walk(dist);

const badPatterns = [
  { key: 'mojibake-lightning', regex: /âš/i },
  { key: 'mojibake-copyright', regex: /Â©|Â·/i },
  { key: 'mojibake-generic', regex: /Ã.|â€™|â€œ|â€\u009d|â€¦/i },
  { key: 'old-market-empty', regex: /No items match your search/i },
  { key: 'old-home-phrase', regex: /Talk instead of typing/i }
];

const coreRoutes = [
  { file: 'index.html', route: '/', signals: ['EON City', 'EONBOT', 'AI Cockpit', 'Market'] },
  { file: 'market.html', route: '/market', signals: ['starter NFT', 'personal', 'EON City'] },
  { file: 'marketplace.html', route: '/marketplace', signals: ['Commercial truth', 'seller policy', 'No profit promise'] },
  { file: 'trust.html', route: '/trust', signals: ['What stays local', 'Marketplace', 'IoT', 'Payment'] },
  { file: 'realm.html', route: '/realm', signals: ['EON City', 'Device Lab', 'Private Workstation'] },
  { file: 'creator-studio.html', route: '/create', signals: ['Start with idea', 'Make video package', 'Advanced Creator Tools'] },
  { file: 'workbench.html', route: '/build', signals: ['Ask', 'Build', 'Launch', 'Device Lab'] },
  { file: 'vault.html', route: '/vault', signals: ['Vault'] },
  { file: 'chat.html', route: '/chat.html', signals: ['Chat'] },
  { file: 'eon-browser.html', route: '/eon-browser.html', signals: ['Cockpit'] }
];

const lowTextAllowed = new Set(['games/cyber-rogue/index.html', 'games/realm-wars-lite/index.html', 'realm-code-preview.html', 'signal.html']);
const allResults = [];
const failures = [];
for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const text = stripTags(html);
  const rel = path.relative(dist, file).replaceAll(path.sep, '/');
  const bad = badPatterns.filter((p) => p.regex.test(html) || p.regex.test(text)).map((p) => p.key);
  const title = titleOf(html);
  const h1 = h1Of(html);
  const result = {
    file: rel,
    title,
    h1,
    textLength: text.length,
    badPatterns: bad,
    hasMain: /<main[\s>]/i.test(html),
    bodyPreview: text.slice(0, 260)
  };
  allResults.push(result);
  if (bad.length || !title || (text.length < 120 && !lowTextAllowed.has(rel))) failures.push(result);
}

const coreResults = coreRoutes.map((route) => {
  const htmlPath = path.join(dist, route.file);
  const exists = fs.existsSync(htmlPath);
  const html = exists ? fs.readFileSync(htmlPath, 'utf8') : '';
  const text = stripTags(html);
  const missingSignals = route.signals.filter((signal) => !text.toLowerCase().includes(signal.toLowerCase()));
  const bad = badPatterns.filter((p) => p.regex.test(html) || p.regex.test(text)).map((p) => p.key);
  const passed = exists && missingSignals.length === 0 && bad.length === 0;
  if (!passed) failures.push({ file: route.file, route: route.route, missingSignals, badPatterns: bad });
  return { route: route.route, file: route.file, exists, title: titleOf(html), h1: h1Of(html), missingSignals, badPatterns: bad, passed };
});

const summary = {
  schema: 'eon.w108.final.static.ux.audit.v1',
  generatedAt: new Date().toISOString(),
  htmlFiles: htmlFiles.length,
  coreRoutes: coreRoutes.length,
  allHtmlPass: failures.length === 0,
  failureCount: failures.length,
  corePassed: coreResults.filter((r) => r.passed).length,
  coreFailed: coreResults.filter((r) => !r.passed).length,
  checks: {
    noVisibleMojibakeInDistHtml: allResults.every((r) => !r.badPatterns.some((x) => x.startsWith('mojibake'))),
    noOldMarketEmptyPhraseInDistHtml: allResults.every((r) => !r.badPatterns.includes('old-market-empty')),
    noOldHomePhraseInDistHtml: allResults.every((r) => !r.badPatterns.includes('old-home-phrase')),
    allCoreRoutesHaveProductSignals: coreResults.every((r) => r.passed),
    allHtmlHasTitles: allResults.every((r) => Boolean(r.title))
  },
  coreResults,
  failures,
  allResults
};

const json = JSON.stringify(summary, null, 2);
fs.writeFileSync(path.join(reports, 'W108_FINAL_STATIC_UX_AUDIT.json'), json);
fs.writeFileSync(path.join(auditPack, 'W108_FINAL_STATIC_UX_AUDIT.json'), json);

const md = [];
md.push('# W108 Final Static UX Audit');
md.push('');
md.push(`Generated: ${summary.generatedAt}`);
md.push(`Dist HTML files scanned: ${summary.htmlFiles}`);
md.push(`Core routes passed: ${summary.corePassed}/${summary.coreRoutes}`);
md.push(`Failures: ${summary.failureCount}`);
md.push('');
md.push('## Checks');
md.push('');
for (const [key, value] of Object.entries(summary.checks)) md.push(`- ${key}: ${value ? 'PASS' : 'FAIL'}`);
md.push('');
md.push('## Core route summary');
md.push('');
md.push('| Route | File | Title | H1 | Result |');
md.push('|---|---|---|---|---|');
for (const r of coreResults) md.push(`| ${r.route} | ${r.file} | ${r.title.replace(/\|/g, '/')} | ${(r.h1 || '').replace(/\|/g, '/')} | ${r.passed ? 'PASS' : `FAIL: missing ${r.missingSignals.join(', ')} bad ${r.badPatterns.join(', ')}`} |`);
if (failures.length) {
  md.push('');
  md.push('## Failures');
  md.push('');
  for (const f of failures) md.push(`- ${f.file || f.route}: ${JSON.stringify(f.badPatterns || f.missingSignals || f)}`);
}
fs.writeFileSync(path.join(reports, 'W108_FINAL_STATIC_UX_AUDIT.md'), md.join('\n'));
fs.writeFileSync(path.join(auditPack, 'W108_FINAL_STATIC_UX_AUDIT.md'), md.join('\n'));

if (summary.failureCount > 0) {
  console.error(`W108 static UX audit failed with ${summary.failureCount} issue(s).`);
  process.exit(1);
}
console.log(`W108 static UX audit passed: ${summary.htmlFiles} HTML files, ${summary.corePassed}/${summary.coreRoutes} core routes.`);
