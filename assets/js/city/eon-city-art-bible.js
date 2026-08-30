/**
 * W624A — canonical art bible for the EON City flagship programme.
 *
 * This file is a design and runtime metadata authority. It does not claim that
 * final GLB/KTX2 assets, final character rigs, target-frame screenshots, or
 * device performance have already shipped. W624B–W624L must conform to this
 * contract and earn visual/device proof separately.
 */
export const EON_CITY_ART_BIBLE_SCHEMA = 'eon.city.art-bible.w624a.v1';

const freeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
};

export const EON_CITY_ART_BIBLE = freeze({
  schema: EON_CITY_ART_BIBLE_SCHEMA,
  title: 'EON City — Productive Nocturne',
  vision: 'A premium stylized neo-noir science-fantasy city where every beautiful place leads to useful, reviewable productive work.',
  releaseBoundary: {
    programme: 'W624A-W624L',
    sourceAuthority: true,
    ownerVisualApproval: 'pending-target-frame-review',
    finalBinaryArt: false,
    finalCharacterRigs: false,
    finalDeviceCertification: false,
    remoteArtRequired: false,
    privateUserDataInArt: false
  },
  pillars: [
    { id: 'productive-wonder', name: 'Productive wonder', rule: 'Every hero destination must open a real workflow, saved outcome, or honest guide.' },
    { id: 'authored-silhouettes', name: 'Authored silhouettes', rule: 'Landmarks, player, EONBOT, and NPCs must be recognizable in flat silhouette before emissive detail.' },
    { id: 'readable-nocturne', name: 'Readable nocturne', rule: 'Darkness creates depth, never hidden controls, crushed faces, unreadable paths, or empty black screens.' },
    { id: 'human-warmth', name: 'Human warmth', rule: 'Warm windows, gardens, service lights, voices, and working characters balance graphite and blue night.' },
    { id: 'truthful-motion', name: 'Truthful motion', rule: 'Animation reflects real local or server state; decorative motion never pretends a job is running.' },
    { id: 'calm-mastery', name: 'Calm mastery', rule: 'The interface feels focused and premium, not like a crowded game HUD or neon casino.' }
  ],
  palette: {
    neutrals: {
      voidBlue: '#050b18',
      graphite: '#07111e',
      carbon: '#0e1a2d',
      wetSteel: '#132742',
      glassBlue: '#163f59',
      moonMist: '#c7dcff'
    },
    accents: {
      signalCyan: '#69e7ff',
      creatorViolet: '#9b7cff',
      forgeAmber: '#ffbc68',
      archiveMint: '#92f5c2',
      socialMagenta: '#ff68cd'
    },
    usage: {
      neutralSurfaceMinimumPercent: 72,
      warmHumanLightMinimumPercent: 8,
      combinedAccentMaximumPercent: 20,
      simultaneousHeroAccentsMaximum: 2,
      rule: 'Use one district accent plus one semantic state color; never light every edge.'
    }
  },
  materials: [
    { id: 'brushed-graphite', role: 'primary structural shell', response: 'soft metallic highlight, visible edge wear, no mirror-black voids' },
    { id: 'wet-steel', role: 'roads, rails, infrastructure', response: 'controlled reflections and rain breakup, never chrome' },
    { id: 'prismatic-glass', role: 'creator and command interiors', response: 'layered translucent depth with readable silhouettes behind it' },
    { id: 'obsidian-ceramic', role: 'premium devices and EONBOT shell', response: 'warm black with restrained colored bounce' },
    { id: 'bio-lattice', role: 'archive gardens and recovery spaces', response: 'soft mint bioluminescence with organic rhythm' },
    { id: 'signal-mesh', role: 'temporary guidance and sharing', response: 'thin luminous fabric, never a permanent wall of holograms' }
  ],
  architecture: {
    language: 'neo-noir civic science-fantasy, built at human street scale with bold asymmetric crowns and visible productive interiors',
    compositionRules: [
      'Every landmark has a distinct base, body, crown, and one signature gesture.',
      'Street-level doors, benches, rails, steps, and people establish scale before skyline spectacle.',
      'Primary paths are readable by silhouette and warm/cool light contrast without HUD arrows.',
      'Hero buildings expose one believable working interior or activity window.',
      'Bridges and cantilevers frame views but never block the playable camera.',
      'Repeated box towers may appear only as distant background massing, never as hero landmarks.'
    ],
    commandDistrictLandmarks: [
      { id: 'command-loom', silhouette: 'split fin tower and suspended work bridge', purpose: 'projects, EONBOT, Command Center' },
      { id: 'agent-theatre', silhouette: 'low circular theatre beneath an open signal crown', purpose: 'real job lifecycle and review' },
      { id: 'creator-atrium', silhouette: 'stepped glass terraces around a luminous ribbon', purpose: 'image, video, campaign, and guide creation' },
      { id: 'forge-basilica', silhouette: 'industrial cathedral with diagonal heat-light bays', purpose: 'website and app building' },
      { id: 'signal-sail', silhouette: 'asymmetric sail with a split spectrum spine', purpose: 'public-safe sharing and invitations' },
      { id: 'archive-canopy', silhouette: 'garden canopy and archive rings', purpose: 'Library, saved work, and recovery' }
    ],
    scale: {
      playerHeightMeters: 1.76,
      standardDoorHeightMeters: 2.35,
      primaryWalkwayWidthMeters: 4.5,
      landmarkEntryClearanceMeters: 5.5,
      streetFurnitureSeatHeightMeters: 0.46,
      rule: 'All authored assets use meters and are reviewed beside the player reference capsule.'
    }
  },
  atmosphere: {
    timeOfDay: 'blue-hour nocturne after rain',
    sky: 'deep indigo gradient, pale moon grid, restrained aurora and distant traffic',
    fog: 'three depth bands: clear playable foreground, soft district separation, dense far skyline',
    lighting: [
      'Readable neutral key light on faces and paths.',
      'District accent used as rim or bounce, not the only light source.',
      'Warm service lights identify entrances, help, recovery, and occupied interiors.',
      'Bloom remains restrained enough to preserve signs, eyes, and surface detail.',
      'No flashing environmental light faster than accessibility policy allows.'
    ]
  },
  signage: {
    voice: 'short, confident, useful, and slightly poetic',
    rules: [
      'Destination signs use one to three words.',
      'Action labels use a verb plus an object: Open Project, Create Video, Review Job.',
      'Decorative glyphs never replace the readable label.',
      'Critical signage passes at gameplay distance and remains legible without bloom.',
      'Wayfinding colors remain consistent with district identity and high-contrast mode.'
    ],
    bannedCopy: ['ENTER THE METAVERSE', 'NFT MARKET', 'TOKEN VAULT', 'EARN CRYPTO', 'AUTONOMOUS AGENTS WORKING']
  },
  uiLanguage: {
    principle: 'The City HUD is a quiet instrument panel, not a game inventory wall.',
    persistentDesktop: ['current objective', 'nearby useful destination', 'Share', 'Menu'],
    persistentMobile: ['objective', 'interact', 'movement/camera', 'Menu'],
    progressiveDisclosure: ['job detail', 'project state', 'creator controls', 'billing summary', 'accessibility settings'],
    maximumSimultaneousPrimaryActions: 4,
    noFakeTelemetry: true
  },
  cameraLanguage: {
    gameplay: {
      style: 'responsive third-person exploration',
      radiusMeters: [7.5, 11.5],
      betaRadians: [0.84, 1.2],
      shoulderOffsetOptional: true,
      collisionRequired: true,
      cameraResetRequired: true,
      unstuckRequired: true
    },
    targetShots: [
      { id: 'arrival-hero', purpose: 'first ten-second promise', framing: 'player foreground, EONBOT at shoulder, Command Loom centered, Creator and Forge silhouettes on thirds' },
      { id: 'street-life', purpose: 'prove human scale', framing: 'NPC work vignette, readable entry, wet street reflection, skyline only as support' },
      { id: 'productive-interior', purpose: 'prove useful destination', framing: 'one real work panel, one character interaction, one visible saved outcome' },
      { id: 'mobile-orientation', purpose: 'prove touch readability', framing: 'clear path, one destination, minimal controls inside safe areas' }
    ]
  },
  animation: {
    targetQuality: 'stylized weight, readable anticipation, clean settles, no robotic sliding',
    playerRequiredClips: ['idle', 'walk', 'run', 'turn', 'interact', 'inspect', 'celebrate', 'sit-work', 'recover'],
    eonbotRequiredClips: ['hover-idle', 'follow', 'lead', 'point', 'think', 'speak', 'scan', 'celebrate', 'warn', 'dismiss'],
    npcRequiredStates: ['idle', 'work', 'walk', 'talk', 'guide', 'react', 'recover'],
    qualityRules: [
      'Feet do not visibly slide during normal locomotion.',
      'Characters acknowledge the player without snapping their whole body.',
      'Idle loops include breathing and role-specific micro-actions, not constant waving.',
      'Reduced-motion mode removes bobbing, camera pushes, and nonessential loops.',
      'A running-job animation may appear only while a real job state is running.'
    ]
  },
  cast: {
    player: {
      id: 'wayfinder',
      silhouette: 'grounded long-line utility coat, asymmetric shoulder light, compact field pack',
      personality: 'capable newcomer rather than chosen-one superhero',
      customizationSlots: ['body presentation', 'skin tone', 'hair/headwear', 'coat panel', 'accent light', 'mobility aid', 'earned cosmetic'],
      prohibitions: ['sexualized default proportions', 'combat weapons', 'pay-to-win statistics', 'forced gender presentation']
    },
    eonbot: {
      id: 'eonbot-orbit',
      silhouette: 'small obsidian companion core inside an offset halo and two expressive light fins',
      personality: 'warm, curious, concise, never childish or intrusive',
      scaleMeters: 0.62,
      expressionChannels: ['halo tilt', 'fin pose', 'eye aperture', 'light pulse', 'voice/caption'],
      prohibitions: ['human face imitation', 'fake autonomous work', 'blocking movement', 'unskippable speeches']
    },
    npcs: [
      { id: 'project-navigator', silhouette: 'tall layered map-cloak and route prism', accent: 'signalCyan', outcome: 'opens or resumes a real project' },
      { id: 'creator-technician', silhouette: 'wide utility apron, floating frame tools, cropped jacket', accent: 'creatorViolet', outcome: 'prepares a real image/video creation flow' },
      { id: 'forge-architect', silhouette: 'angular tool harness and amber build gauntlet', accent: 'forgeAmber', outcome: 'opens a reviewable Forge build' },
      { id: 'archive-keeper', silhouette: 'rounded canopy mantle and mint memory lantern', accent: 'archiveMint', outcome: 'finds, restores, or explains saved local work' },
      { id: 'support-wayfinder', silhouette: 'compact service coat and warm beacon staff', accent: 'warmWhite', outcome: 'opens help, recovery, or accessibility controls' }
    ]
  },
  productiveRpg: {
    definition: 'Exploration, characters, missions, and progression are presentation layers for real EONAPP work—not substitutes for it.',
    missionContract: {
      mustStartFrom: ['explicit user choice', 'saved project state', 'honest onboarding need'],
      mustCreateOneOf: ['saved project', 'generated artifact', 'reviewable proposal', 'setting change', 'backup/restore receipt', 'support resolution'],
      mustPersist: true,
      mustExposeSourceAndTimestamp: true,
      fakeSuccessScreenAllowed: false
    },
    progression: {
      allowed: ['learning milestones', 'non-financial reputation', 'cosmetics', 'Vault Reveals', 'EONKEY individual unlocks after server proof'],
      prohibited: ['cash value', 'token balance', 'tradable ownership', 'loot boxes', 'pay-to-win power', 'fake productivity score']
    },
    firstMissions: [
      { id: 'orientation', outcome: 'choose a destination and save accessibility/input preferences' },
      { id: 'continue-project', outcome: 'open or create a persisted project' },
      { id: 'creator-signal', outcome: 'save one image/video plan or real output when a supported rail exists' },
      { id: 'automation-review', outcome: 'save a reviewable automation draft; never auto-run without approval' },
      { id: 'vault-recovery', outcome: 'review local backup state or create a user-confirmed snapshot plan' }
    ]
  },
  audio: {
    identity: 'deep air, distant transit, soft rain, glass harmonics, restrained analog pulse, warm service chimes',
    semanticCues: {
      guidance: 'single soft ascending interval',
      success: 'warm two-part resolve, never casino fanfare',
      warning: 'dry low pulse plus caption',
      jobRunning: 'subtle loop only while real state is running',
      privateBoundary: 'muted close-field tone before sensitive panels'
    },
    requirements: ['independent ambience, voice, UI, and effects volume', 'captions for meaningful audio', 'mute and reduced-sensory modes', 'no essential audio-only instruction']
  },
  budgets: {
    disclaimer: 'Target ceilings for W624B-W624L; not current measured performance claims.',
    profiles: {
      lite: { visibleTriangles: 220000, drawCalls: 170, textureMemoryMb: 220, initialCompressedTransferMb: 16, simultaneousNpcs: 5, targetFps: 30 },
      balanced: { visibleTriangles: 650000, drawCalls: 320, textureMemoryMb: 560, initialCompressedTransferMb: 34, simultaneousNpcs: 10, targetFps: 45 },
      cinematic: { visibleTriangles: 1100000, drawCalls: 480, textureMemoryMb: 900, initialCompressedTransferMb: 52, simultaneousNpcs: 16, targetFps: 60 }
    },
    common: {
      largestCompressedAssetMb: 8,
      initialAudioMb: 4,
      totalAudioMb: 20,
      unboundedParticleSystemsAllowed: false,
      unboundedDynamicTexturesAllowed: false,
      qualityDowngradeWithoutReloadRequired: true
    }
  },
  targetFrames: [
    { id: 'desktop-arrival', path: '/assets/city/art/w624a-targets/eon-city-desktop-arrival-target.svg', viewport: [1600, 900], status: 'art-direction-target-not-runtime-screenshot' },
    { id: 'mobile-arrival', path: '/assets/city/art/w624a-targets/eon-city-mobile-arrival-target.svg', viewport: [900, 1600], status: 'art-direction-target-not-runtime-screenshot' },
    { id: 'cast-lineup', path: '/assets/city/art/w624a-targets/eon-city-cast-lineup-target.svg', viewport: [1600, 900], status: 'character-silhouette-target-not-final-rig' }
  ],
  rejectList: [
    'Empty black space dominating the first view.',
    'Hero landmarks made from generic neon boxes, undifferentiated forms, or repeated primitives.',
    'Bloom that erases signs, faces, paths, or surface detail.',
    'Unreadable tiny holographic text used as decoration.',
    'Doors, rails, benches, vehicles, or NPCs with inconsistent human scale.',
    'Static mannequin NPCs in the flagship route.',
    'Camera clipping, trapped spawn points, or required precision platforming.',
    'Every building using cyan, violet, magenta, amber, and mint simultaneously.',
    'Floating HUD panels covering the world without an immediate user task.',
    'Fake dashboards, fake jobs, fake agent activity, fake economy, or speculative ownership.',
    'Combat weapons, health bars, loot boxes, gambling cues, or pay-to-win progression.',
    'Private prompt, project, key, chat, billing, or Vault data visible in public scenery.',
    'Remote art or analytics required for the City to render.',
    'Final-quality expansion to other districts before the Command District scores at least 9.0/10.'
  ],
  scorecard: {
    categories: [
      { id: 'first-impression', weight: 14 },
      { id: 'silhouette-originality', weight: 12 },
      { id: 'street-scale-readability', weight: 10 },
      { id: 'materials-lighting-atmosphere', weight: 12 },
      { id: 'player-eonbot-npc-quality', weight: 12 },
      { id: 'productive-rpg-truth', weight: 14 },
      { id: 'camera-controls-recovery', weight: 8 },
      { id: 'ui-signage-accessibility', weight: 8 },
      { id: 'audio-animation-life', weight: 5 },
      { id: 'performance-device-discipline', weight: 5 }
    ],
    commandDistrictExpansionThreshold: 9.0,
    flagshipOwnerApprovalThreshold: 9.5,
    minimumCategoryAtFlagship: 9.0,
    sourceStringsCannotCertifyVisualQuality: true
  }
});

export function getEonCityArtBibleSummary() {
  return freeze({
    schema: EON_CITY_ART_BIBLE.schema,
    title: EON_CITY_ART_BIBLE.title,
    vision: EON_CITY_ART_BIBLE.vision,
    pillarCount: EON_CITY_ART_BIBLE.pillars.length,
    landmarkCount: EON_CITY_ART_BIBLE.architecture.commandDistrictLandmarks.length,
    npcCount: EON_CITY_ART_BIBLE.cast.npcs.length,
    targetFrameCount: EON_CITY_ART_BIBLE.targetFrames.length,
    rejectCount: EON_CITY_ART_BIBLE.rejectList.length,
    scoreWeight: EON_CITY_ART_BIBLE.scorecard.categories.reduce((sum, row) => sum + row.weight, 0),
    ownerVisualApproval: EON_CITY_ART_BIBLE.releaseBoundary.ownerVisualApproval,
    finalBinaryArt: false,
    finalDeviceCertification: false
  });
}

export function validateEonCityArtBible(bible = EON_CITY_ART_BIBLE) {
  const errors = [];
  if (bible?.schema !== EON_CITY_ART_BIBLE_SCHEMA) errors.push('Art-bible schema drifted.');
  if (!String(bible?.vision || '').includes('productive')) errors.push('Vision must preserve productive City identity.');
  if (!Array.isArray(bible?.pillars) || bible.pillars.length < 6) errors.push('Six flagship design pillars are required.');
  const usage = bible?.palette?.usage || {};
  if (usage.neutralSurfaceMinimumPercent < 70 || usage.combinedAccentMaximumPercent > 20 || usage.simultaneousHeroAccentsMaximum > 2) errors.push('Palette discipline is too neon-heavy.');
  if (!Array.isArray(bible?.architecture?.commandDistrictLandmarks) || bible.architecture.commandDistrictLandmarks.length < 6) errors.push('Command District landmark language is incomplete.');
  if (bible?.architecture?.scale?.playerHeightMeters < 1.5 || bible?.architecture?.scale?.standardDoorHeightMeters < 2) errors.push('Human-scale reference is invalid.');
  if (!Array.isArray(bible?.cast?.player?.customizationSlots) || bible.cast.player.customizationSlots.length < 6) errors.push('Player inclusion/customization foundation is incomplete.');
  if (!Array.isArray(bible?.cast?.eonbot?.expressionChannels) || bible.cast.eonbot.expressionChannels.length < 5) errors.push('EONBOT expression system is incomplete.');
  if (!Array.isArray(bible?.cast?.npcs) || bible.cast.npcs.length < 5 || bible.cast.npcs.some((npc) => !npc.outcome)) errors.push('Five productive NPC cast roles are required.');
  if (bible?.productiveRpg?.missionContract?.fakeSuccessScreenAllowed !== false || bible?.productiveRpg?.missionContract?.mustPersist !== true) errors.push('Productive-RPG truth contract drifted.');
  if (!Array.isArray(bible?.targetFrames) || bible.targetFrames.length < 3) errors.push('Desktop, mobile, and cast target frames are required.');
  if (!Array.isArray(bible?.rejectList) || bible.rejectList.length < 12) errors.push('Reject list is not strict enough.');
  const scoreWeight = bible?.scorecard?.categories?.reduce?.((sum, row) => sum + Number(row.weight || 0), 0) || 0;
  if (scoreWeight !== 100 || bible?.scorecard?.commandDistrictExpansionThreshold !== 9 || bible?.scorecard?.flagshipOwnerApprovalThreshold !== 9.5) errors.push('Visual scorecard thresholds drifted.');
  if (bible?.releaseBoundary?.finalBinaryArt !== false || bible?.releaseBoundary?.finalDeviceCertification !== false) errors.push('W624A cannot claim final art or device proof.');
  return freeze({ schema: EON_CITY_ART_BIBLE_SCHEMA, ok: errors.length === 0, errors, checks: 14 });
}
