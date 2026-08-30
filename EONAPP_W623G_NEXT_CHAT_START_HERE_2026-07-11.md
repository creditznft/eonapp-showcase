# Start Here — Continue From W623G

Date: 2026-07-11  
Authoritative completed source checkpoint: W623G  
Next wave: W623H

## First instruction

Use the W623G full source snapshot included with this handover. Do not restart from W623F, production, or an older Codex worktree. Verify the source ZIP checksum, read the validation receipt, CEO viral decisions, changed-files report, roadmap, ledger and W623H runbook before editing.

## Current truth

- Primary navigation remains EONBOT, Create, Projects, Library and EON City.
- Universal Share source coverage spans 31 active app/site-shell pages.
- Share Command Center includes Invite, Creation, Milestone and Campaign paths.
- Local image/video sharing is explicit native handoff only; EONAPP does not upload or auto-post media.
- EONKEY referral rewards are not active. No share, click, signup, post or purchase grants a key in W623G.
- Paid promotion of reward links is not recommended until W629 proves attribution, qualification and reversal.
- Source viral readiness is 7.2/10, not 10/10.
- Browser/OS voice fallback uses no EONAPP API key; offline/local speech remains unproven.
- Release remains limited preview / NO-GO.

## W623H required work

1. Run the included desktop/mobile Share browser proof on a machine whose Chromium can open localhost, or on an immutable deployed preview.
2. Capture Chat, Create, Projects, Library, Profile, Billing, Support and EON City Share evidence.
3. Test a real local image, real local video and generated PNG through native share and fallback paths.
4. Execute the 11-language recognition/spoken-reply matrix, Arabic RTL and CJK IME proof.
5. Verify deployed W623G parity before starting parallel W624/W625/W626 work.
6. Keep rewards and paid referral promotion inactive; do not pull W629 forward by browser simulation.

## First commands

```powershell
npm ci
npm run qa:w623c-commercial-truth
npm run qa:w623d-production-reachability
npm run qa:w623e-information-architecture
npm run qa:w623f-certification-v2
npm run qa:w623g-share-voice-growth
npm run build
$env:EON_W623G_BASE_URL = "http://127.0.0.1:4173"
npm run evidence:w623g-share-browser
```

Set `EON_CHROMIUM_PATH` only when using an already-installed compatible browser.
