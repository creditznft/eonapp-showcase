#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { auditActiveSurfaceImports } from './active-surface-import-fence.mjs';
import { getW393ALeanHandoverStatus } from '../config/w393a-lean-handover-integrity-contract.mjs';

const root = process.cwd();
const archive = path.join(root, 'archive', 'w238-retired-value-systems');
const manifestFile = path.join(archive, 'MANIFEST.json');
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const exists = (relative) => fs.existsSync(path.join(root, relative));
const leanHandover = getW393ALeanHandoverStatus();

const importFence = auditActiveSurfaceImports({ root });
assert(importFence.ok, `Active surface import fence failed: ${[...importFence.legacyPrefixHits, ...importFence.legacyValueHits].join(', ')}`);
const archiveManifestPresent = exists('archive/w238-retired-value-systems/MANIFEST.json');
let manifest = null;
if (archiveManifestPresent) {
  try { manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8')); } catch (error) { errors.push(`Archive manifest unreadable: ${error instanceof Error ? error.message : String(error)}`); }
  assert(exists('archive/w238-retired-value-systems/README.md'), 'W238 archive README missing when the archive manifest is present.');
  assert(manifest?.schema === 'eonapp.w238.retired-value-systems-manifest.v1', 'W238 archive schema mismatch.');
  assert(Array.isArray(manifest?.entries) && manifest.entries.length >= 100, 'W238 archive manifest is unexpectedly small.');
  assert(manifest?.status === 'archived-not-production-input', 'W238 archive must be explicitly non-production input.');
} else {
  assert(leanHandover.historicArchiveVerification === 'not-certified-by-this-handover', 'Lean handover must disclose omitted historical archive evidence.');
}
for (const directory of ['assets/js/ads', 'assets/js/realm3d']) {
  assert(!exists(directory), `${directory} must be absent from active source after W238.`);
}
for (const file of ['assets/js/rewards/eon-reward-policy.js', 'assets/js/rewards/eon-rewards-page.js']) {
  assert(exists(file), `${file} must remain the current RT98 Reward Center source.`);
}
for (const retiredSource of [
  'assets/js/reward-access-page.js', 'assets/js/subscription-page.js', 'assets/js/nowpayments-status-page.js',
  'assets/js/telegram-growth-widget.js', 'assets/js/creator-studio-page.js', 'assets/js/main.js'
]) assert(!exists(retiredSource), `${retiredSource} must be archived, not retained as a live-source module.`);

const activeJsRoot = path.join(root, 'assets', 'js');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(next);
    else if (/\.(?:m?js)$/i.test(entry.name)) files.push(next);
  }
}
walk(activeJsRoot);
const providerLiteralHits = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (/YOUR-MONETAG|omg10\.com|monetag-rewarded|ad-rewards\/postback|nowpayments\/ipn/i.test(text)) {
    providerLiteralHits.push(path.relative(root, file).replaceAll('\\', '/'));
  }
}
assert(providerLiteralHits.length === 0, `Live source retains provider/payment literal(s): ${providerLiteralHits.join(', ')}`);

const stats = {
  schema: 'eonapp.w238.legacy-consolidation-report.v1',
  ok: errors.length === 0,
  generatedAt: new Date().toISOString(),
  mode: archiveManifestPresent ? 'archive-verification' : 'lean-current-source-boundary',
  historicArchiveEvidencePresent: archiveManifestPresent,
  archivedEntryCount: manifest?.entries?.length || 0,
  activeSurfaceModuleCount: importFence.moduleCount,
  activeSurfaceRouteEntryCount: importFence.routeEntryCount,
  legacyPrefixHits: importFence.legacyPrefixHits,
  legacyValueHits: importFence.legacyValueHits,
  providerLiteralHits,
  errors
};
fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(path.join(root, 'artifacts', 'W238_LEGACY_CONSOLIDATION_REPORT_2026-06-25.json'), `${JSON.stringify(stats, null, 2)}\n`);
if (errors.length) {
  console.error('[W238] Legacy consolidation failed:');
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log(`[W238] PASS: ${stats.activeSurfaceModuleCount} active modules import no retired value systems; historical archive=${stats.historicArchiveEvidencePresent ? `${stats.archivedEntryCount} entries verified` : 'not-packaged'}.`);
