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
