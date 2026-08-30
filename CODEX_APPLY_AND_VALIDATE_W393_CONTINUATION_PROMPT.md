This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex Prompt — Continue EONAPP From W393

You are continuing EONAPP from `EONAPP_NEXT_CHAT_W380_W393_CONTINUATION_HANDOVER_2026-06-27.zip`.

## First steps

1. Extract the zip.
2. Use Node 22.
3. Run:

```bash
npm ci
npm run lint -- --max-warnings=0
npm run test:unit
npm run qa:w392-direct-eoncity-entry
npm run qa:w393-command-deck
npm run build
npm run smoke:build
npm run audit:site
npm run launch:readiness
```

4. Do not deploy until these pass and screenshots are captured.

## Continue with W394

Implement City mobile/touch/HUD polish:

- Reduce overlay clutter.
- Make Command Deck panel safe on mobile/narrow desktop.
- Improve touch actions.
- Keep EON City direct-entry flow.
- Do not restore portal friction.
- Do not make Three.js a separate public route.

## Then plan W394B / W382B / W388A

- Multilingual voice selector and Guide Mode core translation.
- File viewer registry and safe previews.
- EON Share draft/export/native-share only.

## Boundaries

Do not enable:

- Referral rewards.
- Social posting connectors.
- TikTok/Instagram/YouTube publishing.
- Store/payment/NFT/lootbox.
- Account-backed entitlements.
- Silent cloud backup.

Those require later gates.
