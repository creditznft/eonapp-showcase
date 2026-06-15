// Public-safe example: mobile game overlay rules, not production EON City source.
export function enforceMobilePanelRules(panelState = {}) {
  return {
    ...panelState,
    closeButtonRequired: true,
    minimizeButtonRequired: true,
    maxViewportCoverage: '72vh',
    safeAreaAware: true,
    gameplayCanHideUi: true
  };
}
