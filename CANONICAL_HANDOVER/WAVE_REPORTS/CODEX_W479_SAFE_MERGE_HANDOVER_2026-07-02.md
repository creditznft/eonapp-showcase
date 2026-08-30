# Codex Safe Merge Handoff — W479 City/Realm Start-Here Source Foundation

## Source of truth

Use the accompanying W479 source ZIP and verify its SHA-256 before extraction. The archive intentionally excludes `node_modules`, `dist`, `.git` and transient runtime output.

## Safe implementation summary

W479 adds a local-only City orientation layer, not a new commercial or network feature.

- `assets/js/city/eon-city-first-run.js` owns exactly three safe, local guide choices.
- `assets/js/eon-city-play-station.js` renders the non-blocking Start here surface only for direct City entry.
- The choices are normal anchors. Do not replace them with `window.location`, scripted redirects, auto-navigation, a router call, background prefetch, account connection, media generation or external action.
- `config/w479-city-realm-playable-contract.mjs`, `scripts/w479-city-realm-playable-gate.mjs` and `tests/unit/w479-city-realm-playable.test.mjs` enforce the source boundary.
- W479-M remains metadata-only/manual/export-first for 13 prospective platform handoffs.
- W479-V and W481 are recorded programmes; they are not live voice or direct-publishing implementations.

## Required clean verification

```bash
npm ci
npm run verify:w479-city-realm-source-foundation
npm audit
npm run security:secret-scan
```

Expected outcomes:

- 541/541 current runnable-product tests pass;
- 3 W479 City/Realm tests pass;
- 3 W479-M creator distribution tests pass;
- build, smoke, site audit and source readiness pass;
- full and production dependency audits are zero vulnerabilities;
- workspace secret scan reports no potential secrets.

## Manual review after deployment — still mandatory

Do not label W479 production-complete until a reviewer captures evidence for:

1. `/eoncity` first entry on desktop and mobile;
2. Start here panel: each of the three user clicks, no automatic route change;
3. City loading/fallback/retry and direct-entry mobile behaviour;
4. keyboard, touch, controller and reduced-motion behaviour;
5. sustained performance and visual review on the declared device matrix;
6. W476-B/W477/W478 deployed browser, CSP, route, PWA, accessibility and identity evidence.

## Do not activate in this merge

- direct social OAuth, token storage, social uploads, scheduling or auto-posting;
- local image/video generation adapters or claims;
- Dictate/Use Voice controls without an evidence-gated adapter;
- Dodo/payment/entitlement logic;
- wallet, marketplace, trading, rewards, referrals or value claims.

## Next work after this checkpoint

- W479-V: a capability-gated Dictate-first experience, then evidence-gated Use Voice.
- W479-M: beginner Local Creator Media installation and runtime proof.
- W479.5: non-payment certification.
- W480: Dodo only after W479.5 owner GO.
- W481: serial direct-publishing connectors once each platform proves its own requirements.
