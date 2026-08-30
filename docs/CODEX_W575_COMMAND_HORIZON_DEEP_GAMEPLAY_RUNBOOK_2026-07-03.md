# Codex Runbook — W575 Command Horizon Deep Gameplay Proof

## Goal

Exercise the deployed Command Horizon City as a real player would while preserving the identity, privacy, work-review, and commercial boundaries. This runbook does not authorize a deployment and does not turn a source result into launch approval.

## Preconditions

1. Codex has a named preview deployment URL, not a local HTML file and not an unapproved production target.
2. The preview route is reachable at `/eoncity` and the preview build exactly matches the handed-over source/build identity.
3. A designated human completes ordinary Google/EONAPP sign-in in a fresh preview-browser profile. CAPTCHA, consent, and any account notice are completed manually.
4. The human exports a short-lived Playwright storage-state file **outside the repository** and transfers it through the approved secret/evidence channel. Do not commit it, print it, upload it to the handover, or reuse it after the test window.
5. Configure only these runtime values in the secure runner environment:
   - `EON_CITY_LIVE_GAMEPLAY_RUN=1`
   - `EON_CITY_LIVE_BASE_URL=https://<approved-preview-host>`
   - `EON_CITY_AUTH_STORAGE_STATE=/secure/path/to/preview-storage-state.json`
   - `EON_CITY_PROOF_OUTPUT_DIR=/secure/evidence/output`
6. Run the source gate before deployment and the Playwright proof template after deployment. A missing URL/session must produce a blocked result, not a fake pass.

## Do not do

- Do not automate Google username/password entry, CAPTCHA, consent prompts, MFA, or account recovery.
- Do not add a query parameter, feature flag, cookie, localStorage record, test account password, public route, or client code that bypasses City access.
- Do not confirm work actions, provider actions, routes, payments, subscriptions, permissions, microphone, voice, sound, sharing, or connector activation.
- Do not record, export, or upload private project, Vault, chat, prompt, session, cookie, or identity data.

## Required evidence lanes

### 1. Guest/public entry

- Open `/eoncity` in a clean context with no saved session.
- Capture entry screenshot and console/network log.
- Confirm that the page gives truthful access guidance and the heavy renderer does not boot until access is allowed.
- Record `pass`, `fail`, or `blocked`; do not interpret an access restriction as a product failure when it matches the policy.

### 2. Authenticated preview City

- Create a context from the human-provided short-lived storage-state file.
- Confirm the City enters through the normal access endpoint and reaches the renderer.
- Capture initial frame, console/page errors, failed requests, and one continuous screen recording.
- Test each region in order: Arrival Gate, Command District, Creator Atrium, Forge Bay.
- Test each review action: focus, guide, inspect, and Quick Open review. For anything that could leave the City or act on work, verify the review and choose **Cancel**.

### 3. Every safe City control

Inventory every interactive City control. Classify each result as:

- `safe-in-place`: click and validate result, then restore state.
- `review-then-cancel`: open the review and cancel; never confirm.
- `human-only`: record visible state and why it requires human/device review; do not automate it.

Required control groups are encoded in `assets/js/city/eon-city-command-horizon-proof-manifest.js`.

### 4. Device and accessibility handoff

Codex must produce a separate matrix for desktop keyboard/mouse, Android touch, iPhone/iPad Safari, tablet, controller where available, portrait/landscape, reduced-motion, sound-off, recovery/refresh, and offline/cache recovery. Browser automation can assist but does not replace a physical-device human check.

## Required artefacts

- Timestamped screenshot set, including the initial frame and each region
- One continuous gameplay recording per lane
- Control inventory with selector/control, action class, result, and note
- Browser console errors and page errors, with known harmless exclusions documented
- Failed-network-request log, response statuses, and route title/URL capture
- Performance observations labelled as observed, not certified
- A final table: pass / fail / blocked / not-run, owner, build identity, device/browser, and defect links

## Exit rule

Codex may recommend a preview iteration only. Production promotion requires the preview evidence, explicit device review, identity/OAuth review, security review, asset provenance, and a human owner go/no-go decision.
