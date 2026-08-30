# W222 My Realm MVP

## Product truth

**My Realm is a private, local EON City district and portable identity.**

It is not a public storefront, seller account, public profile database, affiliate program, payment surface, commission ledger, withdrawal path, or payout promise. The editor lets a person personalise local City return behavior and optionally create a self-contained signed identity link.

## Local Realm state

Storage key: `eon:realm:state:v3`

My Realm stores only:

- Stable local Realm ID
- Label and safe handle
- Selected visual theme
- Preferred City arrival district
- Up to four references to locally generated Market previews
- Safety-review status and non-commercial feature flags

It does not store or publish Vault material, recovery data, API credentials, wallet information, private chats, payment records, referral attribution, commission balances, or payout information.

## City connection

Saving a Realm updates `eon:city:world-state:v1` with only:

- `realmId`
- `realmAppearance.palette`
- `realmAppearance.landmark`

The City does not receive the label, handle, showcase, Vault information, or public-link payload.

## Migration rule

Historic `eon:realm:profile:v2` data is copied once into the v3 state after normalization. The source key remains unchanged. Secret-shaped legacy fields are deliberately omitted from v3.

## Private Market moodboard

A person may select up to four `private-v3-*` Market preview references. They remain local. Selecting a preview never publishes it, creates an NFT, creates a listing, grants ownership, opens a market, or changes a signed link.

## Portable signed identity link

The optional eon3 link contains a stable Realm identity plus a fresh share ID. It verifies locally and requires no central short-link registry.

The link contains only:

- Realm ID
- Realm handle
- Display label
- Theme
- Safe destination (`/u/:handle`)

The link excludes City state, showcase references, private Market data, Vault data, payment/reward records, affiliate status, commissions, payout details, and wallet information.

## Safety review

Before an identity link can be created, My Realm blocks metadata that:

- implies official EONAPP/support/staff ownership;
- includes credential, recovery, wallet, or personal-contact data;
- uses protected/reserved identity names.

A future public Realm must add account-backed publication, reporting/takedown operations, anti-impersonation controls, and a server-backed public manifest before it can honestly be described as public.

## Validation

```bash
npm run qa:w222-my-realm-mvp
npm run qa:w222-my-realm-mvp:browser
node --test tests/unit/w197-w201-sync-city-device.test.mjs
```

The browser command requires a Playwright Chromium install or `CHROMIUM_PATH`; it is not proof until it actually completes in a permitted browser environment.
