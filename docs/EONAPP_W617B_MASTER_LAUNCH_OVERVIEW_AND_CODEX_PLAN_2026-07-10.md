# EONAPP W617B — Master Launch Overview and Next Coding Plan

Date: 2026-07-10  
Current stage: source-validated local candidate, not deployed.

## What is now coded

### Monetization and referral UI truth

- W616B: EON Keys catalogue and referral unlock matrix.
- W616C: central locked-feature resolver.
- W616D: real UI surfaces for Projects, Workspace, Local AI, Automations and Vault.
- W617B: launch master plan, Dodo/Cloudflare proof contract and Codex handoff pack.

Current user-facing path stays:

1. Subscribe.
2. Trial where eligible.
3. Refer to earn EON Keys.
4. Use earned EON Key.

But all live actions remain off until server proof exists.

### Subscription tiers in source

- Free
- Plus
- Studio
- Power
- Max

Dodo product IDs are intentionally not hardcoded. They must be added as Cloudflare server/runtime secrets or server-readable config only after Dodo setup is approved.

### Referral decision in source

Current launch-safe rail:

- EON Keys unlock app capability/cosmetics.
- No cash reward.
- No wallet balance.
- No UPI/PayPal/crypto/gift-card payout.
- No NFT/token reward.
- No browser-only key grant.
- No renewal-discount or free-month grant from this source wave.
- Invitee coupon/discount can be a future separate Dodo coupon decision, but it is not active here.

### AI cost truth

EONAPP has no platform-paid hosted AI/image/video generation cost at launch. Users use local AI or their own provider/API keys. EON Keys unlock EONAPP workflow capability, not AI credits.

## What must be coded next

### W617C — Dodo server envelope, disabled by default

Build Cloudflare-safe server adapters but keep them inactive:

- product catalogue reader;
- checkout session endpoint shape;
- customer portal endpoint shape;
- signed webhook receiver shape;
- entitlement event normalizer;
- no live checkout unless environment and proof gates pass.

### W617D — entitlement + referral/EON Key ledger

Build server authority before activation:

- entitlement ledger schema;
- referral attribution ledger;
- webhook idempotency keys;
- duplicate event protection;
- 14-day retained-paid-referral check;
- abuse caps;
- no self-referral;
- no multi-level referral;
- no localStorage authority.

### W617E — browser/mobile proof sweep

Codex/local must capture proof for:

- `/`
- `/projects`
- `/library`
- `/workspace`
- `/local-ai`
- `/automations`
- `/vault`
- `/eon-keys`
- `/billing`
- `/eoncity`
- mobile drawer/menu;
- desktop sidebar;
- Vault backup/recovery boundary;
- locked-feature cards;
- local AI setup copy;
- PWA/offline behavior.

### W617F — Cloudflare deploy/canary/rollback proof

Codex/local or the owner must prove:

- Cloudflare Pages project: `eonapp-ch`;
- branch: `main`;
- build command: `npm run build`;
- output directory: `dist`;
- Node version: `22`;
- custom domain HTTPS active for `eonapp.ch`;
- Pages deployment id captured;
- build hash captured;
- route smoke proof captured;
- cache purge/rollback proof captured.

## Cloudflare owner setup checklist

### Now, before paid activation

- Keep billing mode disabled.
- Keep Dodo secrets out of frontend/Vite variables.
- Set Node 22 for Pages build.
- Confirm `npm run build` and `dist` output.
- Confirm `_headers` and `_redirects` deploy.
- Confirm custom domain HTTPS.

### Only after W617C/W617D server code exists

Add secrets/bindings in Cloudflare dashboard, not in source:

- `DODO_API_KEY`
- `DODO_WEBHOOK_SECRET`
- Dodo product IDs for Plus / Studio / Power / Max
- D1 or equivalent entitlement ledger binding
- D1 or equivalent referral/EON Key ledger binding
- idempotency storage binding

## Handover to Codex

Handover to Codex for deployment preparation after W617B package is applied. Codex must run the W617B command list and collect proof. Production deploy is allowed only after preview proof is green. Paid activation is allowed only after Dodo checkout/webhook/entitlement proof and referral-ledger proof are green.
