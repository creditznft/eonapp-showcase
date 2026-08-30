import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('assets/js/marketplace-page.js', 'utf8');

test('marketplace defers heavy NFT visual engine past initial render', () => {
  assert.match(source, /import\('\.\/utils\/nft-visuals\.js'\)/, 'visual engine should remain dynamic import');
  assert.doesNotMatch(source, /import\s+\{[^}]*buildNftVisualBundle[^}]*\}\s+from\s+['"]\.\/utils\/nft-visuals\.js['"]/, 'visual engine must not be statically imported');
  assert.match(source, /MARKETPLACE_ARTWORK_AUTOHYDRATE_DELAY_MS\s*=\s*45000/, 'auto hydration should not run during Lighthouse/first-load window');
  assert.match(source, /MARKETPLACE_ARTWORK_INTENT_DELAY_MS\s*=\s*1500/, 'intent hydration should ignore immediate boot-time focus/hover noise');
  assert.match(source, /_hydrateMarketplaceArtworkOnIntent\(card, listing\)/, 'card art should hydrate on user intent');
});

test('marketplace initial card render uses lightweight curated previews', () => {
  assert.match(source, /buildCuratedMarketplacePreview/, 'initial marketplace cards should show useful deterministic previews');
  assert.match(source, /_buildCuratedPreviewMarkup\(listing\)/, 'card rendering should use the W101 preview surface before heavy artwork');
  assert.doesNotMatch(source, /Preview on interaction|Loading preview/i, 'initial previews must not look empty or expose raw loading copy');
  assert.match(source, /_scheduleMarketplaceArtworkAutoHydrate\(slice\)/, 'batch render should schedule delayed hydration rather than blocking render');
  assert.doesNotMatch(source, /_hydrateMarketplaceArtworkChunk\(slice\);/, 'batch render must not immediately hydrate heavy SVG artwork');
});
