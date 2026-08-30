# R4 Apps, Blueprints and Commerce Decision

**Date:** 26 June 2026  
**Status:** Source decision record. It activates no checkout, payment processor,
subscription, paid entitlement, provider connection, marketplace, payout, or
external workflow execution.

> **W450 supersession note (30 June 2026):** This document remains the Apps catalogue and safety decision. The current billing candidate, trial policy and proof gate are governed by `EONAPP_W450_FINAL_LAUNCH_EXECUTION_PLAN_2026-06-30.md` and `config/w450-dodo-approval-readiness-contract.mjs`. **Dodo Payments is the single approval-pending planning candidate.** No referral income, subscription percentage, commission, payout, checkout, trial or paid product is activated.

## 1. Product architecture decision

EONAPP has four primary surfaces:

1. **EONBOT** — ask, plan and review.
2. **Workspace** — Projects, Library, artifacts and local work records.
3. **Apps** — curated outcome packs, workrooms, roles, research desks and future-safe connections.
4. **EON City** — an optional spatial entry and return surface, never the only way to reach work.

**Resolved naming:** do not introduce `Signal Lab` as a fifth top-level product.
`Insights & Forecasts` becomes a flagship **Apps collection**. The public route is
`/insights`; `/trade` is inbound-only compatibility and redirects there. Its
individual desks remain `Research Lab`, `Business Research`, and `Scenario Studio`.

This avoids a narrow “trading signal” promise while preserving a serious,
all-round research workspace.

## 2. Apps catalogue decision

The current App Deck remains a local, curated product catalogue. It is not an
open third-party app store and must not install code, connect accounts, execute
providers, create a subscription, grant an entitlement, or perform an external
action.

### Current free base

- 4 Workrooms
- 5 AI Crew roles
- 8 future Connection-boundary cards
- 7 local Blueprints
- 10 approval-first local workflow templates

### Next free official Blueprint Pack collection

Build these as versioned official packs with a clear goal, deliverables,
review points, local Project/Library mapping, and a reversible handoff. They
remain free during the initial expansion:

| Pack family | Official pack | Intended outcome |
| --- | --- | --- |
| Business | Client Onboarding System | Intake, scope, approval and follow-up plan |
| Business | Offer Validation Sprint | Customer, offer, risk and experiment brief |
| Business | Community Session Plan | Run-of-show, host plan and feedback review |
| Creator | Newsletter Engine | Repeatable topic, draft, review and send-ready checklist |
| Creator | Content Repurpose Loop | Turn one source into an ethical multi-format content plan |
| Creator | Brand Foundation | Voice, promise, visual direction and review criteria |
| Builder | Product Discovery Sprint | User problem, constraints, scope and acceptance criteria |
| Builder | Bug Triage & QA | Reproduction, priority, test plan and release checklist |
| Research | Decision Research Brief | Question, evidence plan, uncertainty and decision memo |
| Research | Competitor Observation Map | Lawful public observation, comparison and caveats |
| Research | Pricing & Demand Review | Assumptions, scenarios, customer evidence and next test |
| Career | Portfolio Launch Kit | Case-study structure, proof checklist and outreach drafts |
| Personal | Personal Knowledge System | Capture, review, retrieval and privacy-safe maintenance |

The intended first expansion is **20 official Blueprints total** (the current
seven plus thirteen additions), not an uncontrolled library of low-quality
prompt cards.

### Next workflow collection

Add ten matching approval-first, local workflow simulations:

1. Client onboarding
2. Offer validation
3. Community session operations
4. Newsletter/content system
5. Product discovery
6. QA and bug triage
7. Decision memo
8. Competitor observation
9. Portfolio/career launch
10. Learning and knowledge review

Every workflow may prepare, save, simulate and hand off local work. It must
not claim it sent, scheduled, published, purchased, connected, deployed or
changed an external system.

## 3. Insights & Forecasts decision

`Insights & Forecasts` is an Apps category, not a paid “signal service” and
not a top-level replacement for EONAPP.

Its initial cards route to local-only canonical `/insights` desks. `/trade` remains redirect-only compatibility:

- Market Intelligence — manual/CSV research, thesis, evidence and scenario review.
- Business Intelligence — pricing, demand, customer, product and competitor research.
- Forecast Studio — private probability forecasts, evidence revisions, manual resolution and calibration.
- Research Journal — local claims, sources, assumptions and decision receipts.
- Local Data Lab — user-owned data import, validation and provenance review.

Hard boundary: no broker/exchange connection, trade execution, custody, copy
trading, live-price claim, personalised buy/sell call, money-backed forecast,
stake, prize, payout, token, cash-out, public contract or tradable market.

## 4. Commercial strategy decision

### What stays free

The free tier must keep the product useful and trustworthy:

- Current Workrooms, AI Crew, Apps cards, 20 starter official Blueprints and
  local workflow simulations.
- Local Projects, Library records, exports and backup guidance.
- Market/Business/Forecast desks using manual and user-uploaded CSV data.
- Privacy, safety and data portability tools.

Do not put basic exports, user-owned local data, recovery records or safety
controls behind a payment wall.

### What may become paid later

Do not sell individual tiny prompt cards. Offer **official outcome packs** only
when each pack has real maintained value: versioned deliverables, templates,
workflows, workroom setup, migration notes and support scope.

Future one-time packs may include:

- Creator Launch Pack
- Solo Business Operator Pack
- Builder Launch Pack
- Research & Decision Pack

A future Pro subscription may exist only when it unlocks already-built,
continuing value such as maintained advanced pack collections, version history,
portfolio dashboards or team-safe workspace views. It must not sell imagined
features, financial outcomes, “AI credits,” tokens, wallets, rewards, referral
value, or automated external execution.

No user-to-user marketplace, creator payout, affiliate cash value, wallet,
crypto access or resale mechanic is approved in R4.

### Commercial order

1. Build and validate free official packs first.
2. Choose one merchant candidate after real KYC/merchant approval and a legal,
   tax, support, refund and cancellation review.
3. Prove one **test-mode one-time official Pack** with hosted checkout,
   server-verified webhook, idempotent grant, refund reversal and support
   receipt.
4. Only then decide whether a subscription is justified by repeat value and
   proven cancel/refund operations.

No prices, payment buttons, subscription labels, entitlement flags or processor
keys are activated by this document. The future paid ladder is Free / Plus / Studio / Power / Max; exact pricing remains non-public, USD-referenced and capped at $49.99 per monthly tier until a revised owner-approved contract exists.

## 5. Billing direction — W450 supersession

**Dodo Payments is the single approval-pending planning candidate.** The owner
has started individual merchant underwriting. This does not create a checkout,
subscription, free trial, payment callback, provider key, entitlement or public
price.

Dodo onboarding guidance reported international recurring cards/local methods
and India UPI AutoPay or Indian-card mandates. That guidance is a **test target,
not a public promise**, until the approved account and a full lifecycle matrix
confirm it. A scheduled debit, mandate acknowledgement, checkout return or
pending renewal is never an entitlement event; only a verified provider success
event may grant or extend access.

Implementation boundary for the future approved integration:

- Hosted processor checkout only; the browser never receives raw card details,
  live secrets or webhook secrets.
- A browser redirect, client time, localStorage or mandate initiation never
  grants access.
- A server verifier must validate the signed provider event, product, amount,
  currency, status and idempotency key before granting a narrow entitlement.
- Entitlements must be server-backed, auditable, revocable and reversible for
  refunds/chargebacks; localStorage is not an entitlement ledger.
- The planned conversion offer is one transparent **7-day trial per verified
  customer across the paid ladder**, after approved hosted checkout, public
  terms, cancellation path, signed webhooks and the full lifecycle proof pass.
- Private work, Vault keys, Chat, user data and City telemetry remain outside
  billing scope.

## 6. Required gates before commercial activation

- Public Terms, Privacy, Billing, Refund/Cancellation and Support paths reviewed.
- Merchant KYC/approval complete; legal entity/tax position and permitted
  digital-product category confirmed externally.
- Test-mode product, hosted checkout, signed webhook verification and
  reconciliation log proven.
- Double delivery, late webhook, duplicate webhook, refund, failed payment,
  cancellation, chargeback and support recovery cases tested.
- Independent source and preview evidence review completed.
- W276 update/rollback/restore evidence is no longer NO-GO.

Until every applicable gate is satisfied, Apps remains local-first and free.
