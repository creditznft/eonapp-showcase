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
