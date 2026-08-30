export const W660P_LIVING_NEXUS_HYBRID_CONTRACT = Object.freeze({
  schema: 'eonapp.w660p.living-nexus-hybrid.contract.2026-07-21.v1',
  wave: 'W660P',
  productName: 'EONCITY: THE LIVING NEXUS',
  finalFormula: 'Handcrafted Core + Living Streets + Seeded Expanse + Rare Realms + Productive Missions + Persistent Personal Transformation',
  destinations: Object.freeze([
    Object.freeze({ id: 'core', label: 'EONCITY CORE', status: 'available', role: 'authored productive city and nine-district anchor' }),
    Object.freeze({ id: 'expanse', label: 'THE EXPANSE', status: 'foundation', role: 'deterministic connected 3×3 streamed-cell proof' }),
    Object.freeze({ id: 'my-realm', label: 'MY REALM', status: 'local-foundation', role: 'private local record of verified world transformations' })
  ]),
  modes: Object.freeze([
    Object.freeze({ id: 'focus', label: 'Focus Mode', purpose: 'fast review, direct terminals, minimal detours, productivity first' }),
    Object.freeze({ id: 'explore', label: 'Explore Mode', purpose: 'walking, transit, NPC life, missions, weather and discoveries' })
  ]),
  cellGrammar: Object.freeze([
    'connected road grammar',
    'visual identity',
    'building composition',
    'activity layer',
    'gameplay purpose',
    'safe navigation route'
  ]),
  verticalSlice: Object.freeze([
    'leave Core City',
    'enter the Expanse',
    'discover a landmark',
    'meet a functional NPC',
    'review a real productive mission',
    'complete it through the native EONAPP surface',
    'transform the location from a verified bounded receipt',
    'record the result in Atlas',
    'return through Nexus',
    'see the result reflected in My Realm'
  ]),
  invariants: Object.freeze({
    oneCanonicalEonbot: true,
    oneProjectStore: true,
    oneTaskStore: true,
    oneRenderLoop: true,
    oneCanvas: true,
    reviewFirst: true,
    noAutomaticNavigation: true,
    noAutomaticExecution: true,
    noPrivateWorkInWorldState: true,
    noFakeCompletion: true,
    noRewardOrPaymentClaim: true,
    localFoundationOnly: true,
    authenticatedLiveProofPending: true
  }),
  buildOrder: Object.freeze([
    'W660P0 release-governance repair and roadmap lock',
    'W660P1 Living Nexus runtime contract and UI foundation',
    'W660Q authored Core completeness and district transformation layer',
    'W660R deterministic 3×3 Expanse renderer vertical slice',
    'W660S functional NPC opportunity and mission encounter layer',
    'W660T Atlas-to-My-Realm transformation return loop',
    'W660U traffic, weather, schedules, transit and rare portal layer',
    'W660V Nexus Realms and creator-owned private Realm expansion',
    'W660W authenticated multi-browser, mobile, performance and production certification'
  ])
});
