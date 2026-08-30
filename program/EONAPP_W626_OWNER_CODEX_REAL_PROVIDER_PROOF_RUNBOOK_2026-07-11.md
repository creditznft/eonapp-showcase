# W626 Owner/Codex Real Provider Proof Runbook

Date: 2026-07-11

## Safety prerequisites

- Begin from the packaged W626H authoritative source and verify its checksum.
- Run only `npm ci` followed by `npm run verify:codex-predeploy` before external proof.
- Use dedicated low-spend provider accounts and owner-approved models.
- Never paste provider credentials into chat, source, logs, screenshots or EONAPP browser storage.
- Keep every model in `config/w626-reviewed-provider-models.json` disabled until its identifier, inputs, outputs, cost behavior and account availability are owner-reviewed.

## Companion proof

1. Build the companion locally from `creator-companion/`.
2. Verify it binds only `127.0.0.1:47826` and refuses LAN/public binding.
3. Pair from an allowlisted EONAPP origin using the short-lived six-digit challenge.
4. Verify session expiry, wrong-origin rejection, wrong-code rejection and replay rejection.
5. Store a test credential through the operating-system secure store; prove no plaintext file or browser storage copy exists.
6. Run diagnostics, update rehearsal and uninstall rehearsal without exposing the credential.
7. Record platform signature/notarization/package-signing evidence. Unsigned builds remain development-only.

## Provider/model review

For each selected fal and Replicate image/video model:

1. Confirm current provider documentation and account availability.
2. Review remote model identifier, media kind, input modes, output types, region/account limits and current cost visibility.
3. Record reviewer, date and registry digest; enable only that reviewed row.
4. Keep automatic paid retry disabled.

## Mandatory real image lanes

For each provider:

- Capability/account preflight.
- Explicit provider disclosure and per-job budget acknowledgement.
- Submit one bounded image request through EONAPP and the signed companion.
- Observe waiting/running/completed states.
- Fetch only allowlisted image media.
- Save and reopen through EONAPP; record digest integrity.
- Prove cancellation, rate limit/quota and one provider error lane.

## Mandatory real video lanes

For each provider:

- Review text-to-video and/or image-to-video capability before enabling.
- Submit one bounded low-cost video request.
- Restore a long-running job after page/app restart.
- Prove cancellation and expired-result handling.
- Save/reopen/play the provider result through EONAPP.

## Mobile proof

- Use only reviewed OAuth, short-lived credential or signed native/companion paths.
- Prove ordinary mobile browser storage never receives a permanent provider key.
- Where no safe path exists, record the explicit desktop/unavailable fallback as a pass, not a hidden workaround.

## Network and privacy proof

Capture destination metadata only—never prompts, credentials, references or media bodies. Demonstrate:

- EONAPP browser to loopback companion.
- Companion directly to the selected provider and reviewed media origin.
- No EONAPP/Cloudflare generation proxy.
- No EONAPP server media storage or job logging.
- Redacted local history export and explicit deletion.

## Certification

Populate `config/w626-byok-certification-board.json` only from collected real evidence. Do not change `publicAvailabilityClaimAllowed` to true until every required row passes and the companion release is signed with secure credential storage and loopback-origin authentication proven.
