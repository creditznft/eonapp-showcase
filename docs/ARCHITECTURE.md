# EONAPP.CH — Architecture & Decentralization Audit

## Decentralization Verdict: ✅ Fully Decentralized by Default

EONAPP.ch is designed from the ground up as a **censorship-resistant, static-first, client-side application**. There is no mandatory central server. Every core feature works without any backend.

---

## Hosting Layers

### Layer 1 — Static Site (Required, Decentralized)
| Property | Value |
|---|---|
| Deployment | Cloudflare Pages (CDN edge, 300+ PoPs) |
| Fallback | Any static host: GitHub Pages, IPFS, Netlify, S3 |
| Domain dependency | Only the DNS entry; site functions at any IP |
| Central DB | **None** |
| Server-side logic | **None** |
| Build step | **None** — pure HTML/CSS/JS, zero bundler |

All HTML, CSS, JS files are served directly from CDN edge nodes. If Cloudflare ever blocked the domain, the site can be deployed identically on IPFS, GitHub Pages, or any file host with a domain swap.

### Layer 2 — Smart Contracts (Decentralized, Polygon)
| Property | Value |
|---|---|
| Chain | Polygon PoS (chainId 137) |
| Upgrade pattern | No proxy — contracts are immutable after deployment |
| Admin renounce | `renounce-admin.js` fully renounces DEFAULT_ADMIN_ROLE |
| Governance | SecurityCouncil multi-sig for all role changes |
| Censorship resistance | Any Polygon RPC endpoint works (Infura, Alchemy, public RPCs) |

The frontend reads contract state via `window.ethereum` (user's own wallet RPC). No proprietary API key required for read operations.

### Layer 3 — Cloudflare Worker Backend (Optional, Decentralized)
| Property | Value |
|---|---|
| File | `platform-backend/src/index.js` |
| DB | Cloudflare D1 (SQLite at edge) — **optional binding** |
| KV | Cloudflare KV for rate-limit nonces — **optional** |
| Required for | Epoch snapshots, claim previews, admin operations |
| Required for basic app | ❌ No — app works without it |

The backend is a **Cloudflare Worker** (serverless, runs at edge, no traditional server). It has no persistent process, no VPS, no container. D1 is a SQLite edge database — not a central DB server. If the Worker binding is missing, all features gracefully degrade to client-only mode.

**App features that work WITHOUT the backend:**
- All games (client-side JS only)
- All tools (client-side JS only)
- Vault profile (localStorage)
- Wallet connection (EIP-1193 provider)
- EONL loot mechanics (localStorage)
- Subscription status (localStorage + smart contract)
- P2P chat (Nostr relay-based, no central server)
- Pool Points earning & epoch system (localStorage)
- P2P token swap EONL/USD (signed codes + GunDB discovery)
- App version management (localStorage + service worker)
- NFT lootbox swaps (signed codes + GunDB P2P)

**App features that use the backend (optional enhancement):**
- Epoch snapshot reads
- Claim preview generation
- Admin epoch management
- Swap offer trust layer (Worker reconciliation for NFT swaps)

### Layer 4 — P2P Communication (Decentralized, Nostr)
| Property | Value |
|---|---|
| Protocol | Nostr (WebSocket relays) |
| Relays | Multiple public relays: `relay.peer.ooo`, `peer.wallie.io` |
| Central server | ❌ None — messages relay P2P |
| Censorship | Switch relay, same keys work everywhere |

### Layer 5 — Asset Storage (Decentralized, IPFS)
Game assets, images, and collectible metadata are designed for IPFS CID pinning. Static files served from Cloudflare CDN are always available as a hot cache fallback.

---

## Data Flow — Fully Client-Side

```
User Browser
├── localStorage (all profile data, vault, XP, loot, Pool Points, token swaps, versions)
├── sessionStorage (temporary state)
├── window.ethereum (user's own wallet, user's own RPC)
├── Nostr WebSocket (P2P chat, no central relay required)
├── GunDB (P2P swap offer discovery, no central server)
└── Cloudflare Pages CDN (static files, edge-served)
     └── Optional: Cloudflare Worker + D1 (epoch/claims/swap trust only)
```

**No user data ever touches a centralized database** unless the user explicitly opts into epoch claim submission (which requires the optional Worker backend).

---

## Security Properties

| Property | Status |
|---|---|
| No central auth server | ✅ (localStorage identity) |
| No passwords stored server-side | ✅ |
| No user tracking DB | ✅ |
| No mandatory API key | ✅ |
| Smart contract immutability | ✅ (no proxy pattern) |
| Admin renounce script | ✅ (`scripts/renounce-admin.js`) |
| CSP no unsafe-inline in script-src | ✅ |
| HMAC admin auth (Worker) | ✅ (SHA-256 + timestamp + nonce) |
| Rate limiter fail-closed | ✅ (DB error → deny, not allow) |
| CORS allowlist enforced | ✅ (no wildcard for mutation routes) |

---

## Smart Contract Deployment Checklist

1. `npx hardhat run scripts/deploy.js --network polygon` — deploy all 12 contracts
2. `npx hardhat run scripts/grant-roles.js --network polygon` — propose role grants via SecurityCouncil
3. `npx hardhat run scripts/verify-contracts.js --network polygon` — verify on Polygonscan
4. `npx hardhat run scripts/renounce-admin.js --network polygon` — **IRREVERSIBLE** deployer renounce

See `Smart Contracts/.env.example` for required environment variables.

---

## Performance Architecture

- **Zero build step** — HTML served directly, no webpack/bundler overhead
- **Preload hints** on all pages for CSS and primary JS module
- **fetchpriority="high"** on critical CSS
- **preconnect** to CDN and API origin on all pages
- **Service Worker** (`sw.js`) — offline-capable, cache-first for assets
- **Lazy loading** — tools/games load their JS only when page is visited
- **No external JS frameworks** — zero React/Vue/Angular overhead
- **PWA manifest** (`manifest.webmanifest`) — installable, standalone display

---

## Monetization Architecture

### Pool Points (Value-Independent Earning)

Users earn **Pool Points** (not direct EONL) through gameplay, tools, and creator activity. Pool Points determine each user's share of the EONL mint pool at epoch settlement. This decouples effort from EONL price volatility.

- **File**: `assets/js/utils/pool-points.js`
- **Subscription boost**: Free=1x, Spark=2x, Builder=3x, Pro=5x, Operator=5x
- **Epoch**: Weekly; Pool Points → EONL share at settlement

### P2P Token Swap (EONL ↔ USD)

User-to-user offchain exchange. No central orderbook. Makers set their own price (supply & demand). Uses signed offer codes + GunDB P2P discovery.

- **File**: `assets/js/utils/token-swap.js`
- **Direction**: `sell_eonl` (EONL→USD) or `buy_eonl` (USD→EONL)
- **Price discovery**: User-set, market-driven, no fixed rate
- **Settlement**: Signed codes → accept → receipt → redeem

### App Versioning

Version management with stable/beta/canary tracks. Users can switch versions and rollback.

- **File**: `assets/js/utils/app-versioning.js`
- **Service worker integration**: Cache invalidation on version switch

---

## Censorship Resistance

Even if:
- Cloudflare blocks the domain → redeploy to IPFS, GitHub Pages, or any CDN
- Cloudflare Worker is suspended → app works fully client-side
- Polygon RPC is throttled → user switches wallet to any other RPC
- Nostr relay is down → chat switches to another relay automatically

The app has **no single point of failure** that would make it permanently inaccessible as long as the domain or an IPFS CID is reachable.
