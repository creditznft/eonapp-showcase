/**
 * A15 I03 — Core-owned City contract extracted from assets/js/city/eon-city-vault-reveals.js.
 * Rendering/runtime implementation remains under assets/js/city; this module
 * is safe for Core routes and contains no City implementation imports.
 */
/**
 * W564 — deterministic City appearance Vault reveals.
 *
 * This module models a small local visual-preference catalogue. A person sees
 * the exact appearance recipe before selecting it; no probability, rarity,
 * price, entitlement, transferable asset, market action, token, wallet or
 * ownership claim exists. The saved record contains only approved cosmetic
 * identifiers and timestamps, so it can survive an app update and be safely
 * included in an explicit encrypted Capsule export.
 */
import {
  EON_CITY_EONBOT_COMPANION_DEFAULT_SKIN,
  getEonCityEonbotCompanionSkins
} from './eon-city-eonbot-companion.js';

export const EON_CITY_VAULT_REVEALS_SCHEMA = 'eon.city.vault-reveals.w564.v1';
export const EON_CITY_VAULT_REVEALS_STORAGE_KEY = 'eon:city:cosmetics:v1';
export const EON_CITY_VAULT_REVEALS_VERSION = 1;

const freeze = (value) => Object.freeze(value);
const MAX_REVIEWED = 12;

function safeStorage(storage = null) {
  if (storage) return storage;
  try { return globalThis.localStorage || null; } catch { return null; }
}

function safeJson(value = '') {
  try { return JSON.parse(String(value || '')); } catch { return null; }
}

function safeGet(storage, key) {
  try { return storage?.getItem?.(key) ?? null; } catch { return null; }
}

function safeSet(storage, key, value) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  try { storage.setItem(key, String(value)); return true; } catch { return false; }
}

function safeRemove(storage, key) {
  if (!storage || typeof storage.removeItem !== 'function') return false;
  try { storage.removeItem(key); return true; } catch { return false; }
}

function iso(value = Date.now()) {
  const timestamp = Number(value);
  return new Date(Number.isFinite(timestamp) ? timestamp : Date.now()).toISOString();
}

function normalizeTimestamp(value, now = Date.now()) {
  const timestamp = Date.parse(String(value || ''));
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : iso(now);
}

function cleanId(value = '') {
  return String(value || '').trim().toLowerCase();
}

/** Original local-only recipes, derived from W561’s procedural EONBOT skins. */
export function getEonCityVaultRevealCatalogue() {
  return freeze(getEonCityEonbotCompanionSkins().map((skin) => freeze({
    id: skin.id,
    label: skin.label,
    description: skin.description,
    type: 'eonbot-companion-style',
    palette: skin.palette,
    visualOnly: true,
    includedInFreeCore: true,
    deterministicReveal: true,
    randomChance: false,
    rarityClaimed: false,
    commercialEntitlementRequired: false,
    subscriptionBenefitClaimed: false,
    transferable: false,
    ownershipClaimed: false,
    marketListingCreated: false,
    walletOrTokenCreated: false
  })));
}

function catalogueById(id = '') {
  const wanted = cleanId(id);
  return getEonCityVaultRevealCatalogue().find((item) => item.id === wanted) || null;
}

function uniqueKnownIds(value = []) {
  const known = new Set(getEonCityVaultRevealCatalogue().map((item) => item.id));
  const source = Array.isArray(value) ? value : [];
  return freeze([...new Set(source.map(cleanId).filter((id) => known.has(id)))].slice(0, MAX_REVIEWED));
}

/** Returns the default local record but never writes it implicitly. */
export function createEonCityVaultRevealInventory({ now = Date.now() } = {}) {
  return freeze({
    schema: EON_CITY_VAULT_REVEALS_SCHEMA,
    version: EON_CITY_VAULT_REVEALS_VERSION,
    updatedAt: iso(now),
    selectedCosmeticId: EON_CITY_EONBOT_COMPANION_DEFAULT_SKIN,
    reviewedCosmeticIds: freeze([]),
    localOnly: true,
    automaticCrossDeviceSync: false,
    randomChance: false,
    rarityClaimed: false,
    commercialEntitlementRequired: false,
    subscriptionBenefitClaimed: false,
    transferable: false,
    ownershipClaimed: false,
    marketListingCreated: false,
    walletOrTokenCreated: false
  });
}

/** Drops every unknown field from a persisted local cosmetic record. */
export function normalizeEonCityVaultRevealInventory(value = null, { now = Date.now() } = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (value.schema !== EON_CITY_VAULT_REVEALS_SCHEMA) return null;
  const selected = catalogueById(value.selectedCosmeticId)?.id || EON_CITY_EONBOT_COMPANION_DEFAULT_SKIN;
  const reviewed = uniqueKnownIds(value.reviewedCosmeticIds);
  return freeze({
    schema: EON_CITY_VAULT_REVEALS_SCHEMA,
    version: EON_CITY_VAULT_REVEALS_VERSION,
    updatedAt: normalizeTimestamp(value.updatedAt, now),
    selectedCosmeticId: selected,
    reviewedCosmeticIds: reviewed,
    localOnly: true,
    automaticCrossDeviceSync: false,
    randomChance: false,
    rarityClaimed: false,
    commercialEntitlementRequired: false,
    subscriptionBenefitClaimed: false,
    transferable: false,
    ownershipClaimed: false,
    marketListingCreated: false,
    walletOrTokenCreated: false
  });
}

export function readEonCityVaultRevealInventory({ storage = safeStorage(), now = Date.now() } = {}) {
  const normalized = normalizeEonCityVaultRevealInventory(safeJson(safeGet(storage, EON_CITY_VAULT_REVEALS_STORAGE_KEY)), { now });
  return freeze({
    state: normalized || createEonCityVaultRevealInventory({ now }),
    stored: Boolean(normalized),
    localOnly: true,
    networkRequestCreated: false,
    automaticCrossDeviceSync: false
  });
}

export function getEonCitySelectedCompanionSkinId(options = {}) {
  return readEonCityVaultRevealInventory(options).state.selectedCosmeticId;
}

/** A person must request the exact visible cosmetic before it can be selected. */
export function prepareEonCityVaultReveal(cosmeticId = '', { explicitUserAction = false } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required' });
  const cosmetic = catalogueById(cosmeticId);
  if (!cosmetic) return freeze({ ok: false, error: 'unknown-city-cosmetic' });
  return freeze({
    ok: true,
    reveal: freeze({
      schema: EON_CITY_VAULT_REVEALS_SCHEMA,
      cosmetic,
      confirmationRequired: true,
      deterministic: true,
      exactResultVisibleBeforeConfirmation: true,
      localOnly: true,
      randomChance: false,
      rarityClaimed: false,
      paidUnlockCreated: false,
      subscriptionEntitlementChecked: false,
      marketListingCreated: false,
      transferable: false,
      ownershipClaimed: false,
      walletOrTokenCreated: false
    })
  });
}

/** Saves one exact chosen recipe; it never grants value or changes a payment state. */
export function applyEonCityVaultReveal(cosmeticId = '', { explicitUserAction = false, storage = safeStorage(), now = Date.now() } = {}) {
  const prepared = prepareEonCityVaultReveal(cosmeticId, { explicitUserAction });
  if (!prepared.ok) return prepared;
  const current = readEonCityVaultRevealInventory({ storage, now }).state;
  const reviewed = uniqueKnownIds([...current.reviewedCosmeticIds, prepared.reveal.cosmetic.id]);
  const next = normalizeEonCityVaultRevealInventory({
    schema: EON_CITY_VAULT_REVEALS_SCHEMA,
    version: EON_CITY_VAULT_REVEALS_VERSION,
    updatedAt: iso(now),
    selectedCosmeticId: prepared.reveal.cosmetic.id,
    reviewedCosmeticIds: reviewed
  }, { now });
  const written = safeSet(storage, EON_CITY_VAULT_REVEALS_STORAGE_KEY, JSON.stringify(next));
  return freeze({
    ok: written,
    error: written ? null : 'city-cosmetic-storage-unavailable',
    state: next,
    cosmetic: prepared.reveal.cosmetic,
    localOnly: true,
    networkRequestCreated: false,
    automaticCrossDeviceSync: false,
    randomChance: false,
    paidUnlockCreated: false,
    subscriptionEntitlementChecked: false,
    marketListingCreated: false,
    ownershipClaimed: false
  });
}

export function clearEonCityVaultRevealInventory({ explicitUserAction = false, storage = safeStorage() } = {}) {
  if (explicitUserAction !== true) return freeze({ ok: false, error: 'explicit-user-action-required' });
  const removed = safeRemove(storage, EON_CITY_VAULT_REVEALS_STORAGE_KEY);
  return freeze({
    ok: removed,
    error: removed ? null : 'city-cosmetic-storage-unavailable',
    localOnly: true,
    networkRequestCreated: false,
    automaticCrossDeviceSync: false,
    randomChance: false,
    ownershipClaimed: false
  });
}

export function getEonCityVaultRevealTruth() {
  return freeze({
    schema: EON_CITY_VAULT_REVEALS_SCHEMA,
    cosmeticCount: getEonCityVaultRevealCatalogue().length,
    localOnly: true,
    updateSafeStorageKey: EON_CITY_VAULT_REVEALS_STORAGE_KEY,
    deterministicReveals: true,
    randomChance: false,
    rarityClaimed: false,
    paidUnlockCreated: false,
    subscriptionEntitlementChecked: false,
    commercialOfferShown: false,
    marketListingCreated: false,
    transferable: false,
    ownershipClaimed: false,
    walletOrTokenCreated: false,
    nftCreated: false,
    privateVaultContentRead: false,
    providerRequestCreated: false,
    backgroundWorkStarted: false,
    automaticRoute: false,
    automaticCrossDeviceSync: false
  });
}

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

/** Render the local review-first panel; no data leaves the browser. */
export function renderEonCityVaultReveals({ storage = safeStorage(), now = Date.now() } = {}) {
  const inventory = readEonCityVaultRevealInventory({ storage, now }).state;
  const cards = getEonCityVaultRevealCatalogue().map((item) => {
    const selected = item.id === inventory.selectedCosmeticId;
    const reviewed = inventory.reviewedCosmeticIds.includes(item.id);
    return `<button type="button" data-eon-play-cosmetic-card="${escapeHtml(item.id)}" aria-pressed="${selected}"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.description)}</span><small>${selected ? 'Selected locally' : reviewed ? 'Reviewed locally' : 'Review exact style'}</small></button>`;
  }).join('');
  return `
    <section class="eon-play-command-deck-panel eon-play-cosmetics-panel" data-eon-play-cosmetics-panel hidden role="dialog" aria-modal="true" aria-labelledby="eon-play-cosmetics-title">
      <div class="eon-play-command-deck-card">
        <p class="eon-play-kicker">City Appearance Vault · local visual preferences</p>
        <h2 id="eon-play-cosmetics-title">Choose an exact EONBOT style</h2>
        <p>Every style is shown before you select it. These original visual recipes are included in the Free City core: no chance, rarity, paid draw, subscription unlock, token, wallet, market listing, transfer, NFT, or ownership claim exists here.</p>
        <div class="eon-play-command-deck-grid eon-play-cosmetics-grid" data-eon-play-cosmetics-cards>${cards}</div>
        <section class="eon-play-cosmetic-review" data-eon-play-cosmetic-review hidden aria-live="polite"><p data-eon-play-cosmetic-review-detail>Select a style to review its exact local result.</p><div class="eon-play-command-deck-grid"><button type="button" data-eon-play-cosmetic-confirm disabled>Choose this local style</button><button type="button" data-eon-play-cosmetic-cancel>Keep current style</button></div></section>
        <p class="eon-play-command-deck-note" data-eon-play-cosmetics-status>Your selection applies the next time City starts or restarts. It does not read Vault content or change an account, membership, payment, or entitlement.</p>
        <button type="button" data-eon-play-close-cosmetics>Return to City</button>
      </div>
    </section>`;
}

/** Binds W564’s exact-result review to the same-tab City Workroom lifecycle. */
export function bindEonCityVaultReveals(root, { workroomOverlay = null, onStatus = () => {}, storage = safeStorage(), now = () => Date.now() } = {}) {
  const panel = root?.querySelector?.('[data-eon-play-cosmetics-panel]');
  const openButtons = Array.from(root?.querySelectorAll?.('[data-eon-play-open-cosmetics]') || []);
  const close = panel?.querySelector?.('[data-eon-play-close-cosmetics]');
  const cards = Array.from(panel?.querySelectorAll?.('[data-eon-play-cosmetic-card]') || []);
  const review = panel?.querySelector?.('[data-eon-play-cosmetic-review]');
  const reviewDetail = panel?.querySelector?.('[data-eon-play-cosmetic-review-detail]');
  const confirm = panel?.querySelector?.('[data-eon-play-cosmetic-confirm]');
  const cancel = panel?.querySelector?.('[data-eon-play-cosmetic-cancel]');
  const status = panel?.querySelector?.('[data-eon-play-cosmetics-status]');
  if (!panel || !openButtons.length || !close || !review || !reviewDetail || !confirm || !cancel || !status || !workroomOverlay?.open || !workroomOverlay?.close) return () => {};

  let returnFocus = openButtons[0] || null;
  let pendingId = '';
  let overlayOpen = false;
  const at = () => Number(now?.()) || Date.now();
  const report = (message) => { try { onStatus(String(message || '')); } catch {} };
  const cardsFor = () => Array.from(panel.querySelectorAll('[data-eon-play-cosmetic-card]'));
  const update = (message = '') => {
    const current = readEonCityVaultRevealInventory({ storage, now: at() }).state;
    const selected = catalogueById(current.selectedCosmeticId);
    cardsFor().forEach((button) => {
      const id = button.getAttribute('data-eon-play-cosmetic-card') || '';
      const item = catalogueById(id);
      if (!item) return;
      const active = item.id === current.selectedCosmeticId;
      button.setAttribute('aria-pressed', String(active));
      const small = button.querySelector('small');
      if (small) small.textContent = active ? 'Selected locally' : current.reviewedCosmeticIds.includes(item.id) ? 'Reviewed locally' : 'Review exact style';
    });
    status.textContent = message || `${selected?.label || 'Command Orbit'} is selected locally. It applies next time City starts or restarts.`;
  };
  const hideReview = () => {
    pendingId = '';
    review.hidden = true;
    confirm.disabled = true;
    reviewDetail.textContent = 'Select a style to review its exact local result.';
  };
  const show = (event) => {
    returnFocus = event?.currentTarget instanceof HTMLElement ? event.currentTarget : returnFocus;
    const opened = workroomOverlay.open({ id: 'city-appearance-vault', explicitUserAction: true });
    if (!opened.ok) { report('Close the current City panel before opening Appearance Vault.'); return; }
    overlayOpen = true;
    hideReview();
    update();
    panel.hidden = false;
    close.focus({ preventScroll: true });
  };
  const hide = () => {
    panel.hidden = true;
    hideReview();
    if (overlayOpen) workroomOverlay.close({ explicitUserAction: true, reason: 'city-cosmetic-panel-close' });
    overlayOpen = false;
    returnFocus?.focus?.({ preventScroll: true });
  };
  const beginReview = (id) => {
    const prepared = prepareEonCityVaultReveal(id, { explicitUserAction: true });
    if (!prepared.ok) { report('That City style is unavailable. No preference changed.'); return; }
    pendingId = prepared.reveal.cosmetic.id;
    review.hidden = false;
    confirm.disabled = false;
    reviewDetail.textContent = `${prepared.reveal.cosmetic.label}: ${prepared.reveal.cosmetic.description} This is the exact visual style that will be selected after your next visible click. No chance, price, entitlement, ownership, market or transfer is involved.`;
    confirm.focus({ preventScroll: true });
  };
  const apply = () => {
    if (!pendingId) return;
    const result = applyEonCityVaultReveal(pendingId, { explicitUserAction: true, storage, now: at() });
    if (!result.ok) { report('This browser could not save the local appearance choice. No preference changed.'); return; }
    hideReview();
    update(`${result.cosmetic.label} is selected locally. Restart City later to apply it to the rendered companion.`);
    report(`${result.cosmetic.label} selected locally. City remains paused until you return; no account, payment, entitlement, or private Vault data changed.`);
  };
  const cardHandlers = new Map();
  const outsideClose = (event) => { if (event.target === panel) hide(); };
  openButtons.forEach((button) => button.addEventListener('click', show));
  cards.forEach((button) => {
    const handler = () => beginReview(button.getAttribute('data-eon-play-cosmetic-card') || '');
    cardHandlers.set(button, handler);
    button.addEventListener('click', handler);
  });
  confirm.addEventListener('click', apply);
  cancel.addEventListener('click', hideReview);
  close.addEventListener('click', hide);
  panel.addEventListener('click', outsideClose);
  return () => {
    openButtons.forEach((button) => button.removeEventListener('click', show));
    cardHandlers.forEach((handler, button) => button.removeEventListener('click', handler));
    confirm.removeEventListener('click', apply);
    cancel.removeEventListener('click', hideReview);
    close.removeEventListener('click', hide);
    panel.removeEventListener('click', outsideClose);
    try { if (overlayOpen) workroomOverlay.close({ explicitUserAction: true, reason: 'city-cosmetic-panel-dispose' }); } catch {}
  };
}
