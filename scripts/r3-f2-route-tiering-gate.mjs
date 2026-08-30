#!/usr/bin/env node
/** R3-F2 — route tiers and active-root simplification gate. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRIMARY_APP_ROUTES, INFORMATIONAL_ROUTES, COMPATIBILITY_ROUTES, RETIRED_REDIRECTS } from '../config/route-contract.mjs';
import { ROUTE_TIERING_SCHEMA, TIER_0_PRIMARY_IDS, TIER_3_RETIRED_ROOT_DOCUMENTS, ROOT_DOCUMENT_EXCEPTIONS } from '../config/route-tiering.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVE = path.join(ROOT, 'archive', 'retired-route-surfaces');
const MANIFEST = path.join(ARCHIVE, 'MANIFEST.json');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const relative = (file) => path.relative(ROOT, file).replaceAll('\\', '/');
const canonicalTextBytes = (file) => Buffer.from(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'), 'utf8');
const sha256CanonicalText = (file) => crypto.createHash('sha256').update(canonicalTextBytes(file)).digest('hex');

let manifest;
try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch (error) { errors.push(`Unable to read R3-F2 manifest: ${error.message}`); }
assert(manifest?.schema === 'eonapp.r3-f2.retired-route-surfaces.v1', 'R3-F2 route archive schema is missing or invalid.');
const entries = Array.isArray(manifest?.entries) ? manifest.entries : [];
assert(entries.length === TIER_3_RETIRED_ROOT_DOCUMENTS.length, `R3-F2 archive must contain exactly ${TIER_3_RETIRED_ROOT_DOCUMENTS.length} retired root documents.`);

for (const file of TIER_3_RETIRED_ROOT_DOCUMENTS) {
  const entry = entries.find((item) => item.originalPath === file);
  assert(Boolean(entry), `R3-F2 manifest lacks ${file}.`);
  assert(!fs.existsSync(path.join(ROOT, file)), `Tier-3 retired document is still active at root: ${file}`);
  if (entry) {
    const archived = path.join(ROOT, entry.archivePath);
    assert(fs.existsSync(archived), `Archived Tier-3 document missing: ${entry.archivePath}`);
    if (fs.existsSync(archived)) {
      const canonicalBytes = canonicalTextBytes(archived);
      assert(sha256CanonicalText(archived) === entry.sha256, `Archive hash mismatch: ${entry.archivePath}`);
      assert(canonicalBytes.length === entry.bytes, `Archive byte-count mismatch: ${entry.archivePath}`);
    }
  }
  const directRedirect = RETIRED_REDIRECTS.find((row) => row.from === `/${file}` && row.status === 301);
  assert(Boolean(directRedirect), `Tier-3 document lacks a 301 redirect contract: /${file}`);
}

const tier0Ids = new Set(TIER_0_PRIMARY_IDS);
const allCanonical = [...PRIMARY_APP_ROUTES, ...INFORMATIONAL_ROUTES, ...COMPATIBILITY_ROUTES];

const listFiles = (folder, predicate) => {
  if (!fs.existsSync(folder)) return [];
  const rows = [];
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, entry.name);
    if (entry.isDirectory()) rows.push(...listFiles(full, predicate));
    else if (predicate(full)) rows.push(full);
  }
  return rows;
};
const retiredRoutePaths = TIER_3_RETIRED_ROOT_DOCUMENTS.flatMap((file) => [`/${file}`, `/${file.replace(/\.html$/, '')}`]);
const hasDirectRetiredHref = (text) => retiredRoutePaths.some((route) => text.includes(`href="${route}"`) || text.includes(`href='${route}'`));
const hasDirectRetiredNavigation = (text) => retiredRoutePaths.some((route) => [
  `location.href = '${route}'`, `location.href = "${route}"`,
  `window.location.href = '${route}'`, `window.location.href = "${route}"`,
  `location.assign('${route}'`, `location.assign("${route}"`,
  `location.replace('${route}'`, `location.replace("${route}"`,
  `window.open('${route}'`, `window.open("${route}"`
].some((token) => text.includes(token)));
const topLevelLiveHtml = fs.readdirSync(ROOT)
  .filter((file) => file.endsWith('.html'))
  .map((file) => path.join(ROOT, file));
const nestedLiveHtml = [path.join(ROOT, 'blog'), path.join(ROOT, 'tools'), path.join(ROOT, 'games')]
  .flatMap((folder) => listFiles(folder, (row) => row.endsWith('.html')));
for (const file of [...topLevelLiveHtml, ...nestedLiveHtml]) {
  const text = fs.readFileSync(file, 'utf8');
  assert(!hasDirectRetiredHref(text), `Maintained HTML directly links to a Tier-3 route: ${relative(file)}`);
}
for (const file of listFiles(path.join(ROOT, 'assets', 'js'), (row) => /\.(?:js|mjs)$/.test(row))) {
  const text = fs.readFileSync(file, 'utf8');
  assert(!hasDirectRetiredNavigation(text), `Active JS navigates directly to a Tier-3 route: ${relative(file)}`);
}
assert(TIER_0_PRIMARY_IDS.join(',') === 'chat,projects,workspace,eoncity', 'Tier 0 must stay Chat → Projects → Workspace → EON City.');
for (const id of TIER_0_PRIMARY_IDS) assert(allCanonical.some((route) => route.id === id), `Tier-0 route is not canonical: ${id}`);
const canonicalFiles = new Set(allCanonical.map((route) => route.file).filter(Boolean));
const rootHtml = fs.readdirSync(ROOT).filter((file) => file.endsWith('.html'));
const unexplained = rootHtml.filter((file) => !canonicalFiles.has(file) && !ROOT_DOCUMENT_EXCEPTIONS.includes(file));
assert(unexplained.length === 0, `Root HTML lacks a route tier or exception: ${unexplained.join(', ')}`);

const report = {
  schema: 'eonapp.r3-f2.route-tiering-report.v1', generatedAt: new Date().toISOString(), ok: errors.length === 0,
  routeTieringSchema: ROUTE_TIERING_SCHEMA,
  tier0: TIER_0_PRIMARY_IDS,
  canonicalRootDocuments: [...canonicalFiles].sort(),
  rootDocumentExceptions: ROOT_DOCUMENT_EXCEPTIONS,
  rootHtmlCount: rootHtml.length,
  tier3Archive: { manifest: relative(MANIFEST), entries: entries.length },
  errors
};
fs.mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifacts', 'R3_F2_ROUTE_TIERING_REPORT.json'), `${JSON.stringify(report, null, 2)}\n`);
if (errors.length) {
  console.error('[R3-F2] Route tiering failed:'); errors.forEach((error) => console.error(` - ${error}`)); process.exitCode = 1;
} else {
  console.log(`[R3-F2] PASS: Tier 0 ${TIER_0_PRIMARY_IDS.join(' → ')}; ${entries.length} Tier-3 root documents hash-verified outside active root; ${rootHtml.length} tiered root HTML documents.`);
}
export function auditR3F2RouteTiering() { return report; }
