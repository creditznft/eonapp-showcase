# EONAPP Wave 05 — Public UX + Conversion Funnel Audit
Date: 2026-06-02  
Workspace base: `EONAPP_WAVE5_NOWPAYMENTS_REMEDIATION_PATCH_20260602.zip`  
Output workspace: `EONAPP_WAVE05_PUBLIC_UX_FUNNEL_PATCH_20260602.zip`

## Executive CEO decision
EONAPP should not add more new product surfaces before launch. The public funnel now needs to become simple, honest, and conversion-ready:

**Homepage → Start free → EONBOT / Onboarding → Cockpit / Vault → Plans → Verified payment → Access.**

The core product story is strong, but it was being diluted by too many surfaces appearing equal in the top-level navigation. The Wave 05 patch makes the public surface more coherent without removing ambitious features.

## Launch readiness score after Wave 05
- Previous public UX/funnel score: **6.7 / 10**
- Current public UX/funnel score: **7.7 / 10**
- Overall launch readiness estimate after Wave 05: **7.8 / 10**

This is still not final launch signoff. The product is now clearer, but live deploy/payment proof and deeper product-surface audits remain.

## Public live-site spot-check before patch
Observed live production pages before this local patch:

- Homepage already had a strong AI business cockpit story and visible routes for AI Cockpit, AI Chat, Trade, Vault, Market, and Realm.
- Chat page was too thin as a first impression: it mostly showed a compact EONBOT header and chat controls without a strong onboarding/conversion explanation.
- Vault was deep and differentiated, but very dense.
- Market and Realm needed stronger beta/status framing so users do not mistake incomplete monetization surfaces for fully mature commerce.

## Major UX problems found

### 1. Funnel was not explicit enough
The homepage had a good vision, but it did not make the free-to-paid path obvious enough. Users need to know:
- they can start free,
- they do not need a credit card for first value,
- they can bring their own AI keys,
- paid plans are for serious long-term usage,
- payment verification is strict.

### 2. Pricing was not in the main navigation
The app is now payment-enabled, but the global nav did not include a clear Plans entry. This makes conversion weaker and hides the product’s commercial path.

### 3. Chat first impression was too thin
The chat route is one of the most important entry points. It needed a visible explanation of what EONBOT does and what to try first.

### 4. Realm had no visible H1
Realm is important for public profile/storefront positioning, but the page began directly with editor controls. This is weak for SEO, accessibility, and product clarity.

### 5. Market overpromised maturity
Market language implied live buying/selling more strongly than the current launch state deserves. It should ship as a curated beta until seller controls, payment proof, dispute handling, and listing policy are fully tested.

### 6. Onboarding still sounded like account signup in places
EONAPP’s core promise is local-first/decentralized. Onboarding copy now needs to reinforce: no central account is required.

### 7. About page had unprofessional internal-audit wording
The phrase “not a fake AI site” is useful internally but not appropriate for a public page. Wave 05 replaced that with more professional positioning.

## Code and copy changes made

### Global navigation
Patched standard public headers to add:
- `Plans` → `/subscription`

This improves conversion and makes the payment path discoverable from major surfaces.

### Homepage — `index.html`
Changed hero positioning from a broad “all-in-one workspace” pitch into a clearer free-to-paid product flow:
- new kicker: “Local-first AI cockpit for builders, creators, and operators”
- primary CTA: `Start free`
- secondary CTAs: `Open AI Cockpit`, `See plans`
- added a new “Launch path” section:
  - Free: try the cockpit
  - Paid: upgrade for serious use
  - Trust: keep control
- improved final CTA to route users toward Chat and Plans.

### Chat — `chat.html`, `assets/css/chat.css`
Added a visible conversion/onboarding layer above the chat:
- page-level H1
- clear explanation of guide mode and provider/local-runtime upgrade path
- starter prompt chips:
  - launch a simple website
  - set up AI keys safely
  - explain Vault backup
  - make a 7-day content plan
- CTAs to Ask EONBOT, Start free setup, and Plans.

Adjusted chat layout so the new panel does not break the chat container.

### Onboarding — `onboarding.html`
Reworded onboarding to emphasize:
- local Vault identity,
- optional AI key,
- recovery kit,
- no central account required.

Changed the Google helper section so it does not look like required account login.

### Market — `market.html`, `assets/css/market.css`
Reframed Market as a beta surface:
- “Creator Market Beta”
- “Browse Beta Catalog”
- “Build Your Realm” instead of immediate sell-first framing
- added launch note:
  - keep paid seller listings gated until payment proof, dispute handling, and seller policy pass launch testing.

### Realm — `realm.html`, `assets/css/realm.css`
Added a proper top hero:
- H1: “Build your public AI profile and storefront.”
- explanation of Realm as Vault identity + creator offers + NFTs + referrals + public proof
- CTAs to Edit Realm, Market, and Vault.

### Subscription — `subscription.html`, `assets/css/subscription.css`
Improved pricing hero:
- “Choose your EONAPP plan”
- clearer primary/fallback payment rail distinction
- trust strip:
  - Verified IPN only
  - No card launch
  - 30-day access windows
  - Direct EVM fallback

### About — `about.html`
Rewrote internal/prototype wording into launch-safe public copy:
- operator cockpit positioning
- free onboarding + paid subscriptions
- EONBOT starts local-first and routes into user-provided providers/local runtimes.

### i18n — `assets/js/utils/multi-language.js`
Updated English keys that would otherwise overwrite the new homepage/onboarding/market copy at runtime.

## Files changed
- `index.html`
- `chat.html`
- `onboarding.html`
- `market.html`
- `realm.html`
- `subscription.html`
- `about.html`
- many public HTML headers received a `Plans` nav link
- selected public footer navs received legal/support link improvements
- `assets/css/chat.css`
- `assets/css/home.css`
- `assets/css/market.css`
- `assets/css/realm.css`
- `assets/css/subscription.css`
- `assets/js/utils/multi-language.js`

## Validation run in this environment
Build/deploy was intentionally not run here. The following repo-owned checks were run:

| Check | Result |
|---|---|
| `node --check assets/js/utils/multi-language.js` | Pass |
| `node --check assets/js/onboarding-page.js` | Pass |
| `node --check assets/js/chat-page.js` | Pass |
| `node --check assets/js/market-page.js` | Pass |
| `node --check assets/js/realm-page.js` | Pass |
| `node scripts/site-audit.mjs` | Pass — 51 HTML files scanned |
| `node scripts/launch-page-invariants.mjs` | Pass — 0 blockers / 0 warnings |
| `node scripts/launch-readiness.mjs` | Pass — 0 blockers / 0 warnings |
| `node scripts/secret-scan.mjs --mode=workspace` | No diff available; skipped by script |

## CEO decisions

### Decision 1 — Keep homepage simple
Do not turn the homepage into a huge feature list. It should remain the front door:
- Start free
- Ask EONBOT
- Open Cockpit
- See Plans

### Decision 2 — Treat Market as beta
Do not launch paid community seller listings until payments, seller policy, dispute handling, listing moderation, and support are ready.

### Decision 3 — Realm is a storefront, not just settings
Realm needs to be presented as a product surface. The new hero makes it understandable before users see the editor controls.

### Decision 4 — Keep Chat as the main low-friction entry
EONBOT should be the friendly entry, but it must explain what it can do before the empty chat box appears.

### Decision 5 — No central account language
EONAPP should consistently say local-first Vault identity, optional email for NOWPayments subscriptions, optional external accounts only when users choose integrations.

### Decision 6 — Plans must stay visible
A paid product cannot hide pricing. Plans should remain in the global nav.

## Remaining blockers after Wave 05

### Blocker A — live production not updated
The public live site still reflects the older deployed version until this workspace is deployed.

### Blocker B — actual NOWPayments live proof still required
The UX can explain the payment path, but launch signoff still requires:
- add `NOWPAYMENTS_API_KEY`,
- deploy,
- create $1 email subscription flow,
- capture real IPN payload,
- prove entitlement activation.

### Blocker C — Market seller policy still missing
Legal pages exist, but a specific Market seller/listing policy is still needed before paid seller marketplace features.

### Blocker D — Ads and sponsor placement need final business decision
Homepage and chat still include ad slots. Before launch, decide whether ads are enabled for free users, paid users, or only non-sensitive pages.

### Blocker E — Full mobile visual QA not run here
The patches are CSS-safe and audit scripts pass, but mobile viewport visual QA must happen after deploy or local serve.

## Next recommended waves

The previous roadmap numbering got confused because NOWPayments remediation was done as an emergency Wave 5A. From here forward, use the revised roadmap file:

- Wave 06 — Vault + identity + privacy deep audit
- Wave 07 — AI runtime, Cockpit, Chat, and agent orchestration audit
- Wave 08 — NFT, collectibles, Market, and Realm deep audit
- Wave 09 — PWA, SEO, accessibility, mobile, and performance audit
- Wave 10 — Trading, wallet, rewards, token, and financial-risk audit
- Wave 11 — Tests, CI/CD, Cloudflare deploy runbook, and live-payment proof plan
- Wave 12 — Final CEO launch signoff

## Next-session prompt
Start Wave 06 from `EONAPP_WAVE05_PUBLIC_UX_FUNNEL_PATCH_20260602.zip`. Audit Vault, local identity, backup/restore, recovery phrase, localStorage claims, API-key storage, entitlement portability, privacy wording, and any mismatch between what Vault claims and what the code can actually guarantee. Patch safe issues and create `EONAPP_WAVE06_VAULT_IDENTITY_PRIVACY_AUDIT_2026-06-02.md` plus a new workspace backup if code changes are made.
