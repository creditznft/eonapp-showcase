# W223 test commands

## Passed in this handover environment

```bash
npm run qa:w223-invite-share-center
npm run qa:w212-market-links
npm run qa:w215-monetization-decision
npm run qa:w216-release-candidate
```

The release-candidate chain includes route synchronization, W217 route contract, W219 EONBOT, W220 Market, W221 City, W222 My Realm, W223 Invite & Share Center, W180–W215 final checks, source syntax, zero-warning lint, production build, smoke, site audit, PWA/install, page/identity/quality gates, and `npm audit --omit=dev`.

## Browser test present but infrastructure-blocked

```bash
npm run qa:w223-invite-share-center:browser
```

Set `CHROMIUM_PATH` to a permitted Chromium executable when bundled Playwright browsers are not installed.
