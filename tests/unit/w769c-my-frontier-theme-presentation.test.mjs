import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  deriveEonExpanseW769CThemePresentation,
  validateEonExpanseW769CThemePresentation
} from '../../assets/js/city/w769/eon-expanse-w769c-my-frontier-theme-presentation.js';

const ids = ['signal-dawn', 'archive-noir', 'forge-ember', 'oceanic-light'];

test('W769C derives a complete My Frontier material presentation for every approved theme', () => {
  for (const themeId of ids) {
    const value = deriveEonExpanseW769CThemePresentation({ themeId, unlocked: true });
    assert.equal(value.themeId, themeId);
    assert.equal(validateEonExpanseW769CThemePresentation(value).ok, true);
    assert.equal(Object.keys(value.materials).length, 9);
  }
});

test('W769C falls back to Signal Dawn for unknown persisted theme IDs', () => {
  const value = deriveEonExpanseW769CThemePresentation({ themeId: '#ff00ff', unlocked: true });
  assert.equal(value.themeId, 'signal-dawn');
});

test('W769C changes only maintained My Frontier platform materials', () => {
  const value = deriveEonExpanseW769CThemePresentation({ themeId: 'forge-ember', unlocked: true });
  assert.equal(value.myFrontierMaterialsOnly, true);
  assert.equal(value.sceneEnvironmentMutated, false);
  assert.equal(value.authoredAssetMaterialsOverwritten, false);
  assert.equal(value.residentAssetMaterialsOverwritten, false);
  assert.equal(value.customShaderUsed, false);
  assert.equal(value.postProcessUsed, false);
});

test('W769C renderer applies the presentation without owning scene environment or authored asset materials', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768i-my-frontier-renderer.js', import.meta.url), 'utf8');
  assert.match(source, /deriveEonExpanseW769CThemePresentation/);
  assert.match(source, /applyThemePresentation\(myFrontierState\)/);
  assert.match(source, /applyMaterialSlot\(materials\[name\], slot\)/);
  assert.match(source, /themeAppliedToMyFrontierOnly/);
  assert.match(source, /sceneEnvironmentMutated/);
  assert.doesNotMatch(source, /scene\.(?:clearColor|fogColor|fogDensity|environmentTexture)\s*=/);
  assert.doesNotMatch(source, /authoredAssetPresenter[^\n]*material\s*=|residentAssetPresenter[^\n]*material\s*=/);
});

test('W769C owns no engine, scene, render loop, network or progression authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w769/eon-expanse-w769c-my-frontier-theme-presentation.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)|runRenderLoop|fetch\s*\(|awardXp|completeMission|localStorage/);
});
