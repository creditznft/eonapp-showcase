#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import postcss from 'postcss';
import {
  auditEonCityContentAddressedDist,
  EON_CITY_IMMUTABLE_MANIFEST_PATH,
  EON_CITY_IMMUTABLE_MANIFEST_SCHEMA
} from './eon-city-content-addressed-binaries.mjs';

export const W766IR2_BUILT_ARTIFACT_SCHEMA = 'eonapp.w766ir2.built-artifact-gate.v1';
const OFFLINE_MANIFEST_PATH = 'offline/eonapp-offline-pack-manifest.json';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const freeze = (value) => Object.freeze(value);

export function inspectW766IR2BuiltArtifact({ root = process.cwd(), distDir = path.join(root, 'dist') } = {}) {
  const absoluteDist = path.resolve(distDir);
  const checks = [];
  const check = (id, passed, evidence) => checks.push(freeze({ id, passed: Boolean(passed), evidence }));
  const exists = (relative) => fs.existsSync(path.join(absoluteDist, relative));

  let buildReport = null;
  let offlineManifest = null;
  let immutableCityManifest = null;
  try { buildReport = readJson(path.join(absoluteDist, '.eon-build-report.json')); } catch {}
  try { offlineManifest = readJson(path.join(absoluteDist, OFFLINE_MANIFEST_PATH)); } catch {}
  try { immutableCityManifest = readJson(path.join(absoluteDist, EON_CITY_IMMUTABLE_MANIFEST_PATH)); } catch {}
  const cityAudit = fs.existsSync(absoluteDist)
    ? auditEonCityContentAddressedDist({ distDir: absoluteDist })
    : freeze({ ok: false, binaryFiles: 0, unhashedFiles: ['dist-missing'], unaddressedReferences: [] });

  check('production-build-report', buildReport?.schema === 'eon.build.production.v2' && buildReport?.ok === true,
    'dist/.eon-build-report.json must be a successful production-build receipt.');
  check('content-addressed-city-binaries', cityAudit.ok === true
    && Number(buildReport?.contentAddressedCityAssets?.assetsAddressed || 0) > 0
    && Number(buildReport?.contentAddressedCityAssets?.removedOriginals || 0) === Number(buildReport?.contentAddressedCityAssets?.assetsAddressed || -1),
    `All emitted City binaries must be immutable hash URLs; audit saw ${cityAudit.binaryFiles} binaries.`);
  check('immutable-city-asset-manifest', immutableCityManifest?.schema === EON_CITY_IMMUTABLE_MANIFEST_SCHEMA
    && /^[a-f0-9]{64}$/.test(String(immutableCityManifest?.digest || ''))
    && Array.isArray(immutableCityManifest?.entries)
    && immutableCityManifest.entries.length === Number(buildReport?.contentAddressedCityAssets?.assetsAddressed || -1)
    && buildReport?.contentAddressedCityAssets?.immutableManifest?.path === EON_CITY_IMMUTABLE_MANIFEST_PATH
    && buildReport?.contentAddressedCityAssets?.immutableManifest?.schema === EON_CITY_IMMUTABLE_MANIFEST_SCHEMA
    && buildReport?.contentAddressedCityAssets?.immutableManifest?.digest === immutableCityManifest?.digest
    && Number(buildReport?.contentAddressedCityAssets?.immutableManifest?.entries || -1) === immutableCityManifest.entries.length,
    'The deterministic immutable City manifest must exist and its schema, digest and entry count must match the production build report.');
  check('offline-manifest', offlineManifest?.schema === 'eonapp.offline-pack-manifest.w766ir2.v1'
    && /^[a-f0-9]{64}$/.test(String(offlineManifest?.digest || ''))
    && Number(offlineManifest?.packs?.core?.entries || 0) > 0
    && Number(offlineManifest?.packs?.city?.entries || 0) > 0
    && buildReport?.offlinePack?.digest === offlineManifest?.digest,
    'The emitted core+City offline manifest must have a valid digest matching the build report.');
  check('release-provenance', exists('build-provenance.json') && exists('release/candidate-provenance.json'),
    'Built distribution and candidate provenance receipts must both exist.');
  check('cloudflare-contracts', exists('_headers') && exists('_redirects') && exists('sw.js'),
    'Cloudflare headers, redirects and service worker must be included in dist.');

  let cityRoute = '';
  let cityPlayCss = '';
  try { cityRoute = fs.readFileSync(path.join(absoluteDist, 'eoncity', 'index.html'), 'utf8'); } catch {}
  try { cityPlayCss = fs.readFileSync(path.join(absoluteDist, 'assets', 'css', 'eon-city-play-live-3a245e6.css'), 'utf8'); } catch {}
  check('city-overlay-stylesheet-emitted',
    /href=["'][^"']*\/assets\/css\/eon-city-play-live-3a245e6\.css(?:\?[^"']*)?["']/i.test(cityRoute)
      && !/eon-city-play\.css(?:\?[^"']*)?["']/i.test(cityRoute)
      && cityPlayCss.includes('.eon-city-command-menu')
      && cityPlayCss.includes('.eon-city-command-menu__dialog')
      && cityPlayCss.includes('.eon-city-command-menu__actions'),
    'The built /eoncity route must load the cache-isolated complete City overlay stylesheet, including Menu dialog and action geometry.');
  check('city-overlay-viewport-geometry',
    /\.eon-city-command-menu\s*\{[^}]*position\s*:\s*fixed[^}]*inset\s*:\s*0/is.test(cityPlayCss),
    'The emitted City Menu overlay must retain fixed viewport geometry rather than static document flow.');

  let parsedCityRules = [];
  let cityCssParseError = null;
  try {
    const root = postcss.parse(cityPlayCss, { from: path.join(absoluteDist, 'assets', 'css', 'eon-city-play-live-3a245e6.css') });
    root.walkRules((rule) => parsedCityRules.push(rule));
  } catch (error) {
    cityCssParseError = error instanceof Error ? error.message : String(error);
  }
  const parsedSelectors = parsedCityRules.map((rule) => rule.selector || '').join('\n');
  const parsedMenu = parsedCityRules.find((rule) => (rule.selector || '').split(',').some((selector) => selector.trim() === '.eon-city-command-menu'));
  check('city-overlay-css-parses',
    cityCssParseError === null && parsedCityRules.length >= 5,
    `The emitted City overlay stylesheet must parse completely; ${cityCssParseError || `${parsedCityRules.length} CSS rules parsed`}.`);
  check('city-overlay-critical-surfaces-parsed',
    parsedSelectors.includes('.eon-city-command-menu')
      && parsedSelectors.includes('.eon-city-transit-review-dialog')
      && parsedSelectors.includes('.eon-city-expanse-review-dialog')
      && /position\s*:\s*fixed/i.test(parsedMenu?.toString() || '')
      && /inset\s*:\s*0/i.test(parsedMenu?.toString() || ''),
    'Menu, Transit and Expanse selectors must exist in the parsed emitted CSS, with Menu fixed to the viewport.');

  let worker = '';
  let headers = '';
  try { worker = fs.readFileSync(path.join(absoluteDist, 'sw.js'), 'utf8'); } catch {}
  try { headers = fs.readFileSync(path.join(absoluteDist, '_headers'), 'utf8'); } catch {}
  // Production minification removes spaces and may normalize quotes. Match the
  // semantic cache declaration rather than an unminified source formatting.
  check('runtime-and-cache-safety', !worker.includes('client.navigate(')
    && /PERSISTENT_CITY_ASSET_CACHE\s*=\s*['\"]eonapp-city-assets-v1['\"]/.test(worker)
    && headers.includes('/assets/city/immutable/*')
    && headers.includes('immutable'),
    'Built worker must not auto-navigate City and immutable City assets must retain year-long cache headers.');

  const failures = checks.filter((entry) => !entry.passed);
  return freeze({
    schema: W766IR2_BUILT_ARTIFACT_SCHEMA,
    generatedAt: new Date().toISOString(),
    ok: failures.length === 0,
    distDir: absoluteDist,
    checks: freeze(checks),
    failures: freeze(failures),
    cityAudit,
    build: buildReport ? freeze({ sourceRevision: String(buildReport?.buildProvenance?.sourceRevision || ''), distributionSha256: String(buildReport?.buildProvenance?.distributionSha256 || ''), offlineDigest: String(buildReport?.offlinePack?.digest || '') }) : null,
    authority: freeze({ previewDeploymentPerformed: false, productionDeploymentPerformed: false, productionChanged: false })
  });
}

function main() {
  const report = inspectW766IR2BuiltArtifact();
  const output = path.join(process.cwd(), 'reports', 'w766ir2', 'W766IR2_BUILT_ARTIFACT_GATE.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ ok: report.ok, checksPassed: report.checks.filter((entry) => entry.passed).length, checksTotal: report.checks.length, report: path.relative(process.cwd(), output) }, null, 2));
  if (!report.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
