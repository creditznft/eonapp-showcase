import { hashSeed, buildVaultRevealVisualBundle } from '../collection/eon-vault-reveal-visuals.js';
import { buildLocalRelicBoundary } from '../realm-relic/eon-realm-relic-boundary.js';

/**
 * Private Market collections are intentionally local-only and opt-in.
 * Nothing is generated, persisted, or shown by the Market page until a user
 * chooses Generate or Resume. V2 data remains untouched and may be resumed
 * explicitly; it is never silently prefilled into the new Market view.
 */
export const EON_PRIVATE_DROP_SCHEMA = 'eon.market.private-drop.v3';
export const EON_PRIVATE_DROP_KEY = 'eon:market:private-drop:v3';
export const EON_PRIVATE_DROP_LEGACY_KEY = 'eon:market:private-drop:v2';
export const EON_PRIVATE_DROP_RECEIPTS_KEY = 'eon:market:private-drop-receipts:v3';

export const EON_GENERATED_VAULT_REVEALS_KEY = 'eon:vault-reveals:generated:v1';
const LEGACY_NFT_COLLECTION_KEY_V1 = 'eon:nft:collection:v1';
const LEGACY_NFT_COLLECTION_KEY_V3 = 'eon:nft-collection:v3';

const DROP_COUNT = 4;
const MAX_RESUME_ITEMS = 24;
const DROP_CONTEXTS = Object.freeze(['market-gallery', 'city-archive', 'signal-forge', 'realm-studio']);
const PRIVATE_COLLECTION_THEMES = Object.freeze([
  Object.freeze({ id: 'neon-archive', label: 'Neon Archive', descriptors: ['Archive Signal', 'Lumen Relic', 'Circuit Bloom', 'Data Warden'] }),
  Object.freeze({ id: 'quiet-cosmos', label: 'Quiet Cosmos', descriptors: ['Orbit Keeper', 'Starlight Vessel', 'Nova Archive', 'Moonlit Core'] }),
  Object.freeze({ id: 'city-workshop', label: 'City Workshop', descriptors: ['Workshop Glyph', 'Builder Beacon', 'Command Relic', 'Prototype Bloom'] }),
  Object.freeze({ id: 'forest-signal', label: 'Forest Signal', descriptors: ['Verdant Signal', 'Canopy Relay', 'Mosslight Vessel', 'Root Archive'] })
]);
const UTILITY_COPY = Object.freeze([
  'A private cosmetic preview for your EON City profile.',
  'A local visual reference you can save in this browser’s Vault.',
  'A private collection preview with no financial, trading, or ownership claim.',
  'A local design asset for your personal Realm moodboard.'
]);

function readJson(key, fallback) {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function writeJson(key, value) {
  try { globalThis.localStorage?.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

function randomNonce() {
  try {
    const values = new Uint32Array(3);
    globalThis.crypto?.getRandomValues(values);
    return Array.from(values, (value) => value.toString(36)).join('-');
  } catch {
    return `${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
  }
}

function cleanText(value = '', max = 140) {
  const printable = Array.from(String(value || ''), (character) => {
    const code = character.charCodeAt(0);
    return code < 32 || code === 127 ? ' ' : character;
  }).join('');
  return printable.replace(/\s+/g, ' ').trim().slice(0, max);
}

function resolveTheme(themeId = '') {
  const found = PRIVATE_COLLECTION_THEMES.find((entry) => entry.id === String(themeId || '').trim());
  return found || PRIVATE_COLLECTION_THEMES[0];
}

function rarityTier(seedKey) {
  const roll = hashSeed(`${seedKey}|rarity`) % 100;
  return roll > 97 ? 4 : roll > 83 ? 3 : roll > 55 ? 2 : 1;
}

function rarityName(tier = 1) {
  const value = Number(tier || 1);
  if (value >= 4) return 'Legendary';
  if (value >= 3) return 'Epic';
  if (value >= 2) return 'Rare';
  return 'Common';
}

function makeItem({ nonce, index, theme, prompt }) {
  const seedKey = `eon-private-v3|${nonce}|${theme.id}|${prompt}|${index}`;
  const serial = (hashSeed(`${seedKey}|serial`) % 1000000).toString(36).toUpperCase().padStart(5, '0');
  const titleBase = theme.descriptors[hashSeed(`${seedKey}|title`) % theme.descriptors.length];
  const context = DROP_CONTEXTS[hashSeed(`${seedKey}|context`) % DROP_CONTEXTS.length];
  const descriptor = {
    id: `private-v3-${serial}-${theme.id}`,
    title: `${titleBase} · ${serial}`,
    archetype: `${theme.id}-${index + 1}`,
    seedKey,
    rarityTier: rarityTier(seedKey),
    rarity: rarityName(rarityTier(seedKey)),
    collectionType: theme.label,
    visualContext: context,
    generatedForUser: true,
    source: 'vault-reveal-generator-v1',
    edition: 'Local generated preview',
    userFacingState: 'Generated Preview',
    utilityStatement: UTILITY_COPY[hashSeed(`${seedKey}|utility`) % UTILITY_COPY.length],
    mintState: 'not-minted',
    ownershipState: 'not-owned',
    generationPrompt: prompt || null
  };
  descriptor.relicBoundary = buildLocalRelicBoundary(descriptor);
  const visual = buildVaultRevealVisualBundle(descriptor, {
    context,
    variant: `private-v3-${serial}`,
    width: 900,
    height: 900
  });
  return {
    ...descriptor,
    qualityScore: Number(visual?.qualityScore || 0),
    visualFingerprint: visual?.fingerprint || `${seedKey}|${context}`,
    imageUri: visual?.staticUri || '',
    visualSvg: visual?.svg || '',
    traits: visual?.traits || [],
    createdAt: new Date().toISOString()
  };
}

function normalizeDrop(value, { legacy = false } = {}) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.items) || !value.items.length) return null;
  return {
    ...value,
    schema: legacy ? String(value.schema || 'eon.market.private-drop.v2') : EON_PRIVATE_DROP_SCHEMA,
    items: value.items.slice(0, MAX_RESUME_ITEMS),
    legacy: Boolean(legacy),
    generatedAt: String(value.generatedAt || value.createdAt || ''),
    regenerated: false
  };
}

function safeImageUri(value = '') {
  const uri = String(value || '');
  return /^data:image\/(?:svg\+xml|png|webp|jpeg);/i.test(uri) ? uri : '';
}

function normalizeLegacyTrait(value, index) {
  if (typeof value === 'string') return cleanText(value, 48);
  if (value && typeof value === 'object') {
    const label = cleanText(value.label || value.value || value.name || '', 48);
    if (label) return label;
  }
  return `Recovered detail ${index + 1}`;
}

/**
 * Converts a legacy private collection only after the user presses Resume.
 * It leaves the V2 source untouched and writes a separate V3 envelope.
 */
function migrateLegacyDrop(legacyDrop) {
  const rawTheme = legacyDrop?.theme && typeof legacyDrop.theme === 'object' ? legacyDrop.theme.id : legacyDrop?.theme;
  const theme = resolveTheme(rawTheme);
  const legacySchema = cleanText(legacyDrop?.schema || 'eon.market.private-drop.v2', 80);
  const legacyNonce = cleanText(legacyDrop?.nonce || `${legacySchema}|${legacyDrop?.generatedAt || ''}`, 180);
  const migratedAt = new Date().toISOString();
  const items = legacyDrop.items.slice(0, MAX_RESUME_ITEMS).map((legacyItem, index) => {
    const oldSeed = cleanText(legacyItem?.seedKey || legacyItem?.id || `${legacyNonce}|${index}`, 180);
    const seedKey = `eon-private-v3|legacy-resume|${oldSeed}|${index}`;
    const serial = (hashSeed(`${seedKey}|serial`) % 1000000).toString(36).toUpperCase().padStart(5, '0');
    const title = cleanText(legacyItem?.title || legacyItem?.name || `${theme.descriptors[index % theme.descriptors.length]} · ${serial}`, 96);
    const context = DROP_CONTEXTS[hashSeed(`${seedKey}|context`) % DROP_CONTEXTS.length];
    const tier = Math.max(1, Math.min(4, Number(legacyItem?.rarityTier || rarityTier(seedKey)) || 1));
    const descriptor = {
      id: cleanText(legacyItem?.id || `private-v3-legacy-${serial}-${theme.id}`, 120),
      title,
      archetype: `${theme.id}-recovered-${index + 1}`,
      seedKey,
      rarityTier: tier,
      rarity: rarityName(tier),
      collectionType: cleanText(legacyItem?.collectionType || theme.label, 60),
      visualContext: context,
      generatedForUser: true,
      source: 'vault-reveal-generator-v1',
      edition: 'Recovered local preview',
      userFacingState: 'Generated Preview',
      utilityStatement: 'A local preview recovered from an earlier EONAPP collection. It remains local-only and has no financial or transfer claim.',
      mintState: 'not-minted',
      ownershipState: 'not-owned',
      generationPrompt: null,
      relicBoundary: buildLocalRelicBoundary({ id: cleanText(legacyItem?.id || `private-v3-legacy-${serial}-${theme.id}`, 120), title }),
      legacySource: cleanText(legacyItem?.source || legacySchema, 100)
    };
    const visual = buildVaultRevealVisualBundle(descriptor, {
      context,
      variant: `legacy-resume-${serial}`,
      width: 900,
      height: 900
    });
    const imageUri = safeImageUri(legacyItem?.imageUri) || visual?.staticUri || '';
    return {
      ...descriptor,
      qualityScore: Number(legacyItem?.qualityScore || visual?.qualityScore || 0),
      visualFingerprint: cleanText(legacyItem?.visualFingerprint || visual?.fingerprint || `${seedKey}|${context}`, 240),
      imageUri,
      visualSvg: safeImageUri(legacyItem?.imageUri) ? '' : (visual?.svg || ''),
      traits: Array.isArray(legacyItem?.traits) && legacyItem.traits.length
        ? legacyItem.traits.slice(0, 8).map(normalizeLegacyTrait)
        : (visual?.traits || []),
      createdAt: String(legacyItem?.createdAt || legacyDrop?.generatedAt || migratedAt),
      recoveredAt: migratedAt
    };
  });
  return {
    schema: EON_PRIVATE_DROP_SCHEMA,
    generatedAt: String(legacyDrop?.generatedAt || legacyDrop?.createdAt || migratedAt),
    nonce: `legacy-resume-${hashSeed(`${legacyNonce}|${migratedAt}`).toString(36)}`,
    theme: { id: theme.id, label: theme.label },
    prompt: null,
    items,
    regenerated: false,
    policy: {
      privateGenerated: true,
      userTriggered: true,
      localOnly: true,
      relicsAreLocalNonTransferable: true,
      noOnChainMintingOrTransfer: true,
      notFinancialProduct: true,
      purchaseProviderConfigured: false,
      publicListingAvailable: false
    },
    migration: {
      sourceKey: EON_PRIVATE_DROP_LEGACY_KEY,
      sourceSchema: legacySchema,
      explicitUserResume: true,
      migratedAt,
      preservedLegacySource: true
    }
  };
}

/** Returns an existing active V3 collection only. It never generates data. */
export function readPrivateMarketDrop() {
  return normalizeDrop(readJson(EON_PRIVATE_DROP_KEY, null));
}

/** Returns an explicitly resumable collection, including untouched legacy V2 data. */
export function readPrivateMarketResumeCandidate() {
  const active = readPrivateMarketDrop();
  if (active) return { kind: 'current', drop: active };
  const legacy = normalizeDrop(readJson(EON_PRIVATE_DROP_LEGACY_KEY, null), { legacy: true });
  return legacy ? { kind: 'legacy', drop: legacy } : null;
}

/**
 * Makes an existing collection active after a deliberate Resume action.
 * Legacy V2 data is copied forward, never removed or overwritten.
 */
export function activatePrivateMarketResumeCandidate(candidate = readPrivateMarketResumeCandidate()) {
  if (!candidate?.drop) return { ok: false, error: 'resume_candidate_not_found' };
  if (candidate.kind === 'current') return { ok: true, kind: 'current', migrated: false, drop: candidate.drop };
  const alreadyActive = readPrivateMarketDrop();
  if (alreadyActive) return { ok: true, kind: 'current', migrated: false, drop: alreadyActive };
  const migrated = migrateLegacyDrop(candidate.drop);
  if (!writeJson(EON_PRIVATE_DROP_KEY, migrated)) return { ok: false, error: 'resume_migration_not_persisted' };
  return { ok: true, kind: 'legacy', migrated: true, drop: normalizeDrop(migrated) };
}

/**
 * Generates exactly on an explicit caller action. No module import or page
 * initialisation calls this function.
 */
export function getPrivateMarketDrop({ regenerate = false, count = DROP_COUNT, theme = '', prompt = '' } = {}) {
  const size = Math.max(4, Math.min(4, Number(count) || DROP_COUNT));
  const existing = readPrivateMarketDrop();
  if (!regenerate && existing && existing.items.length >= size) {
    return { ...existing, items: existing.items.slice(0, size), regenerated: false };
  }
  const selectedTheme = resolveTheme(theme);
  const cleanPrompt = cleanText(prompt);
  const nonce = randomNonce();
  const items = Array.from({ length: size }, (_, index) => makeItem({ nonce, index, theme: selectedTheme, prompt: cleanPrompt }));
  const envelope = {
    schema: EON_PRIVATE_DROP_SCHEMA,
    generatedAt: new Date().toISOString(),
    nonce,
    theme: { id: selectedTheme.id, label: selectedTheme.label },
    prompt: cleanPrompt || null,
    items,
    regenerated: Boolean(regenerate),
    policy: {
      privateGenerated: true,
      userTriggered: true,
      localOnly: true,
      relicsAreLocalNonTransferable: true,
      noOnChainMintingOrTransfer: true,
      notFinancialProduct: true,
      purchaseProviderConfigured: false,
      publicListingAvailable: false
    }
  };
  writeJson(EON_PRIVATE_DROP_KEY, envelope);
  return envelope;
}

function activeDropForSave() {
  return readPrivateMarketDrop();
}

export function savePrivateMarketDropItemToVault(itemId = '') {
  const drop = activeDropForSave();
  const item = drop?.items?.find((candidate) => candidate.id === String(itemId || ''));
  if (!item) return { ok: false, error: 'generated_item_not_found' };
  const canonical = readJson(EON_GENERATED_VAULT_REVEALS_KEY, {});
  const collection = canonical && typeof canonical === 'object' && !Array.isArray(canonical) ? canonical : {};
  const legacyV3 = readJson(LEGACY_NFT_COLLECTION_KEY_V3, {});
  const legacyCopies = legacyV3 && typeof legacyV3 === 'object' && Array.isArray(legacyV3[item.id]) ? legacyV3[item.id] : [];
  const legacyV1 = readJson(LEGACY_NFT_COLLECTION_KEY_V1, []);
  const legacyFlatCopy = Array.isArray(legacyV1) ? legacyV1.find((copy) => (copy?.id || copy?.nftId) === item.id) : null;
  const existingCopies = [
    ...(Array.isArray(collection[item.id]) ? collection[item.id] : []),
    ...legacyCopies,
    ...(legacyFlatCopy ? [legacyFlatCopy] : [])
  ];
  const alreadySaved = existingCopies.some((copy) => copy?.source === 'vault-reveal-generator-v1' || copy?.source === 'market-private-drop-v3');
  const vaultCopy = {
    id: item.id,
    revealId: item.id,
    name: item.title,
    title: item.title,
    source: 'vault-reveal-generator-v1',
    rarity: rarityName(item.rarityTier).toLowerCase(),
    collectionType: item.collectionType,
    generatedForUser: true,
    userFacingState: 'Saved Local Preview',
    mintState: 'not-minted',
    ownershipState: 'local-vault-receipt',
    imageUri: item.imageUri,
    seedKey: item.seedKey,
    utilityStatement: item.utilityStatement,
    savedAt: new Date().toISOString(),
    metadata: {
      schema: EON_PRIVATE_DROP_SCHEMA,
      visualFingerprint: item.visualFingerprint,
      traits: item.traits,
      originalState: 'Generated Preview'
    }
  };
  if (!alreadySaved) {
    const canonicalCopies = Array.isArray(collection[item.id]) ? collection[item.id] : [];
    collection[item.id] = [vaultCopy, ...canonicalCopies];
    writeJson(EON_GENERATED_VAULT_REVEALS_KEY, collection);
  }
  const receipts = readJson(EON_PRIVATE_DROP_RECEIPTS_KEY, []);
  const receipt = {
    schema: 'eonapp.vault-reveal.save-receipt.w623d.v1',
    itemId: item.id,
    title: item.title,
    savedAt: new Date().toISOString(),
    alreadySaved,
    state: 'Saved Local Preview',
    mintState: 'not-minted',
    vaultRoute: '/vault'
  };
  writeJson(EON_PRIVATE_DROP_RECEIPTS_KEY, [receipt, ...(Array.isArray(receipts) ? receipts : []).filter((row) => row?.itemId !== item.id)].slice(0, 48));
  return { ok: true, alreadySaved, item, receipt };
}

export function listPrivateMarketThemes() {
  return PRIVATE_COLLECTION_THEMES.slice();
}
