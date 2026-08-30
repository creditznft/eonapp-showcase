# Codex Brief — W600A Production Closeout + W607 City Evidence

## Source baseline

Use the full W607 sanitized source backup from this session. Do not merge old W596–W598 lines. Preserve the W599 guest/signed-in access gate and client-only AI policy.

## Do first: W600A real production closure

1. Inspect current `origin/main` and deployed asset hashes; do not assume this package is already live.
2. Apply the W607 delta exactly, then clean-install/lint/test/build before deployment.
3. Deploy normally.
4. Use only a human's normal signed-in browser plus a loopback DevTools endpoint. No Codegen login, cookie injection, storage state, fake session or Google bypass.
5. Run:

```bash
EON_CITY_AUTH_BASE_URL=https://eonapp.ch \
EON_CITY_CDP_ENDPOINT=http://127.0.0.1:9222 \
node scripts/w599-run-authenticated-eoncity.mjs
```

6. Save redacted summary, screenshots and deployed SHA. The run must include `pointerOwnership` for Start Here. A canvas-above-control stack is a real failure, not a test flake.

## Then: W607 gameplay proof

Do not expand districts until the Command Horizon pilot passes. Create an evidence folder with desktop mouse/keyboard, controller, touch landscape, low-end mobile Lite and reduced-motion captures. Prove direct click/tap for the featured pilots; move/camera/collision; Voice/Chat UI; portal enter/return; refresh/resume; and performance observations.

## Non-negotiables

- No generic `Interact` in direct-entry HUD.
- No invisible proximity auto-navigation or automatic actions.
- Voice requires an explicit user action and remains captions-first until a real Chat voice adapter is separately proved.
- Do not claim final art/AAA/KTX2/device approval from source tests.
- Do not touch payment, subscription, wallet or social posting paths in this wave.

## Required commands before external testing

```bash
npm ci
npm run lint -- --max-warnings=0
npm run qa:w607-city-gameplay-contract
node --test tests/unit/w599-authenticated-city-access-and-cache.test.mjs
node --test tests/unit/*.test.mjs
npm run build
npm run smoke:build
```
