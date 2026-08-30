import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { EON_EXPANSE_W769B_THEMES, deriveEonExpanseW769BThemeChoice, validateEonExpanseW769BThemeAction } from '../../assets/js/city/w769/eon-expanse-w769b-my-frontier-theme.js';

test('W769B defines four approved themes with fixed maintained palettes', () => {
  assert.deepEqual(EON_EXPANSE_W769B_THEMES.map((entry) => entry.id), ['signal-dawn', 'archive-noir', 'forge-ember', 'oceanic-light']);
  assert.ok(EON_EXPANSE_W769B_THEMES.every((entry) => entry.palette?.terrain && entry.palette?.circuit && entry.palette?.marker));
});

test('W769B exposes explicit selection only when an approved theme differs from current state', () => {
  const state = { unlocked: true, themeId: 'signal-dawn' };
  const unchanged = deriveEonExpanseW769BThemeChoice({ myFrontierState: state, selectedThemeId: 'signal-dawn' });
  assert.equal(unchanged.action, null);
  const view = deriveEonExpanseW769BThemeChoice({ myFrontierState: state, selectedThemeId: 'archive-noir' });
  assert.equal(view.action.themeId, 'archive-noir');
  assert.equal(view.rawColorsAccepted, false);
});

test('W769B rejects locked, unknown and stale theme selections', () => {
  assert.equal(deriveEonExpanseW769BThemeChoice({ myFrontierState: { unlocked: false }, selectedThemeId: 'forge-ember' }).action, null);
  assert.equal(deriveEonExpanseW769BThemeChoice({ myFrontierState: { unlocked: true, themeId: 'signal-dawn' }, selectedThemeId: '#ff00ff' }).action, null);
  const view = deriveEonExpanseW769BThemeChoice({ myFrontierState: { unlocked: true, themeId: 'signal-dawn' }, selectedThemeId: 'forge-ember' });
  assert.equal(validateEonExpanseW769BThemeAction(view).reason, 'explicit-user-action-required');
  assert.equal(validateEonExpanseW769BThemeAction(view, { explicitUserAction: true, expectedThemeId: 'archive-noir' }).reason, 'theme-selection-stale');
});

test('W769B persists only approved theme IDs through My Frontier state and Expanse sanitizer', () => {
  const stateSource = fs.readFileSync(new URL('../../assets/js/city/w768/eon-expanse-w768b-my-frontier-state.js', import.meta.url), 'utf8');
  const foundation = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766a-foundation.js', import.meta.url), 'utf8');
  assert.match(stateSource, /selectTheme\(\{ themeId/);
  assert.match(stateSource, /isEonExpanseW769BThemeId/);
  assert.match(foundation, /themeId: validReceipt && isEonExpanseW769BThemeId/);
  assert.doesNotMatch(stateSource + foundation, /customShadersAccepted:\s*true|rawColorsAccepted:\s*true|cssText/);
});

test('W769B is wired through the canonical mission board and reviewed theme control', () => {
  const runtime = fs.readFileSync(new URL('../../assets/js/city/w731/eon-city-w731-command-hub-runtime.js', import.meta.url), 'utf8');
  const overlay = fs.readFileSync(new URL('../../assets/js/city/w766/eon-expanse-w766h-ui-overlay.js', import.meta.url), 'utf8');
  assert.match(runtime, /deriveEonExpanseW769BThemeChoice/);
  assert.match(runtime, /validateEonExpanseW769BThemeAction/);
  assert.match(runtime, /onSelectMyFrontierTheme/);
  assert.match(runtime, /selectExpanseMyFrontierTheme/);
  assert.match(overlay, /my-frontier-theme/);
  assert.match(overlay, /onSelectMyFrontierThemeAction/);
});

test('W769B owns no renderer, network, progression or private-data authority', () => {
  const source = fs.readFileSync(new URL('../../assets/js/city/w769/eon-expanse-w769b-my-frontier-theme.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /new\s+(?:BABYLON\.)?(?:Engine|Scene)|runRenderLoop|fetch\s*\(|localStorage|awardXp|completeMission/);
});
