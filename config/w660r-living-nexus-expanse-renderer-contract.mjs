export const W660R_LIVING_NEXUS_EXPANSE_RENDERER_CONTRACT = Object.freeze({
  schema: 'eonapp.w660r.living-nexus-expanse-renderer.contract.2026-07-21.v1',
  wave: 'W660R',
  product: 'EONCITY: THE LIVING NEXUS',
  sourceStatus: 'implemented-awaiting-authenticated-browser-proof',
  renderer: Object.freeze({
    engine: 'existing Babylon engine',
    canvasCountAdded: 0,
    renderLoopCountAdded: 0,
    visibleCellCount: 25,
    interactiveCellCount: 9,
    horizonCellCount: 16,
    streamingModel: 'incremental deterministic residency',
    deterministic: true,
    sourceControlledProcedural: true,
    practicalWorldBound: 1_000_000,
    visibleWorldBorder: false,
    destinations: Object.freeze(['core', 'expanse', 'my-realm']),
    modes: Object.freeze(['focus', 'explore'])
  }),
  expanseCellRequirements: Object.freeze([
    'connected east-west and north-south streets',
    'deterministic visual identity',
    'quality-profile building composition',
    'bounded local activity signal',
    'functional NPC opportunity signal',
    'safe route markers without automatic navigation',
    '5×5 visible horizon with a 3×3 interactive neighbourhood',
    'incremental reuse of unchanged cells when the current cell changes',
    'explicit disposal of cells that leave residency or change tier'
  ]),
  myRealmRequirements: Object.freeze([
    'local bounded platform',
    'explicit Core return portal',
    'verified transformation pylons only',
    'no private mission or project content',
    'no reward, payment or completion claim'
  ]),
  invariants: Object.freeze({
    oneCanonicalScene: true,
    oneCanonicalCanvas: true,
    oneCanonicalRenderLoop: true,
    oneCanonicalEonbot: true,
    oneProjectStore: true,
    oneTaskStore: true,
    reviewFirstTravel: true,
    noAutomaticNavigation: true,
    noAutomaticExecution: true,
    noPrivateDataRead: true,
    noNetworkRequest: true,
    noFakeRewardOrPayment: true
  }),
  proofStillRequired: Object.freeze([
    'authenticated Chrome desktop traversal',
    'Edge, Firefox and Opera traversal',
    'mobile and touch traversal',
    '5×5 visible / 3×3 interactive residency and incremental disposal observation',
    'reduced-motion static behaviour',
    'quality-profile performance evidence',
    'mission receipt to My Realm visual transformation',
    'Functions-inclusive Cloudflare Pages preview and production proof'
  ])
});
