This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP — W260 R3 A1/A2/A3 roadmap, performance and referral-state freeze

## What this freeze adds

- **A1:** ongoing AI provider API/change control with user-initiated BYOK model-list readiness.
- **A2:** whole-site route inventory and static delivery gate for 121 public route variants, plus honest Lighthouse environment-block handling.
- **A3:** referral/milestone/Cloudflare source-state audit that keeps the current program inactive and fail closed.
- **Roadmap:** all original W255–W290 waves are retained. W281–W290 now have explicit planned labels; W277 privacy and W278 legal/compliance remain unchanged.
- **W234 repair:** its legacy referral audit now validates the hash-verified archive boundary instead of expecting an intentionally retired active file.

## Read first

1. `docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md`
2. `HANDOFF/W260_R3_A1_A2_A3_ROADMAP_PERFORMANCE_REFERRAL_2026-06-25/STATUS.md`
3. `HANDOFF/W260_R3_A1_A2_A3_ROADMAP_PERFORMANCE_REFERRAL_2026-06-25/CODEX_CONTINUATION_PROMPT.md`
4. `docs/W260_R3_A3_REFERRAL_MILESTONE_CLOUDFLARE_STATE_2026-06-25.md`
5. `EVIDENCE/W260_R3_A1_A2_A3_ROADMAP_PERFORMANCE_REFERRAL_2026-06-25/00_STATUS.md`
6. `release-evidence/W260_RELEASE_BOARD_2026-06-25/RELEASE_BOARD.json`

## Verified local results

- **220/220** current-product tests.
- Zero-warning lint.
- Fresh **193-file** production build.
- **121/121** public route variants reached terminal local HTML through expected internal redirects.
- W145, W234–W238, W247, W259, W260, W266, W276, smoke, site audit, launch readiness, PWA static QA and secret scan passed.
- Root and Smart Contracts production-only dependency audits: **0 vulnerabilities**.
- W258 C0-I: 16/16 offline compiler labels and 9/9 tests; still fail-closed/offline-only.

## Hard truth / no-go limits

- Lighthouse browser scores are not collected here. Managed Chromium returned `chrome-error://chromewebdata/` before trace capture. Static delivery passing is **not** a Lighthouse pass.
- No Cloudflare dashboard/D1/binding state was inspected. No Cloudflare change is authorised.
- Referral rewards and access milestones are inactive and must remain so.
- W260 remains **NO-GO**. W258, W259/W266/W276 external evidence and all W260 external lanes remain open. W261 is blocked.
- Development toolchain audit risks remain open: root 6 advisories; Smart Contracts 53 advisories.

## First Codex actions after merge

Follow the continuation prompt exactly. The highest-priority non-code work is: real desktop/mobile Lighthouse reports, W259/W266 device evidence, W276 update/restore drill, and read-only Cloudflare owner inventory. Do not use any of these to activate chain, rewards, referrals or a backend.
