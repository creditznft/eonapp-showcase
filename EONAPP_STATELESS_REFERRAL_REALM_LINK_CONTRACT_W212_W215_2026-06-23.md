# Stateless referral and Realm link contract — W212–W215

## One public link system

| Purpose | Prefix | Example shape | Portable data |
|---|---|---|---|
| Referral / general share | `eon2` | `https://eonapp.ch/r/#eon2.<payload>.<signature>` | signed destination, issuer-derived referral address, fresh share id, safe metadata |
| Realm share | `eon3` | `https://eonapp.ch/r/#eon3.<payload>.<signature>` | everything above plus stable public Realm id, public handle, label and theme |

## Cryptographic properties
- Fresh **128-bit CSPRNG share id** every time a public link is issued.
- P-256/SHA-256 self-contained signature verification in the browser.
- Referral address is derived from the signing public key; it is a public identifier, not an account credential.
- A 100,000 issuance test produced no duplicate share ids. That test is a regression check; collision resistance comes from the 128-bit random space.
- Default expiry is `0`, meaning durable/forever. Explicit finite expiry remains supported for a future voluntary use case.

## No short-link registry
The URL fragment never reaches Cloudflare. Link issuing/opening does not require or create:
- D1 issued-link rows
- KV alias records
- Worker resolver requests
- click/open tracking rows
- raw token persistence

The static EONAPP domain and `/r/` page still need to be reachable for a recipient to open a link. The link is independent of Cloudflare D1/KV/Worker, not independent of all hosting.

## Existing Cloudflare referral tree
`REFERRALS_DB` remains for qualified, pseudonymous referral-tree records only:
- an incoming signed link is verified locally;
- a pending local attribution is stored on the recipient device;
- only a defined qualifying activity can queue a confirmation;
- the queued record hashes visitor/referrer/envelope values;
- no raw public token, click, open, alias, or issued-link registry is written;
- no reward, revenue share, payout, credit, or entitlement is created now.

Existing referral-tree records are preserved. Raw old query-style referral links are retired and cannot create new referral state.

## Realm behavior
An `eon3` link carries a stable public Realm ID plus a fresh share ID. The route `/u/<handle>` by itself is not a cloud lookup. It can only render a portable Realm identity after this browser has locally verified the full signed `eon3` link. This prevents a new central Realm registry and avoids publishing arbitrary local RealmWorld snapshots.

## User safety
These links are public. They are **not** wallet private keys, seed phrases, recovery codes, login credentials, payment requests, ownership proofs, or reward proofs. Do not place secrets or personal data in a Realm handle/display name.

## Social-preview trade-off
Because the proof is held in the fragment, social crawlers receive only generic `/r/` page metadata; individual Realm data is not exposed to crawlers. This is intentional privacy and no-registry behavior.

## Future reward policy
A future referral reward/revenue-share plan is not implemented. It must be separately designed and approved under W215/W216 evidence requirements.
