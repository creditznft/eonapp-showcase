This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex handover — W286-B2 City Command Loop and W289/W290 external evidence

## Authority and release state

Use this source freeze as the local implementation authority. It contains the W286-B2 live-work huddle/command loop and the W289/W290 evidence board on top of the retained W260–W288 controls.

- Canonical GitHub repository: `creditznft/EONAPP` (private; default branch `main`).
- **W260 remains NO-GO.**
- This is not a deployment, beta, referral, reward, wallet/chain, D1 migration, or production-certification package.
- No GitHub write, merge to `main`, Cloudflare mutation, or deployment is authorised by this handover.

## What is safe to merge locally

W286-B2 adds a bounded, privacy-safe visual command loop:

- City Lite, Three.js Visual Tour, and Babylon City Play derive one local work-huddle view from real mission/approved-agent/operator lifecycle facts.
- A huddle may show focused, parallel, handoff, or review-needed work states, with at most four visible cues.
- Chat/native app surfaces remain the only control, approval, data, and results surfaces.
- Babylon offers a user-tap **Manage in Chat** link; it does not auto-open, start, approve, cancel, publish, or call a provider.
- No prompt, reply, transcript, tool output, model/provider account name, credential, Vault, wallet, payment, referral, or identity data is displayed.

## Local safety-branch procedure

1. Start from a clean clone or clean local checkout. Do not overlay unknown local changes.
2. Confirm the current source package SHA-256 before extracting.
3. Create a local safety branch, for example:
   ```bash
   git switch main
   git pull --ff-only
   git switch -c codex/w286-b2-command-evidence-2026-06-25
   ```
4. Apply the source files as a reviewable diff; do not copy `node_modules`, `dist`, `.env*`, generated reports, archives, or unknown local configuration.
5. Install exactly from the lockfile:
   ```bash
   npm ci
   ```
6. Run the required local checks:
   ```bash
   npm run test:unit
   npm run lint -- --max-warnings=0
   npm run build
   npm run qa:w286-b1-city-agent-presence
   npm run qa:w286-b2-live-work-command
   npm run qa:w289-w290-external-evidence-board
   npm run qa:w265-w286-city-district-expansion
   npm run qa:w283-cloudflare-rollback-evidence
   npm run qa:w284-referral-activation-decision
   npm run qa:current-static-certification:tail
   ```
7. Create a reviewable local commit or draft PR only after all commands pass. Do not merge or deploy from this handover.
8. Return only: commit SHA, lockfile hash, command receipts, raw Lighthouse/device evidence locations, and any blockers. Never return secrets, user data, referral rows, tokens, IDs, or full Cloudflare output.

## External evidence work Codex may coordinate — not perform as a write

### W282 — Lighthouse / Web Vitals

On a normal browser-capable desktop and mobile-capable environment, run:

```bash
npm ci
npm run build
npm run lighthouse:desktop
npm run lighthouse:mobile
```

Keep raw reports outside Git. Reject a missing report, `chrome-error://chromewebdata/`, or `NO_NAVSTART` as **environment-blocked**, not a score.

### W259 / W266 — device and City proof

Use real desktop and touch devices to inspect City Lite, Three.js and Babylon, including:

- empty, focused, parallel, handoff, review-needed, complete and failed work states;
- keyboard, touch, reduced-motion and low-performance fallback;
- readability of visible work cues with no prompt/output leakage;
- explicit return to Chat for actual control/result review.

Capture redacted screenshots/videos and a pass/fail matrix outside Git.

### W276 — observed data restore

Use a disposable profile and same origin. Seed only non-sensitive test state, perform an update/restore rehearsal, and verify allowlisted state survives exactly. Do not use production personal data, secrets, API keys, wallets, or referral rows.

### W283 — owner-only Cloudflare/D1 evidence

Use `docs/CLOUDFLARE_AI_W283_READ_ONLY_EVIDENCE_PROMPT_2026-06-25.md` exactly. It authorises only Pages deployment metadata and D1 schema metadata (`sqlite_master`). It does **not** authorise deployment, preview promotion, rollback execution, D1 row access, schema writes, migrations, bindings, Workers, secrets, rewards, or referral activation.

### W268 / W278 / W279

Use `docs/W268_W278_W279_EXTERNAL_REVIEW_DOCKET_2026-06-25.md` to assign named owners, observe drills, obtain qualified legal review, and obtain an independent security review. These remain external records and must not be marked complete from source inspection alone.

## Hard stops

Immediately stop and return `BLOCKED` if a request would:

- merge to a deployment-triggering branch, deploy Pages/Workers, modify bindings, environment variables or secrets;
- create, migrate, restore, write, export or read rows from D1;
- enable referral/milestone/reward tracking, click/open tracking, short-link registry, or a value ledger;
- create or expose wallet, key/seed, signing, RPC, balance, transfer, token, coin, pricing, exchange, payout, payment, referral value or marketplace behavior;
- claim beta, legal, security, Lighthouse, device, restore or launch completion without independently collected evidence.

## Approval sequence after evidence

W258 → W261/W262 and W284 → W269 must be reassessed only after their independent evidence sets are closed. W289 beta and W290 final recertification remain blocked until the W289/W290 board is independently satisfied.
