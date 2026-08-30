# EONAPP.CH — W227 Engineering Policy

## Current product truth

- Chat/EONBOT is the primary home.
- AI Cockpit is the focused Workspace tool.
- EON City is a local-first 2D experience; optional 3D renders the same safe CityWorldState.
- My Realm is a personal local district. Public publishing, user storefronts, seller onboarding, attribution, payments, commissions, payouts, rewards, and token actions are **not active**.
- Invite & Share Center creates signed invitation and portable Realm identity links only. It does not publish chats, connect social accounts, track clicks, create a reward, or create a financial referral entitlement.

## EON Lite / smart-contract boundary

Smart-contract source and historic deployment material are retained as **archived research**, not evidence of a live user programme. Do not claim a live Polygon deployment, token mining, Pool Point conversion, airdrop, referral value, cash-out, payout, or withdrawal flow unless a separate activation decision includes independently verified chain, roles, treasury, security, legal, tax, payment, and support evidence.

Never add a hard-coded private key, mnemonic, API key, provider secret, wallet backup, payment secret, or production credential to source, docs, screenshots, tests, or generated artifacts.

## Release discipline

1. Run `npm run security:secret-scan` before local handover work.
2. Run `npm run qa:w227-release-certification` after any route, public-copy, shell, sharing, commerce-boundary, or legacy-retirement change.
3. Run `npm run qa:w216-release-candidate` before packaging a source handover.
4. Treat browser/device proof, Cloudflare Preview/production proof, security headers, accessibility, PWA update/rollback, and live integration checks as external evidence requirements. Do not label them passed from source inspection.
5. Keep `routes:sync` as the only writer for `_redirects` and `public/_redirects`.

## Minimal change rule

- Preserve user local data through versioned migrations and backup/restore evidence.
- Do not reactivate retired pages or old test expectations merely to make an obsolete gate pass.
- Keep all public commercial, reward, token, seller, and payout paths disabled until a separate written go decision is approved.
