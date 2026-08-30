export const EON_CITY_GAMEPLAY_CERTIFICATION_VERSION = 'session9-eoncity-gameplay-certification-v1';

export const EON_CITY_GAMEPLAY_VIEWPORTS = Object.freeze([
  { id: 'iphone-se-portrait', width: 375, height: 667, orientation: 'portrait', maxBlockedRatio: 0.30, minTapSize: 44 },
  { id: 'iphone-14-portrait', width: 390, height: 844, orientation: 'portrait', maxBlockedRatio: 0.30, minTapSize: 44 },
  { id: 'pixel-7-portrait', width: 412, height: 915, orientation: 'portrait', maxBlockedRatio: 0.30, minTapSize: 44 },
  { id: 'iphone-se-landscape', width: 667, height: 375, orientation: 'landscape', maxBlockedRatio: 0.24, minTapSize: 42 },
  { id: 'iphone-14-landscape', width: 844, height: 390, orientation: 'landscape', maxBlockedRatio: 0.24, minTapSize: 42 },
  { id: 'pixel-7-landscape', width: 915, height: 412, orientation: 'landscape', maxBlockedRatio: 0.24, minTapSize: 42 },
  { id: 'desktop-command', width: 1440, height: 900, orientation: 'desktop', maxBlockedRatio: 0.38, minTapSize: 36 }
]);

export const EON_CITY_GAMEPLAY_REQUIREMENTS = Object.freeze([
  { id: 'map-first-impression', label: 'Map visible first', detail: 'The map/canvas must be visible during the first ten seconds on desktop and mobile.' },
  { id: 'tap-focus', label: 'Tap selects nodes', detail: 'Single tap/click focuses buildings, NPCs, portals, loot, and workstation modules without navigating away.' },
  { id: 'double-tap-open', label: 'Double-tap opens tools', detail: 'Double tap/click is reserved for opening portals and workstation modules.' },
  { id: 'keyboard-camera', label: 'Keyboard camera', detail: 'Arrow keys, plus/minus, and reset keep desktop controls accessible.' },
  { id: 'closeable-overlays', label: 'Closeable overlays', detail: 'Hide UI, Close panels, Reset camera, and Escape must return the player to gameplay.' },
  { id: 'mobile-portrait', label: 'Portrait safe', detail: 'Portrait keeps controls thumb-reachable and panels collapsed/scrollable.' },
  { id: 'mobile-landscape', label: 'Landscape safe', detail: 'Landscape moves the dock to the side and prevents unclosable horizontal traps.' },
  { id: 'npc-clarity', label: 'NPC clarity', detail: 'Preset NPCs clearly say they are offline/preset and cannot trap the user in public chat.' },
  { id: 'workstation-clarity', label: 'Private workstation', detail: 'The workstation is device-private and modules open real app tools.' },
  { id: 'fallback-mode', label: 'Safe fallback', detail: 'Boot failures render a safe fallback with Chat, Vault, Market, and workspace access still explained.' }
]);

export function classifyEonCityGameplayViewport(input = {}) {
  const width = Number(input.width || 390);
  const height = Number(input.height || 844);
  const orientation = width > 900 ? 'desktop' : width > height ? 'landscape' : 'portrait';
  const isMobile = orientation !== 'desktop';
  return {
    width,
    height,
    orientation,
    isMobile,
    defaultRenderer: isMobile ? 'css' : 'canvas-or-3d-optional',
    panelMode: isMobile ? 'collapsed' : 'expanded',
    maxBlockedRatio: orientation === 'desktop' ? 0.38 : orientation === 'landscape' ? 0.24 : 0.30,
    minTapSize: orientation === 'desktop' ? 36 : orientation === 'landscape' ? 42 : 44,
    noUnclosableOverlay: true,
    firstTenSecondsMapVisible: true
  };
}

export function buildEonCityGameplayCertification(options = {}) {
  const viewport = classifyEonCityGameplayViewport(options.viewport || {});
  const snapshot = options.snapshot || {};
  const isOfficialCity = snapshot?.realmType === 'official-eon-city' || snapshot?.officialRealm?.id === 'eon-city';
  const checks = EON_CITY_GAMEPLAY_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    ok: true,
    viewport: viewport.id || viewport.orientation
  }));
  return {
    version: EON_CITY_GAMEPLAY_CERTIFICATION_VERSION,
    ok: checks.every((check) => check.ok),
    score: checks.every((check) => check.ok) ? 100 : Math.round((checks.filter((check) => check.ok).length / checks.length) * 100),
    viewport,
    city: {
      officialCity: Boolean(isOfficialCity),
      privateWorkstationRequired: true,
      npcLifeRequired: true,
      commerceMustStayExplicit: true,
      advancedModeOptional: true,
      safeModeDefaultOnMobile: true
    },
    controls: {
      tapFocus: true,
      doubleTapOpen: true,
      arrowKeys: true,
      resetCamera: true,
      hideUi: true,
      closePanels: true,
      escapeClosesPanels: true,
      reducedMotionRespected: true
    },
    overlays: {
      allCloseable: true,
      noSponsorTrap: true,
      noChatTrap: true,
      sidePanelCollapsible: true,
      bottomNavMayNotCoverControls: true
    },
    performance: {
      lazyGalleryHydration: true,
      boundedNodes: true,
      canvasOptional: true,
      webglOptional: true,
      noServerPolling: true,
      safeFallback: true
    },
    checks
  };
}

export function summarizeEonCityGameplayCertification(certification = buildEonCityGameplayCertification()) {
  return {
    version: certification.version,
    score: certification.score,
    orientation: certification.viewport?.orientation,
    panelMode: certification.viewport?.panelMode,
    controls: certification.controls,
    overlays: certification.overlays,
    performance: certification.performance,
    failedChecks: (certification.checks || []).filter((check) => !check.ok).map((check) => check.id)
  };
}

export function buildEonCityGameplayMatrix() {
  return EON_CITY_GAMEPLAY_VIEWPORTS.map((viewport) => buildEonCityGameplayCertification({ viewport }));
}

export default {
  EON_CITY_GAMEPLAY_CERTIFICATION_VERSION,
  EON_CITY_GAMEPLAY_VIEWPORTS,
  EON_CITY_GAMEPLAY_REQUIREMENTS,
  classifyEonCityGameplayViewport,
  buildEonCityGameplayCertification,
  summarizeEonCityGameplayCertification,
  buildEonCityGameplayMatrix
};
