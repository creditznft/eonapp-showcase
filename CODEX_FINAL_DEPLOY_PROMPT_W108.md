This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex prompt — EONAPP W108 final deploy

You are deploying EONAPP W108 final polish.

Use the attached W108 final package as the source of truth. It includes W108A–W108E plus final cleanup.

Do not add new large features. Do not change smart contracts, deployed contract addresses, payment receiver logic, wallet settlement, live trading execution, or secrets.

Primary goals:

1. Deploy EON City-first homepage.
2. Confirm Market first-visit personal starter NFTs appear and search works.
3. Confirm Marketplace commercial-truth and seller/buyer safety copy appears.
4. Confirm Creator Studio and Workbench first screens are simplified.
5. Confirm Realm exposes EON City, Private Workstation, and Device Lab safely.
6. Confirm Trust page has real body copy.
7. Confirm no visible mojibake or broken first-load empty states.

Run:

```bash
npm ci
npm run qa:w108-final-handover
node --test tests/unit/w108-market-starter-drop.test.mjs tests/unit/w108b-ux-compression.test.mjs tests/unit/w108c-realm-device-lab.test.mjs tests/unit/w108d-marketplace-trust-policy.test.mjs tests/unit/w108e-route-certification.test.mjs
npm run build
```

Then deploy to Cloudflare Pages preview and manually inspect:

```text
/
/chat.html
/eon-browser.html
/build
/create
/vault
/market
/marketplace
/realm
/trust
```

Deploy to production only after preview passes.

After production deploy, capture screenshots for the same routes on desktop and mobile and write a short production evidence report.
