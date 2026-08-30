# W574 — Open-Sky Visual Profiles Scope Board
## Approved local-source scope · 2026-07-03

## Product purpose

Give Command Horizon a small, deliberate set of readable open-sky looks that a person may select for the current City session. These are authored visual styles only. They do not describe the person’s location, local time, real weather, a forecast, or an external City condition.

## Allowed implementation

- Four source-controlled visual profiles: Dawn Glass, Clear Horizon, Violet Dusk, and Signal Storm.
- A source-defined default profile and an explicit in-City selection control.
- Session-only selection: profile choice is held in the active City session, never saved, synced, or inferred.
- Lite and reduced-effects states keep a static readable sky, fixed fog, and fixed local lighting. No animated atmosphere layer runs in either state.
- Balanced/Cinematic may render a strictly capped one/two procedural horizon or arc layers using existing Babylon geometry and materials.
- Existing pause and reduced-effects guards stop all W574 animation. The scene remains readable with no motion.
- A local runtime summary may report only the current profile id/label, quality, bounded layer count, and source-only truth.

## Non-negotiable boundaries

- No device clock, geolocation, weather service, forecast, calendar, countdown, live event, activity inference, tracking, or telemetry.
- No network, remote asset, stream, binary-art loader, edge proxy, storage, browser permission, background task, or external provider.
- No audio start, microphone, speech recognition, TTS, voice consent, audio capture, or audio preference change. W562 and W572 remain unchanged.
- No account, project, prompt, Vault, identity, private work, entitlement, payment, ownership, collectible, reward, social, multiplayer, route-opening, or autonomous-work field.
- No fake weather claim or real-world time-of-day claim. “Dawn,” “dusk,” and “storm” are visual style names only.
- No preview deployment, production deployment, browser visual certification, or physical-device performance claim.

## Acceptance criteria

1. A pure source module returns one allowlisted visual profile for a supplied quality/profile id without reading time, device state, or external information.
2. Lite and reduced-effects plans have zero animated atmosphere layers while retaining a static sky and fixed lighting.
3. Balanced/Cinematic layer budgets are finite and validated; all geometry is procedural, decorative, local-only, and noninteractive.
4. The Babylon scene can apply a profile during the active session without re-entry, persistence, audio activation, or route/action side effect.
5. City settings describe the control as session-only and explicitly say it is not time, weather, or a forecast.
6. Source gate and unit coverage prove no clock, weather service, calendar, network, storage, audio, voice, private-data, commercial, entitlement, social, or workload scope expansion.
7. Full source validation and an updated portable handover are required before any later deployment decision.

## Evidence boundary

Source validation can prove the local contract and bounded code paths only. Human visual review, actual-device performance review, preview deployment, production deployment, account/OAuth completion, and any external proof remain separate and unclaimed.
