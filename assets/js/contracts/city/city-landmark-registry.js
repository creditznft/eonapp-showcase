/**
 * A15 I03 — Core-owned City contract extracted from assets/js/city/city-landmark-registry.js.
 * Rendering/runtime implementation remains under assets/js/city; this module
 * is safe for Core routes and contains no City implementation imports.
 */
/**
 * W255 — canonical City landmark registry.
 *
 * City Overview, Spatial Command Space and Immersive Work Mode may present landmarks differently, but
 * they must use this one allowlisted identity/action map. The registry contains
 * only local presentation metadata and finite internal destinations. It never
 * carries credentials, chat text, user project content, wallet authority,
 * payment state, rewards, referrals, or remote URLs.
 */
export const CITY_LANDMARK_REGISTRY_SCHEMA = 'eon.city.landmark-registry.v1';

const freezeAction = (action) => action ? Object.freeze({ ...action }) : null;
const freezeLandmark = (landmark) => Object.freeze({
  ...landmark,
  map: Object.freeze({ ...landmark.map }),
  play: landmark.play ? Object.freeze({ ...landmark.play }) : null,
  action: freezeAction(landmark.action)
});

/**
 * `districtId` is intentionally stable because it is already persisted in the
 * local CityWorldState. New labels can evolve without destroying historic local
 * visit counts or First Circuit progress.
 */
export const CITY_LANDMARKS = Object.freeze([
  freezeLandmark({
    id: 'command-centre', districtId: 'command',
    name: 'Command Centre', shortName: 'Chat', icon: '✦', color: '#5eead4',
    map: { landmark: 'command-spire', x: 0.11, y: 0.1, width: 0.27, height: 0.22 },
    play: { x: 0, z: -7.2, radius: 4.6 },
    description: 'Start or continue a useful EONBOT conversation.',
    objective: 'Reach the Command Centre and meet EONBOT, your real work guide.',
    action: {
      id: 'eonbot-chat', destinationLabel: 'EONBOT Chat', route: '/',
      purpose: 'Start or continue a conversation with EONBOT. No message or credential is prefilled.'
    }
  }),
  freezeLandmark({
    id: 'workshop', districtId: 'workspace',
    name: 'Build Workshop', shortName: 'Projects', icon: '⌘', color: '#a5b4fc',
    map: { landmark: 'twin-workshop', x: 0.61, y: 0.1, width: 0.27, height: 0.22 },
    play: { x: -8.4, z: -4.1, radius: 3.6 },
    description: 'Choose a project and make a real local work artifact.',
    objective: 'Follow the lit route to the Build Workshop and discover the project loop.',
    action: {
      id: 'projects', destinationLabel: 'Projects', route: '/projects',
      purpose: 'Open the project list and choose work yourself. No project body is transferred.'
    }
  }),
  freezeLandmark({
    id: 'preview-gallery', districtId: 'market',
    name: 'Preview Gallery', shortName: 'Preview', icon: '◇', color: '#fbbf24',
    map: { landmark: 'gallery-arcade', x: 0.72, y: 0.43, width: 0.2, height: 0.17 },
    play: null,
    description: 'A local preview landmark. It does not open a catalog, commerce, reward, or marketplace flow.',
    objective: 'Explore at your own pace. Preview Gallery remains non-transactional.',
    action: null
  }),
  freezeLandmark({
    id: 'relay', districtId: 'realm',
    name: 'Realm Relay', shortName: 'Realm', icon: '◎', color: '#c4b5fd',
    map: { landmark: 'realm-gate', x: 0.4, y: 0.63, width: 0.23, height: 0.18 },
    play: { x: -7.2, z: 6.4, radius: 3.25 },
    description: 'Open the local Realm Studio without public publishing or sharing.',
    objective: 'Walk to Realm Relay and discover your private local City identity.',
    action: {
      id: 'realm-studio', destinationLabel: 'Realm Studio', route: '/realm-studio',
      purpose: 'Open the local Realm Studio. No public publishing or share action is triggered.'
    }
  }),
  freezeLandmark({
    id: 'archive', districtId: 'library',
    name: 'Knowledge Archive', shortName: 'Workspace', icon: '▤', color: '#93c5fd',
    map: { landmark: 'archive-stacks', x: 0.08, y: 0.43, width: 0.2, height: 0.17 },
    play: { x: 8.2, z: -3.2, radius: 3.8 },
    description: 'Open Workspace and choose a useful local brief or return to saved work.',
    objective: 'Use the Knowledge Archive when you want to turn a City idea into a work brief.',
    action: {
      id: 'workspace', destinationLabel: 'Workspace', route: '/workspace',
      purpose: 'Open the Workspace home. No file, provider state, or task runs automatically.'
    }
  }),
  freezeLandmark({
    id: 'observatory', districtId: 'trade',
    name: 'Local AI Observatory', shortName: 'Local AI', icon: '◌', color: '#fb7185',
    map: { landmark: 'research-observatory', x: 0.72, y: 0.72, width: 0.2, height: 0.14 },
    play: { x: 7.3, z: 6.7, radius: 3.35 },
    description: 'Open the local model setup and self-test surface by choice.',
    objective: 'Visit Local AI Observatory only when you want to test a local runtime yourself.',
    action: {
      id: 'local-ai', destinationLabel: 'Local AI', route: '/local-ai',
      purpose: 'Open the local model setup and self-test surface. No device probe starts until you choose it there.'
    }
  }),
  freezeLandmark({
    id: 'vault-safehouse', districtId: 'vault',
    name: 'Vault Safehouse', shortName: 'Vault', icon: '◈', color: '#34d399',
    map: { landmark: 'vault-bastion', x: 0.08, y: 0.72, width: 0.2, height: 0.14 },
    play: null,
    description: 'A quiet boundary marker. Credentials and provider verification remain deliberately outside City routes.',
    objective: 'Vault remains a separate, explicit security surface.',
    action: null
  }),
  // W265/W286: first approved expansion. This is a local orientation place,
  // intentionally not a route launcher, wallet surface, reward loop, or shop.
  freezeLandmark({
    id: 'orientation-hall', districtId: 'orientation',
    name: 'Orientation Hall', shortName: 'Start', icon: '◍', color: '#67e8f9',
    map: { landmark: 'orientation-atrium', x: 0.4, y: 0.28, width: 0.2, height: 0.14 },
    play: null,
    description: 'A calm local starting place for City controls and route choices. It does not open anything, collect anything, or create progress of value.',
    objective: 'Use the map, choose a district that helps your work, and review any route yourself.',
    action: null
  })
]);

export const CITY_STATE_DISTRICT_IDS = Object.freeze(CITY_LANDMARKS.map((landmark) => landmark.districtId));
export const CITY_ACTIONABLE_LANDMARK_IDS = Object.freeze(CITY_LANDMARKS.filter((landmark) => landmark.action).map((landmark) => landmark.id));

export function getCityLandmark(landmarkId) {
  return CITY_LANDMARKS.find((landmark) => landmark.id === String(landmarkId || '')) || null;
}

export function getCityLandmarkByDistrictId(districtId) {
  return CITY_LANDMARKS.find((landmark) => landmark.districtId === String(districtId || '')) || null;
}

export function getCityLandmarkAction(landmarkId) {
  const landmark = getCityLandmark(landmarkId);
  return landmark?.action ? { ...landmark.action, landmarkId: landmark.id, landmarkLabel: landmark.name } : null;
}

export function getCityLandmarkActionByDistrictId(districtId) {
  return getCityLandmarkAction(getCityLandmarkByDistrictId(districtId)?.id);
}

export function isCityLandmarkActionable(landmarkId) {
  return Boolean(getCityLandmarkAction(landmarkId));
}

export function toCityDistrict(landmark) {
  if (!landmark) return null;
  return Object.freeze({
    id: landmark.districtId,
    landmarkId: landmark.id,
    name: landmark.name,
    shortName: landmark.shortName,
    icon: landmark.icon,
    color: landmark.color,
    landmark: landmark.map.landmark,
    x: landmark.map.x,
    y: landmark.map.y,
    width: landmark.map.width,
    height: landmark.map.height,
    route: landmark.action?.route || null,
    actionId: landmark.action?.id || null,
    actionable: Boolean(landmark.action),
    description: landmark.description,
    objective: landmark.objective
  });
}
