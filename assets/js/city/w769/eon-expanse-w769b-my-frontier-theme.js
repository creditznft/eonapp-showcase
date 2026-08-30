/** W769B — approved, privacy-safe My Frontier environmental theme choices. */
export const EON_EXPANSE_W769B_THEME_SCHEMA = 'eon.expanse.my-frontier-theme.w769b.v1';
const freeze = Object.freeze;

export const EON_EXPANSE_W769B_THEMES = freeze([
  freeze({ id: 'signal-dawn', label: 'Signal Dawn', purpose: 'Balanced cyan, gold and deep-blue frontier lighting.', palette: freeze({ terrain: '#08101c', underlay: '#04070c', circuit: '#25b6ff', boundary: '#9d72ff', marker: '#ffbc62', foundation: '#58e6b2' }) }),
  freeze({ id: 'archive-noir', label: 'Archive Noir', purpose: 'Deep violet archive atmosphere with cool memory signals.', palette: freeze({ terrain: '#0d0a18', underlay: '#040308', circuit: '#7bdcff', boundary: '#b38cff', marker: '#d8c5ff', foundation: '#78d9c7' }) }),
  freeze({ id: 'forge-ember', label: 'Forge Ember', purpose: 'Warm industrial energy balanced by clear cyan navigation.', palette: freeze({ terrain: '#17100b', underlay: '#080503', circuit: '#59d9ff', boundary: '#ff8d59', marker: '#ffd07a', foundation: '#ffb55f' }) }),
  freeze({ id: 'oceanic-light', label: 'Oceanic Light', purpose: 'Teal-blue calm with bright horizon and transit signals.', palette: freeze({ terrain: '#06151b', underlay: '#02090d', circuit: '#45f0dd', boundary: '#62a9ff', marker: '#d9fff4', foundation: '#66e6c7' }) })
]);
const byId = new Map(EON_EXPANSE_W769B_THEMES.map((entry) => [entry.id, entry]));
export const EON_EXPANSE_W769B_DEFAULT_THEME_ID = 'signal-dawn';
export function isEonExpanseW769BThemeId(value = '') { return byId.has(String(value || '')); }
export function getEonExpanseW769BTheme(value = '') { return byId.get(String(value || '')) || byId.get(EON_EXPANSE_W769B_DEFAULT_THEME_ID); }

export function deriveEonExpanseW769BThemeChoice({ myFrontierState = null, selectedThemeId = '' } = {}) {
  const visible = myFrontierState?.unlocked === true;
  const currentThemeId = visible && isEonExpanseW769BThemeId(myFrontierState?.themeId) ? String(myFrontierState.themeId) : EON_EXPANSE_W769B_DEFAULT_THEME_ID;
  const selected = visible && isEonExpanseW769BThemeId(selectedThemeId) ? String(selectedThemeId) : '';
  const action = selected && selected !== currentThemeId ? freeze({
    type: 'select-my-frontier-theme',
    label: `Apply ${getEonExpanseW769BTheme(selected).label}`,
    themeId: selected,
    expectedCurrentThemeId: currentThemeId,
    explicitUserActionRequired: true,
    automaticSelection: false
  }) : null;
  return freeze({
    schema: EON_EXPANSE_W769B_THEME_SCHEMA,
    visible,
    currentThemeId,
    currentTheme: getEonExpanseW769BTheme(currentThemeId),
    options: freeze(EON_EXPANSE_W769B_THEMES.map((theme) => freeze({ ...theme, selected: theme.id === currentThemeId }))),
    action,
    rawColorsAccepted: false,
    customShadersAccepted: false,
    automaticSelection: false,
    privateContentStored: false
  });
}

export function validateEonExpanseW769BThemeAction(view = null, {
  explicitUserAction = false,
  expectedThemeId = '',
  expectedCurrentThemeId = ''
} = {}) {
  if (!explicitUserAction) return freeze({ ok: false, reason: 'explicit-user-action-required' });
  if (view?.schema !== EON_EXPANSE_W769B_THEME_SCHEMA || view.visible !== true || !view.action) return freeze({ ok: false, reason: 'theme-selection-unavailable' });
  if (view.action.themeId !== String(expectedThemeId || view.action.themeId)
    || view.action.expectedCurrentThemeId !== String(expectedCurrentThemeId || view.action.expectedCurrentThemeId)) return freeze({ ok: false, reason: 'theme-selection-stale' });
  return freeze({ ok: true, action: view.action, automaticSelection: false, rawColorsAccepted: false, privateContentStored: false });
}

export default freeze({ EON_EXPANSE_W769B_THEME_SCHEMA, EON_EXPANSE_W769B_THEMES, EON_EXPANSE_W769B_DEFAULT_THEME_ID, isEonExpanseW769BThemeId, getEonExpanseW769BTheme, deriveEonExpanseW769BThemeChoice, validateEonExpanseW769BThemeAction });
