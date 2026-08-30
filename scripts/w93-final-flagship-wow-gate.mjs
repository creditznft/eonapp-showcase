import fs from 'node:fs';
import { buildEonCityVoxelWorld, buildMyRealmVoxelWorld, buildPrivateWorkstationVoxelWorld } from '../assets/js/realm3d/engine/EonCityMap.js';
import { buildUnifiedAiUpgradeMarketUx, scoreUnifiedAiUpgradeMarketUx } from '../assets/js/utils/ai-upgrade-market-ux.js';
import { buildFlagshipNftQaReport } from '../assets/js/utils/nft-flagship-market-preview.js';

const city = buildEonCityVoxelWorld();
const workstation = buildPrivateWorkstationVoxelWorld({ owner: 'qa-owner' });
const realm = buildMyRealmVoxelWorld({ username: 'qa-user', seed: 'w93' });
const market = buildUnifiedAiUpgradeMarketUx();
const nftQa = buildFlagshipNftQaReport({ count: 64 });
const apiKeyVaultSource = fs.readFileSync(new URL('../assets/js/utils/api-key-vault.js', import.meta.url), 'utf8');
const apiKeyPersistence = {
  hasStatus: apiKeyVaultSource.includes('status()') && apiKeyVaultSource.includes('hasEncryptedEntries'),
  hasEncryptedExport: apiKeyVaultSource.includes('exportEncryptedBackup') && apiKeyVaultSource.includes('plaintextKeysIncluded: false'),
  hasMergeImport: apiKeyVaultSource.includes('importEncryptedBackup') && apiKeyVaultSource.includes('_saveVault({ ...current, ...bundle.vault })'),
  noDestructiveClear: !/localStorage\.clear|indexedDB\.deleteDatabase|deleteDatabase\(/.test(apiKeyVaultSource),
  cloudflareUpdateSafe: apiKeyVaultSource.includes('survivesCloudflareAssetUpdate: true')
};

const report = {
  schema: 'eon.w93.final-flagship-wow-gate.v1',
  ok: true,
  worlds: {
    city: city.flagshipWowScore,
    workstation: workstation.flagshipWowScore,
    realm: realm.flagshipWowScore
  },
  market: {
    ux: scoreUnifiedAiUpgradeMarketUx(market),
    newUserPreview: market.newUserPreview.score,
    rows: market.newUserPreview.rows.map((row) => ({ id: row.productId, kind: row.productKind, score: row.qualityScore, grade: row.grade }))
  },
  nftQa,
  apiKeyPersistence,
  codexMustStillRun: ['Vite build', 'Playwright WebGL screenshots', 'mobile portrait and landscape', 'desktop fullscreen and pointer-lock', 'Cloudflare live API-key persistence']
};

const failures = [];
for (const [name, score] of Object.entries(report.worlds)) {
  if (score.total < 96) failures.push(`${name} flagship score ${score.total} < 96`);
}
if (report.market.ux.total < 95) failures.push(`market UX score ${report.market.ux.total} < 95`);
if (report.market.newUserPreview.total < 95) failures.push(`new-user market preview ${report.market.newUserPreview.total} < 95`);
if (!nftQa.launchGate.pass) failures.push('NFT flagship QA did not pass');
if (!Object.values(apiKeyPersistence).every(Boolean)) failures.push(`API-key persistence contract failed: ${JSON.stringify(apiKeyPersistence)}`);
if (failures.length) {
  report.ok = false;
  report.failures = failures;
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(report, null, 2));
