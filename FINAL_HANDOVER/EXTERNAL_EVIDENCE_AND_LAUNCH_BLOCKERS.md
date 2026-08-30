# External evidence and launch blockers

## Source-complete does not mean launch-ready

The source/static gates are green. The following items cannot be truthfully completed in this managed sandbox and must be independently evidenced before beta or production promotion.

## Required evidence packets

### W282 — normal-browser Lighthouse

Run `npm run lighthouse:desktop` and `npm run lighthouse:mobile` on a normal browser-capable desktop/local or approved Preview environment. Retain raw reports, a redacted manifest, source SHA, route list, browser/version, date/time, valid scores, and blocked routes. `NO_NAVSTART`, `chrome-error://chromewebdata`, or missing reports are `ENVIRONMENT_BLOCKED`.

### W259 / W266 — City visual/device/accessibility proof

Use the screenshot matrix in `FINAL_HANDOVER/screenshots/CAPTURE_MANIFEST.csv`. Cover desktop Chrome, mid-range Android, low-end Android, iPhone Safari, keyboard-only desktop, reduced-motion, and optional controller. Verify City Lite, Three.js, Babylon, empty/active/huddle/handoff/review/result/attention states, explicit Manage/Review in Chat, no raw private data, and fallback behavior.

### W276 — observed update/restore proof

Use a disposable same-origin browser profile and harmless synthetic state only. Demonstrate update/reload and PWA update behavior while checking state survival before/after. A restore failure blocks release.

### W283 — owner-only Cloudflare/D1 inventory

Use `docs/CLOUDFLARE_AI_W283_READ_ONLY_EVIDENCE_PROMPT_2026-06-25.md`. It permits only Pages deployment labels/times, D1 names/metadata, and `sqlite_master` schema metadata. No account IDs, D1 IDs, row reads, migrations, bindings, Workers, secrets, deploy, rollback execution, referral activation, or configuration changes.

### W268 — named owners and observed drills

Assign actual release, security, data/recovery, support, and product owners. Record City fallback, restore, Preview rollback-plan, support-evidence-pack/manual review, and referral-stays-off drills.

### W278 / W279 — qualified legal and independent security review

Legal review must cover privacy, optional voice, BYOK/provider terms, referral/reward rules, consumer copy, and any future EON Lite value-transfer proposal. Security review must include storage, update/restore, BYOK/CSP, City inputs, EONBOT proposal/receipt gates, and any future Cloudflare/D1 or chain design.

### W270 / W289 / W290 — governance, beta, final recertification

Only after all predecessors have raw evidence and named owners can the independent decision board consider a controlled beta. No source test, static report, or self-review can substitute.

## Required redacted return bundle from Codex

1. Git commit SHA and package-lock SHA-256.
2. Local command receipt summary.
3. Preview URL only if owner authorised it.
4. Raw Lighthouse files plus redacted index.
5. Screenshot/video evidence index (not private content).
6. W276 before/after state proof.
7. W283 redacted report.
8. W268 named-owner/drill records.
9. W278 legal sign-off or blocker.
10. W279 security report/retest or blocker.
11. A final W289/W290 decision: `PASS`, `FAIL`, or `BLOCKED`.
