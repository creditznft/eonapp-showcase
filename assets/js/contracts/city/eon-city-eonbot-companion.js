/**
 * A15 I03 — Core-owned City contract extracted from assets/js/city/eon-city-eonbot-companion.js.
 * Rendering/runtime implementation remains under assets/js/city; this module
 * is safe for Core routes and contains no City implementation imports.
 */
/**
 * W561 — EONBOT City companion identity, skin, caption and behavior contract.
 *
 * The companion is an original local procedural guide. It is not a provider,
 * person, autonomous agent, background worker, microphone listener, or a
 * subscription entitlement surface. Skins are visual-only source-controlled
 * presets until a separately verified preference/entitlement system exists.
 */
export const EON_CITY_EONBOT_COMPANION_SCHEMA = 'eon.city.eonbot-companion.w561.v1';
export const EON_CITY_EONBOT_COMPANION_DEFAULT_SKIN = 'command-orbit';

const freeze = (value) => Object.freeze(value);

const SKINS = Object.freeze([
  freeze({
    id: 'command-orbit',
    label: 'Command Orbit',
    description: 'Graphite shell, cyan guidance halo, and violet core for the Command District.',
    palette: freeze({ shell: '#1a2d50', core: '#36236d', ring: '#b68cff', lamp: '#8bf8ff', caption: '#7cf9ff' }),
    silhouette: 'orbital-drone',
    visualOnly: true,
    commercialEntitlementRequired: false,
    subscriptionBenefitClaimed: false
  }),
  freeze({
    id: 'signal-mist',
    label: 'Signal Mist',
    description: 'Teal relay shell with a soft-mint guide halo for calm orientation moments.',
    palette: freeze({ shell: '#143543', core: '#164e63', ring: '#5eead4', lamp: '#99f6e4', caption: '#5eead4' }),
    silhouette: 'orbital-drone',
    visualOnly: true,
    commercialEntitlementRequired: false,
    subscriptionBenefitClaimed: false
  }),
  freeze({
    id: 'forge-prism',
    label: 'Forge Prism',
    description: 'Deep-indigo shell with an amber-violet prism ring for Builder District staging.',
    palette: freeze({ shell: '#24234f', core: '#4c1d95', ring: '#fbbf24', lamp: '#ddd6fe', caption: '#c4b5fd' }),
    silhouette: 'orbital-drone',
    visualOnly: true,
    commercialEntitlementRequired: false,
    subscriptionBenefitClaimed: false
  })
]);

const CAPTIONS = Object.freeze({
  arrival: freeze({ title: 'EONBOT · CITY GUIDE', text: 'Choose a landmark when you are ready.', kind: 'orientation' }),
  focused: freeze({ title: 'EONBOT · CITY GUIDE', text: 'Review the four visible landmark actions.', kind: 'focus' }),
  receipt: freeze({ title: 'EONBOT · CITY GUIDE', text: 'A local work status exists. Review in Chat.', kind: 'status-only' }),
  reduced: freeze({ title: 'EONBOT · CITY GUIDE', text: 'Low-detail guidance stays visual and local.', kind: 'reduced-motion' })
});

function cleanSkinId(value = '') {
  const id = String(value || '').trim().toLowerCase();
  return SKINS.some((skin) => skin.id === id) ? id : EON_CITY_EONBOT_COMPANION_DEFAULT_SKIN;
}

function captionFor({ nearbyLandmarkId = '', receiptVisible = false, reducedMotion = false } = {}) {
  if (reducedMotion) return CAPTIONS.reduced;
  if (receiptVisible) return CAPTIONS.receipt;
  if (String(nearbyLandmarkId || '').trim()) return CAPTIONS.focused;
  return CAPTIONS.arrival;
}

export function getEonCityEonbotCompanionSkins() {
  return SKINS;
}

export function getEonCityEonbotCompanionSkin(skinId = '') {
  return SKINS.find((skin) => skin.id === cleanSkinId(skinId)) || SKINS[0];
}

/** Build the deterministic public/visual plan for the current City session. */
export function createEonCityEonbotCompanionPlan({ skinId = EON_CITY_EONBOT_COMPANION_DEFAULT_SKIN, nearbyLandmarkId = '', receiptVisible = false, reducedMotion = false, quality = 'balanced' } = {}) {
  const skin = getEonCityEonbotCompanionSkin(skinId);
  const caption = captionFor({ nearbyLandmarkId, receiptVisible, reducedMotion });
  const detail = reducedMotion || String(quality || '').toLowerCase() === 'lite' ? 'reduced' : 'full';
  return freeze({
    schema: EON_CITY_EONBOT_COMPANION_SCHEMA,
    identity: freeze({
      id: 'eonbot-city-companion',
      title: 'EONBOT',
      role: 'local-city-guide',
      body: 'original-procedural-orbital-drone',
      personClaimed: false,
      providerClaimed: false
    }),
    visual: freeze({
      skinId: skin.id,
      skinLabel: skin.label,
      silhouette: skin.silhouette,
      palette: skin.palette,
      detail,
      originalProcedural: true,
      binaryAssetRequired: false,
      visualOnly: true,
      commercialEntitlementRequired: false,
      subscriptionBenefitClaimed: false
    }),
    caption: freeze({
      title: caption.title,
      text: caption.text,
      kind: caption.kind,
      captionsFirst: true,
      voiceStarted: false,
      microphoneRequested: false
    }),
    behavior: freeze({
      mode: 'local-visual-guide',
      localFormationMotion: true,
      autonomousNavigation: false,
      autonomousTask: false,
      backgroundAgent: false,
      readsPrivateData: false,
      readsPrompt: false,
      readsProject: false,
      readsVault: false,
      providerRequestCreated: false,
      opensRoute: false,
      approvesWork: false,
      sendsMessage: false,
      startsAudio: false,
      startsMicrophone: false,
      reducedMotionRespected: Boolean(reducedMotion),
      statusOnly: Boolean(receiptVisible)
    }),
    localOnly: true,
    networkRequestCreated: false,
    browserStorageWritten: false,
    privateContentVisible: false,
    commercialStatus: 'visual-only-no-entitlement'
  });
}

export function getEonCityEonbotCompanionTruth() {
  return freeze({
    schema: EON_CITY_EONBOT_COMPANION_SCHEMA,
    originalProcedural: true,
    binaryAssetRequired: false,
    autonomousAgent: false,
    backgroundWorkStarted: false,
    providerRequestCreated: false,
    networkRequestCreated: false,
    browserStorageWritten: false,
    privateDataRead: false,
    promptVisible: false,
    projectVisible: false,
    vaultVisible: false,
    providerIdentityVisible: false,
    microphoneRequested: false,
    voiceStarted: false,
    routeOpened: false,
    subscriptionEntitlementClaimed: false,
    visualOnlySkins: true,
    liveVoiceProof: false
  });
}
