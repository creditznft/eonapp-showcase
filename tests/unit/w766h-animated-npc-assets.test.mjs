import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('assets/js/city/w766/eon-expanse-w766d-npc-transit.js', 'utf8');
const gateway = fs.readFileSync('assets/js/city/w766/eon-expanse-w766a-gateway-overlook.js', 'utf8');
const heroAssets = fs.readFileSync('assets/js/city/w766/eon-expanse-w766b-hero-assets.js', 'utf8');

test('W766D maps all three named NPCs to maintained animated W649 assets', () => {
  assert.match(source, /assetAlias: 'player-primary'/);
  assert.match(source, /fallbackAlias: 'player-fallback'/);
  assert.match(source, /assetAlias: 'archive-guide'/);
  assert.match(source, /assetAlias: 'forge-worker'/);
  assert.match(source, /getEonCityW649Character/);
  assert.match(source, /getEonCityW649AnimationProfile/);
  assert.match(source, /SceneLoader\.LoadAssetContainerAsync/);
});

test('W766D keeps truthful fallback, grounding, click animation and asset disposal behavior', () => {
  assert.match(source, /fallbackRoot\.setEnabled\(false\)/);
  assert.match(source, /groundOffset = placement\.position\.y - groundedBounds\.minY/);
  assert.match(source, /if \(!presentation\.ok\)/);
  assert.match(source, /PointerEventTypes\.POINTERPICK/);
  assert.match(source, /record\.container\?\.dispose/);
  assert.match(source, /disposed-during-load/);
  assert.match(source, /assetStates/);
});

test('Gateway Overlook defers verified W649 hero and NPC assets until explicit entry', () => {
  assert.match(gateway, /const mountDeferredAssets = \(\) =>/);
  assert.match(gateway, /activate\(\) \{\s*const signalMounted = mountDeferredSignalWorld\(\);[\s\S]*const mounted = mountDeferredAssets\(\)/);
  const deactivate = gateway.slice(gateway.indexOf('    deactivate() {'), gateway.indexOf('    suspendSignalPresentation'));
  assert.doesNotMatch(deactivate, /disposeDeferredAssets\(/);
  assert.match(deactivate, /decodedAssetsRetained: true/);
  assert.match(gateway, /assetsDeferredUntilEntry: true/);
  assert.match(gateway, /mountEonExpanseW766DNpcs\(\{ scene, parent: signalRoot, quality,/);
  assert.match(gateway, /mountEonExpanseW766BHeroAssets/);
  assert.match(gateway, /activityAnchors = mountEonExpanseW766FActivityAnchors/);
  assert.match(gateway, /disposeDeferredAssets/);
  assert.match(heroAssets, /getEonCityW649WorldAsset/);
  assert.match(heroAssets, /eoncity-street-lamp/);
  assert.match(heroAssets, /visualProxySuppressedBy/);
  assert.match(heroAssets, /proxy\.mesh\.visibility = proxy\.visibility/);
  assert.match(heroAssets, /remoteAssets: false/);
});
