/**
 * W419/W422 — EON City original vector art pack.
 *
 * The first 18 assets form the W419 foundation. W422 extends that foundation
 * to a 58-piece local environmental art system: materials, backdrops, decals
 * and billboard props. It remains an original, same-origin vector fallback;
 * reviewed GLB/KTX2 final art still belongs to the separate W417 release lane.
 */
export const EON_CITY_VECTOR_ART_SCHEMA = 'eon.city.vector-art.w422.v1';
export const EON_CITY_VECTOR_ART_ROOT = '/assets/city/art/';
export const EON_CITY_VECTOR_ART_FOUNDATION_IDS = Object.freeze(["wet-street", "brushed-graphite", "glass-grid", "carbon-weave", "neon-circuit", "skyline-depth", "eon-monogram", "arrival-emblem", "command-emblem", "creator-emblem", "forge-emblem", "signal-emblem", "automation-emblem", "archive-emblem", "eonbot-halo", "wayfinding-cyan", "wayfinding-violet", "wayfinding-mint"]);
export const EON_CITY_VECTOR_ART_DEEP_EXTENSION_IDS = Object.freeze(["prismatic-glass", "amber-rail", "bio-lattice", "obsidian-ceramic", "vapor-caustics", "signal-mesh", "archive-warmth", "moon-grid", "aurora-ribbon", "aerial-traffic", "rain-veil", "signal-array", "forge-plumes", "garden-canopy", "relay-emblem", "observatory-emblem", "expedition-ember", "expedition-tide", "expedition-aurora", "expedition-echo", "protocol-grid", "safety-grid", "transit-rune", "portal-ring", "kinetic-lane", "biolume-leaf", "archive-rune", "signal-chevron", "forge-stripe", "creator-prism", "command-circuit", "arrival-star", "neon-lantern", "holo-kiosk", "drone-silhouette", "garden-pod", "signal-kite", "street-barrier", "archive-orb", "tram-silhouette"]);

const freeze = (value) => Object.freeze(value);
const art = (entry) => freeze({
  status: 'shipped-original-vector',
  origin: 'EONAPP original in-house work',
  licence: 'EONAPP controlled original work',
  sameOrigin: true,
  remoteNetwork: false,
  userData: false,
  finalBinaryArt: false,
  ...entry,
  qualities: freeze([...(entry.qualities || ['lite', 'balanced', 'cinematic'])])
});

/** SHA-256 values are generated from the exact source SVG bytes in this package. */
export const EON_CITY_VECTOR_ART_CATALOG = freeze([
  art({ id: "wet-street", file: "texture-wet-street.svg", role: "repeating wet-street surface treatment", category: "material", alpha: false, width: 1024, height: 1024, qualities: ["lite", "balanced", "cinematic"], sha256: "87c3245c50a232ae69b6d17518fb8157ed7cab09db64b67ea75529dc1db67603" }),
  art({ id: "brushed-graphite", file: "texture-brushed-graphite.svg", role: "brushed graphite facade and steel treatment", category: "material", alpha: false, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "1f30dcc68caacf2c3e0ce7a203727f7d7cd7b837827f5e56bc41da93df9a7088" }),
  art({ id: "glass-grid", file: "texture-glass-grid.svg", role: "night glass and window-grid treatment", category: "material", alpha: false, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "e9d25a47f96ff68b5ddd6cd6e51dc6bba8dd91699300089d3550b3e0f0a1d21b" }),
  art({ id: "carbon-weave", file: "texture-carbon-weave.svg", role: "command-deck panel and street-furniture treatment", category: "material", alpha: false, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "34643f3693ad674767de744764817fcb5877d969942c39e8e641035af4259f72" }),
  art({ id: "neon-circuit", file: "texture-neon-circuit.svg", role: "local emissive console and route treatment", category: "material", alpha: false, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "112c8f7c11bd59ae66b4a8e12ec35e476271644eb02395cc9a6d732e156b89c9" }),
  art({ id: "skyline-depth", file: "horizon-neon-skyline.svg", role: "wide local skyline depth backdrop", category: "backdrop", alpha: false, width: 2048, height: 768, qualities: ["balanced", "cinematic"], sha256: "d0601f112f0f13032140fd99a72bce4fc03362a3d2fb65949a951a5689c56b9d" }),
  art({ id: "eon-monogram", file: "decal-eon-monogram.svg", role: "EON City identity decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["lite", "balanced", "cinematic"], sha256: "0b10348632792a43e5b6084103932ad65b35e9af267d89e6ecc55b0a4f3aeb8c" }),
  art({ id: "arrival-emblem", file: "decal-arrival-emblem.svg", role: "Arrival Gate decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["lite", "balanced", "cinematic"], sha256: "aaf2223cada95d40f7e67a250bf459b7b4a1cc19808c9c897df4ecd6aa85a6b6" }),
  art({ id: "command-emblem", file: "decal-command-emblem.svg", role: "Command District decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["lite", "balanced", "cinematic"], sha256: "0cd05a7fa6e55322f655b53f50211f647ede6b4dcbb846a1309a1ea70b3d0f18" }),
  art({ id: "creator-emblem", file: "decal-creator-emblem.svg", role: "Creator Atrium decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["lite", "balanced", "cinematic"], sha256: "bf84f21b5a8587d01e69fa85436335f0deed89039451521b4b7fdfcf196a6862" }),
  art({ id: "forge-emblem", file: "decal-forge-emblem.svg", role: "Forge Bay decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["lite", "balanced", "cinematic"], sha256: "cfdd3830cee3ad1d7acdf43d67b3fcfe99e86229200f993de4cadcbd62cdb515" }),
  art({ id: "signal-emblem", file: "decal-signal-emblem.svg", role: "Signal Tower decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "1ca3fc88fcfe7cd6f6b883e50349dea9a043d63b90576061d0d05e02f5ca89a1" }),
  art({ id: "automation-emblem", file: "decal-automation-emblem.svg", role: "Automation Observatory decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "3c6be4fa9826a6e578feb6a08fc79fccb5cf22a59c68276b08abee084c6d8af8" }),
  art({ id: "archive-emblem", file: "decal-archive-emblem.svg", role: "Archive Gardens decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "8f6bbb4a4b27d7e88018a084cc8062722ebe7e3d59d3cb18d008de01934ff427" }),
  art({ id: "eonbot-halo", file: "decal-eonbot-halo.svg", role: "EONBOT companion halo decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "9749e23006c6088ad811646658d249682adffb1a254981eb3334c2dd472b46ae" }),
  art({ id: "wayfinding-cyan", file: "decal-wayfinding-cyan.svg", role: "cyan route arrow decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["lite", "balanced", "cinematic"], sha256: "07159454dbc95fc36becb4f4983e08d0fc7da4d40a7d6a40ceb9b243a233a16f" }),
  art({ id: "wayfinding-violet", file: "decal-wayfinding-violet.svg", role: "violet route arrow decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "16a3776a8b8b8127f33898356473000209843189be362f5dba2283b3fa23488d" }),
  art({ id: "wayfinding-mint", file: "decal-wayfinding-mint.svg", role: "mint route arrow decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "a60ec9cd6094b2eecd923571c3e3b66d3cc70795d5c4233602ff6fb7b6566d3a" }),
  art({ id: "prismatic-glass", file: "texture-prismatic-glass.svg", role: "prismatic Creator Atrium glass treatment", category: "material", alpha: false, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "5e208586429dcbab0322615e277dd1b1aa1159938477e83c547590a2c642d3c7" }),
  art({ id: "amber-rail", file: "texture-amber-rail.svg", role: "industrial Forge Bay amber rail treatment", category: "material", alpha: false, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "e4bb70980d6eccf7ea57e910404744e69625cd1ec42a292450ac60649808ec35" }),
  art({ id: "bio-lattice", file: "texture-bio-lattice.svg", role: "bioluminescent Archive Gardens lattice treatment", category: "material", alpha: false, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "63807dc500baf71d1783bac5b7f245aff2b1681d00aed9e06ae7d6e08f4a36c3" }),
  art({ id: "obsidian-ceramic", file: "texture-obsidian-ceramic.svg", role: "quiet command and archive ceramic panel treatment", category: "material", alpha: false, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "00e0c5c602ac35abe710e6faa49957b8db240458f2a9855e7c1eacdc0eee6f9c" }),
  art({ id: "vapor-caustics", file: "texture-vapor-caustics.svg", role: "wet reflected-light surface treatment", category: "material", alpha: false, width: 1024, height: 1024, qualities: ["cinematic"], sha256: "c3343d56dda8a5139df348cecd95ae4d18149467fc79b809b9954406a695348f" }),
  art({ id: "signal-mesh", file: "texture-signal-mesh.svg", role: "violet Signal Tower field-mesh treatment", category: "material", alpha: false, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "3535fc40583572a6cb58baea2b663711a91729b038cf171607faa0184c0997e1" }),
  art({ id: "archive-warmth", file: "texture-archive-warmth.svg", role: "amber Archive Gardens archival-inlay treatment", category: "material", alpha: false, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "5e9c9ced28111e46035145d7d20577b043607bf5ff11031deaadbb78f6cce88c" }),
  art({ id: "moon-grid", file: "horizon-moon-grid.svg", role: "layered celestial moon-grid backdrop", category: "backdrop", alpha: true, width: 2048, height: 768, qualities: ["balanced", "cinematic"], sha256: "16d68149bf90d0f28a9f754c7cf7ffb319a64f2207080f8d35cd549906336dd2" }),
  art({ id: "aurora-ribbon", file: "horizon-aurora-ribbon.svg", role: "cyan-violet atmospheric ribbon backdrop", category: "backdrop", alpha: true, width: 2048, height: 768, qualities: ["cinematic"], sha256: "70a630e6565028f7dda544837acce2cbb1ca9237c443e36b9e937ebeb89e3807" }),
  art({ id: "aerial-traffic", file: "horizon-aerial-traffic.svg", role: "distant local aerial traffic silhouette layer", category: "backdrop", alpha: true, width: 2048, height: 768, qualities: ["cinematic"], sha256: "501455c6c9b99b6e2a5b43c4ad738bea8b330828712fe6ebb1c18362ca226cfa" }),
  art({ id: "rain-veil", file: "horizon-rain-veil.svg", role: "subtle local rain veil layer", category: "backdrop", alpha: true, width: 2048, height: 768, qualities: ["balanced", "cinematic"], sha256: "a819f127863d0a5d3c00dd304a932b745f1c737860daa0d83f005724cf5f63b8" }),
  art({ id: "signal-array", file: "horizon-signal-array.svg", role: "Signal Tower antenna-array silhouette backdrop", category: "backdrop", alpha: true, width: 2048, height: 768, qualities: ["balanced", "cinematic"], sha256: "d7f0e5fd415aac0871b6470608884bab77a2fe6c9cdab0b30b863d873ad8ac7a" }),
  art({ id: "forge-plumes", file: "horizon-forge-plumes.svg", role: "Forge Bay heat-plume silhouette backdrop", category: "backdrop", alpha: true, width: 2048, height: 768, qualities: ["cinematic"], sha256: "dfbca8a27688d29c3e4e589c4a477ee89c229caf79b56e9464038cb6c6112ec6" }),
  art({ id: "garden-canopy", file: "horizon-garden-canopy.svg", role: "Archive Gardens biolume canopy backdrop", category: "backdrop", alpha: true, width: 2048, height: 768, qualities: ["balanced", "cinematic"], sha256: "5b880bf3ce1ad884f8de88d3f386f6c67329fd4c0553cbf3dd4c91c8e20e101b" }),
  art({ id: "relay-emblem", file: "decal-relay-emblem.svg", role: "Relay courtyard communication decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "2cdcd91590a96aa7aff58feb756f15aa4cac9056f7b749db0150eddd4021589e" }),
  art({ id: "observatory-emblem", file: "decal-observatory-emblem.svg", role: "Automation Observatory orbital decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "b94cc3a9f2dc9159d4a0731994f650c515aac4d6294e6788cd143bcf1a9735e6" }),
  art({ id: "expedition-ember", file: "decal-expedition-ember.svg", role: "Ember Signal Expedition threshold decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["cinematic"], sha256: "2f8a47fbba63ea537b87dfe76cf3edaf665ae963b76cd9252ced188dabb7509f" }),
  art({ id: "expedition-tide", file: "decal-expedition-tide.svg", role: "Tide Signal Expedition threshold decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["cinematic"], sha256: "9fb69919c31761aa3ae767516c982e7670f489795721e5468933c2277b7937f8" }),
  art({ id: "expedition-aurora", file: "decal-expedition-aurora.svg", role: "Aurora Signal Expedition threshold decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["cinematic"], sha256: "ec3aacdbdac7386c1486c0e6305248dfe89d027b55fac2c85a903b6941d0b4e7" }),
  art({ id: "expedition-echo", file: "decal-expedition-echo.svg", role: "Echo Signal Expedition threshold decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["cinematic"], sha256: "d1502c9dc72b2131fe15c4cd2e7e33fe778709468bb39ace1305e4c4a532bb7e" }),
  art({ id: "protocol-grid", file: "decal-protocol-grid.svg", role: "Command protocol-grid floor decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "fc1bfd39492b409379643d143990fa368532ab5af7e7c6bb4096561153af19af" }),
  art({ id: "safety-grid", file: "decal-safety-grid.svg", role: "visible movement-safe-zone floor decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["lite", "balanced", "cinematic"], sha256: "edaefe737eb0cd2b205201e002175a5567d7d28c7fed1c6ac6734f19568ef4af" }),
  art({ id: "transit-rune", file: "decal-transit-rune.svg", role: "City transit junction rune", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "668998e07578298cafa36b251a9cc959134ee88d6ea4c1a5715a4be6801785f1" }),
  art({ id: "portal-ring", file: "decal-portal-ring.svg", role: "Signal Expedition portal-ring decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "3071f463247e2aa9572532cfa12f43d41867b1b692f7c66be9df2f1b3566a01a" }),
  art({ id: "kinetic-lane", file: "decal-kinetic-lane.svg", role: "moving-route lane surface decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "a866636bba03954dcf37c098d44e828c65a1c7bed3b1a78b1838730e958078de" }),
  art({ id: "biolume-leaf", file: "decal-biolume-leaf.svg", role: "Archive Gardens biolume leaf decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "219fd6cee21a5064e30aec9cf789a56df1fcf6bad6ddfa5bb23eade03e2be481" }),
  art({ id: "archive-rune", file: "decal-archive-rune.svg", role: "Archive memory-rune decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "d0bd3a79cf10e89ef66c7452f7340ec5fd77d6df2e13172b823aa6947a22be5e" }),
  art({ id: "signal-chevron", file: "decal-signal-chevron.svg", role: "Signal Tower chevron route decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "772cd5422565c3b519d5ef6c4f2fe0db67be47732e7803ccc9ce8985372030b8" }),
  art({ id: "forge-stripe", file: "decal-forge-stripe.svg", role: "Forge Bay industrial stripe decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "96c0ff913f0f0584fd43e0d02647bfbf61e87f9202e9cc1d272c0a149a8b971f" }),
  art({ id: "creator-prism", file: "decal-creator-prism.svg", role: "Creator Atrium prism floor decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "acea51462a8e1fadbe7e1a62957ca6742c4372f411c3c2e66c8ec1e954c741ba" }),
  art({ id: "command-circuit", file: "decal-command-circuit.svg", role: "Command Circuit identity decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "7363be0598e57494577ed2a776aea63a02421bf6d96ab2ae3b1ab16229002231" }),
  art({ id: "arrival-star", file: "decal-arrival-star.svg", role: "Arrival Gate orientation star decal", category: "decal", alpha: true, width: 1024, height: 1024, qualities: ["lite", "balanced", "cinematic"], sha256: "ee54a62dc54edada276a9d4b3793ba4474fca56fd3c5675e8392278e3d6ae895" }),
  art({ id: "neon-lantern", file: "prop-neon-lantern.svg", role: "local neon lantern billboard prop", category: "prop", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "20b47e1501d490ee2fdf429a5b84a3fefee59f174a68b3c305f6d7c88068d6d3" }),
  art({ id: "holo-kiosk", file: "prop-holo-kiosk.svg", role: "local holographic kiosk billboard prop", category: "prop", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "3df4a750cc43391a267a5f702d6278fc1222f7a87a1a9b8374112ff93c664be0" }),
  art({ id: "drone-silhouette", file: "prop-drone-silhouette.svg", role: "distant autonomous drone silhouette prop", category: "prop", alpha: true, width: 1024, height: 1024, qualities: ["cinematic"], sha256: "cd2e1a83369cedea63041e11815abf20245ef29a2b37b1044c7a7e6ef9a864db" }),
  art({ id: "garden-pod", file: "prop-garden-pod.svg", role: "Archive Gardens biolume pod billboard prop", category: "prop", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "2cf7cc04035d7d12d6d80404a0d87fa709c145ef3bb4e54add441f58e0283fb4" }),
  art({ id: "signal-kite", file: "prop-signal-kite.svg", role: "Signal Tower kinetic marker billboard prop", category: "prop", alpha: true, width: 1024, height: 1024, qualities: ["cinematic"], sha256: "215cde78f11e17fc39c2cfd40bb0e52791d895c88e9058c9653087d7097d8abc" }),
  art({ id: "street-barrier", file: "prop-street-barrier.svg", role: "city route safety barrier billboard prop", category: "prop", alpha: true, width: 1024, height: 1024, qualities: ["lite", "balanced", "cinematic"], sha256: "ac246e9aa24c65a0bf5d61d6dc2ee7c6b133601c3df891e62636ab214f3b9dc5" }),
  art({ id: "archive-orb", file: "prop-archive-orb.svg", role: "quiet Archive Gardens memory orb billboard prop", category: "prop", alpha: true, width: 1024, height: 1024, qualities: ["balanced", "cinematic"], sha256: "7f333e8dc92a7bb1981a3b6b343ed87c7d461d404360710d58b3cda719df39d1" }),
  art({ id: "tram-silhouette", file: "prop-tram-silhouette.svg", role: "distant local transit tram billboard prop", category: "prop", alpha: true, width: 1024, height: 1024, qualities: ["cinematic"], sha256: "16b215ffc4b250e256f9d0e4cbf445ac464d7b82f6a63a295f39dbd06f0b4687" })
]);

const BY_ID = new Map(EON_CITY_VECTOR_ART_CATALOG.map((entry) => [entry.id, entry]));
const QUALITY_ORDER = freeze(['lite', 'balanced', 'cinematic']);
const CATEGORY_ORDER = freeze(['material', 'backdrop', 'decal', 'prop']);

export function normalizeCityVectorArtQuality(value = 'balanced') {
  const candidate = String(value || '').trim().toLowerCase();
  return QUALITY_ORDER.includes(candidate) ? candidate : 'balanced';
}

export function getCityVectorArtAsset(id = '') {
  return BY_ID.get(String(id || '').trim()) || null;
}

export function getCityVectorArtPath(id = '') {
  const entry = getCityVectorArtAsset(id);
  return entry ? `${EON_CITY_VECTOR_ART_ROOT}${entry.file}` : null;
}

export function getCityVectorArtPlan({ quality = 'balanced', categories = null, ids = null } = {}) {
  const resolvedQuality = normalizeCityVectorArtQuality(quality);
  const allowedCategories = Array.isArray(categories) && categories.length ? new Set(categories) : null;
  const allowedIds = Array.isArray(ids) && ids.length ? new Set(ids) : null;
  const entries = EON_CITY_VECTOR_ART_CATALOG
    .filter((entry) => entry.qualities.includes(resolvedQuality) && (!allowedCategories || allowedCategories.has(entry.category)) && (!allowedIds || allowedIds.has(entry.id)))
    .map((entry) => freeze({ ...entry, path: getCityVectorArtPath(entry.id) }));
  return freeze({
    schema: EON_CITY_VECTOR_ART_SCHEMA,
    quality: resolvedQuality,
    entries: freeze(entries),
    sameOriginOnly: true,
    remoteNetwork: false,
    finalBinaryArt: false,
    originalVectorArt: true
  });
}

export function getCityVectorArtCategoryCounts(catalog = EON_CITY_VECTOR_ART_CATALOG) {
  const counts = Object.fromEntries(CATEGORY_ORDER.map((category) => [category, 0]));
  for (const entry of catalog || []) {
    if (Object.hasOwn(counts, entry?.category)) counts[entry.category] += 1;
  }
  return freeze(counts);
}

export function validateCityVectorArtCatalog(catalog = EON_CITY_VECTOR_ART_CATALOG) {
  const errors = [];
  const ids = new Set();
  if (!Array.isArray(catalog) || catalog.length !== 58) errors.push('W422 requires exactly 58 original vector art entries.');
  const counts = getCityVectorArtCategoryCounts(catalog);
  const expected = { material: 12, backdrop: 8, decal: 30, prop: 8 };
  for (const category of CATEGORY_ORDER) {
    if (counts[category] !== expected[category]) errors.push(`W422 needs ${expected[category]} ${category} art entries.`);
  }
  for (const requiredId of [...EON_CITY_VECTOR_ART_FOUNDATION_IDS, ...EON_CITY_VECTOR_ART_DEEP_EXTENSION_IDS]) {
    if (!(catalog || []).some((entry) => entry?.id === requiredId)) errors.push(`Missing required original art ID: ${requiredId}.`);
  }
  for (const entry of catalog || []) {
    if (!/^[a-z0-9-]{3,48}$/.test(String(entry?.id || ''))) errors.push('Vector art ID is invalid.');
    if (ids.has(entry?.id)) errors.push(`Duplicate vector art ID: ${entry?.id}.`);
    ids.add(entry?.id);
    if (!/^[-a-z0-9]+\.svg$/i.test(String(entry?.file || ''))) errors.push(`${entry?.id || 'unknown'} must be a local SVG file.`);
    if (!CATEGORY_ORDER.includes(entry?.category)) errors.push(`${entry?.id || 'unknown'} has an unsupported art category.`);
    if (entry?.status !== 'shipped-original-vector' || entry?.origin !== 'EONAPP original in-house work' || entry?.licence !== 'EONAPP controlled original work') errors.push(`${entry?.id || 'unknown'} lacks original-art provenance.`);
    if (entry?.sameOrigin !== true || entry?.remoteNetwork !== false || entry?.userData !== false || entry?.finalBinaryArt !== false) errors.push(`${entry?.id || 'unknown'} violates the local art boundary.`);
    if (!Array.isArray(entry?.qualities) || !entry.qualities.length || !entry.qualities.every((quality) => QUALITY_ORDER.includes(quality))) errors.push(`${entry?.id || 'unknown'} has invalid quality tiers.`);
    if (!/^[a-f0-9]{64}$/i.test(String(entry?.sha256 || ''))) errors.push(`${entry?.id || 'unknown'} needs a source SHA-256.`);
    if (!Number.isInteger(entry?.width) || entry.width < 256 || !Number.isInteger(entry?.height) || entry.height < 256) errors.push(`${entry?.id || 'unknown'} has invalid source dimensions.`);
  }
  return freeze({ schema: EON_CITY_VECTOR_ART_SCHEMA, ok: errors.length === 0, errors: freeze(errors), catalogCount: Array.isArray(catalog) ? catalog.length : 0, categoryCounts: counts, localOnly: true });
}

export function getCityVectorArtSummary({ quality = 'balanced' } = {}) {
  const plan = getCityVectorArtPlan({ quality });
  const validation = validateCityVectorArtCatalog();
  return freeze({
    schema: EON_CITY_VECTOR_ART_SCHEMA,
    valid: validation.ok,
    quality: plan.quality,
    catalogCount: EON_CITY_VECTOR_ART_CATALOG.length,
    foundationCatalogCount: EON_CITY_VECTOR_ART_FOUNDATION_IDS.length,
    deepArtExtensionCount: EON_CITY_VECTOR_ART_DEEP_EXTENSION_IDS.length,
    categoryCounts: getCityVectorArtCategoryCounts(),
    loadedPlanCount: plan.entries.length,
    originalVectorArtShipped: true,
    binaryArtShipped: false,
    finalVisualCertification: false,
    finalInstitutionalArtClaim: false,
    localOnly: true,
    remoteNetwork: false,
    userData: false
  });
}
