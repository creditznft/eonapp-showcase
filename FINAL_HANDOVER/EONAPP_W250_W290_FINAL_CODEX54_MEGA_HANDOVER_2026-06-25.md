# EONAPP W250–W290 — final Codex GPT-5.4 mega handover

**Date:** June 25, 2026  
**Canonical repository:** `creditznft/EONAPP` (private)  
**Deployment project:** `eonapp-ch` / `eonapp.ch`  
**Package role:** cumulative source-only merge, Preview, evidence, and launch-decision handover.

---

## Executive release decision

The W250–W290 source work is packaged as one cumulative snapshot. Local validation passes, but **W260 remains NO-GO** for production, beta, referral/reward activation, D1 writes, Cloudflare mutation, wallet/chain, payment, and final certification.

The source side is complete enough for a professional Codex merge and Preview-evidence cycle. The remaining launch work is independent external proof and accountable sign-off—not more source-only claims.

---

## Non-negotiable CEO product decisions

1. **Chat/native app controls the product.** It is the fastest, safest place to create work, approve actions, inspect data, and review results.
2. **City Lite is the low-device default.**
3. **Three.js Visual Tour is the optional spatial overview.**
4. **Babylon City Play is the flagship showpiece visual command district.** It visualises real local work status but is not a second automation engine, fake-agent theatre, wallet, or game economy.
5. **The City work loop is truthful:** bounded lifecycle facts only — idle, queued, focused, parallel, handoff, review, complete, failed. No prompts, raw results, provider identities, secrets, Vault contents, personal data, referral records, wallet/payment data, fake busy NPCs, or automatic route opening.
6. **EON Lite is future architecture/brand only.** It is not a coin, token, wallet, balance, transfer, payout, reward, or marketplace feature.
7. **REFERRALS_DB stays read-only evidence-only** until the specific W283/W284 approval board is independently closed.

---

## Final local validation receipt

- 279/279 approved current-product tests: PASS
- ESLint zero-warning rule: PASS
- Production build: PASS, 194 generated files
- `qa:current-static-certification:core`: PASS
- `qa:current-static-certification:tail`: PASS
- Workspace secret scan: PASS
- Production dependency audit: 0 known vulnerabilities
- Source archive manifest: verify after extraction with `node FINAL_HANDOVER/verify-final-handover.mjs`

No valid normal-browser Lighthouse score, physical device proof, observed restore proof, Cloudflare/D1 inventory, legal approval, independent security report, named-owner drill, beta decision, or final certification is claimed here.

---

## Package use order

1. Verify ZIP SHA-256 and extract.
2. Run `node FINAL_HANDOVER/verify-final-handover.mjs`.
3. Read the merge runbook below.
4. Merge on a local safety branch only.
5. Run fresh `npm ci`, validation, City proof tooling, and draft-PR review.
6. Run a manual Cloudflare Preview workflow only after the owner authorises Preview.
7. Gather external evidence and return a redacted evidence bundle.
8. Do not merge to `main` until the W289/W290 decision board is actually closed.

---

# Codex GPT-5.4 merge and Preview runbook

## Mission

Merge this cumulative W250–W290 source snapshot into a **local safety branch** of `creditznft/EONAPP`, validate it from the lockfile, collect redacted external evidence, and prepare a reviewable Preview deployment. Do not merge to `main` or trigger production Pages deployment until the final decision board is closed.

## 0. Hard safety boundaries

Never: copy secrets; edit `.env*`/`.dev.vars`; inspect or export referral rows; write/migrate D1; bind a Worker; modify Cloudflare settings; deploy with Wrangler directly; activate referral/rewards/milestones; add a wallet/chain/token/payment function; claim a score or review that has not been independently evidenced.

A push to `main` triggers the repository CI/deploy chain. Treat `main` as a production-triggering branch. Use a separate safety branch and the Preview workflow only.

## 1. Verify and extract

PowerShell from the directory containing the delivered archive:

```powershell
Get-FileHash .\EONAPP_W250_W290_FINAL_CODEX54_MERGE_DEPLOY_HANDOVER_2026-06-25.zip -Algorithm SHA256
Expand-Archive .\EONAPP_W250_W290_FINAL_CODEX54_MERGE_DEPLOY_HANDOVER_2026-06-25.zip -DestinationPath .\EONAPP_W250_W290_FINAL -Force
Set-Location .\EONAPP_W250_W290_FINAL
node .\FINAL_HANDOVER\verify-final-handover.mjs
```

The calculated archive hash must equal the adjacent `.sha256` file. The manifest verifier must return `ok: true`.

## 2. Start a clean merge branch

```powershell
Set-Location C:\Users\<you>\WORKSPACE\EONAPP
git status --short
git switch main
git pull --ff-only
git switch -c codex/w250-w290-final-merge-2026-06-25
```

Stop if the working tree is not clean or if `main` cannot fast-forward. Preserve all existing local `.env*`, `.dev.vars`, Git metadata, user data, and Cloudflare credentials outside the source snapshot.

## 3. Perform a deliberate file-level merge

The snapshot is cumulative source authority. Have Codex create a file-level diff between the snapshot and the local branch; apply source changes deliberately, preserving local secret/configuration files. Do **not** use a blind delete/mirror command. Resolve conflicts in favour of the snapshot only after checking the corresponding W250–W290 handover document.

Required review points:

- `package.json` and `package-lock.json` must remain paired.
- Keep `.github/workflows/preview.yml` Preview-only and `.github/workflows/deploy.yml` main-only.
- Preserve inactive referral/milestone state and all W260 guards.
- Preserve update-safe local data/backup code and Vault boundaries.
- Preserve the City rule: Chat/native surfaces control work; City is local, status-only visualization.

Before any commit:

```powershell
git diff --check
git status --short
```

## 4. Fresh local validation

```powershell
npm ci --include=dev --no-audit --no-fund
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run qa:current-static-certification:core
npm run qa:current-static-certification:tail
```

A timeout, missing report, failed gate, environment block, or warning is not a pass. Record it as `BLOCKED` with the exact command output path.

## 5. City and screenshot evidence preparation

```powershell
npm run qa:w259-city-preview-evidence
npm run qa:w266-visual-proof-lab
npm run qa:w266-visual-proof-lab:capture
npm run qa:w276-data-survival-reaudit
```

Use the `FINAL_HANDOVER/screenshots/CAPTURE_MANIFEST.csv` matrix for manual desktop/mobile/device capture. Local Chromium screenshots are not a substitute for physical-device evidence.

## 6. GitHub review branch only

```powershell
git add -A
git commit -m "feat: merge cumulative W250-W290 City and release hardening"
git push -u origin codex/w250-w290-final-merge-2026-06-25
```

Open a draft PR to `main`. Attach the local command receipts and redacted evidence index. Do not merge it yet.

## 7. Cloudflare Preview only

Run GitHub Actions **Preview to Cloudflare Pages** manually with:

- `ref`: the reviewed branch commit SHA
- `preview_branch`: `w250-w290-final-preview`

Use no direct `wrangler pages deploy` command and do not target `main`. After Preview is live, run the W282/W259/W266/W276 evidence protocol against the approved Preview URL.

## 8. Production merge/deploy gate

A production merge to `main` is allowed only when W282, W259/W266, W276, W283, W268, W278, W279, W270, W289, and W290 have independently documented `PASS` decisions. Until then return a redacted evidence package plus `BLOCKED` items to the product owner.


---

# W250–W290 completion and launch matrix

| Wave | Status in this source snapshot | Codex/local work | External or launch condition |
|---|---|---|---|
| W250 | Implemented: City prepared-action boundary | Re-run gate | Device proof still under W259/W266 |
| W251 | Implemented: City-to-workspace explicit gateway | Re-run gate | Verify user flows on real devices |
| W252 | Implemented: procedural/original City art provenance | Re-run gate | Visual review on device |
| W253 | Implemented: input/orientation/accessibility base | Re-run gate | Keyboard/touch/controller observation |
| W254 | Implemented: performance governor/fallback base | Re-run gate | Device performance evidence |
| W255 | Implemented: landmark parity registry | Re-run gate | Visual parity confirmation |
| W256 | Implemented: EONBOT proposals/Vault return boundaries | Re-run gate | Security review scope W279 |
| W257 | Implemented: beginner work missions | Re-run gate | Real interaction proof |
| W258 | BLOCKED: chain/mainnet identity lane | Do not implement runtime chain features | Independent evidence and legal/security approval first |
| W259 | Source evidence kit implemented | Run gate/capture tooling | Real desktop/mobile City proof required |
| W260 | NO-GO correctly preserved | Re-run board gate | Cannot be overridden by source tests |
| W261 | Not started by design | Do not implement until W258 evidence | Read-only trust proof only, later decision |
| W262 | Not started by design | Do not implement until W258 evidence | Provenance only after W261 decision |
| W263 | Implemented: finite EONBOT capability/receipt contract | Re-run gate | W279 independent review |
| W264 | Implemented: Creator/Build local handoff | Re-run gate | W276 restore/review evidence |
| W265 | Implemented: first-district decision | Re-run gate | Orientation Hall scope remains non-actionable |
| W266 | Source visual-proof lab implemented | Run capture tooling | Physical device/accessibility/performance proof required |
| W267 | Source red-team gate implemented | Re-run gate | Independent review pending |
| W268 | Operations runbook implemented | Assign named owners | Observe drills and record outcomes |
| W269 | BLOCKED controlled beta | Do not start | W284 plus W282/W259/W266/W276/W268/W278/W279/W270 must close |
| W270 | OPEN governance go/no-go | Prepare decision board | Cannot override unresolved external evidence |
| W271 | Source accessibility/i18n readiness implemented | Re-run gate | Human keyboard/screen-reader/locale evidence |
| W272 | Source CSP/supply-chain readiness implemented | Re-run gate | Preview/provider compatibility evidence |
| W273 | Source sensory accessibility implemented | Re-run gate | Physical device confirmation |
| W274 | Source scripted local City guide implemented | Re-run gate | User testing confirmation |
| W275 | Source PWA asset/update policy implemented | Re-run gate | Installed-PWA update evidence |
| W276 | Source data-survival re-audit implemented | Re-run gate | Observed disposable-profile restore proof |
| W277 | Source privacy/measurement boundary implemented | Re-run gate | Legal/privacy review |
| W278 | OPEN legal/compliance review | Assemble briefing | Qualified written advice required |
| W279 | OPEN independent security review | Provide source/version/scope | Independent report and retest required |
| W280 | Implemented: truthful support + local evidence pack | Re-run gate | W268 support triage drill required |
| W281 | Source provider lifecycle contract implemented | Re-run gate | Official/provider verification with no invented billing/account proof |
| W282 | Sandbox block classified correctly | Run in normal browser environment | Valid desktop/mobile raw Lighthouse reports required |
| W283 | Read-only Cloudflare/D1 packet implemented | Owner may run prompt later | No mutation, row reads, or deploy/rollback execution |
| W284 | Referral activation decision packet remains NO | Re-run gate | All listed approvals must be independently closed |
| W285 | Source device support guidance implemented | Re-run gate | Actual low/mid/high device confirmation |
| W286 | Implemented: Orientation Hall + B1 presence + B2 huddles + B3 outcome relay | Re-run gates | Device/visual/performance evidence required |
| W287 | Implemented: opt-in voice/language boundary | Re-run gate | Accessibility/privacy review |
| W288 | Implemented: review-only Creator handoff inspection | Re-run gate | Restore/security review |
| W289 | OPEN beta review | Fill evidence board only | Requires every predecessor PASS |
| W290 | OPEN final recertification | Fill final board only | Requires W289 and accountable owner sign-off |

## Product decisions retained

- City Lite is the accessible, low-device default.
- Three.js Visual Tour is an optional spatial overview.
- Babylon City Play is the flagship visual command district and showpiece, not a second automation engine.
- Chat/native pages remain the only real task creation, approval, data, and outcome-review surfaces.
- City status is local, finite, and privacy-safe: no fake busy agents, raw prompts/results, provider identities, secrets, Vault, wallet, referral, or payment data.
- EON Lite is only a future brand/architecture concept; it is not a coin, token, wallet, balance, transfer, payout, or reward system.


---

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


---

# Visual evidence index and screenshot capture manifest

## Truthful status

This final source package does **not** contain live browser/device screenshots. The managed environment could not produce valid browser navigation/Lighthouse traces, and manufacturing screenshots would be misleading. Existing source artwork remains in `assets/img/og/default.svg` and the PWA manifest; it is design artwork, not launch evidence.

## Existing capture tooling

- `npm run qa:w266-visual-proof-lab:capture` — local-only capture helper.
- `scripts/realm3d-screenshot-qa.mjs` — Three.js visual capture helper.
- `scripts/w249-babylon-play-proof-spike-gate.mjs` — Babylon source/proof guard.
- `scripts/w148-all-device-visual-proof-gate.mjs` — all-device visual guard.
- `docs/W282_W259_W266_W276_EXTERNAL_EVIDENCE_PROTOCOL_2026-06-25.md` — required real-device protocol.

## Required captured states

See `FINAL_HANDOVER/screenshots/CAPTURE_MANIFEST.csv`. Capture screenshots/video only after verifying no prompts, outputs, keys, provider account details, Vault content, wallet/referral/payment data, Cloudflare IDs, or personal data are visible.

## PWA artwork note

`manifest.webmanifest` currently references `assets/img/og/default.svg` for its declared desktop/mobile PWA artwork. It should not be represented as a physical-device screenshot.


---

## Cloudflare/D1 later-only instruction

Use `docs/CLOUDFLARE_AI_W283_READ_ONLY_EVIDENCE_PROMPT_2026-06-25.md` only after the product owner explicitly starts that task. It is read-only evidence collection, not configuration work.

---

## Codex copy/paste prompt

# Copy/paste prompt for Codex GPT-5.4

```text
You are merging the final cumulative EONAPP W250–W290 source snapshot into the private repository creditznft/EONAPP. Treat the extracted source snapshot as the cumulative implementation authority and preserve all source safety boundaries.

Start by reading FINAL_HANDOVER/CODEX_GPT54_MERGE_AND_PREVIEW_RUNBOOK.md, FINAL_HANDOVER/W250_W290_COMPLETION_AND_LAUNCH_MATRIX.md, FINAL_HANDOVER/EXTERNAL_EVIDENCE_AND_LAUNCH_BLOCKERS.md, and the current docs/W289_W290_FINAL_RECERTIFICATION_BOARD_2026-06-25.md.

Non-negotiable: W260 is NO-GO. Do not merge to main, deploy production, mutate Cloudflare, read/write D1 referral data, create/migrate D1 schema, bind Workers, activate referral/rewards, add wallet/chain/token/payment behavior, or claim beta/final certification. Preserve .env*, .dev.vars, .git, and all local user/configuration data.

Procedure:
1. Verify the delivered ZIP SHA-256 and run node FINAL_HANDOVER/verify-final-handover.mjs after extraction.
2. In the existing local clone: verify a clean worktree; fast-forward main; create branch codex/w250-w290-final-merge-2026-06-25.
3. Produce a file-level merge plan. Do not use blind delete/mirror operations. Merge the cumulative snapshot deliberately, keeping package.json/package-lock paired and resolving conflicts against the W250–W290 docs.
4. Run fresh npm ci --include=dev --no-audit --no-fund. Then run test:unit, lint --max-warnings=0, build, qa:current-static-certification:core, and qa:current-static-certification:tail.
5. Run the City source gates and prepare the visual/device capture matrix. Capture no real user data, secrets, prompts, outputs, provider accounts, Vault data, wallet data, referral records, or Cloudflare IDs.
6. Create a reviewable commit and push only the safety branch. Open a draft PR to main.
7. Only after the owner explicitly authorises Preview, run the existing GitHub Action “Preview to Cloudflare Pages” with the safety branch commit SHA and preview branch w250-w290-final-preview. Never use direct Wrangler deploy or main.
8. Coordinate only the permitted external evidence: normal-browser Lighthouse; real device/visual/accessibility proof; disposable-profile restore proof; owner-run read-only Cloudflare/D1 schema inventory; named operations drills; qualified legal review; independent security review.
9. Return a concise redacted report: commit SHA, lockfile SHA, commands and results, Preview URL if explicitly created, evidence file names, blockers, and a W289/W290 decision. Never include tokens, secrets, account IDs, D1 IDs, user rows, raw IPs, or unredacted Cloudflare output.

A missing Lighthouse report, NO_NAVSTART, chrome-error://chromewebdata, browser policy block, missing named owner, missing legal/security review, or incomplete device/restore evidence is BLOCKED—not PASS.
```
