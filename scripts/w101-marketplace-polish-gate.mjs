import fs from 'node:fs';
import path from 'node:path';
import {
  buildCuratedMarketplacePreview,
  buildContractTrustModel,
  buildLootboxDisclosureModel,
  formatLootboxOdds,
  getW101NftDiversityDescriptors
} from '../assets/js/utils/marketplace-w101-polish.js';
import {
  LOOTBOX_TIERS,
  LOOTBOX_REWARD_POOL,
  buildLootboxNftEnvelope
} from '../assets/js/utils/lootbox-marketplace.js';
import { EON_CONTRACTS, EON_NETWORK } from '../assets/js/utils/contracts-config.js';

const root = process.cwd();
const outputDir = path.resolve(root, 'CodexAuditPack/W101_MARKETPLACE_NFT_LOOTBOX_REWARDS');
const reportPath = path.join(outputDir, 'W101_MARKETPLACE_POLISH_STATIC_GATE.json');
fs.mkdirSync(outputDir, { recursive: true });

const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const html = read('marketplace.html');
const controller = read('assets/js/marketplace-page.js');
const css = read('assets/css/marketplace.css');
const openingUi = read('assets/js/utils/lootbox-opening-ui.js');
const rewardAccess = read('assets/js/reward-access-page.js');
const telegramPage = read('telegram.html');
const referralLanding = read('assets/js/referral-landing-page.js');
const language = read('assets/js/utils/multi-language.js');

const checks = [];
function check(name, pass, detail = '') {
  checks.push({ name, pass: Boolean(pass), detail: String(detail || '') });
}

const descriptors = getW101NftDiversityDescriptors();
const previews = descriptors.map((descriptor) => buildCuratedMarketplacePreview({
  listingId: descriptor.id,
  title: descriptor.title,
  collectionType: descriptor.collectionType,
  rarityTier: descriptor.rarityTier,
  metadata: descriptor.collectionType === 'lootbox' ? { productKind: 'lootbox-nft' } : {}
}));
const previewKeys = previews.map((preview) => `${preview.key}:${preview.pattern}:${preview.icon}`);

check('12 curated NFT diversity descriptors', descriptors.length === 12, `${descriptors.length} descriptors`);
check('at least 8 distinct first-render visual signatures', new Set(previewKeys).size >= 8, `${new Set(previewKeys).size} signatures`);
check('at least 10 distinct compositions', new Set(descriptors.map((row) => row.composition)).size >= 10);
check('at least 10 distinct palettes', new Set(descriptors.map((row) => row.palette)).size >= 10);
check('at least 10 distinct motion treatments', new Set(descriptors.map((row) => row.motion)).size >= 10);
check('at least 8 utility categories', new Set(descriptors.map((row) => row.utilityCategory)).size >= 8);

for (const [tier, config] of Object.entries(LOOTBOX_TIERS)) {
  const rows = formatLootboxOdds(config.odds);
  const total = Number(rows.reduce((sum, row) => sum + row.percentage, 0).toFixed(2));
  check(`${tier} lootbox odds total 100%`, total === 100, `${total}%`);
}
const disclosure = buildLootboxDisclosureModel(
  buildLootboxNftEnvelope({ tier: 'genesis', owner: 'w101-static-gate', seed: 'w101-static-gate' }),
  LOOTBOX_REWARD_POOL
);
check('lootbox pool is disclosed', disclosure.rewardPool.length === LOOTBOX_REWARD_POOL.length, `${disclosure.rewardPool.length} rewards`);
check('lootbox opening consumption is explicit', /consumes the sealed box/i.test(disclosure.openRule));
check('lootbox duplicate fairness is explicit', /duplicate protection/i.test(disclosure.fairnessRule));
check('lootbox has utility-only no-profit truth copy', /utility and access items only/i.test(disclosure.safetyCopy) && /no cash prize/i.test(disclosure.safetyCopy) && /profit promise/i.test(disclosure.safetyCopy));

const configured = buildContractTrustModel({ network: EON_NETWORK, contracts: EON_CONTRACTS });
const correct = buildContractTrustModel({ network: EON_NETWORK, contracts: EON_CONTRACTS, currentChainId: '0x89' });
const wrong = buildContractTrustModel({ network: EON_NETWORK, contracts: EON_CONTRACTS, currentChainId: '0x1' });
const unavailable = buildContractTrustModel({ network: EON_NETWORK, contracts: { NFT_MARKETPLACE: '', REALM_LAND: 'bad', RELIC_NFT: null } });
check('source registry exposes three mapped contracts', configured.contracts.length === 3 && configured.contracts.every((contract) => contract.status === 'source-verified'));
check('all configured contracts have explorer links', configured.contracts.every((contract) => contract.explorerUrl.startsWith('https://polygonscan.com/address/')));
check('wallet-not-connected state is honest', configured.network.status === 'wallet-not-connected');
check('correct Polygon network state is verified', correct.network.status === 'verified-network' && correct.network.match === true);
check('wrong network state is explicit', wrong.network.status === 'wrong-network' && /switch to Polygon Mainnet/i.test(wrong.network.statusLabel));
check('unavailable contract state is supported', unavailable.contracts.every((contract) => contract.status === 'unavailable'));

check('marketplace first render ships six skeleton cards', (html.match(/mp-skeleton-card/g) || []).length === 6);
check('marketplace create form starts hidden', /class="mp-panel mp-create-hidden" id="mp-create-panel" aria-hidden="true"/.test(html));
check('marketplace trust center ships in HTML', html.includes('id="mp-contract-trust-center"') && html.includes('Choose the route before you buy'));
check('marketplace source has no raw Loading placeholder', !/>\s*Loading(?:\.{3}|…)?\s*</i.test(html) && !/Loading preview|Preview on interaction|Loading shared AI readiness/i.test(controller));
check('curated preview renders before heavy NFT engine', controller.includes('buildCuratedMarketplacePreview') && controller.includes("import('./utils/nft-visuals.js')") && controller.includes('MARKETPLACE_ARTWORK_AUTOHYDRATE_DELAY_MS'));
check('all core async marketplace states are designed', ['mp-skeleton-card', 'mp-empty-state', 'wrong-network', 'unavailable', 'verified-network'].every((term) => `${html}\n${controller}\n${css}`.includes(term)));
check('grid is marked complete after render', controller.includes("grid.setAttribute('aria-busy', 'false')"));
check('lootbox cards show odds before detail', controller.includes('mp-lootbox-card-disclosure') && controller.includes('Disclosed odds'));
check('listing modal shows odds and utility pool', controller.includes('Odds visible before opening') && controller.includes('Possible utility reward pool'));
check('opening modal uses readable odds table', openingUi.includes('eon-lootbox-odds-table') && openingUi.includes('Possible utility reward pool') && !/JSON\.stringify\(lootbox\.odds/.test(openingUi));
check('utility-only framing excludes profit/jackpot promises', /No cash prize|No cash-out/i.test(openingUi) && /no guaranteed resale|no profit promise/i.test(`${openingUi}\n${controller}`));
check('responsive trust center stays visible on mobile', /@media \(max-width: 720px\)[\s\S]*?\.mp-contract-routing \{ display: block; \}/.test(css));
check('mobile and reduced-motion styles exist', css.includes('@media (max-width: 720px)') && css.includes('prefers-reduced-motion'));
check('reward path requires valued postback evidence', rewardAccess.includes('valued') && rewardAccess.includes('server postback confirms account-wide credit'));
check('Telegram membership gate is present', rewardAccess.includes('verifyTelegramRewardAccess') && rewardAccess.includes('@EonApps'));
check('Telegram reward center links are present', telegramPage.includes('data-telegram-route="reward"') && telegramPage.includes('https://t.me/EonApps') && telegramPage.includes('How rewards stay fair'));
check('signed referral landing verifies before continue', referralLanding.includes('verify') && referralLanding.includes('referral-status') && referralLanding.includes('referral-continue'));
check('marketplace language registry no longer emits readiness loading copy', !/Loading shared AI readiness|Loading device profile|Loading network stats/i.test(language));

const passed = checks.filter((row) => row.pass).length;
const total = checks.length;
const report = {
  schema: 'eon.w101.marketplace-polish-static-gate.v1',
  generatedAt: new Date().toISOString(),
  wave: 'W101',
  passed,
  total,
  score: Math.round((passed / total) * 100),
  ok: passed === total,
  evidence: {
    diversityDescriptors: descriptors.length,
    visualSignatures: new Set(previewKeys).size,
    lootboxTiersChecked: Object.keys(LOOTBOX_TIERS).length,
    mappedContracts: configured.contracts.length
  },
  checks
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
