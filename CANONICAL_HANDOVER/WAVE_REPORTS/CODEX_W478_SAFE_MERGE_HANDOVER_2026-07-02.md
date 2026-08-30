# Codex handover — W478 accessibility, identity, device evidence and Creator Distribution Bridge

## Scope

Merge this package as the continuation from W477. It completes **W478 source controls** and prepares the **W479-M6 metadata-only Creator Distribution Bridge**. It does not enable local media generation or social publishing.

## Do not change these truth boundaries

- Do not claim accessibility certification, real-device compatibility, live OAuth, update-safe recovery or two-device Sync without the independent evidence lanes.
- Voice and microphone stay off until the user explicitly starts them; typed interaction remains available.
- Do not infer Sync Basic from local backup or enable it without its own reviewed proof.
- Do not call a local image/video runtime working until its own adapter proves connection, capability discovery, generation, cancellation/error, local output, CORS/PNA and device behavior.
- Do not connect social accounts, store platform tokens, upload media, create remote posts, schedule posts or treat web intents/native share as direct publishing.
- Preserve the Post Pack as metadata-only. It must reject media bodies, credentials and secrets.
- Do not start Dodo/payment work.

## Run before merge

```bash
npm ci
npm run qa:w478-experience-identity-device
npm run qa:w479m-creator-distribution-bridge
npm run lint -- --max-warnings=0
npm run release:verify
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
npm run security:secret-scan
npm audit
npm audit --omit=dev
```

## Deploy and capture remaining evidence

1. Complete the W476-B/W477 preview/live browser, CSP, route and network-origin protocol before legacy/origin cleanup.
2. Follow `docs/W478_ACCESSIBILITY_IDENTITY_DEVICE_EVIDENCE_PLAN_2026-07-02.md` for the seven W478 independent evidence lanes.
3. Keep W479-M creator media as a later, device-proven programme. Use `docs/W479M_CREATOR_MEDIA_DISTRIBUTION_BRIDGE_2026-07-02.md` for the Post Pack boundary.
4. Do not report a source pass as production certification.

## Key files

- `config/w478-experience-identity-device-contract.mjs`
- `release-evidence/W478_EXPERIENCE_IDENTITY_DEVICE_SOURCE_READINESS_2026-07-02/W478_BOARD.json`
- `scripts/w478-experience-identity-device-gate.mjs`
- `tests/unit/w478-experience-identity-device.test.mjs`
- `config/w479m-creator-distribution-contract.mjs`
- `assets/js/creator/creator-distribution-handoff.js`
- `scripts/w479m-creator-distribution-contract-gate.mjs`
- `tests/unit/w479m-creator-distribution-contract.test.mjs`
- `docs/W478_ACCESSIBILITY_IDENTITY_DEVICE_EVIDENCE_PLAN_2026-07-02.md`
- `docs/W479M_CREATOR_MEDIA_DISTRIBUTION_BRIDGE_2026-07-02.md`
