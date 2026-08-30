# Codex — W228 Merge, Deploy, Browser and Device Proof

## Merge posture

- Treat this handover as the source of truth over older W217–W227 notes when they conflict.
- Preserve the route contract, W228 no-go commercial boundary, and archived-module boundaries.
- Do not merge `.env`, `.env.local`, API keys, wallet keys, seed phrases, production credential values, browser binaries, `node_modules`, or build output.
- Keep Node 22 and `npm ci`.

## Required commands before Preview deployment

```bash
node --version
npm ci
npm run security:secret-scan:ci
npm run qa:w216-release-candidate
npm run build
```

The CI secret scan intentionally requires a real Git checkout with complete reachable history. Use `fetch-depth: 0` in GitHub Actions.

## Browser proof commands

```bash
npx playwright install chromium
npm run build
npm run qa:browser-proof:current
```

Run against local Preview first, then set `PLAYWRIGHT_BASE_URL` to the Cloudflare Preview URL and run the same current suite. Keep traces/screenshots on failure.

## Required screenshot set

1. Chat desktop: sidebar expanded/collapsed, profile avatar, Invite & Share Center, three-dot menu, local thread create/rename/delete/restore.
2. Chat mobile portrait and landscape: drawer focus/close, composer and keyboard, no overlap.
3. Share Center: EONAPP/City/Workspace/Realm identity modes, QR/copy, campaign draft, clear no-reward/no-auto-post statement.
4. Market: empty first load, explicit Generate 4 originals, progressive cards, save/reload, reduced motion.
5. EON City 2D desktop/mobile portrait/mobile landscape: avatar, movement, collision, objective, minimap, City landmarks, return path.
6. EON City 3D capable desktop: explicit opt-in, quality control, city parity, fallback to 2D.
7. Realm Studio: create/name/theme/showcase/save/reload/share; prove link has no private state.
8. Vault: encrypted export/restore workflow; prove raw secrets do not render.
9. PWA: install/update/rollback/offline on Android, iPhone Safari/Add to Home Screen, desktop Chrome/Edge.
10. All canonical routes: no loop, no broken anchor, no 4xx, no unexpected network calls, no console errors.

## Device matrix

- 4 GB Android/slow device: Chat, Market, City 2D, no false local-model claim.
- Mid-range Android: PWA, portrait/landscape City and optional 3D gate.
- iPhone Safari: drawer, share behavior, Add to Home Screen, keyboard/safe area.
- Desktop Chrome/Edge: 3D quality/fallback, PWA update, Local AI runtime discovery/self-test.
- Reduced motion + data saver + no WebGL: 2D only and no blocked route.

## Deployment stop conditions

Do not deploy or roll forward if any of these occur:

- a redirect loop, static legacy page bypass, broken fragment, or dead back navigation;
- a chat/Vault/Realm/Market private datum appears in a share link;
- a reward, commission, payout, token, checkout, provider offer, auto-posting, or social account connection can be activated;
- a service-worker update fails or wipes local records;
- 3D blocks core use or does not return safely to 2D;
- console errors, CSP failures, bad security headers, or unexpected commercial network calls;
- any production secret is found.

## Rollback

1. Keep the last known Cloudflare Pages production deployment ID.
2. If release proof fails, roll Cloudflare Pages back to that deployment.
3. Do not purge user-side storage; investigate migrations first.
4. Export failing screenshots/traces/network logs into a dated `evidence/w228-preview/` folder.
5. Make a minimal follow-up patch with a new manifest/checksum; never hot-edit the deployed output.
