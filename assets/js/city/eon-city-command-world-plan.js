/**
 * W618A — EON City Command World plan.
 *
 * This is the living CEO/product contract for the approved City direction:
 * Command Room + Living Dashboard + Agent Theater, reusing existing districts
 * and art assets while making the default experience useful and readable.
 * It is deliberately a product/UX contract, not a payment, entitlement,
 * provider, telemetry, publishing, or referral grant implementation.
 */
export const EON_CITY_COMMAND_WORLD_PLAN_SCHEMA = 'eon.city.command-world-plan.w618a.v1';

const freeze = (value) => Object.freeze(value);
const clone = (value) => JSON.parse(JSON.stringify(value));

export const EON_CITY_COMMAND_WORLD_LAYERS = freeze([
  freeze({
    id: 'command-room',
    label: 'EON Command Room',
    role: 'default-productivity-cockpit',
    promise: 'A readable 3D control room where the person can operate EONBOT, Projects, Studio, Forge, Local AI, Vault and Share without getting lost.',
    defaultMode: true,
    productivityScore: 9,
    entertainmentScore: 6,
    cuttingEdgeScore: 8,
    launchFeasibilityScore: 8,
    sourceReuse: freeze(['Command Deck', 'useful work paths', 'Project portals', 'EONBOT companion', 'City HUD', 'local route review']),
    mustHave: freeze([
      'one visible primary command panel',
      'large app screens/cards with direct labels',
      'global Share Command Center entry',
      'native work surfaces open only by explicit user action',
      'no raw grey browser buttons',
      'no overlapping instructional walls'
    ])
  }),
  freeze({
    id: 'living-dashboard',
    label: 'EON Living City Dashboard',
    role: 'status-and-signal-layer',
    promise: 'The City skyline becomes a truthful dashboard: Local AI, projects, Vault, backup, Share, automations and device status light up from real local/server state only.',
    defaultMode: false,
    productivityScore: 7,
    entertainmentScore: 9,
    cuttingEdgeScore: 9,
    launchFeasibilityScore: 6,
    sourceReuse: freeze(['living systems', 'agent signals', 'operator activity', 'membership map', 'performance/device lab', 'Vault reveals']),
    mustHave: freeze([
      'truthful dormant/active state labels',
      'no fake AI work animation',
      'district buildings mapped to real app surfaces',
      'local-only status for unavailable ledgers',
      'clear route back to Command Room'
    ])
  }),
  freeze({
    id: 'agent-theater',
    label: 'EON Agent Theater',
    role: 'future-agent-visualization',
    promise: 'Visible agents/orbs move between districts only when a real local or server job receipt exists, so work feels alive without pretending.',
    defaultMode: false,
    productivityScore: 8,
    entertainmentScore: 10,
    cuttingEdgeScore: 10,
    launchFeasibilityScore: 4,
    sourceReuse: freeze(['agent director', 'agent presence', 'AI job receipts', 'EONBOT rig', 'NPC archetypes', 'seeded ambience']),
    mustHave: freeze([
      'real receipt before visible agent activity',
      'sleeping/dormant agents when no job exists',
      'no private prompt text in the world',
      'no provider call from animation alone',
      'receipt opens native review surface only'
    ])
  })
]);

export const EON_CITY_COMMAND_WORLD_DISTRICTS = freeze([
  freeze({ id: 'command-centre', label: 'Command Centre', appSurface: 'EONBOT', route: '/', layer: 'command-room' }),
  freeze({ id: 'workshop', label: 'Forge Bay / Build Workshop', appSurface: 'Projects + Forge', route: '/projects', layer: 'command-room' }),
  freeze({ id: 'creator-atrium', label: 'Creator Atrium', appSurface: 'Studio / Creator Engine', route: '/workspace#creator-engine', layer: 'command-room' }),
  freeze({ id: 'observatory', label: 'Local AI Observatory', appSurface: 'Local AI setup', route: '/local-ai', layer: 'living-dashboard' }),
  freeze({ id: 'archive', label: 'Knowledge Archive', appSurface: 'Workspace + Library', route: '/workspace', layer: 'living-dashboard' }),
  freeze({ id: 'relay', label: 'Realm Relay', appSurface: 'Realm Studio', route: '/realm-studio', layer: 'living-dashboard' }),
  freeze({ id: 'vault-safehouse', label: 'Vault Gardens', appSurface: 'Vault + backup', route: '/vault', layer: 'living-dashboard' }),
  freeze({ id: 'share-tower', label: 'Share Tower', appSurface: 'Share Command Center + rewards explanation', route: 'share-popover', layer: 'command-room' }),
  freeze({ id: 'automation-relay', label: 'Automation Relay', appSurface: 'Automations', route: '/automations', layer: 'agent-theater' })
]);

export const EON_CITY_COMMAND_WORLD_ROADMAP = freeze([
  freeze({
    id: 'w618a',
    title: 'City emergency usability and plan lock',
    deliverable: 'Fix inverted-feeling movement, mouse/tap district selection, readable panels, account-error cleanup, and source-controlled Command World plan.',
    codingNow: false,
    blocksLaunchUntilDone: false
  }),
  freeze({
    id: 'w618b',
    title: 'Global Share Command Center + compact shell',
    deliverable: 'Permanent top-right Share Command Center on every app-shell page, referral/EON Keys explanation, compact sidebar and app grouping.',
    codingNow: false,
    blocksLaunchUntilDone: false
  }),
  freeze({
    id: 'w618c',
    title: 'Command Room default',
    deliverable: 'Make /eoncity open to a practical 3D command cockpit first, with optional immersive City Explore.',
    codingNow: false,
    blocksLaunchUntilDone: false
  }),
  freeze({
    id: 'w618d',
    title: 'Living Dashboard signals',
    deliverable: 'Map real local/server readiness states to skyline panels, towers and status lights without fake jobs.',
    codingNow: false,
    blocksLaunchUntilDone: false
  }),
  freeze({
    id: 'w618e',
    title: 'Agent Theater foundations',
    deliverable: 'Show dormant agents now and active agents only from real job receipts later.',
    codingNow: false,
    blocksLaunchUntilDone: false
  }),
  freeze({
    id: 'w618f',
    title: 'City browser/mobile proof',
    deliverable: 'Chrome/Edge desktop, mouse, keyboard, mobile portrait fallback, landscape City, route return and cache proof.',
    codingNow: false,
    blocksLaunchUntilDone: false
  }),
  freeze({
    id: 'w619',
    title: 'Historical Dodo/server entitlement envelope',
    deliverable: 'Historical design wave that established the server-authority boundary. RT92 now uses live Dodo checkout/webhook entitlement authority and separate server-authoritative EONKEY ledgers.',
    codingNow: false,
    blocksLaunchUntilDone: false
  }),
  freeze({
    id: 'rt92-live',
    title: 'RT92 live commercial and reward authority',
    deliverable: 'Keep City useful for Free users while paid access, referral EONKEYS and voluntary Sponsor Keys are resolved only by signed server authorities. City/browser state never mints entitlement or reward value.',
    codingNow: true,
    blocksLaunchUntilDone: false
  })
]);

export function buildEonCityCommandWorldPlan({ includeScores = true } = {}) {
  const layers = clone(EON_CITY_COMMAND_WORLD_LAYERS);
  const districts = clone(EON_CITY_COMMAND_WORLD_DISTRICTS);
  const roadmap = clone(EON_CITY_COMMAND_WORLD_ROADMAP);
  return freeze({
    schema: EON_CITY_COMMAND_WORLD_PLAN_SCHEMA,
    approvedDirection: 'command-room-plus-living-dashboard-plus-agent-theater',
    currentDefaultDecision: 'command-room-first-3d-explore-second-agent-theater-later',
    keepExistingAssets: true,
    keepExistingDistricts: true,
    replaceCurrentConfusingDefault: true,
    topRightShareRequiredEverywhere: true,
    globalShareRewardsCopyRequired: true,
    noFakeAgentActivity: true,
    noBrowserEntitlementAuthority: true,
    serverReferralAuthorityRequired: true,
    serverCheckoutAuthorityRequired: true,
    rewardedSponsorAuthorityRequired: true,
    noAutoPost: true,
    noPrivatePromptInWorld: true,
    layers: includeScores ? layers : layers.map(({ productivityScore: _p, entertainmentScore: _e, cuttingEdgeScore: _c, launchFeasibilityScore: _l, ...layer }) => layer),
    districts,
    roadmap,
    launchRule: 'Billing, referral EONKEYS and rewarded Sponsor Keys may be live only through their signed server authorities. City and browser state never grant entitlement, referral value or Sponsor Keys.'
  });
}

export function validateEonCityCommandWorldPlan(plan = buildEonCityCommandWorldPlan()) {
  const errors = [];
  if (plan.schema !== EON_CITY_COMMAND_WORLD_PLAN_SCHEMA) errors.push('Command World plan schema mismatch.');
  const layerIds = new Set((plan.layers || []).map((layer) => layer.id));
  for (const required of ['command-room', 'living-dashboard', 'agent-theater']) {
    if (!layerIds.has(required)) errors.push(`Missing approved EON City layer: ${required}.`);
  }
  const defaultLayers = (plan.layers || []).filter((layer) => layer.defaultMode === true);
  if (defaultLayers.length !== 1 || defaultLayers[0]?.id !== 'command-room') errors.push('Command Room must be the single default layer.');
  if (plan.keepExistingAssets !== true || plan.keepExistingDistricts !== true) errors.push('Plan must reuse existing City assets and districts.');
  if (plan.topRightShareRequiredEverywhere !== true || plan.globalShareRewardsCopyRequired !== true) errors.push('Global Share Command Center requirement is missing.');
  if (plan.noFakeAgentActivity !== true || plan.noPrivatePromptInWorld !== true) errors.push('Agent Theater truth/privacy boundary is missing.');
  if (plan.serverCheckoutAuthorityRequired !== true || plan.serverReferralAuthorityRequired !== true || plan.rewardedSponsorAuthorityRequired !== true || plan.noBrowserEntitlementAuthority !== true) errors.push('Commercial/reward authority must remain server-only.');
  const roadmapIds = new Set((plan.roadmap || []).map((wave) => wave.id));
  for (const required of ['w618a', 'w618b', 'w618c', 'w618d', 'w618e', 'w618f', 'w619', 'rt92-live']) {
    if (!roadmapIds.has(required)) errors.push(`Missing roadmap wave: ${required}.`);
  }
  const immediate = (plan.roadmap || []).find((wave) => wave.codingNow);
  if (immediate?.id !== 'rt92-live') errors.push('RT92 live authority must be the current City wave.');
  const cityText = JSON.stringify(plan);
  if (/cash|crypto|wallet balance|nft|free month|renewal discount|automatic posting|fake agent|platform-paid hosted generation/i.test(cityText)) errors.push('Plan contains a forbidden reward, posting, or fake-agent promise.');
  return freeze({ schema: `${EON_CITY_COMMAND_WORLD_PLAN_SCHEMA}.validation`, ok: errors.length === 0, errors: freeze(errors), layerCount: layerIds.size, roadmapCount: roadmapIds.size });
}

export function decideNextEonCityWave({ cityUsabilityPassed = false, globalSharePassed = false, commandRoomPassed = false, browserProofPassed = false } = {}) {
  const productUxReady = Boolean(cityUsabilityPassed && globalSharePassed && commandRoomPassed && browserProofPassed);
  return freeze({
    next: 'rt92-live',
    reason: productUxReady
      ? 'RT92 City is ready for live acceptance; commercial and reward authority remains server-only.'
      : 'Continue City usability/browser acceptance without disabling the independent server-authoritative commercial rails.',
    billingAllowed: true,
    browserMayGrantEntitlement: false,
    browserMayGrantReward: false
  });
}
