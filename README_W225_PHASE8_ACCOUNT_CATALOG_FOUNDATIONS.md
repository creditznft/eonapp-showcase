This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP W225 — Phase 8 Account & Catalog Foundations

This source state continues W217–W224 and completes Phase 8 of the approved architecture.

## What changed

- Adds design-only account, public Realm publication, and official-commerce contract modules.
- Keeps the profile local-only. No hosted sign-in, account connection, public publication, checkout, receipt, delivery, user storefront, affiliate, payout, or token feature is activated.
- Makes Profile, Realm Studio, and the Market official tab state those boundaries directly.
- Defines future server-side record shapes without creating endpoints or browser-side commercial truth.
- Adds W225 unit and browser specifications, release evidence, and the current browser environment limitation.

## Run

```bash
node --version
npm ci
npm run qa:w225-account-catalog-foundations
npm run qa:w216-release-candidate
```

Optional browser proof in a permitted environment:

```bash
npx playwright install chromium
npm run qa:w225-account-catalog-foundations:browser
```

## Hard boundaries

- Do not pass credentials, wallet material, recovery codes, private chats, or payment information into chat, public links, Realm manifests, or account contracts.
- Do not activate official commerce, public Realm publishing, seller listings, referrals/commissions, payout, or tokens without Phase 9 go/no-go decisions and server-side evidence.
- Signed invite and Realm links remain self-contained local/share mechanisms; they do not create tracking, rewards, attribution, or payment eligibility.
