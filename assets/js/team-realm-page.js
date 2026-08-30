/**
 * team-realm-page.js
 * Populates the EON Team Genesis storefront (team-realm.html).
 */

import { GENESIS_NFTS, GENESIS_TEMPLATES, EON_TEAM_REALM_PRODUCTS, EON_TEAM_REVENUE_SPLITS, EON_TEAM_WALLET } from './utils/genesis-collection.js';
import { ensureStarterRealmParcels, getRealmParcels } from './utils/realm-parcels.js';
import { buildObjectCollectibleVisualBundle, buildLandPlotCollectibleVisualBundle, buildAiCollectibleVisualBundle } from './utils/nft-visuals.js';
import { formatUsdtWithSettlement, getUsdtFromEonAmount } from './utils/pricing.js';
import { getProfile } from './utils/profile.js';

const /** @type {any} */
RARITY_LABELS = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Ultra', 'Apex', 'God Tier'];
const SHARE_LEDGER_KEY = 'eon:team-realm:shares:v1';
const /** @type {any} */
AI_NATIVE_COLLECTION_TYPES = new Set(['compute', 'template', 'agent']);

function escHtml(/** @type {any} */ v = '') {
  return String(v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showPurchaseStatus(/** @type {any} */ msg, /** @type {any} */ isError = false) {
  const /** @type {any} */
el = document.getElementById('tr-purchase-status');
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? '#fca5a5' : '#86efac';
  setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 4000);
}

function getViewerId() {
  try {
    const profile = getProfile();
    const wallet = String(profile?.wallet || profile?.walletAddress || '').toLowerCase();
    if (/^0x[a-f0-9]{40}$/.test(wallet)) return wallet;
  } catch {}
  return 'guest-local';
}

function loadShareLedger() {
  const /** @type {any} */
fallback = {
    totalSupply: 100000,
    treasuryShares: 60000,
    publicFloat: 25000,
    pricePerShareEon: 1.25,
    revenuePoolEon: 0,
    distributedEon: 0,
    pricePerShareUsdt: 1.25,
    revenuePoolUsdt: 0,
    distributedUsdt: 0,
    holders: {},
    updatedAt: Date.now()
  };
  try {
    const parsed = JSON.parse(localStorage.getItem(SHARE_LEDGER_KEY) || 'null');
    if (!parsed || typeof parsed !== 'object') return fallback;
    return {
      ...fallback,
      ...parsed,
      pricePerShareUsdt: Number(parsed.pricePerShareUsdt || parsed.pricePerShareEon || fallback.pricePerShareUsdt),
      revenuePoolUsdt: Number(parsed.revenuePoolUsdt || parsed.revenuePoolEon || 0),
      distributedUsdt: Number(parsed.distributedUsdt || parsed.distributedEon || 0),
      holders: parsed.holders && typeof parsed.holders === 'object' ? parsed.holders : {}
    };
  } catch {
    return fallback;
  }
}

function saveShareLedger(/** @type {any} */ ledger) {
  try { localStorage.setItem(SHARE_LEDGER_KEY, JSON.stringify({ ...ledger, updatedAt: Date.now() })); } catch {}
}

function renderSharePanel() {
  const /** @type {any} */
root = document.getElementById('tr-share-panel');
  if (!root) return;

  const ledger = loadShareLedger();
  const viewerId = getViewerId();
  const viewerShares = Number(ledger.holders?.[viewerId] || 0);
  const circulating = Math.max(0, Number(ledger.totalSupply || 0) - Number(ledger.treasuryShares || 0));
  const viewerPct = circulating > 0 ? ((viewerShares / circulating) * 100).toFixed(2) : '0.00';

  root.innerHTML = `
    <div class="tr-grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));margin-bottom:.9rem">
      <div class="tr-card"><div class="tr-card-title">Total Shares</div><div class="tr-card-price">${Number(ledger.totalSupply).toLocaleString()}</div></div>
      <div class="tr-card"><div class="tr-card-title">Public Float</div><div class="tr-card-price">${Number(ledger.publicFloat).toLocaleString()}</div></div>
      <div class="tr-card"><div class="tr-card-title">Price / Share</div><div class="tr-card-price">${Number(ledger.pricePerShareUsdt || 0).toFixed(2)} USDT</div></div>
      <div class="tr-card"><div class="tr-card-title">Revenue Pool</div><div class="tr-card-price">${Number(ledger.revenuePoolUsdt || 0).toFixed(2)} USDT</div></div>
    </div>
    <div class="tr-card" style="margin-bottom:.8rem">
      <div class="tr-card-title">Your position</div>
      <div class="tr-card-desc">Wallet: ${escHtml(viewerId)} · Holdings: <strong>${viewerShares.toLocaleString()}</strong> shares (${viewerPct}% of circulating shares).</div>
      <div class="tr-card-meta">
        <input id="tr-buy-shares-qty" class="rl-input" type="number" min="1" step="1" value="25" style="max-width:180px" />
        <button class="btn btn-primary btn-sm" id="tr-buy-shares-btn" type="button">Buy Shares</button>
      </div>
    </div>
    <div class="tr-card">
      <div class="tr-card-title">Operator controls (local simulation)</div>
      <div class="tr-card-desc">Issue float and distribute revenue to holders. This is local-first simulation until on-chain STO contracts are wired.</div>
      <div class="tr-card-meta" style="gap:.4rem .55rem">
        <input id="tr-mint-float-qty" class="rl-input" type="number" min="1" step="1" value="1000" style="max-width:180px" />
        <button class="btn btn-outline btn-sm" id="tr-mint-float-btn" type="button">Move Treasury → Float</button>
        <input id="tr-revenue-add" class="rl-input" type="number" min="0" step="0.01" value="250" style="max-width:180px" />
        <button class="btn btn-outline btn-sm" id="tr-add-revenue-btn" type="button">Add Revenue Pool</button>
        <button class="btn btn-primary btn-sm" id="tr-distribute-revenue-btn" type="button">Distribute Revenue</button>
      </div>
      <p class="tr-purchase-status" id="tr-share-status" aria-live="polite"></p>
    </div>
  `;

  const /** @type {any} */
statusEl = document.getElementById('tr-share-status');
  const setStatus = (/** @type {any} */ text, /** @type {any} */ isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.style.color = isError ? '#fca5a5' : '#86efac';
  };

  document.getElementById('tr-buy-shares-btn')?.addEventListener('click', () => {
    const qty = Math.max(1, Math.floor(Number((/** @type {HTMLInputElement | null} */ (document.getElementById('tr-buy-shares-qty')))?.value || 0)));
    const next = loadShareLedger();
    if (qty > Number(next.publicFloat || 0)) {
      setStatus('Not enough public float available.', true);
      return;
    }
    next.publicFloat -= qty;
    next.holders[viewerId] = Number(next.holders[viewerId] || 0) + qty;
    saveShareLedger(next);
    setStatus(`Purchased ${qty.toLocaleString()} shares for ${(qty * Number(next.pricePerShareUsdt || 0)).toFixed(2)} USDT.`);
    renderSharePanel();
  });

  document.getElementById('tr-mint-float-btn')?.addEventListener('click', () => {
    const qty = Math.max(1, Math.floor(Number((/** @type {HTMLInputElement | null} */ (document.getElementById('tr-mint-float-qty')))?.value || 0)));
    const next = loadShareLedger();
    if (qty > Number(next.treasuryShares || 0)) {
      setStatus('Treasury does not have enough locked shares.', true);
      return;
    }
    next.treasuryShares -= qty;
    next.publicFloat += qty;
    saveShareLedger(next);
    setStatus(`Moved ${qty.toLocaleString()} shares from treasury into public float.`);
    renderSharePanel();
  });

  document.getElementById('tr-add-revenue-btn')?.addEventListener('click', () => {
    const amount = Math.max(0, Number((/** @type {HTMLInputElement | null} */ (document.getElementById('tr-revenue-add')))?.value || 0));
    const next = loadShareLedger();
    next.revenuePoolUsdt = Number(next.revenuePoolUsdt || 0) + amount;
    saveShareLedger(next);
    setStatus(`Added ${amount.toFixed(2)} USDT into revenue pool.`);
    renderSharePanel();
  });

  document.getElementById('tr-distribute-revenue-btn')?.addEventListener('click', () => {
    const next = loadShareLedger();
    const pool = Number(next.revenuePoolUsdt || 0);
    if (pool <= 0) {
      setStatus('Revenue pool is empty.', true);
      return;
    }
    const holderEntries = Object.entries(next.holders || {}).filter((/** @type {any} */ [, shares]) => Number(shares) > 0);
    const totalHeld = holderEntries.reduce((/** @type {any} */ sum, /** @type {any} */ [, shares]) => sum + Number(shares), 0);
    if (totalHeld <= 0) {
      setStatus('No holders to distribute to yet.', true);
      return;
    }
    /** @type {Record<string, number>} */
    const /** @type {any} */
payouts = {};
    holderEntries.forEach((/** @type {any} */ [holder, shares]) => {
      payouts[holder] = Number(((pool * Number(shares)) / totalHeld).toFixed(4));
    });
    next.revenuePoolUsdt = 0;
    next.distributedUsdt = Number(next.distributedUsdt || 0) + pool;
    saveShareLedger(next);
    const viewerPayout = Number(payouts[viewerId] || 0).toFixed(4);
    setStatus(`Distributed ${pool.toFixed(2)} USDT to holders. Your payout: ${viewerPayout} USDT.`);
    renderSharePanel();
  });
}

function formatItemPricing(/** @type {any} */ item) {
  const usdtValue = getUsdtFromEonAmount(Number(item?.priceEon || 0));
  return formatUsdtWithSettlement(usdtValue, { freeLabel: 'Free' });
}

function isAiGenesisItem(/** @type {any} */ item) {
  const collectionType = String(item?.collectionType || '').toLowerCase();
  const category = String(item?.category || '').toLowerCase();
  const title = String(item?.title || '').toLowerCase();
  return AI_NATIVE_COLLECTION_TYPES.has(collectionType)
    || category.includes('ai')
    || title.startsWith('ai ')
    || title.includes(' ai ');
}

function getFeaturedTeamLandParcels() {
  ensureStarterRealmParcels('eon-team', EON_TEAM_WALLET);
  const teamWallet = String(EON_TEAM_WALLET || '').toLowerCase();
  return getRealmParcels()
    .filter((/** @type {any} */ parcel) => String(parcel?.ownerWallet || '').toLowerCase() === teamWallet)
    .sort((/** @type {any} */ a, /** @type {any} */ b) => Number(b?.upgradeLevel || 0) - Number(a?.upgradeLevel || 0))
    .slice(0, 3);
}

// ── Render NFTs ───────────────────────────────────────────────────────────────
function renderNFTs() {
  const /** @type {any} */
grid = document.getElementById('tr-nft-grid');
  if (!grid) return;

  const landCards = getFeaturedTeamLandParcels().map((/** @type {any} */ parcel) => {
    const rarityTier = parcel.ascensionTier === 'mythic' ? 6 : parcel.ascensionTier === 'ascendant' ? 4 : 2;
    const districtLabel = String(parcel.districtId || 'realm').replace(/-/g, ' ');
    const preview = buildLandPlotCollectibleVisualBundle({
      id: parcel.parcelId,
      tokenId: parcel.parcelId,
      title: `EON Team Parcel · ${districtLabel}`,
      subtitle: 'Realm Land Exchange',
      collectionType: 'land',
      districtId: parcel.districtId,
      rarity: rarityTier,
      rarityTier,
      serial: parcel.parcelId,
      seedKey: `${parcel.parcelId}|${parcel.districtId}|${parcel.upgradeLevel}|${parcel.ascensionTier}`
    }, { context: 'land', variant: 'land-parcel' });

    const rarityLabel = RARITY_LABELS[rarityTier] || 'Rare';
    return `<div class="tr-card">
      <img src="${preview.staticUri}" alt="${escHtml(parcel.parcelId)} parcel artwork" loading="lazy" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:.8rem;border:1px solid rgba(148,163,184,.18);margin-bottom:.35rem" />
      <div class="tr-card-icon">LAND</div>
      <div class="tr-card-title">${escHtml(`EON Team Parcel · ${districtLabel}`)}</div>
      <div class="tr-card-desc">Genesis land parcel in the official EON Team realm inventory. Upgrade level ${Number(parcel.upgradeLevel || 1)} with ${escHtml(parcel.ascensionTier || 'starter')} tier routing and storefront rights.</div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:center">
        <span class="tr-rarity-badge tr-rarity-${rarityTier}">${escHtml(rarityLabel)}</span>
        <span class="tr-supply-tag">🗺 Land Plot</span>
      </div>
      <div class="tr-card-meta">
        <span class="tr-card-price">View on Marketplace</span>
        <a href="/marketplace.html" class="btn btn-outline btn-sm">Open Market →</a>
      </div>
      <div style="font-size:.72rem;color:var(--clr-text-muted)">Archetype: ${escHtml(preview.traits?.archetype || 'tower')} · Material: ${escHtml(preview.traits?.material || 'rune_metal')}</div>
    </div>`;
  });

  const sorted = GENESIS_NFTS.slice().sort((/** @type {any} */ a, /** @type {any} */ b) => {
    const rarityDiff = Number(b.rarityTier || 0) - Number(a.rarityTier || 0);
    if (rarityDiff !== 0) return rarityDiff;
    return Number(b.priceEon || 0) - Number(a.priceEon || 0);
  });

  const nftCards = sorted.map((/** @type {any} */ item) => {
    const /** @type {any} */
descriptor = {
      ...item,
      id: item.id,
      tokenId: item.id,
      rarity: item.rarityTier,
      rarityTier: item.rarityTier,
      serial: item.id,
      seedKey: `${item.id}|${item.title}|${item.rarityTier}|${item.priceEon}`,
      subtitle: item.collectionType || 'genesis collectible'
    };
    const preview = isAiGenesisItem(item)
      ? buildAiCollectibleVisualBundle(descriptor, { context: 'storefront', variant: 'ai-core' })
      : buildObjectCollectibleVisualBundle(descriptor, { context: 'storefront', variant: 'realm-genesis' });
    const rLabel = RARITY_LABELS[item.rarityTier] || 'Common';
    const supplyText = item.limited
      ? `<span class="tr-limited-tag">🔢 Max ${item.maxSupply}</span>`
      : `<span class="tr-supply-tag">♾ Open Edition</span>`;

    const pricing = formatItemPricing(item);
    const isFree = item.priceEon === 0;

    return `<div class="tr-card">
      <img src="${preview.staticUri}" alt="${escHtml(item.title)} artwork" loading="lazy" style="width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:.8rem;border:1px solid rgba(148,163,184,.18);margin-bottom:.35rem" />
      <div style="font-size:.72rem;color:rgba(255,255,255,.74);margin-bottom:.55rem">Generated layered relic art with deterministic archetype, material rarity, and dynamic frame.</div>
      <div class="tr-card-icon" style="letter-spacing:.08em">${escHtml((preview.traits?.archetype || 'NFT').replace(/_/g, '-').slice(0, 10).toUpperCase())}</div>
      <div class="tr-card-title">${escHtml(item.title)}</div>
      <div class="tr-card-desc">${escHtml(item.desc)}</div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:center">
        <span class="tr-rarity-badge tr-rarity-${item.rarityTier}">${escHtml(rLabel)}</span>
        ${supplyText}
      </div>
      <div class="tr-card-meta">
        <span class="tr-card-price">${escHtml(pricing.primary)}</span>
        <button class="btn btn-primary btn-sm tr-buy-btn" data-id="${escHtml(item.id)}" data-price="${item.priceEon}" data-title="${escHtml(item.title)}" type="button">
          ${isFree ? 'Claim Free' : '⚡ Purchase'}
        </button>
      </div>
      <div style="font-size:.72rem;color:var(--clr-text-muted)">Archetype: ${escHtml(preview.traits?.archetype || 'core-monolith')} · Material: ${escHtml(preview.traits?.material || 'rune_metal')}</div>
      <div style="font-size:.72rem;color:var(--clr-text-muted)">${escHtml(pricing.settlement)}</div>
      <div style="font-size:.72rem;color:var(--clr-text-muted);font-style:italic">${escHtml(item.revenueNote || '')}</div>
    </div>`;
  });

  grid.innerHTML = [...landCards, ...nftCards].join('');

  _bindBuyButtons(grid);
}

// ── Render Templates & Agents ─────────────────────────────────────────────────
function renderTemplates() {
  const /** @type {any} */
grid = document.getElementById('tr-template-grid');
  if (!grid) return;

  const /** @type {any} */
TYPE_ICONS = { template: 'TPL', agent: 'AGT', prompt: 'PRM', nft: 'NFT' };

  grid.innerHTML = GENESIS_TEMPLATES.map((/** @type {any} */ item) => {
    const icon = (/** @type {Record<string, string>} */ (TYPE_ICONS))[item.type] || 'GEN';
    const pricing = formatItemPricing(item);
    const isFree = item.priceEon === 0;

    return `<div class="tr-card">
      <div class="tr-card-icon">${icon}</div>
      <div class="tr-card-title">${escHtml(item.title)}</div>
      <div class="tr-card-desc">${escHtml(item.desc)}</div>
      <div class="tr-card-meta">
        <span class="tr-card-price">${escHtml(pricing.primary)}</span>
        ${isFree
          ? `<a href="/build" class="btn btn-primary btn-sm">Use Free →</a>`
          : `<button class="btn btn-primary btn-sm tr-buy-btn" data-id="${escHtml(item.id)}" data-price="${item.priceEon}" data-title="${escHtml(item.title)}" type="button">⚡ Get</button>`
        }
      </div>
      <div style="font-size:.72rem;color:var(--clr-text-muted)">${escHtml(pricing.settlement)}</div>
      <div style="font-size:.72rem;color:var(--clr-text-muted);font-style:italic">${escHtml(item.revenueNote || '')}</div>
    </div>`;
  }).join('');

  _bindBuyButtons(grid);
}

// ── Render Products ───────────────────────────────────────────────────────────
function renderProducts() {
  const /** @type {any} */
grid = document.getElementById('tr-product-grid');
  if (!grid) return;

  const splits = EON_TEAM_REVENUE_SPLITS;
  const splitText = Object.values(splits).map((/** @type {any} */ s) => `${s.pct}% ${s.label}`).join(' · ');

  grid.innerHTML = EON_TEAM_REALM_PRODUCTS.map((/** @type {any} */ item) => {
    const pricing = formatItemPricing(item);
    return `
    <div class="tr-card">
      <div class="tr-card-icon">${escHtml(item.emoji || '🛍️')}</div>
      <div class="tr-card-title">${escHtml(item.title)}</div>
      <div class="tr-card-desc">${escHtml(item.desc)}</div>
      <div class="tr-card-meta">
        <span class="tr-card-price">${escHtml(pricing.primary)}</span>
        <button class="btn btn-primary btn-sm tr-buy-btn" data-id="${escHtml(item.id)}" data-price="${item.priceEon}" data-title="${escHtml(item.title)}" type="button">⚡ Purchase</button>
      </div>
      <div style="font-size:.72rem;color:var(--clr-text-muted)">${escHtml(pricing.settlement)}</div>
      <div class="tr-product-split">${escHtml(splitText)}</div>
    </div>
  `;
  }).join('');

  _bindBuyButtons(grid);
}

// ── Purchase stub (Phase 2: wire to EonLite vault balance) ───────────────────────
function _bindBuyButtons(/** @type {any} */ container) {
  container.querySelectorAll('.tr-buy-btn').forEach((/** @type {any} */ btn) => {
    btn.addEventListener('click', () => {
      const title = btn.getAttribute('data-title') || 'item';
      const price = Number(btn.getAttribute('data-price') || 0);

      // Queue locally (same pattern as market-page.js pending listings)
      try {
        const key = 'eon:team-realm:pending-purchases:v1';
        const pending = JSON.parse(localStorage.getItem(key) || '[]');
        pending.push({
          itemId: btn.getAttribute('data-id'),
          title,
          priceEon: price,
          ts: Date.now()
        });
        localStorage.setItem(key, JSON.stringify(pending));
      } catch {}

      if (price === 0) {
        showPurchaseStatus(`✅ "${title}" claimed! Check WorkBench to start using it.`);
      } else {
        const pricing = formatUsdtWithSettlement(getUsdtFromEonAmount(price));
        showPurchaseStatus(`⚡ Purchase of "${title}" (${pricing.primary}) queued. ${pricing.settlement}.`);
      }
    });
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderNFTs();
  renderTemplates();
  renderProducts();
  renderSharePanel();
});
