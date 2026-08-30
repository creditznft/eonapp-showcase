# EONAPP.CH — End-to-End Launch Checklist
**Created:** 2026-05-11 · **Scope:** Full user journey, security, blockchain, AI, trading, auth  
**Status:** 🟢 Ready for QA  
**Previous audits:** GPT-5.4 · Sonnet · Gemini 3.1 Pro  

---

## HOW TO USE THIS CHECKLIST

Each item has a status cell. Fill it during QA:
- `✅ PASS` — tested and working  
- `❌ FAIL` — broken, log issue  
- `⚠️ WARN` — works with caveat  
- `⏭️ SKIP` — intentionally skipped (add reason)  

---

## SECTION 1 — NEW USER ONBOARDING

### 1.1 Landing & First Impression
| # | Test | Status |
|---|------|--------|
| 1.1.1 | `index.html` loads in < 3s on mobile 4G | |
| 1.1.2 | Hero copy reads "EON · Earn, Create, Own" (not old placeholder) | |
| 1.1.3 | "Signal Market Research" stat label is correct (not "Signal Trading Module") | |
| 1.1.4 | No broken images; all hero/card assets load | |
| 1.1.5 | CTA buttons link to correct destination pages | |
| 1.1.6 | Footer links all resolve (no 404) | |
| 1.1.7 | Site shell nav renders with: Home, Market, Marketplace, Vault, Signal, Chat | |
| 1.1.8 | "Market" nav links to `/market.html` (not `/marketplace.html`) | |
| 1.1.9 | "NFT Exchange" footer link goes to `/marketplace.html` | |

### 1.2 Identity Creation (Wallet / Nostr Key)
| # | Test | Status |
|---|------|--------|
| 1.2.1 | New visitor sees identity prompt / wallet creation UI | |
| 1.2.2 | Clicking "Create Identity" generates a Nostr keypair | |
| 1.2.3 | Private key stored as `eon:identity:v1` in localStorage (NOT sessionStorage) | |
| 1.2.4 | Public key shown to user; copy button works | |
| 1.2.5 | Profile name + avatar can be set on first run | |
| 1.2.6 | Profile persists after full browser refresh | |
| 1.2.7 | Returning visitor: identity auto-loaded; no re-prompt | |

### 1.3 Subscription Tier
| # | Test | Status |
|---|------|--------|
| 1.3.1 | Default tier assigned on new account (Free) | |
| 1.3.2 | `eon:entitlements:v1` written to localStorage after tier assignment | |
| 1.3.3 | Free tier enforces AI token budget (maxOutputTokens cap visible) | |
| 1.3.4 | Pricing page at `/pricing.html` loads without error | |

---

## SECTION 2 — AUTHENTICATION & PERSISTENCE

> **Note:** EONAPP uses wallet-based identity — no username/password. "Auth" = key derivation + profile load.

| # | Test | Status |
|---|------|--------|
| 2.1 | Private key survives: tab close + reopen | |
| 2.2 | Private key survives: browser restart | |
| 2.3 | Private key survives: hard refresh (Ctrl+F5) | |
| 2.4 | sessionStorage variant (`eon:identity:session`) only used for guest/ephemeral mode | |
| 2.5 | Clearing localStorage resets identity (expected behaviour) | |
| 2.6 | Two tabs: same identity loaded in both | |
| 2.7 | ApiKeyVault passphrase is derived from Nostr private key (device-bound) | |
| 2.8 | ApiKeyVault data (`eon:api-key-vault:v1`) is ciphertext in localStorage (not plaintext) | |

---

## SECTION 3 — AI FEATURES

### 3.1 WorkBench (`/workbench.html`)
| # | Test | Status |
|---|------|--------|
| 3.1.1 | Page loads; no console errors | |
| 3.1.2 | AI model selector shows available models | |
| 3.1.3 | Sending a prompt returns a response | |
| 3.1.4 | Long responses render without UI overflow | |
| 3.1.5 | User HTML in AI responses is DOMPurify-sanitized (no XSS) | |
| 3.1.6 | Session history maintained during session | |
| 3.1.7 | History cleared after session (AI model keys are sessionStorage-only — CEO policy) | |
| 3.1.8 | Free tier hits budget cap and shows upgrade prompt | |

### 3.2 AI Chat Widget (global, `eon-chat-widget`)
| # | Test | Status |
|---|------|--------|
| 3.2.1 | Chat bubble visible on all pages (or defined pages only — document which) | |
| 3.2.2 | Opens/closes without JS error | |
| 3.2.3 | Sends message and receives response | |
| 3.2.4 | Does not duplicate: second open doesn't spawn second widget | |

### 3.3 AI Chat Page (`/chat.html`)
| # | Test | Status |
|---|------|--------|
| 3.3.1 | Page loads; no console errors | |
| 3.3.2 | Model picker works | |
| 3.3.3 | Message history scrolls properly | |
| 3.3.4 | Clear history button works | |

### 3.4 Free AI Power (`/get-free-ai-power.html`)
| # | Test | Status |
|---|------|--------|
| 3.4.1 | Page loads without error | |
| 3.4.2 | Device keys stored in `sessionStorage` (NOT localStorage) — SEC-02 fix | |
| 3.4.3 | Keys wipe when tab closes (expected; no regression) | |

---

## SECTION 4 — SIGNAL PAGE (AI Market Intelligence + Trading)

### 4.1 Core Signal Features
| # | Test | Status |
|---|------|--------|
| 4.1.1 | `/signal.html` loads without error | |
| 4.1.2 | Hero badge reads "EON Signal · AI Market Intelligence" | |
| 4.1.3 | Risk disclaimer amber block (`.sg-risk-notice`) is visible | |
| 4.1.4 | CoinGecko price data loads (or graceful offline fallback) | |
| 4.1.5 | Watchlist: add/remove ticker; persists across refresh | |
| 4.1.6 | AI market research: prompt→response cycle works | |
| 4.1.7 | Saved research list loads; items can be deleted | |

### 4.2 Trading API Setup (ApiKeyVault — KEY FEATURE)
| # | Test | Status |
|---|------|--------|
| 4.2.1 | Trading panel opens | |
| 4.2.2 | Exchange selector shows Binance / Coinbase / Kraken | |
| 4.2.3 | Enter API key + secret → click Save → confirmation shown | |
| 4.2.4 | After save: `eon:api-key-vault:v1` in localStorage contains **ciphertext** (not plaintext key) | |
| 4.2.5 | Refresh page → saved creds auto-populated (keys persist across session) | |
| 4.2.6 | Open new tab → creds still available (localStorage persistent — not sessionStorage) | |
| 4.2.7 | Clear creds → fields empty; localStorage vault entry updated | |
| 4.2.8 | Portfolio fetch uses stored creds; no plaintext key visible in network log | |
| 4.2.9 | "AI Signal with Portfolio" suggestion works; uses awaited async creds | |
| 4.2.10 | Trading panel disclaimer visible: AI-only; no auto-execution | |

---

## SECTION 5 — VAULT (`/vault.html`)

| # | Test | Status |
|---|------|--------|
| 5.1 | Page loads; user profile shown (name, avatar, wallet address) | |
| 5.2 | "Market" nav link points to `/market.html` | |
| 5.3 | Quick link "Market" on page also goes to `/market.html` | |
| 5.4 | "Why on-chain?" 4-card section is visible below main content | |
| 5.5 | NFT collection loads (or empty state if no NFTs) | |
| 5.6 | Pool points / XP balance displayed | |
| 5.7 | Anchoring action (if available) prompts MetaMask | |
| 5.8 | Transfer NFT flow: wallet connect → sign → confirmation | |
| 5.9 | Vault data loads from P2P/local storage; no blank state on refresh | |

---

## SECTION 6 — MARKET & MARKETPLACE

### 6.1 Market (`/market.html` — Creator Storefront)
| # | Test | Status |
|---|------|--------|
| 6.1.1 | Page loads; template/agent listings visible | |
| 6.1.2 | Search/filter works | |
| 6.1.3 | Clicking a listing shows detail view | |
| 6.1.4 | Purchasing flow initiates correct contract interaction | |

### 6.2 NFT Exchange (`/marketplace.html`)
| # | Test | Status |
|---|------|--------|
| 6.2.1 | Page loads; NFT listings visible | |
| 6.2.2 | Filter by collection works | |
| 6.2.3 | Clicking NFT shows detail: image, traits, price | |
| 6.2.4 | Buy flow → wallet connect → MetaMask tx → confirmation toast | |
| 6.2.5 | List NFT flow: approve + list transaction sequence | |

---

## SECTION 7 — BLOCKCHAIN INTERACTIONS

### 7.1 Wallet Connection
| # | Test | Status |
|---|------|--------|
| 7.1.1 | "Connect Wallet" prompts MetaMask (or WalletConnect) | |
| 7.1.2 | Connecting on wrong chain → auto-prompt to switch to Polygon (chainId 137 / 0x89) | |
| 7.1.3 | Chain switch succeeds; confirmation shown | |
| 7.1.4 | Wallet address displayed after connect | |
| 7.1.5 | Disconnect: wallet address cleared from UI | |

### 7.2 RPC Failover
| # | Test | Status |
|---|------|--------|
| 7.2.1 | Primary RPC (`publicnode.com`) responds to eth_blockNumber | |
| 7.2.2 | If primary fails, `community-triggers.js` auto-tries `polygon-rpc.com` | |
| 7.2.3 | If both fail, tries `ankr.com/polygon` | |
| 7.2.4 | `contracts-config.js` rpcUrls array has 3 entries | |
| 7.2.5 | Simulated offline: no uncaught rejection crashes the page | |

### 7.3 Contract Reads
| # | Test | Status |
|---|------|--------|
| 7.3.1 | EON token balance loads for connected wallet | |
| 7.3.2 | Staking pool data loads (APY, TVL) | |
| 7.3.3 | Governance stage readable without wallet | |

### 7.4 Contract Writes (Transactions)
| # | Test | Status |
|---|------|--------|
| 7.4.1 | Staking: approve + stake tx sequence; receipt confirmed | |
| 7.4.2 | Unstake: tx signed; tokens returned | |
| 7.4.3 | Claim rewards: tx signed; reward shown in wallet | |
| 7.4.4 | Failed tx: UI shows error message (not blank) | |

---

## SECTION 8 — CREATOR STUDIO (`/creator-studio.html`)

| # | Test | Status |
|---|------|--------|
| 8.1 | Page loads; no console errors | |
| 8.2 | Upload asset: file picker opens; file accepted | |
| 8.3 | Asset metadata form fills and validates | |
| 8.4 | Publish flow: IPFS pin + on-chain anchor tx | |
| 8.5 | Published asset appears in Market listing | |
| 8.6 | Edit/delete published asset works | |
| 8.7 | Admin wallets: publish bypasses AI moderation (0% fee) | |

---

## SECTION 9 — REALM CREATION

| # | Test | Status |
|---|------|--------|
| 9.1 | Realm creation UI accessible (from vault or nav) | |
| 9.2 | Fill realm name, description, banner | |
| 9.3 | Create Realm → MetaMask tx → confirmation | |
| 9.4 | Realm listed in vault after creation | |
| 9.5 | Realm land parcel shown on map/grid | |
| 9.6 | Transfer realm: `ownerWallet` field updated (migration-safe) | |

---

## SECTION 10 — OFFLINE & SERVICE WORKER

| # | Test | Status |
|---|------|--------|
| 10.1 | Service worker registers on first load | |
| 10.2 | Going offline: cached pages served from SW cache | |
| 10.3 | `offline.html` displays when uncached page requested offline | |
| 10.4 | `offline.html` has NO inline `<style>` (CSP violation fixed) | |
| 10.5 | `offline.html` links to `assets/css/base.css` correctly | |
| 10.6 | Coming back online: pages auto-refresh or show toast | |

---

## SECTION 11 — ADMIN SURFACE (`/admin.html`)

| # | Test | Status |
|---|------|--------|
| 11.1 | `admin.html` responds 200; UI renders | |
| 11.2 | `X-Robots-Tag: noindex, nofollow, noarchive` header present | |
| 11.3 | `Cache-Control: no-cache` header present | |
| 11.4 | Non-admin wallet: access denied / limited view | |
| 11.5 | Admin wallet: operator controls visible | |
| 11.6 | HMAC-signed API requests reach `/api/v1/admin/*` correctly | |
| 11.7 | Admin actions create audit log entry | |

---

## SECTION 12 — SECURITY CHECKS

### 12.1 CSP (Content Security Policy)
| # | Test | Status |
|---|------|--------|
| 12.1.1 | No CSP violations in browser console on any page | |
| 12.1.2 | No inline `style=` mutations from JavaScript | |
| 12.1.3 | All dynamic styles use CSS classes (not `el.style.cssText`) | |
| 12.1.4 | `offline.html` has no inline `<style>` block | |
| 12.1.5 | DOMPurify loaded from npm bundle — NOT CDN script tag (CSP-safe) | |

### 12.2 Key Storage Audit
| # | Test | Status |
|---|------|--------|
| 12.2.1 | Exchange API keys: `eon:api-key-vault:v1` → **ciphertext** in localStorage | |
| 12.2.2 | AI provider keys: in `sessionStorage` only (wipe on tab close — CEO policy) | |
| 12.2.3 | Nostr identity: `eon:identity:v1` in localStorage (persistent — expected) | |
| 12.2.4 | No plaintext API keys in any `localStorage` entry | |
| 12.2.5 | Device AI keys (`eon:ai-chat-device-keys:v1`) → sessionStorage only (SEC-02) | |

### 12.3 XSS & Injection
| # | Test | Status |
|---|------|--------|
| 12.3.1 | DOMPurify sanitizes AI response HTML before `innerHTML` | |
| 12.3.2 | DOMPurify is bundled (no CDN fallback) — no single-point-of-failure | |
| 12.3.3 | User-supplied content (names, descriptions) sanitized before render | |
| 12.3.4 | No `eval()` or `new Function()` in production bundle | |

### 12.4 Network & Headers
| # | Test | Status |
|---|------|--------|
| 12.4.1 | HSTS header present: `Strict-Transport-Security` | |
| 12.4.2 | `X-Frame-Options: DENY` (or `frame-ancestors 'none'` in CSP) | |
| 12.4.3 | `X-Content-Type-Options: nosniff` | |
| 12.4.4 | CORS: no wildcard `*` on auth/admin endpoints | |
| 12.4.5 | `/reward-access.html`: `X-Robots-Tag: noindex, nofollow` | |

---

## SECTION 13 — PERFORMANCE & BUILD

| # | Test | Status |
|---|------|--------|
| 13.1 | `npm run build` exits 0 — no errors | |
| 13.2 | `npm run lint` — 0 errors (warnings only) | |
| 13.3 | `npm run smoke:build` — 25/25 checks pass | |
| 13.4 | Largest JS bundle < 500 KB gzip (workbench ~60 KB gzip ✅) | |
| 13.5 | Lighthouse Performance ≥ 80 on index.html | |
| 13.6 | Lighthouse Accessibility ≥ 90 on index.html | |
| 13.7 | Skip links present and functional (keyboard navigation) | |
| 13.8 | No duplicate skip-link injection (guard in site-shell.js) | |
| 13.9 | `lootbox`, `wallet`, `credits`, `xp` loaded as dynamic imports (no raw src in dist) | |

---

## SECTION 14 — PLAYWRIGHT E2E TESTS

| # | Test | Status |
|---|------|--------|
| 14.1 | `npm run test` (Playwright) — 171 tests pass, ≤ 2 skipped | |
| 14.2 | No new test failures introduced by this session's changes | |
| 14.3 | signal-page tests pass (async ApiKeyVault changes) | |
| 14.4 | Offline page test passes (no inline style) | |

---

## SECTION 15 — CLOUDFLARE PAGES DEPLOYMENT

| # | Test | Status |
|---|------|--------|
| 15.1 | Push to `main` triggers Cloudflare build | |
| 15.2 | Cloudflare build succeeds (no build error) | |
| 15.3 | `https://eonapp.ch` serves updated content within 5 min | |
| 15.4 | All `_headers` rules active (verify via curl or browser DevTools) | |
| 15.5 | No 404s on primary pages: index, vault, signal, market, marketplace, chat | |
| 15.6 | HTTPS enforced; HTTP redirects to HTTPS | |
| 15.7 | CSP header present on live domain | |

---

## CRITICAL INVARIANTS (Never Regress)

| Rule | Enforced By |
|------|-------------|
| Exchange API keys → AES-256-GCM encrypted via `ApiKeyVault` | `signal-page.js` |
| AI model keys → `sessionStorage` only (wipe on close) | `ai-runtime.js` + CEO policy |
| `market.html` = Creator storefront / templates / agents | `site-shell.js` CORE_NAV |
| `marketplace.html` = NFT Exchange | footer + nav |
| Trading: live features WITH amber disclaimer | `signal.html` + `.sg-risk-notice` |
| Admin: `noindex,nofollow` in `_headers` X-Robots-Tag | `_headers` |
| CSP: No `unsafe-inline`, no `style.cssText` mutations | `_headers` + code review |
| Reward scripts: dynamic `import()` only | `site-shell.js` |
| DOMPurify: bundled via npm, not CDN | `dompurify-sanitizer.js` |
| Polygon RPC: 3 fallback endpoints | `contracts-config.js` + `community-triggers.js` |

---

## SIGN-OFF

| Role | Name | Date | Signature |
|------|------|------|-----------|
| CEO / Founder | | | |
| CTO | | | |
| QA Lead | | | |
| Security Lead | | | |

**Overall Status:** `[ ] APPROVED FOR PRODUCTION` `[ ] BLOCKED — see issues`

---

_End of E2E Launch Checklist_
