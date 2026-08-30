This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP W212 — Market simplification, stateless referrals, QR/share truth

**Date:** 23 June 2026  
**Base:** verified cumulative W180–W211 source  
**Scope:** W212 source implementation and local validation. W213–W216 remain future waves. Monetisation remains disabled.

## Executive decision

W212 deliberately does **not** add a Cloudflare short-link database, KV alias registry, or referral-link resolver.

New referral links are self-contained signed `eon2` envelopes:

```text
https://eonapp.ch/r/#eon2.<compact-payload>.<signature>
```

The fragment stays in the browser, so it is not included in the initial request to the static `/r/` page. Any modern browser can verify the signature locally with the public key carried in the envelope. A link does not need D1, KV, a Worker lookup, an API call, or a central alias record to resolve its destination.

The link is public by design. It is a signed routing/attribution proof, **not** a wallet key, account credential, payment authorization, recovery phrase, or secret.

## Referral architecture

### What is self-contained

- P-256 signature and public verification key.
- Version, issue time, expiry time, destination code and source code.
- A 128-bit self-certifying referral address derived from the signing public key.
- A fresh 128-bit share nonce for each issued link.
- A compact deterministic mission code derived from the signed token.

The 128-bit nonce is represented as 22 Base64URL characters. It has a vast collision space; W212 runs a 100,000-nonce collision gate in local validation. No system can promise literal mathematical impossibility of collision, but accidental duplication is negligible for any realistic EONAPP volume.

### What is not stored centrally

- No short URL → destination mapping.
- No issued-link registry.
- No raw signed token in D1, KV, Worker storage, or share telemetry.
- No click/open event sent to Cloudflare.
- No requirement for Cloudflare to verify a link or route its destination.

Local share analytics retain only the origin/path (`https://eonapp.ch/r/`), share attempt category, non-secret share id and mission code. They do not retain the token fragment.

### Existing D1 referral tree

The existing `REFERRALS_DB` is retained as a **separate optional tree of confirmed pseudonymous referral events**. W212 does not add a table or use D1 for link issuance or resolution.

A tree record is only prepared after a genuine allowed action completes. It contains hashed participant identifiers, an envelope hash and an immutable proof label. It does not contain the public referral URL or token. If the endpoint is unavailable, the record remains in a bounded same-browser outbox and can retry later. The link itself continues to work as a static/local verification flow.

### Availability truth

The domain or a static mirror must still serve the EONAPP `/r/` page. Once that page is available from Cloudflare Pages, a static mirror, or a future decentralized deployment, no server-side database or resolver is required to validate the link. A deleted domain or unavailable static bundle cannot be bypassed by any URL architecture.

## Public policy changes

- Copying, posting, scanning, clicking, reading, scrolling, or opening a referral link does not create points, money, token balance, subscription access, NFT ownership, ad credit, or a database record.
- Referral reward minting is disabled in W212.
- A qualified activity can produce only a local/pseudonymous confirmation record under the existing referral tree policy.
- Referral links must not unlock hosted AI, Vault capability, payments, Trade actions, wallets, security features, subscriptions, token conversion, or Market rights.
- Legacy `eon1` envelopes remain verifiable for old links and opt-in lineage exports. New normal public surfaces issue compact `eon2` links.

## Market simplification

The Market is now limited to two honest surfaces:

```text
Generate  → local private generated previews and optional local Vault saving
Official  → unavailable until independently verified commerce evidence exists
```

- Generated cards are called **Generated Preview**, never automatic NFTs, purchases, investments, tradable assets, or “1 of 1” sales claims.
- Saving a preview creates an **Owned Utility Pass** record in the same browser’s local Vault. It remains not minted and has no financial value.
- Official inventory is deliberately empty until checkout, receipt, delivery, support, terms and refund proof all exist.
- Internal exchange and user-to-user listings remain unavailable.

## Source changes

| Area | W212 delivery |
|---|---|
| Signed links | Compact stateless `eon2` protocol, P-256 local verification, 128-bit share nonce, one-year default share lifetime, fragment routing, no alias lookup. |
| Legacy compatibility | Existing `eon1` tokens continue to verify; legacy `/r/<code>` paths show a safe retirement message rather than resolving a hidden record. |
| Cloudflare footprint | Removed `functions/api/share-links/*`; removed `EON_SHARE_LINKS_KV` readiness requirement; no new D1 schema or KV binding. |
| Existing D1 tree | Optional confirmed pseudonymous projection only after a qualifying action; bounded local retry outbox while unavailable. |
| QR/share | QR uses the same compact public link; share telemetry strips the token from local attempt records. |
| Public referral surfaces | Vault/share center/CTA copy no longer promises claim loops, Pool Points, AI share campaigns, or raw-sharing rewards. |
| Market | Accessible Generate/Official tabs, private local previews, explicit empty Official state, no active checkout or internal exchange claim. |
| Regression safety | New W212 source gate plus W180/W184/W188/W209/W210/W211 targeted regressions. |

## Required local checks passed

```text
PASS  npm ci --ignore-scripts
PASS  npm run qa:w180-w181-chat-first-shell
PASS  npm run qa:w184-w187-runtime-market-share
PASS  npm run qa:w188-w190
PASS  npm run qa:w209-vault-account-boundary
PASS  npm run qa:w210-pwa-eonlite-device
PASS  npm run qa:w211-workspace-automation
PASS  npm run qa:w212-market-links
PASS  npm run lint -- --max-warnings=0
PASS  npm run build
PASS  npm run smoke:build
PASS  npm run audit:site
PASS  npm run launch:readiness
PASS  npm audit --omit=dev
      0 production vulnerabilities
```

## Not claimed

- No Cloudflare Preview route verification.
- No actual D1 `REFERRALS_DB` migration/apply/readback.
- No physical Android/iPhone/desktop QR scan.
- No production social platform share test.
- No Playwright screenshot proof in this environment.
- No commerce checkout, provider, offerwall, ad, subscription reward, token, wallet, or referral reward is live.
- The inherited development-dependency audit remains outside this wave; W214 owns controlled security/dependency remediation.

## Next wave

**W213 — deep EON City rebuild and Trade safety proof.**

Do not overlay older W180–W211 ZIPs over this package. Use the cumulative W180–W212 source as the sole baseline for W213.

## Included release manifest

`EONAPP_W180_W212_SOURCE_MANIFEST_2026-06-23.txt` lists every curated release file with a SHA-256 digest.
