# W575 — Command Horizon Vertical Slice and Live Gameplay Proof Board
## Approved scope · 2026-07-03

## Purpose

W575 turns the existing four-region Command Horizon authored slice into a strict, reviewable gameplay-evidence contract for the first live Codex handover. The product slice remains **Arrival Gate → Command District → Creator Atrium → Forge Bay**. This wave adds no district and no new player capability. It defines exactly what must be tested, what automation may touch, and where a human sign-in/device review is mandatory.

## CEO access decision

- The production Full City stays behind the existing Google/EONAPP signed-in session.
- There is **no public test bypass**, no client-side test unlock, no hard-coded account, no demo password, no CAPTCHA bypass, and no identity impersonation path.
- Codex must test two lanes:
  1. **Public/guest entry**: truthful access station, safe preview guidance, and confirmation that heavy City boot does not start before permitted access.
  2. **Authenticated preview gameplay**: a delegated human completes normal Google sign-in/CAPTCHA/consent in a disposable preview-browser profile. The resulting short-lived browser storage state may be supplied securely outside the repository to Playwright/Codex for post-auth gameplay testing.
- The sign-in bootstrap is a human action. Automated tests may consume an already-authorized preview session, but must never generate, forge, extend, export, commit, upload, or reuse it outside the approved review window.

## Allowed W575 implementation

- A pure source-controlled inventory of the four existing regions and their review obligations.
- Control groups classified as `safe-in-place`, `review-then-cancel`, or `human-only`.
- A Codex Playwright preview template that is disabled unless `EON_CITY_LIVE_GAMEPLAY_RUN=1` and an approved base URL are provided.
- A runbook requiring screenshots, a continuous screen recording, console/page error capture, failed-network capture, a click/control inventory, and written pass/fail/blocked notes.
- Source gates that prove no test bypass, credential, OAuth automation, CAPTCHA automation, remote telemetry, launch approval, or automatic certification was introduced.

## Non-negotiable boundaries

- No new district, account field, identity/entitlement implementation, AI activity, mission, reward, payment, subscription, checkout, social/multiplayer, remote asset, telemetry, or live service.
- No hidden work confirmation. A Codex browser test may inspect a prepared review, then cancel it; it must never confirm a native route, connector, provider call, payment, or work action.
- W562 microphone/voice and W572 sound remain explicit and off by default. Automated proof may assert that state but must not enable microphone, speech recognition, capture, streaming, or audio.
- W573 ambience and W574 sky profiles remain authored visual presentation only. They are not tested as real traffic, events, time, weather, calendar, forecast, or live condition.
- No deployment, browser certification, device claim, OAuth completion claim, or production claim is made by this source wave.

## Acceptance criteria

1. The review manifest contains Arrival Gate, Command District, Creator Atrium, and Forge Bay in that order.
2. The manifest covers lifecycle/recovery, wayfinding/district review, companion/work review, visual/accessibility/sound boundary, and local validation/proof boundary.
3. The guest lane never asserts access to the full renderer; the authenticated preview lane requires a human-originated Google session and explicitly forbids a bypass.
4. The external Codex proof template is opt-in, requires a configured preview URL, and uses a storage-state path outside the repository for a pre-authorized test session.
5. Every automation template action is either safe in place or review-then-cancel. Human-only actions are listed but not executed automatically.
6. The source gate and unit tests reject credentials, test unlocks, OAuth/CAPTCHA automation, remote telemetry, automatic certification, automatic launch approval, and scope creep.
7. A Codex live proof is valid only when the post-deployment checklist and artefacts exist; source validation alone remains `LIMITED_PREVIEW_ONLY`.

## Proof separation

- **Source proof**: manifest, gate, tests, build, static audit, no production claim.
- **Codex preview proof**: real deployed URL, normal human Google sign-in bootstrap, stable pre-authorized preview session, browser inventory, gameplay journey, screenshots/video/logs, and written result.
- **Human/device proof**: owner or delegated reviewer covers real desktop, Android, iPhone/iPad, keyboard/mouse/touch/controller, reduced-motion, audio-off, recovery and visual judgement.
- **Production proof**: only after preview evidence is accepted, separate deployment checks pass, and the owner provides explicit go/no-go approval.
