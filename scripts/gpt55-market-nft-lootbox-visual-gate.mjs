#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { buildObjectCollectibleVisualBundle } from '../assets/js/utils/nft-visuals.js';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), `${JSON.stringify(data, null, 2)}\n`);
};
const writeText = (file, text) => {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  fs.writeFileSync(path.join(root, file), text);
};
const digest = (value) => createHash('sha256').update(String(value || '')).digest('hex').slice(0, 16);
const percentile = (values, p) => {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index] ?? 0;
};
const average = (values) => Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));

const marketHtml = read('market.html');
const marketPage = read('assets/js/market/eon-market-page.js');
const marketDrop = read('assets/js/market/market-private-drop.js');
const marketCss = read('assets/css/eon-market-v2.css');
const packageJson = JSON.parse(read('package.json'));

const themes = ['neon-archive', 'quiet-cosmos', 'city-workshop', 'forest-signal'];
const contexts = ['market-gallery', 'city-archive', 'signal-forge', 'realm-studio'];
const visualSamples = Array.from({ length: 24 }, (_, index) => {
  const theme = themes[index % themes.length];
  const descriptor = {
    id: `w220-local-preview-${String(index + 1).padStart(2, '0')}`,
    title: `Local Preview ${index + 1}`,
    archetype: `${theme}-${(index % 4) + 1}`,
    seedKey: `w220:local-preview:${theme}:${index}`,
    rarityTier: (index % 4) + 1,
    collectionType: theme,
    visualContext: contexts[index % contexts.length],
    source: 'market-private-drop-v3',
    userFacingState: 'Generated Preview',
    mintState: 'not-minted',
    ownershipState: 'not-owned'
  };
  const bundle = buildObjectCollectibleVisualBundle(descriptor, {
    context: descriptor.visualContext,
    variant: 'w220-local-preview-proof',
    width: 900,
    height: 900
  });
  const svg = String(bundle.svg || '');
  return {
    id: descriptor.id,
    score: Number(bundle.qa?.score || bundle.qualityScore || 0),
    fingerprint: String(bundle.fingerprint || bundle.qa?.fingerprint || digest(svg)),
    svgBytes: Buffer.byteLength(svg, 'utf8'),
    dataUri: String(bundle.staticUri || '').startsWith('data:image/svg+xml'),
    noRemoteAsset: !/<image\b/i.test(svg) && !/(?:href|src)=['"]https?:\/\//i.test(svg),
    traits: Array.isArray(bundle.traits) ? bundle.traits.length : Object.keys(bundle.traits || {}).length
  };
});

const sampleScores = visualSamples.map((sample) => sample.score);
const uniqueFingerprints = new Set(visualSamples.map((sample) => sample.fingerprint)).size;
const prehydratedCards = (marketHtml.match(/data-w131-prehydrated-starter=/g) || []).length;
const oldBootstrap = /market-page-bootstrap\.js|assets\/js\/market-page\.js/.test(marketHtml);
const checks = {
  localVisualSampleCount: visualSamples.length === 24,
  averageVisualScore90: average(sampleScores) >= 90,
  p10VisualScore86: percentile(sampleScores, 10) >= 86,
  uniqueVisuals: uniqueFingerprints === visualSamples.length,
  localDataUris: visualSamples.every((sample) => sample.dataUri),
  noRemoteArtDependencies: visualSamples.every((sample) => sample.noRemoteAsset),
  emptyMarketByDefault: /Create 4 original local previews/.test(marketPage) && /Start empty/.test(marketPage),
  noPrehydratedCards: prehydratedCards === 0,
  explicitGenerationOnly: /function generateCollection/.test(marketPage) && /getPrivateMarketDrop\(\{ regenerate: true, count: 4/.test(marketPage) && /userTriggered: true/.test(marketDrop),
  progressiveReveal: /function runProgressiveReveal/.test(marketPage) && /\.eon-market-card\.is-revealing/.test(marketCss),
  reducedMotionPath: /function prefersReducedMotion/.test(marketPage) && /prefers-reduced-motion/.test(marketCss),
  explicitLegacyResume: /activatePrivateMarketResumeCandidate/.test(marketPage) && /explicitUserResume: true/.test(marketDrop) && /preservedLegacySource: true/.test(marketDrop),
  localOnlyTruth: /localOnly: true/.test(marketDrop) && /notFinancialProduct: true/.test(marketDrop) && /publicListingAvailable: false/.test(marketDrop),
  truthfulVaultSave: /userFacingState: 'Saved Local Preview'/.test(marketDrop) && /vaultRoute: '\/vault#nft-collection'/.test(marketDrop),
  officialCommerceDisabled: /Official commerce is not active/.test(marketPage) && /no user marketplace, purchase path, commission, payout, token, or trading surface/.test(marketPage),
  noActiveLegacyMarketBootstrap: !oldBootstrap && !/ensureMarketStarterDrop/.test(marketPage),
  packageScriptExists: Boolean(packageJson.scripts?.['gpt55:market-nft-lootbox-visual-gate']) && Boolean(packageJson.scripts?.['qa:w220-market-generation'])
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
const score = Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100);
const report = {
  schema: 'eonapp.w220.market-local-generation-visual-audit.v1',
  supersedes: 'prehydrated Market / NFT / lootbox visual gate assumptions',
  ok: failed.length === 0,
  score,
  grade: score === 100 ? 'local-generation-ready-after-browser-proof' : score >= 90 ? 'needs-targeted-market-work' : 'contract-failed',
  generatedAt: new Date().toISOString(),
  visualSamples: {
    count: visualSamples.length,
    average: average(sampleScores),
    p10: percentile(sampleScores, 10),
    min: Math.min(...sampleScores),
    max: Math.max(...sampleScores),
    uniqueFingerprints,
    samples: visualSamples
  },
  marketContract: {
    prehydratedCards,
    officialCommerce: 'disabled',
    commerceOrPayout: 'not active',
    legacyCollections: 'explicit-resume-only; source record retained'
  },
  checks,
  failed
};

writeJson('reports/w220/W220_MARKET_LOCAL_GENERATION_VISUAL_AUDIT.json', report);
writeText('reports/w220/W220_MARKET_LOCAL_GENERATION_VISUAL_AUDIT.md', `# W220 — Market Local Generation Visual Audit\n\nScore: **${score}/100**  \nStatus: **${report.ok ? 'PASS' : 'FAIL'}**  \nGrade: **${report.grade}**\n\n## Local preview visual matrix\n- Samples: ${report.visualSamples.count}\n- Average / p10: ${report.visualSamples.average} / ${report.visualSamples.p10}\n- Min / Max: ${report.visualSamples.min} / ${report.visualSamples.max}\n- Unique fingerprints: ${uniqueFingerprints}\n- Remote art dependency: none\n\n## Product contract\n- Market start: empty, then explicit Generate 4 action\n- Resume: user-click only; legacy record retained\n- Vault: Saved Local Preview record, not minted\n- Official commerce, user marketplace, commissions, payouts, tokens, and trading: disabled\n\n## Failed checks\n${failed.length ? failed.map((name) => `- ${name}`).join('\n') : '- None'}\n`);

if (failed.length) {
  console.error('[GPT55][W220] Market local-generation visual gate failed:');
  for (const name of failed) console.error(` - ${name}`);
  process.exit(1);
}
console.log(`[GPT55][W220] Market local-generation visual gate passed (${score}/100).`);
