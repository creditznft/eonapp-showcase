#!/usr/bin/env node
/**
 * W275-A0 — Offline/PWA asset policy source gate.
 * It validates bounded cache and explicit-update controls only. It does not
 * certify real-browser installation, update, rollback, or offline behavior.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W275_PWA_ASSET_POLICY } from '../config/w275-pwa-asset-policy-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function read(root, rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function writeArtifact(root, report) {
  const output = path.join(root, 'artifacts', 'W275_PWA_ASSET_POLICY_SOURCE_GATE_REPORT_2026-06-25.json');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
}

export function evaluateW275PwaAssetPolicy({ sw = '', manifest = {}, pwaManager = '', plan = '' } = {}) {
  const errors = [];
  const warnings = [];
  const policy = W275_PWA_ASSET_POLICY.cachePolicy;
  const require = (condition, message) => { if (!condition) errors.push(message); };
  const matchArray = sw.match(/PRECACHE\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\)/);
  const precacheEntries = matchArray ? [...matchArray[1].matchAll(/'([^']+)'/g)].map((row) => row[1]) : [];
  const noStoreMatch = sw.match(/const\s+NO_STORE_NAVIGATION_PREFIXES\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\);/);
  const noStoreEntries = noStoreMatch ? [...noStoreMatch[1].matchAll(/'([^']+)'/g)].map((row) => row[1]) : [];
  const installStart = sw.indexOf("sw.addEventListener('install'");
  const activateStart = sw.indexOf("sw.addEventListener('activate'");
  const messageStart = sw.indexOf("sw.addEventListener('message'");
  const pushStart = sw.indexOf("sw.addEventListener('push'");
  const installBlock = installStart >= 0 && activateStart > installStart ? sw.slice(installStart, activateStart) : '';
  const messageBlock = messageStart >= 0 && pushStart > messageStart ? sw.slice(messageStart, pushStart) : '';
  const releaseIdMatch = sw.match(/const\s+RELEASE_ID\s*=\s*'([a-z0-9._-]+)'/i);

  require(Boolean(releaseIdMatch), 'Release-specific service-worker identity is missing.');
  require(!/const\s+VERSION\s*=\s*'v54'/.test(sw), 'Retired fixed v54 cache identity remains active.');
  require(Array.isArray(policy.ownedCachePrefixes) && policy.ownedCachePrefixes.every((prefix) => sw.includes(prefix)), 'Owned cache prefixes do not match the current policy contract.');
  require(/isEonAppOwnedCacheName/.test(sw) && /unknownCachesPreserved:\s*true/.test(sw), 'Service worker cache cleanup does not preserve unknown namespaces.');
  require(precacheEntries.length > 0 && precacheEntries.length <= policy.maxPrecacheEntries, `Precache entry count must be 1..${policy.maxPrecacheEntries}.`);
  require(precacheEntries.includes('/') && precacheEntries.includes('/offline.html') && precacheEntries.includes('/manifest.webmanifest'), 'Stable root-chat/offline/manifest precache entries are required.');
  require(!precacheEntries.some((entry) => /^(?:\/vault(?:\/backup)?|\/capsule|\/vault-backup|\/admin|\/billing|\/payment|\/api\/|\/functions\/|\/reward-access|\/rewards|\/telegram)/.test(entry)), 'Protected navigation appears in precache.');
  require(!precacheEntries.some((entry) => /^\/assets\/(?:js|css)\//.test(entry)), 'Precache names unhashed source JS/CSS assets.');
  require(new RegExp(`const MAX_ASSET_ENTRIES = ${policy.maxAssetEntries};`).test(sw), 'Asset cache bound does not match policy.');
  require(new RegExp(`const MAX_PAGE_ENTRIES = ${policy.maxPageEntries};`).test(sw), 'Page cache bound does not match policy.');
  require(/void trimCache\(cacheName, (?:maxEntries|Number\(maxEntries\))\)/.test(sw), 'Runtime cache trimming is missing.');
  require(/fetch\(event\.request\)\.then\(\(response\)\s*=>\s*putInCache\(ASSET_CACHE/.test(sw), 'Static cache stale-while-revalidate is missing.');
  require(/fetch\(event\.request,\s*\{\s*cache:\s*'no-store'\s*\}\)/.test(sw), 'Protected navigation must use network-only/no-store fetch.');
  require(
    /w765-2026-07-31-release-identity-source-template/.test(sw)
      && /requiresUserReloadChoice:\s*true/.test(installBlock)
      && !/\bsw\.skipWaiting\(\)/.test(installBlock)
      && /automaticCityNavigation:\s*false/.test(sw)
      && !/refreshEligibleCityClientsOnce|client\.navigate\(/.test(sw),
    'Release-scoped explicit update/reload separation is missing or service-worker activation still navigates an open City tab.'
  );
  require(/event\.data\?\.releaseId\s*===\s*RELEASE_ID/.test(messageBlock) && /\bsw\.skipWaiting\(\)/.test(messageBlock), 'Release-scoped explicit update handling is missing.');
  require(/EONAPP_RELEASE_ID_REQUEST/.test(messageBlock) && /EONAPP_SW_RELEASE_ID/.test(messageBlock), 'Waiting worker release-identity handshake is missing.');
  require(/applyEonPwaUpdate/.test(pwaManager) && /postMessage\(\{\s*type:\s*'EONAPP_APPLY_UPDATE',\s*releaseId,\s*explicitUserAction:\s*true\s*\}\)/.test(pwaManager), 'PWA UI does not expose a release-scoped explicit update action.');
  require(/updateReady/.test(pwaManager), 'PWA UI does not expose pending-update state.');
  for (const prefix of policy.protectedNavigation) require(noStoreEntries.includes(prefix), `Protected no-store path missing: ${prefix}`);
  require(String(manifest.start_url || '') === '/?source=pwa', 'Manifest start URL must remain root-chat-first.');
  require(!/reward-access|telegram|billing|payment/i.test(JSON.stringify(manifest.shortcuts || [])), 'Manifest shortcuts expose a protected route.');
  require(/W260\s*\|\s*NO-GO|W260.*NO-GO/i.test(plan), 'W260 NO-GO dependency is not preserved in the roadmap.');

  if (noStoreEntries.length < policy.protectedNavigation.length) warnings.push('No-store list is shorter than the W275 policy inventory.');
  return {
    schema: W275_PWA_ASSET_POLICY.schema,
    ok: errors.length === 0,
    decision: W275_PWA_ASSET_POLICY.decision,
    sourceOnly: true,
    errors,
    warnings,
    precacheEntryCount: precacheEntries.length,
    noStorePaths: noStoreEntries,
    externalEvidenceRequired: W275_PWA_ASSET_POLICY.externalEvidenceRequired,
    claimFence: 'A source pass is not proof of browser installation, update, rollback, offline or storage-pressure behavior.'
  };
}

export function verifyW275PwaAssetPolicy(root = ROOT) {
  const report = evaluateW275PwaAssetPolicy({
    sw: read(root, 'sw.js'),
    manifest: JSON.parse(read(root, 'manifest.webmanifest')),
    pwaManager: read(root, 'assets/js/eon-pwa-manager.js'),
    plan: read(root, 'docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md')
  });
  writeArtifact(root, report);
  return report;
}

export function main() {
  const report = verifyW275PwaAssetPolicy();
  if (!report.ok) {
    console.error('[W275-A0] FAIL');
    report.errors.forEach((error) => console.error(`- ${error}`));
    return 1;
  }
  console.log(`W275-A0 PWA asset-policy source gate: PASS (${report.precacheEntryCount} bounded precache entries; external browser/device evidence remains pending).`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) process.exitCode = main();
