# EONAPP Remaining Local/Codex Checklist

Use this after extracting the latest zip locally.

## Must run locally

```bash
npm ci
npm run build
npm run smoke:build
npm run launch:readiness
npm run launch:page-gate
npm run security:secret-scan
npm run launch:ops-plan
```

## Browser QA

- Open `/realmworld.html` desktop.
- Confirm EON City is default.
- Confirm private workstation modules are visible to the owner/device.
- Confirm visitors/P2P ghosts cannot access private workstation state.
- Confirm EON City NPCs appear without multiplayer.
- Confirm My Realm still generates/export snapshots.
- Confirm creator sale split preview shows seller wallet and Admin 1 fee wallet.
- Confirm no page claims guaranteed profit or resale value.

## Mobile QA

- Test Android Chrome narrow viewport.
- Test tap controls, camera controls, zoom, minimap readability.
- Test bottom nav and RealmWorld route.
- Test offline page after service worker install.

## Live payment proof before enabling paid launch

- Rotate NOWPAYMENTS_IPN_SECRET.
- Run $1 NOWPayments Supporter proof.
- Confirm idempotency prevents double credit.
- Run $1 direct-EVM proof on Polygon USDC/POL.
- Run or simulate creator split: seller wallet plus Admin 1 micro-fee wallet.
- Save anonymized payload/transaction proof in CodexDocs.

## Launch decision

- No broad launch without build proof, deploy proof, secret scan, and payment proof.
- Soft launch is okay if paid/creator-commerce CTAs stay disabled or clearly beta until proof exists.
