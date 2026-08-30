/** W364 — Immersive Work Mode controller contract. */
export const W364_BABYLON_IMMERSIVE_CONTROLS_CONTRACT = Object.freeze({
  schema: 'eonapp.w364.babylon-immersive-controls-contract.v1',
  capabilities: Object.freeze([
    'keyboard-wasd-arrows',
    'keyboard-escape-pause',
    'keyboard-m-minimap',
    'keyboard-e-request-interaction',
    'touch-analogue-joystick',
    'touch-accessible-direction-pad',
    'mouse-click-to-move-opt-in',
    'optional-gamepad-movement',
    'optional-gamepad-request-interaction',
    'local-minimap',
    'safe-lifecycle-cleanup'
  ]),
  safety: Object.freeze({
    clickToMove: 'off-by-default and local-only',
    routeOpen: 'never automatic',
    routeReview: 'visible review required',
    routeConfirmation: 'separate explicit user action',
    gamepad: 'may request visible interaction review but never confirms a destination',
    telemetry: 'none',
    remoteAssets: 'none',
    localInputStorage: 'none'
  }),
  accessibility: Object.freeze({
    touchTargetPx: 56,
    safeArea: true,
    reducedMotionRespected: true,
    portraitGuidance: true,
    cityLiteFallback: '/eoncity/lite'
  }),
  manualProofRequired: Object.freeze([
    'Android Chrome touch joystick and safe-area test',
    'iPhone Safari touch joystick and fullscreen/orientation test',
    'desktop keyboard, mouse click-to-move and minimap test',
    'wired or Bluetooth gamepad movement and interaction-review test',
    'pause, background, context-loss and route-return lifecycle test'
  ])
});
