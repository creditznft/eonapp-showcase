#!/usr/bin/env node
/**
 * W228 — CEO red-team / shipping-surface gate.
 *
 * This gate checks the high-risk contradictions uncovered after W227:
 * archived token/reward stacks must not gate deploys; retired root pages must
 * not become Vite production entrypoints; and canonical City/share surfaces
 * must stay local, approval-first, and commercial-no-go.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROUTE_CONTRACT_VERSION, RETIRED_REDIRECTS } from '../config/route-contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');


function assertRule(errors, condition, message) {
  if (!condition) errors.push(message);
}

export function verifyW228CeoRedTeam(root = ROOT) {
  const localRead = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
  const errors = [];
  const ci = localRead('.github/workflows/ci.yml');
  const deploy = localRead('.github/workflows/deploy.yml');
  const vite = localRead('vite.config.mjs');
  const build = localRead('scripts/build-production.mjs');
  const sync = localRead('scripts/sync-public-assets.mjs');
  const city = localRead('assets/js/eon-operator-map.js');
  const city3d = localRead('assets/js/city/eon-city-3d-renderer.js');
  const social = localRead('assets/js/social/social-platform-adapters.js');
  const share = localRead('assets/js/utils/eon-share-sheet.js');
  const workspace = localRead('assets/js/eon-workspace-pages.js');
  const legal = localRead('legal.html');
  const terms = localRead('terms.html');
  const packageJson = JSON.parse(localRead('package.json'));
  const predeployRunner = localRead('scripts/run-w624d-codex-predeploy.mjs');
  const chat = localRead('assets/js/chat-page.js');
  const aiRuntime = localRead('assets/js/chat/ai-runtime.js');
  const eonbotTruth = localRead('assets/js/chat/eonbot-truth-contract.js');
  const deferredChat = localRead('assets/js/chat-page-deferred.js');
  const localAi = localRead('local-ai.html');
  const serviceWorker = localRead('sw.js');
  const serviceWorkerPrecache = serviceWorker.match(/PRECACHE\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\);/)?.[1] || '';
  const manifest = localRead('manifest.webmanifest');
  const localEncryptedExport = localRead('assets/js/local-first/eon-local-encrypted-export.js');
  const vaultLifecycle = localRead('assets/js/vault/eon-vault-lifecycle.js');
  const pwaManager = localRead('assets/js/eon-pwa-manager.js');
  const offlineTranslations = localRead('assets/js/utils/offline-screen-translations.js');
  const languageService = localRead('assets/js/utils/multi-language.js');
  const curatedLanguageCache = localRead('assets/js/utils/offline-screen-translations.current.js');
  const languageRegistry = localRead('assets/js/utils/i18n-rc-registry.js');
  const about = localRead('about.html');
  const billing = localRead('billing.html');

  const routeWave = Number(String(ROUTE_CONTRACT_VERSION).match(/\.w(\d+)\./)?.[1] || 0);
  assertRule(errors, routeWave >= 228, `Route contract must remain at or beyond the W228 re-audit baseline: ${ROUTE_CONTRACT_VERSION}`);
  assertRule(errors, !/contract-tests:|Smart Contracts|hardhat test/i.test(ci), 'CI still runs archived Smart Contracts / Hardhat as a shipping prerequisite.');
  assertRule(errors, /legacy-boundary:/.test(ci) && /qa:w228-ceo-red-team/.test(ci), 'CI does not enforce the W228 legacy boundary gate.');
  assertRule(errors, !/Monetag|rewarded proof/i.test(deploy) && !/grep[^\n]*reward-access\.html/i.test(deploy), 'Deploy workflow still verifies retired Monetag/reward output.');
  const deployRunsW228Directly = /qa:w228-ceo-red-team/.test(deploy);
  const deployRunsCanonicalPredeploy = /verify:codex-predeploy/.test(deploy)
    && /script:\s*'qa:w228-ceo-red-team'/.test(predeployRunner);
  assertRule(errors, deployRunsW228Directly || deployRunsCanonicalPredeploy, 'Deploy workflow does not enforce the W228 boundary gate.');
  assertRule(
    errors,
    /EXPLICIT_HTML_ENTRY_FILES/.test(vite)
      && /buildInputs\(\)/.test(vite)
      && /RETIRED_ENTRY_DIRECTORIES/.test(vite)
      && (/isRetiredEntryDirectory/.test(vite) || /RETIRED_ENTRY_DIRECTORIES\.has\(entry\)/.test(vite)),
    'Vite does not keep the W449 explicit-input cleanroom guard for retired root and nested routes.'
  );
  assertRule(errors, !/files < 200/.test(build) && /files < 80/.test(build), 'Build verification still requires historical page bloat instead of canonical outputs.');
  for (const retired of ['ipfsLootGatewayClient.js', 'launch-tokens.json', 'telegram-growth.css', 'social-missions.css']) {
    assertRule(errors, !sync.includes(`['${retired}`) && sync.includes('RETIRED_PUBLIC_FILES'), `Retired public asset remains copied: ${retired}`);
  }
  assertRule(errors, !/readEonLiteRuntimeStatus|eon:lite:runtime-status/.test(city), 'Canonical 2D City still imports or listens to archived EON Lite runtime state.');
  assertRule(errors, /drawDistrictBuilding/.test(city) && /drawAvatar/.test(city) && /LOCAL WORLD/.test(city), '2D City premium art-direction contract is missing.');
  assertRule(errors, /addDistrictArchitecture/.test(city3d) && /addRoadNetwork/.test(city3d) && /addCityFoliage/.test(city3d), '3D City landmark/road/foliage pass is missing.');
  assertRule(errors, !/Vault and rewards/i.test(social), 'Default social share copy still claims rewards.');
  assertRule(errors, !/NOWPayments|direct-wallet quote flow|Paid access activates after|supported checkout rail/i.test(legal), 'Legal page still describes a live or usable payment route.');
  assertRule(errors, !/NOWPayments|direct EVM fallback|Paid access activates only after|supported payment rail reports/i.test(terms), 'Terms page still describes a live or usable payment route.');
  assertRule(errors, /automatedPosting: false/.test(share) && /activeRewards: false/.test(share) && /activePayouts: false/.test(share), 'Share Center campaign intent does not preserve no-go defaults.');
  assertRule(errors, /createApprovalSchedule/.test(workspace) && /data-workspace-campaign-schedule/.test(workspace), 'Canonical Workspace lacks the approval-first campaign schedule handoff.');
  assertRule(errors, !/reward-access\.html|creator-studio\.html|campaign-admin\.html|blog|telegram/.test(vite.match(/const RETIRED_ROOT_HTML[\s\S]*?const EXCLUDED_DIRS/)?.[0] || ''), 'Retired entry filtering must derive from the route contract, not fragile hard-coded page names.');
  assertRule(errors, RETIRED_REDIRECTS.some((row) => row.from === '/blog/*') && RETIRED_REDIRECTS.some((row) => row.from === '/telegram/*'), 'Retired nested blog and Telegram paths are not represented in the route contract.');
  assertRule(errors, /qa:w228-ceo-red-team/.test(packageJson.scripts['qa:w216-release-candidate'] || ''), 'Full release candidate does not include the W228 red-team gate.');
  const commandNames = Object.keys(packageJson.scripts || {}).join('\n');
  assertRule(errors, !/(monetag|nowpayments|telegram-growth|reward-launch|token-dashboard|lootbox|ipfs-ipns|arweave|social-missions)/i.test(commandNames), 'Package scripts still expose retired commercial/token/ad deployment commands.');
  assertRule(errors, /test:e2e:current/.test(commandNames) && /qa:browser-proof:current/.test(commandNames), 'Package scripts do not expose the current browser-proof matrix.');
  assertRule(errors, Array.isArray(RETIRED_REDIRECTS) && RETIRED_REDIRECTS.length >= 80, 'Route contract lost retired alias coverage.');
  for (const directory of ['functions/api/rewards', 'functions/api/nowpayments', 'functions/api/evm', 'functions/api/referrals', 'functions/api/ad-rewards', 'functions/api/social', 'functions/api/telegram']) {
    assertRule(errors, !fs.existsSync(path.join(root, directory)), `Inactive commercial handler remains under active Pages Functions: ${directory}`);
  }
  assertRule(errors, fs.existsSync(path.join(root, 'archive/w228-retired-pages-functions/README.md')), 'Archived Pages Functions boundary is missing.');
  assertRule(errors, !/agent-executor|runAgentJob|mirrorToRelay|decentralized relays|downloadMissionNode|eon:entitlements/.test(chat), 'Canonical Chat still advertises/imports background execution, or reads inactive entitlement state.');
  assertRule(errors, !/eon:entitlements|RATE_HOURLY_PAID|RATE_DAILY_PAID/.test(aiRuntime), 'Connected AI runtime still reads inactive paid-entitlement tiers.');
  assertRule(errors, !/provider-pending|pool\\s\*points|mylead/i.test(eonbotTruth), 'EONBOT still frames an inactive reward provider or legacy points label as a live capability.');
  assertRule(errors, /No reward, benefit, credit, cash-out, campaign, provider offer or share incentive is active\./.test(eonbotTruth), 'EONBOT does not clearly state that incentives are inactive in this release.');
  assertRule(errors, !/DistributedInference|Polygon|Pool Points|eon-lite/.test(deferredChat), 'Deferred Chat still loads archived distributed/token content.');
  assertRule(errors, /assets\/js\/local-ai\/local-ai-page\.js/.test(localAi) && !/eon-lite/.test(localAi), 'Canonical Local AI page still depends on archived EON Lite UI.');
  const serviceWorkerHasCanonicalVersionMarker = /Service Worker v\d+/.test(serviceWorker)
    || /Canonical generated Service Worker source/i.test(serviceWorker);
  assertRule(
    errors,
    serviceWorkerHasCanonicalVersionMarker
      && /explicit-update bounded cache policy/i.test(serviceWorker)
      && /CITY_RUNTIME_RELEASE_CACHE_PREFIXES/.test(serviceWorker)
      && !/assets\/js\/eon-lite\//.test(serviceWorker),
    'Service worker does not preserve the explicit-update cache policy or still ships archived EON Lite runtime modules.'
  );
  assertRule(errors, !/\/assets\/(?:js|css)\//.test(serviceWorkerPrecache), 'Service worker precache still names unhashed source assets absent from production dist output.');
  assertRule(errors, !/EON Lite|eon:lite/i.test(manifest), 'PWA manifest still publishes archived EON Lite branding.');
  assertRule(errors, !/eon:lite:/.test(localEncryptedExport) && /eon:local-ai:/.test(localEncryptedExport), 'Portable sync backup still exports archived EON Lite state instead of neutral Local AI state.');
  assertRule(errors, !/eon:lite:/.test(vaultLifecycle) && /eon:local-ai:/.test(vaultLifecycle), 'Vault backup allowlist still exports archived EON Lite state.');
  assertRule(errors, !/eon:lite:/.test(pwaManager) && /eon:local-ai:/.test(pwaManager), 'PWA state collector still treats archived EON Lite state as canonical.');
  assertRule(errors, /offline-screen-translations\.current\.js/.test(offlineTranslations) && !/W47_SCREEN_TRANSLATIONS|GENERATED_SCREEN_TRANSLATIONS|W57_SCREEN_TRANSLATIONS/.test(offlineTranslations), 'Canonical language runtime still imports retired reward/payment translation packs.');
  assertRule(errors, !/(mission-engine|ai-runtime|runMissionEngine|loadAISettings|getApiKey|PROVIDERS|Pool Points|EonPoolPoints)/.test(languageService), 'Canonical language service still imports provider/key/reward/token runtime code.');
  assertRule(errors, !/(Pool Points|EonLite|EON Lite|Polygon|Mainnet|NOWPayments|Monetag|offerwall|lootbox|cash[- ]?out|affiliate payout)/i.test(curatedLanguageCache), 'Active curated language cache still contains retired commercial/token vocabulary.');
  assertRule(errors, !/(\/rewards\.html|\/realmworld\.html|\/eon-browser\.html|\/workbench\.html|\/marketplace\.html)/.test(languageRegistry), 'Active language registry still lists retired product routes.');
  assertRule(errors, !/Cloudflare referral tree|NOWPayments/i.test(`${about}\n${billing}`), 'Public copy still names retired referral/payment infrastructure.');
  assertRule(errors, !fs.existsSync(path.join(root, 'assets/js/eon-lite')), 'Archived EON Lite modules remain in the active client module tree.');
  return { ok: errors.length === 0, errors };
}

export function main() {
  const result = verifyW228CeoRedTeam();
  if (!result.ok) {
    console.error('[w228-ceo-red-team] FAIL:');
    result.errors.forEach((error) => console.error(`- ${error}`));
    return 1;
  }
  console.log('[w228-ceo-red-team] PASS: shipping surface, no-go, City, and approval-first sharing contracts are aligned.');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) process.exitCode = main();
