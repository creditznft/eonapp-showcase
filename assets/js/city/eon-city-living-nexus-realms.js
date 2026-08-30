/**
 * W660V–W660X — curated premium Nexus Realms.
 *
 * Realms remain authored sub-destinations of the Living Nexus. They enter only
 * from an inspected Expanse portal and render inside the one existing Babylon
 * scene. The catalog contains public-safe geometry, specialist, movement,
 * mission and My Realm reflection contracts only.
 */
import { getEonCityProductiveRpgPlan } from './eon-city-productive-rpg-loop.js';
import { projectEonCityW691RealmDefinition } from './w691/eon-city-w691-realms-my-realm-integration.js';

export const EON_CITY_LIVING_NEXUS_REALMS_SCHEMA = 'eon.city.living-nexus-realms.w660v.v1';
export const EON_CITY_LIVING_NEXUS_PREMIUM_SCHEMA = 'eon.city.living-nexus-realms.w660x.premium.v1';
export const EON_CITY_LIVING_NEXUS_REALM_IDS = Object.freeze([
  'archive-noir', 'living-bio-city', 'golden-sovereign', 'forge-depths', 'orbital-white-city', 'nexus-ruins'
]);

const freeze = (value) => Object.freeze(value);
const SAFE_ID = /^[a-z0-9][a-z0-9:_-]{0,119}$/i;
const QUALITY = freeze({
  lite: freeze({ towerLimit: 6, accentLimit: 3, motionEnabled: false }),
  balanced: freeze({ towerLimit: 9, accentLimit: 5, motionEnabled: true }),
  cinematic: freeze({ towerLimit: 12, accentLimit: 7, motionEnabled: true })
});
const f = (value) => freeze(value);
const route = (...points) => f(points.map(([x, z]) => f({ x, z })));
const zones = (...rows) => f(rows.map(([id, label, x, z, purpose]) => f({ id, label, x, z, purpose })));
const landmarks = (...rows) => f(rows.map(([id, kind, x, y, z, scale = 1]) => f({ id, kind, x, y, z, scale })));
const towers = (...rows) => f(rows.map(([x, z, height, width]) => f({ x, z, height, width })));
const discoveries = (...rows) => f(rows.map(([id, label, x, y, z]) => f({ id, label, x, y, z })));
const specialist = (id, label, role, x, z, schedule, states) => f({ id, label, role, x, y: 0, z, schedule: f(schedule), animationStates: f(states), functional: true, reviewFirst: true });
const movement = (id, label, kind, periodMs, path, fallback) => f({ id, label, kind, periodMs, path: route(...path), reducedEffectsFallback: fallback, localVisualOnly: true });
const reflection = (id, label, artifactKind, placement) => f({ id, label, artifactKind, placement, requiresVerifiedTransformation: true, privateContentStored: false, maximumInstances: 1 });
const realm = (value) => f({
  ...value,
  palette: f(value.palette), atmosphere: f(value.atmosphere), entry: f(value.entry),
  safeRoute: value.safeRoute, zones: value.zones, landmarks: value.landmarks,
  towers: value.towers, discoveries: value.discoveries, specialist: value.specialist,
  movementSystem: value.movementSystem, realmReflection: value.realmReflection,
  narrativeBeats: f(value.narrativeBeats), authored: true, premiumAuthoredDepth: true,
  proceduralGeometry: false, runtimeAiGeometry: false
});

const AUTHORED_REALMS = f([
  realm({
    id: 'archive-noir', label: 'Archive Noir', chapter: 'The Silent Index',
    tagline: 'Recover a truthful path through a rain-dark memory city.',
    summary: 'A dense archive district of memory stacks, index bridges, a named recovery specialist and one review-first recovery terminal.',
    palette: { floor: '#05080f', structure: '#111827', accent: '#75f7cf', secondary: '#8aa5ff', signal: '#d7fff5' },
    atmosphere: { id: 'noir-rain', label: 'Noir Rain', rain: true, mist: true, reducedEffectsFallback: 'still-memory-haze' },
    missionId: 'vault-recovery', missionZoneId: 'silent-index', requiredOutcomeKinds: f(['backup-readiness-receipt', 'recovery-restore-receipt']), nativeRoute: '/capsule', nativeRouteLabel: 'Capsule and Recovery',
    transformationId: 'archive-noir-index-restored', transformationLabel: 'The Silent Index restored',
    entry: { x: 0, y: 0, z: -82, heading: 0, cameraAlpha: -Math.PI / 2, cameraBeta: 1.01, cameraRadius: 12.4 },
    safeRoute: route([0,-80],[0,-76],[-3.8,-72],[0,-67]),
    zones: zones(['arrival-ledger','Arrival Ledger',0,-80,'safe arrival and explicit return'],['memory-stacks','Memory Stacks',-5.2,-74.2,'authored exploration landmark'],['echo-bridge','Echo Bridge',5.1,-73.5,'optional discovery and capture view'],['silent-index','The Silent Index',0,-67,'review-first productive mission terminal']),
    landmarks: landmarks(['index-monolith','monolith',0,2.8,-67,1.35],['memory-arch-west','arch',-4.2,1.65,-73.5,1],['memory-arch-east','arch',4.2,1.65,-73.5,1],['echo-dais','dais',5.1,0.2,-73.5,1]),
    towers: towers([-7.2,-77.8,5.6,1.8],[-7.1,-71.5,7.4,1.55],[-5.2,-66.2,4.8,1.9],[7.2,-77.8,5.1,1.8],[7.1,-71.5,7.9,1.55],[5.2,-66.2,5.4,1.9],[-2.7,-64.5,6.4,1.35],[2.7,-64.5,6.8,1.35]),
    discoveries: discoveries(['archive-echo-01','First Archive Echo',-5.2,1.2,-74.2],['archive-echo-02','Bridge Memory Glass',5.1,1.15,-73.5],['archive-echo-03','Silent Index Seal',0,1.35,-67]),
    specialist: specialist('index-keeper-nyra','Index Keeper Nyra','Archive and recovery specialist',-2.1,-68.4,['inspect index','walk memory stacks','return to terminal'],['idle-scan','guide','console']),
    movementSystem: movement('memory-current','Memory Current','memory-stream',14000,[[0,-79],[-5,-74],[0,-68],[5,-74],[0,-79]],'static-index-light'),
    realmReflection: reflection('archive-index-fragment','Restored Index Fragment','memory-monolith','my-realm-archive-bay'),
    narrativeBeats: ['The ledger recognises no identity—only a safe arrival.','Nyra explains the proof boundary before any route opens.','A verified recovery receipt restores the Index without exposing backup contents.']
  }),
  realm({
    id: 'living-bio-city', label: 'Living Bio-City', chapter: 'The Breathing Grid',
    tagline: 'A luminous civic garden grown around useful systems.',
    summary: 'A premium bio-city of breathing canopies, signal gardens, a living transit vine and a Device Lab specialist who awakens the grid only after verified local-AI work.',
    palette: { floor: '#071512', structure: '#103126', accent: '#8fffb8', secondary: '#4ad7c8', signal: '#dcffe8' },
    atmosphere: { id: 'bio-pulse', label: 'Bio Pulse', rain: false, mist: true, reducedEffectsFallback: 'still-garden-glow' },
    missionId: 'local-ai-byok', missionZoneId: 'breathing-grid', requiredOutcomeKinds: f(['local-ai-self-test','byok-provider-verification']), nativeRoute: '/local-ai', nativeRouteLabel: 'Local AI',
    transformationId: 'living-bio-city-grid-awakened', transformationLabel: 'The Breathing Grid awakened',
    entry: { x: 0, y: 0, z: -82, heading: 0, cameraAlpha: -Math.PI/2, cameraBeta: 1.01, cameraRadius: 12.2 },
    safeRoute: route([0,-80],[-2,-76],[-4.8,-72],[2.8,-69],[0,-64.5]),
    zones: zones(['seed-gate','Seed Gate',0,-80,'safe arrival and extraction'],['signal-garden','Signal Garden',-4.8,-72.5,'bio-luminous discovery grove'],['canopy-crossing','Canopy Crossing',3.6,-70.5,'moving vine transit overlook'],['breathing-grid','Breathing Grid',0,-64.5,'review-first device mission terminal']),
    landmarks: landmarks(['bio-core','orb',0,2.3,-64.5,1.55],['garden-arch','arch',-4.8,1.5,-72.5,1.25],['canopy-dais','dais',3.6,0.2,-70.5,1.15],['spore-crown','crown',0,3.1,-75.8,0.82]),
    towers: towers([-7,-77,4.6,2.2],[7,-77,5,2.2],[-6.4,-70.8,5.8,1.8],[6.4,-70.8,6.1,1.8],[-5.2,-64.5,6.8,1.55],[5.2,-64.5,7.2,1.55],[-2.5,-61.5,5.2,1.65],[2.5,-61.5,5.7,1.65],[0,-59.5,7.4,1.5]),
    discoveries: discoveries(['bio-seed-01','Pulse Seed',-4.8,1.1,-72.5],['bio-seed-02','Canopy Memory',3.6,1.2,-70.5],['bio-seed-03','Grid Bloom',0,1.3,-64.5],['bio-seed-04','Root Signal',-5.2,1.1,-64.5]),
    specialist: specialist('bio-systems-gardener-lyra','Systems Gardener Lyra','Device Lab and living-systems specialist',-2,-66.2,['tend signal garden','inspect grid','guide device mission'],['idle-tend','scan','console']),
    movementSystem: movement('living-vine-transit','Living Vine Transit','sway-orbit',12000,[[0,-79],[-5,-73],[4,-70],[0,-65],[-5,-73]],'static-canopy-vein'),
    realmReflection: reflection('bio-grid-seed','Breathing Grid Seed','living-orb','my-realm-bio-garden'),
    narrativeBeats: ['The Seed Gate opens into a city that reacts visually, not biologically.','Lyra offers a bounded Local AI or BYOK verification path.','A matching receipt activates the grid and one private My Realm seed.']
  }),
  realm({
    id: 'golden-sovereign', label: 'Golden Sovereign Realm', chapter: 'The Elevated Accord',
    tagline: 'A ceremonial metropolis where priorities become visible.',
    summary: 'A premium elevated city of processional bridges, priority constellations and a Command specialist who turns reviewed orientation into a visible civic accord.',
    palette: { floor: '#171207', structure: '#3b2c12', accent: '#ffda73', secondary: '#ff9f45', signal: '#fff4c2' },
    atmosphere: { id: 'sovereign-dawn', label: 'Sovereign Dawn', rain: false, mist: false, reducedEffectsFallback: 'still-gold-horizon' },
    missionId: 'orientation', missionZoneId: 'priority-dais', requiredOutcomeKinds: f(['orientation-receipt']), nativeRoute: '/eoncity', nativeRouteLabel: 'Command orientation',
    transformationId: 'golden-sovereign-accord-lit', transformationLabel: 'The Elevated Accord illuminated',
    entry: { x: 0, y: 0, z: -82, heading: 0, cameraAlpha: -Math.PI/2, cameraBeta: 1.01, cameraRadius: 12.6 },
    safeRoute: route([0,-80],[0,-76],[-4,-72],[4,-69],[0,-64]),
    zones: zones(['accord-gate','Accord Gate',0,-80,'safe arrival and extraction'],['sovereign-plaza','Sovereign Plaza',-4,-72,'ceremonial authored landmark'],['constellation-walk','Constellation Walk',4,-69,'priority discovery promenade'],['priority-dais','Priority Dais',0,-64,'review-first command mission']),
    landmarks: landmarks(['sovereign-crown','crown',0,3.1,-64,1.45],['accord-arch','arch',0,1.8,-76,1.4],['plaza-dais','dais',-4,0.2,-72,1.2],['constellation-orb','orb',4,2.2,-69,0.9]),
    towers: towers([-7.2,-77,7,1.7],[7.2,-77,7,1.7],[-6.3,-70.5,8.4,1.5],[6.3,-70.5,8.4,1.5],[-5.1,-64,9,1.4],[5.1,-64,9,1.4],[-2.5,-60.5,6.4,1.8],[2.5,-60.5,6.4,1.8],[0,-58.5,8,1.55]),
    discoveries: discoveries(['accord-seal-01','First Accord Seal',-4,1.2,-72],['accord-seal-02','Constellation Lens',4,1.2,-69],['accord-seal-03','Priority Beacon',0,1.25,-64],['accord-seal-04','Dawn Inscription',0,1.4,-76]),
    specialist: specialist('accord-architect-sol','Accord Architect Sol','Command planning and orientation specialist',-2,-65.5,['review plaza','align constellation','guide priority dais'],['idle-observe','salute','guide']),
    movementSystem: movement('sovereign-procession','Sovereign Procession','procession-orbit',16000,[[0,-79],[-4,-72],[4,-69],[0,-64],[0,-79]],'static-procession-lights'),
    realmReflection: reflection('accord-crown-shard','Accord Crown Shard','ceremonial-crown','my-realm-command-gallery'),
    narrativeBeats: ['The Realm frames priorities as a ceremonial path, not a scoreboard.','Sol reviews controls and intent before the City writes orientation proof.','The verified Accord lights one bounded civic monument in My Realm.']
  }),
  realm({
    id: 'forge-depths', label: 'Forge Depths', chapter: 'The Working Furnace',
    tagline: 'A deep industrial city that responds only to verified building work.',
    summary: 'A premium industrial undercity of production rails, cooling bridges, furnace towers and a Forge specialist whose machinery remains dark until real project work is verified.',
    palette: { floor: '#110812', structure: '#2d1735', accent: '#ad78ff', secondary: '#ff754a', signal: '#f2dcff' },
    atmosphere: { id: 'forge-embers', label: 'Forge Embers', rain: false, mist: true, reducedEffectsFallback: 'still-furnace-glow' },
    missionId: 'project', missionZoneId: 'working-furnace', requiredOutcomeKinds: f(['project-shell','project-resume']), nativeRoute: '/projects', nativeRouteLabel: 'Projects',
    transformationId: 'forge-depths-furnace-online', transformationLabel: 'The Working Furnace came online',
    entry: { x: 0, y: 0, z: -82, heading: 0, cameraAlpha: -Math.PI/2, cameraBeta: 1.03, cameraRadius: 12.5 },
    safeRoute: route([0,-80],[-3.5,-76],[-5,-72],[3,-69],[0,-63.5]),
    zones: zones(['depths-lift','Depths Lift',0,-80,'safe arrival and extraction'],['assembly-rail','Assembly Rail',-5,-72,'moving production landmark'],['cooling-bridge','Cooling Bridge',3,-69,'optional capture and discovery route'],['working-furnace','Working Furnace',0,-63.5,'review-first project mission']),
    landmarks: landmarks(['furnace-core','furnace',0,2.6,-63.5,1.55],['rail-arch','arch',-5,1.5,-72,1.15],['cooling-ring','ring',3,2.3,-69,1],['depths-dais','dais',0,0.2,-76.5,1]),
    towers: towers([-7,-77,6.2,2],[7,-77,6.2,2],[-6.5,-70,7.8,1.7],[6.5,-70,7.8,1.7],[-5,-63.5,8.5,1.5],[5,-63.5,8.5,1.5],[-2.5,-60,6.5,1.4],[2.5,-60,6.5,1.4],[0,-57.8,7.5,1.8]),
    discoveries: discoveries(['forge-mark-01','Railmaker Mark',-5,1.15,-72],['forge-mark-02','Cooling Bridge Sigil',3,1.2,-69],['forge-mark-03','Furnace Seal',0,1.3,-63.5],['forge-mark-04','Lift Foundry Plate',0,1.1,-79]),
    specialist: specialist('forge-specialist-kael','Forge Specialist Kael','Project build and continuation specialist',-2,-65,['inspect rail','calibrate furnace','guide project review'],['idle-weld','console','guide']),
    movementSystem: movement('assembly-carrier','Assembly Carrier','rail-conveyor',10000,[[0,-78],[-5,-72],[3,-69],[0,-64],[-5,-72]],'static-rail-beacons'),
    realmReflection: reflection('forge-reactor-coil','Verified Reactor Coil','industrial-reactor','my-realm-forge-bay'),
    narrativeBeats: ['The lift opens onto machinery that is visibly waiting, not pretending.','Kael binds the furnace to existing Projects review.','A project-shell or resume receipt powers the furnace and one Realm coil.']
  }),
  realm({
    id: 'orbital-white-city', label: 'Orbital White City', chapter: 'The Quiet Orbit',
    tagline: 'A precise white city suspended around a creator signal.',
    summary: 'A premium orbital city of parallax bridges, quiet signal rings, capture vistas and a Creator specialist who activates the constellation only after a reviewed creator artifact.',
    palette: { floor: '#071018', structure: '#d9f8ff', accent: '#8fdcff', secondary: '#bfa8ff', signal: '#ffffff' },
    atmosphere: { id: 'orbital-hush', label: 'Orbital Hush', rain: false, mist: true, reducedEffectsFallback: 'still-orbit-light' },
    missionId: 'creator', missionZoneId: 'creator-signal', requiredOutcomeKinds: f(['creator-guide-artifact']), nativeRoute: '/create', nativeRouteLabel: 'Creator',
    transformationId: 'orbital-white-city-signal-online', transformationLabel: 'The Quiet Orbit signal came online',
    entry: { x: 0, y: 0, z: -82, heading: 0, cameraAlpha: -Math.PI/2, cameraBeta: 1, cameraRadius: 12.8 },
    safeRoute: route([0,-80],[4.5,-75],[-3.8,-71],[4,-68],[0,-63]),
    zones: zones(['orbit-dock','Orbit Dock',0,-80,'safe arrival and extraction'],['white-bridge','White Bridge',4.5,-75,'premium capture landmark'],['parallax-garden','Parallax Garden',-3.8,-71,'orbital discovery court'],['creator-signal','Creator Signal',0,-63,'review-first creator mission']),
    landmarks: landmarks(['orbital-core','orb',0,2.9,-63,1.5],['white-arch','arch',4.5,1.7,-75,1.2],['parallax-ring','ring',-3.8,2.4,-71,1.05],['signal-dais','dais',4,0.2,-68,1.1]),
    towers: towers([-7,-77,7.8,1.35],[7,-77,7.8,1.35],[-6.2,-70,9.2,1.25],[6.2,-70,9.2,1.25],[-5,-63,8.5,1.3],[5,-63,8.5,1.3],[-2.5,-59.5,6.7,1.5],[2.5,-59.5,6.7,1.5],[0,-57.5,8,1.4]),
    discoveries: discoveries(['orbit-note-01','White Bridge Note',4.5,1.1,-75],['orbit-note-02','Parallax Memory',-3.8,1.2,-71],['orbit-note-03','Creator Signal Prism',0,1.25,-63],['orbit-note-04','Quiet Dock Frequency',0,1.15,-79]),
    specialist: specialist('orbital-curator-aya','Orbital Curator Aya','Creator review and capture specialist',-2,-64.5,['observe bridge','inspect parallax garden','guide creator signal'],['idle-frame','capture-guide','console']),
    movementSystem: movement('orbital-signal-caravan','Orbital Signal Caravan','orbital-caravan',13000,[[0,-79],[4.5,-75],[-3.8,-71],[4,-68],[0,-63],[0,-79]],'static-orbit-markers'),
    realmReflection: reflection('orbital-signal-prism','Quiet Orbit Signal Prism','creator-prism','my-realm-creator-gallery'),
    narrativeBeats: ['The white city offers capture vistas without uploading or sharing anything.','Aya prepares a creator guide, never a fake generation claim.','The verified artifact brings one signal prism online in My Realm.']
  }),
  realm({
    id: 'nexus-ruins', label: 'Nexus Ruins', chapter: 'The Broken Relay',
    tagline: 'An ancient-future relay city waiting for a reviewed workflow plan.',
    summary: 'A premium ruin-city of broken rings, echo courtyards, relay fragments and an Automation specialist who aligns the network only from a real reviewed proposal.',
    palette: { floor: '#140b08', structure: '#39231d', accent: '#ff9f76', secondary: '#75f7cf', signal: '#ffe1d2' },
    atmosphere: { id: 'ruin-dust', label: 'Ruin Dust', rain: false, mist: true, reducedEffectsFallback: 'still-ruin-haze' },
    missionId: 'automation', missionZoneId: 'relay-heart', requiredOutcomeKinds: f(['automation-proposal']), nativeRoute: '/automations', nativeRouteLabel: 'Automations',
    transformationId: 'nexus-ruins-relay-aligned', transformationLabel: 'The Broken Relay aligned',
    entry: { x: 0, y: 0, z: -82, heading: 0, cameraAlpha: -Math.PI/2, cameraBeta: 1.04, cameraRadius: 12.7 },
    safeRoute: route([0,-80],[-4.8,-75],[4,-71],[-3,-68],[0,-62.5]),
    zones: zones(['ruin-gate','Ruin Gate',0,-80,'safe arrival and extraction'],['broken-ring','Broken Ring',-4.8,-75,'authored discovery landmark'],['echo-court','Echo Court',4,-71,'narrative and capture court'],['relay-heart','Relay Heart',0,-62.5,'review-first automation mission']),
    landmarks: landmarks(['relay-fragment','ring',0,2.6,-62.5,1.6],['broken-arch','arch',-4.8,1.6,-75,1.2],['echo-dais','dais',4,0.2,-71,1.15],['ruin-monolith','monolith',-3,2.4,-68,1]),
    towers: towers([-7,-77,5.2,1.8],[7,-77,5.9,1.8],[-6.5,-69,7,1.5],[6.5,-69,6.2,1.5],[-5,-62.5,7.5,1.4],[5,-62.5,6.8,1.4],[-2.5,-59,4.8,1.4],[2.5,-59,6.6,1.4],[0,-56.8,7.2,1.7]),
    discoveries: discoveries(['ruin-fragment-01','Broken Ring Fragment',-4.8,1.1,-75],['ruin-fragment-02','Echo Court Cipher',4,1.2,-71],['ruin-fragment-03','Relay Heart Glyph',0,1.25,-62.5],['ruin-fragment-04','Ancient Route Socket',-3,1.15,-68]),
    specialist: specialist('relay-custodian-orin','Relay Custodian Orin','Automation proposal and workflow specialist',-2,-64,['inspect broken ring','decode echo court','guide relay proposal'],['idle-listen','decode','console']),
    movementSystem: movement('relay-echo-trace','Relay Echo Trace','ruin-echo',15000,[[0,-79],[-4.8,-75],[4,-71],[-3,-68],[0,-62.5],[-4.8,-75]],'static-relay-trace'),
    realmReflection: reflection('relay-heart-fragment','Aligned Relay Heart Fragment','ancient-relay','my-realm-nexus-sanctum'),
    narrativeBeats: ['The broken network exposes no user workflow or identity.','Orin prepares a local proposal for review, not an executing automation.','A verified proposal aligns the Relay and one bounded My Realm fragment.']
  })
]);

const REALM_BY_ID = new Map(AUTHORED_REALMS.map((entry) => [entry.id, entry]));

function normalizeQuality(value = 'balanced') {
  return QUALITY[String(value)] ? String(value) : 'balanced';
}

function cloneRealm(realm) {
  return freeze({
    ...realm,
    palette: freeze({ ...realm.palette }),
    atmosphere: freeze({ ...realm.atmosphere }),
    entry: freeze({ ...realm.entry }),
    safeRoute: freeze(realm.safeRoute.map((entry) => freeze({ ...entry }))),
    zones: freeze(realm.zones.map((entry) => freeze({ ...entry }))),
    landmarks: freeze(realm.landmarks.map((entry) => freeze({ ...entry }))),
    towers: freeze(realm.towers.map((entry) => freeze({ ...entry }))),
    discoveries: freeze(realm.discoveries.map((entry) => freeze({ ...entry }))),
    specialist: freeze({ ...realm.specialist, schedule: freeze([...(realm.specialist?.schedule || [])]), animationStates: freeze([...(realm.specialist?.animationStates || [])]) }),
    movementSystem: freeze({ ...realm.movementSystem, path: freeze((realm.movementSystem?.path || []).map((entry) => freeze({ ...entry }))) }),
    realmReflection: freeze({ ...realm.realmReflection }),
    narrativeBeats: freeze([...(realm.narrativeBeats || [])])
  });
}

function missionForRealm(realm, storage = globalThis.localStorage) {
  const mission = getEonCityProductiveRpgPlan({ storage }).missions.find((entry) => entry.id === realm.missionId) || null;
  return mission ? freeze({
    id: mission.id,
    title: mission.title,
    requiredAction: mission.requiredAction,
    privacyBoundary: mission.privacyBoundary,
    route: mission.route || realm.nativeRoute,
    alternateRoute: mission.alternateRoute || '',
    outcome: mission.outcome?.verified === true ? freeze({
      receiptId: String(mission.outcome.receiptId || ''),
      kind: String(mission.outcome.kind || ''),
      verifiedAt: Number(mission.outcome.verifiedAt || 0),
      verified: true
    }) : null
  }) : freeze({ id: realm.missionId, title: realm.nativeRouteLabel, requiredAction: '', privacyBoundary: '', route: realm.nativeRoute, alternateRoute: '', outcome: null });
}

export function getEonCityLivingNexusRealmCatalog() {
  return freeze(AUTHORED_REALMS.map((entry) => projectEonCityW691RealmDefinition(cloneRealm(entry))));
}

export function getEonCityLivingNexusRealmDefinition(realmId = '') {
  const realm = REALM_BY_ID.get(String(realmId || ''));
  return realm ? projectEonCityW691RealmDefinition(cloneRealm(realm)) : null;
}

export function buildEonCityLivingNexusRealmPlan(realmId = 'archive-noir', {
  quality = 'balanced',
  reducedEffects = false,
  storage = globalThis.localStorage,
  portalId = ''
} = {}) {
  const sourceRealm = REALM_BY_ID.get(String(realmId || '')) || REALM_BY_ID.get('archive-noir');
  const realm = projectEonCityW691RealmDefinition(sourceRealm);
  const resolvedQuality = normalizeQuality(quality);
  const profile = QUALITY[resolvedQuality];
  const mission = missionForRealm(realm, storage);
  const matchingOutcome = mission.outcome && realm.requiredOutcomeKinds.includes(mission.outcome.kind) ? mission.outcome : null;
  const verifiedTransformation = Boolean(matchingOutcome);
  return freeze({
    schema: EON_CITY_LIVING_NEXUS_REALMS_SCHEMA,
    id: realm.id,
    label: realm.label,
    chapter: realm.chapter,
    tagline: realm.tagline,
    summary: realm.summary,
    productIdentityId: realm.productIdentityId || realm.id,
    productivityRole: realm.productivityRole || '',
    reflectionZoneId: realm.reflectionZoneId || realm.realmReflection?.placement || '',
    stableTechnicalIdPreserved: realm.stableTechnicalIdPreserved === true,
    palette: freeze({ ...realm.palette }),
    atmosphere: freeze({ ...realm.atmosphere, motionEnabled: !reducedEffects && profile.motionEnabled, realWeatherRead: false, localVisualOnly: true }),
    entry: freeze({ ...realm.entry, realmId: realm.id }),
    safeRoute: freeze(realm.safeRoute.map((entry, index) => freeze({ ...entry, index, automaticNavigation: false }))),
    zones: freeze(realm.zones.map((entry) => freeze({ ...entry }))),
    landmarks: freeze(realm.landmarks.map((entry) => freeze({ ...entry }))),
    towers: freeze(realm.towers.slice(0, profile.towerLimit).map((entry) => freeze({ ...entry }))),
    discoveries: freeze(realm.discoveries.slice(0, profile.accentLimit).map((entry) => freeze({ ...entry, privateContentStored: false, sharePermission: 'private' }))),
    specialist: freeze({ ...realm.specialist, schedule: freeze([...(realm.specialist?.schedule || [])]), animationStates: freeze([...(realm.specialist?.animationStates || [])]), motionEnabled: !reducedEffects && profile.motionEnabled, privateContentStored: false }),
    movementSystem: freeze({ ...realm.movementSystem, path: freeze((realm.movementSystem?.path || []).map((entry) => freeze({ ...entry, automaticNavigation: false }))), motionEnabled: !reducedEffects && profile.motionEnabled }),
    realmReflection: freeze({ ...realm.realmReflection, active: verifiedTransformation, receiptId: matchingOutcome?.receiptId || '' }),
    narrativeBeats: freeze([...(realm.narrativeBeats || [])]),
    premiumSchema: EON_CITY_LIVING_NEXUS_PREMIUM_SCHEMA,
    premiumAuthoredDepth: realm.premiumAuthoredDepth === true,
    missionZoneId: realm.missionZoneId,
    mission,
    portalId: SAFE_ID.test(String(portalId || '')) ? String(portalId) : '',
    transformation: freeze({ id: realm.transformationId, label: realm.transformationLabel, active: verifiedTransformation, receiptId: matchingOutcome?.receiptId || '', outcomeKind: matchingOutcome?.kind || '', privateContentStored: false }),
    quality: resolvedQuality,
    reducedEffects: Boolean(reducedEffects),
    authored: true,
    proceduralGeometry: false,
    deterministic: true,
    reviewFirst: true,
    requiresSeparateEntryConfirmation: true,
    requiresSeparateNativeRouteConfirmation: true,
    immediateSafeReturn: true,
    oneCanonicalScene: true,
    secondCanvasCreated: false,
    secondRenderLoopCreated: false,
    automaticNavigation: false,
    automaticExecution: false,
    privateDataRead: false,
    privateContentStored: false,
    networkRequestCreated: false,
    rewardIssued: false,
    paymentClaimed: false,
    localOnly: true
  });
}

export function resolveNearestEonCityLivingNexusRealmFeature(position = {}, plan = null, { maxDistance = 3.2 } = {}) {
  if (!plan) return null;
  const x = Number(position?.x || 0);
  const z = Number(position?.z || 0);
  const features = [
    ...plan.zones.map((entry) => ({ ...entry, kind: entry.id === plan.missionZoneId ? 'mission-terminal' : 'zone' })),
    ...plan.discoveries.map((entry) => ({ ...entry, kind: 'discovery' })),
    ...(plan.specialist ? [{ ...plan.specialist, kind: 'functional-specialist' }] : [])
  ];
  let nearest = null;
  for (const feature of features) {
    const distance = Math.hypot(x - Number(feature.x || 0), z - Number(feature.z || 0));
    if (!nearest || distance < nearest.distance) nearest = { ...feature, distance: Math.round(distance * 10) / 10 };
  }
  return nearest && nearest.distance <= Math.max(0.5, Number(maxDistance || 3.2)) ? freeze(nearest) : null;
}

export function validateEonCityLivingNexusRealmPlan(plan = {}) {
  const errors = [];
  if (plan?.schema !== EON_CITY_LIVING_NEXUS_REALMS_SCHEMA) errors.push('schema-invalid');
  if (!EON_CITY_LIVING_NEXUS_REALM_IDS.includes(plan?.id)) errors.push('realm-id-invalid');
  if (!Array.isArray(plan?.safeRoute) || plan.safeRoute.length < 3) errors.push('safe-route-missing');
  if (!Array.isArray(plan?.zones) || plan.zones.length < 4) errors.push('authored-zones-missing');
  if (!plan?.missionZoneId || !plan.zones?.some((entry) => entry.id === plan.missionZoneId)) errors.push('mission-zone-invalid');
  if (!Array.isArray(plan?.towers) || plan.towers.length < 6) errors.push('authored-skyline-missing');
  if (!Array.isArray(plan?.discoveries) || plan.discoveries.length < 3) errors.push('authored-discoveries-missing');
  if (!plan?.specialist?.id || plan.specialist.functional !== true || !Array.isArray(plan.specialist.schedule) || plan.specialist.schedule.length < 3) errors.push('functional-specialist-invalid');
  if (!plan?.movementSystem?.id || !Array.isArray(plan.movementSystem.path) || plan.movementSystem.path.length < 4) errors.push('movement-system-invalid');
  if (!plan?.realmReflection?.id || plan.realmReflection.requiresVerifiedTransformation !== true || plan.realmReflection.privateContentStored !== false) errors.push('realm-reflection-invalid');
  if (!Array.isArray(plan?.narrativeBeats) || plan.narrativeBeats.length < 3 || plan?.premiumAuthoredDepth !== true) errors.push('premium-depth-invalid');
  if (!plan?.mission?.id || !String(plan?.mission?.route || '').startsWith('/')) errors.push('mission-binding-invalid');
  if (plan?.proceduralGeometry || plan?.authored !== true || plan?.deterministic !== true) errors.push('authored-contract-invalid');
  if (plan?.reviewFirst !== true || plan?.requiresSeparateEntryConfirmation !== true || plan?.requiresSeparateNativeRouteConfirmation !== true || plan?.immediateSafeReturn !== true) errors.push('review-return-contract-invalid');
  if (plan?.secondCanvasCreated || plan?.secondRenderLoopCreated || plan?.automaticNavigation || plan?.automaticExecution || plan?.privateDataRead || plan?.privateContentStored || plan?.networkRequestCreated || plan?.rewardIssued || plan?.paymentClaimed) errors.push('truth-boundary-invalid');
  const serialised = JSON.stringify(plan);
  if (/api[_-]?key\s*[:=]|bearer\s+[a-z0-9._-]{12,}|payment complete|reward earned|autonomous agent active/i.test(serialised)) errors.push('private-or-fake-claim-detected');
  return freeze({ ok: errors.length === 0, errors: freeze(errors), realmId: plan?.id || null, towerCount: plan?.towers?.length || 0, discoveryCount: plan?.discoveries?.length || 0 });
}
