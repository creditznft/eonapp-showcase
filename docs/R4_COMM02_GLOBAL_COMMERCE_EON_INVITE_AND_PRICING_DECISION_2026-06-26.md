# R4-COMM-02 — Global Commerce, EON Invite and Multi-Currency Decision

**Status:** Research and source-governance decision only. This document does
not activate a merchant account, KYC flow, checkout, recurring billing,
provider SDK, coupon, referral benefit, server entitlement, payout, ad,
affiliate, subscription or external support service.

## 1. Correction to the prior referral decision

The former decision correctly rejected **referral income**: revenue share,
commission, subscription percentage, cash or payout paid because another user
pays. It was too broad to treat every customer discount as the same thing.

**EON Invite may later become a single-level customer promotion:** a limited
coupon or time-limited product extension earned after a genuinely new person
makes and keeps an eligible paid purchase. It is **not a commission**, not a
share of another customer’s payment and not an income programme.

This is still **not active**. The selected provider must explicitly approve the
actual EONAPP catalogue and this promotion before any user-facing activation.

## 2. EON Invite — planned design

### Qualification

A referral becomes qualified only when all of these are true:

1. a distinct new account used a valid invitation;
2. that person completed their first eligible paid product or membership;
3. the payment survived the refund, dispute and chargeback review period; and
4. server-side checks cleared self-referral and obvious duplicate-account
   patterns.

Clicks, shares, free signups and trials never earn a benefit. Refunded,
disputed, charged-back, duplicate and self-referral transactions never earn a
benefit.

### Proposed benefits

- **Invitee:** one 20% first-purchase coupon for one eligible Official Pack or
  membership.
- **Inviter:** one 20% coupon for their next eligible Official Pack or
  membership once the referral becomes qualified.
- **Milestone:** after three qualified referrals in a rolling 12 months, the
  inviter chooses **one 30-day Plus extension** or **one 20% annual membership
  renewal coupon**.

### Hard limits

- Single-level only. There is no downstream referral tree.
- No cash, payout, commission, revenue share, percentage of another user’s
  payment, affiliate income, bank transfer, crypto, token, gift card or
  cash-equivalent points.
- No reward for a click, a share, a free account or a trial.
- Coupons are one-time, non-transferable, non-stackable and expire.
- Four inviter coupons maximum per rolling 12 months.
- One free-time extension maximum per rolling 12 months.
- The offer cannot be stored-value credit, a wallet balance or user property.
- Any refund, dispute or chargeback must reverse the unredeemed benefit and
  reconcile an already-redeemed benefit through server-side rules.

This is a real user incentive without creating an earnings scheme.

## 3. Provider decision: lowest-operations global route

### Scoped research candidate: Dodo Payments — not a whole-app default

**Dodo Payments is a narrow product-surface candidate, not a selected or
integrated provider and not a default for a broad EONAPP membership.** Its
merchant-of-record model may fit a separately presented **EON Official
Blueprint Pack** catalogue with immediate digital delivery. However, its
published policy screens financial products/services/advice and gaming or
virtual-goods environments. Market Intelligence, City/game-adjacent surfaces,
crypto history and any virtual-goods path therefore cannot be presumed
purchase-eligible.

Before selection, obtain written confirmation of all five points:

1. the narrow Official Blueprint Pack catalogue is accepted as the product
   actually sold;
2. no checkout covers Market Intelligence, financial research, City/game
   access, crypto or virtual-goods activity;
3. an Individual India-based seller can use the desired payout method; Dodo's published documentation currently lists USD, GBP and EUR as native payout currencies while INR remains a transaction currency, so the India bank/FX route must be confirmed in writing;
4. this exact EON Invite customer-promotion pattern is permitted; and
5. test-mode proof succeeds for checkout, signed webhooks, cancellation/refund
   or dispute reversal, and server-side licence revocation.

### Backup research candidate: Lemon Squeezy

**Lemon Squeezy is the backup merchant-of-record evaluation for the same narrow Blueprint Pack catalogue.** It can be useful
for global digital products, but it is not a presumed approval for a broad EONAPP membership and the exact India payout route must be verified.
For an India merchant without an approved Stripe account, its published
support guidance points to verified PayPal payouts. Treat that as a separate
feasibility check, not an assumption.

### Later India-local rails: Razorpay and Cashfree

Razorpay and Cashfree remain later direct-gateway candidates for India-local
payments after the founder is ready for merchant KYC, direct refund/dispute
operations and the required public business/billing posture. They are not the
first route for a low-operations global launch.

### Do not select PayU for this roadmap

PayU provides offer and discount tooling, which means an ordinary checkout
coupon is not automatically the same as referral income. However, its
published restricted list contains both referral-income and broad
intangible-goods language. It also places customer, campaign, refund and
dispute responsibility on the merchant. Do not use it as the default EONAPP
provider without a written acceptance of the specific product and promotion.

### KYC is not optional

**KYC is not optional for any legitimate provider that takes customer money and
pays a seller out.** The goal is not “KYC-free”; it is one low-friction,
truthful verification with a provider whose model matches digital products.
Never try to work around KYC through proxy accounts, misleading business
information, personal payment links, crypto settlement or browser-only access
unlocks.

## 4. Multi-currency planning price books

Prices below are internal planning values only. They are not displayed in the
app, are not for sale and do not create a right to purchase. A selected checkout
provider decides approved local currencies, tax calculation and settlement.

| Product | India (INR) | Global (USD) | State |
|---|---:|---:|---|
| EON Free | ₹0 | $0 | Active local-first core |
| Essential Official Pack | ₹299 | $9 | Planned |
| Professional Official Pack | ₹699 | $19 | Planned |
| Signature Official Pack | ₹1,499 | $39 | Planned |
| EON Plus | ₹299/mo or ₹2,999/yr | $4.99/mo or $49/yr | Planned |
| EON Studio | ₹799/mo or ₹7,999/yr | $12.99/mo or $129/yr | Planned |
| EON Team (3-seat min) | ₹1,199/seat/mo or ₹11,990/seat/yr | $19/seat/mo or $190/seat/yr | Future specification |
| EON Scale (up to 10 seats) | ₹15,999/month | $199/month | Future self-service organisation plan |
| EON Enterprise | Not priced | Not priced | Future contract-only capability |

**No $1 tier.** A paid tier must absorb transaction cost, potential reversals
and continuous Pack maintenance. The low entry point is the Essential Pack or
Plus membership.

**No browser FX conversion.** Each region uses a fixed price book. The provider
must show the approved checkout amount, currency and tax treatment.

## 5. Tier boundaries

### EON Free

The local-first product remains genuinely useful: Apps, Workspace, active
Blueprints and workflows, Insight desks, local exports, backups and safety
controls remain free. Do not manufacture scarcity by locking ordinary local
work or artificial message counts.

### Official Packs

The best one-time product. Each Pack must be a maintained multi-deliverable
outcome system: templates, project setup, workflow mappings, review
checkpoints, version/change notes, privacy/action boundary and licence scope.

### EON Plus and Studio

Sell maintained collections and repeat product value, not tiny prompts or
buttons. Plus is a maintained professional Pack library. Studio adds deeper
creator, business and research operating systems once they are built.

### EON Team

A future small-team plan. It cannot sell until shared workspace, roles,
administration, audit history and data controls actually work.

### EON Scale — not Enterprise

EON Scale is a **future $199/month or ₹15,999/month self-service organisation
plan**, designed for up to ten seats. It may later include organisation roles,
Pack governance, audit exports, policy controls and automated reporting. It
must not be sold until those controls exist.

It is **not Enterprise**. A product cannot honestly call itself Enterprise
without enterprise controls and an accountable escalation path.

### EON Enterprise

Designed now, but unavailable: SSO, governance, deployment/data options,
contractual terms, audit controls and human escalation are all prerequisites.
There is no self-service $100/$200 “Enterprise” shortcut.

## 6. AI-first self-service, without pretending support disappears

EONAPP can remain low-overhead through an **AI-first self-service model**:

- EONBOT explains product workflows and runs diagnostics;
- Help content and known-issue guidance are searchable;
- a chosen merchant-of-record may provide customer billing portals where
  available;
- receipt/access checks can be automated; and
- one asynchronous owner escalation path handles only unresolved paid access,
  privacy deletion, security and billing exceptions.

There is no live-chat, consulting, onboarding-call, account-management or
fixed human response-time promise. But it is not credible to say payment
providers handle all product problems: the seller remains accountable for
exceptional access, privacy, security and product-delivery issues.

## 7. Non-negotiable implementation sequence

1. Build no checkout yet. Keep all existing commerce flags false.
2. Expand free Blueprint/Workflow quality and build the first six fully-specified
   future Official Packs before showing a paid catalogue.
3. Apply to the primary provider with a precise truthful product description.
4. Obtain written catalogue, India-payout and EON Invite promotion approval.
5. Build one server-backed test-mode one-time Pack path: hosted checkout,
   webhook signature verification, receipt, grant, refund/dispute reversal and
   entitlement revocation.
6. Collect W276 update/rollback proof plus Preview/browser/device proof.
7. Only then decide whether to enable one-time Pack sale.
8. Launch recurring Plus only after Pack consumption and renewal value exist.
9. Consider Team/Scale only after collaboration controls are built. Enterprise
   remains unavailable until true enterprise operations exist.
