# EONAPP GPT-5.5 Audit Roadmap — Revised After Payment Remediation
Date: 2026-06-02

## Why this revision exists
The original wave map listed Wave 5 as Public UX + Funnel. During execution, an urgent NOWPayments idempotency remediation was handled first and saved as a payment remediation wave. To avoid confusion, this revised roadmap treats that as **Wave 5A** and keeps the product audit sequence clean from here.

## Completed waves

### Wave 1 — Baseline + launch-gate correction
Completed. Found contradictory gates and dangerous secret material in older backup.

### Wave 2 — Payments + entitlements audit
Completed. Found double-credit and identifier risks.

### Wave 3 — Admin + operator wallet security
Completed with code patch. Added canonical admin wallet registry and wallet-gated admin pages.

### Wave 4 — Legal + billing + trust
Completed with code patch. Added legal/billing/refund/wallet-risk/support pages and fixed launch-gate blockers.

### Wave 5A — NOWPayments remediation
Completed with code patch. Added finished-payment idempotency ledger and stricter validation.

### Wave 5B / Wave 05 — Public UX + funnel
Completed with code patch. Clarified homepage, chat, onboarding, market, realm, pricing, and global Plans navigation.

## Remaining recommended waves

### Wave 06 — Vault + identity + privacy deep audit
Goal: make local-first claims truthful, recoverable, and user-safe.

Scope:
- Vault profile
- recovery phrase
- encrypted export/import
- API-key storage
- localStorage claims
- entitlement portability
- referral state
- private/public data boundaries
- privacy page consistency
- support copy for lost devices

Deliverable:
- `EONAPP_WAVE06_VAULT_IDENTITY_PRIVACY_AUDIT_2026-06-02.md`
- backup zip if code changes are made

### Wave 07 — AI runtime + Cockpit + Chat audit
Goal: make EONBOT and Cockpit believable, safe, and useful.

Scope:
- Chat UX
- provider setup
- BYOK handling
- local runtimes
- browser cockpit
- automation approval gates
- hallucination/safety boundaries
- onboarding-to-cockpit path
- free vs paid runtime clarity

Deliverable:
- `EONAPP_WAVE07_AI_RUNTIME_COCKPIT_AUDIT_2026-06-02.md`

### Wave 08 — NFT + collectibles + Market + Realm audit
Goal: decide what ships as polished, what remains beta, and what needs premium visual work.

Scope:
- NFT engine
- lootboxes
- collectibles
- marketplace
- Realm storefront
- creator assets
- on-chain claims
- visual quality
- policy/terms for NFTs and sellers

Deliverable:
- `EONAPP_WAVE08_NFT_MARKET_REALM_AUDIT_2026-06-02.md`

### Wave 09 — PWA + SEO + accessibility + mobile polish
Goal: make the app feel production-grade on phones and search/share surfaces.

Scope:
- manifest
- service worker
- mobile nav
- route canonicalization
- sitemap/robots
- meta/OG/Twitter
- accessibility checks
- keyboard navigation
- low-end mobile performance

Deliverable:
- `EONAPP_WAVE09_PWA_SEO_ACCESSIBILITY_AUDIT_2026-06-02.md`

### Wave 10 — Trading, wallet, rewards, token, and financial-risk audit
Goal: reduce financial/regulatory risk and prevent overclaiming.

Scope:
- Trade page
- wallet payment fallback
- rewards/Pool Points/EonLite copy
- token dashboards
- direct EVM receiver config
- market-risk disclaimers
- investment-language cleanup
- chain/token support truth

Deliverable:
- `EONAPP_WAVE10_FINANCIAL_WALLET_RISK_AUDIT_2026-06-02.md`

### Wave 11 — Tests, CI/CD, Cloudflare deploy runbook, and live-payment proof plan
Goal: make deployment and testing repeatable outside chat.

Scope:
- Cloudflare Pages settings
- environment variables
- KV bindings
- NOWPayments live $1 test
- direct EVM payment test
- rollback plan
- smoke tests
- unit test triage
- build script readiness

Deliverable:
- `EONAPP_WAVE11_DEPLOY_CI_LIVE_PAYMENT_RUNBOOK_2026-06-02.md`

### Wave 12 — Final CEO launch signoff
Goal: make a final launch decision.

Deliverable:
- Go / soft-launch / no-go decision
- final scorecard
- launch checklist
- 7-day polish sprint
- 30-day roadmap
- explicit remaining risks accepted by CEO


### Wave 13 — Whole-app autonomous audit and dead-surface cleanup
Goal: audit the rest of the app after RealmWorld is complete so no old, weak, risky, or duplicate surface ships unnoticed.

Scope:
- every public HTML page
- AI/chat/workbench/vault flows
- payment, wallet, reward, NFT, creator, and RealmWorld commerce flows
- service worker/cache safety
- admin/trust/privacy/legal pages
- old game/archive routes
- ad/monetization placements
- mobile/a11y quick checks

Deliverable:
- `EONAPP_WAVE13_WHOLE_APP_AUTONOMOUS_AUDIT_2026-06-02.md`
- final blocker checklist before broad launch

## Additional optional specialist waves
Use these only if time allows or if a wave reveals deeper risk.

### Specialist Wave A — Security threat model
Focus: XSS, CSP, wallet signing, worker auth, sensitive localStorage, admin actions.

### Specialist Wave B — Monetization and ad-network QA
Focus: ad placements, paid-user ad suppression, sponsor pages, compliance, UX damage.

### Specialist Wave C — NFT visual premium pass
Focus: upgrade generative visuals, rarity logic, metadata, marketplace thumbnails.

### Specialist Wave D — Internationalization and India/mobile UX
Focus: Hindi/English copy, low-end phone UX, UPI/card later planning, local legal language.

## CEO rule for all remaining waves
Every wave must produce:
- files inspected,
- blockers,
- code changes,
- validation run,
- CEO decisions,
- next-session prompt,
- backup zip if code changed.

Do not launch new features until Wave 12 signoff unless a wave explicitly says the feature is required for launch.
