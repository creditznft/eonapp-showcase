# W261/W262 — EON Lite and wallet safe decision tree

**Date:** 2026-06-25  
**Decision owner:** product + legal + security + operations, independently evidenced.  
**Current state:** no wallet, no browser chain runtime, no token/coin, no transfer, no rewards, no referral value and no activation.

## CEO decision

**Do not build an EON Lite Coin, a custodial wallet, a key store, a token balance, a sale, an airdrop, an exchange surface, or a referral reward mechanism in the current release line.** These change the product from a local AI/workspace app into a digital-asset service or financial-value surface and cannot be cleared by source tests alone.

EON Lite can remain a future **brand/architecture label**, but it must not represent a transferable asset, account balance, promise of value, or user entitlement while W260 is NO-GO.

## Permitted sequence

| Stage | Allowed work | Explicitly excluded |
|---|---|---|
| 0 — current | Source contracts, threat model, legal issue list, partner diligence, read-only external evidence plan | Wallet UI, address collection, key/seed handling, signing, balances, token issuance, conversion, payout, value referral, on-chain rewards |
| 1 — W258 exit | Independent deployment/ABI/role/custody/toolchain evidence | User wallet connect, transactions, asset claims, live value display |
| 2 — W261 | Workspace-only backend-proxied **read-only trust proof** with a finite public allowlist and no user financial data | Browser RPC, user key signing, balances, transfers, holdings, token or reward UX |
| 3 — W262 | Public provenance/official proof identity only after source, security and legal review | Coin sale, wallet, referral rewards, payment or investment claim |
| 4 — separate regulated product decision | Counsel-led product classification, AML/KYC/privacy/tax/consumer/support/incident design, named accountable owner, independent security and regulated-partner diligence | Any implementation until all written approvals and Preview/rollback evidence exist |

## W261 hard boundaries

Even after W258 exits, W261 is a *read-only proof* lane:

- no wallet connection or wallet creation;
- no private key, seed phrase, signature request, address or balance storage;
- no asset price, exchange rate, portfolio, trading, transfer, purchase, claim, redemption or payout surface;
- no referral, milestone, ad, share or task event may produce a value-bearing entitlement;
- no browser RPC or client-authoritative chain conclusion;
- no personal or financial data in a chain-proof request.

## Why the boundary is strict

India’s FIU-IND registration notice identifies activities such as exchange between VDA and fiat, VDA-to-VDA exchange, transfers, safekeeping/administration or enabling control over VDA, and financial services related to an issuer offer as activities within its VDA service-provider framework. The exact classification of any future EON Lite product must be reviewed by qualified counsel before build or launch.

## What Codex may do later

Codex may implement a W261 proof lane only from a separately approved specification that supplies the exact read-only data source, public allowlist, privacy review, security threat model, rollback plan, named owner and test evidence. It must not infer permission from this document or from the existence of an old D1 database.

## Stop conditions

Stop and seek legal/security review immediately if a planned feature introduces a user address, signature, balance, claim, transfer, conversion, price, pool, payout, reward value, custody, referral consideration, or financial promotion. This is product architecture guidance, not legal advice.
