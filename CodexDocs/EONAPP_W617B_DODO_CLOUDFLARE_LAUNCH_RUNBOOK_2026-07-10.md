# EONAPP W617B Dodo + Cloudflare Launch Runbook

Date: 2026-07-10  
Mode: generated source runbook; no deploy, checkout, webhook, trial, referral grant or EON Key redemption was performed.

## Current launch decision

- Stage: **code-complete-local-candidate-not-deployed**
- Broad launch: **no-go-until-codex-cloudflare-browser-and-server-proof**
- Soft launch path: allowed only after source QA, browser/mobile proof, Cloudflare deploy proof and an explicit CEO note; paid activation may still remain off.
- Paid activation now: **off**
- Referral/EON Key grants now: **off**
- Platform-paid AI/image/video generation: **off**

## Completed coding waves

- W616B — EON Keys referral unlock catalogue (qa:w616b-eon-keys-referral)
- W616C — Locked feature resolver (qa:w616c-locked-feature-resolver)
- W616D — Locked feature cards on real surfaces (qa:w616d-locked-feature-surfaces)
- W617A — Shell/sidebar/menu launch readiness (qa:w617a-shell-launch-readiness)
- W617B — Launch master plan and Codex/Cloudflare deploy contract (qa:w617b-launch-master-plan)

## Next coding / proof waves

| Wave | Name | Stage | Boundary |
| --- | --- | --- | --- |
| w617c | Dodo and entitlement server contracts | next-code | No checkout session creation and no live entitlement grant until Dodo sandbox/live webhook proof and a server ledger are verified. |
| w617d | Referral/EON Key ledger contract | next-code | No key balance may be trusted from localStorage or query parameters. |
| w617e | Whole-app browser and mobile visual proof | external-proof | ChatGPT container browser proof is not enough if Chromium is policy-blocked or not authenticated. |
| w617f | Cloudflare deploy, canary and rollback proof | deploy-proof | Do not enable paid CTAs, trials or redemption until deploy proof and server proof are both captured. |

## Subscription plan

- Free: $0/month / ₹0/month, checkoutActive=false, Dodo product required=false
- Plus: $5.99/month / ₹499/month, checkoutActive=false, Dodo product required=true
- Studio: $14.99/month / ₹1499/month, checkoutActive=false, Dodo product required=true
- Power: $29.99/month / ₹2999/month, checkoutActive=false, Dodo product required=true
- Max: $79.99/month / ₹7999/month, checkoutActive=false, Dodo product required=true

## Referral decision

- Rail: EON Keys and non-transferable app capability/cosmetics only
- Active now: false
- Server ledger required: true
- No cash/payout/wallet/crypto/token/NFT/reward discount value is granted by this source wave.
- Future invitee coupon, if used, must be a separate Dodo coupon/config decision and not a browser-side grant.

## Financial / reward risk guardrails

Files to inspect:
- trade.html
- wallet-risk.html
- reward-access.html
- billing.html
- eon-keys.html
- market.html
- assets/js/referrals/eon-keys-catalog.js
- assets/js/referrals/eon-feature-unlock-resolver.js
- assets/js/referrals/eon-locked-feature-surface.js

Coding tasks:
- Keep all trading and token dashboards framed as research/education unless live execution is explicitly guarded.
- Keep token/NFT/lootbox/creator-commerce legacy copy retired or utility-only in archive surfaces.
- Keep Dodo checkout disabled until server-side product, webhook, entitlement and rollback proof exists.
- Keep referral rewards as non-transferable EON Keys/capability/cosmetics only until server ledger proof exists.
- Do not trust localStorage entitlement for server-side paid features.
- Do not advertise resale value, passive income, guaranteed profit, or investment upside.

Known live blockers:
- No Dodo checkout/webhook/entitlement proof yet.
- No server referral/EON Key grant ledger proof yet.
- No browser/mobile visual proof for all W616D locked-feature surfaces yet.

## Cloudflare Pages setup

Project: eonapp-ch  
Branch: main  
Build command: `npm run build`  
Output directory: `dist`  
Node version: `22`

Required Cloudflare settings:
- Cloudflare Pages project points to the correct GitHub repository and production branch.
- Build command is npm run build and output directory is dist.
- Node version is pinned to 22 in Pages environment variables or build settings.
- Preview deployments remain enabled for Codex/browser proof before production promotion.
- Custom domain eonapp.ch is attached with HTTPS active.
- Compatibility flags or Pages Functions bindings are added only when W617C/W617D server code exists.
- Do not paste API secrets into frontend Vite variables.

Pre-deploy local commands:
- `npm ci`
- `npm run qa:w616b-eon-keys-referral`
- `npm run qa:w616c-locked-feature-resolver`
- `npm run qa:w616d-locked-feature-surfaces`
- `npm run qa:w617a-shell-launch-readiness`
- `npm run qa:w617b-launch-master-plan`
- `npm run lint -- --max-warnings=0`
- `npm run build`
- `npm run smoke:build`
- `npm run security:secret-scan`

Post-deploy smoke checks:
- Open https://eonapp.ch/ and verify the EONBOT home loads.
- Open /projects, /workspace, /local-ai, /automations, /vault and /eon-keys and verify locked-feature copy appears where expected.
- Open /eoncity and verify guest preview/auth gate truth, then run authenticated City proof separately.
- Verify _headers security policy and _redirects route aliases are deployed.
- Verify service worker update/caching does not strand stale billing or City assets.

Rollback plan:
- Keep the last known-good Pages deployment id before promotion.
- Promote only after route smoke and cache proof pass.
- Rollback by re-promoting the previous Pages deployment if production smoke fails.
- Keep Dodo checkout/trial/key redemption flags off during rollback.

## Dodo / entitlement proof plan

Dodo proof steps:
- Verify Dodo merchant/account status and product ids outside frontend source.
- Configure Dodo secrets only in Cloudflare server/runtime secrets, never as Vite public variables.
- Create a sandbox or controlled low-value checkout proof only after W617C server adapter exists.
- Capture signed webhook receipt for trial_started/payment_succeeded/cancelled/refunded events.
- Verify server entitlement ledger idempotency and duplicate webhook handling before enabling paid CTAs.

Referral/EON Key proof steps:
- Record invite attribution server-side, not only in localStorage.
- Grant EON Keys only from idempotent verified events.
- Apply abuse caps and the 14-day retained-paid-referral rule before paid milestone grants.
- Verify no cash, wallet, crypto, free-month or renewal-discount reward is granted by source code.

Evidence required:
- Cloudflare deployment id and build hash
- Dodo product id checklist with secrets redacted
- Dodo signed webhook proof with sensitive payload redacted
- Entitlement ledger idempotency proof
- Referral/EON Key ledger proof
- CEO paid-activation on/off decision note

## Whole-app audit scope

Page groups:
- core: index.html, about.html, support.html, offline.html, 404.html
- aiWorkspace: chat.html, projects.html, workspace.html, vault.html, local-ai.html
- city: eoncity.html, eoncity-3d.html, eoncity-play.html, realm-studio.html
- referralBilling: billing.html, eon-keys.html, referral.html, rewards.html
- research: trade.html, market.html, automations.html
- policy: privacy.html, terms.html, legal.html, billing.html

Code groups:
- payments: billing.html, assets/js/referrals/eon-keys-catalog.js, assets/js/referrals/eon-feature-unlock-resolver.js, assets/js/referrals/eon-locked-feature-surface.js
- identity: assets/js/utils/vault.js, assets/js/utils/profile.js, assets/js/utils/identity.js
- ai: assets/js/chat/ai-runtime.js, assets/js/chat/model-policy-router.js, assets/js/vault-api-page.js
- city: assets/js/eon-city-3d-station.js, assets/js/city/*.js, assets/css/eon-city.css
- pwa: sw.js, public/sw.js, manifest.webmanifest, _headers, _redirects

Audit checks:
- No old game pages promoted over RealmWorld.
- No trust page contains ads or aggressive monetization.
- No page promises profit, resale value, guaranteed AI result, or guaranteed trading result.
- No admin-only action trusts editable localStorage role fields.
- No service worker caches admin/payment/API pages as stale navigation responses.
- No API key persistence is default without clear warning.
- No paid feature relies only on localStorage entitlement if it calls a server route.
- No Dodo checkout, trial, referral grant, EON Key redemption, coupon or entitlement activation is implied before server proof.
- All official EON City changes ship through bundled app update, not public mutable server state.
- All launch billing routes through Dodo only after product, webhook and entitlement-ledger proof; creator commerce stays disabled.

## Final CEO signoff requirements

Required passes:
- npm ci, focused W616/W617 QA, lint, build, smoke build and secret scan
- All primary app routes load: home, Projects, Library, Workspace, Local AI, Automations, Vault, EON Keys and EON City
- Sidebar/menu/drawer accessibility and mobile navigation proof
- Locked-feature cards show Subscribe, Trial, Refer for EON Keys and Use EON Key without activating checkout or redemption
- EON City guest/auth gate proof, authenticated Babylon renderer proof and mobile landscape proof
- Local AI and own-provider/API-key copy proof; no platform-paid AI credit claims
- Dodo checkout/webhook/entitlement proof if paid activation is enabled, otherwise paid CTAs remain disabled
- Referral/EON Key server-ledger proof if live grants are enabled, otherwise grants remain disabled
- Cloudflare Pages deploy proof with build hash, custom domain HTTPS, headers, redirects, cache and rollback proof
- Privacy, terms, billing and support copy review
- Accessibility smoke pass and mobile/browser visual proof
- CEO go / soft-launch / no-go note with paid activation explicitly on or off

Accepted soft-launch limits:
- Dodo checkout, public trials and EON Key redemption can remain disabled during soft launch.
- Referral rewards are non-transferable EON Keys/capability/cosmetics only until server ledger proof exists.
- EONAPP does not sell platform-paid AI/image/video credits at launch; users use local AI or their own provider/API keys.
- EON City may remain beta/preview until authenticated renderer, controls and mobile proof are recorded.
- No browser-only entitlement unlock is acceptable for paid/server-side features.
- Creator commerce and marketplace purchase flows stay disabled unless separately reviewed and proven.

Go criteria:
- All hard blockers closed.
- Build, smoke, route, browser/mobile and Cloudflare deploy proof exists from Codex/local environment.
- Dodo and server entitlement proof exists or all paid activation remains disabled.
- Referral/EON Key grants have server-ledger proof or live grants remain disabled.
- Known risks are documented and accepted by CEO.

## Handoff rule

Hand this to Codex after W617B source validation. Codex/local should deploy only after the command list passes and should keep Dodo checkout, trials, referral grants and EON Key redemption disabled until W617C/W617D server proof exists.
