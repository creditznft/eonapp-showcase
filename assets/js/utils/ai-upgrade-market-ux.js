import { buildAiUpgradeMarketCatalog, scoreAiUpgradeMarketCatalog } from './ai-upgrade-market-catalog.js';
import { buildFlagshipMarketPreviewForProduct, buildNewUserFlagshipMarketPreview } from './nft-flagship-market-preview.js';

export const AI_UPGRADE_MARKET_UX_POLICY = Object.freeze({
  schema: 'eon.ai-upgrade-market-ux-policy.w89.v1',
  publicMarketName: 'AI Upgrade Market',
  hidesStoreFragmentation: true,
  legacyStoreNamesAreAliases: ['Marketplace', 'EON Team Store', 'Realm Store', 'NFT Exchange'],
  primaryUserRoute: '/marketplace.html?tab=ai',
  sections: ['featured', 'lootboxes', 'utility-nfts', 'temporary-passes', 'realm-packs', 'eonbot-agents'],
  lootboxesShownAsUnopenedInternalNfts: true,
  oneAdOrShareLifetimeBlocked: true,
  nftBackupRequired: true,
  noInvestmentPromise: true
});

function productSection(product = {}) {
  if (product.kind === 'lootbox-nft') return 'lootboxes';
  if (/realm/i.test(product.title || product.featureId || '')) return 'realm-packs';
  if (/robot|agent|eonbot/i.test(product.title || product.featureId || '')) return 'eonbot-agents';
  if (product.kind === 'utility-nft') return 'utility-nfts';
  return 'featured';
}

export function buildUnifiedAiUpgradeMarketUx({ includeLootboxes = true } = {}) {
  const catalog = buildAiUpgradeMarketCatalog({ includeLootboxes });
  const rows = (catalog.products || []).map((product) => {
    const section = productSection(product);
    const preview = buildFlagshipMarketPreviewForProduct(product);
    return Object.freeze({
      ...product,
      section,
      cta: product.kind === 'lootbox-nft' ? 'View sealed box' : 'View upgrade',
      visualPreviewScore: preview.qualityScore,
      visualPreviewGrade: preview.grade,
      visualFingerprint: preview.visualFingerprint,
      imageUri: preview.imageUri,
      generatedForNewUser: true,
      backedUpByNftAssetBackup: true,
      visibleBadges: product.kind === 'lootbox-nft'
        ? ['Unopened', 'Internal NFT', 'Tradable sealed', 'Open once']
        : ['Utility NFT', 'Feature unlock', 'Generated art'],
      userFacingStore: AI_UPGRADE_MARKET_UX_POLICY.publicMarketName
    });
  });
  const sections = AI_UPGRADE_MARKET_UX_POLICY.sections.map((id) => Object.freeze({
    id,
    title: id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '),
    products: rows.filter((row) => row.section === id)
  })).filter((section) => section.products.length || section.id === 'featured');
  return Object.freeze({
    schema: 'eon.ai-upgrade-market-ux.w89.v1',
    title: AI_UPGRADE_MARKET_UX_POLICY.publicMarketName,
    subtitle: 'One place for temporary passes, generated utility NFTs, sealed lootboxes, Realm packs, EONBot upgrades, and workstation modules.',
    policy: AI_UPGRADE_MARKET_UX_POLICY,
    catalogScore: scoreAiUpgradeMarketCatalog(catalog),
    rows,
    sections,
    antiConfusionCopy: 'Marketplace, EON Team Store, Realm Store, and NFT Exchange are unified under AI Upgrade Market for users.',
    safetyCopy: 'Utility and access items only. No investment promise, no guaranteed resale, no cash prize.',
    newUserPreview: buildNewUserFlagshipMarketPreview(catalog.products || [])
  });
}

export function scoreUnifiedAiUpgradeMarketUx(ux = buildUnifiedAiUpgradeMarketUx()) {
  const rows = ux.rows || [];
  const checks = {
    unifiedName: ux.title === 'AI Upgrade Market',
    hidesFragmentation: ux.policy?.hidesStoreFragmentation === true && /unified/i.test(ux.antiConfusionCopy || ''),
    hasLootboxes: rows.filter((row) => row.kind === 'lootbox-nft').length >= 3,
    hasUtilityNfts: rows.filter((row) => row.kind === 'utility-nft').length >= 5,
    sectionedClearly: (ux.sections || []).length >= 4,
    visualPreviews: rows.every((row) => Number(row.visualPreviewScore || 0) >= 86),
    oneAdBlocked: rows.every((row) => row.oneAdOrShareLifetimeBlocked === true),
    noInvestmentPromise: /No investment promise/i.test(ux.safetyCopy || '')
  };
  const total = Math.round(Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100);
  return Object.freeze({ schema: 'eon.ai-upgrade-market-ux-score.w89.v1', total, grade: total >= 95 ? 'unified-market-ux-ready' : 'needs-market-merge-work', checks });
}
