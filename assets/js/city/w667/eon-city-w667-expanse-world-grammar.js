/**
 * W667B / W670 — deterministic-infinite Expanse world grammar.
 *
 * The grammar produces stable regions, terrain, streets, public spaces, lots,
 * skylines, landmarks and activity from a world seed plus integer coordinates.
 * It never reads private user data, creates a network request, starts work or
 * owns a renderer.
 */
export const EON_CITY_W667_WORLD_GRAMMAR_SCHEMA = 'eon.city.expanse-world-grammar.w667b.v1';
export const EON_CITY_W667_REGION_SIZE_CELLS = 6;
export const EON_CITY_W667_PRACTICAL_WORLD_BOUND = 1_000_000;

const freeze = (value) => Object.freeze(value);

const PALETTES = freeze([
  freeze({ id: 'cyan-command', label: 'Cyan Command', accent: '#55eaff' }),
  freeze({ id: 'violet-forge', label: 'Violet Forge', accent: '#ad78ff' }),
  freeze({ id: 'amber-transit', label: 'Amber Transit', accent: '#ffc45c' }),
  freeze({ id: 'mint-archive', label: 'Mint Archive', accent: '#75f7cf' }),
  freeze({ id: 'gold-sovereign', label: 'Golden Sovereign', accent: '#ffda73' }),
  freeze({ id: 'coral-bazaar', label: 'Coral Bazaar', accent: '#ff846d' }),
  freeze({ id: 'indigo-temporal', label: 'Indigo Temporal', accent: '#7f8cff' }),
  freeze({ id: 'silver-lunar', label: 'Silver Lunar', accent: '#c9dcff' }),
  freeze({ id: 'emerald-bio', label: 'Emerald Bio', accent: '#57e9a8' })
]);

export const EON_CITY_W670_TERRAIN_PROFILES = freeze([
  freeze({ id: 'urban-flat', label: 'Urban Plate', elevation: 0, relief: 0.08, surface: 'signal-stone' }),
  freeze({ id: 'stepped-terraces', label: 'Stepped Terraces', elevation: 0.18, relief: 0.55, surface: 'layered-stone' }),
  freeze({ id: 'light-canals', label: 'Light Canals', elevation: 0.04, relief: 0.16, surface: 'reflective-water' }),
  freeze({ id: 'scanner-ridge', label: 'Scanner Ridge', elevation: 0.34, relief: 0.9, surface: 'machine-rock' }),
  freeze({ id: 'civic-wetland', label: 'Civic Wetland', elevation: 0.02, relief: 0.22, surface: 'living-water' }),
  freeze({ id: 'crystal-ravine', label: 'Crystal Ravine', elevation: 0.16, relief: 1.2, surface: 'prismatic-rock' }),
  freeze({ id: 'signal-dunes', label: 'Signal Dunes', elevation: 0.08, relief: 0.48, surface: 'luminous-sand' }),
  freeze({ id: 'suspended-decks', label: 'Suspended Decks', elevation: 0.62, relief: 0.22, surface: 'sky-platform' }),
  freeze({ id: 'lunar-crater', label: 'Lunar Crater', elevation: -0.12, relief: 0.82, surface: 'silver-dust' }),
  freeze({ id: 'bio-canopy', label: 'Bio Canopy', elevation: 0.12, relief: 0.44, surface: 'living-root' }),
  freeze({ id: 'resonance-field', label: 'Resonance Field', elevation: 0.06, relief: 0.3, surface: 'acoustic-glass' }),
  freeze({ id: 'noir-undercroft', label: 'Noir Undercroft', elevation: -0.08, relief: 0.38, surface: 'rain-dark-stone' })
]);

export const EON_CITY_W670_PUBLIC_SPACE_PROFILES = freeze([
  freeze({ id: 'none', label: 'No Central Court', scale: 0.8 }),
  freeze({ id: 'civic-forum', label: 'Civic Forum', scale: 1.35 }),
  freeze({ id: 'water-garden', label: 'Water Garden', scale: 1.25 }),
  freeze({ id: 'signal-grove', label: 'Signal Grove', scale: 1.15 }),
  freeze({ id: 'maker-amphitheatre', label: 'Maker Amphitheatre', scale: 1.4 }),
  freeze({ id: 'bazaar-court', label: 'Bazaar Court', scale: 1.3 }),
  freeze({ id: 'observatory-deck', label: 'Observatory Deck', scale: 1.15 }),
  freeze({ id: 'portal-dais', label: 'Portal Dais', scale: 1.05 }),
  freeze({ id: 'kinetic-yard', label: 'Kinetic Yard', scale: 1.25 }),
  freeze({ id: 'memory-cloister', label: 'Memory Cloister', scale: 1.1 }),
  freeze({ id: 'resonance-field', label: 'Resonance Field', scale: 1.35 }),
  freeze({ id: 'sculpture-field', label: 'Sculpture Field', scale: 1.2 }),
  freeze({ id: 'transit-interchange', label: 'Transit Interchange', scale: 1.45 }),
  freeze({ id: 'wetland-boardwalk', label: 'Wetland Boardwalk', scale: 1.3 })
]);

export const EON_CITY_W670_SKYLINE_PROFILES = freeze([
  freeze({ id: 'balanced-cluster', label: 'Balanced Cluster', heightBias: 0 }),
  freeze({ id: 'needle-crown', label: 'Needle Crown', heightBias: 1.1 }),
  freeze({ id: 'stepped-cascade', label: 'Stepped Cascade', heightBias: 0.55 }),
  freeze({ id: 'low-garden', label: 'Low Garden', heightBias: -0.65 }),
  freeze({ id: 'suspended-lattice', label: 'Suspended Lattice', heightBias: 0.35 }),
  freeze({ id: 'monolithic-gates', label: 'Monolithic Gates', heightBias: 0.8 }),
  freeze({ id: 'domed-horizon', label: 'Domed Horizon', heightBias: -0.1 }),
  freeze({ id: 'crystal-choir', label: 'Crystal Choir', heightBias: 0.7 }),
  freeze({ id: 'canyon-walls', label: 'Canyon Walls', heightBias: 0.45 }),
  freeze({ id: 'terrace-bands', label: 'Terrace Bands', heightBias: 0.2 }),
  freeze({ id: 'orbital-spires', label: 'Orbital Spires', heightBias: 1.25 }),
  freeze({ id: 'noir-silhouette', label: 'Noir Silhouette', heightBias: 0.6 })
]);

const MICRO_CLIMATES = freeze([
  freeze({ id: 'clear-neon', label: 'Clear Neon' }),
  freeze({ id: 'soft-rain', label: 'Soft Rain' }),
  freeze({ id: 'oceanic-haze', label: 'Oceanic Haze' }),
  freeze({ id: 'golden-dust', label: 'Golden Dust' }),
  freeze({ id: 'bio-mist', label: 'Bio Mist' }),
  freeze({ id: 'lunar-calm', label: 'Lunar Calm' }),
  freeze({ id: 'temporal-glimmer', label: 'Temporal Glimmer' }),
  freeze({ id: 'forge-embers', label: 'Forge Embers' }),
  freeze({ id: 'crystal-refraction', label: 'Crystal Refraction' }),
  freeze({ id: 'resonance-pulse', label: 'Resonance Pulse' })
]);

const terrain = (...ids) => freeze(ids);
const spaces = (...ids) => freeze(ids);
const skylines = (...ids) => freeze(ids);

export const EON_CITY_W667_REGION_ARCHETYPES = freeze([
  freeze({ id: 'command-quarter', label: 'Command Quarter', paletteId: 'cyan-command', atmosphere: 'clear civic neon, navigation beacons and open command plazas', buildingKit: freeze(['signal tower', 'command pavilion', 'project habitat', 'hologram forum', 'navigation mast']), terrainIds: terrain('urban-flat', 'stepped-terraces'), publicSpaceIds: spaces('civic-forum', 'portal-dais'), skylineIds: skylines('balanced-cluster', 'needle-crown'), activities: freeze(['public signal pulse', 'EONBOT scout pass', 'district resource orientation']) }),
  freeze({ id: 'forge-ward', label: 'Forge Ward', paletteId: 'violet-forge', atmosphere: 'industrial glow, assembly frames and maker courtyards', buildingKit: freeze(['workshop hall', 'forge stack', 'device observatory', 'assembly gantry', 'kinetic scaffold']), terrainIds: terrain('urban-flat', 'signal-dunes'), publicSpaceIds: spaces('maker-amphitheatre', 'kinetic-yard'), skylineIds: skylines('stepped-cascade', 'suspended-lattice'), activities: freeze(['maintenance drone sweep', 'bounded NPC work route', 'fabrication light cycle']) }),
  freeze({ id: 'archive-gardens', label: 'Archive Gardens', paletteId: 'mint-archive', atmosphere: 'quiet data gardens, memory glass and research promenades', buildingKit: freeze(['archive pavilion', 'memory cloister', 'research greenhouse', 'knowledge rotunda', 'data sanctum']), terrainIds: terrain('bio-canopy', 'civic-wetland'), publicSpaceIds: spaces('memory-cloister', 'signal-grove'), skylineIds: skylines('low-garden', 'domed-horizon'), activities: freeze(['archive lantern drift', 'researcher route', 'weather shelter cycle']) }),
  freeze({ id: 'transit-borough', label: 'Transit Borough', paletteId: 'amber-transit', atmosphere: 'warm wayfinding, capsule lanes and arrival towers', buildingKit: freeze(['transit canopy', 'arrival tower', 'mobility depot', 'junction concourse', 'skybridge gate']), terrainIds: terrain('urban-flat', 'suspended-decks'), publicSpaceIds: spaces('transit-interchange', 'civic-forum'), skylineIds: skylines('balanced-cluster', 'monolithic-gates'), activities: freeze(['transit capsule crossing', 'route beacon sweep', 'platform arrival cycle']) }),
  freeze({ id: 'creator-district', label: 'Creator District', paletteId: 'gold-sovereign', atmosphere: 'galleries, studios, performance courts and project habitats', buildingKit: freeze(['creator studio', 'gallery arcade', 'capture theatre', 'project habitat', 'performance rotunda']), terrainIds: terrain('urban-flat', 'stepped-terraces'), publicSpaceIds: spaces('sculpture-field', 'maker-amphitheatre'), skylineIds: skylines('terrace-bands', 'domed-horizon'), activities: freeze(['creator showcase pulse', 'bounded NPC work route', 'public signal pulse']) }),
  freeze({ id: 'bio-city', label: 'Living Bio-City', paletteId: 'emerald-bio', atmosphere: 'organic towers, luminous gardens and calm water plazas', buildingKit: freeze(['bio tower', 'garden habitat', 'water pavilion', 'canopy residence', 'root bridge']), terrainIds: terrain('bio-canopy', 'civic-wetland', 'light-canals'), publicSpaceIds: spaces('water-garden', 'signal-grove', 'wetland-boardwalk'), skylineIds: skylines('low-garden', 'domed-horizon'), activities: freeze(['garden pollinator drift', 'maintenance drone sweep', 'weather shelter cycle']) }),
  freeze({ id: 'sovereign-plazas', label: 'Sovereign Plazas', paletteId: 'gold-sovereign', atmosphere: 'ceremonial geometry, elevated courts and rare portal alignments', buildingKit: freeze(['sovereign spire', 'ceremonial hall', 'market rotunda', 'portal court', 'golden obelisk']), terrainIds: terrain('stepped-terraces', 'urban-flat'), publicSpaceIds: spaces('portal-dais', 'civic-forum'), skylineIds: skylines('needle-crown', 'monolithic-gates'), activities: freeze(['rare signal pulse', 'processional light sweep', 'EONBOT scout pass']) }),
  freeze({ id: 'oceanic-light', label: 'Oceanic Light', paletteId: 'cyan-command', atmosphere: 'reflective promenades, light canals and floating observation decks', buildingKit: freeze(['light pier', 'observation dome', 'canal studio', 'signal lighthouse', 'floating pavilion']), terrainIds: terrain('light-canals', 'suspended-decks'), publicSpaceIds: spaces('water-garden', 'observatory-deck'), skylineIds: skylines('domed-horizon', 'suspended-lattice'), activities: freeze(['light current cycle', 'transit skimmer pass', 'public signal pulse']) }),
  freeze({ id: 'nexus-noir', label: 'Nexus Noir', paletteId: 'violet-forge', atmosphere: 'deep shadow streets, rain-lit alleys and hidden intelligence rooms', buildingKit: freeze(['noir tower', 'signal vault', 'lantern alley house', 'hidden terminal hall', 'shadow arch']), terrainIds: terrain('noir-undercroft', 'urban-flat'), publicSpaceIds: spaces('memory-cloister', 'none'), skylineIds: skylines('noir-silhouette', 'canyon-walls'), activities: freeze(['rain beacon cycle', 'bounded NPC work route', 'rare signal pulse']) }),
  freeze({ id: 'observatory-ridge', label: 'Observatory Ridge', paletteId: 'amber-transit', atmosphere: 'elevated research decks, horizon scanners and quiet machine gardens', buildingKit: freeze(['device observatory', 'scanner tower', 'research terrace', 'machine garden', 'horizon mast']), terrainIds: terrain('scanner-ridge', 'suspended-decks'), publicSpaceIds: spaces('observatory-deck', 'signal-grove'), skylineIds: skylines('needle-crown', 'terrace-bands'), activities: freeze(['scanner sweep', 'maintenance drone sweep', 'EONBOT scout pass']) }),
  freeze({ id: 'chrono-terraces', label: 'Chrono Terraces', paletteId: 'indigo-temporal', atmosphere: 'layered time gardens, clockwork promenades and refracted horizon bands', buildingKit: freeze(['time ziggurat', 'chronology pavilion', 'phase tower', 'temporal arcade', 'cascade observatory']), terrainIds: terrain('stepped-terraces', 'resonance-field'), publicSpaceIds: spaces('resonance-field', 'observatory-deck'), skylineIds: skylines('stepped-cascade', 'crystal-choir'), activities: freeze(['temporal glimmer cycle', 'phase beacon sweep', 'quiet archivist route']) }),
  freeze({ id: 'lunar-foundry', label: 'Lunar Foundry', paletteId: 'silver-lunar', atmosphere: 'silver dust basins, cold foundries and orbital machine silhouettes', buildingKit: freeze(['lunar foundry', 'orbital gantry', 'crater habitat', 'silver scanner', 'vacuum forge']), terrainIds: terrain('lunar-crater', 'signal-dunes'), publicSpaceIds: spaces('kinetic-yard', 'observatory-deck'), skylineIds: skylines('orbital-spires', 'suspended-lattice'), activities: freeze(['orbital spark drift', 'maintenance crawler route', 'cold forge cycle']) }),
  freeze({ id: 'ember-bazaar', label: 'Ember Bazaar', paletteId: 'coral-bazaar', atmosphere: 'warm layered markets, glowing awnings and social maker streets', buildingKit: freeze(['bazaar arcade', 'ember market hall', 'merchant habitat', 'lantern bridge', 'festival pavilion']), terrainIds: terrain('signal-dunes', 'urban-flat'), publicSpaceIds: spaces('bazaar-court', 'maker-amphitheatre'), skylineIds: skylines('terrace-bands', 'balanced-cluster'), activities: freeze(['market signal drift', 'creator showcase pulse', 'transit skimmer pass']) }),
  freeze({ id: 'crystal-ravines', label: 'Crystal Ravines', paletteId: 'indigo-temporal', atmosphere: 'prismatic canyon walls, shard bridges and refracted machine sanctums', buildingKit: freeze(['crystal spire', 'prism habitat', 'ravine bridge', 'quartz sanctum', 'shard observatory']), terrainIds: terrain('crystal-ravine', 'scanner-ridge'), publicSpaceIds: spaces('resonance-field', 'portal-dais'), skylineIds: skylines('crystal-choir', 'canyon-walls'), activities: freeze(['crystal refraction cycle', 'rare signal pulse', 'scanner sweep']) }),
  freeze({ id: 'cloud-gardens', label: 'Cloud Gardens', paletteId: 'mint-archive', atmosphere: 'suspended parks, skywalks and soft luminous weather decks', buildingKit: freeze(['cloud greenhouse', 'suspended garden', 'skywalk habitat', 'mist pavilion', 'canopy bridge']), terrainIds: terrain('suspended-decks', 'bio-canopy'), publicSpaceIds: spaces('signal-grove', 'observatory-deck'), skylineIds: skylines('suspended-lattice', 'low-garden'), activities: freeze(['bio mist cycle', 'pollinator drift', 'EONBOT scout pass']) }),
  freeze({ id: 'data-cathedral', label: 'Data Cathedral', paletteId: 'silver-lunar', atmosphere: 'monumental knowledge halls, luminous arches and quiet civic intelligence', buildingKit: freeze(['data cathedral', 'knowledge nave', 'memory arch', 'signal cloister', 'archive obelisk']), terrainIds: terrain('urban-flat', 'stepped-terraces'), publicSpaceIds: spaces('memory-cloister', 'civic-forum'), skylineIds: skylines('monolithic-gates', 'needle-crown'), activities: freeze(['knowledge choir pulse', 'researcher route', 'processional light sweep']) }),
  freeze({ id: 'resonance-fields', label: 'Resonance Fields', paletteId: 'indigo-temporal', atmosphere: 'open acoustic glass fields, waveform towers and responsive sculpture gardens', buildingKit: freeze(['resonance tower', 'wave pavilion', 'acoustic habitat', 'signal sculpture', 'frequency gate']), terrainIds: terrain('resonance-field', 'urban-flat'), publicSpaceIds: spaces('resonance-field', 'sculpture-field'), skylineIds: skylines('crystal-choir', 'balanced-cluster'), activities: freeze(['resonance pulse', 'voice ripple cycle', 'public signal pulse']) }),
  freeze({ id: 'kinetic-yards', label: 'Kinetic Yards', paletteId: 'violet-forge', atmosphere: 'moving frames, test tracks and mechanical public workshops', buildingKit: freeze(['kinetic frame', 'motion gantry', 'test track hall', 'device scaffold', 'assembly bridge']), terrainIds: terrain('urban-flat', 'signal-dunes'), publicSpaceIds: spaces('kinetic-yard', 'maker-amphitheatre'), skylineIds: skylines('suspended-lattice', 'stepped-cascade'), activities: freeze(['kinetic sweep', 'maintenance drone route', 'fabrication light cycle']) }),
  freeze({ id: 'civic-wetlands', label: 'Civic Wetlands', paletteId: 'emerald-bio', atmosphere: 'public boardwalks, luminous reeds and low civic habitats across living water', buildingKit: freeze(['wetland pavilion', 'reed habitat', 'boardwalk archive', 'water gate', 'canopy residence']), terrainIds: terrain('civic-wetland', 'light-canals'), publicSpaceIds: spaces('wetland-boardwalk', 'water-garden'), skylineIds: skylines('low-garden', 'domed-horizon'), activities: freeze(['water light cycle', 'garden pollinator drift', 'weather shelter cycle']) }),
  freeze({ id: 'void-observatory', label: 'Void Observatory', paletteId: 'silver-lunar', atmosphere: 'dark horizon decks, sparse orbital structures and deep-space signal chambers', buildingKit: freeze(['void observatory', 'orbital spire', 'dark matter hall', 'signal needle', 'horizon gate']), terrainIds: terrain('lunar-crater', 'noir-undercroft'), publicSpaceIds: spaces('observatory-deck', 'portal-dais'), skylineIds: skylines('orbital-spires', 'noir-silhouette'), activities: freeze(['deep scanner sweep', 'rare signal pulse', 'lunar calm cycle']) })
]);

export const EON_CITY_W667_STREET_PROFILES = freeze([
  freeze({ id: 'cross-avenue', label: 'Cross Avenue', topology: 'cross', roadWidth: 1.25, plaza: 'none', elevation: 0, furniture: 'signal-posts', laneCount: 2, pedestrianPriority: false }),
  freeze({ id: 'ring-junction', label: 'Ring Junction', topology: 'ring', roadWidth: 1.18, plaza: 'roundabout', elevation: 0, furniture: 'orbit-lights', laneCount: 2, pedestrianPriority: false }),
  freeze({ id: 'split-boulevard', label: 'Split Boulevard', topology: 'parallel', roadWidth: 1.5, plaza: 'median', elevation: 0, furniture: 'wayfinding-towers', laneCount: 4, pedestrianPriority: false }),
  freeze({ id: 'market-spine', label: 'Market Spine', topology: 'linear-market', roadWidth: 1.05, plaza: 'market-court', elevation: 0, furniture: 'stall-beacons', laneCount: 1, pedestrianPriority: true }),
  freeze({ id: 'garden-loop', label: 'Garden Loop', topology: 'loop', roadWidth: 0.92, plaza: 'garden-court', elevation: 0, furniture: 'bio-lanterns', laneCount: 1, pedestrianPriority: true }),
  freeze({ id: 'skybridge-axis', label: 'Skybridge Axis', topology: 'elevated-bridge', roadWidth: 1.12, plaza: 'bridge-node', elevation: 0.32, furniture: 'bridge-beacons', laneCount: 2, pedestrianPriority: true }),
  freeze({ id: 'canal-promenade', label: 'Canal Promenade', topology: 'crescent-canal', roadWidth: 0.95, plaza: 'water-court', elevation: 0.04, furniture: 'light-rails', laneCount: 1, pedestrianPriority: true }),
  freeze({ id: 'lantern-alley', label: 'Lantern Alley', topology: 'offset-alley', roadWidth: 0.72, plaza: 'pocket-court', elevation: 0, furniture: 'lanterns', laneCount: 1, pedestrianPriority: true }),
  freeze({ id: 'stacked-lanes', label: 'Stacked Lanes', topology: 'elevated-parallel', roadWidth: 1, plaza: 'elevated-node', elevation: 0.48, furniture: 'vertical-signals', laneCount: 2, pedestrianPriority: false }),
  freeze({ id: 'grand-plaza', label: 'Grand Plaza', topology: 'radial', roadWidth: 1.32, plaza: 'grand-plaza', elevation: 0, furniture: 'ceremonial-beacons', laneCount: 2, pedestrianPriority: true }),
  freeze({ id: 'stepped-terrace', label: 'Stepped Terrace', topology: 'terraced-loop', roadWidth: 0.88, plaza: 'terrace-court', elevation: 0.18, furniture: 'step-lights', laneCount: 1, pedestrianPriority: true }),
  freeze({ id: 'transit-viaduct', label: 'Transit Viaduct', topology: 'elevated-bridge', roadWidth: 1.42, plaza: 'interchange', elevation: 0.58, furniture: 'transit-masts', laneCount: 3, pedestrianPriority: false }),
  freeze({ id: 'radial-spokes', label: 'Radial Spokes', topology: 'radial', roadWidth: 1.08, plaza: 'signal-hub', elevation: 0, furniture: 'radial-beacons', laneCount: 2, pedestrianPriority: true }),
  freeze({ id: 'crescent-quay', label: 'Crescent Quay', topology: 'crescent-quay', roadWidth: 0.9, plaza: 'water-court', elevation: 0.05, furniture: 'quay-lights', laneCount: 1, pedestrianPriority: true }),
  freeze({ id: 'canyon-switchback', label: 'Canyon Switchback', topology: 'diagonal-switchback', roadWidth: 0.84, plaza: 'ravine-overlook', elevation: 0.22, furniture: 'cliff-beacons', laneCount: 1, pedestrianPriority: true }),
  freeze({ id: 'arcology-court', label: 'Arcology Court', topology: 'courtyard-loop', roadWidth: 1.02, plaza: 'civic-forum', elevation: 0.06, furniture: 'arcology-signals', laneCount: 2, pedestrianPriority: true }),
  freeze({ id: 'wetland-boardwalk', label: 'Wetland Boardwalk', topology: 'boardwalk-loop', roadWidth: 0.76, plaza: 'wetland-court', elevation: 0.12, furniture: 'reed-lanterns', laneCount: 1, pedestrianPriority: true }),
  freeze({ id: 'kinetic-grid', label: 'Kinetic Grid', topology: 'diagonal-grid', roadWidth: 1.16, plaza: 'kinetic-yard', elevation: 0, furniture: 'motion-beacons', laneCount: 2, pedestrianPriority: false }),
  freeze({ id: 'cathedral-approach', label: 'Cathedral Approach', topology: 'processional-axis', roadWidth: 1.28, plaza: 'memory-cloister', elevation: 0.04, furniture: 'knowledge-lanterns', laneCount: 2, pedestrianPriority: true }),
  freeze({ id: 'suspended-promenade', label: 'Suspended Promenade', topology: 'suspended-crescent', roadWidth: 0.94, plaza: 'observatory-deck', elevation: 0.64, furniture: 'sky-rails', laneCount: 1, pedestrianPriority: true })
]);

const LANDMARK_TYPES = freeze([
  freeze({ id: 'nexus-spire', label: 'Nexus Spire', role: 'nexus-discovery', panel: 'nexus', purpose: 'Review the same live Nexus intelligence state.' }),
  freeze({ id: 'atlas-obelisk', label: 'Atlas Obelisk', role: 'atlas-discovery', panel: 'living-nexus', purpose: 'Review this location, discoveries and return routes.' }),
  freeze({ id: 'forge-reactor', label: 'Forge Reactor', role: 'productive-discovery', route: '/forge', purpose: 'Review a real Forge destination.' }),
  freeze({ id: 'archive-sanctum', label: 'Archive Sanctum', role: 'knowledge-discovery', route: '/library', purpose: 'Review the Library and saved knowledge.' }),
  freeze({ id: 'creator-gallery', label: 'Creator Gallery', role: 'creator-discovery', route: '/projects', purpose: 'Review projects connected to this discovery.' }),
  freeze({ id: 'transit-beacon', label: 'Transit Beacon', role: 'navigation-discovery', panel: 'travel-map', purpose: 'Review Core district travel.' }),
  freeze({ id: 'realm-rift', label: 'Rare Realm Rift', role: 'realm-discovery', panel: 'living-nexus', purpose: 'Review Realm signals and world discoveries.' }),
  freeze({ id: 'eonbot-dock', label: 'Remote EONBOT Dock', role: 'companion-discovery', panel: 'eonbot', purpose: 'Open the same EONBOT companion surface.' }),
  freeze({ id: 'chrono-gate', label: 'Chrono Gate', role: 'temporal-discovery', panel: 'living-nexus', purpose: 'Review a temporal region signal and its Atlas record.' }),
  freeze({ id: 'bio-well', label: 'Bio Well', role: 'living-system-discovery', panel: 'living-nexus', purpose: 'Review a living-system discovery without starting work.' }),
  freeze({ id: 'lunar-array', label: 'Lunar Array', role: 'device-discovery', route: '/local-ai', purpose: 'Review device readiness and local runtime guidance.' }),
  freeze({ id: 'resonance-arch', label: 'Resonance Arch', role: 'voice-discovery', panel: 'eonbot', purpose: 'Review voice and EONBOT state; capture remains explicit.' }),
  freeze({ id: 'market-beacon', label: 'Bazaar Signal', role: 'market-discovery', route: '/market', purpose: 'Review a stateless Market destination.' }),
  freeze({ id: 'crystal-observatory', label: 'Crystal Observatory', role: 'research-discovery', route: '/insights', purpose: 'Review a research destination connected to this landmark.' }),
  freeze({ id: 'vault-monolith', label: 'Vault Monolith', role: 'security-discovery', route: '/vault', purpose: 'Review Vault without exposing credentials or private content.' }),
  freeze({ id: 'return-anchor', label: 'Atlas Return Anchor', role: 'return-discovery', panel: 'living-nexus', purpose: 'Review and set an explicit local return route.' })
]);

const GAMEPLAY_PURPOSES = freeze([
  'productive mission discovery',
  'safe traversal checkpoint',
  'functional resident encounter',
  'district resource orientation',
  'Atlas landmark discovery',
  'return-route navigation',
  'rare Realm signal search',
  'project continuity checkpoint',
  'device and provider readiness review',
  'creator capture location',
  'environmental storytelling discovery',
  'public-space exploration',
  'vertical traversal rehearsal',
  'EONBOT companion rendezvous',
  'world-system observation',
  'curated route variation'
]);

const FOOTPRINTS = freeze(['rectangular', 'hexagonal', 'arc', 'split-wing', 'courtyard', 'bridge-span']);
const ROOFS = freeze(['signal-crown', 'garden-roof', 'open-frame', 'dome', 'terraced', 'solar-rib']);
const FACADES = freeze(['vertical-rhythm', 'horizontal-bands', 'prismatic', 'bio-lattice', 'noir-slits', 'open-arcade']);

function hash32(value = '') {
  let hash = 2166136261;
  for (const character of String(value || 'eon-expanse')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pick(list, key, offset = 0) {
  return list[(hash32(`${key}:${offset}`) + offset) % list.length];
}

function signedUnit(key, offset = 0) {
  return ((hash32(`${key}:${offset}`) % 2001) - 1000) / 1000;
}

function findProfile(list, id, fallback = list[0]) {
  return list.find((entry) => entry.id === id) || fallback;
}

function pickProfile(list, allowedIds, key, offset = 0) {
  const ids = Array.isArray(allowedIds) && allowedIds.length ? allowedIds : list.map((entry) => entry.id);
  return findProfile(list, pick(ids, key, offset), list[0]);
}

function regionCoordinate(value) {
  return Math.floor(Number(value || 0) / EON_CITY_W667_REGION_SIZE_CELLS);
}

function rarityFor(key) {
  const roll = hash32(`${key}:landmark-rarity`) % 1024;
  if (roll === 0) return 'legendary';
  if (roll < 7) return 'epic';
  if (roll < 35) return 'rare';
  if (roll < 130) return 'uncommon';
  return 'none';
}

function buildLots(cellKey, kit = []) {
  const anchors = [
    { id: 'nw', x: -3.05, z: -3.05 }, { id: 'ne', x: 3.05, z: -3.05 },
    { id: 'sw', x: -3.05, z: 3.05 }, { id: 'se', x: 3.05, z: 3.05 },
    { id: 'west', x: -3.28, z: 0 }, { id: 'east', x: 3.28, z: 0 },
    { id: 'north', x: 0, z: -3.28 }, { id: 'south', x: 0, z: 3.28 }
  ];
  const count = 3 + (hash32(`${cellKey}:lot-count`) % 3);
  const start = hash32(`${cellKey}:lot-start`) % anchors.length;
  const stride = 2 + (hash32(`${cellKey}:lot-stride`) % 3);
  const lots = [];
  for (let index = 0; index < count; index += 1) {
    const anchor = anchors[(start + index * stride) % anchors.length];
    const form = pick(kit, cellKey, index + 20);
    lots.push(freeze({
      id: `${anchor.id}-${index}`,
      x: Number((anchor.x + signedUnit(cellKey, index + 40) * 0.42).toFixed(3)),
      z: Number((anchor.z + signedUnit(cellKey, index + 50) * 0.42).toFixed(3)),
      form,
      heightClass: ['low', 'mid', 'tall'][hash32(`${cellKey}:height:${index}`) % 3],
      rotationQuarter: hash32(`${cellKey}:rotation:${index}`) % 4,
      footprint: pick(FOOTPRINTS, cellKey, index + 100),
      roofProfile: pick(ROOFS, cellKey, index + 120),
      facadeRhythm: pick(FACADES, cellKey, index + 140),
      setback: Number((0.04 + Math.abs(signedUnit(cellKey, index + 160)) * 0.42).toFixed(3)),
      courtyard: hash32(`${cellKey}:courtyard:${index}`) % 5 === 0
    }));
  }
  return freeze(lots);
}

function buildLandmark(cellKey, x, z) {
  const rarity = rarityFor(cellKey);
  if (rarity === 'none') return null;
  const type = pick(LANDMARK_TYPES, cellKey, 90);
  return freeze({
    id: `landmark-${x}-${z}-${type.id}`,
    typeId: type.id,
    label: type.label,
    role: type.role,
    rarity,
    panel: type.panel || '',
    route: type.route || '',
    purpose: type.purpose,
    interactionKind: 'expanse-landmark',
    interactionRadius: rarity === 'legendary' ? 4.8 : rarity === 'epic' ? 4.2 : 3.5,
    reviewFirst: true,
    explicitUserAction: true,
    autoExecute: false,
    autoNavigate: false,
    localOnly: true
  });
}

export function buildEonCityW667WorldCell({ x = 0, z = 0, seed = 'eoncity-living-nexus' } = {}) {
  const cellX = Number.isInteger(Number(x)) ? Number(x) : 0;
  const cellZ = Number.isInteger(Number(z)) ? Number(z) : 0;
  const regionX = regionCoordinate(cellX);
  const regionZ = regionCoordinate(cellZ);
  const regionKey = `${seed}:region:${regionX}:${regionZ}`;
  const cellKey = `${seed}:cell:${cellX}:${cellZ}`;
  const archetype = pick(EON_CITY_W667_REGION_ARCHETYPES, regionKey, 1);
  const palette = PALETTES.find((entry) => entry.id === archetype.paletteId) || PALETTES[0];
  const terrainProfile = pickProfile(EON_CITY_W670_TERRAIN_PROFILES, archetype.terrainIds, regionKey, 2);
  const skylineProfile = pickProfile(EON_CITY_W670_SKYLINE_PROFILES, archetype.skylineIds, regionKey, 3);
  const microClimate = pick(MICRO_CLIMATES, regionKey, 4);
  const streetProfile = pick(EON_CITY_W667_STREET_PROFILES, cellKey, 5);
  const publicSpaceProfile = pickProfile(EON_CITY_W670_PUBLIC_SPACE_PROFILES, archetype.publicSpaceIds, cellKey, 6);
  const lotPlan = buildLots(cellKey, archetype.buildingKit);
  const landmark = buildLandmark(cellKey, cellX, cellZ);
  const activity = pick(archetype.activities, cellKey, 7);
  const gameplayPurpose = pick(GAMEPLAY_PURPOSES, cellKey, 8);
  const districtVariant = hash32(`${cellKey}:variant`).toString(36).slice(0, 6);
  const variationSignature = [
    archetype.id,
    terrainProfile.id,
    skylineProfile.id,
    microClimate.id,
    streetProfile.id,
    publicSpaceProfile.id,
    lotPlan.map((lot) => `${lot.form}:${lot.heightClass}:${lot.rotationQuarter}:${lot.footprint}:${lot.roofProfile}:${lot.facadeRhythm}`).join(','),
    landmark?.typeId || 'none',
    activity,
    gameplayPurpose,
    districtVariant
  ].join('|');
  return freeze({
    schema: EON_CITY_W667_WORLD_GRAMMAR_SCHEMA,
    cellId: `cell-${cellX}-${cellZ}`,
    x: cellX,
    z: cellZ,
    region: freeze({ id: `region-${regionX}-${regionZ}`, x: regionX, z: regionZ, sizeCells: EON_CITY_W667_REGION_SIZE_CELLS, archetype }),
    visualIdentity: freeze({ id: palette.id, label: palette.label, atmosphere: archetype.atmosphere, accent: palette.accent }),
    terrainProfile,
    skylineProfile,
    microClimate,
    publicSpaceProfile,
    streetProfile,
    roadGrammar: freeze({
      pattern: streetProfile.id,
      topology: streetProfile.topology,
      north: true,
      east: true,
      south: true,
      west: true,
      connected: true,
      roadWidth: streetProfile.roadWidth,
      plaza: streetProfile.plaza,
      elevation: streetProfile.elevation,
      furniture: streetProfile.furniture,
      laneCount: streetProfile.laneCount,
      pedestrianPriority: streetProfile.pedestrianPriority
    }),
    lotPlan,
    buildingComposition: freeze([...new Set(lotPlan.map((lot) => lot.form))]),
    landmark,
    activityLayer: activity,
    gameplayPurpose,
    discovery: freeze({
      code: `EXP-${Math.abs(cellX).toString(36)}-${Math.abs(cellZ).toString(36)}-${districtVariant}`.toUpperCase(),
      label: `${archetype.label} · ${terrainProfile.label} · ${streetProfile.label}`,
      atlasEligible: true,
      privateByDefault: true
    }),
    variationSignature,
    deterministic: true,
    practicallyInfinite: true,
    visibleHardBorder: false,
    privateDataRead: false,
    networkRequestCreated: false,
    localOnly: true
  });
}

export function getEonCityW667WorldGrammarSummary() {
  const lotForms = new Set(EON_CITY_W667_REGION_ARCHETYPES.flatMap((entry) => entry.buildingKit));
  const approximateCombinationSpace = EON_CITY_W667_REGION_ARCHETYPES.length
    * EON_CITY_W667_STREET_PROFILES.length
    * EON_CITY_W670_TERRAIN_PROFILES.length
    * EON_CITY_W670_PUBLIC_SPACE_PROFILES.length
    * EON_CITY_W670_SKYLINE_PROFILES.length
    * Math.max(1, lotForms.size ** 3)
    * (LANDMARK_TYPES.length + 1)
    * GAMEPLAY_PURPOSES.length;
  return freeze({
    schema: EON_CITY_W667_WORLD_GRAMMAR_SCHEMA,
    regionArchetypeCount: EON_CITY_W667_REGION_ARCHETYPES.length,
    streetProfileCount: EON_CITY_W667_STREET_PROFILES.length,
    terrainProfileCount: EON_CITY_W670_TERRAIN_PROFILES.length,
    publicSpaceProfileCount: EON_CITY_W670_PUBLIC_SPACE_PROFILES.length,
    skylineProfileCount: EON_CITY_W670_SKYLINE_PROFILES.length,
    microClimateCount: MICRO_CLIMATES.length,
    buildingFormCount: lotForms.size,
    landmarkTypeCount: LANDMARK_TYPES.length,
    gameplayPurposeCount: GAMEPLAY_PURPOSES.length,
    approximateCombinationSpace,
    regionSizeCells: EON_CITY_W667_REGION_SIZE_CELLS,
    practicalWorldBound: EON_CITY_W667_PRACTICAL_WORLD_BOUND,
    sameSeedSameWorld: true,
    differentSeedDifferentWorld: true,
    visibleHardBorder: false,
    privateDataRead: false,
    networkRequestCreated: false
  });
}

export function validateEonCityW667WorldCell(cell = {}) {
  const errors = [];
  if (cell?.schema !== EON_CITY_W667_WORLD_GRAMMAR_SCHEMA) errors.push('schema');
  if (!/^cell--?\d+--?\d+$/.test(String(cell?.cellId || ''))) errors.push('cell-id');
  if (!cell?.region?.archetype?.id || !cell?.visualIdentity?.id) errors.push('identity');
  if (!cell?.terrainProfile?.id || !cell?.skylineProfile?.id || !cell?.publicSpaceProfile?.id || !cell?.microClimate?.id) errors.push('world-language');
  if (!cell?.roadGrammar?.connected || !cell?.roadGrammar?.north || !cell?.roadGrammar?.east || !cell?.roadGrammar?.south || !cell?.roadGrammar?.west || !cell?.roadGrammar?.topology) errors.push('roads');
  if (!Array.isArray(cell?.lotPlan) || cell.lotPlan.length < 3 || cell.lotPlan.some((lot) => !lot?.form || !lot?.footprint || !lot?.roofProfile || !lot?.facadeRhythm)) errors.push('lots');
  if (!cell?.variationSignature || !cell?.discovery?.code) errors.push('variation');
  if (cell?.privateDataRead || cell?.networkRequestCreated || cell?.visibleHardBorder) errors.push('boundary');
  if (cell?.landmark && (!cell.landmark.label || !cell.landmark.purpose || (!cell.landmark.panel && !String(cell.landmark.route || '').startsWith('/')) || cell.landmark.autoExecute || cell.landmark.autoNavigate)) errors.push('landmark');
  return freeze({ ok: errors.length === 0, errors: freeze(errors) });
}

export default freeze({
  EON_CITY_W667_WORLD_GRAMMAR_SCHEMA,
  EON_CITY_W667_REGION_SIZE_CELLS,
  EON_CITY_W667_PRACTICAL_WORLD_BOUND,
  EON_CITY_W667_REGION_ARCHETYPES,
  EON_CITY_W667_STREET_PROFILES,
  EON_CITY_W670_TERRAIN_PROFILES,
  EON_CITY_W670_PUBLIC_SPACE_PROFILES,
  EON_CITY_W670_SKYLINE_PROFILES,
  buildEonCityW667WorldCell,
  getEonCityW667WorldGrammarSummary,
  validateEonCityW667WorldCell
});
