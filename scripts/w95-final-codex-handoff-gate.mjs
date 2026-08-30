import fs from 'node:fs';
import path from 'node:path';

function installBrowserStubs() {
  if (!globalThis.localStorage) {
    const store = new Map();
    globalThis.localStorage = {
      getItem(key) { return store.has(String(key)) ? store.get(String(key)) : null; },
      setItem(key, value) { store.set(String(key), String(value)); },
      removeItem(key) { store.delete(String(key)); },
      clear() { store.clear(); }
    };
  }
  if (!globalThis.CustomEvent) {
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
    };
  }
  if (!globalThis.window) globalThis.window = globalThis;
  if (!globalThis.document) {
    globalThis.document = {
      documentElement: { dir: 'ltr', lang: 'en', setAttribute() {} },
      body: { setAttribute() {}, appendChild() {} },
      querySelectorAll() { return []; },
      addEventListener() {},
      dispatchEvent() {},
      createElement() { return { style: {}, classList: { add() {}, remove() {} }, setAttribute() {}, appendChild() {}, remove() {} }; }
    };
  } else {
    globalThis.document.dispatchEvent ||= (() => {});
  }
}

installBrowserStubs();

const { buildFlagshipNftQaReport } = await import('../assets/js/utils/nft-flagship-market-preview.js');
const { buildUnifiedAiUpgradeMarketUx, scoreUnifiedAiUpgradeMarketUx } = await import('../assets/js/utils/ai-upgrade-market-ux.js');
const { scoreLanguageStabilityGate } = await import('../assets/js/utils/language-stability-gate.js');
const { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } = await import('../assets/js/realm3d/engine/EonCityMap.js');

function read(file) { return fs.readFileSync(file, 'utf8'); }
function exists(file) { return fs.existsSync(file); }

const publicFiles = ['index.html', 'realm.html', 'vault.html', 'marketplace.html', 'telegram.html', 'onboarding.html', 'chat.html'];
const forbiddenPublicCopy = /(EON City V2 prototype|W\d+\s*[·:]\s*[A-Z]|launch order|advanced technical panels|>[^<]*prototype[^<]*<)/i;
const publicCopyFindings = [];
for (const file of publicFiles) {
  if (!exists(file)) continue;
  const content = read(file);
  const match = content.match(forbiddenPublicCopy);
  if (match) publicCopyFindings.push({ file, match: match[0] });
}

const nftQa = buildFlagshipNftQaReport({ count: 128 });
const market = buildUnifiedAiUpgradeMarketUx();
const marketScore = scoreUnifiedAiUpgradeMarketUx(market);
const language = scoreLanguageStabilityGate();
const city = buildEonCityVoxelWorld();
const workstation = buildPrivateWorkstationVoxelWorld({ owner: 'codex-final' });
const realm = buildMyRealmVoxelWorld({ username: 'codex-final', seed: 'w95-final' });
const apiKeyVault = read('assets/js/utils/api-key-vault.js');
const adPostback = read('functions/api/ad-rewards/postback.js');
const packageJson = JSON.parse(read('package.json'));
const codexDocPath = 'CodexDocs/W95_FINAL_CODEX_HANDOFF_2026-06-08.md';
const codexDoc = exists(codexDocPath) ? read(codexDocPath) : '';

const checks = {
  nftRawGeneratorP10: nftQa.qualityPercentiles.p10 === 100,
  nftRawGeneratorP50: nftQa.qualityPercentiles.p50 === 100,
  nftRawGeneratorP90: nftQa.qualityPercentiles.p90 === 100,
  nftLaunchGate: nftQa.launchGate.pass === true && nftQa.brokenExportRate === 0 && nftQa.lowQualityRate === 0,
  marketScoreTop: marketScore.total === 100 && market.newUserPreview.score.total === 100,
  marketAutopopulated: market.rows.length >= 8 && market.rows.every((row) => row.generatedForNewUser && row.backedUpByNftAssetBackup),
  languagesTopTier: language.total === 100 && language.grade === 'language-top-tier' && language.completeness.missingTotal === 0,
  publicCopyClean: publicCopyFindings.length === 0,
  worldScoresTop: [city, workstation, realm].every((world) => Number(world.flagshipWowScore?.total || 0) >= 97),
  apiKeysUpdateSafe: apiKeyVault.includes('survivesCloudflareAssetUpdate: true') && apiKeyVault.includes('exportEncryptedBackup') && apiKeyVault.includes('importEncryptedBackup') && !/localStorage\.clear|deleteDatabase\(/.test(apiKeyVault),
  adPostbackValueOnly: /Only Monetag\/provider value proof is retained/.test(adPostback) && !/raw IP|user agent|Telegram ID/.test(adPostback.replace(/does not store raw IP, country, user agent, UID, session ID, Telegram ID, or browser fingerprints/g, '')),
  liveAdQaCommandsPresent: ['ads:rewarded-postback-readiness', 'ads:value-privacy-gate', 'qa:telegram-miniapp-readiness', 'qa:monetag-live-sdk'].every((cmd) => Boolean(packageJson.scripts?.[cmd])),
  codexHandoffHasLiveChecklist: /AD_REWARD_POSTBACK_SECRET/.test(codexDoc) && /Monetag/.test(codexDoc) && /Telegram Mini App/.test(codexDoc) && /Cloudflare/.test(codexDoc) && /Edge API-key persistence/.test(codexDoc)
};

const failures = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
const report = {
  schema: 'eon.w95.final-codex-handoff-gate.v1',
  ok: failures.length === 0,
  checks,
  failures,
  scores: {
    nftRawGenerator: nftQa.qualityPercentiles,
    market: { ux: marketScore.total, newUserPreview: market.newUserPreview.score.total },
    language: language.total,
    worlds: {
      eonCity: city.flagshipWowScore?.total,
      privateWorkstation: workstation.flagshipWowScore?.total,
      userRealm: realm.flagshipWowScore?.total
    }
  },
  publicCopyFindings,
  liveDeploymentStillRequired: [
    'Cloudflare Functions real postback request with AD_REWARD_POSTBACK_SECRET',
    'Monetag rewarded-ad value postback and /api/ad-rewards/status verification',
    'Telegram Mini App open / claim / join-channel reward path',
    'Edge API-key persistence before and after Cloudflare deploy',
    'Playwright WebGL/mobile screenshots and Lighthouse'
  ]
};

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
