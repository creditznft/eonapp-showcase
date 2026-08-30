# EONAPP — W617A Master Launch and Codex Plan

Date: 2026-07-10
Current baseline: W617A Shell Launch Readiness, continuing from W616D Locked Feature Surfaces
Canonical origin: `https://eonapp.ch`

## Current product truth

EONAPP is a chat-first AI creation workspace with EONBOT at the root, Projects, Library, Forge, Local AI, Workspace, Automations, Vault, EON City and EON Keys.

Payments and rewards are still intentionally disabled in source after W617A. The current safe monetization path is UI-and-policy ready only:

1. Subscribe.
2. Trial where eligible.
3. Refer to earn EON Keys.
4. Use an earned EON Key.

EON Keys unlock EONAPP capability. They are not AI credits and not money-like value. EONAPP has no platform-paid AI/image/video generation cost at launch; users use local AI or their own API keys.

## Coded and validated through W617A

### W616B — EON Keys referral unlocks

- Non-cash EON Key catalogue.
- Tier mapping across Plus / Studio / Power / Max.
- Referral matrix grants app capability only, not cash, crypto, wallet balance, NFT, payout, free-month or renewal-discount value.
- EON Keys page exists but live grants remain disabled.

### W616C — Locked feature resolver

- Central resolver for locked feature decisions.
- 13 locked-feature examples across Plus / Studio / Power / Max.
- Resolver always shows Subscribe / Trial / Refer / Use Key paths.
- Dodo checkout, trial activation, key grants and browser entitlement unlocks remain disabled.

### W616D — Locked feature surfaces

- Resolver wired into real surfaces:
  - `/projects`
  - `/workspace`
  - `/local-ai`
  - `/automations`
  - `/vault`
- All cards keep disabled markers:
  - `data-commercial-active="false"`
  - `data-checkout-active="false"`
  - `data-live-grant-active="false"`
  - `data-browser-unlock-allowed="false"`

### W617A — Shell launch readiness

- Closed mobile drawer is now inert, not just offscreen or `aria-hidden`.
- Main content is inert only while the mobile drawer is open.
- Desktop sidebar remains available and never inherits mobile hiding.
- Legacy bottom navigation colors were hardened for contrast.
- Added `qa:w617a-shell-launch-readiness`.

## Next coding sequence I recommend

### W617B — Billing server envelope, disabled by default

Build the Cloudflare Pages Functions shape without activating checkout:

- `GET /api/billing/me`
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /dodo/webhook`

Rules:

- All routes return safe disabled/test-mode responses unless `EON_BILLING_MODE` is explicitly set.
- No browser secret.
- No client-side entitlement authority.
- Raw webhook body must be preserved for signature verification.
- Idempotency key required for every payment event.
- No entitlement changes until webhook verification + database write + anti-abuse gate pass.

### W617C — Subscription catalogue lock

Lock the server-readable plan catalogue:

- Free
- Plus
- Studio
- Power
- Max

Rules:

- Minimum monthly price stays at or above USD 5.
- No exact live public price until Dodo products are approved and entered.
- Catalogue separates feature limits from billing processor IDs.
- UI never calculates authoritative entitlement from browser data.

### W617D — Referral ledger and EON Key server model

Build the data model before activation:

- invite code table;
- referral event table;
- payment-retention check;
- 14-day no-refund/no-dispute maturation;
- annual reward cap;
- one active reward at a time;
- no self-referral;
- no multi-level referral;
- no click/signup/free-trial rewards.

Launch decision preserved:

- Invitee: 20% off first monthly plan.
- Inviter: EON Key feature unlock path first; earlier renewal-discount/free-month wording must stay disabled unless the CEO re-approves it later.
- No cash, UPI, PayPal, crypto, wallet, NFT or gift-card reward.

### W617E — Server entitlement read path

Connect UI to server truth only:

- `/api/billing/me` reads verified entitlement state.
- UI displays current plan / locked features / key inventory from server response.
- Browser can cache display state but cannot unlock capability.
- Dodo webhook is the only payment authority.

### W617F — Dodo test-mode proof

Only after W617B–E pass:

- Create Dodo test products.
- Create test checkout session.
- Verify webhook signature.
- Process subscription created / renewed / canceled / refunded / disputed events.
- Confirm cancellation/self-service portal.
- Confirm duplicate webhook idempotency.
- Confirm no entitlement survives a refund/dispute.

### W617G — Full app certification

Run all-app proof, not just monetization:

- root EONBOT and `/chat`;
- Projects / Library / Workspace / Forge;
- Local AI setup and self-test;
- Vault backup and restore preview;
- EON Keys page;
- EON City guest preview and authenticated heavy route;
- PWA install/offline behavior;
- mobile drawer, desktop sidebar, keyboard and reduced motion;
- Lighthouse desktop/mobile;
- Cloudflare preview and production route proof;
- data survival across deploy;
- rollback proof;
- secret scan.

## Cloudflare setup checklist for owner before production activation

### Pages project

- Project: `eonapp-ch`.
- Production branch: main.
- Build command: `npm run build` after install.
- Output directory: `dist`.
- Node version: 22.

### Required non-secret environment variables

- `NODE_VERSION=22`
- `EON_BILLING_MODE=disabled` until test mode is ready.
- `EON_PUBLIC_ORIGIN=https://eonapp.ch`

### Required secrets only when W617B+ billing code is merged

- `DODO_PAYMENTS_API_KEY`
- `DODO_WEBHOOK_SECRET`
- Dodo product/price IDs for Plus / Studio / Power / Max after product approval.

### Bindings only when server ledgers are implemented

- D1 database for billing/referral/entitlement ledgers.
- KV or D1 idempotency store for webhook event IDs.
- No entitlement or key-grant authority in LocalStorage.

### GitHub / CI before deployment

Codex should run:

```bash
npm ci
npm run qa:w617a-shell-launch-readiness
npm run qa:w616d-locked-feature-surfaces
npm run qa:w616c-locked-feature-resolver
npm run qa:w616b-eon-keys-referral
npm run lint -- --max-warnings=0
npm run build
npm run launch:readiness
```

Then Codex should open a Cloudflare preview URL and collect browser proof for the core app routes before production promotion.

## Handover-to-Codex stage

Do not hand to Codex for production deployment yet if only source tests are green.

Hand to Codex for deploy preparation after:

1. W617B disabled billing envelope exists and passes tests.
2. W617C plan catalogue is locked.
3. W617D referral/key ledger schema exists but remains inactive.
4. W617E server entitlement read path is wired read-only.
5. W617A shell + W616B/C/D monetization UI regressions pass.
6. `npm run lint -- --max-warnings=0` passes.
7. `npm run build` passes.
8. `npm run launch:readiness` passes.

Hand to Codex for production deploy only after preview proof:

- no console errors on core routes;
- mobile drawer proof;
- desktop sidebar proof;
- locked premium gates proof;
- Vault backup surface proof;
- Local AI setup proof;
- City guest/auth lane proof;
- Cloudflare Functions disabled-mode proof;
- rollback plan captured.

## Owner decisions still needed before live billing

- Confirm final public plan names: Plus / Studio / Power / Max.
- Enter Dodo product IDs after Dodo account/product approval.
- Decide whether invitee discount is still 20% off first monthly plan.
- Decide whether inviter reward remains EON Keys only for launch, or whether a later renewal discount/extra-days path is re-approved after legal/tax review.
- Approve Terms, Privacy, Refund/Cancellation, Contact/Support and abuse policy copy before checkout goes live.

## Final launch gate

A production launch is allowed only when all of these are true:

- payment lifecycle is proved in test mode;
- webhook signature and idempotency are proved;
- entitlements are server-side only;
- cancellation/refund/dispute reversal works;
- referral maturation waits 14 days after payment and fails closed on refund/dispute;
- all critical app routes pass browser proof;
- mobile and desktop shell proof is captured;
- local data survives Cloudflare deploy;
- rollback is tested;
- owner gives explicit production GO.
