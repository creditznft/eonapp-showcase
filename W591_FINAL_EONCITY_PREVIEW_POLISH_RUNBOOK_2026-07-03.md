# Codex Runbook — W591 Final EON City Preview Polish

## Purpose

Validate the W591 Command Horizon Quality Summit on the named preview that is
already required by W575. W591 is a source and presentation polish wave. It does
not create approval to deploy or promote production.

## First: source validation

```bash
npm ci
EONAPP_TEST_CONCURRENCY=8 npm run verify:w555a-w591-source
```

Record the exact exit result and build identity before merging or deploying.

## Required preview checks

### Guest lane

1. Open `/eoncity` in a clean context.
2. Confirm the access station is shown and the heavy City renderer does not boot.
3. Visit legacy `eoncity-play.html`, `/eoncity/play`, and `/eoncity-play`.
4. Confirm each reaches `/eoncity` and does not expose a guest renderer path.
5. Capture final URL, screenshot, console/page errors, and failed network calls.

### Authenticated preview lane

Use only the human-created, short-lived storage state described in the W575
runbook. Do not automate credentials, CAPTCHA, consent, MFA, recovery, or token
creation.

1. Enter `/eoncity` through normal access.
2. Verify the direct HUD presents only **Start here, EONBOT, Command Deck, Menu**.
3. Verify the Arrival Compass begins with Command Deck wayfinding; test its guide,
   route-choice, and Command Deck buttons. Cancel/return from review surfaces.
4. Open EONBOT, Command Deck, Menu, Device Lab, and any two other panels in
   sequence. Confirm only one modal panel remains visible each time.
5. Test desktop keyboard/mouse, touch, portrait companion, landscape, reduced
   motion, sound off, refresh/recovery and low-quality fallback as applicable.
6. Exercise the W575 four-region journey: Arrival Gate → Command District →
   Creator Atrium → Forge Bay.

## Evidence to return

- Screenshot set: access station, direct entry, Arrival Compass, Command Deck,
  one overlay transition, mobile portrait, and mobile landscape.
- One uninterrupted authenticated gameplay recording.
- Console errors, page errors, and failed requests with known benign exclusions.
- Control inventory including W591 compass and overlay behavior.
- A pass / fail / blocked matrix with build identity and browser/device.

## Stop rules

Do not claim W591 polished the live product without the above evidence. A source
pass is not a preview deployment, production deployment, browser certification,
physical device test, Google/OAuth completion, asset license review, security
sign-off, or owner launch approval.
