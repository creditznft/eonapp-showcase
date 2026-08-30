import { buildNftWorldClassAudit } from '../assets/js/utils/nft-market-quality-audit.js';
import { scoreLootboxOpeningUi } from '../assets/js/utils/lootbox-opening-ui.js';
import { scoreUnifiedAiUpgradeMarketUx } from '../assets/js/utils/ai-upgrade-market-ux.js';
import { scoreNftAssetBackupManifest } from '../assets/js/utils/nft-asset-backup.js';
import { scoreEonCityLootboxRewardRuntime } from '../assets/js/realm3d/engine/EonCityLootboxRewardRuntime.js';

globalThis.window = globalThis.window || { addEventListener() {}, dispatchEvent() {}, location: { pathname: '/' } };
globalThis.document = globalThis.document || { documentElement: {}, dispatchEvent() {}, addEventListener() {} };
if (!globalThis.navigator || !globalThis.navigator.language) Object.defineProperty(globalThis, 'navigator', { value: { language: 'en-US' }, configurable: true });
globalThis.localStorage = globalThis.localStorage || { _data: new Map(), getItem(k) { return this._data.get(k) || null; }, setItem(k, v) { this._data.set(k, String(v)); }, removeItem(k) { this._data.delete(k); } };
const { scoreLanguageStabilityGate } = await import('../assets/js/utils/language-stability-gate.js');

const checks = [
  ['NFT world-class audit', buildNftWorldClassAudit().total, 85],
  ['Lootbox opening UI', scoreLootboxOpeningUi().total, 95],
  ['Unified AI Upgrade Market UX', scoreUnifiedAiUpgradeMarketUx().total, 95],
  ['NFT asset backup', scoreNftAssetBackupManifest().total, 95],
  ['EON City lootbox rewards', scoreEonCityLootboxRewardRuntime().total, 95],
  ['Language stability', scoreLanguageStabilityGate().total, 95]
];

let failed = false;
for (const [name, score, min] of checks) {
  const ok = Number(score) >= Number(min);
  console.log(`${ok ? '✅' : '❌'} ${name}: ${score}/${min}`);
  if (!ok) failed = true;
}
if (failed) process.exit(1);
console.log('✅ W87-W90 final market/lootbox/i18n gate passed.');
